LADS.Util.makeNamespace("LADS.Timeline");

LADS.Timeline = function (rootElt) {








    //PUBLIC METHODS:
    this.sortTimeline = null;//sorttimeline;
    this.addPickedHandler = null;//addPickedHandler;
    this.removePickedHandler = null;// removePickedHandler;
    this.setArrayDataSource = null;//setArrayDataSource;

    //PRIVATE VARIABLES
    var artDS = {};
    var groupedArtDS = {};
    var groupedItemDS = {};
    var rootElement = rootElt;
    var timelineName = rootElement.id + 'timelineListView';
    var pickedHandlers = [];
    var displayTag = "Name";
    var dataSource = null;
    var curFolder = null;
    var listRoot1 = null;
    var listRoot2 = null;
    that = this;

    function init() {
        makeListRoot();
        var tempdiv = document.createElement('div');
        $(tempdiv).css({width:"100%",height:"100%", "overflow": "auto", "overflow-y": "hidden" });
        tempdiv.appendChild(listRoot1);
        rootElement.appendChild(tempdiv);
    }

    function switchTo(elements) {
        var dest1=[];
        var dest2=[];
        for (var i = 0; i < elements.length; i++) {
            if (i % 2 === 0) dest1.push(elements[i]);
            else dest2.push(elements[i]);
        }
        elements = dest1.concat(dest2);
        if($(listRoot1).children().length<elements.length)
        $(listRoot1).css({ width: (((elements.length + 1) * 304) / 2 + 1) + "px" });
        $(listRoot1).quicksand($(elements), { duration: 800, easing: "easeInOutQuad", adjustHeight: false },
        function () {
            $(listRoot1).css({ width: (((elements.length + 1) * 304) / 2 + 1) + "px" });
            $(listRoot1).children().each(function () {
                $(this).on("click", function () {
                    pickedDocument(LADS.Document.Database.getDoqFromGUID($(this).attr("data-id")));
                });
            });
        });
    }

    this.setFolder = function (folder) {
        curFolder = folder;
        ds = [];
        var doqs = folder.getDoqs();
        var tempDiv = document.createElement('div');
        for (doq in doqs) {
            var curDoq = doqs[doq];
            tempDiv.appendChild(makeListElementFromDoq(curDoq));
        }
        switchTo($(tempDiv).find('li'));
    }

    this.setDisplayTag = function (tag) {
        displayTag = tag;
        if (curFolder) this.setFolder(curFolder);
    }

    function makeListRoot() {
        var list = document.createElement("ul");
        $(list).css({position: "relative",height:"100%","list-style-type":"none"});
        listRoot1 = list;
    }

    var makeListElementFromDoq = function (doq) {
        var itemTemplate = document.createElement('li');
        itemTemplate.setAttribute('data-id', doq.metadataGet("GUID"));
        itemTemplate.style.display = "inline-block";
        var itemTemplateImage = document.createElement('img');
        itemTemplateImage.setAttribute('src', doq.metadataGet("Icon"));
        itemTemplateImage.setAttribute('style', 'position:relative;width:300px;height:200px;margin: 2px;');
        var itemTemplateTitle = document.createElement('div');
        itemTemplateTitle.innerText = doq.metadataGet(displayTag);
        itemTemplateTitle.setAttribute('style', 'position:absolute;width:100%;text-align:center;top:0px;border:solid 3px rgba(0,0,0,0);background-color:rgba(0,0,0,0.6);');
        var tempDiv = document.createElement('div');
        tempDiv.setAttribute('style', 'position:relative');
        tempDiv.appendChild(itemTemplateImage);
        tempDiv.appendChild(itemTemplateTitle);
        itemTemplate.appendChild(tempDiv);
        return itemTemplate;
    }

    this.addPickedHandler = function addPickedHandler(handler) {
        pickedHandlers.push(handler);
    }

    this.removePickedHandler = function removePickedHandler(handler) {
        var idx = pickedHandlers.indexOf(handler);
        if (idx != -1) pickedHandlers.splice(idx, 1);
    }

    function pickedDocument(doq) {
        for (var i = 0; i < pickedHandlers.length; i++) {
            pickedHandlers[i](doq);
        }
    }
    this.sortTimeline = function sorttimeline(sortBy) {

        curFolder.sort(sortBy);
        that.setFolder(curFolder);
    }


    init();
};