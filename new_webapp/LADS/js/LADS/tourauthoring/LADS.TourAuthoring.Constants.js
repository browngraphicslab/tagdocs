/* global LADS: true, WinJS: false */
LADS.Util.makeNamespace('LADS.TourAuthoring.Constants');

/**
 * List of constants used across multiple files and locations
 */
LADS.TourAuthoring.Constants = (function () {
    "use strict";
    return {
        aboveRinZIndex: 100000000, // ridiculous number to beat out RIN's ridiculous z-indexes so we can put things on top of it
        keyframeSize: 21, // radius in px, should be small but large enough to recieve touch
        innerKeyframeSize: 17, // radius of circle that appears when keyframe is selected
        keyframeStrokeW: 5,
        keyframeLineW: 3,
        fadeBtnSize: 15,
        rinBorder: 2,
        minZoom: 1,
        maxZoom: 100,
        handleColor: '#DAD9CC',
        keyframeColor: '#296B2F',
        audioKeyframeColor: '#283F53',
        selectedKeyframeColor: '#6B293F',
        displayColor: '#81AD62',
        inkDisplayColor: "#AAAAAA",
        selectedDisplayColor: '#143417',
        selectedInkDisplayColor: '#2E2E2E',
        inkDragHandleRadius: 20,
        doubleTap: 400,
        trackHeight: 96,
        minimizedTrackHeight: 36,
        esOffset: 0.05, // displays on same track need at least this much space btw them to show up properly
        timeRulerSize: 54,
        defaultVolume: 0.8,
        epsilon: 0.01,
        menuDecimals: 2, // number of decimals to round to in menu inputs
        maxTourLength: 15 * 60,
        minMediaLength: 5,
        inkTrackOffset: 0, // this functionality is probably obsolete
        defaultFade: 0.5,
        displayEpsilon: 0.5
    };
})();