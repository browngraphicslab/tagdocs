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
/// <reference path="../core/Common.js" />
/// <reference path="../core/EventLogger.js" />
/// <reference path="../core/PlayerConfiguration.js" />
/// <reference path="../core/ResourcesResolver.js" />
/// <reference path="../core/TaskTimer.js" />

window.rin = window.rin || {};

(function (rin) {
    // ES for playing video clips.
    var RinES = function (orchestrator, esData) {
        RinES.parentConstructor.apply(this, arguments);
        var self = this;
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(RinES.elementHTML).firstChild;
        this._esData = esData;        
        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, RinES);

    RinES.prototypeOverrides = {        
        // Load and initialize the video.
        load: function (experienceStreamId) {
            var self = this,
                loadComplete = function () {
                    if (self.getState() === rin.contracts.experienceStreamState.ready) {
                        self._rinPlayer.volume(self._baseVolume);
                        self._rinPlayer.mute(self._mute);
                    }
                };
            // Set to buffering till the load is complete.
            this.setState(rin.contracts.experienceStreamState.buffering);

            // Create the rin player.
            this._userInterfaceControl.rinPlayer = rin.createPlayerControl(this._userInterfaceControl, "controls=false");
            this._rinPlayer = rin.getPlayerControl(this._userInterfaceControl);
            
            // Monitor internal rin state change and update to the parent rin.
            this._rinPlayer.orchestrator.isPlayerReadyChangedEvent.subscribe(function (isReady) {
                if(isReady)
                    self.setState(rin.contracts.experienceStreamState.ready);
                else
                    self.setState(rin.contracts.experienceStreamState.buffering);
            });

            this._rinPlayer.orchestrator.playerStateChangedEvent.subscribe(function (state) {
                switch (state.currentState) {                    
                    case rin.contracts.playerState.pausedForExplore:
                        self._orchestrator.pause();
                        break;
                    case rin.contracts.playerState.playing:
                        self._orchestrator.play();
                        break;
                }
            });

            // Monitor internal interaction calls and update parent rin.
            this._rinPlayer.interactionModeStarted.subscribe(function () {
                    self._orchestrator.startInteractionMode();
            });

            // Load the internal rin.
            if(this._esData.narrativeData != null) {
                self._rinPlayer.loadData(this._esData.narrativeData, loadComplete);
            }
            else if(this._url != null) {
                self._rinPlayer.load(this._url, loadComplete);
            }
        },
        //// Play the video.
        play: function (offset, experienceStreamId) {
            if (this.getState() === rin.contracts.experienceStreamState.ready)
                this._rinPlayer.play(offset, experienceStreamId);
        },
        // Pause the video.
        pause: function (offset, experienceStreamId) {
            if (this.getState() === rin.contracts.experienceStreamState.ready)
                this._rinPlayer.pause(offset, experienceStreamId);
        },
        // Set the base volume of the video. This will be multiplied with the keyframed volume to get the final volume.
        setVolume: function (baseVolume) {
            this._baseVolume = baseVolume;
            if (this.getState() === rin.contracts.experienceStreamState.ready)
                this._rinPlayer.volume(baseVolume);
        },
        // Mute or unmute the video.
        setIsMuted: function (value) {
            this._mute = value;
            if (this.getState() === rin.contracts.experienceStreamState.ready)
                this._rinPlayer.mute(value);
        },
        _desiredVideoPositon: -1, // Seek location in case the video is not buffered or loaded yet at the location.
        _url: null,
        _baseVolume: 1, // Volume from orchestrator.
        _mute: false,
        _startMarker: 0, // Start trim position for the video.
        _interactionControls: null,
        _rinPlayer : null
    };

    RinES.elementHTML = "<div class='rinPlayer' style='height:100%;width:100%;position:absolute'></div>";
    rin.util.overrideProperties(RinES.prototypeOverrides, RinES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.RinExperienceStream", function (orchestrator, esData) { return new RinES(orchestrator, esData); });
})(rin);
