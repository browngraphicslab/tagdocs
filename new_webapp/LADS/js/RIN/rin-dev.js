
(function () {
    var PATH = "js/rin/js/rin/";      // the path to the scripts, relative to HTML page

    var CONTRACTS_PATH = PATH + "contracts/";
    var CONTRACTS_SCRIPTS = [
        'IExperienceStream.js',
        'IOrchestrator.js',
        'DiscreteKeyframeESBase.js'
    ];

    var CORE_PATH = PATH + "core/";
    var CORE_SCRIPTS = [
        'Common.js',
        'ESItem.js',
        'ESItemsManager.js',
        'ESTimer.js',
        'EventLogger.js',
        'Orchestrator.js',
        'OrchestratorProxy.js',
        'Player.js',
        'PlayerConfiguration.js',
        'PlayerControl.js',
        'ResourcesResolver.js',
        'RinDataProxy.js',
        'ScreenPlayInterpreter.js',
        'StageAreaManager.js',
        'TaskTimer.js',
        'TransitionService.js',
    ];

    var EXPERIENCES_PATH = PATH + "experiences/";
    var EXPERIENCES_SCRIPTS = [
        'AudioES.js',
        'BufferingES.js',
        'ContentBrowserES.js',
        'DeepZoomES.js',
        'ESTimerES.js',
        'MapES.js',
        'PanoramicES.js',
        'PhotosynthES.js',
        'PlaceholderES.js',
        'PlayerControllerES.js',
        'PreloaderES.js',
        'VideoES.js'
    ];

    var INTERACTION_PATH = PATH + "interactionControls/";
    var INTERACTION_SCRIPTS = [
        'CoreInteractionControlFactories.js'
    ];

    var PLAYER_PATH = PATH + "player/";
    var PLAYER_SCRIPTS = [
        'DefaultController.js',
        'TestController.js',
        'ControllerViewModel.js'
    ];

    var UTILITY_PATH = PATH + "utilities/";
    var UTILITY_SCRIPTS = [
        'Gestures.js',
        'JSONLoader.js',
        'XmlHelper.js'
    ];

    var OTHER_SCRIPTS = [
        //'test/TestES.js',
        '../../web/lib/knockout-2.1.0.debug.js'
    ];

    var oHead = document.getElementsByTagName('HEAD').item(0);
    addScripts(CONTRACTS_PATH, CONTRACTS_SCRIPTS);
    addScripts(CORE_PATH, CORE_SCRIPTS);
    addScripts(PLAYER_PATH, PLAYER_SCRIPTS);
    addScripts(EXPERIENCES_PATH, EXPERIENCES_SCRIPTS);
    addScripts(INTERACTION_PATH, INTERACTION_SCRIPTS);
    addScripts(UTILITY_PATH, UTILITY_SCRIPTS);
    addScripts(PATH, OTHER_SCRIPTS);

    function addScripts(path, scripts) {
        var oHead = document.getElementsByTagName('HEAD').item(0);
        for (var i = 0; i < scripts.length; i++) {
            var oScript = document.createElement("script");
            oScript.type = "text/javascript";
            oScript.src = path + scripts[i];
            oHead.appendChild(oScript);
        }
    }
})();
