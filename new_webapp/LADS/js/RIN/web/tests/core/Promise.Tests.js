/// <reference path="../../lib/rin-core-1.0.js"/>
/// <reference path="http://code.jquery.com/qunit/qunit-1.10.0.js" />

(function () {
    module("Promise");
    var asyncOperation = function (timeout, shouldSuccess) {
        var p = new rin.internal.Promise();
        setTimeout(function () {
            if (shouldSuccess) {
                p.markSuccess();
            } else {
                p.markFailed();
            }
        }, timeout || 5000);
        return p;
    };


    asyncTest("Test 1", function () {
        var x = "";
        asyncOperation(100, true).then(function () {
            x = x.concat("1");
            return asyncOperation(100, true);
        }).then(function () {
            x = x.concat("2");
            return asyncOperation(200, true).then(function () {
                x = x.concat("3");
                return asyncOperation(200, true).then(function () {
                    x = x.concat("4");
                    return asyncOperation(200, true);
                });
            }).then(function () {
                x = x.concat("5");
            });
        }).then(function () {
            x = x.concat("6");
        }).then(function () {
            x = x.concat("7");
        }).then(function () {
            equal(x, "1234567");
            QUnit.start();
        });
    });

    asyncTest("Test 2", function () {
        var p = new rin.internal.Promise();
        p.markSuccess();
        p.then(function () {
            ok(true);
            QUnit.start();
        });
    });

    asyncTest("Test 3", function () {
        var x = "";
        asyncOperation(100, false).then(function () {
            x = x.concat("1");
            return asyncOperation(100);
        }).then(function () {
            x = x.concat("2");
            return asyncOperation(200);
        }).then(function () {
            x = x.concat("3");
            //no promise returned
        }).then(function () {
            x = x.concat("4");
            return asyncOperation(200);
        }).then(function () {
            x = x.concat("5");
        }).then(function () {
            x = x.concat("6");
        }, function () {
            equal(x, "");
            QUnit.start();
        });
    });

    asyncTest("Test 4", function () {
        var x = "";
        asyncOperation(100, true).then(function () {
            x = x.concat("1");
            return asyncOperation(100, true);
        }).then(function () {
            x = x.concat("2");
            return asyncOperation(200, false);
        }).then(function () {
            x = x.concat("3");
            //no promise returned
        }).then(function () {
            x = x.concat("4");
            return asyncOperation(200);
        }).then(function () {
            x = x.concat("5");
        }).then(function () {
            x = x.concat("6");
        }, function () {
            equal(x, "12");
            QUnit.start();
        });
    });
}());