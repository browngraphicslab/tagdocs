var rin;
(function (rin) {
    (function (Ext) {
        /// <reference path="rintypes.d.ts"/>
        //
        // Nonlinear Storyboard implementation.
        //
        // NOTE: THIS CODE IS GENERATED FROM nonLinearStoryboard.ts using the TypeScript compiler.
        // MAKE SURE THAT CHANGES ARE REFLECTED IN THE .TS FILE!
        //
        // Copyright (C) 2013 Microsoft Research
        //
        (function (NonLinearStoryboard) {
            var STOPPED = 0, PLAYING = 1, PAUSING = 2, PAUSED = 3;
            // state values;
                        function log(str) {
                console.log(str);
            }
            ;
            function buildStoryboard(sb) {
                var state = STOPPED;
                var startAbsoluteTime = 0;
                var startOffset = 0;
                var activeTraj = null;
                function renderAt(time) {
                    var offset = 0;
                    var callStop = false;
                    ;
                    if(state === STOPPED) {
                        //log("Ignoring because state is STOPPED");
                        return;
                    }
                    offset = startOffset + (time - startAbsoluteTime);
                    if(offset < 0) {
                        //log("Ignoring because offset<0");
                        return;
                    }
                    if(offset > activeTraj.duration) {
                        //log("Past duration; stopping...");
                        offset = activeTraj.duration;
                        callStop = true;
                    }
                    activeTraj.renderAt(offset)// We render once even if passed the time, to ensure the end state is actually rendered.
                    ;
                    if(callStop) {
                        stop();
                    }
                }
                function getFrameAt(offset, traj) {
                    if(offset > traj.duration) {
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
                    sb.stopAnimation()// call back to stop animation.
                    ;
                }
                function playPause(traj, offset, pause/*, completionCallback() */ ) {
                    var ct = sb.getCurrentTime();
                    var activeTrajOffset = 0;
                    if(activeTraj != null) {
                        activeTrajOffset = startOffset + (ct - startAbsoluteTime);
                    }
                    startAbsoluteTime = ct;
                    startOffset = offset;
                    activeTraj = sb.buildTransitionTrajectory(activeTraj, activeTrajOffset, traj, offset, pause);
                    activeTraj.targetExperienceStreamId = traj.targetExperienceStreamId;
                    sb.startAnimation()// callback to start animation (even if pausing; once transition trajectory is done stop() will be executed)
                    ;
                }
                return {
                    play: function (traj, offset) {
                        //log("PLAY!");
                        state = PLAYING;
                        playPause(traj, offset, false);
                    },
                    pause: function (traj, offset) {
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
                };
            }
            NonLinearStoryboard.buildStoryboard = buildStoryboard;
        })(Ext.NonLinearStoryboard || (Ext.NonLinearStoryboard = {}));
        var NonLinearStoryboard = Ext.NonLinearStoryboard;
    })(rin.Ext || (rin.Ext = {}));
    var Ext = rin.Ext;
})(rin || (rin = {}));
//@ sourceMappingURL=nonLinearStoryboard.js.map
