LADS.Util.makeNamespace("LADS.Document.Doq");
LADS.Document.Doq = function (options) {
    options = LADS.Util.setToDefaults(options, LADS.Document.Doq.default_args);
    var DoqType = options.DoqType;
    var metaDict = options.metaDict;
    var xmlLocation = options.XMLLocation;

    this.metadataContains = function (str) {
        return metaDict.contains(str);
    };
    this.metadataSet = function (str, value) {
        metaDict.set(str, value);
    };
    this.metadataGet = function (str) {
        var toReturn = metaDict.get(str);
        if (!toReturn) toReturn = "Unknown";
        return toReturn;
    };
    this.metadataMatch = function (str, value) {
        return metaDict.match(str, value);
    };
    this.metadataGetKeys = function () {
        return metaDict.getKeys();
    };
    this.reload = function () {
        this = LADS.Document.DocFromXML(xmlLocation);
    };
    this.xmlLocation = function () {
        return xmlLocation;
    };

};

LADS.Document.Doq.DoqType = Object.freeze(
{
    EMPTY: { value: 0 },
    IMAGE: { value: 1 }
});

LADS.Document.Doq.default_args = (function () {
    md = new LADS.Document.Metadata.MetadataDict();
    md.type = LADS.Document.Doq.DoqType.EMPTY;
    return {
        MetaDict: md,
        XMLLocation: ""
    };
})();

LADS.Document.DocFromXML = function (url) {
    var xmlhttp = LADS.Util.makeXmlRequest(url);
    var xml = xmlhttp.responseXML;
    var nodes = xml.documentElement.querySelectorAll("DOQ,MetadataList");
    return new LADS.Document.Doq(
    {
        metaDict: LADS.Document.Metadata.MetadataDictFromXML(nodes[0]),
        XMLLocation:url
    });
};
