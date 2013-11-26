/// <reference path="../src/core/Common.js" />
/// <reference path="../src/core/TaskTimer.js" />
/// <reference path="../src/contracts/IExperienceStream.js" />


window.RinPlayerTests = window.RinPlayerTests || {};
RinPlayerTests = {

    runAllTests: function (outputDiv) {
        if (!outputDiv) return;
        this.BCLTests();
        this.PubSubTest();
        outputDiv.innerHTML += "<p>RinPlayer unit tests done</p>";
    },
    testTaskTimer: function () {
        var taskTimer = new rin.internal.TaskTimer();
        //taskTimer.a
    },

    timerTest1: function (prefix, interval, tick) {
        var timer = new rin.internal.Timer();
        timer.data = prefix || "ticked";
        timer.tick = tick || function () { rin.internal.debug.write(this.data + " at:" + new Date().toTimeString()); }
        timer.interval = interval || 1;
        timer.start();
    },

    timerTest2: function () {
        this.timerTest1("1secTimer", 1);
        this.timerTest1("3secTimer", 3);
    },

    stopWatchTimerTest1: function () {
        var stopWatch = new rin.internal.StopWatch();
        stopWatch.start();
        rin.internal.Timer.startTimer(1,
            function () {
                rin.internal.debug.write(this.data + stopWatch.getElapsedSeconds());
            }, "stopwatch: ");

        rin.internal.Timer.startTimer(4,
            function () {
                if (stopWatch.getIsRunning()) stopWatch.stop(); else stopWatch.start();

                rin.internal.debug.write(this.data + new Date().toTimeString() + ". isRunning: " + stopWatch.getIsRunning());
            }, "toggle stopwatch at: ");

    },

    BCLTests: function () {
        var arr = new rin.internal.List( "a", "b", "c" );
        var predicate = function (x) { return x > 'a' };
        rin.internal.debug.assert(arr.firstOrDefault() == "a");
        rin.internal.debug.assert(arr.firstOrDefault(predicate) == "b");
        rin.internal.debug.assert(arr.lastOrDefault() == "c");
        rin.internal.debug.assert(arr.lastOrDefault(predicate) == "c");
        rin.internal.debug.assert(arr.lastOrDefault(function (x) { return x == "b" }) == "b");

        arr = new rin.internal.List();
        rin.internal.debug.assert(arr.lastOrDefault() == null);
        rin.internal.debug.write("BCLTests Done");

        var obj = { a: 10, b: true, arr: [1, 2, { oa: 11, ob: ["x", "y", { x: "x"}]}], o: { a: 11, b: false} };
        var copy = rin.util.deepCopy(obj);
        rin.internal.debug.assert(obj.a == copy.a && obj.b == copy.b && obj.arr.length == copy.arr.length);
        rin.internal.debug.assert(obj.arr[0] == copy.arr[0] && obj.arr[2].oa == copy.arr[2].oa && obj.arr[2].oa[2] == copy.arr[2].oa[2] && obj.o.b == copy.o.b);

        var queryStrings = rin.util.getQueryStringParams("?a=b&c=d&x=false");
        rin.internal.debug.assert(queryStrings["a"] == "b" && !!(queryStrings["c"] != "false") && !!(queryStrings["x"] != "false") == false);

        rin.internal.debug.assert(rin.util.getQueryStringParams("")["a"] == null && rin.util.getQueryStringParams("?")["a"] == null);
        rin.internal.debug.assert(rin.util.getQueryStringParams("?a=a")["a"] == "a");
    },

    PubSubTest: function () {
        var obj = new rin.contracts.Event();
        var outputs = [];
        obj.subscribe(function (args) { outputs.push(args) });
        obj.subscribe(function (args) { outputs.push("_" + args) }, "id1");

        obj.publish("XXX");
        rin.internal.debug.assert(outputs.length == 2 && outputs[1] == "_XXX");

        outputs = [];
        obj.unsubscribe("id1");
        obj.publish("XXX");
        rin.internal.debug.assert(outputs.length == 1 && outputs[0] == "XXX");

        outputs = [];
        obj.unsubscribe(function (args) { outputs.push(args) });
        obj.publish("XXX");
        rin.internal.debug.assert(outputs.length == 0);

    },

    testTaskTimer1: function () {
        var tt = new rin.internal.TaskTimer();
        tt.taskTriggeredEvent = function (taskItems) {
            for (var i = 0; i < taskItems.length; i++)
                rin.internal.debug.write("{0} {1}:{2}".rinFormat(new Date().toTimeString(), taskItems[i].offset, taskItems[i].context));
        }
        tt.add(5, "five");
        tt.add(1, "one");
        tt.add(1, "one again");
        tt.add(5.3, "five.last");
        tt.add(1.5, "onehalf");
        tt.play();
    },

    testTaskTimer2: function () {
        var tt = new rin.internal.TaskTimer();
        tt.taskTriggeredEvent = function (taskItems) {
            for (var i = 0; i < taskItems.length; i++)
                rin.internal.debug.write("{0} {1}:{2}".rinFormat(new Date().toTimeString(), taskItems[i].offset, taskItems[i].context));
        }
        tt.play();
        rin.internal.debug.assert(tt._nextItemIndex == -1);
    },


    testTaskTimer3: function () {
        var tt = new rin.internal.TaskTimer();
        tt.taskTriggeredEvent = function (taskItems) {
            for (var i = 0; i < taskItems.length; i++)
                rin.internal.debug.write("{0} {1}:{2}".rinFormat(new Date().toTimeString(), taskItems[i].offset, taskItems[i].context));
        }
        tt.add(10, "ten last");
        tt.add(5, "five");
        tt.add(1, "one");
        tt.add(3.11, "threeLater");
        tt.add(3, "three");
        tt.add(1, "one again");
        tt.add(1, "one again again");
        tt.add(5.3, "five.later");
        tt.add(1.5, "onehalf");
        tt.add(.5, "half");
        tt.play();
        return tt;
    },

    testTaskTimerWithOperations1: function () {
        var tt = this.testTaskTimer3();
        rin.internal.Timer.startTimer(4, function () {
            var v = rin.util.randInt(1, 3);
            if (v == 1) { rin.internal.debug.write("pausing"); tt.pause(); }
            if (v == 3) { rin.internal.debug.write("playing"); tt.play(); }
            if (v == 2) { var seekPoint = rin.util.rand(0, 10); rin.internal.debug.write("seeking to " + seekPoint); tt.seek(seekPoint); }
        });
    },

    XmlHelperTests: function () {
        var infoXml = RinModel.MockNarrativeData.data["narrative-info"];
        var elem = new rin.internal.XElement(infoXml);
        var title = elem.elementValue("Title");
        var desc = elem.elementValue("Description");
        var attr1 = elem.attributeValue("attr1");
        var invalid = elem.elementValue("na", null);
        rin.internal.debug.assert(elem.elementValue("Author") == "Naren" && title && desc && attr1 == "val1" && invalid == null);
    }
};