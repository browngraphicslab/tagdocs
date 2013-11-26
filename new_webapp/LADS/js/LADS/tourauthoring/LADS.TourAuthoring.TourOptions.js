LADS.Util.makeNamespace('LADS.TourAuthoring.TourOptions');

/**
 * Control for additional tour options
 *@param spec:    timeManager attr, url (url of tour if loading existing tour for editing)

 */
LADS.TourAuthoring.TourOptions = function (spec) {
    "use strict";

    var functionsPanel = $(document.createElement('div')),
        addTourOptionsLabel,
        dropMain,
        dropdownIcon,
        that = {},
        timeManager = spec.timeManager,
        timeline = spec.timeline,
        root = spec.root,
        undoManager = spec.undoManager,
        //dialogOverlay = $(document.createElement('div')), // NOTE: TODO: figure out how to place dialogOverlay inside of topbar to maintain modularity?

        dialogOverlay = $(LADS.Util.UI.blockInteractionOverlay()),


        thumbnailcaptured = $(document.createElement('div')),
        optionsBuffer = {};

    (function _createHTML() {
        functionsPanel.attr('id', 'tour-options');
        // Had to do tops and heights as CSS to prevent overlap on small screens
        functionsPanel.css({
            "height": "48px",
            "width": "13%",
            "left": "25%",
            "top": "27%",
            "position": "relative",
            "float": "left"
        });

        /**
         * Drop Down icon
         * Modified By: Hak
         */
        var addDropDownIconTourOptions = $(document.createElement('img'));
        addDropDownIconTourOptions.addClass("tourOptionDropDownIcon");
        addDropDownIconTourOptions.attr('src', 'images/icons/Down.png');
        addDropDownIconTourOptions.css({
            'top': '-5%', 'width': '7.5%', 'height': 'auto', 'margin-left': '5%', 'margin-bottom': '3%',
        });
        dropdownIcon = addDropDownIconTourOptions;

        // Additional options will go here once they exist
        addTourOptionsLabel = $(document.createElement('label'));
        addTourOptionsLabel.attr('id', 'addTourOptionsLabel');
        addTourOptionsLabel.text("Options");
        addTourOptionsLabel.css({
            "font-size": LADS.Util.getFontSize(190),
            "color": "rgb(256, 256, 256)"
        });
        addTourOptionsLabel.append(addDropDownIconTourOptions);
        functionsPanel.append(addTourOptionsLabel);

        // Dropdown menus:
        // Main section
        dropMain = $(document.createElement('div'));
        dropMain.css({
            "position": "absolute",
            "color": "rgb(256, 256, 256)",
            'background-color': 'rgba(0,0,0,0.85)',
            'left': '0',
            'width': '100%',
            'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex
        });
        functionsPanel.append(dropMain);
        dropMain.hide();

        // create the buttons to add various components
        var thumbnailButton = _addMenuItem('Capture Thumbnail', dropMain, 'thumbnailButton');
        var lengthButton = _addMenuItem('Change Tour Length', dropMain, 'tourLengthButton');
        var exportButton = _addMenuItem('Export Tour Data', dropMain, 'exportButton');

        /**
         * Creates component menu buttons
         * @param title         Name of button
         * @param component     DOM element to add button to
         * @param id            id to the element
         */
        function _addMenuItem(title, component, id) {
            var item = $(document.createElement('label'));
            item.addClass('optionItem');
            item.attr('id', id);
            item.text(title);
            item.css({
                "left": "0%",
                "position": "relative",
                "font-size": LADS.Util.getFontSize(170),
                "color": "rgb(256, 256, 256)",
                "display": "block",
                'padding': '4% 0 5% 0',
                'text-indent': '4%',
                'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex + 5
            });
            item.on('mousedown', function (evt) {
                evt.stopImmediatePropagation();
            });
            component.append(item);
            return item;
        }

        var menuVisible = false;
        //have the dropMain menu show/hide when clicked
        addTourOptionsLabel.click(function (event) {
            var close = timeline.getCloseMenu();
            if (close && close !== hideMenu) {
                close();
            }

            event.stopImmediatePropagation();

            menuVisible = !menuVisible;
            if (menuVisible) {
                timeline.setisMenuOpen(true);
                timeline.setCloseMenu(hideMenu);
                root.on('mousedown.topMenu', function (event) {
                    hideMenu();
                });

                $(dropdownIcon).css({
                    'transform': 'scaleY(-1)',
                    'margin-bottom': '3%'
                });
            }
            else {
                timeline.setisMenuOpen(false);
                timeline.setCloseMenu(hideMenu);
                root.off('mousedown.topMenu');

                $(dropdownIcon).css({
                    'transform': 'scaleY(1)',
                    'margin-bottom': '3%'
                });
            }
            dropMain.css('top', parseInt(addTourOptionsLabel.css('top'),10) + addTourOptionsLabel.height());
            dropMain.toggle();
        });
        addTourOptionsLabel.on('mousedown', function (evt) {
            evt.stopImmediatePropagation();
        });

        //the capture thumbnail confirmation
        var capturedmsg = $(document.createElement('label'));
        $(capturedmsg).text("Capturing Thumbnail...");
        capturedmsg.css({
            'text-align': 'center',
            'width': '100%',
            'font-size': '1.5em',
            'color': 'white'
        });
        thumbnailcaptured.append(capturedmsg);
        thumbnailcaptured.addClass("thumbnailcaptured");
        thumbnailcaptured.css({
            'background-color': 'black',
            'position': 'absolute',
            'left': '52%',
            'z-index': '1000',
            'display': 'none',
            'opacity': '0.8',
            'border': '2.8px double white'
        });

        /*capture the current viewer's thumbnail*/
        thumbnailButton.on('click', function () {
            var uiHeight = $('#resizableArea').height() + $('#topbar').height();
            thumbnailcaptured.css({ 'top': 0.53 * uiHeight + 'px' });

            //hide menu
            hideMenu();
            thumbnailcaptured.fadeIn('fast');
            //capture the thumbnail and upload it.
            var rinplayer = $('#rinplayer');
            html2canvas([rinplayer[0]], {
                onrendered: function (canvas) {
                    // no need for cropping anymore, since the rinplayer is always 9:16
                    //gets dataurl from tmpcanvas, ready to send to server!
                    var dataurl = canvas.toDataURL();
                    var imageURL = LADS.Worktop.Database.uploadImage(dataurl);
                    optionsBuffer.thumbnail = imageURL;
                    setTimeout(function () {
                        thumbnailcaptured.fadeOut();//alert msg disappear
                    }, 1000);
                },
                allowTaint: true, // allow imageES images in thumbnails, etc
            });
        });

        /*click function for inputtin new tour length*/
        lengthButton.on('click', function () {
            //hide menu
            hideMenu();

            dialogOverlay.fadeIn(500);
            // Set timeInput to the current length
            timeInput.val(timeManager.formatTime(timeManager.getDuration().end));

            timeInput.select();
            messageRow.text('');
        });

        // Tour Length Dialog
        // Overlay to darken out main UI

        // Actual dialog container
        var lengthDialog = $(document.createElement('div'));
        lengthDialog.attr('id', 'lengthDialog');

        ///
        dialogOverlay.css('z-index', '100000');


        var lengthDialogSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });

        lengthDialog.css({
            position: 'absolute',
            left: lengthDialogSpecs.x + 'px',
            top: lengthDialogSpecs.y + 'px',
            width: lengthDialogSpecs.width + 'px',
            height: lengthDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });

        dialogOverlay.append(lengthDialog);

        // Create a form to capture enter keypress
        var dialogForm = $(document.createElement('form'));
        dialogForm.attr('id', 'dialogForm');
        dialogForm.css({
            'margin-top': '4.5%',
        });
        lengthDialog.append(dialogForm);

        // updates the timeManager/timeinput related stats
        // when the length of tour is changed/submit button is clicked.
        dialogForm.on('submit', function () {
            var split = timeInput.val().split(':');
            var min = parseInt(split[0],10), sec = parseInt(split[1],10);
            var oldTime;
            var command;
            if (split.length == 1 && (min || min === 0) && min >= 0) { // In this case 'min' is actually seconds
                if (min > LADS.TourAuthoring.Constants.maxTourLength) {
                    messageRow.text('Tour length is too long. Maximum length of tour must be 15 minutes.');
                    messageRow.css({
                        color: 'white',
                        'width': '80%',
                        'left': '10%',
                        'font-size': '1.25em',
                        'position': 'absolute',
                        'text-align': 'center',
                        'margin-top': '3%',
                    });
                    timeInput.select();
                }
                else {
                    if (min < timeline.getLastDisplayTime()) { //check if new time is shorter than last display length, and limit it to that
                        min = timeline.getLastDisplayTime();
                    }
                    oldTime = timeManager.getDuration().end;
                    command = LADS.TourAuthoring.Command({
                        execute: function () {
                            timeManager.setEnd(min);

                        },
                        unexecute: function () {
                            timeManager.setEnd(oldTime);
                        }
                    });
                    command.execute();
                    undoManager.logCommand(command);
                    dialogOverlay.fadeOut(500);
                }
            } else if (split.length === 2 && (min || min === 0) && (sec || sec === 0) && min >= 0 && (typeof sec === "number") && sec >= 0 && sec <= 59) { // good format
                var newTime = min * 60 + sec;
                if (newTime > LADS.TourAuthoring.Constants.maxTourLength) {
                    messageRow.text('Tour length is too long. Maximum length of tour is 15 minutes.');
                    timeInput.select();
                }
                else {
                    if (newTime < timeline.getLastDisplayTime()) { //check if new time is shorter than last display length, and limit it to that
                        newTime = timeline.getLastDisplayTime();
                    }
                    oldTime = timeManager.getDuration().end;
                    command = LADS.TourAuthoring.Command({
                        execute: function () {
                            timeManager.setEnd(newTime);

                        },
                        unexecute: function () {
                            timeManager.setEnd(oldTime);
                        }
                    });
                    command.execute();
                    undoManager.logCommand(command);
                    dialogOverlay.fadeOut(500);
                }
            }
            else {
                messageRow.text('Please enter a valid length (MM:SS or seconds).');
                timeInput.select();
            }

            return false;
        });

        var dialogTitle = $(document.createElement('div'));
        dialogTitle.attr('id', 'dialogTitle');
        dialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word',
        });
        dialogTitle.text('Enter New Length (MM:SS): ');
        dialogForm.append(dialogTitle);

        var timeInput = $(document.createElement('input'));
        timeInput.attr('id', 'timeInput');
        timeInput.css({
            'position': 'relative',
        });
        dialogTitle.append(timeInput);
        dialogForm.append(document.createElement('br'));

        timeInput.on('keydown', function (ev) {
            ev.stopImmediatePropagation();
        });
        timeInput.on('keypress', function (ev) {
            ev.stopImmediatePropagation();
        });
        timeInput.on('keyup', function (ev) {
            ev.stopImmediatePropagation();
        });

        // Div for bad format message
        var messageRow = $(document.createElement('div'));
        messageRow.css({
            //color: 'white',
            //'font-size': '1.25em',
            //'margin-bottom': '10px',
            //'margin-left':'5%'

            color: 'white',
            'width': '80%',
            //'height': '15%',
            'left': '10%',
            //'top': '12.5%',
            'font-size': '1.25em',
            'position': 'absolute',
            'text-align': 'center',
            //'overflow': 'hidden',
            'margin-top': '3%',
        });
        dialogForm.append(messageRow);

        // Container for "save / cancel" buttons
        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            //'margin-top': '10px',
            //'text-align': 'left',

            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top': '50%'
        });
        dialogForm.append(buttonRow);


        //////////

        var buttonDiv = $(document.createElement("div"));
        buttonDiv.css('text-align', 'right');
        var emptyDiv = $(document.createElement("div"));
        emptyDiv.css('clear', 'both');
        var submitButton = $(document.createElement("button"));
        submitButton.text("Apply");
        submitButton.css({
            //'left': '4%',
            //'bottom': '10%',
            //'font-size': '140%',
            //'position': 'absolute',
            //'box-sizing': 'border-box',

            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            //'margin-top': '1%',
            'float': "right",
            'margin-right': '-3%',
            'margin-top': '15%',


        });
        var cancelButton = $(document.createElement('button'));
        cancelButton.attr('type', 'button');
        cancelButton.text("Cancel");
        cancelButton.css({
            //'right': '4%',
            //'bottom': '10%',
            //'font-size': '140%',
            //'position': 'absolute',
            //'box-sizing': 'border-box',

            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'absolute',//'relative',
            //'margin-top': '1%',
            //'margin-left': '7%',
            'margin-left': '-3%',
            'float': "left",
            'margin-top': '15%',
            'bottom': '1%'

            //'margin-top': '5%'
        });
        buttonRow.append(cancelButton);
        buttonRow.append(submitButton);
        buttonRow.append(emptyDiv);
        //renameDialog.append(buttonDiv);
        dialogForm.append(buttonRow);


        ////////////

        //creates all buttons and adds them to panel
        //var submitButton = $(document.createElement('button'));
        //submitButton.css({
        //    width: 'auto',
        //    border: '1px solid white',
        //    padding: '1%',
        //    'float':'right'
        //});
        //submitButton.text('Apply');
        //buttonRow.append(submitButton);

        //var cancelButton = $(document.createElement('button'));
        //cancelButton.attr('type', 'button');
        //cancelButton.css({
        //    width: 'auto',
        //    border: '1px solid white',
        //    padding: '1%',
        //});
        //cancelButton.text('Cancel');
        cancelButton.click(function () { dialogOverlay.fadeOut(500); });
        buttonRow.append(cancelButton);

        // export tour json to file



        exportButton.on("click", exportJSON);

        function exportJSON() {
            var date = Date.now();
            var json = timeline.toRIN(true);
            var json_str = JSON.stringify(json);
            var url = "http://553d4a03eb844efaaf7915517c979ef4.cloudapp.net/rinjsTag/";
            var html_content = '<!doctype html><html><head>';
            html_content+='<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
            html_content+='<meta http-equiv="X-UA-Compatible" content="IE=10" />';
            html_content+='<meta name="viewport" content="width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no">';
            html_content+='<title>Rich Interactive Narratives</title>';
            html_content+='<style type="text/css">html, body, #rinPlayer{position:absolute;top:0;right:0;bottom:0;left:0;margin:0;padding:0;overflow:hidden;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-ms-touch-action:none;-webkit-touch-callout:none;-ms-content-zooming:none;}</style>';
            html_content+='<script src="'+url+'lib/rin-core-1.0.js" type="text/javascript"></script>';
            html_content+='<script src="'+url+'lib/tagInk.js" type="text/javascript"></script>';
            html_content+='<script src="'+url+'lib/raphael.js" type="text/javascript"></script>';
            html_content+='<script src="'+url+'lib/seadragon-0.8.9-rin.js" type="text/javascript"></script>';
            html_content+='<script>function parseDeepState(){var playerElement=document.getElementById("rinPlayer");var playerControl=rin.getPlayerControl(playerElement);var deepstateUrl=playerControl.resolveDeepstateUrlFromAbsoluteUrl(window.location.href);if(deepstateUrl){playerControl.load(deepstateUrl);}}</script>';
            html_content+='</head>';
            html_content += '<body onload="rin.processAll(null, ' + "'" + url + "'" + ').then(parseDeepState);">';
            html_content += '<div id="rinPlayer" class="rinPlayer" style="width: 100%;height: 100%;margin: 0;padding: 0;overflow: hidden;" data-src="./TourData' + date + '.txt" data-options="autoplay=false&loop=true&systemRootUrl=' + url + '"></div>';

            //html_content+='<div id="rinPlayer" class="rinPlayer" style="width: 100%;height: 100%;margin: 0;padding: 0;overflow: hidden;" data-src="'+url+'narratives/AIDSQuilt/narrative.js" data-options="autoplay=false&loop=true&systemRootUrl='+url+'"></div>';
            html_content+='</body></html>';
            var messageBox;
            hideMenu();
            
            Windows.Storage.KnownFolders.picturesLibrary.createFileAsync("TourData" + date + ".txt").then(
                function (file) {
                    Windows.Storage.FileIO.writeTextAsync(file, json_str).done(function () {
                        messageBox = LADS.Util.UI.popUpMessage(null, "Tour data file created in your Pictures Library.", null);
                        $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                        $('body').append(messageBox);
                        $(messageBox).fadeIn(500);
                    });
                }
            );
            //Windows.Storage.KnownFolders.picturesLibrary.createFileAsync("TourPlayer" + date + ".html").then(
            //    function (file) {
            //        Windows.Storage.FileIO.writeTextAsync(file, html_content).done(function () {
            //            messageBox = LADS.Util.UI.popUpMessage(null, "Tour player file created in your Pictures Library.", null);
            //            $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
            //            $('body').append(messageBox);
            //            $(messageBox).fadeIn(500);
            //        });
            //    }
            //);
        }

        /*the helper function to hide menus when an option is clicked*/
        function hideMenu() {
            $('.tourOptionDropDownIcon').css({ 'transform': 'scaleY(1)', 'margin-bottom': '0%' });
            menuVisible = false;
            dropMain.hide();
        }

    })();
    function applyCSS(css) {
        functionsPanel.css(css);
    }
    that.applyCSS = applyCSS;

    function applyLabelCSS(css) {
        addTourOptionsLabel.css(css);
    }
    that.applyLabelCSS = applyLabelCSS;

    function addToDOM(container) {
        container.append(functionsPanel).append(dialogOverlay);
        container.append(functionsPanel).append(thumbnailcaptured);
    }
    that.addToDOM = addToDOM;

    function getBufferedData() {
        var returndata = optionsBuffer;
        optionsBuffer = {};
        return returndata;
    }
    that.getBufferedData = getBufferedData;

    return that;
};
