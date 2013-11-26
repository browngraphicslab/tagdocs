/// <reference path="../contracts/DiscreteKeyframeESBase.js" />
/// <reference path="../contracts/IExperienceStream.js" />
/// <reference path="../contracts/IOrchestrator.js" />
/// <reference path="../core/Common.js" />
/// <reference path="../core/EventLogger.js" />
/// <reference path="../core/PlayerConfiguration.js" />
/// <reference path="../core/ResourcesResolver.js" />
/// <reference path="../core/TaskTimer.js" />
/// <reference path="../core/OrchestratorProxy.js" />

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

// Class that manages list of ESItems in given screenPlayId. This class knows what to do when screenplay changes, when current experience streams change etc. 
// It calls preloader, stageAreaManager and orchestrator as needed.
rin.internal.ESItemsManager = function () {
    var self = this;
    this.esStateChangedEventHook = function (eventArgs) { self._onESStateChangedEvent(eventArgs) }; // a simple function that wraps _onESStateChangedEvent with "self" pointer.
    this._screenPlayInterpreterCache = {};
    this._esItemCache = {};
}

rin.internal.ESItemsManager.prototype = {
    _systemESItems: null,
    _orchestrator: null,
    _esTimerES: null,
    _screenPlayES: null,
    _currentESItems: null,
    _esItemCache: null,
    _screenPlayInterpreterCache: null,

    bufferingES: null,
    preloaderES: null,
    screenPlayInterpreter: null,

    esTimer: null,
    preloaderESItem: null,
    esStateChangedEventHook: null, //to be defined in constructor

    // Initialize the item manager and all its internal dependancies.
    initialize: function (rinData, orchestrator, screenPlayId) {
        this._orchestrator = orchestrator;
        this._getSystemESItems();

        if (this.screenPlayInterpreter == null) {
            this.screenPlayInterpreter = this._getScreenPlayInterpreter(screenPlayId || rinData.defaultScreenplayId, rinData.providers[rinData.screenplayProviderId]);
        }

        this._cacheAllScreenPlays();
        this.preloaderES.initialize(this._orchestrator, this._orchestrator.playerControl.stageControl, this.screenPlayInterpreter, this._allOrderedESItems);

        this._currentESItems = new rin.internal.List();
        this.onCurrentExperienceStreamsChanged(this._systemESItems, null, this._systemESItems);
    },

    // Unload all ESes.
    unload: function () {
        if (this._currentESItems && this._currentESItems !== null) {
            this._orchestrator.currentESItemsChanged.publish({ "addedItems": null, "removedItems": this._currentESItems, "currentList": null, "isSeek": true });
            this._currentESItems.foreach(function (item) {
                item.experienceStream.stateChangedEvent.unsubscribe(this.esStateChangedEventHook)
            }, this);
        }

        if (this.screenPlayInterpreter && this.screenPlayInterpreter !== null) {
            this.screenPlayInterpreter.getESItems().foreach(function (item) {
                if (this._orchestrator.isExperienceStreamLoaded(item.id))
                    item.experienceStream.unload();
            }, this);
        }

        this._systemESItems.foreach(function (item) {
            if (typeof (item.experienceStream.unload) == "function") item.experienceStream.unload();
        });
    },

    // Switches hypertimeline from current screenPlayId to new screenPlayId
    switchHyperTimeline: function (screenPlayId) {
        if (!this.screenPlayInterpreter && this.screenPlayInterpreter.id == screenPlayId) return; // we are in target screenplay already
        if (!this._orchestrator.isValidScreenPlayId(screenPlayId)) return;

        this.screenPlayInterpreter = this._getScreenPlayInterpreter(screenPlayId);

        var narrativeInfo = this._orchestrator.getNarrativeInfo();
        if (this._orchestrator.isDefaultScreenPlayId(screenPlayId)) {
            narrativeInfo.totalDuration = narrativeInfo.narrativeData.estimatedDuration;
        }
        else {
            narrativeInfo.totalDuration = this.screenPlayInterpreter.getEndTime();
        }

        this._esTimerES.load();
        this.preloaderES.updateScreenPlay(this.screenPlayInterpreter);

        // Apply screenplay attributes for all ESs in new screenplay
        this.screenPlayInterpreter.getESItems().foreach(function (es) { this.screenPlayInterpreter.setScreenPlayAttributes(es); }.bind(this));
    },

    // Creates a new ESItem for given provider info, esData & orchestratorProxy, by calling esFactory or by returning a cached instance.
    createESItem: function (providerName, providerVersion, esData, proxy) {
        var esId = esData.id;
        var esItem = this._esItemCache[esId];
        if (esItem) return esItem;

        var factoryFunction = this._getFactory(providerName, providerVersion);
        rin.internal.debug.assert(factoryFunction != null, "could not find factory function");

        if (factoryFunction) {
            esItem = new rin.internal.ESItem(esId, esData);
            var orchestratorProxy = proxy || new rin.internal.OrchestratorProxy(this._orchestrator);
            esItem.experienceStream = factoryFunction(orchestratorProxy, esData);
            rin.internal.debug.assert(esItem.experienceStream != null, "ES Item has no ES");
            orchestratorProxy.init(esItem.experienceStream);
            this._esItemCache[esId] = esItem;
            return esItem;
        };
        rin.internal.debug.assert(false, "Could not create required ES");
        return null;
    },

    // Returns list of ESItems staged at current time
    getCurrentESItems: function () {
        return this._currentESItems;
    },

    // Returns true if all current ESItems are in ready or error state.
    areAllESsReady: function () {
        return !this.getCurrentESItems().firstOrDefault(function (es) { return es.experienceStream.getState() == rin.contracts.experienceStreamState.buffering });
    },

    // Updates current ESs list to match the provided offset.
    updateCurrentESs: function (offset, previousTimeOffset) {
        var currentList = this.getCurrentESItems();
        var newList = this.screenPlayInterpreter.getESItems(offset).concat(this._systemESItems);
        var addedItems = newList.except(currentList);
        var removedItems = currentList.except(newList);

        this.onCurrentExperienceStreamsChanged(addedItems, removedItems, newList, true, previousTimeOffset);
    },

    // Method called when the list of ESes on screen changes.
    onCurrentExperienceStreamsChanged: function (addedItems, removedItems, currentList, isSeek, previousTimeOffset) {
        this._currentESItems = currentList;
        this._orchestrator.stageAreaManager.onCurrentExperienceStreamsChanged(addedItems, removedItems, currentList, isSeek);
        this._orchestrator.currentESItemsChanged.publish({ "addedItems": addedItems, "removedItems": removedItems, "currentList": currentList, "isSeek": isSeek });
        this._orchestrator.eventLogger.logEvent("");

        var wereItemsAdded = (addedItems && addedItems.constructor == Array && addedItems.length > 0);
        var wereItemsRemoved = (removedItems && removedItems.constructor == Array && removedItems.length > 0);
        var self = this;

        // Manage all newly added items.
        if (wereItemsAdded) {
            for (var i = 0, len = addedItems.length; i < len; i++) {
                if (removedItems && removedItems.any(function (item) { return item.experienceStream == addedItems[i].experienceStream })) continue; // These are in removed items also, so skip instead of re-adding.

                var item = addedItems[i];
                item.experienceStream.stateChangedEvent.subscribe(this.esStateChangedEventHook, "ESItemsManager");
                this._setNewlyAddedState(item);
                if (typeof (item.experienceStream.addedToStage) == "function")
                    item.experienceStream.addedToStage();

                var currentTime = this._orchestrator.getCurrentLogicalTimeOffset();
                var epsilon = 0.1;
                rin.internal.debug.assert((currentTime + epsilon) >= item.beginOffset && (currentTime - epsilon) <= item.endOffset, "item added to stage beyond its life time");
                this._orchestrator.eventLogger.logEvent("ES {0} added at {1} time scheduled {2}", item.id,
                     currentTime, item.beginOffset);
            }
        }
        // Managed any items removed recently.
        if (wereItemsRemoved) {
            for (var i = 0, len = removedItems.length; i < len; i++) {
                if (addedItems && addedItems.any(function (item) { return item.experienceStream == removedItems[i].experienceStream })) continue; // No need to remove because it is there for re-add

                var item = removedItems[i];
                item.experienceStream.stateChangedEvent.unsubscribe("ESItemsManager");
                item.experienceStream.pause(this._orchestrator._getESItemRelativeOffset(item, previousTimeOffset));

                if (typeof (item.experienceStream.removedFromStage) == "function")
                    item.experienceStream.removedFromStage();

                this._orchestrator.eventLogger.logEvent("ES {0} removed at {1} time scheduled {2}", item.id,
                    this._orchestrator.getCurrentLogicalTimeOffset(), item.endOffset);
            }
        }

        // If there were any items added or removed, check for ES status and show buffering ES if necessary.
        if (wereItemsAdded || wereItemsRemoved) this._checkESStatusesAsync();
    },


    _getScreenPlayInterpreter: function (screenPlayId, screenplayProviderInfo) {
        var screenPlayInterpreter = this._screenPlayInterpreterCache[screenPlayId];
        if (!screenPlayInterpreter) {
            screenPlayInterpreter = new rin.internal.DefaultScreenPlayInterpreter(); //V2 need to instantiate the provider based on provider info
            var segmentInfo = this._orchestrator.getSegmentInfo();
            if (segmentInfo.screenplays[screenPlayId]) {
                screenPlayInterpreter.initialize(screenPlayId, segmentInfo, this._orchestrator);
            } else {
                rin.internal.debug.write("Unable to find the screenplay with id " + screenPlayId);
            }
            this._screenPlayInterpreterCache[screenPlayId] = screenPlayInterpreter;
        }
        return screenPlayInterpreter;
    },

    _allScreenPlayIds: null,
    _allOrderedESItems: null,

    _cacheAllScreenPlays: function () {
        if (this._allScreenPlayIds) return;
        this._allScreenPlayIds = new rin.internal.List();
        this._allOrderedESItems = new rin.internal.List();

        for (var screenPlayId in this._orchestrator._rinData.screenplays) {
            this._allScreenPlayIds.push(screenPlayId);
            var screenPlayInterpreter = this._getScreenPlayInterpreter(screenPlayId)
            Array.prototype.push.apply(this._allOrderedESItems, screenPlayInterpreter.getESItems())
        };
    },

    _setNewlyAddedState: function (addedES) {
        this.screenPlayInterpreter.setScreenPlayAttributes(addedES);

        var playerState = this._orchestrator.getPlayerState();
        if (playerState != rin.contracts.playerState.inTransition) {
            var actionDebugInfo = "none";
            switch (playerState) {
                case rin.contracts.playerState.pausedForBuffering:
                case rin.contracts.playerState.pausedForExplore:
                    var relativeOffset = this._orchestrator._getESItemRelativeOffset(addedES);
                    addedES.experienceStream.pause(relativeOffset, addedES.currentExperienceStreamId);
                    actionDebugInfo = "paused";
                    break;

                case rin.contracts.playerState.playing:
                    var esState = addedES.experienceStream.getState();

                    if (esState == rin.contracts.experienceStreamState.ready) {
                        var relativeOffset = this._orchestrator._getESItemRelativeOffset(addedES);
                        addedES.experienceStream.play(relativeOffset, addedES.currentExperienceStreamId);
                        actionDebugInfo = "played";
                    }
                    else if (esState == rin.contracts.experienceStreamState.buffering) {
                        this._orchestrator._pauseForBuffering();
                        actionDebugInfo = "narrative paused";
                    }
                    break;
                case rin.contracts.playerState.stopped:
                    break;

                default:
                    rin.internal.debug.assert(false, "Unknown player state encountered");
                    break;
            }
        }
        this._orchestrator.eventLogger.logEvent("ES {0} added action: {1}", addedES.id, actionDebugInfo);
    },

    _onESStateChangedEvent: function (esStateChangedEventArgs) {
        if (esStateChangedEventArgs.toState == rin.contracts.experienceStreamState.error) {
            this._orchestrator.eventLogger.logErrorEvent("!!!!!ES {0} went to error state.".rinFormat(esStateChangedEventArgs.source));
        }
        this._checkESStatusesAsync();
    },
    _checkESStatusesAsync: function () {
        var self = this;
        setTimeout(function () { self._checkESStatuses() }, 0);
    },
    _checkESStatuses: function () {
        var areAllESReady = this.areAllESsReady();
        this._orchestrator.setIsPlayerReady(areAllESReady);

        var playerState = this._orchestrator.getPlayerState();
        if (playerState == rin.contracts.playerState.stopped) return;

        if (areAllESReady) {
            if (this._orchestrator.goalPlayerState == rin.contracts.playerState.playing && playerState != rin.contracts.playerState.playing) {
                this._orchestrator.play();
            }
            else if (this._orchestrator.goalPlayerState == rin.contracts.playerState.pausedForExplore && playerState != rin.contracts.playerState.pausedForExplore) {
                this._orchestrator.pause();
            }
        }

        if (!areAllESReady && playerState == rin.contracts.playerState.playing) {
            this._orchestrator._pauseForBuffering();
        }
    },

    _getSystemESItems: function () {
        this._systemESItems = new rin.internal.List();

        //todo: player controller es

        if (!this.bufferingES) {
            this.bufferingES = new rin.internal.DefaultBufferingES(this._orchestrator);
        }

        var bufferingESItem = new rin.internal.ESItem("BufferingES", null, this.bufferingES, 100001);
        this._systemESItems.push(bufferingESItem);

        if (!this.preloaderES) {
            this.preloaderES = new rin.internal.DefaultPreloaderES();
        }
        this.preloaderESItem = new rin.internal.ESItem("PreloaderES", null, this.preloaderES);
        this._systemESItems.push(this.preloaderESItem);

        this._esTimerES = new rin.internal.ESTimerES(this._orchestrator, this);
        this.esTimer = this._esTimerES.esTimer;
        var esTimerItem = new rin.internal.ESItem("ESTimerES", null, this._esTimerES);
        this._systemESItems.push(esTimerItem);

        if (this._orchestrator.playerConfiguration.playerControllerES && !this._orchestrator.playerConfiguration.hideAllControllers && !this._orchestrator.playerConfiguration.hideDefaultController) {
            var controllerItem = new rin.internal.ESItem("PlayerController", null, this._orchestrator.playerConfiguration.playerControllerES);
            this._systemESItems.push(controllerItem);
        }

    },

    _getFactory: function (providerTypeName, providerVersion) {
        return rin.ext.getFactory(rin.contracts.systemFactoryTypes.esFactory, providerTypeName, providerVersion);
    }


};