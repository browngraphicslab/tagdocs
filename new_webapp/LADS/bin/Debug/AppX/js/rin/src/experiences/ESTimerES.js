/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../core/Common.js"/>
/// <reference path="../core/TaskTimer.js"/>
/// <reference path="../core/ESItem.js"/>
/// <reference path="../core/ESTimer.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="../contracts/IOrchestrator.js"/>
/// <reference path="../core/ScreenPlayInterpreter.js"/>
/// <reference path="../core/Orchestrator.js"/>
/// <reference path="../core/ESItemsManager.js"/>
/// <reference path="../core/EventLogger.js"/>

window.rin = window.rin || {};

rin.internal.ESTimerES = function (orchestrator, esManager) {
    this.stateChangedEvent = new rin.contracts.Event();
    this._orchestrator = orchestrator;
    this.esTimer = new rin.internal.ESTimer(orchestrator, esManager);
};

rin.internal.ESTimerES.prototype = {
    isSystemES: true,
    load: function (offset) {
        this.esTimer.loadESItmes();
        if (offset > 0) this.seek(0);
    },
    play: function (offset, experienceStreamId) {
        this._orchestrator.eventLogger.logEvent("!! Logical timer played at : {0}", this.esTimer.taskTimer.getCurrentTimeOffset() / 1000);
        this.esTimer.taskTimer.seek(offset);
        this.esTimer.taskTimer.play();
    },
    pause: function (offset, experienceStreamId) {
        this._orchestrator.eventLogger.logEvent("!! Logical timer paused at : {0}", this.esTimer.taskTimer.getCurrentTimeOffset() / 1000);
        this.esTimer.taskTimer.seek(offset);
        this.esTimer.taskTimer.pause();
    },
    unload: function () {
        this.esTimer.taskTimer.pause();
    },
    getState: function () {
        return rin.contracts.experienceStreamState.ready;
    },
    stateChangedEvent: new rin.contracts.Event(),
    getUserInterfaceControl: function () { return null; },
    esTimer: null,

    _orchestrator: null
};
