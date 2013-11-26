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
/// <reference path="../contracts/IOrchestrator.js"/>
/// <reference path="../core/Common.js">
/// <reference path="../core/Orchestrator.js">

window.rin = window.rin || {};
window.rin.internal = window.rin.internal || {};

rin.internal.SelfTester = function (orchestrator) {
    "use strict";

    var self = this,
        timer = new rin.internal.Timer(),
        getNextInterval = function () {
            return rin.util.randInt(self.minimumTimeInterval, self.maximumTimeInterval);
        },
        narrativeDuration = 0,
        allScreenplays,
        numberOfScreenplays,
        lastDeepState = null,
        initialize = function () {
            self.minimumTimeInterval = self.minimumTimeInterval || 1;
            self.maximumTimeInterval = self.maximumTimeInterval || (orchestrator && orchestrator.getNarrativeInfo() && orchestrator.getNarrativeInfo().totalDuration) || 3;
            narrativeDuration = orchestrator.getNarrativeInfo().totalDuration;
            allScreenplays = orchestrator.getSegmentInfo().screenplays;
            numberOfScreenplays = Object.keys(allScreenplays).length;
        },
        doOperation = function () {
            var opCode = Math.floor(rin.util.randInt(0, 8)),
                currrentTimeOffset = orchestrator.getCurrentLogicalTimeOffset(),
                esWithInteractionControls,
                nextOffset,
                nextScreenplay;
            switch (opCode) {
                case 0:
                case 1:
                case 2:
                    if (orchestrator.getPlayerState() === rin.contracts.playerState.playing) {
                        orchestrator.playerControl.pause();
                        orchestrator.eventLogger.logEvent(">>> Self Tester issues a pause at " + currrentTimeOffset);
                    } else if (orchestrator.getPlayerState() === rin.contracts.playerState.pausedForExplore) {
                        orchestrator.playerControl.play();
                        orchestrator.eventLogger.logEvent(">>> Self Tester issues a play at " + currrentTimeOffset);
                    }
                    break;
                case 3:
                    nextOffset = rin.util.rand(0, narrativeDuration);
                    orchestrator.playerControl.pause(nextOffset);
                    break;
                case 4:
                    nextOffset = rin.util.rand(0, narrativeDuration);
                    orchestrator.playerControl.play(nextOffset);
                    break;
                case 5:
                    esWithInteractionControls = orchestrator.getCurrentESItems().firstOrDefault(function (item) {
                        return typeof item.experienceStream.getInteractionControls === 'function';
                    });
                    if (esWithInteractionControls) {
                        orchestrator.startInteractionMode(esWithInteractionControls.experienceStream);
                        self.interactionEvent.publish();
                    }
                    break;
                case 6:
                    if (!lastDeepState) {
                        lastDeepState = orchestrator.playerControl.getDeepStateUrl();
                    } else {
                        var deepstateUrl = orchestrator.playerControl.resolveDeepstateUrlFromAbsoluteUrl(lastDeepState);
                        orchestrator.playerControl.load(deepstateUrl, function (isInDeepState) {
                            if (!isInDeepState) orchestrator.playerControl.play();
                        });
                        lastDeepState = null;
                    }
                    break;
                case 7:
                    var nextScpId = rin.util.randInt(0, numberOfScreenplays) | 0; // (| 0) Strips the floating point part
                    nextScreenplay = Object.keys(allScreenplays)[nextScpId];
                    narrativeDuration = orchestrator.esItemsManager._getScreenPlayInterpreter(nextScreenplay).getEndTime();
                    nextOffset = rin.util.rand(0, narrativeDuration);
                    orchestrator.playerControl.play(nextOffset, nextScreenplay);
                    break;
            }
        };

    timer.tick = function () {
        doOperation();
        timer.intervalSeconds = getNextInterval();
    };

    this.interactionEvent = new rin.contracts.Event();
    this.minimumTimeInterval = 0;
    this.maximumTimeInterval = 0;

    this.startSelfTest = function () {
        initialize();
        timer.intervalSeconds = getNextInterval();
        timer.start();
    };
    this.stopSelfTest = function () {
        timer.stop();
    };    
};