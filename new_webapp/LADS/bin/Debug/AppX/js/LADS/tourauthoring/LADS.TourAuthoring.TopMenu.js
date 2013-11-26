LADS.Util.makeNamespace('LADS.TourAuthoring.TopMenu');

/**
 * Main menu for Tour Authoring
 * Back button, rename tour controls, save button, tour options
 * @param spec      not used
 * @param my        not used
 */
LADS.TourAuthoring.TopMenu = function (spec, my) {
    "use strict";

    var that = {},
        viewer = spec.viewer,
        undoManager = spec.undoManager,
        timeline = spec.timeline,
        timeManager = spec.timeManager,
        tourobj = spec.tourobj,
        root = spec.root,
        componentControls = spec.componentControls,
        topbar = $(document.createElement('div')),
        //dialogOverlay = $(document.createElement('div')), // NOTE: TODO: figure out how to place dialogOverlay inside of topbar to maintain modularity?

        dialogOverlay = $(LADS.Util.UI.blockInteractionOverlay()),
        //backDialogOverlay = $(document.createElement('div'));
        backDialogOverlay = $(LADS.Util.UI.blockInteractionOverlay());

    (function _createHTML() {
        topbar.css({ "background-color": "rgb(63,55,53)", "height": "8%", "width": "100%" });
        topbar.attr('id', 'topbar');

        var buttonHeight = $(window).height() * 0.0504; // matches effective % size from SettingsView
        var backButtonArea = $(document.createElement('div'));
        backButtonArea.css({
            "top": "18.5%",
            'margin-left': '1.2%',
            'height': '63%',
            "width": buttonHeight + 'px',
            "position": "relative",
            "float": "left"
        });
        var backButton = $(document.createElement('img'));
        backButton.attr('src', 'images/icons/Back.svg');
        backButton.css({ 'width': '100%', 'height': '100%' });

        backButton.mousedown(function () {
            LADS.Util.UI.cgBackColor("backButton", backButton, false);
        });

        backButton.mouseleave(function () {
            LADS.Util.UI.cgBackColor("backButton", backButton, true);
        });

        //save method saves all changes made
        var saveClicked = false;
        var nameChanged = false;
        function save() {
            console.log("isUploading === " + componentControls.getIsUploading());
            saveClicked = true;
            nameChanged = false;
            if ($("#inkEditText").css('display') !== "none") {
                componentControls.saveText();
            }
            else if ($("#inkEditDraw").css('display') !== "none") {
                componentControls.saveDraw();
            }
            else if ($("#inkEditTransparency").css('display') !== "none") {
                componentControls.saveTrans();
            }
            timeline.hideEditorOverlay();

            undoManager.setPrevFalse();//method sets savedState of top element of undoStack to true to indicate further prompt for saving is not required on leaving page
            var xml = LADS.Worktop.Database.getDoqXML(tourobj.Identifier);
            var parser = new DOMParser();
            var tourXML = $(parser.parseFromString(xml, 'text/xml'));
            //change name
            tourXML.find('Name').text(LADS.Util.encodeXML($(textArea).val()));
            // bmost: Fix description.  For some reason the &gt; and &lt; escape
            // characters get parsed back to < > at some point.
            tourXML.find("d3p1\\:Key:contains('Description') + d3p1\\:Value").text(LADS.Util.encodeXML(tourXML.find("d3p1\\:Key:contains('Description') + d3p1\\:Value").text()));
            //change content, the json object
            var tourjsonn = timeline.toRIN(true);
            var rinstring = escape(JSON.stringify(tourjsonn));
            tourXML.find("d3p1\\:Key:contains('Content') + d3p1\\:Value").text(rinstring);
            var related = timeline.getRelatedArtworks();
            tourXML.find("d3p1\\:Key:contains('RelatedArtworks') + d3p1\\:Value").text(JSON.stringify(related));
            //change thumbnail
            var optionsBuffer = tourOptions.getBufferedData();
            if (optionsBuffer.thumbnail) {
                tourXML.find("d3p1\\:Key:contains('Thumbnail') + d3p1\\:Value").text(optionsBuffer.thumbnail);
            }

            LADS.Worktop.Database.pushXML(tourXML[0], tourobj.Identifier, "Tour", function () {
                dialogOverlay.fadeOut(500);     
            }, function () {
                dialogOverlay.hide();       
                var popup = LADS.Util.UI.popUpMessage(null, "Tour not saved.  You must log in to save changes.");
                $('body').append(popup);
                $(popup).show();
            }, function () {
                dialogOverlay.hide();
                var popup = LADS.Util.UI.popUpMessage(null, "Tour not saved.  There was an error contacting the server.");
                $('body').append(popup);
                $(popup).show();
            });     
        }
        // Takes you back to the tour authoring menu page
        function goBack() {
            var messageBox;
            // first, make sure that a tour reload isn't in progress
            if (viewer.getIsReloading()) {
                messageBox = LADS.Util.UI.popUpMessage(null, "Tour reload in progress. Please wait a few moments.", null);
                $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(messageBox);
                $(messageBox).fadeIn(500);
                return;
            }
            backButton.off('click');
            $('.rightClickMenu').hide();//shuts the menu that appears on right clicking on a track
            var tempSettings = new LADS.Authoring.NewSettingsView('Tours', null, null, tourobj.Identifier);
            viewer.stop();
            viewer.unload();
            LADS.Util.UI.slidePageRight(tempSettings.getRoot());
        }
        backDialogOverlay.attr('id', 'backDialogOverlay');
        backDialogOverlay.css({
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,0.6)',
            'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex,
            //'height': '30%',
            //'width': '45%',
            //'position': 'fixed',
            //'top': '50%',
            //'left': '50%',
            //'margin-top': '-15%',
            //'margin-left': '-22.5%',
            //'background-color': 'black',
            //'z-index': LADS.TourAuthoring.aboveRinZIndex+5,
            //'border': '3px double white',
        });
        // Actual dialog container for when back button is pressed
        var backDialog = $(document.createElement('div'));
        backDialog.attr('id', 'backDialog');

        ///new css
        var backDialogSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
        backDialog.css({
            position: 'absolute',
            left: backDialogSpecs.x + 'px',
            top: backDialogSpecs.y + 'px',
            width: backDialogSpecs.width + 'px',
            height: backDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });

        backDialogOverlay.append(backDialog);
        var backDialogTitle = $(document.createElement('div'));
        backDialogTitle.attr('id', 'backDialogTitle');
        //var fontsize = LADS.Util.getMaxFontSizeEM('Entering authoring mode, please enter password.', 0.8, 0.8 * loginDialog.width(), 0.2 * loginDialog.height(), 0.05);
        backDialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
           // 'overflow': 'hidden',
            'word-wrap':'break-word',
        });

        backDialog.append(backDialogTitle);
        backDialog.append(document.createElement('br'));
         
        var backButtonRow = $(document.createElement('div'));
        backButtonRow.css({
            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top':'40%'
        });

        var backSaveButton = $(document.createElement('button'));
        backSaveButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
        });
        backSaveButton.text('Save');

        $(backSaveButton).click(function () {
            save();
            goBack();
        });

        backButtonRow.append(backSaveButton);

        var backDontSaveButton = $(document.createElement('button'));
        backDontSaveButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'left': '20%'

        });
        backDontSaveButton.text('Don\'t Save');
        $(backDontSaveButton).click(function () {
            goBack();
        });

        backButtonRow.append(backDontSaveButton);

        var backCancelButton = $(document.createElement('button'));
        backCancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'float': 'right'
        });
        backCancelButton.text('Cancel');
        backCancelButton.click(function () { backDialogOverlay.fadeOut(500); });
        backButtonRow.append(backCancelButton);

        backDialog.append(backButtonRow);

        backButton.click(function () {
            var messageBox;

            $('.rightClickMenu').hide();//shuts the menu that appears on right clicking on a track

            if (viewer.getIsReloading()) {
                messageBox = LADS.Util.UI.popUpMessage(null, "Tour reload in progress. Please wait a few moments.", null);
                $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(messageBox);
                $(messageBox).fadeIn(500);
                return;
            }

            if (nameChanged || (undoManager.dirtyStateGetter() === false) || 
                (componentControls.getInkUndoManager() && (componentControls.getInkUndoManager().dirtyStateGetter() === false) /*&& (componentControls.getInkUndoManager().undoStackSize() != 0)*/)) {
                backDialogOverlay.fadeIn(500);
                if (textArea.val().length === 0) {
                    textArea.val('Untitled Tour 1');
                }
                backDialogTitle.text('Save changes to ' + $(textArea).val() + ' before leaving?');
            }
            else {
                goBack();
            }


       });
        backButtonArea.append(backButton);
        topbar.append(backButtonArea);

        // Title text area, users can retype and redefine title name
        var textArea = $(document.createElement('input'));
        textArea.type = "text";

        var textAreaSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
            center_v: true,
            width: 0.2,
            height: 0.5,
            x_offset: 0.05,
            x_max_offset: 60,
        });
        textArea.css({
            'margin-left': '3%',
            'position': 'absolute',
            'border': '3px solid',
            'border-color': '#666666',
            top: textAreaSpecs.y - 7 + 'px',
            'left': textAreaSpecs.x + 'px',
            width: textAreaSpecs.width + 'px',
            height: textAreaSpecs.height + 'px',
        });

        textArea.attr({
            display: 'block',
            type: 'text',
            id: 'textArea',
            name: 'textArea',
            value: tourobj.Name
        });

        textArea.on('keydown', function (ev) {
            ev.stopImmediatePropagation();
        });
        textArea.on('keypress', function (ev) {
            ev.stopImmediatePropagation();
        });
        textArea.on('keyup', function (ev) {
            nameChanged = true;
            ev.stopImmediatePropagation();
        });

        topbar.append(textArea);

        // NOTE: save button click event handler is below dialog code
        var saveButton = $(document.createElement("button"));
        saveButton.text("Save Changes");
        saveButton.attr('type', 'button');

        var saveButtonSpecs = LADS.Util.constrainAndPosition($(window).width() * 0.8, $(window).height() * 0.08,
        {
            center_v: true,
            width: 0.1,
            height: 0.5,
        });
        var fontsize = LADS.Util.getMaxFontSizeEM('Save Changes', 0.2, 0.75 * saveButtonSpecs.width, 0.75 * saveButtonSpecs.height, 0.01);
        saveButton.css({
            "color": "white",
            "border-color": "white",
            'position': 'absolute',
            width: saveButtonSpecs.width + 'px',
            height: saveButtonSpecs.height + 'px',
            'top': saveButtonSpecs.y + 'px',
            'font-size': fontsize,
            'left': parseInt(textArea.css('left'),10) + textArea.width() + 45 + ($(window).width() * 0.022) + 'px',
        });
        
        topbar.append(saveButton);


        /*save button dialog code*/
        // Overlay to darken out main UI
        dialogOverlay.attr('id', 'dialogOverlay');
        dialogOverlay.css({
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
        var saveDialog = $(document.createElement('div'));
        saveDialog.attr('id', 'saveDialog');

        var saveDialogSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
        saveDialog.css({
            position: 'absolute',
            left: saveDialogSpecs.x + 'px',
            top: saveDialogSpecs.y + 'px',
            width: saveDialogSpecs.width + 'px',
            height: saveDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });
        dialogOverlay.append(saveDialog);
        var dialogTitle = $(document.createElement('div'));
        dialogTitle.attr('id', 'dialogTitle');
        //var fontsize = LADS.Util.getMaxFontSizeEM('Entering authoring mode, please enter password.', 0.8, 0.8 * loginDialog.width(), 0.2 * loginDialog.height(), 0.05);
        dialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            //'overflow': 'hidden',
            'word-wrap': 'break-word',
        });

        saveDialog.append(dialogTitle);
        saveDialog.append(document.createElement('br'));

        // Container for "save / cancel" buttons
        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top': '40%'
        });
        saveDialog.append(buttonRow);

        // TODO: Hook in save-to-server functionality here!
        var submitButton = $(document.createElement('button'));
        submitButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
        });
        submitButton.text('Save');
        submitButton.click(function () { save(); });

        buttonRow.append(submitButton);

        var cancelButton = $(document.createElement('button'));
        cancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'float': 'right'
        });
        cancelButton.text('Cancel');
        cancelButton.click(function () { dialogOverlay.fadeOut(500); });
        buttonRow.append(cancelButton);
        
        //save button click event handler
        saveButton.click(function () {
            $('.rightClickMenu').hide();//shuts the menu that appears on right clicking on a track
            dialogOverlay.fadeIn(500);
            if (textArea.val().length === 0) {
                textArea.val('Untitled Tour 1');
            }
            dialogTitle.text('Save changes to ' + textArea.val() + '?');
        });

        //topbar.append(buttonPanel);

        // Tour Options dropdown
        var tourOptions = LADS.TourAuthoring.TourOptions({
            timeManager: timeManager,
            timeline: timeline,
            root: root,
            undoManager: undoManager
        });
        tourOptions.addToDOM(topbar);
        var tourOptionsSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
            center_v: true,
            width: 0.13,
            height: 0.8,
        });
        var tourOptionsFontSize = LADS.Util.getMaxFontSizeEM('Options', 0.5, tourOptionsSpecs.width * 0.8, tourOptionsSpecs.height * 0.7, 0.01);
        var optionsLabelSpecs = LADS.Util.constrainAndPosition(tourOptionsSpecs.width, tourOptionsSpecs.height, {
            center_v: true,
            width: 0.8,
            height: 0.8,
        });

        tourOptions.applyCSS(
            {
                "height": tourOptionsSpecs.height + "px",
                "width": tourOptionsSpecs.width + 'px',
                "left": "60%",
                'top': tourOptionsSpecs.y + 'px',
                "position": 'absolute',
            });

        tourOptions.applyLabelCSS(
            {
                'height': optionsLabelSpecs.height + 'px',
                'width': optionsLabelSpecs.width + 'px',
                'left': 0 + 'px',
                'top': optionsLabelSpecs.y + 'px',
                "position": 'absolute',
                'font-size': tourOptionsFontSize,
            });

        // Page header (not user's tour title)
        var topBarLabel = $(document.createElement('div'));
        var topBarLabelSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
            width: 0.4,
            height: 0.9,
        });
        topBarLabel.css({
            'margin-right': '2%',
            'margin-top': 8 * 0.04 + '%',
            'color': 'white',
            'position': 'absolute',
            'text-align': 'right',
            'right': '0px',
            'top': '0px',
            'height': topBarLabelSpecs.height + 'px',
            'width': topBarLabelSpecs.width + 'px',
        });

        var fontsizeTop = LADS.Util.getMaxFontSizeEM('Tour Authoring', 0.5, topBarLabelSpecs.width, topBarLabelSpecs.height * 0.85);
        topBarLabel.css({ 'font-size': fontsizeTop });

        topBarLabel.text('Tour Authoring');

        topbar.append(topBarLabel);

        //topbar.append(tourLabel);
    })();

    function addToDOM(container) {
        container.append(topbar).append(dialogOverlay).append(backDialogOverlay);
    }
    that.addToDOM = addToDOM;

    return that;
};