/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../contracts/IExperienceStream.js" />
/// <reference path="../contracts/IOrchestrator.js" />
/// <reference path="../core/Common.js" />
/// <reference path="../core/EventLogger.js" />
/// <reference path="../core/PlayerConfiguration.js" />
/// <reference path="../core/ResourcesResolver.js" />
/// <reference path="../core/TaskTimer.js" />

window.rin = window.rin || {};
rin.contracts = rin.contracts || {};

// Base class for any ES which uses keyframes at discrete intervals.
rin.contracts.InterpolatedKeyframeESBase = function (orchestrator, esData) {
    this._esData = esData;
    this._orchestrator = orchestrator;
    this.stateChangedEvent = new rin.contracts.Event();
};

rin.contracts.InterpolatedKeyframeESBase.prototype = {
    // Notify ES stage change.
    stateChangedEvent: null,
    // Method called every time a keyframe has to be applied.
    displayKeyframe: function (keyframeData) { },
    // Reset the UI.
    resetUserInterface: function () { },
    // Load the ES and initialize its components.
    load: function (experienceStreamId) {
        if (!this._esData || !this._orchestrator) throw new Error("orchestrator and esData should not be null. Make sure the base ES is instantiated using non-empty constructor during run time");
        this._initKeyframes(experienceStreamId);
    },
    // Play the ES from the specified offset.
    play: function (offset, experienceStreamId) {
        this._updateActiveES(offset, experienceStreamId);
        if (this.getState() != rin.contracts.experienceStreamState.ready)
            return;
        
        if (this._interpolationStoryBoard && this._currentStreamTrajectory)
            this._interpolationStoryBoard.play(this._currentStreamTrajectory, offset);
    },
    // Pause the ES at the specified offset.
    pause: function (offset, experienceStreamId) {
        this._updateActiveES(offset, experienceStreamId);
        if (this.getState() != rin.contracts.experienceStreamState.ready)
            return;
        
        if (this._interpolationStoryBoard && this._currentStreamTrajectory)
        {
            this._interpolationStoryBoard.pause(this._currentStreamTrajectory, offset);
        }
    },

    // Unload the ES and release any resources.
    unload: function () {
        this.pause();
        if (this._interpolationStoryBoard)
            this._interpolationStoryBoard.stop();
    },

    // Get the current state of this ES.
    getState: function () {
        return this._state;
    },

    // Get the state if this ES.
    setState: function (value) {
        if (this._state == value) return;
        var previousState = this._state;
        this._state = value;
        this.stateChangedEvent.publish(new rin.contracts.ESStateChangedEventArgs(previousState, value, this));
    },

    // Get the UI control for this ES.
    getUserInterfaceControl: function () { return this._userInterfaceControl; },

    // Add a sliver interpolator to this ES.
    addSliverInterpolator : function(key, interpolatorFunction) {
        this._sliverInterpolators[key] = interpolatorFunction;
    },
    
    // Used to fetch keyframes for a specified time span
    getKeyframes: function (start, duration, step) {
        var keyframeArray = [];
        var tmpFrame;

        for (var offset = 0; offset <= duration; offset += step) {
            tmpFrame = this._interpolationStoryBoard.getFrameAt(start + offset, this._currentStreamTrajectory);
            if (tmpFrame != null)
                keyframeArray.push(tmpFrame);
        }

        return keyframeArray;
    },

    getKeyframeAt: function (offset, experienceStreamId){
        this._updateActiveES(offset, experienceStreamId);

        if (this._interpolationStoryBoard && this._currentStreamTrajectory)
            return this._interpolationStoryBoard.getFrameAt(offset, this._currentStreamTrajectory);
    },

    // Load and initialize the keyframes and the timer.
    _initKeyframes: function (experienceStreamId) {
        var self = this;
        var doRenderLoop = false;

        if (!this._esData.experienceStreams[experienceStreamId] || !this._esData.experienceStreams[experienceStreamId].keyframes || !this._esData.experienceStreams[experienceStreamId].keyframes.length)
            return;
        var trajectoryBuilder = this._trajectoryBuilder;
        if (!trajectoryBuilder) {
            trajectoryBuilder = rin.Ext.Trajectory.newTrajectoryBuilder(this._esData);

            trajectoryBuilder.sliverInterpolator = function (sliverId, iState) {
                if (typeof(self._sliverInterpolators[sliverId]) == "function")
                    return self._sliverInterpolators[sliverId](sliverId, iState);

                return null;
            };

            trajectoryBuilder.storyboardHelper.startAnimation = function () {
                doRenderLoop = true;

                function renderLoop () {
                    if (self._interpolationStoryBoard)
                        self._interpolationStoryBoard.render();
                    if(doRenderLoop)
                        rin.internal.requestAnimFrame(renderLoop);
                }
                renderLoop();
            };

            trajectoryBuilder.storyboardHelper.stopAnimation = function () {
                doRenderLoop = false;
            };

            trajectoryBuilder.renderKeyframe = function (kf) {
                self.displayKeyframe(kf);
            }

            // Override buildTransitionTrajectory to get smoothTransitions
            //TODO: Adding the check for overrideTransientTrajectoryBuilder so that by default smoothTransitions are not turned on.
            // Remove this check for overrideTransientTrajectoryBuilder once sufficient testing is done
            if (self.overrideTransientTrajectoryFunction) {
                trajectoryBuilder.storyboardHelper.buildTransitionTrajectory = function (traj1, t1, traj2, t2, pause) {

                    if (traj2 && traj2.es && (traj2.es.transitionType == "noZoomOut" || traj2.es.transitionType == "noAnimation")) {
                        //A very special case - we will not attempt any transition trajectory building here 
                        // We expect traj2 to only have a single keyframe.
                        // Typically this is called after resumeFrom originating from a hotspot
                        // resumeFrom would have either set the view to that single keyframe in traj2 or if the view is a zoomed-in view compared to that 
                        // single keyframe, left it as-is. we will not attempt to change the view either 
                        var currentKF = self.captureKeyframe();

                        var noZoomOutTraj = {
                            duration : traj2.duration,

                            renderAt: function(number) {
                                self.displayKeyframe(currentKF);
                            },

                            sampleAt: function (number, Keyframe) {
                                // BUG - must populate Keyframe, or create a *copy* if Keyframe is null!
                                return currentKF;
                            }
                        }

                        if (!pause) {
                            self._playCalled = true; //probably already true
                        }
                        // Early return
                        return noZoomOutTraj;
                    }


                    // Special case code for pause that will create a transient trajectory that keeps the view at currentKF if it is meant to 
                    // pause in the same trajectory with same offset.
                    if (pause && // we are pausing
                        traj1 && // we have a non-null current/active trajectory
                            traj2.targetExperienceStreamId && traj1.targetExperienceStreamId === traj2.targetExperienceStreamId && // the target trajectory for the new traj (traj2) is same as that of current/active traj (traj1)
                            (Math.abs(t1 - t2) < 1E-1)) { // The current and new offsets are very close
                        var currentKF = self.captureKeyframe();

                        // we are already there - no need to change the view, keep it at currentKF
                        var esPause = {
                            duration: 0,
                            keyframes: [currentKF]
                        };

                        //EARLY RETURN!!
                        return trajectoryBuilder.buildTrajectoryFromExperienceStream(esPause);
                    }

                    // Check if we want to use adaptive/variable time to get to the second keyframe of the traj2
                    var useAdaptiveDuration = (traj2.es && traj2.es.transitionType && traj2.es.transitionType == "adaptiveFirstDuration");
                    //We expect to have atleast 2 keyframes in the adaptiveFirstDuration case
                    rin.internal.debug.assert(!useAdaptiveDuration || (useAdaptiveDuration && traj2.es.keyframes.length >= 2));
                    if (useAdaptiveDuration && traj2.es.keyframes.length >= 2 && !pause && self._playCalled)
                    {
                        rin.internal.debug.assert(t2 <= traj2.duration);
                        var currentKF = self.captureKeyframe();
                        currentKF.offset = t2;
                        currentKF.holdDuration = 0;
                        // Find out the keyframe in traj2 that will follow t2 
                        var keyframesNew;
                        var secondAdaptiveKF;

                        
                        // Handle border case first - 
                        if (t2 > traj2.es.keyframes[traj2.es.keyframes.length - 1].offset || Math.abs(t2 - traj2.es.keyframes[traj2.es.keyframes.length - 1].offset) < 1E-5) {
                            // t2 is beyond the last keyframe or very close to it, we will insert a keyframe at offset = duration
                            secondAdaptiveKF = rin.util.deepCopy(traj2.es.keyframes[traj2.es.keyframes.length - 1]);
                            secondAdaptiveKF.offset = traj2.es.duration;
                            keyframesNew = [currentKF, secondAdaptiveKF];
                        }
                        else {
                            var nextKf = null;
                            for (var kf in traj2.es.keyframes) {
                                if (traj2.es.keyframes[kf].offset > t2) {
                                    //found the keyframe
                                    nextKf = traj2.es.keyframes[kf];
                                    break;
                                }
                            }
                            rin.internal.debug.assert(nextKf != null);
                            var index;
                            if (nextKf == null) {
                                //TODO: what else could we do here?
                                index = traj2.es.keyframes.length - 1;
                                nextKf = traj2.es.keyframes[index];
                            }
                            else {
                                index = traj2.es.keyframes.indexOf(nextKf);
                            }

                            //Pick all index onwards keyframes
                            keyframesNew = traj2.es.keyframes.slice(index);

                            var targetKF;
                            if (index >= 1) {
                                // There is a prevKF available
                                var prevKF = traj2.es.keyframes[index - 1];
                                // Decide what view to target from the current view and how long we should take to get to the target view
                                targetKF = self._tryGoToPreviousKeyframe(currentKF, prevKF, nextKf, traj2, t2) ||
                                    self._tryGoToIntermediateKeyframe(currentKF, prevKF, nextKf, traj2, t2);
                            }
                            else {
                                // There is no keyframe before t2, we will head to nextKF directly
                                targetKF = null;
                            }

                            if (targetKF) {
                                keyframesNew.unshift(currentKF, targetKF);
                            }
                            else {
                                keyframesNew.unshift(currentKF);
                            }
                        }

                        
/*                            // We will insert (possibly) two keyframes at the beginning of keyframesNew : 
                            // first one will be currentKF, second one will be added with adaptive offset and view = view of keyframesNew[0]

                            //calculate the adaptive duration
                            var adaptiveDurationInSec = 6;
                            if (typeof (self.calculateAdaptiveDuration) == "function") {
                                var calculatedAdaptiveDuration = self.calculateAdaptiveDuration(currentKF, keyframesNew[0], traj2.es);
                                if ( calculatedAdaptiveDuration >= 0) {
                                    //got back a valid value
                                    adaptiveDurationInSec = calculatedAdaptiveDuration; 
                                }
                            }

                            // Check if secondKF will bump into traj2.es.keyframesNew[0], if so, don't add secondKF
                            var HOLD_DURATION = 0.1; //we will add a small holdduration on secondKF to get the easing effect
                            var secondKFOffset = t2 + adaptiveDurationInSec;
                            if ((secondKFOffset + HOLD_DURATION > keyframesNew[0].offset) /* gone beyond the next keyframe * ||
                                Math.abs(secondKFOffset + HOLD_DURATION - keyframesNew[0].offset) < 0.1 /*very close *) {
                                // we will not add second keyframe
                                keyframesNew.unshift(currentKF);
                            }
                            else {
                                secondAdaptiveKF = rin.util.deepCopy(keyframesNew[0]);
                                secondAdaptiveKF.offset = secondKFOffset;                          
                                secondAdaptiveKF.holdDuration = HOLD_DURATION;
                                keyframesNew.unshift(currentKF, secondAdaptiveKF);
                            }
                    } 
                    */
                        var esAdaptive = {
                            duration: traj2.duration,
                            keyframes: keyframesNew
                        };

                        //EARLY RETURN!!
                        return trajectoryBuilder.buildTrajectoryFromExperienceStream(esAdaptive);
                    }
                        
                    var preKf = null;
                    var prePreKf = null;
                    var postKf = null;
                    var postPostKf = null;
                    var DELTA = 1.0;
                    var TRANSITION_TIME = 2.0;
                    var keyframes = [];

                    if (!traj1) {
                        preKf = self.captureKeyframe();
                    } else {
                        if (traj1.sampleAt) {
                            prePreKf = traj1.sampleAt(t1 - DELTA);
                            preKf = traj1.sampleAt(t1);
                            preKf.holdDuration = 0;
                        }
                    }
                    if (prePreKf) {
                        prePreKf.offset = t2 - DELTA;
                        if (prePreKf.offset < 0) {
                            prePreKf = null;
                        } else {
                            keyframes.push(prePreKf);
                        }
                    }
                    if (preKf) {
                        preKf.offset = t2;
                        keyframes.push(preKf);
                    }
                    if (traj2.sampleAt) {
                        if (pause) {
                            postKf = traj2.sampleAt(t2);
                        } else {
                            postKf = traj2.sampleAt(t2 + TRANSITION_TIME);
                            postPostKf = traj2.sampleAt(t2 + TRANSITION_TIME + DELTA);
                        }
                        if (postKf) {
                            postKf.offset = t2 + TRANSITION_TIME;
                            keyframes.push(postKf);
                        }
                        if (postPostKf) {
                            postPostKf.offset = t2 + TRANSITION_TIME + DELTA;
                            keyframes.push(postPostKf);
                        }
                    }
                    var resultTrajectory;
                    // TODO: resolve issues with pause case
                    // We will generate the transienttrajectory only if play was called and the view is not the default one
                    if (preKf && postKf && !pause && self._playCalled) {
                        //
                        // Construct an on-the-fly ES and build a transition trajectory out of that ES
                        //
                        var es = {
                            duration: TRANSITION_TIME,
                            keyframes: keyframes
                        };

                        var useAdaptiveDuration = (traj2.es && traj2.es.transitionType && traj2.es.transitionType == "adaptiveFirstDuration"); // we want to use adaptive/variable time to get to the second keyframe of the traj2

                        var buildNewTraj2 = (t2 < 1.0E-5 && traj2.es && traj2.es.keyframes && traj2.es.keyframes.length > 0);
                            

                        if (buildNewTraj2) {

                            // We're very close to the start of Traj2 AND Traj2 is based on an experience stream with nonzero keyframes! Copy the keyframe array, and replace the first.
                             
                            var keyframesCopy = traj2.es.keyframes.slice(0);
                            //We expect to have atleast 2 keyframes in the adaptiveFirstDuration case
                            rin.internal.debug.assert(!useAdaptiveDuration || (useAdaptiveDuration && keyframesCopy.length >= 2));

                            if (keyframesCopy.length == 1) {
                                // We turn a 1 keyframe path to a 2 keyframe path
                                postKf = traj2.sampleAt(traj2.duration);
                                postKf.offset = traj2.duration;
                                keyframesCopy = [preKf, postKf];
                            } else {
                                // We replace the first keyframe with the current state.
                                keyframesCopy[0] = preKf;
                                if (useAdaptiveDuration)
                                {
                                    //TODO: we should construct the first two keyframes from the first keyframe programmatically
                                    //delegate to the ES to do this calculation if possible
                                    if (typeof (self.calculateAdaptiveOffset) == "function") {
                                        var tmp = rin.util.deepCopy(keyframesCopy[1]);
                                        var adaptiveOffset = self.calculateAdaptiveOffset(keyframesCopy[0], tmp, traj2.es);
                                        //TODO: need to make sure the second keyframe doesn't bump into next keyframes or goes beyond the duration of the es
                                        tmp.offset = adaptiveOffset;
                                        //set the holdDuration on the second keyframe to be a non-zero value if not already so
                                        if (!tmp.holdDuration || tmp.holdDuration == 0)
                                            tmp.holdDuration = 1;
                                        keyframesCopy[1] = tmp;
                                    }
                                }
                            } 
                            es.keyframes = keyframesCopy;
                            es.duration = traj2.duration;
                        }
                        
                        var transitionTraj = trajectoryBuilder.buildTrajectoryFromExperienceStream(es);

                        if (buildNewTraj2) {
                            resultTrajectory = transitionTraj;
                        }
                        else {
                            resultTrajectory = {
                                renderAt: function (time) {
                                    if (time < t2 + TRANSITION_TIME) {
                                        transitionTraj.renderAt(time);
                                    } else {
                                        if (pause) {
                                            time = t2;
                                        }
                                        traj2.renderAt(time);
                                    }
                                },
                                sampleAt: (traj2.sampleAt) ? function (time, kf) {
                                    if (time < t2 + TRANSITION_TIME) {
                                        return transitionTraj.sampleAt(time);
                                    } else {
                                        if (pause) {
                                            time = t2;
                                        }
                                        return traj2.sampleAt(time);
                                    }
                                } : null,
                                duration: pause ? TRANSITION_TIME : traj2.duration
                            };
                        }                        
                    } else {
                        resultTrajectory = traj2;
                        if (pause) {
                            //
                            // We do an instant pause (no slow pause for now).
                            // So, create a new trajectory of duration 0, and map render for any time to rendering the underlying
                            // trajectory (activeTrajectory) at the (unchanging) pause time (t2)
                            //
                            resultTrajectory = {
                                renderAt: function (time) {
                                    traj2.renderAt(t2);
                                },
                                sampleAt: (traj2.sampleAt) ? function (time, kf) {
                                    return traj2.sampleAt(t2, kf);
                                } : null,
                                duration: 0
                            };
                        }
                        else {
                            // Play is called. remember it.
                            self._playCalled = true;
                        }
                    }
                    return resultTrajectory;
                };
            }
            self._trajectoryBuilder = trajectoryBuilder;
            self._interpolationStoryBoard = rin.Ext.NonLinearStoryboard.buildStoryboard(trajectoryBuilder.storyboardHelper);
        }

        self._currentStreamTrajectory = trajectoryBuilder.buildTrajectoryFromExperienceStreamId(experienceStreamId);
    },

    //Minimum hold duration that will be added to the intermediate keyframe added for smooth resume transition
    _MIN_HOLDDURATION : 0.2,
    // Minimum duration needed to do a proper transition from intermediate keyframe to the nextKeframe in a smooth resume transition
    _MIN_TRANSITION_TO_NEXTKF: 6,

    //Typical transition time to get to the intermediate  added for smooth resume transition
    _TRANSITION_TIME: 3,
    // Check if we can go to prevKF within reasonable time given the resume offset = t2, return the target keyframe to be inserted
    // else return null
    _tryGoToPreviousKeyframe: function(currentKF, prevKF, nextKf, traj2, t2){
        var self = this;
        var targetKf = null;
        if (t2 < prevKF.offset + prevKF.holdDuration) {
            // t2 is within the holdDuration of the prevKF. Try to attach to prevKF 
            var adaptiveDurationInSec = self._TRANSITION_TIME; //TODO: too lenient?
            if (typeof (self.calculateAdaptiveDuration) == "function") {
                var calculatedAdaptiveDuration = self.calculateAdaptiveDuration(currentKF, prevKF, traj2.es);
                if ( calculatedAdaptiveDuration >= 0) {
                    //got back a valid value
                    adaptiveDurationInSec = calculatedAdaptiveDuration; 
                }
            }
            if (t2 + adaptiveDurationInSec + self._MIN_HOLDDURATION < prevKF.offset + prevKF.holdduration) {
                /* we have enough time to get to prevKF within its holdduration so attach to prevKF */
                targetKf = rin.util.deepCopy(prevKF);
                targetKf.offset = t2 + adaptiveDurationInSec;
                targetKf.holdDuration = prevKF.offset + prevKF.holdDuration - targetKf.offset;
            }
        }
        return targetKf;
    },
    // Check if we can go to a sampled intermediate keyframe along the trajectory that goes from prevKF to nextKF within a reasonable time given the resume offset = t2
    // return the target keyframe to be inserted else return null
    _tryGoToIntermediateKeyframe: function(currentKF, prevKF, nextKf, traj2, t2) {
        if (typeof (traj2.sampleAt) != "function" ) {
            // EARLY RETURN
            return null;
        }

        // We sample at ESTIMATED transition time, because the actual transition time is only known once we have the sample!
        var self = this;
        var targetKf = null;
        targetKf = traj2.sampleAt(t2 + self._TRANSITION_TIME);
        if (targetKf == null)
            return null;
        
        var adaptiveDurationInSec = self._TRANSITION_TIME; 
        if (typeof (self.calculateAdaptiveDuration) == "function") {
            var calculatedAdaptiveDuration = self.calculateAdaptiveDuration(currentKF, targetKf, traj2.es);
            if ( calculatedAdaptiveDuration >= 0) {
                //got back a valid value
                adaptiveDurationInSec = calculatedAdaptiveDuration; 
            }
        }
        if (t2 + adaptiveDurationInSec + self._MIN_HOLDDURATION + self._MIN_TRANSITION_TO_NEXTKF < nextKf.offset) {
            // we have enough time for it to be worthwhile getting to sampled point and then from there to nextKF 
            targetKf.offset = t2 + adaptiveDurationInSec;
            targetKf.holdDuration = self._MIN_HOLDDURATION;
        }
        return targetKf;
    },

    // Check if the experienceStreamId is valid.
    _getExperienceStreamFromId: function (experienceStreamId) {
        return this._esData.experienceStreams[experienceStreamId];
    },

    // Seek to the specified offset.
    _updateActiveES: function (offset, experienceStreamId) {
        var isUpdated = false;
        if (experienceStreamId != this._currentExperienceStreamId && this._getExperienceStreamFromId(experienceStreamId)) {
            this.resetUserInterface();
            this._initKeyframes(experienceStreamId);
            this._currentExperienceStreamId= experienceStreamId;
            isUpdated = true;
        }

        return isUpdated;
    },

    _sliverInterpolators: {},
    _currentExperienceStreamId: null,
    _currentStreamTrajectory: null,
    _interpolationStoryBoard : null,
    _trajectoryBuilder: null,
    _userInterfaceControl: null,
    _orchestrator: null,
    _playCalled: false,
    _esData: null
};