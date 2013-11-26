LADS.Util.makeNamespace('LADS.TourAuthoring.InkTrack');
LADS.Util.makeNamespace('LADS.TourAuthoring.InkType');
LADS.Util.makeNamespace('LADS.TourAuthoring.InkShape');

LADS.TourAuthoring.InkType = {
    text: 1,
    isolate: 2,
    draw: 3,
    block: 4,
    highlight: 5
};

LADS.TourAuthoring.InkShape = {
    rectangle: 1,
    ellipse: 2
};

/**
 * Creates an Ink track
 * @param spec  Specifications (see Track class for details)"
                Additional parameters:
                -- media is ink type
                -- inkSpec is a spec object w/ ink details
                    'text'; optional params 'font', 'pt' for text
                    'drawing' for draw
                    'shape', 'position' (x,y,w,h); optional params 'opacity' for others
 * @param my    After superclass is called, will contain displays and keyframes arrays
 *              Don't pass in unless you are subclassing this
 */
LADS.TourAuthoring.InkTrack = function (spec, my) {
    "use strict";

    /////////////////////////
    // Call super-constructor
    spec.type = LADS.TourAuthoring.TrackType.ink;
    spec.fadeIn = -0.000001;
    spec.fadeOut = -0.000001;
    my = my || {};
    my.inkSpec = spec.inkSpec;
    my.inkType = spec.media; //not used

    var that = LADS.TourAuthoring.Track(spec, my);

    my.track.addClass('ink');
    my.svg.classed('ink', true);

    // Overwrite toRin()

    // Parent component

    return that;
};