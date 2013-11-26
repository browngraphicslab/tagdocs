/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

window.rin = window.rin || {};
window.rin.internal = window.rin.internal || {};

rin.internal.XElement = function (xmlElement) {
    var elem = xmlElement;
    if (typeof xmlElement == "string") {
        elem = rin.internal.XmlHelper.parseXml(xmlElement).documentElement;
    }
    this.xmlElement = elem;
};

rin.internal.XElement.prototype = {
    xmlElement: null,
    element: function (childElementName) {
        var children = this.xmlElement.childNodes;
        for (var i = 0, len = children.length; i < len; i++)
            if (!childElementName || children[i].nodeName == childElementName) return new rin.internal.XElement(children[i]);
        return null;
    },
    elements: function (childElementName, elementOperation) {
        var out = [];
        var children = this.xmlElement.childNodes;
        for (var i = 0, len = children.length; i < len; i++)
            if (!childElementName || children[i].nodeName == childElementName) {
                var rinElement = new rin.internal.XElement(children[i]);
                out.push(rinElement);
                if (typeof elementOperation == "function") elementOperation(rinElement);
            }
        return out;
    },
    elementValue: function (childElementName, defaultValue) {
        var elem = this.element(childElementName);
        return elem ? elem.value() : defaultValue;
    },
    attributeValue: function (attributeName, defaultValue) {
        var attributes = this.xmlElement.attributes;
        for (var i = 0, len = attributes.length; i < len; i++)
            if (attributes[i].nodeName == attributeName) return attributes[i].value;
        return defaultValue;
    },
    value: function () {
        return this.xmlElement.text || this.xmlElement.textContent;
    }
};

rin.internal.XmlHelper = {
    parseXml: function (xmlString) {
        var xmlDoc;
        if (window.DOMParser) {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(xmlString, "text/xml");
        }
        else // IE
        {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(xmlString);
        }
        return xmlDoc;
    },
    loadXml: function (xmlFileUrl) {
        var xmlDoc, xmlhttp;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        }
        else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.open("GET", xmlFileUrl, false);
        xmlhttp.send();
        xmlDoc = xmlhttp.responseXML;
        return xmlDoc;
    }
};