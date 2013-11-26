/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../core/Common.js"/>
/// <reference path="../core/Utils.js"/>
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

rin.internal.DefaultPreloaderES = function () {
    this._currentPreloadList = new rin.internal.List();
    this.stateChangedEvent = new rin.contracts.Event();
    this._preloaderTimer = new rin.internal.Timer();
};

rin.internal.DefaultPreloaderES.prototype = {
    _orchestrator: null,
    _stageControl: null,
    _esListInfo: null,
    _currentPreloadList: null,
    _preloaderTimer: null,
    _defaultPreloadingTime: 30,
    _defaultInitialMinRequiredBuffering: 9.5,
    _state: rin.contracts.experienceStreamState.closed,
    _allNarrativeESItems: null,

    stateChangedEvent: new rin.contracts.Event(),
    getUserInterfaceControl: function () { return null; },
    isPreloader: true,
    isSystemES: true,
    initialize: function (orchestrator, stageControl, esInfoList, allNarrativeESItems) {
        this._orchestrator = orchestrator;
        this._stageControl = stageControl;
        this._esListInfo = esInfoList;
        this._allNarrativeESItems = allNarrativeESItems;

        this._preloaderTimer.interval = 1000;
        var self = this;
        this._preloaderTimer.tick = function () { self._preloaderTimer_Tick(); };
        this._addListenersToAllItems();
    },

    updateScreenPlay: function (newESListInfo) {
        this._preloaderTimer.stop();
        this._removeListenersToAllItems();
        this._esListInfo = newESListInfo;
        this.load(0);
    },

    load: function (experienceStreamId) {
        this._updateCurrentPreloadList(0, this._defaultPreloadingTime);
        this._preloadCurrentItems(0, true);
        this._preloaderTimer.start();
    },

    pause: function (offset, experienceStreamId) {
        this._seek(offset, experienceStreamId);
    },

    play: function (offset, experienceStreamId) {
        this._seek(offset, experienceStreamId);
    },

    unload: function () {
        this._preloaderTimer.stop();
    },

    getPreloaderItemStatesInfo: function () { //todo
    },

    getState: function () {
        return this._state;
    },

    setState: function (value) {
        if (this._state == value) return;
        var previousState = this._state; 

        this._state = value;
        this.stateChangedEvent.publish(new rin.contracts.ESStateChangedEventArgs(previousState, value, this));
    },

    _preloaderTimer_Tick: function () {
        var currentTime = this._orchestrator.getCurrentLogicalTimeOffset();
        this._preloadItems(currentTime);
    },

    _preloadItems: function (offset) {
        this._updateCurrentPreloadList(offset, offset + this._defaultPreloadingTime);
        this._preloadCurrentItems(offset, false);
    },

    _addListenersToAllItems: function () {
        var items = this._esListInfo.getESItems();
        var self = this;
        items.foreach(function (item) {
            item.experienceStream.stateChangedEvent.subscribe(function (args) { self._experienceStream_ESStateChanged(args) }, "preloader");
        });
    },

    _removeListenersToAllItems: function () {
        var items = this._esListInfo.getESItems();
        items.foreach(function (item) {
            item.experienceStream.stateChangedEvent.unsubscribe("preloader");
        });
    },

    _experienceStream_ESStateChanged: function (esStateChangedEventArgs) {
        var sourceES = esStateChangedEventArgs.source;
        if (sourceES == this || sourceES.isPreloader) return;

        if (esStateChangedEventArgs.toState == rin.contracts.experienceStreamState.error) {
            var es = this._esListInfo.getESItems().firstOrDefault(function (item) { return item.experienceStream == sourceES });
            var esName = es ? es.id : "";
            var esType = es ? es.esData.providerId : "NotAvailable";
            this._orchestrator.eventLogger.logErrorEvent("ES {0} of type {1} went to error state in preloader.".rinFormat(esName, esType));
        }
        this._checkCurrentPreloadListStates();
    },

    _checkCurrentPreloadListStates: function () {
        if (this._areAllItemsPreloaded(this._currentPreloadList)) this.setState(rin.contracts.experienceStreamState.ready);
    },

    _updateCurrentPreloadList: function (offset, endOffset) {
        var preloadList = this._esListInfo.getESItems(offset, endOffset);
        this._currentPreloadList = preloadList.where(function (item) { return item.experienceStream != this });
    },

    _preloadCurrentItems: function (offset, bufferIfNotAllLoaded) {
        var esInfoList = this._currentPreloadList;
        rin.internal.debug.assert(!esInfoList.firstOrDefault(function (i) { return i.experienceStream == this }));

        if (this._areAllItemsPreloaded(esInfoList)) {
            this.setState(rin.contracts.experienceStreamState.ready);

            if (this._isGreedyBufferingCompleted || this._orchestrator.playerConfiguration.isGreedyBufferingDisabled) return;

            var esItemToBuffer = this._getNextESItemToBuffer(offset);
            if (!esItemToBuffer) {
                return;
            }
            else {
                esInfoList.push(esItemToBuffer);
                bufferIfNotAllLoaded = false;
            }
        }

        if (bufferIfNotAllLoaded) this.setState(rin.contracts.experienceStreamState.buffering);

        for (var i = 0; i < esInfoList.length; i++) {
            var esInfo = esInfoList[i];
            this._orchestrator.ensureExperienceStreamIsLoaded(esInfo);

            var contentControl = esInfo.experienceStream.getUserInterfaceControl();

            if (contentControl && !rin.util.hasChildElement(this._stageControl.childNodes, contentControl)) {
                rin.util.hideElementByOpacity(contentControl);
                contentControl.style.zIndex = -1;
                contentControl.style.position = "absolute";
                this._stageControl.appendChild(contentControl);
            }
        }
    },

    _areAllItemsPreloaded: function (esInfoList) {
        for (var i = 0, len = esInfoList.length; i < len; i++) {
            var state = esInfoList[i].experienceStream.getState();
            if (!state || state == rin.contracts.experienceStreamState.buffering ||
                state == rin.contracts.experienceStreamState.closed) return false;
        }
        return true;
    },

    _seek: function (offset, experienceStreamId) {
        var epsilon = .05;
        if (Math.abs(this._orchestrator.getCurrentLogicalTimeOffset() - offset) < epsilon) return;
        this._preloadItems(offset);
    },

    _getNextESItemToBuffer: function (offset) {
        var firstItemToBuffer = this._getNextNotLoadedOrBufferingItem(offset);
        if (!firstItemToBuffer) {
            // Now check if there is something else in whole timeline to buffer. Something before current offset might be non-loaded in case of seek.
            firstItemToBuffer = this._getNextNotLoadedOrBufferingItem(0);
            if (!firstItemToBuffer) {
                this._onGreedyBufferingCompleted();
                return null; // nothing to buffer anymore.
            }
        }

        if (firstItemToBuffer.experienceStream.getState() == rin.contracts.experienceStreamState.buffering) return null; // something is already buffering, do not buffer additional ones yet.
        rin.internal.debug.assert(this._orchestrator.isExperienceStreamLoaded(firstItemToBuffer.id) == false);
        this._orchestrator.eventLogger.logEvent("Preloader greedy buffer {0} at offset {1}.", firstItemToBuffer.id, firstItemToBuffer.beginOffset);
        return firstItemToBuffer;
    },

    _onGreedyBufferingCompleted: function () {
        /* When we need to buffer addional items like console, add that code here. */
        this._isGreedyBufferingCompleted = true;
    },

    _getNextNotLoadedOrBufferingItem: function (offset) {
        var allESItems = this._esListInfo.getESItems();
        for (var i = 0, len = allESItems.length; i < len; i++) {
            var es = allESItems[i];
            if (es.beginOffset >= offset && this._isBufferingOrNonLoadedESItem(es)) return es;
        }

        if (!this._allNarrativeESItems) return;

        var allNarrativeESItems = this._allNarrativeESItems;
        var lastESItem = allESItems.lastOrDefault();
        var lastESItemPos = lastESItem ? this._allNarrativeESItems.indexOf(lastESItem) : 0;
        rin.internal.debug.assert(lastESItemPos >= 0);

        for (var i = lastESItemPos, len = allNarrativeESItems.length; i < len; i++) {
            var es = allNarrativeESItems[i];
            if (this._isBufferingOrNonLoadedESItem(es)) return es;
        }

        for (var i = 0; i < lastESItemPos; i++) {
            var es = allNarrativeESItems[i];
            if (this._isBufferingOrNonLoadedESItem(es)) return es;
        }
    },

    _isBufferingOrNonLoadedESItem: function (esItem){
        var esState = esItem.experienceStream.getState();
        return esState == rin.contracts.experienceStreamState.buffering || !this._orchestrator.isExperienceStreamLoaded(esItem.id);
    },

};