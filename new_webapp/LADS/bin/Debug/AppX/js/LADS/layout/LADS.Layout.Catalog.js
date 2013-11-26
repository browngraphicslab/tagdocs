LADS.Util.makeNamespace("LADS.Layout.Catalog");

/*
*   The layout definition for Catalog. 
*   Author: Alex Hills
*/

//Constructor. Takes an exhibition. Options, tag should = currentSort.
//TODO: remove one of tag or currentSort
LADS.Layout.Catalog = function (exhibition, split) {
    "use strict";

    //Lots of variables. Can probably remove some.
    var root, timeline,
        that = this,
        currentImage = null,
        timelineDiv,
        originmapDiv = null,
        map = null,
        originButton = null,
        artistButton = null,
        yearButton = null,
        titleButton = null,
        heatmapDiv = null,
        heatmapDivContainer = null,
        heatMap = null,
        row1 = null,
        selectedImage = null,
        sortSelector = null,
        originOption = null,
        titleOption = null,
        yearOption = null,
        artistOption = null,
        mapexpanded = null,
        sortContainer = null,
        timelineDivContainer = null,
        expandarrow = null,
        mapExpansionTime = 409,
        mapContractTime = 353,
        searchAndFilterContainer = null,//Contains the filter and search divs
        search = null,//search input element
        filterBox = null,//filter div;
        searchFilter = null,
        searchResultsDiv = null,
        filterLists = null,//never used!
        imageLoading = false,
        // options stuff
        options = LADS.Util.setToDefaults({}, LADS.Layout.Catalog.default_options),
        tag = options.tag,
        currentSort = options.currentSort; // this is the directory where our compiled Jade templates will live

    init();

    /*
    **Public function, will reload interactions that broke during animation for... no reason I can discern
    */
    this.loadInteraction = function () {
        timeline.setDisplayTag(options.tag);
    };
    /*
    **Creates initial structure of the page
    */
    function makeStructure() {
        root = LADS.Util.getHtmlAjax('catalogView.html');
        
        var overlay = root.find('.overlay');

        //create the background image
        var bgimage = root.find('.bgimage');
        bgimage.css({
            'background-image': "url(" + LADS.Worktop.Database.fixPath(exhibition.Metadata.BackgroundImage) + ")"
        });

        //make the header, including the back button and the name of the exhibition
        (function makeHeader() {
            var header = root.find('.header');

            var backButtonAreaLoading = header.find('.backButtonAreaLoading');
            var progressCircle = backButtonAreaLoading.find('.progressCircle');

            //left: 0px; top: 1%; width: 15%; height: 5%; position: absolute;
            var backButtonArea = header.find('.backButtonArea');
            var backButton = backButtonArea.find('#catalog-back-button');

            if (split === true) {
                backButton.css({ 'display': 'none' });
           }
            if (LADS.Util.Splitscreen.on()) {
                backButton.css({ 'display': 'none' });
            }

            //clicked effect
            backButton.mousedown(function () {
                LADS.Util.UI.cgBackColor("backButton", backButton, false);
            });

            backButton.mouseleave(function () {
                LADS.Util.UI.cgBackColor("backButton", backButton, true);
            });
            backButton.click(function () {
                backButton.off('click');
                if (!LADS.Util.Splitscreen.on()) { //disable going back to the exhibitions page if you are in splitscreen
                    var tempExhibitions = new LADS.Layout.Exhibitions(null, exhibitionHelper);
                    LADS.Util.UI.slidePageRightSplit(root, tempExhibitions.getRoot());
                }
                function exhibitionHelper(exhibitions) {
                    $(exhibitions).ready(function () {
                        exhibitions.clickExhibitionByDoq(exhibition);
                    });
                    root.css({ 'overflow-x': 'hidden' });
                }
            });
            var exhibitionTitle = header.find('.exhibitionTitle');
            exhibitionTitle.text(exhibition.Name);
        })();

        // row1 (contains: map/search bar/dropdown menu)
        row1 = root.find('.row1');

        // filter container
        searchAndFilterContainer = row1.find('#searchFilter');

        //The search and filter begins here.
        search = searchAndFilterContainer.find('#inputField'); // reorder so #searchFilter is defined here

        searchResultsDiv = root.find('#backgroundSearch');

        filterBox = searchAndFilterContainer.find('#filterContainer');
        
        //have the search container hidden in splitscreen mode
        if (LADS.Util.Splitscreen.on() || split) {
            searchAndFilterContainer.hide();
        }

        //make the heat map
        (function makeHeatmap() {
            heatmapDivContainer = row1.find('.heatmapDivContainer');

            //sort stuff
            var sortArea = heatmapDivContainer.find('.sortArea');

            //originButton = sortArea.find("#originButton");

            artistButton = sortArea.find("#artistButton");
            titleButton = sortArea.find("#titleButton");
            yearButton = sortArea.find("#yearButton");

            // Container for SVG
            heatmapDiv = heatmapDivContainer.find('.heatmapDiv');

            if (split || LADS.Util.Splitscreen.on()) {
                heatmapDiv.css('display', 'none');
                heatmapDivContainer.css({
                    'height': 'auto',
                });
            }
        })();

        //Map div for all maps
        (function makeMapDiv() {
            originmapDiv = heatmapDivContainer.find('.originmapDiv');

            //the expanding arrow
            var expandarrowdiv = heatmapDivContainer.find('.expandarrowdiv');

            if (split || LADS.Util.Splitscreen.on())
                expandarrowdiv.css('display', 'none');

            expandarrow = expandarrowdiv.find('.expandarrow');

            mapexpanded = false; // set the map unexpanded as default

            expandarrowdiv.click(function () {

                if (!mapexpanded) {

                    if (selectedImage !== null) {//if there is already a selected artwork, have the artwork unexpanded when expanding the map
                        selectedImage.hide(600, function () { selectedImage.remove(); selectedImage = null; });
                        return;
                    }
                    row1.animate({
                        'height': '60%'
                    }, mapExpansionTime);

                    $('#filterContainer').css('visibility', 'hidden');

                    var expandedWidth = row1.width() * 0.8;

                    heatmapDivContainer.animate({
                        'height': '100%',
                        'width': '80%',

                    }, mapExpansionTime);

                    //expand originmap while expanding the div
                    var scale = expandedWidth / heatmapDivContainer.width();

                    expandarrow.attr('src', 'images/icons/MapMinimize.jpg');
                    mapexpanded = true;

                }
                else {
                    unexpandMap();
                    // ben most: Commenting this out since there are no filters currently
                    //$('#filterContainer').css('visibility', 'visible');
                }
            });

        })();
 
        //make bing maps at the originmapDiv (NOT BEING USED!!!!!!)
        (function makeOriginMap() {
            Microsoft.Maps.loadModule('Microsoft.Maps.Map', { callback: initMap });
            function initMap() {
                var mapOptions =
                {
                    credentials: "AkNHkEEn3eGC3msbfyjikl4yNwuy5Qt9oHKEnqh4BSqo5zGiMGOURNJALWUfhbmj",
                    mapTypeID: Microsoft.Maps.MapTypeId.road,
                    showScalebar: true,
                    enableClickableLogo: false,
                    enableSearchLogo: false,
                    showDashboard: false,
                    showMapTypeSelector: false,
                    zoom: 2,
                    center: new Microsoft.Maps.Location(20, 0),
                };
                var viewOptions = {
                    mapTypeId: Microsoft.Maps.MapTypeId.road,
                };

                map = new Microsoft.Maps.Map(originmapDiv[0], mapOptions);
                map.setView(viewOptions);

                //LADS.Worktop.Database.getArtworks(exhibition);
                //var alldoqs = exhibition.artworks;
                //var loclist = [];
                //for (var i = 0; i < alldoqs.length; i++) {

                //    var doq = alldoqs[i];
                //    var list = LADS.Util.UI.getLocationList(doq.Metadata);
                //    for(var j=0; j< list.length; j++){
                //        loclist.push(list[j]);
                //}
                //}
                //setTimeout(function () {
                //    LADS.Util.UI.drawPushpins(loclist, map);// pin the position of the artwork
                //}, 1);
               
            }
        })();

        //make search stuff
        (function makeSearch() {

            //div that holds dropdown menu
            sortContainer = $(document.createElement("div"));
            sortContainer.addClass('sortContainer');

            //dropdown menu
            sortSelector = $(document.createElement("select"));
            sortSelector.addClass('sortSelector');
            
            //menu options
            //originOption = $(document.createElement("option"));
            //originOption.attr("id", "originOption");
            //originOption.addClass('menuOption');
            //originOption.text("Origin");
            //originOption.value = "Origin";

            titleOption = $(document.createElement("option"));
            titleOption.attr("id", "titleOption");
            titleOption.addClass('menuOption');
            titleOption.text("Title");
            titleOption.value = "Title";

            artistOption = $(document.createElement("option"));
            artistOption.attr("id", "artistOption");
            artistOption.addClass("menuOption");
            artistOption.text("Artist");
            artistOption.value = "Artist";

            yearOption = $(document.createElement("option"));
            yearOption.attr("id", "yearOption");
            yearOption.addClass('menuOption');
            yearOption.text("Year");
            yearOption.value = "Year";

            //sortSelector.append(originOption);
            sortSelector.append(yearOption);
            sortSelector.append(artistOption);
            sortSelector.append(titleOption);

            sortContainer.append(sortSelector);
            //row1.append(sortContainer);
        })();

        //make the timeline divs to contain the artworks
        (function makeTimeline() {
            timelineDivContainer = root.find('.timelineDivContainer');
            timelineDiv = timelineDivContainer.find('.timelineDiv');
        })();
    }

    /*
    **Will flip to artmode with currently selected artwork. 
    */
    function switchPage() {
        if (!currentImage) return;//do nothing when there is no artwork in this catalog
        var curOpts, deepZoom, splitopts,
            opts = that.getState();
        //check the splitscreen states.
        if (root.parent().attr('id') === 'metascreen-R') {
            splitopts = 'R';
        } else {
            splitopts = 'L';
        }
        curOpts = { catalogState: opts, doq: currentImage, split: splitopts, };
        deepZoom = new LADS.Layout.Artmode("catalog", curOpts, exhibition);
        
        root.css({ 'overflow-x': 'hidden' });

        LADS.Util.UI.slidePageLeftSplit(root, deepZoom.getRoot());
    }

    /*
    **Changes the tag to a different one, and re-sorts.
    **@para:tag, which indicates how to arrange the artworks
    */
    function changeDisplayTag(tag) {
        timeline.setDisplayTag(tag);
        heatMap.setDisplayTag(tag);
        //timeline.sortTimeline(tag);
        handleSelectTags(tag);
        currentSort = tag;
        if (selectedImage) {
            unexpandedArtwork(selectedImage);
            selectedImage = null;
        }
    }

    /**
    *unexpand a selected image.
    *@param: the selected image
    */
    function unexpandedArtwork(selectedImage) {
        if (selectedImage) {
            switch (selectedImage.loc) {
                case '11': //left-top
                    selectedImage.animate({ height: "0", width: "0", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                    break;
                case '21': //right-top
                    selectedImage.animate({ height: "0", width: "0", left: selectedImage.left - timelineDiv.offset().left + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                    break;
                case '12': //left-bot
                    selectedImage.animate({ height: "0", width: "0", top: timelineDiv.height() + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                    break;
                case '22': //right-bot
                    selectedImage.animate({ height: "0", width: "0", top: timelineDiv.height() + "px", left: selectedImage.left - timelineDiv.offset().left + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                    break;
            }
        }
    }

    /*
    **Initiate the arrangement of artworks 
    **@para:tag, the options.
    **Note:think about a better hack
    */
    function correctOptions(tag) {
        sortSelector.empty();
        sortSelector[0].onchange = function () {
            changeDisplayTag(sortSelector.val());
        };
        //make sure the text change back when user change the option.
        //originOption.text("Origin");
        titleOption.text("Title");
        artistOption.text("Artist");
        yearOption.text("Year");
        //terrible hack so that the list always appears to be a dropdown
        switch (tag) {
            case "Origin":
                //originOption.text("Browse by Origin");
                //sortSelector.append(originOption);
                sortSelector.append(artistOption);
                sortSelector.append(titleOption);
                sortSelector.append(yearOption);
                break;
            case "Year":
                yearOption.text("Browse by Year");
                sortSelector.append(yearOption);
                sortSelector.append(artistOption);
                sortSelector.append(titleOption);
                //sortSelector.append(originOption);
                break;
            case "Title":
                titleOption.text("Browse by Title");
                sortSelector.append(titleOption);
                sortSelector.append(artistOption);
                sortSelector.append(yearOption);
                //sortSelector.append(originOption);
                break;
            case "Artist":
                artistOption.text("Browse by Artist");
                sortSelector.append(artistOption);
                sortSelector.append(titleOption);
                sortSelector.append(yearOption);
                //sortSelector.append(originOption);
                break;
        }
        sortSelector.val("Browse by " + tag);
    }


    /*
    **make the changes on tags when selection is changed
    */
    function handleSelectTags(tag) {
        //unselected tags are gray
        //originButton.css("color", "gray");
        artistButton.css("color", "gray");
        titleButton.css("color", "gray");
        yearButton.css("color", "gray");
        //sync the options.
        correctOptions(tag);

        //if (tag == "Origin") {//if the tag is Origin, hide the heatMap and show the origin map.
        //    heatmapDiv.hide();
        //    originmapDiv.show();
        //}
        //else {//Or have the heatmap shown, and not expanded.
            originmapDiv.hide();
        //    heatmapDiv.show();
        //}
        //set the selected tag color as white.
        switch (tag) {

            case "Origin":
                //originButton.css("color", "white");
                break;
            case "Artist":
                artistButton.css("color", "white");
                break;
            case "Title":
                titleButton.css("color", "white");
                break;
            case "Year":
                yearButton.css("color", "white");
                break;
        }
    }

    /*
    **creates the timeline
    */

    function testTimeline() {
        //adding map so timeline can interact with it
        timeline = new LADS.Catalog.Timeline(exhibition, $(timelineDiv)[0], that);
        timeline.setDisplayTag(tag);
        timeline.sortTimeline(currentSort);
        handleSelectTags(tag);
        timeline.addPickedHandler(artPicked);

        //change the display when one of the tag is clicked. 
        //originButton.click(function () {
        //    changeDisplayTag("Origin");
        //});
        artistButton.click(function () {
            changeDisplayTag("Artist");
           
        });
        titleButton.click(function () {
            changeDisplayTag("Title");
            
        });
        yearButton.click(function () {
            changeDisplayTag("Year");
        });
        //initiate the heat Map
        heatMap = new LADS.Catalog.HeatMap(heatmapDiv,exhibition);
        heatMap.addPickedHandler(function (evt) {
            timeline.showFirstDocument(evt.value);//show the collection.
        });
        //have the current selected artwork unexpanded/selected when elsewhere is clicked
        $(root).mousedown(function (e) {
            if (split === true && selectedImage && timelineDivContainer.has(e.target).length === 0) {
                switch (selectedImage.loc) {
                    case ('11'): //left-top
                        selectedImage.animate({ height: "0", width: "0", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                        break;
                    case ('21'): //right-top
                        selectedImage.animate({ height: "0", width: "0", left: selectedImage.left - ($(window).width() - root.width()) + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                        break;
                    case ('12'): //left-bot
                        selectedImage.animate({ height: "0", width: "0", top: timelineDiv.height() + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                        break;
                    case ('22'): //right-bot
                        selectedImage.animate({ height: "0", width: "0", top: timelineDiv.height() + "px", left: selectedImage.left - ($(window).width() - root.width()) + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                        break;
                }
                return;
            }
            else if (selectedImage && timelineDivContainer.has(e.target).length === 0) {
                switch (selectedImage.loc) {
                    case ('11'): //left-top
                        selectedImage.animate({ height: "0", width: "0", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                        break;
                    case ('21'): //right-top
                        selectedImage.animate({ height: "0", width: "0", left: selectedImage.left + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                        break;
                    case ('12'): //left-bot
                        selectedImage.animate({ height: "0", width: "0", top: timelineDiv.height() + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                        break;
                    case ('22'): //right-bot
                        selectedImage.animate({ height: "0", width: "0", top: timelineDiv.height() + "px", left: selectedImage.left + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                        break;
                }
                return;
            }
        });            
    }
    /*
    **Instantiates a new instance of LADS.Catalog.SearchAndFilter that give the searchbar all of its functionality.
    */
    function testSearchFilter() {
        var allArtworks = exhibition.artworks;
        searchFilter = new LADS.Catalog.SearchAndFilter(
            searchAndFilterContainer, allArtworks, timeline,
            search, filterBox);
    }

    /*
    **Occurs when an artwork is selected
    */
    function artPicked(data) {
        if (imageLoading) {
            return;
        }
        //unselected the current artwork when other artwork is selected
        if (selectedImage) {
            switch (selectedImage.loc) {
                case ('11'): //left-top
                    selectedImage.animate({ height: "0", width: "0", opacity: "0" }, 600, function () {selectedImage && selectedImage.remove(); selectedImage = null; });
                    break;
                case ('21'): //right-top
                    selectedImage.animate({ height: "0", width: "0", left: selectedImage.left + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                    break;
                case ('12'): //left-bot
                    selectedImage.animate({ height: "0", width: "0", top: timelineDiv.height() + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                    break;
                case ('22'): //right-bot
                    selectedImage.animate({ height: "0", width: "0", top: timelineDiv.height() + "px", left: selectedImage.left + "px", opacity: "0" }, 600, function () { selectedImage && selectedImage.remove(); selectedImage = null; });
                    break;
            }
            return;
        }

        unexpandMap();//unexpand the map when an artwork is selected
        
        var doq = data.doq;
        var element = data.element;

        currentImage = doq;

        //make location pushpins show up on map
        var locationList = LADS.Util.UI.getLocationList(doq.Metadata);
        if (map) {
            LADS.Util.UI.drawPushpins(locationList, map);//if the map is origin, pin the position of the artwork
        }
        //position values of the selected artwork and timeline div
        var pos = $(element).offset();
        var pos2 = timelineDiv.offset();

        var top = pos.top - pos2.top;
        var left = pos.left;
        
        var d = document.createElement('div');
        var imageInfo = $(d);

        var width = timeline.getArtWid();
        //imageInfo is the div that contains the whole artwork
        imageInfo.css({ width: width, "height": "60%", "background-color": 'rgba(16,14,12,0)', top: top + 300 + "px", left: pos.left + "px", position: "absolute", 'z-index': '50', overflow: "hidden" });
        imageInfo.addClass('imageInfo');
        //add the artwork as img to imageInfo
        var imageElementDiv = $(document.createElement('div'));
        imageElementDiv.css({ width: '100%', height: '78.4%' });       

        var imageElement = $(document.createElement('img'));
        imageElement.addClass('imageElement');
        imageElement.attr('src', LADS.Worktop.Database.fixPath(doq.URL));
       
        //have a loading circle when the image is not loaded
        var progressCircCSS = { "position": 'absolute', 'z-index':'50', 'height': 'auto', 'width': '5%'};
        var circle = LADS.Util.showProgressCircle(timelineDiv, progressCircCSS, left + width / 2 + timelineDiv.scrollLeft(), top + 0.48 * timelineDiv.height() / 2, true);
        var newleft = left + timelineDiv.scrollLeft();//2000;//parseFloat($(element).parent().attr('x'));
        imageLoading = true;
        imageElement.load(function () {
            finishExpandingImage(imageElement, imageInfo, doq, width, newleft, top);
            LADS.Util.removeProgressCircle(circle);
            imageLoading = false;
        }); //image won't expand until it is loaded
        imageElement.error(function () { imageLoading = false; LADS.Util.removeProgressCircle(circle); });

    }
    /*
    **handles a series of operations including artwork information label/div and auto scrolling to show the whole image 
    **after the selected artwork has finished expanding. 
    **@para:the selected artwork, the div that contains the artwork, data.doq, width of the artwork, and left and top of imageInfo div
    */
    function finishExpandingImage(imageElement, imageInfo, doq, width, left, top) {
        
        var imWidth,//the width of image
            imHeight,//the height of the image
            panDir;//panning direction. 

        if (imageElement.height() / imageElement.width() > 3/4) { //tall image 
            imWidth = timeline.getArtWid() * 2 + 5;
            imHeight = imWidth / imageElement.width() * imageElement.height();
            imWidth += 'px';
            panDir = -2;
        }

        else { //long image
            imHeight = 0.4 * root.height();
            imWidth = imHeight / imageElement.height() * imageElement.width();
            imHeight += 'px';
            panDir = 1;
        }

        imageElement.css({ 'height': imHeight, 'width': imWidth });
        //resize the image
        if (imageElement.height() < 0.4 * root.height()) {
            imageElement.css({ 'height': 0.4 * root.height(), width: imWidth });
        }
        if (imageElement.width() < timeline.getArtWid() * 2 + 5) {//it seems like +5 makes no differences.
            imageElement.css({ 'height': imHeight, width: timeline.getArtWid() * 2 + 5 });
        }
        imageInfo.append(imageElement);

        //show the information about the selected artwork
        var imageTextHolder = $(document.createElement('div'));
        imageTextHolder.css({width:"100%", height:"21.6%", top:"78.4%",position: 'absolute', 'background-color': 'rgba(16,14,12,.5)' });

        imageInfo.append(imageTextHolder);

        var imageText = $(document.createElement('div')); // LEAVE THIS HERE FOR NOW
        imageText.addClass('imageText');
        imageText.html('Artist: ' + doq.Metadata.Artist + "<br/>Title: " + doq.Name +
        "<br/>Year: " + doq.Metadata.Year);
        imageTextHolder.append(imageText);
        //LADS.Util.fitText(imageText, 1.7);

        //switch the page when the button is clicked
        var fullScreenButton = $(document.createElement("div"));
         
        var viewScreenLabel = $(document.createElement("label"));
        viewScreenLabel.text('View Artwork');
        viewScreenLabel.css({
            'font-weight':'bold'
        });
        fullScreenButton.append(viewScreenLabel);

        var fullScreenIcon = $(document.createElement("img"));
        fullScreenIcon.attr('src', 'images/icons/fullscreen.png');
        fullScreenIcon.addClass('fullScreenIcon');
        fullScreenButton.append(fullScreenIcon);
        fullScreenButton.addClass('fullScreenButton');
        fullScreenButton[0].onmousedown = function () { $(fullScreenIcon).css({ 'background-color': 'gray', 'border-radius': '999px' });};
        fullScreenButton[0].onclick = switchPage;
        imageInfo.append(fullScreenButton);
        selectedImage = imageInfo;
        //unexpand the image when the image is clicked.
        imageInfo.click(function () {
            unexpandedArtwork(selectedImage);
            selectedImage = null;
        });

        //set the image location 
        var rootWidth = root.width();
        var endWidth = width * 2 + 5;
        var infoLeft = rootWidth / 2 - endWidth / 2; //old alignment for image left
        var center = timelineDiv.width() / 2 + timelineDiv.offset().left;

        imageInfo.left = left + width;
        imageInfo.loc = '1';//loc will contain two digits, the first digit: 1 is left, 2 is right, second digit:top is 1, bottom is 2
        //if the image is on the right side of the timeline, set as 2
        if (split !== true) {
            if (left + (endWidth / 2) - timelineDiv.scrollLeft() > $(window).width() / 2) {
                imageInfo.loc = '2';
            }
        }
        
        
        timelineDiv.append(imageInfo);

        //set the top of the imageInfo, also,have the loc's top/bottom digit set.
        var extraleft;
        if (split === true) {
            var newleft = left - ($(window).width() - rootWidth);
            if ((newleft + (endWidth / 2) - timelineDiv.scrollLeft() > rootWidth / 2) && newleft-timelineDiv.scrollLeft() > endWidth) {
                imageInfo.loc = '2';
            }
            //expand div........according to the position
            if (timelineDiv.height() - top < timelineDiv.height() / 2) { //bottom row
                imageInfo.css({
                    top: top+ "px",
                    left: newleft + 'px'
                });
                if (imageInfo.loc === '1') {
                    imageInfo.animate({ top: 10 + "px", "height": timelineDiv.height() / 2 + timelineDiv.height() * 0.48 + 'px', "width": endWidth + 'px', left: newleft + "px" }, 600); //10 is the padding on the timelineDiv
                }
                else {
                    imageInfo.animate({ top: 10 + "px", "height": timelineDiv.height() / 2 + timelineDiv.height() * 0.48 + 'px', "width": endWidth + 'px', left: newleft - endWidth / 2 + "px" }, 600); //10 is the padding on the timelineDiv
                }
                imageInfo.loc += '2';
            }
            else { //top row
                imageInfo.css({
                    top: top + "px",
                    left: newleft + 'px'
                });
                if (imageInfo.loc === '1') {
                    imageInfo.animate({ top: top + "px", "height": timelineDiv.height() / 2 + timelineDiv.height() * 0.48 + "px", "width": endWidth + 'px', left: newleft + "px" }, 600);
                }
                else {
                    imageInfo.animate({ top: top + "px", "height": timelineDiv.height() / 2 + timelineDiv.height() * 0.48 + "px", "width": endWidth + 'px', left: newleft - endWidth / 2 + "px" }, 600);
                }
                imageInfo.loc += '1';
            }
            //TODO: check if the div is out of screen in split mode
            //make sure the imageInfo will not go out of the screen            
            if (imageInfo.position().left > rootWidth - endWidth) {
                extraleft = imageInfo.position().left + endWidth - rootWidth;
                timelineDiv.animate({ scrollLeft: timelineDiv.scrollLeft() + extraleft - endWidth / 3 + "px" });
                imageInfo.css({ left: imageInfo.position().left - extraleft + 'px' });
            }
            else if (imageInfo.position().left < 0) {
                extraleft = -imageInfo.position().left;
                timelineDiv.animate({ scrollLeft: timelineDiv.scrollLeft() - endWidth / 6 - extraleft + "px" });
                imageInfo.css({ left: imageInfo.position().left + extraleft + 'px' });
            }
        }
            //make sure the imageInfo will not go out of the screen
        else {//normal mode 
            if (timelineDiv.height() - top < timelineDiv.height() / 2) { //bottom row
                imageInfo.css({
                    top: top + "px",
                    left: left + 'px'
                });
                if (imageInfo.loc === '1') {
                    imageInfo.animate({ top: 10 + "px", "height": timelineDiv.height() / 2 + timelineDiv.height() * 0.48 + 'px', "width": endWidth + 'px', left: left + "px" }, 600); //10 is the padding on the timelineDiv
                }
                else {
                    imageInfo.animate({ top: 10 + "px", "height": timelineDiv.height() / 2 + timelineDiv.height() * 0.48 + 'px', "width": endWidth + 'px', left: left - endWidth / 2 - 2.5 + "px" }, 600); //10 is the padding on the timelineDiv
                }
                imageInfo.loc += '2';
            }
            else { //top row
                imageInfo.css({
                    top: top + "px",
                    left: left + 'px'
                });
                if (imageInfo.loc === '1') {
                    imageInfo.animate({ top: top + "px", "height": timelineDiv.height() / 2 + timelineDiv.height() * 0.48 + "px", "width": endWidth + 'px', left: left + "px" }, 600);
                }
                else {
                    imageInfo.animate({ top: top + "px", "height": timelineDiv.height() / 2 + timelineDiv.height() * 0.48 + "px", "width": endWidth + 'px', left: left - endWidth / 2-2.5 + "px" }, 600);
                }
                imageInfo.loc += '1';
            }
            if(imageInfo.position().left > rootWidth - endWidth) {
                extraleft = imageInfo.position().left + endWidth - rootWidth;
                timelineDiv.animate({ scrollLeft: timelineDiv.scrollLeft()+extraleft-endWidth/3+"px" });
                imageInfo.css({ left: left- extraleft + 'px' });
            }
            else if (left-timelineDiv.scrollLeft() <0) {
                extraleft = -imageInfo.position().left ;
                timelineDiv.animate({ scrollLeft: timelineDiv.scrollLeft() -endWidth/6- extraleft + "px" });
                imageInfo.css({ left: imageInfo.position().left + extraleft + 'px' });
            }
        } 
        //this is for panning the image, b/c imageInfo div will only show part of the image. 
        var panMar;//the total moving distance of the image.
        if (panDir == 1 || panDir == -1) {//1 is right, and -1 is left
            panMar = -imageElement.width() + endWidth;

            //if the image's width is smaller than the imageInfo div's width, no need to pan
            if (imageElement.width() < imageInfo.width) {
                //don't pan
                return;
            }
        }

        else {
            panMar = -imageElement.height() + 0.4 * root.height();
            //if the image's height is smaller than the imageInfo div's height, no need to pan
            if (imageElement.height() < imageInfo.height) {
                //don't pan
                return;
            }
        }

        var animTime = -5.5 * panMar;
        panImage(imageElement, panDir, panMar, animTime);
    }

    /*
    **pan image after it is selected   dir: 1 = right, -1 = left, 2 = up, -2 = down
    **@para: panning image, the diretion to pan the image, the distance, and the animation time
    */
    function panImage(imToPan, dir, panMar, animTime) {
        if (!imToPan) {//no need to pan if there is no image
            return;
        }
        setTimeout(function () {

            if (dir == 1) {
                imToPan.animate({ marginLeft: panMar + "px" }, animTime, "linear", function () { panImage(imToPan, -1 * dir, panMar, animTime); });
            }

            else if (dir == -1) {
                imToPan.animate({ marginLeft: 0 + "px" }, animTime, "linear", function () { panImage(imToPan, -1 * dir, panMar, animTime); });
            }

            else if (dir == -2) {
                imToPan.animate({ marginTop: panMar + "px" }, animTime, "linear", function () { panImage(imToPan, -1 * dir, panMar, animTime); });
            }

            else {
                imToPan.animate({ marginTop: 0 + "px" }, animTime, "linear", function () { panImage(imToPan, -1 * dir, panMar, animTime); });
            } 
        }, 1750);
    }

    /*
    **shrink expanded map back to original dimensions
    */
    function unexpandMap() {
        if (mapexpanded) {
            row1.animate({
                height: '35%'
            }, mapContractTime);
            var contractedWidth = row1.width() * 0.5;
            heatmapDivContainer.animate({
                width: '50%'
            }, mapContractTime);

            //expand originmap while expanding the div
            var scale = contractedWidth / heatmapDivContainer.width();

            expandarrow.attr('src', 'images/icons/MapExpand.jpg');
            mapexpanded = false;

        }
    }

    this.getRoot = function () {
        return root;
    };

    /* 
    **Set the state of the catalog/timeline with a state object: {currentSort, exhibition, tag, currentImage} 
    */
    this.setState = function (state) {
        exhibition = state.exhibition;
        changeDisplayTag(state.currentSort);
    };
    /*
    **@return the states of the catalog/timeline.
    */
    this.getState = function () {
        return {
            currentSort: currentSort,
            exhibition: exhibition,
            tag: currentSort,
            currentImage: currentImage
        };
    };
    /*
    **have everything initiated! Yo~
    */
    function init() {
        makeStructure();
        $(document).ready(function (e) {
            testTimeline();
            testSearchFilter();
            //since we don't have a filter now, not sure what to do with this. Keep it for now
            /*var loadedInterval = setInterval(function () {
                if (LADS.Util.elementInDocument($(filterBox))) {
                    //searchFilter.setFilterObjects(exhibition['setSearch']);//Work here and wherever you have (exhibition['setSearch']) for the coming back and forth
                    //exhibition['setSearch'] = null;
                    clearInterval(loadedInterval);
                }
            });*/
        });
    }

};

LADS.Layout.Catalog.default_options = {
    //cannot start with origin since DOM element has to be on the document
    //before bing maps can be loaded
    tag: "Title",
    currentSort:"Title"
};