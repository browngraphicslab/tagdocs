$(document).ready(init);

function init() {
	thisArgumentsTest(1,2,3,4,5);
	// testObj.propertyFunc(1,2,3,4,5);
	// testObj2.propertyFunc(1,2,3,4,5);
	// testObj3.propertyFunc(1,2,3,4,5);
	// var t = new TestConstructor(10);
	// thisArgumentsTest.apply({ testProp: 5 }, [1,2,3,4,5]);
	// scopeTest();
	// handlersInLoop();
	// fixedHandlersInLoop();
	// fixedHandlersInLoopClosure();
	// explorePrototype();
	// newObject();
	// testFunctionalInheritance();
}

/********************************\
|******  FUNCTIONS SECTION ******|
\********************************/

/* TEST FUNC 1 */
function thisArgumentsTest() {
    // put in a breakpoint, call myFunc(1,2,3,4,5), inspect this and arguments
    debugger;
    console.log(this);
}

/* TEST FUNC 2 */
var testObj = {
	propertyFunc: function() {
		debugger;
	}
};

/* TEST FUNC 3 */
var testObj2 = {
	propertyFunc: function() {
		innerFunction(arguments); // call inner function

		function innerFunction() {
			debugger; // inspect this here (is 'window' rather than testObj2)
		}
	}
};

/* CORRECTED TEST FUNC 3 */
var testObj3 = {
	propertyFunc: function() {
		var that = this;
		innerFunction(arguments); // call inner function

		function innerFunction() {
			console.log(that);
			debugger; // inspect *that* here (is testObj2)
		}
	}
};

/* TEST FUNC 4 */
function TestConstructor(val) {
	this.val = val;
	debugger;
}


/*************************************\
|******  FUNCTION SCOPE SECTION ******|
\*************************************/

function scopeTest() {
	var bigScope = 1;

	for(var i=0;i<5;i++) {
		var j = 2;
		console.log(i);
	}
	console.log(i+j); // i and j are still in scope
	innerFunction();

	function innerFunction() {
		var innerScope = 2;
		console.log(bigScope); // bigScope is still in scope in inner functions
		console.log(i+j);      // so are i and j
		debugger;
	}

	console.log(innerScope); // bad, crashes
}

function handlersInLoop() {
	var i,
		button,
		buttons = [];

	for(i=0;i<5;i++) {
		button = $(document.createElement('button')).text("Button #"+i);
		buttons.push(button);
		$('#contentWrapper').append(button);

		button.on('click', function() {
			alert('you just clicked button #'+i); // the value of i is always 5 upon clicking
		});
	}
}

function fixedHandlersInLoop() {
	var i,
		button,
		buttons = [];

	for(i=0;i<5;i++) {
		button = $(document.createElement('button')).text("Button #"+i);
		buttons.push(button);
		$('#contentWrapper').append(button);

		button.on('click', buttonClickHandler(i));
	}

	function buttonClickHandler(j) {
		return function() {
			alert('you just clicked button #'+j); // the value of j is correct now
		}
	}
}

function fixedHandlersInLoopClosure() {
	var i,
		button,
		buttons = [];

	for(i=0;i<5;i++) {
		button = $(document.createElement('button')).text("Button #"+i);
		buttons.push(button);
		$('#contentWrapper').append(button);

		(function(j) { // create a closure around the entire creation of the handler
			button.on('click', function() {
				alert('you just clicked button #'+j); // the value of j is correct now
			});
		})(i);
	}
}


/**********************************\
|******  INHERITANCE SECTION ******|
\**********************************/

/* PROTOTYPE */
function explorePrototype() {
	var a = 5;
	Object.prototype.greeting = "hello"; // add to generic Object.prototype
	var b = [1,2,3];
	console.log("a says '"+a.greeting+"' and b says '"+b.greeting+"'");
	Array.prototype.greeting = "I'm an array";
	console.log("b now says '"+b.greeting+"'");
	debugger;
}

/* PSEUDO-CLASSICAL INHERITANCE */
function Polygon(nSides) {
	this.getNSides = function() {
		return nSides
	}
}

function Triangle(angles) {
	this.isRight = function() {
		return angles.indexOf(90) >= 0;
	}
}
Triangle.prototype = new Polygon(3);

function newObject() {
	var quad = new Polygon(4);
	var triangle = new Triangle([30, 60, 90]);
	debugger;
}

/* FUNCTIONAL INHERITANCE */
function superhero(name) {
	var that = {}; // could be called anything

	that.name = name; // add a property

	function hasCape() {
		return true; // of course
	}
	that.hasCape = hasCape; // add a method

	function hasSidekick() {
		return (name.indexOf("man") >= 0 || name.indexOf("woman") >= 0);
	}
	that.hasSidekick = hasSidekick; // another method

	return that; // return our superhero object
}

function batman() {
	var that = superhero("batman");

	var butler = "Alfred";

	that.doYouHaveABatCave = function() {
		return "duh";
	}

	that.doYouHaveAButler = function() {
		return "I have a badass butler named "+butler;
	}

	return that;
}

function testFunctionalInheritance() {
	var b = batman();
	console.log("hey, do you have a butler? " + b.doYouHaveAButler());
	console.log("hey, is it true that you have a sidekick? " + b.hasSidekick());
	debugger;
}