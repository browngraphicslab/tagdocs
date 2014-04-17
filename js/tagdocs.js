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
		var pieces = this.id.split('-');
		pieces.splice(0,1);
		openPage(pieces.join('-'));
	});

	// filter list of links on main page
	$('#linkFilter').on('change', function() {
		var val = this.value.toLowerCase(),
			resources = $('.resource'),
			i, tags, j, hit,
			resource;
		for(i=0;i<resources.length;i++) {
			hit = false;
			resource = $(resources[i]);
			tags = (resource.attr('tags') || '').split(',');
			for(j=0;j<tags.length;j++) {
				if(val === 'all' || val === tags[j].trim().toLowerCase()) {
					hit = true;
					break;
				}
			}
			resource.css('display', hit ? 'block' : 'none');
		}
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

// open one of the docs pages (i.e., not outside links)
function openPage(id) {
	$("#contentWrapper").css("height","auto");
	$(".page").css("display", "none");
	$("#"+id).css("display", "block");
	$(".page-tab").css("color", "white");
	var hex = randColor(); // wooooohooooo
	$("#li-"+id).css("color", hex);
	correctHeights();
	$('body').animate({
		scrollTop: 0
	}, 700);
}

// make sure the docs page is the correct height
function correctHeights() {
	var leftbarBottom = $("#leftbar").height() + $("#leftbar").offset().top,
		paddingTop = parseInt($("#leftbar").css("padding-top"), 10),
		currCWHeight = $("#contentWrapper").height(),
		cwHeight = (currCWHeight < leftbarBottom + paddingTop) ? leftbarBottom + paddingTop : currCWHeight;
	$("#contentWrapper").css("height", cwHeight);
}

// seadragon viewer page
function init() {
	var viewer1, viewer2, viewer3, viewer4;

    viewer1 = new Seadragon.Viewer("container1");
    viewer1.openDzi('seadragon_images/dz_1/dzc_output.xml');
    
    viewer2 = new Seadragon.Viewer("container2");
    viewer2.openDzi('seadragon_images/dz_2/dzc_output.xml');
    
    viewer3 = new Seadragon.Viewer("container3");
    viewer3.openDzi('seadragon_images/dz_3/dzc_output.xml');

    viewer4 = new Seadragon.Viewer("container4");
    viewer4.openDzi('seadragon_images/dz_4/dzc_output.xml');
}

Seadragon.Utils.addEvent(window, "load", init);