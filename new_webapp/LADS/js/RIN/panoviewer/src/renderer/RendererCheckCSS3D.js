var RendererCheckCSS3D = {};

RendererCheckCSS3D.isValidBrowser = function () {
    //Check that CSS3D transforms are here, otherwise throw an exception.
    //
    //  Future: Does it make sense to have a caps object we create in a singleton?

    var CSSMatrix = window.CSSMatrix || window.WebKitCSSMatrix || window.MSCSSMatrix || window.MozCSSMatrix;

    if (CSSMatrix == null || quirks.failsToRenderItemsNearContainerBorder) {
        RendererCheckCSS3D.isValidBrowser = function () { return false; }
        return false;
    }

    var matrix = new CSSMatrix();
    if (!matrix) {
        RendererCheckCSS3D.isValidBrowser = function () { return false; }
        return false;
    }

    if (quirks.isWebkitAndNotAtOneHundredPercentZoom()) {
        return false;
    }

    //Test presence of properties  want.
    var div = document.createElement('div');
    var style = div.style;

    if ((style.transform === undefined) &&
        (style.webkitTransform === undefined) &&
        (style.msTransform === undefined) &&
        (style.MozTransform === undefined) &&
        (style.OTransform === undefined))
    {
        RendererCheckCSS3D.isValidBrowser = function () { return false; }
        return false;
    }

    if (quirks.supportsPreserve3D) {
        //Older CSS3-3D implementations are sometimes busted depending on the graphics drivers.
        //The testElement below creates a snippet of problematic DOM, then measure's the size on screen.
        //This is a webkit specific isue.

        var testElem = document.createElement('div');
        var testElemStyle = testElem.style;
        testElemStyle.width = '0px';
        testElemStyle.height = '0px';
        testElemStyle.position = 'absolute';
        testElemStyle.overflowX = 'hidden';
        testElemStyle.overflowY = 'hidden';
        testElemStyle.backgroundColor = 'rgb(0, 0, 0)';
        testElem.innerHTML = '<div style="position: absolute; z-index: -10; -webkit-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); -ms-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); -moz-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); "><div id="_rwwviewer_cssrenderer_test_id" style="width: 256px; height: 256px;"></div></div>';
        document.body.appendChild(testElem);
        var size = document.getElementById('_rwwviewer_cssrenderer_test_id').getClientRects()[0];
        document.body.removeChild(testElem);
        //With the canned set of nested divs and matrix transforms, the element should be 337 pixels in width and height.
        //Webkit sometimes expands things much further if the machine has old graphics drivers installed.
        if (Math.abs(size.width-377) <= 1 && Math.abs(size.height-377) <= 1) {
            //cache the value so that we only perform the check once
            RendererCheckCSS3D.isValidBrowser = function () { return true; }
            return true;
        } else {
            RendererCheckCSS3D.isValidBrowser = function () { return false; }
            return false;
        } 
    } else {
        // Here we must be IE10, as we don't support preserve3d but can make a CSS matrix.
        RendererCheckCSS3D.isValidBrowser = function () { return true; }
        return true;
    }
};
