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
        this.applyConstraints = orchestrator.getPlayerConfiguration().playerMode != rin.contracts.playerMode.AuthorerEditor;

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
        OpenSeadragon.DEFAULT_SETTINGS.visibilityRatio = typeof esData.data.viewportConstrainRatio == "undefined" ? .05 : esData.data.viewportConstrainRatio;
        if (esData.data.viewportClamping && esData.data.viewportClamping != this.viewportClampingOptions.none) {
            this.viewportClampingMode = esData.data.viewportClamping;
            OpenSeadragon.DEFAULT_SETTINGS.visibilityRatio = 1; // This is required to support viewport clamping.
        }

        // Monitor interactions on the ES
        $(this._userInterfaceControl).bind("mousedown mousewheel", function (e) {
            self._orchestrator.startInteractionMode();
            self._userInterfaceControl.focus();
        });

        // Handle key events for panning
        this._userInterfaceControl.addEventListener('keydown', function (e) {
            if (e.keyCode == '37') //left arrow
                self.panLeftCommand();
            else if (e.keyCode == '38') //up arrow
                self.panUpCommand();
            else if (e.keyCode == '39') //right arrow
                self.panRightCommand();
            else if (e.keyCode == '40') //down arrow 
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
            
            // Raise state transition event anytime the state of the ES has changed, like a pan or zoom.
            //self._viewer.addEventListener('animationfinish', function () {
            //    var playerState = self._orchestrator.getPlayerState();
            //    if (playerState == rin.contracts.playerState.pausedForExplore || playerState == rin.contracts.playerState.stopped) {
            //        self._orchestrator.onESEvent(rin.contracts.esEventIds.stateTransitionEventId, { isUserInitiated: true, transitionState: "completed" });
            //    }
            //});

            self._orchestrator.getPlayerRootControl().addEventListener("resize", function () {
                if (self.getState() == "ready")
                    self._updateViewportClip(self._viewer);
            }, true);

            /// Regex for matching zoom.it urls
            var zoomItMatch = self._url.match(new RegExp("http://(www\\.)?zoom\\.it/(\\w+)\\s*"));

            // Default animation time used for panning and zooming.
            OpenSeadragon.DEFAULT_SETTINGS.animationTime = .5;
          
            // Function to open the dzi if source is not a zoom.it url.
            function openDzi(dzi) {
                //self._viewer.addEventListener('error', function (openedViewer) {
                //    rin.internal.debug.write("Deepzoom ES got into error state.");
                //    self.setState(rin.contracts.experienceStreamState.error);
                //});

                self._viewer = OpenSeadragon({
                    element: self._userInterfaceControl,
                    prefixUrl: "/openseadragon/images/",
                    blendTime:0.5,
                    tileSources: [{
                        Image: {
                            xmlns: "http://schemas.microsoft.com/deepzoom/2009",
                            Url: dzi.url.substr(0,dzi.url.indexOf(".dzi")) + "_files/",
                            TileSize: dzi.tileSize,
                            Overlap: dzi.tileOverlap,
                            Format: dzi.tileFormat,
                            ServerFormat: "Default",
                            Size: {
                                Width: dzi.width,
                                Height: dzi.height
                            }
                        }
                    }]
                });

                self._viewer.addHandler('open', function (openedViewer) {
                    self._viewer.addHandler('animation', function (viewer) { self.raiseViewportUpdate(); });
                    self._viewer.addHandler('animationstart', function (viewer) { self.raiseViewportUpdate(); });
                    self._viewer.addHandler('animationfinish', function (viewer) { self.raiseViewportUpdate(); });
                        self._seadragonElement = self._seadragonContainer.firstChild;
                        self.setState(rin.contracts.experienceStreamState.ready);
                        self._orchestrator.getPlayerRootControl().addEventListener("resize", function () {
                            setTimeout(function () {
                                self._updateViewportClip(self._viewer);
                                if (self.applyConstraints) openedViewer.viewport.applyConstraints(true);
                            }, 100);
                        }, true);
                        //self.initTouch();
                        self._updateViewportClip(openedViewer);
                        if (self.applyConstraints) openedViewer.viewport.applyConstraints(true);
                        self.raiseViewportUpdate();
                });
                
                self._viewer.clearControls();
            }

            // Function to open a zoom.it url.
            function onZoomitresponseonse(response) {
                if (response.status != 200) {
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

        // Pause the player.
        pause: function (offset, experienceStreamId) {
            DeepZoomES.parentPrototype.pause.call(this, offset, experienceStreamId);
        },

        // Apply a keyframe to the ES.
        displayKeyframe: function (keyframeData) {
            if (this.getState() != rin.contracts.experienceStreamState.ready || !keyframeData.state) return; // Not ready yet, do not attempt to show anything.

            var viewport = keyframeData.state.viewport;
            if (viewport) {
                var rect = new OpenSeadragon.Rect(viewport.region.center.x, viewport.region.center.y, viewport.region.span.x, viewport.region.span.y);
                this._viewer.viewport.fitBounds(rect, true);
            }
        },

        raiseViewportUpdate: function () {
            this._updateViewportClip(this._viewer);
        },

        _updateViewportClip: function (viewer) {
            return;
            // Update EAs if present
            if (this.updateEA != null) this.updateEA();

            // Get pixel coordinates of the DZ image
            var topLeft = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
            var bottomRight = viewer.viewport.pixelFromPoint(new Seadragon.Point(1, viewer.source.height / viewer.source.width), true);
            var panelW = this._userInterfaceControl.clientWidth;
            var panelH = this._userInterfaceControl.clientHeight;

            // Apply viewport clamping
            if (this.viewportClampingMode != this.viewportClampingOptions.none) {
                var adjOffset = 0;
                if (viewer.source.height <= viewer.source.width) {
                    if (this.viewportClampingMode == this.viewportClampingOptions.all) {
                        var percentageAdjustment = panelH / viewer.source.height;
                        var proportionalWidth = viewer.source.width * percentageAdjustment;
                        adjOffset = panelW - proportionalWidth;
                    }
                    OpenSeadragon.DEFAULT_SETTINGS.minZoomDimension = panelH + (adjOffset > 0 ? adjOffset * viewer.source.height / viewer.source.width : 0);
                } else {
                    if (this.viewportClampingMode == this.viewportClampingOptions.all) {
                        var percentageAdjustment = panelW / viewer.source.width;
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

            this.viewportChangedEvent.publish({ "x": topLeft.x, "y": topLeft.y, "width": bottomRight.x - topLeft.x, "height": bottomRight.y - topLeft.y });
        },

        // Handle touch input for zoom and pan.
        touchHandler: function (event) {
            var touches = event.changedTouches,
             first = touches ? touches[0] : { screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY, target: event.target },
             type = "";
            switch (event.type) {
                case "touchstart":
                case "MSPointerDown":
                    type = "mousedown"; break;
                case "touchmove":
                case "MSPointerMove":
                    type = "mousemove"; break;
                case "touchend":
                case "MSPointerUp":
                    type = "mouseup"; this.lastFirst = this.lastSecond = null; break;
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
                startRect,
                msGesture,
                node = self._viewer.drawer.elmt;

            // If running on IE 10/RT, enable multitouch support.
            if (window.navigator.msPointerEnabled && typeof (MSGesture) !== "undefined") {
                OpenSeadragon.Utils.addEvent(node, "MSPointerDown", function (e) {
                    //var out = {};
                    //self.getEmbeddedArtifactsProxy().convertPointToWorld2D({ x: e.x, y: e.y }, out);
                    //alert(out.x + " / " + out.y);
                    self._orchestrator.startInteractionMode();
                    self._userInterfaceControl.focus();

                    if (!msGesture) {
                        msGesture = new MSGesture();
                        msGesture.target = node;
                    }

                    msGesture.addPointer(e.pointerId);

                    e.stopPropagation();
                    e.preventDefault();
                });

                OpenSeadragon.Utils.addEvent(node, "MSGestureChange", function (e) {
                    if (startRect) {
                        if (e.scale > .25) {
                            startRect = self._viewer.viewport.getBounds(false);
                            var topLeft = self._viewer.viewport.pixelFromPoint(new Seadragon.Point(0, 0), true);
                            var bottomRight = self._viewer.viewport.pixelFromPoint(new Seadragon.Point(1, self._viewer.source.height / self._viewer.source.width), true);
                            var pinchXPercentage = (e.clientX - topLeft.x) / (bottomRight.x - topLeft.x),
                                pinchYPercentage = (e.clientY - topLeft.y) / (bottomRight.y - topLeft.y);

                            var newWidth = startRect.width / (e.scale);
                            var newHeight = startRect.height / (e.scale);

                            var newX = startRect.x - (newWidth - startRect.width) * pinchXPercentage;
                            var newY = startRect.y - (newHeight - startRect.height) * pinchYPercentage;

                            var pointsDelta = self._viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(e.translationX, e.translationY), true);

                            newX -= pointsDelta.x;
                            newY -= pointsDelta.y;

                            var rect = new Seadragon.Rect(newX, newY, newWidth, newHeight);
                            startRect = rect;
                            self._viewer.viewport.fitBounds(rect);
                            if (self.applyConstraints) self._viewer.viewport.applyConstraints(true);
                            e.stopPropagation();
                        }
                    }
                });

                Seadragon.Utils.addEvent(node, "MSGestureEnd", function (e) {
                    startRect = null;
                    msGesture && msGesture.stop();
                });

                Seadragon.Utils.addEvent(node, "MSGestureStart", function (e) {
                    startRect = self._viewer.viewport.getBounds(true);
                    e.stopPropagation();
                });
            }
            else { // Not IE 10, use normal single touch handlers.
                var handler = function (event) { return self.touchHandler(event); };
                self._userInterfaceControl.addEventListener("touchstart", handler, true);
                self._userInterfaceControl.addEventListener("touchmove", handler, true);
                self._userInterfaceControl.addEventListener("touchend", handler, true);
                self._userInterfaceControl.addEventListener("touchcancel", handler, true);

                self._userInterfaceControl.addEventListener("MSPointerDown", handler, true);
                self._userInterfaceControl.addEventListener("MSPointerMove", handler, true);
                self._userInterfaceControl.addEventListener("MSPointerUp", handler, true);
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
            if (this.applyConstraints) this._viewer.viewport.applyConstraints(true);
        },
        // Zoom out from the image by a predefined amount.
        zoomOutCommand: function () {
            this._viewer.viewport.zoomBy(.8, null, false);
            if (this.applyConstraints) this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panLeftCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(-this.panDistance / this._viewer.viewport.getZoom(true), 0), false);
            if (this.applyConstraints) this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panRightCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(this.panDistance / this._viewer.viewport.getZoom(true), 0), false);
            if (this.applyConstraints) this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panUpCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(0, -this.panDistance / this._viewer.viewport.getZoom(true)), false);
            if (this.applyConstraints) this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panDownCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(0, this.panDistance / this._viewer.viewport.getZoom(true)), false);
            if (this.applyConstraints) this._viewer.viewport.applyConstraints(true);
        },
        goHomeCommand: function () {
            this._viewer.viewport.goHome(false);
            if (this.applyConstraints) this._viewer.viewport.applyConstraints(true);
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
        panDistance: .2,
        interactionControls: null,
        applyConstraints: true,
        isExplorable: true,
        viewportClampingOptions: { all: "all", letterbox: "letterbox", none: "none" },
        viewportClampingMode: "none"
    };

    rin.util.overrideProperties(DeepZoomES.prototypeOverrides, DeepZoomES.prototype);
    DeepZoomES.keyframeFormat = "<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='{0}' Viewport_Y='{1}' Viewport_Width='{2}' Viewport_Height='{3}'/>";
    DeepZoomES.elementHtml = "<div style='height:100%;width:100%;position:absolute;background:transparent;pointer-events:none;' tabindex='0'><div class='seadragonClip' style='height:100%;width:100%;position:absolute;background:transparent;left:0px;top:0px;overflow:hidden;pointer-events:auto;' tabindex='0'><div class='seadragonClipContents' style='height:333px;width:600px;position:absolute;'><div class='seadragonContainer' style='height:100%;width:100%;position:absolute;' tabindex='0'></div></div></div></div>";
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.OpenSeadragonExperienceStream", function (orchestrator, esData) { return new DeepZoomES(orchestrator, esData); });
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.OpenSeadragonExperienceStream", function (orchestrator, esData) { return new DeepZoomES(orchestrator, esData); });
})(rin);