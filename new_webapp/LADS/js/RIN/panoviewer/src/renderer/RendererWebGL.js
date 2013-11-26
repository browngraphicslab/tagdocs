
function RendererWebGL(win, width, height) {
	RendererWebGL.__super.call(this, win);

	this._width = width;
	this._height = height;

	var canvas	= document.createElement('canvas');
	this._rootElement = canvas;
	this._rootElement.width = this._width;
	this._rootElement.height = this._height;
	this._textureCache = new MemoryCache(300);

	this._gl = RendererCheckWebGL.getWebGLContext(this._rootElement);
	if (! this._gl) {
		throw "WebGL is not supported.";
	} else if(quirks.isWebGLCORSRequired && !quirks.isWebGLCORSSupported) {
        throw 'CORS image textures are not supported in this browser';
    }

	function throwOnGLError(err, funcName, args) {
		throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" + funcName;
	};

	//if (WebGLDebugUtils)
	//	this._gl = WebGLDebugUtils.makeDebugContext(this._gl, throwOnGLError);

	var gl = this._gl;

	gl.viewportWidth = this._width;
	gl.viewportHeight = this._height;

	gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
	gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
	this._gl.clearDepth(1.0);
	gl.disable(gl.DEPTH_TEST);
	gl.disable(gl.CULL_FACE);
	//gl.frontFace(gl.CW);

	this._textureFilterTypeMap = [];
	this._textureFilterTypeMap[Texture.Filter.NEAREST] = gl.NEAREST;
	this._textureFilterTypeMap[Texture.Filter.LINEAR] = gl.LINEAR;
	this._textureFilterTypeMap[Texture.Filter.LINEAR_MIPMAP_LINEAR] = gl.LINEAR_MIPMAP_LINEAR;

	this._textureWrapTypeMap = [];
	this._textureWrapTypeMap[Texture.Wrap.CLAMP_TO_EDGE] = gl.CLAMP_TO_EDGE;
	this._textureWrapTypeMap[Texture.Wrap.REPEAT] = gl.REPEAT;

	// build lookup tables and textures for animation timing functions
	this._easingFunc = {};
	this._easingFuncTables = {};
	this._easingFuncTableSize = 64;
	var easingModes = ["ease", "linear", "ease-in", "ease-out", "ease-in-out"];
	var x1, y1, x2, y2;
	for (var mode=0; mode<easingModes.length; mode++) {
	switch (easingModes[mode]) {
		case "ease":
		x1 = 0.25; y1 = 0.10; x2 = 0.25; y2 = 1.00;
		break;
		case "linear":
		x1 = 0.00; y1 = 0.00; x2 = 1.00; y2 = 1.00;
		break;
		case "ease-in":
		x1 = 0.42; y1 = 0.00; x2 = 1.00; y2 = 1.00;
		break;
		case "ease-out":
		x1 = 0.00; y1 = 0.00; x2 = 0.58; y2 = 1.00;
		break;
		case "ease-in-out":
		x1 = 0.42; y1 = 0.00; x2 = 0.58; y2 = 1.00;
			break;
		}
		this._easingFunc[easingModes[mode]] = bezier(x1,y1,x2,y2);
		/*
		 * The following builds a texture lookup table for implementing timing functions
		 * on the GPU. However, access to textures from vertex shaders are not availalbe
		 * on webkit browsers currently (Sept. 2011)
		 */
		var table = new Float32Array(64);
		for (var i=0; i<this._easingFuncTableSize; i++)
			table[i] = this._easingFunc[easingModes[mode]](
					i/(this._easingFuncTableSize-1));
		this._easingFuncTables[easingModes[mode]] = table;

		/*
		this._easingFuncTextures[func] = gl.createTexture();
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this._easingFuncTextures[func];
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 64, 1, 0, gl.ALPHA, gl.FLOAT, table);
		*/
	}

	this.init();

    //We do this last incase any earlier issues throw.
    win.appendChild(this._rootElement);
}
extend(RendererWebGL, Renderer);

function createShader(gl, shaderType, shaderText) {

	var shader;
	shader = gl.createShader(shaderType);

	gl.shaderSource(shader, shaderText);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		error = gl.getShaderInfoLog(shader);
        Utils.log("Shader compiling error: " + error)
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

RendererWebGL.prototype.init = function() {
	var vsText = '\
				 uniform mat4 u_modelViewProjMat; \
				 uniform mat4 u_localMat; \
				 uniform float u_t, u_duration; \
				 /* the following can be optimized into one vec4 */ \
				 uniform vec2 u_opacityBE, u_xBE, u_yBE, u_rotateBE; \
				 uniform vec2 u_sxBE, u_syBE; \
				 uniform float u_texW, u_texH; \
				 attribute vec4 a_pos; \
				 attribute vec4 a_texCoord; \
				 varying vec2 v_texCoord; \
				 varying float v_opacity; \
				 mat4 ident = mat4( \
					1,0,0,0, \
					0,1,0,0, \
					0,0,1,0, \
					0,0,0,1 \
				 ); \
				 void main() \
				 { \
					float opacity, x, y, rotate; \
					mat4 finalMat; \
					float a; \
					if (u_t >= 0.0 && u_t <= 1.0/*u_duration*/) { \
						a = u_t;/* /u_duration;*/ \
						opacity = mix(u_opacityBE[0], u_opacityBE[1], a); \
						float x = mix(u_xBE[0], u_xBE[1], a); \
						float y = mix(u_yBE[0], u_yBE[1], a); \
						float sx = mix(u_sxBE[0], u_sxBE[1], a); \
						float sy = mix(u_syBE[0], u_syBE[1], a); \
						float rotate = mix(u_rotateBE[0], u_rotateBE[1], a); \
						mat4 rotM = ident; \
						float radianRot = radians(rotate); \
						float s = sin(radianRot), c = cos(radianRot); \
						rotM[0][0] = c * sx; rotM[0][1] = s * sy; \
						rotM[1][0] = -s * sx; rotM[1][1] = c * sy; \
						mat4 preT = ident; \
						preT[3][0] = -u_texW * 0.5; \
						preT[3][1] = -u_texH * 0.5; \
						mat4 postT = ident; \
						postT[3][0] = -preT[3][0]; \
						postT[3][1] = -preT[3][1]; \
						mat4 transM = ident; \
						transM[3][0] = x; transM[3][1] = y; \
						finalMat = u_modelViewProjMat * transM * postT * rotM * preT; \
					} else { \
						finalMat = u_modelViewProjMat; \
						opacity = u_opacityBE[0]; \
					} \
					vec4 pos = finalMat * a_pos; \
					v_texCoord = a_texCoord.xy; \
					v_opacity = opacity; \
					gl_Position = pos; \
				 }';

	var psText = '\
precision mediump float; \n\
#define KERNEL_SIZE 9 \n\
uniform sampler2D u_diffuseTex; \n\
uniform vec4 u_colorMult; \n\
uniform vec2 u_kernelOffsets[9]; \n\
uniform float u_kernel[9]; \n\
varying float v_opacity; \n\
varying vec2 v_texCoord; \n\
void main() { \n\
	vec2 texCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y); \n\
	/*vec4 color = texture2D(u_diffuseTex, texCoord); */\n\
	vec4 color = vec4(0); \n\
	for(int i=0; i<9; i++ ) { \n\
		vec4 tmp = texture2D(u_diffuseTex, texCoord.st + u_kernelOffsets[i]); \n\
		color += tmp * u_kernel[i]; \n\
	} \n\
	gl_FragColor = color * vec4(1,1,1,v_opacity); \n\
}';

	var gl = this._gl;

	this._vs = createShader(gl, gl.VERTEX_SHADER, vsText);
	this._ps = createShader(gl, gl.FRAGMENT_SHADER, psText);
	if (this._vs == null || this._ps == null)
		throw "Failure initializing webgl: shader";

	this._shaderProgram = gl.createProgram();
	gl.attachShader(this._shaderProgram, this._vs);
	gl.attachShader(this._shaderProgram, this._ps);
	gl.linkProgram(this._shaderProgram);

	if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
		gl.deleteProgram(this._shaderProgram);
		gl.deleteShader(this._vs);
		gl.deleteShader(this._ps);
		return null;
	}

	var numAttribs = gl.getProgramParameter(this._shaderProgram, gl.ACTIVE_ATTRIBUTES);
	this._attribs = new Array(numAttribs);
	this._attribLocations = {};
	for (var i=0; i<numAttribs; i++) {
		var activeattrib = gl.getActiveAttrib(this._shaderProgram, i);
		this._attribs[i] = activeattrib;
		this._attribLocations[activeattrib.name] =
			gl.getAttribLocation(this._shaderProgram, activeattrib.name);
	}
	var numUniforms = gl.getProgramParameter(this._shaderProgram, gl.ACTIVE_UNIFORMS);
	this._uniforms = new Array(numUniforms);
	this._uniformLocations = {};
	for (var j=0; j<numUniforms; j++) {
		var activeuniform = gl.getActiveUniform(this._shaderProgram, j);
		this._uniforms[j] = activeuniform;
		this._uniformLocations[activeuniform.name] = gl.getUniformLocation(
				this._shaderProgram, activeuniform.name);
	}
}


RendererWebGL.prototype.isPowerOfTwo = function(x) {
	return (x & (x - 1)) == 0;
}

RendererWebGL.prototype.nextHighestPowerOfTwo = function(x) {
	--x;
	for (var i = 1; i < 32; i <<= 1) {
		x = x | x >> i;
	}
	return x + 1;
}

RendererWebGL.prototype.setViewportSize = function (width, height) {
	this._width = width;
	this._height = height;
	this._rootElement.width = this._width;
	this._rootElement.height = this._height;

    this._gl.viewportWidth = this._width;
	this._gl.viewportHeight = this._height;
	this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
};

var prevOrderedRenderables;

RendererWebGL.prototype.render = function () {
	var imageElement, material, texture;
	var gl = this._gl;
	var glIdentityMat = Matrix4x4.createIdentity().flattenColumnMajor();
	var self = this;

    // Clean up WebGL resources associated with removed renderables.
	// Have to do this because of web browsers hold a reference to
	// such resources (through a hash table). Therefore, if not
	// deliberately deleted, textures and such will exist forever.
	// This is sad, and against everything else in JavaScript, but true.
	// http://www.khronos.org/webgl/public-mailing-list/archives/1106/msg00105.html
	//
    for(var id in this._removedRenderables) {
		var r = this._removedRenderables[id];
		if (r._geometry.__gl_posBuffer)
			gl.deleteBuffer(r._geometry.__gl_posBuffer);

		if (r._geometry.__gl_indexBuffer)
			gl.deleteBuffer(r._geometry.__gl_indexBuffer);

		if (r._material._texture.__gl_texture)
			gl.deleteTexture(r._material._texture.__gl_texture);

		if (r._geometry.__gl_texCoordBuffer)
			gl.deleteBuffer(r._geometry.__gl_texCoordBuffer);
    }
    this._removedRenderables = {};

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// set shader
	gl.useProgram(this._shaderProgram);

	/* Gaussian kernel
	   1 2 1
	   2 4 2
	   1 2 1
	   var _kernel = [1.0/16.0, 2.0/16.0, 1.0/16.0,
	   2.0/16.0, 4.0/16.0, 2.0/16.0,
	   1.0/16.0, 2.0/16.0, 1.0/16.0];
	   */
	/* Laplacian kernel (sharpen)
	   -1 -1 -1
	   -1  8 -1
	   -1 -1 -1

	var NORMFACTOR = 8;
	var _kernel = [-1/NORMFACTOR,-1/NORMFACTOR,-1/NORMFACTOR,
		-1/NORMFACTOR,17/NORMFACTOR,-1/NORMFACTOR,
		-1/NORMFACTOR,-1/NORMFACTOR,-1/NORMFACTOR];
	*/

	/* don't run a filter. */
	var _kernel = [0, 0, 0,
			   0, 1, 0,
			   0, 0, 0];
	var kernel = new Float32Array(_kernel);

	// sort by Renderable._order
	var orderedRenderables = [];
	for (var renderableId in this._renderables) {
		orderedRenderables.push(this._renderables[renderableId]);
	}
	orderedRenderables.sort( function(a, b) {
		if (a._order && b._order)
			return a._order - b._order;
		else if (! a._order && ! b._order)
			return 0;
		else if (! a._order)
			return -1;
		else
			return 1;
	});

	if (prevOrderedRenderables) {
		if (prevOrderedRenderables.length != orderedRenderables.length) {
			//Utils.log("*****prev=" + prevOrderedRenderables.length + "; current="+orderedRenderables.length+"****");
			for (var i=0; i<prevOrderedRenderables.length; i++) {
				var j;
				for (j=0; j<orderedRenderables.length; j++) {
					if (prevOrderedRenderables[i].entityId == orderedRenderables[j].entityId)
						break;
				}
				//if (j == orderedRenderables.length)
				//	Utils.log("render removed: "+prevOrderedRenderables[i].entityId);
			}
			for (var i=0; i<orderedRenderables.length; i++) {
				var j;
				for (j=0; j<prevOrderedRenderables.length; j++) {
					if (orderedRenderables[i].entityId == prevOrderedRenderables[j].entityId)
						break;
				}
				//if (j == prevOrderedRenderables.length)
				//	Utils.log("render added: "+orderedRenderables[i].entityId);
			}
		} else
			for (var i=0; i<orderedRenderables.length; i++) {
				//if (!prevOrderedRenderables[i] || orderedRenderables[i].entityId != prevOrderedRenderables[i].entityId)
				//	Utils.log("!!! diff: cur=" + orderedRenderables[i].entityId + " prev=" + prevOrderedRenderables[i].entityId);
			}
	}
	prevOrderedRenderables = orderedRenderables;

	for (var pass = 0; pass < 2; pass++) {
		if (pass == 1) {
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		} else
			gl.disable(gl.BLEND);

		//for (var renderableId in this._renderables) {
		for (var i=0; i<orderedRenderables.length; i++) {
			//var renderable = this._renderables[renderableId];
			var renderable = orderedRenderables[i];
			imageElement = null;
			texture = null;
			if (renderable._material &&
					renderable._material._texture &&
					renderable._material._texture) {
				material = renderable._material;
				texture = renderable._material._texture;
				if (texture._isReady)
					imageElement = renderable._material._texture._image;
			}
			if (imageElement == null || renderable._geometry == null)
				continue;

			// render opaque in pass 0, transparent in pass 1; assume transparent if there
			// is an animation on opacity. Because animation is done in shader, here we
			// don't know what the current opacity value is
			var isOpaque = true;
			if (material._animation && !material._animation._ended) {
				var opq = material._animation.opacity;
				if ((opq.begin!=1 || opq.end!=1))
					isOpaque = false;
			} else if (material._animatableStates) {
				if (material._animatableStates.opacity < 1)
					isOpaque = false;
			}

			if (pass==0 && !isOpaque)
				continue;
			if (pass==1 && isOpaque)
				continue;

			if (renderable._geometry._isDirty) {
				if (renderable._geometry.__gl_posBuffer)
					gl.deleteBuffer(renderable._geometry.__gl_posBuffer);
				renderable._geometry.__gl_posBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, renderable._geometry.__gl_posBuffer);
				gl.bufferData(gl.ARRAY_BUFFER,
						new Float32Array(renderable._geometry._vertices),
						gl.STATIC_DRAW);

				if (renderable._geometry.__gl_texCoordBuffer)
					gl.deleteBuffer(renderable._geometry.__gl_texCoordBuffer);
				renderable._geometry.__gl_texCoordBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, renderable._geometry.__gl_texCoordBuffer);
				gl.bufferData(gl.ARRAY_BUFFER,
						new Float32Array(renderable._geometry._texCoords),
						gl.STATIC_DRAW);

				if (renderable._geometry._indices) {
					if (renderable._geometry.__gl_indexBuffer)
						gl.deleteBuffer(renderable._geometry.__gl_indexBuffer);
					renderable._geometry.__gl_indexBuffer = gl.createBuffer();
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
							renderable._geometry.__gl_indexBuffer);
					gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
							new Uint16Array(renderable._geometry._indices),
							gl.STATIC_DRAW);
				}

				renderable._geometry._isDirty = false;
			}

			if (renderable._material._texture._isDirty) {
				if (renderable._material._texture.__gl_texture)
					gl.deleteTexture(renderable._material._texture.__gl_texture);
				renderable._material._texture.__gl_texture = gl.createTexture();
				// At this point we're sure the image is ready because of
				// the preceding logic
				gl.bindTexture(gl.TEXTURE_2D, renderable._material._texture.__gl_texture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
						this._textureFilterTypeMap[renderable._material._texture._magFilter]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
						this._textureFilterTypeMap[renderable._material._texture._minFilter]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
						this._textureWrapTypeMap[renderable._material._texture._wrapS]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
						this._textureWrapTypeMap[renderable._material._texture._wrapT]);

				try {
					if (!this.isPowerOfTwo(imageElement.width) || !this.isPowerOfTwo(imageElement.height)) {
						var canvas = this._textureCache.get(renderable.entityId);
                        
                        if (canvas == null) {
                            canvas = document.createElement("canvas");
						    canvas.width = this.nextHighestPowerOfTwo(imageElement.width);
						    canvas.height = this.nextHighestPowerOfTwo(imageElement.height);
						    var ctx = canvas.getContext("2d");
						    ctx.drawImage(imageElement,
								    0, 0, imageElement.width, imageElement.height,
								    0, 0, canvas.width, canvas.height);

                            this._textureCache.insert(renderable.entityId, canvas);
						}
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
					}
                    else {
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);
					}
				} catch (e) {
					//If the correct headers aren't set on the image tiles, the gl.texImage2D() call will throw a security exception.
					//Don't bother trying to draw this tile, but still attempt to draw the rest if possible.
					continue;
				}

				gl.generateMipmap(gl.TEXTURE_2D);
				renderable._material._texture._isDirty = false;
			}

			// set matrix
			var finalMat = this._viewProjMatrix.multiply(renderable._transform);
			var glFinalMat = new Float32Array(finalMat.flattenColumnMajor());
			gl.uniformMatrix4fv(this._uniformLocations["u_modelViewProjMat"], false, glFinalMat);

			var stepW = 1.0 / imageElement.width;
			var stepH = 1.0 / imageElement.height;
			var _offsets =[-stepW, -stepH,  0.0, -stepH,  stepW, -stepH,
					-stepW, 0.0,  0.0, 0.0,  stepW, 0.0,
					-stepW, stepH,  0.0, stepH,  stepW, stepH];
			var offsets = new Float32Array(_offsets);

			gl.uniform2fv(this._uniformLocations["u_kernelOffsets[0]"], offsets);
			gl.uniform1fv(this._uniformLocations["u_kernel[0]"], kernel);
			if (material._animation && !material._animation._ended) {
				// set animation parameters
				var anim = material._animation;
				gl.uniform2f(this._uniformLocations["u_opacityBE"],
						anim["opacity"].begin, anim["opacity"].end);
				gl.uniform2f(this._uniformLocations["u_xBE"],
						anim["x"].begin, anim["x"].end);
				gl.uniform2f(this._uniformLocations["u_yBE"],
						anim["y"].begin, anim["y"].end);

				gl.uniform2f(this._uniformLocations["u_sxBE"],
						anim["sx"].begin, anim["sx"].end);
				gl.uniform2f(this._uniformLocations["u_syBE"],
						anim["sy"].begin, anim["sy"].end);

				gl.uniform2f(this._uniformLocations["u_rotateBE"],
						anim["rotate"].begin, anim["rotate"].end);
				gl.uniform1f(this._uniformLocations["u_texW"], imageElement.width);
				gl.uniform1f(this._uniformLocations["u_texH"], imageElement.height);
				var d = new Date;
				if (anim._startT == -1)
					anim._startT = d.getTime();
				var t = d.getTime() - anim._startT;
				if (t >= anim._duration) {
					t = anim._duration;
					// animation ended, save end state and kill animation
					material._animatableStates = anim.getEndStates();
					if (anim._endCallback) {
						anim._endCallback(material, anim._endCallbackInfo);
					}
					material._animation._ended = true; // animation ended
				}
				if (! this._easingFunc[anim._easingMode])
					throw "Invalid easing mode: "+anim._easingMode;
				//var t_ease = this._easingFunc[anim._easingMode](t / anim._duration);
				var mapT = function(table, t) {
					var tt = t * (self._easingFuncTableSize-1);
					var t0 = Math.floor(tt),
						t1 = t0>=self._easingFuncTableSize-1 ? t0 : t0+1,
						alpha = tt-t0;
					return (1-alpha)*table[t0] + alpha*table[t1];
				}
				var t_ease = mapT(this._easingFuncTables[anim._easingMode], t/anim._duration);
				gl.uniform1f(this._uniformLocations["u_t"], t_ease);

				// when we do timing mapping i.e. easing as above, we
				// already computed the normalized t, so we no longer
				// need to send duration to shader
				//gl.uniform1f(this._uniformLocations["u_duration"], anim._duration);

				/* The following is for defining timing mapping table
				if (! this._easingTex[anim._easingMode])
					throw "Invalid easing mode: "+anim._easingMode;
				gl.uniform1i(this._uniformLocations["u_easingTex"], 1);
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this._easingTex[anim._easingMode]);
				*/
			} else if (material._animatableStates) {
				var as = material._animatableStates;
				gl.uniform2f(this._uniformLocations["u_opacityBE"], as["opacity"], as["opacity"]);
				gl.uniform2f(this._uniformLocations["u_xBE"], as["x"], as["x"]);
				gl.uniform2f(this._uniformLocations["u_yBE"], as["y"], as["y"]);
				gl.uniform2f(this._uniformLocations["u_sxBE"], as["sx"], as["sx"]);
				gl.uniform2f(this._uniformLocations["u_syBE"], as["sy"], as["sy"]);
				gl.uniform2f(this._uniformLocations["u_rotateBE"], as["rotate"], as["rotate"]);
				gl.uniform1f(this._uniformLocations["u_texW"], imageElement.width);
				gl.uniform1f(this._uniformLocations["u_texH"], imageElement.height);
				gl.uniform1f(this._uniformLocations["u_t"], 1);
				//gl.uniform1f(this._uniformLocations["u_duration"], 1);
			} else { // .animate has never been called on this material
				var as = material._animatableStates || {opacity:1.0};
				var o = as["opacity"];
				gl.uniform2f(this._uniformLocations["u_opacityBE"], o, o);
				gl.uniform1f(this._uniformLocations["u_t"], -1);
			}

			gl.enableVertexAttribArray(this._attribLocations["a_pos"]);
			gl.enableVertexAttribArray(this._attribLocations["a_texCoord"]);

			// set position source
			gl.bindBuffer(gl.ARRAY_BUFFER, renderable._geometry.__gl_posBuffer);
			gl.vertexAttribPointer(this._attribLocations["a_pos"], 3, gl.FLOAT, false, 0, 0);

			// set texture coords source
			gl.bindBuffer(gl.ARRAY_BUFFER, renderable._geometry.__gl_texCoordBuffer);
			gl.vertexAttribPointer(this._attribLocations["a_texCoord"],
					renderable._geometry._texCoordSize, gl.FLOAT, false, 0, 0);

			if (renderable._geometry._indices)
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderable._geometry.__gl_indexBuffer);

			// set texture
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, renderable._material._texture.__gl_texture);
			gl.uniform1i(this._uniformLocations["u_diffuseTex"], 0);

			gl.drawElements(gl.TRIANGLES, renderable._geometry._indices.length, gl.UNSIGNED_SHORT, 0);
		}
	} // pass
};

var reqAnimStep = (function(){
	return  window.requestAnimationFrame       ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	window.oRequestAnimationFrame      ||
	window.msRequestAnimationFrame     ||
	function(callback, element){
		window.setTimeout(callback, 1000 / 60);
	};
})();

function requestAnimation(duration, callback, element) {
	var startTime;
	if(window.mozAnimationStartTime) {
		startTime = window.mozAnimationStartTime;
	} else if (window.webkitAnimationStartTime) {
		startTime = window.webkitAnimationStartTime;
	} else {
		startTime = new Date().getTime();
	}

	var lastTimestamp = startTime;

	function timerProc(timestamp){
		if(!timestamp) {
			timestamp = new Date().getTime();
		}

		if(callback({
			startTime: startTime,
			curTime: timestamp,
			duration: duration
		}) !== false) {
			//reqAnimStep(timerProc, element);
			window.setTimeout(timerProc, 1000.0/60);
		}
	};

	timerProc(startTime);
};


/**
 * Enqueues an animation for execution. Try to use CSS style property names when possible.
 * implementations should ignore properties they don't know how to animate to allow more
 * advanced renderers to enhance the expierence when possible.
 *
 * @param {Material} material           The material we'll be animating.
 * @param {Object}   startProperties    The property names (e.g.,
 *                                      'opacity','width','height') and values at the start. If this is null we
 *                                      Animate from current property state.
 * @param {Object}   endProperties      The property names (e.g.,
 *                                      'opacity','width','height') and values
 *                                      at the end of the animation.
 * @param {Number}   duration           The duration in ms.
 * @param {string?}  easing             The animation ease function, (e.g. 'linear', 'ease-in-out')
 */
RendererWebGL.prototype.animate1 = function(material,
		startProperties,
		endProperties,
		duration,
		easing) {

	function step(params) {
		x = (params.curTime - params.startTime)/params.duration;
		x = x > 1 ? 1 : (x<0 ? 0 : x);
		// we'll worry about better interpolation + easing later
		material._opacity =
			startProperties.opacity*(1-x) +
			endProperties.opacity*x;
		if (x >= 1)
			return false;
		else
			return true;
	}

	if(material && material._texture && material._texture._image) {
		material._opacity = startProperties.opacity;
		requestAnimation(duration, step, material._texture._image);
	}
};

RendererWebGL.prototype.animate = function(renderable,
		startProperties,
		endProperties,
		duration,
		easing,
		endCallback,
		endCallbackInfo) {
	if (renderable &&
		renderable._material &&
		renderable._material._texture &&
		renderable._material._texture._image) {
		var material = renderable._material;
		/*
		function step(now, fx) {
			Utils.log(fx.prop+" now:"+now+" pos:"+fx.pos);
			switch(fx.prop) {
				case "opacity": material._opacity = now; break;
				case "x": material._xoffset = now; break;
				case "y": material._yoffset = now; break;
				case "rotate": material._rotate = now; break;
			}
		}

		material._opacity = startProperties.opacity;
        if(startProperties) {
            $(material._texture._image).css(startProperties);
        }
		jQuery.fx.interval = 16;
        $(material._texture._image).animate(endProperties,
				{ duration : duration, step : step }, easing);
		*/
		var anim = material._animation = new Animation;
		if (material._animatableStates)
			anim.initStates(material._animatableStates);
		else
			material._animatableStates = anim.getEndStates();
		for (var prop in startProperties) {
			if (startProperties.hasOwnProperty(prop)) {
				if (prop in anim) {
					anim[prop].begin = startProperties[prop];
				}
			}
		}
		for (var prop in endProperties) {
			if (endProperties.hasOwnProperty(prop)) {
				if (prop in anim) {
					anim[prop].end = endProperties[prop];
				}
			}
		}
		// The timer for animation only starts after the
		// renderable is ready. If animate() is called on a
		// renderable that is not ready, it's animation's
		// _startT is set to -1.
		var d = new Date;
		if (material._texture._isReady)
			anim._startT = d.getTime();
		else
			anim._startT = -1;
		anim._duration = duration;
		anim._easingMode = easing;

		if (endCallback) anim._endCallback = endCallback;
		if (endCallbackInfo) anim._endCallbackInfo = endCallbackInfo;
	}
};


RendererWebGL.prototype.CSSMatrixToMatrix4x4 = function(cssMat, image) {
	var m = new Matrix4x4(
		cssMat.m11, cssMat.m12, cssMat.m13, cssMat.m14,
		cssMat.m21, cssMat.m22, cssMat.m23, cssMat.m24,
		cssMat.m31, cssMat.m32, cssMat.m33, cssMat.m34,
		cssMat.m41, cssMat.m42, cssMat.m43, cssMat.m44);

    var invertY_inv = Matrix4x4.createScale(1, -1, 1);
    var t_inv = Matrix4x4.createTranslation(0, image.height, 0);
    var preTransform_inv = t_inv.multiply(invertY_inv);
    var postTransform_inv = invertY_inv;
    var m4x4 = postTransform_inv.multiply(m.transpose()).multiply(preTransform_inv);
	return m4x4;
}

RendererWebGL.prototype.setClearColor = function(color) {
    //Does some validation of input and throws if there is an issue.
    this._checkClearColor(color);

    this._clearColor = color;
    this._gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
};

function bezier(x1, y1, x2, y2) {
    // Cubic bezier with control points (0, 0), (x1, y1), (x2, y2), and (1, 1).
    function x_for_t(t) {
        var omt = 1-t;
        return 3 * omt * omt * t * x1 + 3 * omt * t * t * x2 + t * t * t;
    }
    function y_for_t(t) {
        var omt = 1-t;
        return 3 * omt * omt * t * y1 + 3 * omt * t * t * y2 + t * t * t;
    }
    function t_for_x(x) {
        // Binary subdivision.
        var mint = 0, maxt = 1;
        for (var i = 0; i < 30; ++i) {
            var guesst = (mint + maxt) / 2;
            var guessx = x_for_t(guesst);
            if (x < guessx)
                maxt = guesst;
            else
                mint = guesst;
        }
        return (mint + maxt) / 2;
    }
    return function bezier_closure(x) {
        if (x == 0) return 0;
        if (x == 1) return 1;
        return y_for_t(t_for_x(x));
    }
}
