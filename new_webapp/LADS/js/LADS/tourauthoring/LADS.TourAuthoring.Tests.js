LADS.Util.makeNamespace('LADS.TourAuthoring.Tests');

/**
UI Tests:
Drag playhead and playback location fader TODO: test ensuring RIN and playhead are synced
Click "Play" button twice (start and stop)
*/

/**
 * Automated tests module for TourAuthoring
 */
LADS.TourAuthoring.Tests = (function () {
    "use strict";

    // Resources to pass to tracks
    var testResources = [
            'http://cs.brown.edu/research/lads/LADS2.0Data/Documents/monethay/monet%20haystacks/monet%20haystacks.xml',
            'http://cs.brown.edu/research/lads/LADS2.0Data/Documents/gari/garidz/dz.xml',
            'http://cs.brown.edu/research/lads/LADS2.0Data/Documents/rembrandtself/rembrandt%20self/rembrandt%20self.xml',
            'http://cs.brown.edu/research/lads/LADS2.0Data/Documents/marcdream/marc%20dream/marc%20dream.xml',
            'http://cs.brown.edu/research/lads/LADS2.0Data/Documents/dirck/dirck/dirck.xml',
            'http://10.116.71.58:8086/Images/20121105221815/dz.xml' // Portion of Garibaldi in James' tour
    ],
        testAudio = [
            'http://archive.bsrlive.brown.edu/archives/bsrbonusbeats/kurtboone.mp3', // Ryan's test - an old interview he did - don't mess with - 5.8Mb
            'http://archive.bsrlive.brown.edu/archives/bsrbonusbeats/GaribaldiScene43Tour_mastered.mp3',
            'http://archive.bsrlive.brown.edu/archives/bsrbonusbeats/GariEdit.mp3',
            'http://10.116.71.58:8086/Images/20121104223746.mp3'
        ];

    /**
     * Makes a bunch of tracks and displays and keyframes and adds them to the DOM
     * @param timeline
     */
    function trackEditTest(timeline, timeManager) {
        // Test adding tracks
        var i, displays, rin,
            testtrack, disp0, disp1, keyframe0; // Only holding reference to single track

        // Add a few more for UI checks
        timeline.addAudioTrack(testAudio[0]);
        testtrack = timeline.addArtworkTrack(testResources[0]);
        timeline.addArtworkTrack(testResources[1]);
        timeline.addArtworkTrack(testResources[2]);

        // Test adding displays
        disp0 = testtrack.addDisplay(timeManager.timeToPx(0), 5);
        disp1 = testtrack.addDisplay(timeManager.timeToPx(10), 5);
        testtrack.addDisplay(timeManager.timeToPx(30), 19);
        // test movement
        disp0.internalMove(timeManager.timeToPx(1), 0, 10, 'fade-in', 0);
        disp0.internalMove(timeManager.timeToPx(4), 0, 10, 'fade-out', 0);
        disp0.internalMove(timeManager.timeToPx(4), 0, 10, 'main', 0);
        // test bounding movement
        disp0.internalMove(timeManager.timeToPx(9.8), 0, 10, 'fade-out', 0); // fade-out should collide into next display
        disp0.internalMove(timeManager.timeToPx(-1), 0, 10, 'fade-in', 0); // fade-in collides with 0 secs
        disp0.internalMove(timeManager.timeToPx(0.25), 0, 10, 'fade-out', 0); // fade-out collides with fade-in
        disp0.internalMove(timeManager.timeToPx(9.5), 0, 10, 'main', 0); // right edge should be touching next display
        disp0.internalMove(timeManager.timeToPx(100), 0, 10, 'fade-in', 0); // no change

        displays = testtrack.getDisplays();
        for (i = 0; i < displays.length; i++) {
            console.log(i + ': ' + displays[i].getStart());
        }

        // Keyframes
        keyframe0 = displays[1].addKeyframe(timeManager.timeToPx(12));
        //keyframe move
        keyframe0.internalMove(timeManager.timeToPx(14.5));

        // test movement of display w/ keyframe
        disp1.internalMove(timeManager.timeToPx(15), 10, 30, 'main', 0);
        keyframe0.internalMove(timeManager.timeToPx(15.5));

        // Basic RIN test
        /*$(window).load(function () {
            timeline.onUpdate();
        });*/
        rin = timeline.toRIN(); // easiest way to check basic RIN formatting is prolly breakpoint and read
        timeline.onUpdate();
    }

    /**
     * Makes two tracks w/ alternating display regions and calls onUpdate on the timeline
     */
    function testTrackReload(timeline, timeManager) {
        var i, displays, rin,
            track0 = timeline.addArtworkTrack(testResources[0], "Monet"),
            //track1 = timeline.addArtworkTrack(testResources[1], "Garibaldi"),
            track1 = timeline.addAudioTrack(testAudio[0], "AudioTest");//,
            //track2 = timeline.addArtworkTrack(testResources[2]),
            //track3 = timeline.addArtworkTrack(testResources[3]),
            //track4 = timeline.addArtworkTrack(testResources[4]);

        track0.addDisplay(timeManager.timeToPx(0), 5);
        //track1.addDisplay(timeManager.timeToPx(5), 5);
        track0.addDisplay(timeManager.timeToPx(10), 7);
        //track1.addDisplay(timeManager.timeToPx(17), 8);
        track0.addDisplay(timeManager.timeToPx(25), 10);

        timeline.onUpdate();
    }

    /**
     * Material for demo
     */
    function testDemo(timeline, timeManager) {
        var i, displays, rin,
            track0 = timeline.addArtworkTrack(testResources[0], "Haystacks"),
            track1 = timeline.addArtworkTrack(testResources[1], "Garibaldi Panorama"),
            track2 = timeline.addAudioTrack(testAudio[1], "Audio"),
            disp0, key0, key1;

        //track0.addDisplay(timeManager.timeToPx(0), 8);
        //track1.addDisplay(timeManager.timeToPx(8), 6);
        track0.addDisplay(timeManager.timeToPx(0), 4);
        disp0 = track1.addDisplay(timeManager.timeToPx(4), 10);
        track0.addDisplay(timeManager.timeToPx(14), 5);

        // audio
        track2.addDisplay(timeManager.timeToPx(0), 180);

        key0 = disp0.addKeyframe(timeManager.timeToPx(5));
        key0.loadRIN("<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='0' Viewport_Y='-0.09984642817137874' Viewport_Width='1' Viewport_Height='0.2109375'/>");
        key1 = disp0.addKeyframe(timeManager.timeToPx(9));
        key1.loadRIN("<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='0.021664630037101146' Viewport_Y='0.00045129340904827893' Viewport_Width='0.049606282874006216' Viewport_Height='0.010463825293735686'/>");
        disp0.addKeyframe(timeManager.timeToPx(13)).loadRIN("<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='0.040299281871932956' Viewport_Y='0.00041899765196884864' Viewport_Width='0.049606282874006216' Viewport_Height='0.010463825293735686'/>");

        timeline.onUpdate();
    }

    function testOverlap(timeline, timeManager) {
        var i, displays, rin,
            track0 = timeline.addArtworkTrack(testResources[0], "Haystacks"),
            track1 = timeline.addArtworkTrack(testResources[1], "Garibaldi Panorama"),
            track2 = timeline.addAudioTrack(testAudio[1], "Audio"),
            disp0, key0, key1;

        //track0.addDisplay(timeManager.timeToPx(0), 8);
        //track1.addDisplay(timeManager.timeToPx(8), 6);
        track0.addDisplay(timeManager.timeToPx(0), 4);
        disp0 = track1.addDisplay(timeManager.timeToPx(4), 10);
        track0.addDisplay(timeManager.timeToPx(10), 7);

        // audio
        track2.addDisplay(timeManager.timeToPx(0), 180);

        key0 = disp0.addKeyframe(timeManager.timeToPx(5));
        key0.loadRIN("<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='0' Viewport_Y='-0.09984642817137874' Viewport_Width='1' Viewport_Height='0.2109375'/>");
        key1 = disp0.addKeyframe(timeManager.timeToPx(9));
        key1.loadRIN("<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='0.021664630037101146' Viewport_Y='0.00045129340904827893' Viewport_Width='0.049606282874006216' Viewport_Height='0.010463825293735686'/>");
        disp0.addKeyframe(timeManager.timeToPx(13)).loadRIN("<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='0.040299281871932956' Viewport_Y='0.00041899765196884864' Viewport_Width='0.049606282874006216' Viewport_Height='0.010463825293735686'/>");

        timeline.onUpdate();
    }

    /**
     * Dumb + fast test of viewer updating using pre-coded TAGTest narrative
     * @param viewer
     */
    function testRINreload(viewer) {
        viewer.loadTour('js/RIN/web/narratives/TAGTest/narrative.js', function () { console.log('TAG RIN data loaded !!! ???'); });
    }

    /**
     * Testing JSON RINdata + server send/recieve
     */
    function testServer() {
        var repository = "http://cs.brown.edu/research/lads/LADS2.0Data/repository.xml",
            tourdoq;
        LADS.Worktop.Database.load(repository);

        testNewTour();
        //load all tours
        var alltours = LADS.Worktop.Database.getAllTours();
        testModifyTour(alltours[0].Identifier);
        alltours = LADS.Worktop.Database.getAllTours();
        testModifyTour(testNewTour().Identifier);
        alltours = LADS.Worktop.Database.getAllTours();
    }

    /**
     * Test creating tours
     */
    function testNewTour() {
        //create a new tour
        tourdoq = LADS.Worktop.Database.createTour();
        return tourdoq;
    }

    /**
     * Test modification of Name, Content, and Thumbnail fields
     * These are the only fields Tour Authoring needs to worry about
     */
    function testModifyTour(id) {
        //modify/update the tour
        var xml = LADS.Worktop.Database.getDoqXML(id);
        var parser = new DOMParser();
        var tourXML = $(parser.parseFromString(xml, 'text/xml'));
        //change name
        tourXML.find('Name').text("new name");
        //change content, the json object
        tourXML.find("d3p1\\:Key:contains('Content') + d3p1\\:Value").text("[]");
        //change thumbnail
        tourXML.find("d3p1\\:Key:contains('Thumbnail') + d3p1\\:Value").text("http://www.cs.brown.edu/research/lads/images/waterfallzoom.jpg");
        LADS.Worktop.Database.pushXML(tourXML[0], id, "Tour");
    }

    /**
     * Test deletion
     */
    function testDeleteTour(id) {
        LADS.Worktop.Database.deleteDoq(id, "Tour");
    }

    /**
     * Hack to get audio loaded for editing
     */
    function makeDemo(timeline) {
        timeline.addAudioTrack(testAudio[2], "Audio");
    }

    return {
        trackEditTest: trackEditTest,
        testRINreload: testRINreload,
        testDemo: testDemo,
        testTrackReload: testTrackReload,
        testServer: testServer,
        makeDemo: makeDemo,
        testOverlap: testOverlap
    };
})();