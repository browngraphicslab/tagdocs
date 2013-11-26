/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

window.rin = window.rin || {};
window.rin.internal = window.rin.internal || {};
window.rin.defaults = window.rin.defaults || {};

// Call to register callback every time the browser redraws a page.
rin.internal.requestAnimFrame = (function () {
    
    var requestAnimationFrame =
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||

        // TODO: use adaptive framerate shim
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    // PhantomJS (used for running QUnit tests) won't allow a bind() on the native
    // method, so we'll wrap the invocation and use call() which is allowed.
    return function (callback) {
        // requestAnimationFrame must be called in the global context
        requestAnimationFrame.call(window, callback);
    };

})();

// A helper module to download any content from a remote url
rin.internal.AjaxDownloadHelper = function (url, content) {

    // Get the source specified for this helper
    this.getSource = function () {
        return url ? url : content;
    };

    // Download the content from the specified source
    this.getContent = function (callback, resourceResolver) {
        if (content) {
            callback(content);
        }
        else if (url) {
            var resolvedUrl = resourceResolver ? resourceResolver.resolveSystemResource(url) : url;
            $.get(resolvedUrl, null, function (string) {
                callback(string);
            });
        }
        else
            throw new Error("Neither Url nor content is provided.");
    };
};

// Bunch of utility methods to help with developing components for RIN
// todo: Find correct way to do many of these util functions like startsWith, endsWith, isAbsoluteUrl, getDocumentLocationRootUrl etc.
rin.util = {
    // Util method for inheriting from a class and setting up basic properties to access the parent.
    extend : function(Super, Sub) {
        // By using a dummy constructor, initialization side-effects are eliminated.
        function Dummy() { }
        // Set dummy prototype to Super prototype.
        Dummy.prototype = Super.prototype;
        // Create Sub prototype as a new instance of dummy.
        Sub.prototype = new Dummy();
        // The .constructor propery is really the Super constructor.
        Sub.baseConstructor = Sub.prototype.constructor;
        // Update the .constructor property to point to the Sub constructor.
        Sub.prototype.constructor = Sub;
        // A convenient reference to the super constructor.
        Sub.parentConstructor = Super;
        // A convenient reference to the super prototype.
        Sub.parentPrototype = Super.prototype;
    },

    // Replace placeholders in a string with values. ex: stringFormat('From of {0} to {1}', 'top', 'bottom') -> 'From top to bottom'
    stringFormat: function (text) {
        var args = arguments;
        return text.replace(/\{(\d+)\}/g, function (matchedPattern, matchedValue) {
            return args[parseInt(matchedValue, 10) + 1];
        });
    },

    // Remove leading and trailing white spaces from a string
    trim: function (text) {
        return (text || "").replace(/^\s+|\s+$/g, "");
    },

    // Checks if the string starts with a given substring.
    startsWith: function (text, string) {
        if (!text || !string || text.length < string.length) return false;
        return (text.substr(0, string.length) === string);
    },

    // Checks if the string ends with a given substring.
    endsWith: function (text, string) {
        if (!text || !string || text.length < string.length) return false;
        return (text.substr(text.length - string.length) === string);
    },

    // Checks if a given Url is absolute or not.
    isAbsoluteUrl: function (url) {
        return (/^[a-z]{1,5}:\/\//i).test(url);
    },

    // Set the opacity of an element.
    setElementOpacity: function (targetElement, opacityValue) {
        if (targetElement && targetElement.style) {
            targetElement.style.opacity = opacityValue;
            targetElement.style.filter = "alpha(opacity=" + opacityValue * 100 + ")";
        }
    },

    // Checks if 'child' is present in 'childItems'.
    hasChildElement: function (childItems, child) {
        for (var i = 0, len = childItems.length; i < len; i++) if (childItems[i] == child) return true;
        return false;
    },
    // Assigns a DOM string to a DOM element.
    assignAsInnerHTMLUnsafe: function (node, html) {
        if (window.MSApp !== undefined && window.MSApp.execUnsafeLocalFunction) {
            window.MSApp.execUnsafeLocalFunction(function () {
                node.innerHTML = html;
            });
        }
        else {
            node.innerHTML = html;
        }
    },
    // Creates a DOM element from the html specified and wraps it in a div.
    createElementWithHtml: function (html) {
        var div = document.createElement("div");
        rin.util.assignAsInnerHTMLUnsafe(div, html);
        return div;
    },

    // An arbitary string which is different everytime it is evaluated.
    expando: "rin" + Date.now(),

    // Counter for using as a unique id for items in rin scope.
    uuid: 0,

    // Returns the UID of the object.
    getUniqueIdIfObject: function (object) {
        if (typeof object != "object") return object;
        var id = object[this.expando];
        if (!id) id = object[this.expando] = ++this.uuid;
        return id;
    },

    // Replaces properties in 'toObject' with the ones in 'fromObject' but not add any extra.
    overrideProperties: function (fromObject, toObject) {
        for (var prop in fromObject) toObject[prop] = fromObject[prop];
        return toObject;
    },

    // Shallow copy the object. Only members are copied and so the resulting object will not be of the same type.
    shallowCopy: function (obj) {
        var temp = {};
        this.overrideProperties(obj, temp);
        return temp;
    },

    // Deep copy the object. Only members are copied and so the resulting object will not be of the same type.
    deepCopy: function (obj) {
        if (typeof (obj) != "object" || obj == null) return obj;
        var temp = obj.constructor();
        for (var i in obj) temp[i] = this.deepCopy(obj[i]);
        return temp;
    },

    // Extract query strings from a Url and return it as a property bag.
    getQueryStringParams: function (queryString) {
        var params = {}, queries, tokens, i, l;
        var query = (typeof (queryString) == "undefined") ? document.location.search : queryString;
        var posQuestion = query.indexOf("?");
        if (posQuestion >= 0) query = query.substr(posQuestion + 1);
        queries = query.split("&");

        for (i = 0, l = queries.length; i < l; i++) {
            tokens = queries[i].split('=');
            if (tokens.length == 2) params[tokens[0]] = tokens[1];
        }
        return params;
    },

    removeQueryStringParam: function (queryString, paramToRemove) {
        var answer = "", queries, tokens, i, l;
        var query = (typeof (queryString) == "undefined") ? document.location.search : queryString;
        var posQuestion = query.indexOf("?");
        if (posQuestion >= 0) {
            answer = query.substr(0, posQuestion + 1);
            query = query.substr(posQuestion + 1);
        }
        queries = query.split("&");

        for (i = 0, l = queries.length; i < l; i++) {
            tokens = queries[i].split('=');
            if (tokens[0] !== paramToRemove) answer += ((i === 0) ? "" : "&") + queries[i];
        }
        return answer;
    },

    // Builds a query string from a property bag.
    buildQueryString: function (params) {
        var queryString = "http://default/?";
        var first = true;
        for (var key in params) {
            var first = false;
            if (params.hasOwnProperty(key)) queryString += (first ? "" : "&") + key + "=" + params[key];
        }
        return queryString;
    },

    // Generates a random number between min and max.
    rand: function (min, max) {
        return Math.random() * (max - min) + min;
    },

    // Generates a random number between min to max and rounds it to the nearest integer.
    randInt: function (min, max) {
        return ~~(rin.util.rand(min, max));
    },

    // Hide an element by changing its opacity to 0.
    hideElementByOpacity: function (uiElem) {
        this.setElementOpacity(uiElem, 0);
    },

    // UnHide an element by changing its opacity to 1.
    unhideElementByOpacity: function (uiElem) {
        this.setElementOpacity(uiElem, 1);
    },

    // Parse a string to JSON.
    parseJSON: function (data) { // Code taken from jQuery
        if (typeof data !== "string" || !data) {
            return null;
        }

        // Make sure leading/trailing whitespace is removed (IE can't handle it)
        data = this.trim(data);

        // Attempt to parse using the native JSON parser first
        if (window.JSON && window.JSON.parse) {
            return window.JSON.parse(data);
        }

        // Make sure the incoming data is actual JSON
        // Logic borrowed from http://json.org/json2.js
        var rvalidchars = /^[\],:{}\s]*$/,
	        rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
	        rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
	        rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;

        if (rvalidchars.test(data.replace(rvalidescape, "@")
			.replace(rvalidtokens, "]")
			.replace(rvalidbraces, ""))) {

            return (new Function("return " + data))();

        }
        jQuery.error("Invalid JSON: " + data);
    },

    // Combines the arguments to form a relative path.
    combinePathElements: function () {
        var returnPath = "";
        for (var i = 0, l = arguments.length; i < l; i++) {
            var pathElement = rin.util.trim(""+arguments[i]+"");
            if (pathElement && pathElement[pathElement.length - 1] != "/") pathElement = pathElement + "/";
            if (returnPath && pathElement[0] == "/") pathElement = pathElement.substr(1, pathElement.length);
            returnPath += pathElement;
        }
        return (returnPath.length > 0) ? returnPath.substr(0, returnPath.length - 1) : returnPath;
    },

    // Conver the given relative Uri to and absolute Uri.
    convertToAbsoluteUri: function (relativeUri) {
        if (!relativeUri || relativeUri.length === 0 || this.isAbsoluteUrl(relativeUri)) return relativeUri;

        var rootUrl = this.getDocumentLocationRootUrl();
        if (relativeUri[0] == "/") {
            var slashIndex = rootUrl.indexOf("/",rootUrl.indexOf("//") + 2);
            if (slashIndex != -1) {
                return rootUrl.substr(0, slashIndex) + relativeUri;
            }
            else {
                return rootUrl + relativeUri;
            }
        }
        else {
            return (this.combinePathElements(rootUrl,relativeUri)).replace(/[\w\-\.]+\/..\/|\:\/\/[\w\-\.\/]+http/g, '');
        }
    },

    // Get the root url of the document.
    getDocumentLocationRootUrl: function () {
        if (!this._getDocumentLocationRootUrl) {
            var baseUrl = (document.location.origin ? document.location.origin : document.location.protocol + "//" + document.location.host) + document.location.pathname;
            var lastSlashPos = baseUrl.lastIndexOf("/"); // value 3 is used to skip slashes after protocol, sometime it could be upto 3 slashes.
            this._getDocumentLocationRootUrl = lastSlashPos > document.location.protocol.length + 3 ? baseUrl.substr(0, lastSlashPos) : baseUrl;
        }
        return this._getDocumentLocationRootUrl;
    },

    // Removes all child elements of the given element.
    removeAllChildren: function (element) {
        if (!element) return;
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    // Get all keys in a dictionary as an Array.
    getDictionaryKeys: function (dictionary) {
        if (typeof Object.keys !== "function") {
            var keys = [], name;
            for (name in Object) {
                if (Object.hasOwnProperty(name)) {
                    keys.push(name);
                }
            }
            return keys;
        }
        else
            return Object.keys(dictionary);
    },

    // Get all values in a dictionary as an Array.
    getDictionaryValues: function (dictionary) {
        var dictValues = new rin.internal.List();
        for (var key in dictionary)
            if (dictionary.hasOwnProperty(key)) dictValues.push(dictionary[key]);
        return dictValues;
    },

    // Convert an array like object to an Array.
    makeArray: function (arrayLikeObject) {
        var result = [];
        for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
            result.push(arrayLikeObject[i]);
        }
        return result;
    },

    // Empty function.
    emptyFunction: function () { }
};

// Class providing debug utilities.
rin.internal.debug = {
    // Check if the given expression is true and log if not.
    assert: function (expr, message) {
        if (!expr) {
            this.write(message || "assert failed");
            //debugger;
        }
    },
    debugWriteElement: null,

    // Log any message to the default log.
    write: function (info) {
        if (this.debugWriteElement && this.debugWriteElement.innerHTML) {
            rin.util.assignAsInnerHTMLUnsafe(this.debugWriteElement, info + "<br/>" + this.debugWriteElement.innerHTML);
        }

        // NOTE: we need to check for existence of rin because logging is 
        // called during unload which is problematic within iframes in IE.
        if ((typeof rin !== "undefined") && !rin.disableLogging &&
           (typeof (console) != "undefined") && console && console.log) {

            console.log(info);
        }
    }
};

// prototype changes
if (!String.prototype.rinFormat) {
    String.prototype.rinFormat = function () {
        var args = arguments; // arguments[0].constructor == Array ? arguments[0] : arguments; //todo: make it robust
        return this.replace(/\{(\d+)\}/g, function (matchedPattern, matchedValue) {
            return args[parseInt(matchedValue, 10)];
        });
    };
}

//todo: For creating our own Array like class, consider using below mechanism based on articles like http://dean.edwards.name/weblog/2006/11/hooray/ and http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
/*    var iframe = document.createElement("iframe");
iframe.style.display = "none";
document.body.appendChild(iframe);
frames[frames.length - 1].document.write("<script>parent.rin.internal.List = Array;<\/script>");
*/

// List object with many utility functions over a native array. Inherited from Array.
rin.internal.List = function () {
    if (arguments && arguments.length > 0) Array.prototype.push.apply(this, Array.prototype.slice.call(arguments, 0));
};
rin.internal.List.prototype = [];

// Get the last element of the list or null.
rin.internal.List.prototype.lastOrDefault = function (predicate) {
    for (var i = this.length - 1; i >= 0; i--) if (!predicate || predicate(this[i])) return this[i]; return null;
};

// Get the first element of the list or null.
rin.internal.List.prototype.firstOrDefault = function (predicate) {
    for (var i = 0, len = this.length; i < len; i++) if (!predicate || predicate(this[i])) return this[i]; return null;
};

// Returns true if any of the elements satisfies the predicate fuction.
rin.internal.List.prototype.any = function (predicate) {
    for (var i = 0, len = this.length; i < len; i++) if (!predicate || predicate(this[i])) return true; return false;
};

// Returns the index of the first item which satisfies the predicate function. Or returns null.
rin.internal.List.prototype.firstOrDefaultIndex = function (predicate) {
    for (var i = 0, len = this.length; i < len; i++) if (!predicate || predicate(this[i])) return i; return -1;
};

// Returns a new List with all the elements transformed as defined by the predicate.
rin.internal.List.prototype.select = function (predicate) {
    var out = new rin.internal.List(); for (var i = 0, len = this.length; i < len; i++) out.push(predicate(this[i])); return out;
};

// Calls the predicate function once with each item in the list.
rin.internal.List.prototype.foreach = function (predicate, context) {
    for (var i = 0, len = this.length; i < len; i++) predicate.call(context || this, this[i], i);
};

// Checks if the object specified is present in the list.
rin.internal.List.prototype.contains = function (obj) {
    return this.indexOf(obj) >= 0;
};

// Returns a new List with items except the ones in the array passed in.
rin.internal.List.prototype.except = function (items) {
    rin.internal.debug.assert(items.constructor == Array, "Non array is passed in except method");
    var temp = {}; var out = new rin.internal.List();
    for (var i = 0, len = items.length; i < len; i++) temp[rin.util.getUniqueIdIfObject(items[i])] = true;
    for (var i = 0, len = this.length; i < len; i++) if (!temp[rin.util.getUniqueIdIfObject(this[i])]) out.push(this[i]);
    return out;
};

// Returns a list of all distinct items in the list.
rin.internal.List.prototype.distinct = function () {
    var temp = {}; var out = new rin.internal.List();
    for (var i = 0, len = this.length; i < len; i++) {
        var item = this[i];
        var id = rin.util.getUniqueIdIfObject(item);
        if (!temp[id]) out.push(item);
        temp[id] = true;
    }
    return out;
};

// Defines an indexOf method in the List if Array implementation does not have it.
if (!rin.internal.List.prototype.indexOf) {
    rin.internal.debug.assert(false, "Array List has no indexOf");
    rin.internal.List.prototype.indexOf = function (obj) { for (var i = 0, len = this.length; i < len; i++) if (this[i] == obj) return i; return -1; };
}

// Filter a list and returns all elements satisfying the predicate condition.
rin.internal.List.prototype.filter = function (predicate) { var out = new rin.internal.List(); for (var i = 0, len = this.length; i < len; i++) if (predicate(this[i])) out.push(this[i]); return out; };

// Filter a list and returns all elements satisfying the predicate condition.
rin.internal.List.prototype.where = rin.internal.List.prototype.filter;

// Combine two lists to one.
rin.internal.List.prototype.concat = function (arr) { var out = new rin.internal.List(); Array.prototype.push.apply(out, this); Array.prototype.push.apply(out, arr); return out; };

// Remove the item form the list.
rin.internal.List.prototype.remove = function (item) {
    var index = this.indexOf(item);
    if (index >= 0) this.splice(index, 1);
    return this;
};

// Get the highest value from the list.
rin.internal.List.prototype.max = function (predicate) {
    var max = this.length > 0 ? predicate(this[0]) : NaN;
    var maxItem = this.length > 0 ? this[0] : null;
    for (var i = 1, len = this.length; i < len; i++) {
        var val = predicate(this[i]);
        if (val > max) { max = val; maxItem = this[i]; }
    }
    return maxItem;
};

// Class to maintain a timespan.
rin.internal.TimeSpan = function (timeSpanMilliSeconds) {
    this._currentTimeSpanMs = timeSpanMilliSeconds || 0;
};

rin.internal.TimeSpan.prototype = {
    // Add 'timespan' to existing timespan.
    add: function (timeSpan) {
        this._currentTimeSpan += timeSpan;
    },

    // Add 'timespan' from existing timespan.
    reduce: function (timeSpan) {
        this._currentTimeSpan -= timeSpan;
    },

    // Checks if 'timespan' is equal to this timespan.
    equals: function (timeSpan) { return timeSpan._currentTimeSpan == this._currentTimeSpan; },

    // Returns the value of this timespan.
    valueOf: function () { return this._currentTimeSpan; },

    _currentTimeSpan: 0
};

// A timespan with zero milliseconds.
rin.internal.TimeSpan.zero = new rin.internal.TimeSpan();

// Timer for making callbacks at defined time period. Supports pause/resume.
rin.internal.Timer = function () { };

rin.internal.Timer.prototype = {
    // Default timer interval.
    intervalSeconds: 1,
    tick: null,
    data: null,
    // Start the timer.
    start: function () {
        this.stop();
        var self = this;
        this.timerId = setTimeout(function () { self._onTick(); }, this.intervalSeconds * 1000);
        this._isRunnning = true;
    },
    // Stop the timer.
    stop: function () {
        if (this.timerId) clearTimeout(this.timerId);
        this._isRunnning = false;
    },
    // Check if the timer is running.
    getIsRunning: function () { return this._isRunnning; },
    timerId: -1,
    _isRunnning: false,
    _onTick: function () {
        if (this.tick) this.tick();
        this.start();
    }
};

// Start the timer with a defined interval and callback.
rin.internal.Timer.startTimer = function (intervalSeconds, tick, data) {
    var timer = new rin.internal.Timer();
    timer.intervalSeconds = intervalSeconds || timer.intervalSeconds;
    timer.tick = tick;
    timer.data = data;
    timer.start();
};

// Stopwatch implementation for maintaining elapsed times.
rin.internal.StopWatch = function () { };

rin.internal.StopWatch.prototype = {
    // Check if the stopwatch is running.
    getIsRunning: function () { return this._isRunning; },
    // Get the total number of seconds the stopwatch was running till now.
    getElapsedSeconds: function () {
        return this._isRunning ? (Date.now() / 1000 - this._startingOffset) + this._elapsedOffset : this._elapsedOffset;
    },
    // Reset the stopwatch.
    reset: function () {
        this._isRunning = false;
        this._startingOffset = 0;
        this._elapsedOffset = 0;
    },
    // Start or resume the stopwatch.
    start: function () {
        this._startingOffset = Date.now() / 1000;
        this._isRunning = true;
    },
    // Stop/Pause the stopwatch.
    stop: function () {
        if (this._isRunning) this._elapsedOffset = this.getElapsedSeconds();
        this._isRunning = false;
    },
    // Add time to the total elapsed seconds of the stopwatch.
    addElapsed: function (offsetSeconds) {
        this._elapsedOffset += offsetSeconds;
    },
    _isRunning: false,
    _startingOffset: 0,
    _elapsedOffset: 0
};

// Class for animating any number or an object with numeric properties from a start value to an end value.
rin.internal.DoubleAnimation = function (duration, from, to) {
    this.duration = (duration === 0) ? duration : duration || this.duration;
    this.from = from;
    this.to = to;
    this.keyframe = null;
    rin.internal.debug.assert(this.duration >= 0);
    if (typeof from == "object" && typeof to == "object") {
        this.keyframe = {};
        for (var prop in from) {
            if (from.hasOwnProperty(prop) && typeof from[prop] == "number") this.keyframe[prop] = from[prop];
        }
    }
};
rin.internal.DoubleAnimation.prototype = {
    // Default values.
    duration: 1,
    from: 0,
    to: 1,
    keyframe: null,
    isCompleted: false,
    // Start the animation.
    begin: function () {
        this._startingOffset = Date.now() / 1000;
    },
    // Stop the animation prematurely.
    stop: function () {
        var offset = Date.now() / 1000 - this._startingOffset;
        this._startingOffset = -1;
        this.isCompleted = offset >= this.duration;
        this._endingValue = this.keyframe ? this._interpolateKeyframe(offset) : this._interpolateValue(offset, this.from, this.to);
    },
    // Get the current value of the animated values.
    getCurrentValue: function () {
        if (this._startingOffset === 0) return this.from;
        if (this._startingOffset < 0) return this._endingValue;
        if (this.duration === 0) return this.to;

        var offset = Date.now() / 1000 - this._startingOffset;
        if (offset >= this.duration) {
            this.stop();
            return this._endingValue;
        }

        return this.keyframe ? this._interpolateKeyframe(offset) : this._interpolateValue(offset, this.from, this.to);
    },
    // Get the the animated values at given time.
    getValueAt: function (offset) {
        if (offset <= 0) return this.from;
        if (this.duration === 0 || offset >= this.duration) return this.to;

        return this.keyframe ? this._interpolateKeyframe(offset) : this._interpolateValue(offset, this.from, this.to);
    },
    // Check if the animation is running.
    isRunning: function () {
        return this._startingOffset >= 0;
    },
    _interpolateKeyframe: function (offset) {
        for (var prop in this.keyframe) {
            this.keyframe[prop] = this._interpolateValue(offset, this.from[prop], this.to[prop]);
        }
        return this.keyframe;
    },
    _interpolateValue: function (offset, from, to) {
        return from + (to - from) * Math.min(offset, this.duration) / this.duration;
    },
    _startingOffset: 0,
    _endingValue: 0
};

// Storyboard to host animations.
rin.internal.Storyboard = function (doubleAnimation, onAnimate, onCompleted) {
    this._doubleAnimation = doubleAnimation; this.onAnimate = onAnimate;
    // Callback method which will be called at the end of the storyboard.
    this.onCompleted = onCompleted;
};

rin.internal.Storyboard.prototype = {
    // Callback method which will be called at the end of the storyboard.
    onCompleted: null,
    // Callback method which will be called at every frame of the storyboard with the updated values.
    onAnimate: null,
    // Start the storyboard.
    begin: function () {
        if (!this._doubleAnimation) throw new Error("No animation is specified.");
        this._doubleAnimation.begin();
        this._animate();
    },
    // Stop the storyboard.
    stop: function () {
        this._stopFlag = true;
        if (this._doubleAnimation) this._doubleAnimation.stop();
        if (typeof this.onCompleted == "function") this.onCompleted(this._doubleAnimation.isCompleted);
    },

    _animate: function () {
        if (this._stopFlag === false) {
            var val = this._doubleAnimation.getCurrentValue();

            if (typeof this.onAnimate == "function") this.onAnimate(val);
            if (!this._doubleAnimation.isRunning()) { // animation ended without stop being called
                this._stopFlag = true;
                if (typeof this.onCompleted == "function") this.onCompleted(this._doubleAnimation.isCompleted);
                return; // end animation loop
            }

            // Use rin shim for redraw callbacks.
            rin.internal.requestAnimFrame(this._animate.bind(this));
        }
    },
    _stopFlag: false,
    _doubleAnimation: null
};

// Basic implementation of promise pattern.
rin.internal.Promise = function (context) {
    "use strict";
    var callContext = context || this,
        self = this,
        onFailure = null,
        onComplete = null,
        nextPromise = null,
        promiseStates = {
            notStarted: "notStarted",
            completed: "completed",
            failed: "failed"
        },
        currentState = promiseStates.notStarted,
        moveToState = function (targetState, data) {
            switch (targetState) {
                case promiseStates.completed:
                    currentState = targetState;
                    if (typeof onComplete === 'function') {
                        var evalutedPromise = onComplete.call(callContext, data);
                        if (evalutedPromise && evalutedPromise instanceof rin.internal.Promise) {
                            evalutedPromise._setNextPromise(nextPromise);
                        } else {
                            if (nextPromise) {
                                nextPromise.markSuccess(data);
                            }
                        }
                    } else {
                        if (nextPromise) {
                            nextPromise.markSuccess(data);
                        }
                    }
                    return;
                case promiseStates.failed:
                    self.currentState = targetState;
                    if (typeof onFailure === 'function') {
                        onFailure.call(callContext, data);
                    }
                    if (nextPromise) {
                        nextPromise.markFailed(data);
                    }
                    return;
                case promiseStates.notStarted:
                    throw new Error("Invalid state transition: Cannot set the state to not-started");
            }
        };

    // Method which will be called after a promise has been satisfied.
    this.then = function (completed, failed) {
        if (completed instanceof rin.internal.Promise) {
            return completed;
        }
        if (!onComplete && !onFailure) {
            onComplete = completed;
            onFailure = failed;
        } else {
            if (!nextPromise) {
                nextPromise = new rin.internal.Promise(callContext);
            }
            nextPromise.then(completed, failed);
        }
        if (currentState === promiseStates.completed) {
            moveToState(promiseStates.completed);
        } else if (currentState === promiseStates.failed) {
            moveToState(promiseStates.failed);
        }
        return self;
    };

    //(Private) Method to set the next sequence of promises
    //Usage in external methods leads to indeterminate output
    this._setNextPromise = function (promise) {
        if (promise instanceof rin.internal.Promise) {
            if (!nextPromise) {
                nextPromise = promise;
            } else {
                nextPromise._setNextPromise(promise);
            }
        } else if (promise !== null && promise !== undefined) {
            throw new Error("parameter is not of type promise");
        }
        return self;
    };

    // Mark the promise as a success.
    this.markSuccess = function (data) {
        if (currentState === promiseStates.notStarted)
            moveToState(promiseStates.completed, data);
    };
    // Mark the promise as a failure.
    this.markFailed = function (error) {
        if (currentState === promiseStates.notStarted)
            moveToState(promiseStates.failed, error);
    };
};

// Module for deffered loading of resources to RIN.
rin.internal.DeferredLoader = function (refWindow) {
    "use strict";
    var head,
        body,
        browser,
        win = refWindow || window,
        doc = win.document,
        CONST_CSS_TIMEOUT_MS = 10000,
        CONST_CSS_TIME_BETWEEN_POLLS_MS = 100,
        loadedResources = {},
        // Adds a node to the document - To Do Optimize this for cross-browser and Win 8 standards.
        addElement = function (element, referenceNode, referenceType) {
            var refChild = referenceNode || doc.lastChild;
            switch (referenceType) {
                case "before":
                    if (window.MSApp !== undefined && window.MSApp.execUnsafeLocalFunction) {
                        return window.MSApp.execUnsafeLocalFunction(function () {
                            doc.insertBefore(element, refChild);
                        });
                    } else {
                        doc.insertBefore(element, refChild);
                    }
                    break;
                default:
                    if (window.MSApp !== undefined && window.MSApp.execUnsafeLocalFunction) {
                        return window.MSApp.execUnsafeLocalFunction(function () {
                            refChild.parentNode.appendChild(element);
                        });
                    }
                    else {
                        refChild.parentNode.appendChild(element);
                    }
                    break;
            }
        },
        // Adds a node to the document.
        createAndAddElement = function (nodeName, attributes, referenceNode, referenceType) {
            var element = doc.createElement(nodeName),
                attrs = attributes || [],
                attributeName;
            for (attributeName in attrs) {
                if (attrs.hasOwnProperty(attributeName)) {
                    element.setAttribute(attributeName, attrs[attributeName]);
                }
            }
            addElement(element, referenceNode, referenceType);
            return element;
        },
        // Gets the first matching node by tag name or undefined.
        getFirstNodeByTagNameSafe = function (nodeName) {
            var nodes = doc.getElementsByTagName(nodeName);
            return nodes && (nodes.length > 0 ? nodes[0] : undefined);
        },
        // Gets the body node or undefined.
        getBodyNode = function () {
            body = body || doc.body || getFirstNodeByTagNameSafe("body");
            return body;
        },
        // Gets the head node or undefined.
        getHeadNode = function () {
            head = head || doc.head || getFirstNodeByTagNameSafe("head") || createAndAddElement("head", null, getBodyNode(), "before");
            return head;
        },
        // Initializes browser type object.
        getBrowser = function () {
            if (!browser) {
                var agent = win.navigator.userAgent;
                browser = {};
                (browser.chrome = (/AppleWebKit\//i.test(agent) && /Chrome/i.test(agent)))
                || (browser.webkit = /AppleWebKit\//i.test(agent))
                || (browser.win8 = window.MSApp)
                || (browser.ie10 = (/MSIE 10/i.test(agent) || (document.documentMode && document.documentMode >= 9)))
                || (browser.ie = /MSIE/i.test(agent))
                || (browser.other = true);
            }
            return browser;
        },
        // Gets the data specified in the Url.
        getSource = function (url, callback) {
            var xmlhttp, promise;
            if (loadedResources[url]) {
                return loadedResources[url].promise;
            }
            else {
                promise = new rin.internal.Promise();
                loadedResources[url] = { promise: promise };
                if (win.XMLHttpRequest) {
                    xmlhttp = new win.XMLHttpRequest();
                }
                else {
                    xmlhttp = new win.ActiveXObject("Microsoft.XMLHTTP");
                }
                xmlhttp.onreadystatechange = function () {
                    var data;
                    if (xmlhttp.readyState === 4) {
                        if (xmlhttp.status === 200) {
                            data = xmlhttp.responseText;
                            loadedResources[url].data = data;
                            if (typeof callback === 'function') {
                                callback(data);
                            }
                            promise.markSuccess(data);
                        } else {
                            data = xmlhttp.statusText;
                            loadedResources[url].data = data;
                            promise.markFailed(data);
                        }
                    }
                };
                xmlhttp.open("GET", url, true);
                xmlhttp.send(null);
            }
            return promise;
        },
        getDom = function (textData, mimeType) {
            var domParser = new win.DOMParser(),
                dom = domParser.parseFromString(textData, mimeType);
            return dom;
        },
        getHtmlDom = function (textData) {
            return rin.util.createElementWithHtml(textData).childNodes;
        },
        scriptReferenceNode = getHeadNode().lastChild,
        cssReferenceNode = scriptReferenceNode,
        htmlTemplateReferenceNode = scriptReferenceNode,
        getUrlType = function (url) {
            var type;
            if (/\.css$/i.test(url)) {
                type = "css";
            }
            else if (/\.js$/i.test(url)) {
                type = "script";
            }
            else if (/\.htm?$/i.test(url)) {
                type = "html";
            }
            else {
                type = "unknown";
            }
            return type;
        },
        // Checks of the style sheet is loaded.
        isStylesheetLoaded = function (cssRef) {
            var stylesheets = doc.styleSheets,
                i = stylesheets.length - 1;
            while (i >= 0 && stylesheets[i].href !== cssRef) {
                i -= 1;
            }
            return i >= 0;
        },
        // Poll to see if stylesheet is loaded.
        pollStyleSheetLoaded = function (node, promise, polledTime) {
            if (node.href && isStylesheetLoaded(node.href)) {
                if (promise instanceof rin.internal.Promise) { promise.markSuccess(); }
                return;
            }
            if ((polledTime || 0) >= CONST_CSS_TIMEOUT_MS) {
                if (promise instanceof rin.internal.Promise) { promise.markFailed(); }
                return;
            }
            win.setTimeout(function () { pollStyleSheetLoaded(node, promise, (polledTime || 0) + CONST_CSS_TIME_BETWEEN_POLLS_MS); }, CONST_CSS_TIME_BETWEEN_POLLS_MS);
        },
        // Sets the onload complete method for the node based on node name.
        initOnLoadComplete = function (node, promise) {
            getBrowser();
            if (browser.ie && node.nodeName.toLowerCase() === 'script') {
                node.onload = node.onreadystatechange = function () {
                    if (/loaded|complete/.test(node.readyState)) {
                        node.onload = node.onreadystatechange = null;
                        if (promise instanceof rin.internal.Promise) { promise.markSuccess(); }
                    }
                };
            }
            else if (browser.webkit && node.nodeName.toLowerCase() === 'link') {
                //Only safari doesn't fire onload event for CSS
                //We need to poll the style sheet length for this
                pollStyleSheetLoaded(node, promise);
            }
            else {
                node.onload = function () {
                    if (promise instanceof rin.internal.Promise) { promise.markSuccess(); }
                };
                node.onerror = function () {
                    if (promise instanceof rin.internal.Promise) { promise.markFailed(); }
                };
            }
        },
        // Loads a script by inserting script tag.
        loadScript = function (scriptSrc, checkerFunction) {
            var scriptNode, promise = new rin.internal.Promise(), isScriptLoaded = false;
            try {
                isScriptLoaded = checkerFunction != undefined && typeof checkerFunction === "function" && checkerFunction();
            }
            catch (e) {
                isScriptLoaded = false;
            }
            if (!isScriptLoaded) {
                scriptNode = createAndAddElement("script", { type: "text/javascript" }, scriptReferenceNode);
                initOnLoadComplete(scriptNode, promise);
                scriptNode.src = scriptSrc;
            }
            else {
                promise.markSuccess();
            }
            return promise;
        },
        // Loads a stylesheet by inserting link tag.
        loadCss = function (cssSrc) {
            var linkNode,
                promise = new rin.internal.Promise();
            if (!isStylesheetLoaded(cssSrc)) {
                linkNode = createAndAddElement("link", { rel: "stylesheet" }, cssReferenceNode);
                initOnLoadComplete(linkNode, promise);
                linkNode.href = cssSrc;
            }
            else {
                promise.markSuccess();
            }
            return promise;
        },
        // Loads a templated html and adds the template to the document.
        loadTemplateHtml = function (htmlSrc) {
            var promise = getSource(htmlSrc,
                            function (data) {
                                var domNodes = getHtmlDom(data), i,
                                    len = domNodes.length,
                                    nodeToAdd,
                                    referenceNode = htmlTemplateReferenceNode;
                                for (i = 0; i < len; i += 1) {
                                    //Loop through all the first-level tags
                                    nodeToAdd = domNodes[i];
                                    if (nodeToAdd && nodeToAdd.nodeType && nodeToAdd.nodeType === nodeToAdd.ELEMENT_NODE) {
                                        addElement(nodeToAdd, referenceNode);
                                        referenceNode = nodeToAdd; // The next node to be added should be after this
                                        i -= 1;
                                    }
                                }
                            });
            return promise;
        },
        // Loads any other type of resource and adds it to the loadedSources. To be used for resources other than script, css and templated html.
        loadOtherResource = function (src) {
            var promise = getSource(src);
            return promise;
        },
        // Loads any type of resource.
        loadResource = function (src) {
            var tempSource = src,
            url = src;
            if (typeof url === 'string') {
                url = { src: tempSource };
            }
            if (!url.type) {
                url.type = getUrlType(url.src);
            }
            switch (url.type.toLowerCase()) {
                case "script":
                    return loadScript(url.src, url.loadChecker);
                case "css":
                    return loadCss(url.src);
                case "html":
                    return loadTemplateHtml(url.src);
                default:
                    return loadOtherResource(url.src);
            }
        };

    // Loads the given url(s) in parallel. The promise returned would fire even if atleast one succeeds and others fail.
    this.parallelLoader = function (urls) {
        //To Do - optimize for urls in queue or already loaded
        var promise = new rin.internal.Promise(),
            sources = (urls instanceof Array ? urls : [urls]),
            sourcesLen = sources.length,
            callCount = sourcesLen,
            successCount = 0,
            i,
            callComplete = function () {
                callCount -= 1;
                if (callCount === 0) {
                    successCount > 0 ? promise.markSuccess() : promise.markFailed();
                }
            },
            onSuccess = function () {
                successCount += 1;
                callComplete();
            },
            onFailure = function () {
                callComplete();
            };
        for (i = 0; i < sourcesLen; i += 1) {
            loadResource(sources[i]).then(onSuccess, onFailure);
        }
        return promise;
    };
    // Loads the given url(s) in sequence. The promise returned would fire only if all succeeds.
    this.sequentialLoader = function (urls) {
        var sources = (urls instanceof Array ? urls.slice() : [urls]),
            currentSource,
            len = sources.length,
            promise,
            i;
        for (i = 0; i < len; i += 1) {
            currentSource = sources[i];
            if (promise) {
                promise.then(function () {
                    currentSource = sources.shift();
                    promise = loadResource(currentSource);
                    return promise;
                });
            }
            else {
                currentSource = sources.shift();
                promise = loadResource(currentSource);
            }
        }
        return promise;
    };
    this.otherResources = loadedResources;
    // Load all rin required resources and dependancies.
    this.loadSystemResources = function (systemRoot) {
        var self = this,
            func = function () {
                var promise;
                rin.internal.systemResourcesProcessed = rin.internal.systemResourcesProcessed || false;
                //To Do - Need to look at replacing these with some configuration and letting the ES developer to load his custom libraries.
                if (!rin.internal.systemResourcesProcessed) {
                    promise = self.parallelLoader([
                            { src: rin.util.combinePathElements(systemRoot, 'lib/jquery-1.9.1.min.js'), loadChecker: function () { return window.jQuery !== undefined; } },
                            { src: rin.util.combinePathElements(systemRoot, 'lib/knockout-2.2.1.js'), loadChecker: function () { return window.ko !== undefined; } }
                    ])
                    .then(function () {
                        return self.sequentialLoader([
                            { src: rin.util.combinePathElements(systemRoot, 'lib/jquery.easing.1.3.js'), loadChecker: function () { return window.jQuery.easing["jswing"] !== undefined; } },
                            { src: rin.util.combinePathElements(systemRoot, 'lib/jquery.pxtouch.min.js'), loadChecker: function () { return window.PxTouch !== undefined; } },
                            { src: rin.util.combinePathElements(systemRoot, "lib/rin-experiences-1.0.js"), loadChecker: function () { return rin.experiences !== undefined; } }
                        ]);
                    }).then(function () {
                        rin.internal.systemResourcesProcessed = true;
                    });
                }
                else {
                    promise = new rin.internal.Promise(); //A dummy promise with success marked
                    promise.markSuccess();
                }
                return promise;
            };
        if (window.MSApp !== undefined && window.MSApp.execUnsafeLocalFunction) {
            return window.MSApp.execUnsafeLocalFunction(func);
        }
        return func();
    };
    // Load all theme specific resources.
    this.loadAllThemeResources = function (systemRoot) {
        var self = this,
            func = function () {
                return self.parallelLoader([
                rin.util.combinePathElements(systemRoot, 'rin.css'),
                rin.util.combinePathElements(systemRoot, 'rinTemplates.htm')
                ]);
            };
        if (window.MSApp !== undefined && window.MSApp.execUnsafeLocalFunction) {
            return window.MSApp.execUnsafeLocalFunction(func);
        }
        return func();
    };
};