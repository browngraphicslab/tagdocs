/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="../core/Common.js"/>
/// <reference path="../core/ESItem.js"/>
/// <reference path="../core/EventLogger.js"/>
/// <reference path="../core/Orchestrator.js"/>
/// <reference path="../core/PlayerConfiguration.js"/>
/// <reference path="../core/PlayerControl.js"/>
/// <reference path="../core/ResourcesResolver.js"/>
/// <reference path="../core/RinDataProxy.js"/>
/// <reference path="../core/ScreenPlayInterpreter.js"/>
/// <reference path="../core/StageAreaManager.js"/>
/// <reference path="../core/TaskTimer.js"/>

window.rin = window.rin || {};

rin.internal.TestController = function () {
    /// <summary>Constructs a new TestController.</summary>
};

rin.internal.TestController.PlayerHtml = "\
    <div style='margin: 10px;'>Narrative duration: <span id='totalTime'></span> seconds</div> \
    <div style='margin: 10px;'>Current logical time: <span id='currentTime'></span></div> \
    <div style='margin: 10px;'> \
        <input id='playPauseButton' type='button' value='Pause' /> \
        <input id='randomSeekButton' type='button' value='Random seek' /> \
    </div> \
    <div style='margin: 10px;'><input id='selfTestCheckBox' type='checkbox'>Self-test</input> (seek randomly every 1 to 6 seconds)</div> \
    <table style='width: 1100px; margin: 0; padding: 0;' cellspacing='10'> \
        <tr> \
            <td>RIN Player</td> \
            <td>Debug Event Log</td> \
        </tr> \
        <tr> \
            <td><div id='playerArea' style='width:625px; height:500px; background-color:Gray; clip:rect(0, 0, 625, 500); overflow:hidden;'></div></td> \
            <td><div id='debugArea' style='width:450px; height:500px; overflow:scroll; background-color:Silver;'>Debug Event Log</div></td> \
        </tr> \
    </table>";

rin.internal.TestController.prototype = {
    playerControl: null,
    playerElement: null,
    seekPosition: null,
    playPauseButton: null,
    randomSeekButton: null,
    selfTestCheckBox: null,
    selfTestTimerId: null,

    initialize: function (elementId, narrativeId, playerConfiguration) {
        /// <summary>Creates the controller UI within the specified element, then loads the specified narrative.</summary>
        /// <param name="elementId" type="String">The ID of the HTML element that will host the player.</param>
        /// <param name="narrativeId" type="String">The ID of the narrative to load.</param>
        /// <param name="playerConfiguration" type="rin.PlayerConfiguration">The player configuration.</param>

        var self = this;
        this.playerElement = $("#" + elementId).first();
        this.playerElement.html(rin.internal.TestController.PlayerHtml);
        this.playPauseButton = $("#playPauseButton", this.playerElement);
        this.randomSeekButton = $("#randomSeekButton", this.playerElement);
        this.selfTestCheckBox = $("#selfTestCheckBox", this.playerElement);
        rin.internal.debug.debugWriteElement = $("#debugArea", this.playerElement).get(0);
        var stageControl = $("#playerArea", this.playerElement);
        rin.internal.debug.assert(stageControl.size() == 1, "Could not find stage control with ID 'playerArea'.");

        this.playerControl = new rin.internal.PlayerControl(stageControl.get(0), playerConfiguration);
        this.playerControl.orchestrator.playerStateChangedEvent.subscribe(function () { self._updatePlayPauseButtonText() });
        this.playerControl.load(narrativeId, function () {
            rin.internal.debug.write("TestController: PlayerControl.load completed.")
            self.playPauseButton.click(function () { self._togglePlayPause() });
            self.randomSeekButton.click(function () { self._seekRandomly() });
            self.selfTestCheckBox.change(function () { self._selfTestStateChanged() });
            self._monitorProgress();
        });
    },

    _togglePlayPause: function () {
        var playerState = this.playerControl.orchestrator.getPlayerState();
        if (playerState == rin.contracts.playerState.playing) {
            this.playerControl.pause();
        }
        else {
            this.playerControl.play();
        }
        this._updatePlayPauseButtonText();
    },

    _updatePlayPauseButtonText: function () {
        var playerState = this.playerControl.orchestrator.getPlayerState();
        if (playerState == rin.contracts.playerState.playing) {
            this.playPauseButton.val("Pause");
        }
        else if (playerState == rin.contracts.playerState.pausedForExplore) {
            this.playPauseButton.val("Resume");
        }
        else if (playerState == rin.contracts.playerState.stopped) {
            this.playPauseButton.val("Play");
        }
    },

    _selfTestStateChanged: function () {
        if (this.selfTestCheckBox.attr("checked")) {
            this._selfTestEventTriggered();
        }
        else if (this.selfTestTimerId) {
            clearTimeout(this.selfTestTimerId);
        }
    },

    _selfTestEventTriggered: function () {
        // Seek randomly half the time, toggle play/pause the other half of the time.
        var self = this;
        var rand = Math.floor(Math.random() * 2);
        if (rand == 0) {
            this._seekRandomly();
        }
        else {
            rin.internal.debug.write("==> TestController toggling play/pause.");
            this._togglePlayPause();
        }

        // Call again after a random delay.
        var randomTime = Math.floor(Math.random() * 5000) + 1000;
        this.selfTestTimerId = setTimeout(function () { self._selfTestEventTriggered(); }, randomTime);
    },


    _seekRandomly: function () {
        var totalDuration = this.playerControl.orchestrator.getNarrativeInfo().totalDuration;
        var seekPoint = Math.random() * totalDuration;
        rin.internal.debug.write("==> TestController seeking randomly to " + seekPoint + ".");
        this.playerControl.orchestrator.play(seekPoint);
    },

    _monitorProgress: function () {
        var totalDuration = Math.round(this.playerControl.orchestrator.getNarrativeInfo().totalDuration) / 1000;
        $("#totalTime", this.playerElement).text(totalDuration.toString());
        var orchestrator = this.playerControl.orchestrator;
        var currentTimeElement = $("#currentTime", this.playerElement);

        setInterval(function () {
            var t = Math.round(orchestrator.getCurrentLogicalTimeOffset());
            currentTimeElement.text(t.toString());
        }, 100);
    }
};
