/// <reference path="../../lib/rin-core-1.0.js"/>
/// <reference path="http://code.jquery.com/qunit/qunit-1.10.0.js" />

(function () {
    module("Core Tests");
    test("Deep Copy", function () {
        var obj = { a: 10, b: true, arr: [1, 2, { oa: 11, ob: ["x", "y", { x: "x" }] }], o: { a: 11, b: false } };
        var copy = rin.util.deepCopy(obj);
        deepEqual(copy, obj);
        equal(copy.arr.length, obj.arr.length);
        ok(obj.a == copy.a && obj.b == copy.b && obj.arr.length == copy.arr.length);
        ok(obj.arr[0] == copy.arr[0] && obj.arr[2].oa == copy.arr[2].oa && obj.arr[2].oa[2] == copy.arr[2].oa[2] && obj.o.b == copy.o.b);
    });

    test("Query String Parsing", function () {
        var queryStrings = rin.util.getQueryStringParams("?a=b&c=d&x=false");
        equal(queryStrings["a"], "b");
        equal(queryStrings["c"], "d");
        equal(queryStrings["x"], "false");

        equal(rin.util.getQueryStringParams("")["a"], null);
        equal(rin.util.getQueryStringParams("?")["a"], null);
        equal(rin.util.getQueryStringParams("?a=a")["a"], "a");
    });

    module("rin List Tests");
    test("Rin List", function () {
        var arr = new rin.internal.List("a", "b", "c");
        var predicate = function (x) { return x > 'a' };
        equal(arr.firstOrDefault(), "a");
        equal(arr.firstOrDefault(predicate), "b");
        equal(arr.lastOrDefault(), "c");
        equal(arr.lastOrDefault(predicate), "c");
        equal(arr.lastOrDefault(function (x) { return x == "b" }), "b");
    });

    test("List Reset", function () {
        var arr = new rin.internal.List();
        equal(arr.lastOrDefault(), null);
    });

    test("JSON Parser", function () {
        var obj = { a: 10, b: true, arr: [1, 2, { oa: 11, ob: ["x", "y", { x: "x" }] }], o: { a: 11, b: false } };
        var jsonString = "{\"a\":10,\"b\":true,\"arr\":[1,2,{\"oa\":11,\"ob\":[\"x\",\"y\",{\"x\":\"x\"}]}],\"o\":{\"a\":11,\"b\":false}}";
        var parsedData = rin.util.parseJSON(jsonString);
        deepEqual(parsedData, obj);
    });

    module("Event Model")
    test("Test 1", function () {
        var obj = new rin.contracts.Event();
        var outputs = [];
        obj.subscribe(function (args) { outputs.push(args) });
        obj.subscribe(function (args) { outputs.push("_" + args) }, "id1");

        obj.publish("XXX");
        equal(outputs.length, 2);
        equal(outputs[1], "_XXX");

        outputs = [];
        obj.unsubscribe("id1");
        obj.publish("XXX");
        equal(outputs.length, 1);
        equal(outputs[0], "XXX");

        outputs = [];
        obj.unsubscribe(function (args) { outputs.push(args) });
        obj.publish("XXX");
        equal(outputs.length, 0);
    });
}());