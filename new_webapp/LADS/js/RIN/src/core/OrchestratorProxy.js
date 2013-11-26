/// <reference path="Common.js"/>
/// <reference path="TaskTimer.js"/>
/// <reference path="ESItem.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="../contracts/IOrchestrator.js"/>
/// <reference path="ScreenPlayInterpreter.js"/>
/// <reference path="Orchestrator.js"/>
/// <reference path="ESItemsManager.js"/>
/// <reference path="EventLogger.js"/>

/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

window.rin = window.rin || {};
window.rin.internal = window.rin.internal || {};

rin.internal.OrchestratorProxy = function (orchestrator) {
    this._orchestrator = orchestrator;

    this.playerStateChangedEvent = orchestrator.playerStateChangedEvent;
    this.eventLogger = orchestrator.eventLogger;
};

rin.internal.OrchestratorProxy.prototype = {
    _experienceStream: null,
    _orchestrator: null,

    init: function (experienceStream) {
        this._experienceStream = experienceStream;
    },

    getResourceResolver: function () {
        return this._orchestrator.getResourceResolver();
    },

    getCurrentLogicalTimeOffset: function () {
        return this._orchestrator.getCurrentLogicalTimeOffset();
    },

    getRelativeLogicalTime: function (experienceStreamId, absoluteLogicalTime) {
        return this._orchestrator.getRelativeLogicalTime(this._experienceStream, experienceStreamId, absoluteLogicalTime);
    },

    play: function (offset, screenPlayId) {
        this._orchestrator.play(offset, screenPlayId);
    },

    pause: function (offset, screenPlayId) {
        this._orchestrator.pause(offset, screenPlayId);
    },

    getIsMuted: function () {
        return this._orchestrator.getIsMuted();
    },

    setIsMuted: function (value) {
        this._orchestrator.setIsMuted(value);
    },

    getPlayerVolumeLevel: function () {
        return this._orchestrator.getPlayerVolumeLevel();
    },

    setPlayerVolumeLevel: function (value) {
        this._orchestrator.setPlayerVolumeLevel(value);
    },

    onESEvent: function (eventId, eventData) {
        this._orchestrator.onESEvent(this._experienceStream, eventId, eventData);
    },

    startInteractionMode: function () {
        var isOnStage = this._orchestrator.getIsOnStage(this._experienceStream);
        this._orchestrator.startInteractionMode(isOnStage ? this._experienceStream : null);
    },

    getInteractionControls: function (controlNames, callback) {
        var isOnStage = this._orchestrator.getIsOnStage(this._experienceStream);
        return isOnStage ? this._orchestrator.getInteractionControls(controlNames, callback): null;
    },

    getAllSupportedControls: function () {
        return this._orchestrator.getAllSupportedControls(this._experienceStream);
    },

    getPlayerState: function () {
        return this._orchestrator.getPlayerState();
    },

    getIsOnStage: function () {
        return this._orchestrator.getIsOnStage(this._experienceStream);
    },

    getScreenplayPropertyTable: function () {
        return this._orchestrator.getScreenplayPropertyTable(this._experienceStream);
    },

    getCurrentStateSeekUrl: function () {
        return this._orchestrator.getCurrentStateSeekUrl();
    },

    seekUrl: function (seekUrl) {
        return this._orchestrator.seekUrl(seekUrl);
    },

    debugOnlyGetESItemInfo: function () {
        return this._orchestrator.debugOnlyGetESItemInfo(this._experienceStream);
    },

    getCurrentESItems: function(){
        return this._orchestrator.getCurrentESItems();
    },

    getESItems: function () {
        return this._orchestrator.esItemsManager.screenPlayInterpreter.getESItems();
    },

    createExperienceStream: function (providerId, esData, orchestratorProxy) {
        return this._orchestrator.createExperienceStream(providerId, esData, orchestratorProxy);
    },

    getStageControl: function () {
        return this._orchestrator.playerControl.stageControl;
    },
    getPlayerRootControl: function () {
        return this._orchestrator.playerControl.playerRootElement;
    },
    getPlayerConfiguration: function () {
        return this._orchestrator.playerConfiguration;
    },
    getNarrativeInfo: function () {
        return this._orchestrator.getNarrativeInfo();
    },
    getSegmentInfo: function () {
        return this._orchestrator.getSegmentInfo();
    },
    getPlayerControl: function () {
        return this._orchestrator.playerControl; //ToDo - verify and remove this method after everest
    }
};
