LADS.Util.makeNamespace('LADS.TourAuthoring.Timeline');

/**
 * Manages user editing of tracks
 * @param spec      timeManager, undoManager, viewer params
 */
LADS.TourAuthoring.Timeline = function (spec, my) {
    "use strict";

    // Divs that need to be held onto
    var that = {},
        tourExited = false,
        loaded = false, // boolean blocking timeline reloads until tour is fully initialized
        tracks = [],
        mainScrollHider,
        editor,
        trackTitleWrapper,
        timeRuler,
        timeline,
        trackBody,
        playhead, //div containing the playhead svg
        playheadtop, // div containing the playhead handle svg
        playheadSVG,
        playHeadGroup,
        playHeadTop,
        playHead,
        compCont,
        onUpdateNumCalls = 0,
        trackid = 0, // IDs for uniquely identifying tracks
        // docfrag
        docfrag,
        // Handles time stuff
        timeManager = spec.timeManager,
        root = spec.root,
        manipObjects = {},
        // undo
        undoManager = spec.undoManager,
        viewer = spec.viewer,
        verticalScroller,
        sliderPane,

        lastScale = timeManager.getDuration().scale,
        audioCheck = false,
        videoCheck = false,
        artworkCheck = false,
        imageCheck = false,
        inkCheck = false,
        isMenuOpen, editInkOn = false, modifyingInk = false,

        selectedTrack = {current: null}; // this is an object so contents can be manipulated by track objects
    that.isMenuOpen = false;
    var editInkOverlay = $(LADS.Util.UI.blockInteractionOverlay());//overlay for when 'edit ink' component option is selected while playhead is not over the art track
    editInkOverlay.addClass('editInkOverlay');
    var overlayLabel = $(document.createElement('div'));
    overlayLabel.text("Ink is being edited...");
    var deleteConfirmationOverlay = $(document.createElement('div'));
    that.editInkOn = false;
    that.clamped_displays = [];

    // Set timeline in viewer
    viewer.setTimeline(that);

    var sendScrollLeft = true;
    var sendScrollTop = true;

    var multiSelection = false;
    var multiSelectionArray = [];//Xiaoyi&Libby

    //!!!!!!
    var editorWidth = $(window).width() * 0.995;
    var editorHeight = $(window).height() * 0.4825;
    //var editorHeight = $(window).height();
    var trackTitleWidth = 0.127 * $(window).width();
    var trackAreaHeight = editorHeight - 5 - LADS.TourAuthoring.Constants.timeRulerSize;
    //var trackAreaHeight = editorHeight;

    // HTML
    (function _makeHTML() {
        // container div that hides vertical scrollbar of top-level container
        mainScrollHider = $(document.createElement('div'));
        mainScrollHider.attr('class', 'mainScrollHider');
        mainScrollHider.css({
            "background-color": "rgb(219,218,199)",
            'overflow': 'hidden',
            'height': editorHeight + 'px',
            'width': editorWidth + 'px',
            'margin-top': '3%',
            'position': 'relative',
        });

        // Top-level container, vertical scrolling
        editor = $(document.createElement('div'));
        editor.attr('id', 'editor');
        editor.css({
            'height': '100%',
            "width": '100%', 
            //'width': '100%',
            'overflow': 'hidden',
        });


        // veil for track title scrollbar
        var trackScrollVeil = $(document.createElement('div'));
        trackScrollVeil.attr('id', 'trackScrollVeil');
        trackScrollVeil.css({
            'width': trackTitleWidth + 20 + 'px',
            'height': trackAreaHeight + 'px',
            'margin-left': $(window).width() * 0.02 - 20 + 'px',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'float': 'left',
            'clear': 'left',
            'top': '0px',
            'position':'relative'
        });
        // div with track heads, no scrolling at all
        trackTitleWrapper = $(document.createElement('div'));
        trackTitleWrapper.attr('id', 'trackTitleWrapper');
        trackTitleWrapper.css({
            'width': trackTitleWidth + 20 + "px",
            'height': '100%',
            'margin-left': '1.5%',
            'position': 'relative',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'z-index': '102',
            'background-color': 'rgb(219, 218, 199)',
        });

        // Track body container, xy scrolling
        trackBody = $(document.createElement('div'));
        trackBody.attr('id', 'trackBody');
        trackBody.css({
            'height': trackAreaHeight + 'px',
            'margin-left': '15%',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'position': 'relative',
        });

        // Ruler for measuring time in the timeline
        // Placed at the top of the timeline
        timeRuler = $(document.createElement('div'));
        timeRuler.css({
            'position': 'relative',
            'height': (LADS.TourAuthoring.Constants.timeRulerSize + 17) + 'px', // changed 12 %
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
        });
        timeRuler.attr('id', 'timeRuler');

        // Track area div with time ruler and track body, horizontal scrolling
        timeline = $(document.createElement('div'));
        timeline.attr('id', 'timeline');
        timeline.css({
            'height': '200%',
            'width': '97%',
            'overflow': 'hidden',
            'position': 'relative',
        });

        // Cover block to hide playhead outside of display area
        var horizBlock = $(document.createElement('div'));
        horizBlock.attr('id', 'horizBlock');
        horizBlock.css({
            'height': LADS.TourAuthoring.Constants.timeRulerSize + 'px',
            'width': '15.5%',
            "background-color": "rgb(219,218,199)",
            'position': 'absolute',
            'z-index': '102',
        });

        var vertBlock = $(document.createElement('div'));
        vertBlock.attr('id', 'vertBlock');
        vertBlock.css({
            'height': '100%',
            'width': '1.5%',
            "background-color": "rgb(219,218,199)",
            'position': 'absolute',
            'z-index': '102',
        });

        // ruler scrollbar veil
        var rulerScrollVeil = $(document.createElement('div'));
        rulerScrollVeil.attr('id', 'rulerScrollVeil');
        rulerScrollVeil.css({
            'height': LADS.TourAuthoring.Constants.timeRulerSize + 'px',
            'width': '85%',
            'margin-left': '15.4%',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',

        });

        // time ruler wrapper
        var rulerWrapper = $(document.createElement('div'));
        rulerWrapper.attr('id', 'rulerWrapper');
        rulerWrapper.css({
            'width': '85%',
            'height': (LADS.TourAuthoring.Constants.timeRulerSize) + 'px',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'position': 'absolute',
            'z-index': '100',
            'box-shadow' : '-7px 5px 10px #888',
        });

        manipObjects.ruler = (LADS.Util.makeManipulatable({
            element: rulerWrapper[0],
            functions: {
                onManipulate: function (res) {
                    rulerWrapper.scrollLeft(rulerWrapper.scrollLeft() - res.translation.x);
                    manipObjects.track.cancelAccel();
                },
                onScroll: function (delta) {
                    var close = getCloseMenu();
                    if (close) {
                        close();
                    }

                    if (delta === 1.1) {
                        rulerWrapper.scrollLeft(rulerWrapper.scrollLeft() - 30);
                    } else {
                        rulerWrapper.scrollLeft(rulerWrapper.scrollLeft() + 30);
                    }

                    manipObjects.track.cancelAccel();
                },
                onTapped: function (evt) {
                    if (modifyingInk) {
                        return false;
                    }
                    timeManager.seek(timeManager.pxToTime(evt.position.x + trackBody.scrollLeft()));
                }
            },
            stdHammer: true
        }));

        var toMoveLR = 0;
        var throttleLR;
        var toMoveUD = 0;
        var throttleUD;
        manipObjects.track = (LADS.Util.makeManipulatable({
            element: trackBody[0],
            functions: {
                onManipulate: function (res) {
                    manipObjects.ruler.cancelAccel();
                    if (res.translation.x !== 0) {
                        trackBody.scrollLeft(trackBody.scrollLeft() - res.translation.x);
                    }
                    if (res.translation.y !== 0) {
                        if (calculateTotalTrackHeight() > trackBody.height()) {
                            var newY = trackBody.scrollTop() - res.translation.y;
                            trackBody.scrollTop(newY);
                            scrollWithBody(newY);
                        }
                    }
                }
            },
            stdHammer: true
        }));

        rulerWrapper.scroll(function (evt) {
            if (sendScrollLeft) {
                sendScrollLeft = false;
                trackBody.scrollLeft(rulerWrapper.scrollLeft());
            } else {
                sendScrollLeft = true;
            }
        });

        trackTitleWrapper.scroll(function (evt) {
            if (sendScrollTop) {
                sendScrollTop = false;
                trackBody.scrollTop(trackTitleWrapper.scrollTop());
                scrollWithBody(trackTitleWrapper.scrollTop());
            } else {
                sendScrollTop = true;
            }
        });

        trackBody.scroll(function (evt) {
            if (sendScrollLeft) {
                sendScrollLeft = false;
                rulerWrapper.scrollLeft(trackBody.scrollLeft());
            } else {
                sendScrollLeft = true;
            }

            // Would be nice to figure out a way to avoid calling this unnecessarily
            // (ie. when the slider is moved)
            if (updateSlider) updateSlider();
            
            _seekPlayhead();

            if (sendScrollTop) {
                sendScrollTop = false;
                if (calculateTotalTrackHeight() < trackBody.height()) {
                    return;
                }
                trackTitleWrapper.scrollTop(trackBody.scrollTop());
                updateVerticalScroller();
                scrollWithBody(trackTitleWrapper.scrollTop());
            } else {
                sendScrollTop = true;
            }
        });

        var updateSlider = null;
        function registerUpdateSlider(realUpdate) {
            updateSlider = realUpdate;
        }
        that.registerUpdateSlider = registerUpdateSlider;


        var _timeRulerSize = function (ev) {
            timeRuler.css('width', timeManager.timeToPx(ev.end) + 'px');
        };
        _timeRulerSize(timeManager.getDuration());
        timeManager.onSizing(_timeRulerSize);

        /*******************************Xiaoyi/Libby****************************************/
        var multiSelButtonPanel = $(document.createElement('div'));
        multiSelButtonPanel.addClass("multiSelButtonPanel");
        multiSelButtonPanel.css({
            'top': '12.5%',
            'left': '25%',
            'position': 'relative',
            "width": '60%',
            'height': '75%',
            'float': 'left',
            'z-index': '5',
        });

        var multiSelButton = $(document.createElement('button'));
        multiSelButton.attr('type', 'button');
        multiSelButton.attr('id', "multiSelButton");
        multiSelButton.text("Multi-Select");
        multiSelButton.attr('type', 'button');
        multiSelButton.css({
            "color": "black",
            "border-color": "black",
            "left": "5%",
            'top': '3%',
            "position": "absolute",
            "font-size": '120%',
            'float': 'left',
            'width': '100%'
        });
        
        $(multiSelButton).click(function () {
            if (getEditInkOn() === true) {
                //multiSelButton.css({
                //    'color': 'gray',
                //});
                return false;
            }
            if (multiSelection === true) {
                multiSelection = false;
                multiSelButton.css({
                    'color': 'black',
                    'background-color': 'transparent',
                    "border-color": "black"
                });
            }
            else {
                multiSelection = true;
                multiSelButton.css({
                    'color': 'white',
                    'background-color': 'darkgreen',
                    "border-color": "white",
                });
            }
        });

        editInkOverlay.css({

            top: LADS.Util.Constants.timeRulerSize,
            width: '100%',
            height: '100%',
            'margin-left': "2%",
            'position': 'absolute',
            'z-index': '10000',
            'background-color': 'rgba(0, 0, 0, 0.5)'
        });

        overlayLabel.css({
            'position': 'relative',
            'left': '33.5%',
            'top': '35%',
            'font-size': '22pt',
        });

        editInkOverlay.hide();

        // Container and background for Slider
        sliderPane = $(document.createElement('div'));
        sliderPane.attr('id', 'verticalSliderPane');
        sliderPane.css({
            'position': 'absolute',
            'left': '97.35%',
            'top': 54 + 'px',
            'display': 'inline-block',
            'width': '1%',
            'height': trackAreaHeight - 8 + 'px',
        });
        
        var sliderParts = createVerticalScroller(sliderPane);
        sliderPane.append(sliderParts[0]);
        sliderPane.append(sliderParts[1]);

        // appending elements to documentFragment, which is then appended in AddToDOM method
        docfrag = document.createDocumentFragment();

        docfrag.appendChild(mainScrollHider[0]);
            mainScrollHider.append(editor); // editor => horiz scrolling hider
                editor.append(timeline); // track body + ruler area => editor
                        multiSelButtonPanel.append(multiSelButton);
                        horizBlock.append(multiSelButtonPanel);
                    timeline.append(horizBlock);
                    timeline.append(vertBlock);
                    timeline.append(rulerScrollVeil);
                        rulerScrollVeil.append(rulerWrapper);
                            rulerWrapper.append(timeRuler);
                editor.append(sliderPane);
                editor.append(editInkOverlay);
                    editInkOverlay.append(overlayLabel);
                    timeline.append(trackScrollVeil);
                        trackScrollVeil.append(trackTitleWrapper); // track head panel => editor
                    timeline.append(trackBody);

               

        var constrainedHeight = editorHeight - 5;
        var constrainedWidth = editorWidth - 17;
        mainScrollHider.css({
            'height': constrainedHeight + "px",
            'width': constrainedWidth + "px",
        });
        multiSelButton.fitText(0.8);

        /***************************************************************************/
        ///////////
        // Playhead
        //Creating the svg version of the playhead. -David Correa
        playheadSVG = d3.select(timeline[0])
                                    .append("svg")
                                    .style('position', 'absolute')
                                    .style('left', '0px').style('top', '0px')
                                    .attr('id', 'playhead')
                                    .attr("width", '0%')
                                    .style("z-index","101")
                                    .attr("height", '100%'); // div to be transformed into an svg group
        var rawSvgElem = playheadSVG[0][0];

        playHeadGroup = playheadSVG.append("g").attr("transform", "translate(5,0)");
        var rawGElem = playHeadGroup[0][0];

        playHeadTop = playHeadGroup.append("circle")
                                   .attr('cx', '0')
                                   .attr('cy', '27px')
                                   .attr('r', '18px')
                                   .attr('fill', 'black')
                                   .attr('stroke', 'black')
                                   .attr('stroke-width', '7px')
                                   .attr('fill-opacity', '0');
        
        playHead = playHeadGroup.append("line")
                                         .attr('x1', '0')
                                         .attr('y1', '45px') // 11.4%
                                         .attr('x2', '0')
                                         .attr('y2', '100%')
                                        .attr('pointer-events', 'none')
                                         .attr('stroke', 'black')
                                         .attr('stroke-width', '1px');

        var $body = $('body');
        playHeadGroup.on('mousedown', function () {
            var start, startTime, time;

            start = d3.mouse($body[0])[0];
            startTime = timeManager.getCurrentPx();

            $body.on('mousemove.playhead', function (ev) {
                if (editInkOn === true) {      
                    return false;
                }
                time = startTime + (ev.pageX - start);
                // Don't let the playhead be moved out of bounds
                if (time > $('#timeRuler').width()) {
                    time = $('#timeRuler').width();
                } else if (time < 0) {
                    time = 0;
                } else {
                    // Only update start if the mouse isn't out of bounds so the mouse
                    // correctly synchronizes with the playhead.
                    start = ev.pageX;
                }
       
                timeManager.seek(timeManager.pxToTime(time));
                startTime = time;
            });
            $body.on('mouseup.playhead', function () {
                $body.off('mousemove.playhead');
                $body.off('mouseup.playhead');
            });
        });

        var _seekPlayhead = function () {
            var time = timeManager.getCurrentPx(); // fix editor.width() * 0.15 -- if we ever change the margin of trackBody, this will be really confusing!
            playHeadGroup.attr("transform", "translate(" + (time + editor.width() * 0.15 - trackBody.scrollLeft()) + ")");
        };

        timeManager.onSeek(_seekPlayhead);
        timeManager.onSizing(_seekPlayhead);
        timeManager.onPlay(_seekPlayhead);
    })();

    function showEditorOverlay() {
        $('#resizeButton').attr('src', 'images/icons/Ellipsis_gray.svg');
        setEditInkOn(true);
        $('#multiSelButton').css({
            'color': 'gray',
            'border-color': 'gray'
        });
           
        playHeadTop.attr('fill', 'gray');
        playHeadTop.attr('stroke', 'gray');

        
        var overlayLabelSpec = LADS.Util.constrainAndPosition(editInkOverlay.width(), editInkOverlay.height(),
            {
                center_h: true,
                center_v: true,
                width: 0.3,
                height: 0.2,
                max_width: 400,
                max_height: 100, 
            });

        var labelFontSize = LADS.Util.getMaxFontSizeEM("Ink is being edited...", 0, overlayLabelSpec.width - 10, overlayLabelSpec.height, 0.01);

        overlayLabel.css({
            top: overlayLabelSpec.y + 'px',
            left: overlayLabelSpec.x + 'px',
            width: overlayLabelSpec.width + 'px',
            height: overlayLabelSpec.height + 'px',
            'font-size': labelFontSize,
            'overflow': 'hidden',
        });
        
        editInkOverlay.show();
    }
    that.showEditorOverlay = showEditorOverlay;

    function hideEditorOverlay() {
        $('#resizeButton').attr('src', 'images/icons/Ellipsis_brown.svg');
        setEditInkOn(false);
        $('#multiSelButton').css({
            'color': 'black',
            'border-color':'black'
        });
        playHeadTop.attr('fill', 'black');
        playHeadTop.attr('stroke', 'black');
        editInkOverlay.hide();
    }
    that.hideEditorOverlay = hideEditorOverlay;

    // Creating a vertical scroll visualizer widget
    function createVerticalScroller(container) {
        var elements = [];
        var widget = $(document.createElement('div'));
        widget.css({
            'position': 'relative',
            'background-color': 'rgb(255,255,255)',
            'width': '70%',
            'left': '15%',
            'height': '100%',
            'overflow': 'hidden',
            'border': '1px solid gray',
        });

        verticalScroller = $(document.createElement('div'));
        verticalScroller.attr('id', 'verticalSlider');
        verticalScroller.css({
            'position': 'absolute',
            'height': '100px',
            'width': '100%',
            'border': '2px none black',
            'left': '-1px',
        });

        verticalScroller.draggable({
            axis: 'y',
            drag: function (evt, ui) {
                evt.stopPropagation();
                ui.position.top = Math.constrain(ui.position.top, 0, sliderPane.height() - verticalScroller.height() - 2);

                var newRelativeScroll = ui.position.top / (sliderPane.height() - verticalScroller.height() - 4);
                var newAbsoluteScroll = newRelativeScroll * (calculateTotalTrackHeight() - trackBody.height() + 8);                

                trackBody.scrollTop(newAbsoluteScroll);
                trackTitleWrapper.scrollTop(newAbsoluteScroll);
                cancelAccel();
            }
        });
        
        elements.push(widget);
        elements.push(verticalScroller);

        verticalScroller.mousedown(function (evt) {
            evt.stopPropagation();
        });

        //represents the green part of the timeline for artworks and the gray part for inks -- indicates the length
        var greenBoxInSlider = $(document.createElement('div'));
        greenBoxInSlider.css({
            'background-color': 'DarkGreen',
            'top': '0%',
            'left': '15%',
            'height': '100%',
            'position': 'absolute',
            'width': '70%',
            'border': '2px solid black',
        });
        verticalScroller.append(greenBoxInSlider);

        return elements;
    }

    // used by vertical position viz to update its location when scrolling occurs on other vertically-scrollable elements.
    function scrollWithBody(scrollPos) {
        var totalTrackHeight = calculateTotalTrackHeight();
        var newTop = scrollPos / totalTrackHeight * sliderPane.height();
        if (newTop < 0) {
            newTop = 0;
        } else if (newTop > sliderPane.height() - verticalScroller.height() - 2) {
            newTop = sliderPane.height() - verticalScroller.height() - 2;
        }
        verticalScroller.css({
            'top': newTop + 'px'
        });
    }

    function updateVerticalScroller() {
        var oldVertHeight = verticalScroller.height();
        var totalTrackHeight = calculateTotalTrackHeight();
        var newTop = trackBody.scrollTop() / totalTrackHeight * sliderPane.height() - 4;
        if (newTop < 0) {
            newTop = 0;
        }

        sliderPane.height(trackTitleWrapper.height() - 10);

        if (verticalScroller.scrollTop() === newTop) {
            return;
        }

        //sliderPane.height(trackTitleWrapper.height() - 10);

        if (totalTrackHeight === 0) { // edge case for no tracks onscreen
            sliderPane.height(trackBody.height() - 10);
            verticalScroller.css({
                'height': sliderPane.height() + 'px',
                'top': '0px',
            });
            enableDisableDrag();
            return;
        }

        if (oldVertHeight !== (trackTitleWrapper.height() - 4) * sliderPane.height() / totalTrackHeight) {
            if (totalTrackHeight < trackTitleWrapper.height()) {
                verticalScroller.css({
                    'height': '100%',
                });
            } else {
                verticalScroller.css({
                    'height': (trackTitleWrapper.height() - 4) * sliderPane.height() / totalTrackHeight + 'px',
                });
            }
            verticalScroller.css({
                'top': newTop + 'px',
            });
        }
    }
    that.updateVerticalScroller = updateVerticalScroller;

    function enableDisableDrag() {
        if (calculateTotalTrackHeight() < trackTitleWrapper.height() - 10) {
            verticalScroller.draggable("disable");
            verticalScroller.css({
                'height': '100%',
            });
        } else {
            verticalScroller.draggable("enable");
            verticalScroller.css({
                'height': (trackTitleWrapper.height() - 4) * sliderPane.height() / calculateTotalTrackHeight() + 'px',
            });
        }
    }
    that.enableDisableDrag = enableDisableDrag;

    function calculateTotalTrackHeight() {
        var i, total = 0;
        for (i = 0; i < tracks.length; i++) {
            var ct = tracks[i];
            if (ct.getMinimizedState()) {
                total = total + LADS.TourAuthoring.Constants.minimizedTrackHeight;
            } else {
                total = total + LADS.TourAuthoring.Constants.trackHeight;
            }
        }
        return total + tracks.length * 2; // 2px border per track
    }

    // Updates notches on time ruler when time duration changes (event handler)
    var queue = LADS.Util.createQueue(),
        newLabels = $();
    function _updateTimeMarkers(ev) {
        var i,
            finalTime,
            scale = ev.scale,
            seconds = scale,
            divChilds = timeRuler.children('div'),
            start = Date.now();

        queue.clear();
        newLabels = document.createDocumentFragment();
        divChilds.text('');

        sendScrollLeft = true;
        trackBody.scrollLeft(trackBody.scrollLeft());

        // what are these doing? seems like the second while will push seconds*scale back below 80. What are 80 and 100 here?
        while (seconds * scale < 80) {
            seconds = seconds * 2;
        }

        while (seconds * scale > 100) {
            seconds = seconds / 2;
        }

        seconds = Math.ceil(seconds);
        
        var left = timeManager.pxToTime(trackBody.scrollLeft()),
            leftmod = left - (left % seconds),
            right = left + timeManager.pxToTime(trackBody.width());

        // init w/ markers currently on screen
        //queue.add(function () {
        var j, initLoad = document.createDocumentFragment();
        divChilds.remove();
        for (j = leftmod; j <= right; j += seconds) {
            initLoad.appendChild(createTimeLabel(j)[0]);
        }
        timeRuler.append(initLoad);
        //});

        var perQueueOp = 20,
            opLim = perQueueOp * seconds;

        function newLabelHelper(i) {
            queue.add(function () {
                var j;
                for (j = i; j <= i + opLim; j = j + seconds) {
                    newLabels.appendChild(createTimeLabel(j)[0]);
                }
                //if (i + seconds < ev.end) {
                //    newLabels.push(createTimeLabel(i + seconds));
                //}
            });
        }
        for (i = ev.start; i <= ev.end; i = Math.min(i + opLim, ev.end)) {
            newLabelHelper(i);
            if (i === ev.end) break;
        }

        // clear and replace once finished
        queue.add(function () {
            var i;
            divChilds.remove();
            timeRuler.append(newLabels);
            console.log('time ruler update elapsed: ' + (Date.now() - start));
        });

        // creates a time label and appends it to the time ruler
        // returns time label
        function createTimeLabel(i) {
            var time = Math.min(i, ev.end),
                timeString = timeManager.formatTime(i),
                fontsize = LADS.Util.getFontSize(140),
                markLoc = timeManager.timeToPx(i),
                timeLabel = $(document.createElement('div'))
                            .addClass('time-label')
                            .text(timeString)
                            .css({
                                'border-width': '0px 0px 0px 1px',
                                'border-color': 'black',
                                'border-style': 'solid',
                                'position': 'absolute',
                                'left': markLoc + 'px',
                                'padding-left': '5px',
                                'font-size': fontsize,
                                //'font-weight': '200',
                                'color': 'black',
                                'height': '100%',
                            });
            return timeLabel;
        }
    }
    _updateTimeMarkers(timeManager.getDuration()); // Initialization
    timeManager.onSizing(function (ev) {
        timeRuler.children('div').text('');
        setTimeout(function () {
            _updateTimeMarkers(ev);
        }, 2);
    });

    // PUBLIC FUNCTIONS

    // Add Timeline HTML

    function getEditInkOn() {
        return editInkOn;
    }
    that.getEditInkOn = getEditInkOn;
    
    function setEditInkOn(status) {
        editInkOn = status;
    }
    that.setEditInkOn = setEditInkOn;

    function addToDOM (container) {
        container.appendChild(docfrag);
    }
    that.addToDOM = addToDOM;

    that.selectedTrack = selectedTrack;

    function setCompControl(comp) {
        compCont = comp;
    }
    that.setCompControl = setCompControl;

    function showEditDraw(track,datastring) {
        compCont.showEditDraw(track, datastring);
        modifyingInk = true;
    }
    that.showEditDraw = showEditDraw;

    function showEditText(track,datastring, dims) {
        compCont.showEditText(track, datastring, dims);
        modifyingInk = true;
    }
    that.showEditText = showEditText;

    function showEditTransparency(track, datastring,trans_type) {
        compCont.showEditTransparency(track, datastring, trans_type);
        modifyingInk = true;
    }
    that.showEditTransparency = showEditTransparency;

    function setModifyingInk(state) {
        modifyingInk = state;
    }
    that.setModifyingInk = setModifyingInk;

    function removeInkSession() {
        compCont.removeInkCanv();
        compCont.hideInkControls();
    }
    that.removeInkSession = removeInkSession;

    /**Xiaoyi Libby
    *get the limiting distance for multi select
    *@return bound: the array of the smallest distances
    **/
    function getMSBounds(currentDisplay) {
        var bounds = [];
        bounds[0] = Number.MAX_VALUE;
        bounds[1] = Number.MAX_VALUE;
        bounds[2] = Number.MAX_VALUE;
        bounds[3] = Number.MAX_VALUE;
        //hacky way to solve mutli selection not working when dragging a display with 0 fadeout.
        var hasZeroFadeout = false;
        if (currentDisplay) { 
            if (currentDisplay.getFadeOut() === 0){
                hasZeroFadeout = true;
            }
        }
        //loop through the four bounds for each selected display and find the smallest distance (in seconds) that 
        //the displays as a whole will be bounded by
        for (var i = 0; i < multiSelectionArray.length; i++) {
            var currBounds = multiSelectionArray[i].getTrack().boundHelper(multiSelectionArray[i],hasZeroFadeout);
            //get the bounds for the each selected display
            if (currBounds[0] < bounds[0]) {
                bounds[0] = currBounds[0];
            }
            if (currBounds[1] < bounds[1]) {
                bounds[1] = currBounds[1];
            }
            if (currBounds[2] < bounds[2]) {
                bounds[2] = currBounds[2];
            }
            if (currBounds[3] < bounds[3]) {
                bounds[3] = currBounds[3];
            }
        }
        return bounds;
    }
    that.getMSBounds = getMSBounds;

    /**Xiaoyi & Libby
    *turn of the button for multi select 
    */
    function turnOffMS() {
        multiSelection = false;
        $('#multiSelButton').css({
            'color': 'black',
            'background-color': 'transparent',
            "border-color": "black"
        });
    }
    that.turnOffMS = turnOffMS;


    var data = [],
        olddata=[];//data stores the current positions for undo, and olddata stores previous positions for redo


    /**Xiaoyi & Libby
    *update the olddata for each selected displays when the mouse goes up
    *this is used in undo/redo to store the previous positions of all of the selected displays
    */
    function updateOldData() {
        olddata = new Array(getMultiSelectionArray().length);
        var selectDisplays = getMultiSelectionArray();
        var boundArray = getMSBounds(),
            leftDist = boundArray[0],
            rightDist = boundArray[1];
        for (var i = 0; i < selectDisplays.length; i++) {
            olddata[i] = new Array(3);
            var leftbound = selectDisplays[i].getStart() - leftDist;
            var rightbound = selectDisplays[i].getEnd() + rightDist;
            olddata[i][0] = selectDisplays[i].getStart();
            olddata[i][1] = selectDisplays[i].getMainStart();
            olddata[i][2] = selectDisplays[i].getOutStart();
            olddata[i][3] = leftbound;
            olddata[i][4] = rightbound;
        }
    }
    that.updateOldData = updateOldData;
    function newDataArray() {
        data = [];
    }
    that.newDataArray = newDataArray;
    function getOldData() {
        return olddata;
    }
    that.getOldData = getOldData;

    /**Xiaoyi & Libby
    *move the selected displays when user drags one of them
    *@param: res: mouse input
    *@param: currentDisplay: the one user is dragging. 
    */
    function moveSelect(res, currentDisplay) {
        //turn off multi-select once any kind of edit is made to the selection
        turnOffMS();
        //move all selected tracks
        var boundArray = getMSBounds(currentDisplay),
            leftDist = boundArray[0],
            rightDist = boundArray[1],
            fadeInRightDist = boundArray[2],
            fadeOutLeftDist = boundArray[3],
            loc = currentDisplay.getLoc(),
            selectDisplays = getMultiSelectionArray(),
            currentDisplayleft = currentDisplay.getStart() - leftDist,
            currentDisplayright = currentDisplay.getEnd() + rightDist,
            translation = currentDisplay.getTranslation(res, currentDisplayleft, currentDisplayright, fadeInRightDist, fadeOutLeftDist),//get the distance the display has been dragged
            leftbound,
            rightbound,
            fadeinrightbound,
            fadeoutleftbound;
        var offset = currentDisplay.getOffset();//distance from the main to fadein that user clicks on
        if (data[0] === null) {//update the data for undo at the moment mouse is down, no need to update if user keeps the mouse down and drag multi times.
            data = new Array(getMultiSelectionArray().length);
            for (var i = 0; i < selectDisplays.length; i++) {
                leftbound = selectDisplays[i].getStart() - leftDist;
                rightbound = selectDisplays[i].getEnd() + rightDist;
                fadeinrightbound = selectDisplays[i].getStart() + fadeInRightDist;
                fadeoutleftbound = selectDisplays[i].getEnd() - fadeOutLeftDist;
                if (data[i] === null) {
                    data[i] = new Array(10);
                    data[i][0] = selectDisplays[i].getStart();
                    data[i][1] = selectDisplays[i].getMainStart();
                    data[i][2] = selectDisplays[i].getOutStart();
                    data[i][3] = leftbound;
                    data[i][4] = rightbound;
                    data[i][5] = translation;
                    data[i][6] = loc;
                    data[i][7] = offset;
                    data[i][8] = fadeinrightbound;
                    data[i][9] = fadeoutleftbound;
                }        
            }
        }

        currentDisplay.msMove(selectDisplays, translation);//move all selectedDisplays
    }
    that.moveSelect = moveSelect;


    function getDisplayData() {
        return data;
    }
    that.getDisplayData = getDisplayData;

    
    /**Xiaoyi & Libby
    *deselect all displays when the user clicks white space in track or right clicks on the menu
    */
    function allDeselected() {
        turnOffMS();//turn off the button
        var selectedarray = getMultiSelectionArray();
        var selectednumber = getMultiSelectionArray().length;
        if (selectedarray.length > 0) {
            for (var i = 0; i < selectednumber; i++) {
                selectedarray[0].getTrack().setDisplayDeselected(selectedarray[0], false);
            }
        }
        olddata = [];
        data = [];
        multiSelectionArray = [];
    }
    that.allDeselected = allDeselected;

    /////////
    // TRACKS

    /**
     * Public API for adding tracks (called from ComponentControls)
     * @param media     URL of added resource (for audio, video, artwork)
     * @param track     Associated track (for ink)
     */

    //Xiaoyi Libby
    function getMultiSelection() {
        return multiSelection;
    }
    that.getMultiSelection = getMultiSelection;

    function getMultiSelectionArray() {
        return multiSelectionArray;
    }
    that.getMultiSelectionArray = getMultiSelectionArray;

    function getTrackslength() {
        return tracks.length;
    }
    that.getTrackslength = getTrackslength;

    function getTracks() {
        return tracks;
    }
    that.getTracks = getTracks;
    
    function getTimelineArea() {
        return trackBody[0];
    }
    that.getTimelineArea = getTimelineArea;

    function getTimeRuler() {
        return timeRuler;
    }
    that.getTimeRuler = getTimeRuler;

    function getisMenuOpen() {
        return isMenuOpen;
    }
    that.getisMenuOpen = getisMenuOpen;

    function setisMenuOpen(menustate) {
        isMenuOpen = menustate;
    }
    that.setisMenuOpen = setisMenuOpen;

    var closeMenuHolder;
    function setCloseMenu(closeFunction) {
        closeMenuHolder = closeFunction;
    }
    that.setCloseMenu = setCloseMenu;
    function getCloseMenu() {
        return closeMenuHolder;
    }
    that.getCloseMenu = getCloseMenu;

    var closeableFunction;
    function setCloseableFunction(func) {
        closeableFunction = func;
    }
    that.setCloseableFunction = setCloseableFunction;

    function getCloseableFunction(state) {
        if (closeableFunction) { setTimeout(closeableFunction(state), 0); }
    }
    that.getCloseableFunction = getCloseableFunction;

    /**
     * Utility to get track object from title
     * Used to load ink
     */
    function findTrackByTitle(title) {
        var i;
        for (i = 0; i < tracks.length; i++) {
            if (tracks[i].getTitle() === title) {
                return tracks[i];
            }
        }
        return null;
    }

    /**
    * searches through all displays and compares end times of each
    * @returns allDisplaysEnd, the highest end time of all displays
    */
    function getLastDisplayTime() {
        var i, j, displays, allDisplaysEnd = 0, currDisplayEnd;
        for (i = 0; i < tracks.length; i++) {
            displays = tracks[i].getDisplays();
            for (j = 0; j < displays.length; j++) {
                currDisplayEnd = displays[j].getFadeOut() + displays[j].getOutStart();
                if (currDisplayEnd > allDisplaysEnd){
                    allDisplaysEnd = currDisplayEnd;
                }
            }
        }
        return allDisplaysEnd;
    }
    that.getLastDisplayTime = getLastDisplayTime;

    /**
     * Searches list of tracks for track w/ duplicate name
     * If duplicate exists, changes name to prevent duplication
     * @param title     the new title
     * @param id        id of the track whose title is being changed
     */
    function fixTrackTitle(title, id) {
        var i, currTitle, result,j,ct,
            titleExp, //= new RegExp(title + '(?:-([0-9]+))?'),
            extraNums = [],
            finalNum = -1;
        id = id || -1;        
        var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
        var rs = "";
        for (i = 0; i < title.length; i++) {//removes any irregular characters from title
            rs = rs + title.substr(i, 1).replace(pattern, '');
        }
        titleExp = new RegExp(rs + '(?:-([0-9]+))?'); //checks if there are any numbers added onto the title we have
        
        for (i = 0; i < tracks.length; i++) {//for each track
            currTitle = tracks[i].getTitle();            
            ct = "";
            for (j = 0; j < currTitle.length; j++) {//remove special characters
                ct = ct + currTitle.substr(j, 1).replace(pattern, '');
            }
            result = titleExp.exec(ct);//check if any numbers added to original

            if (result && result[0] === ct && id !== tracks[i].getID()) {
                // match
                // if there is a trailing number
                if (result[1]) {
                    extraNums.push(parseInt(result[1], 10));
                }
                // if there is no trailing number, pretend substr is -1
                else {
                    extraNums.push(-1);
                }
            }
        }
        if (extraNums.length > 0) {
            extraNums.sort(function(a,b){return a-b;});
            for (i = 0; i < extraNums.length; i++) {
                if (extraNums[i] + 1 !== i) {
                    finalNum = i-1;
                    break;
                }
                finalNum++;
            }
            if (finalNum !== -1) {
                return title + '-' + finalNum;
            } else { // track w/ no appended number does not already exist
                return title;
            }
        } else {
            return title;
        }
    }
    that.fixTrackTitle = fixTrackTitle;

    function addAudioTrack(media, name, pos, mediaLength) {
        // Add some stuff to spec
        pos = pos || (selectedTrack.current ? selectedTrack.current.getPos() + 0 : 0);
        var spec = {
            media: media,
            mediaLength: mediaLength,
            root: root,
            id: pos,
            title: fixTrackTitle(name),
            timeManager: timeManager,
            undoManager: undoManager,
            update: onUpdate,
            timeline: that,
            trackarray: tracks,
            selectedTrack: selectedTrack
        },
        // Create the track, wrap command
        newTrack = LADS.TourAuthoring.AudioTrack(spec),
        command = LADS.TourAuthoring.Command({
            execute: function () {
                _addTrack(newTrack, pos);
            },
            unexecute: function () {
                _removeTrack(newTrack, pos);
            }
        });

        command.execute();
        //if (audioCheck === true) {
        //    undoManager.logCommand(command);
        //}
        //else {
        //    audioCheck = true;
        //}
        undoManager.logCommand(command);
        return newTrack;
    }
    that.addAudioTrack = addAudioTrack;

    function addVideoTrack (media, name, pos, mediaLength) {
        // Add some stuff to spec
        pos = pos || (selectedTrack.current ? selectedTrack.current.getPos() + 0 : 0);
        var spec = {
            media: media,
            mediaLength: mediaLength,
            root: root,
            id: pos,
            title: fixTrackTitle(name),
            timeManager: timeManager,
            undoManager: undoManager,
            update: onUpdate,
            timeline: that,
            trackarray: tracks,
            selectedTrack: selectedTrack
        },
        // Create the track, wrap command
        newTrack = LADS.TourAuthoring.VideoTrack(spec),
        command = LADS.TourAuthoring.Command({
            execute: function () { _addTrack(newTrack, pos); },
            unexecute: function () { _removeTrack(newTrack, pos); }
        });
        command.execute();
        undoManager.logCommand(command);

        return newTrack;
    }
    that.addVideoTrack = addVideoTrack;

    function addArtworkTrack (media, name, guid, pos) {
        // Add some stuff to spec
        pos = pos || (selectedTrack.current ? selectedTrack.current.getPos() + 0 : 0);
        var spec = {
            media: media,
            root: root,
            id: pos,
            guid: guid,
            title: fixTrackTitle(name),
            timeManager: timeManager,
            undoManager: undoManager,
            update: onUpdate,
            timeline: that,
            trackarray: tracks,
            selectedTrack: selectedTrack
        },
        // Create the track, wrap command
        newTrack = LADS.TourAuthoring.ArtworkTrack(spec),
        command = LADS.TourAuthoring.Command({
            execute: function () { _addTrack(newTrack, pos); },
            unexecute: function () { _removeTrack(newTrack, pos); }
        });

        command.execute();
        undoManager.logCommand(command);
        return newTrack; // Return statement for testing purposes only!!! comment out in final build
    }
    that.addArtworkTrack = addArtworkTrack;

    function addImageTrack(media, name, pos) {
        // Add some stuff to spec
        pos = pos || (selectedTrack.current ? selectedTrack.current.getPos() + 0 : 0);
        var spec = {
            media: media,
            root: root,
            id: pos,
            title: fixTrackTitle(name),
            timeManager: timeManager,
            undoManager: undoManager,
            update: onUpdate,
            timeline: that,
            trackarray: tracks,
            selectedTrack: selectedTrack
        },
        // Create the track, wrap command
        newTrack = LADS.TourAuthoring.ImageTrack(spec),
        command = LADS.TourAuthoring.Command({
            execute: function () { _addTrack(newTrack, pos); },
            unexecute: function () { _removeTrack(newTrack, pos); }
        });

        command.execute();
        undoManager.logCommand(command);
        return newTrack; // Return statement for testing purposes only!!! comment out in final build
    }
    that.addImageTrack = addImageTrack;

    // Additional param in spec: associated-track (either pass by id or direct reference?)
    function addInkTrack (track, name, inkType, inkSpec, pos) {
        pos = pos || (selectedTrack.current ? selectedTrack.current.getPos() + 0 : 0);
        var spec = {
            media: inkType,
            root: root,
            inkSpec: inkSpec,
            id: pos,
            title: fixTrackTitle(name),
            timeManager: timeManager,
            undoManager: undoManager,
            update: onUpdate,
            timeline: that,
            trackarray: tracks,
            selectedTrack: selectedTrack
        },
        // Create the track, wrap command
        newTrack = LADS.TourAuthoring.InkTrack(spec),
        command = LADS.TourAuthoring.Command({
            execute: function () { _addTrack(newTrack, pos); },
            unexecute: function () { _removeTrack(newTrack, pos); }
        });
        command.execute();
        undoManager.logCommand(command);
        //if( 
        return newTrack;
    }
    that.addInkTrack = addInkTrack;

    var trackNum = 0;

    /* Fixed by reinitializing the menu whenever it is swapped -Jake
    */

    function _addTrack(track, pos) {
        var i;
        track.addTitleToDOM(trackTitleWrapper);
        track.addEditorToDOM(trackBody);
        track.detach();
        track.reloadTrack();
        trackNum += 1;
    }

    function _removeTrack(track) {
        var i;
        track.updatePos(tracks.indexOf(track));
        if (track.getType() === LADS.TourAuthoring.TrackType.ink && track.getInkEnabled()) {
            track.getInkLink().removeAttachedInkTrack(track);
        }
        track.detach();
        tracks.map(function (track, i) {
            track.updatePos(i);
        });
        onUpdate();
    }
    that.removeTrack = _removeTrack;


    //allows track to prepend itself to DOM.
    function prependAddToDom(track, trackTitle) {
        trackTitleWrapper.prepend(trackTitle);
        trackBody.prepend(track);
    }
    that.prependAddToDom = prependAddToDom;

    function getNumTracks() {
        return tracks.length;
    }
    that.getNumTracks = getNumTracks;

    /**
     * List of related artworks to be registered in database
     * @returns     GUIDs of all artworks loaded into tracks
     */
    function getRelatedArtworks() {
        var track, i, related = [];
        for (i = 0; i < tracks.length; i++) {
            track = tracks[i];
            if (track.getType() === LADS.TourAuthoring.TrackType.artwork) {
                related.push(track.getGUID());
            }
        }
        return related;
    }
    that.getRelatedArtworks = getRelatedArtworks;

    function getTrackBody() {
        return trackBody;
    }
    that.getTrackBody = getTrackBody;

    function getPlayhead() {
        return playheadSVG;
    }
    that.getPlayhead = getPlayhead;

    /**
    * Checks if there are any artworks or images in the timeline
    * Used in ComponentControls to check if ink can be added
    * @returns      true if there are artworks loaded
    */
    function checkForArtworks(numArtworks) {
        var track, i;
        for (i = 0; i < tracks.length; i++) {
            track = tracks[i];
            if (track.getType() === LADS.TourAuthoring.TrackType.artwork || track.getType() === LADS.TourAuthoring.TrackType.image) {
                return true;
            }
        }
        return false;
    }
    that.checkForArtworks = checkForArtworks;

    //this calls component controls from tracks, telling ink to be disabled
    function disableInk() {
        compCont.disableInk();
    }
    that.disableInk = disableInk;

    //used by Track to tell componentcontrols if component options has been clicked
    var fadeHidden = true;
    function setFadeHidden(fade) {
        fadeHidden = fade;
    }
    that.setFadeHidden = setFadeHidden;

    //used in componentcontrols to check if component options has been clicked
    function isFadeHidden() {
        return fadeHidden;
    }
    that.isFadeHidden = isFadeHidden;

    /**
     * Call when tour has been fully initialized
     * RIN reloads fired by edits are blocked until this is called!
     */
    function setLoaded() {
        loaded = true;
        undoManager.setInitialized(true);
    }
    that.setLoaded = setLoaded;

    /**
     * Updates selected keyframe (or new keyframe) w/ keyframe data from RIN
     * @param trackName     name of the track whose media is being manipulated
     * @param capture       keyframe data in RIN format (needs to be parsed)
     * @param select        whether receiving keyframe should be selected
     */
    function receiveKeyframe(trackName, capture, select) {
        var track, i;
        for (i = 0; i < tracks.length; i++) {
            track = tracks[i];

            // If this is the track pass on the keyframe data
            if (track.getTitle() === trackName) {
                track.receiveKeyframe(capture, select);
                return;
            }
        }
    }
    that.receiveKeyframe = receiveKeyframe;

    /**
     * Deselects selected keyframes on all tracks
     */
    function capturingOff() {
        var i;
        for (i = 0; i < tracks.length; i++) {
            tracks[i].deselectKeyframe();
        }
    }
    that.capturingOff = capturingOff;

    /**
     * Grabs current keyframe state from viewer
     * @returns     Keyframe data in xml
     */
    function captureKeyframe(artname) {
        return viewer.captureKeyframe(artname);
    }
    that.captureKeyframe = captureKeyframe;

    function getViewer() {
        return viewer;
    }
    that.getViewer = getViewer;

    ///////////
    // RIN Code

    /**
     * @returns     JSON object representing current state of timeline in RIN format
     */
    function toRIN() {
        var rin = {}, title = "TAGAuthoringPreview";

        // v2 code
        rin.version = '1.0';
        rin.defaultScreenplayId = "SCP1";
        rin.screenplayProviderId = 'screenplayProvider';
        rin.data = {
            narrativeData: {
                guid: "e3ced195-0c8b-48f6-b42c-f989e52b4f03",
                timestamp: new Date().toISOString(),
                title: title,
                author: "TAG Authoring Tool",
                aspectRatio: "WideScreen",
                estimatedDuration: timeManager.getDuration().end,
                description: "TAG Tour",
                branding: "TAG"
            }
        };
        rin.providers = {
            ZMES: {
                name: "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
                version: "1.0"
            },
            AES: {
                name: 'MicrosoftResearch.Rin.AudioExperienceStream',
                version: "1.0"
            },
            screenplayProvider: {
                name: "MicrosoftResearch.Rin.DefaultScreenplayProvider",
                version: "1.0"
            },
            FadeInOutTransitionService: {
                name: "MicrosoftResearch.Rin.FadeInOutTransitionService",
                version: "1.0"
            },
            InkES: {
                name: "MicrosoftResearch.Rin.InkExperienceStream",
                version: "0.0"
            },
            VideoES: {
                "name": "MicrosoftResearch.Rin.VideoExperienceStream",
                "version": 0.0
            },
            ImageES: {
                name: "MicrosoftResearch.Rin.ImageExperienceStream",
                version: "1.0"
            },
        };

        rin.resources = _getResourceTable();

        rin.experiences = _getExperienceStreams();

        rin.screenplays = {
            SCP1: {
                data: {
                    experienceStreamReferences: _getScreenPlay()
                }
            }
        };

        
        return rin;
    }
    that.toRIN = toRIN; // public for testing purposes only?

    /**
     * Helper function to collect track resource entries
     * @returns     JSON object table of resources
     */
    function _getResourceTable() {
        var i,
            table = {};
        for (i = 0; i < tracks.length; i++) {
            tracks[i].addResource(table);
        }
        return table;
        
    }

    /**
     * Helper function to collect track experience streams
     * @returns     JSON object table of ESs
     */
    function _getExperienceStreams() {
        var i,
            es = {};
        for (i = 0; i < tracks.length; i++) {
            tracks[i].addES(es);
        }
        return es;
    }

    /**
     * Helper function for constructing screenplay xml string from tracks
     * @returns     XML screenplay string
     */
    function _getScreenPlay() {
        var i,
            screenplayStorage = [];
        for (i = 0; i < tracks.length; i++) {
            tracks[i].addScreenPlayEntries(screenplayStorage);
        }
        screenplayStorage.sort(function (a, b) { return a.begin - b.begin; }); // Screenplay must be sorted
        return screenplayStorage;
    }

    function setTourExited(val) {
        tourExited = val;
    }
    that.setTourExited = setTourExited;

    /**
     * Function passed into tracks to be called on track changes to update RIN data
     */
    // debounce will prevent the function from being called
    // until the debounce function hasn't been called for
    // the specified number of milliseconds
    var debounce = $.debounce(750, coreUpdate);
    function coreUpdate() {
        onUpdateNumCalls = onUpdateNumCalls + 1;

        timeManager.stop();

        var rin;
        if (loaded) {
            viewer.setIsReloading(true);
            timeManager.stop();

            viewer.capturingOff();
            capturingOff();

            rin = toRIN();
            viewer.reloadTour(rin);
        }

        updateVerticalScroller();
        enableDisableDrag();
    }

    function onUpdate(noDebounce) {
        if (!noDebounce) {
            debounce();
        } else {
            coreUpdate();
        }
    }
    that.onUpdate = onUpdate;

    /**
     * Loads tour file and initializes timeline UI accordingly
     */
    function loadRIN(rin, callback) {
        var parser = LADS.Util.createQueue(),
            r, e, es, i, j, y, eobj,
            experienceArray, screenplayEntries,
            trackname, exp, expstr, expstrname, currScp,
            defaultseq,
            mediaLength,
            begin, fadeIn, fadeOut,
            track, display,
            type, length, zIndex,
            experienceStreams,
            keyframes, currKey, key, keyloc, keylocy,
            linkTrack,
            inks = [], // need to do some ink init after everything else has been loaded, save it here
            narrativeData = rin.data.narrativeData,
            resources = rin.resources,
            experiences = rin.experiences,
            screenplay = rin.screenplays.SCP1.data.experienceStreamReferences;
        // parse narrative data
        timeManager.setEnd(narrativeData.estimatedDuration);

        // ignore providers

        // parse resources and experiences simultaneously
        // first, get experiences and sort by zIndex in decending order
        screenplayEntries = rin.screenplays.SCP1.data.experienceStreamReferences;
        experienceArray = [];
        for (e in experiences) {
            if (experiences.hasOwnProperty(e)) {
                experienceArray.push({ name: e + '', exp: experiences[e] });
            }
        }
        function compareExps(a, b) {
            var az = a.exp.data.zIndex,
                bz = b.exp.data.zIndex,
                astr, bstr, expstr, i, currscp,
                astreams = a.exp.experienceStreams,
                bstreams = b.exp.experienceStreams;
            
            if (!az) {
                for (expstr in astreams) {
                    if (astreams.hasOwnProperty(expstr)) {
                        astr = astreams[expstr];
                        if (astr) {
                            az = astr.data.zIndex;
                        }
                        break;
                    }
                }
            }
            if (!bz) {
                for (expstr in bstreams) {
                    if (bstreams.hasOwnProperty(expstr)) {
                        bstr = bstreams[expstr];
                        if (bstr) {
                            bz = bstr.data.zIndex;
                        }
                        break;
                    }
                }
            }
            if (az) {
                if (bz) {
                    return bz - az;
                } else {
                    // b does not exist
                    return -1;
                }
            } else {
                if (bz) {
                    // a does not exist
                    return 1;
                } else {
                    // a and b do not exist
                    return 0;
                }
            }
        }

        experienceArray.sort(compareExps);

        // now parse
        function parseHelper(eobj, e) {
            parser.add(function () {
                parseTrack(eobj, e);
            });
        }
        for (e = 0; e < experienceArray.length; e++) {
            parseHelper(experienceArray[e], e);
        }

        // finally, ink init
        parser.add(function () {
            for (i = 0; i < inks.length; i++) {
                linkTrack = findTrackByTitle(inks[i].link);
                inks[i].track.setInkLink(linkTrack);
                if (linkTrack) {
                    linkTrack.addAttachedInkTrack(inks[i].track);
                }
            }
        });

        parser.add(function () {
            setLoaded();
        });
        parser.add(function () {
            /* do async viewer resize to make sure resize runs
             * after callback adds tour authoring to DOM
             */
            setTimeout(viewer.resize, 1);

            if (typeof callback === 'function') {
                callback();
            }

        });

        function confirmDeleteDisableInk(name, display, myy) {
            // create dialog
            root.append(deleteConfirmationOverlay);
            deleteConfirmationOverlay.attr('id', 'deleteConfirmationOverlay');
            deleteConfirmationOverlay.css({
                display: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                'background-color': 'rgba(0,0,0,0.6)',
                'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex,
            });

            // Actual dialog container
            var deleteConfirmation = $(document.createElement('div'));
            deleteConfirmation.attr('id', 'deleteConfirmation');
            deleteConfirmation.css({
                position: 'absolute',
                left: '32.5%',
                'width': '35%',
                'top': '30%',
                border: '3px double white',
                'background-color': 'black',
                'padding': '2.5% 2.5%',
            });
            deleteConfirmationOverlay.append(deleteConfirmation);

            var dialogTitle = $(document.createElement('div'));
            dialogTitle.attr('id', 'dialogTitle');
            dialogTitle.css({
                color: 'white',
                'font-size': '1.25em',
                'margin-bottom': '10px',
                'word-wrap': 'normal',
            });
            deleteConfirmation.append(dialogTitle);
            deleteConfirmation.append(document.createElement('br'));

            // Container for "continue / cancel" buttons
            var buttonRow = $(document.createElement('div'));
            buttonRow.css({
                'margin-top': '10px',
                'text-align': 'center',
            });
            deleteConfirmation.append(buttonRow);

            var submitButton = $(document.createElement('button'));
            submitButton.css({
                width: 'auto',
                border: '1px solid white',
                padding: '1%',
                'margin-right': '3%',
            });
            submitButton.text('Continue');
            $(submitButton).click(function () {
                var len = display.removeAttachedInkDisplays();
                display.removeDisplay(true);
                if (len > 0) {
                    undoManager.combineLast(len + 1);
                }
                // disabling this for now
                //deleteAttachedInkDisplays(myy);
                deleteConfirmationOverlay.fadeOut(500);
            });

            buttonRow.append(submitButton);

            var cancelButton = $(document.createElement('button'));
            cancelButton.css({
                width: 'auto',
                border: '1px solid white',
                padding: '1%'
            });
            cancelButton.text('Cancel'); 
            cancelButton.click(function () {
                deleteConfirmationOverlay.fadeOut(500);
            });
            buttonRow.append(cancelButton);

            // fade in the overlay
            deleteConfirmationOverlay.fadeIn(500);
            dialogTitle.text('Deleting the last display in track "' + name + '" will disable all attached ink tracks. Any existing ink displays will not function until a new artwork display has been created at an overlapping time.');

            // deletes all ink displays - not activating this for now, only giving them a warning
            /***
            function deleteAttachedInkDisplays(data) {
                var i;
                for (i = 0; i < data.attachedInks.length; i++) {
                    data.attachedInks[i].clearDisplays();
                }
            }
            ***/
        }
        that.confirmDeleteDisableInk = confirmDeleteDisableInk;
        

        /**
         * Parses an individual track
         * Note that this is scoped into loadRIN function! (needs access to inks variable)
         * @param eobj      two params, name is track name, exp is rin format experience object
         * @param e         track position of eobj
         */
        function parseTrack(eobj, e) {
            // initialization of track
            trackname = eobj.name; // track name is simply key / property name
            exp = eobj.exp; // actual experience entry
            type = exp.providerId; // ZMES or AES or ...
            zIndex = exp.data.zIndex;
            if (exp.resourceReferences.length !== 0) {
                r = exp.resourceReferences[0].resourceId; // id used to get media url out of resources
            }
            track = null;
            if (type === 'ZMES') {
                track = addArtworkTrack(resources[r].uriReference, trackname, exp.data.guid, e);
            } else if (type === 'ImageES') {
                track = addImageTrack(resources[r].uriReference, trackname, e);
            } else if (type === 'VideoES') {
                mediaLength = exp.data.mediaLength;
                track = addVideoTrack(resources[r].uriReference, trackname, e, mediaLength);
            } else if (type === 'AES') {
                mediaLength = exp.data.mediaLength;
                track = addAudioTrack(resources[r].uriReference, trackname, e, mediaLength);
            } else if (type === 'InkES') {
                track = addInkTrack(null, trackname, 1, null, e);
                track.setInkPath(exp.data.linkToExperience.embedding.element.datastring.str);
                track.setInkEnabled(exp.data.linkToExperience.embedding.enabled);
                track.setInkInitKeyframe(exp.data.linkToExperience.embedding.initKeyframe);
                track.setInkRelativeArtPos(exp.data.linkToExperience.embedding.initproxy);


                track.addInkTypeToTitle(exp.data.linkToExperience.embedding.element.datastring.str.split('::')[0].toLowerCase());



                inks.push({ 'track': track, 'link': exp.data.linkToExperience.embedding.experienceId }); // do link init later
                //create ink canvas and load datastring
            } else {
                console.log('Experience not yet implemented');
            }

            // check track ordering is correct
            if (track.getPos() !== experienceArray.length - zIndex) {
                console.log('zIndex and track array position are not the same for: ' + trackname);
            }

            // add displays from experience streams
            if (track) {
                experienceStreams = exp.experienceStreams;
                for (var es in experienceStreams) {
                    if (experienceStreams.hasOwnProperty(es)) {
                        expstrname = es + '';
                        expstr = experienceStreams[es]; // actual experience stream
                        length = expstr.duration;

                        // to find start + end of displays, need to scan screenplay
                        for (i = 0; i < screenplay.length; i++) {
                            currScp = screenplay[i];
                            if (currScp.experienceStreamId === expstrname) { // found a match
                                // note: scp length is fadeIn + main, expstr length is just main
                                // easy shortcut for reading fades
                                begin = currScp.begin;
                                if (expstr.data.transition && expstr.data.transition.providerId) {
                                    fadeIn = expstr.data.transition.inDuration;
                                    fadeOut = expstr.data.transition.outDuration;
                                } else {
                                    fadeIn = 0;
                                    fadeOut = 0;
                                }
                                display = track.addDisplay(timeManager.timeToPx(begin));
                                display.setMain(length);
                                display.setIn(fadeIn);
                                display.setOut(fadeOut);

                                // add keyframes
                                if (exp.providerId !== 'InkES' && exp.providerId !== 'VideoES') {
                                    defaultseq = expstr.header.defaultKeyframeSequence;
                                    keyframes = expstr.keyframes;
                                    for (j = 0; j < keyframes.length; j++) {
                                        currKey = keyframes[j];

                                        // ignore initialization keyframe
                                        if (currKey.init) {
                                            continue;
                                        }

                                        keyloc = timeManager.timeToPx(currKey.offset + display.getStart());
                                        if (type === 'ZMES' || type === 'ImageES') {
                                            key = display.addKeyframe(keyloc, 0);
                                            if (key) key.loadRIN(currKey);
                                        } else if (type === 'AES') {
                                            // get audio to set y location
                                            y = currKey.state.sound.volume;
                                            y = Math.constrain(LADS.TourAuthoring.Constants.trackHeight - LADS.TourAuthoring.Constants.trackHeight * y, 0, LADS.TourAuthoring.Constants.trackHeight);
                                            key = display.addKeyframe(keyloc, y);
                                            if (key) track.addKeyframeToLines(key);
                                        } else if (type === 'VideoES') { //not used b/c of if check above
                                            // get video to set y location
                                            //y = 0;
                                            //key = display.addKeyframe(keyloc, y);
                                        } else {
                                            console.log('Experience not yet implemented');
                                        }
                                    }
                                }

                                // done with this display
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    that.loadRIN = loadRIN;    

    function cancelAccel() {
        manipObjects.ruler.cancelAccel();
        manipObjects.track.cancelAccel();
    }
    that.cancelAccel = cancelAccel;

    return that;
   
};