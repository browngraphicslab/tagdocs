//
// Basic unit tests AND common code for RIN Nonlinear Storyboard and Trajectory testing
//
// Copyright (C) 2013 Microsoft Research 
//
/// <reference path="../../../src/storyboard/nonLinearStoryboard.d.ts"/>
/// <reference path="../../../src/storyboard/trajectory.d.ts"/>
/// <reference path="../embeddedArtifacts/qunit.d.ts"/>

module rin.nonlinearStoryboardTests {

     export function generateSimpleExperience() {
         return {
             data: {
                   defaultKeyframe: { offset: 0, state: { value: 0 } },
             },
             experienceStreams: {
                    "E1": { // Experience E1
                        duration:20,
                        keyframes: [
                            { offset: 0, state: { value: 0 } },
                            { offset: 10, state: { value: 10 } }
                        ]
                    }
                }
            }
        }

     export function test0() {

         //
         // Get get some test data...
         //
         var e = nonlinearStoryboardTests.generateSimpleExperience();

         var trajectoryBuilder = rin.Ext.Trajectory.newTrajectoryBuilder(e);

         //
         // Override required functions of trajectoryBuilder...
         //
         trajectoryBuilder.keyframeInterpolatorPost = function (iState: InterpolationState) {
             return {
                 interpolate: function (time: number, kf: Keyframe) {
                     //
                     // Fill out kf with interpolated value
                     //
                     return kf;
                 }
             }
         };

         trajectoryBuilder.renderKeyframe = function (kf: Keyframe) {
             //
             // Call to Experience Provider to actually render the keyframe - 
             //
         }

         //
         // Hook the animation start/stop notification handlers - note that start and stop should be idempotent - they could get called multiple times (eg. two starts in a row).
         // 
         trajectoryBuilder.storyboardHelper.startAnimation = function(){/*...*/
         };

         trajectoryBuilder.storyboardHelper.stopAnimation = function () {/*...*/
         };

        ok( 
            !!(trajectoryBuilder && trajectoryBuilder.storyboardHelper), 
            "trajectoryBuilder && trajectoryBuilder.storyboardHelper"
            );
        var sb = rin.Ext.NonLinearStoryboard.buildStoryboard(trajectoryBuilder.storyboardHelper);
        ok(!!sb, "sb!=null");

        //
        // Typical steps called when Orchestractor calls in with play/pause(EsID, offset) - get a traj, then call sb.play/pause(traj, offset)
        //
        var traj = trajectoryBuilder.buildTrajectoryFromExperienceStream("E1");            
        ok(!!traj, "traj!=null")
        sb.play(traj, 0);

         // 
         // Actually, sb.renderAt is not called in production - instead call sb.render() in the context of the render loop - this loop should be activated/started when startAnimation is called,
         // and deactivated when stopAnimation is called...
         //
        sb.renderAt(10); 

        sb.pause(traj, 10 /*, completionCallback() */);
        sb.renderAt(10);

         //
         // Call this to instantly stop animation - typically when there is user-interaction, but also on unload.
         // Do not call stop (or pause) when going from play(esID,...) to play(someOtherEsID, ...).
         //
        sb.stop();
    }
}


//
// Register tests with QUnit
//
(function () {
    this.module("Nonlinear Storyboard Tests");

    test("Simple Test", function () {
        rin.nonlinearStoryboardTests.test0();
    });

    /*test("Grid Test", function () {
        rin.nonlinearStoryboardTests.test1();
    });*/

})();