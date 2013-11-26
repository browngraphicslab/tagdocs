LADS.Util.makeNamespace("LADS.Document.Template");

LADS.Document.Template = function (elt) {

    var root = null;
    var doq = null;
    var anchor = null;
    this.guid = elt.getAttribute("guid");
    function parseRoot() {
        parseNode(elt, root);
    }
    function parseNode(node, parent) {
        for (var i = 0; i < node.childNodes.length; i++) {
            var toParse = node.childNodes[i];
            if (toParse.tagName) {
                var toAdd = document.createElement(toParse.tagName);
                for (var j = 0; j < toParse.attributes.length; j++) {
                    parseAttribute(toParse, toAdd, toParse.attributes[j]);
                }
                parseNode(toParse, toAdd);
                if (toParse.tagName === "img") {
                    toAdd.removeAttribute("width");
                    toAdd.removeAttribute("height");
                }
                parent.appendChild(toAdd);
            }
            else parent.innerText = parseAttributeValue(toParse.text);
        }
    }

    function parseAttribute(node, obj, attr) {
        var toSetName = $.trim(attr.name);
        var toSetValue = "";
        var attrs = attr.nodeValue.split(";");
        for (var i = 0; i < attrs.length; i++) {
            var parts = $.trim(attrs[i]).split(":");
            if (parts.length > 1) {
                toSetValue += $.trim(parts[0]) + ":";
                toSetValue += parseAttributeValue($.trim(parts[1])) + ";";
            }
            else {
                toSetValue += parseAttributeValue($.trim(parts[0])) + ";";
            }
        }
        obj.setAttribute(toSetName, toSetValue.slice(0, toSetValue.length - 1));
    }

    function parseAttributeValue(val) {
        var parts = val.split("$$");
        if (parts.length > 1) {
            toRetrieve = parts[1];
            if (parts[0] === "D") {
                if (doq.metadataContains(toRetrieve)) return doq.metadataGet(toRetrieve);
                return "";
            }
            if (parts[0] === "A") {
                if (anchor.data[parts[1]]) return anchor.data[parts[1]];
                return "";
            }
        }
        else return val;
    }

    this.applyTemplate = function (doqObj, anchorObj) {
        root = document.createElement('div');
        var test = document.createElement('div');
        doq = doqObj;
        anchor = anchorObj;
        parseNode(elt, test);
        $(root).append($(test));
        return root;
    };
};