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
/// <reference path="../core/TaskTimer.js" />

window.rin = window.rin || {};

(function (rin) {
    // ES for displaying 360 degree panoramas.
    var krPanoES = function (orchestrator, esData) {
        krPanoES.parentConstructor.apply(this, arguments);
        var self = this;
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(krPanoES.elementHTML).firstChild;
        this._esData = esData;

        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
        this._panoDivID = "krPanoDiv" + esData.id;
        this._panoDiv = document.createElement("div");
        this._panoDiv.id = this._panoDivID;
        this._panoDiv.style.width = "100%";
        this._panoDiv.style.height = "100%";
        this._userInterfaceControl.appendChild(this._panoDiv);
        this._krPanoViewer = null;
        //this._tryCalculate = false;

        this._html5 = this._esData.data.html5 || "always";
        this._wmode = this._esData.data.wmode || "transparent";
        //Set up defaultKeyframe
        esData.data.defaultKeyframe = esData.data.defaultKeyframe || {
            "state": {
                "KrPanoFOV": 90,
                "krPanoHLookAt": 0,
                "krPanoVLookAt": 0,
                "viewport": {
                    "region": {
                        "center": {
                            "x": 0,
                            "y": 0
                        },
                        "span": {
                            "x": 0,//we ignore span.x (horizontal fov) for now
                            "y": 90
                        }
                    }
                }
            }
        }

        // Check for any interactions on the ES and pause the player.
        this._userInterfaceControl.addEventListener('mousedown', function () {
            self._orchestrator.startInteractionMode();
            //Code to get the world coordinates for a mouse location
            //Don't delete
            //if (self._krPanoViewer && self._krPanoViewer.get && self._tryCalculate) {
            //    var temp = self.getEmbeddedArtifactsProxy();
            //    var pointInWorld = { x: -1, y: -1 };
            //    var pointInScreen = {
            //        x: self._krPanoViewer.get("mouse.x"),
            //        y: self._krPanoViewer.get("mouse.y")
            //    };
            //    temp.convertPointToWorld2D(pointInScreen, pointInWorld);
            //    alert("X: " + pointInWorld.x + " y:" + pointInWorld.y);
            //}
        }, true);
    };

    rin.util.extend(rin.contracts.InterpolatedKeyframeESBase, krPanoES);

    krPanoES.prototypeOverrides = {
        // Load and initialize the ES.
        load: function (experienceStreamId) {
            var self = this;

            this.addSliverInterpolator("viewport", function (sliverId, state) {
                return new rin.Ext.Interpolators.linearViewportInterpolator(state);
            });

            // Call load on parent to init the keyframes.
            krPanoES.parentPrototype.load.call(this, experienceStreamId);

            this.setState(rin.contracts.experienceStreamState.buffering);
            rin.internal.debug.write("Load called for " + this._url);


            function tryLoadPano() {
                var panoDiv = document.getElementById(self._panoDivID);
                if (panoDiv) {
                    var options = {
                        swf: "lib/krPano/krpano.swf",
                        id: self._panoDivID + "Container",
                        xml: self._url,
                        target: self._panoDivID,
                        width: "100%",
                        height: "100%",
                        wmode: self._wmode,
                        html5: self._html5
                    }
                    embedpano(options);
                    self._krPanoViewer = document.getElementById(self._panoDivID + "Container");
                    self.setState(rin.contracts.experienceStreamState.ready);
                }
                else {
                    setTimeout(tryLoadPano, 200);
                }
            }
            tryLoadPano();
        },
        // Pause the ES.
        pause: function (offset, experienceStreamId) {
            // Call pause on parent to sync the keyframes.
            krPanoES.parentPrototype.pause.call(this, offset, experienceStreamId);
        },
        // Display a keyframe.
        // Display a keyframe.
        displayKeyframe: function (keyframeData) {
            //if not ready, do nothing
            if (this.getState() != rin.contracts.experienceStreamState.ready || !keyframeData.state)
                return;
            if (!(typeof this._krPanoViewer.set == "function"))
                return;
            var viewportFOV = keyframeData.state.viewport.region.span.y;
            var viewportHLookAt = keyframeData.state.viewport.region.center.x;
            var viewportVLookAt = keyframeData.state.viewport.region.center.y;
            if (viewportFOV) {
                this._krPanoViewer.set("view.fov", viewportFOV);
            }

            if (viewportVLookAt) {
                this._krPanoViewer.set("view.vlookat", viewportVLookAt);
            }

            if (viewportHLookAt) {
                this._krPanoViewer.set("view.hlookat", viewportHLookAt);
            }

        },
        // Get interaction controls for panorama.
        getInteractionControls: function () {
            var self = this;
            if (!self._interactionControls) {
                self._interactionControls = document.createElement("div");

                self._orchestrator.getInteractionControls([rin.contracts.interactionControlNames.panZoomControl],
                    function (wrappedInteractionControls) {
                        rin.util.assignAsInnerHTMLUnsafe(self._interactionControls, wrappedInteractionControls.innerHTML);
                        ko.applyBindings(self, self._interactionControls);
                    });
            }

            return self._interactionControls;
        },
        // Zoom and pan commands.
        zoomInCommand: function () {
            var oldfov = this._krPanoViewer.get("view.fov");
            this._krPanoViewer.set("view.fov", oldfov * (1 - this._zoomFactor));
        },
        captureKeyframe: function () {
            if (!this._krPanoViewer) return "";
            var hlookat = this._krPanoViewer.get("view.hlookat");
            var vlookat = this._krPanoViewer.get("view.vlookat");
            var fov = this._krPanoViewer.get("view.fov");
            return {
                "state": {
                    "viewport": {
                        "region": {
                            "center": {
                                "x": hlookat,
                                "y": vlookat
                            },
                            "span": {
                                "x": 0,
                                "y": fov
                            }
                        }
                    }
                }
            };
        },

        zoomOutCommand: function () {
            var oldfov = this._krPanoViewer.get("view.fov");
            this._krPanoViewer.set("view.fov", oldfov * (1 + this._zoomFactor));
        },
        panLeftCommand: function () {
            var oldlook = this._krPanoViewer.get("view.hlookat");
            this._krPanoViewer.set("view.hlookat", oldlook + this._panDistance);
        },
        panRightCommand: function () {
            var oldlook = this._krPanoViewer.get("view.hlookat");
            this._krPanoViewer.set("view.hlookat", oldlook  - this._panDistance);
        },
        panUpCommand: function () {
            var oldlook = this._krPanoViewer.get("view.vlookat");
            this._krPanoViewer.set("view.vlookat", oldlook + this._panDistance);
        },
        panDownCommand: function () {
            var oldlook = this._krPanoViewer.get("view.vlookat");
            this._krPanoViewer.set("view.vlookat", oldlook - this._panDistance);
        },

        getEmbeddedArtifactsProxy: function () {
            var provider = this;
            return new function () {
                this.getEmbeddedArtifactsContainer = function () {
                    return provider._userInterfaceControl;
                };
                this.convertPointToScreen2D = function (inPoint, outPoint) {
                    provider._krPanoViewer.set("spherevlookat", inPoint.y);
                    provider._krPanoViewer.set("spherehlookat", inPoint.x);
                    provider._krPanoViewer.call("spheretoscreen(spherehlookat, spherevlookat, screenx, screeny);");
                    outPoint.x = provider._krPanoViewer.get("screenx");
                    outPoint.y = provider._krPanoViewer.get("screeny");
                    return true;
                };
                this.convertPointToWorld2D = function (inPoint, outPoint) {
                    provider._krPanoViewer.set("screeny", inPoint.y);
                    provider._krPanoViewer.set("screenx", inPoint.x);
                    provider._krPanoViewer.call("screentosphere(screenx, screeny,spherehlookat, spherevlookat);");
                    outPoint.x = provider._krPanoViewer.get("spherehlookat");
                    outPoint.y = provider._krPanoViewer.get("spherevlookat");
                    return true;
                };
                this.getScreenDimensions = function (r) {
                    var width = provider._krPanoViewer.get("stagewidth");
                    var height = provider._krPanoViewer.get("stageheight");
                    r.center.x = width / 2;
                    r.center.y = height / 2;
                    r.span.x = width;
                    r.span.y = height;
                };
                //this.convertRegionToScreen2D = function (inRegion, outRegion) {
                //    var centerInScreen = this.convertPointToScreen2D(inRegion.center);
                //    //TODO: Check for crossing the boundaries in hlookat and vlookat
                //    var topLeftInScreen = this.convertPointToScreen2D(
                //        { x: inRegion.center.x - inRegion.span.x * 0.5, y: inRegion.center.y - inRegion.span.y });
                //    var bottomRightInScreen = this.convertPointToScreen2D(
                //        { x: inRegion.center.x + inRegion.span.x * 0.5, y: inRegion.center.y + inRegion.span.y });
                //    outRegion.center.x = (topLeftInScreen.x + bottomRightInScreen.x) * 0.5;
                //    outRegion.center.y = (topLeftInScreen.y + bottomRightInScreen.y) * 0.5;
                //    outRegion.span.x = (bottomRightInScreen.x - topLeftInScreen.x);
                //    if (outRegion.span.x < 0)
                //        outRegion.span.x *= -1.0;
                //    outRegion.span.y = (bottomRightInScreen.y - topLeftInScreen.y);
                //    if (outRegion.span.y < 0)
                //        outRegion.span.y *= -1.0;

                //    return true;
                //};
                //this.convertRegionToWorld2D = function (inRegion, outRegion) {
                //    var centerInScreen = this.convertScreenToPoint2D(inRegion.center);
                //    //TODO: Check for crossing the boundaries in hlookat and vlookat
                //    var topLeftInScreen = this.convertScreenToPoint2D(
                //        { x: inRegion.center.x - inRegion.span.x * 0.5, y: inRegion.center.y - inRegion.span.y });
                //    var bottomRightInScreen = this.convertScreenToPoint2D(
                //        { x: inRegion.center.x + inRegion.span.x * 0.5, y: inRegion.center.y + inRegion.span.y });
                //    outRegion.center.x = (topLeftInScreen.x + bottomRightInScreen.x) * 0.5;
                //    outRegion.center.y = (topLeftInScreen.y + bottomRightInScreen.y) * 0.5;
                //    outRegion.span.x = (bottomRightInScreen.x - topLeftInScreen.x);
                //    if (outRegion.span.x < 0)
                //        outRegion.span.x *= -1.0;
                //    outRegion.span.y = (bottomRightInScreen.y - topLeftInScreen.y);
                //    if (outRegion.span.y < 0)
                //        outRegion.span.y *= -1.0;

                //    return true;
                //};
            };
        },
        _viewer: null,
        _interactionControls: null,
        _zoomFactor: .2,
        _panDistance: 10,
        _html5: null,
        _wmode: null,
        isExplorable: true
    };

    krPanoES.elementHTML = "<div style='height:100%;width:100%;background-color:black;position:absolute;'></div>";
    rin.util.overrideProperties(krPanoES.prototypeOverrides, krPanoES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.krPanoExperienceStream", function (orchestrator, esData) { return new krPanoES(orchestrator, esData); });
})(rin);
