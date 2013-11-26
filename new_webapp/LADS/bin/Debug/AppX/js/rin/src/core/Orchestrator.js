/// <reference path="Common.js"/>
/// <reference path="TaskTimer.js"/>
/// <reference path="ESItem.js"/>
/// <reference path="../contracts/IExperienceStream.js" />
/// <reference path="../contracts/IOrchestrator.js" />
/// <reference path="ScreenPlayInterpreter.js"/>
/// <reference path="EventLogger.js"/>
/// <reference path="../core/PlayerConfiguration.js"/>
/// <reference path="../core/PlayerControl.js"/>
/// <reference path="../core/ResourcesResolver.js"/>
/// <reference path="StageAreaManager.js"/>

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

// Orchestrator controls the entire narrative like play/pause/seek etc. It acts as a mediator for many communications. Its the backbone of a narrative.
rin.internal.Orchestrator = function (playerControl, playerConfiguration) {
    this.playerStateChangedEvent = new rin.contracts.Event(); // Raised when the player state changes. Bufferring/Playing/Error etc..
    this.isPlayerReadyChangedEvent = new rin.contracts.Event(); // Raised when player ready state is toggled.
    this.narrativeLoadedEvent = new rin.contracts.Event();
    this.narrativeSeekedEvent = new rin.contracts.Event();
    this.playerESEvent = new rin.contracts.Event(); // Player ES events is a generic set of events which can be used for custom purposes like ES to ES communication.
    this.currentESItemsChanged = new rin.contracts.Event(); // Raised when any ES is added or removed from stage.

    this.playerControl = playerControl;
    this.playerConfiguration = playerConfiguration;
    this._resourcesResolver = new rin.internal.ResourcesResolver(playerConfiguration);
    this._esLoadedInfo = {};

    this.stageAreaManager = new rin.internal.StageAreaManager(this, playerControl.stageControl);
    this.eventLogger = new rin.internal.EventLogger();
};


rin.internal.Orchestrator.prototype = {
    // Gets an instance of the resource resolver.
    getResourceResolver: function () {
        return this._resourcesResolver;
    },

    // Gets the narartive info object.
    getNarrativeInfo: function () {
        return this._narrativeInfo;
    },

    // Gets the segment info object.
    getSegmentInfo: function () {
        return this._rinData;
    },

    // Plays the narrative from the specified offset of the screenplay mentioned.
    play: function (offset, screenPlayId, onComplete) {
        if (typeof this._lastPlayCallback == "function" && typeof onComplete == "function") // Cancel existing call back with 'false' flag if a new callback is requested.
            this._lastPlayCallback(false);
        if (typeof onComplete == "function")
            this._lastPlayCallback = onComplete;

        rin.internal.debug.assert(this._isNarrativeLoaded, "Narrative is not loaded");
        // Make sure narrative is loaded before executing play.
        if (!this._isNarrativeLoaded) {
            this._throwInvalidOperation("Invalid operation: Play should be called only after loading narrative.");
            return;
        }

        var playerState = this.getPlayerState();
        if (playerState == rin.contracts.playerState.inTransition) return;

        // Validate the offset.
        var previousTimeOffset = this.getCurrentLogicalTimeOffset();
        var isValidOffset = typeof (offset) == "number" && offset >= 0;
        offset = isValidOffset ? offset : previousTimeOffset;
        if (offset >= this._narrativeInfo.totalDuration) offset = 0; //TODO: Post everest, clamp it at total duration.

        screenPlayId = screenPlayId || this.currentScreenPlayId;

        // Round off the offset to a delta to avoid minute seeks.
        var epsilon = .1;
        var isCurrentScreenPlayId = this.currentScreenPlayId == screenPlayId;
        var isOffsetCurrentTime = (Math.abs(previousTimeOffset - offset) < epsilon) && isCurrentScreenPlayId;

        if (playerState == rin.contracts.playerState.playing && isOffsetCurrentTime && isCurrentScreenPlayId) return;

        var eventToken = this.eventLogger.logBeginEvent("play");

        // Set the state to transition for now as some ESes might take time to seek or load.
        this.setPlayerState(rin.contracts.playerState.inTransition);

        try {
            // Switch screenplays if the requested one is different than the one being played.
            if (!isCurrentScreenPlayId && this.isValidScreenPlayId(screenPlayId)) {
                this.switchHyperTimeline(screenPlayId);
            }

            // Seek all ESes to the offset.
            if (!isOffsetCurrentTime) {
                this.esItemsManager.esTimer.taskTimer.seek(offset);
                this.esItemsManager.updateCurrentESs(offset, previousTimeOffset);
                this.narrativeSeekedEvent.publish({ "seekTime": offset, "screenPlayId": screenPlayId });
            }

            // Play all ESes.
            if (this.esItemsManager.areAllESsReady()) {
                this._playCurrentESs(offset, screenPlayId);
            }
        }
        finally {
            // Wait for all ESes to be ready and set the state to playing. Set to buffering mode till then.
            this.goalPlayerState = rin.contracts.playerState.playing;
            if (!this.esItemsManager.areAllESsReady()) {
                if (this.getPlayerState() != rin.contracts.playerState.pausedForBuffering)
                    this._pauseForBuffering();

                this.setPlayerState(rin.contracts.playerState.pausedForBuffering);
            }
            else {
                this.setPlayerState(rin.contracts.playerState.playing);
                if (this.playerControl._interactionES !== null) {
                    this.playerControl.narrativeModeStarted.publish({ offset: offset, screenplayId: screenPlayId }, true);
                    this.playerControl._interactionES = null;
                }
                if (typeof this._lastPlayCallback == "function") {
                    this._lastPlayCallback(true);
                    this._lastPlayCallback = null;
                }
            }
        }

        var isSeek = !isCurrentScreenPlayId || !isOffsetCurrentTime;
        if (isSeek) {
            this.playerControl.seeked.publish({ offset: offset, screenplayId: this.currentScreenPlayId }, true);
        }

        this.eventLogger.logEndEvent(eventToken);
    },

    // Pause the narrative at the given offset.
    pause: function (offset, screenPlayId, onComplete) {
        if (typeof this._lastPauseCallback == "function" && typeof onComplete == "function") // Cancel existing call back with 'false' flag if a new callback is requested.
            this._lastPauseCallback(false);
        if (typeof onComplete == "function")
            this._lastPauseCallback = onComplete;

        rin.internal.debug.assert(this._isNarrativeLoaded, "Narrative is not loaded");
        if (!this._isNarrativeLoaded) {
            this._throwInvalidOperation("Invalid operation: Pause should be called only after loading narrative.");
            return;
        }

        var playerState = this.getPlayerState();
        if (playerState == rin.contracts.playerState.inTransition) return;

        // Validate offset.
        var previousTimeOffset = this.getCurrentLogicalTimeOffset();
        var isValidOffset = typeof (offset) == "number" && offset >= 0;
        offset = isValidOffset ? offset : previousTimeOffset;
        if (offset >= this._narrativeInfo.totalDuration) offset = this._narrativeInfo.totalDuration;
        screenPlayId = screenPlayId || this.currentScreenPlayId;

        // Round off offset.
        var epsilon = .1;
        var isCurrentScreenPlayId = this.currentScreenPlayId == screenPlayId;
        var isOffsetCurrentTime = (Math.abs(previousTimeOffset - offset) < epsilon) && isCurrentScreenPlayId;

        if (playerState == rin.contracts.playerState.pausedForExplore && isOffsetCurrentTime && isCurrentScreenPlayId) return;

        var eventToken = this.eventLogger.logBeginEvent("pause");
        // Set the state to transition for now as some ESes might take time to seek or load.
        this.setPlayerState(rin.contracts.playerState.inTransition);

        try {
            // Switch screenplay if necessary.
            if (!isCurrentScreenPlayId && this.isValidScreenPlayId(screenPlayId)) {
                this.switchHyperTimeline(screenPlayId);
            }

            // Seek to the offset.
            if (!isOffsetCurrentTime) {
                this.esItemsManager.esTimer.taskTimer.seek(offset);
                this.esItemsManager.updateCurrentESs(offset, previousTimeOffset);
                this.narrativeSeekedEvent.publish({ "seekTime": offset, "screenPlayId": screenPlayId });
            }

            // Pause all ESes.
            this._pauseCurrentESs(offset, screenPlayId);
        }
        finally {
            // Set player state to pause.
            this.goalPlayerState = rin.contracts.playerState.pausedForExplore;

            if (!this.esItemsManager.areAllESsReady()) {
                this.setPlayerState(rin.contracts.playerState.pausedForBuffering);
            }
            else {
                this.setPlayerState(rin.contracts.playerState.pausedForExplore);
                if (typeof this._lastPauseCallback == "function") {
                    this._lastPauseCallback(true);
                    this._lastPauseCallback = null
                }
            }
        }

        var isSeek = !isCurrentScreenPlayId || !isOffsetCurrentTime;
        if (isSeek) {
            this.playerControl.seeked.publish({ offset: offset, screenplayId: this.currentScreenPlayId }, true);
        }

        this.eventLogger.logEndEvent(eventToken);
    },

    // Helper method to check if a given screenplayId is valid or not.
    isValidScreenPlayId: function (screenPlayId) {
        return !!this._rinData.screenplays[screenPlayId];
    },

    // Helper method to check if a given screenplayId is the default or not.
    isDefaultScreenPlayId: function (screenPlayId) {
        return (screenPlayId == this._rinData.defaultScreenplayId);
    },

    // Method to switch a screenplay.
    switchHyperTimeline: function (screenPlayId) {
        rin.internal.debug.assert(this.isValidScreenPlayId(screenPlayId));

        this.esItemsManager.switchHyperTimeline(screenPlayId);
        this.currentScreenPlayId = screenPlayId;
    },

    // Gets if the player is muted.
    getIsMuted: function () {
        return this.playerConfiguration.isMuted;
    },

    // Set the muted state of the player.
    setIsMuted: function (value) {
        this.playerConfiguration.isMuted = value; //ToDo use a runtime configuration object rather than initial one.
        var esItems = this.esItemsManager.getCurrentESItems();
        // Apply to all ESes.
        for (var i = 0; i < esItems.length; i++) {
            var item = esItems[i];
            if (typeof item.experienceStream.setIsMuted === 'function') {
                item.experienceStream.setIsMuted(value);
            }
        }
    },

    updatePlayerConfiguration: function(settings){
        rin.util.overrideProperties(settings, this.playerConfiguration);
        this.onESEvent(this, rin.contracts.esEventIds.playerConfigurationChanged, settings);
    },

    // Get the player volume level.
    getPlayerVolumeLevel: function () {
        return this._playerVolumeLevel;
    },

    // Set the player volume level.
    setPlayerVolumeLevel: function (value) {
        this._playerVolumeLevel = value;
        var esItems = this.esItemsManager.getCurrentESItems();
        // Update volume of all ESes.
        esItems.map(function (item) {
            if (typeof item.experienceStream.setVolume === 'function') {
                // Set premultipled volume. Player volume chosen by the end user * ES base volume mentioned in the screenplay.
                item.experienceStream.setVolume(value * item.volumeLevel);
            }
        });
    },

    // Generic event which can be raised by any ES or other components. Pass it to all ESes.
    onESEvent: function (sender, eventId, eventData) {
        if (!this.esItemsManager) return;
        var esItems = this.esItemsManager.getCurrentESItems();
        for (var i = 0; i < esItems.length; i++) {
            var item = esItems[i];
            if (item.experienceStream.onESEvent) {
                item.experienceStream.onESEvent(sender, eventId, eventData);
            }
        }

        this.playerESEvent.publish(new rin.contracts.PlayerESEventArgs(sender, eventId, eventData));
    },

    // Sets interactive mode for sender or current ES
    startInteractionMode: function (interactionES) {

        // TODO: NarenD to verify if this is the right fix.
        // We disable interaction if it's a transition screenplay!
        var currentScreenplay = this.getScreenPlayPropertyTable(this.currentScreenPlayId);
        if (currentScreenplay && currentScreenplay.isTransitionScreenPlay && !currentScreenplay.allowInteraction)
            return;

        this.pause();
        var senderES = interactionES || this.getCurrentESItems().firstOrDefault(function (item) { return typeof item.experienceStream.getInteractionControls == "function"; })
        if (!senderES || this.playerControl._interactionES === senderES) return; // No ES to interact at this time, or no interaction ES change

        this.playerControl._interactionES = senderES;
        this.playerControl.interactionModeStarted.publish({ interactionES: senderES }, true);
    },

    playerESEvent: new rin.contracts.Event(),

    // Get the current logical time at which the narrative is at.
    getCurrentLogicalTimeOffset: function () {
        return (this.esItemsManager && this.esItemsManager.esTimer.taskTimer) ? this.esItemsManager.esTimer.taskTimer.getCurrentTimeOffset() : 0;
    },

    // Get the current player state.
    getPlayerState: function () {
        return this._playerState;
    },

    // Set the player state.
    setPlayerState: function (value) {
        if (value == this._playerState) return;
        var previousState = this._playerState;
        this._playerState = value;
        this.playerStateChangedEvent.publish(new rin.contracts.PlayerStateChangedEventArgs(previousState, value));
    },

    playerStateChangedEvent: new rin.contracts.Event(),

    // Gets if the player is ready or not.
    getIsPlayerReady: function () {
        return this._isPlayerReady;
    },

    // Set the ready state of the plaeyr.
    setIsPlayerReady: function (value) {
        if (this._isPlayerReady == value) return;
        this._isPlayerReady = value;
        this.isPlayerReadyChangedEvent.publish(value);
    },

    // Gets if the narrative is loaded.
    getIsNarrativeLoaded: function () {
        return this._isNarrativeLoaded;
    },

    isPlayerReadyChangedEvent: new rin.contracts.Event(),

    playerConfiguration: null,

    // Get the logical time relative an experience stream.
    getRelativeLogicalTime: function (experienceStream, experienceStreamId, absoluteLogicalTime) {
        absoluteLogicalTime = absoluteLogicalTime || this.getCurrentLogicalTimeOffset();

        // System ESes is not present on the timeline. So return absolute logical time.
        if (experienceStream.isSystemES) return absoluteLogicalTime;

        if (experienceStream instanceof rin.internal.ESItem)
            return this.esItemsManager.screenPlayInterpreter.getRelativeLogicalTime(experienceStream, absoluteLogicalTime);

        var allESItems = this.esItemsManager.screenPlayInterpreter.getESItems();
        // First search current ES Items in case keyframe sequence is repeated used in same screenplay.
        var esItem = this.getCurrentESItems().firstOrDefault(function (item) { return item.experienceStream == experienceStream && item.currentExperienceStreamId == experienceStreamId; });
        if (!esItem) {
            esItem = allESItems.firstOrDefault(function (item) { return item.experienceStream == experienceStream && item.currentExperienceStreamId == experienceStreamId; });
        }

        if (!esItem) {
            //todo: This is for backward compat with old xrins. Remove after porting all old xrins.
            esItem = allESItems.firstOrDefault(function (item) { return item.experienceStream == experienceStream; });
        }

        var relativeTime = this.esItemsManager.screenPlayInterpreter.getRelativeLogicalTime(esItem, absoluteLogicalTime);
        return Math.max(relativeTime, 0);
    },
    
    // Create and returns a new instance of the specified ES.
    createExperienceStream: function (providerId, esData, orchestratorProxy) {
        var providerName, providerVersion, esInfo;
        if (this._rinData.providers[providerId]) {
            providerName = this._rinData.providers[providerId].name;
            providerVersion = this._rinData.providers[providerId].version;
        }
        else {
            providerName = providerId;
        }

        esInfo = this.esItemsManager.createESItem(providerName, providerVersion, esData, orchestratorProxy);
        rin.internal.debug.assert(esInfo, "missing ES Info");
        return esInfo ? esInfo.experienceStream : null;
    },

    // Makes sure the given experience stream is loaded, If not load it.
    ensureExperienceStreamIsLoaded: function (experienceStreamInfo) {
        if (!this.isExperienceStreamLoaded(experienceStreamInfo.id)) {
            var experienceStreamId = experienceStreamInfo.currentExperienceStreamId;
            experienceStreamInfo.experienceStream.load(experienceStreamId);
            this._esLoadedInfo[experienceStreamInfo.id] = true;
        }
    },

    // Check if the given ES is loaded or not.
    isExperienceStreamLoaded: function (experienceStreamInfoId) {
        return !!this._esLoadedInfo[experienceStreamInfoId];
    },

    // Removed the loaded marker from the ES.
    removeLoadedState: function (experienceStreamInfoId) {
        delete this._esLoadedInfo[experienceStreamInfoId];
    },

    debugOnlyGetESItemInfo: function (experienceStream) {
        return this.esItemsManager.screenPlayInterpreter.getESItems().firstOrDefault(function (item) { return item.experienceStream == experienceStream });
    },

    // Method to load and get an instance of the interaction controls mentioned. The controls returned will be in the same order as the controlNames.
    getInteractionControls: function (controlNames, controlsLoadedCallback) {
        var controlNameCount = controlNames.length;
        var loadedControls = new rin.internal.List(); // Keep all loaded controls till all controls are loaded.
        loadedControls.length = controlNameCount; // Number of controls already loaded.

        // Called after each control is loaded.
        var interactionControlLoaded = function (interactionControl, index) {
            // Save the control to the correct index.
            loadedControls[index] = interactionControl;

            // check if all controls are loaded
            if (loadedControls.any(function (item) {
                return !item;
            }))
                return; // Wait for more controls to load.

            // as all controls are loaded, wrap it in a container and return it to the ES
            var interactionControlsWrap = document.createElement("div");
            loadedControls.foreach(function (item) {
                interactionControlsWrap.appendChild(item);
            });

            controlsLoadedCallback(interactionControlsWrap);
        };

        if (controlsLoadedCallback && controlNames instanceof Array) {
            for (var i = 0; i < controlNameCount; i++) {
                var self = this;
                (function () { // create a self executing function to capture the current index.
                    var currentIndex = i;
                    // Get the factory for the control requested.
                    var factoryFunction = rin.ext.getFactory(rin.contracts.systemFactoryTypes.interactionControlFactory, controlNames[i]);
                    // Create an instance of the control.
                    factoryFunction(self._resourcesResolver, function (interactionControl) {
                        interactionControlLoaded(interactionControl, currentIndex);
                    });
                })();
            }
        }
    },

    getAllSupportedControls: function (experienceStream) {
        //todo2
    },

    narrativeLoadedEvent: null,
    narrativeSeekedEvent: null,
    eventLogger: rin.internal.EventLogger,

    // Gets of the specified ES is on stage as of now.
    getIsOnStage: function (experienceStream) {
        var currentItems = this.getCurrentESItems();
        return currentItems && currentItems.firstOrDefault(function (item) { return item.experienceStream == experienceStream });
    },

    // Loads and initializes the orchestrator.
    load: function (rinData, onCompleted) {
        rin.internal.debug.assert(rinData, "Missing rin data");
        this._rinData = rinData;
        this._resourcesResolver.rinModel = rinData;
        this.currentScreenPlayId = rinData.defaultScreenplayId;
        var eventToken = this.eventLogger.logBeginEvent("Load");

        this.unload();

        this.setPlayerState(rin.contracts.playerState.pausedForBuffering);
        this._initializeNarrativeInfo(rinData);

        this.esItemsManager = new rin.internal.ESItemsManager();
        this.esItemsManager.initialize(rinData, this);

        var self = this;
        this.loadScreenPlayPropertyTable(function () {
            self._isNarrativeLoaded = true;
            self.narrativeLoadedEvent.publish();
            self.eventLogger.logEndEvent(eventToken);
            if (typeof onCompleted == "function") onCompleted();
        });

    },

    unload: function () {
        // Clean up the stage in case.
        rin.util.removeAllChildren(this.playerControl.stageControl);
        if (this.esItemsManager) this.esItemsManager.unload();
        this._esLoadedInfo = {};
        this._rinData = null;
    },

    // Get all ES items currently on stage.
    getCurrentESItems: function () {
        return (this.esItemsManager) ? this.esItemsManager.getCurrentESItems() : new rin.internal.List();
    },

    _captureKeyframeInternal: function (es) {
        var keyframe = es.experienceStream.captureKeyframe();
        if (keyframe) {
            keyframe["authoringMetadata"] = {
                provider: this._rinData.providers[es.providerId].name,
                experienceId: es.experienceId,
                experienceStreamId: es.currentExperienceStreamId
            }
        }
        return keyframe;
    },

    // Capture keyframe information from the active ES.
    captureKeyframe: function (experienceId, experienceStreamId) {
        var firstES = this.getCurrentESItems().firstOrDefault(function (item) {
            return typeof item.experienceStream.captureKeyframe == "function" &&
                    (!experienceId || experienceId === item.experienceId) &&
                    (!experienceStreamId || experienceStreamId === item.currentExperienceStreamId);
        });
        if (firstES) {
            return this._captureKeyframeInternal(firstES) || "";
        }
        return "";
    },
    // Capture keyframe information from the active ES.
    captureAllKeyframes: function () {
        var ess = this.getCurrentESItems().where(function (item) { return typeof item.experienceStream.captureKeyframe == "function"; });
        var self = this;
        return ess.select(function (es) {
            return self._captureKeyframeInternal(es);
        }).where(function (keyframe) { return !!keyframe });
    },

    debugApplyKeyframe: function (keyframe) {
        var firstES = this.getCurrentESItems().firstOrDefault(function (item) { return typeof item.experienceStream.displayKeyframe == "function"; });
        if (firstES && keyframe) {
            firstES.experienceStream.displayKeyframe(keyframe);
        }
    },

    loadScreenPlayPropertyTable: function (onComplete) {
        var self = this;
        var screenplayPropertiesResource = "ScreenplayProperties";
        if (!this._rinData.resources[screenplayPropertiesResource]) {
            if (typeof onComplete == "function") onComplete();
            return;
        }
        var screenplayUrl = self.getResourceResolver().resolveResource(screenplayPropertiesResource);
        // Download the narrative.
        var options = {
            url: screenplayUrl,
            dataType: "json",
            error: function (jqxhr, textStatus, errorThrown) {
                rin.internal.debug.write(errorThrown.message || errorThrown);
                if (typeof onComplete == "function")
                    onComplete();
            },
            success: function (data, textStatus, jqxhr) {
                self._screenplayPropertyTable = data[0];
                if (typeof onComplete == "function")
                    onComplete();
            }
        };
        $.ajax(options);
    },

    getScreenPlayPropertyTable: function (screenplayId) {
        return this._screenplayPropertyTable && this._screenplayPropertyTable[screenplayId];
    },


    // Seek the narrative using a well defined url. This is used to share a link to a particular time or experience in the narrative.
    seekUrl: function (seekUrl, onComplete) {
        var deepStateUrl = this.playerControl.resolveDeepstateUrlFromAbsoluteUrl(seekUrl);
        if (deepStateUrl) {
            var self = this;
            setTimeout(function () {
                self.playerConfiguration.narrativeRootUrl = null;
                self.playerControl.load(deepStateUrl, function (isInDeepState) { if (!isInDeepState) self.playerControl.play(); });
            }, 0);
            return;
        }
        var queryParams = rin.util.getQueryStringParams(seekUrl);

        // Load parameters from query string.
        var queryScreenPlayId = queryParams["screenPlayId"];
        var screenPlayId = this.isValidScreenPlayId(queryScreenPlayId) ? queryScreenPlayId : this._rinData.defaultScreenplayId;

        var seekTime = parseFloat(queryParams["begin"]) || parseFloat(queryParams["seekTime"]) || 0;
        var action = queryParams["action"] || (this.playerConfiguration.startInInteractionMode && "pause");

        if (action == "play" && queryParams["transition"] === "adaptive") {
            var resumeESItem = this.getCurrentESItems().firstOrDefault(function (es) { return es.experienceStream && typeof es.experienceStream.resumeFrom === "function"; });
            if (resumeESItem) {
                var newSeekUrl = rin.util.removeQueryStringParam(seekUrl, "transition");
                var relativeOffset = this._getESItemRelativeOffset(resumeESItem, seekTime);
                var newScreenPlayESItem = this.esItemsManager._getScreenPlayInterpreter(screenPlayId).getESItems().firstOrDefault(function (esItem) { return esItem.id === resumeESItem.id; });
                this.pause();
                resumeESItem.experienceStream.resumeFrom(relativeOffset, (newScreenPlayESItem || resumeESItem).currentExperienceStreamId, newSeekUrl);
                return;
            }
        }

        if (action == "pause" || (!action && this.getPlayerState() == rin.contracts.playerState.pausedForExplore)) {
            var self = this;
            this.pause(seekTime, screenPlayId, function (success) {
                if (!success) return;
                if (queryParams["state"]) {
                    var collectionReferences = JSON.parse(decodeURIComponent(queryParams["state"]));
                    var esStates = collectionReferences.experiences.itemReferences;
                    var esIds = [];
                    for (var id in esStates) {
                        esIds.push(id);
                    }

                    // process es states if present
                    if (esIds.length > 0) {
                        // As of now we are handling only one ES.
                        var es = self.getCurrentESItems().firstOrDefault(function (item) { return item.id == esIds[0]; });
                        if (es) {

                            if (typeof es.experienceStream.displayKeyframe == "function") {
                                setTimeout(function () {
                                    es.experienceStream.displayKeyframe(esStates[es.id]);
                                    if (typeof onComplete == "function") onComplete();
                                }, 500); // As some ESes might not have compleatly loaded.
                            }
                        }
                    }
                }
            });

        }
        else {
            this.play(seekTime, screenPlayId);
            if (typeof onComplete == "function") onComplete();
        }
        this.narrativeSeekedEvent.publish({ "seekTime": seekTime, "screenPlayId": queryScreenPlayId });
    },

    // Get seek url for the current state of the narrative.
    getDeepState: function () {
        //return "http://default/?screenPlayId={0}&seekTime={1}&action=play".rinFormat(this.currentScreenPlayId, this.getCurrentLogicalTimeOffset());
        var action = (this._playerState == rin.contracts.playerState.pausedForExplore || this._playerState == this._playerState == rin.contracts.stopped) ? "pause" : "play";
        var deepState =
            {
                "state": {
                    "document": {
                        "screenplayId": this.currentScreenPlayId
                    },
                    "animation": {
                        "begin": this.getCurrentLogicalTimeOffset().toFixed(2),
                        "action": action
                    },
                    "collectionReferences": {
                        "experiences": {
                            "itemReferences": {

                            }
                        }
                    }
                }
            };

        if (action = "pause") {
            // We are considering only one ES for now. Take first ES with isExplorable = true, or if none available, take first in the list.
            var currentESItems = this.getCurrentESItems();
            var firstES = currentESItems.firstOrDefault(function (esItem) { return esItem.experienceStream.isExplorable }) || currentESItems[0];
            if (firstES && typeof firstES.experienceStream.captureKeyframe == "function") {
                deepState.state.collectionReferences.experiences.itemReferences[firstES.id] = firstES.experienceStream.captureKeyframe() || {};
            }
        }

        return deepState;
    },

    stageAreaManager: null,
    esItemsManager: null,
    playerControl: null,
    goalPlayerState: null,
    currentScreenPlayId: null,

    _initializeNarrativeInfo: function (rinData, onCompleted) {
        this._rinData = rinData;
        this._narrativeInfo = new rin.internal.NarrativeInfo(this._rinData.data.narrativeData);

        //todo: resolve resource table
    },

    _pauseForBuffering: function () {
        var playerState = this.getPlayerState();
        rin.internal.debug.assert(this._isNarrativeLoaded);
        if (!this._isNarrativeLoaded || playerState == rin.contracts.playerState.inTransition || playerState == rin.contracts.playerState.pausedForBuffering) return;

        var eventToken = this.eventLogger.logBeginEvent("PauseNarrativeForBuffering");
        this.setPlayerState(rin.contracts.playerState.inTransition);
        try {
            this._pauseCurrentESs(this.getCurrentLogicalTimeOffset(), this.currentScreenPlayId || this._rinData.defaultScreenplayId);
        }
        finally {
            this.setPlayerState(rin.contracts.playerState.pausedForBuffering);
            this.goalPlayerState = rin.contracts.playerState.playing;
        }
        this.eventLogger.logEndEvent(eventToken);
    },

    _getESItemRelativeOffset: function (esItem, offset) {
        offset = typeof offset == "undefined" ? this.getCurrentLogicalTimeOffset() : offset;
        var relativeOffset = esItem.experienceStream.isSystemES ? offset : this.esItemsManager.screenPlayInterpreter.getRelativeLogicalTime(esItem, offset);
        return Math.max(relativeOffset, 0);
    },

    _playCurrentESs: function (offset, screenPlayId) {
        this.esItemsManager.getCurrentESItems().where(function(item) { return item.experienceStream.getState() == rin.contracts.experienceStreamState.ready; })
            .foreach(function (item) {
            item.experienceStream.play(this._getESItemRelativeOffset(item, offset), item.currentExperienceStreamId);
        }.bind(this));
    },

    _pauseCurrentESs: function (offset, screenPlayId) {
        this.esItemsManager.getCurrentESItems().where(function (item) { return item.experienceStream.getState() == rin.contracts.experienceStreamState.ready; })
            .foreach(function (item) {
            item.experienceStream.pause(this._getESItemRelativeOffset(item, offset), item.currentExperienceStreamId);
        }.bind(this));
    },

    _seekESItems: function (esItems, offset) {
        var isPlaying = this.getPlayerState() == rin.contracts.playerState.playing;
        esItems.where(function (item) { return item.experienceStream.getState() == rin.contracts.experienceStreamState.ready; })
            .foreach(function (item) {
            var relativeOffset = this._getESItemRelativeOffset(item);

            var experienceStreamId = item.currentExperienceStreamId;
            if (isPlaying) {
                item.experienceStream.play(relativeOffset, experienceStreamId);
            }
            else {
                item.experienceStream.pause(relativeOffset, experienceStreamId);
            }
        }, this);
    },


    // Executed just before a screenplay comes to an end.
    _onBeforeScreenPlayEnd: function () {
        var propertyTable = this.getScreenPlayPropertyTable(this.esItemsManager.screenPlayInterpreter.id);

        var endAction = propertyTable ? propertyTable["endActionUrl"] : null;
        var endActionProperty = endAction ? endAction["endActionUrlProperty"] : null;
        if (endActionProperty && endActionProperty["beforeEndAction"] == "pause") {
            this.startInteractionMode();
            this.playerControl.screenplayEnded.publish({ screenplayId: this.currentScreenPlayId }, true); // TODO: Post everest, we should not raise this even before actually screenplay ended.
        }
    },

    // Executed while screenplay has just come to an end.
    _onScreenPlayEnding: function () {
        var propertyTable = this.getScreenPlayPropertyTable(this.esItemsManager.screenPlayInterpreter.id);

        var endAction = propertyTable ? propertyTable["endActionUrl"] : null;
        var endActionProperty = endAction ? endAction["endActionUrlProperty"] : null;
        var url = endActionProperty ? endActionProperty["endActionUrl"] : null;

        if (url) {
            this.seekUrl(url);
            return true;
        }
        return false;
    },

    // Executed when the screenplay has ended.
    _onScreenPlayEnded: function () {
        var configuration = this.playerConfiguration;
        if (configuration.loop) {
            this.play(0, this.currentScreenPlayId);
        }
        else if (configuration.playerMode !== rin.contracts.playerMode.AuthorerEditor && configuration.playerMode !== rin.contracts.playerMode.AuthorerPreview) {
            this.pause(this._narrativeInfo.totalDuration + 0.1);
            this.playerControl.screenplayEnded.publish({ screenplayId: this.currentScreenPlayId }, true);
        }
        else {
            this.pause();
            //--For authoring end, fire a player stopped event when the current screenplay ends.
            this.setPlayerState(rin.contracts.playerState.stopped);
        }
    },

    _throwInvalidOperation: function (errorDetails) {
        rin.internal.debug.assert(false, errorDetails);
        if (!this.playerConfiguration.degradeGracefullyOnErrors) throw new Error(errorDetails);
    },

    _rinData: null,
    _serviceItemsManager: null,
    _interactionControlsManager: null,
    _isNarrativeLoaded: null,
    _narrativeInfo: null,
    _resourcesResolver: null,
    _playerState: rin.contracts.playerState.stopped,
    _isPlayerReady: false,
    _stageAreaManager: null,
    _playerVolumeLevel: 1,
    _loadStartTime: 0,
    _esLoadedInfo: {},
    _lastPlayCallback: null,
    _lastPauseCallback: null,
    _screenplayPropertyTable: null
};

// Metadata about a narrative.
rin.internal.NarrativeInfo = function (narrativeData) {
    this.narrativeData = narrativeData;
    this.totalDuration = parseFloat(narrativeData.estimatedDuration);
    this.title = narrativeData.title;
    this.description = narrativeData.description;
    this.branding = narrativeData.branding;
    this.aspectRatio = narrativeData.aspectRatio || "None";
};

rin.internal.NarrativeInfo.prototype = {
    narrativeData: null,
    description: null,
    branding: null,
    title: null,
    totalDuration: null,
    beginOffset: null,
    aspectRatio: "None"
};