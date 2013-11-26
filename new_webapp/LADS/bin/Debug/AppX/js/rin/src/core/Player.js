/// <reference path="PlayerConfiguration.js"/>
/// <reference path="../core/PlayerControl.js"/>
/// <reference path="../player/DefaultController.js" />

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

/// <summary>Constructs a new Player object.</summary>
/// <param name="playerElement" type="element">HTML element that will host the player.</param>
/// <param name="options" type="rin.PlayerConfiguration or string">(optional) The player configuration. in query string form or rin.PlayerConfiguration object.</param>
/// <returns type="rin.Player">Returns a new Player object.</returns>
rin.createPlayerControl = function (playerElement, options, systemRootUrl) {
    var playerConfiguration = options && options.constructor == rin.PlayerConfiguration ? options : new rin.PlayerConfiguration(options);
    if (systemRootUrl) {
        playerConfiguration.systemRootUrl = systemRootUrl;
    }
    var playerControl;

    if (playerConfiguration.hideAllControllers || playerConfiguration.hideDefaultController || !playerConfiguration.playerControllerES) {
        playerControl = new rin.internal.PlayerControl(playerElement, playerConfiguration);
    }
    else {
        playerConfiguration.playerControllerES.initialize(playerElement, playerConfiguration);
        playerControl = playerConfiguration.playerControllerES.playerControl;
    }

    if (rin.internal.RinDebugger) {
        rin.debug = new rin.internal.RinDebugger(playerControl);
    }

    return playerControl;
};

// Get the player control associated with a DOM element.
rin.getPlayerControl = function (playerElement) {
    return playerElement && playerElement.rinPlayer;
};

// Bind a player control with a DOM element.
rin.bindPlayerControls = function (rootElement, systemRootUrl) {
    var playerElements = (rootElement || document).getElementsByClassName("rinPlayer");
    for (var i = 0, len = playerElements.length; i < len; i++) {
        var playerElement = playerElements[i];
        if (playerElement.rinPlayer instanceof rin.internal.PlayerControl) continue;
        playerElement.rinPlayer = rin.createPlayerControl(playerElement, playerElement.getAttribute("data-options"), systemRootUrl);

        var src = playerElement.getAttribute("data-src");
        if (src) {
            playerElement.rinPlayer.load(src);
        }
    }
};

// Start processing/loading the rin player.
rin.processAll = function (element, systemRootUrl) {
    var defLoader = new rin.internal.DeferredLoader();
    var promise = defLoader.loadSystemResources(systemRootUrl).then(function () {
        rin.bindPlayerControls(element, systemRootUrl);
    });
    return promise;
};