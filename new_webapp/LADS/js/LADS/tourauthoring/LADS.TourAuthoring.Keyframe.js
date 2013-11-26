 LADS.Util.makeNamespace('LADS.TourAuthoring.Keyframe');

/**
 * Makes a keyframe
 * Associated with a display (keyframe sequence)
 * Maps to keyframe in RIN (duh)
 * @param spec      location (loc - x,y if audio, just x if visual), keyframe svg group (gkey) attrs
 * @param my        Update currentKeyframe param for touch handling, contains timeManager, undoManager, and svg
 */
LADS.TourAuthoring.Keyframe = function (spec, my) {
    "use strict";

    var that = {},
        _data = spec.data || { viewport: { region: { center: { x: 0, y: 0 }, span: { x: 1, y: 1 } } } },
        loc = spec.loc, // location in seconds - {x,y}
        gkey = spec.gkey, // SVG group containing keyframe
        display = spec.display, // containing display
        position = 0,

        menu = LADS.TourAuthoring.EditorMenu({
            type: LADS.TourAuthoring.MenuType.keyframe,
            parent: that
        }, my),

        // svg variables
        circle, line, innerCircle, offsetx, offsety, hidden = false,

        // keyframe edit command logging functionality
        _updateKeyFrameCommand, needsLogging;

    //that.openMenu = false;
    that.position = 0; 
    that.removed = false;

    function initSVG() {
        var timex = my.timeManager.timeToPx(loc.x);

        // Remember: svg height is just 100%!

        // middle marking line
        line = gkey.append('line')
            .attr('x1', timex).attr('y1', '0%')
            .attr('x2', timex).attr('y2', '100%')
            .attr('style', 'stroke:' + LADS.TourAuthoring.Constants.keyframeColor + '; stroke-width:' + LADS.TourAuthoring.Constants.keyframeLineW + ';');

        // keyframe circle
        circle = gkey.append('circle')
                     .attr('style', 'stroke:' + LADS.TourAuthoring.Constants.keyframeColor
                     + '; fill:white; stroke-width:' + LADS.TourAuthoring.Constants.keyframeStrokeW + ';');
        //circle.on('mousedown', function (d, i) {
        //    var mouse = d3.mouse(circle[0][0]);
        //    _keyframeMousedown(mouse[0] - parseInt(this.getAttribute('cx')), mouse[1] - parseInt(this.getAttribute('cy')));
        //});

        $(circle[0][0]).on('mousedown', function (e) {
            console.log("using new events");
            var offsetX = e.offsetX;
            var offsetY = e.offsetY;
            _keyframeMousedown(offsetX - parseInt(circle.attr('cx'), 10), offsetY - parseInt(circle.attr('cy'), 10));
        });

        if (my.type !== LADS.TourAuthoring.TrackType.audio) { // set vertical positioning of non-audio keyframes
            loc.y = "50%";
        }
        circle.attr('cx', timex)
                  .attr('cy', loc.y) // TODO: convert linear scale to dBFS (logarithmic for even fades)
                  .attr('r', LADS.TourAuthoring.Constants.keyframeSize);

        innerCircle = gkey.append('circle')
                        .attr('cx', timex)
                        .attr('cy', loc.y)
                        .attr('r', LADS.TourAuthoring.Constants.innerKeyframeSize)
                        .attr('style', 'display:none; stroke:' + LADS.TourAuthoring.Constants.keyframeColor + '; fill:' + LADS.TourAuthoring.Constants.keyframeColor + '; stroke-width:0;');
        //innerCircle.on('mousedown', function (d, i) {
        //    var mouse = d3.mouse(circle[0][0]);
        //    _keyframeMousedown(mouse[0] - parseInt(this.getAttribute('cx')), mouse[1] - parseInt(this.getAttribute('cy')));
        //});

        $(innerCircle[0][0]).on('mousedown', function (e) {
            console.log("using new events");
            var offsetX = e.offsetX;
            var offsetY = e.offsetY;
            _keyframeMousedown(offsetX - parseInt(innerCircle.attr('cx'), 10), offsetY - parseInt(innerCircle.attr('cy'), 10));
        });

        function toggleCircle() {
            hidden = !hidden;
            if (hidden) {
                circle.attr('display', 'none');
                innerCircle.attr('display', 'none');
            } else {
                circle.attr('display', null);
                innerCircle.attr('display', null);
            }
        }
        that.toggleCircle = toggleCircle;

        /**
         * Helper function to set currentKeyframe and other vars in prep for movement
         */
        function _keyframeMousedown(mouseoffsetx, mouseoffsety) {
            var oldlocx = loc.x, // for command logging
                oldlocy = loc.y;

            // Stop playback on mousedown
            my.timeManager.stop();

            // Setting movement related vars
            offsetx = mouseoffsetx;
            offsety = mouseoffsety;
            my.currentKeyframe = that;
            $('body').on('mouseup.keyframe', function () {
                var command, newlocx, newlocy;
                my.currentKeyframe = null;
                offsetx = null;
                offsety = null;
                $('body').off('mouseup.keyframe');

                // If movement has occured, update and log command for undo/redo
                if (loc.x !== oldlocx || loc.y !== oldlocy) {
                    display.sortKeyframes();
                    my.update();
                    newlocx = loc.x;
                    newlocy = loc.y;
                    command = LADS.TourAuthoring.Command({
                        execute: function () {
                            loc.x = newlocx;
                            loc.y = newlocy;
                            scale();
                            display.sortKeyframes();
                            my.update();
                        }, unexecute: function () {
                            loc.x = oldlocx;
                            loc.y = oldlocy;
                            scale();
                            display.sortKeyframes();
                            my.update();
                        }
                    });
                    my.undoManager.logCommand(command);
                }
            });
        }
    }
    initSVG();

    (function initMenu() {
        menu.addInput('Time', LADS.TourAuthoring.MenuInputFormats.minSec,
            getTime, setTime);
        if (my.type === LADS.TourAuthoring.TrackType.audio) {
            menu.addInput('Volume', LADS.TourAuthoring.MenuInputFormats.percent,
                getVolume, setVolume);
        }
        menu.addButton('Delete', 'left', removeHelper);
        //menu.addButton('Duplicate', 'left', duplicate);
        menu.addButton('Close', 'right', menu.forceClose);
    })();

    //function duplicate() {
    //    var copyTo = Math.min(display.getEnd(), loc.x + LADS.TourAuthoring.Constants.epsilon),
    //        newKey = display.addKeyframe(copyTo);

    //    newKey.loadRIN({ state: _data });
    //}

    function removeHelper() {
        remove(true);
    }

    function remove(displayRemoved, preventClose) {
        closeMenu(preventClose);
        var index,
            command = LADS.TourAuthoring.Command({
            execute: function () {
                index = display.removeKeyframe(that);
                circle.remove();
                line.remove();
                innerCircle.remove();
                that.removed = true;
                display.getTrack().drawLines();
                scale();
                my.update();
            }, unexecute: function () {
                reactivateKeyframe();
                display.insertKeyframe(that, index);
                display.getTrack().drawLines();
                scale();
                my.update();
            }
        });
        command.execute();
        if (displayRemoved) {
            my.undoManager.logCommand(command);
        }
    }
    that.remove = remove;

    function reactivateKeyframe() {
        that.removed = false;
        initSVG();
    }
    that.reactivateKeyframe = reactivateKeyframe;

    function updatePosition(newpos) {
        position = newpos;
    }
    that.updatePosition = updatePosition;

	function getPosition() {
		return position;
	}
	that.getPosition = getPosition;

    function closeMenu(preventClose) {
        menu.close(preventClose);
    }
    that.closeMenu = closeMenu;

    function menuIsOpen() {
        return menu.menuCloseable;
    }

    function setMenuCloseable(state) {
        menu.menuCloseable = state;
    }

    // handles long press on a keyframe
    function rightTapped(evt) {
        menu.open(evt);
    }
    that.rightTapped = rightTapped;

    function tapped(evt) {
        my.timeManager.seek(loc.x);
        setSelected();
    }
    that.tapped = tapped;

    var setSelectedDebounced = $.debounce(250, function () {
        if (my.type !== LADS.TourAuthoring.TrackType.audio) {
            my.selectedKeyframe = that;
            $("circle").css({ 'fill': 'white' });
            innerCircle.attr('style', 'fill: #296b2f');

            var currData = _data;
            var command = createKeyframeCommand();
            //my.undoManager.logCommand(command);
            _updateKeyFrameCommand = command;
        }

        function createKeyframeCommand() {
            return LADS.TourAuthoring.Command({
                execute: function () {

                },
                unexecute: function () {
                    _data = currData;
                    my.update();

                    if (my.selectedKeyframe === that) {
                        _updateKeyFrameCommand = createKeyframeCommand();
                        needsLogging = true;
                    }
                }
            });
        }
    });

    /**
     * functions for changing keyframe style based on selected status
     */
    function setSelected(delayLogging) {
        //if (my.type !== LADS.TourAuthoring.TrackType.audio) {
        //    my.selectedKeyframe = that;
        //    $("circle").css({ 'fill': 'white' });
        //    innerCircle.attr('style', 'display: inherit; fill: #296b2f');

        //    var currData = _data;
        //    var command = createKeyframeCommand();
        //    if (!delayLogging) {
        //        my.undoManager.logCommand(command);
        //    }
        //    needsLogging = !!delayLogging; // convert null or undefined to false
        //    _updateKeyFrameCommand = command;
        //}

        //function createKeyframeCommand() {
        //    return LADS.TourAuthoring.Command({
        //        execute: function () {

        //        },
        //        unexecute: function () {
        //            _data = currData;
        //            my.update();

        //            if (my.selectedKeyframe === that) {
        //                _updateKeyFrameCommand = createKeyframeCommand();
        //                needsLogging = true;
        //            }
        //        }
        //    });
        //}
        setSelectedDebounced();
    }
    that.setSelected = setSelected;

    function setDeselected() {
        _updateKeyFrameCommand = null;
        my.selectedKeyframe = null;
        innerCircle.style('display', 'none');
    }
    that.setDeselected = setDeselected;


    
    // Gets x location (time in px) of keyframe
    function getTime() {
        return loc.x;
    }
    that.getTime = getTime;

    function setTime(newtime) {
        var timex,
            keyframes = display.getKeyframes(),
            leftbound = (position > 0)
                        ? Math.max(keyframes[position - 1].getTime(), display.getStart())
                        : display.getStart(),
            rightbound = (position + 1 < keyframes.length)
                        ? Math.min(keyframes[position + 1].getTime(), display.getEnd())
                        : display.getEnd();

        loc.x = Math.constrain(newtime,
                                leftbound + LADS.TourAuthoring.Constants.epsilon,
                                rightbound + LADS.TourAuthoring.Constants.epsilon);

        timex = my.timeManager.timeToPx(loc.x);
        circle.attr('cx', timex);
        line.attr('x1', timex).attr('x2', timex);
        innerCircle.attr('cx', timex);
        if (my.type === LADS.TourAuthoring.TrackType.audio) {
            display.getTrack().drawLines();
        }

        setDeselected();
    }
    that.setTime = setTime;

    // Gets y location (volume in px) of keyframe
    function getVolumePx() {
        return loc.y;
    }
    that.getVolumePx = getVolumePx;

    // Gets volume (in percent) of keyframe
    function getVolume() {
        return heightToPercent(loc.y);
    }
    that.getVolume = getVolume;

    /**
     * Sets keyframe volume
     * @param newvolume     new volume in percent
     */
    function setVolume(newvolume) {
        loc.y = percentToHeight(Math.constrain(newvolume, 0, 100));
        circle.attr('cy', loc.y);
        innerCircle.attr('cy', loc.y);
        my.that.drawLines();
    }
    that.setVolume = setVolume;

    // generate vertical fader value out of 100% based on track height constant
    function heightToPercent(height) {
        //rounds to 2 decimal places
        return (Math.round(((LADS.TourAuthoring.Constants.trackHeight - height) * 100 / LADS.TourAuthoring.Constants.trackHeight) * 100) / 100);
    }

    // generate raw height value from percentage vertical fader value
    function percentToHeight(percent) {
        return LADS.TourAuthoring.Constants.trackHeight - (percent * LADS.TourAuthoring.Constants.trackHeight / 100);
    }

    // Gets containing display
    function getContainingDisplay() {
        return display;
    }

    // Gets whether the keyframe has been removed
    function isRemoved() {
        return that.removed;
    }
    that.isRemoved = isRemoved;
    that.getContainingDisplay = getContainingDisplay;

    /**   
     * Logic for manipulation + dragging of keyframes
     * Moves keyframe to an absolute position given in res
     * currentKeyframe and offsets should be set, see initSVG / _keyframeMousedown for details
     * Automatically bounds keyframe movement to associated display
     * @param res           event from makeManipulable, onManipulate
     * @param leftbound     leftmost position keyframe can move to (not required)
     * @param rightbound    rightmost position keyframe can move to (not required)
     */
    function move(res, leftbound, rightbound) {
        var timex;

        // If no bounds are set, keyframe can be anywhere within display except non-negative times
        leftbound = leftbound || 0;
        rightbound = rightbound || Infinity;

        // error checking
        if ((!offsetx && offsetx !== 0) || (!offsety && offsety !== 0) || !my.currentKeyframe) {
            console.log('Move keyframe called when no keyframe is selected!');
        }
        // Editing
        else {
            loc.x = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offsetx),
                                    Math.max(leftbound, display.getStart()) + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.fadeBtnSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.keyframeSize),
                                    Math.min(rightbound, display.getEnd()) - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.fadeBtnSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.keyframeSize));
            if (loc.x < display.getStart() || loc.x > display.getEnd()) {
                loc.x = (display.getStart() + display.getEnd()) / 2;
            }
            if (loc.x < leftbound) {
                loc.x = leftbound;
            }
            if (loc.x > rightbound) {
                loc.x = rightbound;
            }
            timex = my.timeManager.timeToPx(loc.x);
            circle.attr('cx', timex);
            line.attr('x1', timex).attr('x2', timex);
            innerCircle.attr('cx', timex);
            if (my.type === LADS.TourAuthoring.TrackType.audio) { // Change y loc only if keyframe is audio
                loc.y = Math.constrain(res.pivot.y - offsety, 0, LADS.TourAuthoring.Constants.trackHeight); // bound y movement to svg!
                circle.attr('cy', loc.y);
                innerCircle.attr('cy', loc.y);
                display.getTrack().drawLines();
                // leave as pixel values
            }
            setDeselected();
            //my.update();
            // TODO: command logging
        }
    }
    that.move = move;

    /**
     * Used to debug move from command line
     * Flips internal state to simulate clicks
     * Resets state when finished
     * Use only in test code or functions inside display
     */
    function internalMove(x, y, leftbound, rightbound) {
        var res = {
            pivot: { x: x, y:y}
        };
        offsetx = 0;
        offsety = 0;
        my.currentKeyframe = that;

        move(res, leftbound, rightbound);
        display.sortKeyframes();
        my.update();

        offsetx = null;
        offsety = null;
        my.currentKeyframe = null;
    }
    that.internalMove = internalMove;

    /**
     * Translates keyframe by t secs
     * @param t     amount of translation
     */
    function translate(t) {
        var timex;
        loc.x = Math.constrain(loc.x + t, display.getStart(), display.getEnd());
        timex = my.timeManager.timeToPx(loc.x);
        circle.attr('cx', timex);
        line.attr('x1', timex).attr('x2', timex);
        innerCircle.attr('cx', timex);
        setDeselected();
        //newVal.val(createminsec(loc.x));
        //my.update();
    }
    that.translate = translate;

    /**
     * Called when ratio of time to pixels is changed
     * Just resets positioning of keyframes
     */
    function scale() {
        var timex = my.timeManager.timeToPx(loc.x);
        circle.attr('cx', timex).attr('cy', loc.y);
        line.attr('x1', timex).attr('x2', timex);
        innerCircle.attr('cx', timex);
        if (my.type === LADS.TourAuthoring.TrackType.audio) {
            display.getTrack().drawLines();
        }
    }
    that.scale = scale;

    /**
     * Converts the y location of the keyframe onto scale from 0 to 1
     * 0 is bottom of timeline, 1 is top
     * Scale is linear
     * Used for audio keyframes only
     */
    function ypixToVolume() {
        return Math.constrain((LADS.TourAuthoring.Constants.trackHeight - loc.y) / LADS.TourAuthoring.Constants.trackHeight, 0, 1);
    }

    /**
     * Maps keyframe to RIN keyframe
     */
    function toRIN() {
        var keyframe;
        switch (my.type) {
            case LADS.TourAuthoring.TrackType.artwork:
                keyframe = {
                    offset: loc.x - display.getStart(),
                    init: false,
                    holdDuration: 0,
                    state: _data
                    /*data: { // Need to determine where keyframe info is getting stored, also why does it need a media source?
                        'default': _data,
                        TransitionTime: "<TransitionTime>3</TransitionTime>",
                        PauseDuration: "<PauseDuration>1</PauseDuration>",
                        keyframeThumbnail: "<Thumbnail></Thumbnail>"
                    }*/
                };
                break;
            case LADS.TourAuthoring.TrackType.image:
                keyframe = {
                    offset: loc.x - display.getStart(),
                    init: false,
                    holdDuration: 0,
                    state: _data
                };
                break;
            case LADS.TourAuthoring.TrackType.audio:
                keyframe = {
                    offset: loc.x - display.getStart(),
                    init: false,
                    holdDuration: 0,
                    state: { // Need to determine where keyframe info is getting stored, also why does it need a media source?
                        'sound': {
                            'volume': ypixToVolume()
                        }
                    }
                };
                break;
            default:
                console.log('RIN track type not yet implemented');
                break;
        }
        return keyframe;
    }
    that.toRIN = toRIN;

    /**
     * Initializes keyframe using RIN data
     * @param data      keyframe in RIN xml format
     */ 
    function loadRIN(data) {
        if (data.state) {
            _data = data.state;
        }
        else if (data.data) {
            var xml = data.data.default,
            center = {
                x: Number((/Viewport_X='([^']+)'/.exec(xml))[1]),
                y: Number((/Viewport_Y='([^']+)'/.exec(xml))[1])
            },
            span = {
                x: Number((/Viewport_Width='([^']+)'/.exec(xml))[1]),
                y: Number((/Viewport_Height='([^']+)'/.exec(xml))[1])
            };
            _data = {
                viewport: {
                    region: {
                        center: center,
                        span: span
                    }
                }
            };
            // parse into new format
        }
        if (_updateKeyFrameCommand) {
            (function (command) {
                command.execute = function () {
                    _data = data;
                    my.update();
                    _updateKeyFrameCommand = command;
                    needsLogging = false;
                };
            })(_updateKeyFrameCommand);

            if (needsLogging) {
                my.undoManager.logCommand(_updateKeyFrameCommand);
                needsLogging = false;
            }
        }
    }
    that.loadRIN = loadRIN;

    return that;
};