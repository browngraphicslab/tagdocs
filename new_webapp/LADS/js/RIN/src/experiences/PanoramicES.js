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
    var PanoramicES = function (orchestrator, esData) {
        PanoramicES.parentConstructor.apply(this, arguments);
        var self = this;
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(PanoramicES.elementHTML).firstChild;
        this._panoPlaceHolder = $(".panoHolder", this._userInterfaceControl)[0];

        this._panoHintTimeoutId = null;
        this._panoHint = $(this._userInterfaceControl).find('.panoHint');

        this._esData = esData;
        this._esData.data = this._esData.data || {};

        this._skipPanoHint = false;

        if (!isLowEndMachine && typeof esData.data.showLowerFidelityWhileMoving != "undefined") {
            // Always use low fidility images while moving if running on iPad or Surface RT
            var isLowEndMachine = window.navigator.userAgent.indexOf("iPad;") > -1 || window.navigator.userAgent.indexOf("ARM;") > -1;
            if (!isLowEndMachine)
                this._lowFidilityWhileMoving = esData.data.showLowerFidelityWhileMoving;
        }

        if (typeof esData.data.minFieldOfView != "undefined")
            this._minFieldOfView = esData.data.minFieldOfView;

        if (typeof esData.data.interpolatorType != "undefined")
            this._interpolatorType = esData.data.interpolatorType;
        else
            this._interpolatorType = "linear";

        if (typeof esData.data.enforceViewLimits != "undefined")
            this._enforceViewLimits = esData.data.enforceViewLimits;

        if ((typeof esData.data.smoothTransitions != "undefined") && esData.data.smoothTransitions)
            this.overrideTransientTrajectoryFunction = true;

        if (typeof esData.data.viewShrinkFactor != "undefined")
            this._viewShrinkFactor = esData.data.viewShrinkFactor;

        if (typeof esData.data.transitionDurationOverrides != "undefined") {
            this._durationScaleOverride = esData.data.transitionDurationOverrides.durationScaleOverride;
            this._transitionPauseDurationInSec = esData.data.transitionDurationOverrides.transitionPauseDurationInSec;
            if (typeof esData.data.transitionDurationOverrides.simplePathOnly != "undefined")
            {
                this._simplePathOnly = esData.data.transitionDurationOverrides.simplePathOnly;
            }
        }

        // Load the defaults for adaptive transitions
        var adaptiveDataOverride = this._orchestrator.getResourceResolver().resolveData("R-DefaultAdaptiveTransitionProfile", this._esData.id);
        if (adaptiveDataOverride)
        {
            if (adaptiveDataOverride.durationScaleOverride != undefined) {
                this._adaptiveDurationScaleOverride = adaptiveDataOverride.durationScaleOverride;
            }
            if (adaptiveDataOverride.capAdaptiveOffset != undefined) {
                this._capAdaptiveOffset = adaptiveDataOverride.capAdaptiveOffset;
            }
            if (adaptiveDataOverride.maxAdaptiveDuration != undefined) {
                this._maxAdaptiveDuration = adaptiveDataOverride.maxAdaptiveDuration;
            }
            else
                this._maxAdaptiveDuration = -1;
        }


        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);

        // Check for any interactions on the ES and pause the player.
        // Clicking on EAs cause mousedown and interaction mode to start. Ignore mousedown for now.
        $(this._panoPlaceHolder).bind("MSPointerDown mousedown mousewheel", function (e) {
            //Code to get the world coordinates for a mouse location
            //Don't delete
            //if (self._viewer && self._tryCalculate) {
            //    var temp = self.getEmbeddedArtifactsProxy();
            //    var pointInWorld = { };
            //    var pointInScreen = {
            //        x: e.screenX,
            //        y: e.screenY
            //    };
            //    temp.convertPointToWorld2D(pointInScreen, pointInWorld);
            //    alert("X: " + pointInWorld.x + " y:" + pointInWorld.y);
            //}
            
            if (self._isInResumeFromMode)
                return;

            self._panoHint.fadeOut(250);
            if (self._panoHintTimeoutId) {
                clearTimeout(self._panoHintTimeoutId);
                self._panoHintTimeoutId = null;
            }

            self._orchestrator.startInteractionMode();
            self._userInterfaceControl.focus();
        });
        
        
        //Set up defaultKeyframe
        this._esData.data.defaultKeyframe = this._esData.data.defaultKeyframe || {
            "state": {
                "viewport": {
                    "region": {
                        "center": {
                            "x": 1,
                            "y": 0.1
                        },
                        "span": {
                            "x": 0,
                            "y": 0.6
                        }
                    }
                }
            },
            offset: 0
        };
        this._esData.data.defaultKeyframe.offset = 0; //In case it was not set already
        this.updateEA = null;
    };

    rin.util.extend(rin.contracts.InterpolatedKeyframeESBase, PanoramicES);

    PanoramicES.prototypeOverrides = {
        // Load and initialize the ES.
        load: function (experienceStreamId) {
            var self = this;

            this.addSliverInterpolator("viewport", function (sliverId, state) {
                if (self._interpolatorType)
                {
                    switch (self._interpolatorType)
                    {
                        case "vectorBased":
                            return new rin.Ext.Interpolators.viewportInterpolator2D(state, self._interpolatorType);
                        case "linear":
                        default:
                            return new rin.Ext.Interpolators.linearViewportInterpolator(state);
                            break;
                    }
                }
                else
                    return new rin.Ext.Interpolators.linearViewportInterpolator(state);
            });


            // Call load on parent to init the keyframes.
            PanoramicES.parentPrototype.load.call(self, experienceStreamId);

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
                // fetch the rml that defines the panoramic view
                PhotosynthRml.createFromJsonUri(self._url, function (rml, error) {
                    if (rml) {
                        setTimeout(function () {
                            self._createViewer(rml);
                            self._viewer.disableRendering();

                            // ES will be set to ready when a minimum amount of data is pre rendered.
                            self._doPreRender();

                            if (!self._esData.experienceStreams[experienceStreamId] ||
                                !self._esData.experienceStreams[experienceStreamId].keyframes ||
                                !self._esData.experienceStreams[experienceStreamId].keyframes.length) {
                                if (self._esData.data.defaultKeyframe) {
                                    // When there are no keyframes, we want to set the view on the pano viewer
                                    // to the default keyframe once. However setting it once is not working
                                    // hence the following hack to force a view update
                                    // TODO: need to investigate to find a simpler way to set the view once

                                    var kf2 = rin.util.deepCopy(self._esData.data.defaultKeyframe);
                                    kf2.state.viewport.region.center.x += 0.1;
                                    kf2.state.viewport.region.center.y += 0.1;
                                    self.displayKeyframe(kf2);
                                    setTimeout(function () {
                                        self.displayKeyframe(self._esData.data.defaultKeyframe);
                                    }, 300);
                                }
                            }
                        }, 500);
                    }
                    else {
                        if (error instanceof JsonDownloadFailedError) {
                            //Failed to download
                            rin.internal.debug.write('json failed to download');
                        }
                        else if (error instanceof JsonMalformedError) {
                            //Failed to parse the response of the json request
                            rin.internal.debug.write('json was malformed');
                        }
                        else {
                            //Some other unknown error.
                            rin.internal.debug.write('unknown error when attempting to download json');
                        }
                        self.setState(rin.contracts.experienceStreamState.error);
                    }
                });
            }
        },

        _doPreRender: function () {
            // skip pre render for now as its WIP
            this.setState(rin.contracts.experienceStreamState.ready);
            return;

            var keyframesToLoad = this.getKeyframes(0, 10, 0.2);
            var camController = this._viewer.getActiveCameraController();
            var allTiles = {}, downloadQueue = new Array();
            var loadedCount = 0, totalCount = 0, failedCount = 0, allTilesAdded = false;
            var images = new Array();
            var self = this;

            for (var i = 0; i < keyframesToLoad.length; i++) {
                var keyframeData = keyframesToLoad[i];
                // set camera params
                var viewportFOV = keyframeData.state.viewport.region.span.y;
                var viewportHeading = keyframeData.state.viewport.region.center.x;
                var viewportPitch = keyframeData.state.viewport.region.center.y;

                camController.setVerticalFov(viewportFOV, false);
                camController.setPitchAndHeading(viewportPitch, viewportHeading, false);

                var tmpTiles = this._viewer.downloadAll("panorama", [0.9, 1.2], function () { }, function () { }, false, camController._camera);

                for (var ti in tmpTiles) {
                    if (!allTiles[ti]) {
                        allTiles[ti] = tmpTiles[ti];
                        //downloadQueue.push(url);
                        totalCount++;
                    }
                }

                allTilesAdded = true;
            }
            //alert(totalCount);

            // download all
            var loadComp = function () {
                loadedCount++;
                if (allTilesAdded && loadedCount >= totalCount) {
                    //alert("preload complete. " + failedCount);
                    self.setState(rin.contracts.experienceStreamState.ready);
                }
            };
            
            var loadFailed = function () {
                failedCount++;
                loadComp();
            };

            var checkDownloadStatus = function () {
                if (allTilesAdded && loadedCount >= totalCount) {
                    //alert("preload complete. " + failedCount);
                    self.setState(rin.contracts.experienceStreamState.ready);
                } else {
                    setTimeout(checkDownloadStatus, 300);
                }
            };

            for (var i in allTiles) {
                var img = new Image();
                img.onload = loadComp;
                img.onerror = loadFailed;
                img.src = allTiles[i].url;
            }
        },

        // Pause the ES.
        pause: function (offset, experienceStreamId) {
            // Call pause on parent to sync the keyframes.
            PanoramicES.parentPrototype.pause.call(this, offset, experienceStreamId);
        },
        // Display a keyframe.
        displayKeyframe: function (keyframeData) {
            //if not ready, do nothing
            if (this.getState() != rin.contracts.experienceStreamState.ready || !keyframeData.state)
                return; 
            var viewportFOV = keyframeData.state.viewport.region.span.y; //we will ignore the span.x (horizontal FOV)
            var viewportHeading = keyframeData.state.viewport.region.center.x;
            var viewportPitch = keyframeData.state.viewport.region.center.y;
            
            this._setCamera({ "fov": viewportFOV, "heading": viewportHeading, "pitch": viewportPitch, "animate": false });
        },

        addedToStage: function() {
            if (this._viewer) {
                this._viewer.enableRendering();
                this.showPanoHint();
            } else {
                var self = this;
                setTimeout(function () {
                    self.addedToStage();
                },300);
            }
        },

        // show a pano hint once per session
        showPanoHint: function() {

            // fetch the flag from session storage
            try {
                this._skipPanoHint = (sessionStorage.getItem('rin.skipPanoHint') === 'true');
            }
            catch (ex) {
                // ignore exceptions that can occur when session storage is disabled
            }

            if (!this._skipPanoHint) {

                this._skipPanoHint = true;

                try {
                    sessionStorage.setItem('rin.skipPanoHint', 'true');
                }
                catch (ex) {
                    // ignore exceptions that can occur when session storage is disabled
                }

                // store fade in callback id so it can be cancelled if needed
                this._panoHintTimeoutId = setTimeout($.proxy(function() {
                    this._panoHint.fadeIn(500);

                    // create callback to fade out hint
                    this._panoHintTimeoutId = setTimeout($.proxy(function() {
                        this._panoHint.fadeOut(1000);
                        this._panoHintTimeoutId = null;
                    }, this), 3500);

                }, this), 1500);
            }
        },

        removedFromStage: function() {
            if (this._viewer) {
                this._viewer.disableRendering();
            }
            this._playCalled = false; //treat the next play call as first one
        },

        pickStartHeadingToTakeShortestPath : function (source, target) {
            //Always want to take the shortest path between the source and the target i.e. if source
            //is 10 degrees and target is 350 degrees we want to travel 20 degrees not 340
            if (Math.abs(target - source) > Math.PI) {
                if (source < target) {
                    return source + Math.PI * 2.0;
                }
                else {
                    return source - Math.PI * 2.0;
                }
            }
            else {
                return source;
            }
        },


        // We handle many different cases here:
        // We check any transitionType specified on the ES
        // Case A: No transitionType specified. this was called from "UpNext" button. Here we will 
        //              - target frame = view of the experienceStream at the given offset
        //              - check if we are close to the target frame, if so then just call seekUrl directly and return
        //              - else call animateToPose to get to the target view
        //              - in the callback from animateToPose, check if the animation was completed, if not then do nothing more
        //              - if animation completed successfully, then we pause for _transitionPauseDurationInSec seconds
        //              - call seekUrl to proceed with the actual transition.
        // Case B: "noZoomOut" case we treat this to be a special kind of transition
        //         here we expect the es to have a single keyframe, it will be the final view of the transition in this ES before moving on 
        //         to the next ES in the transition screenplay. We compare the FOV of the target keyframe with the current FOV.
        //         Case B.1 if current view is a zoomed-out view compared to the target keyframe, then 
        //              - we will use animateToPose to get to the target keyframe (expecting that animateToPose doesnt cause a zoom-out)
        //              - in the callback from animateToPose, we will not add any extra pause and call seekUrl to proceed with the actual transition.
        //         Case B.2 else the current view is a zoomed-in view compared to the target keyframe.
        //              - we skip calling the animateToPose to get to the target keyframe (because it will cause a zoom-out which we don't want)
        //              - immediately call seekUrl to proceed with the actual transition
        //Case C: "noAnimation" - since no animation is to be run, we call seekUrl right away
        //Case D: "fastZoom" - we will always call animateToPose to get to the first keyframe of the ES, we want to get there fast, 
        //         so we set the durationscaleoverride to 1, and transitionDuration to 0 sec, simplePathOnly = true
        // Case E: "adaptiveFirstDuration" - here we will not call animateToPose here, but instead later on in the trajectory adjust the offset 
        //          of second keyframe to a reasonable value depending on the current view and view of the second keyframe 
        resumeFrom: function (offset, experienceStreamId, seekUrl) {
            var self = this;
            var experienceStreamData = self._esData.experienceStreams[experienceStreamId];
            //Check the flags on ES 
            if (!experienceStreamData || experienceStreamData.transitionType == "noAnimation" || experienceStreamData.transitionType == "adaptiveFirstDuration") {
                //Case C or E above
                // no animation so call seekUrl right away
                self._orchestrator.seekUrl(seekUrl);
                return;
            }

            self._orchestrator.onESEvent(rin.contracts.esEventIds.resumeTransitionEvent, { transitionState: "started" });

            //Check if the transitionDurationoverrides are mentioned in the given experiencestream as well. If so, we will use those instead
            // of the defaults for this experience.
            var esTransitionOverrides = experienceStreamData.transitionDurationOverrides;
            var transitionPause = (esTransitionOverrides && esTransitionOverrides.transitionPauseDurationInSec != undefined) ? esTransitionOverrides.transitionPauseDurationInSec :
                self._transitionPauseDurationInSec;
            var durationScaleOverride = ( esTransitionOverrides && esTransitionOverrides.durationScaleOverride != undefined)? esTransitionOverrides.durationScaleOverride :
                self._durationScaleOverride;
            var simplePathOnly = (esTransitionOverrides && esTransitionOverrides.simplePathOnly != undefined) ? esTransitionOverrides.simplePathOnly :
                self._simplePathOnly;
            var noZoomOutDuringTransition = false;
            if (experienceStreamData.transitionType == "noZoomOut")
            {
                noZoomOutDuringTransition = true;
            }
            else if (experienceStreamData.transitionType == "fastZoom") {
                // Case D above
                //TODO Read these values from a data object from the resourceTable
                transitionPause = 0;
                durationScaleOverride = 1;
                simplePathOnly = true;
            }

            var callback = function (completed) {
                if (completed) {
                    if (noZoomOutDuringTransition || transitionPause < 1E-5) {
                        //No pause will be added. Call the seekUrl immediately
                        self._isInResumeFromMode = false;
                        self._orchestrator.seekUrl(seekUrl);
                    }
                    else {
                        //Add a short pause before we will launch the transition
                        setTimeout(function () {
                            self._isInResumeFromMode = false;
                            self._orchestrator.seekUrl(seekUrl);
                        }, transitionPause * 1000);
                    }
                }
                else {
                    // completed == false, animateToPose was not completed / it was interrupted, do nothing further.
                    self._isInResumeFromMode = false;
                    self._orchestrator.onESEvent(rin.contracts.esEventIds.resumeTransitionEvent, { transitionState: "interrupted" });
                }
            }.bind(this);

            if (this._viewer) {
                var targetKeyframe = this.getKeyframeAt(offset, experienceStreamId);
                var viewportFOV = targetKeyframe.state.viewport.region.span.y; //we will ignore the span.x (horizontal FOV)
                var viewportHeading = targetKeyframe.state.viewport.region.center.x;
                var viewportPitch = targetKeyframe.state.viewport.region.center.y;

                // Figure out if animateToPose needs to be called at all

                var currentKF = this.captureKeyframe();
                if (currentKF) {
                    var currentFOV = currentKF.state.viewport.region.span.y; //we will ignore the span.x (horizontal FOV)

                    if (noZoomOutDuringTransition) {
                        // Case B above
                        if (viewportFOV < currentFOV) {
                            // Case B.1 above
                            // Call animateToPose
                            this._isInResumeFromMode = true;
                            this._viewer.getActiveCameraController().animateToPose(viewportPitch, viewportHeading, viewportFOV, callback, simplePathOnly, durationScaleOverride);
                            return;
                        }
                        else {
                            // Case B.2 above
                        }
                    }
                    else {
                        // Case A above
                        var sourceHeading = this.pickStartHeadingToTakeShortestPath(currentKF.state.viewport.region.center.x, viewportHeading)
                        var headingDiff = Math.abs(sourceHeading - viewportHeading);
                        var pitchDiff = Math.abs(currentKF.state.viewport.region.center.y - viewportPitch);
                        var fovDelta = Math.min(currentFOV, viewportFOV) / Math.max(currentFOV, viewportFOV);
                        var tendegreesInRadian = 10.0 * Math.PI / 180.0; // TODO: take into account screen resolution
                        if ((experienceStreamData.transitionType == "fastZoom") || Math.abs(fovDelta - 1.0) > 0.1 || headingDiff > tendegreesInRadian || pitchDiff > tendegreesInRadian) {
                            // Current view is NOT very close to the target view, call animateToPose and call the seekUrl in the callback
                            this._isInResumeFromMode = true;
                            this._viewer.getActiveCameraController().animateToPose(viewportPitch, viewportHeading, viewportFOV, callback, simplePathOnly, durationScaleOverride);
                            return;
                        }
                    }
                }
            }
            // animateToPose was not called, just call the seekUrl right away
            self._isInResumeFromMode = false;
            self._orchestrator.seekUrl(seekUrl);
        },

        // Set the camera parameters.
        _setCamera: function (data) {
            var cameraController = this._viewer.getActiveCameraController();

            cameraController.setVerticalFov(data.fov, data.animate);
            cameraController.setPitchAndHeading(data.pitch, data.heading, data.animate);
        },
        _viewer: null,
        // Create a pano viewer instance from the given rml.
        _createViewer: function (rml) {
            var self = this;            
            var cameraParams = {

                // **Start** Default values taken from pano-viewer.js 
                verticalFov: 80 * (Math.PI / 180), // degrees to radians
                position: { x: 0, y: 0, z: 0 },
                look: { x: 0, y: 0, z: -1 },
                //Use the following for testing a more general initial view
                //look: (new Vector3(-1, 0, -1)).normalize(),
                up: { x: 0, y: 1, z: 0 },
                side: { x: 1, y: 0, z: 0 },
                // **End** Default values taken from pano-viewer.js 

                leftBoundFactor: self._viewShrinkFactor,
                rightBoundFactor: self._viewShrinkFactor,
                topBoundFactor: self._viewShrinkFactor,
                bottomBoundFactor: self._viewShrinkFactor,
                minClientPreferredFieldOfView: self._minFieldOfView,
                enforceViewLimits: self._enforceViewLimits
            };
            this._viewer = new RwwViewer(this._panoPlaceHolder, {
                rml: rml,
                tileDownloadFailed: function (failCount, succeedCount) {
                    var total = failCount + succeedCount;
                    if (total > 4 && failCount > succeedCount) {
                        rin.internal.debug.write('tile download failures are high');
                    }
                },
                width: this._userInterfaceControl.offsetWidth,
                height: this._userInterfaceControl.offsetHeight,

                // OPTIONAL param.  Defaults to black with full opacity.
                // example: backgroundColor: { r: 0.4, g: 0.4, b: 0.4, a: 1},
                backgroundColor: rin.defaults.panoBackgroundColor,

                // OPTIONAL param.  Defaults to 'webgl' if available on the current
                // browser, else 'css'.  At the moment, it needs to be 'css', because
                // the imagery won't show in 'webgl' until we make some changes to the
                // HTTP response headers.
                renderer: 'css',
                cameraParameters: cameraParams,
                animating: false
            });
            this._viewer.setShowLowerFidelityWhileMoving(this._lowFidilityWhileMoving);
            var cameraController = this._viewer.getActiveCameraController();
            cameraController.viewChangeCallback = function () {
                if (self.updateEA != null)
                    self.updateEA();
            }
            

            // Keep updating the viewer size to its parent size. Using below method as onresize if not fired on div consistantly on all browsers
            // TODO: May be there is a better approach?
            self._updateInterval = setInterval(function () {
                if (self._viewer.width !== self._userInterfaceControl.offsetWidth ||
                    self._viewer.height !== self._userInterfaceControl.offsetHeight) {

                    self._viewer.width = self._userInterfaceControl.offsetWidth;
                    self._viewer.height = self._userInterfaceControl.offsetHeight;

                    self._viewer.setViewportSize(self._userInterfaceControl.offsetWidth, self._userInterfaceControl.offsetHeight);
                };
            }, 300); // using 300 so that its not too slow nor too fast to eat up cpu cycles
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
            var cameraController = this._viewer.getActiveCameraController();
            cameraController.setVerticalFov(Math.max(.05, cameraController.getVerticalFov() * (1 - this._zoomFactor)), true);
        },
        zoomOutCommand: function () {
            var cameraController = this._viewer.getActiveCameraController();
            cameraController.setVerticalFov(Math.min(2, cameraController.getVerticalFov() * (1 + this._zoomFactor)), true);
        },
        panLeftCommand: function () {
            var cameraController = this._viewer.getActiveCameraController();
            var currentPitchAndHeading = cameraController.getPitchAndHeading();
            cameraController.setPitchAndHeading(currentPitchAndHeading[0], currentPitchAndHeading[1] - (this._panDistance * cameraController.getVerticalFov()), true);
        },
        panRightCommand: function () {
            var cameraController = this._viewer.getActiveCameraController();
            var currentPitchAndHeading = cameraController.getPitchAndHeading();
            cameraController.setPitchAndHeading(currentPitchAndHeading[0], currentPitchAndHeading[1] + (this._panDistance * cameraController.getVerticalFov()), true);
        },
        panUpCommand: function () {
            var cameraController = this._viewer.getActiveCameraController();
            var currentPitchAndHeading = cameraController.getPitchAndHeading();
            cameraController.setPitchAndHeading(currentPitchAndHeading[0] + (this._panDistance * cameraController.getVerticalFov()), currentPitchAndHeading[1], true);
        },
        panDownCommand: function () {
            var cameraController = this._viewer.getActiveCameraController();
            var currentPitchAndHeading = cameraController.getPitchAndHeading();
            cameraController.setPitchAndHeading(currentPitchAndHeading[0] - (this._panDistance * cameraController.getVerticalFov()), currentPitchAndHeading[1], true);
        },

        // From pano-viewer.js
        convertHorizontalToVerticalFieldOfView: function(width, height, fov) {
            var focalLength = 0.5 / Math.tan(fov * 0.5);
            var aspectRatio = width/height;
            return 2 * Math.atan((0.5 * 1.0 / aspectRatio) / focalLength);
        },

        convertVerticalToHorizontalFieldOfView: function(width, height, fov) {
            var aspectRatio = width/height;
            var focalLength = (0.5 * 1.0 / aspectRatio) / Math.tan(fov * 0.5);
            return 2 * Math.atan(0.5 / focalLength);
        },

        captureKeyframe: function () {
            if (!this._viewer) return "";
            var cameraController = this._viewer.getActiveCameraController();
            var currentPitchAndHeading = cameraController.getPitchAndHeading();
            var fov = cameraController.getVerticalFov();
            if (fov && currentPitchAndHeading && !isNaN(fov) && !isNaN(currentPitchAndHeading[0]) && !isNaN(currentPitchAndHeading[1])) {
                var size = this._viewer.getViewportSize();
                var horizontalfov = this.convertVerticalToHorizontalFieldOfView(size.x, size.y, fov);
                var normalizedZoom = 1.0/fov;
                return {
                    "state": {
                        "viewport": {
                            "region": {
                                "center": {
                                    "x": currentPitchAndHeading[1],
                                    "y": currentPitchAndHeading[0]
                                },
                                "span": {
                                    "x": horizontalfov,
                                    "y": fov
                                }
                            },
                            "normalizedZoom": normalizedZoom
                        }
                    }
                };
            }
            else {
                return null;
            }
        },

        getEmbeddedArtifactsProxy: function (layoutEngine) {
            var provider = this;
            this.updateEA = function () { layoutEngine.render({}); };
            return new function () {
                this.getEmbeddedArtifactsContainer = function () {
                    return provider._userInterfaceControl;
                };
                this.convertPointToScreen2D = function (inPoint, outPoint) {
                    var heading = inPoint.x;
                    var pitch = inPoint.y;
                    var cameraController = provider._viewer.getActiveCameraController();
                    var pointInScreen2D = cameraController.tryPitchHeadingToPixel(pitch, heading);
                    if (!pointInScreen2D || pointInScreen2D.x == NaN || pointInScreen2D.y == NaN)
                        return false;
                    outPoint.x = pointInScreen2D.x;
                    outPoint.y = pointInScreen2D.y;
                    return true;
                };
                this.convertPointToWorld2D = function (inPoint, outPoint) {
                    var cameraController = provider._viewer.getActiveCameraController();
                    var pointInWorld2D = cameraController.tryPixelToPitchHeading(inPoint);
                    outPoint.x = pointInWorld2D.heading;
                    outPoint.y = pointInWorld2D.pitch;
                    return true;
                };
                this.getScreenDimensions = function (r) {
                    var width = provider._viewer.width;
                    var height = provider._viewer.height;
                    r.center.x = width / 2;
                    r.center.y = height / 2;
                    r.span.x = width;
                    r.span.y = height;
                };
                this.currentNormalizedZoom = function () {
                    // TODO - this is not normalized zoom! Both here and in reporting keyframes, we must use the right value.
                    // TODO - how expensive are these operations? If needed we may need to call them less often from EA system.
                    var cameraController = provider._viewer.getActiveCameraController();
                    var fov = cameraController.getVerticalFov();
                    if (typeof fov === "number" && fov > 1.0E-10) {
                        return 1.0 / fov;
                    } else {
                        return NaN;
                    }
                };
            };
        },
        // Unload the ES.
        unload: function () {
            if (this._updateInterval) clearInterval(this._updateInterval);
            if (this._viewer) {
                this._viewer.dispose();
            }
        },

        calculateAdaptiveOffset : function (firstKf, secondKf, experienceStream)
        {
            // adaptiveOffset = firstKf.offset + adaptiveDuration. 

            var duration = this.calculateAdaptiveDuration(firstKf, secondKf, experienceStream);
            var retval = secondKf.offset;
            if (duration >= 0) {
                retval = this._capAdaptiveOffset ? Math.min(secondKf.offset, firstKf.offset + duration) : firstKf.offset + duration;
            }
            return retval;
        },

        /* TODO: remove this 
        calculateAdaptiveOffset: function (firstKf, secondKf, experienceStream) {
            //We would like to adjust the offset of the second keyframe so that it takes reasonable amount of
            // time to get to it depending on the views in firstKf and secondKf

            //TODO: look for a profile, and for overrides for transitions on that profile

            // Following calculation is based on panoviewer's ballisticPath duration calculation for simple paths
            var MIN_DURATION = 0.5;
            var firstRegion = firstKf.state.viewport.region;
            var secondRegion = secondKf.state.viewport.region;
            var firstFov = firstRegion.span.y;
            var secondFov = secondRegion.span.y;
            var maxFov = Math.max(firstFov, secondFov);
            var minFov = Math.min(firstFov, secondFov);

            var pitch1 = firstRegion.center.y;
            var pitch2 = secondRegion.center.y;
            var heading2 = secondRegion.center.x;
            var heading1 = this.pickStartHeadingToTakeShortestPath(firstRegion.center.x, heading2)
            var middleFov = Math.abs(pitch1 - pitch2) + Math.abs(heading1 - heading2);
            if (middleFov > maxFov) {
                // the difference in pitch & heading is more than the fov difference
                maxFov = middleFov;
            }

            var retval = secondKf.offset;
            if (minFov > 1E-5) {
                var fovDelta = maxFov / minFov;
                var duration = (MIN_DURATION + Math.log(fovDelta)) * 700 * (this._adaptiveDurationScaleOverride);
                duration /= 1000;
                //We will cap the adaptiveoffset to offset of the secondKf if so specified
                retval = this._capAdaptiveOffset ? Math.min(secondKf.offset, firstKf.offset + duration) : firstKf.offset + duration;
            }
            return retval;
        }, */

        //Calculate the reasonable amount of time needed to get to the secondKf from firstKf
        calculateAdaptiveDuration: function (firstKf, secondKf, experienceStream) {
            //TODO: look for a profile, and for overrides for transitions on that profile
            // Following calculation is based on panoviewer's ballisticPath duration calculation for simple paths
            var MIN_DURATION = 0.5;
            var firstRegion = firstKf.state.viewport.region; 
            var secondRegion = secondKf.state.viewport.region;
            var firstFov = firstRegion.span.y;
            var secondFov = secondRegion.span.y;
            var maxFov = Math.max(firstFov, secondFov);
            var minFov = Math.min(firstFov, secondFov);
            
            var pitch1 = firstRegion.center.y;
            var pitch2 = secondRegion.center.y;
            var heading2 = secondRegion.center.x;
            var heading1 = this.pickStartHeadingToTakeShortestPath(firstRegion.center.x, heading2)
            var middleFov = Math.abs(pitch1 - pitch2) + Math.abs(heading1 - heading2);
            if (middleFov > maxFov) {
                // the difference in pitch & heading is more than the fov difference
                maxFov = middleFov;
            }

            if (minFov > 1E-5) {

                var maxAdaptiveDuration = this._maxAdaptiveDuration;
                var adaptiveDurationScaleOverride = this._adaptiveDurationScaleOverride;
                // Check if adaptiveTransitionProfileOverride was mentioned on the experience
                if (experienceStream.adaptiveTransitionProfileOverride != undefined) {
                    if (experienceStream.adaptiveTransitionProfileOverride.maxAdaptiveDuration != undefined) {
                        maxAdaptiveDuration = experienceStream.adaptiveTransitionProfileOverride.maxAdaptiveDuration;
                    }

                    if (experienceStream.adaptiveTransitionProfileOverride.durationScaleOverride != undefined) {
                        adaptiveDurationScaleOverride = experienceStream.adaptiveTransitionProfileOverride.durationScaleOverride;
                    }
                }

                var fovDelta = maxFov / minFov;
                var calculatedAdaptiveDuration = (MIN_DURATION + Math.log(fovDelta)) * 700 * (adaptiveDurationScaleOverride);
                calculatedAdaptiveDuration /= 1000;

                // Adatptive duration depends on 
                //           - calculatedAdaptiveDuration - calculated based on the two views
                //          - maxAdaptiveDurationInSec - max allowed adaptive duration found in settings
                // adaptiveDuration = min (calculatedAdaptiveDuration, maxAdaptiveDurationInSec)                


                if (maxAdaptiveDuration > 0) {
                    calculatedAdaptiveDuration = Math.min(maxAdaptiveDuration, calculatedAdaptiveDuration);
                }
                return calculatedAdaptiveDuration;
            }
            else {
                return -1;
            }
        },
        _interactionControls: null,
        _zoomFactor: .2,
        _panDistance: .3,
        isExplorable: true,
        _tryCalculate: false,
        _lowFidilityWhileMoving: true,
        _enforceViewLimits: null,
        _durationScaleOverride: 4,
        _adaptiveDurationScaleOverride: 3,
        _capAdaptiveOffset: true,
        _maxAdaptiveDuration: -1,
        _transitionPauseDurationInSec: 0,
        _simplePathOnly: false,
        _viewShrinkFactor: null,
        _isInResumeFromMode: false
    };

    PanoramicES.elementHTML = 
        "<div style='height:100%;width:100%;background-color:black;position:absolute;'>" +
            "<div class='panoHolder' style='height:100%;width:100%;background-color:black;position:absolute;'></div>" + 
            "<div class='panoHint'><h3>Panoramic Image</h3><div class='panoHintDrag'>Drag</div><div class='panoHintPinch'>Zoom</div></div>" +
        "</div>";

    rin.util.overrideProperties(PanoramicES.prototypeOverrides, PanoramicES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.PanoramicExperienceStream", function (orchestrator, esData) { return new PanoramicES(orchestrator, esData); });
})(rin);
