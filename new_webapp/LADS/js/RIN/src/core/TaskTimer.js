/// <reference path="Common.js"/>
/// <reference path="../contracts/IExperienceStream.js" />

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

// Data structure to hold an item inside the TaskTimer.
rin.internal.TaskTimerItem = function (timeOffset, context) {
    this.offset = timeOffset;
    this.context = context
};

// TaskTimer manages a list of tasks each with its own time offsets and fires an event with the appropriate task on time.
rin.internal.TaskTimer = function (taskItems) {
    this._timerItems = new rin.internal.List(); // List to hold all tasks.
    this._stopWatch = new rin.internal.StopWatch(); // Stopwatch to maintain time.
    this.taskTriggeredEvent = new rin.contracts.Event(); // Event to be fired when a time times out.
    this.addRange(taskItems); // Add the list of tasks to the TaskTimer.
};

rin.internal.TaskTimer.prototype = {
    _timerTriggerPrecision: 0.02,
    _timerItems: null,
    _timerId: -1,
    _stopWatch: null,
    _nextItemIndex: 0,
    _itemsChanged: false,

    taskTriggeredEvent: new rin.contracts.Event(),

    // Returns the current time offset of the TaskTimer.
    getCurrentTimeOffset: function () { return this._stopWatch.getElapsedSeconds(); },

    // Add a task at the offset specified.
    add: function (offset, context) {
        if (this._timerId > 0)
        { throw new Error("Items cannot be added when timer is running. Stop the timer and then add items"); }

        this._timerItems.push(new rin.internal.TaskTimerItem(offset, context));
        this._itemsChanged = true;
    },

    // Add multiple tasks at once.
    addRange: function (taskItems) {
        if (!taskItems || taskItems.length == 0) return;
        if (this._timerId > 0)
        { throw new Error("Items cannot be added when timer is running. Stop the timer and then add items"); }

        this._timerItems = this._timerItems.concat(taskItems);
        this._itemsChanged = true;
    },

    // Remove an existing task from the list.
    remove: function (offset, context) { throw new Error("to be implemented"); },

    // Start playing the task timer.
    play: function () {
        this._checkChangedItems();
        this._triggerCurrentItems();
        this._scheduleNextItem();
        this._stopWatch.start();
    },

    // Pause the TaskTimer.
    pause: function () {
        clearTimeout(this._timerId);
        this._timerId = -1;
        this._stopWatch.stop();
    },

    // Seek the timer to a specified offset. Optionally specify if the timer should play from that point automatically.
    seek: function (offset, autoStartAfterSeek) {
        var change = Math.abs(offset - this.getCurrentTimeOffset());
        if (change > this._timerTriggerPrecision) {
            this.pause();
            this._stopWatch.reset();
            this._stopWatch.addElapsed(offset);
            this._checkChangedItems();
            this._nextItemIndex = this._findFirstTaskIndexAtTime(offset);
            this._triggerCurrentItems();
            this._scheduleNextItem();
        }

        if (autoStartAfterSeek) this._stopWatch.start();
    },

    // Get the task item at the current offset. If there is nothing at the current offset, get the previous item.
    getCurrentOrPrevious: function (offset) {
        var item = this._timerItems.lastOrDefault(function (x) {
            return x.offset <= offset;
        });
        return item ? item.context : null;
    },

    _timer_tick: function () {
        this._triggerCurrentItems();
        this._scheduleNextItem();
    },

    _triggerCurrentItems: function () {
        if (this._nextItemIndex < 0) return;

        var index = this._nextItemIndex;
        var endOffset = this.getCurrentTimeOffset() + this._timerTriggerPrecision;
        var currentItems = new rin.internal.List();

        while (index < this._timerItems.length && this._timerItems[index].offset <= endOffset) {
            currentItems.push(this._timerItems[index].context);
            index++;
        }

        if (currentItems.length > 0) {
            var self = this;
            setTimeout(function () {
                self.taskTriggeredEvent.publish(currentItems);
            }, 0);
        }

        this._nextItemIndex = (index < this._timerItems.length) ? index : -1;
    },

    _scheduleNextItem: function () {
        if (this._nextItemIndex < 0) return;

        var nextItem = this._timerItems[this._nextItemIndex];
        if (nextItem.offset == Infinity) return;

        var interval = Math.max((nextItem.offset - this.getCurrentTimeOffset()), 0);

        clearTimeout(this._timerId);
        var self = this;
        this._timerId = setTimeout(function () { self._timer_tick() }, interval * 1000);
    },


    _checkChangedItems: function () {
        if (this._itemsChanged) {
            this._timerItems.sort(function (a, b) { return a.offset - b.offset; });
            this._nextItemIndex = this._findFirstTaskIndexAtTime(this.getCurrentTimeOffset());
            this._itemsChanged = false;
        }
    },

    _findFirstTaskIndexAtTime: function (offset) {
        return this._timerItems.firstOrDefaultIndex(function (x) { return x.offset >= offset; });
    }

};