/// <reference path="Common.js"/>
/// <reference path="TaskTimer.js"/>
/// <reference path="ESItem.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="ScreenPlayInterpreter.js"/>
/// <reference path="EventLogger.js"/>

/// <reference path="../core/PlayerConfiguration.js"/>
/// <reference path="../core/PlayerControl.js"/>
/// <reference path="../core/ResourcesResolver.js"/>
/// <reference path="StageAreaManager.js" />
/// <reference path="Orchestrator.js" />
/// <reference path="../SystemESs/BufferingES.js" />
/// <reference path="RinDataProxy.js" />

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

// Player control contains a set of API's exposed for access by developers who integrate RIN to their products.
// Most of the calls are delegated to respective controllers. This class acts more or less like a proxy.
rin.internal.PlayerControl = function (stageControl, playerConfiguration, playerRoot) {
    this.stageControl = stageControl; // Control where all the rin content is displayed.
    this.playerConfiguration = playerConfiguration; // Player configuration for startup.
    this.orchestrator = new rin.internal.Orchestrator(this, playerConfiguration); // Orchestrator instance.
    this._eaController = new rin.embeddedArtifacts.embeddedArtifactsController(this.orchestrator);
    this._defaultBufferingES = new rin.internal.DefaultBufferingES(this.orchestrator); // Create a new buffering ES to show while loading the RIN.
    this.playerRootElement = playerRoot || stageControl; // The root DOM element of the player.
    this.volumeChangedEvent = new rin.contracts.Event();
    this.muteChangedEvent = new rin.contracts.Event();
};

rin.internal.PlayerControl.prototype = {
    playerConfiguration: null,
    orchestrator: null,
    stageControl: null,
    playerRootElement: null,
    narrativeUrl: null,
    // Load a narrative at the given URL and make a callback once loading is complete.
    load: function (narrativeUrl, onComplete) {
        var dataProxy = this._getDataProxy(this.playerConfiguration.playerMode);
        var self = this;

        var basicUrlLength = narrativeUrl.indexOf("?");
        if (basicUrlLength != -1)
        {
            self.narrativeUrl = narrativeUrl.substr(0, basicUrlLength);
        }
        else {
            self.narrativeUrl = narrativeUrl;
        }

        if (this._eaController) this._eaController.unload();

        dataProxy.getRinDataAsync(self.narrativeUrl,
            function (message) {
                self._showLoadingMessage(message);
            },
            function (rinData) {
                if (rinData && !rinData.error) {
                    if (!self.playerConfiguration.narrativeRootUrl) {
                        var lastSlashPos = self.narrativeUrl.lastIndexOf("/");
                        self.playerConfiguration.narrativeRootUrl = self.narrativeUrl.substr(0, lastSlashPos);
                    }

                    self.loadData(rinData, function () {
                        if (basicUrlLength != -1) {
                            self.orchestrator.seekUrl(narrativeUrl, function () {
                                if (typeof onComplete == "function")
                                    onComplete(true); // if in deepstate, pass true
                            });
                        } else {
                            if (typeof onComplete == "function")
                                onComplete();
                        }
                    });
                }
                else {
                    var error = "Error while loading narrative: " + (rinData ? rinData.error : "Narrative data not found.");
                    self.orchestrator.eventLogger.logErrorEvent(error);
                }
            });
    },

    // Load a narrative from the rinData provided and make a callback once loading is complete.
    loadData: function (rinData, onComplete) {
        var self = this;

        this.orchestrator.load(rinData, function (error) {
            if (!error) {
                if (self.playerConfiguration.playerStartupAction == rin.contracts.playerStartupAction.play) {
                    self.orchestrator.play();
                }
                //todo: handle pause action
                self._hideLoadingMessage();
                if (typeof onComplete === 'function') {
                    setTimeout(onComplete, 0);
                }
            }
            else {
                if (!self.playerConfiguration.degradeGracefullyOnErrors) throw new Error(error);
                self.orchestrator.eventLogger.logErrorEvent(error);
            }
        });
    },

    // Play the narrative at the given offset of the screenplay specified.
    play: function (offset, screenPlayId) {
        this.orchestrator.play(offset, screenPlayId);
    },

    // Pause the narrative at the given offset of the screenplay specified.
    pause: function (offset, screenPlayId) {
        this.orchestrator.pause(offset, screenPlayId);
    },

    // Unloads currently loaded narrative json and unloads each experience provider
    unload: function() {
        this.orchestrator.unload();
    },

    // Returns the players current state.
    getPlayerState: function () {
        return this.orchestrator.getPlayerState();
    },

    // Returns current screenplay id
    getCurrentScreenplayId: function(){
        return this.orchestrator.currentScreenPlayId;
    },

    // Returns the current logical offset of the player.
    getCurrentTimeOffset: function () {
        return this.orchestrator.getCurrentLogicalTimeOffset();
    },

    // Returns the control used to host ESes.
    getStageControl : function(){
        return this.stageControl;
    },

    // Returns the root DOM element of the player.
    getPlayerRoot: function () {
        return this.playerRootElement;
    },

    // Captures and returns a keyframe at the current logical offset for the esId passed or the first ES
    captureKeyframe: function (experienceId, experienceStreamId) {
        return this.orchestrator.captureKeyframe(experienceId, experienceStreamId);
    },

    // Captures and returns a keyframe at the current logical offset for all ESs
    captureAllKeyframes: function () {
        return this.orchestrator.captureAllKeyframes();
    },

    resolveDeepstateUrlFromAbsoluteUrl: function (absoluteUrl) {
        var params = rin.util.getQueryStringParams(absoluteUrl);
        if (params.hasOwnProperty("narrativeUrl") &&
            params.hasOwnProperty("begin") &&
            params.hasOwnProperty("action") &&
            params.hasOwnProperty("screenPlayId")) {

            var resolvedUrl = "{0}?begin={1}&action={2}&screenPlayId={3}".rinFormat(decodeURIComponent(params["narrativeUrl"]), params["begin"], params["action"], params["screenPlayId"]);
            if (params["state"]) resolvedUrl += "&state=" + params["state"];
            return resolvedUrl;
        }
        else {
            return false;
        }
    },

    // Get a URL which will load the narrative at the state it is currently.
    getDeepStateUrl: function(){
        var deepState = this.orchestrator.getDeepState();

        return rin.internal.getDeepState(deepState, this.narrativeUrl);
    },

    //Sets the player in loop and returns the current state
    //isPlayInLoop should be a number between 0 and 1
    loop: function (isPlayInLoop) {
        if (isPlayInLoop === true || isPlayInLoop === false) {
            this.playerConfiguration.loop = isPlayInLoop;
        } else if (this.playerConfiguration.loop === undefined) {
            this.playerConfiguration.loop = false; //default to false if undefined
        }
        return this.playerConfiguration.loop;
    },
    
    //Sets the player volume and returns the current volume
    //volumeLevel should be a number between 0 and 1
    volume: function (volumeLevel) {
        var currentLevel = this.orchestrator.getPlayerVolumeLevel();
        if (!isNaN(volumeLevel) && volumeLevel >= 0 && volumeLevel <= 1) {
            this.orchestrator.setPlayerVolumeLevel(volumeLevel);
            if (currentLevel !== volumeLevel) {
                this.volumeChangedEvent.publish(volumeLevel);
            }
        } else if (volumeLevel !== undefined) {
            throw new Error("IndexSizeError");
        }
        return currentLevel;
    },

    //Mutes the player and returns the current mute state
    //isMuted should be a bool value
    mute: function (isMuted) {
        var currentState = this.orchestrator.getIsMuted();
        if (isMuted === true || isMuted === false) {
            this.orchestrator.setIsMuted(isMuted);
            if (currentState !== isMuted) {
                this.muteChangedEvent.publish(isMuted);
            }
        }
        return currentState;
    },

    // Updates run time settings and notifies all current ES items to immediately react to settings.
    // Example settings object
    // { isMusicMuted: true, startInInteractionMode: true, isNarrativeMuted: true }
    // Object with only changed values can be set. For example, if only isMusicMuted is changed, call this with {isMusicMuted: true}
    updatePlayerConfiguration: function (settings) {
        this.orchestrator.updatePlayerConfiguration(settings);
    },
    
    // event triggered at end of current screenplay. params: screenPlayId
    screenplayEnded: new rin.contracts.Event(),

    // event triggered whenever timeline is seeked. params: offset, screenPlayId
    seeked: new rin.contracts.Event(),

    // Triggered when interaction mode starts. This also means interactive mode has ended. params: interactionES
    interactionModeStarted: new rin.contracts.Event(),

    // Triggered when interaction mode ends narrative is played
    narrativeModeStarted: new rin.contracts.Event(),

    getIsInInteractionMode: function () {
        return !!this._interactionES;
    },

    _showLoadingMessage: function (message) {
        if (!this._defaultBufferingES) this._defaultBufferingES = new rin.internal.DefaultBufferingES(this.orchestrator);

        var uiControl = this._defaultBufferingES.getUserInterfaceControl();
        if (rin.util.hasChildElement(this.stageControl.childNodes, uiControl)) return;

        this.stageControl.appendChild(uiControl);

        if (this.playerConfiguration.playInDebugMode) {
            rin.util.assignAsInnerHTMLUnsafe(uiControl, "<div>" + message + "</div>");
        }
        this._defaultBufferingES.showBuffering();
    },
    _hideLoadingMessage: function () {
        var uiControl = this._defaultBufferingES.getUserInterfaceControl();
        if (this._defaultBufferingES && rin.util.hasChildElement(this.stageControl.childNodes, uiControl)) {
            this._defaultBufferingES.hideBuffering();
            this.stageControl.removeChild(uiControl);
        }
    },

    _defaultBufferingES: null,
    _getDataProxy: function (playerMode) {
        //if (playerMode == rin.contracts.playerMode.demo) 
        rin.internal.debug.assert(playerMode == rin.contracts.playerMode.demo, "Player mode must be Demo for now");
        return new rin.internal.DemoRinDataProxy();
    },
    _showEventLog: function () { //todo
    },
    _getEventLog: function () { //todo
    },
    _interactionES: undefined,

    //ToDo - use the setting object rather than using seperate events
    volumeChangedEvent: undefined,
    muteChangedEvent: undefined
};