/// <reference path="LADS.TourAuthoring.InkTrack.js" />
LADS.Util.makeNamespace('LADS.TourAuthoring.ComponentControls');



/**
 * Controls for adding Components, editing properties of them, and undo/redo buttons
 * @param spec  root, timeline, timeManager attr
 * @param my    not used
 */
LADS.TourAuthoring.ComponentControls = function (spec, my) {
    "use strict";

    var functionsPanel = $(document.createElement('div')),
        functionsPanelDocfrag = document.createDocumentFragment(),
        catalogPicker = $(document.createElement('div')),
        associatedMediaPicker = $(document.createElement('div')),
        that = {},
        root = spec.root,
        playbackControls = spec.playbackControls,
        timeManager = spec.timeManager,
        timeline = spec.timeline,
        viewer = spec.viewer,
        tourobj = spec.tourobj,
        undoManager = spec.undoManager,
        inkAuthoring,
        inkTransparencyControls, inkTextControls, inkDrawControls, inkEditTransparency, inkEditText, inkEditDraw,
        addCompButtonHeight,
        myPicker, resizableHeight,
        artQueue = LADS.Util.createQueue(),
        PICKER_SEARCH_TEXT = 'Search by Name, Artist, or Year...',
        IGNORE_IN_SEARCH = ['visible', 'exhibits', 'selected'],
        rinContainer = viewer.getContainer(),
        isUploading = false;

    functionsPanelDocfrag.appendChild(functionsPanel[0]);
    timeline.setCompControl(that);
    var catalogPickerOverlay = LADS.Util.UI.blockInteractionOverlay();
    $(catalogPickerOverlay).addClass('catalogPickerOverlay');
    $(catalogPickerOverlay).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex);

    var associatedMediaPickerOverlay = LADS.Util.UI.blockInteractionOverlay();
    $(associatedMediaPickerOverlay).addClass('associatedMediaPickerOverlay');
    $(associatedMediaPickerOverlay).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex);    
    
    /**
     * Display warning message if ink cannot be loaded
     * @param displayString     String describing error (to be displayed)
     */
    function creationError(displayString) {
        var messageBox = LADS.Util.UI.popUpMessage(null, displayString, null);
        $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
        $('body').append(messageBox);
        $(messageBox).fadeIn(500);

        timeline.onUpdate(true);
    }

    (function _createHTML() {

        function ctrlZHandler(evt) {
            if (evt.keyCode === 90 && evt.ctrlKey) {
                if (!onCtrlZCalled) {
                    onCtrlZCalled = true;
                    root.on('keyup.z', function (evt) {
                        onCtrlZCalled = false;
                        root.off('keyup.z');
                        if (timeline.getEditInkOn()) {//in ink authoring mode
                            if (evt.shiftKey) {
                                inkAuthoring.getInkUndoManager().redo();
                            }

                            else {
                                inkAuthoring.getInkUndoManager().undo();
                            }

                        }
                        else {
                            if (evt.shiftKey) {
                                undoManager.redo();
                            }
                            else {
                                undoManager.undo();
                            }
                        }
                    });
                }
            }

            else if (evt.keyCode === 89 && evt.ctrlKey) {
                root.on('keyup.y', function (evt) {
                    root.off('keyup.y');

                    if ((inkAuthoring !== null) && (inkAuthoring.getInkUndoManager())) {//in ink authoring mode
                        inkAuthoring.getInkUndoManager().redo();
                    }
                    else {
                        undoManager.redo();

                    }
                });
            }
        }
        //code to handle undo-redo using ctrl-z
        var onCtrlZCalled = false;
        root.on('keydown', ctrlZHandler);

        var maxFontSize = 48;
        var currentFontSize;
        /**
         * Method called when "Edit Ink" is clicked on a draw-type ink track.
         * Creates a new InkController and loads in the datastring of the track.
         * Shows the edit draw controls.
         * If the ink is linked, need to position it correctly using keyframes and size of artwork.
         * @param track        the ink track in question
         * @param datastring   the track's ink datastring (see InkController.js for format)
         */
        var myEditDrawPicker = null;
        function showEditDraw(track, datastring) {
            playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
            var cw, ch, initKeyframe, artname, proxy,
                linked = track.getInkEnabled(),
                linkedTrack = track.getInkLink();

            // gotta do this up here to do creation check
            if (linked) {
                artname = linkedTrack.getTitle();

                var proxy_div = $("[data-proxy='" + artname + "']");
                proxy = {
                    x: proxy_div.data("x"),
                    y: proxy_div.data("y"),
                    w: proxy_div.data("w"),
                    h: proxy_div.data("h")
                };

                var keyframe = viewer.captureKeyframe(artname);
                if (!keyframe) {
                    track.setIsVisible(true);
                    creationError("The track this ink is attached to must be fully on screen in order to edit this ink. Please seek to a location where the track is visible.");
                    return false;
                }
                var kfvx, kfvy, kfvw, kfvh,
                    linkType = linkedTrack.getType();
                if (linkType === LADS.TourAuthoring.TrackType.artwork) {
                    kfvx = keyframe.state.viewport.region.center.x;
                    kfvy = keyframe.state.viewport.region.center.y;
                    kfvw = keyframe.state.viewport.region.span.x;
                    kfvh = keyframe.state.viewport.region.span.y;
                }
                else if (linkType === LADS.TourAuthoring.TrackType.image) {
                    kfvw = 1.0 / keyframe.state.viewport.region.span.x;
                    var rw = keyframe.state.viewport.region.span.x * $("#rinplayer").width();
                    kfvh = keyframe.state.viewport.region.span.y; // not used
                    kfvx = -keyframe.state.viewport.region.center.x * kfvw;
                    kfvy = -($("#rinplayer").height() / rw) * keyframe.state.viewport.region.center.y;
                }
            }
            //hide any open component controls, show inkEditDraw
            hideInkControls();
            //var newHeight = functionsPanel.parent().height() - addComponentLabel.offset().top - 10;
            inkEditDraw.css({ 'display': 'block' });

            //make sure the initial size of the panel is the full height of the resizable area
            var raTop = $("#resizableArea").offset().top;
            var raHeight = $("#resizableArea").height();
            inkEditDraw.css("height", raTop + raHeight - inkEditDraw.offset().top - 10);

            brushEditLabel.text("Brush: ");
            brushEditLabel1.text("7px");
            brushEditLabel.append(brushEditLabel1);
            brushEditSliderPoint.css("left", "0px");
            eraserEditLabel.text("Eraser: ");
            eraserEditLabel1.text("7px");
            eraserEditLabel.append(eraserEditLabel1);
            eraserEditSliderPoint.css("left", "0px");
            opacityEditLabel.text("Opacity: ");
            opacityEditLabel1.text("100%");
            opacityEditLabel.append(opacityEditLabel1);
            opacityEditSliderPoint.css("left", (0.87 * opacityEditSlider.width()) + "px");

            //reset click and save handlers to deal with current datastring
            cancelEditDrawButton.off('click');
            cancelEditDrawButton.on('click', function () {
                track.setIsVisible(true);
                timeline.setEditInkOn(false);
                timeline.onUpdate(true);
                timeline.setModifyingInk(false);
                timeline.hideEditorOverlay();

                brushEditSliderPoint.attr('value', 7.0);
                currentInkController.updatePenWidth("brushEditSlider");
                currentInkController.remove_all();
                removeInkCanv();
                inkEditDraw.hide();
                
                playbackControls.undoButton.off('click'); //reset undo/redo buttons to global undo/redo functionality
                playbackControls.redoButton.off('click');
                playbackControls.undoButton.on('click', function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on('click', function () {
                    undoManager.redo();
                });
                playbackControls.undoRedoInkOnly.css('display', 'none');
            });

            saveDrawButton.off('click');
            saveDrawButton.on('click', function () {
                saveDraw();
                timeline.hideEditorOverlay();
                timeline.setEditInkOn(false);
                timeline.setModifyingInk(false);
            });

            function saveDraw() {
                //first, check if the ink is empty
                if (currentInkController.isDatastringEmpty(currentInkController.update_datastring())) {
                    var confirmationBox = LADS.Util.UI.PopUpConfirmation(function () {
                        //delete track
                        track.setIsVisible(true);

                        var command = LADS.TourAuthoring.Command({
                            execute: function () {
                                timeline.removeTrack(track);
                            },
                            unexecute: function () {
                                track.reloadTrack();
                            }
                        });
                        undoManager.logCommand(command);
                        command.execute();
                        //hide ink controls and removeinkcanv
                        inkEditDraw.hide();
                        removeInkCanv();
                        //change the undomanager back fron ink only
                        playbackControls.undoButton.off('click'); //reset undo/redo buttons to global undo/redo functionality
                        playbackControls.redoButton.off('click');
                        playbackControls.undoButton.on('click', function () {
                            undoManager.undo();
                        });
                        playbackControls.redoButton.on('click', function () {
                            undoManager.redo();
                        });
                        playbackControls.undoRedoInkOnly.css('display', 'none');

                    }, "You have created an empty ink. Would you like to delete ink track or go back to editing?", "Delete Track", true);
                    root.append(confirmationBox);
                    $(confirmationBox).show();
                    return;
                }
                //reset the initial keyframe and relative artwork positioning in the track data
                if (linked) {
                    var currcanv = $('#inkCanv');

                    var new_proxy_div = $("[data-proxy='" + artname + "']"); //proxy for the artwork -- keeps track of dimensions
                    var new_proxy = {
                        x: new_proxy_div.data("x"),
                        y: new_proxy_div.data("y"),
                        w: new_proxy_div.data("w"),
                        h: new_proxy_div.data("h")
                    };

                    var new_keyframe = viewer.captureKeyframe(artname);

                    if (!new_keyframe) {
                        creationError("The track this ink is attached to must be fully on screen in order to save this ink. Please seek to a location where the track is visible.");
                        return false;
                    }
                    var new_kfvx, new_kfvy, new_kfvw, new_kfvh,
                        linkType = linkedTrack.getType();
                    if (linkType === LADS.TourAuthoring.TrackType.artwork) {
                        new_kfvx = new_keyframe.state.viewport.region.center.x;
                        new_kfvy = new_keyframe.state.viewport.region.center.y;
                        new_kfvw = new_keyframe.state.viewport.region.span.x;
                        new_kfvh = new_keyframe.state.viewport.region.span.y;
                    }
                    else if (linkType === LADS.TourAuthoring.TrackType.image) {
                        new_kfvw = 1.0 / new_keyframe.state.viewport.region.span.x;
                        var rw = new_keyframe.state.viewport.region.span.x * currcanv.width();
                        new_kfvh = new_keyframe.state.viewport.region.span.y; // not used
                        new_kfvx = -new_keyframe.state.viewport.region.center.x * new_kfvw;
                        new_kfvy = -(currcanv.height() / rw) * new_keyframe.state.viewport.region.center.y;
                    }
                    track.setInkInitKeyframe({ "x": new_kfvx, "y": new_kfvy, "w": new_kfvw, "h": new_kfvh });
                    track.setInkRelativeArtPos(currentInkController.getArtRelativePos(new_proxy, currcanv.width(), currcanv.height()));
                }
                var datastr = currentInkController.update_datastring();
                var oldDataStr = track.getInkPath();

                var command = LADS.TourAuthoring.Command({
                    execute: function () {
                        track.setInkPath(datastr);
                        timeline.onUpdate(true);
                    },
                    unexecute: function () {
                        track.setInkPath(oldDataStr);
                        timeline.onUpdate(true);
                    },
                });

                currentInkController.remove_all();
                removeInkCanv();
                inkEditDraw.hide();

                track.setIsVisible(true);

                undoManager.logCommand(command);
                command.execute();

                //timeline.onUpdate(true);

                playbackControls.undoButton.off("click");
                playbackControls.redoButton.off("click");

                playbackControls.undoButton.on('click', function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on('click', function () {
                    undoManager.redo();
                });
                playbackControls.undoRedoInkOnly.css('display', 'none');


                if (inkAuthoring) {
                    inkAuthoring.getInkUndoManager().clear();
                    undoManager.greyOutBtn();
                }
            }
            that.saveDraw = saveDraw;
            hideAll(drawEditArray);

            //create a div on which we'll draw inks

            var inkdiv = createInkCanv();
            var p1 = new LADS.TourAuthoring.InkAuthoring("inkCanv", null, "componentControls", spec);
            inkAuthoring = p1;
            p1.set_editable();
            p1.set_mode(LADS.TourAuthoring.InkMode.draw);
            p1.updatePenWidth("brushSlider");
            p1.updatePenOpacity("opacitySlider");

            if (linked) {
                //if the ink is linked, need to figure out where to place it beyond loading in the original datastring
                initKeyframe = track.getInkInitKeyframe();
                p1.setInitKeyframeData(initKeyframe);
                p1.setArtName(artname);
                p1.retrieveOrigDims();
                p1.setEID(track.getTitle());
            }

            p1.loadInk(datastring); //load in the ink to be edited

            if (linked) {
                //now adjust viewbox so art is at the proper coordinates
                p1.update_datastring();
                p1.setOldOpac(1);
                p1.adjustViewBoxDiv({ x: proxy.x, y: proxy.y, width: proxy.w, height: proxy.h });
                p1.drawPaths();
            }

            currentInkController = p1;


            //call onUpdate to remove the existing ink before reloading it in edit mode
            timeline.onUpdate(true);
            timeline.showEditorOverlay();
            timeline.setEditInkOn(true);
        }
        that.showEditDraw = showEditDraw;

        /**
         * Method called when "Edit Ink" is clicked on a block/isolate-type ink track.
         * See comments for showEditDraw.
         * @param track        the ink track in question
         * @param datastring   the track's ink datastring
         * @param trans_type   'isolate' or 'block'
         */
        function getInkUndoManager() {
            if (inkAuthoring)
                return inkAuthoring.getInkUndoManager();
        }
        that.getInkUndoManager = getInkUndoManager;

        function showEditTransparency(track, datastring, trans_type) {
            playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
            var cw, ch, initKeyframe, artname, proxy, proxy_h, proxy_w,
                kfvx, kfvy, kfvw, kfvh,
                linked = track.getInkEnabled(),
                linkedTrack = track.getInkLink();

            if (linked) {
                initKeyframe = track.getInkInitKeyframe();
                artname = linkedTrack.getTitle();
                var proxy_div = $("[data-proxy='" + artname + "']");
                proxy = {
                    x: proxy_div.data("x"),
                    y: proxy_div.data("y"),
                    w: proxy_div.data("w"),
                    h: proxy_div.data("h")
                };

                var keyframe = viewer.captureKeyframe(artname);

                if (!keyframe) {
                    track.setIsVisible(true);
                    creationError("The track this ink is attached to must be fully on screen in order to edit this ink. Please seek to a location where the track is visible.");
                    return false;
                }

                if (track.getInkLink().getType() === LADS.TourAuthoring.TrackType.artwork) {
                    kfvx = keyframe.state.viewport.region.center.x;
                    kfvy = keyframe.state.viewport.region.center.y;
                    kfvw = keyframe.state.viewport.region.span.x;
                    kfvh = keyframe.state.viewport.region.span.y;
                }
                else if (track.getInkLink().getType() === LADS.TourAuthoring.TrackType.image) {
                    kfvw = 1.0 / keyframe.state.viewport.region.span.x;
                    var rw = keyframe.state.viewport.region.span.x * $("#rinplayer").width();
                    kfvh = keyframe.state.viewport.region.span.y; // not used
                    kfvx = -keyframe.state.viewport.region.center.x * kfvw;
                    kfvy = -($("#rinplayer").height() / rw) * keyframe.state.viewport.region.center.y;
                }
            }
            

            inkTransparencyControls.css({ 'display': 'none' });
            inkTextControls.css({ 'display': 'none' });
            inkDrawControls.css({ 'display': 'none' });
            inkEditDraw.css('display', 'none');
            inkEditText.css('display', 'none');
            inkEditTransparency.show();

            //var newHeight = functionsPanel.parent().height() - addComponentLabel.offset().top - 10;
            var raTop = $("#resizableArea").offset().top;
            var raHeight = $("#resizableArea").height();
            inkEditTransparency.css({
                "height": raTop + raHeight - inkEditTransparency.offset().top - 10
            });
            

            opacityEditTransparencyLabel.text("Opacity: ");
            opacityEditTransparencyLabel1.text("80%");
            opacityEditTransparencyLabel.append(opacityEditTransparencyLabel1);    
            opacityEditTransparencySliderPoint.css("left", 0.8 * (opacityEditTransparencySlider.offset().left + opacityEditTransparencySlider.width()) / 1.28 + 'px');

            cancelEditTransButton.off('click');
            cancelEditTransButton.on('click', function () {
                track.setIsVisible(true);
                timeline.onUpdate(true);
                timeline.setModifyingInk(false);
                timeline.setEditInkOn(false);
                timeline.hideEditorOverlay();

                currentInkController.remove_all();
                removeInkCanv();
                inkEditTransparency.hide();

                playbackControls.undoButton.off("click");
                playbackControls.redoButton.off("click");

                playbackControls.undoButton.on('click', function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on('click', function () {
                    undoManager.redo();
                });
                playbackControls.undoRedoInkOnly.css('display', 'none');
            });

            saveTransButton.off("click");
            saveTransButton.on('click', function () {
                saveTrans();
                timeline.hideEditorOverlay();
                timeline.setModifyingInk(false);
                timeline.setEditInkOn(false);
            });

            function saveTrans() {
                var datastr;

                //first, check if the ink is empty
                if (currentInkController.isDatastringEmpty(currentInkController.update_datastring())) {
                    var confirmationBox = LADS.Util.UI.PopUpConfirmation(function () {
                        //delete track
                        track.setIsVisible(true);

                        var command = LADS.TourAuthoring.Command({
                            execute: function () {
                                timeline.removeTrack(track);
                            },
                            unexecute: function () {
                                track.reloadTrack();
                            }
                        });
                        undoManager.logCommand(command);
                        command.execute();
                        //hide ink controls and removeinkcanv
                        inkEditTransparency.hide();
                        removeInkCanv();
                        //change the undomanager back fron ink only
                        playbackControls.undoButton.off('click'); //reset undo/redo buttons to global undo/redo functionality
                        playbackControls.redoButton.off('click');
                        playbackControls.undoButton.on('click', function () {
                            undoManager.undo();
                        });
                        playbackControls.redoButton.on('click', function () {
                            undoManager.redo();
                        });
                        playbackControls.undoRedoInkOnly.css('display', 'none');

                    }, "You have created an empty ink. Would you like to delete ink track or go back to editing?", "Delete Track", true);
                    root.append(confirmationBox);
                    $(confirmationBox).show();
                    return;
                }
                if (linked) {
                    var currcanv = $('#inkCanv');

                    var new_proxy_div = $("[data-proxy='" + artname + "']"); //proxy for the artwork -- keeps track of dimensions
                    var new_proxy = {
                        x: new_proxy_div.data("x"),
                        y: new_proxy_div.data("y"),
                        w: new_proxy_div.data("w"),
                        h: new_proxy_div.data("h")
                    };

                    var new_keyframe = viewer.captureKeyframe(artname);

                    if (!new_keyframe) {
                        creationError("The track this ink is attached to must be fully on screen in order to save this ink. Please seek to a location where the track is visible.");
                        return false;
                    }
                    var new_kfvx, new_kfvy, new_kfvw, new_kfvh,
                        linkType = linkedTrack.getType();
                    if (linkType === LADS.TourAuthoring.TrackType.artwork) {
                        new_kfvx = new_keyframe.state.viewport.region.center.x;
                        new_kfvy = new_keyframe.state.viewport.region.center.y;
                        new_kfvw = new_keyframe.state.viewport.region.span.x;
                        new_kfvh = new_keyframe.state.viewport.region.span.y;
                    }
                    else if (linkType === LADS.TourAuthoring.TrackType.image) {
                        new_kfvw = 1.0 / new_keyframe.state.viewport.region.span.x;
                        var rw = new_keyframe.state.viewport.region.span.x * currcanv.width();
                        new_kfvh = new_keyframe.state.viewport.region.span.y; // not used
                        new_kfvx = -new_keyframe.state.viewport.region.center.x * new_kfvw;
                        new_kfvy = -(currcanv.height() / rw) * new_keyframe.state.viewport.region.center.y;
                    }
                    track.setInkInitKeyframe({ "x": new_kfvx, "y": new_kfvy, "w": new_kfvw, "h": new_kfvh });
                    track.setInkRelativeArtPos(currentInkController.getArtRelativePos(new_proxy, currcanv.width(), currcanv.height()));
                }

                //need to convert rectangles/ellipses to paths before updating datastring
                currentInkController.get_trans_shape_data();
                datastr = currentInkController.update_datastring();
                datastr += currentInkController.getBoundingShapes(); //save the rect/ellipse data in case we need to edit again

                var oldDataStr = track.getInkPath();

                var command = LADS.TourAuthoring.Command({
                    execute: function () {
                        track.setInkPath(datastr);
                        timeline.onUpdate(true);
                    },
                    unexecute: function () {
                        track.setInkPath(oldDataStr);
                        timeline.onUpdate(true);
                    },
                });

                track.setIsVisible(true);

                undoManager.logCommand(command);
                command.execute();

                currentInkController.remove_all();
                removeInkCanv();
                inkEditTransparency.hide();

                playbackControls.undoButton.off("click");
                playbackControls.redoButton.off("click");
                playbackControls.undoButton.on("click", function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on("click", function () {
                    undoManager.redo();
                });
                playbackControls.undoRedoInkOnly.css('display', 'none');

                if (inkAuthoring){
                    inkAuthoring.getInkUndoManager().clear();
                    undoManager.greyOutBtn();
                }
            }
            that.saveTrans = saveTrans;

            hideAll(transEditArray);

            var inkdiv = createInkCanv();
            var p1 = new LADS.TourAuthoring.InkAuthoring("inkCanv", null, "componentControls", spec);
            inkAuthoring = p1;
            p1.set_mode(LADS.TourAuthoring.InkMode.shapes); //shape manipulation mode
            p1.set_editable();
            p1.setMarqueeFillOpacity(p1.get_attr(datastring, 'opac', 'f'));
            if (linked) {
                //get the inkController set to load ink in the correct position
                p1.setInitKeyframeData(initKeyframe);
                p1.setArtName(artname);
                cw = $("#inkCanv").width();
                ch = $("#inkCanv").height();
                p1.retrieveOrigDims();
                p1.setEID(track.getTitle());
            }
            var currentMode =datastring.split("mode")[1].split("[")[0].replace("]", "");
            p1.setTransMode(trans_type);
            p1.load_transparency_bounding_shapes(datastring);
            if (currentMode === 'isolate') {
                isolateEditLabel.css({ 'color': 'black' });
                blockEditLabel.css({ 'color': 'gray' });
                transparencyEditMode = 'isolate';
                transEditModeLabel1.text("Isolate");
                p1.setTransMode("isolate");
            }
            if (currentMode === 'block') {
                isolateEditLabel.css({ 'color': 'gray' });
                blockEditLabel.css({ 'color': 'black' });
                transparencyEditMode = 'block';
                transEditModeLabel1.text("Block");
                p1.setTransMode("block");
            }
            if (linked) {
                //now adjust viewbox so art is at the proper coordinates
                var real_kfw = p1.origPaperW / kfvw;
                var real_kfh = real_kfw * proxy_h / proxy_w;
                var real_kfx = -kfvx * real_kfw;
                var real_kfy = -kfvy * real_kfw;
                p1.update_datastring();
                p1.setOldOpac(1);
                p1.adjustViewBoxDiv({ x: proxy.x, y: proxy.y, width: proxy.w, height: proxy.h });
            }
            currentInkController = p1;
            var currOpacity = currentInkController.getMarqueeFillOpacity();
            opacityEditTransparencyLabel1.text(Math.round(100 * currOpacity) + "%");
            opacityEditTransparencyLabel.append(opacityEditTransparencyLabel1);
            opacityEditTransparencySliderPoint.css("left", currOpacity * (opacityEditTransparencySlider.offset().left + opacityEditTransparencySlider.width()) / 1.28 + 'px');

            //call onUpdate to remove the existing ink before reloading it in edit mode
            timeline.onUpdate(true);
            timeline.showEditorOverlay();
        }
        that.showEditTransparency = showEditTransparency;

        /**
         * Method called when "Edit Ink" is clicked on a text-type ink track.
         * See comments for showEditDraw.
         * @param track        the ink track in question
         * @param datastring   the track's ink datastring
         */
        var myEditTextPicker = null;
        function showEditText(track, datastring, dims) {
            playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
            var cw, ch, initKeyframe, rap, artname, proxy,
                linked = track.getInkEnabled(),
                linkedTrack = track.getInkLink();

            if (linked) {
                initKeyframe = track.getInkInitKeyframe();
                artname = linkedTrack.getTitle();

                var proxy_div = $("[data-proxy='" + artname + "']");
                proxy = {
                    x: proxy_div.data("x"),
                    y: proxy_div.data("y"),
                    w: proxy_div.data("w"),
                    h: proxy_div.data("h")
                };

                var keyframe = viewer.captureKeyframe(artname);
                if (!keyframe) {
                    track.setIsVisible(true);
                    creationError("The track this ink is attached to must be fully on screen in order to edit this ink. Please seek to a location where the track is visible.");
                    return false;
                }

                var kfvx, kfvy, kfvw, kfvh,
                    linkType = linkedTrack.getType();
                if (linkType === LADS.TourAuthoring.TrackType.artwork) {
                    kfvx = keyframe.state.viewport.region.center.x;
                    kfvy = keyframe.state.viewport.region.center.y;
                    kfvw = keyframe.state.viewport.region.span.x;
                    kfvh = keyframe.state.viewport.region.span.y;
                }
                else if (linkType === LADS.TourAuthoring.TrackType.image) {
                    kfvw = 1.0 / keyframe.state.viewport.region.span.x;
                    var rw = keyframe.state.viewport.region.span.x * $("#rinplayer").width();
                    kfvh = keyframe.state.viewport.region.span.y; // not used
                    kfvx = -keyframe.state.viewport.region.center.x * kfvw;
                    kfvy = -($("#rinplayer").height() / rw) * keyframe.state.viewport.region.center.y;
                }
            }
            
            hideInkControls();
            inkEditText.show();

            //var newHeight = functionsPanel.parent().height() - addComponentLabel.offset().top - 10;
            var raTop = $("#resizableArea").offset().top;
            var raHeight = $("#resizableArea").height();
            inkEditText.css({
                "height": raTop + raHeight - inkEditText.offset().top - 10
            });
            

            fontEditLabel.text("Font: ");
            fontEditLabel1.text("Times New Roman");
            fontEditLabel.append(fontEditLabel1);
            textEditSliderPoint.css("left", "0px");
            textEditSizeLabel.text("Text Size: ");
            hideAll(textEditArray);

            cancelEditTextButton.off("click");
            cancelEditTextButton.on("click", function () {
                track.setIsVisible(true);
                timeline.onUpdate(true);
                timeline.setModifyingInk(false);
                timeline.setEditInkOn(false);
                timeline.hideEditorOverlay();
                currentInkController.resetText();
                currentInkController.remove_all();
                removeInkCanv();
                inkEditText.hide();

                playbackControls.undoButton.off("click");
                playbackControls.redoButton.off("click");

                playbackControls.undoButton.on("click", function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on("click", function () {
                    undoManager.redo();
                });
                playbackControls.undoRedoInkOnly.css('display', 'none');
            });

            saveTextButton.off("click");
            saveTextButton.on("click", function () {
                saveText();
                textEditArea.val("");
                textEditBodyLabel1.text("");
                timeline.hideEditorOverlay();
                timeline.setModifyingInk(false);
                timeline.setEditInkOn(false);
            });

            function saveText() {
                //first, check if the ink is empty
                if (currentInkController.isTextboxEmpty()) {
                    var confirmationBox = LADS.Util.UI.PopUpConfirmation(function () {
                        //delete track
                        track.setIsVisible(true);
                        var command = LADS.TourAuthoring.Command({
                            execute: function () {
                                timeline.removeTrack(track);
                            },
                            unexecute: function () {
                                track.reloadTrack();
                            }
                        });
                        undoManager.logCommand(command);
                        command.execute();

                        //hide ink controls and removeinkcanv
                        inkEditText.hide();
                        removeInkCanv();

                        //change the undomanager back fron ink only
                        playbackControls.undoButton.off('click'); //reset undo/redo buttons to global undo/redo functionality
                        playbackControls.redoButton.off('click');
                        playbackControls.undoButton.on('click', function () {
                            undoManager.undo();
                        });
                        playbackControls.redoButton.on('click', function () {
                            undoManager.redo();
                        });
                        playbackControls.undoRedoInkOnly.css('display', 'none');

                    }, "You have created an empty ink. Would you like to delete ink track or go back to editing?", "Delete Track", true);
                    root.append(confirmationBox);
                    $(confirmationBox).show();
                    return;
                }
                if (linked) {
                    var currcanv = $('#inkCanv');

                    var new_proxy_div = $("[data-proxy='" + artname + "']"); //proxy for the artwork -- keeps track of dimensions
                    var new_proxy = {
                        x: new_proxy_div.data("x"),
                        y: new_proxy_div.data("y"),
                        w: new_proxy_div.data("w"),
                        h: new_proxy_div.data("h")
                    };

                    var new_keyframe = viewer.captureKeyframe(artname);

                    if (!new_keyframe) {
                        creationError("The track this ink is attached to must be fully on screen in order to save this ink. Please seek to a location where the track is visible.");
                        return false;
                    }
                    var new_kfvx, new_kfvy, new_kfvw, new_kfvh,
                        linkType = linkedTrack.getType();
                    if (linkType === LADS.TourAuthoring.TrackType.artwork) {
                        new_kfvx = new_keyframe.state.viewport.region.center.x;
                        new_kfvy = new_keyframe.state.viewport.region.center.y;
                        new_kfvw = new_keyframe.state.viewport.region.span.x;
                        new_kfvh = new_keyframe.state.viewport.region.span.y;
                    }
                    else if (linkType === LADS.TourAuthoring.TrackType.image) {
                        new_kfvw = 1.0 / new_keyframe.state.viewport.region.span.x;
                        var rw = new_keyframe.state.viewport.region.span.x * currcanv.width();
                        new_kfvh = new_keyframe.state.viewport.region.span.y; // not used
                        new_kfvx = -new_keyframe.state.viewport.region.center.x * new_kfvw;
                        new_kfvy = -(currcanv.height() / rw) * new_keyframe.state.viewport.region.center.y;
                    }
                    track.setInkInitKeyframe({ "x": new_kfvx, "y": new_kfvy, "w": new_kfvw, "h": new_kfvh });
                    track.setInkRelativeArtPos(currentInkController.getArtRelativePos(new_proxy, currcanv.width(), currcanv.height()));
                }

                track.setInkPath(currentInkController.update_datastring()); //======== can call currentInkController.update_datastring here to get the most recent ink path (getDatastring assumes it's already been called)
                removeInkCanv();
                inkEditText.hide();

                track.setIsVisible(true);

                playbackControls.undoButton.off("click");
                playbackControls.redoButton.off("click");

                playbackControls.undoButton.on("click", function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on("click", function () {
                    undoManager.redo();
                });
                playbackControls.undoRedoInkOnly.css('display', 'none');

                colorTextLabel1.text("#FFFFFF");
                $('#textColorToggle').attr('value', "FFFFFF");

                if (inkAuthoring) {
                    inkAuthoring.getInkUndoManager().clear();
                    undoManager.greyOutBtn();
                }
                timeline.onUpdate();
            }
            that.saveText = saveText;

            var inkdiv = createInkCanv();
            var p1 = new LADS.TourAuthoring.InkAuthoring("inkCanv", null, "componentControls", spec);
            inkAuthoring = p1;
            cw = $("#inkCanv").width();
            ch = $("#inkCanv").height();
            p1.set_mode(LADS.TourAuthoring.InkMode.text);
            p1.set_editable();

            var fontsize, line_breaks, num_lines;
            fontsize = p1.get_attr(datastring, "fontsize", 'f') * ch;
            p1.setFontSize(fontsize);
            maxFontSize = Math.max(48, fontsize);
            var str = p1.get_attr(datastring, 'str', 's');
            textEditArea.val(str);
            textEditBodyLabel1.text(str);
            
            var scaleFactor = dims.fontsize / fontsize;

            var w, h;
            try {
                w = p1.get_attr(datastring, 'w', 'f');
                w = linked ? w * scaleFactor : w;
                h = p1.get_attr(datastring, 'h', 'f');
                h = linked ? h * scaleFactor : h;
            } catch (err) {
                w = null;
                h = null;
            }

            if (linked) {
                p1.setInitKeyframeData(initKeyframe);
                p1.setArtName(artname);
                p1.retrieveOrigDims();
                p1.setEID(track.getTitle());
                p1.loadInk(datastring);
                p1.adjustViewBoxDiv({ x: proxy.x, y: proxy.y, width: proxy.w, height: proxy.h });
            }
            var textX = p1.getPannedPos().x || p1.get_attr(datastring, "x", "f") * cw;
            var textY = p1.getPannedPos().y || p1.get_attr(datastring, "y", "f") * ch;
            p1.setFontFamily(p1.get_attr(datastring, "font", 's'));
            p1.setFontColor(p1.get_attr(datastring, "color", 's'));
            p1.add_text_box(textX, textY, w, h, str); // 5px seems to be standard textarea padding
            var svgText = p1.getSVGText();
            
            currentFontSize = fontsize;
            textEditSizeLabel1.text(Math.round(fontsize) + "px");
            textEditSizeLabel.append(textEditSizeLabel1);
            var pointvalue = (fontsize - 8) / (maxFontSize - 8);
            textEditSizeSlider.attr("value", Math.round(fontsize) + "px");
            //console.log(pointleft);
            var currentcolor = p1.get_attr(datastring, "color", 's'); //update the current color
            colorEditTextLabel1.text(currentcolor);
            
            //myPicker = new jscolor.color(itemEditText, {});
            myEditTextPicker.fromString(currentcolor);
            currentInkController = p1;
            firstUpdate();
            updateToggle(textEditArray, textEditArea);

            timeline.onUpdate(true);
            timeline.showEditorOverlay();

        }
        that.showEditText = showEditText;

        functionsPanel.attr('id', 'component-controls');
        functionsPanel.css({
            "background-color": "rgb(219,218,199)", "height": "48px", "width": "20%", 'top': '15px',
            'left': '0%', 'position': 'relative', 'float': 'left',
        }); // Had to do tops and heights as CSS to prevent overlap on small screens

        /** Drop Down icon
         *  Modified By: Hak
         */
        var addDropDownIconComponent = $(document.createElement('img'));
        addDropDownIconComponent.attr('id', 'addDropDownIconComponent');
        addDropDownIconComponent.attr('src', 'images/icons/Down.png');
        addDropDownIconComponent.css({ 'width': '10%', 'margin-left': '35%', 'height': '10%' });

        /**
         * Add parts of function panel
         */
        // Add Component menu - main button
        var menuOffsetL = '13%';
        var addComponentLabel = $(document.createElement('label'));
        addComponentLabel.text("Add Track");
        addComponentLabel.attr('id', 'addComponentLabel');
        addComponentLabel.css({
            "left": menuOffsetL, "top": "5%", "position": "relative",
            "font-size": LADS.Util.getFontSize(200), "color": "rgb(256, 256, 256)",
            //Using the current background color value multiplied by the ( 1- alpha value )
            'background-color': "rgb(65, 65, 59)",
            'padding': '3% 2% 4% 2%',
            'width': '70%',
            'float': 'left',
        });
        addComponentLabel.append(addDropDownIconComponent);
        functionsPanel.append(addComponentLabel);

        //fade overlay appears when AddComponent is opened -- allows addComponent to be closed when clicking away
        var fade = $(document.createElement('div'));
        fade.css({
            width: "100%",
            height: "100%",
            position: "fixed",
            top: '0px',
            left: '0px',
            //'background-color': 'rgba(0,0,0,.5)',
            'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex + 18
        });
        fade.attr("class", "fade");
        functionsPanel.append(fade);
        fade.hide();

        //fades "Add Component" menus away when click happens outside the menus
        fade.on('mousedown', function (evt) {
            fade.hide();
            componentDropDown = false;
            addDropDownIconComponent.css({ 'transform': 'scaleY(1)', 'margin-bottom': '2%' });
            dropInk.hide();
            dropFile.hide();
            dropMain.hide();
        });

        // Dropdown menus:
        // Main section
        var dropMain = $(document.createElement('div'));
        dropMain.css({
            "left": menuOffsetL,
            "position": "relative",
            "color": "rgb(256, 256, 256)",
            'width': '74%',
            'background-color': 'rgba(0,0,0,0.7)',
            'float': 'left',
            'clear': 'left',
            'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex + 19
        });
        functionsPanel.append(dropMain);
        dropMain.hide();

        // create the buttons to add various components
        var artButton = _createAddComponentButton("Artwork", dropMain);
        var assetButton = _createAddComponentButton("Associated Media", dropMain);
        var fileButton = _createAddComponentButton("From File", dropMain);
        var inkButton = _createAddComponentButton("Ink", dropMain);

        //File uploading subsection -Xiaoyi
        var dropFile = $(document.createElement('div'));
        dropFile.css({
            "left": '87%',
            'margin-top': '-33%',
            "position": "relative",
            "color": "rgb(256, 256, 256)",
            'width': '74%',
            'background-color': 'rgba(0,0,0,0.7)',
            'float': 'left',
            'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex + 19
        }); 
        functionsPanel.append(dropFile);
        dropFile.hide();

        var audioButton = _createAddComponentButton("Audio (Mp3)", dropFile);
        var videoButton = _createAddComponentButton("Video (Mp4)", dropFile);
        var imageButton = _createAddComponentButton("Image", dropFile);

        function exitInk() {
            removeInkCanv();
            hideInkControls();
            // set undo/redo buttons back to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");
            playbackControls.undoButton.on("click", function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on("click", function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
        }

        /**
         * Opens the correct file picker based on the file type
         */
        function pickFile() {
            var type, names = [],
                title = $(this).text(),
                initLoc = timeManager.getCurrentPx(),
                mediaLengths = [], i, upldr;

            isUploading = true;
            // Get music properties
            function getMusicPropertiesHelper(file) {
                file.properties.getMusicPropertiesAsync().done(function (musicProperties) {
                    mediaLengths.push(musicProperties.duration / 1000); // get duration in seconds
                },

                  // Handle errors with an error function
                function (error) {
                    console.log(error);
                });
            }

            if (title === "Audio (Mp3)") {
                upldr = LADS.Authoring.FileUploader(root, LADS.Authoring.FileUploadTypes.Standard,
                function (files) {
                    var file;
                    for (i = 0; i < files.length; i++) {
                        file = files[i];
                        names.push(file.displayName);
                        if (file.fileType === '.mp3') {
                            type = LADS.TourAuthoring.TrackType.audio;
                            getMusicPropertiesHelper(file);
                        }
                    }

                   
                },
                function (urls) {
                    var url, name, mediaLength;
                    for (i = 0; i < urls.length; i++) {
                        url = urls[i];
                        name = names[i];
                        mediaLength = mediaLengths[i];
                        var track = timeline.addAudioTrack(url, name, null, mediaLength);

                        // update tour length if necessary
                        //if (timeManager.getDuration().end < mediaLength + timeManager.pxToTime(initLoc)) {
                        //    timeManager.setEnd(mediaLength + timeManager.pxToTime(initLoc));
                        //}

                        //// add a display to the track
                        //track.addDisplay(initLoc, mediaLength);

                        var positionX = initLoc;
                        var displayLength = mediaLength;
                        //track.addDisplay(positionX, displayLength);
                        if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                            timeManager.setEnd(Math.min(LADS.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
                        }
                        var diff = LADS.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
                        var newDisplay = (diff < LADS.TourAuthoring.Constants.displayEpsilon) ?
                                             track.addDisplay(timeManager.timeToPx(LADS.TourAuthoring.Constants.maxTourLength - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) :
                                             track.addDisplay(positionX, Math.min(diff, displayLength));
                        
                        if (timeline.getTracks().length > 0) {
                            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                        }
                    }
                    undoManager.combineLast(2 * urls.length);
                    isUploading = false;
                },
                ['.mp3'],
                false,
                function () {
                    root.append(LADS.Util.UI.popUpMessage(null, "There was an error uploading the file. Please try again later."));
                },
                true);
                upldr.setMaxDuration(LADS.TourAuthoring.Constants.maxTourLength);
                upldr.setMinDuration(LADS.TourAuthoring.Constants.minMediaLength);
            }

            function getAudioPropertiesHelper(file) {
                file.properties.getVideoPropertiesAsync().done(function (VideoProperties) {
                    mediaLengths.push(VideoProperties.duration / 1000); // get duration in seconds
                },
                function (error) {
                    console.log(error);
                });
            }

            if (title === "Video (Mp4)") {
                upldr = LADS.Authoring.FileUploader(root, LADS.Authoring.FileUploadTypes.Standard,
                function (files) {
                    var file;
                    for (i = 0; i < files.length; i++) {
                        file = files[i];
                        names.push(file.displayName);
                        if (file.fileType === '.mp4' || file.type === '.ogg') {
                            type = LADS.TourAuthoring.TrackType.video;
                            getAudioPropertiesHelper(file);
                        }
                    }
                },
                function (urls) {
                    var url, name, mediaLength;
                    for (i = 0; i < urls.length; i++) {
                        url = urls[i];
                        name = names[i];
                        mediaLength = mediaLengths[i];
                        var track = timeline.addVideoTrack(url, name, null, mediaLength);
                        console.log("mediaLength = "+mediaLength);
                        //if (timeManager.getDuration().end < mediaLength + timeManager.pxToTime(initLoc)) {
                        //    timeManager.setEnd(mediaLength + timeManager.pxToTime(initLoc));
                        //}

                        //track.addDisplay(initLoc, mediaLength);

                        var positionX = initLoc;
                        var displayLength = mediaLength;
                        //track.addDisplay(positionX, displayLength);
                        if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                            timeManager.setEnd(Math.min(LADS.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
                        }
                        var diff = LADS.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
                        var newDisplay = (diff < LADS.TourAuthoring.Constants.displayEpsilon) ?
                                             track.addDisplay(timeManager.timeToPx(LADS.TourAuthoring.Constants.maxTourLength - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) :
                                             track.addDisplay(positionX, Math.min(diff, displayLength));
                        
                        if (timeline.getTracks().length > 0) {
                            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                        }
                    }
                    undoManager.combineLast(2 * urls.length);
                    isUploading = false;
                },
                ['.mp4'],
                false,
                function () {
                    root.append(LADS.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
                },
                true);
                upldr.setMaxDuration(LADS.TourAuthoring.Constants.maxTourLength);
                upldr.setMinDuration(LADS.TourAuthoring.Constants.minMediaLength);
            }
            if (title === "Image") {
                LADS.Authoring.FileUploader(root, LADS.Authoring.FileUploadTypes.Standard,
                function (files) {
                    for (i = 0; i < files.length; i++) {
                        names.push(files[i].displayName);
                    }
                },
                function (urls) {
                    for (i = 0; i < urls.length; i++) {
                        var track = timeline.addImageTrack(urls[i], names[i].replace(/\'/, '').replace(/\"/, ''));
                        var dispLen = Math.min(5, timeManager.getDuration().end - timeManager.pxToTime(initLoc));
                        var newDisplay = (dispLen < LADS.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(initLoc, dispLen);
                        if (dispLen < 1.5 && dispLen >= LADS.TourAuthoring.Constants.displayEpsilon) {
                            newDisplay.setIn(0);
                            newDisplay.setOut(0);
                            newDisplay.setMain(dispLen);
                        }
                        
                        if (timeline.getTracks().length > 0) { // reload tour?
                            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                        }
                    }
                    undoManager.combineLast(2 * urls.length);
                    isUploading = false;
                },
                ['.jpg', '.png', '.gif', '.tif', '.tiff'],
                false,
                function () {
                    root.append(LADS.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
                },
                true);
            }

        }

        // Ink subsection
        var dropInk = $(document.createElement('div'));
        dropInk.css({
            "left": '87%',
            'margin-top': '-16.5%',
            "position": "relative",
            "color": "rgb(256, 256, 256)",
            'width': '74%',
            'background-color': 'rgba(0,0,0,0.7)',
            'float': 'left',
            'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex + 19
        });
        functionsPanel.append(dropInk);
        dropInk.hide();

        // create ink buttons
        _createAddComponentButton("Text", dropInk);
        _createAddComponentButton("Draw", dropInk);
        _createAddComponentButton("Block/Isolate", dropInk);

        /**
         * Creates component menu buttons
         * @param title         Name of button
         * @param component     DOM element to add button to
         *@return addComponentButton     the button created.
         */
        function _createAddComponentButton(title, component) {
            var addComponentButton = $(document.createElement('label'));
            if (title === "From File")
                addComponentButton.addClass('clickable ' + 'files');
            else
                addComponentButton.addClass('clickable ' + title);
            addComponentButton.text(title);
            addComponentButton.css({
                "left": "0%",
                "position": "relative",
                "font-size": LADS.Util.getFontSize(190),
                "color": "rgb(256, 256, 256)",
                "display": "block",
                'padding': '4% 0 5% 0',
                'text-indent': '4%',
                'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex + 19
            });

            addComponentButton.on('mouseenter', function () {
                var self = $(this);
                self.css({ 'background-color': 'white', 'color': 'black' });

                switch (self.text()) {
                    case "Artwork":
                    case "Associated Media":
                        dropInk.hide();
                        dropFile.hide();
                        break;
                    case "From File":
                        dropFile.show();
                        dropInk.hide();
                        break;
                    case "Audio (Mp3)":
                    case "Video (Mp4)":
                    case "Image":
                        isInFileSubMenu = true;
                        break;
                    case "Ink":
                        if (allowInk) {
                            dropInk.show();
                            dropFile.hide();
                            //$(assetButton).data('selected', false);
                        }
                        else {
                            self.css({
                                'background-color': 'transparent',
                                'color': 'gray'
                            });
                        }
                        break;
                    case "Text":
                    case "Draw":
                    case "Block/Isolate":
                        isInInkSubMenu = true;
                        break;
                }
            });

            addComponentButton.on('mouseleave', function () {
                var self = $(this);

                self.css({ 'background-color': 'transparent', 'color': 'white' });

                if (self.text() === "Ink" && !allowInk) {
                    self.css({ 'background-color': 'transparent', 'color': 'gray' });
                }

                if (fileClick || inkClick || isInFileSubMenu || isInInkSubMenu) {
                    return;
                }

                dropFile.hide();
                dropInk.hide();
            });

            addComponentButton.on('mousedown', function (evt) {
                evt.stopImmediatePropagation();
            });

            addComponentButton.on('click', function (evt) {
                if (timeline.getEditInkOn() === true) {
                    var messageBox = LADS.Util.UI.popUpMessage(null, "An ink is already being edited.", null);
                    $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 2000000);
                    $("#resizableArea").parent().parent().append(messageBox);
                    closeComponentMenu();
                    $(messageBox).fadeIn(500);
                    return;
                }

                evt.stopImmediatePropagation();

                var self = $(this);
                // reset css of any previously selected menu items
                for (var i = 0; i < prevSelected.length; i++) {
                    if (self !== $(prevSelected[i])) {
                        ($(prevSelected[i])).css({ 'background-color': 'transparent', 'color': 'white' });
                    }
                }
                prevSelected[prevSelected.length] = this;

                //for being able to close addComponent by clicking away (only the following two have submenus)
                switch (self.text()) {
                    case "Artwork":
                        exitInk();
                        self.css({
                            'background-color': 'white',
                            'color': 'black'
                        });
                        hideInkControls();
                        removeInkCanv();
                        closeComponentMenu();
                        _catalogPick();
                    break;

                    case "Associated Media":
                        exitInk();
                        self.css({
                            'background-color': 'white',
                            'color': 'black'
                        });
                        inkButton.data('selected', false);
                        hideInkControls();
                        removeInkCanv();
                        closeComponentMenu();
                        _associatedMediaPick();
                        break;

                    case "From File":
                        self.css({
                            'background-color': 'white',
                            'color': 'black'
                        });
                        dropFile.show();
                        dropInk.hide();
                        assetButton.data('selected', false);
                        fileClick = true;
                        break;

                    case "Audio (Mp3)":
                    case "Video (Mp4)":
                    case "Image":
                        closeComponentMenu();
                        exitInk();
                        hideInkControls();
                        removeInkCanv();
                        isInFileSubMenu = true;
                        // use call b/c this needs to be set in pickFile
                        pickFile.call(addComponentButton);
                        break;

                    case "Ink":
                        if (allowInk) {
                            self.css({
                                'background-color': 'white',
                                'color': 'black'
                            });
                            dropInk.show();
                            dropFile.hide();
                            $(assetButton).data('selected', false);
                            inkClick = true;
                        }
                        break;

                    case "Text":
                        $('.undoButton').css({ 'opacity': '0.4' });
                        $('.redoButton').css({ 'opacity': '0.4' });
                        self.css({
                            'background-color': 'white',
                            'color': 'black'
                        });
                        inkButton.data('selected', false);
                        playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
                        closeComponentMenu();
                        hideInkControls();
                        inkTextControls.show();
                        var newHeight = $("#resizableArea").offset().top + $("#resizableArea").height() - inkTextControls.offset().top - 10;
                        inkTextControls.css({ 'height': newHeight});
                        initText();

                        //create an ink canvas and inkController
                        var inkdiv = createInkCanv();
                        var p1 = new LADS.TourAuthoring.InkAuthoring("inkCanv", null, "componentControls", spec);
                        inkAuthoring = p1;
                        p1.resetText();
                        p1.add_text_box();
                        p1.setFontColor("FFFFFF");
                        p1.setFontFamily("Times New Roman, serif");
                        p1.setFontSize("12");
                        p1.set_mode(LADS.TourAuthoring.InkMode.text);
                        p1.set_editable(); //in this case, we're just making sure that the artwork can't be manipulated
                        currentInkController = p1;
                        textArea.val("");
                        textBodyLabel1.text("");
                        colorTextLabel1.text("#FFFFFF");
                        $('#textColorToggle').attr('value', "FFFFFF");
                        myPicker.fromString("FFFFFF");
                        $('.changeColor')[0].innerHTML = "#" + $("#textColorToggle").attr('value');
                        updateToggle(textArray, textArea);
                        timeline.setEditInkOn(true);
                        break;

                    case "Draw":
                        $('.undoButton').css({ 'opacity': '0.4' });
                        $('.redoButton').css({ 'opacity': '0.4' });
                        self.css({ 'background-color': 'white', 'color': 'black' });
                        playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
                        inkButton.data('selected', false);
                        closeComponentMenu();
                        hideInkControls();
                        inkDrawControls.css({ 'display': 'block' });

                        // here, we set the initial height of the ink draw controls, so they can be resized appropriately
                        var raTop = $("#resizableArea").offset().top;
                        var raHeight = $("#resizableArea").height();
                        inkDrawControls.css("height", raTop + raHeight - inkDrawControls.offset().top - 10);

                        initDraw();
                        colorLabel1.text("#000000");
                        myPicker.fromString("000000"); //jscolor picker

                        //create ink canvas and inkController
                        var inkdiv = createInkCanv();
                        var p1 = new LADS.TourAuthoring.InkAuthoring("inkCanv", null, "componentControls", spec);
                        inkAuthoring = p1;
                        p1.set_mode(LADS.TourAuthoring.InkMode.draw);
                        p1.set_editable(); // give the canvas pointer events
                        p1.updatePenWidth("brushSlider");
                        p1.updatePenColor("brushColorToggle");
                        p1.updatePenOpacity("opacitySlider");
                        currentInkController = p1;
                        timeline.setEditInkOn(true);

                        break;

                    case "Block/Isolate":
                        $('.undoButton').css({ 'opacity': '0.4' });
                        $('.redoButton').css({ 'opacity': '0.4' });
                        self.css({ 'background-color': 'white', 'color': 'black' });
                        playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
                        inkButton.data('selected', false);
                        closeComponentMenu();
                        hideInkControls();
                        inkTransparencyControls.show();
                        var newHeight = $("#resizableArea").offset().top + $("#resizableArea").height() - inkTransparencyControls.offset().top - 10;
                        inkTransparencyControls.css({ 'height': newHeight });
                        initTrans();

                        //create an ink canvas and inkController
                        var inkdiv = createInkCanv();
                        var p1 = new LADS.TourAuthoring.InkAuthoring("inkCanv", null, "componentControls", spec);
                        inkAuthoring = p1;
                        p1.set_mode(LADS.TourAuthoring.InkMode.shapes);
                        p1.set_editable(); //in this case, we're just making sure that the artwork can't be manipulated
                        currentInkController = p1;
                        timeline.setEditInkOn(true);
                        break;
                }

                // if this is already selected, unselect it -- this 'selected' stuff might be unnecessary
                var selected = self.data('selected');
                if (selected) {
                    self.css({ 'background-color': 'transparent', 'color': 'white' });
                }
                self.data('selected', !selected);
                if (!allowInk) {
                    inkButton.css({ 'background-color': 'transparent', 'color': 'gray' });
                }
            });

            component.append(addComponentButton);
            return addComponentButton;
        }

        var prevSelected = [];
        var allowInk = false;
        var componentDropDown = false;
        var currentInkController;
        /**
         * Called when all artworks/images are deleted; disables ink functionality by graying out "Ink" button
         */
        function disableInk() {
            allowInk = false;
            inkButton.css({ 'background-color': 'transparent', 'color': 'gray' });
            dropInk.hide();
            inkTransparencyControls.css({ 'display': 'none' });
            inkTextControls.css({ 'display': 'none' });
            inkDrawControls.css({ 'display': 'none' });
            inkEditDraw.css({ 'display': 'none', });
            inkEditTransparency.css('display', 'none');
            inkEditText.css('display', 'none');
            timeline.setEditInkOn(false);
            timeline.setModifyingInk(false);
            //if ink is currently being edited but is unattached, remove it if there are no artworks left
            removeInkCanv();
        }
        that.disableInk = disableInk;

        function closeComponentMenu() {
            // set componentDropDown state to true
            // to force close
            componentDropDown = true;
            addComponentLabel.click();
        }

        addComponentLabel.on('mousedown', function (evt) {
            evt.stopImmediatePropagation();
        });

        /**
         * "Add Component" button click handler.
         * Allows user to drop menus and exit out of menus by clicking elsewhere.
         */
        addComponentLabel.click(function (evt) {
            if (timeline.getEditInkOn() === true) {
                return;
            }
            var i, prev,
                closeFunc = timeline.getCloseMenu();
            if (closeFunc && closeFunc !== closeComponentMenu) {
                closeFunc();
            }

            console.log('addcomponent click');

            evt.stopImmediatePropagation();

            // flip state
            componentDropDown = !componentDropDown;

            // hide submenus
            dropInk.hide();
            dropFile.hide();

            // close --> open
            if (componentDropDown) {
                dropMain.show();

                root.on('mousedown.componentMenu', closeComponentMenu);

                timeline.setisMenuOpen(true);
                timeline.setCloseMenu(closeComponentMenu);

                timeManager.stop();

                addDropDownIconComponent.css({
                    'transform': 'scaleY(-1)',
                    'margin-bottom': '2%'
                });

                //reseting all menu items to normal font thickness
                $(".thicknessLabel").css({ 'font-weight': 'normal' });

                // Reset any selected menu items to regular CSS
                // and unselected state
                for (i = 0; i < prevSelected.length; i++) {
                    prev = $(prevSelected[i]);
                    prev.css({
                        'background-color': 'transparent',
                        'color': 'white'
                    });
                    prev.data('selected', false);
                }

                // check to see if ink can be added
                // (only allow ink if there are artworks or images)
                if (!timeline.checkForArtworks(0)) {
                    allowInk = false;
                    inkButton.css({
                        'background-color': 'transparent',
                        'color': 'gray'
                    });
                }
                else {
                    allowInk = true;
                    inkButton.css({
                        'background-color': 'transparent',
                        'color': 'white'
                    });
                }
            }

            // open --> close
            else {
                dropMain.hide();

                root.off('mousedown.componentMenu');
                timeline.setCloseMenu(null);
                timeline.setisMenuOpen(false);

                addDropDownIconComponent.css({
                    'transform': 'scaleY(1)',
                    'margin-bottom': '0%'
                });
            }
        });

        /**
         * Hover colors for "Add Component" menu items
         */
        var isInFileSubMenu = false;
        var isInInkSubMenu = false;
        var fileClick = true;
        var inkClick = true;

        /**
         * Creates catalog picker for associated media related to the artwork already imported into the tour (Jessica Fu)
         */
        // picker
        associatedMediaPicker.addClass("associatedMediaPicker");
        associatedMediaPicker.css({
            position: 'absolute',
            width: '49%',
            height: '49%',
            padding: '1%',
            'background-color': 'black',
            'border': '3px double white',
            top: '25%',
            left: '25%',
        });
        $(associatedMediaPickerOverlay).append(associatedMediaPicker);

        // heading
        var associatedMediaPickerHeader = document.createElement('div');
        $(associatedMediaPickerHeader).addClass('associatedMediaPickerInfo');
        $(associatedMediaPickerHeader).text("Select media to import");
        $(associatedMediaPickerHeader).css({
            'font-size': '200%',
        });
        var associatedsearchbar = $(document.createElement('input'));
        associatedsearchbar.attr('type', 'text');
        $(associatedsearchbar).css({
            'float': 'right',
            'margin-right': '3%',
            'margin-top': '2%',
            'width': '38%'
        });
        $(associatedsearchbar).on('keyup', function (event) {
            event.stopPropagation();
        });

        defaultVal(PICKER_SEARCH_TEXT, associatedsearchbar, true, IGNORE_IN_SEARCH);
        associatedsearchbar.keyup(function () {
            searchData(associatedsearchbar.val(), '.mediaHolder', IGNORE_IN_SEARCH);
        });
        associatedsearchbar.change(function () {
            searchData(associatedsearchbar.val(), '.mediaHolder', IGNORE_IN_SEARCH);
        });
        $(associatedMediaPickerHeader).append(associatedsearchbar);

        associatedMediaPicker.append(associatedMediaPickerHeader);

        // list of artworks in tour that have associated media
        var associatedMediaPickerArtwork = document.createElement('div');
        $(associatedMediaPickerArtwork).addClass('associatedMediaPickerArtwork');
        $(associatedMediaPickerArtwork).css({
            position: 'absolute',
            'border-right': '1px solid white',
            top: '15%',
            padding: '1%',
            height: '72%',
            width: '28%',
            overflow: 'auto',
        });
        associatedMediaPicker.append(associatedMediaPickerArtwork);

        // list of associated media
        var associatedMediaPickerMedia = document.createElement('div');
        $(associatedMediaPickerMedia).addClass('associatedMediaPickerMedia');
        $(associatedMediaPickerMedia).css({
            position: 'absolute',
            left: '33%',
            top: '15%',
            padding: '1%',
            height: '72%',
            width: '62%',
            overflow: 'auto',
        });
        associatedMediaPicker.append(associatedMediaPickerMedia);

        /**
         * Get associated media for all artworks in the tour from the server.
         * Creates the media picker dom elements.
         */
        var selectedArtworks = [];
        var artworkIndicesViaURL = [];
        var selectedArtworksUrls = {};
        function _associatedMediaPick() {
            selectedArtworks = [];
            artworkIndicesViaURL = [];
            selectedArtworksUrls = {};
            isUploading = true;
            $(associatedMediaPickerOverlay).fadeIn();

            //create a loading circle(to be displayed while artworks are loading)
            var loading = $(document.createElement('div'));
            loading.css({
                'display': 'inline-block',
                'position': 'absolute',
                'left': '3%',
                'bottom': '2%',
            });
            loading.text('Loading...');
            loading.attr('id', 'associatedLoadingLabel');

            var circle = $(document.createElement('img'));
            circle.attr('src', 'images/icons/progress-circle.gif');
            circle.css({
                'height': '12px',
                'width': 'auto',
                'margin-left': '20px',
                'float': 'right',
            });
            loading.append(circle);

            associatedMediaPicker.append(loading);


            var myArtwork = timeline.getRelatedArtworks();


            // draw "All Associated Media" Label
            var allAssociatedMediaHolder = document.createElement('div');
            $(allAssociatedMediaHolder).addClass('allAssociatedMediaHolder');
            $(allAssociatedMediaHolder).css({
                width: '100%',
                height: '9%',
                margin: '1px 0px 1px 0px',
                background: '#999',
                'padding-left': '3%',
                'padding-top': '3%',
            });
            $(allAssociatedMediaHolder).text('All Associated Media');
            $(associatedMediaPickerArtwork).append(allAssociatedMediaHolder);

            var mediaCache = {};

            // draw artwork name labels
            var myFilteredArtwork = [];
            for (var i = 0; i < myArtwork.length ; i++) {
                var unique = true;
                for (var j = 0; j < i; j++) {
                    if (myArtwork[j] === myArtwork[i]) unique = false;
                }
                //unique ? myFilteredArtwork.push(myArtwork[i]) : {};
                if (unique) {
                    myFilteredArtwork.push(myArtwork[i]);
                }
            }
            for (var k = 0; k < myArtwork.length; k++) {
                getArt(k);
            }

            loading.hide(); //hides the loading circle once art is recieved

            //single clicking on associated media selects it, to be imported
            function mediasingleClick(e, mediaHolder) {
                if (mediaHolder) {
                    var index;
                    //$(".mediaHolder").css('background', '#222');
                    if (mediaHolder.data("selected")) {
                        mediaHolder.data("selected", false);
                        mediaHolder.css('background', '#222');
                        index = artworkIndicesViaURL.indexOf(mediaHolder.data('url'));
                        selectedArtworks.splice(index, 1);
                        artworkIndicesViaURL.splice(index, 1);
                        selectedArtworksUrls[mediaHolder.data('url')] = false;
                        associatedMediaPickerImport.disabled = selectedArtworks.length ? false : true;
                    }
                    else {
                        mediaHolder.data({
                            "selected": true
                        });
                        mediaHolder.css('background', '#999');
                        selectedArtworks.push({ 'url': mediaHolder.data('url'), 'name': mediaHolder.data('name'), 'id': mediaHolder.attr('id'), 'type': mediaHolder.data('type'), 'duration': mediaHolder.data('duration') });
                        artworkIndicesViaURL.push(mediaHolder.data('url'));
                        selectedArtworksUrls[mediaHolder.data('url')] = true;
                        associatedMediaPickerImport.disabled = false;
                    }
                }
            }

            //double clicking on associated media will import all selected media
            function mediadoubleClick(e,mediaHolder) {
                if (mediaHolder) {
                    var i, selectedArt, track, positionX, displayLength, newDisplay, diff;
                    // get artwork selected
                    //catalogPickerImport.disabled = false;
                    //$(".artHolder .unSelected").css('background', '#222'); /// noooooo
                    mediaHolder.css('background', '#999');
                    
                    if (mediaHolder.data('selected') !== true) {
                        selectedArtworks.push({ 'url': mediaHolder.data('url'), 'name': mediaHolder.data('name'), 'id': mediaHolder.attr('id'), 'type': mediaHolder.data('type'), 'duration': mediaHolder.data('duration') });
                        mediaHolder.data({
                        "selected": true
                    });}
                    _clearAssMedia(); // interesting name....
                    $(associatedMediaPickerOverlay).fadeOut();
                    //console.log(selectedArt.type);
                    associatedMediaPickerImport.disabled = true;
                    associatedsearchbar.val(PICKER_SEARCH_TEXT);
                    if (selectedArtworks && selectedArtworks.length) {
                        for (i = 0; i < selectedArtworks.length; i++) {
                            selectedArt = selectedArtworks[i];
                            if (selectedArt.type === "Video") {
                                track = timeline.addVideoTrack(selectedArt.url, selectedArt.name, null, selectedArt.duration);
                                positionX = timeManager.getCurrentPx();
                                displayLength = parseFloat(selectedArt.duration);
                                // track.addDisplay(positionX, displayLength);
                                if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                                    timeManager.setEnd(Math.min(LADS.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
                                }
                                diff = LADS.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
                                newDisplay = (diff < LADS.TourAuthoring.Constants.displayEpsilon) ?
                                                     track.addDisplay(timeManager.timeToPx(LADS.TourAuthoring.Constants.maxTourLength - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) :
                                                     track.addDisplay(positionX, Math.min(diff, displayLength));
                                if (timeline.getTracks().length > 0) {
                                    timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                                }
                            } else if (selectedArt.type === "Image") {
                                track = timeline.addImageTrack(selectedArt.url, selectedArt.name);
                                positionX = timeManager.getCurrentPx();
                                displayLength = 5;
                                var dispLen = Math.min(displayLength, timeManager.getDuration().end - timeManager.pxToTime(positionX));
                                newDisplay = (dispLen < LADS.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(positionX, dispLen);
                                if (dispLen < 1.5 && dispLen >= LADS.TourAuthoring.Constants.displayEpsilon) {
                                    newDisplay.setIn(0);
                                    newDisplay.setOut(0);
                                    newDisplay.setMain(dispLen);
                                }
                                if (timeline.getTracks().length > 0) {
                                    timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                                }
                            } else if (selectedArt.type === "Audio") {
                                track = timeline.addAudioTrack(selectedArt.url, selectedArt.name, null, selectedArt.duration);
                                positionX = timeManager.getCurrentPx();
                                displayLength = parseFloat(selectedArt.duration);
                                //if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                                //    timeManager.setEnd(displayLength + timeManager.pxToTime(positionX));
                                //}
                                //track.addDisplay(positionX, displayLength);
                                if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                                    timeManager.setEnd(Math.min(LADS.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
                                }
                                diff = LADS.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
                                newDisplay = (diff < LADS.TourAuthoring.Constants.displayEpsilon) ?
                                                     track.addDisplay(timeManager.timeToPx(LADS.TourAuthoring.Constants.maxTourLength - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) :
                                                     track.addDisplay(positionX, Math.min(diff, displayLength));
                                if (timeline.getTracks().length > 0) {
                                    timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                                }
                            } else {
                                console.log('Unrecognized file type imported!!!???');
                            }
                        }
                        undoManager.combineLast(2 * selectedArtworks.length);
                    }
                }
                isUploading = false;
            }

            //this handles discriminating between the double and single clicks for importing media
            //cleans up bugs where both click events were firing and media would import twice
            function assMediasingleDoubleclick(mediaHolder) {
                mediaHolder.click(function (e) {
                    var that = this;
                    setTimeout(function () {
                        var dblclick = parseInt($(that).data('double'), 10);
                        if (dblclick > 0) {
                            $(that).data('double', dblclick - 1);
                        } else {
                            mediasingleClick.call(that, e, mediaHolder);
                        }
                    }, 300);
                }).dblclick(function (e) {
                    $(this).data('double', 2);
                    mediadoubleClick.call(this, e, mediaHolder);
                });
            }
            
            function getArt(i) {
                // get associated media and cache them in array associated with the guid of each artwork
                LADS.Worktop.Database.getDoqLinqs(myFilteredArtwork[i], function (linqs) {
                    var mediaArray = [];
                    if (linqs) {
                        var k = 0;
                        for (var j = 0; j < linqs.length; j++) {
                            var hotspotDoqID = linqs[j].Targets.BubbleRef[1].BubbleContentID;
                            LADS.Worktop.Database.getDoqByGuid(hotspotDoqID, 0, function (doq) {
                                k++;
                                if (((doq.Metadata.ContentType === 'Video' || doq.Metadata.ContentType === 'Audio') && ((doq.Metadata.Duration <= LADS.TourAuthoring.Constants.maxTourLength && doq.Metadata.Duration >= LADS.TourAuthoring.Constants.minMediaLength) || doq.Metadata.Duration === undefined)) || doq.Metadata.ContentType === 'Image') {//make sure no text associated media for now
                                    mediaArray.push(doq);
                                }
                                if (k === linqs.length) {
                                    mediaCache[myFilteredArtwork[i]] = mediaArray;
                                    if (mediaArray.length > 0) { //only shows artworks with at least one associated media
                                        var mediaHolderDocfrag = document.createDocumentFragment();
                                        drawAssociatedMedia(mediaCache[myFilteredArtwork[i]], assMediasingleDoubleclick, mediaHolderDocfrag);// create dom elements for this artwork's associated media
                                        // retrieve titles of artworks that have at least one associated media, create divs for them in the artwork list
                                        LADS.Worktop.Database.getDoqByGuid(myFilteredArtwork[i], 0, function (nextArt, flag) {
                                            var name;
                                            console.log(nextArt.Metadata.Type);
                                            if (nextArt.Name.length > 25) {
                                                name = nextArt.Name.slice(0, 25) + "...";
                                            } else {
                                                name = nextArt.Name;
                                            }
                                            var artworkHolder = document.createElement('div');
                                            $(artworkHolder).addClass('artworkHolder');
                                            $(artworkHolder).attr('id', nextArt.Identifier);
                                            $(artworkHolder).css({
                                                width: '100%',
                                                height: '9%',
                                                margin: '1px 0px 1px 0px',
                                                'font-size': '100%',
                                                'padding-left': '3%',
                                                'padding-top': '3%',
                                            });
                                            $(artworkHolder).text(name);
                                            $(associatedMediaPickerArtwork).append(artworkHolder);
                                            artworkHolderClick($(artworkHolder));
                                        });
                                    }
                                }
                            });
                        }
                        //var artworkHolder = document.createElement('div');
                        //$(artworkHolder).addClass('artworkHolder');
                        //$(artworkHolder).attr('id', nextArt.Identifier);
                        //$(artworkHolder).css({
                        //    width: '100%',
                        //    height: '9%',
                        //    margin: '1px 0px 1px 0px',
                        //    'font-size': '100%',
                        //    'padding-left': '3%',
                        //    'padding-top': '3%',
                        //});
                        //$(artworkHolder).text(name);
                        //$(associatedMediaPickerArtwork).append(artworkHolder);
                    }
                });
            }

            // "All Associated Media" button click handler
            $(allAssociatedMediaHolder).click(function () {
                $(".artworkHolder").css('background', 'black');
                $(allAssociatedMediaHolder).css('background', '#999');
                $(".mediaHolder").detach();
                for (var i = 0; i < myArtwork.length; i++) {
                    var allAMDocfrag = document.createDocumentFragment();
                    drawAssociatedMedia(mediaCache[myFilteredArtwork[i]], assMediasingleDoubleclick, allAMDocfrag);
                }
                associatedMediaPickerImport.disabled = selectedArtworks.length ? false : true;
                searchData(associatedsearchbar.val(), '.mediaHolder', IGNORE_IN_SEARCH);
            });

            // click handlers for all artwork name buttons
            function artworkHolderClick(artworkHolder) {
                artworkHolder.click(function () {
                    $(".allAssociatedMediaHolder").css('background', 'black');
                    $(".artworkHolder").css('background', 'black');
                    artworkHolder.css('background', '#999');
                    var selected = artworkHolder.attr('id');
                    $(".mediaHolder").detach();
                    var artworkAMDocfrag = document.createDocumentFragment();
                    drawAssociatedMedia(mediaCache[selected], assMediasingleDoubleclick, artworkAMDocfrag);
                    associatedMediaPickerImport.disabled = selectedArtworks.length ? false : true;
                    searchData(associatedsearchbar.val(), '.mediaHolder', IGNORE_IN_SEARCH);
                });
            }

            // create import button
            var associatedMediaPickerImport = document.createElement('button');
            associatedMediaPickerImport.disabled = true;
            $(associatedMediaPickerImport).text("Import");
            $(associatedMediaPickerImport).css({
                position: 'absolute',
                bottom: '1%',
                right: '22%',
            });

            // click handler for import button -- perform the import using selectedArtworks.*
            $(associatedMediaPickerImport).click(function () {
                var selectedArt, i, track, positionX, newDisplay, dispLen, displayLength, diff;
                _clearAssMedia(); // interesting name....
                $(associatedMediaPickerOverlay).fadeOut();
                //console.log(selectedArt.type);
                associatedMediaPickerImport.disabled = true;
                associatedsearchbar.val(PICKER_SEARCH_TEXT);
                if (selectedArtworks && selectedArtworks.length) {
                    for (i = 0; i < selectedArtworks.length; i++) {
                        selectedArt = selectedArtworks[i];
                        if (selectedArt.type === "Video") {
                            track = timeline.addVideoTrack(selectedArt.url, selectedArt.name,null,selectedArt.duration);
                            positionX = timeManager.getCurrentPx();
                            displayLength = parseFloat(selectedArt.duration);
                            //if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                            //    timeManager.setEnd(displayLength + timeManager.pxToTime(positionX));
                            //}
                            //track.addDisplay(positionX, displayLength);
                            //track.addDisplay(positionX, displayLength);
                            if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                                timeManager.setEnd(Math.min(LADS.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
                            }
                            diff = LADS.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
                            newDisplay = (diff < LADS.TourAuthoring.Constants.displayEpsilon) ?
                                                 track.addDisplay(timeManager.timeToPx(LADS.TourAuthoring.Constants.maxTourLength - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) :
                                                 track.addDisplay(positionX, Math.min(diff, displayLength));
                            if (timeline.getTracks().length > 0) {
                                timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                            }
                        } else if (selectedArt.type === "Image") {
                            track = timeline.addImageTrack(selectedArt.url, selectedArt.name);
                            positionX = timeManager.getCurrentPx();
                            displayLength = 5;
                            dispLen = Math.min(displayLength, timeManager.getDuration().end - timeManager.pxToTime(positionX));
                            newDisplay = (dispLen < LADS.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(positionX, dispLen);
                            if (dispLen < 1.5 && dispLen >= LADS.TourAuthoring.Constants.displayEpsilon) {
                                newDisplay.setIn(0);
                                newDisplay.setOut(0);
                                newDisplay.setMain(dispLen);
                            }
                            if (timeline.getTracks().length > 0) {
                                timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                            }
                        } else if (selectedArt.type === "Audio") {
                            track = timeline.addAudioTrack(selectedArt.url, selectedArt.name,null,selectedArt.duration);
                            positionX = timeManager.getCurrentPx();
                            displayLength = parseFloat(selectedArt.duration);
                            //if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                            //    timeManager.setEnd(displayLength + timeManager.pxToTime(positionX));
                            //}
                            //track.addDisplay(positionX, displayLength);
                            //track.addDisplay(positionX, displayLength);
                            if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                                timeManager.setEnd(Math.min(LADS.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
                            }
                            diff = LADS.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
                            newDisplay = (diff < LADS.TourAuthoring.Constants.displayEpsilon) ?
                                                 track.addDisplay(timeManager.timeToPx(LADS.TourAuthoring.Constants.maxTourLength - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) :
                                                 track.addDisplay(positionX, Math.min(diff, displayLength));
                            if (timeline.getTracks().length > 0) {
                                timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                            }
                        } else {
                            console.log('Unrecognized file type imported!!!???');
                        }
                    }
                    undoManager.combineLast(2 * selectedArtworks.length);
                }
                isUploading = false;
            });
            associatedMediaPicker.append(associatedMediaPickerImport);


            // cancel button
            var associatedMediaPickerCancel = document.createElement('button');
            $(associatedMediaPickerCancel).text("Cancel");
            $(associatedMediaPickerCancel).css({
                position: 'absolute',
                bottom: '1%',
                right: '5%'//$('button').width() + 15,
            });

            // cancel button click handler
            $(associatedMediaPickerCancel).click(function () {
                _clearAssMedia();
                $(associatedMediaPickerOverlay).fadeOut();
                associatedMediaPickerImport.disabled = true;
                associatedsearchbar.val(PICKER_SEARCH_TEXT);
                return undefined;
            });
            associatedMediaPicker.append(associatedMediaPickerCancel);

            // detach picker elements
            function _clearAssMedia() {
                $(".mediaHolder").detach();
                $(".artworkHolder").detach();
                $(".allAssociatedMediaHolder").detach();
                $('#associatedLoadingLabel').detach();
            }
        }

        /** 
         * Creates the media panel for the media associated to a given artwork. Each is given a .mediaHolder-class container.
         * @param mediaArray   the list of media to appear in the panel
         */
        function drawAssociatedMedia(mediaArray, applyClick, docfrag) {
            if (mediaArray) {
                for (var i = 0; i < mediaArray.length; i++) {
                    var mediaHolder = document.createElement('div');
                    $(mediaHolder).addClass("mediaHolder");
                    $(mediaHolder).attr('id', mediaArray[i].Identifier); // unique identifier for this media
                    $(mediaHolder).data('type', mediaArray[i].Metadata.ContentType);
                    $(mediaHolder).data('url', mediaArray[i].Metadata.Source); // store url as data
                    $(mediaHolder).data('name', mediaArray[i].Name);
                    $(mediaHolder).data('duration', mediaArray[i].Metadata.Duration);
                    var isSelected = selectedArtworksUrls[mediaArray[i].Metadata.Source] ? true : false;
                    $(mediaHolder).data('selected', isSelected);
                    $(mediaHolder).css({
                        float: 'left',
                        background: isSelected ? '#999' : '#222',
                        width: '48%',
                        height: '25%',
                        padding: '2px',
                        margin: '1px',
                    });
                    //$(associatedMediaPickerMedia).append(mediaHolder);
                    docfrag.appendChild(mediaHolder);

                    // create the thumbnail to show in the media holder
                    var mediaHolderImage = document.createElement('img');
                    $(mediaHolderImage).addClass('mediaHolderImage');
                    if (mediaArray[i].Metadata.ContentType === 'Audio') {
                        $(mediaHolderImage).attr('src', 'images/audio_icon.svg');
                    }
                    else if (mediaArray[i].Metadata.ContentType === 'Video') {
                        $(mediaHolderImage).attr('src', 'images/video_icon.svg');
                    }
                    else if (mediaArray[i].Metadata.ContentType === 'Image') {
                        $(mediaHolderImage).attr('src', LADS.Worktop.Database.fixPath(mediaArray[i].Metadata.Source));
                    }
                    else {//text associated media without any media...
                        $(mediaHolderImage).attr('src', 'images/text_icon.svg');
                    }
                    $(mediaHolderImage).css({
                        float: 'left',
                        'max-width': '40%',
                        'max-height': '100%',
                    });
                    $(mediaHolderImage).removeAttr('width');
                    $(mediaHolderImage).removeAttr('height');
                    $(mediaHolder).append(mediaHolderImage);
                   
                    // create the text to show in the media holder
                    var mediaHolderText = document.createElement('div');
                    $(mediaHolderText).addClass('mediaHolderText');
                    //trims off long names
                    var name;
                    if (mediaArray[i].Name.length > 37) {
                        name = mediaArray[i].Name.slice(0, 37) + "...";
                    } else {
                        name = mediaArray[i].Name;
                    }

                    $(mediaHolderText).text(name);
                    $(mediaHolderText).css({
                        'padding-left': '3%',
                        'font-size': '110%',
                        margin: '10% auto',
                        'overflow': 'hidden',
                    });
                    $(mediaHolder).append(mediaHolderText);
                    applyClick($(mediaHolder));
                }
            }
            $(associatedMediaPickerMedia).append(docfrag);
        }

        // creates catalogPicker for artwork import
        catalogPicker.addClass("catalogPicker");
        catalogPicker.css({
            position: 'absolute',
            width: '49%',
            height: '49%',
            padding: '1%',
            'background-color': 'black',
            'border': '3px double white',
            top: '25%',
            left: '25%',
        });
        $(catalogPickerOverlay).append(catalogPicker);


        // creates the header for the artwork catalog picker
        var catalogPickerHeader = document.createElement('div');
        $(catalogPickerHeader).addClass('catalogPickerInfo');
        $(catalogPickerHeader).text("Select artwork to import");
        $(catalogPickerHeader).css({
            'font-size': '200%',
            'float': 'left',
        });
        catalogPicker.append(catalogPickerHeader);

        var searchbar = $(document.createElement('input'));
        searchbar.attr('type', 'text');
        $(searchbar).css({
            'float': 'right',
            'margin-right': '3%',
            'margin-top': '0%',
            'width': '38%'
        });
        $(searchbar).on('keyup', function (event) {
            event.stopPropagation();
        });

        defaultVal(PICKER_SEARCH_TEXT, searchbar, true, IGNORE_IN_SEARCH);
        searchbar.keyup(function () {
            searchData(searchbar.val(), '.artButton', IGNORE_IN_SEARCH);
        });
        searchbar.change(function () {
            searchData(searchbar.val(), '.artButton', IGNORE_IN_SEARCH);
        });
        catalogPicker.append(searchbar);

        // creates the exhibitions panel in the artwork catalog picker
        var catalogPickerExhibitions = document.createElement('div');
        $(catalogPickerExhibitions).addClass('catalogPickerExhibitions');
        $(catalogPickerExhibitions).css({
            position: 'absolute',
            'border-right': '1px solid white',
            top: '13%',
            padding: '1%',
            height: '73%',
            width: '28%',
            overflow: 'auto',
        });
        catalogPicker.append(catalogPickerExhibitions);

        // creates the artwork panel in the artwork catalog picker
        var catalogPickerArtworks = document.createElement('div');
        $(catalogPickerArtworks).addClass('catalogPickerArtworks');
        $(catalogPickerArtworks).css({
            position: 'absolute',
            left: '33%',
            top: '13%',
            padding: '1%',
            height: '73%',
            width: '62%',
            overflow: 'auto',
        });
        catalogPicker.append(catalogPickerArtworks);

        /**
         * Gets artwork from server, displays catalogPicker
         * @return artwork id
         */
        function _catalogPick() {
            selectedArtworks = [];
            selectedArtworksUrls = {};
            artworkIndicesViaURL = [];
            isUploading = true;
            var selectedExhib;
            artQueue.clear();
            //var artworks = [];//LADS.Worktop.Database.getAllArtworks(); // there is a try/catch in Worktop.Database.js to help with xml errors
            //var exhibitions = [];//LADS.Worktop.Database.getExhibitions(); // check Worktop.Database.js if any server response problems come up

            // draw "All Artworks" exhibition container
            var allArtworksHolder = document.createElement('div');
            $(allArtworksHolder).addClass('allArtworksHolder');
            $(allArtworksHolder).css({
                width: '100%',
                height: '9%',
                margin: '1px 0px 1px 0px',
                background: '#999',
                'padding-left': '3%',
                'padding-top': '3%',
            });
            $(allArtworksHolder).text('All Artworks');
            $(catalogPickerExhibitions).append(allArtworksHolder);

            var loading = $(document.createElement('div'));
            loading.css({
                'display': 'inline-block',
                'position': 'absolute',
                'left': '3%',
                'bottom': '2%',
            });
            loading.text('Loading...');
            loading.attr('id', 'loadingLabel');

            var circle = $(document.createElement('img'));
            circle.attr('src', 'images/icons/progress-circle.gif');
            circle.css({
                'height': '12px',
                'width': 'auto',
                'margin-left': '20px',
                'float': 'right',
            });
            loading.append(circle);

            LADS.Worktop.Database.getExhibitions(function (exhibitions) {
                // draw exhibition holders for each exhibition
                for (var i = 0; i < exhibitions.length; i++) {
                    var exhibHolder = $(document.createElement('div'));
                    exhibHolder.addClass('exhibHolder');
                    exhibHolder.attr('id', exhibitions[i].Identifier);
                    exhibHolder.css({
                        width: '100%',
                        height: '9%',
                        margin: '1px 0px 1px 0px',
                        'font-size': '100%',
                        'padding-left': '3%',
                        'padding-top': '3%',
                    });
                    exhibHolder.text(exhibitions[i].Name);
                    $(catalogPickerExhibitions).append(exhibHolder);
                    // click handler for general exhibition button
                    makeExhibClickable(exhibHolder);
                }

                function makeExhibClickable(exhibHolder) {
                    exhibHolder.click(function () {
                        $(".allArtworksHolder").css('background', 'black');
                        $(".exhibHolder").css('background', 'black');
                        exhibHolder.css('background', '#999');
                        var selected = exhibHolder.attr('id');
                        selectedExhib = selected;
                        catalogPickerImport.disabled = selectedArtworks.length ? false : true;
                        $('.artButton').hide().data('visible', false);
                        $('.' + selected).show().data('visible', true);
                        searchData(searchbar.val(), '.artButton', IGNORE_IN_SEARCH);
                    });
                }


                LADS.Worktop.Database.getAllArtworks(function (artworks) {
                    // sort all artworks alphabetically
                    artworks.sort(function (a, b) {
                        var alower = a.Name.toLowerCase();
                        var blower = b.Name.toLowerCase();
                        if (alower < blower)
                            return -1;
                        if (alower > blower)
                            return 1;
                        return 0;
                    });

                    // using docfrag
                    var artworkListDocfrag = document.createDocumentFragment();
                    // create holders for all artworks (since we start in the "all artworks" exhibition)
                    $.each(artworks, function (i, artwork) {
                        artQueue.add(function () {
                            var artHolder = document.createElement('div');
                            var exhibits = [];
                            var ids = "";
                            if (selectedExhib)
                                $(artHolder).hide().data('visible', false);
                            for (var j = 0; j < artwork._Folders.FolderData.length; j++) {
                                exhibits.push(artwork._Folders.FolderData[j]);
                                if (selectedExhib === artwork._Folders.FolderData[j].FolderId)
                                    $(artHolder).show().data('visible', true);
                                ids += artwork._Folders.FolderData[j].FolderId + " ";
                            }
                            $(artHolder).attr('class', 'artButton ' + ids);
                            $(artHolder).data({
                                name: artwork.Name,
                                artist: artwork.Metadata.Artist,
                                year: artwork.Metadata.Year,
                            });
                            $(artHolder).data('exhibits', exhibits);
                            $(artHolder).addClass("artHolder");
                            $(artHolder).attr('id', artwork.Identifier); // unique artwork identifier
                            $(artHolder).data('url', artwork.Metadata.DeepZoom); // store url as data
                            $(artHolder).data('name', artwork.Name);
                            $(artHolder).css({
                                float: 'left',
                                background: '#222',
                                width: '48%',
                                height: '25%',
                                padding: '2px',
                                margin: '1px',
                            });
                            artworkListDocfrag.appendChild(artHolder);
                            searchData(searchbar.val(), '.artButton', IGNORE_IN_SEARCH);

                            //create holder for image
                            var artHolderImageHolder = document.createElement('div');
                            $(artHolderImageHolder).addClass('artHolderImageHolder');
                            $(artHolderImageHolder).css({
                                float: 'left',
                                width: '40%',
                                margin: '3.5%',
                                height: '80%',
                                'overflow': 'hidden',
                            });
                            $(artHolder).append(artHolderImageHolder);

                            // create image for artwork holder
                            var artHolderImage = document.createElement('img');
                            $(artHolderImage).addClass('artHolderImage');
                            $(artHolderImage).attr('src', LADS.Worktop.Database.fixPath(artwork.Metadata.Thumbnail));
                            $(artHolderImage).css({
                                width: '100%',
                                height: '100%',
                                'max-height': '100%',
                            });
                            $(artHolderImageHolder).append(artHolderImage);
                            
                            // create text for artwork holder
                            var artHolderText = document.createElement('div');
                            $(artHolderText).addClass('artHolderText');
                            /*
                            var maxlength = 33; // trim off long names
                            var name;
                            if (artwork.Name.length > maxlength) {
                                name = artwork.Name.slice(0, maxlength) + "...";
                            } else {
                                name = artwork.Name;
                            }
                            */
                            // intelligent truncate + ellipses insertion
                            var name = artwork.Name;
                            if (name.length > 23) {
                                var hasSpace = false;
                                var scanLength = Math.min(name.length, 35);
                                for (var i = 20; i < scanLength ; i++) {
                                    if (name[i] === " " && !hasSpace) {
                                        name = name.substr(0, i) + "...";
                                        hasSpace = true;
                                    } else if (name[i] === "-" && i !== (scanLength - 1) && !hasSpace) {
                                        if (name[i + 1] === " ") {
                                            name = name.substr(0, i) + "...";
                                            hasSpace = true;
                                        }
                                    }
                                }
                                if (!hasSpace) {
                                    name = name.substr(0, 24) + "...";
                                }
                            }
                             
                            $(artHolderText).text(name);
                            $(artHolderText).css({
                                floar: 'left',
                                'padding-left': '3%',
                                'padding-right': '4.5%',
                                'font-size': '100%',
                                'margin': '5% 0 5% 2%',
                                'overflow': 'hidden',
                                'word-wrap': 'break-word',
                            });
                            $(artHolder).append(artHolderText);
                            singleDoubleclick($(artHolder));
                        });
                    });
                    artQueue.add(function () {
                        loading.hide();
                    });
                    // append docfrag at end
                    artQueue.add(function () { $(catalogPickerArtworks).append(artworkListDocfrag); });
                });
            });

            //single clicking selects/deselects artworks to be imported
            function singleClick(e,artHolder) {
                var index, urlindex;
                if (artHolder.data('selected')) {
                    artHolder.css('background', '#222');
                    artHolder.data('selected', false);
                    urlindex = artworkIndicesViaURL.indexOf(artHolder.data('url'));
                    //index = selectedArtworks.indexOf(artHolder.data('url'));
                    selectedArtworks.splice(urlindex, 1);
                    artworkIndicesViaURL.splice(urlindex, 1);
                    selectedArtworksUrls[artHolder.data('url')] = false;
                    catalogPickerImport.disabled = selectedArtworks.length ? false : true;
                    console.log(selectedArtworks.length);
                }
                else {
                    artHolder.css('background', '#999');
                    artHolder.data({
                        'selected': true
                    }); // else, artHolder.removeClass('selected')
                    if (artworkIndicesViaURL.indexOf(artHolder.data('url')) === -1) {
                        selectedArtworks.push({ 'url': artHolder.data('url'), 'name': artHolder.data('name'), 'id': artHolder.attr('id') });
                        artworkIndicesViaURL.push(artHolder.data('url'));
                        selectedArtworksUrls[artHolder.data('url')] = true;
                    }
                    catalogPickerImport.disabled = false;
                }
            }

            //double clicking will import all selected artworks
            function doubleClick(e,artHolder) {
                var i, selectedArt;
                // get artwork selected
                catalogPickerImport.disabled = false;
                //$(".artHolder .unSelected").css('background', '#222'); /// noooooo
                artHolder.css('background', '#999');
                if (!selectedArtworksUrls[artHolder.data('url')] && artHolder.data('selected') !== true) {
                    selectedArtworks.push({ 'url': artHolder.data('url'), 'name': artHolder.data('name'), 'id': artHolder.attr('id') });
                    selectedArtworksUrls[artHolder.data('url')] = true;
                    artHolder.data({
                        'selected': true
                    });
                }
                $(catalogPickerOverlay).fadeOut();
                _clearCatalog();
                // add the artwork track to the timeline
                for (i = 0; i < selectedArtworks.length; i++) {
                    selectedArt = selectedArtworks[i];
                    var track = timeline.addArtworkTrack(selectedArt.url, selectedArt.name, selectedArt.id);
                    var positionX = timeManager.getCurrentPx();
                    var displayLength = 5;
                    var dispLen = Math.min(displayLength, timeManager.getDuration().end - timeManager.pxToTime(positionX));
                    var newDisplay = (dispLen < LADS.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(positionX, dispLen);
                    if (dispLen < 1.5 && dispLen >= LADS.TourAuthoring.Constants.displayEpsilon) {
                        newDisplay.setIn(0);
                        newDisplay.setOut(0);
                        newDisplay.setMain(dispLen);
                    }

                    // forcing a tour reload? probably easiest to use timeline.onUpdate()
                    if (timeline.getTracks().length > 0) {
                        timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                    }
                }
                undoManager.combineLast(2 * selectedArtworks.length); // allow undo/redo to perform both actions (addTrack, addDisplay) at once
                isUploading = false;
            }

            //this handles discriminating between the double and single clicks for importing artworks
            //cleans up bugs where both click events were firing and artworks would import twice
            function singleDoubleclick(artHolder) {
                artHolder.click(function (e) {
                    var that = this;
                    setTimeout(function () {
                        var dblclick = parseInt($(that).data('double'), 10);
                        if (dblclick > 0) {
                            $(that).data('double', dblclick - 1);
                        } else {
                            singleClick.call(that, e,artHolder);
                        }
                    }, 300);
                }).dblclick(function (e) {
                    $(this).data('double', 2);
                    doubleClick.call(this, e, artHolder);
                });
            }


            // click handler for the "all artworks" button
            $(allArtworksHolder).click(function () {
                $(".exhibHolder").css('background', 'black');
                $(this).css('background', '#999');
                catalogPickerImport.disabled = selectedArtworks.length ? false : true;

                $('.artButton').show().data('visible', true);
                searchData(searchbar.val(), '.artButton', IGNORE_IN_SEARCH);
                selectedExhib = null;
            });



            $(catalogPickerOverlay).fadeIn();

            catalogPicker.append(loading);

            // create artwork import button
            var catalogPickerImport = document.createElement('button');
            catalogPickerImport.disabled = true;
            $(catalogPickerImport).text("Import");
            $(catalogPickerImport).css({
                position: 'absolute',
                bottom: '2%',
                right: '22%',
            });

            // in here, deal with multiple selected artworks
            // artwork import button click handler
            $(catalogPickerImport).click(function () {
                var i;
                // if an artwork is selected, add an artwork track and a display (and combine these commands in undo manager)
                searchbar.val(PICKER_SEARCH_TEXT);
                catalogPickerImport.disabled = true;
                function importHelper(j) {
                    var selectedArt = selectedArtworks[j];
                    //artQueue.add(function () {
                    var track = timeline.addArtworkTrack(selectedArt.url, selectedArt.name, selectedArt.id);
                    var positionX = timeManager.getCurrentPx(), displayLength = 5;
                    var dispLen = Math.min(displayLength, timeManager.getDuration().end - timeManager.pxToTime(positionX));
                    var newDisplay = (dispLen < LADS.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - LADS.TourAuthoring.Constants.displayEpsilon), LADS.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(positionX, dispLen);
                    if (dispLen < 1.5 && dispLen >= LADS.TourAuthoring.Constants.displayEpsilon) {
                        newDisplay.setIn(0);
                        newDisplay.setOut(0);
                        newDisplay.setMain(dispLen);
                    }
                    //undoManager.combineLast(2);
                    // force a tour reload? easiest to use timeline.onUpdate()
                    if (timeline.getTracks().length > 0) {
                        timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                    }
                    //});
                }
                if (selectedArtworks && selectedArtworks.length) {
                    artQueue.clear();
                    loading.text('Importing...');
                    loading.show();
                    $(catalogPickerImport).hide();
                    $(catalogPickerCancel).hide();
                    for (i = 0; i < selectedArtworks.length; i++) {
                        importHelper(i);
                    }
                    undoManager.combineLast(2 * selectedArtworks.length);
                    //artQueue.add(function () {
                        //allow ink annotations
                        $(inkButton).css({ 'background-color': 'transparent', 'color': 'white' });
                        allowInk = true;
                        _clearCatalog();
                        $(catalogPickerOverlay).fadeOut();
                    //});
                } else {
                    _clearCatalog();
                    $(catalogPickerOverlay).fadeOut();
                }
                isUploading = false;
            });
            catalogPicker.append(catalogPickerImport);

            // cancel button
            var catalogPickerCancel = document.createElement('button');
            $(catalogPickerCancel).text("Cancel");
            $(catalogPickerCancel).css({
                position: 'absolute',
                bottom: '2%',
                right: '5%',
            });

            // cancel button click handler
            $(catalogPickerCancel).click(function () {
                $(catalogPickerOverlay).fadeOut();
                _clearCatalog();
                catalogPickerImport.disabled = true;
                searchbar.val(PICKER_SEARCH_TEXT);
                return undefined;
            });
            catalogPicker.append(catalogPickerCancel);
        }

        function searchData(val, selector, ignore) {
            $.each($(selector), function (i, element) {
                var data = $(element).data();
                var show = false;
                $.each(data, function (k, v) {
                    if ($.inArray(k, ignore) !== -1) return;
                    //if (k === 'visible' || k === 'exhibits') return;
                    if (searchString(v, val)) {
                        show = true;
                    }
                });
                if (data.visible === false) {
                    show = false;
                }
                if (show) {
                    $(element).show();
                } else {
                    $(element).hide();
                }
            });
        }

        // Checks if a string 'val' contains 'str
        // If 'val' is the default search text it will always return true
        // Case insensitive
        function searchString(str, val) {
            if (val === PICKER_SEARCH_TEXT) val = '';
            return str.toLowerCase().indexOf(val.toLowerCase()) !== -1;
        }

        // Sets the default value of an input to val
        // If the input loses focus when its empty it will revert
        // to val.  Additionally, if hideOnClick is true then
        // if the value is val and the input gains focus it will be
        // set to the empty string
        function defaultVal(val, input, hideOnClick, ignore) {
            input.val(val);
            if (hideOnClick) {
                input.focus(function () {
                    if (input.val() === val)
                        input.val('').change();
                });
            }
            input.blur(function () {
                if (input.val() === '') {
                    input.val(val).change();
                    searchData('', '.artButton', ignore);
                }
            });
        }

        /**
         * Detach catalog dom elements
         */
        function _clearCatalog() {
            $(".artHolder").detach();
            $(".exhibHolder").detach();
            $(".allArtworksHolder").detach();
            $('#loadingLabel').detach();
            artQueue.clear();
        }

        
        /**
         * Below are the ink UI controls. They are separated into draw, text, and transparency controls.
         */

        var numInkTracks = 0;
        
        /**
         * Ink text UI controls (initial text creation, not edit mode)
         */

        // text UI control panel
        var inkTextDocfrag = document.createDocumentFragment();
        inkTextControls = $(document.createElement('div'));
        inkTextControls.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-x': 'none', 'overflow-y': 'auto', 'margin-top': '8%' });
        inkTextControls.attr('id', 'inkTextControls');
        inkTextDocfrag.appendChild(inkTextControls[0]);
        inkTextControls.css({ "display": "none" });

        // cancel text button
        var cancelTextButton = $(document.createElement('button'));
        cancelTextButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', /*'width': '25%'*/ 'width': '80%' });
        cancelTextButton.get(0).innerHTML = "Cancel";
        cancelTextButton.click(function () {
            removeInkCanv();
            inkTextControls.hide();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);

            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();
            // set undo/redo buttons back to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");
            playbackControls.undoButton.on("click", function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on("click", function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
        });
        inkTextControls.append(cancelTextButton);

        // CREATING NEW TEXT INK
        var textArray = []; // array of text UI controls
        
        var textBodyLabel = $(document.createElement('div'));
        textBodyLabel.addClass('thicknessLabel');
        var textBodyLabel1 = $(document.createElement('div'));
        textBodyLabel.text("Text:");
        textBodyLabel.append(textBodyLabel1);
        inkTextControls.append(textBodyLabel);
        textBodyLabel1.css({
            'position': 'relative',
            'top': '2px',
            'width': '65%',
            'color': 'green',
            'display': 'inline-block',
            'margin-left': '2%',
            'text-overflow': 'ellipsis',
            'overflow': 'hidden',
            'white-space': 'nowrap',
            'margin-bottom': '0',
        });
        textBodyLabel.css({
            'font-size': '130%',
            'color': 'black',
            'margin-left': '8%',
            'font-weight': 'normal',
            'margin-top': '3%',
            'margin-right': '12%',
            'margin-bottom': '1%',
            'display': 'inline-block',
            'border-bottom-width': ' 2px',
            'border-bottom-style': 'solid',
            'border-bottom-color': 'white',
            'width': '80%',
        });

        var textArea = $(document.createElement('textarea'));
        textArea.css({
            'width': "72%",
            'min-width': '0px',
            'margin-left': '8%',
            'margin-top': '2%',
            'overflow-x': 'hidden',
            'position': 'relative',
        });
        textArray.push(textArea);
        textArea.autoSize();
        inkTextControls.append(textArea);

        function updateAreaText() {
            var text = currentInkController.getSVGText();
            textBodyLabel1.text(textArea.val()); // or .text()
            text.attr('text', textArea.val());
            text.data('str', textArea.val());
        }

        var lastText = "";
        textArea.on("keyup", function (evt) { //use onpropertychange

            var code = evt.keyCode;
            if (code === 32) {
            evt.stopPropagation();
            }
          
            var undoRedo = $.debounce(500, false, undoRedoText(evt));
            if (code !== 37 && code !== 38 && code !== 39 && code !== 40 && evt.keyCode !== 90 && !evt.ctrlKey && evt.keyCode !== 89) { // exclude arrow/ctrl/etc keys
                undoRedo();
            }
            updateAreaText();
        });

        function undoRedoText(evt) {
            return function () {
                var currText = textArea.val();
                var oldText = lastText;
                if (currText === lastText || evt.which === 17) {
                    return;
                }
                var undoMgr = currentInkController.getInkUndoManager();
                var command = LADS.TourAuthoring.Command({
                    execute: function () {
                        textArea.val(currText);
                        updateAreaText();
                    },
                    unexecute: function () {
                        textArea.val(oldText);
                        updateAreaText();
                    }
                });
                undoMgr.logCommand(command);
                lastText = textArea.val();
            };
        }

        textBodyLabel.click(function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            textBodyLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, textArea);
        });

        // show current font label
        var fontLabel = $(document.createElement('div'));
        fontLabel.addClass('thicknessLabel');
        var fontLabel1 = $(document.createElement('div'));
        fontLabel.text("Font:");
        fontLabel1.text("Times New Roman");
        fontLabel.append(fontLabel1);
        inkTextControls.append(fontLabel);

        fontLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        fontLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // dropdown font selector
        var fontSelector = $(document.createElement("select"));
        fontSelector.addClass('fontSelector');
        fontSelector.css({ color: "white", 'float': 'left', 'clear': 'both', 'display': 'none', "border": "solid 3px rgba(255,255,255,1)", width: "72%",  'margin-left': '8%', 'margin-top': '2%', "background-color": 'rgba(0,0,0,0.5)' });
        textArray.push(fontSelector);
        inkTextControls.append(fontSelector);

        
        // create font options for the selector -- on click, set the font family of the current ink and reset fontLabel1.text
        var timesOption = $(document.createElement("option"));
        timesOption.text("Times New Roman").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        timesOption.on('click', function () {
            currentInkController.setFontFamily("Times New Roman, serif");
            fontLabel1.text("Times New Roman");
        });
        var georgiaOption = $(document.createElement("option"));
        georgiaOption.text("Georgia").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        georgiaOption.on('click', function () {
            currentInkController.setFontFamily("Georgia, serif");
            fontLabel1.text("Georgia");
        });
        var verdanaOption = $(document.createElement("option"));
        verdanaOption.text("Verdana").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        verdanaOption.on('click', function () {
            currentInkController.setFontFamily("Verdana, Geneva, sans-serif");
            fontLabel1.text("Verdana");
        });
        var courierOption = $(document.createElement("option"));
        courierOption.text("Courier").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        courierOption.on('click', function () {
            currentInkController.setFontFamily("'Courier New', Courier, monospace");
            fontLabel1.text("Courier");
        });

        fontSelector.append(timesOption);
        fontSelector.append(georgiaOption);
        fontSelector.append(verdanaOption);
        fontSelector.append(courierOption);

        // font label click handler (needs to be after the font selector is created)
        fontLabel.click(function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            fontLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, fontSelector);
        });

        // show current font color label
        var colorTextLabel = $(document.createElement('div'));
        colorTextLabel.addClass('thicknessLabel');
        var colorTextLabel1 = $(document.createElement('div'));
        colorTextLabel1.addClass('changeColor');
        colorTextLabel.text("Color: ");
        colorTextLabel1.text("#FFFFFF");
        colorTextLabel.append(colorTextLabel1);
        inkTextControls.append(colorTextLabel);

        colorTextLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
        colorTextLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });

        // create div containing the color picker
        var colorTextDiv = $(document.createElement('div'));
        colorTextDiv.attr("id", "colorTextDiv");
        colorTextDiv.css('display', 'none');
        inkTextControls.append(colorTextDiv);
        textArray.push(colorTextDiv);

        //click handler to open the color picker when we click on the color label
        colorTextLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            colorTextLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, colorTextDiv);

        });

        // create input box for color picker
        var itemText = document.createElement('input');
        $(itemText).attr('id', 'textColorToggle');
        $(itemText).attr('readonly', 'readonly');
        $(itemText).css({ 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left', 'width': '40%' });
        $(itemText).on('keyup', function (event) {
            event.stopPropagation();
        });

        if (itemText.addEventListener) {
            itemText.addEventListener('DOMNodeInserted', function () {
                // initialize colorpicker object on current element
                myPicker = new jscolor.color(itemText, {});
                myPicker.fromString("FFFFFF");
                myPicker.onImmediateChange = function () {
                    currentInkController.setFontColor("#"+$("#textColorToggle").attr('value'));
                    $('.changeColor')[0].innerHTML = "#"+$("#textColorToggle").attr('value');
                };
            }, false);
        }
        colorTextDiv.append(itemText);

        // show font size label 
        var textSizeLabel = $(document.createElement('div'));
        textSizeLabel.addClass('thicknessLabel');
        var textSizeLabel1 = $(document.createElement('div'));
        textSizeLabel.text("Text Size: ");
        textSizeLabel1.text("12px");
        textSizeLabel.append(textSizeLabel1);
        inkTextControls.append(textSizeLabel);
        textSizeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        textSizeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // create slider for font size
        var textSizeSlider = $(document.createElement('div'));
        textSizeSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative', 'float': 'left'
        });
        var textSliderPoint = $(document.createElement('div'));
        textSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%", "left": "50px",
        });
        textSizeSlider.append(textSliderPoint);
        textSizeSlider.attr("value", "12px");
        inkTextControls.append(textSizeSlider);
        
        // drag functionality for font size slider point
        textSliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                textSliderPoint.value = textSliderPoint.css("left").replace('px', '') / (textSizeSlider.offset().left + textSizeSlider.width()) * 1.28;
                console.log(textSliderPoint.value);
                textSizeSlider.attr("value", (textSliderPoint.value * 39 + 8) + "px");
                var val = Math.round(textSliderPoint.value * 39) + 8;
                textSizeLabel1.text( val + "px");
                currentInkController.setFontSize(textSizeSlider.attr("value"));
            },
            appendTo: 'body'
        });

        textArray.push(textSizeSlider);

        // click handler for text size label -- opens slider
        textSizeLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            textSizeLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, textSizeSlider);
        });

        // attach buttons for text
        var linkTextDiv = getAttachDiv(inkTextControls, "text");
        inkTextControls.append(linkTextDiv);
        functionsPanel.append(inkTextDocfrag);

        /**
         * Edit ink text UI controls -- we can probably compress some of this by reusing the inkTextControls
         */

        // edit text control panel
        var textEditDocfrag = document.createDocumentFragment();
        inkEditText = $(document.createElement('div'));
        inkEditText.attr("id", "inkEditText");
        inkEditText.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
        //functionsPanel.append(inkEditText);
        textEditDocfrag.appendChild(inkEditText[0]);
        inkEditText.css({ "display": "none" });

        var cancelEditTextButton = $(document.createElement('button'));
        cancelEditTextButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', /*'width': '25%'*/ 'width':'80%' });
        cancelEditTextButton.get(0).innerHTML = "Cancel";
        inkEditText.append(cancelEditTextButton);

        // EDITING OLD TEXT INK
        var textEditArray = []; // array of edit text controls
        
        var textEditBodyLabel = $(document.createElement('div'));
        textEditBodyLabel.addClass('thicknessLabel');
        var textEditBodyLabel1 = $(document.createElement('div'));
        textEditBodyLabel.text("Text:");
        textEditBodyLabel.append(textEditBodyLabel1);
        inkEditText.append(textEditBodyLabel);
        textEditBodyLabel1.css({
            'position': 'relative',
            'top': '2px',
            'width': '65%',
            'color': 'green',
            'display': 'inline-block',
            'margin-left': '2%',
            'text-overflow': 'ellipsis',
            'overflow': 'hidden',
            'white-space': 'nowrap',
            'margin-bottom': '0',
        });
        textEditBodyLabel.css({
            'font-size': '130%',
            'color': 'black',
            'margin-left': '8%',
            'font-weight': 'normal',
            'margin-top': '3%',
            'margin-right': '12%',
            'margin-bottom': '1%',
            'display': 'inline-block',
            'border-bottom-width': ' 2px',
            'border-bottom-style': 'solid',
            'border-bottom-color': 'white',
            'width': '80%',
        });

        var textEditArea = $(document.createElement('textarea'));
        textEditArea.css({
            'width': "72%",
            'min-width': '0px',
            'margin-left': '8%',
            'margin-top': '2%',
            'overflow-x': 'hidden',
            'position': 'relative',
        });
        textEditArray.push(textEditArea);
        textEditArea.autoSize();
        inkEditText.append(textEditArea);

        var textA;
        function updateEditAreaText() {
            textA = currentInkController.getSVGText();
            textEditBodyLabel1.text(textEditArea.val()); // or .text()
            currentInkController.remove_all();
            currentInkController.add_text_box(textA.attrs.x, textA.attrs.y, -1, -1, textEditArea.val(), true);
            textA = currentInkController.getSVGText();
            textA.data('str', textEditArea.val());
        }
        var lastEditText;
        function firstUpdate() {
            textA = currentInkController.getSVGText();
            textEditBodyLabel1.text(textEditArea.val()); // or .text()
            currentInkController.remove_all();
            lastEditText = textEditArea.val();
            switch (textA.attr('font-family')) {
                case "'Courier New', Courier, monospace":
                    courierEditOption.prop('selected', true);
                    currentInkController.setFontFamily("'Courier New', Courier, monospace");
                    fontEditLabel1.text("Courier");
                    break;
                case "Verdana, Geneva, sans-serif":
                    verdanaEditOption.prop('selected', true);
                    currentInkController.setFontFamily("Verdana, Geneva, sans-serif");
                    fontEditLabel1.text("Verdana");
                    break;
                case "Georgia, serif":
                    georgiaEditOption.prop('selected', true);
                    currentInkController.setFontFamily("Georgia, serif");
                    fontEditLabel1.text("Georgia");
                    break;
                case "Times New Roman, serif":
                    timesEditOption.prop('selected', true);
                    currentInkController.setFontFamily("Times New Roman, serif");
                    fontEditLabel1.text("Times New Roman");
                    break;
                default:
                    break;
            
            }
            currentInkController.add_text_box(textA.attrs.x, textA.attrs.y, -1, -1, textEditArea.val(), true);
            textA = currentInkController.getSVGText();
            textA.data('str', textEditArea.val());
        }

        
        textEditArea.on("keyup", function (evt) { //use onpropertychange

            var code = evt.keyCode;

            if (code == 32) {
            evt.stopPropagation();
            }
            var undoRedoEdit = $.debounce(500, false, undoRedoEditText(evt));
            if (code !== 37 && code !== 38 && code !== 39 && code !== 40 && !evt.ctrlKey) { // exclude arrow keys
                undoRedoEdit();
            }
            updateEditAreaText();
        });

       
        function undoRedoEditText(evt) {
            return function () {
                var currEditText = textEditArea.val();
                var oldEditText = lastEditText;
                if (currEditText === lastEditText || evt.which === 17) {
                    return;
                }
                var undoMgr = currentInkController.getInkUndoManager();
                var command = LADS.TourAuthoring.Command({
                    execute: function () {
                        textEditArea.val(currEditText);
                        updateEditAreaText();
                    },
                    unexecute: function () {
                        textEditArea.val(oldEditText);
                        updateEditAreaText();
                    }
                });
                undoMgr.logCommand(command);
                lastEditText = currEditText;
            };
        }

        textEditBodyLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            textEditBodyLabel.css({ 'font-weight': 'bold' });
            updateToggle(textEditArray, textEditArea);
        });

        // show font family label
        var fontEditLabel = $(document.createElement('div'));
        fontEditLabel.addClass('thicknessLabel');
        var fontEditLabel1 = $(document.createElement('div'));
        fontEditLabel.text("Font:");
        fontEditLabel1.text("Times New Roman");
        fontEditLabel.append(fontEditLabel1);
        inkEditText.append(fontEditLabel);

        fontEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        fontEditLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // font selection dropdown
        var fontEditSelector = $(document.createElement("select"));
        fontEditSelector.addClass('fontSelector');
        fontEditSelector.css({ color: "white", 'float': 'left', 'clear': 'both', 'display': 'none', "border": "solid 3px rgba(255,255,255,1)", width: "72%",  'margin-left': '8%', 'margin-top': '2%', "background-color": 'rgba(0,0,0,0.5)' });
        textEditArray.push(fontEditSelector);
        inkEditText.append(fontEditSelector);

        // font options in dropdown
        var timesEditOption = $(document.createElement("option"));
        timesEditOption.text("Times New Roman").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        timesEditOption.click(function () {
            currentInkController.setFontFamily("Times New Roman, serif");
            fontEditLabel1.text("Times New Roman");
        });
        var georgiaEditOption = $(document.createElement("option"));
        georgiaEditOption.text("Georgia").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        georgiaEditOption.click(function () {
            currentInkController.setFontFamily("Georgia, serif");
            fontEditLabel1.text("Georgia");
        });
        var verdanaEditOption = $(document.createElement("option"));
        verdanaEditOption.text("Verdana").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        verdanaEditOption.click(function () {
            currentInkController.setFontFamily("Verdana, Geneva, sans-serif");
            fontEditLabel1.text("Verdana");
        });
        var courierEditOption = $(document.createElement("option"));
        courierEditOption.text("Courier").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        courierEditOption.click(function () {
            currentInkController.setFontFamily("'Courier New', Courier, monospace");
            fontEditLabel1.text("Courier");
        });

        fontEditSelector.append(timesEditOption);
        fontEditSelector.append(georgiaEditOption);
        fontEditSelector.append(verdanaEditOption);
        fontEditSelector.append(courierEditOption);

        // font label click handler -- opens dropdown
        fontEditLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            fontEditLabel.css({ 'font-weight': 'bold' });
            updateToggle(textEditArray, fontEditSelector);
        });

        // font color label for editing ink text
        var colorEditTextLabel = $(document.createElement('div'));
        colorEditTextLabel.addClass('thicknessLabel');
        var colorEditTextLabel1 = $(document.createElement('div'));
        colorEditTextLabel1.addClass('changeColorEdit');
        colorEditTextLabel.text("Color: ");
        colorEditTextLabel1.text("#FFFFFF");
        colorEditTextLabel.append(colorEditTextLabel1);
        inkEditText.append(colorEditTextLabel);
        colorEditTextLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
        colorEditTextLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });

        // div to contain color picker
        var colorEditTextDiv = $(document.createElement('div'));
        colorEditTextDiv.css('display', 'none');
        inkEditText.append(colorEditTextDiv);
        textEditArray.push(colorEditTextDiv);

        // click handler to open color picker
        colorEditTextLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            colorEditTextLabel.css({ 'font-weight': 'bold' });
            updateToggle(textEditArray, colorEditTextDiv);

        });

        // color picker input box for editing ink Text
        var itemEditText = document.createElement('input');
        $(itemEditText).attr('id', 'textEditColorToggle');
        $(itemEditText).attr('readonly', 'readonly');
        $(itemEditText).css({ 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left', 'width': '40%' });
        $(itemEditText).on('keyup', function (event) {
            event.stopPropagation();
        });

        if (itemEditText.addEventListener) {
            itemEditText.addEventListener('DOMNodeInserted', function () {
                // initialize colorpicker object on current element
                myEditTextPicker = new jscolor.color(itemEditText, {});
                myEditTextPicker.fromString("FFFFFF");
                myEditTextPicker.onImmediateChange = function () {
                    currentInkController.setFontColor("#" + $("#textEditColorToggle").attr('value'));
                    $('.changeColorEdit')[0].innerHTML = "#" + $("#textEditColorToggle").attr('value');
                };
            }, false);
        }
        colorEditTextDiv.append(itemEditText);

        // font size label for editing
        var textEditSizeLabel = $(document.createElement('div'));
        textEditSizeLabel.addClass('thicknessLabel');
        var textEditSizeLabel1 = $(document.createElement('div'));
        textEditSizeLabel.text("Text Size: ");
        textEditSizeLabel1.text("8px");
        textEditSizeLabel.append(textEditSizeLabel1);
        inkEditText.append(textEditSizeLabel);
        textEditSizeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        textEditSizeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // font size slider for editing
        var textEditSizeSlider = $(document.createElement('div'));
        textEditSizeSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });
        inkEditText.append(textEditSizeSlider);
        var textEditSliderPoint = $(document.createElement('div'));
        textEditSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
        });
        textEditSizeSlider.append(textEditSliderPoint);
        textEditSizeSlider.attr("value", "8px");
        
        // drag handler for font size slider point
        textEditSliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event, ui) {
                console.log(ui.position.left);
                textEditSliderPoint.value = ui.position.left / (textEditSizeSlider.width() - textEditSliderPoint.width());
                console.log(textEditSliderPoint.value);
                textEditSizeSlider.attr("value", (textEditSliderPoint.value * (maxFontSize - 8) + 8) + "px"); // font size goes from 12-43 (maybe the slider point goes past 1.0?)
                var val = Math.round(textEditSliderPoint.value * (maxFontSize - 8)) + 8;
                currentFontSize = val;
                textEditSizeLabel1.text(val + "px");
                currentInkController.setFontSize(textEditSizeSlider.attr("value"));
            },
            appendTo: 'body'
        });
        textEditArray.push(textEditSizeSlider);

        // click handler for font size label -- opens size slider
        textEditSizeLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            textEditSizeLabel.css({ 'font-weight': 'bold' });
            updateToggle(textEditArray, textEditSizeSlider);
            var pointvalue = (currentFontSize - 8) / (maxFontSize - 8);
            var pointleft = pointvalue * (textEditSizeSlider.width() - textEditSliderPoint.width());
            textEditSliderPoint.css("left", pointleft + "px");
        });

        // save edited ink button
        var saveTextButton = $(document.createElement('button'));
        saveTextButton.css({ 'font-size': '100%', 'color': 'black', 'margin-top': '3%', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
        saveTextButton.get(0).innerHTML = "Save";
        inkEditText.append(saveTextButton);

        functionsPanel.append(textEditDocfrag);


        /**
         * Ink draw UI controls (for initial draw authoring, not editing mode)
         */

        // draw control panel
        var inkDrawDocfrag = document.createDocumentFragment();
        inkDrawControls = $(document.createElement('div'));
        inkDrawControls.attr("id", "inkDrawControls");
        inkDrawControls.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
        inkDrawDocfrag.appendChild(inkDrawControls[0]);
        inkDrawControls.css({ "display": "none" });

        // draw cancel button
        var cancelDrawButton = $(document.createElement('button'));
        cancelDrawButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', /*'width': '25%'*/ 'width': '80%' });
        cancelDrawButton.get(0).innerHTML = "Cancel";
        cancelDrawButton.click(function () {
            brushSliderPoint.attr('value', 7.0);
            currentInkController.updatePenWidth("brushSlider");
            removeInkCanv();
            inkDrawControls.hide();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);

            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();
            // reset undo/redo buttons to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");

            playbackControls.undoButton.on('click', function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on('click', function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
        });
        inkDrawControls.append(cancelDrawButton);

        var drawArray = []; // array of draw controls

        // brush width label
        var brushLabel = $(document.createElement('div'));
        brushLabel.addClass('thicknessLabel');
        var brushLabel1 = $(document.createElement('div'));
        brushLabel.text("Brush: ");
        brushLabel1.text("7px");
        brushLabel.append(brushLabel1);
        inkDrawControls.append(brushLabel);
        brushLabel1.css({ 'color': 'green', /*'float': 'right',*/ 'display': 'inline', 'padding-left': '2%' });
        brushLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // brush width slider
        var brushSlider = $(document.createElement('div'));
        brushSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });
        inkDrawControls.append(brushSlider);
        drawArray.push(brushSlider);
        var brushSliderPoint = $(document.createElement('div'));
        brushSliderPoint.attr('id', 'brushSlider');
        brushSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': "relative",
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%"
        });
        brushSliderPoint.attr('value', 7.0);
        brushSlider.append(brushSliderPoint);

        // brush width label click handler -- opens brush width slider
        brushLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            brushLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawArray, brushSlider);
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
        });
        
        // brush width slider drag handler
        brushSliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                brushSliderPoint.attr('value', (brushSliderPoint.css("left").replace('px', '') / (brushSlider.offset().left + brushSlider.width()) * 60 + 1) + 6); // get values in the right range
                if (brushSliderPoint.value < 7) {
                    brushSliderPoint.attr('value', 7.0);
                }
                currentInkController.updatePenWidth("brushSlider");
                currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
                brushLabel1.text(Math.round(brushSliderPoint.attr('value')) + "px");
            },
            appendTo: 'body'
        });
        
        // brush color label
        var colorLabel = $(document.createElement('div'));
        colorLabel.addClass('thicknessLabel');
        var colorLabel1 = $(document.createElement('div'));
        colorLabel1.addClass('changeColor1');
        colorLabel.text("Color: ");
        colorLabel1.text("#000000");
        colorLabel.append(colorLabel1);
        inkDrawControls.append(colorLabel);
        colorLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
        colorLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });

        // div to contain color picker
        var colorDiv = $(document.createElement('div'));
        colorDiv.css('display', 'none');
        inkDrawControls.append(colorDiv);
        drawArray.push(colorDiv);

        // color label click handler
        colorLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            colorLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawArray, colorDiv);
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
        });

        // input element for color picker
        var item = document.createElement('input');
        $(item).attr('id', 'brushColorToggle');
        $(item).attr('readonly', 'readonly');
        $(item).css({ 'margin-left': '8%', 'float': 'left', 'margin-top': '3%', 'clear': 'left', 'width': '40%'});
        item.onfocus = function () {
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
        };
        $(item).on('keyup', function (event) {
            event.stopPropagation();
        });
        if (item.addEventListener) {
            item.addEventListener('DOMNodeInserted', function () {
                //initialize colorpicker object on current element
                myPicker = new jscolor.color(item, {});
                myPicker.fromString("000000");
                myPicker.onImmediateChange = function () {
                    currentInkController.updatePenColor("brushColorToggle");
                    currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
                    $('.changeColor1')[0].innerHTML = "#"+$("#brushColorToggle").attr("value");
                };
            }, false);
        }
        colorDiv.append(item);

        // eraser width label
        var eraserLabel = $(document.createElement('div'));
        eraserLabel.addClass('thicknessLabel');
        var eraserLabel1 = $(document.createElement('div'));
        eraserLabel.text("Eraser: ");
        eraserLabel1.text("7px");
        eraserLabel.append(eraserLabel1);
        inkDrawControls.append(eraserLabel);
        eraserLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        eraserLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // eraser width slider
        var eraserSlider = $(document.createElement('div'));
        eraserSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });
        inkDrawControls.append(eraserSlider);
        drawArray.push(eraserSlider);

        // eraser label click handler
        eraserLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            eraserLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawArray, eraserSlider);
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.erase);
        });
        var eraserSliderPoint = $(document.createElement('div'));
        eraserSliderPoint.attr('id', 'eraserSlider');
        eraserSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%"
        });
        eraserSliderPoint.attr('value', 7.0);
        eraserSlider.append(eraserSliderPoint);

        // eraser width slider drag handler
        eraserSliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                eraserSliderPoint.attr('value', (parseFloat(eraserSliderPoint.css("left").replace('px', '')) / parseFloat(eraserSlider.offset().left + eraserSlider.width()) * 60 + 1) + 6);// * 24.33 + 1;
                if (eraserSliderPoint.value < 7) {
                    eraserSliderPoint.attr('value', 7.0);
                }
                currentInkController.setEraserWidth(eraserSliderPoint.attr('value'));
                eraserLabel1.text(Math.round(eraserSliderPoint.attr('value')) + "px");
            },
            appendTo: 'body'
        });

        // draw opacity label
        var opacityLabel = $(document.createElement('div'));
        opacityLabel.addClass('thicknessLabel');
        var opacityLabel1 = $(document.createElement('div'));
        opacityLabel.text("Opacity: ");
        opacityLabel1.text("100%");
        opacityLabel.append(opacityLabel1);
        inkDrawControls.append(opacityLabel);
        opacityLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        opacityLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // draw opacity slider
        var opacitySlider = $(document.createElement('div'));
        opacitySlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });
        inkDrawControls.append(opacitySlider);
        drawArray.push(opacitySlider);
        var opacitySliderPoint = $(document.createElement('div'));
        opacitySliderPoint.attr('id', 'opacitySlider');
        opacitySliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
        });
        opacitySliderPoint.attr("value", 1.0);
        opacitySlider.append(opacitySliderPoint);

        // opacity label click handler
        opacityLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            opacityLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawArray, opacitySlider);
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
        });

        // opacity slider drag handler
        opacitySliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                opacitySliderPoint.attr('value', (parseFloat(opacitySliderPoint.css("left").replace('px', '')) / (parseFloat(opacitySlider.offset().left) + parseFloat(opacitySlider.width())) * 1.28));
                if (opacitySliderPoint[0].value > 0.99) {
                    opacitySliderPoint.attr('value', 1.0);
                }
                else if (opacitySliderPoint[0].value < 0) {
                    opacitySliderPoint.attr('value', 0.0);
                }
                currentInkController.updatePenOpacity("opacitySlider");
                opacityLabel1.text(Math.round(100 * opacitySliderPoint.attr("value")) + "%");
            },
            appendTo: 'body'
        });
        
        // draw attach buttons
        var linkDrawDiv = getAttachDiv(inkDrawControls);
        inkDrawControls.append(linkDrawDiv);
        functionsPanel.append(inkDrawDocfrag);

        /**
         * Edit draw controls (edit mode)
         */

        // edit draw control panel
        var editDrawDocfrag = document.createDocumentFragment();
        inkEditDraw = $(document.createElement('div'));
        inkEditDraw.attr("id", "inkEditDraw");
        inkEditDraw.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%', });
        editDrawDocfrag.appendChild(inkEditDraw[0]);
        inkEditDraw.css('display', 'none');

        // cancel edit draw button
        var cancelEditDrawButton = $(document.createElement('button'));
        cancelEditDrawButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
        cancelEditDrawButton.get(0).innerHTML = "Cancel";
        inkEditDraw.append(cancelEditDrawButton);

        var drawEditArray = []; // array of draw controls

        // brush width label
        var brushEditLabel = $(document.createElement('div'));
        brushEditLabel.addClass('thicknessLabel');
        var brushEditLabel1 = $(document.createElement('div'));
        brushEditLabel.text("Brush: ");
        brushEditLabel1.text("7px");
        brushEditLabel.append(brushEditLabel1);
        inkEditDraw.append(brushEditLabel);
        brushEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        brushEditLabel.css({ '-ms-touch-action': 'none', 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // brush width slider
        var brushEditSlider = $(document.createElement('div'));
        brushEditSlider.addClass("brushEditSlider");
        brushEditSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative', 'float': 'left'
        });
        inkEditDraw.append(brushEditSlider);
        drawEditArray.push(brushEditSlider);
        var brushEditSliderPoint = $(document.createElement('div'));
        brushEditSliderPoint.attr('id', 'brushEditSlider');
        brushEditSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': "relative",
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%"
        });
        brushEditSliderPoint.attr('value', 7.0);
        brushEditSlider.append(brushEditSliderPoint);

        // brush width label click handler
        brushEditLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            brushEditLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawEditArray, brushEditSlider);
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
        });

        // brush width slider drag handler
        brushEditSliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                brushEditSliderPoint.attr('value', (brushEditSliderPoint.css("left").replace('px', '') / (brushEditSlider.offset().left + brushEditSlider.width()) * 60 + 1) + 6);// * 24.33 + 1;
                if (brushEditSliderPoint.value < 7) {
                    brushEditSliderPoint.attr('value', 7.0);
                }
                currentInkController.updatePenWidth("brushEditSlider");
                currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
                brushEditLabel1.text(Math.round(brushEditSliderPoint.attr('value')) + "px");
            },
            appendTo: 'body'
        });

        // brush color label
        var colorEditLabel = $(document.createElement('div'));
        colorEditLabel.addClass('thicknessLabel');
        var colorEditLabel1 = $(document.createElement('div'));
        colorEditLabel1.addClass('changeColor1Edit');
        colorEditLabel.text("Color: ");
        colorEditLabel1.text("#000000");
        colorEditLabel.append(colorEditLabel1);
        inkEditDraw.append(colorEditLabel);
        colorEditLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
        colorEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });

        // div containing color picker
        var colorEditDiv = $(document.createElement('div'));
        colorEditDiv.css('display', 'none');
        inkEditDraw.append(colorEditDiv);
        drawEditArray.push(colorEditDiv);

        // color label click handler
        colorEditLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            colorEditLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawEditArray, colorEditDiv);
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
        });

        // input element for color picker
        var itemEdit = document.createElement('input');
        $(itemEdit).attr('id', 'brushEditColorToggle');
        $(itemEdit).attr('readonly', 'readonly');
        $(itemEdit).css({ 'margin-left': '8%', 'float': 'left', 'margin-top': '3%', 'clear': 'left', 'width': '40%' });
        itemEdit.onfocus = function () {
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
        };
        $(itemEdit).on('keyup', function (event) {
            event.stopPropagation();
        });
        if (itemEdit.addEventListener) {
            itemEdit.addEventListener('DOMNodeInserted', function () {
                //initialize colorpicker object on current element
                myEditDrawPicker = new jscolor.color(itemEdit, {});
                myEditDrawPicker.fromString("000000");
                myEditDrawPicker.onImmediateChange = function () {
                    currentInkController.updatePenColor("brushEditColorToggle");
                    currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
                    $('.changeColor1Edit')[0].innerHTML = currentInkController.getPenColor();
                };
            }, false);
        }
        colorEditDiv.append(itemEdit);
        
        // eraser width label
        var eraserEditLabel = $(document.createElement('div'));
        eraserEditLabel.addClass('thicknessLabel');
        var eraserEditLabel1 = $(document.createElement('div'));
        eraserEditLabel.text("eraser: ");
        eraserEditLabel1.text("7px");
        eraserEditLabel.append(eraserEditLabel1);
        inkEditDraw.append(eraserEditLabel);
        eraserEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        eraserEditLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // eraser width slider
        var eraserEditSlider = $(document.createElement('div'));
        eraserEditSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });
        inkEditDraw.append(eraserEditSlider);
        drawEditArray.push(eraserEditSlider);

        // eraser width label click handler
        eraserEditLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            eraserEditLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawEditArray, eraserEditSlider);
            currentInkController.set_mode(LADS.TourAuthoring.InkMode.erase);
        });
        var eraserEditSliderPoint = $(document.createElement('div'));
        eraserEditSliderPoint.attr('id', 'eraserEditSlider');
        eraserEditSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%"
        });
        eraserEditSliderPoint.attr('value', 7.0);
        eraserEditSlider.append(eraserEditSliderPoint);

        // eraser width slider drag handler
        eraserEditSliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                eraserEditSliderPoint.attr('value', (eraserEditSliderPoint.css("left").replace('px', '') / (eraserEditSlider.offset().left + eraserEditSlider.width()) * 60 + 1) + 6);// * 24.33 + 1;
                if (eraserEditSliderPoint.value < 7) {
                    eraserEditSliderPoint.attr('value', 7.0);
                }
                currentInkController.updateEraserWidth("eraserEditSlider");
                eraserEditLabel1.text(Math.round(eraserEditSliderPoint.attr('value')) + "px");
            },
            appendTo: 'body'
        });

        // draw opacity label
        var opacityEditLabel = $(document.createElement('div'));
        opacityEditLabel.addClass('thicknessLabel');
        var opacityEditLabel1 = $(document.createElement('div'));
        opacityEditLabel.text("opacity: ");
        opacityEditLabel1.text("100%");
        opacityEditLabel.append(opacityEditLabel1);
        inkEditDraw.append(opacityEditLabel);
        opacityEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        opacityEditLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // draw opacity slider
        var opacityEditSlider = $(document.createElement('div'));
        opacityEditSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });
        inkEditDraw.append(opacityEditSlider);
        drawEditArray.push(opacityEditSlider);
        var opacityEditSliderPoint = $(document.createElement('div'));
        opacityEditSliderPoint.attr('id', 'opacityEditSlider');
        opacityEditSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", 'left': '87%', "margin-top": "-0.57%"
        });
        opacityEditSliderPoint.attr("value", 1.0);
        opacityEditSlider.append(opacityEditSliderPoint);

        // draw opacity label click handler
        opacityEditLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            opacityEditLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawEditArray, opacityEditSlider);
        });

        // draw opacity slider drag handler
        opacityEditSliderPoint.draggable({
             axis: "x", containment: "parent",
             scroll: false,
             drag: function (event) {
                 opacityEditSliderPoint.attr('value', (parseFloat(opacityEditSliderPoint.css("left").replace('px', '')) / (parseFloat(opacityEditSlider.offset().left) + parseFloat(opacityEditSlider.width())) * 1.28));
                 if (opacityEditSliderPoint[0].value > 0.99) {
                     opacityEditSliderPoint.attr('value', 1.0);
                 }
                 else if (opacityEditSliderPoint[0].value < 0) {
                     opacityEditSliderPoint.attr('value', 0.0);
                 }
                 currentInkController.updatePenOpacity("opacityEditSlider");
                 opacityEditLabel1.text(Math.round(100 * opacityEditSliderPoint.attr("value")) + "%");
             },
             appendTo: 'body'
         });
        

        // edit draw save button
        var saveDrawButton = $(document.createElement('button'));
        saveDrawButton.css({ 'font-size': '100%', 'color': 'black', 'margin-top': '3%', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
        saveDrawButton.get(0).innerHTML = "Save";
        inkEditDraw.append(saveDrawButton);

        functionsPanel.append(editDrawDocfrag);

        /**
         * Ink transparency controls (initial authoring, not editing mode)
         */

        // transparency control panel
        var inkTransparencyDocfrag = document.createDocumentFragment();
        inkTransparencyControls = $(document.createElement('div'));
        inkTransparencyControls.attr("id","inkTransControls");
        inkTransparencyControls.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
        inkTransparencyDocfrag.appendChild(inkTransparencyControls[0]);
        inkTransparencyControls.css({ "display": "none" });

        // trans cancel button
        var cancelTransButton = $(document.createElement('button'));
        cancelTransButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', /*'width': '25%'*/ 'width': '80%' });
        cancelTransButton.get(0).innerHTML = "Cancel";
        cancelTransButton.on('click', function () {
            removeInkCanv();
            inkTransparencyControls.hide();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);

            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();
            // revert undo/redo buttons to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");
            playbackControls.undoButton.on('click', function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on('click', function () {
                undoManager.redo();
            });
            console.log("reseting undo-redo buttons to global");
            playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
        });
        inkTransparencyControls.append(cancelTransButton);

        var transArray = []; // array of transparency controls
        
        // add ellipse bounding shape button
        var addEllipseButton = $(document.createElement('button'));
        addEllipseButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left' });
        addEllipseButton.get(0).innerHTML = "Add Ellipse";
        addEllipseButton.on('click', function () {
            currentInkController.add_ellipse();
        });
        inkTransparencyControls.append(addEllipseButton);

        // add rectangle bounding shape button
        var addRectButton = $(document.createElement('button'));
        addRectButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%' });
        addRectButton.get(0).innerHTML = "Add Rectangle";
        addRectButton.on('click', function () {
            currentInkController.add_rectangle();
        });
        inkTransparencyControls.append(addRectButton);

        // trans mode div (contains isolate and block labels)
        var transModeDiv = $(document.createElement('div'));
        transModeDiv.css({ "height": '20%', 'width': '80%', 'clear': 'both', 'margin-left': '8%', 'margin-top': '3%', 'display': 'none' });

        // trans mode label
        var transModeLabel = $(document.createElement('div'));
        transModeLabel.addClass('thicknessLabel');
        var transModeLabel1 = $(document.createElement('div'));
        transModeLabel.text("Mode: ");
        transModeLabel1.text("Isolate");
        transModeLabel.append(transModeLabel1);
        transModeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        transModeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
        inkTransparencyControls.append(transModeLabel);
        inkTransparencyControls.append(transModeDiv);
        transArray.push(transModeDiv);

        // trans mode label click handler
        transModeLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            transModeLabel.css({ 'font-weight': 'bold' });
            updateToggle(transArray, transModeDiv);
        });

        // isolate label
        var transparencyMode = 'isolate';
        var isolateLabel = $(document.createElement('label'));
        isolateLabel.css({ 'font-size': '110%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'bold', 'float': 'left' });
        isolateLabel.text("Isolate");
        transModeDiv.append(isolateLabel);

        // isolate label click handler
        isolateLabel.on('click', function () {
            if (transparencyMode === 'block') {
                isolateLabel.css({ 'color': 'black' });
                blockLabel.css({ 'color': 'gray' });
                transparencyMode = 'isolate';
                transModeLabel1.text("Isolate");
                currentInkController.setTransMode("isolate");         
            }
        });

        // block label
        var blockLabel = $(document.createElement('label'));
        blockLabel.css({ 'font-size': '110%', 'color': 'gray', 'margin-right': '9%', 'font-weight': 'bold', 'float': 'right' });
        blockLabel.text("Block");
        transModeDiv.append(blockLabel);

        // block label click handler
        blockLabel.on('click', function () {
            if (transparencyMode === 'isolate') {
                isolateLabel.css({ 'color': 'gray' });
                blockLabel.css({ 'color': 'black' });
                transparencyMode = 'block';
                transModeLabel1.text("Block");
                currentInkController.setTransMode("block");
            }
        });

        // trans opacity label
        var opacityTransparencyLabel = $(document.createElement('div'));
        opacityTransparencyLabel.addClass('thicknessLabel');
        var opacityTransparencyLabel1 = $(document.createElement('div'));
        opacityTransparencyLabel.text("Opacity: ");
        opacityTransparencyLabel1.text("80%");
        opacityTransparencyLabel.append(opacityTransparencyLabel1);
        inkTransparencyControls.append(opacityTransparencyLabel);
        opacityTransparencyLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        opacityTransparencyLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // trans opacity slider
        var opacityTransparencySlider = $(document.createElement('div'));
        opacityTransparencySlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'/*, 'float': 'left'*/

        });
        var opacityTransparencySliderPoint = $(document.createElement('div'));
        opacityTransparencySliderPoint.attr("id", "opacityTransparencySliderPoint");
        opacityTransparencySliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
        });
        opacityTransparencySlider.append(opacityTransparencySliderPoint);
        inkTransparencyControls.append(opacityTransparencySlider);

        // trans opacity label click handler
        opacityTransparencyLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            opacityTransparencyLabel.css({ 'font-weight': 'bold' });
            updateToggle(transArray, opacityTransparencySlider);
        });

        // trans opacity slider drag handler
        opacityTransparencySliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                opacityTransparencySliderPoint.attr('value', (parseFloat(opacityTransparencySliderPoint.css("left").replace('px', '')) / (parseFloat(opacityTransparencySlider.offset().left) + parseFloat(opacityTransparencySlider.width())) * 1.28));
                if (opacityTransparencySliderPoint[0].value > 0.99) {
                    opacityTransparencySliderPoint.attr('value', 1.0);
                }
                else if (opacityTransparencySliderPoint[0].value < 0) {
                    opacityTransparencySliderPoint.attr('value', 0.0);
                }
                currentInkController.setMarqueeFillOpacity(parseFloat(opacityTransparencySliderPoint.attr("value")));
                opacityTransparencyLabel1.text(Math.round(100 * opacityTransparencySliderPoint.attr("value")) + "%");
            },
            appendTo: 'body'
        });
        transArray.push(opacityTransparencySlider);

        // trans attach buttons
        var linkTransDiv = getAttachDiv(inkTransparencyControls, 0, "trans");
        inkTransparencyControls.append(linkTransDiv);
        functionsPanel.append(inkTransparencyDocfrag);

        /**
         * Edit transparency controls (edit mode)
         */

        // edit trans control panel
        var editTransparencyDocfrag = document.createDocumentFragment();
        inkEditTransparency = $(document.createElement('div'));
        inkEditTransparency.attr("id", "inkEditTransparency");
        inkEditTransparency.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
        editTransparencyDocfrag.appendChild(inkEditTransparency[0]);
        inkEditTransparency.css({ "display": "none" });

        // trans cancel button
        var cancelEditTransButton = $(document.createElement('button'));
        cancelEditTransButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', /*'width': '25%'*/ 'width': '80%' });
        cancelEditTransButton.get(0).innerHTML = "Cancel";
        inkEditTransparency.append(cancelEditTransButton);

        var transEditArray = []; // array of edit transparency controls

        // add ellipse bounding shape button
        var addEditEllipseButton = $(document.createElement('button'));
        addEditEllipseButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left' });
        addEditEllipseButton.get(0).innerHTML = "Add Ellipse";
        addEditEllipseButton.on('click', function () {
            currentInkController.add_ellipse();
        });
        inkEditTransparency.append(addEditEllipseButton);

        // add rectangle bounding shape button
        var addEditRectButton = $(document.createElement('button'));
        addEditRectButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%' });
        addEditRectButton.get(0).innerHTML = "Add Rectangle";
        addEditRectButton.on('click', function () {
            currentInkController.add_rectangle();
        });
        inkEditTransparency.append(addEditRectButton);

        // div containing transparency mode options
        var transEditModeDiv = $(document.createElement('div'));
        transEditModeDiv.css({ "height": '20%', 'width': '80%', 'clear': 'both', 'margin-left': '8%', 'margin-top': '3%', 'display': 'none' });

        // trans mode label
        var transEditModeLabel = $(document.createElement('div'));
        transEditModeLabel.addClass('thicknessLabel');
        var transEditModeLabel1 = $(document.createElement('div'));
        transEditModeLabel.text("Mode: ");
        transEditModeLabel1.text("Isolate");
        transModeLabel.attr("id", "transModeLabel");
        transEditModeLabel.append(transEditModeLabel1);
        transEditModeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        transEditModeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
        inkEditTransparency.append(transEditModeLabel);
        inkEditTransparency.append(transEditModeDiv);
        transEditArray.push(transEditModeDiv);

        //trans mode click handler
        transEditModeLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            transEditModeLabel.css({ 'font-weight': 'bold' });
            updateToggle(transEditArray, transEditModeDiv);
        });

        var transparencyEditMode = 'isolate';

        // isolate label
        var isolateEditLabel = $(document.createElement('label'));
        isolateEditLabel.css({ 'font-size': '110%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'bold', 'float': 'left' });
        isolateEditLabel.text("Isolate");
        transEditModeDiv.append(isolateEditLabel);

        // isolate label click handler
        isolateEditLabel.on('click', function () {
            if (transparencyEditMode === 'block') {
                isolateEditLabel.css({ 'color': 'black' });
                blockEditLabel.css({ 'color': 'gray' });
                transparencyEditMode = 'isolate';
                transEditModeLabel1.text("Isolate");
                currentInkController.setTransMode("isolate");
            }
        });

        // block label
        var blockEditLabel = $(document.createElement('label'));
        blockEditLabel.css({ 'font-size': '110%', 'color': 'gray', 'margin-right': '9%', 'font-weight': 'bold', 'float': 'right' });
        blockEditLabel.text("Block");
        transEditModeDiv.append(blockEditLabel);

        // block label click handler
        blockEditLabel.on('click', function () {
            if (transparencyEditMode === 'isolate') {
                isolateEditLabel.css({ 'color': 'gray' });
                blockEditLabel.css({ 'color': 'black' });
                transparencyEditMode = 'block';
                transEditModeLabel1.text("Block");
                currentInkController.setTransMode("block");
            }
        });

        // trans opacity label
        var opacityEditTransparencyLabel = $(document.createElement('div'));
        opacityEditTransparencyLabel.addClass('thicknessLabel');
        var opacityEditTransparencyLabel1 = $(document.createElement('div'));
        opacityEditTransparencyLabel.text("Opacity: ");
        opacityEditTransparencyLabel1.text("80%");
        opacityEditTransparencyLabel.append(opacityEditTransparencyLabel1);
        inkEditTransparency.append(opacityEditTransparencyLabel);
        opacityEditTransparencyLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        opacityEditTransparencyLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // trans opacity slider
        var opacityEditTransparencySlider = $(document.createElement('div'));
        opacityEditTransparencySlider.attr("id", "opacityEditTransparencySlider");
        opacityEditTransparencySlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'/*, 'float': 'left'*/
        });
        var opacityEditTransparencySliderPoint = $(document.createElement('div'));
        opacityEditTransparencySliderPoint.attr("id", "opacityEditTransparencySliderPoint");
        opacityEditTransparencySliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': "relative",
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
        });
        opacityEditTransparencySlider.append(opacityEditTransparencySliderPoint);
        inkEditTransparency.append(opacityEditTransparencySlider);

        // trans opacity label click handler
        opacityEditTransparencyLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            opacityEditTransparencyLabel.css({ 'font-weight': 'bold' });
            updateToggle(transEditArray, opacityEditTransparencySlider);
        });

        // trans opacity slider drag handler
        opacityEditTransparencySliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                opacityEditTransparencySliderPoint.attr('value', (parseFloat(opacityEditTransparencySliderPoint.css("left").replace('px', '')) / (parseFloat(opacityEditTransparencySlider.offset().left) + parseFloat(opacityEditTransparencySlider.width())) * 1.28));
                if (opacityEditTransparencySliderPoint[0].value > 0.99) {
                    opacityEditTransparencySliderPoint.attr('value', 1.0);
                }
                else if (opacityEditTransparencySliderPoint[0].value < 0) {
                    opacityEditTransparencySliderPoint.attr('value', 0.0);
                }
                currentInkController.setMarqueeFillOpacity(parseFloat(opacityEditTransparencySliderPoint.attr("value")));
                opacityEditTransparencyLabel1.text(Math.round(100 * opacityEditTransparencySliderPoint.attr("value")) + "%");
            },
            appendTo: 'body'
        });
        transEditArray.push(opacityEditTransparencySlider);

        // edit trans save button
        var saveTransButton = $(document.createElement('button'));
        saveTransButton.css({ 'font-size': '100%', 'color': 'black', 'margin-top': '3%', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
        saveTransButton.get(0).innerHTML = "Save";
        inkEditTransparency.append(saveTransButton);
        functionsPanel.append(editTransparencyDocfrag);

        /**
         * Below are some helper function for the creation of ink controls above
         */

        /**
         * Allows you to click to close ink, edit ink controls (e.g. opacity sliders by clicking on labels).
         * Clicking on a label will collapse all other controls and show the selected control if it was hidden, hide it if it was shown.
         * @param array   the array of controls containing the control we are clicking on
         * @param show    the control we are clicking on -- we toggle it to be shown or hidden
         */
        function updateToggle(array, show) {
            if (array === textArray || array === drawArray || array === transArray || array === textEditArray || array === drawEditArray || array === transEditArray) {
                $.each(array, function () {
                    if (this === show && $(show).css("display") === "block") {
                        $(".thicknessLabel").css({ 'font-weight': 'normal' });
                        this.css("display", "none");
                    }
                    else {
                        if (this === show) { this.css("display", "block"); }
                        else { this.css("display", "none"); }
                    }
                });
            }
            else {
                $.each(array, function () {
                    if (this === show)
                        this.css("display", "block");
                    else
                        this.css("display", "none");
                });
            }
        }

        /**
         * Collapses all controls in a given panel
         * @param array   this is the array of controls to collapse (e.g. drawArray)
         */
        function hideAll(array) {
            $.each(array, function () {
                    this.css("display", "none");
            });
        }

        /**
         * Initialize the text controls with default values
         */
        function initText() {
            fontLabel.text("Font: ");
            fontLabel1.text("Times New Roman");
            fontLabel.append(fontLabel1);
            textSliderPoint.css("left", "10%");
            timesOption.attr("selected", "selected");
            textSizeLabel.text("Text Size: ");
            textSizeLabel1.text("12px");
            textSizeLabel.append(textSizeLabel1);
            hideAll(textArray);
        }

        /**
         * Initialize the transparency controls with default values
         */
        function initTrans() {
            opacityTransparencyLabel.text("Opacity: ");
            opacityTransparencyLabel1.text("80%");
            opacityTransparencyLabel.append(opacityTransparencyLabel1);
            opacityTransparencySliderPoint.css("left", (0.8 * (opacityTransparencySlider.offset().left + opacityTransparencySlider.width()) / 1.28) + 'px');
            isolateLabel.css({ 'color': 'black' });
            blockLabel.css({ 'color': 'gray' });
            transparencyMode = 'isolate';
            transModeLabel1.text("Isolate");
            hideAll(transArray);
        }

        /**
         * Initialize the draw controls with default values
         */
        function initDraw() {
            brushLabel.text("Brush: ");
            brushLabel1.text("7px");
            brushLabel.append(brushLabel1);
            brushSliderPoint.css("left", "0px");
            eraserLabel.text("Eraser: ");
            eraserLabel1.text("7px");
            eraserLabel.append(eraserLabel1);
            eraserSliderPoint.css("left", "0px");
            opacityLabel.text("Opacity: ");
            opacityLabel1.text("100%");
            opacityLabel.append(opacityLabel1);
            opacitySliderPoint.css("left", (0.87 * opacitySlider.width()) + "px");
            hideAll(drawArray);
        }

        function closeAllMenus() {
            dropInk.hide();
            dropFile.hide();
            dropMain.hide();
            fade.hide();
            componentDropDown = false;
        }
        /**
         * Create attach and create as unlinked buttons for ink creation
         */
        function getAttachDiv(controls, text, trans) {
            // slightly different controls for text and transparency, since we can't call currentInkController.link directly
            var text_mode = false;
            var trans_mode = false;
            if (text && text !== 0)
                text_mode = true;
            if (trans)
                trans_mode = true;

            // div to contain buttons
            var newDiv = $(document.createElement('div'));
            newDiv.css("display", "block");
            newDiv.css('margin-top', '2%');

            // attach button
            var linkButton = $(document.createElement('button'));
            linkButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '5%', 'clear': 'left' });
            linkButton.get(0).innerHTML = "Attach to Selected";

            // attach button click handler -- reset to default values, call link, link_text, or link_trans or their unattached equivalents
            linkButton.on('click', function () {
                brushSliderPoint.attr('value', 7.0);
                currentInkController.updatePenWidth("brushSlider");
                colorLabel1.text("#000000");
                myPicker = new jscolor.color(item, {});
                myPicker.fromString("000000");
                myPicker.onImmediateChange = function () {
                    currentInkController.updatePenColor("brushColorToggle");
                    currentInkController.set_mode(LADS.TourAuthoring.InkMode.draw);
                    $('.changeColor1')[0].innerHTML = "#" + $("#brushColorToggle").attr("value");
                };
                var check = true; // if check becomes false, then a warning message appeared, do not proceed after trying to attach
                text_mode = false;
                if (text_mode)
                    check = currentInkController.link_text();
                else if (trans_mode)
                    check = currentInkController.link_trans();
                else // draw
                    check = currentInkController.link();
                if (!check)
                    return;

                controls.hide();
                // reset undo/redo buttons to global undo/redo functionality
                playbackControls.undoButton.off("click");
                playbackControls.redoButton.off("click");

                playbackControls.undoButton.on('click', function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on('click', function () {
                    undoManager.redo();
                });
                playbackControls.undoRedoInkOnly.css('display', 'none');


                if (inkAuthoring) {
                    inkAuthoring.getInkUndoManager().clear();
                    undoManager.greyOutBtn();
                }
                timeline.setModifyingInk(false);
                timeline.setEditInkOn(false);
            });
            newDiv.append(linkButton);

            // create as unattached ink button
            var freeInkButton = $(document.createElement('button'));
            freeInkButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '5%' });
            freeInkButton.get(0).innerHTML = "Create as Unattached";

            // unattached button click handler
            freeInkButton.on('click', function () {
                brushSliderPoint.attr('value', 7.0);
                currentInkController.updatePenWidth("brushSlider");
                var check=true;
                if (text_mode)
                    check=currentInkController.link_text_unattached();
                else if (trans_mode)
                    check=currentInkController.link_trans_unattached();
                else
                    check=currentInkController.linkUnattached();
                if (!check) {
                    return;
                }
                controls.hide();
                // restore global undo/redo functionality
                playbackControls.undoButton.off("click");
                playbackControls.redoButton.off("click");
                playbackControls.undoButton.on('click', function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on('click', function () {
                    undoManager.redo();
                });
                playbackControls.undoRedoInkOnly.css('display', 'none');

                if (inkAuthoring) {
                    inkAuthoring.getInkUndoManager().clear();
                    undoManager.greyOutBtn();
                }
                timeline.setModifyingInk(false);
                timeline.setEditInkOn(false);
            });
            newDiv.append(freeInkButton);
            return newDiv;
        }

        /**
         * Sets display:none for each of the ink control panels
         */
        function hideInkControls() {
            inkTransparencyControls.css({ 'display': 'none' });
            inkTextControls.css({ 'display': 'none' });
            inkDrawControls.css({ 'display': 'none' });
            inkEditDraw.css({ 'display': 'none', });
            inkEditTransparency.css('display', 'none');
            inkEditText.css('display', 'none');
        }
        that.hideInkControls = hideInkControls;

        /**
         * Removes the current ink canvas if there is one
         */
        function removeInkCanv() {
            if ($("#inkCanv").length)
                $("#inkCanv").remove();
        }
        that.removeInkCanv = removeInkCanv;

        /**
         * Creates an ink canvas
         * @return   a div on which we'll create a Raphael paper
         */
        function createInkCanv() {
            // remove any existing ink canvases
            removeInkCanv();

            // create a div on which we'll create a Raphael paper
            var inkdiv = document.createElement("div");
            inkdiv.setAttribute("id", "inkCanv");
            inkdiv.setAttribute("class", "inkCanv");

            //set rinplayer's position to absolute so our canvas isn't pushed down
            $("#rinplayer").css("position", "absolute");

            // set css of inkdiv, making sure that its z-index is greater than those of all images and artworks (artwork in track i has z-index 20000+i)
            var num_tracks = timeline.getTrackslength();
            inkdiv.setAttribute("style", "overflow:hidden; position:absolute; width:100%; height:100%; background:transparent; z-index:" + (20100 + num_tracks) + ";");
            var view_elt = $("#rinContainer"); // change to #rinplayer if we can figure out how to keep it around during tour reloads (if in #rinplayer, we can capture inks in thumbnails)
            view_elt.append(inkdiv);
            return inkdiv;
        }

    })();


    /**
     * Appends the functions panel to the inputted container element
     * @param container   element to which we'll append the functions panel
     */
    function addToDOM(container) {
        container.append(functionsPanelDocfrag);
    }
    that.addToDOM = addToDOM;

    /**
     * Adds the catalog overlays (for artwork and associated media import) to the inputted container element
     * Used in TourAuthoringNew
     * @param container   element to which we'll append the functions panel
     */
    function addCatalogToDOM(container) {
        container.appendChild(catalogPickerOverlay);
        container.appendChild(associatedMediaPickerOverlay);
    }
    that.addCatalogToDOM = addCatalogToDOM;

    function getIsUploading() {
        return isUploading;
    }
    that.getIsUploading = getIsUploading;

    return that;
};