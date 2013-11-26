/// <reference path="rintypes.d.ts"/>
//
// Nonlinear Storyboard implementation.
//
// NOTE: THIS CODE IS GENERATED FROM nonLinearStoryboard.ts using the TypeScript compiler.
// MAKE SURE THAT CHANGES ARE REFLECTED IN THE .TS FILE!
//
// Copyright (C) 2013 Microsoft Research 
//
module rin.Ext.NonLinearStoryboard {
    var STOPPED = 0, PLAYING = 1, PAUSING = 2, PAUSED = 3; // state values;


    function log(str: string) {
        console.log(str);
    };
    
    export function buildStoryboard(sb: StoryboardHelper): IStoryboard {
        var state = STOPPED;
        var startAbsoluteTime = 0;
        var startOffset = 0;
        var activeTraj: ITrajectory = null;

        function renderAt(time: number) {
            var offset = 0;
            var callStop = false;;
            if (state === STOPPED) {
                //log("Ignoring because state is STOPPED");
                return;
            }
            offset = startOffset + (time - startAbsoluteTime);
            if (offset < 0) {
                //log("Ignoring because offset<0");
                return;
            }
            if (offset > activeTraj.duration) {
                //log("Past duration; stopping...");
                offset = activeTraj.duration;
                callStop = true;
            }

            activeTraj.renderAt(offset); // We render once even if passed the time, to ensure the end state is actually rendered.

            if (callStop) {
                stop();
            }
        }

        function getFrameAt(offset, traj: ITrajectory) {
            if (offset > traj.duration) {
                offset = traj.duration;
            }

            return traj.sampleAt(offset);
        }

        function stop() {
            //log("STOP!");
            state = STOPPED;
            activeTraj = null;
            startOffset = 0;
            startAbsoluteTime = 0;
            sb.stopAnimation(); // call back to stop animation.
        }

        function playPause(traj: ITrajectory, offset: number, pause: bool /*, completionCallback() */) {
            var ct = sb.getCurrentTime();
            var activeTrajOffset = 0;
            if (activeTraj != null) {
                activeTrajOffset = startOffset + (ct - startAbsoluteTime);
            }
            startAbsoluteTime = ct;
            startOffset = offset;

            activeTraj = sb.buildTransitionTrajectory(activeTraj, activeTrajOffset, traj, offset, pause);
            activeTraj.targetExperienceStreamId = traj.targetExperienceStreamId;

            sb.startAnimation(); // callback to start animation (even if pausing; once transition trajectory is done stop() will be executed)
        }

        return {

            play: function (traj: ITrajectory, offset: number) {
                //log("PLAY!");
                state = PLAYING;
                playPause(traj, offset, false);

            },

            pause: function (traj: ITrajectory, offset: number) {
                //log("PAUSE!");
                state = PAUSING;
                playPause(traj, offset, true);
            },

            renderAt: renderAt,

            getFrameAt: getFrameAt,

            render: function () {
                renderAt(sb.getCurrentTime());
            },

            stop: stop
        }
    }

}