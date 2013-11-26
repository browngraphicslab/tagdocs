
(function () {
    var PATH = "js/seadragon/src/";      // the path to the scripts, relative to HTML page
    var SCRIPTS = [         // the script filenames, in dependency order
        "Seadragon.Core.js",
        "Seadragon.Config.js",
        "Seadragon.Strings.js",
        "Seadragon.Debug.js",
        "Seadragon.Profiler.js",
        "Seadragon.Point.js",
        "Seadragon.Rect.js",
        "Seadragon.Spring.js",
        "Seadragon.Utils.js",
        "Seadragon.MouseTracker.js",
        "Seadragon.EventManager.js",
        "Seadragon.ImageLoader.js",
        "Seadragon.Buttons.js",
        "Seadragon.TileSource.js",
        "Seadragon.DisplayRect.js",
        "Seadragon.DeepZoom.js",
        "Seadragon.Viewport.js",
        "Seadragon.Drawer.js",
        "Seadragon.Viewer.js"
    ];

    var oHead = document.getElementsByTagName('HEAD').item(0);
    for (var i = 0; i < SCRIPTS.length; i++) {
        var oScript = document.createElement("script");
        oScript.type = "text/javascript";
        oScript.src = PATH + SCRIPTS[i];
        oHead.appendChild(oScript);
    }
})();
