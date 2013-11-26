
// TODO: (Joel) we need to abstract away browser differences for
// style and transform property names rather than setting them 
// all for each change.


//Polyfill the CSS matrix
var CSSMatrix = window.CSSMatrix || window.WebKitCSSMatrix || window.MSCSSMatrix || window.MozCSSMatrix;


function RendererCSS3D(win, width, height) {
    RendererCSS3D.__super.call(this, win);

	this._width = width;
	this._height = height;

    if (!RendererCheckCSS3D.isValidBrowser()) {
        throw 'css3d is not supported';
    }

    this._rootElement = document.createElement('div');
    this._rootElement.width = this._width;
    this._rootElement.height = this._height;

    this._flatten3D = document.createElement('div');
    this._flatten3D.style.width = this._width + 'px';
    this._flatten3D.style.height = this._height + 'px';
    this._flatten3D.style.position = 'absolute';
    this._flatten3D.style.webkitTransformStyle = 'flat';
    this._flatten3D.style.msTransformStyle = 'flat';
    this._flatten3D.style.MozTransformStyle = 'flat';
    this._flatten3D.style.backgroundColor = 'rgba(' + this._clearColor.r*255.0 + ',' + this._clearColor.g*255.0 + ',' + this._clearColor.b*255.0 + ',' + this._clearColor.a + ')';

    this._3dViewportDiv = document.createElement('div');
    this._3dViewportDiv.width = this._width;
    this._3dViewportDiv.height = this._height;
    this._3dViewportDiv.style.position = 'absolute';

    this._flatten3D.appendChild(this._3dViewportDiv);

    this._rootElement.appendChild(this._flatten3D);

    if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
        this._3dViewportDiv.style.webkitTransformStyle = 'preserve-3d';
        this._3dViewportDiv.style.webkitTransform = 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)';

        this._3dViewportDiv.style.MozTransformStyle = 'preserve-3d';
        this._3dViewportDiv.style.MozTransform = 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)';
    }

    //We do this last incase any earlier issues throw.
    win.appendChild(this._rootElement);
};
extend(RendererCSS3D, Renderer);




RendererCSS3D.prototype.ignoreEvent = function() {
    return false;
};

RendererCSS3D.prototype.setStyleProperties = function (element) {
		// The default transform-origin is (50%, 50%) which is just
		// fine with us.
        //element.style.webkitTransformOrigin = '0px 0px 0';
        if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
            element.style.webkitTransformStyle = 'preserve-3d';
            element.style.MozTransformStyle = 'preserve-3d';
        }
        element.style.position = 'absolute';

        //Make sure elements are not dragable, otherwise Safari will show a dragged image
        //when you mouse down and drag, which is not what we want
        //Utils.bind(element, 'dragstart', this.ignoreEvent);
};

RendererCSS3D.prototype.clearStyleProperties = function (element) {
		// The default transform-origin is (50%, 50%) which is just
		// fine with us.
        //element.style.webkitTransformOrigin = '0px 0px 0';
        element.style.webkitTransformStyle = '';
        element.style.msTransformStyle = '';
        element.style.MozTransformStyle = '';
        element.style.position = '';

        //Make sure elements are not dragable, otherwise Safari will show a dragged image
        //when you mouse down and drag, which is not what we want
        //Utils.unbind(element, 'dragstart',  this.ignoreEvent);
};

RendererCSS3D.prototype.setViewportSize = function (width, height) {
    this._width = width;
    this._height = height;
    this._rootElement.width = this._width;
    this._rootElement.height = this._height;
    this._flatten3D.style.width = this._width;
    this._flatten3D.style.height = this._height;
    this._3dViewportDiv.width = this._width;
    this._3dViewportDiv.height = this._height;
};

var updateCSS = function(e, t) {
    //Note: If setting as a string css can't handle scientific notation e.g. 1e-4
    e.style.webkitTransform = t;
    e.style.msTransform = t;
    e.style.MozTransform = t;
};
/**
 * This updates the leave node transforms with any
 * intermediate transforms. Note: This is only used when quirks.supportsPreserve3D = false.
 */
RendererCSS3D.prototype.updateTransforms = function (node, transform) {
    var node, current, transform, i, identity,
    q = [];
    identity = new CSSMatrix();
    identity.m11 = 1.0;
    identity.m12 = 0.0;
    identity.m13 = 0.0;
    identity.m14 = 0.0;
    identity.m21 = 0.0;
    identity.m22 = 1.0;
    identity.m23 = 0.0;
    identity.m24 = 0.0;
    identity.m31 = 0.0;
    identity.m32 = 0.0;
    identity.m33 = 1.0;
    identity.m34 = 0.0;
    identity.m41 = 0.0;
    identity.m42 = 0.0;
    identity.m43 = 0.0;
    identity.m44 = 1.0;

    if(!node) {
        node = this._rootElement;
    }

    if(!transform) {
        transform = identity;
    }
    if(node['$$matrixTransform']) {
        transform = transform.multiply(node['$$matrixTransform']);
    }

    if(node.childNodes.length === 0 || node['$$isLeaf']) {
        updateCSS(node, transform);
    }
    else {
        updateCSS(node, identity);
        for(i = 0; i < node.childNodes.length; ++i) {
            this.updateTransforms(node.childNodes[i], transform);
        }
    }
};

RendererCSS3D.prototype.render = function () {
    // The is needed because the CSS coordinate system is compatible with 2D page
    // transforms.
    //                  ^
    //                 /
    //                / -z (into screen).
    //               /
    //               --------------> +x
    //               |
    //               | +y
    //               |
    //               V
    //
    //  see: http://developer.apple.com/library/safari/#documentation/InternetWeb/Conceptual/SafariVisualEffectsProgGuide/Transforms/Transforms.html
    var invertYAxisMatrix = Matrix4x4.createScale(1, -1, 1);

    var viewportToScreenTransform = GraphicsHelper.createViewportToScreen(
                    this._width, this._height);

    var cssScreenSpaceViewProjectionTransform = viewportToScreenTransform.multiply(this._viewProjMatrix.multiply(invertYAxisMatrix))
    this.setCSS3DViewProjection(cssScreenSpaceViewProjectionTransform);


    var i, j, added;
    var imageElement, texture;

    for(var id in this._removedRenderables) {
        var imgElement, divElement = document.getElementById(id);
        if(divElement) {
            imgElement = divElement.firstChild;
            if(imgElement) {
                this.clearStyleProperties(imgElement);
                if(imgElement.parentNode) {
                    //Since the caching layer caches images, we want to de-parent to ensure
                    //consistent state.
                    imgElement.parentNode.removeChild(imgElement);
                }
            } else {
                this._error('Expected imgElement');
            }
            if( divElement.parentNode) {
                divElement.parentNode.removeChild(divElement);
            }

        } else {
            Utils.log('Cannot find and remove element');
        }
    }
    this._removedRenderables = {}; // de-ref and remove

    for (var renderableId in this._renderables) {
        if(this._renderables.hasOwnProperty(renderableId)) {
            var renderable = this._renderables[renderableId];

            added = false;
            imageElement = null;
            texture = null;
            if (renderable._material &&
                renderable._material._texture) {
                    texture = renderable._material._texture;
                    if (texture._isReady && texture._isDirty) {
                        imageElement = renderable._material._texture._image;
                        //We use deterministic ordering based on ids.
                        //imageElement._order = renderableId;
                    } else if (renderable.transformUpdated) {
                        var img = renderable._material._texture._image;
						if (img.parentNode) {
							this.setCSS3DTransform(img.parentNode, img,
								renderable._transform, renderable._order);
							renderable.transformUpdated = false;
						}
					}
            }
            if (imageElement == null) {
                continue;
            }

		imageElement._order = renderable._order;
		imageElement.style.zIndex = renderable._order;
        if(imageElement.parentNode) {
            this._error('Expected imageElement with no parent');
        }

        this.setStyleProperties(imageElement);

	var xformNode = document.createElement('div');
    xformNode.id = renderableId;
	xformNode.style.position = 'absolute';
	xformNode.style.zIndex = imageElement.style.zIndex;

        if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
            xformNode.style.webkitTransformOrigin = '0px 0px 0';
            xformNode.style.webkitTransformStyle = 'preserve-3d';

            xformNode.style.MozTransformOrigin = '0px 0px 0';
            xformNode.style.MozTransformStyle = 'preserve-3d';
        } else {
            xformNode['$$isLeaf'] = true;
        }

		xformNode.appendChild(imageElement);
        this.setCSS3DTransform(xformNode, imageElement, renderable._transform, renderable._order);

            for (j = 0; j < this._3dViewportDiv.childNodes.length; ++j) {
				var img = this._3dViewportDiv.childNodes[j].childNodes[0];
                if (img == undefined || img == imageElement) {
                    this._error('object state inconsistency');
                }
                if (img && imageElement._order &&
                    img._order > imageElement._order) {
                    added = true;
                    //Due to image being in the transform node, we
                    //insert xform into the child of the div.
                    this._3dViewportDiv.insertBefore(xformNode, this._3dViewportDiv.childNodes[j]);
                    texture._isDirty = false;
                    break;
                }
            }

            //If we're missing an order parameter or we are last, we append.
            if (!added) {
                this._3dViewportDiv.appendChild(xformNode);
                texture._isDirty = false;
            }
        }
    }

    if (!quirks.supportsPreserve3D || Config.forceIERenderPath) {
        //Update the transforms top-down.
        this.updateTransforms();
    }


	var callbackRemaining = false;
	if (this._frameCallbacks) {
		for (var i=0; i<this._frameCallbacks.length; i++) {
			if (this._frameCallbacks[i].count > 0) {
				callbackRemaining = true;
            } else if (this._frameCallbacks[i].count == 0) {
				this._frameCallbacks[i].cb();
            }
			this._frameCallbacks[i].count --;
		}
		if (! callbackRemaining) {
			this._frameCallbacks = [];
        }
	}
};

function createKeyFrames(name, keyframeprefix) {
  var keyframes = '@' + keyframeprefix + 'keyframes ' + name + ' { '+
                    'from {' + printObj(startProps)+ ' } '
                    'to {' + printObj(endProps) + ' } '+
                  '}';

  if( document.styleSheets && document.styleSheets.length ) {
      document.styleSheets[0].insertRule( keyframes, 0 );
  } else {
	this._error('Page must have style sheet');
	/*
	var s = document.createElement( 'style' );
    s.innerHTML = keyframes;
    document.getElementsByTagName('head')[0].appendChild(s);
	*/
  }
};

RendererCSS3D.prototype.transitionEndCallback = function(event) {
    if (this.completeCallback) {
        this.completeCallback(this.material, this.callbackInfo);
    }

    this.material._animation = { _ended : true };

    delete this.material;
    delete this.completeCallback;
    delete this.callbackInfo

    this.removeEventListener('webkitTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
    this.removeEventListener('mozTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
    this.removeEventListener('MSTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
};

RendererCSS3D.prototype.animate = function(renderable,
                      startProperties,
                      endProperties,
                      duration,
                      easing,
					  completeCallback,
					  completeCallbackInfo) {

        function FrameCallback(cb, count) {
            this.cb = cb; this.count = count;
        }

	//Utils.log(printObj(startProperties) + ' \n'+printObj(endProperties));
        //TODO.
        //   There are two cases here.
        //   (1) We are animating a CSS property on a browser that suppoerts CSS3 animations
        //   (2) We are doing something that needs a timer.

        //Right now assume it is a texture material & just use jquery .
		if (renderable &&
			renderable._material &&
			renderable._material._texture &&
			renderable._material._texture._image) {
			var material = renderable._material;
			var cssStartProps = {}, cssEndProps = {};
			for (var j=0; j<2; j++) {
				var fromProps = j==0 ? startProperties : endProperties;
				var toProps = j==0 ? cssStartProps : cssEndProps;
				var transformStr = '';
				for (var prop in fromProps) {
					if (fromProps.hasOwnProperty(prop)) {
						switch(prop) {
							case 'opacity':
								toProps['opacity'] = fromProps['opacity'];
								break;
							case 'x':
								transformStr += 'translateX(-' +
									fromProps['x'] + 'px) ';
								break;
							case 'y':
								transformStr += 'translateY(' +
									fromProps['y'] + 'px) ';
								break;
							case 'sx':
								transformStr += 'scaleX(' +
									fromProps['sx'] + ') ';
								break;
							case 'sy':
								transformStr += 'scaleY(' +
									fromProps['sy'] + ') ';
								break;
							case 'rotate':
								transformStr += 'rotate(-' +
									fromProps['rotate'] + 'deg) ';
								break;
						}
					}
				}
				if (transformStr != '') {
					toProps['-webkit-transform'] = transformStr;
					toProps['-ms-transform'] = transformStr;
					toProps['-moz-transform'] = transformStr;
				}
			}
            if(startProperties) {
                Utils.css( material._texture._image, {
					'-webkit-transition-duration' : duration+'ms',
					'-webkit-transition-timing-function' : easing,
					'-ms-transition-duration' : duration+'ms',
					'-ms-transition-timing-function' : easing,
					'-moz-transition-duration' : duration+'ms',
					'-moz-transition-timing-function' : easing
				});
                Utils.css(material._texture._image, cssStartProps);
            }

            //These are explicitly removed in transitionEndCallback after it's done
            //processing them.
            material._texture._image.material = material;
            material._texture._image.callbackInfo = completeCallbackInfo;
            material._texture._image.completeCallback = completeCallback;
			material._texture._image.addEventListener(
			'webkitTransitionEnd',
			RendererCSS3D.prototype.transitionEndCallback, false);
			material._texture._image.addEventListener(
			'MSTransitionEnd',
			RendererCSS3D.prototype.transitionEndCallback, false);
			material._texture._image.addEventListener(
			'mozTransitionEnd',
			RendererCSS3D.prototype.transitionEndCallback, false);
            var renderer = this;
			var startTransition = function() {
                Utils.css(material._texture._image, cssEndProps);
			}
			if (this._frameCallbacks == undefined) {
				this._frameCallbacks = [];
            }
			this._frameCallbacks.push(new FrameCallback(startTransition, 1));
			material._animation = { _ended : false };
        }
};

RendererCSS3D.prototype.setCSS3DTransform = function (elem, image, transform, order) {
    var invertY = Matrix4x4.createScale(1, -1, 1);
    //Use naturalHeight because IE10 doesn't report height correctly for this element.
    var height = Math.max(image.height || 0, image.naturalHeight || 0);

    var t = Matrix4x4.createTranslation(0, -height, 0);
    var preTransform = invertY.multiply(t);
    var postTransform = invertY;

    //Local coord system has y axis pointing down, change to have y axis pointing up.  Also the
    //transform origin is at the top left of the element, so need to translate it so that it is
    //at the bottom left of the element which lines up with the transform-origin of the outer
    //div where the view/projection matrix is applied
    var invertY = Matrix4x4.createScale(1, -1, 1);
    var t = Matrix4x4.createTranslation(0, -height, 0);
    var m = invertY.multiply(transform.multiply(invertY.multiply(t)));

    m = postTransform.multiply(transform.multiply(preTransform));
    m = m.transpose();

    var mCss = new CSSMatrix();
    mCss.m11 = m.m11;
    mCss.m12 = m.m12;
    mCss.m13 = m.m13;
    mCss.m14 = m.m14;
    mCss.m21 = m.m21;
    mCss.m22 = m.m22;
    mCss.m23 = m.m23;
    mCss.m24 = m.m24;
    mCss.m31 = m.m31;
    mCss.m32 = m.m32;
    mCss.m33 = m.m33;
    mCss.m34 = m.m34;
    mCss.m41 = m.m41;
    mCss.m42 = m.m42;
    mCss.m43 = m.m43;
    mCss.m44 = m.m44;

    if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
        elem.style.webkitTransform = mCss;
        elem.style.MozTransform = mCss;
        elem.style.msTransform = mCss;
    } else {
        //We apply this transform  in updateTransforms.
        elem['$$matrixTransform'] = mCss;
    }
};


RendererCSS3D.prototype.setCSS3DViewProjection = function (viewProjection) {
    var m = viewProjection.transpose();

    //TODO:Webkit specific, need to abstract for other browsers
    var mCss = new CSSMatrix();
    mCss.m11 = m.m11;
    mCss.m12 = m.m12;
    mCss.m13 = m.m13;
    mCss.m14 = m.m14;
    mCss.m21 = m.m21;
    mCss.m22 = m.m22;
    mCss.m23 = m.m23;
    mCss.m24 = m.m24;
    mCss.m31 = m.m31;
    mCss.m32 = m.m32;
    mCss.m33 = m.m33;
    mCss.m34 = m.m34;
    mCss.m41 = m.m41;
    mCss.m42 = m.m42;
    mCss.m43 = m.m43;
    mCss.m44 = m.m44;

    if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
        //Note: If setting as a string css can't handle scientific notation e.g. 1e-4
        this._3dViewportDiv.style.webkitTransform = mCss;
        this._3dViewportDiv.style.MozTransform = mCss;
        this._3dViewportDiv.style.msTransform = mCss;
    } else {
        //Used by updateTransforms
        this._3dViewportDiv['$$matrixTransform'] = mCss;
    }
};

RendererCSS3D.prototype.setCSS3DOpacity = function(elem, opacity, duration) {
    elem.style.webkitTransition = 'opacity ' + duration + 's linear';
    elem.style.MozTransition = 'opacity ' + duration + 's linear';
    elem.style.msTransition = 'opacity ' + duration + 's linear';
    elem.style.opacity = opacity;
};

RendererCSS3D.prototype.setClearColor = function(color) {
    //Does some validation of input and throws if there is an issue.
    this._checkClearColor(color);

    this._clearColor = color;
    this._flatten3D.style.backgroundColor = 'rgba(' + this._clearColor.r*255.0 + ',' + this._clearColor.g*255.0 + ',' + this._clearColor.b*255.0 + ',' + this._clearColor.a + ')';
};
