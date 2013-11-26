var RendererCheckWebGL = {};

RendererCheckWebGL.getWebGLContext = function (win) {
    if (win.getContext) {
        var possibleNames = 
            ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        for(var i = 0; i < possibleNames.length; ++i) {
            try {
                var context = win.getContext(possibleNames[i], 
                        { antialias: true});
                if(context != null)
                    return context;
            } catch(ex) { }
        }
    }
    return null;
};

RendererCheckWebGL.isValidBrowser = function () {
    var canvas  = document.createElement('canvas');

    var gl = RendererCheckWebGL.getWebGLContext(canvas);
    if (!gl) {
        console.log("WebGL is not supported.");
        RendererCheckWebGL.isValidBrowser = function () { return false; };
        return false;
    }
    else if (quirks.isWebGLCORSRequired && !quirks.isWebGLCORSSupported) {
        console.log('CORS image textures are not supported in this browser.');
        RendererCheckWebGL.isValidBrowser = function () { return false; };
        return false;
    }
    else if (quirks.webGLRendersAllBlack) {
        console.log('Webgl fails to render image tiles correctly in this browser.');
        RendererCheckWebGL.isValidBrowser = function () { return false; };
        return false;
    }

    RendererCheckWebGL.isValidBrowser = function () { return true; };
    return true;
};