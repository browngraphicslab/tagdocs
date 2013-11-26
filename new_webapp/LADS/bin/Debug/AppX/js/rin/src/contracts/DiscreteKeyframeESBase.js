/*!
* RIN Core JavaScript Library v1.0
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
rin.contracts = rin.contracts || {};

// Base class for any ES which uses keyframes at discrete intervals.
rin.contracts.DiscreteKeyframeESBase = function (orchestrator, esData) {
    this._esData = esData;
    this._orchestrator = orchestrator;
    this._keyframes = new rin.internal.List();
    this.stateChangedEvent = new rin.contracts.Event();
    this._state = rin.contracts.experienceStreamState.closed;
};

rin.contracts.DiscreteKeyframeESBase.prototype = {
    // Notify ES stage change.
    stateChangedEvent: null,
    // Method called every time a keyframe has to be applied.
    displayKeyframe: function (keyframeData) { },
    // Reset the UI.
    resetUserInterface: function () { },
    // Load the ES and initialize its components.
    load: function (experienceStreamId) {
        if (!this._esData || !this._orchestrator) throw new Error("orchestrator and esData should not be null. Make sure the base ES is instantiated using non-empty constructor during run time");
        this._initKeyframes(experienceStreamId);
    },
    // Play the ES from the specified offset.
    play: function (offset, experienceStreamId) {
        if (this.getState() == rin.contracts.experienceStreamState.error) {
            //do nothing
            return;
        }
        this.isLastActionPlay = true;
        if (this._taskTimer) {
            var isSeeked = this._seek(offset, experienceStreamId);
            this._taskTimer.play();
            if (!isSeeked && this._lastKeyframe) {
                var nextKeyframe = this._getNextKeyframe(this._lastKeyframe);
                var interpolationOffset = offset - this._lastKeyframe.offset;
                rin.internal.debug.assert(interpolationOffset >= 0);
                this._loadKeyframe(this._lastKeyframe, nextKeyframe, interpolationOffset);
            }
        }
    },
    // Pause the ES at the specified offset.
    pause: function (offset, experienceStreamId) {
        this.isLastActionPlay = false;
        if (this._taskTimer) {
            this._seek(offset, experienceStreamId);
            this._taskTimer.pause();
        }
    },

    // Unload the ES and release any resources.
    unload: function () {
        this.pause();
    },

    // Get the current state of this ES.
    getState: function () {
        return this._state;
    },

    // Get the state if this ES.
    setState: function (value) {
        if (this._state == value) return;
        var previousState = this._state;
        this._state = value;
        this.stateChangedEvent.publish(new rin.contracts.ESStateChangedEventArgs(previousState, value, this));

        if (this._taskTimer && this._state == rin.contracts.experienceStreamState.ready && previousState != rin.contracts.experienceStreamState.ready) {
            this._loadKeyframeAtOffset(this._taskTimer.getCurrentTimeOffset());
        }
    },
    getUserInterfaceControl: function () { return this._userInterfaceControl; },
    isLastActionPlay: false,

    // Load and initialize the keyframes and the timer.
    _initKeyframes: function (experienceStreamId) {
        var currentExperienceStreamId = experienceStreamId;
        if (!this._isValidExperienceStreamId(currentExperienceStreamId)) {
            rin.internal.debug.assert(false, "invalid experience stream id");
            this._orchestrator.eventLogger.logErrorEvent("Requested experience stream {0} missing in datamodel", currentExperienceStreamId);            
        } else {
            var self = this;
            this._keyframes = this._esData.experienceStreams[experienceStreamId].keyframes;
            if (this._taskTimer) this._taskTimer.pause();
            this._taskTimer = new rin.internal.TaskTimer();
            this._taskTimer.taskTriggeredEvent.subscribe(function (triggeredItems) { self._taskTimer_taskTriggered(triggeredItems) });
            if (this._keyframes && this._keyframes != null) {
                this._keyframes.sort(function (a, b) { return a.offset - b.offset; });
                for (var i = 0, len = this._keyframes.length; i < len; i++) {
                    var keyframe = this._keyframes[i];
                    this._taskTimer.add(parseFloat(keyframe.offset), keyframe);
                }
            }
            this._lastKeyframe = null;
            this._currentExperienceStreamId = currentExperienceStreamId;
        }
    },

    // Check if the experienceStreamId is valid.
    _isValidExperienceStreamId: function (experienceStreamId) {
        return experienceStreamId && this._esData.experienceStreams[experienceStreamId];
    },

    // Method called every time the timer triggers.
    _taskTimer_taskTriggered: function (triggeredItems) {
        var lastKeyframe = triggeredItems.lastOrDefault();
        var nextKeyframe = this._getNextKeyframe(lastKeyframe);
        this._loadKeyframe(lastKeyframe, nextKeyframe);
    },

    // Load a specified keyframe.
    _loadKeyframe: function (keyframeData, nextKeyframeData, interpolationOffset) {
        this._lastKeyframe = keyframeData;

        if (keyframeData) this.displayKeyframe(keyframeData, nextKeyframeData, interpolationOffset || 0);
        else this.resetUserInterface();
    },

    // Seek to the specified offset.
    _seek: function (offset, experienceStreamId) {
        var isSeeked = false;
        if (experienceStreamId != this._currentExperienceStreamId && this._isValidExperienceStreamId(experienceStreamId)) {
            this.resetUserInterface();
            this._initKeyframes(experienceStreamId);
            isSeeked = true;
        }
        this._currentExperienceStreamId = experienceStreamId; //change current ESId even if the name is not valid. Sometimes non-existent ESIDs are used in screenplay for features like preserveContinuity in audio.

        var epsilon = .05;
        var currentTimeOffset = this._taskTimer.getCurrentTimeOffset();
        if (this._taskTimer && (isSeeked || Math.abs(currentTimeOffset - offset) > epsilon)) {
            this._taskTimer.seek(offset);
            this._loadKeyframeAtOffset(offset);
            isSeeked = true;
        }
        return isSeeked;
    },

    // Load keyframe from a specified offset.
    _loadKeyframeAtOffset: function (offset) {
        var lastKeyframe = this._taskTimer.getCurrentOrPrevious(offset);
        if (!lastKeyframe) return true; // exit is there is no lastkeyframe

        var nextKeyframe = this._getNextKeyframe(lastKeyframe);
        var interpolationOffset = offset - lastKeyframe.offset;
        rin.internal.debug.assert(interpolationOffset >= 0);
        this._loadKeyframe(lastKeyframe, nextKeyframe, interpolationOffset);
    },

    // Find the next keyframe.
    _getNextKeyframe: function (keyframeData) {
        var keyframeIndex = keyframeData ? this._keyframes.indexOf(keyframeData) : -1;
        return (keyframeIndex >= 0 && (keyframeIndex + 1) < this._keyframes.length) ? this._keyframes[keyframeIndex + 1] : null;
    },

    _keyframes: null,
    _lastKeyframe: null,
    _currentExperienceStreamId: null,
    _taskTimer: null,
    _userInterfaceControl: null,
    _orchestrator: null,
    _esData: null
};