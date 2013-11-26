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

// ES for showing the buffering state.
rin.internal.DefaultBufferingES = function (orchestrator) {
    this.stateChangedEvent = new rin.contracts.Event();
    this._orchestrator = orchestrator;
    this._userInterfaceControl = rin.util.createElementWithHtml(rin.internal.DefaultBufferingES.elementHTML);
    var loaderimageUrl = orchestrator.getResourceResolver().resolveSystemResource("images/loader.gif");
    if (loaderimageUrl)
        $(".loaderGIFContainer", this._userInterfaceControl).attr("src", loaderimageUrl);

    this._orchestrator.isPlayerReadyChangedEvent.subscribe(function () { this._onOrchestratorIsPlayerReadyStateChanged() }.bind(this));
    rin.util.overrideProperties({ zIndex: 200000, width: "100%", height: "100%", display: "none" }, this._userInterfaceControl.style);
};

rin.internal.DefaultBufferingES.prototype = {
    isSystemES: true,
    load: function (experienceStreamId) {
        this._updateBufferingState();
    },
    play: function (offset, experienceStreamId) {
        this._updateBufferingState();
    },
    pause: function (offset, experienceStreamId) {
        this._updateBufferingState();
    },
    unload: function () {
        this._updateBufferingState();
    },
    getState: function () {
        return rin.contracts.experienceStreamState.ready;
    },
    stateChangedEvent: new rin.contracts.Event(),
    getUserInterfaceControl: function () {
        return this._userInterfaceControl;
    },
    // Show the buffering visual.
    showBuffering: function () {
        if (this._showBufferingTimerId) return;
        this._showBufferingTimerId = setTimeout(function () {
            var $userInterfaceControl = $(this._userInterfaceControl);
            $userInterfaceControl.stop(true);
            this._userInterfaceControl.style["display"] = "block";
            $userInterfaceControl.animate({ opacity: 0.5 }, "fast");
        }.bind(this), 700);
        if (this._orchestrator) this._orchestrator.eventLogger.logEvent("->-> BufferingES: ShowBuffering called.");
    },
    // Hide the buffering visual.
    hideBuffering: function () {
        clearTimeout(this._showBufferingTimerId);
        this._showBufferingTimerId = null;
        var $userInterfaceControl = $(this._userInterfaceControl);
        $userInterfaceControl.stop(true);
        $userInterfaceControl.animate({ opacity: 0.0 }, "fast", function () {
            this._userInterfaceControl.style["display"] = "none";
        }.bind(this));
        if (this._orchestrator) this._orchestrator.eventLogger.logEvent("->-> BufferingES: HideBuffering called.");
    },

    _userInterfaceControl: rin.util.createElementWithHtml(""),
    _onOrchestratorIsPlayerReadyStateChanged: function () {
        this._updateBufferingState();
    },
    _updateBufferingState: function () {
        var isPlayerReady = this._orchestrator.getIsPlayerReady();
        if (isPlayerReady) {
            this.hideBuffering();
        }
        else {
            this.showBuffering();
        } 
    },
    _showBufferingTimerId: null,
    _orchestrator: null
};

rin.internal.DefaultBufferingES.elementHTML = "<div id='bufferingDiv' style='margin:auto;width:100%;height:100%;font-size:18px;color:white;display:table;background:rgba(0,0,0,0.1);z-index:10000000;'><div style='text-align:center;vertical-align: middle;display:table-cell;'><div style='width:auto;height:auto;clear:right;margin-left:auto;margin-right:auto;margin-bottom:8px;'><img class='loaderGIFContainer' /></div>Loading...</div></div>";