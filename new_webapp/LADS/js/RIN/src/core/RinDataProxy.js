/// <reference path="Common.js"/>
/// <reference path="TaskTimer.js"/>
/// <reference path="ESItem.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="ScreenPlayInterpreter.js"/>
/// <reference path="EventLogger.js"/>
/// <reference path="../core/PlayerConfiguration.js"/>
/// <reference path="../core/PlayerControl.js"/>
/// <reference path="../core/ResourcesResolver.js"/>
/// <reference path="StageAreaManager.js" />
/// <reference path="Orchestrator.js" />
/// <reference path="../SystemESs/BufferingES.js" />

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

rin.internal.DemoRinDataProxy = function () {
};

rin.internal.DemoRinDataProxy.prototype = {
    getRinDataAsync: function (narrativeUrl, onSetStatusMessage, onComplete) {
        var self = this,
            rinData;
        if (onSetStatusMessage) {
            onSetStatusMessage("Loading Narrative...");
        }

        // Download the narrative.
        var options = {
            url: narrativeUrl,
            dataType: "json",
            error: function (jqxhr, textStatus, errorThrown) {
                if (typeof onComplete == "function") {
                    rinData = { error: errorThrown.message || errorThrown };
                    if (onComplete) {
                        onComplete(rinData);
                    }
                }
            },
            success: function (data, textStatus, jqxhr) {
                if (typeof onComplete == "function") {
                    rinData = data[0];
                    if (onComplete) {
                        onComplete(rinData);
                    }
                }
            }
        };
        $.ajax(options);
    },
}; 