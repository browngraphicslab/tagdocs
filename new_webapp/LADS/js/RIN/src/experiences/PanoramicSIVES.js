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
    // ES for displaying 360 degree panoramas using the SharedImmersiveViewer(SIV)
    var SharedImmersiveViewerES = function (orchestrator, esData) {
        SharedImmersiveViewerES.parentConstructor.apply(this, arguments);
        var self = this;
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(SharedImmersiveViewerES.elementHTML).firstChild;
        this._esData = esData;

        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);

        // Check for any interactions on the ES and pause the player.
        $(this._userInterfaceControl).bind("mousedown mousewheel", function (e) {
            self._orchestrator.startInteractionMode();
            self._userInterfaceControl.focus();
        });

        
        //Set up defaultKeyframe
        esData.data = esData.data || {};
        esData.data.defaultKeyframe = esData.data.defaultKeyframe || {
            "state": {
                "viewport": {
                    "region": {
                        "center": {
                            "x": 1,
                            "y": 0.1
                        },
                        "span": {
                            "x": 0,//we ignore span.x (horizontal fov) for now
                            "y": 0.6
                        }
                    }
                }
            }
        };

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


    };

    rin.util.extend(rin.contracts.InterpolatedKeyframeESBase, SharedImmersiveViewerES);

    SharedImmersiveViewerES.prototypeOverrides = {
        // Load and initialize the ES.
        load: function (experienceStreamId) {
            var self = this;

            this.addSliverInterpolator("viewport", function (sliverId, state) {
                return new rin.Ext.Interpolators.linearViewportInterpolator(state);
            });

            // Call load on parent to init the keyframes.
            SharedImmersiveViewerES.parentPrototype.load.call(self, experienceStreamId);

            this.setState(rin.contracts.experienceStreamState.buffering);
            rin.internal.debug.write("Load called for " + this._url);

            // dispose previous viewer if it exists
            if (this._viewer) {
                this._viewer.dispose();
            }
            // Extract the cid of the pano from the url
            var cidStartIndex = self._url.indexOf("cid=");

            if (cidStartIndex > 0) {
                rin.internal.debug.write("createFromCid() has been deprecated");
                self.setState(rin.contracts.experienceStreamState.error);
            }
            else {
                this._createSIV();
            }
        },
        // Pause the ES.
        pause: function (offset, experienceStreamId) {
            // Call pause on parent to sync the keyframes.
            SharedImmersiveViewerES.parentPrototype.pause.call(this, offset, experienceStreamId);
        },
        // Display a keyframe.
        displayKeyframe: function (keyframeData) {
            //if not ready, do nothing
            if (this.getState() != rin.contracts.experienceStreamState.ready || !keyframeData.state)
                return; 
            var viewportFOV = keyframeData.state.viewport.region.span.y; //we will ignore the span.x (horizontal FOV)
            var viewportHeading = keyframeData.state.viewport.region.center.x;
            var viewportPitch = keyframeData.state.viewport.region.center.y;

            this._viewer.setView(isNaN(viewportPitch) ? null : viewportPitch,
                           isNaN(viewportHeading) ? null : viewportHeading,
                           isNaN(viewportFOV) ? null : viewportFOV,
                           false /*animate*/,
                           null /*time*/);
        },

        // Helper method to create a viewer using the SIV PanoramaViewer
        _createSIV: function () {
            var self = this;
            var dataSource = new Microsoft.ImmersiveViewer.PhotosynthSivDataSource();
            var dataSources = [];
            dataSources.push(dataSource);
            var getAbsoluteUrl;
            var useNewFormat = false;
            dataSource.createFromJsonUri(self._url, instantiateViewer, getAbsoluteUrl, useNewFormat, useNewFormat);
            function instantiateViewer(worldConfiguration, error) {
                if (worldConfiguration == null) {
                    if (error instanceof JsonDownloadFailedError) {
                        //Failed to download
                        alert("JsonDownloadFailedError");
                        rin.internal.debug.write('json failed to download');
                    }
                    else if (error instanceof JsonMalformedError) {
                        alert("JsonMalformedError");
                        //Failed to parse the response of the json request
                        rin.internal.debug.write('json was malformed');
                    }
                    else {
                        alert(error);
                        //Some other unknown error.
                        rin.internal.debug.write('unknown error when attempting to download json');
                    }
                    self.setState(rin.contracts.experienceStreamState.error);
                }
                else {
                    self._viewer = new Microsoft.ImmersiveViewer.SharedImmersiveViewer(self._userInterfaceControl, {
                        dataSources: dataSources,
                        renderer: 'Canvas2D',
                        backgroundColor: null,
                        width: 400, 
                        height: 400,
                    });

                    // signal to RIN that we are ready
                    self.setState(rin.contracts.experienceStreamState.ready);

                    // Keep updating the viewer size to its parent size. Using below method as onresize if not fired on div consistantly on all browsers
                    // TODO: May be there is a better approach?
                    setInterval(function () {
                        if (self._viewer.width !== self._userInterfaceControl.offsetWidth ||
                            self._viewer.height !== self._userInterfaceControl.offsetHeight) {

                            self._viewer.width = self._userInterfaceControl.offsetWidth;
                            self._viewer.height = self._userInterfaceControl.offsetHeight;

                            self._viewer.setViewportSize(self._userInterfaceControl.offsetWidth, self._userInterfaceControl.offsetHeight);
                        };
                    }, 300); // using 300 so that its not too slow nor too fast to eat up cpu cycles

                }
            }

        },

        _viewer: null,

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
            var newfov = Math.max(.05, this._viewer.getVerticalFov() * (1 - this._zoomFactor));
            this._viewer.setVerticalFov(newfov, true);
        },
        zoomOutCommand: function () {
            var newfov = Math.max(.05, this._viewer.getVerticalFov() * (1 + this._zoomFactor));
            this._viewer.setVerticalFov(newfov, true);
        },
        panLeftCommand: function () {
            var newHeading = this._viewer.getHeading() - (this._panDistance * this._viewer.getVerticalFov());
            this._viewer.setHeading(newHeading, true);
        },
        panRightCommand: function () {
            var newHeading = this._viewer.getHeading() + (this._panDistance * this._viewer.getVerticalFov());
            this._viewer.setHeading(newHeading, true);
        },
        panUpCommand: function () {
            var newPitch = this._viewer.getPitch() + (this._panDistance * this._viewer.getVerticalFov());
            this._viewer.setPitch(newPitch, true);
        },
        panDownCommand: function () {
            var newPitch = this._viewer.getPitch() - (this._panDistance * this._viewer.getVerticalFov());
            this._viewer.setPitch(newPitch, true);
        },

        _interactionControls: null,
        _zoomFactor: .2,
        _panDistance: .3
    };

    SharedImmersiveViewerES.elementHTML = "<div style='height:100%;width:100%;background-color:black;position:absolute;'></div>";
    rin.util.overrideProperties(SharedImmersiveViewerES.prototypeOverrides, SharedImmersiveViewerES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.PanoramicImmersiveViewerExperienceStream", function (orchestrator, esData) { return new SharedImmersiveViewerES(orchestrator, esData); });
})(rin);
