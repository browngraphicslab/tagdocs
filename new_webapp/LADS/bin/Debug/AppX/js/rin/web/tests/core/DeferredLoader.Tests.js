/// <reference path="../../lib/rin-core-1.0.js"/>
/// <reference path="http://code.jquery.com/qunit/qunit-1.10.0.js" />

(function(){
    module("Deferred Loader");

    test("Test 1", function () {
        var defLoader = new rin.internal.DeferredLoader();
        ok(defLoader, "Deferred Loader Created")
    });

    asyncTest("Test 2", function () {
        rin.processAll(null, rin.test.configuration.rootPath).then(function () {
            QUnit.start();
            ok(window.jQuery !== undefined &&
                window.ko !== undefined &&
                window.jQuery.easing["jswing"] !== undefined &&
                window.rin.internal.PlayerControllerES &&
                rin.internal.systemResourcesProcessed, "All resources processed = " + rin.internal.systemResourcesProcessed);
        }, function () {
            QUnit.start();
            ok(rin.internal.systemResourcesProcessed, "All resources processed = " + rin.internal.systemResourcesProcessed);
        });
    });
}());