var rin;
(function (rin) {
    (function (Ext) {
        /// <reference path="rintypes.d.ts"/>
        //
        // RIN Trajectory implementation (part of Nonlinear Storyboard functionality)
        //
        // NOTE: THIS CODE IS GENERATED FROM trajectory.ts using the TypeScript compiler.
        // MAKE SURE THAT CHANGES ARE REFLECTED IN THE .TS FILE!
        //
        // Copyright (C) 2013 Microsoft Research
        //
        (function (Interpolators) {
            // Class to interpolate a viewport.
            var linearViewportInterpolator = (function () {
                function linearViewportInterpolator(iState) {
                    this.sliverId = "viewport";
                    this.iState = iState;
                }
                linearViewportInterpolator.prototype.interpolate = function (time, kf) {
                    function doubleInterpolate(pre, post) {
                        return (post - pre) * t / d + pre;
                    }

                    if(!kf) {
                        return null;
                    }
                    var kfState = kf.state[this.sliverId];
                    if(this.iState.postKf && this.iState.preKf) {
                        var postKfState = this.iState.postKf.state[this.sliverId];
                        var preKfState = this.iState.preKf.state[this.sliverId];
                        var d = this.iState.postKf.offset - this.iState.preKf.offset;
                        var t = time - this.iState.preKf.offset;
                        
                        kfState.region.center.x = doubleInterpolate(preKfState.region.center.x, postKfState.region.center.x);
                        kfState.region.center.y = doubleInterpolate(preKfState.region.center.y, postKfState.region.center.y);
                        kfState.region.span.x = doubleInterpolate(preKfState.region.span.x, postKfState.region.span.x);
                        kfState.region.span.y = doubleInterpolate(preKfState.region.span.y, postKfState.region.span.y);
                        if(postKfState.rotation && preKfState.rotation) {
                            kfState.rotation = doubleInterpolate(preKfState.rotation, postKfState.rotation);
                        }
                    } else {
                        var preOrPostKf = this.iState.preKf || this.iState.postKf;
                        var preOrPostkfState = preOrPostKf.state[this.sliverId];
                        kfState.region.center.x = preOrPostkfState.region.center.x;
                        kfState.region.center.y = preOrPostkfState.region.center.y;
                        kfState.region.span.x = preOrPostkfState.region.span.x;
                        kfState.region.span.y = preOrPostkfState.region.span.y;
                        kfState.rotation = preOrPostkfState.rotation;
                    }
                    return kf;
                };
                return linearViewportInterpolator;
            })();
            Interpolators.linearViewportInterpolator = linearViewportInterpolator;            
            // Class to interpolate a double valued sliver on a linear path.
            var linearDoubleInterpolator = (function () {
                function linearDoubleInterpolator(sliverId, iState) {
                    this.sliverId = sliverId;
                    this.sliverId = sliverId;
                    this.iState = iState;
                }
                linearDoubleInterpolator.prototype.interpolate = function (time, kf) {
                    if(!kf) {
                        return null;
                    }
                    if(this.iState.postKf && this.iState.preKf) {
                        var postKfState = this.iState.postKf.state[this.sliverId];
                        var preKfState = this.iState.preKf.state[this.sliverId];
                        // Both preKf and postKf are present, interpolate the value.
                        var c = postKfState - preKfState;
                        var t = time - this.iState.preKf.offset;
                        var b = preKfState;
                        var d = this.iState.postKf.offset - this.iState.preKf.offset;
                        var val = c * t / d + b;
                        kf.state[this.sliverId] = val;
                    } else {
                        var preOrPostKf = this.iState.preKf || this.iState.postKf;
                        kf.state[this.sliverId] = preOrPostKf.state[this.sliverId];
                    }
                    return kf;
                };
                return linearDoubleInterpolator;
            })();
            Interpolators.linearDoubleInterpolator = linearDoubleInterpolator;            
            // Class to choose previous keyframe sliver when no interpolator is available.
            var discreteInterpolator = (function () {
                function discreteInterpolator(sliverId, iState) {
                    this.sliverId = sliverId;
                    this.sliverId = sliverId;
                    this.iState = iState;
                }
                discreteInterpolator.prototype.interpolate = function (time, kf) {
                    if(kf && this.iState.preKf) {
                        kf.state[this.sliverId] = this.iState.preKf.state[this.sliverId];
                    }
                    return kf;
                };
                return discreteInterpolator;
            })();
            Interpolators.discreteInterpolator = discreteInterpolator;            
        })(Ext.Interpolators || (Ext.Interpolators = {}));
        var Interpolators = Ext.Interpolators;
    })(rin.Ext || (rin.Ext = {}));
    var Ext = rin.Ext;
})(rin || (rin = {}));
//@ sourceMappingURL=BasicInterpolators.js.map
