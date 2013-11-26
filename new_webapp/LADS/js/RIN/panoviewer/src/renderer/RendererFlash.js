function RendererFlash(win, width, height) {
	RendererFlash.__super.call(this, win);

	this._width = width;
	this._height = height;

	var flashvars = {};
	var params = {
		movie : "FlashRenderer.swf",
		quality : "high",
		bgcolor : "#ffffff",
		play : "true",
		loop : "true",
		wmode : "transparent",
		scale : "showall",
		menu : "true",
		devicefont : "false",
		salign : "",
		allowScriptAccess: "always"
	};

	var attributes = {
		id: "flashRenderer2",
		name: "flashRenderer2"
	};

	var div = document.createElement('div');
	div.id = 'flashRenderer';
	$(div).appendTo(document.getElementById('hiddenDiv'));
	var swfobj = window.swfobject || null;
	swfobj.embedSWF("main.swf",
		"flashRenderer", width, height,
		"9.0.0","expressInstall.swf",
		flashvars, params, attributes, function(e) {
			if(!e.success)
				Utils.log('Error init Flash: ' + e);
		}
	);

	var id = "flashRenderer2";
    //We leave original in the DOM hidden, and create a new one by "Cloning" object node.
    this._flash = document.getElementById(id); //This is the DOM element that is our control. A Object tag in our case. TODO FLASH PORT, this really should be created by us, not ripped out of HTML.
    this._flash.hasInitialized = false;
    $(this._flash).remove();

	win.appendChild(this._flash);

    this._flash.width = this._width;
    this._flash.height = this._height;
}

extend(RendererFlash, Renderer);

RendererFlash.prototype.render = function () {
	var self = this;

	if (! this._flash.hasInitialized)
		return;

	this._flash.setRenderingOptions(
			{
				antialias: true,
				backface_culling: true,
				sort_by_order: true
			});

    //Remove any out standing renderables....
    for(id in this._removedRenderables) {
		var r = this._removedRenderables[id];
		if (r._flashObjId) {
			try {
				this._flash.deleteRenderable(r._flashObjId);
			} catch (err) {
				Utils.log(this._flash.getError() + "---" + err);
			}
		}
    }
    this._removedRenderables = {};

    for (var renderableId in this._renderables) {
        if(this._renderables.hasOwnProperty(renderableId)) {
			var r = this._renderables[renderableId];
			if (r instanceof TexturedQuadRenderable) {
				if (! r._flashObjId) {
					var xform = r._transform.flattenRowMajor();
					r._flashObjId = this._flash.createTexturedGridRenderable(
						-1, -1, // -1 means renderable width/height the
								// same as the texture pixel dimensions
						1, 1,
						xform,
						r._material._texture._url,
						true);
					this._flash.addRenderable(r._flashObjId);
				}

				if (r._material &&
					r._material._animation) {
					var anim = r._material._animation;
					if (!anim._started && !anim._ended) {
						try {
						this._flash.animateRenderable(r._flashObjId,
							anim._startProperties,
							anim._endProperties, anim._duration/1000, anim._easingMode);
						} catch (err) {
							Utils.log("Flash: animateRenderable---"+err);
						}
						anim._started = true;
					} else if (!anim._ended) {
						try {
							if (this._flash.queryRenderableAnimationEnded(r._flashObjId)) {
								r._material._animatableStates = anim.getEndStates();
								if (anim._endCallback) {
									anim._endCallback(r._material, anim._endCallbackInfo);
								}
								r._material._animation = { _ended : true };
							}
						} catch (err) {
							Utils.log("Flash: queryRenderableAnimationEnded---"+err);
						}
					}
				}
			}
		}
	}

	if (this._flash.hasInitialized) {
		if (this._clearColor)
			this._flash.clearColor(this._clearColor);
		else
			this._flash.clearColor(0);

		try {
			this._flash.render();
		} catch (err) {
			Utils.log("Flash: render---"+err);
		}
	}
}

Renderer.prototype.animate = function(renderable,
                      startProperties,
                      endProperties,
                      duration,
                      easing,
					  endCallback,
					  endCallbackInfo) {

		var material = renderable._material;
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
		// Still keep the obj version of properties to pass
		// to flash
		anim._startProperties = startProperties;
		anim._endProperties = endProperties;

		var d = new Date;
		anim._startT = d.getTime();
		anim._duration = duration;
		anim._easingMode = easing;

		if (endCallback) anim._endCallback = endCallback;
		if (endCallbackInfo) anim._endCallbackInfo = endCallbackInfo;
}

RendererFlash.prototype.setViewProjectionMatrix = function (mat) {
	this._viewProjMatrix = mat;
	if (this._flash && this._flash.hasInitialized) {
		try {
			this._flash.setViewProjectionMatrix(mat.flattenRowMajor());
		} catch (err) {
			Utils.log("Flash: setViewProjectionMatrix---"+err);
		}
	}
}

RendererFlash.prototype.setClearColor = function(color) {
    //Does some validation of input and throws if there is an issue.
    this._checkClearColor(color);

	var intColor = (Math.floor(color.r*255)<<16) +
		(Math.floor(color.g*255)<<8) +
		Math.floor(color.b*255);
    this._clearColor = intColor;
};

function flashInitialized() {

    var id = "flashRenderer2";
    //We leave original in the DOM hidden, and create a new one by "Cloning" object node.
    var node = document.getElementById(id);
    if (node) {
        node.hasInitialized = true;
    }
}

if (! window.RWW)
	window.RWW = {};
window.RWW.flashInitialized = flashInitialized;
