LADS.Util.makeNamespace("LADS.Layout.Artmode");

/*
*   The layout definition for Artmode. Contains a sidebar with tools,
*   and a central area for deepzoom.
*   Author: Alex Hills
*/

//Constructor. Takes in prevPage string (currently "catalog" or "exhibitions"), {previousState, doq, split}, exhibition
//TODO: Adjust this so the back button can go to any arbitrary layout, not just Timeline
LADS.Layout.Artmode = function (prevPage, options, exhibition) {
    "use strict";
    var WEBAPP = true;
    var previous = prevPage;
    var locationList;
    var initialized = false;
    var root, doq, map, splitscreen, locsize, backButton,
        sideBar, toggler, togglerImage, locationHistoryDiv, info, //Need to be instance vars for splitscreen
        zoomimage = null,
        locationHistoryIcon,
        locationHistoryToggle,
        locationHistoryContainer,
        locationHistory,
        direction, //direction for location history panel
        mapMade = false;
    var locationHistoryActive = false;//have the location history panel hidden as default.

    options = LADS.Util.setToDefaults(options, LADS.Layout.Artmode.default_options);
    doq = options.doq;

    init();
    /**
    *initiate artmode with a root, artwork image and a sidebar on the left.
    */
    function init() {
        root = LADS.Util.getHtmlAjax('artworkViewer.html');

        root.data('split', options.split);
        //get the artwork
        if (doq) {
            zoomimage = new LADS.AnnotatedImage(root, doq.Name, doq.Identifier, options.split);
            zoomimage.loadDoq(doq);
        }
        LADS.Util.Splitscreen.setViewers(root, zoomimage);
        makeSidebar();
        initialized = true;
    }

    /**
    *When called, makes the sidebar. TODO: Factor most of this out to constants
    */
    function makeSidebar() {
        var i;
        var button;
        //sideBar is the outermost container for sidebar
        sideBar = root.find(".sideBar");
        //Sets entire sidebar to this...
        var sideBarWidth = window.innerWidth * 0.22; //Define width in absolute terms to work with split screen
        sideBar.css({
            width: sideBarWidth,
        });

        //Creates a button/div for toggling sidebar.
        toggler = root.find('.toggler');
        //create the arrow image for toggler.
        togglerImage = root.find('.togglerImage');

        //Switch side based on splitscreen state, if it is the right half screen, move the sidebar to right.
        if (root.data('split') === 'R' && prevPage !== "artmode") {//if user doesn't go back from the tourplayer too.
            sideBar.css({ right: '0px', });
            toggler.css({
                left: '-12%',
                borderTopLeftRadius: "10px",
                borderBottomLeftRadius: "10px"
            });
            togglerImage.attr("src", 'images/icons/Right.png');
        }
        else {
            sideBar.css({ left: '0px', });
            toggler.css({
                right: '-12%',
                borderTopRightRadius: "10px",
                borderBottomRightRadius: "10px"
            });
            togglerImage.attr("src", 'images/icons/Left.png');
        }

        //set sidebar open as default.
        var isBarOpen = true;
        //click toggler to hide/show sidebar
        toggler.click(function () {
            var opts;
            //when the bar is open, set the sidebar position according to splitscreen states.
            if (root.data('split') === 'R') {
                opts = {
                    right: -(sideBarWidth)
                };
            }
            else {
                opts = {
                    left: -(sideBarWidth)
                };
            }
            //if the bar is not open
            if (!isBarOpen) {
                if (root.data('split') === 'R') {
                    opts.right = "0%";
                } else {
                    opts.left = "0%";
                }
                isBarOpen = true;
            }
            else {
                isBarOpen = false;
            }
            //when click the toggler, the arrow will rotate 180 degree to change direction.
            $(sideBar).animate(opts, 1000, function () {
                $(togglerImage[0]).rotate("180deg");
            });
        });


        //Create back button TODO: See todo in constructor
        var backButtoncontainer = root.find('.backButtonContainer');
        var backButton = backButtoncontainer.find('.backButton');

        //change the backColor to show the button is being clicked. 
        //mouseleave for lifting the finger from the back button
        backButton.mouseleave(function () {
            LADS.Util.UI.cgBackColor("backButton", backButton, true);
        });
        //mousedown for pressing the back button
        backButton.mousedown(function () {
            LADS.Util.UI.cgBackColor("backButton", backButton, false);
        });

        //click function for back button based on previous page.
        if (prevPage === "catalog" || prevPage === "artmode") {//this is called when the user entered the artmode from catalog, have the "artmode" case because if user goes back to artmode from tourplayer, the prevpage will stay as artmode. 
            backButton.on('click', function () {
                backButton.off('click');
                zoomimage.unload();
                var catalog = new LADS.Layout.Catalog(exhibition);
                catalog.getRoot().css({ 'overflow-x': 'hidden' });
                LADS.Util.UI.slidePageRightSplit(root, catalog.getRoot(), function () {
                    catalog.getRoot().css({ 'overflow-x': 'hidden' });
                    catalog.loadInteraction();
                    catalog.setState(options.catalogState);
                });
            });
        }
        else if (prevPage === "exhibitions") {//this is called when the user entered the artmode from the tour in exhibition 
            backButton.click(function () {
                backButton.off('click');
                zoomimage.unload();
                var tempExhibitions = new LADS.Layout.Exhibitions(null, function (exhibitions) {
                    exhibitions.selectTourTab();
                    exhibitions.clickTourByDoq(exhibition);
                });
                root.css({ 'overflow-x': 'hidden' });
                LADS.Util.UI.slidePageRightSplit(root, tempExhibitions.getRoot());
            });
        }

        //second outermost div to contain contents in sidebar.
        var sideBarSections = sideBar.find('.sideBarSections');

        //div for artinfo info and other stuff except for minimapContainer
        var sideBarInfo = sideBar.find('.sideBarInfo');

        //description area of the artwork.
        //?????P.S.: may not need this if we only have information such as title, year and artists...used to have it because we had a large subdiv for curator to add description
        var row1 = sideBarInfo.find('.row1');

        //this contains basic info about the artwork
        var info = row1.find('.info');

        //The title of artwork. Currently, we have the text overflow as ellipsis, may implement auto scroll later...
        var infoTitle = info.find("#infoTitle");
        infoTitle.text(doq.Name);

        //The artist of artwork
        var infoArtist = info.find("#infoArtist");
        infoArtist.text(doq.Metadata.Artist);

        //The year of artwork
        var infoYear = info.find("#infoYear");
        infoYear.text(doq.Metadata.Year);

        //add more information for the artwork if curator add in the authoring mode
        for (var item in doq.Metadata) {
            if (item.indexOf('InfoField_') != -1) {
                var fieldTitle = item.split('_')[1], fieldValue = doq.Metadata[item];
                var infoCustom = $(document.createElement('div'));
                infoCustom.css({ 'font-size': '22px', 'margin-top': '5px', 'text-overflow': 'ellipsis', 'overflow': 'hidden', 'white-space': 'nowrap' });
                infoCustom.text(fieldTitle + ': ' + fieldValue);
                infoCustom.appendTo(info);
            }
        }
        //make sure the info text fits in the div
        LADS.Util.fitText(info, 1.1);

        //create the div & Container for associate operation on artwork. 
        var midSectionContainer = sideBarInfo.find('.midSectionContainer');
        
        var midSection = midSectionContainer.find('.midSection');

        //add fadeout effect for the midSection Container
        //create the text fadeout effect for the top
        var topfadeout = sideBarInfo.find('.topfadeout');

        //create the text fadeout effect for the bottom
        var bottomfadeout = sideBarInfo.find('.bottomfadeout');

        //check the scroll state to make fadeout effect divs appear and disappear.
        midSectionContainer.bind('scroll', function () {
            //if it reaches the bottom, hide the bottom fadeout effect. Otherwise, show it
            if (midSectionContainer.scrollTop() + midSectionContainer.innerHeight() >= midSectionContainer[0].scrollHeight) {
                bottomfadeout.css({ 'display': 'none' });
            }
            else {
                bottomfadeout.css({ 'display': 'block' });
            }
            //if the scroller is not at the top, show the top fadeout effect. Otherwise, hide it.
            if (midSectionContainer.scrollTop() > 0) {
                topfadeout.css({ 'display': 'block' });
            }
            else {
                topfadeout.css({ 'display': 'none' });
            }
        });
        //Location History
        var locationHistorysec = initlocationHistory();

        //Splitscreen
        var splitscreenContainer = initSplitscreen();


        //Send Feedback
        var feedbackContainer = initFeedback();


        // Add a divider between Hotspots/Assets and other fields
        var divider = midSection.find('.divider');

        var assetContainer = sideBarInfo.find("#assetContainer");

        //Hotspots, Assets and Tours drawers
        var hotspots = zoomimage.getHotspots(),
        hotspotsDrawer = createDrawer('Hotspots'); // commented these lines out from the .jade file for now
        if (!hotspots.length) {
            hotspotsDrawer.contents.text('There are no hotspots for this artwork.');
        }
        else {
            //get the hotspots for the artwork
            for (i = 0; i < hotspots.length; i++) {
                var hotspot = hotspots[i];
                //creates the buttons for each hotspots.
                button = $(document.createElement('button'));
                button.css({ width: "87.5%", "text-align": "center", "margin-bottom": "5px" });
                button.text(hotspot.title);
                button.click(hotspotAssetClick(hotspots[i]));//have the hotspot show/hide on the artwork when click the button
                hotspotsDrawer.contents.append(button);
            }
        }
        assetContainer.append(hotspotsDrawer);


        var assets = zoomimage.getAssets(),
        assetsDrawer = createDrawer('Assets');
        if (!assets.length) {
            assetsDrawer.contents.text('There are no assets for this artwork.');
        }
        else {
            for (i = 0; i < assets.length; i++) {
                var asset = assets[i];
                button = $(document.createElement('button'));
                button.css({ width: "87.5%", "text-align": "center", "margin-bottom": "5px" });
                button.text(asset.title);
                button.click(hotspotAssetClick(assets[i]));

                assetsDrawer.contents.append(button);
            }
        }
        assetContainer.append(assetsDrawer);

        function hotspotAssetClick(hotspotsAsset) {//check if the location history is open before you click the button, if so, close it
            return function () { // REVISIT!!!!! CAN PROBABLY GET RID OF A LOT OF THIS
                if (locationHistoryActive) {
                    locationHistoryActive = false;
                    locationHistoryIcon.attr("id", "locationHistoryIcon");
                    locationHistoryIcon.attr('src', 'images/icons/Location.svg');
                    locationHistoryIcon.css({
                        'width': '9.5%',
                        'height': 'auto',
                        'position': 'relative',
                        'display': 'inline',
                        'vertical-align': 'middle'
                    });
                    locationHistoryContainer.append(locationHistoryIcon);
                    locationHistoryContainer.attr("id", "locationHistoryContainer");
                    locationHistory.text('Location History');
                    locationHistory.css({
                        'color': 'white',
                        "font-size": "25px",
                    });
                    locationHistoryContainer.append(locationHistory);
                    locationHistoryToggle.hide();
                    locationHistoryToggle.hide("slide", { direction: direction }, 500);
                    locationHistoryDiv.hide("slide", { direction: direction }, 500);
                    toggler.show();//show the toggler for sidebar and hide the locationhistory toggler.
                }
                // hotspotsAsset.toggle();
                var circle = hotspotsAsset.toggle();
                hotspotsAsset.pauseAsset();
                if (circle) {
                    setTimeout(function () { circle.click(); }, 10); // has to be a better way.....
                }
            };
        }

        var toursDrawer = createDrawer('Tours');
        toursDrawer.contents.text('Loading tours...');
        // Load tours and filter for tours associated with this artwork
        LADS.Worktop.Database.getAllTours(function (tours) {
            var relatedTours = tours.filter(function (tour) {
                if (!tour.Metadata || !tour.Metadata.RelatedArtworks || tour.Metadata.Private === "true")
                    return false;
                var relatedArtworks = JSON.parse(tour.Metadata.RelatedArtworks);
                return relatedArtworks instanceof Array && relatedArtworks.indexOf(doq.Identifier) > -1;
            });

            if (relatedTours.length > 0) {
                toursDrawer.contents.text('');
                $.each(relatedTours, function (index, tour) {
                    //create a button for each tour
                    var button = $(document.createElement('button'));
                    button.css({
                        'padding': '2px',
                        'width': '87.5%',
                        'margin-bottom': '5px',
                        'text-align': 'left'
                    });
                    //creates the small play icon on the left of button.
                    var icon = $(document.createElement('img'));
                    icon.attr({
                        'src': 'images/icons/Play.svg',
                        'width': '9%',
                        'height': '9%'
                    });
                    icon.css({ 'vertical-align': 'middle' });
                    button.append(icon);
                    //add text for the button
                    var text = $(document.createElement('div'));
                    text.text(tour.Name);
                    text.css({
                        'width': '80%',
                        'text-align': 'center',
                        'vertical-align': 'middle',
                        'display': 'inline-block'
                    });
                    button.append(text);

                    // Borrowed from Exhibition.js
                    var switching = false;
                    button.click(function () {
                        if (!switching) {
                            switching = true;
                            zoomimage.unload();
                            var rinData = JSON.parse(unescape(tour.Metadata.Content)),
                            rinPlayer = new LADS.Layout.TourPlayer(rinData, exhibition, "artmode", options);
                            //check if the screen split is on, exit the other one if splitscreen is on to play the tour on full screen.
                            if (LADS.Util.Splitscreen.on()) {
                                var parentid = $(root).parent().attr('id');
                                LADS.Util.Splitscreen.exit(parentid[parentid.length - 1]);
                            }
                            LADS.Util.UI.slidePageLeftSplit(root, rinPlayer.getRoot(), rinPlayer.startPlayback);
                        }
                    });
                    toursDrawer.contents.append(button);
                });
            }
            else {
                toursDrawer.contents.text("No related tours.");
            }
        });
        assetContainer.append(toursDrawer);


        //Create minimapContainer...
        var minimapContainer = sideBarSections.find('#minimapContainer');

        //A white rectangle for minimap to show the current shown area for artwork
        var minimaprect = minimapContainer.find(".minimaprect");

        //Load deepzoom thumbnail. 
        var img = new Image();
        var loaded = false;
        var AR = 1;//ratio between width and height.
        var minimapw = 1;//minimap width
        var minimaph = 1;//minimap height
        var minimap;
        /*
        **On load, load the image of artwork and initialize the rectangle
        */
        function minimapLoaded() {
            if (loaded) return;
            loaded = true;
            //load the artwork image.
            minimap = minimapContainer.find(".minimap");
            minimap.attr('src', LADS.Worktop.Database.fixPath(doq.URL));
            //make the minimap not moveable. 
            minimap.mousedown(function () {
                return false;
            });
            AR = img.naturalWidth / img.naturalHeight;
            var heightR = img.naturalHeight / $(minimapContainer).height();//the ratio between the height of image and the container.
            var widthR = img.naturalWidth / $(minimapContainer).width();//ratio between the width of image and the container.
            //make sure the whole image shown inside the container based on the longer one of height and width.
            if (heightR > widthR) {
                minimap.removeAttr("height");
                minimap.removeAttr("width");
                minimap.css({ "height": "100%" });
            }
            else {
                minimap.removeAttr("height");
                minimap.removeAttr("width");
                minimap.css({ "width": "100%" });
            }

            //make the image manipulatable. 

            var gr;

            if (WEBAPP) {
                gr = LADS.Util.makeManipulatable({
                    element: minimap[0],
                    functions: {
                        onManipulate: onMinimapManip,
                        onScroll: onMinimapScroll,
                        onTapped: onMinimapTapped
                    },
                    stdHammer: false
                });
            }
            else {
                gr = LADS.Util.makeManipulatableWin(minimap[0],
                {
                    onManipulate: onMinimapManip,
                    onScroll: onMinimapScroll,
                    onTapped: onMinimapTapped
                }, false);
            }
        }
        /*
        **implement specific manipulation functions for manipulating the minimap.
        */
        function onMinimapManip(evt) {
            var minimaph = minimap.height();
            var minimapw = minimap.width();
            var minimapt = minimap.position().top;
            var minimapl = parseFloat(minimap.css('marginLeft'));

            var px = evt.pivot.x;
            var py = evt.pivot.y;
            var tx = evt.translation.x;
            var ty = evt.translation.y;

            var x = px + tx;
            var y = py + ty;
            x = (x - minimapl) / minimapw;
            y = (y - minimapt) / minimaph;
            y = y / AR;
            x = Math.max(0, Math.min(x, 1));
            y = Math.max(0, Math.min(y, 1 / AR));
            var s = 1 + (1 - evt.scale);
            if (s) zoomimage.viewer.viewport.zoomBy(s, false);
            zoomimage.viewer.viewport.panTo(new Seadragon.Point(x, y), true);
            zoomimage.viewer.viewport.applyConstraints();
        }
        function onMinimapScroll(res, pivot) {
            var a = 0;
        }
        function onMinimapTapped(evt) {
            var a = 0;
        }

        img.onload = minimapLoaded;
        //should be complete image of artwork NOT thumbnail
        img.src = LADS.Worktop.Database.fixPath(doq.URL);
        if (img.complete) {
            minimapLoaded();
        }
        /*
        **Handler for image->rectangle TODO: rectangle->image handler
        */
        function dzMoveHandler(evt) {
            var minimaph = minimap.height();
            var minimapw = minimap.width();

            //centers rectangle
            var minimapt = (minimapContainer.height() / 2) - (minimap.height() / 2);
            var minimapl = (minimapContainer.width() / 2) - (minimap.width() / 2);

            var viewport = evt.viewport;
            var rect = viewport.getBounds(true);
            var tl = rect.getTopLeft();
            var br = rect.getBottomRight();
            var x = tl.x;
            var y = tl.y;
            var xp = br.x;
            var yp = br.y;
            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (xp > 1) xp = 1;
            if (yp > 1 / AR) yp = 1 / AR;
            y = y * AR;
            yp = yp * AR;
            yp = yp - y;
            xp = xp - x;
            x = minimapl + x * minimapw;
            y = minimapt + y * minimaph;
            xp = xp * minimapw;
            yp = yp * minimaph;
            minimaprect.css({
                width: xp + "px",
                height: yp + "px",
                top: y + "px",
                left: x + "px"
            });
        }
        zoomimage.addAnimateHandler(dzMoveHandler);

    }

    /**
     * Create a drawer with a disclosure button used to display
     * hotspots, assets, tours. The returned jQuery object has
     * a property called "contents" which should be used to add
     * buttons or messages to the contents of the drawer.
     *
     * @param title, the display title for the drawer
     * @author jastern
     */
    function initlocationHistory() {
        //create container div for locationhistory
        locationHistoryContainer = root.find('.locationHistoryContainer');

        //have the container clickable. check histOnClick for more details.
        locationHistoryContainer.click(histOnClick);
        //create the icon for location history
        locationHistoryIcon = locationHistoryContainer.find('.locationHistoryIcon');

        //create the div for text
        locationHistory = locationHistoryContainer.find('.locationHistory');

        //panel that slides out when location history is clicked
        locationHistoryDiv = root.find('.locationHistoryDiv');
        var offsetSide = window.innerWidth * 0.22,
            locwidth = (!LADS.Util.Splitscreen.on()) ?//if the splitscreen is not on, set the width as 78% of current window width.
                        window.innerWidth * 0.78 ://else set the width based on the side of screen. 
                        ((root.data('split') === 'L') ?
                            $('#metascreen-L').width() - window.innerWidth * 0.22 :
                            $('#metascreen-R').width() - window.innerWidth * 0.22);
        locationHistoryDiv.css({
            'width': locwidth + 'px',
        });

        //create the panel for location history.
        var locationHistoryPanel = locationHistoryDiv.find('.locationHistoryPanel');

        //set the position of outtermost div and panel for locationhistory based on the which splitscreen
        if (root.data('split') === 'R') {
            locationHistoryDiv.css({ right: offsetSide, });
            var locpaneloffset = locwidth * 0.125;
            locationHistoryPanel.css({
                position: 'relative',
                left: locpaneloffset + 'px'
            });
        } else {
            locationHistoryDiv.css({ left: offsetSide, });
        }

        //create the div for location information

        ///

        var mapOverlay = $(LADS.Util.UI.blockInteractionOverlay());//overlay for when 'edit ink' component option is selected while playhead is not over the art track
        $(mapOverlay).addClass('mapOverlay');
        var overlayLabel = $('<label>').text("Map has no location history to display.");
        overlayLabel.attr("id", "mapOverlayLabel");

        mapOverlay.css({
            width: '100%',
            height: '100%',
            'position': 'absolute',
            'z-index': '10000',
            'background-color': 'rgba(0, 0, 0, 0.5)',
            'left': 'auto',
            'top': 'auto',
        });
        mapOverlay.append(overlayLabel);
        overlayLabel.css({
            'position': 'relative',
            'float': 'right',
            'margin-right': '21%',
            'top': '35%',
            'font-size': '22pt',
        });

        var lpContents = locationHistoryPanel.find('.lpContents');

        lpContents.append(mapOverlay);

        //create a div for title
        var lpTitle = lpContents.find("#lpTitle");

        //create a div for map
        var lpMapDiv = lpContents.find(".lpMapDiv");
        //set the id of map div according to the splitscreen position.
        if (root.data('split') === 'R') {
            lpMapDiv.attr('id', 'lpMapDivR');
        } else {
            lpMapDiv.attr('id', 'lpMapDiv');
        }
        //this div contains all text information about the artwork's location history.
        var lpTextInfoDiv = lpContents.find('.lpTextInfoDiv');

        //this div contains a list of locations for the artwork.
        var lpTextDiv = lpTextInfoDiv.find(".lpTextDiv");

        //this div gives details about one specific location history when one location is clicked.
        var lpInfoDiv = lpTextInfoDiv.find('.lpInfoDiv');

        //create the toggler to close the location history. Same arrow as sidebar toggler. 
        locationHistoryToggle = locationHistoryPanel.find('.locationHistoryToggle');

        var locationHistoryToggleIcon = locationHistoryToggle.find('.locationHistoryToggleIcon');

        //set the toggler based on the splitscreen.
        if (root.data('split') === 'R') {
            locationHistoryToggle.css({
                right: '87.5%',
                'border-bottom-left-radius': '10px',
                'border-top-left-radius': '10px'
            });
            locationHistoryToggleIcon.attr('src', 'images/icons/Right.png');
        } else {
            locationHistoryToggle.css({
                left: '87.5%',
                'border-bottom-right-radius': '10px',
                'border-top-right-radius': '10px'
            });
            locationHistoryToggleIcon.attr('src', 'images/icons/Left.png');
        }

        locationHistoryToggleIcon.click(toggleLocationPanel);

        /*
        **This is the click function LocationHistoryContainer. 
        */
        function histOnClick() {

            locationList = LADS.Util.UI.getLocationList(options.doq.Metadata); //Location List is LOADED HERE
            if (locationList.length === 0) {
                mapOverlay.show();
            }
            if (!mapMade || !map) {
                var prepMap = function () {

                    //make location pushpins show up on map
                    locationList = LADS.Util.UI.getLocationList(options.doq.Metadata); //Location List is LOADED HERE
                    LADS.Util.UI.drawPushpins(locationList, map);


                    //traverse locationList and populate the location list
                    //lptext.information contains further information to be displayed when clicked
                    function drawPinHelper(e) {
                        LADS.Util.UI.drawPushpins(locationList, map);

                        //display location information
                        if (e.data.info !== undefined)
                            lpInfoDiv.html($(this).html() + "<br/>" + e.data.info);
                        else
                            lpInfoDiv.html($(this).html() + "<br/>");

                        $('div.locations').css(unselectedCSS);
                        $('img.removeButton').attr('src', 'images/icons/minus.svg');
                        $('img.editButton').attr('src', 'images/icons/edit.png');
                        $(this).find('img.removeButton').attr('src', 'images/icons/minusB.svg');
                        $(this).find('img.editButton').attr('src', 'images/icons/editB.png');
                        $(this).css(selectedCSS);
                        var lat, long, location;
                        if (e.data.resource.latitude) {
                            location = e.data.resource;
                        } else {
                            lat = e.data.resource.point.coordinates[0];
                            long = e.data.resource.point.coordinates[1];
                            location = new Microsoft.Maps.Location(lat, long);
                        }
                        var viewOptions = {
                            center: location,
                            zoom: 4,
                        };
                        map.setView(viewOptions);
                    }

                    for (var i = 0; i < locationList.length; i++) {

                        var unselectedCSS = {
                            'background-color': 'transparent',
                            'color': 'white'
                        };
                        var selectedCSS = {
                            'background-color': 'white',
                            'color': 'black',
                        };
                        var pushpinOptions = {
                            text: String(i + 1),
                            icon: '/images/icons/locationPin.png',
                            width: 20,
                            height: 30
                        };
                        var address = locationList[i].address;
                        var date = '';
                        if (locationList[i].date && locationList[i].date.year) {
                            var year = locationList[i].date.year;
                            if (year < 0) {
                                //add BC to years that are less than 0
                                year = Math.abs(year) + ' BC';
                            }
                            date = " - " + year;
                        } else {
                            date = ' - <i>Date Unspecified</i>';
                        }
                        //create a div for each location.
                        var newDiv = $(document.createElement('div'));
                        newDiv.addClass('locations');
                        newDiv.html((i + 1) + '. ' + address + ',' + date + '<br>');
                        newDiv.css({
                            display: 'none',
                            width: '96%',
                            height: '12%',
                            padding: '2% 2% 4% 2%',
                            'font-size': '100%',
                            'color': 'white',
                            'overflow': 'hidden',
                            'background-color': 'rgba(0,0,0,0.01)',
                            'white-space': 'nowrap',
                            'text-overflow': 'ellipsis'
                        });

                        lpTextDiv.append(newDiv);

                        LADS.Util.UI.drawPushpins(locationList, map);

                        //display more information about the location when newdiv is clicked
                        newDiv.click(locationList[i], drawPinHelper);
                        newDiv.fadeIn();
                    }

                    toggleLocationPanel();
                };
                makeMap(prepMap);
            } else {
                toggleLocationPanel();
            }
        }
        /*
        **toggles location panel when LocationHistoryContainer or toggler is clicked.
        **@return: locationHistoryContainer
        */
        function toggleLocationPanel() {
            if (LADS.Util.Splitscreen.on()) {
                return;
            }
            //set the direction based on the splitscreen position
            if (root.data('split') === 'R') {
                direction = 'right';
            } else {
                direction = 'left';
            }
            //if the panel is currently shown, hide it.
            if (locationHistoryActive) {
                locationHistory.text('Location History');
                locationHistory.css({ 'color': 'white' });
                locationHistoryIcon.attr('src', 'images/icons/Location.svg');
                locationHistoryToggle.hide();
                locationHistoryToggle.hide("slide", { direction: direction }, 500);
                locationHistoryDiv.hide("slide", { direction: direction }, 500);
                toggler.show();//show the toggler for sidebar and hide the locationhistory toggler.
                locationHistoryActive = false;
            }
            else {//show the panel if it is hidden when clicked
                locationHistory.text('Close Location History');
                locationHistoryToggle.hide();
                locationHistoryDiv.show("slide", { direction: direction }, 500, function () {
                    locationHistoryToggle.show();
                });
                locationHistoryDiv.css({ display: 'inline' });
                toggler.hide();
                locationHistoryActive = true;
            }
        }

        // locationHistoryContainer.append(locationHistoryIcon);
        // locationHistoryContainer.append(locationHistory);

        if (LADS.Util.Splitscreen.on()) {
            locationHistory.css('opacity', '0.5');
            locationHistoryIcon.css('opacity', '0.5');
        }

        return locationHistoryContainer;
    }

    /*
    **this function create drawer for hotspots, assets and tour. 
    **@para: title of the drawer
    */
    function createDrawer(title) {
        //here goes the basic UI elements for drawer: Outtermost div, header, iconContainer, icon and etc
        var drawer = $(document.createElement('div'));
        drawer.addClass('drawer');
        drawer.css({ 'display': 'inline' });

        var drawerHeader = $(document.createElement('div'));
        drawerHeader.addClass('drawerHeader');
        drawerHeader.css({
            'width': '100%',
            'float': 'left'
        });
        drawerHeader.appendTo(drawer);

        var label = $(document.createElement('div'));
        label.addClass('label');
        label.text(title);
        label.css({
            'font-size': '25px',
            'width': '50%',
            'float': 'left'
        });
        label.appendTo(drawerHeader);

        var toggleContainer = $(document.createElement('div'));
        toggleContainer.addClass('toggleContainer');
        toggleContainer.css({
            'width': '45px',
            'position': 'relative',
            'padding-top': '8px',
            'float': 'right'
        });
        toggleContainer.appendTo(drawerHeader);

        var toggle = $(document.createElement('img'));
        toggle.addClass("plusToggle");
        toggle.attr('src', 'images/icons/plus.png');
        toggle.css({
            'width': '23px',
            'height': '23px'
        });
        toggle.appendTo(toggleContainer);
        var isslided = false;
        var drawerContents = $(document.createElement('div'));
        drawerContents.addClass("drawerContents");
        drawerContents.css({
            'display': 'none',
            'clear': 'both',
            'font-size': '16px'
        });
        drawerContents.appendTo(drawer);

        //have the toggler icon minus when is is expanded, plus otherwise.
        drawerHeader.click(function () {
            drawerContents.slideToggle();
            if (isslided === false) {
                toggle.attr('src', 'images/icons/minus.svg');
                isslided = true;
            }
            else {
                toggle.attr('src', 'images/icons/plus.png');
                isslided = false;
            }

        });

        drawer.contents = drawerContents;

        return drawer;
    }

    function splitscreenAdjustments() {
        splitscreen.text('Exit Split Screen');
        //locsize = $('#metascreen-L').width() - window.innerWidth * 0.2;
        //locationHistoryDiv.css({ width: locsize + 'px' });
    }

    // exhibition picker
    function createExhibitionPicker(artworkObj) {
        var exhibitionPicker = $(document.createElement('div'));
        exhibitionPicker.addClass("exhibitionPicker");
        exhibitionPicker.css({
            'height': '40%',
            'width': '40%',
            'position': 'absolute',
            'top': '20%',
            'left': '30%',
            'background-color': 'black',
            'z-index': '10000',
            'border': '3px double white',
            'padding': '1.5%',
            'display': 'block',
        });

        var infoLabel = $(document.createElement('div'));
        infoLabel.addClass("infoLabel");
        infoLabel.css({
            'width': '100%',
            'color': 'white',
            'font-size': '200%',
            'margin-bottom': '2%'
        });
        infoLabel.text('Choose an exhibition in which to view the artwork.');
        exhibitionPicker.append(infoLabel);

        var exhibitionsList = $(document.createElement('div'));
        exhibitionsList.addClass("exhibitionsList");
        exhibitionsList.css({
            'width': '100%',
            'height': '60%',
            'overflow': 'auto',
            'margin-bottom': '2%',
        });
        exhibitionPicker.append(exhibitionsList);

        var cancelButton = $(document.createElement('button'));
        cancelButton.attr('type', 'button');
        cancelButton.addClass("cancelButton");
        cancelButton.css({
            'width': '10%',
            'left': '85%',
            'top': '89%',
            'color': 'white',
            'font-size': '140%',
            'border-color': 'white',
            'position': 'absolute',
        });
        cancelButton.text('Cancel');

        cancelButton.click(function () {
            exhibitionPicker.detach();
        });
        exhibitionPicker.append(cancelButton);

        root.append(exhibitionPicker);

        exhibitionSelect(artworkObj);

        function exhibitionSelect(artwork) {
            var i;
            var xml = LADS.Worktop.Database.getDoqXML(artwork.Identifier);
            var parser = new DOMParser();
            var artworkXML = parser.parseFromString(xml, 'text/xml');
            var selected;
            var currentExhibitions = [];
            var exhibitionLabelArray = [];

            for (i = 0; i < artworkXML.getElementsByTagName('FolderId').length; i++) {
                var exhib_id = artworkXML.getElementsByTagName('FolderId')[i].textContent;
                currentExhibitions.push(exhib_id);
            }

            for (i = 0; i < currentExhibitions.length; i++) {
                var exhibitionLabelWrapper = document.createElement('div');
                var exhibitionLabel = $(document.createElement('div'));
                exhibitionLabel.addClass(".exhibitionLabel");
                exhibitionLabel.css({
                    width: '80%',
                    color: 'white',
                    'font-size': '180%',
                });
                exhibitionLabel.text(currentExhibitions[i].Name);
                var exhibitionObject = currentExhibitions[i];
                $(exhibitionLabelWrapper).append(exhibitionLabel);
                exhibitionLabelArray.push(exhibitionLabelWrapper);
            }

            $.each(currentExhibitions, function (i, exhibition) {
                var toAdd = LADS.Worktop.Database.getDoqByGuid(exhibition);
                if (toAdd.Metadata.Private === "true" || toAdd.Metadata.Type !== "Exhibit" || toAdd.Metadata.Deleted) { return; }
                else {
                    var name = toAdd.Name;
                    var preview = LADS.Worktop.Database.fixPath(toAdd.Metadata.BackgroundImage);
                    var listCell = $(document.createElement('div'));
                    listCell.addClass("exhibitions-list-cell");
                    listCell.css({
                        'width': '100%',
                        'height': '18%',
                        'position': 'relative',
                        'border': 'solid transparent',
                        'border-width': '5px 0px 5px 0px',
                        'display': 'inline-block',
                        'overflow': 'hidden',
                        'vertical-align': 'text-top',
                        'margin-bottom': '2%',
                    });
                    listCell.mousedown(function () {
                        listCell.css({
                            'background-color': 'white',
                            'color': 'black',
                        });
                    });
                    listCell.mouseup(function () {
                        listCell.css({
                            'background-color': 'black',
                            'color': 'white',
                        });
                    });
                    listCell.mouseleave(function () {
                        listCell.css({
                            'background-color': 'black',
                            'color': 'white',
                        });
                    });

                    var textBox = $(document.createElement('div'));
                    textBox.addClass("textbox");
                    textBox.css({
                        'width': '70%',
                        'height': '100%',
                        "font-size": "180%",
                        'display': 'inline-block',
                        'word-wrap': '',
                        'overflow': 'hidden',

                    });
                    textBox.text(name);

                    // Create an img element to load the image
                    var img = $(document.createElement('img'));
                    img.addClass("imgLoader");
                    img.attr('src', preview);
                    img.css({
                        "width": "7.5%",
                        "height": "100%",
                        "float": "left",
                        'margin-right': '2.5%',
                        'margin-left': '6%',
                        "top": '5%',
                        'border': '1px solid black',
                        'display': 'inline-block',
                    });
                    listCell.append(img);
                    listCell.append(textBox);

                    // Create a progress circle
                    var progressCircCSS = {
                        'position': 'absolute',
                        'left': '40%',
                        'top': '40%',
                        'z-index': '50',
                        'height': 'auto',
                        'width': '20%'
                    };

                    var circle = LADS.Util.showProgressCircle(img, progressCircCSS, '0px', '0px', true);

                    img.load(function () {
                        LADS.Util.removeProgressCircle(circle);
                    });

                    exhibitionsList.append(listCell);
                    listCell.click(function () {

                        var newSplit = new LADS.Layout.Catalog(toAdd, true);
                        LADS.Util.Splitscreen.init(root, newSplit.getRoot());
                        //LADS.Util.Splitscreen.setViewers(root, zoomimage);
                        splitscreen.text('Exit Split Screen');
                        locsize = $('#metascreen-L').width() - window.innerWidth * 0.2;
                        //locationHistoryDiv.css({ width: locsize + 'px' });
                        $('.exhibitionPicker').remove();

                        newSplit.loadInteraction();
                        //var newState = {};
                        //newState.currentSort = "Title";
                        //newState.exhibition = toAdd;
                        //newState.tag = "Title";
                        //newState.currentImage = artwork;
                        //catalog.setState(newState);

                        backButton.off('click');
                        backButton.on('click', function () {
                            backButton.off('click');
                            zoomimage.unload();
                            var catalog = new LADS.Layout.Catalog(toAdd);
                            catalog.getRoot().css({ 'overflow-x': 'hidden' });
                            LADS.Util.UI.slidePageRightSplit(root, catalog.getRoot(), function () {
                                catalog.getRoot().css({ 'overflow-x': 'hidden' });
                                catalog.loadInteraction();
                                var newState = {};
                                newState.currentSort = "Title";
                                newState.exhibition = toAdd;
                                newState.tag = "Title";
                                newState.currentImage = artwork;
                                catalog.setState(newState);
                            });
                        });
                    });
                }
            });
        }
    }

    /*
    **initiate Feedback. P.S.: currently gray and disabled.
    **@return feedbackContainer
    */
    function initFeedback() {

        var feedbackContainer = root.find('.feedbackContainer');

        var feedback = feedbackContainer.find('.feedback-text');

        var feedbackIcon = feedbackContainer.find('.feedback-icon');

        var feedbackBox = LADS.Util.UI.FeedbackBox("Artwork", doq.Identifier);//initiate the send feedback box
        setTimeout(function () {
            $('body').append(feedbackBox);
        }, 750);
        //pop up the feedback editing box when Send Feedback is clicked.
        // disable for now
        feedbackContainer.click(makeFeedback);
        function makeFeedback() {
            $(feedbackBox).css({ 'display': 'block' });
        }

        return feedbackContainer;
    }


    /**
     * Sets up splitscreen toggle and splitscreen logic
     * @return	the div container of the splitscreen button as a DOM node
     */
    function initSplitscreen() {

        //Split screen sidebar button
        var splitscreenContainer = root.find(".splitscreenContainer");

        //create text div for splitscreen
        splitscreen = splitscreenContainer.find('.splitscreen-text');

        //create splitscreen Icon
        var splitscreenIcon = splitscreenContainer.find('.splitscreen-icon');

        if (LADS.Util.Splitscreen.on()) { // Adjust button if already in split screen mode
            splitscreen.text('Exit Split Screen');
        }

        splitscreenContainer.click(function () {
            if (locationHistoryActive) {
                locationHistory.text('Location History');
                locationHistory.css({ 'color': 'white' });
                locationHistoryIcon.attr('src', 'images/icons/Location.svg');
                locationHistoryToggle.hide();
                locationHistoryToggle.hide("slide", { direction: direction }, 500);
                locationHistoryDiv.hide("slide", { direction: direction }, 500);
                toggler.show();//show the toggler for sidebar and hide the locationhistory toggler.
                locationHistoryActive = false;
            }
            if (previous === "exhibitions" && initialized === true) {
                enterSplitScreen(true);
            } else {
                enterSplitScreen();
            }
        });
        function enterSplitScreen(fromTour) {//click function for splitscreenContainer
            fromTour = fromTour || 0;
            $('.locations').css({
                display: 'block',
                'white-space': 'nowrap',
                'text-overflow': 'ellipsis',
                '-o-text-overflow': 'ellipsis',
                '-ms-text-overflow': 'ellipsis',
                overflow: 'hidden'
            });

            if (!LADS.Util.Splitscreen.on()) {
                locationHistory.css('opacity', '0.5');
                locationHistoryIcon.css('opacity', '0.5');
                //if the user enter artmode from tour tab in exhibition
                var newSplit;
                if (exhibition && exhibition.sort) {
                    newSplit = new LADS.Layout.Catalog(exhibition, true);
                    LADS.Util.Splitscreen.init(root, newSplit.getRoot());
                    zoomimage.viewer.scheduleUpdate();
                    newSplit.loadInteraction();
                    //var newState = {};
                    //newState.currentSort = "Title";
                    //newState.exhibition = exhibition;
                    //newState.tag = "Title";
                    //newState.currentImage = artwork;
                    //catalog.setState(newState);

                    LADS.Util.Splitscreen.setViewers(root, zoomimage);
                    splitscreen.text('Exit Split Screen');
                    locsize = $('#metascreen-L').width() - window.innerWidth * 0.2;
                    //locationHistoryDiv.css({ width: locsize + 'px' });//change the width of locationhistory to fit the splitscreen
                }
                else if (fromTour !== 0) {
                    createExhibitionPicker(doq);
                }
            }
            else {//if the splitscreen is on, exit it.
                var parentid = $(root).parent().attr('id');
                var parentSide = parentid[parentid.length - 1];
                zoomimage.viewer.scheduleUpdate();
                LADS.Util.Splitscreen.exit(parentSide);
                locationHistory.css('opacity', '1');
                locationHistoryIcon.css('opacity', '1');
            }
        }

        splitscreenContainer.append(splitscreenIcon);
        splitscreenContainer.append(splitscreen);
        return splitscreenContainer;
    }




    /*
    **@return the root.
    */
    this.getRoot = function () {
        return root;
    };
    /*
    **make the Map for location History.
    **@para: callback function
    */
    function makeMap(callback) {
        var initMap = function () {
            var mapOptions =
            {
                credentials: "AkNHkEEn3eGC3msbfyjikl4yNwuy5Qt9oHKEnqh4BSqo5zGiMGOURNJALWUfhbmj",
                mapTypeID: Microsoft.Maps.MapTypeId.road,
                showScalebar: true,
                enableClickableLogo: false,
                enableSearchLogo: false,
                showDashboard: true,
                showMapTypeSelector: false,
                zoom: 2,
                center: new Microsoft.Maps.Location(20, 0),
            };
            var viewOptions = {
                mapTypeId: Microsoft.Maps.MapTypeId.road,
            };
            //create the map based on splitscreen position.
            if (root.data('split') === 'R') {
                map = new Microsoft.Maps.Map(document.getElementById('lpMapDivR'), mapOptions);
            } else {
                map = new Microsoft.Maps.Map(document.getElementById('lpMapDiv'), mapOptions);
            }
            map.setView(viewOptions);

            mapMade = true;
            callback();
        };
        Microsoft.Maps.loadModule('Microsoft.Maps.Map', { callback: initMap });
    }

};

LADS.Layout.Artmode.default_options = {
    catalogState: {},
    doq: null,
    split: 'L',
};