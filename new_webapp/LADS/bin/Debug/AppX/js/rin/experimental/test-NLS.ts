/// <reference path="../src/storyboard/nonLinearStoryboard.ts" />
/// <reference path="../src/storyboard/trajectory.ts" />
/// <reference path="../src/storyboard/basicinterpolators.ts" />
//
// Code to invoke the suite of NonlinearStoryboard tests...
//
// Copyright (C) 2013 Microsoft Research 
//
//import Trajectory=module("../src/storyboard/trajectory");
//import Storyboard = module("../src/storyboard/nonLinearStoryboard");

module rin.NLTests {

    export function log(...content: string[]) {
        console.log(content[0]);
    }

    export function assert(cond: any, strCond: string): void {
        if (!cond) {
            throw { name: "testFailedException", message: "ASSERTION: " + strCond };
        }
    }

    export function runTests() {
        NLTests.log("NLTest: test0...");
        NLTests.test0();
    }

    export function generateSimpleExperience() {
        return {
            data: {
                defaultKeyframe: {
                    offset: 0,
                    state: { value: 0 }
                }
            },
            experienceStreams: {
                "E1": { // Experience E1
                    duration: 20,
                    keyframes: [
                        { offset: 5, state: { value: 5 } },
                        { offset: 10, state: { value: 10 } },
                        { offset: 15, state: { value: 5 } }
                    ]


                    //keyframes: [
                    //    { offset: 0, state: { value: 0, value2: 100 } },
                    //    { offset: 10, state: { value: 10 } },
                    //    { offset: 15, state: { value: 15, value2: 250 } }
                    //]
                }
            }
        }
    }

    export function test0() {

        //
        // Get get some test data...
        //
        var e = NLTests.generateSimpleExperience();

        var trajectoryBuilder = rin.Ext.Trajectory.newTrajectoryBuilder(e);

        //
        // Override required functions of trajectoryBuilder...
        //
        trajectoryBuilder.keyframeInterpolatorPost = function (iState: InterpolationState) {
            return null;
        };

        trajectoryBuilder.sliverInterpolator = function (sliverId: string, iState: InterpolationState) {
            if (sliverId == "value")
                return new rin.Ext.Interpolators.linearDoubleInterpolator(sliverId, iState);

            return null;
        };

        trajectoryBuilder.renderKeyframe = function (kf: Keyframe) {
            //
            // Call to Experience Provider to actually render the keyframe - 
            //
            NLTests.log("NLTest: value " + kf.state.value);

            //NLTests.log("NLTest: value2 " + kf.state.value2);
        }

        //
        // Hook the animation start/stop notification handlers - note that start and stop should be idempotent - they could get called multiple times (eg. two starts in a row).
        // 
        trajectoryBuilder.storyboardHelper.startAnimation = function () {/*...*/
        };

        trajectoryBuilder.storyboardHelper.stopAnimation = function () {/*...*/
        };

        NLTests.assert(
            (trajectoryBuilder && trajectoryBuilder.storyboardHelper),
            "trajectoryBuilder && trajectoryBuilder.storyboardHelper"
            );
        var sb = rin.Ext.NonLinearStoryboard.buildStoryboard(trajectoryBuilder.storyboardHelper);
        NLTests.assert(sb, "sb!=null");

        //
        // Typical steps called when Orchestractor calls in with play/pause(EsID, offset) - get a traj, then call sb.play/pause(traj, offset)
        //
        var traj = trajectoryBuilder.buildTrajectoryFromExperienceStream("E1");
        NLTests.assert(traj, "traj!=null")
        sb.play(traj, 0);

        // 
        // Actually, sb.renderAt is not called in production - instead call sb.render() in the context of the render loop - this loop should be activated/started when startAnimation is called,
        // and deactivated when stopAnimation is called...
        //
        NLTests.log("calling render at 0");
        sb.renderAt(0);

        //NLTests.log("calling pause");
        //sb.pause(traj, 10 /*, completionCallback() */);

        NLTests.log("calling render at 5");
        sb.renderAt(5);

        NLTests.log("calling render at 10");
        sb.renderAt(10);

        NLTests.log("calling render at 11");
        sb.renderAt(11);

        NLTests.log("calling render at 15");
        sb.renderAt(15);

        //
        // Call this to instantly stop animation - typically when there is user-interaction, but also on unload.
        // Do not call stop (or pause) when going from play(esID,...) to play(someOtherEsID, ...).
        //
        NLTests.log("calling stop");
        sb.stop();
    }
}
