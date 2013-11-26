/// <reference path="../../lib/rin-core-1.0.js"/>
/// <reference path="http://code.jquery.com/qunit/qunit-1.10.0.js" />

(function () {
    module("Transition Service");
    var testTransition = new rin.internal.TransitionEffect();
    testTransition.transitionInDuration = 5;
    testTransition.transitionOutDuration = 10;

    asyncTest("FadeInTransition", function () {
        var testDiv = document.createElement("div");
        var startTime = Date.now();
        testTransition.transition.TransitionIn(testDiv, testTransition.transitionInDuration, function () {
            var endTime = Date.now();
            equal(((endTime - startTime) / 1000) | 0, testTransition.transitionInDuration);
            equal(Math.round(testDiv.style.opacity), 1);
            start();
        });
    });

    asyncTest("FadeOutTransition", function () {
        var testDiv = document.createElement("div");
        var startTime = Date.now();
        testTransition.transition.TransitionOut(testDiv, testTransition.transitionOutDuration, function () {
            var endTime = Date.now();
            equal(((endTime - startTime) / 1000) | 0, testTransition.transitionOutDuration);
            equal(Math.round(testDiv.style.opacity), 0);
            start();
        });
    });
}());