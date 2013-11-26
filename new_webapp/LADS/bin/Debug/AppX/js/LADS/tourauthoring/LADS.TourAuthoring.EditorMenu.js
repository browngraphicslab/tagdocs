LADS.Util.makeNamespace('LADS.TourAuthoring.MenuInputFormats');
LADS.Util.makeNamespace('LADS.TourAuthoring.EditorMenu');

LADS.TourAuthoring.MenuInputFormats = {
    minSec: 1, // 00:00.00 (min:sec.centisecs)
    sec: 2, // 00 (sec)
    percent: 3 // 0 - 100 (%)
};

LADS.TourAuthoring.MenuType = {
    display: 1,
    keyframe: 2,
    track: 3
};

/**
 * Menu for track, display and keyframe editing
 * @param spec.type     value from MenuType enum specifying menu layout
 * @param my            track's shared my object
 */
LADS.TourAuthoring.EditorMenu = function (spec, my) {
    "use strict";
    var that = {},
        menu = $(document.createElement('div')),
        arrow = $(document.createElement('img')),
        menuType = spec.type,
        parent = spec.parent,
        trackBody = my.timeline.getTrackBody(),
        
        /**
         * Contains one object for every input in the menu
         * Input objects have parameters:
         * @param input             The actual HTML input element
         * @param format            Format of input, value from MenuInputFormats enum
         * @param accessCallback    Function for obtaining current value of linked variable
         * @param updateCallback    Function for updating value of linked variable
         */
        inputObjects = [];

    that.menuCloseable = true;

    /**
     * Initializes menu html
     */
    (function createHTML() {
        var width, arrowSrc;

        // set particular parts of style according to menu type
        switch (menuType) {
            case LADS.TourAuthoring.MenuType.display:
                width = '25%';
                break;

            case LADS.TourAuthoring.MenuType.keyframe:
                width = '18%';
                break;

            case LADS.TourAuthoring.MenuType.track:
                width = '20%';
                break;
        }

        menu.css({
            "position": "fixed",
            //"top": my.track.offset.top - my.timeline.getTrackBody().scrollTop(),
            //"left": my.track.offset.left - my.timeline.getTrackBody().scrollLeft(),
            "color": "rgb(256, 256, 256)",
            'width': width,
            'background-color': 'rgba(0,0,0,0.7)',
            'padding-top': '3px',
            'padding-left': '2px',
            'padding-right': '2px',
            'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex + 7,
            'border-radius': '15px'
        });

        // more particular fixes
        switch (menuType) {
            case LADS.TourAuthoring.MenuType.display:
                break;

            case LADS.TourAuthoring.MenuType.keyframe:
                break;

            case LADS.TourAuthoring.MenuType.track:
                menu.css({
                    'left': '18%',
                    'padding': '.5%',
                    'margin-top': '1%',
                    'float': 'left',
                    'clear': 'left',
                    'border-radius': '5%'
                });
                break;
        }

        my.track.append(menu);
        menu.hide();
        my.timeline.isMenuOpen = false;

        // general event bindings
        menu.on('MSPointerDown', function (ev) {
            inputObjects.map(updateInput);
            ev.stopImmediatePropagation();
        });
        menu.on('mousedown', function (event) {
            inputObjects.map(updateInput);
            event.stopImmediatePropagation();
        });
        menu.on('click', function (event) {
            inputObjects.map(updateInput);
            event.stopImmediatePropagation();
        });

        // more particular fixes
        switch (menuType) {
            case LADS.TourAuthoring.MenuType.display:
            case LADS.TourAuthoring.MenuType.keyframe:
                arrowSrc = "images/icons/KeyframeInfo-Transparent.png";
                break;

            case LADS.TourAuthoring.MenuType.track:
                arrowSrc = "images/icons/LeftPoint-Transparent.png";
                break;
        }

        arrow.attr("src", arrowSrc);
        arrow.css({
            position: 'fixed',
            height: '45px',
            width: '54px',
            'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex + 5,
            opacity: '.9'
        });

        switch (menuType) {
            case LADS.TourAuthoring.MenuType.track:
                arrow.css({
                    left: '14%',
                    height: '6%',
                    width: '4%'
                });
                break;
        }

        my.track.append(arrow);
        arrow.hide();
    })();

    /**
     * Opens menu
     * @param evt   evt from interaction event, used to reposition menu
     */
    function open(evt) {
        // close existing menus=
        var close = my.timeline.getCloseMenu();
        if (close) {
            close();
        }

        // ???
        if (my.that.getEventsPaused())
            return;

        //deselect all tracks and open the menu
        my.timeline.allDeselected();
        my.timeline.setisMenuOpen(true);
        my.timeline.setCloseMenu(forceClose);
        my.that.updateTracksEventsPaused(true);

        // update menu position and contents
        if (evt) updateMenuPos(evt);
        resetInputs();

        // remove current selections
        my.currentDisplay = null;
        if (my.currentKeyframe) {
            my.currentKeyframe.setDeselected();
            my.currentKeyframe = null;
        }

        // reattach handlers if they were removed
        if (!menu.data('events') || !(menu.data('events').click)) {
            menu.on('click', function (event) {
                inputObjects.map(updateInput);
                event.stopImmediatePropagation();
            });
        }
        if (!menu.data('events') || !(menu.data('events').MSPointerDown)) {
            menu.on('MSPointerDown', function (ev) {
                inputObjects.map(updateInput);
                ev.stopImmediatePropagation();
            });
        }
        if (!menu.data('events') || !(menu.data('events').mousedown)) {
            menu.on('mousedown', function (event) {
                inputObjects.map(updateInput);
                event.stopImmediatePropagation();
            });
        }

        // logic to close menu
        my.root.on('mousedown.editorMenu', function (event) {
            var i, ancestryCheck = false;
            for (i = 0; i < inputObjects.length; i++) { // TODO
                if ($(event.target).parents().index(inputObjects[i].input) === -1) {
                    ancestryCheck = true;
                    break;
                }
            }

            that.close();//only closes if clicked off menu
        });
    }
    that.open = open;

    /**
     * Close menu
     * Doesn't fire if menuCloseable is set
     * Call only from my.root close handler
     */
    function close(preventClose) {
        forceClose(preventClose);
    }
    that.close = close;

    /**
     * Actually closes menu, no menuCloseable check
     * Call everywhere except my.root handler
     */
    function forceClose(preventClose) {
        var i;

        my.root.off('mousedown.editorMenu');

        my.timeline.setisMenuOpen(false);
        my.timeline.setCloseMenu(null);
        my.that.updateTracksEventsPaused(false);

        menu.hide();
        arrow.hide();

        // remove current selections
        //my.currentDisplay = null;
        //if (my.currentKeyframe && my.currentKeyframe === parent) {
        //    my.currentKeyframe.setDeselected();
        //    my.currentKeyframe = null;
        //}

        // save current input states
        if (!preventClose) {
            for (i = 0; i < inputObjects.length; i++) {
                updateInput(inputObjects[i]);
            }
        }
    }
    that.forceClose = forceClose;

    ///////////////
    // CONSTRUCTION

    /**
     * Adds an input element to the menu
     * @param name      Name of element (appears on menu)
     * @param format    MenuInputFormat type
     * @param accessCallback    Function for obtaining current value of linked variable
     * @param updateCallback    Function for updating value of linked variable
     */
    function addInput(name, format, accessCallback, updateCallback) {
        var inputObj = {},
            inputContainer = $(document.createElement('div')),
            input = $(document.createElement('input')),
            units = $(document.createElement('text'));

        // set up input
        input.attr('type', 'text');
        input.val(convertToString(accessCallback(), format)); // TODO: ??? do I need to parse to proper format?
        input.css({
            width: '15%',
            position: 'absolute',
            //'min-width': '0px',//override stylesheet
            right: '40%'
        });
        input.click(function (ev) {
            input.select();
            ev.stopPropagation();
        });
        input.on('MSPointerDown', function (ev) { ev.stopPropagation(); });
        input.keypress(function (evt) { // update on enter push
            if (evt.keyCode === 13) {
                updateInput(inputObj);
                resetInputs();
            }
        });

        // set up units
        units.css({
            'position': 'absolute',
            'float': 'right',
            'font-size': '80%',
            'right': '15px'
        });
        switch (format) {
            case LADS.TourAuthoring.MenuInputFormats.minSec:
                units.text('min:sec');
                break;
            case LADS.TourAuthoring.MenuInputFormats.sec:
                units.text('secs');
                break;
            case LADS.TourAuthoring.MenuInputFormats.percent:
                units.text('percent');
        }

        // assemble container and attach to menu
        inputContainer.css({
            width: "95%",
            'margin-left': 'auto',
            'margin-right': 'auto',
            'font-size': LADS.Util.getFontSize(200),
            'padding-top': '3%',
        });
        inputContainer.append(name);
        inputContainer.append(input);
        inputContainer.append(units);
        menu.append(inputContainer);

        // assemble object
        inputObj.input = input;
        inputObj.accessCallback = accessCallback;
        inputObj.updateCallback = updateCallback;
        inputObj.format = format;
        inputObjects.push(inputObj);
    }
    that.addInput = addInput;

    /**
     * Adds text w/ no related input or button
     * @param title     Text to appear
     */
    function addTitle(title) {
        var titlediv = $(document.createElement('label'));
        titlediv.text(title);
        titlediv.css({
            "left": "auto",
            "top": "auto",
            "position": "relative",
            "font-size": LADS.Util.getFontSize(250),
            "color": "rgb(256, 256, 256)",
            "display": "block",
            'padding': '4%',
            'text-align': 'center'
        });
        menu.append(titlediv);
    }
    that.addTitle = addTitle;

    /**
     * Adds button to screen (click to fire)
     * @param title     Test to appear in button
     * @param floatPos  Side of screen to float to
     * @param callback  Function to fire when clicked
     */
    function addButton(title, floatPos, callback) {
        var buttondiv = $(document.createElement('label'));
        buttondiv.text(title);//sets button text
        buttondiv.css({
            "left": "0%",
            "position": "relative",
            "top": "5%",
            "font-size": LADS.Util.getFontSize(200),
            "color": "rgb(256, 256, 256)",
            "display": "block",
            'padding': '10px 8px',
            'text-align': 'center',
            'margin-left': '3px',
            'margin-right': '3px',
            float: floatPos
        });

        // additional css edits:
        switch (menuType) {
            case LADS.TourAuthoring.MenuType.track:
                buttondiv.css({
                    'width': '90%',
                    'height': '16%',
                    'border-style': 'solid',
                    'border-width': '2px',
                    'margin-left': '3%',
                    'margin-right': '4%',
                    'margin-bottom': '3%',
                    //'padding-bottom': '2%',
                    top: ''
                });
                break;
        }

        menu.append(buttondiv);

        LADS.Util.makeManipulatable({ // use a basic click handler here instead
            element: buttondiv[0],
            functions: {
                onTapped: callback
            },
            stdHammer: true
        });
    }
    that.addButton = addButton;

    //////////
    // UPDATES

    /**
     * Updates linked variable with new value in input
     * @param inputObj      Input to update
     */
    function updateInput(inputObj) {
        var command,
            oldValue = inputObj.accessCallback(),
            newValue = inputObj.input.val();
        // log clamping undo/redo
        function logHelper(disp, cinit, cnew) {
            var clamp_command = {
                execute: function () { disp.setTimes(cnew); },
                unexecute: function () {
                    console.log("init: " + cinit.inStart + ", new: " + cnew.inStart);
                    disp.setTimes(cinit);
                },
            };
            my.undoManager.logCommand(clamp_command);
            disp.has_been_clamped = false;
        }
        // if input is valid, push to callback
        if (isValidInput(newValue)) {
            // convert text to proper return format
            


            newValue = convertToUpdateFormat(newValue, inputObj.format);
            if (Math.abs(oldValue - newValue) > LADS.TourAuthoring.Constants.epsilon) {
                my.timeline.clamped_displays.length = 0;
                command = {
                    execute: function () {
                        inputObj.updateCallback(newValue);
                        inputObj.input.val(convertToString(inputObj.accessCallback(), inputObj.format));
                        my.update();
                    },
                    unexecute: function () {
                        inputObj.updateCallback(oldValue);
                        inputObj.input.val(convertToString(inputObj.accessCallback(), inputObj.format));
                        my.update();
                    }
                };
                command.execute();
                my.undoManager.logCommand(command);

                var num_clamped = my.timeline.clamped_displays.length;
                for (var i = 0; i < num_clamped; i++) {
                    var disp = my.timeline.clamped_displays[i];
                    logHelper(disp, disp.clamped_init, disp.clamped_new);
                }
                my.undoManager.combineLast(num_clamped + 1);
            }
        }

        // update val with new internal value
        inputObj.input.val(convertToString(inputObj.accessCallback(), inputObj.format));
    }

    /**
     * Resets inputs to match current state of associated variables
     */
    function resetInputs() {
        var i, inputObj;
        for (i = 0; i < inputObjects.length; i++) {
            inputObj = inputObjects[i];
            inputObj.input.val(convertToString(inputObj.accessCallback(), inputObj.format));
        }
    }

    /**
     * Updates position of menu and brings it on-screen
     * @param evt   Interaction event object
     */
    function updateMenuPos(evt) {
        var menuLeft, menuTop, arrowLeft, arrowTop, trackLim;

        menu.show();
        arrow.show();

        switch (menuType) {
            case LADS.TourAuthoring.MenuType.display:
            case LADS.TourAuthoring.MenuType.keyframe:
                menuLeft = my.track.offset().left + evt.position.x - (menu.width() / 2);
                arrowLeft = menuLeft + (menu.width() / 2) - (arrow.width() / 2);
                arrowTop = my.track.offset().top;
                menuTop = arrowTop - menu.height()-3; // 10 is top margin of menu

                menuLeft = Math.min(menuLeft, $(document).width() - menu.width());
                break;

            case LADS.TourAuthoring.MenuType.track:
                menuTop = my.track.offset().top + my.track.height() / 2 - menu.height() / 2;
                arrowTop = menuTop + menu.height() / 2 - arrow.height() / 2;
                menuTop = Math.min(menuTop, (trackBody.offset().top + trackBody.height()) / 2 + $(document).height() / 2 - menu.height());

                // keep left the same
                menuLeft = menu.offset().left;
                arrowLeft = arrow.offset().left;
                break;
        }

        menu.css({
            left: menuLeft + "px",
            top: menuTop + 'px'
        });
        arrow.css({
            left: arrowLeft + 'px',
            top: arrowTop + 'px'
        });
    }

    ////////
    // UTILS

    /**
     * Performs input validation
     * @param inputstr  string to check
     */
    function isValidInput(inputstr) {//works for both mm:ss and seconds input
        var i, letter,
            coloncounter = 0;

        if (!inputstr) {
            return false;
        }

        for (i = 0; i < inputstr.length; i) {//for each character in string
            letter = inputstr.charAt(i);
            if (letter === ':') {
                coloncounter++;
            }
            if (coloncounter > 1 || (isNaN(parseFloat(letter)) && letter != "." && letter != ':')) {//if too many colons, or any 
                return false;//if too many colons or any character invalid
            }
            i = i + 1;
        }
        return true;//no problems!!
    }

    /**
     * Converts string to number according to input format type
     * @param valuestr      new value in string form
     * @param format        MenuInputFormat value specifying input format
     */
    function convertToUpdateFormat(valuestr, format) {
        var min, sec;

        switch (format) {
            case LADS.TourAuthoring.MenuInputFormats.minSec:
                // 'min:sec': --> secs
                valuestr = valuestr.split(':');
                if (valuestr.length === 1) { // no min at all
                    return parseFloat(valuestr[0]);
                } else {
                    if (valuestr[0]) min = parseFloat(valuestr[0]);
                    else min = 0; // catch case where input is ':sec'
                    sec = parseFloat(valuestr[1]);
                    return sec + 60 * min;
                } break;

            case LADS.TourAuthoring.MenuInputFormats.sec:
                // 'secs' --> secs
            case LADS.TourAuthoring.MenuInputFormats.percent:
                // 'percent' --> percent
                return parseFloat(valuestr);
        }
    }

    /**
     * Converts value (typically from accessCallback) to string
     * to place in input HTML element
     * @param value     Value as number
     * @param format    MenuInputFormat type specifying format to parse number to
     */
    function convertToString(value, format) {
        var min, sec;
        switch (format) {
            case LADS.TourAuthoring.MenuInputFormats.minSec:
                // 'min:sec': --> secs
                min = Math.floor(value / 60);
                if (min < 10) min = '0' + min;

                sec = value % 60;
                sec = roundDecimals(sec);
                if (sec < 10) sec = '0' + sec;

                return min + ':' + sec;

            case LADS.TourAuthoring.MenuInputFormats.sec:
                // 'secs' --> secs
            case LADS.TourAuthoring.MenuInputFormats.percent:
                // 'percent' --> percent
                return roundDecimals(value) + '';
        }
    }

    /**
     * Round number to have only
     * LADS.TourAuthoring.Constants.menuDecimals decimal places
     * @param num       number to round
     */
    var power = Math.pow(10, LADS.TourAuthoring.Constants.menuDecimals);
    function roundDecimals(num) {
        return Math.round(num * power) / power;
    }

    return that;
};