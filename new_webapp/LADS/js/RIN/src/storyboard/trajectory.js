var rin;
(function (rin) {
    (function (Ext) {
        /// <reference path="rintypes.d.ts"/>
        /// <reference path="BasicInterpolators.ts"/>
        //
        // RIN Trajectory implementation (part of Nonlinear Storyboard functionality)
        //
        // NOTE: THIS CODE IS GENERATED FROM trajectory.ts using the TypeScript compiler.
        // MAKE SURE THAT CHANGES ARE REFLECTED IN THE .TS FILE!
        //
        // Copyright (C) 2013 Microsoft Research
        //
        (function (Trajectory) {
            function log(str) {
                console.log(str);
            }
            ;
            // (stolen from rin.core)
            // Deep copy the object. Only members are copied and so the resulting object will not be of the same type.
            function deepCopy(obj) {
                if(typeof (obj) != "object" || obj == null) {
                    return obj;
                }
                var temp = obj.constructor();
                for(var i in obj) {
                    temp[i] = deepCopy(obj[i]);
                }
                return temp;
            }
            ;
            var BaseTrajectory = (function () {
                function BaseTrajectory(duration) {
                    this.duration = duration;
                }
                BaseTrajectory.prototype.renderAt = function (time) {
                    log("EMPTY RENDER AT");
                };
                BaseTrajectory.prototype.sampleAt = function (time, kf) {
                    log("EMPTY SAMPLE AT");
                    return null;
                };
                return BaseTrajectory;
            })();            
            function newTrajectoryBuilder(e) {
                var e = e;
                var date = new Date();
                //
                // Any of the returned object's fields can be overridden with Experience provider specific code. The interpolateSliver function should call the base
                // implementation for default handling of slivers.
                //
                return {
                    keyframeInterpolatorPre: function (iState) {
                        return null;
                    },
                    sliverInterpolator: function (sliverId, state) {
                        return null;
                    },
                    keyframeInterpolatorPost: function (state) {
                        return null;
                    },
                    renderKeyframe: function (kf) {
                    },
                    storyboardHelper: {
                        buildTransitionTrajectory: function (traj1, t1, activeTrajectory, t2, pause) {
                            // TODO When implementing smooth transitions, if traj1 is null we have to call to the environment to get the current state.
                            var resultTrajectory = activeTrajectory;
                            if(pause) {
                                //
                                // We do an instant pause (no slow pause for now).
                                // So, create a new trajectory of duration 0, and map render for any time to rendering the underlying
                                // trajectory (activeTrajectory) at the (unchanging) pause time (t2)
                                //
                                resultTrajectory = new BaseTrajectory(0);
                                resultTrajectory.renderAt = function (time) {
                                    activeTrajectory.renderAt(t2);
                                };
                                resultTrajectory.sampleAt = (activeTrajectory.sampleAt) ? function (time, kf) {
                                    return activeTrajectory.sampleAt(t2, kf);
                                } : null;
                            }
                            ;
                            return resultTrajectory;
                        },
                        getCurrentTime: function () {
                            return Date.now() / 1000;
                        },
                        startAnimation: //
                        // A notification to the calling environment to START animation - i.e., begin repeatedly calling render().
                        // NOTE: The implementation should be idempotent, i.e., deal with being called multiple times without an intervening stopAnimation().
                        //
                        function () {
                            log("START ANIMATION");
                        },
                        stopAnimation: //
                        // A notification to the calling environment to STOP animation - i.e., stop repeatedly calling render().
                        // NOTE: The implementation should be idempotent, i.e., deal with being called multiple times without an intervening startAnimation().
                        //
                        function () {
                            log("STOP ANIMATION");
                        }
                    },
                    buildTrajectoryFromExperienceStreamId: function (esId) {
                        var es = e.experienceStreams[esId];
                        var retTraj = this.buildTrajectoryFromExperienceStream(es);
                        retTraj.targetExperienceStreamId = esId;
                        return retTraj;
                    },
                    buildTrajectoryFromExperienceStream: function (es) {
                        var traj = new BaseTrajectory(es.duration);
                        var tb = this;
                        var workingKf0;
                        var kfState = {
                            es: es
                        };
                        var sliverIds = buildSliverIdsForES(es);
                        var sliverStates = [];
                        var prepareKeyframeInterpolator = null;
                        var sliverInterpolators = {
                        };
                        var finalizeKeyframeInterpolator = null;
                        if(e.data.defaultKeyframe) {
                            // deep copy
                            workingKf0 = deepCopy(e.data.defaultKeyframe);
                        } else {
                            workingKf0 = {
                                offset: 0,
                                holdDuration: 0,
                                data: null,
                                state: null
                            };
                        }
                        traj.sampleAt = function (time, workingKf) {
                            if(time < 0) {
                                time = 0;
                            }
                            if(!es.keyframes || es.keyframes.length === 0) {
                                // no keyframes.
                                return null;
                            }
                            if(!workingKf) {
                                if(e.data.defaultKeyframe) {
                                    // deep copy
                                    workingKf = deepCopy(e.data.defaultKeyframe);
                                } else {
                                    workingKf = {
                                        offset: 0,
                                        holdDuration: 0,
                                        data: null,
                                        state: null
                                    };
                                }
                            }
                            workingKf.offset = time;
                            //
                            // Initialize/Update the interpolation states, which may get rebuilt each time we cross a keyframe.
                            //
                            var reCompute = false;
                            if(updateKeyframeInterpolationState(tb, es, kfState, time)) {
                                reCompute = true;
                            }
                            if(reCompute) {
                                //
                                // We need to recompute all the interpolation functions...
                                //
                                prepareKeyframeInterpolator = tb.keyframeInterpolatorPre(kfState);
                                // For each sliver in sliverIds, we create an array of keyframes that have that sliver, and then call updateKeyframeInteroplationState1 to update that sliver's Interpolation state.
                                sliverInterpolators = {
                                };
                                sliverIds.forEach(function (sliverId) {
                                    if(reCompute) {
                                        var sliverKeyframes = es.keyframes.filter(function (kf) {
                                            return (kf.state && kf.state[sliverId] !== undefined);
                                        });
                                        var kfState = sliverStates[sliverId] || {
                                        };
                                        updateKeyframeInterpolationState1(tb, es, sliverKeyframes, kfState, time);
                                        sliverInterpolators[sliverId] = tb.sliverInterpolator(sliverId, kfState) || new rin.Ext.Interpolators.discreteInterpolator(sliverId, kfState);
                                    }
                                });
                                finalizeKeyframeInterpolator = tb.keyframeInterpolatorPost(kfState);
                            }
                            if(prepareKeyframeInterpolator) {
                                prepareKeyframeInterpolator.interpolate(time, workingKf);
                            }
                            sliverIds.forEach(function (sliverId) {
                                if(sliverInterpolators[sliverId]) {
                                    sliverInterpolators[sliverId].interpolate(time, workingKf);
                                }
                            });
                            if(finalizeKeyframeInterpolator) {
                                finalizeKeyframeInterpolator.interpolate(time, workingKf);
                            }
                            return workingKf;
                        };
                        traj.renderAt = function (time) {
                            traj.sampleAt(time, workingKf0);
                            if(workingKf0) {
                                tb.renderKeyframe(workingKf0);
                            }
                        };
                        // TODO: make es an optional property of traj. For now we bypass type checking.
                        var trajEx = traj;
                        trajEx.es = es;
                        return traj;
                    }
                };
            }
            Trajectory.newTrajectoryBuilder = newTrajectoryBuilder;
            //
            // Build a list of all slivers that occur in any keyframe in this Experience Stream
            //
            function buildSliverIdsForES(es) {
                var ids = {
                };
                // Build a dictionary of any slivers we find...
                es.keyframes.forEach(function (kf) {
                    var state = (kf && kf.state) || {
                    };
                    var sliverId;
                    for(sliverId in state) {
                        if(ids[sliverId] === undefined) {
                            ids[sliverId] = sliverId;
                        }
                    }
                });
                return getObjectProperties(ids, function (obj) {
                    return typeof obj === "string";
                });
            }
            function updateKeyframeInterpolationState(tb, es, kfState, time) {
                return updateKeyframeInterpolationState1(tb, es, es.keyframes, kfState, time);
            }
            function updateSliverInterpolationStates(tb, es, sliverIds, sliverStates, time) {
                // For each sliver in sliverIds, we create an array of keyframes that have that sliver, and then call updateKeyframeInteroplationState1 to update that sliver's Interpolation state.
                sliverIds.forEach(function (sliverId) {
                    var sliverKeyframes = es.keyframes.filter(function (kf) {
                        return (kf.state && kf.state[sliverId] !== undefined);
                    });
                    var kfState = sliverStates[sliverId] || {
                    };
                    sliverStates[sliverId] = updateKeyframeInterpolationState1(tb, es, sliverKeyframes, kfState, time);
                });
                return sliverStates;
            }
            //
            // Updates the interpolation state for the specified keyframes (which could be a subset of keyframe in es.keyframes)
            //
            function updateKeyframeInterpolationState1(tb, es, keyframes, kfState, time) {
                //var timeDelta: number;
                if(!kfState.es) {
                    // Init the working Keyframe...
                    kfState.es = es;
                    kfState.time = NaN;
                    kfState.preKf = kfState.prePreKf = kfState.postKf = kfState.postPostKf = null;
                }
                if(!keyframes || keyframes.length === 0) {
                    // no keyframes.
                    return false;
                }
                // Check if kfState has to be updated. If not, return false to continue using the last interpolation function.
                if((kfState.preKf && kfState.postKf && kfState.preKf.offset <= time && kfState.postKf.offset >= time) || (kfState.preKf && !kfState.postKf && kfState.preKf.offset <= time) || (kfState.postKf && !kfState.preKf && kfState.postKf.offset >= time)) {
                    return false;
                }
                //timeDelta = time-kfState.time; // could be NaN
                //if (timeDelta >= 0) {
                //    // sometime in the future...
                //    if (kfState.postKf && (timeDelta <= kfState.postKf.offset)) {
                //        // we're still behind postKf
                //        kfState.time = time;
                //        return false;
                //    }
                //} else if (timeDelta < 0) {
                //    // sometime in the past ...
                //    if (kfState.preKf && (timeDelta >= kfState.preKf.offset)) {
                //        // we're still ahead of preKf
                //        kfState.time = time;
                //        return false;
                //    }
                //}
                // We must re-compute the InterpolationState from scratch...
                kfState.time = time;
                kfState.prePreKf = kfState.postKf = kfState.postPostKf = null;
                var pre = NaN, post = NaN;
                if(time < keyframes[0].offset) {
                    // time is before first keyframe!
                    post = 0;
                } else {
                    for(pre = 1; pre < keyframes.length; pre++) {
                        if(keyframes[pre].offset > time) {
                            break;
                        }
                    }
                    pre--// Pre is now set to the first keyframe with offset<=time;
                    ;
                    if(pre < keyframes.length - 1) {
                        post = pre + 1;
                    }
                }
                if(!isNaN(pre)) {
                    kfState.preKf = keyframes[pre];
                    if(pre > 0) {
                        kfState.prePreKf = keyframes[pre - 1];
                    }
                }
                if(!isNaN(post)) {
                    kfState.postKf = keyframes[post];
                    if(post < (keyframes.length - 1)) {
                        kfState.postPostKf = keyframes[post + 1];
                    }
                }
                return true;// true === Recompute the interpolation functions...
                
            }
            function getObjectProperties(obj, pred) {
                var props = [];
                var p;
                for(p in obj) {
                    if(pred(obj[p])) {
                        props.push(p);
                    }
                }
                return props;
            }
        })(Ext.Trajectory || (Ext.Trajectory = {}));
        var Trajectory = Ext.Trajectory;
    })(rin.Ext || (rin.Ext = {}));
    var Ext = rin.Ext;
})(rin || (rin = {}));
//@ sourceMappingURL=trajectory.js.map
