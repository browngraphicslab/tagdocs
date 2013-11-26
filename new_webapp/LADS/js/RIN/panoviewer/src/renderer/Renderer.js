function extend(subclass, base) {
    function f() {
    }
    f.prototype = base.prototype;
    subclass.prototype = new f();
    subclass.prototype.constructor = subclass;
    subclass.__super = base;
};

function Geometry(params) {
	Geometry.__super.call(this);

	this._isDirty = true;

	this._vertices = params.vertices || [];
	this._vertexSize = params.vertexSize || 0;
	this._texCoords = params.texCoords || [];
	this._texCoordSize = params.texCoordSize || 0;
	this._indices = params.indices || [];
	this._primitiveType = params.primType || "invalid";
	this._primitiveLength = params.primLength || 0;
}

Geometry.QUADS = 1;
Geometry.TRIANGLES = 2;

extend(Geometry, Object);

function Texture(url, loadCallback, loadCallbackInfo, wrapS, wrapT, minFilter, magFilter, offsetX, offsetY, width, height) {
    Texture.__super.call(this);

    this._url = url;
    this._loadCallback = loadCallback;
    this._loadCallbackInfo = loadCallbackInfo;
    this._image = null;

    this._offsetX = offsetX;
    this._offsetY = offsetY;
    this._width = width;
    this._height = height;

    this._wrapS = wrapS != null ? wrapS : Texture.Wrap.CLAMP_TO_EDGE;
    this._wrapT = wrapT != null ? wrapT : Texture.Wrap.CLAMP_TO_EDGE;

    this._minFilter = minFilter != null ? minFilter : Texture.Filter.LINEAR_MIPMAP_LINEAR;
    this._magFilter = magFilter != null ? magFilter : Texture.Filter.LINEAR;
    
    this._isReady = false;
    this._isDirty = false;
}

Texture.Wrap = {
	CLAMP_TO_EDGE : 1,
	REPEAT: 2
}

Texture.Filter = {
	NEAREST: 0,
	LINEAR: 1,
	LINEAR_MIPMAP_LINEAR: 2
}

extend(Texture, Object);

Texture.prototype.loadImageInDOM = function() {
    this._image = new Image();
    var tex = this;
    this._image.onload = function () {
       if (tex._loadCallback) {
           tex._loadCallback(tex._url, tex._loadCallbackInfo, tex);
       }
       tex._isReady = true;
       tex._isDirty = true;
    };

    this._image.crossOrigin = ''; //Required for webgl textures.  Must be set before setting the src property.
    this._image.src = this._url;
};

function AnimationBeginEndValues(begin, end) {
	this.begin = begin;
	this.end = end;
	AnimationBeginEndValues.__super.call(this);
}
extend(AnimationBeginEndValues, Object);

function Animation() {
	Animation.__super.call(this);

	this.opacity = new AnimationBeginEndValues(1,1);
	this.x = new AnimationBeginEndValues(0,0);
	this.y = new AnimationBeginEndValues(0,0);
	this.sx = new AnimationBeginEndValues(1,1);
	this.sy = new AnimationBeginEndValues(1,1);
	this.rotate = new AnimationBeginEndValues(0,0);
	this._duration = 0;
	this._startT = 0;
	this._easingMode = "linear";

	this._ended = false;
	this._endCallbackInfo = null;
	this._endCallback = null;
}
extend(Animation, Object);
Animation.prototype.initStates = function(params) {
	for (var prop in params) {
		this[prop]  = [params[prop], params[prop]];
	}
}

Animation.prototype.getEndStates = function() {
	var ret={};
	for (var prop in this) {
		if (this[prop] instanceof AnimationBeginEndValues)
			ret[prop]  = this[prop].end;
	}
	return ret;
}

function Material() {
	Material.__super.call(this);
	Material._animation = null;
	Material._animationEndStates = null;
}

extend(Material, Object);

Material.prototype.apply = function(context) {
	throw "You should not have reached base Material.apply().";
}

function SingleTextureMaterial(tex) {
	this._texture = tex;
	SingleTextureMaterial.__super.call(this);
}
extend(SingleTextureMaterial, Material);

function Transform() {
	this._rotX = this._rotY = this._rotZ = 0;
	this._translateX = this._translateY = this._translateZ = 0;
	this._scaleX = this._scaleY = this._scaleZ = 0;
	Transform.__super.call(this);
}
extend(Transform, Matrix4x4);

Transform.prototype.apply = function(context) {
	throw "You should not have reached base Transform.apply().";
}

/**
 * Renderable binds geometry (often quads or triangles), materials (textures or shaders), and
 * transforms (typically rotation,scale,translations.).
 */
function Renderable(params) {
	this._geometry = params.geometry || null;
	this._material = params.material || null;
	this._transform = params.transform || null;
}
extend(Renderable, Object);

var uniqueId = (function() {
                    var count = (new Date()).getTime();
                    return function () {
                        ++count;
                        return count;
                    };})();


function Renderer (win) {
	Renderer.__super.constructor.call(this);

	this._name = 'BaseRenderer';

	this._renderables = {};
    this._removedRenderables = {};
	this._nodes = {};
	this._window = win;
	this._rootElement = null;
	this._viewProjMatrix = Matrix4x4.createIdentity();
    this._clearColor = {r:0.0, g:0.0, b:0.0, a:1.0};
}

extend(Renderer, Object);

/**
 * Draws any renderables added to the scene. This should be invoked once per frame.
 * Platforms provide specific implementations.
 */
Renderer.prototype.render = function() {
    throw 'The renderer you are using does not implement the render() method.';
    /* Usual rendering logic:
    for (renderable in _renderables) {
        apply transform;
        apply material;
        draw geometry;
    }
    */
};

/**
 * This adds a renderable to the scene.
 * TODO Do we need this id array, would draw order flag be sufficient?
 */
Renderer.prototype.addRenderable = function(renderableArray, idArray) {
    var i, uid, ids = [];
    for (i = 0; i < renderableArray.length; ++i) {
        uid = (idArray != undefined && idArray[i] != undefined) ?
            idArray[i] : uniqueId();
        if(!renderableArray[i]) {
            throw  'Expected valid renderable';
        }
        this._renderables[uid] = renderableArray[i];
        ids.push(uid);
    }
    return ids;
};

/**
 * A helper that can be used by implementations of setClearColor.
 * @ignore
 */
Renderer.prototype._checkClearColor = function(color) {
    if(!color || color.r == null || color.g == null || color.b == null || color.a == null) {
        throw 'Color must include r,g,b,a numeric properties.';
    }
};

/**
 * Set the color to use for the initial frame buffer pixels (clearColor in GL parlance.)
 * @param {{r:{number}, g:{number}, b:{number},a:{number}} color  The RGBA
 * components of the color between (each component should be between 0.0-1.0).
 */
Renderer.prototype.setClearColor = function(color) {
    throw 'setClearColor is not implemented';
};


/**
 * @ignore
 *  Used for internal debugging of Renderer implementations.
 */
Renderer.prototype._error = function(msg) {
    if(Config.debug) {
        throw new Error(msg);
        debugger;
    }
};

/**
 * This removes a node or renderable from the scene.
 */
Renderer.prototype.remove = function(idArray) {
    var i, id;
    for(i = 0; i < idArray.length; ++i) {
        id = idArray[i];
        if (this._renderables[id] != undefined) {
		this._removedRenderables[id] = this._renderables[id];
            delete this._renderables[id];
        } else if (this._nodes[id] != undefined) {
            delete this._nodes[id];
        } else {
            this._error('Object ' + id + ' not found.');
        }
    }
};

/**
 * Enqueues an animation for execution. Try to use CSS style property names when possible.
 * implementations should ignore properties they don't know how to animate to allow more
 * advanced renderers to enhance the expierence when possible.
 *
 * @param {Material} renderable         The renderable whose properties/assets we'll be animating.
 * @param {Object}   startProperties    The property names (e.g.,
 *                                      'opacity','width','height') and values at the start. If this is null we
 *                                      Animate from current property state.
 * @param {Object}   endProperties      The property names (e.g.,
 *                                      'opacity','width','height') and values
 *                                      at the end of the animation.
 * @param {Number}   duration           The duration in ms.
 * @param {string?}  easing             The animation ease function, (e.g. 'linear', 'ease-in-out')
 */
Renderer.prototype.animate = function(renderable,
                      startProperties,
                      endProperties,
                      duration,
                      easing,
					  completeCallback,
					  completeCallbackInfo) {
        throw 'The renderer does not implement animate function';
        //Implications.
        //   (a) materials are exposed
        //        - works fine for JS , how about for SL?
        //   (b) property/values must make sense for materials (coupling.)
        //   should this be on the renderable instead?
};

/**
 * Sets the view projection matrix of the scene .
 */
Renderer.prototype.setViewProjectionMatrix = function(mat) {
	    this._viewProjMatrix = mat;
};
