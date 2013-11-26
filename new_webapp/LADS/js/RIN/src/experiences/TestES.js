/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../Core/Common.js"/>
/// <reference path="../Core/TaskTimer.js"/>
/// <reference path="../Core/ESItem.js"/>
/// <reference path="../Core/ESTimer.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="../contracts/IOrchestrator.js"/>
/// <reference path="../Core/ScreenPlayInterpreter.js"/>
/// <reference path="../Core/Orchestrator.js"/>
/// <reference path="../Core/ESItemsManager.js"/>
/// <reference path="../Core/EventLogger.js"/>
/// <reference path="../contracts/DiscreteKeyframeESBase.js" />

window.rin = window.rin || {};

rin.TestES = function (orchestrator, esData) {
    this.stateChangedEvent = new rin.internal.List();
    this._orchestrator = orchestrator;
    this._userInterfaceControl = rin.util.createElementWithHtml(rin.TestES.elementHTML).firstChild;
    this._esData = esData;
    this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
};

rin.TestES.prototype = new rin.contracts.DiscreteKeyframeESBase();
rin.TestES.base = rin.contracts.DiscreteKeyframeESBase.prototype;

rin.TestES.prototypeOverrides = {
    logInfo: function (info) {
        rin.util.assignAsInnerHTMLUnsafe(this._userInterfaceControl, info + "<br/>" + this._userInterfaceControl.innerHTML);
    },
    load: function (offset) {
        this.setState(rin.contracts.experienceStreamState.buffering);
        var self = this;
        this.logInfo("AuxData: " + this._esData.data["default"]);
        this.logInfo("Loading Resource " + this._url);
        setTimeout(function () { self.setState(rin.contracts.experienceStreamState.ready) }, 3900);
        rin.TestES.base.load.call(this, offset);
    },
    play: function (transitionTime) {
        this.logInfo("Play called");
        rin.TestES.base.play.call(this, transitionTime);
    },
    pause: function (transitionTime) {
        this.logInfo("Pause called");
        rin.TestES.base.pause.call(this, transitionTime);
    },
    seek: function (offset) {
        this.logInfo("Seek called at offset " + offset / 1000);
        rin.TestES.base.seek.call(this, offset);
    },
    displayKeyframe: function (keyframeData) {
        this.logInfo("Loading keyframedata at offset {0} data:{1}".rinFormat(keyframeData.offset, keyframeData.data["default"]));
    },
    resetUserInterface: function () {
        //this._userInterfaceControl.innerHTML = "Resetting... cleared logs";
    }
};

rin.util.overrideProperties(rin.TestES.prototypeOverrides, rin.TestES.prototype);

rin.TestES.elementHTML = "<div style='height:100%;width:100%;overflow:auto;color:white;'>This is the test experience stream.<br/></div>";

rin.TestESFactory = {
    createInstance: function (esData, orchestrator) { return new rin.TestES(orchestrator, esData); },
    getProviderTypeId: function () { return "MicrosoftResearch.Rin.TestExperienceStream"; },
    isSupportedVersion: function (version) { return true; }
};

rin.ext.esFactories.push(rin.TestESFactory);
