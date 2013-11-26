LADS.Util.makeNamespace("LADS.Document.Folder");

LADS.Document.Folder = function (folderName) {

    var name = folderName;
    var doqs = [];
    this.addDoq = function (doq) {
        if ($.inArray(doq, doqs) === -1) doqs.push(doq);
    };
    this.each = function (fn) {
        for (i = 0; i < doqs.length; i++) {
            fn(doqs[i]);
        }
    };

    this.getFirstDoq = function (metadata, value) {
        var temp = $.map($.extend(true, {}, doqs), function (x) { return x; });
        temp = temp.sort(function (a, b) { return d3.ascending(a.metadataGet(metadata), b.metadataGet(metadata)); });
        for (var i = 0; i < temp.length; i++) {
            if (value <= temp[i].metadataGet(metadata)) return temp[i];
        }
        return temp[i];
    };

    this.getDoqs = function () {
        return doqs;
    };

    //multi-parameter sorting: takes an array of fields
    this.sort = function (sortBy) {
        doqs.sort(function (a, b) {
            if (typeof sortBy === "string")
                return compare(a.metadataGet(sortBy), b.metadataGet(sortBy));
            for (var field in sortBy) {
                sortField = sortBy[field];
                if (!a.metadataGet(sortField)) return -1;
                if (!b.metadataGet(sortField)) return 1;
                var comp = compare(a.metadataGet(sortField), b.metadataGet(sortField));
                if (comp !== 0) return comp;
            }
            return 0;
        });
    };

    this.randomize = function () {
        doqs.sort(function () { return 0.5 - Math.random(); });
    };

    function compare(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }

};