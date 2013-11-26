LADS.Util.makeNamespace("LADS.TourAuthoring.InkAuthoring");

// Enum defining ink modes
LADS.TourAuthoring.InkMode = {
    shapes: 0, //shape manipulation
    draw: 1,
    erase: 2,
    text: 5,
};

LADS.TourAuthoring.InkCallers = {
    inkes: 1,
    componentcontrols: 2
};

/**
 * Back-end for ink authoring and editing. Instances are created in ComponentControls and InkES. In
 * ComponentControls, we need the ability to author and edit inks. In InkES, we need them to follow
 * artworks.
 * Uses the RaphaelJS library for svg manipulation.
 * @param canvId        the id of the div to which we'll assign the Raphael canvas.
 * @param html_elt      in the case that the div above is not in the dom yet, send in a variable for its html element.
 * @param calling_file  either 'inkes' or not; slightly different functionality is needed in different instances.
 * @param spec          if the calling file is ComponentControls, we make use of the undoManager etc, so just pass
 *                      in the spec variable from ComponentControls.
 */

LADS.TourAuthoring.InkAuthoring = function (canvId, html_elt, calling_file, spec) {
    "use strict";

    // set up the Raphael paper/canvas
    var that = {};
    var canvid = canvId;
    that.canvid = canvId;
    html_elt = (html_elt) ? html_elt : $("#" + canvid)[0];
    var domelement = $(html_elt);
    var textElt;

    var paper = new Raphael(html_elt, "100%", "100%");
    $("#" + canvid + " svg").css("position", "absolute");
    
    // brush variables
    var penColor = "#000000";
    var penOpacity = 1.0;
    var penWidth = 4;
    var eraserWidth = 5;
    var ml = []; //path M/L values (see svg path format)
    var xy = []; //path coordinates; each entry has an x and y property
    var pa = []; //path attributes
    var pathObjects = [];
    var currpaths = ""; //this will be the string representing all of our paths; to get the paths individually, split at 'M'


    // ellipse/rectangle variables
    var shapeStrokeColor = "#ffffff";
    var shapeStrokeOpacity = 0.7;
    var shapeStrokeWidth = 5;
    var shapeFillColor = "#000000";
    var shapeFillOpacity = 0;

    // block/isolate variables
    var marqueeFillColor = "#000000";
    var marqueeFillOpacity = 0.8;
    var trans_mode = 'isolate';
    var transCoords = [];
    var transLetters = [];
    var trans_currpath = "";
    var bounding_shapes = "";

    // text variables
    var fontFamily = "'Times New Roman', serif";
    var fontColor = "#ffffff";
    var fontSize = '12px';
    var fontOpacity = 1.0;
    var textboxid = "textbox";
    var outerdivid = "outerdiv";
    var lastText = "";
    var svgText;

    // misc variables
    var inktrack = null;
    calling_file = (calling_file === 'inkes') ? 'inkes' : 'componentcontrols';
    var marquees = []; // old marquees
    var click = false; // has the mouse been clicked?
    var datastring = "";
    var mode = LADS.TourAuthoring.InkMode.draw;
    var enabled = true; //attached ink tracks by default
    var initKeyframe = {};
    var artName = "";
    var EID = ""; // rin experience id (name of the ink track)
    var oldScale = 1;
    var firstTimeThrough = 2;
    
    // set up the coordinates for adjustViewBox
    var viewerElt;
    if (calling_file === 'inkes')
        viewerElt = ($("#rinplayer").length) ? $("#rinplayer") : $("#rinPlayer");
    else
        viewerElt = $("#rinContainer");
    var origPaperX = 0; // original coordinates of the paper (match with rinContainer)
    var origPaperY = 0;
    var origPaperW = viewerElt.width();
    var origPaperH = viewerElt.height();
    var origpx = 0; // original coordinates of the artwork
    var origpy = 0;
    var origpw = 0;
    var origph = 0;
    var lastpx = 0; // most recent coordinates of the artwork
    var lastpy = 0;
    var lastpw = 0;
    var lastph = 0;
    var lastcx = 0; // most recent coordinates of the "virtual canvas" which helps us place inks correctly
    var lastcy = 0; // the virtual canvas is where the Raphael canvas would be if it were moving with the artwork
    var lastcw = origPaperW;
    var lastch = origPaperH;
    var oldOpac = 0; // keeps track of whether an ink is on screen or not

    // componentControls-specific variables for creating an ink undo manager, getting keyframes
    var inkUndoManager;
    var playbackControls;
    var undoManager;
    var timeline;
    var timeManager;
    var viewer;
    if (calling_file !== 'inkes') {
        playbackControls = spec.playbackControls;
        undoManager = spec.undoManager;
        timeline = spec.timeline;
        timeManager = spec.timeManager;
        viewer = spec.viewer;
        // set up the ink undo manager using existing undo/redo buttons
        inkUndoManager = new LADS.TourAuthoring.UndoManager();
        inkUndoManager.setInitialized(true);
        playbackControls.undoButton.off("click");
        playbackControls.redoButton.off("click");
        playbackControls.undoButton.on('click', function () {
            inkUndoManager.undo();
        });
        playbackControls.redoButton.on('click', function () {
            inkUndoManager.redo();
        });
    }
    
    
    // methods //

    /**
     * Helper function to parse and multiply dimensions.
     * @param rel_coord    the relative coordinate we want to convert to absolute coordinates
     * @param canv_dim     the relevant dimension of the canvas used for scaling
     * @return    the absolute coordinate
     */
    function abs_dims(rel_coord, canv_dim) {
        return parseFloat(rel_coord) * parseFloat(canv_dim);
    }
    that.abs_dims = abs_dims;

    /**
     * Takes an ellipse or rectangle and adds styling, drag events, drag handles to it.
     * @param elt     the svg element
     * @param others  styling to apply to elt
     */
    function add_attributes(elt, fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWidth) {
        var origmousex;
        var origmousey;
        var origposition = { x: 0, y: 0, w: 0, h: 0 };
        var c1origposition = { x: 0, y: 0, w: 0, h: 0 };
        var c2origposition = { x: 0, y: 0, w: 0, h: 0 };
        var dcorigposition = { x: 0, y: 0, w: 0, h: 0 };
        var eltbbox, c1bbox, c2bbox, dcbbox;
        var beenMoved;

        // if attributes are not passed in, use global variables
        if (fillColor === undefined)
            fillColor = shapeFillColor;
        if (fillOpacity === undefined)
            fillOpacity = shapeFillOpacity;
        if (strokeColor === undefined)
            strokeColor = shapeStrokeColor;
        if (strokeOpacity === undefined)
            strokeOpacity = shapeStrokeOpacity;
        if (strokeWidth === undefined)
            strokeWidth = shapeStrokeWidth;

        elt.attr({ // add color attributes
            "stroke-width": strokeWidth,
            "stroke": strokeColor,
            "stroke-opacity": strokeOpacity,
            "fill": fillColor,
            "fill-opacity": fillOpacity,
            "stroke-dasharray": "-",
        });

        var C1, C2; // drag handles
        var DC; // deletion circle
        var rds = LADS.TourAuthoring.Constants.inkDragHandleRadius;

        if (elt.data("type") == "ellipse") {
            var rx = elt.data("curr_rx");
            var ry = elt.data("curr_ry");
            var cx = elt.data("currx") + rx;
            var cy = elt.data("curry") + ry;
            var x0 = rx / Math.sqrt(2.0); // fix where the top left drag handle should be in proportion to the radius
            var y0 = ry * Math.sqrt(1 - x0 * x0 / (rx * rx)); // (if ellipse is a circle, handle will be on the line between center and top left corner of bounding box)
            C1 = paper.ellipse(cx - x0 - strokeWidth/2, cy+strokeWidth / 2 - y0, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#ffffff", "fill": "#296B2F", "fill-opacity": 0.9 }).data("type", "grabHandle");
            C2 = paper.ellipse(cx + x0 + strokeWidth / 2, cy + y0 + strokeWidth / 2, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#296B2F", "fill": "#ffffff", "fill-opacity": 0.9 }).data("type", "grabHandle");
            DC = paper.ellipse(cx + x0 + strokeWidth / 2, cy + strokeWidth / 2 - y0, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#ffffff", "fill": "#880000", "fill-opacity": 0.9 }).data("type", "grabHandle");
        }
        else if (elt.data("type") == "rect") {
            var x = elt.data("currx");
            var y = elt.data("curry");
            var w = elt.data("currw");
            var h = elt.data("currh");
            C1 = paper.ellipse(x, y, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#ffffff", "fill": "#296B2F", "fill-opacity": 0.9 }).data("type", "grabHandle");
            C2 = paper.ellipse(x + w, y + h, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#296B2F", "fill": "#ffffff", "fill-opacity": 0.9 }).data("type", "grabHandle");
            DC = paper.ellipse(x + w, y, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#ffffff", "fill": "#880000", "fill-opacity": 0.9 }).data("type", "grabHandle");
        }
        C1.data("curr_cx", C1.attr("cx"));
        C1.data("curr_cy", C1.attr("cy"));
        C2.data("curr_cx", C2.attr("cx"));
        C2.data("curr_cy", C2.attr("cy"));
        DC.data("curr_cx", DC.attr("cx"));
        DC.data("curr_cy", DC.attr("cy"));

        //log in the undo manager; show and hide elements
        var command = LADS.TourAuthoring.Command({
            execute: function () {
                elt.show();
                C1.show();
                C2.show();
                DC.show();
                elt.data("visible", "yes");
            },
            unexecute: function () {
                elt.hide();
                C1.hide();
                C2.hide();
                DC.hide();
                elt.data("visible", "no");
            }
        });
        command.execute();
        inkUndoManager.logCommand(command);

        // define drag functionality for the panning handle (upper-left)
        C1.drag(function (dx, dy, mousex, mousey) { // move
            beenMoved = true;
            elt.toFront();
            C1.toFront();
            C2.toFront();
            DC.toFront();
            var halfWid = (origposition.w + strokeWidth) / 2;
            var halfHei = (origposition.h + strokeWidth) / 2;

            var circleRadius = C1.attr("rx");
            //Hard stops for textbox location in ink canvas
            if (c2origposition.x + strokeWidth + circleRadius + dx <= halfWid) {
                dx = halfWid - c2origposition.x - circleRadius;
            }
            if (c2origposition.y + circleRadius +strokeWidth + dy <= halfHei) {
                dy = halfWid - c2origposition.y - circleRadius;
            }
            if (c1origposition.x + circleRadius + dx + halfWid >= canvwidth) {
                dx = canvwidth - halfWid - c1origposition.x - circleRadius;
            }
            if (c1origposition.y + circleRadius + dy + halfHei >= canvheight) {
                dy = canvheight - c1origposition.y - circleRadius - halfHei;
            }

            var c1currx = parseInt(C1.data("curr_cx"), 10);//x position at the start of drag
            var c1curry = parseInt(C1.data("curr_cy"), 10);
            var xpos = c1currx + dx; // to get new x position, just add dx
            var ypos = c1curry + dy;
            C1.attr({
                cx: xpos, // xcenter
                cy: ypos, // ycenter
            });

            var c2currx = parseInt(C2.data("curr_cx"), 10);// x position at the start of drag
            var c2curry = parseInt(C2.data("curr_cy"), 10);
            xpos = c2currx + dx; // to get new x position, just add dx
            ypos = c2curry + dy;
            C2.attr({
                cx: xpos, // xcenter
                cy: ypos, // ycenter
            });

            var dccurrx = parseInt(DC.data("curr_cx"), 10);
            var dccurry = parseInt(DC.data("curr_cy"), 10);
            xpos = dccurrx + dx;
            ypos = dccurry + dy;
            DC.attr({
                cx: xpos, // xcenter
                cy: ypos, // ycenter
            });

            var eltcurrx, eltcurry;
            if (elt.data("type") === "ellipse") {
                eltcurrx = parseInt(elt.data("currx"),10) + elt.attr("rx");// x position at the start of drag
                eltcurry = parseInt(elt.data("curry"),10) + elt.attr("ry");
            }
            else if (elt.data("type") === "rect") {
                eltcurrx = parseInt(elt.data("currx"),10);
                eltcurry = parseInt(elt.data("curry"),10);
            }
            xpos = eltcurrx + dx; // to get new x position, just add dx
            ypos = eltcurry + dy;
            elt.attr({
                x: xpos,
                y: ypos,
                cx: xpos, // xcenter
                cy: ypos, // ycenter
            });
        },
        function (x, y) { // start; record original positions
            beenMoved = false;
            eltbbox = elt.getBBox();
            origposition.x = eltbbox.x;
            origposition.y = eltbbox.y;
            origposition.w = eltbbox.width;
            origposition.h = eltbbox.height;

            c1bbox = C1.getBBox();
            c1origposition.x = c1bbox.x;
            c1origposition.y = c1bbox.y;
            c1origposition.w = c1bbox.width;
            c1origposition.h = c1bbox.height;

            c2bbox = C2.getBBox();
            c2origposition.x = c2bbox.x;
            c2origposition.y = c2bbox.y;
            c2origposition.w = c2bbox.width;
            c2origposition.h = c2bbox.height;

            dcbbox = DC.getBBox();
            dcorigposition.x = dcbbox.x;
            dcorigposition.y = dcbbox.y;
            dcorigposition.w = dcbbox.width;
            dcorigposition.h = dcbbox.height;
        },
        function (x, y) { // stop; log in undomanager and set data of element
            if (!beenMoved) {
                return;
            }
            var c1bboxx = C1.getBBox().x;
            var c1bboxy = C1.getBBox().y;
            var c1bboxw = C1.getBBox().width;
            var c1bboxh = C1.getBBox().height;
            this.data("curr_cx", c1bboxx + c1bboxw / 2.0); //reset data using bounding box coords
            this.data("curr_cy", c1bboxy + c1bboxh / 2.0);

            var c2bboxx = C2.getBBox().x;
            var c2bboxy = C2.getBBox().y;
            var c2bboxw = C2.getBBox().width;
            var c2bboxh = C2.getBBox().height;
            C2.data("curr_cx", c2bboxx + c2bboxw / 2.0); //reset data using bounding box coords
            C2.data("curr_cy", c2bboxy + c2bboxh / 2.0);

            var dcbboxx = DC.getBBox().x;
            var dcbboxy = DC.getBBox().y;
            var dcbboxw = DC.getBBox().width;
            var dcbboxh = DC.getBBox().height;
            DC.data("curr_cx", dcbboxx + dcbboxw / 2.0); //reset data using bounding box coords
            DC.data("curr_cy", dcbboxy + dcbboxh / 2.0);

            var bboxx = elt.getBBox().x;
            var bboxy = elt.getBBox().y;
            var bboxw = elt.getBBox().width;
            var bboxh = elt.getBBox().height;

            if (elt.data("type") == "ellipse") {
                elt.data("currx", elt.attr("cx") - elt.attr("rx"));
                elt.data("curry", elt.attr("cy") - elt.attr("ry"));
                elt.data("curr_rx", elt.attr("rx"));
                elt.data("curr_ry", elt.attr("ry"));
            }
            else if (elt.data("type") == "rect") {
                elt.data("currx", elt.attr("x"));
                elt.data("curry", elt.attr("y"));
            }

            var ox = origposition.x;
            var oy = origposition.y;
            var ow = origposition.w;
            var oh = origposition.h;

            var o1x = c1origposition.x;
            var o1y = c1origposition.y;
            var o1w = c1origposition.w;
            var o1h = c1origposition.h;

            var o2x = c2origposition.x;
            var o2y = c2origposition.y;
            var o2w = c2origposition.w;
            var o2h = c2origposition.h;

            var odcx = dcorigposition.x;
            var odcy = dcorigposition.y;
            var odcw = dcorigposition.w;
            var odch = dcorigposition.h;

            var command = LADS.TourAuthoring.Command({
                execute: function () {
                    console.log("bbox in execute: {" + bboxx + "," + bboxy + "," + bboxw + "," + bboxh + "}");
                    elt.data("currx", bboxx);
                    elt.data("curry", bboxy);
                    elt.data("currw", bboxw);
                    elt.data("currh", bboxh);
                    elt.data("curr_rx", bboxw / 2.0);
                    elt.data("curr_ry", bboxh / 2.0);
                    elt.attr({
                        cx: bboxx + bboxw / 2.0,
                        cy: bboxy + bboxh / 2.0,
                        rx: bboxw / 2.0,
                        ry: bboxh / 2.0,
                        x: bboxx,
                        y: bboxy,
                        width: bboxw,
                        height: bboxh,
                    });

                    C1.data("curr_cx", c1bboxx + c1bboxw / 2.0);
                    C1.data("curr_cy", c1bboxy + c1bboxh / 2.0);
                    C1.attr({
                        cx: c1bboxx + c1bboxw / 2.0,
                        cy: c1bboxy + c1bboxh / 2.0,
                        rx: c1bboxw / 2.0,
                        ry: c1bboxh / 2.0,
                    });
                    C2.data("curr_cx", c2bboxx + c2bboxw / 2.0);
                    C2.data("curr_cy", c2bboxy + c2bboxh / 2.0);
                    C2.attr({
                        cx: c2bboxx + c2bboxw / 2.0,
                        cy: c2bboxy + c2bboxh / 2.0,
                        rx: c2bboxw / 2.0,
                        ry: c2bboxh / 2.0,
                    });
                    DC.data("curr_cx", dcbboxx + dcbboxw / 2.0);
                    DC.data("curr_cy", dcbboxy + dcbboxh / 2.0);
                    DC.attr({
                        cx: dcbboxx + dcbboxw / 2.0,
                        cy: dcbboxy + dcbboxh / 2.0,
                        rx: dcbboxw / 2.0,
                        ry: dcbboxh / 2.0,
                    });
                },
                unexecute: function () {
                    console.log("origposition in unexecute: {" + ox + "," + oy + "," + ow + "," + oh + "}");
                    elt.data("currx", ox);
                    elt.data("curry", oy);
                    elt.data("currw", ow);
                    elt.data("currh", oh);
                    elt.data("curr_rx", ow / 2.0);
                    elt.data("curr_ry", oh / 2.0);
                    elt.attr({
                        cx: ox + ow / 2.0,
                        cy: oy + oh / 2.0,
                        rx: ow / 2.0,
                        ry: oh / 2.0,
                        x: ox,
                        y: oy,
                        width: ow,
                        height: oh,
                    });

                    C1.data("curr_cx", o1x + o1w / 2.0);
                    C1.data("curr_cy", o1y + o1h / 2.0);
                    C1.attr({
                        cx: o1x + o1w / 2.0,
                        cy: o1y + o1h / 2.0,
                    });

                    C2.data("curr_cx", o2x + o2w / 2.0);
                    C2.data("curr_cy", o2y + o2h / 2.0);
                    C2.attr({
                        cx: o2x + o2w / 2.0,
                        cy: o2y + o2h / 2.0,
                    });

                    DC.data("curr_cx", odcx + odcw / 2.0);
                    DC.data("curr_cy", odcy + odch / 2.0);
                    DC.attr({
                        cx: odcx + odcw / 2.0,
                        cy: odcy + odch / 2.0,
                    });
                }
            });
            command.execute();
            inkUndoManager.logCommand(command);
        });

        // define drag functionality for the resizing handle (lower-right);
        // when we resize, keep the panning handle where it is, have the resizing handle follow the mouse,
        // set the shape to be whatever it needs to be to satisfy those constraints
        C2.drag(function (dx, dy, mousex, mousey) {
            beenMoved = true;
            elt.toFront();
            C1.toFront();
            C2.toFront();
            DC.toFront();

            var currx = parseInt(C2.data("curr_cx"),10);//x position at the start of drag
            var curry = parseInt(C2.data("curr_cy"),10);
            var xpos = currx + dx; //to get new x position, just add dx
            var ypos = curry + dy;
            var x0 = C1.attr("cx");
            var y0 = C1.attr("cy");
            var handlerad = LADS.TourAuthoring.Constants.inkDragHandleRadius;

            if (xpos - x0 > 2 * handlerad) {
                C2.attr({ cx: xpos });
                DC.attr({ cx: xpos });
            }
            if (ypos - y0 > 2 * handlerad) {
                C2.attr({ cy: ypos });
            }

            var x1 = this.attr("cx");
            var y1 = this.attr("cy");

            var oldrx = elt.attr("rx");
            var CX = x0 + (x1 - x0) / 2.0;
            var CY = y0 + (y1 - y0) / 2.0;
            var RADx = (x1 - x0) / 2.0 * Math.sqrt(2);
            elt.attr({
                cx: CX,
                cy: CY,
                rx: RADx,
                ry: RADx * Math.sqrt((-(y1 - CY) * (y1 - CY)) / ((x1 - CX) * (x1 - CX) - (RADx) * (RADx))),
                width: x1 - x0,
                height: y1 - y0,
            });
        },
        function (x, y) { //start
            beenMoved = false;
            var bbox = elt.getBBox();
            origposition.x = bbox.x;
            origposition.y = bbox.y;
            origposition.w = bbox.width;
            origposition.h = bbox.height;

            bbox = C1.getBBox();
            c1origposition.x = bbox.x;
            c1origposition.y = bbox.y;
            c1origposition.w = bbox.width;
            c1origposition.h = bbox.height;

            bbox = C2.getBBox();
            c2origposition.x = bbox.x;
            c2origposition.y = bbox.y;
            c2origposition.w = bbox.width;
            c2origposition.h = bbox.height;

            bbox = DC.getBBox();
            dcorigposition.x = bbox.x;
            dcorigposition.y = bbox.y;
            dcorigposition.w = bbox.width;
            dcorigposition.h = bbox.height;
        },
        function (x, y) { //stop
            if (!beenMoved) {
                return;
            }
            var c2bboxx = C2.getBBox().x;
            var c2bboxy = C2.getBBox().y;
            var c2bboxw = C2.getBBox().width;
            var c2bboxh = C2.getBBox().height;
            C2.data("curr_cx", c2bboxx + c2bboxw / 2.0); //reset data using bounding box coords
            C2.data("curr_cy", c2bboxy + c2bboxh / 2.0);
            if (elt.data("type") === "ellipse") {
                elt.data("currx", elt.attr("cx") - elt.attr("rx"));
                elt.data("curry", elt.attr("cy") - elt.attr("ry"));
                elt.data("curr_rx", elt.attr("rx"));
                elt.data("curr_ry", elt.attr("ry"));
            }
            else if (elt.data("type") === "rect") {
                elt.data("currx", elt.attr("x"));
                elt.data("curry", elt.attr("y"));
                elt.data("currw", elt.attr("width"));
                elt.data("currh", elt.attr("height"));
            }

            var bboxx = elt.getBBox().x;
            var bboxy = elt.getBBox().y;
            var bboxw = elt.getBBox().width;
            var bboxh = elt.getBBox().height;

            var c1bboxx = C1.getBBox().x;
            var c1bboxy = C1.getBBox().y;
            var c1bboxw = C1.getBBox().width;
            var c1bboxh = C1.getBBox().height;

            var dcbboxx = DC.getBBox().x;
            var dcbboxy = DC.getBBox().y;
            var dcbboxw = DC.getBBox().width;
            var dcbboxh = DC.getBBox().height;

            var ox = origposition.x;
            var oy = origposition.y;
            var ow = origposition.w;
            var oh = origposition.h;

            var o1x = c1origposition.x;
            var o1y = c1origposition.y;
            var o1w = c1origposition.w;
            var o1h = c1origposition.h;

            var o2x = c2origposition.x;
            var o2y = c2origposition.y;
            var o2w = c2origposition.w;
            var o2h = c2origposition.h;

            var odcx = dcorigposition.x;
            var odcy = dcorigposition.y;
            var odcw = dcorigposition.w;
            var odch = dcorigposition.h;

            // log command
            var command = LADS.TourAuthoring.Command({
                execute: function () {
                    console.log("bbox in execute: {" + bboxx + "," + bboxy + "," + bboxw + "," + bboxh + "}");
                    elt.data("currx", bboxx);
                    elt.data("curry", bboxy);
                    elt.data("currw", bboxw);
                    elt.data("currh", bboxh);
                    elt.data("curr_rx", bboxw / 2.0);
                    elt.data("curr_ry", bboxh / 2.0);
                    elt.attr({
                        cx: bboxx + bboxw / 2.0,
                        cy: bboxy + bboxh / 2.0,
                        rx: bboxw / 2.0,
                        ry: bboxh / 2.0,
                        x: bboxx,
                        y: bboxy,
                        width: bboxw,
                        height: bboxh,
                    });

                    C1.data("curr_cx", c1bboxx + c1bboxw / 2.0);
                    C1.data("curr_cy", c1bboxy + c1bboxh / 2.0);
                    C1.attr({
                        cx: c1bboxx + c1bboxw / 2.0,
                        cy: c1bboxy + c1bboxh / 2.0,
                        rx: c1bboxw / 2.0,
                        ry: c1bboxh / 2.0,
                    });
                    C2.data("curr_cx", c2bboxx + c2bboxw / 2.0);
                    C2.data("curr_cy", c2bboxy + c2bboxh / 2.0);
                    C2.attr({
                        cx: c2bboxx + c2bboxw / 2.0,
                        cy: c2bboxy + c2bboxh / 2.0,
                        rx: c2bboxw / 2.0,
                        ry: c2bboxh / 2.0,
                    });
                    DC.data("curr_cx", dcbboxx + dcbboxw / 2.0);
                    DC.data("curr_cy", dcbboxy + dcbboxh / 2.0);
                    DC.attr({
                        cx: dcbboxx + dcbboxw / 2.0,
                        cy: dcbboxy + dcbboxh / 2.0,
                        rx: dcbboxw / 2.0,
                        ry: dcbboxh / 2.0,
                    });
                },
                unexecute: function () {
                    console.log("origposition in unexecute: {" + ox + "," + oy + "," + ow + "," + oh + "}");
                    elt.data("currx", ox);
                    elt.data("curry", oy);
                    elt.data("currw", ow);
                    elt.data("currh", oh);
                    elt.data("curr_rx", ow / 2.0);
                    elt.data("curr_ry", oh / 2.0);
                    elt.attr({
                        cx: ox + ow / 2.0,
                        cy: oy + oh / 2.0,
                        rx: ow / 2.0,
                        ry: oh / 2.0,
                        x: ox,
                        y: oy,
                        width: ow,
                        height: oh,
                    });

                    C1.data("curr_cx", o1x + o1w / 2.0);
                    C1.data("curr_cy", o1y + o1h / 2.0);
                    C1.attr({
                        cx: o1x + o1w / 2.0,
                        cy: o1y + o1h / 2.0,
                    });

                    C2.data("curr_cx", o2x + o2w / 2.0);
                    C2.data("curr_cy", o2y + o2h / 2.0);
                    C2.attr({
                        cx: o2x + o2w / 2.0,
                        cy: o2y + o2h / 2.0,
                    });

                    DC.data("curr_cx", odcx + odcw / 2.0);
                    DC.data("curr_cy", odcy + odch / 2.0);
                    DC.attr({
                        cx: odcx + odcw / 2.0,
                        cy: odcy + odch / 2.0,
                    });
                }
            });
            command.execute();
            inkUndoManager.logCommand(command);
        });

        //define drag functionality for the shape itself (panning)
        elt.drag(function (dx, dy, mousex, mousey) { // move
            beenMoved = true;
            this.toFront();
            C1.toFront();
            C2.toFront();
            DC.toFront();
            var halfWid = (origposition.w + strokeWidth) / 2;
            var halfHei = (origposition.h + strokeWidth) / 2;
            var circleRadius = C1.attr("rx");
            if (c2origposition.x + strokeWidth + circleRadius + dx <= halfWid) {
                dx = halfWid - c2origposition.x - circleRadius;
            }
            if (c2origposition.y + circleRadius + strokeWidth + dy <= halfHei) {
                dy = halfWid - c2origposition.y - circleRadius;
            }
            if (c1origposition.x + circleRadius + dx + halfWid >= canvwidth) {
                dx = canvwidth - halfWid - c1origposition.x - circleRadius;
            }
            if (c1origposition.y + circleRadius + dy + halfHei >= canvheight) {
                dy = canvheight - c1origposition.y - circleRadius - halfHei;
            }

            var c1currx = parseInt(C1.data("curr_cx"),10);
            var c1curry = parseInt(C1.data("curr_cy"),10);
            var xpos = c1currx + dx;
            var ypos = c1curry + dy;
            C1.attr({
                cx: xpos,
                cy: ypos,
            });

            var c2currx = parseInt(C2.data("curr_cx"),10);
            var c2curry = parseInt(C2.data("curr_cy"),10);
            xpos = c2currx + dx;
            ypos = c2curry + dy;
            C2.attr({
                cx: xpos,
                cy: ypos,
            });

            var dccurrx = parseInt(DC.data("curr_cx"), 10);
            var dccurry = parseInt(DC.data("curr_cy"), 10);
            xpos = dccurrx + dx;
            ypos = dccurry + dy;
            DC.attr({
                cx: xpos,
                cy: ypos,
            });

            var eltcurrx, eltcurry;
            if (elt.data("type") == "ellipse") {
                eltcurrx = parseInt(this.data("currx"),10) + this.attr("rx");
                eltcurry = parseInt(this.data("curry"),10) + this.attr("ry");
            }
            else if (elt.data("type") == "rect") {
                eltcurrx = parseInt(this.data("currx"),10);
                eltcurry = parseInt(this.data("curry"),10);
            }
            xpos = eltcurrx + dx;
            ypos = eltcurry + dy;
            this.attr({
                x: xpos,
                y: ypos,
                cx: xpos,
                cy: ypos,
            });
        },
        function (x, y) { // start
            beenMoved = false;
            var bbox = elt.getBBox();
            origposition.x = bbox.x;
            origposition.y = bbox.y;
            origposition.w = bbox.width;
            origposition.h = bbox.height;

            bbox = C1.getBBox();
            c1origposition.x = bbox.x;
            c1origposition.y = bbox.y;
            c1origposition.w = bbox.width;
            c1origposition.h = bbox.height;

            bbox = C2.getBBox();
            c2origposition.x = bbox.x;
            c2origposition.y = bbox.y;
            c2origposition.w = bbox.width;
            c2origposition.h = bbox.height;

            bbox = DC.getBBox();
            dcorigposition.x = bbox.x;
            dcorigposition.y = bbox.y;
            dcorigposition.w = bbox.width;
            dcorigposition.h = bbox.height;
        },
        function (x, y) { //stop
            if (!beenMoved) {
                return;
            }
            var c1bboxx = C1.getBBox().x;
            var c1bboxy = C1.getBBox().y;
            var c1bboxw = C1.getBBox().width;
            var c1bboxh = C1.getBBox().height;
            C1.data("curr_cx", c1bboxx + c1bboxw / 2.0); //reset data using bounding box coords
            C1.data("curr_cy", c1bboxy + c1bboxh / 2.0);

            var c2bboxx = C2.getBBox().x;
            var c2bboxy = C2.getBBox().y;
            var c2bboxw = C2.getBBox().width;
            var c2bboxh = C2.getBBox().height;
            C2.data("curr_cx", c2bboxx + c2bboxw / 2.0); //reset data using bounding box coords
            C2.data("curr_cy", c2bboxy + c2bboxh / 2.0);

            if (elt.data("type") == "ellipse") {
                elt.data("currx", elt.attr("cx") - elt.attr("rx"));
                elt.data("curry", elt.attr("cy") - elt.attr("ry"));
                elt.data("curr_rx", elt.attr("rx"));
                elt.data("curr_ry", elt.attr("ry"));
            }
            else if (elt.data("type") == "rect") {
                elt.data("currx", elt.attr("x"));
                elt.data("curry", elt.attr("y"));
            }

            var bboxx = elt.getBBox().x;
            var bboxy = elt.getBBox().y;
            var bboxw = elt.getBBox().width;
            var bboxh = elt.getBBox().height;

            var dcbboxx = DC.getBBox().x;
            var dcbboxy = DC.getBBox().y;
            var dcbboxw = DC.getBBox().width;
            var dcbboxh = DC.getBBox().height;

            var ox = origposition.x;
            var oy = origposition.y;
            var ow = origposition.w;
            var oh = origposition.h;

            var o1x = c1origposition.x;
            var o1y = c1origposition.y;
            var o1w = c1origposition.w;
            var o1h = c1origposition.h;

            var o2x = c2origposition.x;
            var o2y = c2origposition.y;
            var o2w = c2origposition.w;
            var o2h = c2origposition.h;

            var odcx = dcorigposition.x;
            var odcy = dcorigposition.y;
            var odcw = dcorigposition.w;
            var odch = dcorigposition.h;

            // log command
            var command = LADS.TourAuthoring.Command({
                execute: function () {
                    console.log("bbox in execute: {" + bboxx + "," + bboxy + "," + bboxw + "," + bboxh + "}");
                    elt.data("currx", bboxx);
                    elt.data("curry", bboxy);
                    elt.data("currw", bboxw);
                    elt.data("currh", bboxh);
                    elt.data("curr_rx", bboxw / 2.0);
                    elt.data("curr_ry", bboxh / 2.0);
                    elt.attr({
                        cx: bboxx + bboxw / 2.0,
                        cy: bboxy + bboxh / 2.0,
                        rx: bboxw / 2.0,
                        ry: bboxh / 2.0,
                        x: bboxx,
                        y: bboxy,
                        width: bboxw,
                        height: bboxh,
                    });

                    C1.data("curr_cx", c1bboxx + c1bboxw / 2.0);
                    C1.data("curr_cy", c1bboxy + c1bboxh / 2.0);
                    C1.attr({
                        cx: c1bboxx + c1bboxw / 2.0,
                        cy: c1bboxy + c1bboxh / 2.0,
                        rx: c1bboxw / 2.0,
                        ry: c1bboxh / 2.0,
                    });
                    C2.data("curr_cx", c2bboxx + c2bboxw / 2.0);
                    C2.data("curr_cy", c2bboxy + c2bboxh / 2.0);
                    C2.attr({
                        cx: c2bboxx + c2bboxw / 2.0,
                        cy: c2bboxy + c2bboxh / 2.0,
                        rx: c2bboxw / 2.0,
                        ry: c2bboxh / 2.0,
                    });
                    DC.data("curr_cx", dcbboxx + dcbboxw / 2.0);
                    DC.data("curr_cy", dcbboxy + dcbboxh / 2.0);
                    DC.attr({
                        cx: dcbboxx + dcbboxw / 2.0,
                        cy: dcbboxy + dcbboxh / 2.0,
                        rx: dcbboxw / 2.0,
                        ry: dcbboxh / 2.0,
                    });
                },
                unexecute: function () {
                    console.log("origposition in unexecute: {" + ox + "," + oy + "," + ow + "," + oh + "}");
                    elt.data("currx", ox);
                    elt.data("curry", oy);
                    elt.data("currw", ow);
                    elt.data("currh", oh);
                    elt.data("curr_rx", ow / 2.0);
                    elt.data("curr_ry", oh / 2.0);

                    elt.attr({
                        cx: ox + ow / 2.0,
                        cy: oy + oh / 2.0,
                        rx: ow / 2.0,
                        ry: oh / 2.0,
                        x: ox,
                        y: oy,
                        width: ow,
                        height: oh,
                    });

                    C1.data("curr_cx", o1x + o1w / 2.0);
                    C1.data("curr_cy", o1y + o1h / 2.0);
                    C1.attr({
                        cx: o1x + o1w / 2.0,
                        cy: o1y + o1h / 2.0,
                    });

                    C2.data("curr_cx", o2x + o2w / 2.0);
                    C2.data("curr_cy", o2y + o2h / 2.0);
                    C2.attr({
                        cx: o2x + o2w / 2.0,
                        cy: o2y + o2h / 2.0,
                    });

                    DC.data("curr_cx", odcx + odcw / 2.0);
                    DC.data("curr_cy", odcy + odch / 2.0);
                    DC.attr({
                        cx: odcx + odcw / 2.0,
                        cy: odcy + odch / 2.0,
                    });
                }
            });
            command.execute();
            inkUndoManager.logCommand(command);
        });

        //shape deletion functionality
        DC.mousedown(function () {
            var dccommand = LADS.TourAuthoring.Command({
                execute: function () {
                    elt.hide();
                    C1.hide();
                    C2.hide();
                    DC.hide();
                    elt.data("visible", "no");
                },
                unexecute: function () {
                    elt.show();
                    C1.show();
                    C2.show();
                    DC.show();
                    elt.data("visible", "yes");
                }
            });
            dccommand.execute();
            inkUndoManager.logCommand(dccommand);
        });
    }
    that.add_attributes = add_attributes;
    ///

    function getInkUndoManager() {
        return inkUndoManager;
    }
    that.getInkUndoManager = getInkUndoManager;

    ///

    /**
     * Add an ellipse to the Raphael canvas. Called by the "Add Ellipse" button in isolate/block ink mode
     * @param cx, cy    the coordinates of the center of the ellipse
     * @param rx, ry    the radii of the ellipse
     */
    function add_ellipse(cx, cy, rx, ry) {
        var ellipse;
        set_mode(LADS.TourAuthoring.InkMode.shapes);
        console.log("setting cx and cy for the ellipse");
        if (cx === undefined)
            cx = 100 + Math.random() * 10;
        if (cy === undefined)
            cy = 100 + Math.random() * 10;
        if (rx === undefined)
            rx = 50;
        if (ry === undefined)
            ry = 50;
        ellipse = paper.ellipse(cx, cy, rx, ry); // draw to the canvas
        ellipse.data("currx", ellipse.getBBox().x); // add data to be used by add_attributes
        ellipse.data("curry", ellipse.getBBox().y);
        ellipse.data("curr_rx", rx);
        ellipse.data("curr_ry", ry);
        ellipse.data("type", "ellipse");
        add_attributes(ellipse);
    }
    that.add_ellipse = add_ellipse;

    /**
     * DEPRECATED
     * Used to give style and drag functionality to old marquees (such as is currently in the Final
     * Garibaldi Demo). Once all old marquees have been deleted from tours, this method can be tossed.
     */
    function add_marq_attributes(marq, marqFillColor, marqFillOpacity) {
        /**
            * analogous to add_attributes(...), but for marquees. The difference is that a marquee
            * is a collection of five rectangles, and the center rectangle is the only one that gets
            * the drag handler, while the others have the color attributes.
            */
        var elt = marq.rc;
        var gl;
        var resize = 0; //if 1, we are in zoom mode rather than pan mode
        var noglow = 0; //if 1, glowing is disabled
        var origmousex;
        var origmousey;
        var w = domelement.width();
        var h = domelement.height();
        //console.log("w=" + w + ", h=" + h);
        if (marqFillColor === undefined)
            marqFillColor = marqueeFillColor;////////FIX "#" + document.getElementById("marq_color").value;
        if (marqFillOpacity === undefined)
            marqFillOpacity = marqueeFillOpacity;/////FIX document.getElementById("marq_opacity").value;

        elt.mouseover(function () {
            if (!noglow && (mode == 3)) {
                gl = elt.glow({ "width": 10, "color": "#33ff00", "opacity": 0.8 });
            }
        });
        elt.mouseout(function () {
            if (mode == 3)
                gl.remove();
        });
        elt.attr({
            "stroke-width": 0,
            "stroke": "#222222",
            "fill": "#ffffff",
            "fill-opacity": 0
        });
        elt.data("surr-fill", marqFillColor);
        elt.data("surr-opac", marqFillOpacity);
        var mset = paper.set();
        mset.push(marq.rn, marq.re, marq.rs, marq.rw);
        mset.attr({
            "stroke-width": 0,
            "stroke": "#222222",
            "fill": marqFillColor,
            "fill-opacity": marqFillOpacity
        });

        //drag(move, start, stop,...)
        elt.drag(function (dx, dy, mousex, mousey) {
            //onmove
            if (mode == 3) {
                this.toFront();
                var bbox = this.getBBox();
                if (!resize) {
                    //drag an marquee -- need to update all relevant rectangles
                    var currx = parseInt(this.data("currx"),10);//x position at the start of drag
                    var curry = parseInt(this.data("curry"),10);
                    var xpos = currx + dx; //to get new x position, just add dx
                    var ypos = curry + dy;
                    this.attr({
                        x: xpos,
                        y: ypos
                    });
                    marq.rn.attr({
                        height: ypos
                    });
                    marq.re.attr({
                        x: xpos + bbox.width,
                        y: ypos,
                        width: w - (xpos + bbox.width),
                        height: bbox.height
                    });
                    marq.rs.attr({
                        y: ypos + bbox.height,
                        height: h - (ypos + bbox.height)
                    });
                    marq.rw.attr({
                        y: ypos,
                        width: xpos,
                        height: bbox.height
                    });

                }
                else {
                    //resize a marquee -- need to update all relevant rectangles
                    this.attr({
                        width: bbox.width + mousex - origmousex,
                        height: bbox.height + mousey - origmousey
                    });
                    marq.rs.attr({
                        y: bbox.y + bbox.height + mousey - origmousey,
                        height: h - (bbox.y + bbox.height + mousey - origmousey)
                    });
                    marq.re.attr({
                        x: bbox.x + bbox.width + mousex - origmousex,
                        width: w - (bbox.x + bbox.width + mousex - origmousex),
                        height: bbox.height + mousey - origmousey
                    });
                    marq.rw.attr({
                        height: bbox.height + mousey - origmousey
                    });
                }
                console.log("this.attr.x = " + this.attr("x") + ", y = " + this.attr("y"));
                console.log(update_datastring());
                origmousex = mousex;
                origmousey = mousey;
            }
        }, function (x, y) {
            //onstart
            if (mode == 3) {
                origmousex = x;
                origmousey = y;
                var bbox = this.getBBox();
                console.log("diff = " + (x - bbox.x));
                var offset_x = parseFloat(domelement.css("left"));
                var offset_y = parseFloat(domelement.css("top"));
                if ((arguments[2].offsetX > (bbox.x + bbox.width * 0.5)) && (arguments[2].offsetY > (bbox.y + bbox.height * 0.5))) {
                    resize = 1;
                }
                gl.remove();
                noglow = 1;
                this.animate({ opacity: 0.25 }, 500, "<>");
            }
        }, function () {
            //onstop
            if (mode == 3) {
                this.data("currx", this.getBBox().x); //reset data using bounding box coords
                this.data("curry", this.getBBox().y);
                marq.re.data("currx", this.getBBox().x + this.getBBox().width);
                marq.rs.data("curry", this.getBBox().y + this.getBBox().height);
                resize = 0;
                this.animate({ opacity: 1 }, 500, "<>");
                noglow = 0;
            }
        });
    }
    that.add_marq_attributes = add_marq_attributes;

    /**
     * Add a rectangle to the Raphael canvas. Called by the "Add Rectangle" button in isolate/block ink mode
     * @param x, y    the coordinates of the top left corner of the rectangle
     */
    function add_rectangle(x, y) {
        var rect;
        set_mode(LADS.TourAuthoring.InkMode.shapes);
        if (x === undefined)
            x = 200 + Math.random() * 10;
        if (y === undefined)
            y = 200 + Math.random() * 10;
        rect = paper.rect(x, y, 100, 100); // draw to the Raphael canvas
        rect.data("currx", x); // set data to be used by add_attributes
        rect.data("curry", y);
        rect.data("currw", 100);
        rect.data("currh", 100);
        rect.data("type", "rect");
        add_attributes(rect);
    }
    that.add_rectangle = add_rectangle;

    
    function getSVGText(){
        return svgText;
    }
    that.getSVGText = getSVGText;

    /** ((DAN Z))
     * Add a text box (a textarea html element) for creating text inks.
     * @param x, y     coordinates of the text box (absolute)
     * @param str      any text that should be loaded into the text box (i.e. for editing inks)
     */
    function add_text_box(x, y, w, h, str, textmag, size) {
        x = x || 75;
        y = y || 75;
        str = str || "Your text here";

        svgText = paper.text(x, y, str);
        svgText.data({
            type: "text",
            str: str,
        });
        svgText.attr({
            'alignment-baseline': 'before-edge',
            "text-anchor": "start",
        });
        set_mode(LADS.TourAuthoring.InkMode.text);

        //// style the textbox
        //textbox.attr('wrap', 'off'); //force people to do their own line breaks
        svgText.attr({
            'font-family': fontFamily,
            'font-size': fontSize,
            'fill': fontColor,
        });
        svgText.attr("text", str);
        svgText.data({
            'font': fontFamily,
            'fontsize': fontSize,
            'color': fontColor,
        });
        if (textmag) {
            var newFontSize;
            if (size) {
                newFontSize = size;
            } else {
                newFontSize = rel_dims(svgText.data("fontsize"), domelement.height()) * domelement.height();
            }
            svgText.attr({
                'font-size': newFontSize,
            });
            svgText.data({
                'fontsize': newFontSize,
            });
        }
        setTextAttributes(svgText);

        //// set up undo/redo commands for typing
        //textbox.on("keyup", function (evt) { //use onpropertychange
        //    var code = evt.keyCode;
        //    if (code != 37 && code != 38 && code != 39 && code != 40) { // exclude arrow keys
        //        var currText = $("#" + textboxid).attr('value');
        //        var oldText = lastText;
        //        var command = LADS.TourAuthoring.Command({
        //            execute: function () {
        //                $("#" + textboxid).attr('value', currText);
        //            },
        //            unexecute: function () {
        //                $("#" + textboxid).attr('value', oldText);
        //            }
        //        });
        //        inkUndoManager.logCommand(command);
        //        lastText = $("#" + textboxid).attr("value");
        //    }
        //});

        //setTextAttributes($("#" + textboxid)); // set up drag functionality and drag handlers

        //textbox.scrollTop(0);
        //textbox.scrollLeft(0);
    }
    that.add_text_box = add_text_box;

    /** ((BEN L))
     * Pans and resizes all inks to move with the artwork. Uses the initial keyframe of the artwork (converted here to absolute coordinates) and the
     * inputted dimensions to compute deltas and scale factors. Once we have these, first pan to (0,0), then scale, then pan to pos+deltas.
     * @param dims   the current dimensions of our artwork in absolute coordinates
     */
    function adjustViewBox (dims, no_opac_check) {
        var new_px = dims.x,
            new_py = dims.y,
            new_pw = dims.width,
            new_ph = dims.height,
            real_kfw, real_kfh, real_kfx, real_kfy;
        // convert weird deeepzoom keyframe coordinates to absolute coordinates
        real_kfw = origPaperW / initKeyframe.w; // deepzoom keyframe width is what we multiply the absolute width of art by to get width of viewer
        real_kfh = real_kfw * (new_ph / new_pw); // deepzoom keyframe height is kind of confusing, so use width * (1 / aspect_ratio of art)
        real_kfx = -initKeyframe.x * real_kfw; // deepzoom keyframe x times absolute width of art is what we must translate art by to reach the left of viewer
        real_kfy = -initKeyframe.y * real_kfw; // (WEIRD -- seems to place too high if use -kfy * real_kfh)
        
        // if the new position is not trivially different from the old position, pan and zoom
        if (nontrivial({ x: new_px, y: new_py, w: new_pw, h: new_ph }, { x: lastpx, y: lastpy, w: lastpw, h: lastph })) {
            //var eid_elt = $("[ES_ID='" + EID + "']");
            var lambda_w = origPaperW / real_kfw;
            var lambda_h = origPaperH / real_kfh;
            var nvw = new_pw * lambda_w; // nv*: dimensions of the new virtual canvas (where the ink canvas would be if we were panning and zooming it with the artwork)
            var nvh = new_ph * lambda_h;
            var nvx = (nvw / origPaperW) * (origPaperX - real_kfx) + new_px;
            var nvy = (nvh / origPaperH) * (origPaperY - real_kfy) + new_py;

            var SW = nvw / lastcw; // scale factor in x direction
            // var SH = nvh / lastch; // scale factor in y direction (in case we ever have non-aspect-ratio-preserving scaling)

            oldScale = new_pw / origpw;
            // oldScaleH = new_ph / origph; // in case we ever have non-aspect-ratio-preserving scaling

            if (!transCoords.length || trans_mode === 'block') { // for all ink types except isolates (can't just resize the window for them)
                var newwid = origPaperW / oldScale;
                var newhei = origPaperH / oldScale;
                paper.setViewBox(-nvx / oldScale, -nvy / oldScale, newwid, newhei); // see raphael documentation
            }
            else {
                var cw = domelement.width();
                var ch = domelement.height();
                magX = cw;
                magY = ch;
                panObjects(-lastcx / origPaperW, -lastcy / origPaperH, { cw: cw, ch: ch }, 0); // no need to draw updated ink yet
                resizeObjects(SW, SW); // still no need, since we still have to pan
                panObjects(nvx / origPaperW, nvy / origPaperH, { cw: cw, ch: ch }, 1);
            }

            // reset coordinates
            lastcx = nvx;
            lastcy = nvy;
            lastcw = nvw;
            lastch = nvh;
            lastpx = new_px;
            lastpy = new_py;
            lastpw = new_pw;
            lastph = new_ph;
        }
    }
    that.adjustViewBox = adjustViewBox;

    /** ((BEN L))
     * Pans and resizes the ink canvas to move with the artwork. Uses the initial keyframe of the artwork (converted here to absolute coordinates) and the
     * inputted dimensions to compute deltas and scale factors. Once we have these, first pan to (0,0), then scale, then pan to pos+deltas.
     * @param dims   the current dimensions of our artwork in absolute coordinates
     */
    function adjustViewBoxDiv(dims, no_opac_check) {
        var new_px = dims.x,
            new_py = dims.y,
            new_pw = dims.width,
            new_ph = dims.height,
            real_kfw, real_kfh, real_kfx, real_kfy;
        try {
            // convert weird deeepzoom keyframe coordinates to absolute coordinates
            real_kfw = origPaperW / initKeyframe.w; // deepzoom keyframe width is what we multiply the absolute width of art by to get width of viewer
            real_kfh = real_kfw * (new_ph / new_pw); // deepzoom keyframe height is kind of confusing, so use width * (1 / aspect_ratio of art)
            real_kfx = -initKeyframe.x * real_kfw; // deepzoom keyframe x times absolute width of art is what we must translate art by to reach the left of viewer
            real_kfy = -initKeyframe.y * real_kfw; // (WEIRD -- seems to place too high if use -kfy * real_kfh)
        }
        catch (err) {
            console.log("ERROR in adjustViewBox: " + err);
            real_kfx = origpx;
            real_kfy = origpy;
            real_kfw = origpw;
            real_kfh = origph;
        }

        // oldOpac tracks when the ink is actually on screen (the opacity of the ink track is 0 when the playhead is not in a display)
        if (oldOpac === 0) {
            self.origpx = new_px;
            self.origpy = new_py;
            self.origpw = new_pw;
            self.origph = new_ph;
        }

        // if the new position is not trivially different from the old position, pan and zoom
        if (nontrivial({ x: new_px, y: new_py, w: new_pw, h: new_ph }, { x: lastpx, y: lastpy, w: lastpw, h: lastph })) {
            var eid_elt = $("[ES_ID='" + EID + "']");
            var lambda_w = origPaperW / real_kfw;
            var lambda_h = origPaperH / real_kfh;
            var nvw = new_pw * lambda_w; // new dimensions of the virtual canvas
            var nvh = new_ph * lambda_h;
            var nvx = (nvw / origPaperW) * (origPaperX - real_kfx) + new_px;
            var nvy = (nvh / origPaperH) * (origPaperY - real_kfy) + new_py;

            var SW = nvw / lastcw; // scale factor in x direction
            var SH = nvh / lastch; // scale factor in y direction (in case we ever have non-aspect-ratio-preserving scaling)

            var cw = domelement.width();
            var ch = domelement.height();

            // translate to (0,0), scale by (SW,SH), translate to (nvx,nvy)
            // in panning, we divide by the width of the paper because all coordinates are in [0,1]
            panObjects(-lastcx / origPaperW, -lastcy / origPaperH, { cw: cw, ch: ch }, 0); // no need to draw updated ink yet
            resizeObjects(SW, SH); // still no need, since we still have to pan
            panObjects(nvx / origPaperW, nvy / origPaperH, { cw: cw, ch: ch }, 1);//no_opac_check || parseFloat(eid_elt[0].style.opacity));
            //if (true || parseFloat(eid_elt[0].style.opacity)) { // only draw if the ink is on screen or if we're on the initial load
            //    panObjects(nvx / origPaperW, nvy / origPaperH);
            //    console.log("DRAWING");
            //}
            //else {
            //    panObjects(nvx / origPaperW, nvy / origPaperH, 'do not draw');
            //    console.log("NOT DRAWING");
            //}

            // reset coordinates
            lastcx = nvx;
            lastcy = nvy;
            lastcw = nvw;
            lastch = nvh;
            lastpx = new_px;
            lastpy = new_py;
            lastpw = new_pw;
            lastph = new_ph;

            var new_opac;
            try {
                new_opac = parseInt(no_opac_check || eid_elt[0].style.opacity,10);
            }
            catch (err) {
                console.log("error in adjustViewBox: " + err);
            }
            oldOpac = new_opac;
        }
    }
    that.adjustViewBoxDiv = adjustViewBoxDiv;

    /**
     * Convert a string representing a block transparency to one representing an isolate transparency.
     * Block/isolate is determined by the fill property of the svg element. If we draw the path counterclockwise (rather than clockwise)
     * and also draw a path around the whole canvas, the in-between space will be filled and we will get an isolate transparency. This
     * method reverses the given path and adds the aforementioned outer path.
     * @param pth    the path to reverse
     * @return    reversed path (with outer path)
     */
    function block_to_isol(pth) {
        var new_pth = "";
        var segs = [""];
        var parsed_pth = Raphael.parsePathString(pth);
        var num_array = [];
        var mstart = 0;
        var ctr = 0;
        var cw = viewerElt.width();
        var ch = viewerElt.height();
        var j;

        // iterate through in reverse order
        for (var i = parsed_pth.length - 2; i >= 0; i--) {
            if (parsed_pth[i][0] == "z") {
                new_pth += "M" + num_array[0] + "," + num_array[1];
                for (j = 2; j < num_array.length; j++) {
                    new_pth += ((j % 6 == 2) ? ("C" + num_array[j]) : (num_array[j]));
                    new_pth += ((j % 6 != 1) ? (",") : "");
                }
                new_pth += "z";
                num_array.length = 0;
                num_array = []; // every time we hit a close-path command ('z'), restart num_array for new path
            }
            else if (parsed_pth[i][0] == "M") {
                num_array.push(parsed_pth[i][1]);
                num_array.push(parsed_pth[i][2]);
            }
            else {
                num_array.push(parsed_pth[i][5]);
                num_array.push(parsed_pth[i][6]);
                num_array.push(parsed_pth[i][3]);
                num_array.push(parsed_pth[i][4]);
                num_array.push(parsed_pth[i][1]);
                num_array.push(parsed_pth[i][2]);
            }
        }

        // manually add the last path, since there is no 'z' at the start of our pathstring
        new_pth += "M" + num_array[0] + "," + num_array[1];
        for (j = 2; j < num_array.length; j++) {
            new_pth += ((j % 6 == 2) ? ("C" + num_array[j]) : (num_array[j]));
            new_pth += ((j % 6 != 1) ? (",") : "");
        }
        new_pth += "z";
        new_pth += "M-5,-5L" + (cw + 5) + ",-5L" + (cw + 5) + "," + (ch + 5) + "L-5," + (ch + 5) + "L-5,-5z"; // outer path
        return new_pth;
    }
    that.block_to_isol = block_to_isol;

    /**
     * Construct the path that models the overlap between new_path and existing_path in the appropriate
     * transparency mode. For example, if the paths are intersecting circles, const_path_alg returns the
     * outline of the two; if one path is completely inside the other, the inner one is returned in isolate
     * mode and the outer is returned in block mode. Both input paths are closed (have a trailing 'z').
     * @param new_path        one path
     * @param existing_path   another path (in the scheme of things, we are building this path up by adding new_paths)
     */
    function const_path_alg(new_path, existing_path) {
        // array of points in the order they are added, format: {point: {x: __, y: __}, type: 'endpoint'/'intpoint', path: 0/1}  (0 if on new_path, 1 if on existing_path)
        var order_added = [];
        var i, j, pth_seg, next_seg, pth_seg_len;

        var first_point_added = 0;
        if (existing_path === "") // if the existing path is empty, new path should replace it
            return new_path;

        // get array of vertices for the new path
        var parsed_new_path = Raphael.parsePathString(new_path);
        for (i = 0; i < parsed_new_path.length; i++) {
            if (parsed_new_path[i][0] == "z") {
                parsed_new_path.splice(i, 1); // don't want the trailing 'z's
                i--;
            }
        }

        // get array of vertices for the old path
        var parsed_old_path = Raphael.parsePathString(existing_path);
        var old_nz = 0;
        for (i = 0; i < parsed_old_path.length; i++) {
            if (parsed_old_path[i][0] == "z") {
                parsed_old_path.splice(i, 1); // don't want the trailing 'z's
                i--;
                old_nz++;
            }
        }

        // get array of startpoints for the new path, including bezier coordinates out of the point (ax1, ay1) and into the next point (ax2, ay2)
        var new_path_startpoints = [];
        for (i = 0; i < parsed_new_path.length - 1; i++) {
            pth_seg = parsed_new_path[i];
            next_seg = parsed_new_path[(i + 1) % parsed_new_path.length];
            pth_seg_len = pth_seg.length;
            new_path_startpoints.push({ x: pth_seg[pth_seg_len - 2], y: pth_seg[pth_seg_len - 1], ax1: next_seg[1], ay1: next_seg[2], ax2: next_seg[3], ay2: next_seg[4] });
        }

        // get array of endpoints for the oldpath, including bezier coordinates as above
        var old_path_endpoints = [];
        for (i = 0; i < parsed_old_path.length - 1; i++) {
            pth_seg = parsed_old_path[(i + 1) % parsed_old_path.length];
            var ind2 = ((i + 2) % parsed_old_path.length !== 0) ? ((i + 2) % parsed_old_path.length) : 1;
            next_seg = parsed_old_path[ind2];
            pth_seg_len = pth_seg.length;
            old_path_endpoints.push({ x: pth_seg[pth_seg_len - 2], y: pth_seg[pth_seg_len - 1], ax1: next_seg[1], ay1: next_seg[2], ax2: next_seg[3], ay2: next_seg[4] });
        }

        // see if any of our endpoints are the same or are colinear; if they are, perturb one by a slight amount
        var perturbed = 0;
        for (i = 0; i < new_path_startpoints.length; i++) {
            for (j = 0; j < old_path_endpoints.length; j++) {
                if (same_point(new_path_startpoints[i], old_path_endpoints[j])) {
                    new_path_startpoints[i].x += 1;
                    new_path_startpoints[i].y += 1;
                    new_path_startpoints[i].ax1 += 1;
                    new_path_startpoints[i].ay1 += 1;
                    new_path_startpoints[i].ax2 += 1;
                    new_path_startpoints[i].ay2 += 1;
                    perturbed = 1;
                    break;
                }
            }
        }

        // if we perturbed any points above, we need to reset the string in new_path and reparse to get parsed_new_path
        if (perturbed) {
            new_path = "M" + new_path_startpoints[0].x + "," + new_path_startpoints[0].y;
            var nps;
            for (i = 1; i < new_path_startpoints.length; i++) {
                nps = new_path_startpoints[i];
                var prev = new_path_startpoints[i - 1];
                new_path += "C" + prev.ax1 + "," + prev.ay1 + "," + prev.ax2 + "," + prev.ay2 + "," + nps.x + "," + nps.y;
            }
            new_path += "C" + nps.ax1 + "," + nps.ay1 + "," + nps.ax2 + "," + nps.ay2 + "," + new_path_startpoints[0].x + "," + new_path_startpoints[0].y;
            new_path += "z";
            parsed_new_path = Raphael.parsePathString(new_path);
            for (i = 0; i < parsed_new_path.length; i++) {
                if (parsed_new_path[i][0] == "z") {
                    parsed_new_path.splice(i, 1);
                    i--;
                }
            }
        }

        // get the array of intersection points of the two paths
        var ints = Raphael.pathIntersection(new_path, existing_path);
        var seg_ints = [[], [], [], []]; // for intersections along each segment of the new path (4 segments)
        for (i = 0; i < ints.length; i++)
            seg_ints[ints[i].segment1 - 1].push(ints[i]); // segments are 1-indexed

        // sort each segment's intersections in order of increasing t-value (i.e. distance along the segment)
        function sortHelperT1(a, b) { return a.t1 - b.t1; }
        for (i = 0; i < seg_ints.length; i++)
            seg_ints[i].sort(sortHelperT1); // sort by t-value (t1 is the t-value of the int on the new path)


        var old_seg_ints = []; // for intersections along each segment of the old path
        for (i = 0; i < parsed_old_path.length - old_nz; i++)
            old_seg_ints.push([]);

        for (i = 0; i < ints.length; i++)
            old_seg_ints[ints[i].segment2 - 1].push(ints[i]);

        // sort each segment's intersections in order of increasing t2-value (maybe unnecessary)
        function sortHelperT2(a, b) { return a.t2 - b.t2; }
        for (i = 0; i < old_seg_ints.length; i++) {
            old_seg_ints[i].sort(sortHelperT2);
        }

        var outer_path = "";

        if (ints.length === 0) //if no intersections, the paths are disjoint and one may be contained in the other
        {
            if (point_inside(new_path, old_path_endpoints[0].x, old_path_endpoints[0].y))
                return ((trans_mode === 'isolate') ? existing_path : new_path); // existing_path is inside new_path
            if (point_inside(existing_path, new_path_startpoints[0].x, new_path_startpoints[1].y))
                return ((trans_mode === 'isolate') ? new_path : existing_path); // new_path is inside existing_path
            return new_path + existing_path; // paths are disjoint and neither is inside the other
        }

        // iterate through the segments of new_path
        // for each segment, add the start point if it is outside existing_path, add each intersection point, and after adding intersection points, check to see if we should add any endpoints of existing_path
        for (i = 0; i < seg_ints.length; i++) {
            // add start point if outside existing_path
            if (!point_inside(existing_path, new_path_startpoints[i].x, new_path_startpoints[i].y) && !repeat_pt(new_path_startpoints[i], order_added)) {
                if (i === 0)
                    first_point_added = 1;
                order_added.push({ point: new_path_startpoints[i], type: "endpoint", path: 0 }); // add point to order_added if it should be in the final path
            }
            var curr_ints = seg_ints[i]; // array of intersection points on the current segment of new_path
            for (j = 0; j < curr_ints.length; j++) {
                if (!repeat_pt(curr_ints[j], order_added)) {
                    // need to find which curve the previously added point is from in order to get the right bezier coordinates
                    order_added.push({ point: curr_ints[j], type: "intpoint", path: ((order_added.length) ? (order_added[order_added.length - 1].type) : 0) });
                }
                var old_seg_num = curr_ints[j].segment2 - 1; // index of int point in old_seg_ints
                var k = old_seg_num;
                var index = k;

                // iterate through old path endpoints, adding them if they are outside new_path, stopping when we hit a repeat or a point inside new_path
                while (!point_inside(new_path, old_path_endpoints[index].x, old_path_endpoints[index].y) && !repeat_pt(old_path_endpoints, order_added)) {
                    var pt1 = old_path_endpoints[index];
                    var test1 = 1;
                    var test2 = 1;
                    if (index == old_seg_num) { // still on segment of existing_path that the original intersection point was on
                        // check here if there is another intersection point farther along the current segment in the existing path (so we shouldn't add the next endpoint of existing_path)
                        for (var l = 0; l < old_seg_ints[index].length; l++) {
                            if (old_seg_ints[index][l].t2 > curr_ints[j].t2) {
                                test1 = 0;
                                break;
                            }
                        }
                    }
                    else {
                        // otherwise, we just want to make sure that there are no intersection points along the segment whose endpoint is pt1
                        if (old_seg_ints[index].length > 0)
                            test2 = 0;
                    }
                    if (!test1 || !test2 || repeat_pt(pt1, order_added))
                        break;

                    // if we're here, we should add the endpoint pt1 to order_added (with path: 1, since it's on the old path)
                    order_added.push({ point: old_path_endpoints[index], type: "endpoint", path: 1 });
                    k++;
                    index = k % (old_seg_ints.length); // wrap around to first point if necessary
                }
            }
        }
        if (!point_inside(existing_path, new_path_startpoints[0].x, new_path_startpoints[0].y)) {
            order_added.push({ point: new_path_startpoints[0], type: "endpoint", path: 0 }); // if first startpoint is outside existing_path, add it again to close the path
        }
        if (!same_point(order_added[order_added.length - 1].point, order_added[0].point)) {
            order_added.push(order_added[0]); // close path if need be
        }

        // build up outer_path using order_added
        var final_list = [];
        var pt;
        for (i = 0; i < order_added.length - 1; i++) {
            pt = order_added[i];
            var next = order_added[(i + 1) % order_added.length];
            var ob = out_bez(pt, next);
            var ib = next_in_bez(pt, next);
            final_list.push({ ax1: ob.x, ay1: ob.y, ax2: ib.x, ay2: ib.y, x: next.point.x, y: next.point.y }); // push each point along with outgoing bezier coordinates (and incoming for the next point)
        }

        // take points in final_list and build the path string
        outer_path = "M" + final_list[final_list.length - 1].x + "," + final_list[final_list.length - 1].y;
        for (i = 0; i < final_list.length; i++) {
            pt = final_list[i];
            outer_path += "C" + pt.ax1 + "," + pt.ay1 + "," + pt.ax2 + "," + pt.ay2 + "," + pt.x + "," + pt.y;
        }
        outer_path += "z";
        return outer_path;
    }
    that.const_path_alg = const_path_alg;

    /**
     * Uses the arrays ml, xy, and pa to draw paths with the correct properties.
     * First clears the canvas of existing paths, then draws new ones.
     */
    function drawPaths() {
        var cw = viewerElt.width();
        var ch = viewerElt.height();
        var paths = "";
        var cpaths = "";
        var i;
        var len = pathObjects.length;
        for (i = 0; i < len; i++) { //removes paths from canvas
            pathObjects[i].remove();
        }
        pathObjects.length = 0;
        for (i = 0; i < ml.length; i++) { //construct the paths
            if (ml[i] === 'M') {
                paths += "PATH::[pathstring]"; // the paths to be drawn now
                cpaths += "PATH::[pathstring]"; // the paths we will save for our datastring (in relative coordinates)
            }
            paths += ml[i] + (cw * xy[i][0]) + ',' + (ch * xy[i][1]); // absolute coords
            cpaths += ml[i] + (xy[i][0]) + ',' + (xy[i][1]); // relative coords
            if (ml[i + 1] != 'L') {
                // if we're here, we've reached the end of a path, so add style information to the path strings
                paths += "[stroke]" + pa[i].color + "[strokeo]" + pa[i].opacity + "[strokew]" + (ch * pa[i].width) + "[]|";
                cpaths += "[stroke]" + pa[i].color + "[strokeo]" + pa[i].opacity + "[strokew]" + pa[i].width + "[]|";
            }
        }
        var path = [];
        if (paths.length > 0) {
            path = paths.split('PATH::');
        }
        for (i = 1; i < path.length; i++) {
            var pstring = get_attr(path[i], "pathstring", "s");
            var strokec = get_attr(path[i], "stroke", "s");
            var strokeo = get_attr(path[i], "strokeo", "f");
            var strokew = get_attr(path[i], "strokew", "f");
            var drawing = paper.path(pstring); // draw the path to the canvas
            drawing.data("type", "path");
            drawing.attr({
                "stroke-width": strokew,
                "stroke-opacity": strokeo,
                "stroke": strokec,
                "stroke-linejoin": "round",
                "stroke-linecap": "round"
            });
            pathObjects.push(drawing);
        }
        currpaths = cpaths; // currpaths is used in update_datastring as the string representing all paths on the canvas
        //update_datastring();
    }
    that.drawPaths = drawPaths;

    /**
     * A helper function to draw transparencies. Takes the arrays transLetters (representing the
     * svg path commands in the transparency string) and transCoords (corresponding locations on the
     * canvas in relative coordinates) and draws the appropriate type of transparency to the canvas.
     * If the type is 'isolate,' calls block_to_isol, which reverses the path and adds an outer path
     * around the canvas to fill the in-between space.
     */
    function drawTrans() {
        remove_all(); // be careful that this method isn't called unless the type of the ink is 'trans'!
        var cw = domelement.width();
        var ch = domelement.height();
        var path = "";
        var ind = 0;
        // iterate through the transLetters array and create our svg path accordingly
        for (var i = 0; i < transLetters.length; i++) {
            if (transLetters[i] == "M" || transLetters[i] == "L") { // if M or L, add next two coords to the path
                path += transLetters[i] + (transCoords[ind] * cw) + "," + (transCoords[ind + 1] * ch);
                ind += 2;
            }
            else if (transLetters[i] == "C") {
                path += "C" + (transCoords[ind] * cw);
                for (var k = 1; k < 6; k++) { // if C, add next six coords to the path (coords represent bezier curve)
                    path += "," + ((k % 2) ? (transCoords[ind + k] * ch) : (transCoords[ind + k] * cw));
                }
                ind += 6;
            }
            else if (transLetters[i] == "z") // if z, close the path
                path += "z";
            else
                console.log("ELSE: " + transLetters[i]);
        }
        var final_path = path;
        if (trans_mode == 'isolate') // if the mode is 'isolate,' reverse the path and add an outer path
            final_path = block_to_isol(path);
        var trans = paper.path(final_path).attr({ "fill": marqueeFillColor, "fill-opacity": marqueeFillOpacity, "stroke-width": 0 }).data("type", "trans");
        trans_currpath = "TRANS::[path]" + path + "[color]" + marqueeFillColor + "[opac]" + marqueeFillOpacity + "[mode]" + trans_mode + "[]";
        update_datastring();
    }
    that.drawTrans = drawTrans;

    /**
     * Called if we drag on the ink canvas in eraser mode. Finds endpoints in the current paths close
     * to the drag event location and splices them out of the path array.
     * @param location   the locaton of the drag event
     */
    function erase(location) {
        var cw = domelement.width();
        var ch = domelement.height();
        var range = eraserWidth;
        for (var i = 0; i < xy.length; i++) { // for each coordinate, test for proximity to location
            if (location[0] - range <= (cw * xy[i][0]) && (cw * xy[i][0]) <= location[0] + range) {
                if (location[1] - range <= (ch * xy[i][1]) && (ch * xy[i][1]) <= location[1] + range) {
                    if (ml[i + 1] === 'L') { // if we splice in the middle of a path, split into two paths
                        ml[i + 1] = 'M';
                    }
                    ml.splice(i, 1);
                    xy.splice(i, 1);
                    pa.splice(i, 1);
                }
            }
        }
        var check = false;
        for (var j = 0; j < ml.length; j++) {
            if (ml[j] === "L") {
                check = true;
                break;
            }
        }
        if (!check) {
            xy.length = 0;
            ml.length = 0;
            pa.length = 0;
        }
        drawPaths(); // after we're done splicing, redraw the paths
    }
    that.erase = erase;

    /**
     * Takes in a datastring and parses for a certain attribute by splitting at "[" and "]" (these surround
     * attribute names).
     * NOTE if errors are coming from this function, could be that the datastring is empty...
     * @param str        the datastring
     * @param attr       the attribute we'll parse for
     * @param parsetype  'i' (int), 's' (string), or 'f' (float)
     * @return  the value of the attribute in the correct format
     */
    function get_attr(str, attr, parsetype) {
        if(parsetype === "f")
            return parseFloat(str.split("[" + attr + "]")[1].split("[")[0]);
        if (parsetype === "s")
            return str.split("[" + attr + "]")[1].split("[")[0];
        else
            return parseInt(str.split("[" + attr + "]")[1].split("[")[0],10);
    }
    that.get_attr = get_attr;

    function set_attr(attr, newval) {
        var arrs = datastring.split("[" + attr + "]");
        var arr2 = arrs[1].split("]");
        arr2.splice(0, 1);
        arr2[0] = "[color]"+arr2[0];
        var str2 = arr2.join("]");
        datastring = arrs[0] + "[fontsize]" + newval + str2;
    }
    that.set_attr = set_attr;
    
    /**
     * Returns the isolate/block bounding shapes.
     */
    function getBoundingShapes() {
        return bounding_shapes;
    }
    that.getBoundingShapes = getBoundingShapes;

    /**
     * Returns the current datastring.
     */
    function getDatastring() {
        return datastring;
    }
    that.getDatastring = getDatastring;

    /**
     * Uses path data representing ellipses and rectangles to get the path representing the ultimate block
     * or isolate shape.
     * @param paths     array of path strings representing ellipses/rects
     */
    function get_outer_path(paths) {
        var cw = domelement.width();
        var ch = domelement.height();
        var cumulative_path = "";
        for (var i = 0; i < paths.length; i++) {
            paths[i] = transform_pathstring_marq(paths[i], cw, ch); // transform each to absolute coords
            paths[i] = (paths[i][paths[i].length - 1] === "z") ? paths[i] : (paths[i] + "z"); // make sure each is closed
        }
        while (paths.length) {
            // take the first path, loop through the list, calling const_path_alg on any that intersect, then add to cumulative_path
            var outer_path = paths[0];
            paths.splice(0, 1);
            if (paths.length) {
                var parsed = Raphael.parsePathString(outer_path); // parses outer_path as a list of objects containing path data
                for (var j = 0; j < paths.length; j++) {
                    var jparsed = Raphael.parsePathString(paths[j]);
                    // the next line checks if paths[j] and outerpath intersect, or if one is completely inside the other
                    if (Raphael.pathIntersection(outer_path, paths[j]).length || point_inside(outer_path, jparsed[0][1], jparsed[0][2]) || point_inside(paths[j], parsed[0][1], parsed[0][2])) {
                        outer_path = const_path_alg(paths[j], outer_path);
                        paths.splice(j, 1);
                        j = -1; //if we have an intersection, another, previously non-intersecting path might now intersect, so reset j (we spliced out the current j, so no repeats)
                    }
                }
            }
            cumulative_path += outer_path;
        }
        // finally, load the resulting cumulative path onto the canvas
        load_trans_from_path(cumulative_path);
    }
    that.get_outer_path = get_outer_path;

    /**
     * Helper function to get artwork's relative coordinates within the viewer.
     * @return    an object containing relative coordinates x, y, w, h
     */
    function getArtRelativePos(proxy, cw, ch) {
        return { x: proxy.x / cw, y: proxy.y / ch, w: proxy.w / cw, h: proxy.h / ch };
    }
    that.getArtRelativePos = getArtRelativePos;

    /**
     * Helper function to get the svg element created by Raphael.
     */
    function getSVGElement() {
        return domelement.find("svg")[0];
    }
    that.getSVGElement = getSVGElement;

    /**
     * Searches the current datastring for ellipses and rectangles, stores their information in bounding_shapes.
     * Also stores their coordinates and types in an array shapes and calls shapes_to_paths on shapes
     * to transform them to path format.
     */
    function get_trans_shape_data () {
        var datastr = update_datastring();
        var shapes = [];
        var cw = domelement.width();
        var ch = domelement.height();
        if (datastr === "") {
            console.log("no elements to attach");
            return;
        }
        var shapes2 = datastr.split("|");
        for (var i = 0; i < shapes2.length; i++) {
            var shape2 = shapes2[i];
            var type = shape2.split("::")[0];
            type = type.toLowerCase();
            switch (type) {
                case "lrect":
                case "mrect":
                case "rect":
                    // rectangle format: [x]73[y]196[w]187[h]201[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                    var x = abs_dims(get_attr(shape2, "x", "f"), cw);
                    var y = abs_dims(get_attr(shape2, "y", "f"), ch);
                    var w = abs_dims(get_attr(shape2, "w", "f"), cw);
                    var h = abs_dims(get_attr(shape2, "h", "f"), ch);
                    var R = { "X": x, "Y": y, "w": w, "h": h, "type": "rect" };
                    bounding_shapes += "BOUNDRECT::[x]" + (x / cw) + "[y]" + (y / ch) + "[w]" + (w / cw) + "[h]" + (h / ch) + "[fillc]#000000[fillo]0[strokec]" + get_attr(shape2, "strokec", 's') + "[strokeo]" + get_attr(shape2, "strokeo", 'f') + "[strokew]" + get_attr(shape2, "strokew", 'f') + "[]|";
                    shapes.push(R);
                    break;
                case "lellipse":
                case "mellipse":
                case "ellipse":
                    // ellipse format: [cx]81[cy]131[rx]40[ry]27[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                    var cx = abs_dims(get_attr(shape2, "cx", "f"), cw); // center x
                    var cy = abs_dims(get_attr(shape2, "cy", "f"), ch); // center y
                    var rx = abs_dims(get_attr(shape2, "rx", "f"), cw); // x-radius
                    var ry = abs_dims(get_attr(shape2, "ry", "f"), ch); // y-radius
                    var E = { "cx": cx, "cy": cy, "rx": rx, "ry": ry, "type": "ellipse" };
                    bounding_shapes += "BOUNDELLIPSE::[cx]" + (cx / cw) + "[cy]" + (cy / ch) + "[rx]" + (rx / cw) + "[ry]" + (ry / ch) + "[fillc]#000000[fillo]0[strokec]" + get_attr(shape2, "strokec", 's') + "[strokeo]" + get_attr(shape2, "strokeo", 'f') + "[strokew]" + get_attr(shape2, "strokew", 'f') + "[]|";
                    shapes.push(E);
                    break;
            }
        }
        shapes_to_paths(shapes);
    }
    that.get_trans_shape_data = get_trans_shape_data;

    /**
     * Returns true if the text box containing an ink being edited/authored is empty
     */
    function isTextboxEmpty() {
        return ($('#' + textboxid).attr("value") === "");
    }
    that.isTextboxEmpty = isTextboxEmpty;

    /**
     * Helper function to check if there is actually a valid ink to attach/save during ink authoring/editing. For texts, need to use isTextboxEmpty.
     * @param datastring    the datastring to check
     * @return    whether or not there are no inks on the canvas (i.e. the datastring does not represent anything useful)
     */
    function isDatastringEmpty(datastring) {
        console.log("is data string empty :" + datastring);
        if (datastring === "")
            return true;
        var type = datastring.split("::")[0].toLowerCase();
        var empty = false;
        switch (type) {
            case 'trans':
                if (datastring.split("[path]")[1].split("[")[0] === "")
                    empty = true;
                break;
            case 'path':
                if (datastring.split("[pathstring]")[1].split("[")[0] === "")
                    empty = true;
                break;
            case 'text':
                if (datastring.split("[str]")[1].split("[")[0] === "")
                    empty = true;
                break;
            default:
                break;
        }
        return empty;
    }
    that.isDatastringEmpty = isDatastringEmpty;

    /**
     * Display warning message if ink cannot be loaded
     * @param displayString     String describing error (to be displayed)
     */
    function creationError(displayString) {
        timeline.hideEditorOverlay();
        var messageBox = LADS.Util.UI.popUpMessage(null, displayString, null);
        $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
        $('body').append(messageBox);
        $(messageBox).fadeIn(500);
    }

    /**
     * Checks if currently inside display
     * @param displays      array of displays to check
     * @returns             true if in display, false otherwise
     */
    function checkInDisplay(displays) {
        var inDisplay = false,
            currTime = timeManager.getCurrentTime();
        for (var i = 0; i < displays.length ; i++) {
            var disp = displays[i];
            if (disp.getStart() <= currTime && currTime <= disp.getEnd()) {
                inDisplay = true;
                break;
            }
        }
        return inDisplay;
    }

    /**
     * Helper function to do some preprocessing on text inks before linking them.
     * @return    true if we should proceed to linking, false if there are warning messages
     */
    function link_text() {
        var track = timeline.selectedTrack.current;
        if (!track || (track.getType() !== LADS.TourAuthoring.TrackType.artwork && track.getType() !== LADS.TourAuthoring.TrackType.image)) {
            creationError("There is no artwork or image track selected. Please select a valid track or create an unlinked ink.");
            return false;
        }

        // First, check if the text is a valid (non-empty) ink by checking the value of the textbox. If invalid, show a warning message.
        if (isTextboxEmpty()) {
            creationError("Unable to attach an empty ink. Please add to ink component before attaching.");
            return false;
        }
        // next, check to make sure the playhead is in a display; if not, show a warning message
        var inDisplay = checkInDisplay(track.getDisplays());
        // also check if the selected track is an artwork or an image
        if (!inDisplay) {
            creationError("Please move the playhead within the currently selected track's display.");
            return false; // if a warning popped up, return false
        }
        var keyframe = viewer.captureKeyframe(track.getTitle());
        if (!keyframe) {
            creationError("The track selected must be fully on screen in order to attach an ink. Please seek to a location where the track is visible.");
            return false;
        }


        save_text();
        return link();
    }
    that.link_text = link_text;

    /**
     * Helper function to do some preprocessing on text inks before creating them unattached.
     * @return     true if no warnings and we should create, false otherwise
     */
    function link_text_unattached() {
        // First, check if the text is a valid (non-empty) ink by checking the value of the textbox. If invalid, show a warning message.
        if (isTextboxEmpty()) {
            creationError("Unable to attach an empty ink. Please add to ink component before attaching.");
            return false;
        }
        linkUnattached();
        return true;
    }
    that.link_text_unattached = link_text_unattached;

    /**
     * Helper function to do some preprocessing on transparencies before linking them.
     * @return     true if no warnings, false otherwise (see link_text for description of warnings)
     */
    function link_trans() {
        var track = timeline.selectedTrack.current;
        
        if (!track || (track.getType() !== LADS.TourAuthoring.TrackType.artwork && track.getType() !== LADS.TourAuthoring.TrackType.image)) {
            creationError("There is no artwork or image track selected. Please select a valid track or create an unlinked ink.");
            return false;
        }

        var inDisplay = checkInDisplay(track.getDisplays());
        
        if (!inDisplay) {
            creationError("Please move the playhead within the currently selected track's display.");
            return false; // if a warning popped up, return false
        }
        
        var keyframe = viewer.captureKeyframe(track.getTitle());
        if (!keyframe) {
            creationError("The track selected must be fully on screen in order to attach an ink. Please seek to a location where the track is visible.");
            return false;
        }

        get_trans_shape_data();
        return link();
    }
    that.link_trans = link_trans;

    /**
     * Helper function to do some preprocessing on transparencies before creating them unattached.
     * @return     true if no warnings, false otherwise
     */
    function link_trans_unattached() {
        if (isDatastringEmpty(update_datastring())) {
            creationError("Unable to attach an empty ink. Please add to ink component before attaching.");
            return false;
        }
        get_trans_shape_data();
        linkUnattached();
        return true;
    }
    that.link_trans_unattached = link_trans_unattached;

    /**
     * Function to link an ink to an artwork. Called for all types of inks (possibly after preprocessing, in
     * the cases of texts and transparencies).
     * return     true if linking was successful, false if warnings
     */
    function link() {
        var track = timeline.selectedTrack.current;

        if (!track || (track.getType() !== LADS.TourAuthoring.TrackType.artwork && track.getType() !== LADS.TourAuthoring.TrackType.image)) {
            creationError("There is no artwork or image track selected. Please select a valid track or create an unlinked ink.");
            return false;
        }
        if (isDatastringEmpty(update_datastring())) { // make sure the datastring is nonempty before we attach
            creationError("Unable to attach an empty ink. Please add to ink component before attaching.");
            return false;
        }
        var inDisplay = checkInDisplay(track.getDisplays());
        // make sure the track selection is valid, it is an artwork or an image, and the playhead is in a track display
        if (!inDisplay) {
            creationError("Please move the playhead within the currently selected track's display.");
            return false; // if a warning popped up, return false
        }

        // prepare to set track data
        artName = timeline.selectedTrack.current.getTitle();
        var cw = domelement.width();
        var ch = domelement.height();
        magX = cw;
        magY = ch;
        var proxy_div = $("[data-proxy='" + artName + "']");
        var proxy = {
            x: proxy_div.data("x"),
            y: proxy_div.data("y"),
            w: proxy_div.data("w"),
            h: proxy_div.data("h")
        };

        var datastr = update_datastring();

        var keyframe = viewer.captureKeyframe(artName);
        if (!keyframe) {
            creationError("The track selected must be fully on screen in order to attach an ink. Please seek to a location where the track is visible.");
            return false;
        }

        var kfvx, kfvy, kfvw, kfvh,
            linkType = track.getType();
        // get initial keyframe for the artwork/image we're attaching to
        if (linkType === LADS.TourAuthoring.TrackType.artwork) {
            kfvx = keyframe.state.viewport.region.center.x;
            kfvy = keyframe.state.viewport.region.center.y;
            kfvw = keyframe.state.viewport.region.span.x;
            kfvh = keyframe.state.viewport.region.span.y;
        }
        else if (linkType === LADS.TourAuthoring.TrackType.image) {
            kfvw = 1.0 / keyframe.state.viewport.region.span.x;//$("#" + canvid).width() / (keyframe.state.viewport.region.span.x * cw);
            var rw = keyframe.state.viewport.region.span.x * domelement.width();
            kfvh = keyframe.state.viewport.region.span.y; /////bogus entry, not used
            kfvx = -keyframe.state.viewport.region.center.x * kfvw;// /
            kfvy = -(domelement.height() / rw) * keyframe.state.viewport.region.center.y;// / (.5*(keyframe.state.viewport.region.span.x
        }
        // set track data
        var inkType = datastr.split("::")[0].toLowerCase();
        inktrack = timeline.addInkTrack(timeline.selectedTrack.current, "Ink " + timeline.selectedTrack.current.getTitle(), inkType);
        var selectedTrack = timeline.selectedTrack.current;
        inktrack.setInkLink(selectedTrack);
        selectedTrack.addAttachedInkTrack(inktrack);
        if (inkType === "trans")
            datastr += bounding_shapes; // if we're attaching a transparency, also include the bounding ellipse/rects in the datastring so we can edit later
        inktrack.setInkPath(datastr);
        inktrack.setInkProps({}); // not used
        inktrack.setInkInitKeyframe({ "x": kfvx, "y": kfvy, "w": kfvw, "h": kfvh });
        inktrack.setInkEnabled(true); // set linked
        inktrack.setInkType(inkType);
        inktrack.setInkRelativeArtPos(getArtRelativePos(proxy, cw, ch));

        inktrack.addInkTypeToTitle(inkType);

        enabled = true;
        domelement.remove();
        var artDisplays = selectedTrack.getDisplays();
        var currTime = timeManager.getCurrentTime();
        var boundingEdge=Infinity;
        for(var k=0;k<artDisplays.length;k++) {
            if(currTime <= artDisplays[k].getEnd() && currTime >= artDisplays[k].getStart()) {
                boundingEdge=artDisplays[k].getEnd();
                break;
            }
        }
        inktrack.addDisplay(timeManager.getCurrentPx(), Math.min(5,boundingEdge - currTime)); //add a display at the playhead location

        // add command to undo both track creation and display at once
        undoManager.combineLast(2);

        if (timeline.getTracks().length > 0) {
            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
        }
        return true;
    }
    that.link = link;

    /**
     * Function to create an unattached ink. Called for all types of inks (possibly after preprocessing, in
     * the cases of texts and transparencies).
     * return     true if creation was successful, false if warnings
     */
    function linkUnattached() {
        var inkEmptyOverlay = $(LADS.Util.UI.blockInteractionOverlay());
        var inkEmptyDialog = $(document.createElement("div"));

        function okTapInkAttach(evt) {
            inkEmptyOverlay.fadeOut(200);
        }
        if (isDatastringEmpty(update_datastring())) {
            inkEmptyDialog.attr("id", "inkEmptyDialog");
            inkEmptyDialog.css({
                display: 'none',
                position: 'fixed',
                top: '40%',
                left: '30%',
                width: 'auto',
                'background-color': 'black',
                'border': '3px double white',
                'z-index': LADS.TourAuthoring.aboveRinZIndex + 5,
                'text-align': 'center',
                'padding': '1.5% 1.5% 2% 2%',
            });

            inkEmptyOverlay.append(inkEmptyDialog);
            $("body").append(inkEmptyOverlay);
            inkEmptyOverlay.fadeIn(100);

            var text = $(document.createElement("div"));
            text.text("Unable to attach an empty ink. Please add to ink component before attaching.");
            text.css('font-size', '1.25em', "text-align", 'left');
            inkEmptyDialog.append(text);

            var buttonDiv = $(document.createElement("div"));
            buttonDiv.css('text-align', 'center');

            var ok = $(document.createElement("button"));
            ok.text("OK");
            ok.css({
                width: 'auto',
                'background-color': 'black',
                'border': '1px solid white',
                'margin-top': '25px',
                //'margin-right':'2%'
            });
            buttonDiv.append(ok);
            inkEmptyDialog.append(buttonDiv);
            inkEmptyDialog.show();

            LADS.Util.makeManipulatable({ // using makeManipulatable is probably overkill here -- could just use a click handler
                element: ok[0],
                functions: {
                    onTapped: okTapInkAttach
                },
                stdHammer: true
            });
            return false;
        }

        // add track and set track data
        inktrack = timeline.addInkTrack(null, "Unattached Ink", 1);
        inktrack.setInkLink(null);
        var datastr = update_datastring();
        var inkType = datastr.split("::")[0].toLowerCase();
        if (inkType == "trans")
            datastr += bounding_shapes;
        inktrack.setInkPath(datastr);
        inktrack.setInkEnabled(false); // unattached
        inktrack.setInkSize(fontSize);
        inktrack.setInkInitKeyframe({}); // initial keyframe doesn't matter, since not linked
        inktrack.setInkRelativeArtPos({}); // initial art position doesn't matter, since not linked

        inktrack.addInkTypeToTitle(inkType);


        enabled = false;
        domelement.remove();
        inktrack.addDisplay(Math.min(timeManager.timeToPx(timeManager.getDuration().end - 0.5), timeManager.getCurrentPx()), Math.min(5, Math.max(0.5, timeManager.getDuration().end - timeManager.getCurrentTime()))); // add a display at the playhead location
        undoManager.combineLast(2);
        if (timeline.getTracks().length > 0) {
            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
        }
        return true;
    }
    that.linkUnattached = linkUnattached;

    function getTextElt() {
        return textElt;
    }
    that.getTextElt = getTextElt;

    var magX = domelement.width(), magY = domelement.height();

    function getTextMagnification() {
        return magY;
    }
    that.getTextMagnification= getTextMagnification;

    /**
     * Loads an ink onto the ink canvas using its datastring (e.g. from track data).
     * @param   the datastring to be loaded (see update_datastring for datastring format)
     */
    function loadInk(datastr) {
        var shapes = datastr.split("|");
        var i;
        var cw = domelement.width();
        var ch = domelement.height();
        magX = cw;
        magY = ch;
        var shapes_len = shapes.length;
        for (i = 0; i < shapes_len; i++) {
            var shape = shapes[i];
            var x, y, w, h, fillc, fillo, strokec, strokeo, strokew;
            if (shape && (shape !== "")) {
                var type = shape.split("::")[0];
                switch (type.toLowerCase()) {
                    case "text":
                        // format: [str]<text>[font]<font>[fontsize]<fontsize>[color]<font color>[x]<x>[y]<y>[]
                        var size = get_attr(shape, "fontsize", "f") * ch;
                        fontSize = size;
                        x = get_attr(shape, "x", "f") * cw;
                        y = get_attr(shape, "y", "f") * ch;
                        //var w, h;
                        try {
                            w = get_attr(shape, 'w', 'f');
                            h = get_attr(shape, 'h', 'f');
                        } catch (err) {
                            w = null;
                            h = null;
                        }
                        var text_color = get_attr(shape, "color", "s");
                        var text_font = get_attr(shape, "font", "s");
                        var text_text = get_attr(shape, "str", "s");
                        var text = paper.text(x, y, text_text);
                        text.attr({
                            "font-family": text_font,
                            "font-size": size + "px",
                            "fill": text_color,
                            "text-anchor": "start",
                        });
                        text.data({
                            "x": x,
                            "y": y,
                            'w': w,
                            'h': h,
                            "fontsize": size,
                            "color": text_color,
                            "font": text_font,
                            "type": "text",
                            "str": text_text,
                        });
                        textElt = text;
                        break;
                    case "path":
                        // format: [pathstring]M284,193L284,193[stroke]000000[strokeo]1[strokew]10[]
                        if (!currpaths)
                            currpaths = "";
                        currpaths += shape + "|";
                        update_ml_xy_pa(shape + "|");
                        break;
                    case "trans":
                        // format: [path]<path>[color]<color>[opac]<opac>[mode]<block or isolate>[]
                        if (!trans_currpath)
                            trans_currpath = "";
                        trans_currpath += shape + "|";
                        var pathstring = get_attr(shape, "path", 's');
                        marqueeFillColor = get_attr(shape, "color", 's');
                        marqueeFillOpacity = get_attr(shape, "opac", "f");
                        trans_mode = get_attr(shape, "mode", 's');
                        transCoords = pathstring.match(/[0-9.\-]+/g);
                        transLetters = pathstring.match(/[CMLz]/g);
                        drawTrans();
                        break;
                    case "rect":
                        // format: [x]73[y]196[w]187[h]201[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                        x = abs_dims(get_attr(shape, "x", "f"), cw);
                        y = abs_dims(get_attr(shape, "y", "f"), ch);
                        w = abs_dims(get_attr(shape, "w", "f"), cw);
                        h = abs_dims(get_attr(shape, "h", "f"), ch);
                        fillc = get_attr(shape, "fillc", "s");
                        fillo = get_attr(shape, "fillo", "f");
                        strokec = get_attr(shape, "strokec", "s");
                        strokeo = get_attr(shape, "strokeo", "f");
                        strokew = get_attr(shape, "strokew", "f");
                        var R = paper.rect(x, y, w, h);
                        R.data("currx", x);
                        R.data("curry", y);
                        R.data("currw", w);
                        R.data("currh", h);
                        R.data("type", "rect");
                        R.data("visible", "yes");
                        add_attributes(R, fillc, fillo, strokec, strokeo, strokew);
                        break;
                    case "ellipse":
                        // format: [cx]81[cy]131[rx]40[ry]27[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                        var cx = abs_dims(get_attr(shape, "cx", "f"), cw);
                        var cy = abs_dims(get_attr(shape, "cy", "f"), ch);
                        var rx = abs_dims(get_attr(shape, "rx", "f"), cw);
                        var ry = abs_dims(get_attr(shape, "ry", "f"), ch);
                        fillc = get_attr(shape, "fillc", "s");
                        fillo = get_attr(shape, "fillo", "f");
                        strokec = get_attr(shape, "strokec", "s");
                        strokeo = get_attr(shape, "strokeo", "f");
                        strokew = get_attr(shape, "strokew", "f");
                        var E = paper.ellipse(cx, cy, rx, ry);
                        E.data("currx", E.getBBox().x);
                        E.data("curry", E.getBBox().y);
                        E.data("curr_rx", rx);
                        E.data("curr_ry", ry);
                        E.data("type", "ellipse");
                        E.data("visible", "yes");
                        add_attributes(E, fillc, fillo, strokec, strokeo, strokew);
                        break;
                    case "marquee": // DEPRECATED
                        // format: [x]206[y]207[w]102[h]93[surrfillc]#222222[surrfillo].8[]
                        var topx = abs_dims(get_attr(shape, "x", "f"), cw);
                        var topy = abs_dims(get_attr(shape, "y", "f"), ch);
                        w = abs_dims(get_attr(shape, "w", "f"), cw);
                        h = abs_dims(get_attr(shape, "h", "f"), ch);
                        var surrfillc = get_attr(shape, "surrfillc", "s");
                        var surrfillo = get_attr(shape, "surrfillo", "f");
                        var botx = topx + w;
                        var boty = topy + h;
                        var rn = paper.rect(0, 0, cw, topy);
                        rn.data("currx", 0);
                        rn.data("curry", 0);
                        var re = paper.rect(botx, topy, cw - botx, boty - topy);
                        re.data("currx", botx);
                        re.data("curry", topy);
                        var rs = paper.rect(0, boty, cw, ch - boty);
                        rs.data("currx", 0);
                        rs.data("curry", boty);
                        var rw = paper.rect(0, topy, topx, boty - topy);
                        rw.data("currx", 0);
                        rw.data("curry", topy);
                        var rc = paper.rect(topx, topy, botx - topx, boty - topy);
                        rc.data("currx", topx);
                        rc.data("curry", topy);
                        rc.data("type", "marquee");
                        //var m = new marquee(rn, re, rs, rw, rc);
                        //add_marq_attributes(m, surrfillc, surrfillo);
                        //marquees.push(m);
                        break;
                }
            }
        }
        drawPaths();

        // force adjustViewBox to run so viewbox is always set 
        //lastpx = origpx + 10000;
        if (enabled) {
            paper.setViewBox(0, 0, cw, ch);
            //adjustViewBox({ x: origpx, y: origpy, width: origpw, height: origph });
        }
    }
    that.loadInk = loadInk;

    /**
     * Draws a transparency to the canvas and adds the correct styling. Also sets trans_currpath, which keeps track of current transparency path.
     * @param pth    the path representing the transparency to be loaded in
     */
    function load_trans_from_path(pth) {
        var cw = domelement.width();
        var ch = domelement.height();
        var trans = paper.path(pth).attr({ "fill-opacity": marqueeFillOpacity, "fill": marqueeFillColor, "stroke-opacity": 0, "stroke": "#888888", "stroke-width": 0 });
        trans.data("type", "trans");
        trans_currpath = "TRANS::[path]" + transform_pathstring_marq(pth, 1.0 / cw, 1.0 / ch) + "[color]" + marqueeFillColor + "[opac]" + marqueeFillOpacity + "[mode]" + trans_mode + "[]|";
        update_datastring();
    }
    that.load_trans_from_path = load_trans_from_path;

    /**
     * Loads a transparency's bounding shapes -- type boundrect and boundellipse -- for editing transparencies
     * @param datastr    the datastring containing the transparency path and its bounding shapes
     */
    function load_transparency_bounding_shapes(datastr) {
        var shapes = datastr.split("|");
        var i;
        var cw = domelement.width();
        var ch = domelement.height();
        for (i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            var fillc, fillo, strokec, strokeo, strokew;
            if (shape && (shape !== "")) {
                var type = shape.split("::")[0];
                type = type.toLowerCase();
                switch (type) {
                    case "boundrect":
                        //format: [x]73[y]196[w]187[h]201[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                        var x = abs_dims(get_attr(shape, "x", "f"), cw);
                        var y = abs_dims(get_attr(shape, "y", "f"), ch);
                        var w = abs_dims(get_attr(shape, "w", "f"), cw);
                        var h = abs_dims(get_attr(shape, "h", "f"), ch);
                        fillc = get_attr(shape, "fillc", "s");
                        fillo = get_attr(shape, "fillo", "f");
                        strokec = get_attr(shape, "strokec", "s");
                        strokeo = get_attr(shape, "strokeo", "f");
                        strokew = get_attr(shape, "strokew", "f");
                        var R = paper.rect(x, y, w, h);
                        R.data("currx", x);
                        R.data("curry", y);
                        R.data("currw", w);
                        R.data("currh", h);
                        R.data("type", "rect");
                        R.data("visible", "yes");
                        add_attributes(R, fillc, fillo, strokec, strokeo, strokew);
                        break;
                    case "boundellipse":
                        //format: [cx]81[cy]131[rx]40[ry]27[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                        var cx = abs_dims(get_attr(shape, "cx", "f"), cw);
                        var cy = abs_dims(get_attr(shape, "cy", "f"), ch);
                        var rx = abs_dims(get_attr(shape, "rx", "f"), cw);
                        var ry = abs_dims(get_attr(shape, "ry", "f"), ch);
                        fillc = get_attr(shape, "fillc", "s");
                        fillo = get_attr(shape, "fillo", "f");
                        strokec = get_attr(shape, "strokec", "s");
                        strokeo = get_attr(shape, "strokeo", "f");
                        strokew = get_attr(shape, "strokew", "f");
                        var E = paper.ellipse(cx, cy, rx, ry);
                        E.data("currx", E.getBBox().x);
                        E.data("curry", E.getBBox().y);
                        E.data("curr_rx", rx);
                        E.data("curr_ry", ry);
                        E.data("type", "ellipse");
                        E.data("visible", "yes");
                        add_attributes(E, fillc, fillo, strokec, strokeo, strokew);
                        break;
                }
            }
        }
    }
    that.load_transparency_bounding_shapes = load_transparency_bounding_shapes;

    /**
     * DEPRECATED -- constructor for old marquees
     */
    //function marquee(rectN, rectE, rectS, rectW, rectC) {
    //    this.rn = rectN;
    //    this.re = rectE;
    //    this.rs = rectS;
    //    this.rw = rectW;
    //    this.rc = rectC;
    //}
    //that.marquee = marquee;

    /**
     * Using the point pt, computes the incoming bezier anchor coordinates for the next point (next) in the path.
     * This is done by using the points' types (if pt and next are both endpoints, pt.point.ax2, .ay2 give the relevant information, etc).
     * @param pt      starting point object (contains point coordinates, type of point, and which path it's on)
     * @param next    next point object
     * @return    the incoming bezier anchor coordinates to next
     */
    function next_in_bez(pt, next) {
        var bez, t, dots;
        if (pt.type == "endpoint") {
            if (next.type == "endpoint") {
                return { x: pt.point.ax2, y: pt.point.ay2 };
            }
            else { // pt is an endpoint and next is an intersection point
                bez = (pt.path === 0) ? (next.point.bez1) : (next.point.bez2);
                t = (pt.path === 0) ? (next.point.t1) : (next.point.t2);
                dots = Raphael.findDotsAtSegment(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5], bez[6], bez[7], t);
                return { x: dots.m.x, y: dots.m.y };
            }
        }
        else { // pt is an intersection point
            if (next.type === "endpoint") {
                bez = (next.path === 0) ? (pt.point.bez1) : (pt.point.bez2);
                return { x: bez[4], y: bez[5] };
            }
            else {//both pt and next are intersection points
                bez = (next.path === 0) ? (next.point.bez1) : (next.point.bez2);
                t = (next.path === 0) ? (next.point.t1) : (next.point.t2);
                dots = Raphael.findDotsAtSegment(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5], bez[6], bez[7], t);
                return { x: dots.n.x, y: dots.n.y };
            }
        }
    }
    that.next_in_bez = next_in_bez;

    /**
     * Helper function to determine whether p1 and p2 are effectively the same point. Returns true if so.
     */
    function nontrivial(p1, p2) {
        return ((Math.abs(p1.x - p2.x) > 0.00000001) || (Math.abs(p1.y - p2.y) > 0.00000001) || (Math.abs(p1.w - p2.w) > 0.00000001) || (Math.abs(p1.h - p2.h) > 0.00000001));
    }
    that.nontrivial = nontrivial;

    /**
     * Using the point next, computes the outgoing bezier anchor coordinates for the point pt on the path.
     * @param pt      starting point object (contains point coordinates, type of point, and which path it's on)
     * @param next    next point object
     * @return    the outgoing bezier anchor coordinates from pt
     */
    function out_bez(pt, next) {
        if (pt.type === "endpoint") {
            return { x: pt.point.ax1, y: pt.point.ay1 };
        }
        else { // pt is an intersection point
            var bez = (next.path === 0) ? (pt.point.bez1) : (pt.point.bez2);
            var t = (next.path === 0) ? (pt.point.t1) : (pt.point.t2);
            var dots = Raphael.findDotsAtSegment(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5], bez[6], bez[7], t);
            return { x: dots.n.x, y: dots.n.y };
        }
    }
    that.out_bez = out_bez;

    var inkPannedX;
    var inkPannedY;
    /**
     * Pans all objects in the canvas by dx, dy.
     * @param dx, dy    the deltas
     * @param draw      should we take time to draw the objects?
     */
    function panObjects(dx, dy, canv_dims, draw) {
        var cw = canv_dims.cw;
        var ch = canv_dims.ch;
        var i;
        paper.forEach(function (elt) { // first take care of panning rects, ellipses, and texts by changing their attributes
            var type = elt.data("type");
            if ((type != "path") && (type != "text") && (type != "trans")) {
                elt.attr({
                    'x': parseFloat(elt.attr("x")) + dx * cw,
                    'y': parseFloat(elt.attr("y")) + dy * ch,
                    'cx': parseFloat(elt.attr("cx")) + dx * cw,
                    'cy': parseFloat(elt.attr("cy")) + dy * ch,
                });
                if (type == "ellipse") {
                    elt.data("currx", parseFloat(elt.attr("cx")) - parseFloat(elt.attr("rx")));
                    elt.data("curry", parseFloat(elt.attr("cy")) - parseFloat(elt.attr("ry")));
                    elt.data("curr_rx", elt.attr("rx"));
                    elt.data("curr_ry", elt.attr("ry"));
                }
                else {
                    elt.data("currx", elt.attr("x"));
                    elt.data("curry", elt.attr("y"));
                }
            }
            else if (type == "text") {
                elt.attr({
                    'x': parseFloat(elt.attr("x")) + dx * cw,
                    'y': parseFloat(elt.attr("y")) + dy * ch,
                });
                elt.data('x', parseFloat(elt.data("x")) + dx * cw);
                elt.data('y', parseFloat(elt.data("y")) + dy * ch);
                inkPannedX = elt.attr('x');
                inkPannedY = elt.attr('y');
            }
        });

        // pan paths by modifying xy
        var xylen = xy.length;
        for (i = 0; i < xylen; i++) {
            xy[i][0] = xy[i][0] + dx;
            xy[i][1] = xy[i][1] + dy;
        }

        // pan transparencies by modifying transCoords
        var tclen = transCoords.length;
        for (i = 0; i < tclen; i++) {
            transCoords[i] += ((i % 2) ? dy : dx);
        }

        // if type is drawing, call drawPaths if necessary
        if (xylen && draw)
            drawPaths();

        // if type is transparency, call drawTrans if ncecessary
        if (tclen && draw)
            drawTrans();

        // if the type of our ink is a text, redraw (if necessary) by just removing all and loading the datastring back in
        if (!xylen && !tclen && draw) {
            var dstring = update_datastring();
            remove_all();
            datastring = dstring;
            loadInk(datastring);
        }
    }
    that.panObjects = panObjects;

    function getPannedPos() {
        // used to return positional data for generating text in correct place
        var pannedPos = { x: inkPannedX, y: inkPannedY };
        return pannedPos;
    }
    that.getPannedPos = getPannedPos;

    /**
     * Pans all objects in the canvas by dx, dy.
     * @param dx, dy    the deltas
     * @param draw      should we take time to draw the objects?
     */
    function testPan(dx, dy, draw) {
        if (!draw) {
            paper.forEach(function (elt) {
                elt.transform("t-" + elt.data("bboxcenterx") + ",-" + elt.data("bboxcentery") + "...");
            });
        }
        else {
            paper.forEach(function (elt) {
                elt.transform("t" + (dx+elt.data("bboxcenterx")) + "," + (dy+elt.data("bboxcentery")) + "...");
            });
        }
    }
    that.testPan = testPan;

    function testScale(scale_x, scale_y, draw) {
        paper.forEach(function (elt) {
            var bbox = elt.getBBox();
            elt.transform("s" + scale_x + "...");
            elt.transform("t" + (-elt.getBBox().x) + "," + (-elt.getBBox().y)+"...");
            elt.transform("t" + (bbox.x*scale_x) + "," + (bbox.y*scale_y)+"...");
        });
    }
    that.testScale = testScale;

    /**
     * Sometimes points on the boundary of a shape do not register as being inside the shape, so check a few surrounding
     * points as well. If enough of them (2) are inside, call the point inside. This isn't bulletproof, but it should
     * work most of the time.
     * @param pth     the path whose boundary concerns us
     * @param x, y    coordinates of the point to test
     * @return    1 if enough points are inside, 0 otherwise
     */
    function point_inside(pth, x, y) {
        var test1 = Raphael.isPointInsidePath(pth, x, y);
        var test2 = Raphael.isPointInsidePath(pth, x - 1, y - 1);
        var test3 = Raphael.isPointInsidePath(pth, x + 1, y - 1);
        var test4 = Raphael.isPointInsidePath(pth, x - 1, y + 1);
        var test5 = Raphael.isPointInsidePath(pth, x + 1, y + 1);
        if (test1 || (test2 + test3 + test4 + test5 >= 2))
            return 1;
        return 0;
    }
    that.point_inside = point_inside;

    /**
     * Helper function to convert to relative coordinates.
     * @param abs_coord   the absolute coordinate
     * @param canv_dim    the relevant canvas dimension to scale by
     */
    function rel_dims(abs_coord, canv_dim) {
        return parseFloat(abs_coord) / parseFloat(canv_dim);
    }
    that.rel_dims = rel_dims;

    /**
     * Returns 1 if any points in order_added match pt.
     */
    function repeat_pt(pt, order_added) {
        for (var i = 0; i < order_added.length - 1; i++) {
            if (same_point(order_added[i].point, pt)) {
                return 1;
            }
        }
        return 0;
    }
    that.repeat_pt = repeat_pt;

    /**
     * Removes all Raphael elements from the canvas and clears arrays
     */
    function remove_all() {
        paper.clear();
        ml.length = 0;
        xy.length = 0;
        pa.length = 0;
        pathObjects.length = 0;
        marquees.length = 0;
        currpaths = "";
        datastring = '';
    }
    that.remove_all = remove_all;

    /**
     * Resizes all elements in the ink canvas.
     * @param scale_x, scale_y   the scale factors to resize by
     * @param draw               should we take the time to draw the result?
     */
    function resizeObjects(scale_x, scale_y, draw) {
        paper.forEach(function (elt) { // resize ellipses, rects, and texts by scaling attributes
            var type = elt.data("type");
            if ((type != "path") && (type != "text") && (type != "trans") && (type != "grabHandle")) {
                elt.attr({
                    'x': parseFloat(elt.attr("x")) * scale_x,
                    'y': parseFloat(elt.attr("y")) * scale_y,
                    'cx': parseFloat(elt.attr("cx")) * scale_x,
                    'cy': parseFloat(elt.attr("cy")) * scale_y,
                    'rx': parseFloat(elt.attr("rx")) * scale_x,
                    'ry': parseFloat(elt.attr("ry")) * scale_y,
                    'width': parseFloat(elt.attr("width")) * scale_x,
                    'height': parseFloat(elt.attr("height")) * scale_y,
                });
                if (type == "ellipse") {
                    elt.data("currx", parseFloat(elt.attr("cx")) - parseFloat(elt.attr("rx")));
                    elt.data("curry", parseFloat(elt.attr("cy")) - parseFloat(elt.attr("ry")));
                    elt.data("curr_rx", parseFloat(elt.attr("rx")));
                    elt.data("curr_ry", parseFloat(elt.attr("ry")));
                }
                else {
                    elt.data("currx", elt.attr("x"));
                    elt.data("curry", elt.attr("y"));
                }
            }
            else if (type == "text") {
                elt.attr({
                    'font-size': parseFloat(elt.attr("font-size")) * scale_y,
                    'x': elt.attr("x") * scale_x,
                    'y': elt.attr("y") * scale_y,
                });
                elt.data({
                    'fontsize': elt.data("fontsize") * scale_y,
                    'x': elt.data("x") * scale_x,
                    'y': elt.data("y") * scale_y,
                });
            }
        });

        // resize paths by scaling elements of xy
        var xylen = xy.length;
        var i;
        for (i = 0; i < xylen; i++) {
            xy[i][0] = xy[i][0] * scale_x;
            xy[i][1] = xy[i][1] * scale_y;
            pa[i].width = pa[i].width * scale_x;
        }

        // resize transparencies by scaling elements of transCoords
        var tclen = transCoords.length;
        for (i = 0; i < tclen; i++) {
            transCoords[i] *= ((i % 2) ? scale_y : scale_x);
        }

        // call drawPaths or drawTrans to update paths and transparencies, respectively, if need be
        if (xylen && draw)
            drawPaths();
        if (tclen && draw)
            drawTrans();

        // update texts if need by by calling remove_all and then loading in the datastring
        if (!xylen && !tclen && draw) {
            var dstring = update_datastring();
            remove_all();
            datastring = dstring;
            loadInk(datastring);
        }
    }
    that.resizeObjects = resizeObjects;

    /**
     * Set the variables related to adjustViewBox (original artwork location) using the art proxy,
     * which keeps track of its dimensions
     */
    function retrieveOrigDims() {
        var proxy = $("[data-proxy='" + artName + "']");
        var kfx = initKeyframe.x;
        var kfy = initKeyframe.y;
        var kfw = initKeyframe.w;
        var real_kfw = origPaperW / kfw;
        var real_kfh = real_kfw * (proxy.data("h") / proxy.data("w"));
        var real_kfx = -kfx * real_kfw;
        var real_kfy = -kfy * real_kfh;
        origpx = real_kfx;
        origpy = real_kfy;
        origpw = real_kfw;
        origph = real_kfh;
        lastpx = origpx;
        lastpy = origpy;
        lastpw = origpw;
        lastph = origph;
    }
    that.retrieveOrigDims = retrieveOrigDims;

    /**
-     * Checks whether two points are effectively the same
     * @param pt1, pt2   the points in question
     * @param err        how close the points have to be to be considered the same
     * @return    whether or not the points are the same (true/false)
     */
    function same_point(pt1, pt2, err) {
        if (err === undefined)
            err = 0.00001;
        return (Math.abs(pt1.x - pt2.x) < err && Math.abs(pt1.y - pt2.y) < err);
    }
    that.same_point = same_point;

    /**
     * Helper function to convert a textbox to a Raphael text element. //========== should be deprecated
     */
    function save_text() {
        var x = svgText.left;// + parseFloat(textboxelmt.css("padding-left")); // a bit hacky -- we should figure out exactly how to compute text positioning
        var y = svgText.top;//tbe_pos.top;// + parseFloat(textboxelmt.css("padding-top")); // parseFloat(fontSize) * ((num_lines + 1) / 2.0) +
        var elt = paper.text(x, y, str); // draw the text on the canvas
        elt.attr("text-anchor", "start");
        var initX = elt.attr("x");
        var initY = elt.attr("y");
        var eltbbox=elt.getBBox();
        elt.data({
            x: initX + parseFloat(textboxelmt.css("padding-left")),//eltbbox.width / 2 + 
            y: initY + eltbbox.height + parseFloat(textboxelmt.css("padding-top")),
            font: fontFamily,
            fontsize: fontSize,
            color: fontColor,
            str: str,
            type: "text",
        });
        update_datastring();
    }
    that.save_text = save_text;

    /**
     * Setter for the artname of a linked ink's associated artwork
     */
    function setArtName(name) {
        artName = name;
    }
    that.setArtName = setArtName;

    /**
     * Set the svg element to handle all pointer events so we can draw on it
     * (and also to prevent manipulation of artwork during ink creation)
     */
    function set_editable() {
        var svgelt = getSVGElement();
        svgelt.style.zIndex = -1;
        svgelt.style.background = "rgba(0, 0, 0, 0)";
        svgelt.style.pointerEvents = "all";
    }
    that.set_editable = set_editable;

    /**
     * Setter (sets experience id of ink)
     */
    function setEID(inEID) {
        EID = inEID;
    }
    that.setEID = setEID;

    /**
     * Sets the initial artwork keyframe
     */
    function setInitKeyframeData(kf) {
        initKeyframe = kf;
    }
    that.setInitKeyframeData = setInitKeyframeData;

    /**
     * Sets the ink mode
     */
    function set_mode(i) {
        i = parseInt(i,10);
        mode = i;
    }
    that.set_mode = set_mode;

    /**
     * Sets the internal reference to the old opacity of the ink track
     */
    function setOldOpac(val) {
        oldOpac = val;
    }
    that.setOldOpac = setOldOpac;

    /**
     * Similar to the retrieveOrigDims function, but uses a proxy variable.
     */
    function setOrigDims(proxy) {
        var kfx = initKeyframe.x;
        var kfy = initKeyframe.y;
        var kfw = initKeyframe.w;
        var real_kfw = origPaperW / kfw;
        var real_kfh = real_kfw * (proxy.h / proxy.w);
        var real_kfx = -kfx * real_kfw;
        var real_kfy = -kfy * real_kfh;
        origpx = real_kfx;
        origpy = real_kfy;
        origpw = real_kfw;
        origph = real_kfh;
        lastpx = origpx;
        lastpy = origpy;
        lastpw = origpw;
        lastph = origph;
    }
    that.setOrigDims = setOrigDims;

    function resetText() {
        datastring = "";
    }
    that.resetText = resetText;

    /**
     * Similar to add_attributes, gives text boxes drag functionality, drag handles, and undo/redo functionality.
     * @param textbox   the text box in question
     */
    function setTextAttributes(textbox) {
        var C1; //drag handles
        var rds = LADS.TourAuthoring.Constants.inkDragHandleRadius;
        var x = textbox.attrs.x,
            y = textbox.attrs.y,
            origposition = { x: 0, y: 0, },
            c1origposition = { x: 0, y: 0, },
            boundingBox = textbox.getBBox();
        var handlerad = LADS.TourAuthoring.Constants.inkDragHandleRadius;

        // set the positions of C1 and C2 using the styling of textbox
        C1 = paper.ellipse(x, y, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#ffffff", "fill": "#296B2F", "fill-opacity": 0.8 }).data("type", "grabHandle");
        C1.toFront();
        textbox.toFront();
        C1.data("curr_cx", C1.attr("cx"));
        C1.data("curr_cy", C1.attr("cy"));
        textbox.data({
            'x': x,
            'y': y,
        });

        // drag handler for C1 -- the pan handle.....
        C1.drag(function (dx, dy, mousex, mousey) { // move
            var circleRadius = C1.attr("rx");
            //Hard stops for textbox location in ink canvas
            if (origposition.x + dx <= circleRadius + 5) {
                dx = (circleRadius + 5) - origposition.x;
            }
            if (origposition.y + dy <= circleRadius + 5) {
                dy = (circleRadius + 5) - origposition.y;
            }
            if (origposition.x + dx >= canvwidth - (circleRadius + 5)) {
                dx = canvwidth - (circleRadius + 5) - origposition.x;
            }
            if (origposition.y + dy >= canvheight - (circleRadius + 5)) {
                dy = canvheight - (circleRadius + 5) - origposition.y;
            }

            var c1currx = parseInt(this.data("curr_cx"),10); // x position at the start of drag
            var c1curry = parseInt(this.data("curr_cy"),10);
            var xpos = c1currx + dx; // to get new x position, just add dx
            var ypos = c1curry + dy;
            this.attr({
                cx: xpos, // xcenter
                cy: ypos, // ycenter
            });

            // move the textbox
            textbox.attr("x", origposition.x + dx);
            textbox.attr("y", origposition.y + dy);
        },
        function (x, y) { // start -- record original positions
            origposition.x = parseFloat(textbox.attrs.x);
            origposition.y = parseFloat(textbox.attrs.y);

            var bbox = C1.getBBox();
            c1origposition.x = bbox.x;
            c1origposition.y = bbox.y;
            c1origposition.w = bbox.width;
            c1origposition.h = bbox.height;
        },
        function (x, y) { // stop -- deal with undo/redo functionality
            var c1bboxx = this.getBBox().x;
            var c1bboxy = this.getBBox().y;
            var c1bboxw = this.getBBox().width;
            var c1bboxh = this.getBBox().height;
            this.data("curr_cx", c1bboxx + c1bboxw / 2.0); // reset data using bounding box coords
            this.data("curr_cy", c1bboxy + c1bboxh / 2.0);

            textbox.data({
                "x": textbox.attrs.x,
                "y": textbox.attrs.y
            });

            var bboxx = parseFloat(textbox.attrs.x);
            var bboxy = parseFloat(textbox.attrs.y);

            c1bboxx = C1.getBBox().x;
            c1bboxy = C1.getBBox().y;
            c1bboxw = C1.getBBox().width;
            c1bboxh = C1.getBBox().height;

            var ox = origposition.x;
            var oy = origposition.y;
            var ow = origposition.w;
            var oh = origposition.h;

            var o1x = c1origposition.x;
            var o1y = c1origposition.y;
            var o1w = c1origposition.w;
            var o1h = c1origposition.h;

            var command = LADS.TourAuthoring.Command({
                execute: function () {
                    svgText.attr({ x: bboxx });
                    svgText.attr({ y: bboxy });
                    textbox.attr({ x: bboxx, y: bboxy });
                    textbox.data({ x: bboxx, y: bboxy });

                    C1.data("curr_cx", c1bboxx + c1bboxw / 2.0);
                    C1.data("curr_cy", c1bboxy + c1bboxh / 2.0);
                    C1.attr({
                        cx: c1bboxx + c1bboxw / 2.0,
                        cy: c1bboxy + c1bboxh / 2.0,
                        rx: c1bboxw / 2.0,
                        ry: c1bboxh / 2.0,
                    });
                },
                unexecute: function () {
                    svgText.attr({ x: ox });
                    svgText.attr({ y: oy });
                    textbox.attr({ x: ox, y: oy });
                    textbox.data({ x: ox, y: oy });

                    C1.data("curr_cx", o1x + o1w / 2.0);
                    C1.data("curr_cy", o1y + o1h / 2.0);
                    C1.attr({
                        cx: o1x + o1w / 2.0,
                        cy: o1y + o1h / 2.0,
                    });
                }
            });
            command.execute();
            inkUndoManager.logCommand(command);
        });
    }
    that.setTextAttributes = setTextAttributes;

    /**
     * Takes transparency bounding shapes and converts them to bezier paths
     * @param shapes     array of shapes to convert
     * @return    array of corresponding paths
     */
    function shapes_to_paths (shapes) {
        //takes in an array of shapes, returns an array of paths
        var cw = domelement.width();
        var ch = domelement.height();
        var paths = [];
        remove_all();/////////////////
        for (var i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            var path;
            var type = shape.type.toLowerCase();
            if (shape.type == "rect") { // in this case, bezier path is just four corners with bezier anchors along each segment
                var x = parseFloat(shape.X) / cw;
                var y = parseFloat(shape.Y) / ch;
                var w = parseFloat(shape.w) / cw;
                var h = parseFloat(shape.h) / ch;
                var xoff = 10.0 / cw;
                var yoff = 10.0 / ch;
                path = "M" + x + "," + y + "C" + (x + xoff) + "," + y + "," + (x + w - xoff) + "," + y + "," + (x + w) + "," + y + "C" + (x + w) + "," + (y + yoff) + "," + (x + w) + "," + (y + h - yoff) + "," + (x + w) + "," + (y + h) + "C" + (x + w - xoff) + "," + (y + h) + "," + (x + xoff) + "," + (y + h) + "," + (x) + "," + (y + h) + "C" + x + "," + (y + h - yoff) + "," + (x) + "," + (y + yoff) + "," + (x) + "," + (y) + "z";
            }
            else if (shape.type == "ellipse") { // bezier path is four points (north, east, south, west) with bezier anchors vertical/horizonal from the points a certain distance (given by the 'magic number' below)
                var cx = parseFloat(shape.cx) / cw;
                var cy = parseFloat(shape.cy) / ch;
                var rx = parseFloat(shape.rx) / cw;
                var ry = parseFloat(shape.ry) / ch;
                var k = (4.0 / 3.0) * (Math.sqrt(2) - 1); // 'magic number' defining bezier anchor coordinates for ellipses
                path = "M" + cx + "," + (cy - ry) + "C" + (cx + rx * k) + "," + (cy - ry) + "," + (cx + rx) + "," + (cy - ry * k) + "," + (cx + rx) + "," + cy + "C" + (cx + rx) + "," + (cy + ry * k) + "," + (cx + rx * k) + "," + (cy + ry) + "," + cx + "," + (cy + ry) + "C" + (cx - rx * k) + "," + (cy + ry) + "," + (cx - rx) + "," + (cy + ry * k) + "," + (cx - rx) + "," + cy + "C" + (cx - rx) + "," + (cy - ry * k) + "," + (cx - rx * k) + "," + (cy - ry) + "," + cx + "," + (cy - ry) + "z";
            }
            paths.push(path);
        }
        get_outer_path(paths);
        return paths;
    }
    that.shapes_to_paths = shapes_to_paths;

    /**
     * Debugging function; prints out the ink path in our ink track
     */
    function showInkPath() {
        try {
            console.log("showInkPath gives: " + inktrack.getInkPath());
        }
        catch (err) {
            console.log("error in showInkPath: " + err.message);
        }
    }
    that.showInkPath = showInkPath;

    /**
     * Scales a path representing a transparency/marquee.
     * @param pth               the path whose coordinates we'll scale
     * @param trans_factor_x    scale factor in x-direction
     * @param trans_factor_y    scale factor in y-direction
     * @return   scaled path
     */
    function transform_pathstring_marq (pth, trans_factor_x, trans_factor_y) {
        var nums = pth.match(/[0-9.\-]+/g); // gets coordinates from path
        var newpath = "";
        var j = 0, n = pth.length;
        for (var i = 0; i < n; i++) {
            if ((pth[i] == "M") || (pth[i] == "L")) { // if M or L, need to scale next two coords
                newpath = newpath + pth[i];
                newpath += (parseFloat(nums[j]) * trans_factor_x).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 1]) * trans_factor_y).toFixed(6);
                j = j + 2;
            }
            else if (pth[i] == "C") { // if C, need to scale next six coords
                newpath = newpath + pth[i];
                newpath += (parseFloat(nums[j]) * trans_factor_x).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 1]) * trans_factor_y).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 2]) * trans_factor_x).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 3]) * trans_factor_y).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 4]) * trans_factor_x).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 5]) * trans_factor_y).toFixed(6);
                j = j + 6;
            }
            else if (pth[i] == "z") { // if z, close path
                newpath += "z";
            }
        }
        return newpath;
    }
    that.transform_pathstring_marq = transform_pathstring_marq;

    /**
     * Returns a string giving all necessary information to recreate the current scene.
     * The result is stored in ink tracks as the 'datastring.' Also used throughout
     * InkAuthoring to make sure we have an up to date datastring. The formats for each
     * type of ink is given below (note that the trailing '[]' makes it easier to parse).
     * Note that the MARQUEE type is deprecated -- it has been replaced by TRANS type
     * transparencies represented by paths rather than collections of rectangles. The
     * BOUNDRECT and BOUNDELLIPSE types are for reloading rectangles and ellipses when we
     * edit transparencies (their formats are identical to RECT/ELLIPSE). All coordinates are relative.
     *
     *   PATH::[pathstring]<svg path string>[stroke]<color>[strokeo]<opacity>[strokew]<width>[]
     *   RECT::[x]<x>[y]<y>[w]<width>[h]<height>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
     *   ELLIPSE::[cx]<center x>[cy]<center y>[rx]<x radius>[ry]<y radius>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
     *   MARQUEE::[x]<x>[y]<y>[w]<width>[h]<height>[surrfillc]<fill color>[surrfillo]<fill opac>[]
     *   TEXT::[str]<text>[font]<font>[fontsize]<fontsize>[color]<font color>[x]<x>[y]<y>[w]<width>[h]<height>[]
     *   TRANS::[path]<path>[color]<color>[opac]<opac>[mode]<block or isolate>[]
     *   BOUNDRECT::[x]<x>[y]<y>[w]<width>[h]<height>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
     *   BOUNDELLIPSE::[cx]<center x>[cy]<center y>[rx]<x radius>[ry]<y radius>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
     *
     * @return    up to date datastring
     */
    function update_datastring () {
        var data_string = "";
        var canv_width = domelement.width();
        var canv_height = domelement.height();
        var pth;
        if (currpaths && currpaths !== "") { // add pen paths to datastring
            if (currpaths.split("Mundefined").length > 1)
                currpaths = currpaths.split("Mundefined").join("");
            data_string += currpaths;
        }
        if (trans_currpath && trans_currpath !== "") { // add transparency paths to datastring
            data_string += trans_currpath;
        }

        paper.forEach(function (elt) { // now check the canvas for rectangles, ellipses, text, old marquees
            if (elt.data("type") === "rect" && elt.data("visible") === "yes") {
                pth = "RECT::[x]" + rel_dims(elt.attr("x"), canv_width) + "[y]" + rel_dims(elt.attr("y"), canv_height);
                pth += "[w]" + rel_dims(elt.attr("width"), canv_width) + "[h]" + rel_dims(elt.attr("height"), canv_height);
                pth += "[fillc]" + elt.attr("fill") + "[fillo]" + elt.attr("fill-opacity");
                pth += "[strokec]" + elt.attr("stroke") + "[strokeo]" + elt.attr("stroke-opacity") + "[strokew]" + elt.attr("stroke-width") + "[]";
                data_string += pth + "|";
            }
            else if (elt.data("type") === "ellipse" && elt.data("visible") === "yes") {
                pth = "ELLIPSE::[cx]" + rel_dims(elt.attr("cx"), canv_width) + "[cy]" + rel_dims(elt.attr("cy"), canv_height);
                pth += "[rx]" + rel_dims(elt.attr("rx"), canv_width) + "[ry]" + rel_dims(elt.attr("ry"), canv_height);
                pth += "[fillc]" + elt.attr("fill") + "[fillo]" + elt.attr("fill-opacity");
                pth += "[strokec]" + elt.attr("stroke") + "[strokeo]" + elt.attr("stroke-opacity") + "[strokew]" + elt.attr("stroke-width") + "[]";
                data_string += pth + "|";
            }
            else if (elt.data("type") === "marquee") { //old marquees
                pth = "MARQUEE::[x]" + rel_dims(elt.attr("x"), canv_width);
                pth = pth + "[y]" + rel_dims(elt.attr("y"), canv_height);
                pth += "[w]" + rel_dims(elt.attr("width"), canv_width) + "[h]" + rel_dims(elt.attr("height"), canv_height);
                pth += "[surrfillc]" + elt.data("surr-fill") + "[surrfillo]" + elt.data("surr-opac") + "[]";
                data_string += pth + "|";
            }
            else if (elt.data("type") === "text") {
                pth = "TEXT::[str]" + elt.data("str")
                    + "[font]" + elt.data("font")
                    + "[fontsize]" + rel_dims(elt.data("fontsize"), canv_height) //scale font-size
                    + "[color]" + elt.data("color")
                    + "[x]" + rel_dims(elt.data("x"), canv_width)
                    + "[y]" + rel_dims(elt.data("y"), canv_height)
                    + "[w]" + elt.data('w')
                    + "[h]" + elt.data('h')
                    + "[]";
                data_string += pth + "|";
            }
        });
        datastring = data_string;
        return data_string;
    }
    that.update_datastring = update_datastring;

    /**
     * When we load in a path datastring, update ml, xy, and pa to reflect the new data.
     * @param str   the datastring loaded
     */
    function update_ml_xy_pa (str) {
        var i, j;

        // add info to ml and pa
        for (i = 0; i < str.length; i++) {
            if ((str[i] == "L") || (str[i] == "M")) {
                var cpth = str.substring(i).split("|")[0];
                var strokec = get_attr(cpth, "stroke", "s");
                var strokeo = get_attr(cpth, "strokeo", "f");
                var strokew = get_attr(cpth, "strokew", "f");
                ml.push(str[i]);
                pa.push({ "color": strokec, "opacity": strokeo, "width": strokew });
            }
        }

        // add info to xy (probably easier with regular expressions)
        var arr1 = str.split("L");
        for (i = 0; i < arr1.length; i++) {
            if (arr1[i].length > 0) {
                var arr2 = arr1[i].split("M");
                for (j = 0; j < arr2.length; j++) {
                    if (arr2[j].length > 0 && arr2[j].charAt(0) != 'P') {
                        var arr3 = arr2[j].split(",");
                        xy.push([parseFloat(arr3[0]), parseFloat(arr3[1])]);
                    }
                }
            }
        }
        click = false;
    }
    that.update_ml_xy_pa = update_ml_xy_pa;

    /**
     * The following are setters for various ink parameters
     * @param _    the value to be set to the corresponding ink parameter
     */
    function setPenColor(c) { penColor = (c[0] == '#') ? c : ("#" + c); }
    function setPenOpacity(o) { penOpacity = o; }
    function setPenWidth(w) { penWidth = w; }
    function setEraserWidth(w) { eraserWidth = w; }
    function setShapeStrokeColor(c) { shapeStrokeColor = (c[0] == '#') ? c : ("#" + c); }
    function setShapeStrokeOpacity(o) { shapeStrokeOpacity = o; }
    function setShapeStrokeWidth(w) { shapeStrokeWidth = w; }
    function setMarqueeFillColor(c) { marqueeFillColor = (c[0] == '#') ? c : ("#" + c); }
    function setMarqueeFillOpacity(o) { marqueeFillOpacity = o; }
    function setEnabled(en) { enabled = end; }
    function setFontFamily(f) {
        fontFamily = f;
        if (svgText) {
            svgText.attr({
                "font-family": fontFamily,
            });
            svgText.data({
                "font": fontFamily,
            });
        }
    }
    function setFontSize(f) {
        // set the value to "", change font size, reset the value so we can see the results in real-time
        fontSize = f;
        if (svgText) {
            svgText.attr({
                "font-size": fontSize
            });
            svgText.data({
                "fontsize": fontSize
            });
        }
    }
    function setFontColor(f) {
        fontColor = (f[0] == '#') ? f : ("#" + f);
        if (svgText) {
            svgText.attr({
                "fill": fontColor
            });
            svgText.data({
                "color": fontColor
            });
        }
    }
    function setFontOpacity(f) { fontOpacity = f; }
    function setTransMode(m) { trans_mode = m; }

    that.setPenColor = setPenColor;
    that.setPenOpacity = setPenOpacity;
    that.setPenWidth = setPenWidth;
    that.setEraserWidth = setEraserWidth;
    that.setShapeStrokeColor = setShapeStrokeColor;
    that.setShapeStrokeOpacity = setShapeStrokeOpacity;
    that.setShapeStrokeWidth = setShapeStrokeWidth;
    that.setMarqueeFillColor = setMarqueeFillColor;
    that.setMarqueeFillOpacity = setMarqueeFillOpacity;
    that.setEnabled = setEnabled;
    that.setFontFamily = setFontFamily;
    that.setFontSize = setFontSize;
    that.setFontColor = setFontColor;
    that.setFontOpacity = setFontOpacity;
    that.setTransMode = setTransMode;

    /**
     * The following are getters for different ink parameters.
     */
    function getPenColor() { return penColor; }
    function getPenOpacity() { return penOpacity; }
    function getPenWidth() { return penWidth; }
    function getEraserWidth() { return eraserWidth; }
    function getShapeStrokeColor() { return shapeStrokeColor; }
    function getShapeStrokeOpacity() { return shapeStrokeOpacity; }
    function getShapeStrokeWidth() { return shapeStrokeWidth; }
    function getMarqueeFillColor() { return marqueeFillColor; }
    function getMarqueeFillOpacity() { return marqueeFillOpacity; }
    function getEnabled() { return enabled; }
    function getFontFamily() { return fontFamily; }
    function getFontSize() { return fontSize; }
    function getFontColor() { return fontColor; }
    function getFontOpacity() { return fontOpacity; }
    function getTransMode() { return trans_mode; }

    that.getPenColor = getPenColor;
    that.getPenOpacity = getPenOpacity;
    that.getPenWidth = getPenWidth;
    that.getEraserWidth = getEraserWidth;
    that.getShapeStrokeColor = getShapeStrokeColor;
    that.getShapeStrokeOpacity = getShapeStrokeOpacity;
    that.getShapeStrokeWidth = getShapeStrokeWidth;
    that.getMarqueeFillColor = getMarqueeFillColor;
    that.getMarqueeFillOpacity = getMarqueeFillOpacity;
    that.getEnabled = getEnabled;
    that.getFontFamily = getFontFamily;
    that.getFontSize = getFontSize;
    that.getFontColor = getFontColor;
    that.getFontOpacity = getFontOpacity;
    that.getTransMode = getTransMode;

    /**
     * The following are essentially setters, but they take in an id, grab the
     * value of the dom element with that id, and set the correct variable accordingly
     * @param id   the id of the dom element whose value we want to use
     */
    function updatePenColor(id) {
        var val = document.getElementById(id).value;
        //console.log("col = " + val);
        if (val !== undefined) {
            if (val.indexOf("#") == -1)
                val = "#" + val;
            penColor = val;
        }
    }
    function updatePenOpacity(id) {
        var val = document.getElementById(id).value;
        //console.log("opac = " + val);
        if (val !== undefined)
            penOpacity = val;
    }
    function updatePenWidth(id) {
        var val = document.getElementById(id).value;
        //console.log("wid = " + val);
        if (val !== undefined)
            penWidth = val;
    }
    function updateEraserWidth(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined)
            eraserWidth = val;
    }
    function updateShapeStrokeColor(id) {
        var val = document.getElementById(id).value;
        if (val.length === 6) {
            shapeStrokeColor = "#" + val;
        }
    }
    function updateShapeStrokeOpacity(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined)
            shapeStrokeOpacity = val;
    }
    function updateShapeStrokeWidth(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined)
            shapeStrokeWidth = val;
    }
    function updateShapeFillColor(id) {
        var val = document.getElementById(id).value;
        if (val.length === 6)
            shapeFillColor = "#" + val;
    }
    function updateShapeFillOpacity(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined)
            shapeFillOpacity = val;
    }
    function updateMarqueeColor(id) {
        var val = document.getElementById(id).value;
        if (val.length === 6)
            marqueeFillColor = val;
    }
    function updateMarqueeOpacity(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined)
            marqueeFillOpacity = val;
    }
    function updateFontFamily(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined) {
            fontFamily = val;
        }
    }
    function updateFontSize(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined) {
            fontSize = parseFloat(val);
        }
    }
    function updateFontColor(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined) {
            if (val.indexOf("#") == -1)
                val = "#" + val;
            fontColor = val;
        }
    }
    function updateFontOpacity(id) {
        var val = document.getElementById(id).value;
        if (val !== undefined) {
            fontOpacity = val;
        }
    }

    that.updatePenColor = updatePenColor;
    that.updatePenOpacity = updatePenOpacity;
    that.updatePenWidth = updatePenWidth;
    that.updateEraserWidth = updateEraserWidth;
    that.updateShapeStrokeColor = updateShapeStrokeColor;
    that.updateShapeStrokeOpacity = updateShapeStrokeOpacity;
    that.updateShapeFillColor = updateShapeFillColor;
    that.updateShapeFillOpacity = updateShapeFillOpacity;
    that.updateMarqueeColor = updateMarqueeColor;
    that.updateMarqueeOpacity = updateMarqueeOpacity;
    that.updateFontFamily = updateFontFamily;
    that.updateFontSize = updateFontSize;
    that.updateFontColor = updateFontColor;
    that.updateFontOpacity = updateFontOpacity;

    // allow drawing on the Raphael paper by recording mouse locations on mousemove events, add coordinates to xl (similar with erase)
    var old_ml = [], old_xy = [], old_pa = [], canvwidth, canvheight;
    domelement.mousedown(function (e) { // on mousedown, set old_* (used later for undo/redo), push the coordinate of the event as the start point of the path (or call erase)
        canvwidth = domelement.width();
        canvheight = domelement.height();
        click = true;

        switch (mode) {
            case 1:
                old_ml = ml.slice(0);
                old_xy = xy.slice(0);
                old_pa = pa.slice(0);
                console.log("in mouseup, old_ml.length = " + old_ml.length);
                ml.push('M');
                xy.push([e.offsetX / canvwidth, e.offsetY / canvheight]);
                pa.push({ "color": penColor, "opacity": penOpacity, "width": penWidth/canvheight });
                ml.push('L'); //to allow drawing single dots
                xy.push([e.offsetX / canvwidth, e.offsetY / canvheight]);
                pa.push({ "color": penColor, "opacity": penOpacity, "width": penWidth/canvheight });
                drawPaths();
                break;
            case 2:
                old_ml = ml.slice(0);
                old_xy = xy.slice(0);
                old_pa = pa.slice(0);
                erase([e.offsetX, e.offsetY]);
                break;
        }
    }).mouseup(function (e) { // deal with undo/redo functionality here
        console.log("in mouseup, old_ml.length = " + old_ml.length);
        click = false;
        if (mode == 1 || mode == 2) {
            var old_lists = { ml: old_ml, xy: old_xy, pa: old_pa };
            var new_lists = { ml: ml, xy: xy, pa: pa };
            var command = LADS.TourAuthoring.Command({
                execute: function () {
                    ml = new_lists.ml.slice(0);
                    xy = new_lists.xy.slice(0);
                    pa = new_lists.pa.slice(0);
                    drawPaths();
                },
                unexecute: function () {
                    ml = old_lists.ml.slice(0);
                    xy = old_lists.xy.slice(0);
                    pa = old_lists.pa.slice(0);
                    drawPaths();
                }
            });
            command.execute();
            inkUndoManager.logCommand(command);
        }
    }).mouseenter(function() { // change cursor styling here
        if ((mode == 1) || (mode == 2)) {
            domelement.css('cursor', 'crosshair');
        }
        else {
            domelement.css('cursor', 'pointer');
        }
    }).mouseleave(function () {
        if (click === true) {
            click = false;
        }
    }).mousemove(function (e) { // on mousemove, either record coordinates in xy or send coordinates into erase function
        if (click) {
            switch (mode) {
                case 1:
                    ml.push('L');
                    xy.push([e.offsetX / canvwidth, e.offsetY / canvheight]);
                    pa.push({ "color": penColor, "opacity": penOpacity, "width": penWidth/canvheight });
                    drawPaths();
                    break;
                case 2:
                    erase([e.offsetX, e.offsetY]);
                    break;
            }
        }
    }).hover(function (e) {
        if (mode == 1) {
            domelement.css('cursor', 'crosshair');
        }
    });

    


    return that;
};