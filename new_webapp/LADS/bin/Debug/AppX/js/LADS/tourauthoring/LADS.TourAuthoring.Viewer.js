LADS.Util.makeNamespace('LADS.TourAuthoring.Viewer');

/**
 * Previews current tour while user edits
 * @param spec  timeManager attr, url (url of tour if loading existing tour for editing)
 * @param my    not used
 */
LADS.TourAuthoring.Viewer = function (spec, my) {
    "use strict";

    var player, timeline,
        that = {},
        artworkPanel = $(document.createElement('div')),
        rinContainer = $(document.createElement('div')),
        timeManager = spec.timeManager,
        url = spec.url,

        // viewer state
        playing = false,
        buffering = false,
        reloading = false,
        needRefresh = false, ctime = null,

        // capturing keyframes?
        capturingOn = false,
        currentCapture = '',
        keyframingDisabled = false,
            
        // is the tour reloading?
        isReloading = false;

    // Instantiate RIN player
    (function _startRIN() {
        // HTML containers
        artworkPanel.attr('id', 'viewer');
        artworkPanel.css({
            "background-color": "rgb(0,0,0)", "height": "100%", "width": "80%",
            "position": "relative", "left": "20%"
        });

        // let's assume 16:9 ratio for now
        rinContainer.attr('id', 'rinContainer');
        rinContainer.css({
            'border-style': 'solid', 'border-width': LADS.TourAuthoring.Constants.rinBorder+'px', 'border-color': 'white',
            'height': '95%', 'width': '30%', 'top': '0%', 'left': '30%', 'position': 'absolute', 'z-index': 0
        });
        artworkPanel.append(rinContainer);

        var playerElement = $(document.createElement('div'));
        playerElement.attr('id', 'rinplayer');
        playerElement.css({
            'z-index': -100, 'overflow': 'hidden',
            'height': '100%', 'width': '100%',
            'position': 'absolute'
        });
        rinContainer.append(playerElement);

        // creates actual RIN player
        rin.processAll(null, 'js/rin/web/').then(function () {
            var options = 'systemRootUrl=js/rin/web/&hideAllControllers=true&playerMode=authorerEditor';
            player = rin.createPlayerControl(playerElement[0], options);
            //player.interactionModeStarted.subscribe(_onInteraction);
            player.orchestrator.playerESEvent.subscribe(_onPlayerESEvent, 'id');
            player.orchestrator.isPlayerReadyChangedEvent.subscribe(_onPlayerStateEvent);
            
            timeManager.registerTime(getCurrentTime);
        });

        if (url) {
            loadTour(url, function () { console.log('Viewer: initial loading complete'); });
        }
    })();

    //function _onInteraction(eventArgs) {
    //    timeManager.stop();
    //    capturingOn = true;
    //    currentCapture = eventArgs.interactionES._esData.experienceId;
    //    if (!reloading && timeManager.getReady()) {
    //        _sendKeyframe(eventArgs.interactionES);
    //    }
    //}

    /**
     * When RIN is interacted with, captures new keyframe data and sends it to timeline
     * @param eventArgs     sender, eventId, ? (RIN)
     */
    function _onPlayerESEvent(eventArgs) {
        console.log(eventArgs.eventId);
        if (timeline) {
            switch (eventArgs.eventId) {
                case rin.contracts.esEventIds.interactionActivatedEventId:
                    timeManager.stop(); // on interaction start capturing
                    capturingOn = true;
                    currentCapture = eventArgs.sender._esData.experienceId;
                    if (capturingOn && !reloading && timeManager.getReady()) {
                        _sendKeyframe(eventArgs.sender);
                    }
                    break;
                case rin.contracts.esEventIds.stateTransitionEventId:
                    // filter out non-interaction transitions
                    if (capturingOn && !reloading && timeManager.getReady()) {
                        _sendKeyframe(eventArgs.sender);
                    }
                    break;
            }
        }
    }

    function _sendKeyframe(sender) {
        var trackName, capture = '';
        if (sender.captureKeyframe && capturingOn) {
            capture = sender.captureKeyframe();
            if (capture === '') { // continue capturing until successful
                //setTimeout(function () { _sendKeyframe(sender); }, 10);
				console.log('No keyframe captured!?');
                return;
            }
            trackName = sender._esData.experienceId;

            timeline.receiveKeyframe(trackName, capture,
                (trackName === currentCapture));
        }
    }

    /**
     * Turn capturing off on update
     */
    function capturingOff() {
        capturingOn = false;
        currentCapture = '';
    }
    that.capturingOff = capturingOff;

    /**
     * Get state of keyframe disable switch.
     */
    function isKeyframingDisabled() {
        return keyframingDisabled;
    }
    that.isKeyframingDisabled = isKeyframingDisabled;

    function setKeyframingDisabled(state) {
        keyframingDisabled = state;
    }
    that.setKeyframingDisabled = setKeyframingDisabled;

    // add event listener for playerReady event to re-enable keyframe capture.
    $('body')[0].addEventListener('playerReady', function () {
        keyframingDisabled = false;
    });

    /**
     * Syncs time manager with buffering state of RIN
     * @param isReady        true if RIN is ready to play
     */
    function _onPlayerStateEvent(isReady) {
        buffering = !isReady;
        timeManager.setReady(isReady);
        reloading = false;
        if (isReady) {
            if (needRefresh && ctime) {
                needRefresh = false;
                seek(timeManager.getCurrentTime());
                ctime = null;
            }
            needRefresh = false;
            setTimeout(function () {
                var readyEvent = document.createEvent('Event');
                readyEvent.initEvent('playerReady', true, true);
                $('body')[0].dispatchEvent(readyEvent);
            }, 500);
        }
    }

    // Turn off capture on player events
    function _stopCapture() {
        capturingOn = false;
    }
    timeManager.onMove(_stopCapture);
    timeManager.onStop(_stopCapture);

    // Public stuff

    /**
     * @returns     current keyframe state data
     */
    function captureKeyframe(artname) {
        if (player) {
            return player.captureKeyframe(artname); //grab artwork container? BREAKPOINT HERE
        }
    }
    that.captureKeyframe = captureKeyframe;

    /**
     * Passed to TimeManager on player load
     * @returns     current time in player
     */
    function getCurrentTime() {
        return player.orchestrator.getCurrentLogicalTimeOffset();
    }
    that.getCurrentTime = getCurrentTime;
    

    function addToDOM (container) {
        container.append(artworkPanel);
    }
    that.addToDOM = addToDOM;

    /**
     * Get JQuery object containing rin player
     */
    function getContainer() {
        return rinContainer;
    }
    that.getContainer = getContainer;

    /**
     * Updates size of viewer area on resize
     */
    function resize() {
        var h = artworkPanel.height() - 2 * LADS.TourAuthoring.Constants.rinBorder,
            w = artworkPanel.width() - 2 * LADS.TourAuthoring.Constants.rinBorder,
            idealW = h * 16 / 9, idealH, // ideal W given h, vice-versa
            xoffset, yoffset;
        if (idealW <= w) {
            xoffset = (w - idealW) / 2;
            rinContainer.css({
                width: idealW + 'px',
                height: h + 'px',
                top: '0px',
                left: xoffset + 'px'
            });
        } else { // no room to support, use ideal H
            idealH = w * 9 / 16;
            yoffset = (h - idealH) / 2; // equal spacing on top and bottom
            rinContainer.css({
                width: w + 'px',
                height: idealH + 'px',
                top: yoffset + 'px',
                left: '0px'
            });
        }
    }
    that.resize = resize;

    // PLAYER INTERACTIONS
    /**
     * Play viewer (should only be called from timeManager)
     */
    function play(time) {
        if (!playing) {
            player.play(time);
            playing = true;
        }
    }
    that.play = play;
    timeManager.onPlayStart(function (ev) { play(ev.current); });

    /**
     * Stop viewer (should only be called from timeManager)
     */
    function stop() {
        if (playing && !buffering) {
            player.pause();
            playing = false;
        }
    }
    that.stop = stop;
    timeManager.onStop(stop);

    /**
     * Seek viewer (should only be called from timeManager)
     * @param time  location to seek to in units of seconds
     */
    function seek(time) {
        if (needRefresh) {
            ctime = timeManager.timeToPx(time);
        }

        else if (player && !playing) {
            stop();
            playing = false;
            player.pause(time);
        }
    }
    that.seek = seek;
    timeManager.onSeek(function (ev) { seek(ev.current); });

    /**
     * Set volume
     * @param v     volume, between 0 and 1
     */
    function volume(v) {
        player.volume(v);
    }
    that.volume = volume;

    /**
     * Set reference to Timeline for keyframe passing
     */
    function setTimeline(t) {
        timeline = t;
    }
    that.setTimeline = setTimeline;

    /**
     * Load tour from url
     * @param url       URL of json tour
     */
    function loadTour(url, callback) {
        if (player) {
            player.load(url, callback);
        } else {
            setTimeout(function () {
                loadTour(url, callback);
            }, 50);
        }
    }
    that.loadTour = loadTour;

    /**
     * Load / reload tour into viewer
     * @param data      Segment portion of RIN tour
     */
    function reloadTour(data, doNotUpdateReloading) {
        if (!doNotUpdateReloading) {
            isReloading = true;
        }
        console.log("####################################################: "+isReloading);
        // console.log("player: "+player);
        for (var key in data.resources) {
            if (data.resources.hasOwnProperty(key)) {
                if (typeof data.resources[key].uriReference === 'string') {
                    data.resources[key].uriReference = LADS.Worktop.Database.fixPath(data.resources[key].uriReference);
                }               
            }
        }
        if (player) {
            reloading = true;
            needRefresh = true;
            player.orchestrator._isPlayerReady = false;
            ctime = timeManager.getCurrentTime();
            player.unload();
            player.loadData(data, function () {
                // if needRefresh is false we seeked too early?
                if (!needRefresh) {
                    seek(timeManager.getCurrentTime());
                    setTimeout(function () {
                        var readyEvent = document.createEvent('Event');
                        readyEvent.initEvent('playerReady', true, true);
                        $('body')[0].dispatchEvent(readyEvent);
                    }, 500);
                }
                //setTimeout(function () { seek(ctime); reloading = false; }, 25);
                if (!doNotUpdateReloading) {
                    isReloading = false;

                }
                console.log("##############################################: "+isReloading);
            });
        } else {
            setTimeout(function () { reloadTour(data, true); }, 50);
        }
    }
    that.reloadTour = reloadTour;

    function getIsReloading() {
        return isReloading;
    }
    that.getIsReloading = getIsReloading;

    function setIsReloading(bool) {
        isReloading = bool;
    }
    that.setIsReloading = setIsReloading;

    function initializeTour(data) {
        var ctime;
        isReloading = true;
        console.log("isReloading: true, in initializeTour");
        // console.log("player: "+player);
        if (player) {
            ctime = timeManager.getCurrentTime();
            player.unload();
            player.loadData(data, function () {
                setTimeout(function () {
                    seek(ctime);
                    isReloading = false;
                    console.log("isReloading: false, in initializeTour");
                }, 50);
            });
        } else if (timeline.getTrackslength() === 0) {
            ctime = timeManager.getCurrentTime();
            setTimeout(function () {
                //seek(ctime);
                isReloading = false;
                console.log("isReloading: false, in initializeTour");
            }, 50);
        } else {
            setTimeout(function () { reloadTour(data, true); }, 50);
        }
    }
    that.initializeTour = initializeTour;

    /**
     * Unloads RIN player
     * call when exiting Authoring
     */
    function unload() {
        player.unload();
    }
    that.unload = unload;

    return that;
};