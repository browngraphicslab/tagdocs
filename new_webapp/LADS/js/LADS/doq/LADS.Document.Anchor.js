LADS.Util.makeNamespace("LADS.Document.Anchor");

LADS.Document.Anchor = function (elt) {
    this.guid = elt.getAttribute("guid");
    this.doq = elt.getAttribute('doq');
    this.type = elt.getAttribute('type');
    if (this.type === 'region' || this.type === 'dzregion')
        this.rect = getRect(elt.getAttribute('rect'));
    this.template = elt.getAttribute('template');
    this.data = getData(elt.getAttribute('data'));

    function getRect(rect) {
        var parts = rect.split(",");
        var toReturn = {};
        toReturn.x = parts[0];
        toReturn.y = parts[1];
        toReturn.w = parts[2];
        toReturn.h = parts[3];
        toReturn.cx = toReturn.x + (toReturn.w / 2);
        toReturn.cy = toReturn.y + (toReturn.h / 2);
        return toReturn;
    }
    function getData(data) {
        if (!data) return {};
        var toReturn = {};
        var parts = data.split('^^');
        for (var i = 0; i < parts.length; i++) {
            var temp = parts[i].split(":");
            toReturn[$.trim(temp[0])] = $.trim(temp[1]);
        }
        return toReturn;
    }
};

LADS.Util.makeNamespace("LADS.Document.AnchorData");
