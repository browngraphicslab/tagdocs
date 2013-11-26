var rin;
(function (rin) {
    (function (Ext) {
        /// <reference path="rintypes.d.ts"/>
        // RIN Viewport sliver interpolator - for 2D regions, applicable to panoramas. maps and deep-zoom images,
        //
        // NOTE: THIS CODE IS GENERATED FROM ViewportInterpolator2D.ts using the TypeScript compiler.
        // MAKE SURE THAT CHANGES ARE REFLECTED IN THE .TS FILE!
        //
        // Copyright (C) 2013 Microsoft Research
        //
        (function (Interpolators) {
            // Private module containing some Quaternion-specific code....
            //
            var QuaternionHelperVectorBased = (function () {
                function QuaternionHelperVectorBased(r1, r2) {
                    this.q1 = {
                        x: 0,
                        y: 0,
                        z: 0,
                        w: 0
                    };
                    this.q2 = {
                        x: 0,
                        y: 0,
                        z: 0,
                        w: 0
                    };
                    this.qOrtho = {
                        x: 0,
                        y: 0,
                        z: 0,
                        w: 0
                    };
                    this.q = {
                        x: 0,
                        y: 0,
                        z: 0,
                        w: 0
                    };
                    this.halfTheta = 0;
                    this.normalizer = 0.5;
                    this.collinear = false;
                    var sinHalfTheta;
                    var q1 = this.q1;
                    var q2 = this.q2;
                    QuaternionHelperVectorBased.centerToQuaternion(r1.center, q1);
                    QuaternionHelperVectorBased.centerToQuaternion(r2.center, q2);
                    var cosHalfTheta = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
                    if(cosHalfTheta < 0.0) {
                        // TODO. VERIFY!!!
                        cosHalfTheta = -cosHalfTheta;
                        q2.x = -q2.x;
                        q2.y = -q2.y;
                        q2.z = -q2.z;
                        q2.w = -q2.w;
                    }
                    if(cosHalfTheta > 1.0) {
                        // TODO - what strategy?
                        cosHalfTheta = 1.0;
                    }
                    if(cosHalfTheta > 0.9999) {
                        this.collinear = true;
                    } else {
                        sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
                        this.halfTheta = Math.acos(cosHalfTheta);
                        this.normalizer = 1.0 / sinHalfTheta;
                        //Compute vector orthogonal to q1
                        this.qOrtho.x = q2.x - q1.x * cosHalfTheta;
                        this.qOrtho.y = q2.y - q1.y * cosHalfTheta;
                        this.qOrtho.z = q2.z - q1.z * cosHalfTheta;
                        this.qOrtho.w = q2.w - q1.w * cosHalfTheta;
                        var length = Math.sqrt(this.qOrtho.x * this.qOrtho.x + this.qOrtho.y * this.qOrtho.y + this.qOrtho.z * this.qOrtho.z + this.qOrtho.w * this.qOrtho.w);
                        var invLength = 1.0 / length;
                        this.qOrtho.x *= invLength;
                        this.qOrtho.y *= invLength;
                        this.qOrtho.z *= invLength;
                        this.qOrtho.w *= invLength;
                    }
                }
                QuaternionHelperVectorBased.prototype.interpolateCenter = function (progress, center) {
                    var q = this.q;
                    var q1 = this.q1;
                    var q2 = this.q2;
                    var qOrtho = this.qOrtho;
                    if(this.collinear) {
                        var q1Fraction, q2Fraction;
                        q1Fraction = 1.0 - progress;
                        q2Fraction = progress;
                        q.x = q1.x * q1Fraction + q2.x * q2Fraction;
                        q.y = q1.y * q1Fraction + q2.y * q2Fraction;
                        q.z = q1.z * q1Fraction + q2.z * q2Fraction;
                        q.w = q1.w * q1Fraction + q2.w * q2Fraction;
                    } else {
                        var fractionTheta = this.halfTheta * progress;
                        var cosFractionTheta = Math.cos(fractionTheta);
                        var sinFractionTheta = Math.sqrt(1.0 - cosFractionTheta * cosFractionTheta);
                        q.x = q1.x * cosFractionTheta + qOrtho.x * sinFractionTheta;
                        q.y = q1.y * cosFractionTheta + qOrtho.y * sinFractionTheta;
                        q.z = q1.z * cosFractionTheta + qOrtho.z * sinFractionTheta;
                        q.w = q1.w * cosFractionTheta + qOrtho.w * sinFractionTheta;
                    }
                    QuaternionHelperVectorBased.quaternionToCenter(q, center);
                };
                QuaternionHelperVectorBased.centerToQuaternion = //
                // Converts the center of the viewport into a representation quaternion.
                // TODO: Deal with "tilt"/ "roll" aspect. For now, we assume zero-tilt.
                //
                function centerToQuaternion(c, q) {
                    //Using vector algebra
                    var cosPitch = Math.cos(c.y);
                    var sinPitch = Math.sin(c.y);
                    var cosHeading = Math.cos(c.x);
                    var sinHeading = Math.sin(c.x);
                    q.z = sinPitch;
                    q.x = cosPitch * sinHeading;
                    q.y = cosPitch * cosHeading;
                    q.w = 0;
                };
                QuaternionHelperVectorBased.quaternionToCenter = //
                // Computes the center of the viewport fromt its representative quaternion.
                // TODO: Deal with "tilt" or "roll" aspect. For now, we assume zero-tilt.
                //
                function quaternionToCenter(q, c) {
                    if(q.w != 0) {
                        if(typeof (console) != "undefined" && console && console.log) {
                            console.log("vectorBased interpolation: quaternions with q.w = 0?");
                        }
                    }
                    var pitch = Math.asin(q.z);
                    var heading = Math.atan2(q.x, q.y);
                    c.x = heading;
                    c.y = pitch;
                };
                return QuaternionHelperVectorBased;
            })();
            Interpolators.QuaternionHelperVectorBased = QuaternionHelperVectorBased;            
            (function (EasingOption) {
                EasingOption._map = [];
                EasingOption._map[0] = "noEasing";
                EasingOption.noEasing = 0;// fast-start and fast end => Linear all through
                
                EasingOption._map[1] = "inEasing";
                EasingOption.inEasing = 1;// slow-start and fast end => in-cubic
                
                EasingOption._map[2] = "outEasing";
                EasingOption.outEasing = 2;// fast-start and slow end => out-cubic
                
                EasingOption._map[3] = "inOutEasing";
                EasingOption.inOutEasing = 3;// slow-start and slow end => piecewise cubic-linear-cubic if the interpolation duration is long enough, else resort to in-out-cubic
                
            })(Interpolators.EasingOption || (Interpolators.EasingOption = {}));
            var EasingOption = Interpolators.EasingOption;
            // Class that is used to compute eased progress for a given interpolation state and the suggested easing duration
            var PiecewiseCubicEasingHelper = (function () {
                function PiecewiseCubicEasingHelper(iState, easingDuration, easingOption) {
                    this.linearEasing = function (t) {
                        return t;
                    };
                    this.inCubicEasing = function (t) {
                        return t * t * t;
                    };
                    this.outCubicEasing = function (t) {
                        return t * (t * (t - 3) + 3);
                    };
                    this.inOutCubicEasing = function (t) {
                        return (3 - 2 * t) * t * t;
                    };
                    this.constantEasing = function (t) {
                        // we are in the special case where preKf.offset + holdduration > postKf.offset
                        return 0;
                    };
                    this.piecewiseInOutCubicEasing = function (t) {
                        var retval = t;
                        if(t < this.inTransitionEndNormalized) {
                            //in-cubic portion
                            retval = this.constMultiplier * t * t * t;
                        } else if(t > this.outTransitionStartNormalized) {
                            //out-cubic portion
                            var OneMinust = 1.0 - t;
                            retval = 1.0 - this.constMultiplier * OneMinust * OneMinust * OneMinust;
                        } else {
                            // Linear part
                            retval = this.lineoffset + this.lineSlope * (t - this.inTransitionEndNormalized);
                        }
                        return retval;
                    };
                    //Figure out if the interpolation duration is long enough to support the easingDuration for the given easingOption
                    var holdDuration = iState.preKf.holdDuration ? iState.preKf.holdDuration : 0.0;
                    var interpolationDuration = iState.postKf.offset - iState.preKf.offset - holdDuration;
                    var MIN_INTERPOLATIONDURATION = 0.1;
                    if(interpolationDuration <= MIN_INTERPOLATIONDURATION) {
                        this.ease = this.constantEasing;
                        return;
                    }
                    switch(easingOption) {
                        case EasingOption.inOutEasing:
                            if(easingDuration < MIN_INTERPOLATIONDURATION) {
                                this.ease = this.linearEasing;
                            } else {
                                if(interpolationDuration < 2 * easingDuration) {
                                    this.ease = this.inOutCubicEasing;
                                } else {
                                    this.ease = this.piecewiseInOutCubicEasing;
                                }
                            }
                            break;
                        case EasingOption.inEasing:
                            this.ease = this.inCubicEasing;
                            break;
                        case EasingOption.outEasing:
                            this.ease = this.outCubicEasing;
                            break;
                        case EasingOption.noEasing:
                        default:
                            this.ease = this.linearEasing;
                    }
                    if(this.ease == this.piecewiseInOutCubicEasing) {
                        // set up all the needed constants
                        // Calculate normalized inTransitionStart and outTransitionEnd
                        var invDuration = 1.0 / interpolationDuration;
                        this.inTransitionEndNormalized = easingDuration * invDuration;
                        this.outTransitionStartNormalized = (interpolationDuration - easingDuration) * invDuration;
                        var inTransitionEndNormalizedSquared = this.inTransitionEndNormalized * this.inTransitionEndNormalized;
                        var inTransitionEndNormalizedCubed = inTransitionEndNormalizedSquared * this.inTransitionEndNormalized;
                        // Evaluate multiplier used in the 0 - inTransitionEndNormalized interval
                        // it will be > 0 for all 0 < inTransitionEndNormalized < 0.75 with a max at 0.5
                        this.constMultiplier = 1.0 / (3 * inTransitionEndNormalizedSquared - 4 * inTransitionEndNormalizedCubed);
                        //Calculate the slope of the linear piece that used in the interval from inTransitionEndNormalized to outTransitionStartNormalized
                        this.lineSlope = (1.0 - 2 * this.constMultiplier * inTransitionEndNormalizedCubed) / (1 - 2 * this.inTransitionEndNormalized);
                        //Calculate the y-value of the line at inTransitionEndNormalized
                        this.lineoffset = this.constMultiplier * inTransitionEndNormalizedCubed;
                    }
                }
                return PiecewiseCubicEasingHelper;
            })();            
            // Class to interpolate a viewport using various nonlinear techniques applicable to curved 2D manifolds such as maps and panoramas.
            var viewportInterpolator2D = (function () {
                function viewportInterpolator2D(iState, type, easing) {
                    this.sliverId = "viewport";
                    // will be overwridden with data-dependent implementations.
                    this.interpolatorType = "vectorBased";
                    this.easingHelper = null;
                    this.usePiecewiseCubicEasing = true;
                    this.defaultEasingDuation = 2.0;
                    var postKfState = iState.postKf ? iState.postKf.state[this.sliverId] : null;
                    var preKfState = iState.preKf ? iState.preKf.state[this.sliverId] : null;
                    ;
                    if(type) {
                        this.interpolatorType = type;
                    }
                    //
                    // Get corner cases out of the way - like single keyfame.
                    //
                    if(!(iState.postKf && iState.preKf)) {
                        var preOrPostKf = iState.preKf || iState.postKf;
                        var preOrPostkfState = preOrPostKf.state[this.sliverId];
                        this.interpolateRegion = function (t, region) {
                            region.center.x = preOrPostkfState.region.center.x;
                            region.center.y = preOrPostkfState.region.center.y;
                            region.span.x = preOrPostkfState.region.span.x;
                            region.span.y = preOrPostkfState.region.span.y;
                            //TODO: region.rotation = preOrPostkfState.rotation;
                                                    };
                        return;// EARLY RETURN!!!
                        
                    }
                    var holdDuration = iState.preKf.holdDuration ? iState.preKf.holdDuration : 0.0;
                    var preKfRegion = preKfState.region;
                    var postKfRegion = postKfState.region;
                    var preSpanX = preKfRegion.span.x;
                    var preSpanY = preKfRegion.span.y;
                    var postSpanX = postKfRegion.span.x;
                    var postSpanY = postKfRegion.span.y;
                    var preTime = iState.preKf.offset + holdDuration;
                    var timeDelta = iState.postKf.offset - preTime;
                    var MIN_INTERPOLATIONDURATION = 0.1;
                    if(timeDelta < MIN_INTERPOLATIONDURATION) {
                        timeDelta = 0.0;
                    }
                    //
                    // Setup the source and destination interpolating quaternions...
                    //
                    var qh;
                    var easingHelper;
                    switch(this.interpolatorType) {
                        case "vectorBased":
                            qh = new QuaternionHelperVectorBased(preKfRegion, postKfRegion);
                            if(this.usePiecewiseCubicEasing) {
                                var easingOption = EasingOption.noEasing;
                                //Figure out the easingoption, based on whether prepre and postPost keyframes are present,  and whether they have any holdduration specified
                                // We want easing coming in if there is no prePreKf or there is some non-zero holdduration defined on preKf
                                var easingOnIn = (iState.preKf.holdDuration != undefined && iState.preKf.holdDuration > 1E-5) || !iState.prePreKf;
                                // We want easing going out if there is no postPostKf or there is some non-zero holdduration defined on postKf
                                var easingOnOut = (iState.postKf.holdDuration != undefined && iState.postKf.holdDuration > 1E-5) || !iState.postPostKf;
                                if(easingOnIn) {
                                    if(easingOnOut) {
                                        easingOption = EasingOption.inOutEasing;
                                    } else {
                                        easingOption = EasingOption.inEasing;
                                    }
                                } else {
                                    if(easingOnOut) {
                                        easingOption = EasingOption.outEasing;
                                    } else {
                                        easingOption = EasingOption.noEasing;
                                    }
                                }
                                easingHelper = new PiecewiseCubicEasingHelper(iState, iState.preKf.easingDuration ? iState.preKf.easingDuration : this.defaultEasingDuation, easingOption);
                            }
                            break;
                    }
                    //
                    //  Computes the relative progress ([0.0->1.0]) of the zoom animation. Needs to account for
                    //  easing and any special pseudo-physics that emulate "good" camera zoom motion. Note that zoom progress
                    //  is distinct from orientation progress (which captures what is at the center of the viewport).
                    //  This allows certain control over pan-relative-to-zoom.
                    //
                    var zoomProgress = function (t) {
                        // TODO: Add easing and possibly power law - see SL code base - function InterpolateKeyframes in file TFS SL sources RIN\src\SLPlayer\InterpolationLibrary\ViewAnimation:
                        // (but also note comment about about adjusting progress relative to orientation animation)
                        /*
                        double easedProgress = Ease(progress);
                        View? previousPreviousView = null;
                        View previousView = previousKeyframe.View;
                        View nextView = nextKeyframe.View;
                        View? nextNextView = null;
                        
                        // See if we are using an intermediate keyframe between the two given keyframes.
                        InternalKeyframe intermediateKeyframe = nextKeyframe.IntermediateKeyframe;
                        if (intermediateKeyframe != null)
                        {
                        double fraction = intermediateKeyframe.Offset;
                        double easedFraction = Ease(fraction);
                        if (progress <= fraction)
                        {
                        // We're between the first keyframe and the intermediate keyframe.
                        easedProgress = easedProgress / easedFraction;
                        nextNextView = nextView;
                        nextView = intermediateKeyframe.View;
                        }
                        else
                        {
                        // We're between the intermediate keyframe and the second keyframe.
                        easedProgress = (easedProgress - easedFraction) / (1 - easedFraction);
                        previousPreviousView = previousView;
                        previousView = intermediateKeyframe.View;
                        }
                        }
                        
                        // Calculate the actual progress using a power function if the zoom changes by more than half a level.
                        double finalProgress = easedProgress;
                        double zoomFactor = previousView.Zoom / nextView.Zoom;
                        if (Math.Abs(Math.Log(zoomFactor, 2)) > 0.5)
                        {
                        finalProgress = (Math.Pow(zoomFactor, easedProgress) - 1) / (zoomFactor - 1);
                        }
                        */
                        if(t < preTime || timeDelta < MIN_INTERPOLATIONDURATION) {
                            // t is in the holdDuration, return the preKf's offset
                            return 0;
                        } else {
                            var rawProgress = (t - preTime) / timeDelta;
                            return easingHelper ? easingHelper.ease(rawProgress) : Ease(rawProgress);
                        }
                    };
                    var Ease = function (t) {
                        return (3 - 2 * t) * t * t;
                    };
                    //
                    //  Computes the relative progress ([0.0->1.0]) of the orientation animation. Needs to account for
                    //  easing and any special pseudo-physics that emulate "good" camera rotation motion. Note that zoom progress
                    //  is distinct from orientation progress (which captures what is at the center of the viewport).
                    //  This allows certain control over pan-relative-to-zoom.
                    //
                    var orientationProgress = function (t) {
                        // TODO: see above implementation notes or zoomProgress
                        if(t < preTime || timeDelta < MIN_INTERPOLATIONDURATION) {
                            // t is in the holdDuration, return the preKf's offset
                            return 0;
                        } else {
                            var rawProgress = (t - preTime) / timeDelta;
                            return easingHelper ? easingHelper.ease(rawProgress) : Ease(rawProgress);
                        }
                    };
                    this.interpolateRegion = function (t, region) {
                        //
                        // Interpolate "Zoom"
                        //
                        var zp = zoomProgress(t);
                        region.span.x = preSpanX * (1 - zp) + postSpanX * zp;
                        region.span.y = preSpanY * (1 - zp) + postSpanY * zp;
                        //
                        // Interpolate "Orientation"
                        //
                        var op = orientationProgress(t);
                        qh.interpolateCenter(op, region.center);
                    };
                }
                viewportInterpolator2D.prototype.interpolateRegion = // private iState: InterpolationState;
                function (t, region) {
                };
                viewportInterpolator2D.prototype.interpolate = function (time, kf) {
                    if(!kf) {
                        return null;
                    }
                    var kfState = kf.state[this.sliverId];
                    this.interpolateRegion(time, kfState.region);
                };
                viewportInterpolator2D.prototype.interpolateRegion = function (t, region) {
                };
                return viewportInterpolator2D;
            })();
            Interpolators.viewportInterpolator2D = viewportInterpolator2D;            
        })(Ext.Interpolators || (Ext.Interpolators = {}));
        var Interpolators = Ext.Interpolators;
    })(rin.Ext || (rin.Ext = {}));
    var Ext = rin.Ext;
})(rin || (rin = {}));
//@ sourceMappingURL=ViewportInterpolator2D.js.map
