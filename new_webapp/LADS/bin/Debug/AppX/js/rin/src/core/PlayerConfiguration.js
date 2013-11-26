/// <reference path="../core/Common.js"/>
/// <reference path="../core/TaskTimer.js"/>
/// <reference path="../core/ESItem.js"/>
/// <reference path="../core/ESTimer.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="../contracts/IOrchestrator.js"/>
/// <reference path="../core/ScreenPlayInterpreter.js"/>
/// <reference path="../core/Orchestrator.js"/>
/// <reference path="../core/ESItemsManager.js"/>
/// <reference path="../core/EventLogger.js"/>
/// <reference path="../experiences/PlayerControllerES.js" />

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

// Rin player configuration to be used for the startup of the player. These may be changed on the course of the narrative.
rin.PlayerConfiguration = function (options) {
    // Read any config data from query string.
    //ToDo revist the properties and various conditions

    var queryStrings = rin.util.getQueryStringParams();
    if (typeof (options) == "string") {
        var baseOptions = rin.util.getQueryStringParams(options);
        queryStrings = rin.util.overrideProperties(queryStrings, baseOptions);
    }
    else if (options && typeof (options) == "object") {
        queryStrings = rin.util.overrideProperties(queryStrings, options);
    } else if (!!options) {
        throw new Error("options should be a valid JSON formatted object or string formatted in 'query string' format");
    }

    // Checks HTML5 standard video tags like loop, autoplay, muted etc along with RIN player specific query strings.
    this.loop = !!queryStrings["loop"] && queryStrings["loop"] != "false";
    this.isFromRinPreviewer = !!queryStrings["isFromRinPreviewer"] && queryStrings["isFromRinPreviewer"] != "false";
    this.isGreedyBufferingDisabled = !!queryStrings["isGreedyBufferingDisabled"];
    var playerStartupAction = rin.contracts.playerStartupAction[queryStrings["playerStartupAction"]];
    var isAutoPlay = !!queryStrings["autoplay"] && queryStrings["autoplay"] != "false";
    this.playerStartupAction = playerStartupAction || (isAutoPlay ? rin.contracts.playerStartupAction.play : rin.contracts.playerStartupAction.none);

    this.isMuted = (queryStrings["muted"] === undefined ? (queryStrings["isMuted"] === undefined ? false : queryStrings["isMuted"]) : queryStrings["muted"]);
    this.isMusicMuted = (queryStrings["isMusicMuted"] === undefined ? false : queryStrings["isMusicMuted"]);

    this.hideAllControllers = queryStrings["controls"] == "false" || queryStrings["controls"] === false || (queryStrings["hideAllControllers"] && queryStrings["hideAllControllers"] != "false");
    this.hideDefaultController = !!queryStrings["hideDefaultController"] && queryStrings["hideDefaultController"] != "false";
    this.narrativeRootUrl = queryStrings["narrativeRootUrl"] || queryStrings["rootUrl"];
    this.systemRootUrl = queryStrings["systemRootUrl"];
    this.playerControllerES = new rin.internal.PlayerControllerES();
    this.playerMode = queryStrings["playerMode"];
    this.controllerOptions = queryStrings["controllerOptions"] || {};
};

rin.PlayerConfiguration.prototype = {
    mediaLoadTimeout: 30,
    playerMode: rin.contracts.playerMode.demo,
    playerStartupAction: rin.contracts.playerStartupAction.play,
    startSeekerPosition: 0,
    playerControllerES: null, //new rin.internal.PlayerControllerES(),

    hideAllControllers: false,
    hideDefaultController: false,
    hideTroubleshootingControls: false,
    degradeGracefullyOnErrors: false,
    playInDebugMode: true,
    defaultSegementId: null,
    defaultScreenplayId: null,
    narrativeRootUrl: null,
    systemRootUrl: null,
    loop: false,
    isGreedyBufferingDisabled: false,
    isMuted: false,
    controls: true,
    isFromRinPreviewer: false,
    controllerOptions : null
};