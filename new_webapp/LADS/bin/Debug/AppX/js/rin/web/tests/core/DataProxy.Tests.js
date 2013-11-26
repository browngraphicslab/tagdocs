/// <reference path="../../lib/rin-core-1.0.js"/>
/// <reference path="http://code.jquery.com/qunit/qunit-1.10.0.js" />

(function () {
    var narrativeUrl = rin.test.configuration.narrativeUrl || rin.test.configuration.location + "../narratives/Ladakh/narrative.js";
    module("Data Proxy");
    asyncTest("Load Narrative", function () {
        var message;
        var func = function () {
            var dataProxy = new rin.internal.DemoRinDataProxy();
            dataProxy.getRinDataAsync(narrativeUrl,
                function (statusMessage) {
                    message = statusMessage;
                },
                function (rinData) {
                    start();
                    ok(rinData && !rinData.error);
                    ok(message);
                });
        };
        if (rin.internal.systemResourcesProcessed) {
            func();
        } else {
            rin.processAll(null, rin.test.configuration.rootPath).then(func);
        }
    });

    asyncTest("Load Narrative 2", function () {
        var func = function () {
            var dataProxy = new rin.internal.DemoRinDataProxy();
            dataProxy.getRinDataAsync(narrativeUrl,
                null,
                function (rinData) {
                    start();
                    ok(rinData && !rinData.error);
                });
        };
        if (rin.internal.systemResourcesProcessed) {
            func();
        } else {
            rin.processAll(null, rin.test.configuration.rootPath).then(func);
        }
    });

    asyncTest("Load Narrative 3", function () {
        var func = function () {
            var dataProxy = new rin.internal.DemoRinDataProxy();
            dataProxy.getRinDataAsync(null,
                null,
                function (rinData) {
                    start();
                    ok(rinData && rinData.error);
                });
        };
        if (rin.internal.systemResourcesProcessed) {
            func();
        } else {
            rin.processAll(null, rin.test.configuration.rootPath).then(func);
        }
    });

    test("Load Narrative 3", function () {
        var func = function () {
            var dataProxy = new rin.internal.DemoRinDataProxy();
            dataProxy.getRinDataAsync(null,
                null,
                null);
        };
        if (rin.internal.systemResourcesProcessed) {
            func();
        } else {
            rin.processAll(null, rin.test.configuration.rootPath).then(func);
        }
        ok(true);
    });

    test("Load Narrative 3", function () {
        var func = function () {
            var dataProxy = new rin.internal.DemoRinDataProxy();
            dataProxy.getRinDataAsync(narrativeUrl,
                null,
                null);
        };
        if (rin.internal.systemResourcesProcessed) {
            func();
        } else {
            rin.processAll(null, rin.test.configuration.rootPath).then(func);
        }
        ok(true);
    });
}());