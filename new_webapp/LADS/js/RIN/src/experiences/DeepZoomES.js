/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../contracts/DiscreteKeyframeESBase.js" />
/// <reference path="../contracts/IExperienceStream.js" />
/// <reference path="../contracts/IOrchestrator.js" />
/// <reference path="../core/Common.js" />
/// <reference path="../core/EventLogger.js" />
/// <reference path="../core/PlayerConfiguration.js" />
/// <reference path="../core/ResourcesResolver.js" />
/// <reference path="../../../web/js/seadragon-0.8.9.js" />
/// <reference path="../core/TaskTimer.js" />


window.rin = window.rin || {};

(function (rin) {
    // ES for displaying deepzoom images.
    var DeepZoomES = function (orchestrator, esData) {
        DeepZoomES.parentConstructor.apply(this, arguments);
        var self = this;
        
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(DeepZoomES.elementHtml).firstChild; // Experience stream UI DOM element.
        this._seadragonClip = this._userInterfaceControl.getElementsByClassName("seadragonClip")[0];
        this._seadragonClipContents = this._userInterfaceControl.getElementsByClassName("seadragonClipContents")[0];
        this._seadragonContainer = this._userInterfaceControl.getElementsByClassName("seadragonContainer")[0];
        this._seadragonElement = null;
        this._esData = esData;
        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId); // Resolved url to the DZ image.
        this.viewportChangedEvent = new rin.contracts.Event();
        this.applyConstraints = orchestrator.getPlayerConfiguration().playerMode !== rin.contracts.playerMode.AuthorerEditor;
        this.old_left = 0;
        this.old_top = 0;
        this.old_width = 0;
        this.old_height = 0;
        this.msGesture = null;
        this.cover = $(document.createElement('div'));
        this.proxy = $(document.createElement('div'));
        this.proxy.attr('data-proxy', this._esData.experienceId);
        this.proxy.data({
            'x': 0,
            'y': 0,
            'w': 0,
            'h': 0
        });
        this.proxy.css({ "background": "rgba(0,0,0,0)", "width": "0px", "height": "0px" });

        esData.data = esData.data || {};
        esData.data.defaultKeyframe = esData.data.defaultKeyframe || {
            "state": {
                "viewport": {
                    "region": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "span": {
                            "x": 0,
                            "y": 0
                        }
                    }
                }
            }
        };

        // Set viewport visibility constrains
        Seadragon.Config.visibilityRatio = typeof esData.data.viewportConstrainRatio === "undefined" ? 0.05 : esData.data.viewportConstrainRatio;
        if (esData.data.viewportClamping && esData.data.viewportClamping !== this.viewportClampingOptions.none) {
            this.viewportClampingMode = esData.data.viewportClamping;
            Seadragon.Config.visibilityRatio = 1; // This is required to support viewport clamping.
        }

        // Monitor interactions on the ES
        $(this._userInterfaceControl).bind("mousedown mousewheel", function (e) {
            self._orchestrator.startInteractionMode();
            self._orchestrator.onESEvent(rin.contracts.esEventIds.interactionActivatedEventId, null);
            //self._userInterfaceControl.focus();
        });

        // Handle key events for panning
        this._userInterfaceControl.addEventListener('keydown', function (e) {
            if (e.keyCode === '37') //left arrow
                self.panLeftCommand();
            else if (e.keyCode === '38') //up arrow
                self.panUpCommand();
            else if (e.keyCode === '39') //right arrow
                self.panRightCommand();
            else if (e.keyCode === '40') //down arrow 
                self.panDownCommand();
        }, true);
        this.updateEA = null;
    };

    rin.util.extend(rin.contracts.InterpolatedKeyframeESBase, DeepZoomES);

    DeepZoomES.prototypeOverrides = {
        getEmbeddedArtifactsProxy: function (layoutEngine) {
            var provider = this;
            this.updateEA = function () { layoutEngine.render({}); };
            return new function () {
                var tmpRegion = { center: { x: 0, y: 0 }, span: { x: 0, y: 0 } };
                var tmpPoint = new Seadragon.Point();
                this.getEmbeddedArtifactsContainer = function () {
                    return provider._seadragonClipContents;
                };
                this.convertPointToScreen2D = function (inPoint, outPoint) {
                    tmpPoint.x = inPoint.x;
                    tmpPoint.y = inPoint.y;
                    var result = provider._viewer.viewport.pixelFromPoint(tmpPoint, true);
                    outPoint.x = result.x;
                    outPoint.y = result.y;
                    return true;
                };
                this.convertPointToWorld2D = function (inPoint, outPoint) {
                    tmpPoint.x = inPoint.x;
                    tmpPoint.y = inPoint.y;
                    var result = provider._viewer.viewport.pointFromPixel(tmpPoint, true);
                    outPoint.x = result.x;
                    outPoint.y = result.y;
                    return true;
                };
                this.getScreenDimensions = function (r) {
                    r.span.x = provider._userInterfaceControl.clientWidth;
                    r.span.y = provider._userInterfaceControl.clientHeight;
                    r.center.x = r.span.x / 2;
                    r.center.y = r.span.y / 2;
                };

                this.currentNormalizedZoom = function () {
                    return provider._viewer.viewport.getZoom(true);
                };
            };
        },

        // Load and initialize the ES.
        load: function (experienceStreamId) {
            var self = this;
            this.addSliverInterpolator("viewport", function (sliverId, state) {
                return new rin.Ext.Interpolators.linearViewportInterpolator(state);
            });

            DeepZoomES.parentPrototype.load.call(self, experienceStreamId);

            self.setState(rin.contracts.experienceStreamState.buffering); // Set to buffering till the ES is loaded.
            rin.internal.debug.write("Load called for " + self._url);

            self._viewer = new Seadragon.Viewer(self._seadragonContainer, !self.applyConstraints);
            self._viewer.clearControls();

            // Raise state transition event anytime the state of the ES has changed, like a pan or zoom.
            self._viewer.addEventListener('animationfinish', function () {
                var playerState = self._orchestrator.getPlayerState();
                if (playerState === rin.contracts.playerState.pausedForExplore || playerState === rin.contracts.playerState.stopped) {
                    self._orchestrator.onESEvent(rin.contracts.esEventIds.stateTransitionEventId, { isUserInitiated: true, transitionState: "completed" });
                }
            });
            
            /// Regex for matching zoom.it urls
            var zoomItMatch = self._url.match(new RegExp("http://(www\\.)?zoom\\.it/(\\w+)\\s*"));

            // Default animation time used for panning and zooming.
            Seadragon.Config.animationTime = 0.5;

            // Function to open the dzi if source is not a zoom.it url.
            function openDzi(dzi) {
                self._viewer.addEventListener('open', function (openedViewer) {
                    self._viewer.addEventListener('animation', function (viewer) { self.raiseViewportUpdate(); });
                    //self._viewer.addEventListener('animationstart', function (viewer) { self.raiseViewportUpdate(); });
                    self._viewer.addEventListener('animationfinish', function (viewer) { self.raiseViewportUpdate(); });
                    
                    self._seadragonElement = self._seadragonContainer.firstChild;
                    self.setState(rin.contracts.experienceStreamState.ready);
                    
                    self._orchestrator.getPlayerRootControl().addEventListener("resize", function () {
                            if (self.getState() === "ready") {
                                self._updateViewportClip(self._viewer);
                                //if (self.applyConstraints)
                                    openedViewer.viewport.applyConstraints(true);
                            }
                    }, true);
                    self.initTouch();
                    self._updateViewportClip(openedViewer);
                    //if (self.applyConstraints)
                        openedViewer.viewport.applyConstraints(true);
                    self.raiseViewportUpdate();
                });

                self._viewer.addEventListener('error', function (openedViewer) {
                    rin.internal.debug.write("Deepzoom ES got into error state.");
                    self.setState(rin.contracts.experienceStreamState.error);
                });

                self._viewer.openDzi(dzi);
            }

            // Function to open a zoom.it url.
            function onZoomitresponseonse(response) {
                if (response.status !== 200) {
                    // e.g. the URL is malformed or the service is down
                    rin.internal.debug.write(response.statusText);
                    self._orchestrator.eventLogger.logErrorEvent("Error in loading deepzoom {0}. Error: {1}", self._url, response.statusText);
                    self.setState(rin.contracts.experienceStreamState.error);
                    return;
                }

                var content = response.content;

                if (content && content.ready) { // Image is ready!!
                    openDzi(content.dzi);
                } else if (content.failed) { // zoom.it couldnt process the image
                    rin.internal.debug.write(content.url + " failed to convert.");
                    self._orchestrator.eventLogger.logErrorEvent("Error in loading deepzoom {0}. Error: {1}", self._url, "failed to convert");
                    self.setState(rin.contracts.experienceStreamState.error);
                } else { // image is still under processing
                    rin.internal.debug.write(content.url + " is " + Math.round(100 * content.progress) + "% done.");
                    self.setState(rin.contracts.experienceStreamState.error);
                }
            }

            if (zoomItMatch) {
                // Using JSONP approach to to load a zoom.it url.
                var imageID = zoomItMatch[2];

                $.ajax({
                    url: "http://api.zoom.it/v1/content/" + imageID,
                    dataType: "jsonp",
                    success: onZoomitresponseonse
                });
            }
            else {
                openDzi(this._url);
            }
        },

        unload: function () {
            this._viewer.unload();
            this.cover.remove();
            this.proxy.remove();
        },

        // Pause the player.
        pause: function (offset, experienceStreamId) {
            DeepZoomES.parentPrototype.pause.call(this, offset, experienceStreamId);
        },
        
        // Apply a keyframe to the ES.
        displayKeyframe: function (keyframeData) {
            if (this.getState() !== rin.contracts.experienceStreamState.ready || !keyframeData.state) return; // Not ready yet, do not attempt to show anything.
            
            if (this.msGesture) {
                this.msGesture.stop();
                this.cover.hide();
            }

            var viewport = keyframeData.state.viewport;
            if (viewport) {
                var rect = new Seadragon.Rect(viewport.region.center.x, viewport.region.center.y, viewport.region.span.x, viewport.region.span.y);
                this._viewer.viewport.fitBounds(rect, true);
            }
        },

        raiseViewportUpdate: function(){
            this._updateViewportClip(this._viewer);
        },

        _updateViewportClip: function (viewer) {
            // Update EAs if present
            if (this.updateEA !== null) this.updateEA();

            // Get pixel coordinates of the DZ image
            var topLeft = viewer.viewport.pixelFromPoint(new Seadragon.Point(0, 0), true);
            var bottomRight = viewer.viewport.pixelFromPoint(new Seadragon.Point(1, viewer.source.height / viewer.source.width), true);
            var panelW = this._userInterfaceControl.clientWidth;
            var panelH = this._userInterfaceControl.clientHeight;

            // Apply viewport clamping
            var percentageAdjustment;
            if (this.viewportClampingMode !== this.viewportClampingOptions.none) {
                var adjOffset = 0;
                if (viewer.source.height <= viewer.source.width) {
                    if (this.viewportClampingMode === this.viewportClampingOptions.all) {
                        percentageAdjustment = panelH / viewer.source.height;
                        var proportionalWidth = viewer.source.width * percentageAdjustment;
                        adjOffset = panelW - proportionalWidth;
                    }
                    Seadragon.Config.minZoomDimension = panelH + (adjOffset > 0 ? adjOffset * viewer.source.height / viewer.source.width : 0);
                } else {
                    if (this.viewportClampingMode === this.viewportClampingOptions.all) {
                        percentageAdjustment = panelW / viewer.source.width;
                        var proportionalHeight = viewer.source.height * percentageAdjustment;
                        adjOffset = panelH - proportionalHeight;
                    }
                    Seadragon.Config.minZoomDimension = panelW + (adjOffset > 0 ? adjOffset * viewer.source.width / viewer.source.height : 0);
                }
            }

            // Apply the clip on the image
            this._seadragonClipContents.style.width = panelW + "px";
            this._seadragonClipContents.style.height = panelH + "px";

            var newLeft = topLeft.x;
            var newTop = topLeft.y;

            var newWidth = bottomRight.x - topLeft.x;
            var newHeight = bottomRight.y - topLeft.y;
            //console.log("nL = " + newLeft + ", nT = " + newTop + ", nW = " + newWidth + ", nH = " + newHeight);

            if (!this.proxy[0].parentNode) {
                var viewerElt = $("#rinplayer").length ? $("#rinplayer") : $("#rinPlayer");
                viewerElt.append(this.proxy);
            }
            this.proxy.data({
                x: newLeft, y: newTop,
                w: newWidth, h: newHeight
            });


            this.old_left = newLeft;
            this.old_top = newTop;
            this.old_width = newWidth;
            this.old_height = newHeight;

            if (newLeft > 0) {
                this._seadragonClip.style.left = newLeft + "px";
                this._seadragonClipContents.style.left = -newLeft + "px";
            }
            else {
                this._seadragonClip.style.left = "0px";
                this._seadragonClipContents.style.left = "0px";
                newLeft = 0;
            }
            if (newTop > 0) {
                this._seadragonClip.style.top = newTop + "px";
                this._seadragonClipContents.style.top = -newTop + "px";
            }
            else {
                this._seadragonClip.style.top = "0px";
                this._seadragonClipContents.style.top = "0px";
                newTop = 0;
            }

            this._seadragonClip.style.width = Math.min(panelW, (bottomRight.x - newLeft)) + "px";
            this._seadragonClip.style.height = Math.min(panelH, (bottomRight.y - newTop)) + "px";

            var pushstate = {
                x: this.old_left, y: this.old_top,
                width: this.old_width, height: this.old_height
            };
            this.viewportChangedEvent.publish(pushstate);
            return pushstate;
        },

        // Handle touch input for zoom and pan.
        touchHandler: function (event, cover) {
            var touches = event.changedTouches,
             first = touches ? touches[0] : { screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY, target: event.target },
             type = "";
            switch (event.type) {
                case "touchstart":
                    type = "mousedown"; cover.show(); break;
                case "MSPointerDown":
                    type = "mousedown"; cover.show(); break;
                case "touchmove":
                    type = "mousemove"; break;
                case "MSPointerMove":
                    type = "mousemove"; break;
                case "touchend":
                    type = "mouseup"; this.lastFirst = this.lastSecond = null; cover.hide(); break;
                case "MSPointerUp":
                    type = "mouseup"; this.lastFirst = this.lastSecond = null; cover.hide(); break;
                default: return;
            }

            var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent(type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0, null);

            first.target.dispatchEvent(simulatedEvent);
            event.preventDefault();
            return false;
        },

        // Initialize touch gestures.
        initTouch: function () {
            var self = this,
                node = self._viewer.drawer.elmt,
                cover = this.cover;

            // set up touch cover
            cover.css({
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '100%',
                height: '100%',
                'z-index': '100000000000000000000'
            });
            cover.hide();
            $('body').append(cover);

            // If running on IE 10/RT, enable multitouch support.
            if (window.navigator.msPointerEnabled && typeof (MSGesture) !== "undefined") {
                var onmspointerdown = function (e) {
                    self._orchestrator.startInteractionMode();
                    self._orchestrator.onESEvent(rin.contracts.esEventIds.interactionActivatedEventId, null);

                    if (!self.msGesture) {
                        self.msGesture = new MSGesture();
                        self.msGesture.target = node;
                    }

                    self.msGesture.addPointer(e.pointerId);

                    e.stopPropagation();
                    e.preventDefault();

                    cover.show();
                };
                Seadragon.Utils.addEvent(node, "MSPointerDown", onmspointerdown);
                cover[0].addEventListener('MSPointerDown', onmspointerdown, true);

                // bleveque: added this to remove cover on mouseUp -- make sure it still works with bimanual pinch zoom
                var onmspointerup = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    cover.hide();
                };
                Seadragon.Utils.addEvent(node, "MSPointerUp", onmspointerup);
                cover[0].addEventListener('MSPointerUp', onmspointerup, true);

                var onmsgesturechanged = function (e) {
                    self._viewer.viewport.panBy(self._viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(-e.translationX, -e.translationY), true), false);
                    self._viewer.viewport.zoomBy(e.scale, self._viewer.viewport.pointFromPixel(new Seadragon.Point(e.offsetX, e.offsetY), true), false);
                    //if (self.applyConstraints)
                        self._viewer.viewport.applyConstraints(true);
                    e.stopPropagation();
                    cover.show(); // we added MSPointerUp to hide the cover, so we want to show it again on gesture changed (e.g. bimanual pinch zooming)
                };
                Seadragon.Utils.addEvent(node, "MSGestureChange", onmsgesturechanged);
                cover[0].addEventListener('MSGestureChange', onmsgesturechanged, true);

                var onmsgestureend = function (e) {
                    if (self.msGesture) self.msGesture.stop();
                    cover.hide();
                };
                Seadragon.Utils.addEvent(node, "MSGestureEnd", onmsgestureend);
                cover[0].addEventListener('MSGestureEnd', onmsgestureend, true);

                var onmsgesturestart = function (e) {
                    e.stopPropagation();
                    cover.show();
                };
                Seadragon.Utils.addEvent(node, "MSGestureStart", onmsgesturestart);
                cover[0].addEventListener('MSGestureStart', onmsgesturestart, true);
            }
            else { // Not IE 10, use normal single touch handlers.
                var handler = function (event) {
                    return self.touchHandler(event, cover);
                };
                self._userInterfaceControl.addEventListener("touchstart", handler, true);
                self._userInterfaceControl.addEventListener("touchmove", handler, true);
                self._userInterfaceControl.addEventListener("touchend", handler, true);
                self._userInterfaceControl.addEventListener("touchcancel", handler, true);
                cover.on('touchstart', handler);
                cover.on('touchmove', handler);
                cover.on('touchend', handler);
                cover.on('touchcancel', handler);

                self._userInterfaceControl.addEventListener("MSPointerDown", handler, true);
                self._userInterfaceControl.addEventListener("MSPointerMove", handler, true);
                self._userInterfaceControl.addEventListener("MSPointerUp", handler, true);
                cover.addEventListener('MSPointerDown', handler, true);
                cover.addEventListener('MSPointerMove', handler, true);
                cover.addEventListener('MSPointerUp', handler, true);
            }
        },

        // Get an instance of the interaction controls for this ES.
        getInteractionControls: function () {
            var self = this;
            if (!self.interactionControls) { // Check for a cached version. If not found, create one.
                self.interactionControls = document.createElement("div");

                this._orchestrator.getInteractionControls([rin.contracts.interactionControlNames.panZoomControl],
                    function (wrappedInteractionControls) {
                        // Populate the container div with the actual controls.
                        rin.util.assignAsInnerHTMLUnsafe(self.interactionControls, wrappedInteractionControls.innerHTML);
                        // Bind the controls with its view-model.
                        ko.applyBindings(self, self.interactionControls);
                    });
            }

            // Return the cached version or the container div, it will be populated once the interaction control is ready.
            return this.interactionControls;
        },

        // Zoom in to the image by a predefined amount.
        zoomInCommand: function () {
            this._viewer.viewport.zoomBy(1.2, null, false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Zoom out from the image by a predefined amount.
        zoomOutCommand: function () {
            this._viewer.viewport.zoomBy(0.8, null, false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panLeftCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(-this.panDistance / this._viewer.viewport.getZoom(true), 0), false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panRightCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(this.panDistance / this._viewer.viewport.getZoom(true), 0), false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panUpCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(0, -this.panDistance / this._viewer.viewport.getZoom(true)), false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panDownCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(0, this.panDistance / this._viewer.viewport.getZoom(true)), false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        goHomeCommand: function () {
            this._viewer.viewport.goHome(false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Get a keyframe of the current state.
        captureKeyframe: function () {
            if (!this._viewer || !this._viewer.viewport) return "";
            var rect = this._viewer.viewport.getBounds();
            
            return {
                "state": {
                    "viewport": {
                        "region": {
                            "center": {
                                "x": rect.x,
                                "y": rect.y
                            },
                            "span": {
                                "x": rect.width,
                                "y": rect.height
                            }
                        }
                    }
                }
            };
        },

        _viewer: null,
        panDistance: 0.2,
        interactionControls: null,
        applyConstraints: true,
        isExplorable: true,
        viewportClampingOptions: { all: "all", letterbox: "letterbox", none: "none" },
        viewportClampingMode: "none"
    };

    rin.util.overrideProperties(DeepZoomES.prototypeOverrides, DeepZoomES.prototype);
    DeepZoomES.keyframeFormat = "<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='{0}' Viewport_Y='{1}' Viewport_Width='{2}' Viewport_Height='{3}'/>";
    DeepZoomES.elementHtml = "<div style='height:100%;width:100%;position:absolute;background:transparent;pointer-events:none;' tabindex='0'><div class='seadragonClip' style='height:100%;width:100%;position:absolute;background:transparent;left:0px;top:0px;overflow:hidden;pointer-events:auto;' tabindex='0'><div class='seadragonClipContents' style='height:333px;width:600px;position:absolute;'><div class='seadragonContainer' style='height:100%;width:100%;position:absolute;' tabindex='0'></div></div></div></div>";
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.DeepZoomExperienceStream", function (orchestrator, esData) { return new DeepZoomES(orchestrator, esData); });
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.ZoomableMediaExperienceStream", function (orchestrator, esData) { return new DeepZoomES(orchestrator, esData); });
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2",
     function (orchestrator, esData) 
     { 
        var resourceUrl = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
        if(rin.util.endsWith(resourceUrl, ".jpg") || rin.util.endsWith(resourceUrl, ".jpeg") || rin.util.endsWith(resourceUrl, ".png"))
        {
            var factoryFunction = rin.ext.getFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.ImageExperienceStream");
            return factoryFunction(orchestrator, esData);
        }
        else
        {
            return new DeepZoomES(orchestrator, esData); 
        }
     });    
})(rin);