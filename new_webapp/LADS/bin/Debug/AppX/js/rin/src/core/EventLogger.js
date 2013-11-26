/// <reference path="Common.js"/>

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

rin.internal.EventLogger = function () { }

rin.internal.EventLogger.prototype = {
    logEvent: function (eventInfoFormat, params) {
        var eventInfo = this.formatString(arguments);
        rin.internal.debug.write(eventInfo);
    },

    logErrorEvent: function (eventInfoFormat, params) {
        var eventInfo = this.formatString(arguments);
        rin.internal.debug.write(eventInfo);
    },

    logBeginEvent: function (eventName, eventInfoFormat, params) {
        rin.internal.debug.write("Begin: " + eventName);
        return { begin: Date.now(), name: eventName };
    },

    logEndEvent: function (beginEventToken, eventInfoFormat, params) {
        var eventDuration = Date.now() / 1000 - beginEventToken.begin;
        rin.internal.debug.write("End event {0}. Duration {1}. {2}".rinFormat(beginEventToken.name, eventDuration, eventInfoFormat));
    },

    toString: function () {
    },

    _getIndent: function () {
    },

    formatString: function (argsArray, textParamIndex) {
        textParamIndex = textParamIndex || 0;
        var text = argsArray[textParamIndex];
        return text.replace(/\{(\d+)\}/g, function (matchedPattern, matchedValue) {
            return argsArray[parseInt(matchedValue) + textParamIndex + 1];
        });
    },
    _indentLevel: 0,
    _logBuilder: "",
    _errorLogBuilder: ""
};
