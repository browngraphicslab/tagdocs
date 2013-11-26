function makePopcorn() {
	var pop = Popcorn("#stormtrooper");

	pop.code({
		start: 1.5,
		end: 4.5,
		onStart: function() {
			$("#annotations").text("Using Popcorn's 'code' plugin to increase video width by 1px every paint cycle.");
		},
		onFrame: function() {
			var video = $("#stormtrooper");
			if(!video[0].paused) {
				var currSize = $("#stormtrooper").width();
				$("#stormtrooper").css("width", currSize + 1);
			}
		},
		onEnd: function() {
			$("#annotations").text("");
		}
	});

	pop.image({
		start: 4,
		end: 15,
		src: "http://images2.wikia.nocookie.net/__cb20130129170207/arresteddevelopment/images/5/5b/2x14_The_Immaculate_Election_(67).png",
		target: "images",
	});
}

function addNewEffect() {
	var text = $("#text").val();
	var start = parseFloat($("#startTime").val());
	var end = parseFloat($("#endTime").val());

	$("#text").val("");
	$("#startTime").val("");
	$("#endTime").val("");

	var pop = Popcorn("#stormtrooper");
	pop.footnote({
		start: start,
		end: end,
		text: text,
		target: "footnotes"
	})
}

function captureThumbnail() {
	var pop = Popcorn("#stormtrooper");
	pop.capture({
		target: "#thumbnailImg"
	});
}