LADS.Util.makeNamespace('LADS.TourAuthoring.Track');
LADS.Util.makeNamespace('LADS.TourAuthoring.TrackType');


// Enum defining track types
LADS.TourAuthoring.TrackType = {
    audio: 1,
    video: 2,
    artwork: 3,
    ink: 4,
    image: 5,
};

/**
 * Represents all the displays and keyframes of a piece of media over the duration of a tour
 * Maps to Experience Stream in RIN
 * @param spec.type         one of LADS.TourAuthoring.TrackType
 * @param spec.media        URI of resource
 * @param spec.title        Name to display
 * @param spec.id           Unique id (number)
 * @param spec.guid         Worktop GUID, artworks only
 * @param spec.timeManager  Reference to time object storing current length and scale of timeline
 * @param my                Object that will hold keyframes and displays (for accessing by subclasses w/o making public)
 *                          Will be returned w/ 'displays', 'resource', 'type', 'timeManager', 'undoManager', 'track', 'svg' parameters
 *                          Also used to track currentDisplay, currentKeyframe on mousedown, selectedKeyframe for keyframe capture (set in displays and keyframes)
 */
LADS.TourAuthoring.Track = function (spec, my) {
    "use strict";

    var that = {},
        media = spec.media,
        trackarray = spec.trackarray,//stores each 'track' that is inserted into the editer/timeline
        id = ('Track-' + spec.id),
        arrayPos = spec.id,//stores the position of the selected track in the 'trackarray' array
        guid = spec.guid,
        playbackControls = spec.playbackControls,
        titlediv, // for track minimization
        titleDivManip = false,//variable used to determine when a track has been selected for vertical movement/swapping with another track 
        prevTrack = {},
        trackBody,
        prevTitleDiv = {},
        renameOverlay = $(LADS.Util.UI.blockInteractionOverlay()), //overlay for when 'rename' component option is selected
        deleteOverlay = $(LADS.Util.UI.blockInteractionOverlay()),
        editInkOverlay = $(LADS.Util.UI.blockInteractionOverlay()), //overlay for when 'edit ink' component option is selected while playhead is not over the art track
        beforeTitle = null,
        spaceBefore = false,
        fadeHidden = true,
        lastScale,
        isMinimized = false,
        //attachedInks = [],
        mygroup; // group that contains svg lines for audio tracks only - used by track minimization


    my = my || {};
    my.title = spec.title;
    my.resource = 'R-' + arrayPos;
    my.root = spec.root;
    my.type = spec.type || LADS.TourAuthoring.TrackType.artwork;
    my.timeManager = spec.timeManager;
    my.undoManager = spec.undoManager;
    my.update = spec.update; // Call this function every time a change affecting RIN data is made
    my.timeline = spec.timeline;
    my.dirtyKeyframe = false;//keeps track of when a new keyframe has been added to a track
    my.that = that;
    my.selectedTrack = spec.selectedTrack;
    my.mediaLength = spec.mediaLength;
    my.isVisible = true;
    my.attachedInks = [];
    
    lastScale = my.timeManager.getDuration().scale;

    // private variables
    my.displays = [];
    // A variable to store all the keyframes for the audio track : Hak
    my.allKeyframes = [];

    // HTML creation
    
    // Title for header
    var titledivPlaceholder,
        titleText,
        movingIndicator,//variable to keep track of when the white bar indicating if a track can be swapped with a selected track should appear on the titledivs
        compOpsOpen = false,//keeps track of when the 'component options' menu which appears on right clicking on  track is open or not
        eventsPaused = false;
    that.compOpsOpen = compOpsOpen;

    (function _initTitle() {
        titlediv = $(document.createElement('div'));
        titlediv.attr('id', id + '-title');
        titlediv.addClass('titlediv');
        titlediv.css({
            "height": LADS.TourAuthoring.Constants.trackHeight+'px',
            "width": 0.127 * $(window).width() + 'px',
            'margin-left': '20px',
            'left': '0%',
            'position': 'relative',
            "background-color": "rgb(105,89,89)", 
            'border-bottom-style': 'solid',
            'border': '1px solid #888',
            'top': '0px',
            'overflow': 'hidden',
            'z-index': 0,
        });

        titleText = $(document.createElement('div'));
        titleText.addClass('track-title');
        titleText.text(my.title);
        titleText.css({
            'font-size': '1.25em',
            'color': 'white',
            'top': '11%', 'left': '3%',
            'position': 'relative',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
            'display': 'block',
            'width': 0.115*$(window).width() + 'px',
        });
        titlediv.append(titleText);
    })();
    
    // Track container
    my.track = $(document.createElement('div'));
    (function _initTrack() {
        my.track.attr('id', id);
        my.track.addClass('track');
        my.track.css({
            "height": LADS.TourAuthoring.Constants.trackHeight + 'px', // changed 25%
            'position': 'relative',
            'top': '0%',
            'left': '0%',
            "background-color": "rgb(255, 255, 255)",
            'border': '1px solid #888',
            "box-shadow": "5px 0px 10px -2px #888 inset"
        });

        var _trackSizing = function (ev) {
            my.track.css('width', my.timeManager.timeToPx(ev.end) + 'px');
        };
        _trackSizing(my.timeManager.getDuration());
        my.timeManager.onSizing(_trackSizing);

        // SVG
        my.svg = d3.select(my.track[0])
            .append("svg")
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('overflow', 'hidden')
            .attr('style', 'position: absolute');

        // Gradient definitions
        var defs = my.svg.append('defs');
        defs.append('linearGradient')
            .attr('id', 'fade-in')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
            .call(
                function (gradient) {
                    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgb(256,256,256)').attr('stop-opacity', '0.75');
                    gradient.append('stop').attr('offset', '85%').attr('stop-color', LADS.TourAuthoring.Constants.displayColor).attr('stop-opacity', '0.75');
                });
        defs.append('linearGradient')
            .attr('id', 'fade-out')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
            .call(
                function (gradient) {
                    gradient.append('stop').attr('offset', '15%').attr('stop-color', LADS.TourAuthoring.Constants.displayColor).attr('stop-opacity', '0.75');
                    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgb(256,256,256)').attr('stop-opacity', '0.75');
                });
        defs.append('linearGradient')
            .attr('id', 'fade-in-ink')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
            .call(
                function (gradient) {
                    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgb(256,256,256)').attr('stop-opacity', '0.75');
                    gradient.append('stop').attr('offset', '85%').attr('stop-color', LADS.TourAuthoring.Constants.inkDisplayColor).attr('stop-opacity', '0.75');
                });
        defs.append('linearGradient')
            .attr('id', 'fade-out-ink')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
            .call(
                function (gradient) {
                    gradient.append('stop').attr('offset', '15%').attr('stop-color', LADS.TourAuthoring.Constants.inkDisplayColor).attr('stop-opacity', '0.75');
                    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgb(256,256,256)').attr('stop-opacity', '0.75');
                });


        // HK: Where the displays will be drawn
        my.svgDisplays = my.svg.append("svg:g")
            .classed("displayDrawing", true);

        // HK: Where the lines will be drawn
        my.svgLines = my.svg.append("svg:g")
            .classed("connectionLines", true);

        // HK: Draws the initial line for the audio track to distinguish it as an audio track
        if (my.type == LADS.TourAuthoring.TrackType.audio) {
            mygroup = my.svgLines.append("svg:g")
                .attr("id", "keyframeLines");
            var myLine = mygroup.append("svg:line")
                .attr("x1", 0)
                .attr("y1", (100 - LADS.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .attr("x2", '100%')
                .attr("y2", (100 - LADS.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .style('pointer-events', 'none')
                .style("stroke", "green")
                .style("stroke-width", 4);
        }
    })();

    var menu = LADS.TourAuthoring.EditorMenu({
        type: LADS.TourAuthoring.MenuType.track,
        parent: that
    }, my);
    (function _initMenu() {
        menu.addTitle('Track Options');
        menu.addButton('Rename', 'left', componentOptionRename);
        if (my.type === LADS.TourAuthoring.TrackType.ink) {
            menu.addButton('Edit Ink', 'left', componentOptionEditInk);
        }
        menu.addButton('Duplicate', 'left', componentOptionDuplicate);
        menu.addButton('Delete', 'left', componentOptionDelete);
        menu.addButton('Cancel', 'left', componentOptionCancel);
    })();

    function close() {
        menu.forceClose();
    }

    function displayError(displayString) {
        close();
        var messageBox = LADS.Util.UI.popUpMessage(null, displayString, null);
        $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
        $('body').append(messageBox);
        $(messageBox).fadeIn(500);

        var currSelection = my.selectedTrack.current;
        if (currSelection) {
            currSelection.setDeselected();
        }
    }
    
    //method for manipulating ink canvas
    function componentOptionEditInk(evt) {
        var i;

        if ($("#inkDrawControls").css("display") == "block" || $("#inkTransparencyControls").css("display") == "block" || $("#inkTextControls").css("display") == "block" || $("#inkEditDraw").css("display") == "block" || $("#inkEditTransparency").css("display") == "block" || $("#inkEditText").css("display") == "block") {
            displayError("An ink is already being edited.");
            return;
        }

        if (!my.displays.length) {
            displayError("The ink must be visible in the preview window in order to edit it.");
            return;
        }

        var inArtDisplay = true; //keeps track of if playhead is in art display
        var currTime = my.timeManager.getCurrentTime();

        if (getInkEnabled()) {
            var currTrack = getInkLink(),
                trackdisplays = currTrack.getDisplays();
            for (i = 0; i < trackdisplays.length; i++) {
                if ((trackdisplays[i].getStart() <= currTime) && (currTime <= trackdisplays[i].getOutStart() + trackdisplays[i].getFadeOut())) {
                    inArtDisplay = true;
                    break;
                }
                inArtDisplay = false;
            }
        }

        var inInkDisplay = false;//keeps track of if playhead is in ink display
        var closestTime = -1000000;

        // ******************************************************************
        // TODO: convert array to a tree for easy search between time ranges
        // ******************************************************************

        for (i = 0; i < my.displays.length; i++) {
            if (my.displays[i].getStart() <= currTime && currTime <= my.displays[i].getOutStart() + my.displays[i].getFadeOut()) {
                //inside the end of the fade-out and the start of the fade-in
                inInkDisplay = true;
                break;
            }
        }

        //ensures warning message appears if user tries to edit an ink without the playhead being inside artwork and ink, ink or artwork
        if ((!inInkDisplay) || (!inArtDisplay)) {
            displayError("The ink must be visible in the preview window in order to edit it.");
            return;
        }

        my.timeManager.stop();
        var old_datastring = that.getInkPath();
        var inkType = old_datastring.split("::")[0].toLowerCase();
        close();

        if (!old_datastring || !inkType) {
            displayError("This ink track has become corrupted, please remove and create a new ink.");
            return;
        }


        var ES = $("[ES_ID='" + my.title + "']");
        if (!ES[0]) {
            displayError("The ink must be visible in the preview window in order to edit it.");
            return;
        }

        //that.setInkPath("");
        my.isVisible = false;

        if (inkType === "path") { //edit draw ink
            my.timeline.showEditDraw(that, old_datastring);
        }
        else if (inkType === "trans") { //edit transparency
            var transType = old_datastring.split("[mode]")[1].split("[")[0];
            my.timeline.showEditTransparency(that, old_datastring, transType);
        }
        else if (inkType === "text") { //edit text
            var text_elt = ES.find('text');
            var viewBox = text_elt[0] ? ES.find('svg')[0].getAttribute('viewBox') : null;
            if (!text_elt[0] || (getInkEnabled() && !viewBox)) {
                my.isVisible = true;
                displayError("The ink must be loaded and on screen in order to edit it.");
                return;
            }
            var rinplayer = $('#rinplayer');
            var dims = {
                x: text_elt.offset().left - rinplayer.offset().left,
                y: text_elt.offset().top - rinplayer.offset().top,
                w: text_elt[0].getBBox().width,
                h: text_elt[0].getBBox().height,
                fontsize: getInkEnabled() ? parseFloat(text_elt.attr("font-size")) * (rinplayer.height() / parseFloat(viewBox.split(" ")[3])) : null
            };
            my.timeline.showEditText(that, old_datastring, dims);
        } else {
            my.isVisible = true;
            displayError("This ink track is in a deprecated format, please remove and create a new ink.");
            return;
        }

        var currSelection = my.selectedTrack.current;
        if (currSelection) {
            currSelection.setDeselected();
        }
        
        //show overlay to make all tracks non-clickable when edit ink
        if (my.isVisible === true)
            return;
        my.timeline.showEditorOverlay();
    }
    
    //method for handling rename
    function componentOptionRename(evt) {
        menu.close();
        var renameDialog = $(document.createElement("div"));
        renameDialog.attr("id", "renameDialog");


        ///new css
        var renameDialogSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
        renameDialog.css({
            position: 'absolute',
            left: renameDialogSpecs.x + 'px',
            top: renameDialogSpecs.y + 'px',
            width: renameDialogSpecs.width + 'px',
            height: renameDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });

        renameOverlay.append(renameDialog);
        var renameDialogTitle = $(document.createElement('div'));
        renameDialogTitle.attr('id', 'renameDialogTitle');
        renameDialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word',
        });


        //renameDialog.css({
        //    'height': '30%',
        //    'width': '45%',
        //    'position': 'fixed',
        //    'top': '50%',
        //    'left': '50%',
        //    'margin-top': '-15%',
        //    'margin-left': '-22.5%',
        //    'background-color': 'black',
        //    'z-index': LADS.TourAuthoring.aboveRinZIndex+5,
        //    'border': '3px double white',
        //});
         
        //renameOverlay.append(renameDialog);
        $("body").append(renameOverlay);
        my.timeManager.stop();
        renameOverlay.fadeIn(500);
        var form = $(document.createElement("form"));
        var newName = $(document.createElement("input"));
        form.css("text-align", 'left');
        newName.attr("type", "text");
        newName.css("margin", '4% 4%');
        newName.css("width", '100%'); 
        newName.attr("id","newNameInput"); 
        newName.val(my.title); // default text is existing title
        var text = $(document.createElement("div"));
        //newName.attr('maxlength', '18');
        text.text("Rename track to: ");
        text.css({
            //'top': '5%',
            //'height': '20%',
            //'width': '90%',
            //'color': 'white',
            //'margin': '5%',
            //'font-size': '200%'

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
        form.append(text);

        form.append(newName);
        renameDialog.append(form);
        newName.css({
            'width': '80%',
            'margin-left': '10%',
            'margin-right': '10%',
            'margin-top':'10%',//'10%',
            'box-sizing': 'border-box',
            'position':'relative',
            //width: 92%; margin-left: 4%; box-sizing: border-box;

        });
        var buttonDiv = $(document.createElement("div"));
        buttonDiv.css('text-align', 'right');
        var emptyDiv = $(document.createElement("div"));
        emptyDiv.css('clear', 'both');
        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            //'margin-top': '10px',
            //'text-align': 'center',

            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',


        });
        buttonDiv.append(buttonRow);
        var ok = $(document.createElement("button"));
        ok.text("Apply");
        ok.css({
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
            'margin-right': '7%',
            'margin-top': '5%',
                        

        });
        buttonRow.append(ok);
        var cancel = $(document.createElement('button'));
        cancel.attr('type', 'button');
        cancel.text("Cancel");
        cancel.css({
         

            //'right': '4%',
            //'bottom': '10%',
            //'font-size': '140%',
            //'position': 'absolute',
            //'box-sizing': 'border-box',

            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            //'margin-top': '1%',
            'margin-left': '7%',
            'float': "left",
            'margin-top': '5%',
        });
        //buttonDiv.append(cancel);
        //buttonDiv.append(ok);
        buttonDiv.append(emptyDiv);
        buttonRow.append(cancel);
        //renameDialog.append(buttonDiv);
        renameDialog.append(buttonRow);
        renameDialog.show();
        close();

        ok.click(okTap);
        cancel.click(function () {
            renameOverlay.fadeOut(500);
            $(renameOverlay).remove();
        });
        
        $(document).keypress(function (e) {
            if (e.which == 13) {
                okTap(e);
            }
        });

        function okTap(evt) {
            $(renameOverlay).fadeOut(500);
            var tmpTitle = that.getTitle();
            that.setTitle(newName.val().replace(/\'/g, '').replace(/\"/g, ''));
            //renameDialog.remove();
            $(renameOverlay).remove();
            //bleveque: if we change the title of an artwork or image  track, update the links of any attached inks
            if (my.type == LADS.TourAuthoring.TrackType.artwork || my.type == LADS.TourAuthoring.TrackType.image) {
                for (var ii = 0; ii < trackarray.length; ii++) {
                    if (trackarray[ii].getType() == LADS.TourAuthoring.TrackType.ink && trackarray[ii].getInkEnabled() && trackarray[ii].getInkLink().getTitle() == that.getTitle()) {
                        trackarray[ii].setInkLink(that);
                    }
                }
            }
            
        }
        var currSelection = my.selectedTrack.current;
        if (currSelection) {
            currSelection.setDeselected();
        }
    }
    function componentOptionDuplicate(evt) { // creates a duplicate track underneath
        menu.close();
        var currTrack = that;
        var undoStackSize = my.undoManager.undoStackSize();
        var displays = currTrack.getDisplays(); // each has access to its keyframes
        var media = currTrack.getMedia();
        var pos = currTrack.getPos();
        var name = currTrack.getTitle();
        var keyframes, e, inFade, outFade, key; // e is the new track
        switch (currTrack.getType()) {
            case LADS.TourAuthoring.TrackType.audio:
                e = my.timeline.addAudioTrack(media, name, pos, my.mediaLength);
                addTracksDisplays(e);
                break;

            case LADS.TourAuthoring.TrackType.video:
                e = my.timeline.addVideoTrack(media, name, pos, my.mediaLength);
                addTracksDisplays(e);
                break;

            case LADS.TourAuthoring.TrackType.image:
                e = my.timeline.addImageTrack(media, name, pos);
                addTracksDisplays(e);
                break;

            case LADS.TourAuthoring.TrackType.ink:
                var expID = currTrack.getInkLink();
                e = my.timeline.addInkTrack(expID, name, currTrack.getMedia(), currTrack.getInkSpec(), pos);
                addTracksDisplays(e);
                e.setInkEnabled(currTrack.getInkEnabled());
                e.setInkLink(expID);
                e.setInkPath(currTrack.getInkPath());
                e.setInkProps({}); // not used
                e.setInkInitKeyframe(currTrack.getInkInitKeyframe());
                e.setInkRelativeArtPos(currTrack.getInkRelativeArtPos());
                
                if (expID) {//if it is an attached ink
                    expID.addAttachedInkTrack(e);
                }

                e.addInkTypeToTitle(currTrack.getInkPath().split('::')[0].toLowerCase());
                break;

            case LADS.TourAuthoring.TrackType.artwork:
                e = my.timeline.addArtworkTrack(media, name, currTrack.getGUID(), pos);
                addTracksDisplays(e);
                break;
        }
        

        function addTracksDisplays(e) {
            for (var i = 0; i < displays.length; i++) {
                addEachTrackDisplay(i);
            }

            function addEachTrackDisplay(i) {
                var dispLength, dispStart;
                if (currTrack.getType() !== LADS.TourAuthoring.TrackType.audio) {
                    dispLength = displays[i].getMain() + 2 * LADS.TourAuthoring.Constants.defaultFade;
                    dispStart = displays[i].getMainStart() - LADS.TourAuthoring.Constants.defaultFade;
                }
                else {
                    dispLength = displays[i].getMain();
                    dispStart = displays[i].getMainStart();
                }
                var newDisp = e.addDisplay(my.timeManager.timeToPx(dispStart), dispLength);
                newDisp.setFadeInFromMenu(displays[i].getFadeIn());
                newDisp.setFadeOutFromMenu(displays[i].getFadeOut());

                keyframes = displays[i].getKeyframes();//reset for current display
                for (var j = 0; j < keyframes.length; j++) {
                    if (currTrack.getType() === LADS.TourAuthoring.TrackType.audio) {//need y value for volume keyframes
                        key = newDisp.addKeyframe(my.timeManager.timeToPx(keyframes[j].getTime()), keyframes[j].getVolumePx());//adds keyframe and stores it
                        e.addKeyframeToLines(key);//adds it to audio lines
                    }
                    else {
                        newDisp.addKeyframe(my.timeManager.timeToPx(keyframes[j].getTime()));
                    }
                }
            }

            console.log("combining " + (my.undoManager.undoStackSize() - undoStackSize));
            my.undoManager.combineLast(my.undoManager.undoStackSize() - undoStackSize);
        }

    }

   


    //event handling for delete button
    function componentOptionDelete(evt) {

        menu.close();
        //

        var deleteDialog = $(document.createElement("div"));
        deleteDialog.attr("id", "deleteDialog");


        ///new css
        var deleteDialogSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
        deleteDialog.css({
            position: 'absolute',
            left: deleteDialogSpecs.x + 'px',
            top: deleteDialogSpecs.y + 'px',
            width: deleteDialogSpecs.width + 'px',
            height: deleteDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });
     
        //deleteOverlay.append(deleteDialog);
        var deleteDialogTitle = $(document.createElement('div'));
        deleteDialogTitle.attr('id', 'deleteDialogTitle');
        deleteDialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            // 'overflow': 'hidden',
            'word-wrap': 'break-word',
        });

        $("body").append(deleteOverlay);
        deleteOverlay.append(deleteDialog);

        my.timeManager.stop();
        deleteOverlay.fadeIn(500);
        close();

        var mssge = $(document.createElement('div'));
        mssge.attr('id', 'mssge');
        var text = "Are you sure you want to delete " + my.title;
         mssge.text(text);
        mssge.css({
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
       
        deleteDialog.append(mssge);

        //var mssge = "Are you sure you want to delete " + my.title;
        var hasAttachedInks = false;
        for (var jj = 0; jj < trackarray.length; jj++) {
            if (trackarray[jj].getType() === LADS.TourAuthoring.TrackType.ink && trackarray[jj].getInkEnabled() && trackarray[jj].getInkLink().getTitle() === that.getTitle()) {
                hasAttachedInks = true;
                break;
            }
        }
        text += ((hasAttachedInks && (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image)) ? " and any attached ink tracks?" : "?");
        mssge.text(text);

        //var confirmationBox = LADS.Util.UI.PopUpConfirmation(function () {
        //    yesTap();
        //}, mssge, "Delete");
        //$(confirmationBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 7);
        //$('body').append(confirmationBox);
        //my.timeManager.stop();

        //$(confirmationBox).fadeIn(500);
        //close();


        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            //'margin-top': '10px',
            //'text-align': 'center',

            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top': '50%'


        });
        deleteDialog.append(buttonRow);

        // TODO: Hook in save-to-server functionality here!
        var deleteButton = $(document.createElement('button'));
        deleteButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
        });
        deleteButton.text('Delete');
        $(deleteButton).click(function () {
            yesTap();
            deleteOverlay.fadeOut(500);
            $(deleteOverlay).remove();
        });

        buttonRow.append(deleteButton);

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
        cancelButton.click(function () { deleteOverlay.fadeOut(500); });
        buttonRow.append(cancelButton);


        function yesTap() {
            close();
            var command = LADS.TourAuthoring.Command({
                execute: function () {
                    my.timeline.removeTrack(that);

                    //if artwork is removed, also check if ink functionality should be removed
                    if (!my.timeline.checkForArtworks(0)) {
                        my.timeline.disableInk();
                    }

                    //code to snap down track list such that the track list is always full if it can be
                    if (trackarray.length > 0) {
                        var last = $('#Track-' + (trackarray.length - 1) + '-title');
                        var trackBottom = ($(document.getElementById('playback-controls')).offset().top);
                        var lastDivBottom = ($(last).offset().top + LADS.TourAuthoring.Constants.trackHeight);

                        //need to check if the first div is on the screen -- then no need to scroll
                        var first = $('#Track-' + 0 + '-title');
                        var firstTop = $(first).offset().top;
                        var trackTop = $(timeline).offset().top;
                        if (firstTop < trackTop) {
                            if ((lastDivBottom + LADS.TourAuthoring.Constants.trackHeight) < trackBottom) {
                                //var t = $('.track').css('top');
                                //$('.track').css({
                                //   //'top': parseInt(t, 10) + LADS.TourAuthoring.Constants.trackHeight + "px"
                                //});
                                //$('.titlediv').css({
                                //    //'top': parseInt(t, 10) + LADS.TourAuthoring.Constants.trackHeight + "px"
                                //});
                            }
                        }
                    }

                },
                unexecute: function () {
                    reloadTrack();
                }
            });
            my.undoManager.logCommand(command);
            command.execute();

            my.timeline.removeInkSession();
            var counter = 1;//one track removed so far
            //this block of code handles the case when an art piece with attached inks is deleted
            for (var k = my.attachedInks.length-1; k >= 0; k--) {
                deleteAttachedInks(k);
                //k--;
            }
            function deleteAttachedInks(j) {
                var track = my.attachedInks[j];

                counter++;
                var command = LADS.TourAuthoring.Command({
                    execute: function () {
                        my.timeline.removeTrack(track);
                    },
                    unexecute: function () {
                        track.reloadTrack();
                    }
                });
                my.undoManager.logCommand(command);
                command.execute();
            }

            if (counter > 1) {
                my.undoManager.combineLast(counter);
            }
        }



        //
        //var mssge = "Are you sure you want to delete " + my.title;
        //var hasAttachedInks = false;
        //for (var jj = 0; jj < trackarray.length; jj++) {
        //    if (trackarray[jj].getType() === LADS.TourAuthoring.TrackType.ink && trackarray[jj].getInkEnabled() && trackarray[jj].getInkLink().getTitle() === that.getTitle()) {
        //        hasAttachedInks = true;
        //        break;
        //    }
        //}
        //mssge += ((hasAttachedInks && (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image)) ? " and any attached ink tracks?" : "?");
        //var confirmationBox = LADS.Util.UI.PopUpConfirmation(function () {
        //    yesTap();
        //}, mssge, "Delete");
        //$(confirmationBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 7);
        //$('body').append(confirmationBox);
        //my.timeManager.stop();

        //$(confirmationBox).fadeIn(500);
        //close();
        //function yesTap() {
        //    close();
        //    var command = LADS.TourAuthoring.Command({
        //        execute: function () {
        //            my.timeline.removeTrack(that);

        //            //if artwork is removed, also check if ink functionality should be removed
        //            if (!my.timeline.checkForArtworks(0)) {
        //                my.timeline.disableInk();
        //            }

        //            //code to snap down track list such that the track list is always full if it can be
        //            if (trackarray.length>0) {
        //                var last = $('#Track-' + (trackarray.length - 1) + '-title');
        //                var trackBottom = ($(document.getElementById('playback-controls')).offset().top);
        //                var lastDivBottom = ($(last).offset().top + LADS.TourAuthoring.Constants.trackHeight);

        //                //need to check if the first div is on the screen -- then no need to scroll
        //                var first = $('#Track-' + 0 + '-title');
        //                var firstTop = $(first).offset().top;
        //                var trackTop = $(timeline).offset().top;
        //                if (firstTop < trackTop) {
        //                    if ((lastDivBottom + LADS.TourAuthoring.Constants.trackHeight) < trackBottom) {
        //                        //var t = $('.track').css('top');
        //                        //$('.track').css({
        //                        //   //'top': parseInt(t, 10) + LADS.TourAuthoring.Constants.trackHeight + "px"
        //                        //});
        //                        //$('.titlediv').css({
        //                        //    //'top': parseInt(t, 10) + LADS.TourAuthoring.Constants.trackHeight + "px"
        //                        //});
        //                    }
        //                }
        //            }

        //        },
        //        unexecute: function () {
        //            reloadTrack();
        //        }
        //    });
        //    my.undoManager.logCommand(command);
        //    command.execute();

        //    my.timeline.removeInkSession();
        //    var counter = 1;//one track removed so far
        //    //this block of code handles the case when an art piece with attached inks is deleted
        //    for (var ii = 0; ii < trackarray.length; ii++) {
        //        if (trackarray[ii].getType() === LADS.TourAuthoring.TrackType.ink && trackarray[ii].getInkEnabled() && trackarray[ii].getInkLink().getTitle() === that.getTitle()) {
        //            (function (j) {
        //                var track = trackarray[j];

        //                counter++;
        //                var command = LADS.TourAuthoring.Command({
        //                    execute: function () {
        //                        my.timeline.removeTrack(track);
        //                    },
        //                    unexecute: function () {
        //                        track.reloadTrack();
        //                    }
        //                });
        //                my.undoManager.logCommand(command);
        //                command.execute();
                        
        //            })(ii);
        //            ii--;
        //        }
        //    }
        //    my.undoManager.combineLast(counter);
        //}    
    }
    //event handling for cancel button
    function componentOptionCancel(evt) {
        var currSelection = my.selectedTrack.current;
        if (currSelection) {
            currSelection.setDeselected();
        }
        close();
    }
    
    //function to pause events
    function updateTracksEventsPaused(fb) {
        $.each(trackarray, function () {
            this.setEventsPaused(fb);
        });
    }
    that.updateTracksEventsPaused = updateTracksEventsPaused;

    /**Xiaoyi & Libby
    *set a display selected when in multi select mode
    */
    function setSelected() {
        my.selectedTrack.current = that;
        titlediv.css({
            "background-color": "#000"
        });
    }
    that.setSelected = setSelected;

    /**Xiaoyi & Libby
    *set a display deselected in multi select mode
    */
    function setDeselected() {
        my.selectedTrack.current = null;
        titlediv.css({
            "background-color": "rgb(105,89,89)"
        });
    }
    that.setDeselected = setDeselected;

    // PUBLIC METHODS -- Getters and setters for type and media
    function getType () {
        return my.type;
    }
    that.getType = getType;

    function getMedia () {
        return media;
    }
    that.getMedia = getMedia;

    function getPos() {
        return arrayPos;
    }
    that.getPos = getPos;

    function getTitle () {
        return my.title;
    }
    that.getTitle = getTitle;

    function setTitle(newTitle) {
        newTitle = my.timeline.fixTrackTitle(newTitle, getID());
        my.title = newTitle;
        titleText.text(my.title);
    }
    that.setTitle = setTitle;

    function getSharedMy() {
        return my;
    }
    that.getSharedMy = getSharedMy;

    function getEventsPaused() {
        return eventsPaused;
    }
    that.getEventsPaused = getEventsPaused;

    function setEventsPaused(fB) {
        eventsPaused = fB;
    }
    that.setEventsPaused = setEventsPaused;

    function getCurrentDisplay() {
        return my.currentDisplay;
    }
    that.getCurrentDisplay = getCurrentDisplay;
    
    function setCurrentDisplay(currDisplay) {
        my.currentDisplay = currDisplay;
    }
    that.setCurrentDisplay = setCurrentDisplay;

    function setIsVisible(visibility) {
        my.isVisible = visibility;
    }
    that.setIsVisible = setIsVisible;

    function getCurrentKeyframe() {
        return my.currentKeyframe;
    }
    that.getCurrentKeyframe = getCurrentKeyframe;

    function getGUID() {
        return guid;
    }
    that.getGUID = getGUID;

    /**
     * Functions for track ID
     * Corresponds to ordering of tracks in timeline array
     * Maps to z-layering in RIN
     * Each track ID should be unique, but might change on track switch
     * Use updatePos to update id
     */

    function getID() {
        return id.split('-')[1];
    }
    that.getID = getID;

    //function to update tracks in array to their current positions.
    function updateTrackArray() {
        trackarray.map(function (track, i) {
            track.updatePos(i);
        });
    }

    //handles update of location in track array
    function updatePos(pos) {
        arrayPos = pos;
        id = ('Track-' + pos);
        titlediv.attr('id', id + '-title');       
        my.track.attr('id', id);
        my.resource = 'R-' + arrayPos;
        prevTrack = my.track.prev(".track");
        prevTitleDiv = titlediv.prev(".titlediv");
    }
    that.updatePos = updatePos;

    /*function checks that given value is within range of top and bottom of titlediv
    * @ param switchOffSet keeps track of the the height of each div
    */
    function checkWithinTitleDiv(switchOffset) {
        var t = titlediv.offset().top;     
        if (that == trackarray[0] && spaceBefore)
            t -= LADS.TourAuthoring.Constants.trackHeight;       
        var h = parseInt(titlediv.css("height"),10);

        if (switchOffset >= t && switchOffset <= t + h) {
            return true;
        }
        else
            return false;
    }
    that.checkWithinTitleDiv = checkWithinTitleDiv;

    function getTitleDiv() {
        return titlediv;
    }
    that.getTitleDiv = getTitleDiv;

    /* 
    * function to move a current track to the location next to this track
    * if the track to be inserted is below this track, then it is inserted before this track
    * otherwise, it is inserted after
    */
    function insert(track) {
        if (track == that)
            return;
        var samePosition=false;
        if (arrayPos < track.getPos())
            samePosition = track.insertHelper(prevTrack, prevTitleDiv, arrayPos);
        else
            samePosition = track.insertHelper(my.track, titlediv, arrayPos );
        if (!samePosition) {
            updatePos(trackarray.indexOf(that));
            updateTrackArray();
        }
        my.update();
        // for resetting the tracks graphically when this is called
        var t = $('.track').css('top');
        //$('.titlediv').css('top', parseFloat(t) + 'px');
    }
    that.insert = insert;

    /*function called when this track is moved and inserted next to another track
    * @ param prTrack is previous track within calling class
    * @ param prTitle is previous title within calling class 
    * @ param pos is array position within calling class
    */
    function insertHelper(prTrack, prTitle, pos) {
        if (prTrack.attr('id') === my.track.attr('id')) {
            restoreMovedTrack();
            return true;
        }
        var scrollTop = $('#trackTitleWrapper').scrollTop();
        that.detach();
        updatePos(pos);
        prevTrack = prTrack;
        prevTitleDiv = prTitle;
        my.track.detach();
        reloadTrack();
        titlediv.css('top', '0px');
        my.track.css('display', '');
        $('#trackTitleWrapper').scrollTop(scrollTop);
        return false;
    }
    that.insertHelper = insertHelper;

    //restores track and title to original position after moving title
    function restoreMovedTrack() {
        titlediv.css("top", "0px");
        titlediv.css("left", "0px");
    }

    //reloads track after deletion for undo redo. Assumes track was removed first.
    //Also gets called every time a track is added??
    function reloadTrack() {
        //var t = $('.track').css('top');
        //titlediv.css('top', parseFloat(t) + 'px');
        //my.track.css('top', parseFloat(t) + 'px');
        if (prevTitleDiv.length === 0 || prevTrack.length === 0 || prevTitleDiv === null) {
            my.timeline.prependAddToDom(my.track, titlediv);
        }
        else {
            prevTitleDiv.after(titlediv);
            prevTrack.after(my.track);
        }
        trackarray.splice(arrayPos, 0, that);
        updateTrackArray();
        my.update();
        if (my.that.getType() === LADS.TourAuthoring.TrackType.ink && my.that.getInkEnabled()) {
            my.that.getInkLink().addAttachedInkTrack(my.that);
        }
    }
    that.reloadTrack = reloadTrack;

    // Interaction code

    // Track title manipulations
    LADS.Util.makeManipulatable({
        element: titlediv[0],
        functions: {
            onManipulate: onManipTrackTitleWrapper,
            onTapped: tappedTitle,
            onTappedRight: tapRightTitle,
            onRelease: trackTitleReleased,
            onScroll: scrollTitleWrapper,
            onDoubleTapped: toggleMinimized,
        },
        noAccel: true,
        stdHammer: true
    });

    // handles long press on the title
    my.inRightTap = false;
    function tapRightTitle(evt) {
        my.inRightTap = true;
        menu.open(evt);
    }
    this.tapRightTitle = tapRightTitle;

    //handles events when track title is tapped
    function tappedTitle(evt) {
        if (eventsPaused || my.inRightTap)
            return;

        var currSelection = my.selectedTrack.current;
        if (currSelection === that) {
            setDeselected();
        }
        else {
            if (currSelection) {
                currSelection.setDeselected();
            }
            setSelected();
        }
    }
    that.tappedTitle = tappedTitle;

    //inits track title to be dragged
    var prevZIndex = 0;
    // handles the case when the track title wrapper is dragged, if titledivmanip is true, instead allows for div to be dragged
    var firstEvent = true;

    //variables used by the onManipTrackTitleWrapper class to keep track of the top, bottom and total movement along the y axis of the tracks
    var moveTop = 0;
    var moveBottom = 0;   
    var totalYMoved = 0;
    var offset = 0;
    var dir = 0;
    function scrollTitleWrapper(delta) {
        var close = my.timeline.getCloseMenu();
        if (close) {
            close();
        }
        
        if (delta === 1.1) {
            $('#trackTitleWrapper').scrollTop($('#trackTitleWrapper').scrollTop() - 30);
        } else {
            $('#trackTitleWrapper').scrollTop($('#trackTitleWrapper').scrollTop() + 30);
        }
    }

    var vertLock = false, sideLock = false, xMoved = 0, yMoved = 0, dragEvents = 0;
    function trackTitleReleased(evt) {
        my.inRightTap = false;
        titleDivMouseUp();
    }

    function onManipTrackTitleWrapper(res, evt) {
        evt.stopPropagation();

        if (eventsPaused || my.inRightTap)
            return;

        var currSelection = my.selectedTrack.current;
        if (currSelection) {
            currSelection.setDeselected();
        }
        setSelected();

        //checks if a track has been selected for manipulation/movement
        if (titleDivManip) {
            titleDivTranslateY(res);
        }
        else {// if (res.translation.x < 0) {// < 0 && Math.abs(res.translation.y) <= 1) {
            if (firstEvent) {
                //titlediv.mouseup(function () {
                //    titleDivMouseUp();
                //    totalYMoved = 0;
                //});
                firstEvent = false;
            }
            //these two 'if' conditions determine how much a track needs to be pulled along the x axis for it to become maniputable 
            if (totalYMoved < 30 && Math.abs(res.translation.y) < Math.abs(res.translation.x) * 2) {
                titleDivTranslateX(res.translation.x);
            } else {
                titleDivTranslateX(200);
            }
            if (Math.abs(res.translation.y) > Math.abs(res.translation.x))
                totalYMoved = totalYMoved + Math.abs(res.translation.y);
            if (parseInt(titlediv.css('left'),10) < -20) { //used to be -10
                titleDivManip = true;
                offset = 0;
                titledivPlaceholder = $(document.createElement('div'));
                titledivPlaceholder.css({
                    "width": 0.127 * $(window).width() + 'px',
                    'margin-left': '20px',
                    height: titlediv.height() + 'px',
                    float: 'left',
                    border: '1px solid black',
                    'box-shadow': 'inset 4px -4px 8px #888',
                    position: 'absolute',
                    'z-index': 0,
                    background: 'rgb(219, 218, 199)',
                    top: titlediv.position().top + $('#trackTitleWrapper').scrollTop() + 'px',
                });
                //$('#trackTitleWrapper').css('max-height', $('#trackTitleWrapper').height() + 'px');
                titlediv.before(titledivPlaceholder);
                prevZIndex = titlediv.css('z-index');
                titlediv.css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex);
                titlediv.css('left', '-20px');
                moveTop = titlediv.offset().top;
                moveBottom = moveTop + LADS.TourAuthoring.Constants.trackHeight;
            }
            upAndDown(res);
        }
        //else {
            //totalYMoved = totalYMoved + Math.abs(res.translation.y);
            //if (parseInt(totalYMoved) > 100) {
                //upAndDown(res);
            //}
        //}
    }

    var firstBlock = true;

    //global variable to hold the track which the selected track will be swapped with
    var trackToReplace = null;

    //moves title div in the vertical direction with cursor
    function titleDivTranslateY(res) {
        var t = parseInt(titlediv.css('top'),10);
        var topp = t + res.translation.y;
        //console.log("t  "+t+" topp  "+topp);
        var tr = null; //keeps track of the div/track that needs to be moved when moving a selected track
        var index = 0;
        if (topp < t) { // Moving up
            moveUp();
        } else if (topp > t) { // Moving down
            moveDown();
        } else {
            var oldScroll;
            if (titlediv.position().top < 15) {
                oldScroll = $('#trackTitleWrapper').scrollTop();
                $('#trackTitleWrapper').scrollTop(oldScroll - 10);
                topp = topp - Math.min(10, oldScroll);
                moveUp();
            }
            if (titlediv.position().top + 2 +titlediv.height() > $('#trackScrollVeil').height() - 15) {
                oldScroll = $('#trackTitleWrapper').scrollTop();
                var scroll = oldScroll + 10;
                var trackArrayHeight = 0;
                var i;
                for (i = 0; i < trackarray.length; i++) {
                    trackArrayHeight = trackArrayHeight + trackarray[i].getTitleDiv().height() + 2;
                }
                if (scroll > trackArrayHeight - $('#trackTitleWrapper').height()) scroll = trackArrayHeight - $('#trackTitleWrapper').height();
                $('#trackTitleWrapper').scrollTop(scroll);
                topp = topp + scroll - oldScroll;
                moveDown();
            }
        }
        titlediv.css('top', topp);

        function moveUp() {
            var i = arrayPos + offset - 1;
            if (i >= arrayPos) i++;
            if (i >= 0) {
                var nextTrack = trackarray[i];
                var nextTitleDiv = nextTrack.getTitleDiv();
                if (nextTitleDiv.position().top > titlediv.position().top) {
                    //nextTitleDiv.animate({ 'top': parseFloat(nextTitleDiv.css('top')) + 98 + 'px' }, 100);
                    nextTitleDiv.css('top', parseFloat(nextTitleDiv.css('top')) + 2 + titlediv.height() + 'px');
                    titledivPlaceholder.css('top', parseFloat(titledivPlaceholder.css('top')) - 2 - nextTitleDiv.height() + 'px');
                    offset--;
                }
            }
        }

        function moveDown() {
            var i = arrayPos + offset + 1;
            if (i <= arrayPos) i--;
            if (i < trackarray.length) {
                var nextTrack = trackarray[i];
                var nextTitleDiv = nextTrack.getTitleDiv();
                if (nextTitleDiv.position().top < titlediv.position().top) {
                    titledivPlaceholder.css('top', parseFloat(titledivPlaceholder.css('top')) + 2 + nextTitleDiv.height() + 'px');
                    nextTitleDiv.css('top', parseFloat(nextTitleDiv.css('top')) - 2 - titledivPlaceholder.height() + 'px');
                    //nextTitleDiv.animate({'top': parseFloat(nextTitleDiv.css('top')) - 98 + 'px'}, 100);
                    offset++;
                }
            }
        }
    }

    //moves title div in the horizontal direction
    function titleDivTranslateX(x) {
        var l = parseInt(titlediv.css('left'),10);
        var left = Math.min(l + x, 0);
        titlediv.css('left', left);
    }

    //handles events when a selected track is released
    function titleDivMouseUp() {
        totalYMoved = 0;
        dir = 0;
        $('.titlediv').css('top', '0px');
        $('.titlediv').css('left', '0px');
        if (titledivPlaceholder)
            titledivPlaceholder.detach();

        var tr = trackarray[arrayPos + offset];
        if (offset !== 0 && titleDivManip && tr) {
            var prev;
            if (that.getPos() > tr.getPos()) { // that is below tr
                prev = trackarray[that.getPos() - 1];
            } else if (that.getPos() < tr.getPos()) { // that is above tr
                prev = trackarray[that.getPos() + 1];
            } else {
                prev = trackarray[that.getPos()];
            }
            var command = LADS.TourAuthoring.Command({
                execute: function () { tr.insert(that); },
                unexecute: function () {
                    prev.insert(that);
                }
            });
            command.execute();
            my.undoManager.logCommand(command);
        }

        titlediv.css('z-index', prevZIndex);
        firstBlock = true;
        titleDivManip = false;
        firstEvent = true;
    }

    //// makes the track manipulatable
    var grTrack = LADS.Util.makeManipulatable({
        element: my.track[0],
        functions: {
            onManipulate: onManipTrack,
            onTappedRight: tapRight,
            onScroll: scrollTitle,
            onTapped: trackTapped,
            onDoubleTapped: doubleTapped,
            onRelease: function () {
                my.inRightTap = false;
                vertLock = false;
                sideLock = false;
                xMoved = 0;
                yMoved = 0;
                dragEvents = 0;
            }
        },
        stdHammer: true
    });

    function released(evt) {
        if (eventsPaused || isMinimized) {
            return;
        }

        my.inRightTap = false;

        if (that.getCurrentKeyframe() !== null) {
            that.getCurrentKeyframe().released(evt);
        } else if (that.getCurrentDisplay() !== null) {
            that.getCurrentDisplay().released(evt);
        } else {
            console.log("skipping release");
        }
    }

    function tapRight(evt) {
        if (eventsPaused || isMinimized) {
            return;
        }

        my.inRightTap = true;

        if (that.getCurrentKeyframe()) {
            that.getCurrentKeyframe().rightTapped(evt);
        }
        else if (that.getCurrentDisplay()) {
            that.getCurrentDisplay().rightTapped(evt);
        }
    }
    that.tapRight = tapRight;
    
    function doubleTapped(evt) {
        if (isMinimized) {
            return;
        }
        addKeyorDisplay(evt);
    }

    //track tapped
    var multiSelection;
    function trackTapped(evt) {
        // cancel tap event on right click or if track is minimized
        if (evt.button === 2 || evt.gesture.srcEvent.buttons === 2) {
            return;
        }
        vertLock = false;
        sideLock = false;
        xMoved = 0;
        yMoved = 0;
        dragEvents = 0;
        multiSelection = my.timeline.getMultiSelection();
        //if not in the multi selection mode and the selection array is not empty, clear the array by deselecting them
        if (!multiSelection) {
            var selectednumber = my.timeline.getMultiSelectionArray().length;
            if (!that.getCurrentDisplay() && selectednumber > 0) {
                for (var i = 0;  i<selectednumber;i++){
                    my.timeline.allDeselected();
                }
            }
            else if (that.getCurrentKeyframe()) {
                if (isMinimized) {
                    return;
                }
                that.getCurrentKeyframe().tapped(evt);
            }
        }
        else if (that.getCurrentDisplay()) {//if in the multi selection mode, and user clicks on a display
            if (my.timeline.getMultiSelectionArray().indexOf(that.getCurrentDisplay()) < 0) {//if it is not selected, have it selected
                setDisplaySelected(that.getCurrentDisplay());
            }
            else {//if it is selected, have it deselected
                setDisplayDeselected(that.getCurrentDisplay(), false);
            }
        }
        else if (my.currentKeyframe) {//if the user clicks on a keyframe, select/deselect the display that contains current keyframe
            if (isMinimized) {
                return;
            }
            if (my.timeline.getMultiSelectionArray().indexOf(my.currentKeyframe.getContainingDisplay())< 0) {
                setDisplaySelected(my.currentKeyframe.getContainingDisplay());
            }
            else {
                setDisplayDeselected(my.currentKeyframe.getContainingDisplay(),false);
            }
        }
    }

    /**Xiaoyi & Libby
    *set current display deselected when user clicks it again
    */
    function setDisplaySelected(currentDisplay) {
        //add selected display to the array, and change the filling color
        my.timeline.getMultiSelectionArray().push(currentDisplay);
        //change it to the selected colors according to their types
        //the grey color (selectedInkDisplayColor) is used on videos and inks
        if (currentDisplay.getType() === 4 || currentDisplay.getType() === 2) {
            currentDisplay.getMainD().style('fill', LADS.TourAuthoring.Constants.selectedInkDisplayColor);
        }
        else {
            currentDisplay.getMainD().style('fill', LADS.TourAuthoring.Constants.selectedDisplayColor);
        }
    }
    that.setDisplaySelected = setDisplaySelected;

    /**Xiaoyi & Libby
    *set the current display deselected
    *@param: currentDisplay: the display is been clicking on
    *@keepDisplays:if we want to keep the displays
    */
     function setDisplayDeselected(currentDisplay, keepDisplays) {
        //remove the display from the array
        if (!keepDisplays) {
            my.timeline.getMultiSelectionArray().splice(my.timeline.getMultiSelectionArray().indexOf(currentDisplay), 1);
        }
        //ink/video displays change back to gray, others to green
        if (currentDisplay.getType() === 4 || currentDisplay.getType() === 2) {
            currentDisplay.getMainD().style('fill', LADS.TourAuthoring.Constants.inkDisplayColor);
        }
        else {
            currentDisplay.getMainD().style('fill', LADS.TourAuthoring.Constants.displayColor);
        }
    }
    that.setDisplayDeselected = setDisplayDeselected;

    /**
     * Handles drag on track
     * Pan timeline view
     * If a display or keyframe is selected, move that
     */
    function onManipTrack(res, evt) {
        var i, leftbound, rightbound, keydisplay, allKeys;
        if (eventsPaused || my.inRightTap) {
            evt.stopImmediatePropagation();
            return;
        }
        // move display
        if (my.currentDisplay) {
            if (evt)
                evt.stopPropagation();
            if (vertLock || (!sideLock &&
                dragEvents > 3 && 
                Math.abs(yMoved) > Math.abs(xMoved))) {
                vertLock = true;
                upAndDown(res);
                return;
            } else if (dragEvents > 3) {
                sideLock = true;
            } else {
                xMoved += res.translation.x;
                yMoved += res.translation.y;
                dragEvents++;
                return;
            }
            // update bounds if no multi-select
            if (my.timeline.getMultiSelectionArray().length === 0) {
                leftbound = my.timeManager.getDuration().start;
                rightbound = my.timeManager.getDuration().end;
                
                for (i = 0; i < my.displays.length; i++) {
                    // update bounds once current display is located in array
                    if (my.displays[i] === my.currentDisplay) {
                        if ((i - 1) >= 0) {
                            leftbound = my.displays[i - 1].getEnd() + LADS.TourAuthoring.Constants.esOffset;
                        }
                        if ((i + 1) < my.displays.length) {
                            rightbound = my.displays[i + 1].getStart() - LADS.TourAuthoring.Constants.esOffset;
                        }
                    }
                } 
                my.currentDisplay.move(res, leftbound, rightbound);
            }
            else {//Xiaoyi/Libby
                //move all selected tracks
                if (my.timeline.getMultiSelectionArray().indexOf(my.currentDisplay) >= 0) {
                    my.timeline.moveSelect(res, my.currentDisplay);
                }
            }
        }
    
        // move keyframe
        else if (my.currentKeyframe) {
            if (isMinimized) {
                return;
            }
            if (evt)
                evt.stopPropagation();

            // Note that the bounds for the keyframe are just the beginning and end of the containing display
            keydisplay = my.currentKeyframe.getContainingDisplay();
            allKeys = keydisplay.getKeyframes();
            // get bounds
            leftbound = keydisplay.getStart();
            rightbound = keydisplay.getEnd();
            // **************************************
            // this iterates through ALL the displays to find one - O(n). add index-awareness and it becomes O(1)
            // **************************************

            for (i = 0; i < allKeys.length; i++) {
                // update bounds once current keyframe is located in array
                if (allKeys[i] === my.currentKeyframe) {
                    if ((i - 1) >= 0) {
                        //if (allKeys[i - 1].getTime() + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize) > allKeys[i].getTime() - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize)) {
                        //    leftbound = allKeys[i].getTime();
                        //}
                        //else {
                            leftbound = allKeys[i - 1].getTime() + LADS.TourAuthoring.Constants.esOffset;
                        //}
                    }
                    if ((i + 1) < allKeys.length) {
                        //if (allKeys[i + 1].getTime() - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize) < allKeys[i].getTime() + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize)) {
                        //    rightbound = allKeys[i].getTime();
                        //}
                        //else {
                            rightbound = allKeys[i + 1].getTime() - LADS.TourAuthoring.Constants.esOffset;
                        //}
                    }
                }
            }
            if (!my.timeline.getMultiSelection()) {
                my.currentKeyframe.move(res, leftbound, rightbound);
            }
        }
    }
    that.onManipTrack = onManipTrack;

    /*Xiaoyi & Libby
    *helper function returning the left/right bounds of the track during multi-select
    * @param currDisplay: display that the bounds are being found for
    * @returns the bound for each display separately that are multi-selected
    */
    function boundHelper(currDisplay,hasZeroFadeout) { // deal with fixing bounds for ink dragging here
        var leftbound = my.timeManager.getDuration().start,
            rightbound = my.timeManager.getDuration().end,
            currkeyframes = currDisplay.getKeyframes(),
            //this is the internal right bound for the fade in
            //it is calculated by taking the smallest time when comparing the time at which the fadeout begins and the start time of the first keyframe (if any)
            fadeInRight = Math.min(currDisplay.getOutStart() - currDisplay.getFadeIn(),
                                        ((currkeyframes[0] && (currkeyframes[0].getTime() - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.fadeBtnSize))) || Infinity)),
            //this is the internal left bound for the fade out
            //it is calculated by taking the largest time when comparing the time at which the fadein ends and the start time of the last keyframe (if any)
            fadeOutLeft = Math.max(currDisplay.getStart() + currDisplay.getFadeIn(),
                             ((currkeyframes.length > 0 && (currkeyframes[currkeyframes.length - 1].getTime() - currDisplay.getFadeOut() + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.fadeBtnSize))) || -Infinity)),
            currLeft = currDisplay.getStart(),
            loc = currDisplay.getLoc();
        var currRight = currDisplay.getEnd();
        
        //if the display the user is dragging has zero fadeout, update the currRight (for some reason, currDisplay.getEnd() doesn't work)
        if (hasZeroFadeout) {
            currRight = currDisplay.getOutStart();
        }

        //in the case where both the fadein and fadeout are both (such as with audio tracks), then the fadeinright and the fadeoutleft need to be calculated using either the first/last keyframe 
        //position or the edge of the fadein/fadeout handle, which prevents the display from being compressed so far that it is just a handle with no display at all
        if (currDisplay.getFadeIn() === 0 || currDisplay.getFadeOut() === 0) {
            fadeInRight = Math.min(my.timeManager.pxToTime(currDisplay.getFioHandle().attr('cx') - 2 * LADS.TourAuthoring.Constants.fadeBtnSize),
                                            ((currkeyframes[0] && (currkeyframes[0].getTime() - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.fadeBtnSize))) || Infinity));
            fadeOutLeft = Math.max(my.timeManager.pxToTime(currDisplay.getFinHandle().attr('cx')) + my.timeManager.pxToTime(2 * LADS.TourAuthoring.Constants.fadeBtnSize),
                ((currkeyframes.length > 0 && (currkeyframes[currkeyframes.length - 1].getTime() - currDisplay.getFadeOut() + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.fadeBtnSize))) || -Infinity));
        }
        var boundArray = [];
        if (fadeInRight < currDisplay.getStart()) {
            fadeInRight = currDisplay.getStart();
        }
        if (fadeOutLeft > currDisplay.getOutStart()) {
            fadeOutLeft = currDisplay.getOutStart();
        }
        //if dragging the main section of the display
        var parentArtDisplay;
        if (loc === LADS.TourAuthoring.DisplayParts.main) {
            for (var i = 0; i < my.displays.length; i++) {
                // update bounds once current display is located in array
                if (my.displays[i] === currDisplay) {
                    if ((i - 1) >= 0 && my.timeline.getMultiSelectionArray().indexOf(my.displays[i - 1]) < 0) {
                        leftbound = my.displays[i - 1].getEnd() + LADS.TourAuthoring.Constants.esOffset;
                    }
                    if ((i + 1) < my.displays.length && my.timeline.getMultiSelectionArray().indexOf(my.displays[i + 1]) < 0) {
                        rightbound = my.displays[i + 1].getStart() - LADS.TourAuthoring.Constants.esOffset;
                    }
                    if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {
                        parentArtDisplay = getParentArtDisplay(my.displays[i]);
                        if (my.timeline.getMultiSelectionArray().indexOf(parentArtDisplay) === -1) {
                            leftbound = Math.max(leftbound, parentArtDisplay.getStart());
                            rightbound = Math.min(rightbound, parentArtDisplay.getEnd());
                        }
                    }
                }
            }
        } //if dragging the fadein/fadeout sections of the display
        else if (loc === LADS.TourAuthoring.DisplayParts['fade-out'] || loc === LADS.TourAuthoring.DisplayParts['fade-in']) {
            for (var j = 0; j < my.displays.length; j++) {
                // update bounds once current display is located in array
                if (my.displays[j] === currDisplay) {
                    if ((j - 1) >= 0) {
                        leftbound = my.displays[j - 1].getEnd() + LADS.TourAuthoring.Constants.esOffset;
                    }
                    if ((j + 1) < my.displays.length) {
                        rightbound = my.displays[j + 1].getStart() - LADS.TourAuthoring.Constants.esOffset;
                    }
                    if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {
                        parentArtDisplay = getParentArtDisplay(my.displays[j]);
                        if (my.timeline.getMultiSelectionArray().indexOf(parentArtDisplay) === -1) {
                            leftbound = Math.max(leftbound, parentArtDisplay.getStart());
                            rightbound = Math.min(rightbound, parentArtDisplay.getEnd());
                        }
                    }
                    else if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image || !my.inkEnabled) {
                        var attachedDisplays = my.displays[j].getAttachedDisplays();
                        var totalDispLength = my.displays[j].getLongestSubgroup(attachedDisplays);
                        fadeOutLeft = Math.max(fadeOutLeft, my.displays[j].getStart() + totalDispLength);
                        fadeInRight = Math.min(fadeInRight, my.displays[j].getEnd() - totalDispLength);
                    }
                    if (my.type === LADS.TourAuthoring.TrackType.video || my.type === LADS.TourAuthoring.TrackType.audio) {
                        if (my.displays[j].getMediaLength()) {
                            var maxlength = parseFloat(currDisplay.getMediaLength());
                            leftbound = Math.max(leftbound, currDisplay.getEnd() - maxlength);
                            rightbound = Math.min(rightbound, currDisplay.getStart() + maxlength);
                        }
                    }
                }
            }
        }
       
        boundArray[0] = currLeft - leftbound;//fadeinleft distance (in seconds)
        boundArray[1] = rightbound - currRight;//fadeoutright distance (in seconds)
        boundArray[2] = fadeInRight - currLeft;//fadeinright distance (in seconds)
        boundArray[3] = currRight - currDisplay.getFadeOut() - fadeOutLeft;//fadeoutleft distance (in seconds)

        return boundArray;
    }
    that.boundHelper = boundHelper;


    /**
     * Gets the art display enclosing an attached ink track display.
     */
    function getParentArtDisplay(disp) {
        var parentArtTrack = my.experienceId,
            parentDisplays = parentArtTrack.getDisplays(),
            parentArtDisplay = null;
        for (var i = 0; i < parentDisplays.length; i++) {
            var currDisp = parentDisplays[i];
            if ((currDisp.getStart() <= disp.getOutStart()) && (disp.getOutStart() <= currDisp.getOutStart() + currDisp.getFadeOut())) { // use outStart to test if display is in the art display
                parentArtDisplay = currDisp;
                break;
            }
        }
        return parentArtDisplay;
    }
    function scale() {
        var i;
        for (i = 0; i < my.displays.length; i++) {
            my.displays[i].scale();
        }
    }
    that.scale = scale;
    my.timeManager.onSizing(scale);

    /**
     * helper function that loops through the array of displays 
     * returns the start of a display if there's a display nearby
     * returns 1 fadein, 0 fadeout and -1 otherwise
     * @ param  currentDisplayPosition is the position of the current display
     * @ param displays is an array of displays
     */
    function findDisplay(currentDisplayPosition, displays) {
        var i = 0;
        while (i < displays.length) {
            if (Math.abs(displays[i].getEnd() - currentDisplayPosition) <= 0.5 && displays[i].getEnd() !== currentDisplayPosition) {
                return displays[i].getEnd();
            }
            if (Math.abs(displays[i].getStart() - currentDisplayPosition) <= 0.5 && displays[i].getStart() !== currentDisplayPosition) {
                return displays[i].getStart();
            }
            i++;
        }
        return -1;
    }

    /**
     * helper function for finding a certain track using it's id
     * param trackNum - the track's id
     * returns the track
     */
    function getTrackByID(trackNum) {
        var tracks = my.timeline.getTracks();
        var i;
        for (i = 0; i < tracks.length; i++) {
            if (trackNum === parseInt(tracks[i].getID(),10)) {
                return tracks[i];
            }
        }
        return null;
    }

    /**
     * moves the track and the left and right
     */
    function leftAndRight(res, isRuler) {
        if (!trackBody)
            trackBody = my.timeline.getTrackBody();
        trackBody.scrollLeft(trackBody.scrollLeft() - res.translation.x);
    }
    that.leftAndRight = leftAndRight;

    /**
     * moves the track up and down
     */

    function upAndDown(res) {
        if (!trackBody)
            trackBody = $('#trackBody');
        trackBody.scrollTop(trackBody.scrollTop() - res.translation.y);
    }
    that.upAndDown = upAndDown;

    //scrolling function similar to upanddown
    //hacky fix, needs to be reworked like the entire class

    function scrollTitle(evt) {
        var close = my.timeline.getCloseMenu();
        if (close) {
            close();
        }

        if (!trackBody)
            trackBody = my.timeline.getTrackBody();
        var t = trackBody.scrollTop();
        //check if scrolling up or down
        var topp;
        if (evt === 1.1) { //scrolling up
            topp = t - 30;
        }
        else { //scrolling down
            topp = t + 30;
        }
        trackBody.scrollTop(topp);
    }


     //adds a key frame or display    
    function addKeyorDisplay(evt) {
        var positionX = evt.position.x,
            newTime = my.timeManager.pxToTime(positionX),
            positionY = evt.position.y,
            enoughSpace = true,
            displayLength = 5, // assumes display length to be 5 seconds
            i, keyframe, newDisplay,
            currDisplay, artDisplay,
            fromEnd;

        if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {
            var artDisplays = my.experienceId.getDisplays();
            var indisp = false;
            for (i = 0; i < artDisplays.length; i++) {
                if (newTime <= artDisplays[i].getEnd() && newTime >= artDisplays[i].getStart()) {
                    indisp = true;
                    artDisplay = artDisplays[i];
                    break;
                }
            }
            if (!indisp) {
                // TO-DO put in a warning here that the user should create the track over an artwork/image display
                return;
            }
        }
        // Add display
        if (!my.currentDisplay) {
            // check if current display is going to conflict with other displays
            var minSpace = Infinity;
            for (i = 0; i < my.displays.length; i++) {
                currDisplay = my.displays[i];

                // if newtime is after display we don't care
                if (newTime <= currDisplay.getEnd()) {
                    // check if tap location is on display
                    
                    if (newTime >= currDisplay.getStart()) {
                        enoughSpace = false;
                        break; // short circuit
                    }
                    // check if newTime is w/i displayLength seconds of start of current display
                    else if (newTime + displayLength >= currDisplay.getStart()) {
                        displayLength = currDisplay.getStart() - newTime - LADS.TourAuthoring.Constants.esOffset;
                    }
                    minSpace = Math.min(minSpace, currDisplay.getStart() - newTime);
                }
            }
            var fromEnd = my.timeManager.getDuration().end - newTime;
            if (enoughSpace) {
                //if (artDisplay.getEnd() - newTime >= 0.5) {
                    if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {
                        newDisplay = addDisplay(positionX, Math.min(displayLength, artDisplay.getEnd() - newTime));
                        if (artDisplay.getEnd() - newTime < 1.5 || minSpace < 1.5) { // if less than 1.5 seconds available...
                            var smallestSpace = Math.min(minSpace, artDisplay.getEnd() - newTime);
                            newDisplay.setIn(0);
                            newDisplay.setOut(0);
                            newDisplay.setMain(smallestSpace);
                        }
                    }
                    else {
                        var smallestSpace = Math.min(displayLength, fromEnd);
                        newDisplay = addDisplay(positionX, smallestSpace);
                        if (fromEnd < 1.5) {
                            newDisplay.setIn(0);
                            newDisplay.setOut(0);
                            newDisplay.setMain(smallestSpace);
                        }
                    }
                //}
            }
        }

        // Add keyframe
        else if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.audio || my.type === LADS.TourAuthoring.TrackType.image) {
            if (my.timeline.getViewer().isKeyframingDisabled()) {
                return;
            }

            // check to make sure we are adding keyframe to valid position
            if (newTime >= my.currentDisplay.getStart() && newTime <= my.currentDisplay.getEnd()) {
                // seek before creating new keyframe to unload and update with currently selected keyframe
                if (my.type !== LADS.TourAuthoring.TrackType.audio) {
                    my.timeManager.seek(newTime);
                }

                keyframe = my.currentDisplay.addKeyframe(positionX, positionY, true);
                
                if (keyframe) {
                    if (my.type == LADS.TourAuthoring.TrackType.audio) {
                        my.allKeyframes.push(keyframe);
                        that.drawLines();
                        my.update();
                    }
                    else { // initialize keyframe and select it for further movements
                        keyframe.loadRIN(my.timeline.captureKeyframe(my.title)); // send in my.title to specify which keyframe should be captured (works for images and artworks)
                        keyframe.setSelected(true); // delay logging of edits
                        my.dirtyKeyframe = true; // dirty b/c it's new
                        //LADS.Util.makeManipulatable
                    }
                    my.update();
                }
            }
        } 
    }

    //Deselects any active keyframes
    function deselectKeyframe() {
        if (my.selectedKeyframe) my.selectedKeyframe.setDeselected();
        my.dirtyKeyframe = false;
    }
    that.deselectKeyframe = deselectKeyframe;

    /**
    * Because loadRIN calls display.addKeyframe directly,
    * we need to pass it back into the track's list of allKeyframes manually for lines to draw
    */
    function addKeyframeToLines(keyframe) {
        my.allKeyframes.push(keyframe);
        that.drawLines();
    }
    that.addKeyframeToLines = addKeyframeToLines;

    //Draw volume line for audio tracks
    function drawLines() {
        if (isMinimized) {
            return;
        }
        if (my.type === LADS.TourAuthoring.TrackType.audio) {
            var keyframes = my.allKeyframes, end = keyframes.length-1;
            keyframes.sort(function (a, b) {
                if (a.isRemoved())
                    return 1;
                else if (b.isRemoved())
                    return -1;
                else
                    return a.getTime() - b.getTime();
            });

            while (end > 0 && keyframes[end].isRemoved()) {
                end--;
            }

            var lines = my.svgLines.selectAll('#keyframeLines');
            lines.remove();

            mygroup = my.svgLines.append("svg:g")
                .attr("id", "keyframeLines");

            var color = "green";
            var myLine;
            if (keyframes.length > 0) {
                myLine = mygroup.append("svg:line")
                    .attr("x1", 0)
                    .attr("y1", keyframes[0].getVolumePx())
                    .attr("x2", my.timeManager.timeToPx(keyframes[0].getTime()))
                    .attr("y2", keyframes[0].getVolumePx())
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);

                for (var counter = 0; counter < end; counter++) {
                    myLine = mygroup.append("svg:line")
                    .attr("x1", my.timeManager.timeToPx(keyframes[counter].getTime()))
                    .attr("y1", keyframes[counter].getVolumePx())
                    .attr("x2", my.timeManager.timeToPx(keyframes[counter + 1].getTime()))
                    .attr("y2", keyframes[counter + 1].getVolumePx())
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);
                }

                myLine = mygroup.append("svg:line")
                    .attr("x1", my.timeManager.timeToPx(keyframes[end].getTime()))
                    .attr("y1", keyframes[end].getVolumePx())
                    .attr("x2", '100%')
                    .attr("y2", keyframes[end].getVolumePx())
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);
            }
            else {
                myLine = mygroup.append("svg:line")
                    .attr("x1", 0)
                    .attr("y1", (100 - LADS.TourAuthoring.Constants.defaultVolume * 100) + "%")
                    .attr("x2", '100%')
                    .attr("y2", (100 - LADS.TourAuthoring.Constants.defaultVolume * 100) + "%")
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);
            }
        }
    }
    that.drawLines = drawLines;

    // Methods to add outline and track HTML to DOM
    // Expects to be passed containers as JQuery object

    /**
     * @param domElems  Object w/ two properties: 'title', the title container, and 'track', the track container
     */
    function addAllToDOM (domElems) {
        domElems.title.append(titlediv);
        domElems.track.append(my.track);
    }
    that.addAllToDOM = addAllToDOM;

    function prependAllToDOM(domElems) {
        domElems.title.prepend(titlediv);
        domElems.track.prepend(my.track);
    }
    that.prependAllToDOM = prependAllToDOM;


    function addInkTypeToTitle(type) {

        var inkType = $(document.createElement('div'));
        inkType.attr('id', 'inkType');
        inkType.css({
            "top": "48px", "position": "absolute", "left" : "5px",
            "font-size": "1em", "color": "white", "width":"80%", "height" : '20px',
        });
        //parse

        if (type === "trans") {

            //old_datastring.split("[mode]")[1].split("[")[0];
            var transType =  that.getInkPath().split("[mode]")[1].split("[")[0];

            if (transType === "block") {
                inkType.text("Block");
            }
            else {
                inkType.text("Isolate");
            }
        }
        else if (type == "text") {
            inkType.text("Text");
        }
        else if (type == "path") {
            inkType.text("Draw");
        }
        //inkType.text(type);
        


        titlediv.append(inkType);
    }
    that.addInkTypeToTitle = addInkTypeToTitle;

    // Add only title
    function addTitleToDOM(container) {
        if (arrayPos > 0) {
            container.children().eq(arrayPos - 1).after(titlediv);
        } else {
            container.prepend(titlediv);
        }
        prevTitleDiv = titlediv.prev(".titlediv");
    }
    that.addTitleToDOM = addTitleToDOM;

    // Add only track
    function addEditorToDOM(container) {
        if (arrayPos > 0) {
            container.children().eq(arrayPos - 1).after(my.track);
        } else {
            container.prepend(my.track);
        }
        prevTrack = my.track.prev(".track");
    }
    that.addEditorToDOM = addEditorToDOM;

    function remove() {
        trackarray.remove(that);
        titlediv.remove();
        my.track.remove();
    }
    that.remove = remove;

    function detach() {
        trackarray.remove(that);
        titlediv.detach();
        my.track.detach();
    }
    that.detach = detach;

    // DISPLAY WORK

    var displayCount = 0; // used for ids
    my.currentDisplay = null; // Manipulation handling
    my.currentKeyframe = null;

    /**
     * Public fn for adding visibility to track
     * @param x         x value (px) for display
     * @param length    length of display in seconds (set to 5 if not given) (only used in testing)
     * @returns     command for adding/undoing addition
     */
    function addDisplay(x, length) {
        //x = (my.timeManager.pxToTime(x) < 0.5) ? 0 : x - my.timeManager.timeToPx(0.5); //should use a constant for fade-in length rather than .5
        var index, i,
            newDisplay = LADS.TourAuthoring.Display({
                start: my.timeManager.pxToTime(x),
                length: length,
                id: displayCount,
                canKeyframe: (my.type !== LADS.TourAuthoring.TrackType.ink && my.type !== LADS.TourAuthoring.TrackType.video),
                canFade: (my.type !== LADS.TourAuthoring.TrackType.audio)
        }, my),
            command = LADS.TourAuthoring.Command({
                execute: function () {
                    newDisplay.reloadDisplay();
                    my.update();
                },
                unexecute: function () {
                    newDisplay.removeDisplay(false);
                    my.update();
                }
            });
        displayCount++;
        index = my.displays.insert(newDisplay, _displaycomp);
        newDisplay.setID(index);
        // update rest of displays
        for (i = index+1; i < my.displays.length; i++) {
            my.displays[i].setID(i);
        }
        my.update();
        my.undoManager.logCommand(command);
        return newDisplay; // for testing
    }
    that.addDisplay = addDisplay;

    //Function to remove display passed in as an argument.

    /**
     * Helper function for inserting display into array
     * Keeps displays sorted by start
     */
    function _displaycomp(a, b) {
        return a.getStart() > b.getStart();
    }
    that.displayComp = _displaycomp;

    /**
     * For testing purposes only!!!
     */
    function getDisplays() {
        return my.displays;
    }
    that.getDisplays = getDisplays;

    function clearDisplays() {
        my.displays = [];
    }

    /**
     * Updates track w/ new keyframe data at current location
     * @param capture   keyframe data in RIN format
     * @param select    whether the keyframe receiving data should be selected
     */
    function receiveKeyframe(capture, select) {
        var i, display, keyframe, current = my.timeManager.getCurrentTime();
        if (my.selectedKeyframe && my.selectedKeyframe.getTime() === current && !my.selectedKeyframe.removed) { // the current check fixes a bug
            my.selectedKeyframe.loadRIN(capture);
            my.dirtyKeyframe = true;
            if (select) my.selectedKeyframe.setSelected();
        }
        else { // find active display and add keyframe to it
            for (i = 0; i < my.displays.length; i++) {
                display = my.displays[i];
                if (display.getStart() < current && current < display.getEnd()) {
                    keyframe = display.addKeyframe(my.timeManager.timeToPx(current));
                    if (keyframe) {
                        keyframe.loadRIN(capture);
                        my.dirtyKeyframe = true;
                        if (select) keyframe.setSelected();
                    }
                    return;
                }
            }
        }
    }
    that.receiveKeyframe = receiveKeyframe;

    function _unselectKeyframe() {
        if (my.selectedKeyframe) {
            my.selectedKeyframe.setDeselected();
        }
        my.currentKeyframe = null;
        my.dirtyKeyframe = false;
    }
    my.timeManager.onMove(function () {
        if (my.dirtyKeyframe) {
            my.update(true);
        }
        _unselectKeyframe();
    });

    // Ink params
    my.inkSpec = {};
    my.inkPath = "";
    my.currentInkPath = "";
    my.inkProps = {};
    my.inkEnabled = null; //(bleveque) unattached ink tracks by default
    my.inkInitKeyframe = {};
    my.inkRelativeArtPos = {};
  
    // add initialization
    //color, font, opacity, size, mode
    // param getters
    function getInkSpec() {
        return my.inkSpec;
    }
    function getInkColor() {
        return my.inkSpec.penColor;
    }
    function getInkFont() {
        return my.inkSpec.font;
    }
    function getInkOpacity() {
        return my.inkSpec.opacity;
    }
    function getInkSize() {
        return my.inkSpec.size;
    }
    function getInkMode() {
        return my.inkSpec.mode;
    }
    function getInkPath() {
        return my.inkPath;
    }
    function getInkLink() {//returns parent/associated artwork track
        return my.experienceId;
    }
    function getInkProps() {
        return my.inkProps;
    }
    function getInkEnabled() {
        return my.inkEnabled;
    }
    function getInkInitKeyframe() {
        return my.inkInitKeyframe;
    }
    function getInkRelativeArtPos() {
        return my.inkRelativeArtPos;
    }
    function getInkType() {
        return my.inkType;
    }
    that.getInkType = getInkType;

    that.getInkSpec = getInkSpec;
    that.getInkColor = getInkColor;
    that.getInkFont = getInkFont;
    that.getInkOpacity = getInkOpacity;
    that.getInkSize = getInkSize;
    that.getInkMode = getInkMode;
    that.getInkPath = getInkPath;
    that.getInkLink = getInkLink;
    that.getInkProps = getInkProps;
    that.getInkEnabled = getInkEnabled;
    that.getInkInitKeyframe = getInkInitKeyframe;
    that.getInkRelativeArtPos = getInkRelativeArtPos;

    // param setters
    function setInkType() {
        return my.inkType;
    }

    function setInkSpec(spec) {
        my.inkSpec = spec;
    }
    function setInkColor(color) {
        my.inkSpec.color = color;
    }
    function setInkFont(font) {
        my.inkSpec.font = font;
    }
    function setInkOpacity(opacity) {
        my.inkSpec.opacity = opacity;
    }
    function setInkSize(size) {
        my.inkSpec.size = size;
    }
    function setInkMode(mode) {
        my.inkSpec.mode = mode;
    }
    function setInkPath(path) {
        my.inkPath = path;
    }
    function setInkLink(id) {
        my.experienceId = id;
    }
    function setInkProps(props) {
        my.inkProps = props;
    }
    function setInkEnabled(enabled) {
        my.inkEnabled = enabled;
    }
    function setInkInitKeyframe(kf) {
        my.inkInitKeyframe = kf;
    }
    function setInkRelativeArtPos(ar) {
        my.inkRelativeArtPos = ar;
    }
    function addAttachedInkTrack(tr) {
        my.attachedInks.push(tr);
    }
    function removeAttachedInkTrack(tr) {
        my.attachedInks.splice(my.attachedInks.indexOf(tr), 1);
    }
    that.setInkSpec = setInkSpec;
    that.setInkType = setInkType;
    that.setInkColor = setInkColor;
    that.setInkFont = setInkFont;
    that.setInkOpacity = setInkOpacity;
    that.setInkSize = setInkSize;
    that.setInkMode = setInkMode;
    that.setInkPath = setInkPath;
    that.setInkLink = setInkLink;
    that.setInkProps = setInkProps;
    that.setInkEnabled = setInkEnabled;
    that.setInkInitKeyframe = setInkInitKeyframe;
    that.setInkRelativeArtPos = setInkRelativeArtPos;
    that.addAttachedInkTrack = addAttachedInkTrack;
    that.removeAttachedInkTrack = removeAttachedInkTrack;

    // RIN conversions

    /**
     * Add track resource to RIN resource table
     * @param table     RIN resource table object to add entry to
     */
    function addResource(table) {
        table[my.resource] = {
            uriReference: media
        };
    }
    that.addResource = addResource;

    /**
     * Generates RIN data for Experience Stream from track
     * @param data      "ExperienceStreams" object to add named track ES object to
     */
    function addES(data) {
        var i, passthrough, inkLink = null,
            param = my.title,
            count = 0,
            exp = {},
            prevState = null;

        exp.data = {
            zIndex: my.timeline.getNumTracks() - my.that.getPos(),
        };

        // type
        switch (my.type) {
            case LADS.TourAuthoring.TrackType.artwork:
                exp.providerId = 'ZMES';
                exp.data.guid = guid;
                break;

            case LADS.TourAuthoring.TrackType.image:
                exp.providerId = 'ImageES';
                break;

            case LADS.TourAuthoring.TrackType.audio:
                exp.providerId = 'AES';
                exp.data.mediaLength = my.mediaLength;
                break;

            case LADS.TourAuthoring.TrackType.video:
                exp.providerId = 'VideoES';
                exp.data.mediaLength = my.mediaLength;
                break;

            case LADS.TourAuthoring.TrackType.ink:
                exp.providerId = 'InkES';
                exp.data.linkToExperience = {};
                inkLink = (my.experienceId) ? my.experienceId.getTitle() : '';
                exp.data.linkToExperience.embedding = {
                    element: {
                        datastring: {
                            type: "datastring",
                            str: my.inkPath,
                        },
                        props: my.inkProps,
                    },
                    enabled: my.inkEnabled,
                    //inkType: my.inkType,
                    initKeyframe: my.inkInitKeyframe,
                    experienceId: inkLink,
                    initproxy: my.inkRelativeArtPos,
                };
                //hard coded for now
                exp.data.markers = {
                    beginAt: 0,
                    endAt: 5,
                };
                exp.data.transition = {
                    inDuration: 0.000001, //was 0.5 (bleveque)
                    outDuration: 0.000001, //was 0.5 (bleveque)
                    providerId: "FadeInOutTransitionService",
                };
                exp.experienceStreams = { "defaultStream": { "duration": 16.891999999999999 } };
                exp.resourceReferences = [];
                break;
            default:
                console.log('Track type not yet implemented in RIN');
        }

        // don't pass through if track is currently selected or there is no selection
        if (!my.selectedTrack.current || my.selectedTrack.current === that) {
            passthrough = false;
        } else {
            passthrough = true;
        }
        
        if (my.type !== LADS.TourAuthoring.TrackType.ink) {
            exp.resourceReferences = [
                {
                    resourceId: my.resource,
                    required: 'true'
                }
            ];
        } else {
            exp.resourceReferences = [];
        }
        exp.experienceStreams = {};

        for (i = 0; i < my.displays.length; i++) {
            my.displays[i].toES(exp, passthrough, prevState);
            prevState = my.displays[i].getLastKeyframe();
        }

        while (data.hasOwnProperty(param)) {
            param = param + '-0';
        }
        data[param] = exp;
    }
    that.addES = addES;

    /**
     * Helper function for generating Experience Streams
     * Gathers Keyframe Sequence data from displays
     * @returns     "keyframeSequences" object
     */
    function _getKeyframeSequences() {
        var i, sequences = {};
        for (i = 0; i < my.displays.length; i++) {
            my.displays[i].toKeyframeSequence(sequences);
        }
        return sequences;
    }

    /**
     * Gathers screenplay entries from displays
     * Don't forget to sort these things afterwards
     * @param screenplay        Array to add screenplay entries to
     * @param needFull          If true, output screenplay entries regardless of internal settings
     */
    function addScreenPlayEntries(screenplay, needFull) {
        var i;
        if (needFull || my.isVisible) {
            for (i = 0; i < my.displays.length; i++) {
                screenplay.push(my.displays[i].toScreenPlayEntry());
            }
        }
    }
    that.addScreenPlayEntries = addScreenPlayEntries;

    
    // updates the position of the zoom box
    function zoomBoxUpdate() {
        var zoomfader = $(document.getElementById('zoomPoint'));
        var currScale = my.timeManager.getDuration().scale;

        var minScale = $(timeline).width() / my.timeManager.getDuration().end;
        var percent = (currScale - minScale) / (LADS.TourAuthoring.Constants.maxZoom - minScale);
        var newLeft = ((zoomfader.offsetParent().width() - zoomfader.width()) * percent);
        zoomfader.css('left', newLeft);
    }

    // set minimized boolean flag to specified value
    function setMinimizedState(state) {
        isMinimized = state;
    }
    that.setMinimizedState = setMinimizedState;

    // return value of boolean flag representing minimized state
    function  getMinimizedState() {
        return isMinimized;
    }
    that.getMinimizedState = getMinimizedState;

    // toggle track minimization
    function toggleMinimized() {
        isMinimized = !isMinimized;
        if (Math.ceil(titlediv.height()) === LADS.TourAuthoring.Constants.trackHeight) {
            titlediv.height(LADS.TourAuthoring.Constants.minimizedTrackHeight);
            my.track.height(LADS.TourAuthoring.Constants.minimizedTrackHeight);
            if (mygroup) {
                mygroup.style('display', 'none');
            }
        } else {
            titlediv.height(LADS.TourAuthoring.Constants.trackHeight);
            my.track.height(LADS.TourAuthoring.Constants.trackHeight);
            if (mygroup) {
                mygroup.style('display', null);
            }
        }
        var i;
        for (i = 0; i < my.displays.length; i++) {
            var cd = my.displays[i];
            cd.toggleCircles();
        }
        drawLines();
        my.timeline.updateVerticalScroller();
        my.timeline.enableDisableDrag();
    }


    return that;
};