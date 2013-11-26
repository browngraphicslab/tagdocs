LADS.Util.makeNamespace("LADS.Document.Database");

LADS.Document.Database = (function () {

    var artworks;
    var Doqs = [];
    var Folders = {};
    var GUIDs = {};
    var Linqs = {};
    var Templates = {};
    var Anchors = {};
    var Exhibitions = [];

    return {
        load: load,
        getArtworks: getArtworks,
        getDoqs: getDoqs,
        getFolders: getFolders,
        getDoqFromGUID: getDoqFromGUID,
        getLinqsFromGUID: getLinqsFromGUID,
        getTemplateFromGUID: getTemplateFromGUID,
        getAnchorFromGUID: getAnchorFromGUID,
        getExhibitions:getExhibitions
    };

    function getExhibitions() {
        return Exhibitions;
    }

    function getLinqsFromGUID(guid) {
        var a = Linqs[guid];
        return Linqs[guid];
    }

    function getTemplateFromGUID(guid) {
        return Templates[guid];
    }

    function getAnchorFromGUID(guid) {
        return Anchors[guid];
    }

    function addLinq(curLinq) {
        var GUID = curLinq.guid;
        if (GUIDs[GUID]) GUID = getUniqueGUID();
        curLinq.guid = GUID;
        GUIDs[GUID] = curLinq;
        var doqLinqList = Linqs[curLinq.doq1] || [];
        doqLinqList.push(curLinq);
        Linqs[curLinq.doq1] = doqLinqList;
        doqLinqList = Linqs[curLinq.doq2] || [];
        doqLinqList.push(curLinq);
        Linqs[curLinq.doq2] = doqLinqList;
    }

    function getUniqueGUID() {
        var attempt = (Math.round(Math.random() * 10000000000)).toString(16);
        while (GUIDs[attempt]) {
            attempt = (Math.round(Math.random() * 10000000000)).toString(16);
        }
        return attempt;
    }

    function load(docURL, callback) {
        var i, nodes, anchorxml, curLoc, xml2;
        var xmlhttp = LADS.Util.makeXmlRequest(docURL);
        var xml = xmlhttp.responseXML;

        
        var doqLocations = xml.documentElement.querySelectorAll("REPOSITORY,DOQS");
        for (i = 0; i < doqLocations.length; i++)
        {
            curLoc = doqLocations[i].getAttribute('location');
            xml2 = LADS.Util.makeXmlRequest(curLoc).responseXML;
            nodes = xml2.documentElement.querySelectorAll("DOQS,DOQ");
            for (i = 0; i < nodes.length; i++) {
                var curDoq = LADS.Document.DocFromXML(nodes[i].getAttribute("location"));
                var folders;
                for (var r = 0; r < 1; r++) {
                    curDoq = $.extend(true, {}, curDoq);
                    var GUID = curDoq.metadataGet("GUID");
                    if (GUIDs[GUID]) GUID = getUniqueGUID();
                    curDoq.metadataSet("GUID", GUID);
                    GUIDs[GUID] = curDoq;
                    folders = curDoq.metadataGet("Folders");
                    if (folders) {
                        folders = folders.split("^^");
                        for (var fid in folders) {
                            addToFolder(folders[fid], curDoq);
                        }
                    }
                    Doqs.push(curDoq);
                }
            }
        }
        
        //LOAD LINQS
        var linkLocations = xml.documentElement.querySelectorAll("REPOSITORY,LINQS");
        for (i = 0; i < linkLocations.length; i++) {
            var linqxml = LADS.Util.makeXmlRequest(linkLocations[i].getAttribute("location")).responseXML;
            var linqs = linqxml.documentElement.querySelectorAll("Linqs,Linq");
            for (var j = 0; j < linqs.length; j++) {
                var curLinq = LADS.Document.Linq.LinqFromXML(linqs[j]);
                addLinq(curLinq);
            }
        }

        var templateLocations = xml.documentElement.querySelectorAll("REPOSITORY,TEMPLATES");
        for (i = 0; i < templateLocations.length; i++)
        {
            var tempxml = LADS.Util.makeXmlRequest(templateLocations[i].getAttribute("location")).responseXML;
            nodes = tempxml.documentElement.querySelectorAll("TEMPLATES,TEMPLATE");
            for (i = 0; i < nodes.length; i++) {
                var temp = new LADS.Document.Template(nodes[i]);
                Templates[temp.guid] = temp;
            }
        }

        var anchorLocations = xml.documentElement.querySelectorAll("REPOSITORY,ANCHORS");
        for (i = 0; i < anchorLocations.length; i++) {
            anchorxml = LADS.Util.makeXmlRequest(anchorLocations[i].getAttribute("location")).responseXML;
            nodes = anchorxml.documentElement.querySelectorAll("ANCHORS,ANCHOR");
            for (i = 0; i < nodes.length; i++) {
                var anch = new LADS.Document.Anchor(nodes[i]);
                Anchors[anch.guid] = anch;
            }
        }

        var constantLocations = xml.documentElement.querySelectorAll("REPOSITORY,CONSTANTS");
        for (i = 0; i < constantLocations.length; i++) {
            anchorxml = LADS.Util.makeXmlRequest(constantLocations[i].getAttribute("location")).responseXML;
            nodes = anchorxml.documentElement.querySelectorAll("Constants,CONSTANT");
            for (i = 0; i < nodes.length; i++) {
                LADS.Util.Constants.set(nodes[i].getAttribute('name'), nodes[i].getAttribute('value'));
            }
        }

        var exhibitions = xml.documentElement.querySelectorAll("REPOSITORY,EXHIBITION");
        for (i = 0; i < exhibitions.length; i++) {
            var toReturn = { title: "", description: "", folders: [] };
            curLoc = exhibitions[i].getAttribute('location');
            xml2 = LADS.Util.makeXmlRequest(curLoc).responseXML;

            var collection = xml2.documentElement.querySelectorAll("Collection")[0];
            toReturn.title = collection.getAttribute('title');
            toReturn.description = collection.getAttribute('description');
            toReturn.img1 = collection.getAttribute('img1');
            toReturn.img2 = collection.getAttribute('img2');
            nodes = xml2.documentElement.querySelectorAll("Collection,FOLDER");
            for (i = 0; i < nodes.length; i++) {
                toReturn.folders.push(nodes[i].getAttribute("value"));
            }
            Exhibitions.push(toReturn);
        }

        if (callback)
        callback();
    }
    function addToFolder(folder, doq) {
        Folders[folder] = Folders[folder] || new LADS.Document.Folder(folder);
        Folders[folder].addDoq(doq);
    }
    function getDoqFromGUID(guid){ return GUIDs[guid]; }


    function getArtworks() { return artworks; }
    function getDoqs(){ return Doqs; }
    function getFolders(){ return Folders; }
})();