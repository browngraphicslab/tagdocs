LADS.Util.makeNamespace("LADS.Document.Metadata");

LADS.Document.Metadata.MetadataDict = function (options) {
    
    var contents = LADS.Util.setToDefaults(options, LADS.Document.Metadata.MetadataDict.default_args);
    var that = this;
    this.match = function (str, value) {
        return (typeof contents[str] !== undefined) && (contents[str] === value);
    };
    this.contains = function (str) {
        return (typeof contents[str] !== undefined);
    };
    this.set = function (str, value) {
        contents[str] = value;
    };
    this.getKeys = function () {
        var keys = [];
        for (var key in contents) { keys.push(key); }
        return keys;
    };
    this.get = function (key) {
        if (that.contains(key)) return contents[key];
        else return undefined;
    };

};

//LINQ: id, rect region
//id1 id2 guid type1 type2 location1 location2 des1 des2
LADS.Document.Metadata.MetadataDict.default_args = {
    GUID: "",
    URL: "",
    Name: "",
    PrototypeID: "",
    CreatorID: "",
    Extension: "",
    Icon: "",
    Folders: {},
    Keywords: {}
};

LADS.Document.Metadata.MetadataDictFromXML = function(xml)
{
    var toReturn = new LADS.Document.Metadata.MetadataDict();
    var nodes = xml.querySelectorAll("Metadata");
    for (var i = 0; i < nodes.length; i++) {
        var value = nodes[i].getAttribute('value');
        var name = nodes[i].getAttribute('name');
        if (name === "GUID") {
            var x = 0;
        }
        toReturn.set(name, value);
    }
    toReturn.contains("name");
    return toReturn;
};