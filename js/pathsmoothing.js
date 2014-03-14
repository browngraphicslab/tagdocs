// close these variables off eventually...

var points = [];
var roughPoints = [];
var paper;
var thresh = 20;
var closeThresh = 10;
var canBeClosed = false;
var pathstring = "";
var closeCircle;

function pathSmoothingSetup () {
	paper = Raphael('pscanvas', '100%', '100%');
	$('#pscanvas').on('mousedown', mstart);
}

function distance(pt1, pt2) {
	return Math.sqrt((pt1[0]-pt2[0])*(pt1[0]-pt2[0]) + (pt1[1]-pt2[1])*(pt1[1]-pt2[1]));
}

function extractPoints(pthstr) {
	var coords = pthstr.match(/[0-9.\-]+/g),
		letters = pthstr.match(/[MLR ]/g);
	console.log("merged     = " + mergeLists(letters,coords));
	console.log(coords);
	console.log(letters);
}

function mergeLists(letters, coords) {
	var merged="", i;
	for(i=0; i<letters.length; i++) {
		merged += letters[i]+coords[2*i]+','+coords[2*i+1];
	}
	return merged;
}

function mmove (evt) {
	var len = points.length;
	canBeClosed = (len > 3 && distance([evt.offsetX, evt.offsetY], points[0]) < closeThresh);
	console.log(canBeClosed);
	if(!canBeClosed && (len === 0 || distance([evt.offsetX, evt.offsetY], points[len-1]) > thresh)) {
		roughPoints.length = 0;
		points.push([evt.offsetX, evt.offsetY]);
		renderBezierPath();
	}
	else if(!canBeClosed) {
		roughPoints.push([evt.offsetX, evt.offsetY]);
		renderBezierPath();
	}
	if(canBeClosed) {
		closeCircle = paper.circle(points[0][0], points[0][1], closeThresh);
		closeCircle.attr("stroke","#00cc00");
	} else {
		renderBezierPath();
	}
}

function mstart (e) {
	points.push([e.offsetX, e.offsetY]);
	renderBezierPath();
	$('#pscanvas').on('mousemove', mmove);
	$('#pscanvas').on('mouseup', mend);
}

function mend (evt) {
	$('#pscanvas').off('mousemove');
	$('#pscanvas').off('mouseup');
	renderBezierPath(true, canBeClosed);
	points.length = 0;
	roughPoints.length = 0;
}

function renderBezierPath(clip, close) {
	var raphaelpath='', roughpath='', i, path, circle;
	paper.clear();
	paper.path('M100,100R2f00,200 200,200');
	
	if(points.length ===0 && roughPoints.length === 0 && !pathstring) return;
	if(points.length === 1) {
		raphaelpath = "M"+points[0][0]+","+points[0][1]+"L"+points[0][0]+","+points[0][1];
	} else if(points.length === 2){
		raphaelpath = "M"+points[0][0]+","+points[0][1]+"L"+points[1][0]+","+points[1][1];
	} else if (points.length > 2) {
		raphaelpath = "M"+points[0][0]+","+points[0][1]+"R";
		for(i=1;i<points.length;i++) {
			raphaelpath+=((i==1)?"":" ")+points[i][0]+","+points[i][1];
		}
		if(close && roughPoints.length === 0) {
			raphaelpath+=" "+points[0][0]+","+points[0][1];
		}
	}

	if(roughPoints.length > 0) {
		if(points.length > 0) {
			for(i=0;i<roughPoints.length;i++) {
				roughpath += " "+roughPoints[i][0]+","+roughPoints[i][1];
			}
			if(close) {
				roughPoints.push(points[0]);
				roughpath += " "+points[0][0]+","+points[0][1];
			}
		} else {
			if(roughPoints.length === 1) {
				roughpath = "M"+roughPoints[0][0]+","+roughPoints[0][1]+"L"+roughPoints[0][0]+","+roughPoints[0][1];
				if(close) {
					roughPoints.push(points[0]);
					roughpath += "L"+points[0][0]+","+points[0][1];
				}
			} else if(roughPoints.length === 2) {
				roughpath = "M"+roughPoints[0][0]+","+roughPoints[0][1]+"L"+roughPoints[1][0]+","+roughPoints[1][1];
				if(close) {
					roughPoints.push(points[0]);
					roughpath += "L"+points[0][0]+","+points[0][1];
				}
			} else {
				roughpath = "M"+roughPoints[0][0]+","+roughPoints[0][1]+"R";
				for(i=1;i<roughPoints.length;i++) {
					roughpath+=((i==1)?"":" ")+roughPoints[i][0]+","+roughPoints[i][1];
				}
				if(close) {
					roughPoints.push(points[0]);
					roughpath += " "+points[0][0]+","+points[0][1];
				}
			}
		}
	}
	
	if(clip) {
		pathstring+=raphaelpath;
		pathstring+=roughPoints.length === 0 ? "" : " "+roughPoints[roughPoints.length-1][0]+","+roughPoints[roughPoints.length-1][1];
		path = paper.path(pathstring);
		console.log("pathstring = "+pathstring);
		console.log(extractPoints(pathstring));
	} else {
		path = paper.path(pathstring+raphaelpath+roughpath)
	}
	path.attr({
		"stroke": "#ffffff",
		"stroke-width": "1",
		"stroke-linecap": "round"
	});
}

function updateThresh(val) {
	thresh = parseInt(val);
	$('#threshDiv').text(val);
}

function updateCloseThresh(val) {
	closeThresh = parseInt(val);
	$('#closeThreshDiv').text(val);
}