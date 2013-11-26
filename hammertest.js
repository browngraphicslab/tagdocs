window.onload = load;

function load() {
	var box1 = document.getElementById("box1");
	$(box1).data("origWidth", $(box1).width());
	var box2 = document.getElementById("box2");
	$(box2).data("origWidth", $(box2).width());
	var num1swipes = 0;
	var num2swipes = 0;
	var gestures = "pinchout pinchin touch";
	var h1 = new TAGHAMMER(box1);
	var h2 = new TAGHAMMER(box2);
	h1.HAMMER().on(gestures, function(evt) { scaleBox(evt, box1); box1.innerHTML = ++num1swipes; });
	h2.HAMMER().on(gestures, function(evt) { scaleBox(evt, box2); box2.innerHTML = ++num2swipes; });
	// Hammer(box1).on(gestures, function(evt){scaleBox(evt,box1); stopEvt(evt); box1.innerHTML = ++num1swipes; });
	// 	Hammer(box2).on(gestures, function(evt){scaleBox(evt,box2); stopEvt(evt); box2.innerHTML = ++num2swipes; });
}

function scaleBox(evt, box) {
	if(evt.gesture.scale) {
		var $box = $(box);
		$box.css("width", $box.data("origWidth") * evt.gesture.scale);
	}
}