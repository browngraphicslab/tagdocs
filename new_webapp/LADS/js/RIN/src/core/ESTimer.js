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

// Timer implementation for maintaining the narrative timeline.
rin.internal.ESTimer = function (orchestrator, esItemsManager) {
    this._orchestrator = orchestrator;
    this._esItemsManager = esItemsManager;
    this.taskTimer = new rin.internal.TaskTimer(); // Internal timer for triggering tasks at specific time intervals.
};

rin.internal.ESTimer.prototype = {
    taskTimer: null,
    // Load ES items from the current screenplay and initialize the timer.
    loadESItmes: function () {
        if (this.taskTimer) this.taskTimer.pause();

        var esItems = this._esItemsManager.screenPlayInterpreter.getESItems();
        this.taskTimer = new rin.internal.TaskTimer();
        // Add item to task list.
        for (var i = 0; i < esItems.length; i++) {
            var item = esItems[i];
            this.taskTimer.add(item.beginOffset, new rin.internal.ESTimerItem(item, true));
            // Check for a valid end offset.
            if (item.endOffset != Infinity) this.taskTimer.add(item.endOffset, new rin.internal.ESTimerItem(item, false));
            this._orchestrator.eventLogger.logEvent("ESTimer: add item {0} for {1}-{2}", item.id, item.beginOffset, item.endOffset);
        }

        // Add end indicator. This will be trigered after the timeline is complete.
        var screenPlayEndTime = this._orchestrator._narrativeInfo.totalDuration; //_esItemsManager.screenPlayInterpreter.getEndTime();
        this.taskTimer.add(screenPlayEndTime, new rin.internal.ESTimerItem(this._endIndicatorItem, false));

        // This indicator will be triggered before triggering end indicator.
        var beforeEndTime = screenPlayEndTime - this._beforeEndNotificationTime;
        this.taskTimer.add(beforeEndTime, new rin.internal.ESTimerItem(this._beforeEndIndicatorItem, false));

        var self = this;
        this.taskTimer.taskTriggeredEvent.subscribe(function (triggeredItems) { self._taskTimer_taskTriggered(triggeredItems) });
    },

    // Method called every time a task is triggered by the timer.
    _taskTimer_taskTriggered: function (triggeredItems) {
        var addedESItems = new rin.internal.List();
        var removedESItems = new rin.internal.List();

        // Check all triggered items and update addedItems and removedItems list.
        for (var i = 0, len = triggeredItems.length; i < len; i++) {
            var item = triggeredItems[i];
            if (item.isEntry) {
                addedESItems.push(item.esItem);
                this._orchestrator.eventLogger.logEvent("ESTimer Trigger Add: {0} at {1} scheduled {2}", item.esItem.id, this.taskTimer.getCurrentTimeOffset(), item.esItem.beginOffset);
            }
            else {
                removedESItems.push(item.esItem);
                this._orchestrator.eventLogger.logEvent("ESTimer Trigger Rem: {0} at {1} scheduled {2}", item.esItem.id, this.taskTimer.getCurrentTimeOffset(), item.esItem.beginOffset);
            }
        }

        var currentESItems = this._esItemsManager.getCurrentESItems();
        addedESItems = addedESItems.except(currentESItems);
        var newESItems = addedESItems.concat(currentESItems).distinct().except(removedESItems);

        // Make sure indicator items are not removed.
        if (removedESItems.contains(this._beforeEndIndicatorItem)) {
            this._orchestrator._onBeforeScreenPlayEnd();
            removedESItems.remove(this._beforeEndIndicatorItem);
        }

        if (addedESItems.length == 0 && removedESItems.length == 0) return; //No changes, quit early.

        // Check if the task is an end indicator.
        var isScreenPlayEnding = removedESItems.contains(this._endIndicatorItem);
        if (isScreenPlayEnding) {
            removedESItems.remove(this._endIndicatorItem);
            var handled = this._orchestrator._onScreenPlayEnding();
            if (handled) return;
        }

        // Raise ES list changed event.
        this._esItemsManager.onCurrentExperienceStreamsChanged(addedESItems, removedESItems, newESItems, false);
        this._orchestrator._seekESItems(addedESItems, this._orchestrator.getCurrentLogicalTimeOffset());

        if (isScreenPlayEnding) {
            this._orchestrator._onScreenPlayEnded();
        }
    },
    _esItemsManager: null, //new rin.internal.ESItemsManager(), 
    _orchestrator: null, //new rin.internal.Orchestrator()
    _beforeEndIndicatorItem: new rin.internal.ESItem("BeforeEndIndicatorItem"),
    _endIndicatorItem: new rin.internal.ESItem("EndIndicatorItem"),
    _beforeEndNotificationTime: 0.2
};

// Format for a timer item to be stored in the task timer.
rin.internal.ESTimerItem = function (esItem, isEntry) {
    this.esItem = esItem; this.isEntry = isEntry;
};