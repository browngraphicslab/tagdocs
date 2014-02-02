window.onload = load;
function load() {
	var pagestring;
	initHandlers();
	correctHeights();
	makePopcorn();
	pathSmoothingSetup();
	pagestring = document.URL.split("#")[1] || "welcome";
	openPage(pagestring);
}

function initHandlers() {
	$('.plink').on('click', function() {
		openPage(this.id.split('-')[1]);
	});
}

function randColor() {
	var i, ret = '#';
	for(i=0;i<6;i++) {
		ret += randHex();
	}
	return ret;
}

function randHex() {
	return (Math.floor(Math.random()*16)%16).toString(16);
}

function openPage(id) {
	$("#contentWrapper").css("height","auto");
	$(".page").css("display", "none");
	$("#"+id).css("display", "block");
	$(".page-tab").css("color", "white");
	var hex = randColor();
	$("#li-"+id).css("color", hex);
	correctHeights();
	$('body').animate({
		scrollTop: 0
	}, 700);
}

function correctHeights() {
	var leftbarBottom = $("#leftbar").height() + $("#leftbar").offset().top;
	var paddingTop = parseInt($("#leftbar").css("padding-top"), 10);
	var currCWHeight = $("#contentWrapper").height();
	var cwHeight = (currCWHeight < leftbarBottom + paddingTop) ? leftbarBottom + paddingTop : currCWHeight;
	$("#contentWrapper").css("height", cwHeight);
}

var viewers = [], i, viewer1, viewer2, viewer3;
var files = ['dz_1'];//, 'dz2', 'dz3'];
var cont;

function init() {
    viewer1 = new Seadragon.Viewer("container1");
    viewer1.openDzi('../bleveque/dz_1/dzc_output.xml');
    
    viewer2 = new Seadragon.Viewer("container2");
    viewer2.openDzi('../bleveque/dz_2/dzc_output.xml');
    
    viewer3 = new Seadragon.Viewer("container3");
    viewer3.openDzi('../bleveque/dz_3/dzc_output.xml');

    viewer4 = new Seadragon.Viewer("container4");
    viewer4.openDzi('../bleveque/dz_4/dzc_output.xml');
}

Seadragon.Utils.addEvent(window, "load", init);