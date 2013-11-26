LADS.Util.makeNamespace('LADS.TourAuthoring.PlaybackControl');

/**
 * Component menu at the bottom of the screen
 * Contains controls for playing and seeking tour
 * @param spec      timeManager attr undoManager
 * @param my        not used
 */
LADS.TourAuthoring.PlaybackControl = function (spec, my) {
    "use strict";

    var that = {},
        bottombar = $(document.createElement('div')),
        playing = false,//keeps track of when the player is on
        undoManager = spec.undoManager,
        timeManager = spec.timeManager,
        viewer = spec.viewer,
        timeline = spec.timeline,
        root = spec.root,
        playHeadGroup,//represents the black, long playhead
        lastScale = timeManager.getDuration().scale;//stores the scale of the timeline, which can change because of zoom (?)

    (function _createHTML() {
        bottombar.css({
            "background-color": "rgb(219,218,199)",
            "height": "9.25%",
            "width": "96.95%", "bottom": "0%",
            'margin-left': '1.25%',
            "position": "absolute",
            "box-shadow": "0px -16px 14px -14px #888",
            //'z-index': '10001',
            'z-index': '102',

        });
        bottombar.attr('id', 'playback-controls');

        // Play button
        var playButton = $(document.createElement('img'));
        playButton.css({
            "margin-top": "1%",
            'margin-left': '2%',
            'width': '4%',
            'height': '60%',
            "position": "relative",
            'display': 'inline-block'
        });
        playButton.attr('src', 'images/icons/Play.svg');
        playButton.attr('id', 'playButton');
        playButton.click(function () { // Start and stop playback
            togglePlay();
        });
        bottombar.append(playButton);

        //allow space bar to play/pause
        root.on('keyup', function (evt) { // Start and stop playback
            if (evt.keyCode === 32) {
                togglePlay();
            }
        });

        function togglePlay() {
            if (!timeline.getEditInkOn()) {
                if (!playing) {
                    timeManager.play();
                } else {
                    timeManager.stop();
                }
            }
        }

        // on play and stop update the play button image and internal state
        timeManager.onPlayStart(function () {
            playButton.attr('src', 'images/icons/Pause.svg');
            playing = true;
        });
        timeManager.onStop(function () {
            playButton.attr('src', 'images/icons/Play.svg');
            playing = false;
        });

        // Playhead Location slider
        var playheadLocContainer = $(document.createElement('div'));
        playheadLocContainer.attr('id', 'playhead-location');
        playheadLocContainer.css({
            'margin-left': '12%', 'height': '100%', 'margin-top': '1%',
            'width': '37.5%', 'position': 'relative', 'display': 'inline-block', 'vertical-align': 'middle',
            'color': 'black',
        });
        bottombar.append(playheadLocContainer);

        // Label for control
        var locationLabel = $(document.createElement('label'));
        locationLabel.attr('id', 'playLabel');
        locationLabel.text('Timeline Overview');
        locationLabel.css({
            'font-weight': '600', 'font-size': LADS.Util.getFontSize(150)
        });
        playheadLocContainer.append(locationLabel);

        //container for slider
        var sliderContainer = $(document.createElement('div'));
        sliderContainer.attr('id', 'sliderContainer');
        sliderContainer.css({
            'position': 'absolute', 'width': '40%', 'height': '100%', 'margin-top': '-2%', 'display': 'inline-block',
        });
        playheadLocContainer.append(sliderContainer);

        // Container and background for Slider
        var slider = $(document.createElement('div'));
        slider.attr('id', 'timelineSlider');
        slider.css({
            'position': 'relative', 'margin-left': '4%', 'display': 'inline-block', 'width': '100%', 'height': '20%',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', 'background-color': 'white', 'margin-top': '8.5%',
        });
        sliderContainer.append(slider);

        // HK25
        // Slider box to display the current view of the timeline

        // Hardcoded the slider box width currently as the css width of tracks region and time ruler returned 0.
        // The hardcoded value is the inital value for the track.
        var sliderBoxWidth = 125;
        var sliderBox = $(document.createElement('div'));
        sliderBox.attr('id', 'timelineSliderBox');
        sliderBox.css({
            'position': 'absolute', 'width': sliderBoxWidth + 'px',
            'height': '130%', 'border': '2px none black', 'margin-top': '-2%'
        });
        sliderBox.draggable({
            // Updates the view using the element id. Be careful changing element ids
            axis: 'x',
            drag: function (evt, ui) {
                if (timeline.getEditInkOn()) {
                    return false;
                }

                //var tracks = $('.track');
                // Be careful changing timelineSliderBox border!
                var sliderMax = slider.width() - sliderBox.width();//-7; Why was this here? jake

                ui.position.left = Math.constrain(ui.position.left, 0, sliderMax);

                var leftt = (ui.position.left / (sliderMax + Math.ceil(sliderBox.width())) * timeline.getTimeRuler().width());
                timeline.registerUpdateSlider(null);
                timeline.getTrackBody().scrollLeft(leftt);
                timeline.cancelAccel();
                timeline.registerUpdateSlider(sliderBoxUpdate);
                //tracks.css('left', leftt + 'px')
                //playhead.css('left', leftt + 'px')
            }
        });
        slider.append(sliderBox);

        sliderBox.mousedown(function (evt) {
            evt.stopPropagation();
        });



        //represents the green part of the timeline for artworks and the gray part for inks -- indicates the length
        var greenBoxInSlider = $(document.createElement('div'));
        greenBoxInSlider.css({
            'background-color': 'DarkGreen', 'top': '10%', 'height': '80%', 'position': 'absolute',
            'width': '100%', 'border': '2px solid black',
        });
        sliderBox.append(greenBoxInSlider);

        // Fader
        var fader = createPlayhead();
        fader.css({
            'height': '155%', 'width': '0%', 'margin-top': '-4%',
            'position': 'absolute', 'left': '0%'
        });
        fader.attr('id', 'fader');
        fader.draggable({
            axis: 'x',
            drag: function (event, ui) {//changes ui on dragging end keyframes
                if (timeline.getEditInkOn()) {
                    return false;
                }
                var sliderWidth = slider.width();
                ui.position.left = Math.constrain(ui.position.left, 0, sliderWidth);

                var percent = Math.constrain(ui.position.left / (sliderWidth - fader.width()), 0, 1);
                timeManager.seekToPercent(percent);
            },
            stop: function () {
                if (fader.offset().left > slider.offset().left + slider.width()) {
                    fader.css('left', slider.width() + 'px');
                }
            }
        });
        var faderUpdate = function (ev) {
            fader.css('left', ((fader.offsetParent().width() - fader.width()) * ev.percent) + 'px');
        };
        timeManager.onSeek(faderUpdate);
        timeManager.onPlay(faderUpdate);
        timeManager.onSizing(faderUpdate);
        slider.append(fader);

        var sliderLabel = $(document.createElement('label'));
        sliderLabel.attr('id', 'playhead-position');
        sliderLabel.css({
            'position': 'relative',
            'left': '45%',
            'color': 'black',
            'display': 'inline-block',
            'font-weight': '600',
            'font-size': LADS.Util.getFontSize(150)
        });
        sliderLabel.text('0:00/1:00');
        var labelUpdate = function (ev) {
            var current = timeManager.getCurrentTime();
            var end = timeManager.getDuration().end;
            var timeLeft;
            var timeRight;

            if (isNaN(current) || isNaN(end)) {
                timeLeft = '0:00';
                timeRight = '0:00';
            } else {
                timeLeft = timeManager.formatTime(current);
                timeRight = timeManager.formatTime(end);
            }
            sliderLabel.text(timeLeft + '/' + timeRight);
        };
        timeManager.onSeek(labelUpdate);
        timeManager.onPlay(labelUpdate);
        timeManager.onSizing(labelUpdate);
        playheadLocContainer.append(sliderLabel);

        var zoomSliderContainter = $(document.createElement('div'));
        zoomSliderContainter.css({
            'position': 'relative',
            'display': 'inline-block',
            'width': '20%', 'height': '60%',
            'vertical-align': 'middle',
            'margin-top': '-1%',
            'margin-right': '2%'
        });
        bottombar.append(zoomSliderContainter);

        // Container for smaller lens.png
        var imgContainer = $(document.createElement('div'));
        imgContainer.attr('id', 'imgContainer');
        imgContainer.css({
            'position': 'absolute', 'display': 'inline-block', 'height': '50%'
        });
        zoomSliderContainter.append(imgContainer);

        // lens smaller
        var lensSmaller = $(document.createElement('img'));
        lensSmaller.css({
            "margin-top": "8%",
            'margin-left': '0%',
            'height': '85%',
            'width': 'auto',
            "position": "relative",
            'display': 'inline-block'
        });
        lensSmaller.attr('src', 'images/icons/Lens.svg');
        lensSmaller.attr('id', 'lensSmall');
        lensSmaller.click(function () {
            var pos = zoomfader.position().left - 0.1 * (zoomslider.width());
            if (pos >= 0) {
                zoomfader.css('left', pos + "px");
            } else {
                zoomfader.css('left', "0px");
            }
            var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
            zoom(percent);
        });
        imgContainer.append(lensSmaller);

        // Container and background for zoom bar
        var zoomslider = $(document.createElement('div'));
        zoomslider.attr('id', 'zoomslider');
        zoomslider.css({
            'position': 'absolute', 'display': 'inline-block', 'width': '68%', 'height': '35%', 'margin-top': '2%', 'margin-left': '10%',
            'background-color': 'rgb(136, 134, 134)', "border-radius": "25px"
        });
        zoomslider.mousedown(function (evt) {
            if (evt.which != 1)
                return;
            zoomfader.css('left',
                Math.constrain(evt.pageX - zoomslider.offset().left - zoomfader.width() / 2, 0, zoomslider.width() - zoomfader.width()));
            var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
            zoom(percent);
            //timeline.onUpdate();
            zoomfader.trigger(evt);
        });
        zoomSliderContainter.append(zoomslider);

        // zoomFader
        var zoomfader = $(document.createElement('div'));
        zoomfader.attr('id', 'zoomPoint');
        var currScale = timeManager.getDuration().scale;
        // Hardcoded the zoomPoint left
        var minScale = 1581 / timeManager.getDuration().end;
        var zoomFaderLeftInit = (currScale - minScale) / (LADS.TourAuthoring.Constants.maxZoom - minScale) * 100;
        zoomfader.css({
            'background-color': 'white', 'height': '110%', 'width': '10%',
            'position': 'absolute', 'top': '-10%', 'left': zoomFaderLeftInit + '%',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%"
        });
        zoomslider.append(zoomfader);
        zoomfader.mousedown(function (evt) {
            evt.stopPropagation();
        });
        zoomfader.draggable({
            axis: 'x', containment: 'parent',
            drag: function () {
                var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
                zoom(percent);
                timeline.cancelAccel();
            }
        });
        $('#timeRuler').livequery(function () {
            var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
            zoom(percent);
            $('#timeRuler').expire();
        });

        var zoomfaderUpdate = function (ev) {
            zoomfader.css('left', ((zoomfader.offsetParent().width() - zoomfader.width()) * ev.percent) + 'px');
        };

        var oldpercent = 0;
        var oldPos = 0.0;
        var newPos = 0.0;

        // dan zhang - revamped zoom to lock when playhead is onscreen and zoom more intelligently while playhead is offscreen
        // handles zoom
        function zoom(percent) {
            var trackBody = timeline.getTrackBody(),
                timeRuler = timeline.getTimeRuler(),
                dur = timeManager.getDuration(),
                oldScale = dur.scale,
                totalTime = dur.end,
                minScale = trackBody.width() / totalTime,
                newScale = minScale + percent * (LADS.TourAuthoring.Constants.maxZoom - minScale);

            newScale = Math.min(Math.max(newScale, minScale), LADS.TourAuthoring.Constants.maxZoom);
            lastScale = oldScale;

            // zoom is getting called on onSizing now to appropriately adjust to timeline
            // length changes.  Zoom also causes onSizing events to fire when it adjusts
            // the scale, so if the scale doesn't change don't call setScale.   
            if (newScale === oldScale) {
                return;
            }

            // data for zooming
            var viewWidth = trackBody.width();
            var midpoint = viewWidth * 0.5;
            var anchorPoint = viewWidth * 0.45; // see below for explanation
            var oldTrackLength = timeManager.timeToPx(totalTime);
            var newTrackLength = newScale * dur.end; // (px per second) x (total seconds)
            var oldPlayheadPosition = timeManager.timeToPx(timeManager.getCurrentTime());
            var oldWindowPosition = trackBody.scrollLeft();
            var newWindowPosition; //for use later
            // if playhead is onscreen, zooming in and out fixes left viewer boundary at the 
            // same pixel distance to the playhead.
            if (oldPlayheadPosition >= oldWindowPosition && oldPlayheadPosition <= oldWindowPosition + viewWidth) {

                // hack is necessary for the moment because setScale causes the scroll to 
                // crash into the right edge while zooming out by a large magnification 
                // factor. SetScale will need to be restructured or assimilated into zoom 
                // to accomodate an implementation which avoids collisions intelligently.
                if (newScale < oldScale) {
                    //timeRuler.scrollLeft(0);
                    trackBody.scrollLeft(0);
                }

                // checking zoom boundaries and applying scale to timeManager
                if (newScale >= minScale) { // min zoom
                    if (newTrackLength >= trackBody.width()) {
                        timeManager.setScale(newScale);
                    }
                } else if (newScale <= LADS.TourAuthoring.Constants.maxZoom) { // max zoom
                    timeManager.setScale(newScale);
                }
                // end checking zoom boundaries

                // begin zoom functionality
                var leftViewerBoundaryOffset = oldPlayheadPosition - oldWindowPosition;
                var newPlayheadPosition = timeManager.getCurrentPx();
                var windowPosition = newPlayheadPosition - leftViewerBoundaryOffset;
                trackBody.scrollLeft(windowPosition);
                //timeRuler.scrollLeft(windowPosition);

            } else { // if playhead not onscreen, zoom in and zoom out have different anchor points

                // zooming out anchors to center
                if (newScale < oldScale) {
                    // hack is necessary for the moment because setScale causes the scroll to 
                    // crash into the right edge while zooming out by a large magnification 
                    // factor. SetScale will need to be restructured or assimilated into zoom 
                    // to accomodate an implementation which avoids collisions intelligently.
                    //timeRuler.scrollLeft(0);
                    trackBody.scrollLeft(0);

                    // checking zoom boundaries and applying scale to timeManager
                    if (newScale >= minScale) { // min zoom
                        if (newTrackLength >= trackBody.width()) {
                            timeManager.setScale(newScale);
                        }
                    } else if (newScale <= LADS.TourAuthoring.Constants.maxZoom) { // max zoom
                        timeManager.setScale(newScale);
                    }
                    // end scale check

                    // begin zoom functionality
                    // find viewer center's relative position to the entire track length
                    var relativeCenterPosition = (oldWindowPosition + midpoint) / oldTrackLength;

                    // calculate viewer center's new absolute position for new track length
                    var newAbsoluteCenterPosition = relativeCenterPosition * newTrackLength;

                    // determine window position by subtracting midpoint pixel distance
                    newWindowPosition = newAbsoluteCenterPosition - midpoint;

                    // determine practical view window position based on theoretical position and boundaries
                    if (newWindowPosition + viewWidth > newTrackLength) {
                        // at hard right boundary (track end), expand left side
                        //timeRuler.scrollLeft(newTrackLength - viewWidth);
                        trackBody.scrollLeft(newTrackLength - viewWidth);
                    } else if (newWindowPosition < 0) {
                        // at hard left boundary (track start), expand right side
                        //timeRuler.scrollLeft(0);
                        trackBody.scrollLeft(0);
                    } else {
                        // somewhere in between, expand from center as calculated
                        //timeRuler.scrollLeft(newWindowPosition);
                        trackBody.scrollLeft(newWindowPosition);
                    }
                }

                    // zooming in anchors 45% left because we read left-to-right; this makes zoom more intuitive as while you are traversing the timeline you are more likely to be reading from the left side.
                    // eventual TODO: if display or keyframe is selected, anchor (or soft-anchor?) to display or keyframe since keyframe/display selection (keyframes in particular) does not guarantee playhead is onscreen
                else {
                    // checking zoom boundaries and applying scale to timeManager
                    if (newScale >= minScale) { // min zoom
                        if (newTrackLength >= trackBody.width()) {
                            timeManager.setScale(newScale);
                        }
                    } else if (newScale <= LADS.TourAuthoring.Constants.maxZoom) { // max zoom
                        timeManager.setScale(newScale);
                    }
                    // end scale check

                    // begin zoom functionality
                    // find anchor's relative position to the entire track length
                    var relativeAnchorPosition = (oldWindowPosition + anchorPoint) / oldTrackLength;

                    // calculate anchor's new absolute position for new track length
                    var newAbsoluteAnchorPosition = relativeAnchorPosition * newTrackLength;

                    // determine window position by subtracting anchor pixel distance
                    newWindowPosition = newAbsoluteAnchorPosition - midpoint;

                    // and then position window based on theoretical position and boundaries
                    if (newWindowPosition + viewWidth > newTrackLength) {
                        // at hard right boundary (track end), expand left side
                        //timeRuler.scrollLeft(newTrackLength - viewWidth);
                        trackBody.scrollLeft(newTrackLength - viewWidth);
                    } else if (newWindowPosition < 0) {
                        // at hard left boundary (track start), expand right side
                        //timeRuler.scrollLeft(0);
                        trackBody.scrollLeft(0);
                    } else {
                        // somewhere in between, expand from center as calculated
                        //timeRuler.scrollLeft(newWindowPosition);
                        trackBody.scrollLeft(newWindowPosition);
                    }
                }
            }
            oldpercent = percent;
        }

        // Container for bigger lens.png
        var imgContainer2 = $(document.createElement('div'));
        imgContainer2.attr('id', 'imgContainer');
        imgContainer2.css({
            'position': 'absolute', 'display': 'inline-block', 'height': '40%', 'margin-left': '80%'
        });
        zoomSliderContainter.append(imgContainer2);

        // lens bigger
        var lensBigger = $(document.createElement('img')); //larger lens icon, shown on the right
        lensBigger.height = 1;
        lensBigger.width = 1;
        lensBigger.css({
            "margin-top": "-7%",
            'height': '170%',
            'width': 'auto',
            "position": "relative",
            'display': 'inline-block'
        });
        lensBigger.attr('src', 'images/icons/Lens.svg');
        lensBigger.attr('id', 'lensBig');
        lensBigger.click(function () {
            var pos = zoomfader.position().left + 0.1 * (zoomslider.width());
            if (pos <= (zoomfader.offsetParent().width() - zoomfader.width())) {
                zoomfader.css('left', pos + "px");
            } else {
                zoomfader.css('left', (zoomfader.offsetParent().width() - zoomfader.width()) + "px");
            }
            var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
            zoom(percent);
        });
        imgContainer2.append(lensBigger);

        //container for volume
        var volumeSliderContainer = $(document.createElement('div'));
        volumeSliderContainer.css({
            'position': 'relative',
            'display': 'inline-block',
            'width': '5%', 'height': '60%',
            'vertical-align': 'middle',
            'margin-top': '-1%',
            'margin-right': '2%'
        });
        bottombar.append(volumeSliderContainer);

        //// Container for the mute image
        //var muteContainer = $(document.createElement('div'));
        //muteContainer.css({
        //    'position': 'absolute', 'display': 'inline-block', 'height': '50%'
        //});
        //volumeSliderContainer.append(muteContainer);

        //// mute volume
        //var muteVolumeImage = $(document.createElement('img'));
        //muteVolumeImage.css({
        //    "margin-top": "1%",
        //    'margin-left': '0%',
        //    'height': '100%',
        //    'width': 'auto',
        //    "position": "relative",
        //    'display': 'inline-block'
        //});
        //muteVolumeImage.attr('src', 'images/icons/VolumeDown4.svg');
        //muteVolumeImage.attr('id', 'muteVolume');
        //muteVolumeImage.click(function () {
        //    var pos = volumefader.position().left - 0.1 * (volumeslider.width());
        //    if (pos >= 0) {
        //        volumefader.css('left', pos + "px");
        //    } else {
        //        volumefader.css('left', "0px");
        //    }
        //    var percent = Math.constrain(volumefader.position().left / (volumeslider.width() - volumefader.width()), 0, 1);
        //    viewer.volume(percent);
        //});
        //muteContainer.append(muteVolumeImage);

        //// Container and background for zoom bar
        //var volumeslider = $(document.createElement('div'));
        //volumeslider.css({
        //    'position': 'absolute', 'display': 'inline-block', 'width': '70%', 'height': '35%', 'margin-top': '2%', 'margin-left': '12%',
        //    'background-color': 'rgb(136, 134, 134)', "border-radius": "25px"
        //});
        //volumeSliderContainer.append(volumeslider);

        //// volumeFader
        //var volumefader = $(document.createElement('div'));
        //volumefader.css({
        //    'background-color': 'white', 'height': '113%', 'width': '13%',
        //    'position': 'absolute', 'top': '-11%', 'right': '0%',
        //    'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%"
        //});
        //volumefader.draggable({
        //    axis: 'x', containment: 'parent',
        //    drag: function () {
        //        var percent = Math.constrain(volumefader.position().left / (volumeslider.width()-volumefader.width()), 0, 1);
        //        viewer.volume(percent);
        //        console.log("volume: " + percent);
        //    }
        //});

        //volumeslider.mousedown(function (evt) {
        //    if (evt.which != 1)
        //        return;
        //    volumefader.css('left',
        //        Math.constrain(evt.pageX - volumeslider.offset().left - volumefader.width() / 2, 0, volumeslider.width() - volumefader.width()));
        //    var percent = Math.constrain(volumefader.position().left / (volumeslider.width() - volumefader.width()), 0, 1);
        //    viewer.volume(percent);
        //    volumefader.trigger(evt);
        //});

        //volumefader.mousedown(function (evt) {
        //    evt.stopPropagation();
        //});

        //volumeslider.append(volumefader);

        //// Container for volume up
        //var volumeContainer = $(document.createElement('div'));
        //volumeContainer.css({
        //    'position': 'absolute', 'display': 'inline-block', 'height': '50%', 'margin-left': '85%'
        //});
        //volumeSliderContainer.append(volumeContainer);

        //// volume up
        //var volumeUpImage = $(document.createElement('img'));
        //volumeUpImage.css({
        //    "margin-top": "1%",
        //    'margin-left': '2%',
        //    'height': '100%',
        //    'width': 'auto',
        //    "position": "relative",
        //    'display': 'inline-block'
        //});
        //volumeUpImage.attr('src', 'images/icons/VolumeUp.svg');
        //volumeUpImage.click(function () {
        //    var pos = volumefader.position().left + 0.1 * (volumeslider.width());
        //    if (pos <= (volumeslider.width() - volumefader.width())) {
        //        volumefader.css('left', pos + "px");
        //    } else {
        //        volumefader.css('left', (volumeslider.width() - volumefader.width()) + "px");
        //    }
        //    var percent = Math.constrain(volumefader.position().left / (volumeslider.width() - volumefader.width()), 0, 1);
        //    viewer.volume(percent);
        //});
        //volumeContainer.append(volumeUpImage);

        /**
         * HK25: Wrote this function for updating the slider box as it is moved.
         */
        function sliderBoxUpdate(ev) {
            var timeRuler = timeline.getTimeRuler();
            var trackBody = timeline.getTrackBody();
            ev = ev || timeManager.getDuration();
            var oldWidth = sliderBox.width();

            // Check if the function is getting called before the elements are added to the page
            if (timeRuler.position()) {
                var newWidth = trackBody.width() / timeManager.timeToPx(ev.end) * (slider.width());
                // subtract extra 4px to remove influence of border
                var newLeft = (trackBody.scrollLeft()) / timeManager.timeToPx(ev.end) * (slider.width()) - 2;

                if (newWidth && oldWidth !== Math.ceil(newWidth)) {
                    // If the sliderBox would go past the edge of the slider then adjust
                    // it so that it does not.  This requires moving the timeline to the correct
                    // position to match the sliderBox.
                    if (newWidth + newLeft > slider.position().left + slider.width()) {
                        if (newWidth > slider.width()) {
                            newWidth = slider.width();
                        }
                        newLeft = slider.position().left + slider.width() - newWidth;
                    }
                    sliderBox.css('width', newWidth + 'px');
                }
                sliderBox.css('left', newLeft + 'px');
            }
        }
        // Livequery plugin calls the specified function when the element is
        // actually added to the DOM.  This makes the slider box update for the
        // initial time properly.
        $('#editor').livequery(function () {
            sliderBoxUpdate(timeManager.getDuration());
            $('#editor').expire();
        });
        // Update the sliderBox when the timeManager changes size
        timeManager.onSizing(sliderBoxUpdate);
        timeline.registerUpdateSlider(sliderBoxUpdate);

        //undo/redo buttons

        // create div for undo and redo button
        var undoRedoButtonArea = $(document.createElement('div'));
        var undoRedoInkOnly = $(document.createElement('div'));
        that.undoRedoInkOnly = undoRedoInkOnly;

        undoRedoInkOnly.text("Affects Ink Only");
        undoRedoInkOnly.css({
            "color": "green",
            "margin-top": "-1%",
            "position": "relative",
            'display': 'none',
            'margin-left': '15%', 'font-weight': '600', 'font-size': LADS.Util.getFontSize(150)
        });

        undoRedoButtonArea.css({
            "margin-top": "-2%",
            "position": "relative",
            'z-index': 0,
            'height': '60%',
            'width': '15%',
            'vertical-align': 'middle',
            'display': 'inline-block'
        });
        undoRedoButtonArea.attr('id', 'undoRedoButtonArea');

        var undoRedoButtonCSS = { 'height': '70%', 'width': 'auto', 'margin-left': '15%', 'opacity': '0.4' };

        // undo and redo buttons
        var undoButton = $(document.createElement('img'));
        $(undoButton).addClass('undoButton');
        undoButton.attr('src', 'images/icons/Undo.svg');
        undoButton.css(undoRedoButtonCSS);
        undoButton.click(function () {
            undoManager.undo();
        });
        undoRedoButtonArea.append(undoButton);
        that.undoButton = undoButton;

        var redoButton = $(document.createElement('img'));
        $(redoButton).addClass('redoButton');
        redoButton.attr('src', 'images/icons/Redo.svg');
        redoButton.css(undoRedoButtonCSS);
        redoButton.click(function () {
            undoManager.redo();
        });
        undoRedoButtonArea.append(redoButton);
        that.redoButton = redoButton;
        undoRedoButtonArea.append(undoRedoInkOnly);
        bottombar.append(undoRedoButtonArea);

        function createPlayhead() {
            var playHeadDiv = $(document.createElement('div'));
            var playheadSVG = d3.select(playHeadDiv[0])
                                        .append("svg")
                                        .style('position', 'absolute')
                                        .style('left', '0px').style('top', '-110%')
                                        .attr("width", '0%')
                                        .attr("height", '100%'); // div to be transformed into an svg group

            playHeadGroup = playheadSVG.append("g");

            var playHeadTop = playHeadGroup.append("circle")
                                       .attr('cx', '0')
                                       .attr('cy', '80%')
                                       .attr('r', '40%')
                                       .attr('fill', 'black')
                                       .attr('stroke', 'black')
                                       .attr('stroke-width', '10%')
                                       .attr('fill-opacity', '0');

            var playHead = playHeadGroup.append("line")
                                             .attr('x1', '0')
                                             .attr('y1', '110%') // 11.4%
                                             .attr('x2', '0')
                                             .attr('y2', '210%')
                                             .attr('pointer-events', 'none')
                                             .attr('stroke', 'black')
                                             .attr('stroke-width', '10%');
            return playHeadDiv;
        }
    })();

    function addToDOM(container) {
        container.appendChild(bottombar[0]);
    }
    that.addToDOM = addToDOM;

    return that;
};