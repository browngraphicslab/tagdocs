/// <reference path="../lib/rin-core-1.0.js"/>
/// <reference path="http://code.jquery.com/qunit/qunit-1.10.0.js" />


(function () {
    
    var config = {
        location : "",
        narrativeUrl : "../narratives/lite/narrative.js",
        rootPath : ".."
    };

    rin.test = rin.test || {};
    
    rin.util.overrideProperties(rin.test.configuration, config);
    rin.test.configuration = config;

    var combine = rin.util.combinePathElements;
    var testScripts =
        [
            combine(rin.test.configuration.location, "core/BCL.Tests.js"),
            combine(rin.test.configuration.location, "core/Promise.Tests.js"),
            combine(rin.test.configuration.location, "core/DeferredLoader.Tests.js"),
            combine(rin.test.configuration.location, "core/DataProxy.Tests.js"),
            combine(rin.test.configuration.location, "core/TransitionService.Tests.js")
        ];

    var testLoader = new rin.internal.DeferredLoader(window);
    testLoader.sequentialLoader(testScripts);

}());