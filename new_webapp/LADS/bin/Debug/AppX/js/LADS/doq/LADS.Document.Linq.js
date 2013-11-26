LADS.Util.makeNamespace("LADS.Document.Linq");
LADS.Document.Linq = function (options) {



    options = LADS.Util.setToDefaults(options, LADS.Document.Linq.default_args);
};

(function () {
    LADS.Document.Linq.default_args = {};

    LADS.Document.Linq.LinqInfo = function (doq1, doq2, linqGuid, type1, type2, location1, location2, des1, des2, a1, a2) {
        return {
            doq1: doq1, doq2: doq2, guid: linqGuid,
            type1: type1, type2: type2, location1: location1,
            location2: location2, des1: des1, des2: des2,
            a1: a1, a2: a2
        };
    };
    LADS.Document.Linq.LinqFromXML = function (element) {
        var toReturn = [];
        var nodes = element.querySelectorAll("Linq");
        for (var i = 0; i < nodes.length; i++) {
            var id1 = element.getAttribute("id1");
            var id2 = element.getAttribute("id2");
            var a1 = element.getAttribute("a1");
            var a2 = element.getAttribute("a2");
            var guid = element.getAttribute("guid");
            var type1 = element.getAttribute("type1");
            var type2 = element.getAttribute("type2");
            var location1 = element.getAttribute("location1").split(",");
            location1 = { x: location1[0], y: location1[1] };
            var location2 = element.getAttribute("location2").split(",");
            location2 = { x: location2[0], y: location2[1] };
            var des1 = element.getAttribute("des1");
            var des2 = element.getAttribute("des2");
            return new LADS.Document.Linq.LinqInfo(id1, id2, guid, type1, type2, location1, location2, des1, des2, a1, a2);
        }
    };
})();



    /*
Linq:
GUID
DateTime
metadata
offset
target1
target2


LinqTargets
LinqSources



DoqRef

LinqTarget is LinqInfo: id, type, location



*/

