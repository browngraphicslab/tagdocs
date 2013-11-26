LADS.Util.makeNamespace('LADS.TourAuthoring.TimeManager');

/**
 * Manages all time-related things in TourAuthoring
 * Stores info re: start/end, current time, scale
 * Scale converts between time space (seconds) and pixel space (pixels on timeline)
 * Dispatches events to subscribers on time changes
 * All time values stored as seconds
 * @param spec      start, end, scale, current parameters, all integers, all in seconds (not required)
 * @param my        not used
 */
LADS.TourAuthoring.TimeManager = function (spec, my) {
    "use strict";

    var that = {};

    //////////
    // PRIVATE
    // DOM elements
    spec = spec || {};
    var player = null, // Holds interval during playback
        // Initial time settings
        //spec = spec || {}, // Gotta do this so following default checks work
        start = spec.start|| 0,
        end = spec.end || 180,
        scale = spec.scale || 20, // Defines px per sec
        current = spec.current || 0,
        // Event handling
        seekSubscribers = [],
        durationSubscribers = [],
        playStartSubscribers = [],
        playSubscribers = [],
        stopSubscribers = [],
        moveSubscribers = [],
        // viewer state
        ready = false,
        getViewerTime = null;

    /////////
    // PUBLIC

    // SETTERS
    /**
     * Generally should use setTime once everything has been initialized:
     * Spec object contains any of start, end, scale properties
     * All time-dependent text in DOM is updated as well to reflect changes
     */
    function setTime (newspec) {
        // Duration updates
        var updated = [];
        if (newspec.start) {
            currentPx = null;
            start = spec.start;
            updated.push('start');
        }
        if (newspec.end) {
            end = spec.end;
            updated.push('end');
        }
        if (newspec.scale) {
            currentPx = null;
            scale = spec.scale;
            updated.push('scale');
        }
        if (newspec.start || newspec.end || newspec.scale) {
            _sendSizing({ start: start, end: end, scale: scale, updated: updated });
        }
        // Seek updates
        if (newspec.current) {
            currentPx = null;
            current = newspec.current;
            _sendSeek({ current: current });
        }
    }
    // General purpose setters
    function setStart(newStart) {
        currentPx = null;
        start = newStart;
        _sendSizing({ start: start, end: end, scale: scale, updated: ['start'] });
    }
    function setEnd (newEnd) {
        end = newEnd;
        if (current > end) {
            currentPx = null;
            current = end;
        }
        _sendSizing({ start: start, end: end, scale: scale, updated: ['end'] });
    }
    function setScale(newScale) {
        currentPx = null;
        scale = newScale;
        _sendSizing({ start: start, end: end, scale: scale, updated: ['scale'] });
    }

    // Use seek to synchronize
    function seek(newTime) {
        if (newTime < 0) { // Check hack to prevent seeking to -1 sec
            newTime = 0;
        } else if (newTime > end) { // make sure you can't seek past the end of the timeline
            newTime = end;
        }
        currentPx = null;
        current = newTime;
        var pct = ((current - start) / (end - start));
        _sendMove({ current: current, percent: pct });
        _sendSeek({ current: current, percent: pct });
        if (current > end) {
            console.log('On timeManager seek: asked to seek past end (normal seek)?!');
        }
    }
    function seekByAmount(amount) {
        currentPx = null;
        current += amount;
        var pct = ((current - start) / (end - start));
        _sendMove({ current: current, percent: pct });
        _sendSeek({ current: current, percent: pct });
        if (current > end) {
            console.log('On timeManager seek: asked to seek past end (amount seek)?!');
        }
    }
    function seekToPercent(per) {
        currentPx = null;
        current = (end - start) * per;
        _sendMove({ current: current, percent: ((current - start) / (end - start)) });
        _sendSeek({ current: current, percent: per });
    }
    that.setTime = setTime;
    that.setStart = setStart;
    that.setEnd = setEnd;
    that.setScale = setScale;
    that.seek = seek;
    that.seekByAmount = seekByAmount;
    that.seekToPercent = seekToPercent;

    /**
     * Get state from viewer
     * @param isReady       whether the tour can play
     */
    function setReady(isReady) {
        ready = isReady;
    }
    that.setReady = setReady;

    function getReady(isReady) {
        return ready;
    }
    that.getReady = getReady;

    function registerTime(func) {
        getViewerTime = func;
    }
    that.registerTime = registerTime;

    function getScale() {
        return scale;
    }
    that.getScale = getScale;
    /**
     * Drives forward current time to mimic playback
     */
    function play () {
        var interval = 100, last = -10,
            useInternalTime = false, lastInternalTime = Date.now(),
            pct = ((current - start) / (end - start));

        _sendMove({ current: current, percent: pct });
        _sendPlayStart({ current: current, percent: pct });

        player = window.requestAnimationFrame(function updatePlay(timestamp) {
            player = window.requestAnimationFrame(updatePlay);
            // update program state
            if (ready) {
                if (!useInternalTime) {
                    current = getViewerTime();
                    if (current === last) {
                        useInternalTime = true;
                        current += (timestamp - lastInternalTime) / 1000;
                        //if(current > end)
                        //    current = end;
                        //stop();
                    }
                } else {
                    current += (timestamp - lastInternalTime) / 1000;
                }

                if (current >= end) {
                    current = end;
                    stop();
                }

                _sendPlay({ current: current, percent: ((current - start) / (end - start)) });
                
                currentPx = null;
                last = current;
                lastInternalTime = timestamp;
            }
        });
    }
    that.play = play;

    /**
     * Stops playback if time manager is playing
     */
    function stop () {
        if (player) {
            window.cancelAnimationFrame(player);
            player = null;
            _sendStop();
        }
    }
    that.stop = stop;
    onSeek(stop); // Automatically stop playback when a seek occurs

    /**
     * Functions for converting btw pixel space and time space
     */
    function timeToPx(t) {
        return (t - start) * scale;
    }
    function pxToTime(px) {
        return (px / scale) + start;
    }
    function formatTime(seconds) {
        var min = parseInt(seconds / 60, 10);
        var sec = Math.floor(seconds % 60);
        if (sec < 10) {
            sec = '0' + sec;
        }
        return min + ':' + sec;
    }
    function unformatTime(string) {
        // Strings are expected in format: MM:SS TODO: include milliseconds?
        var min, sec;
        string.split(':');
        min = parseFloat(min);
        sec = parseFloat(sec);
        return min * 60 + sec;
    }
    that.timeToPx = timeToPx;
    that.pxToTime = pxToTime;
    that.formatTime = formatTime;
    that.unformatTime = unformatTime;
    
    var currentPx = null;
    /**
     * Grab current time in editor using playhead position
     * @returns     Current time (in time-space)
     */
    function getCurrentTime() {
        return current;
    }
    that.getCurrentTime = getCurrentTime;

    function getCurrentPx() {
        if (!currentPx) {
            currentPx = timeToPx(current);
        }
        return currentPx;
    }
    that.getCurrentPx = getCurrentPx;

    /**
     * Grab current time as percent complete of tour
     * @returns     Current time (as percentage)
     */
    function getCurrentPercent() {
        return (current - start) / (end - start);
    }
    that.getCurrentPercent = getCurrentPercent;

    /**
     * Gets description of current duration
     * @returns     Object w/ start, end, scale parameters
     */
    function getDuration () {
        return { start: start, end: end, scale: scale };
    }
    that.getDuration = getDuration;

    // Event subscribers

    /**
     * Add an event handler to be called on updating of current time (during playback or seek)
     * @param handler   Event handler to be called whenever current time is updated
     */
    function onSeek (handler) {
        seekSubscribers.push(handler);
    }
    that.onSeek = onSeek;

    /**
     * Dispatches events to subscribers on seek update (private)
     * Context is set as time object
     * @param ev    The event: current, percent parameters
     */
    function _sendSeek (ev) {
        var i;
        for (i = 0; i < seekSubscribers.length; i++) {
            seekSubscribers[i].call(that, ev);
        }
    }

    /**
     * Add an event handler to be called on updating of duration
     * @param handler   Event handler to be called whenever start, end, or scale is updated
     */
    function onSizing (handler) {
        durationSubscribers.push(handler);
    }
    that.onSizing = onSizing;

    /**
     * Dispatches events to subscribers on duration update (private)
     * Context is set as time object
     * @param ev    The event: start, end, scale parameters (for easy access)
     */
    function _sendSizing (ev) {
        var i;
        for (i = 0; i < durationSubscribers.length; i++) {
            durationSubscribers[i].call(that, ev);
        }
    }

    /**
     * Add an event handler to be called on play() / when it is called
     * Will only be called once
     * @param handler       Event handler
     */
    function onPlayStart(handler) {
        playStartSubscribers.push(handler);
    }
    that.onPlayStart = onPlayStart;

    /**
     * Dispatches events to subscribers on play (private)
     * @param ev    The event: current, percent parameters
     */
    function _sendPlayStart(ev) {
        var i;
        for (i = 0; i < playStartSubscribers.length; i++) {
            playStartSubscribers[i].call(that, ev);
        }
    }

    /**
     * Add an event handler to be called during player interval updates
     * @param handler       Event handler
     */
    function onPlay (handler) {
        playSubscribers.push(handler);
    }
    that.onPlay = onPlay;

    /**
     * Dispatches events to subscribers on play updates (private)
     * Context is set as time object
     * @param ev    The event: current, percent parameters
     */
    function _sendPlay(ev) {
        var i;
        for (i = 0; i < playSubscribers.length; i++) {
            playSubscribers[i].call(that, ev);
        }
    }

    /**
     * Add an event handler to be called on stop
     * @param handler       Event Handler to be called whenever stop() is called
     */
    function onStop(handler) {
        stopSubscribers.push(handler);
    }
    that.onStop = onStop;

    /**
     * Dispatches events to subscribers on play (private)
     * Context is set as time object
     * @param ev    The event: no use at the moment
     */
    function _sendStop (ev) {
        var i;
        for (i = 0; i < stopSubscribers.length; i++) {
            stopSubscribers[i].call(that, ev);
        }
    }

    /**
     * Add an event handler to be called on move (either play or seek)
     * Executes before other actions in play or seek, allowing safe updates
     * @param handler       Event handler to be called whenever play() or seek() is called
     */
    function onMove(handler) {
        moveSubscribers.push(handler);
    }
    that.onMove = onMove;

    /**
     * Dispatches events to subscribers on move (private)
     * Context is set as time object
     * @param ev    The event: current, percent parameters
     */
    function _sendMove(ev) {
        var i;
        for (i = 0; i < moveSubscribers.length; i++) {
            moveSubscribers[i].call(that, ev);
        }
    }

    return that;
};

