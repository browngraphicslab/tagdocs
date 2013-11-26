/// <reference path="rintypes.d.ts"/>
//
// RIN Trajectory implementation (part of Nonlinear Storyboard functionality)
//
// NOTE: THIS CODE IS GENERATED FROM trajectory.ts using the TypeScript compiler.
// MAKE SURE THAT CHANGES ARE REFLECTED IN THE .TS FILE!
//
// Copyright (C) 2013 Microsoft Research 
//
module rin.Ext.Interpolators {

    // Class to interpolate a viewport.
    export class linearViewportInterpolator {
        private sliverId: string = "viewport";
        private iState: InterpolationState;

        constructor(iState: InterpolationState) {
            this.iState = iState;
        };

        public interpolate(time: number, kf: Keyframe) {
            if (!kf) {
                return null;
            }

            var kfState = kf.state[this.sliverId];

            if (this.iState.postKf && this.iState.preKf) {
                var postKfState = this.iState.postKf.state[this.sliverId];
                var preKfState = this.iState.preKf.state[this.sliverId];
                var d = this.iState.postKf.offset - this.iState.preKf.offset;
                var t = time - this.iState.preKf.offset;

                function doubleInterpolate(pre, post) {
                    return (post - pre) * t / d + pre;
                }

                kfState.region.center.x = doubleInterpolate(preKfState.region.center.x, postKfState.region.center.x);
                kfState.region.center.y = doubleInterpolate(preKfState.region.center.y, postKfState.region.center.y);
                kfState.region.span.x = doubleInterpolate(preKfState.region.span.x, postKfState.region.span.x);
                kfState.region.span.y = doubleInterpolate(preKfState.region.span.y, postKfState.region.span.y);

                if (postKfState.rotation && preKfState.rotation) {
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
        }
    }

    // Class to interpolate a double valued sliver on a linear path.
    export class linearDoubleInterpolator {
        private sliverId : string;
        private iState : InterpolationState;

        constructor(public sliverId: string, iState: InterpolationState) {
            this.sliverId = sliverId;
            this.iState = iState;
        };

        public interpolate(time: number, kf: Keyframe) {
            if (!kf) {
                return null;
            }
            if (this.iState.postKf && this.iState.preKf) {
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
        }
    }

    // Class to choose previous keyframe sliver when no interpolator is available.
    export class discreteInterpolator {
        private sliverId: string;
        private iState: InterpolationState;

        constructor(public sliverId: string, iState: InterpolationState) {
            this.sliverId = sliverId;
            this.iState = iState;
        };

        public interpolate(time: number, kf: Keyframe) {
            if (kf && this.iState.preKf) {
                kf.state[this.sliverId] = this.iState.preKf.state[this.sliverId];
            }
            return kf;
        }
    }
}