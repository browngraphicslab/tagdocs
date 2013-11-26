LADS.Util.makeNamespace('LADS.TourAuthoring.VideoTrack');

/**
 * Creates a Video track
 * @param spec  Specifications (see Track class for details);
 * @param my    After superclass is called, will contain displays and keyframes arrays
 *              Don't pass in unless you are subclassing this
 */
LADS.TourAuthoring.VideoTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = LADS.TourAuthoring.TrackType.video;
    my = my || {};
    var that = LADS.TourAuthoring.Track(spec, my);

    my.track.addClass('video');
    my.svg.classed('video', true);

    // Video-specific functions

    // Keyframes

    // Export to RIN format

    // Associated Inks
    //LADS.TourAuthoring.InkablePart(that, my);

    return that;
};