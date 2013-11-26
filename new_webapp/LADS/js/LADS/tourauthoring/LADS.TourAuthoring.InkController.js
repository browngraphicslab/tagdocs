LADS.Util.makeNamespace("LADS.TourAuthoring.InkController");

LADS.TourAuthoring.InkController = (function (canvasid) {
    "use strict";

    var that = {};

    //init();
    //function init(canvId) { //similar to old 'load' function
    //    //sets up the inkAuthoring object, which allows drawing
    //    iA = new inkController(canvId);
    //    paper = iA.paper;
    //    datastring = "";
    //    currpaths = "";
    //    click = false;
    //    set_mode(1);
    //};

    function inkController(canvId) {
        /**
         * definition of the inkAuthoring class members:
         *   paper -- a Raphael object (a canvas to draw on) fit to the div specified by canvasId
         *   loadInk -- loads an Ink to the canvas using the string format specified in update_datastring() below
         *   getters and setters for different Ink attributes
         *   update functions which take in DOM element IDs and use the settings stored in their values
         */
        // member variables //
        this.canvid = canvId;
        this.cw = $("#" + this.canvid).css("width");
        this.ch = $("#" + this.canvid).css("height");
        this.paper = Raphael(this.canvid, "100%", "100%");
        
        this.penColor = "#ffffff";
        this.penOpacity = 1.0;
        this.penWidth = 4;
        this.eraserWidth = 5;
        this.shapeStrokeColor = "#000000";
        this.shapeStrokeOpacity = 1.0;
        this.shapeStrokeWidth = 0;
        this.shapeFillColor = "#000000";
        this.shapeFillOpacity = 0.5;
        this.marqueeFillColor = "#000000";
        this.marqueeFillOpacity = 0.8;

        this.marquees = [];
        this.marquees_on = 1;
        this.click = false;
        this.ml = [];
        this.xy = [];
        this.paths = [];
        this.pathObjects = [];
        this.currpaths = ""; //this will be the string representing all of our paths; to get the paths individually, split at 'M'
        this.pathattrs = "";
        this.datastring = "";
        this.mode = 1;

        // methods //
        var self = this;
        this.add_attributes = function (elt, fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWidth) {
            //adds drag event handlers, color attributes, etc to rectangles and ellipses
            //console.log("add_attributes called");
            var gl;
            var resize = 0; //if 1, we are in zoom mode rather than pan mode
            var noglow = 0; //if 1, glowing is disabled
            var origmousex;
            var origmousey;

            if (fillColor == undefined)
                fillColor = self.shapeFillColor; //FIX THESE!!!!
            if (fillOpacity == undefined)
                fillOpacity = self.shapeFillOpacity;
            if (strokeColor == undefined)
                strokeColor = self.shapeStrokeColor;
            if (strokeOpacity == undefined)
                strokeOpacity = self.shapeStrokeOpacity;
            if (strokeWidth == undefined)
                strokeWidth = self.shapeStrokeWidth;

            //console.log("fc=" + fillColor + ", fo=" + fillOpacity + ", sc=" + strokeColor + ", so=" + strokeOpacity + ", sw=" + strokeWidth);

            elt.mouseover(function () { //glowing
                if (!noglow && (mode == 0)) {
                    gl = elt.glow({ "width": 15, "color": "#33ff00", "opacity": 0.8 });
                }
            })
            elt.mouseout(function () {
                if (mode == 0) {
                    gl.remove();
                }
            })
            elt.attr({ //color attributes
                "stroke-width": strokeWidth,
                "stroke": strokeColor,
                "stroke-opacity": strokeOpacity,
                "fill": fillColor,
                "fill-opacity": fillOpacity
            });

            //the drag handler looks like: drag(move, start, stop,...)
            elt.drag(function (dx, dy, mousex, mousey) {
                if (!mode) {
                    this.toFront();
                    if (!resize) {
                        //drag an element
                        var currx = parseInt(this.data("currx"));//x position at the start of drag
                        var curry = parseInt(this.data("curry"));
                        var xpos = currx + dx; //to get new x position, just add dx
                        var ypos = curry + dy;
                        this.attr({
                            cx: xpos + parseInt(this.data("curr_rx")), //xcenter is left+xradius
                            cy: ypos + parseInt(this.data("curr_ry")), //ycenter is top+yradius
                            x: xpos,
                            y: ypos
                        });
                    }
                    else {
                        //resize an element
                        var bbox = this.getBBox();
                        this.attr({
                            cx: bbox.x + bbox.width * 0.5 + (mousex - origmousex) * 0.5,
                            cy: bbox.y + bbox.height * 0.5 + (mousey - origmousey) * 0.5,
                            rx: bbox.width / 2.0 + (mousex - origmousex) * 0.5,
                            ry: bbox.height / 2.0 + (mousey - origmousey) * 0.5,
                            width: bbox.width + mousex - origmousex,
                            height: bbox.height + mousey - origmousey
                        });
                    }
                    origmousex = mousex;
                    origmousey = mousey;
                }
            }, function (x, y) { //onstart
                //console.log("mode = " + mode);
                if (!mode) {

                    origmousex = x;
                    origmousey = y;
                    var bbox = this.getBBox();
                    console.log("bbox.height = " + bbox.height);
                    resize = 0;
                    var canvx = 0;// parseInt($("#" + canvId).css("left"));
                    var canvy = 0;//parseInt($("#" + canvId).css("top"));
                    console.log("canvx=" + canvx + ", canvy=" + canvy, ", bbox.x=" + bbox.x + ", bbox.width=" + bbox.width);
                    if ((x > (bbox.x + bbox.width * 0.5 + canvx)) && (y > (bbox.y + bbox.height * 0.5 + canvy))) {
                        resize = 1;
                    }
                    gl.remove();
                    noglow = 1;
                    this.animate({ opacity: .25 }, 500, "<>");
                }
                console.log("at end of start");
            }, function () { //onstop
                console.log("at beginning of stop");
                if (!mode) {
                    this.data("currx", this.getBBox().x); //reset data using bounding box coords
                    this.data("curry", this.getBBox().y);
                    this.data("curr_rx", this.getBBox().width / 2.0);
                    this.data("curr_ry", this.getBBox().height / 2.0);
                    noglow = 0;
                    resize = 0;
                    this.animate({ opacity: 1 }, 500, "<>");
                }
            });
        }
        this.add_marq_attributes = function(marq, marqFillColor, marqFillOpacity) {
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
            var w = parseInt($('#' + self.canvid).css("width"));
            var h = parseInt($('#' + self.canvid).css("height"));
            var mode = self.mode;
            //console.log("w=" + w + ", h=" + h);
            if (marqFillColor == undefined)
                marqFillColor = self.marqueeFillColor;////////FIX "#" + document.getElementById("marq_color").value;
            if (marqFillOpacity == undefined)
                marqFillOpacity = self.marqueeFillOpacity;/////FIX document.getElementById("marq_opacity").value;

            elt.mouseover(function () {
                if (!noglow && (mode == 3)) {
                    gl = elt.glow({ "width": 10, "color": "#33ff00", "opacity": .8 });
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
            var mset = self.paper.set();
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
                        var currx = parseInt(this.data("currx"));//x position at the start of drag
                        var curry = parseInt(this.data("curry"));
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
                        })
                        marq.rw.attr({
                            y: ypos,
                            width: xpos,
                            height: bbox.height
                        })

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
                        })
                        marq.rw.attr({
                            height: bbox.height + mousey - origmousey
                        })
                    }
                    origmousex = mousex;
                    origmousey = mousey;
                }
            }, function (x, y) {
                //onstart
                if (mode == 3) {
                    origmousex = x;
                    origmousey = y;
                    var bbox = this.getBBox();
                    if ((x > (bbox.x + bbox.width * 0.5)) && (y > (bbox.y + bbox.height * 0.5))) {
                        resize = 1;
                    }
                    gl.remove();
                    noglow = 1;
                    this.animate({ opacity: .25 }, 500, "<>");
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
        this.add_ellipse = function () {
            self.set_mode(0);
            console.log("setting cx and cy for the ellipse");
            var x = 100;//Math.floor(Math.random() * 300);
            var y = 100;//Math.floor(Math.random() * 300);
            var rx = 50;//20 + Math.floor(Math.random() * 40);
            var ry = 50;//20 + Math.floor(Math.random() * 40);
            var ellipse = self.paper.ellipse(x, y, rx, ry);
            ellipse.data("currx", ellipse.getBBox().x);
            ellipse.data("curry", ellipse.getBBox().y);
            ellipse.data("curr_rx", rx);
            ellipse.data("curr_ry", ry);
            ellipse.data("type", "ellipse");
            self.add_attributes(ellipse);
        }
        this.add_rectangle = function() {
            self.set_mode(0);
            var x = Math.floor(Math.random() * 300);
            var y = Math.floor(Math.random() * 300);
            var rect = self.paper.rect(x, y, 50, 50);
            rect.data("currx", x);
            rect.data("curry", y);
            rect.data("type", "rect");
            self.add_attributes();
        }
        this.add_marquee = function() {
            self.set_mode(3);
            console.log("mode = " + mode);
            var topx = 200 + Math.floor(Math.random() * 10), botx = 300 + Math.floor(Math.random() * 10), topy = 200 + Math.floor(Math.random() * 10), boty = 300 + Math.floor(Math.random() * 10);
            var w = parseInt($('#' + self.canvid).css("width"));
            var h = parseInt($('#' + self.canvid).css("height"));
            var rn = self.paper.rect(0, 0, w, topy);
            rn.data("currx", 0);
            rn.data("curry", 0);
            var re = self.paper.rect(botx, topy, w - botx, boty - topy);
            re.data("currx", botx);
            re.data("curry", topy);
            var rs = self.paper.rect(0, boty, w, h - boty);
            rs.data("currx", 0);
            rs.data("curry", boty);
            var rw = self.paper.rect(0, topy, topx, boty - topy);
            rw.data("currx", 0);
            rw.data("curry", topy);
            var rc = self.paper.rect(topx, topy, botx - topx, boty - topy);
            rc.data("currx", topx);
            rc.data("curry", topy);
            rc.data("type", "marquee");
            var m = new marquee(rn, re, rs, rw, rc);
            self.add_marq_attributes(canvId, rpaper, m);
            marquees.push(m);
            self.show_marquees();
            marquees_on = 1;
        }
        this.drawPaths = function(paths, strokeColor, strokeOpacity, strokeWidth) {
            if (paths == undefined) {
                var len = pathObjects.length;
                for (var i = 0; i < pathObjects.length; i++) { //removes paths from canvas
                    pathObjects[i].remove();
                }
                for (var i = 0; i < len; i++) { //clears the pathObjects array
                    pathObjects.shift();
                }
                for (var i = 0; i < ml.length; i++) { //constructs the path
                    if (ml[i] !== 'X') {
                        paths += ml[i] + xy[i][0] + ',' + xy[i][1];;
                    }
                }
            }
            if (strokeColor == undefined)
                strokeColor = self.penColor;
            if (strokeOpacity == undefined)
                strokeOpacity = self.penOpacity
            if (strokeWidth == undefined)
                strokeWidth = self.penWidth;

            //removes all objects in pathObjects to be redrawn
            if (paths.length > 0) {
                var path = paths.split('M');
            }
            for (var i = 1; i < path.length; i++) {
                var drawing = self.paper.path('M' + path[i]);
                drawing.data("type", "path");
                drawing.attr({
                    "stroke-width": strokeWidth,
                    "stroke-opacity": strokeOpacity,
                    "stroke": strokeColor,
                    "stroke-linejoin": "round",
                    "stroke-linecap": "round"
                });
                drawing.toFront();
                pathObjects.push(drawing);
            }
            currpaths = paths;
            pathattrs = "[stroke]" + strokeColor + "[strokeo]" + strokeOpacity + "[strokew]" + strokeWidth;
        }
        this.erase = function (location) {
            var range = 5;////FIX parseInt(document.getElementById("eraser_width").value);
            for (var i = 0; i < xy.length; i++) {
                if (location[0] - range <= xy[i][0] && xy[i][0] <= location[0] + range) {
                    if (location[1] - range <= xy[i][1] && xy[i][1] <= location[1] + range) {
                        if (ml[i + 1] === 'L') {
                            ml[i + 1] = 'M';
                        }
                        ml.splice(i, 1);
                        xy.splice(i, 1);
                        self.drawPaths();
                    }
                }
            }
        }
        this.hide_marquees = function() {
            var i;
            var len = marquees.length;
            for (i = 0; i < len; i++) {
                marquees[i].rn.hide();
                marquees[i].re.hide();
                marquees[i].rs.hide();
                marquees[i].rw.hide();
                marquees[i].rc.hide();
            }
        }
        this.show_marquees = function() {
            var i;
            var len = self.marquees.length;
            for (i = 0; i < len; i++) {
                var m = self.marquees[i];
                m.rn.show();
                m.re.show();
                m.rs.show();
                m.rw.show();
                m.rc.show();
            }
        }
        this.toggle_marquees = function() {
            self.marquees_on = 1 - self.marquees_on;
            if (self.marquees_on) {
                self.show_marquees();
            }
            else {
                self.hide_marquees();
            }
        }
        this.get_attr = function (str, attr, parsetype) {
            //parse=="s": return as string, parse=="i": return as int, parse=="f": return as float
            if (parsetype == undefined)
                parsetype = "f";

            if (parsetype == "s")
                return str.split("[" + attr + "]")[1].split("[")[0];
            else if (parsetype == "i")
                return parseInt(str.split("[" + attr + "]")[1].split("[")[0]);
            else
                return parseFloat(str.split("[" + attr + "]")[1].split("[")[0]);
        }
        this.rel_dims = function(abs_dim, canv_dim) {
            return parseFloat(abs_dim) / canv_dim;
        }
        this.abs_dims = function(rel_dim, canv_dim) {
            return parseFloat(rel_dim) * canv_dim;
        }
        this.discard = function() {
            remove_all(self.canvid, self.paper);
            self.paper = Raphael(0, 0, 0, 0);
        }
        this.set_mode = function(i) {
            i = parseInt(i);
            if ((i < 1) || (i > 3)) {
                self.mode = 0;
            }
            else {
                self.mode = i;
            }
        }
        this.transform_pathstring = function(currpaths, trans_factor_x, trans_factor_y, rnd) {
            //the trans_factors will be 1/w, 1/h if we are going from absolute to relative
            //to keep representations short, currently only storing three decimal points
            if (rnd == undefined) { rnd = 0; }
            else { rnd = 1; }

            var currpaths = self.currpaths;
            var nums = currpaths.match(/[0-9.]+/g);
            var newpath = "";
            var j = 0, i = 0, n = currpaths.length;
            for (i = 0; i < n; i++) {
                if ((currpaths[i] == "M") || (currpaths[i] == "L")) {
                    if (rnd) {
                        //alert(newpath);
                        newpath = newpath + currpaths[i] + Math.round(parseFloat(nums[j]) * trans_factor_x) + ",";
                        newpath += Math.round(parseFloat(nums[j + 1]) * trans_factor_y);
                    }
                    else {
                        newpath = newpath + currpaths[i] + (parseFloat(nums[j]) * trans_factor_x).toFixed(3) + ",";
                        newpath += (parseFloat(nums[j + 1]) * trans_factor_y).toFixed(3);
                    }
                    j = j + 2;
                }
            }
            return newpath;
        }
        this.update_datastring = function() {
            /*
              Returns a string giving all necessary information to recreate the current scene.
              This is helpful for saving Inks to be loaded later. The format is as follows:
                -Pen paths are all stored together in the substring
                
                    PATH::[pathstring]<Raphael-format path string>[stroke]<stroke color>\
                          [strokeo]<stroke opacity[strokew]strokeWidth[]
                          
                 The trailing '[]' makes it easier to parse this string.
                -Rectangles are stored individually in the following format:
                    
                    RECT::[x]<top corner x>[y]<top corner y>[w]<width>[h]<height>\
                          [fillc]<fill color>[fillo]<fill opacity>[strokec]<stroke color>\
                          [strokeo]<stroke opacity>[strokew]<stroke width>[]
                          
                -Ellipses are stored individually in the following format:
                
                    ELLIPSE::[cx]<center x>[cy]<center y>[rx]<x radius>[ry]<y radius>\
                             [fillc]<fill color>[fillo]<fill opacity>[strokec]<stroke color>\
                             [strokeo]<stroke opacity>[strokew]<stroke width>[]
                             
                -The substrings are separated by "|" characters.
            */
            //document.getElementById("test_layers_div").innerHTML = "";
            datastring = "";
            var currpaths = self.currpaths;
            var canv_height = parseFloat($("#" + self.canvid).css("width"));
            var canv_height = parseFloat($("#" + self.canvid).css("height"));
            if (currpaths != "") {
                var nound = currpaths;
                if (currpaths.split("undefined").length > 1)
                    nound = currpaths.split("undefined")[1]
                var newpath = transform_pathstring(nound, 1.0 / canv_height, 1.0 / canv_width);

                var pth = "PATH::[pathstring]" + newpath + pathattrs + "[]";
                datastring += pth + "|";
            }
            paper.forEach(function (elt) {
                if (elt.data("type") == "rect") {

                    var pth = "RECT::[x]" + self.rel_dims(elt.attr("x"), canv_width) + "[y]" + self.rel_dims(elt.attr("y"), canv_height);
                    pth += "[w]" + self.rel_dims(elt.attr("width"), canv_width) + "[h]" + self.rel_dims(elt.attr("height"), canv_height);
                    pth += "[fillc]" + elt.attr("fill") + "[fillo]" + elt.attr("fill-opacity");
                    pth += "[strokec]" + elt.attr("stroke") + "[strokeo]" + elt.attr("stroke-opacity") + "[strokew]" + elt.attr("stroke-width") + "[]";

                    datastring += pth + "|";
                }
                else if (elt.data("type") == "ellipse") {

                    var pth = "ELLIPSE::[cx]" + self.rel_dims(elt.attr("cx"), canv_width) + "[cy]" + self.rel_dims(elt.attr("cy"), canv_height);
                    pth += "[rx]" + self.rel_dims(elt.attr("rx"), canv_width) + "[ry]" + self.rel_dims(elt.attr("ry"), canv_height);
                    pth += "[fillc]" + elt.attr("fill") + "[fillo]" + elt.attr("fill-opacity");
                    pth += "[strokec]" + elt.attr("stroke") + "[strokeo]" + elt.attr("stroke-opacity") + "[strokew]" + elt.attr("stroke-width") + "[]";

                    datastring += pth + "|";
                }
                else if (elt.data("type") == "marquee") {

                    var pth = "MARQUEE::[x]" + self.rel_dims(elt.attr("x"), canv_width) + "[y]" + self.rel_dims(elt.attr("y"), canv_height);
                    pth += "[w]" + self.rel_dims(elt.attr("width"), canv_width) + "[h]" + self.rel_dims(elt.attr("height"), canv_height);
                    pth += "[surrfillc]" + elt.data("surr-fill") + "[surrfillo]" + elt.data("surr-opac") + "[]";
                
                    datastring += pth + "|";
                }
            });
            return datastring;
        }
        this.clearAndLoadInk = function (datastr) {
            remove_all(canvId, PAPER);
            this.loadInk(datastr);
        }
        this.resizePaper = function (width, height) {
            PAPER.setSize(width, height);
        }
        this.remove_all = function() {
            //removes all Raphael elements from the canvas
            self.paper.clear();
            //rpaper = Raphael(document.getElementById("#"+canvId), "100%", "100%");//500, 500);
            ml.length=0;
            xy.length=0;
            paths.length=0;
            pathObjects.length=0;
            marquees.length=0;
            currpaths="";
            self.update_datastring();
        }
        this.update_ml_xy = function(str) {
            /*
              When we load a pen path, we need to add its information to the ml and
              xy arrays.
            */

            var i, j;

            //add info to ml
            for (i = 0; i < str.length; i++) {
                if ((str[i] == "L") || (str[i] == "M")) {
                    self.ml.push(str[i]);
                }
            }

            //add info to xy
            var arr1 = str.split("L");
            for (i = 0; i < arr1.length; i++) {
                if (arr1[i].length > 0) {
                    var arr2 = arr1[i].split("M");
                    for (j = 0; j < arr2.length; j++) {
                        if (arr2[j].length > 0) {
                            var arr3 = arr2[j].split(",");
                            self.xy.push([arr3[0], arr3[1]]);
                        }
                    }
                }
            }
            self.click = false;
        }
        this.manipCanvas = function() {
            setDraggable(true);
        }
        this.setDraggable = function(option) {
            if (option === true) {
                self.set_mode(4);
                $("#" + self.canvid).draggable({ disabled: false });
                $("#" + self.canvid).resizable({ disabled: false });
            }
            else {
                //console.log("set not draggable");
                $("#" + self.canvid).draggable({ disabled: true });
                $("#" + self.canvid).resizable({ disabled: true });
                //CSS bug, sets undraggable opacity to 0.35
                $("#" + self.canvid).css({ opacity: 1 });
            }
        }
        this.resizeObjects = function(scale_x, scale_y) {
            self.paper.forEach(function (elt) {
                if (elt.data("type") != "path") {
                    elt.attr({
                        x: elt.attr("x") * scale_x,
                        y: elt.attr("y") * scale_y,
                        cx: elt.attr("cx") * scale_x,
                        cy: elt.attr("cy") * scale_y,
                        rx: elt.attr("rx") * scale_x,
                        ry: elt.attr("ry") * scale_y,
                        width: elt.attr("width") * scale_x,
                        height: elt.attr("height") * scale_y,
                    });

                    if (elt.data("type") == "ellipse") {
                        elt.data("currx", elt.attr("cx") - elt.attr("rx"));
                        elt.data("curry", elt.attr("cy") - elt.attr("ry"));
                        elt.data("curr_rx", elt.attr("rx"));
                        elt.data("curr_ry", elt.attr("ry"));
                    }
                    else {
                        elt.data("currx", elt.attr("x"));
                        elt.data("curry", elt.attr("y"));
                    }
                    var gl = elt.glow({ "width": 15, "color": "#33ff00", "opacity": 0.8 });
                    gl.remove();
                }
            });
            for (var i = 0; i < self.xy.length; i++) {
                self.xy[i][0] = self.xy[i][0] * scale_x;
                self.xy[i][1] = self.xy[i][1] * scale_y;
            }
            for (var i = 0; i < pathObjects.length; i++) {
                self.pathObjects[i].scale(scale_x, scale_y, 0, 0);
            }
        }


        this.loadInk = function (datastr) {
            // load an ink from the input string of data (formats given below)
            var shapes = datastr.split("|");
            var i;
            var cw = self.cw;
            var ch = self.ch;
            for (i = 0; i < shapes.length; i++) {
                var shape = shapes[i];
                var type = shape.split("::")[0];
                type = type.toLowerCase();
                switch (type) {
                    case "rect":
                        //format: [x]73[y]196[w]187[h]201[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                        var x = abs_dims(get_attr(shape, "x"), cw);
                        var y = abs_dims(get_attr(shape, "y"), ch);
                        var w = abs_dims(get_attr(shape, "w"), cw);
                        var h = abs_dims(get_attr(shape, "h"), ch);

                        var fillc = get_attr(shape, "fillc", "s");
                        var fillo = get_attr(shape, "fillo", "f");
                        var strokec = get_attr(shape, "strokec", "s");
                        var strokeo = get_attr(shape, "strokeo", "f");
                        var strokew = get_attr(shape, "strokew");
                        var R = self.paper.rect(x, y, w, h);
                        R.data("currx", x);
                        R.data("curry", y);
                        R.data("type", "rect");
                        add_attributes(R, fillc, fillo, strokec, strokeo, strokew);
                        break;
                    case "ellipse":
                        //format: [cx]81[cy]131[rx]40[ry]27[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                        var cx = abs_dims(get_attr(shape, "cx"), cw);
                        var cy = abs_dims(get_attr(shape, "cy"), ch);
                        var rx = abs_dims(get_attr(shape, "rx"), cw);
                        var ry = abs_dims(get_attr(shape, "ry"), ch);

                        var fillc = get_attr(shape, "fillc", "s");
                        var fillo = get_attr(shape, "fillo", "f");
                        var strokec = get_attr(shape, "strokec", "s");
                        var strokeo = get_attr(shape, "strokeo", "f");
                        var strokew = get_attr(shape, "strokew");
                        var E = self.paper.ellipse(cx, cy, rx, ry);
                        E.data("currx", E.getBBox().x);
                        E.data("curry", E.getBBox().y);
                        E.data("curr_rx", rx);
                        E.data("curr_ry", ry);
                        E.data("type", "ellipse");
                        add_attributes(E, fillc, fillo, strokec, strokeo, strokew);
                        break;
                    case "marquee":
                        //format: [x]206[y]207[w]102[h]93[surrfillc]#222222[surrfillo].8[]
                        //where surrfillc and surrfillo define the color and opacity of the surrounding rects
                        var topx = abs_dims(get_attr(shape, "x"), cw);
                        var topy = abs_dims(get_attr(shape, "y"), ch);
                        var w = abs_dims(get_attr(shape, "w"), cw);
                        var h = abs_dims(get_attr(shape, "h"), ch);

                        var surrfillc = get_attr(shape, "surrfillc", "s");
                        var surrfillo = get_attr(shape, "surrfillo", "f");
                        var botx = topx + w;
                        var boty = topy + h;
                        var rn = self.paper.rect(0, 0, cw, topy);
                        rn.data("currx", 0);
                        rn.data("curry", 0);
                        var re = self.paper.rect(botx, topy, cw - botx, boty - topy);
                        re.data("currx", botx);
                        re.data("curry", topy);
                        var rs = self.paper.rect(0, boty, cw, ch - boty);
                        rs.data("currx", 0);
                        rs.data("curry", boty);
                        var rw = self.paper.rect(0, topy, topx, boty - topy);
                        rw.data("currx", 0);
                        rw.data("curry", topy);
                        var rc = self.paper.rect(topx, topy, botx - topx, boty - topy);
                        rc.data("currx", topx);
                        rc.data("curry", topy);
                        rc.data("type", "marquee");
                        var m = new marquee(rn, re, rs, rw, rc);
                        self.add_marq_attributes(m, surrfillc, surrfillo);
                        self.marquees.push(m);
                        self.show_marquees();
                        self.marquees_on = 1;
                        break;
                    case "path":
                        //format: [pathstring]M284,193L284,193[stroke]000000[strokeo]1[strokew]10[]
                        var pathstring = get_attr(shape, "pathstring", "s");
                        var strokec = get_attr(shape, "stroke", "s");
                        var strokeo = get_attr(shape, "strokeo", "f");
                        var strokew = get_attr(shape, "strokew");
                        self.currpaths = self.transform_pathstring(pathstring, cw, ch, "round");
                        self.update_ml_xy(self.currpaths);
                        self.drawPaths(self.currpaths, strokec, strokeo, strokew);
                        break;
                }
            }
        };

        // allow drawing on the Raphael paper
        var self = this;
        $("#" + self.canvid).mousedown(function (e) {
            self.click = true;
            // console.log("mousedown");
            switch (mode) {
                case 1:
                    console.log("mousedown case 1");
                    self.ml.push('M');
                    self.xy.push([e.offsetX, e.offsetY]);
                    self.ml.push('L'); //to allow drawing single dots
                    self.xy.push([e.offsetX, e.offsetY]);
                    self.drawPaths();
                    break;
                case 2:
                    self.erase([e.offsetX, e.offsetY]);
                    break;
            }
            //update_datastring();
        }).mouseup(function () {
            self.click = false;
        }).mouseleave(function () {
            if (self.click === true) {
                self.click = false;
            }
        }).mousemove(function (e) {
            //console.log("mousemove");
            if ((self.mode == 1) || (self.mode == 2)) {
                $("#" + self.canvid).css('cursor', 'crosshair');
            }
            else {
                $("#" + self.canvid).css('cursor', 'pointer');
            }
            if (self.click === false)
                return;
            switch (self.mode) {
                case 1:
                    self.ml.push('L');
                    self.xy.push([e.offsetX, e.offsetY]);
                    self.drawPaths();
                    break;
                case 2:
                    self.erase([e.offsetX, e.offsetY]);
                    break;
            }
        }).hover(function (e) {
            if (self.mode == 1) {
                $("#" + self.canvid).css('cursor', "pointer");
            }
        });

        this.setPenColor = function (c) { console.log("setting pen color to " + c); this.penColor = c; };
        this.setPenOpacity = function (o) { console.log("setting pen opacity to " + o); this.penOpacity = o; };
        this.setPenWidth = function (w) { console.log("setting pen width to " + w); this.penWidth = w; };
        this.setEraserWidth = function (w) { this.eraserWidth = w; };
        this.setShapeStrokeColor = function (c) { this.shapeStrokeColor = c; };
        this.setShapeStrokeOpacity = function (o) { this.shapeStrokeOpacity = o; };
        this.setShapeStrokeWidth = function (w) { this.shapeStrokeWidth = w; };
        this.setMarqueeFillColor = function (c) { this.marqueeFillColor = c; };
        this.setMarqueeFillOpacity = function (o) { this.marqueeFillOpacity = o; };

        this.getPenColor = function () { return this.penColor; };
        this.getPenOpacity = function () { return this.penOpacity; };
        this.getPenWidth = function () { return this.penWidth; };
        this.getEraserWidth = function () { return this.eraserWidth; };
        this.getShapeStrokeColor = function () { return this.shapeStrokeColor; };
        this.getShapeStrokeOpacity = function () { return this.shapeStrokeOpacity; };
        this.getShapeStrokeWidth = function () { return this.shapeStrokeWidth; };
        this.getMarqueeFillColor = function () { return this.marqueeFillColor; };
        this.getMarqueeFillOpacity = function () { return this.marqueeFillOpacity; };

        this.updatePenColor = function (id) {
            var val = document.getElementById(id).value;
            if (val.length == 6)
                this.penColor = "#" + val;
        }
        this.updatePenOpacity = function (id) {
            var val = document.getElementById(id).value;
            if (val != undefined)
                this.penOpacity = val;
        }
        this.updatePenWidth = function (id) {
            var val = document.getElementById(id).value;
            if (val != undefined)
                this.penWidth = val;
        }
        this.updateShapeStrokeColor = function (id) {
            var val = document.getElementById(id).value;
            if (val.length == 6) {
                this.shapeStrokeColor = "#" + val;
            }
        }
        this.updateShapeStrokeOpacity = function (id) {
            var val = document.getElementById(id).value;
            if (val != undefined)
                this.shapeStrokeOpacity = val;
        }
        this.updateShapeStrokeWidth = function (id) {
            var val = document.getElementById(id).value;
            if (val != undefined)
                this.shapeStrokeWidth = val;
        }
        this.updateShapeFillColor = function (id) {
            var val = document.getElementById(id).value;
            if (val.length == 6)
                this.shapeFillColor = "#" + val;
        }
        this.updateShapeFillOpacity = function (id) {
            var val = document.getElementById(id).value;
            if (val != undefined)
                this.shapeFillOpacity = val;
        }
        this.updateMarqueeColor = function (id) {
            var val = document.getElementById(id).value;
            if (val.length == 6)
                this.marqueeFillColor = val;
        }
        this.updateMarqueeColor = function (id) {
            var val = document.getElementById(id).value;
            if (val != undefined)
                this.marqueeFillOpacity = val;
        }
    }

    function marquee(rectN, rectE, rectS, rectW, rectC) {
        //constructor for the marquee class
        this.rn = rectN;
        this.re = rectE;
        this.rs = rectS;
        this.rw = rectW;
        this.rc = rectC;
    }

    that.inkController = inkController;
    that.marquee = marquee;

    return that;
    ///////////////////////////////////////////////////////////////

}());