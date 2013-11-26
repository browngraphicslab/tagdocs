"use strict";

var quirks = new function() {
    var _ua = navigator.userAgent;
    var _isSafari = (navigator.vendor === 'Apple Computer, Inc.');
    var _isWebkit = _ua.indexOf('Webkit');
    var _chromeIndex = _ua.indexOf('Chrome');
    var _isChrome = _chromeIndex !== -1;
    var _firefoxIndex = _ua.indexOf('Firefox');
    var _isFirefox = _firefoxIndex !== -1;
    var _chromeVersion = _isChrome? parseInt(_ua.substring(_chromeIndex + 7)) : -1;
    var _firefoxVersion = _isFirefox? parseInt(_ua.substring(_firefoxIndex + 8)) : -1;
    var _isTrident = _ua.indexOf('Trident') !== -1;

    this.isWebGLCORSSupported = (_isChrome && _chromeVersion >= 13) ||
                                (_isFirefox  &&  _firefoxVersion >= 8);
    
    this.failsToRenderItemsNearContainerBorder = (_isChrome && _chromeVersion <= 19);
    this.isWebGLCORSRequired = (_isFirefox && _firefoxVersion > 4) || (_isChrome && _chromeVersion >= 13);
    this.useImageDisposer = _isSafari;
    this.supportsPreserve3D = !_isTrident && !_isFirefox;

    this.webGLRendersAllBlack = (_isChrome && _chromeVersion == 21);

    this.isWebkitAndNotAtOneHundredPercentZoom = function () {
        var resized = document.createElement("span");
        resized.innerHTML = "m";
        resized.style.visibility = "hidden";
        resized.style.fontSize = "40px";
        resized.style.position = "absolute";
        resized.style.left = "0px";
        resized.style.top = "0px";
        resized.style.webkitTextSizeAdjust = "none";
        document.body.appendChild(resized);

        var notResized = document.createElement("span");
        notResized.innerHTML = "m";
        notResized.style.visibility = "hidden";
        notResized.style.fontSize = "40px";
        notResized.style.position = "absolute";
        notResized.style.left = "0px";
        notResized.style.top = "0px";
        document.body.appendChild(notResized);

        var zoomIsOneHundredPercent = (resized.offsetWidth == notResized.offsetWidth);

        document.body.removeChild(resized);
        document.body.removeChild(notResized);

        return !zoomIsOneHundredPercent;
    }

};