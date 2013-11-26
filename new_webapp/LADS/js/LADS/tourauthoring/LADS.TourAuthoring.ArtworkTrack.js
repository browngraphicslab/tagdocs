LADS.Util.makeNamespace('LADS.TourAuthoring.ArtworkTrack');

/**
 * Creates an Artwork track
 * @param spec              Specifications (see Track class for details);
 * @param spec.thumbnail
 * @param my     After superclass is called, will contain displays and keyframes arrays
 *              Don't pass in unless you are subclassing this
 */
LADS.TourAuthoring.ArtworkTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = LADS.TourAuthoring.TrackType.artwork;
    my = my || {};
    var that = LADS.TourAuthoring.Track(spec, my);

    my.track.addClass('artwork');
    my.svg.classed('artwork', true);

    // Artwork-specific functions

    // Keyframes

    // Export to RIN format

    // Associated Inks
    //LADS.TourAuthoring.InkablePart(that, my);

    return that;
};