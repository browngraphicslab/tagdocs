LADS.Util.makeNamespace("LADS.Layout.ArtworkEditor");

/*
*   The layout definition for Artwork Editor. 
*   click 'Edit Artwork Info' in the Authoring Mode to enter in
*   Contains info., location, thumnail, and media editors.
*/

LADS.Layout.ArtworkEditor = function (artwork) {
    "use strict";

    this.getRoot = function () {
        return root;
    };

    var root = $(document.createElement('div'));
    var topbar = $(document.createElement('div'));
    var mainPanel = $(document.createElement('div'));
    var searchBox;
    var resultsBox;
    var unsavedDescription;
    var locationsDiv;
    var confirmBubble;
    var mapDiv;
    var map;
    var mapAttachClick;
    var addLocationDiv;
    var addLocButton;
    var datePicker;
    var customInfobox;
    var yearTextArea, locationTextArea, descriptionTextArea;
    var mapMade;
    var helpBox;
    var helpText = "To select a location, type into the search field or right-click/long-press on the map and drag the pushpin to the desired position, then click on the desired address and click 'Confirm'.";
    var locationInfo; //popup on map that shows the year, location and description of the location
    var credentials = "AkNHkEEn3eGC3msbfyjikl4yNwuy5Qt9oHKEnqh4BSqo5zGiMGOURNJALWUfhbmj";
    var locationList = [];
    var currentLocation; //The location that is under edit mode (whose information is currently shown in the location info box)
    var selectedLocResource;
    var selectedAddress;
    var selectedDate;
    var selectedInfo;
    var locPanelOpen = false;
    var artworkSettings = {};
    var artworkXML;
    var tnBorderWrapper;
    var topbarHeight;
    var zoomimage;
    var mainDoq;
    var savedLabel;
    var labelNameToLabel = {};
    var textFieldContainer;
    var additionalCustomInfos;
    var uploadQueue = LADS.Util.createQueue();
    var numFiles = 0;
    var mediaMetadata = [];
    var isUploading = false;
    var isCreatingMedia = false;
    var $progressBar, $innerProgressBar;
    var $topProgressBar, $topInnerProgressBar, $topProgressDiv, $topProgressText;
    var assetUploader;
    var hasBeenChanged;
    var $hotspotAnchor;
    var editingMediamsg;
    var descriptionEditor;
    var editingDescription = false;
    var addInfoButton = $(document.createElement('button'));
    var selectedPoint;
    var textMetadata = {};

    // for toggle hotspot in rightbar
    var switchEdit = false;
    var createNew = false;
    var inEditHotspot = false;

    var yearBox, monthBox, dateBox;

    init();
    getMainDoq();

    function init() {
        root.css("background-color", "rgb(219,217,204)");
        root.css("color", "black");
        root.css("width", "100%");
        root.css("height", "100%");
        hasBeenChanged = false;
        additionalCustomInfos = 0;
        topbarHeight = 8;
        createTopBar(topbarHeight);
        getArtworkXML();

        mainPanel.css({ width: '100%', height: (100 - topbarHeight) + '%' });
        mainPanel.addClass("mainPanel");

        //creates deep zoom image
        if (artwork) {
            zoomimage = new LADS.AnnotatedImage(root, artwork.Name, artwork.Identifier);
            if (!(zoomimage.loadDoq(artwork))) {
                var popup = LADS.Util.UI.popUpMessage(function () {
                    LADS.Authoring.NewSettingsView("Artworks", function (settingsView) {
                        LADS.Util.UI.slidePageRight(settingsView.getRoot());
                    }, null, artwork.Identifier);
                }, "There was an error loading the image.", "Go Back", true);
                root.append(popup);
                $(popup).show();
            }
        }
        var hotspots = zoomimage.getHotspots();

        makeSidebar();
        makeEditMediaUI(); // Hidden by default
        makeUploadTemplate(); // Always hidden
        makeHotspotAnchor();
        
        createCustomFields();
        root.append(topbar);
        root.append(mainPanel);
    }

    function getMainDoq() {
        var mainGuid = LADS.Worktop.Database.getMainGuid();
        var xml = LADS.Worktop.Database.getXML(mainGuid);
        var parser = new DOMParser();
        mainDoq = parser.parseFromString(xml, 'text/xml');
    }

    /** 
     * Create a new right panel for editing Associated Media and append it to the dom (just offscreen)
     */
    var rightbarLoadingDelete = $(document.createElement('div'));

    function makeEditMediaUI() {
        var $rightbar = $(document.createElement('div'))
            .addClass("rightbar")
            .css({
                'width': '20%',
                'height': '100%',
                'position': 'absolute',
                'background-color': 'rgba(0,0,0,.85)',
                'top': $('.topbar').css('height'),
                'right': '-20%',
                'float': 'right',
                'z-index': 100,
                'color': 'white'
            });

        var $rightbarHeader = $(document.createElement('div'))
            .css({
                'margin': '5% 8%',
                'color': 'white',
                'font-size': '150%',
                'float': 'left',
                'position': 'relative',
            })
            .addClass('header')
            .appendTo($rightbar);

        var $assocMediaContainer = $(document.createElement('div'))
            .css({
                'position': 'relative',
                'margin': '15% 8%',
                'margin-top': '20%',
                'border': '2px solid white',
                'width': '86%',
                'height': '30%'
            });
        $assocMediaContainer.addClass('assocMediaContainer');

        var $assocMediaContent = $(document.createElement('div'))
            .addClass('assocmedia')
            .addClass('contentwrapper')
            .css({
                'background-color': 'rgba(0,0,0,.9)',
                'height': '100%',
                'width': '100%',
                'left': '0',
                'position': 'absolute'
            });

        $rightbar.append($assocMediaContainer.append($assocMediaContent));

        var $toggleHotspotContainer = $(document.createElement('div'))
            .addClass('toggleHotspotContainer')
            .css({
                'width': '60%',
                'left': '20%',
                'position': 'relative',
            })
            .appendTo($rightbar)

        // button used to add/remove hotspot
        var $toggleHotspot = $(document.createElement('button'))
            .addClass('toggleHotspot')
            .css({
                'width': '100%',
                'height': 'auto',
                'border': '2px solid white',
                'position': 'relative'
            })
            .attr('type', 'button')
            .appendTo($toggleHotspotContainer)
            .click(function () {
                switchEdit = true;
                inEditHotspot = true;
                if (!$($assocMediaContainer).is(":visible")) { //for text media, don't show the preview window
                    if ($toggleHotspot.text() === 'Associate to Hotspot') {
                        showEditMedia({ assetType: "Hotspot" }, '', true);
                    }
                    else {
                        showEditMedia({ assetType: "Asset" }, '', true);
                    }
                }
                else {
                    if ($toggleHotspot.text() === 'Associate to Hotspot') {
                        showEditMedia({ assetType: "Hotspot" });
                    }
                    else {
                        showEditMedia({ assetType: "Asset" });
                    }
                }
            });

        $progressBar = $(document.createElement('div'));
        $innerProgressBar = $(document.createElement('div'));

        $progressBar.css({
            'border-style': 'solid',
            'border-color': 'white',
            'width': '86%',
            'height': '10px',
            'visibility': 'hidden',
            'margin': '3% 8%'
        });

        $innerProgressBar.css({
            'background-color': 'white', 'width': '0%', 'height': '100%'
        });

        //$rightbar.append($progressBar.append($innerProgressBar));

        var $titleContainer = $(document.createElement('div'))
            .addClass('textareaContainer')
            .css({
                'width': '100%',
                'padding': '5% 8%',
                'margin-top': '5%',
            })
            .appendTo($rightbar);

        var $titleText = $(document.createElement('input'))
            .addClass('title')
            .attr('placeholder', 'Title')
            .attr('title', 'Title')
            .css({
                'width': '64%',
                'font-size': '11pt'
            })
            .appendTo($titleContainer);
        
        var $descContainer = $(document.createElement('div'))
            .addClass('textareaContainer')
            .css({
                'width': '87%',
                'height': '12%',
                'position': 'relative',
                'padding': '5% 8%'
            })
            .appendTo($rightbar);
        var $descArea = $(document.createElement('textarea'))
            .addClass('description')
            .attr('placeholder', 'Description')
            .css({
                'background-color': 'white',
                'width': '92.5%', // Ugh how do I CSS
                'min-width': '92.5%',
                'height': '90%'
            })
            .appendTo($descContainer);

        var $assocMediaButtonContainer = $(document.createElement('div'))
            .addClass('buttoncontainer')
            .css({
                'width': '87%',
                'padding': '5% 8%',
                'position': 'relative'
            })
            .appendTo($rightbar);

        var $deleteAssocMediaButton = $(document.createElement('button'))
            .addClass('asscmediabutton deletebutton')
            .text('Delete')
            .css({
                'float': 'left',
                //'color': 'white',
                'border': '2px solid white',
                'width': '45%'
            })
            .attr('type', 'button')
            .appendTo($assocMediaButtonContainer)
            .click(function () {
                if (isUploading || isCreatingMedia) {
                    editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "An upload is in progress. Please wait a few moments.", "OK", false));
                    root.append(editingMediamsg);
                    editingMediamsg.show();
                    return;
                }
                if (getActiveMediaMetadata('contentType') === 'Video') {
                    $('.rightbar').find('video')[0].pause();
                    //$('.rightbar').find('video').remove();
                }
                if (getActiveMediaMetadata('contentType') === 'Audio') {
                    $('.rightbar').find('audio')[0].pause();
                    //$('.rightbar').find('audio').remove();
                }

                // first, cancel any uploads in progress
                if (assetUploader) {
                    assetUploader.cancelPromises();
                    isUploading = false;
                    $progressBar.css("visibility", "hidden");
                    $innerProgressBar.css('width', '0%');
                }
                //add spinning wheel
                //var rightbarLoadingDelete = $(document.createElement('div'));
                rightbarLoadingDelete.css({
                    'width': '20%',
                    'height': '100%',
                    'position': 'absolute',
                    'background-color': 'rgba(0,0,0,.85)',
                    'top': $('.topbar').css('height'),
                    'right': '0%',
                    'z-index': 100,

                });
                mainPanel.append(rightbarLoadingDelete);
                LADS.Util.showLoading(rightbarLoadingDelete, '20%');

                //if ($(".rightbar").find('video').length) {
                //    $(".rightbar").find('video').remove();
                //}
                //if ($(".rightbar").find('audio').length) {
                //    $(".rightbar").find('audio').remove();
                //}

                var assetLinqID = getActiveMediaMetadata('assetLinqID'),
                    assetDoqID = getActiveMediaMetadata('assetDoqID');
                if (assetLinqID && assetDoqID) {
                    LADS.Worktop.Database.deleteHotspot(assetLinqID, assetDoqID, function () {
                        populateHotspotsList();
                        hideEditMediaUI();
                        rightbarLoadingDelete.fadeOut();
                    });
                }
                else {
                    populateHotspotsList();
                    hideEditMediaUI();
                    rightbarLoadingDelete.fadeOut();
                }

            });

        var $saveAssocMediaButton = $(document.createElement('button'))
            .addClass('asscmediabutton addbutton')
            .text('Save')
            .attr('type', 'button')
            .css({
                'float': 'right',
                //'color': 'white',
                'border': '2px solid white',
                'width': '45%'
            })
            .appendTo($assocMediaButtonContainer)
            .click(function () {
                if (isUploading || isCreatingMedia) {
                    editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "An upload is in progress. Please wait a few moments.", "OK", false));
                    root.append(editingMediamsg);
                    editingMediamsg.show();
                    return;
                }
                inEditHotspot = false;
                var messageBox, titleTextVal;
                console.log("isUploading = " + isUploading);
                if (getActiveMediaMetadata('contentType') === 'Video' ) {
                    $('.rightbar').find('video')[0].pause();
                    //$('.rightbar').find('video').remove();
                }
                if (getActiveMediaMetadata('contentType') === 'Audio') {
                    $('.rightbar').find('audio')[0].pause();
                    //$('.rightbar').find('audio').remove();
                }
                if (isUploading) {
                    messageBox = LADS.Util.UI.popUpMessage(null, "Asset upload in progress. Please wait a few moments.", null);
                    $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                    $('body').append(messageBox);
                    $(messageBox).fadeIn(500);
                    return;
                }
                isCreatingMedia = true;
                titleTextVal = $titleText.val();
                if ($titleText.val() === '') {
                    titleTextVal = 'Untitled';
                }

                //set up metadata for text media
                if (!$($assocMediaContainer).is(":visible")) {
                    setActiveMediaMetadata('contentType', 'Text');
                }
                //check what type of asset it is and set metadata appropriately
                if ($toggleHotspot.text() === 'Associate to Hotspot') {
                    setActiveMediaMetadata('assetType', 'Asset');
                }
                else {
                    setActiveMediaMetadata('assetType', 'Hotspot');
                }

                uploadHotspot({
                    title: LADS.Util.encodeXML(titleTextVal),
                    desc: LADS.Util.encodeXML($descArea.val()),
                    pos: Seadragon.Utils.getElementPosition($hotspotAnchor.children().first().get(0)),
                    // Quick hack to save the position of the hotspot circle itself
                    contentType: getActiveMediaMetadata('contentType'),
                    contentUrl: getActiveMediaMetadata('contentUrl'),
                    assetType: getActiveMediaMetadata('assetType'),
                    metadata: {
                        assetLinqID: getActiveMediaMetadata('assetLinqID'),
                        assetDoqID: getActiveMediaMetadata('assetDoqID')
                    }
                }); 
            });

        var closeButton = $(document.createElement('img'))
            .attr('src', 'images/icons/x.png');


        closeButton.css({
                'position': 'absolute',
                'top': ($(window).height() - ($(window).height() * topbarHeight / 100)) * 0.95 - 15 + 'px',
                'left': '8%',
                'width': '11%',
                'height': 'auto',
        })
        .appendTo($rightbar)
        .on('click', function () {
            if (assetUploader) {
                assetUploader.cancelPromises();
                isUploading = false;
                $progressBar.css("visibility", "hidden");
                $innerProgressBar.css('width', '0%');
            }
            if (getActiveMediaMetadata('contentType') === 'Video') {
                $('.rightbar').find('video')[0].pause();
                //$('.rightbar').find('video').remove();
            }
            if (getActiveMediaMetadata('contentType') === 'Audio') {
                $('.rightbar').find('audio')[0].pause();
                //$('.rightbar').find('audio').remove();
            }
            hideEditMediaUI();
        });

        var $mainPanel = $(mainPanel);
        $mainPanel.append($rightbar);
    }

    /**
     * Refresh the view of available associated media in the sidebar.
     * @param $assetContainer (optional)    The container to append associated media buttons to.
     *      If $assetContainer is not supplied, the container will be selected by the classname 
     *      "assetContainer"
     */
    function populateHotspotsList($assetContainer) {
        if ($assetContainer === undefined) {
            $assetContainer = $('.assetContainer');
        }
        $assetContainer.empty();
        var hotspots = zoomimage.getHotspots(true);
        var assets = zoomimage.getAssets();
        for (var i = 0; i < assets.length; i++) {
            var $button = $(document.createElement('button'));
            var buttonCSS = {
                'margin-bottom': '2%',
                'width': '81%',
                'position': 'relative',
                'text-align': 'center'
            };
            $button.attr('type', 'button');
            $button.css(buttonCSS);

            var buttondata = $button.data('info', assets[i]);
            var $asset = assets[i];

            $button.click(clickhelper(assets[i]));
            $button.text($asset.title);
            $assetContainer.append($button);
        }
    }

    function clickhelper(asset) {
        return function () {
            if (hasBeenChanged) {
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
            } else {
                hideMenus();
                var info = asset;
                showEditMedia(info, wrapMedia(info.source, info.contentType, false));
            }
        };
}

    
    /** 
     * Create a view into the specified media type
     * @param src   URL for the desired resource
     * @param type  A string representing the type of file, currently supports 'Image', 'Video', and 'Audio'
     * @return      A jQuery element wrapping a view into the content
     */
    function wrapMedia(src, type) {
        var video, audio, src_webm, src_ogg, src_mp4, src_mp3, errText;
        var fixedSrc = LADS.Worktop.Database.fixPath(src);
        if (type === 'Image') {
            return $(document.createElement('img'))
                .css({
                    'width': '100%',
                    'height': '100%',
                    'background-image': 'url(' + fixedSrc + ')',
                    'background-repeat': 'no-repeat',
                    'background-position': 'center center',
                    'background-size': 'contain',
                    'border': '0',
                   
                });
        } else if (type === 'Video') {
            video = document.createElement('video');
            video.onerror = function (err) {
                var msg = "";
                switch (err.target.error.code) {
                    case err.target.error.MEDIA_ERR_ABORTED:
                        msg = "Video playback aborted. Please see FAQs on the TAG website.";
                        break;
                    case err.target.error.MEDIA_ERR_NETWORK:
                        msg = "Network error during video upload. Please see FAQs on the TAG website.";
                        break;
                    case err.target.error.MEDIA_ERR_DECODE:
                        msg = "Error decoding video. Please see FAQs on the TAG website.";
                        break;
                    case err.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        msg = "Either the video format is not supported or a network or server error occurred. Please see FAQs on the TAG website.";
                        break;
                    default:
                        msg = "Error: please see FAQs on the TAG website.";
                        break;
                }
                console.log("video error: " + msg);
                var msgdiv = $(document.createElement('div'));
                msgdiv.css({
                    'width': '80%',
                    'margin-left': '10%',
                    'margin-top': '50%',
                    'color': 'white',
                    'text-align': 'center'
                });
                msgdiv.text(msg);
                var parent = $('.rightbar').find('video').parent();
                $('.rightbar').find('video').hide();
                parent.append(msgdiv);
                video.onerror = function (err) {  };
            };
            $(video).attr('preload', 'none');
            console.log("video src = "+src+", fixedSrc = "+fixedSrc);

            src_mp4 = document.createElement('source');
            src_mp4.src = fixedSrc;
            src_mp4.type = "video/mp4";

            src_webm = document.createElement('source');
            src_webm.src = fixedSrc;
            src_webm.type = "video/webm";

            src_ogg = document.createElement('source');
            src_ogg.src = fixedSrc;
            src_ogg.type = "video/ogg";
            
            video.appendChild(src_mp4);
            video.appendChild(src_webm);
            video.appendChild(src_ogg);

            //errText = $(document.createElement('div'));
            //errText.text("Your browser does not support this video");
            //errText.css("color", "white");
            //video.appendChild(errText[0]);

            video.style.color = "white";
            video.innerHTML += "Your browser does not support this video."; // fallback text

            video.controls = 'controls';
            video.style.position = 'relative';
            video.style.width = '100%';
            video.style.height = '100%';
            return $(video);
        } else if (type === 'Audio') {
            audio = document.createElement('audio');
            $(audio).attr('preload', 'none');
            src_mp3 = document.createElement('source');
            src_mp3.src = fixedSrc;
            src_mp3.type = "audio/mp3";

            src_ogg = document.createElement('source');
            src_ogg.src = fixedSrc;
            src_ogg.type = "audio/ogg";

            audio.appendChild(src_mp3);
            audio.appendChild(src_ogg);

            audio.controls = 'controls';
            audio.style.position = 'absolute';
            audio.style.width = '100%';
           audio.style.bottom = '0%'; // ?
           // audio.style.top = '84%';
            return $(audio);
        }
    }

    /**
     * Initialize a reusible hotspot div and store it in the module variable $hotspotAnchor
     */
    function makeHotspotAnchor() {
        var $hotspotWrapper = $(document.createElement('div'))
            .css({
                'position': 'absolute'
            })
            .addClass('hotspotedit');

        var $hotspotCircle = $(document.createElement('div'))
            .css({
                'position': 'absolute',
                'display': 'block',
                'width': '40px',
                'height': '40px',
                'border': 'solid rgba(255,255,255,1) 5px',
                'border-radius': '50%',
                'top': '-50px',
                'left': '-50px'
            })
            .attr('on', null)
            .appendTo($hotspotWrapper);

        var $innerCircle = $(document.createElement('div'))
            .css({
                'display': 'block',
                'width': '30px',
                'height': '30px',
                'background': 'rgba(0,0,0,0.01)',
                'border': 'solid rgba(0,0,0,1) 5px',
                'border-radius': '50%'
            })
            .appendTo($hotspotCircle);

        var $clickable = $(document.createElement('div'))
            .css({
                'display': 'block',
                'width': '0px',
                'height': '0px',
                'background': 'rgba(0,0,0,0)',
                'border': 'solid rgba(0,0,0,0.1) 15px',
                'border-radius': '50%'
            })
            .appendTo($innerCircle);

        var $hotspotHint = $(document.createElement('div'))
            .text('Hotspot anchor (drag to update)')
            .css({
                'position': 'relative',
                'left': '-5px',
                'top': '-5px',
                'width': 'auto',
                'color': 'white',
                'font-weight': 'bold',
                'font-size': 'large',
                'padding': '8px',
                'background-color': 'rgba(0,0,0,.85)'
            })
            .appendTo($hotspotWrapper);

        LADS.Util.disableDrag(root);

        LADS.Util.makeManipulatableWin($hotspotCircle.get(0), {
            onManipulate: function (res) {
                var t = $hotspotWrapper.css('top');
                var l = $hotspotWrapper.css('left');
                $hotspotWrapper.css("top", (parseInt(t, 10) + res.pivot.y - 20) + "px");
                $hotspotWrapper.css("left", (parseInt(l, 10) + res.pivot.x - 20) + "px");
                zoomimage.updateOverlay($hotspotWrapper.get(0), Seadragon.OverlayPlacement.TOP_LEFT);
            }
        });

        $hotspotAnchor = $hotspotWrapper.appendTo(root);
    }

    /**
     * Initialize the template required for displaying the Associated Media upload picker
     */
    function makeUploadTemplate() {
        var $assocMediaContentPlaceholderImg = $(document.createElement('img'))
            .attr('src', 'images/icons/ImportW.png')
            .css({
                'width': '15%',
                'height': '19%',
                'display': 'block',
                'margin': '0 auto'
            });
        var $assocMediaContentPlaceholder = $(document.createElement('div'))
            .css({
                'padding-top': '30%',
                'height': '70%',
                'position': 'relative',
                'font-size': '150%',
                'text-align': 'center',
                'color': 'white'
            })
            .append($assocMediaContentPlaceholderImg)
            .append($(document.createElement('p')).text('Import Media'))
            .addClass('uploadtemplate')
            .hide()
            .appendTo(root)
            .click(function () {
                var uniqueUrls = []; // Used to make sure we don't override data for the wrong media (not actually airtight but w/e)
                var mediaMetadata = [];
                numFiles = 0;
                isUploading = true;
                hasBeenChanged=true;
                assetUploader = LADS.Authoring.FileUploader( // multi-file upload now
                    $(document),
                    LADS.Authoring.FileUploadTypes.Standard,
                    function (files, localURLs) { // localCallback
                        var file = files[0], localURL = localURLs[0], i;
                        var img, video, audio;
                        var contentType;
                        numFiles = files.length;
                        if (files.length > 0) {
                            $progressBar.css("visibility", "visible");
                        }
                        else {
                            isUploading = false;
                            isCreatingMedia = false;
                            return;
                        }

                        // show image/video/audio/text
                        if (file.contentType.split('/', 1)[0] === 'image') {
                            img = wrapMedia(localURL, 'Image');
                            img[0].type = file.contentType;
                            console.log("image type = " + img[0].type);
                            contentType = 'Image';
                            updateEditMedia({ 'contentType': contentType }, img);
                        } else if (file.contentType.split('/', 1)[0] === 'video') {
                            video = wrapMedia(localURL, 'Video');
                            video[0].type = file.contentType;
                            console.log("video type = " + video[0].type);
                            contentType = 'Video';
                            updateEditMedia({ 'contentType': contentType }, video);

                        } else if (file.contentType.split('/', 1)[0] === 'audio') {
                            audio = wrapMedia(localURL, 'Audio');
                            audio[0].type = file.contentType;
                            contentType = 'Audio';
                            console.log("audio type = " + audio[0].type);
                            updateEditMedia({ 'contentType': contentType }, audio);
                        }
                        uniqueUrls.push(localURL);//uriString;
                        setActiveMediaMetadata('localUrl', localURL);
                        //mediaMetadata.push({'contentType': contentType, 'assetType': getActiveMediaMetadata('assetType'), 'assetLinqID': getActiveMediaMetadata('assetLinqID'), 'assetDoqID': getActiveMediaMetadata('assetDoqID')});
                        //setActiveMediaMetadata('contentUrl', uriString);
                    },
                    function (dataReaderLoads) { // finished callback: set proper contentUrls, if not first, save it
                        var dataReaderLoad = dataReaderLoads[0];
                        if (uniqueUrls[0] && uniqueUrls[0] === getActiveMediaMetadata('localUrl')) {
                            setActiveMediaMetadata('contentUrl', dataReaderLoad);
                        }
                        isUploading = false;

                        // reset the progress bar
                        $progressBar.css("visibility", "hidden");
                        $innerProgressBar.css("width", "0%");
                    },
                    ['.jpg', '.png', '.gif', '.tif', '.tiff', '.mp4', '.mp3'], // filters
                    false, // useThumbnail
                    null, // errorCallback
                    false, // multiple file upload enabled?,
                    $innerProgressBar
                //    function (upload) { // progress function
                //        var percentComplete = upload.progress.bytesSent / upload.progress.totalBytesToSend;
                //        console.log("percent complete: " + percentComplete + "%");
                //        $innerProgressBar.width(percentComplete * 99 + "%"); // still a bit to do after this progress is 100%
                //    }
                );
            });




    }

    //Input: none
    //Output: returns a boolean describing whether or not . 
    function addInfoButtonDisable() {
        var customInfos = artworkXML.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes;
        return ((customInfos.length + additionalCustomInfos) >= 13);
    }

    /**
     * Display Assoc. Media content in the right bar. The bar will animate out if it is hidden. 
     * Discards any unsaved properties of the active content.
     * @param info      Metadata object associated with the new content, including title and description
     * @param content   A dom element suitable for displaying the content
     */
    function showEditMedia(info, content, isText) {
        textMetadata = {};
        $('.assocMediaContainer').show();
        if (isText || info.contentType === "Text") {
            $('.assocMediaContainer').hide();
        }
        var title = info.title, description = info.description;
        var $rightbar = $('.rightbar');
        hasBeenChanged = false; 
        var point;
        if (info.x !== undefined && info.y !== undefined) {
            point = new Seadragon.Point(info.x, info.y);
        }
        else {
            point = zoomimage.viewer.viewport.getCenter();
        }

        // toggleHotspot button should only display when edit
        if (createNew) {
            $('.toggleHotspot').hide();
            createNew = false;
        }
        else {
            $('.toggleHotspot').show();
        }
        if (info.assetType.text === 'Hotspot' || info.assetType === 'Hotspot') {
            $('.toggleHotspot').text('Remove Hotspot');
            var pixel = zoomimage.viewer.viewport.pixelFromPoint(point),
                pixel_adj = new Seadragon.Point(pixel.x + 50, pixel.y + 50),
                point_adj = zoomimage.viewer.viewport.pointFromPixel(pixel_adj),
                hotspotCircle = $hotspotAnchor.get(0);
            zoomimage.addOverlayToDZ(hotspotCircle, point_adj, Seadragon.OverlayPlacement.TOP_LEFT);
            zoomimage.viewer.viewport.panTo(new Seadragon.Point(point.x, point.y), false);
            $hotspotAnchor.fadeIn(100);
        }
        else {
            $('.toggleHotspot').text('Associate to Hotspot');
            $hotspotAnchor.fadeOut(100);
        }

        if (typeof info.assetType === 'string')
            $rightbar.find('.header').text('Edit ' + info.assetType);
        else if (info.assetType.text !== undefined)
            $rightbar.find('.header').text('Edit ' + info.assetType.text);
        else
            $rightbar.find('.header').text('Edit Associated Media');


        if (!switchEdit) {
            if (content === undefined) {
                content = getUploadDiv();
            }
            if(content[0]) console.log("content = " + content[0].src);
            $rightbar.find('.assocmedia').html(content);
            $rightbar.find('.title').val(title);
            var oldtitle = title;
            $rightbar.find('.title').keyup(function () {
                if ($(this).val() !== oldtitle) {
                    hasBeenChanged = true;
                }
            });
            var oldDescription = description ? description.replace(/<br>/g, '\n') : "";

            $rightbar.find('.description').val(description ? description.replace(/<br>/g, '\n') : "");

            $rightbar.find('.description').keyup(function () {
                if ($(this).val() !== oldDescription) {
                    hasBeenChanged = true;
                }
            });
        }
        switchEdit = false;
        
        if (!$rightbar.hasClass('active')) {
            $rightbar.animate({ 'right': 0 }, 600);
            $rightbar.addClass('active');
        }

        for (var key in info) {
            setActiveMediaMetadata(key, info[key]);
        }
    }

    /**
     * Update the content view in the right bar. Will not overwrite any existing properties for the active content.
     * @param info      Metadata associated with this content
     * @param content   A dom element suitable for displaying the new content
     */
    function updateEditMedia(info, content) {
        var $rightbar = $('.rightbar');
        var meta = document.createElement('meta');
        meta.httpEquiv = "X-UA-Compatible";
        meta.content = "IE=Edge";
        $rightbar.append($(meta));
        var key;
        var current = getActiveMediaMetadata();

        if (info.assetType)
            $rightbar.find('.header').text(info.assetType);

        if (info.title)
            $rightbar.find('.title').val(info.title);
        if (info.description)
            $rightbar.find('.description').val(description);

        if (content)
            $rightbar.find('.assocmedia').html(content);

        for (key in current) {
            setActiveMediaMetadata(key, current[key]);
        }
        for (key in info) {
            setActiveMediaMetadata(key, info[key]);
        }
    }

    /**
     * Set a metadata value for the active media content.
     * @param key
     * @param val
     */
    function setActiveMediaMetadata(key, val) {
        var $media = $('.rightbar').find('.assocmedia').children();
        ($media.length) ? $media.data(key, val) : textMetadata[key] = val;
    }

    /**
     * Get metadata values for the active media content.
     * @param key (optional)   the key to retrieve. If key is not given, retrieve 
     *     the entire values object. 
     */
    function getActiveMediaMetadata(key) {
        var $media = $('.rightbar').find('.assocmedia').children();
        if (key === undefined || key === null) {
            return $media.data() || textMetadata[key];
        }
        else {
            return $media.data(key) || textMetadata[key];
        }
    }

    /**
     * Generate a jQuery element suitable for use as an Assoc. Media upload picker
     * Should be called after makeUploadTemplate()
     * @return  a jQuery element with the class 'upload'
     */
    function getUploadDiv() {
        return $('.uploadtemplate')
            .clone(true)
            .removeClass('uploadtemplate')
            .addClass('upload')
            .show();
    }

    function videoHelper(file, url, mediaMetadata, uniqueUrls, contentType, index) {
        file.properties.getVideoPropertiesAsync().done(function (VideoProperties) {
            var duration = VideoProperties.duration / 1000; // get duration in seconds
            uniqueUrls[index] = url;
            mediaMetadata[index] = ({
                'title': file.displayName,
                'contentType': contentType,
                'localUrl': url,
                'assetType': 'Asset',
                'assetLinqID': undefined,
                'assetDoqID': undefined,
                'duration': duration,
            });
        },
        function (error) {
            console.log(error);
        });
    }

    function audioHelper(file, url, mediaMetadata, uniqueUrls, contentType, index) {
        file.properties.getMusicPropertiesAsync().done(function (MusicProperties) {
            var duration = MusicProperties.duration / 1000; // get duration in seconds
            uniqueUrls[index] = url;
            mediaMetadata[index] = ({
                'title': file.displayName,
                'contentType': contentType,
                'localUrl': url,
                'assetType': 'Asset',
                'assetLinqID': undefined,
                'assetDoqID': undefined,
                'duration': duration,
            });
        },
        function (error) {
            console.log(error);
        });
    }

    function batchAssMedia() {
        var uniqueUrls = []; // Used to make sure we don't override data for the wrong media (not actually airtight but w/e)
        mediaMetadata = [];
        numFiles = 0;
        isUploading = true;
        isCreatingMedia = false;
        assetUploader = LADS.Authoring.FileUploader( // multi-file upload now
            $(document),
            LADS.Authoring.FileUploadTypes.Standard,
            function (files, localURLs) { // localCallback
                var file, localURL, i;
                var img, video, audio;
                var contentType, duration;
                if (files.length > 0) {
                    $topProgressText.text("uploading");
                    $topProgressDiv.css("visibility", "visible");
                }
                else {
                    isUploading = false;
                    isCreatingMedia = false;
                    return;
                }

                
                numFiles = files.length;
                for (i = 0; i < files.length; i++) {
                    file = files[i];
                    localURL = localURLs[i];
                    if (file.contentType.split('/', 1)[0] === 'image') {
                        contentType = 'Image';
                        uniqueUrls[i] = (localURL);
                        mediaMetadata[i] = ({
                            'title': file.displayName,
                            'contentType': contentType,
                            'localUrl': localURL,
                            'assetType': 'Asset',
                            'assetLinqID': undefined,
                            'assetDoqID': undefined,
                            
                        });
                    } else if (file.contentType.split('/', 1)[0] === 'video') {
                        contentType = 'Video';
                        videoHelper(file, localURL, mediaMetadata, uniqueUrls, contentType, i);
                    } else if (file.contentType.split('/', 1)[0] === 'audio') {
                        contentType = 'Audio';
                        audioHelper(file, localURL, mediaMetadata, uniqueUrls, contentType, i);
                    }
                    //uniqueUrls.push(localURL);
                    /*mediaMetadata.push({
                        'title': file.displayName,
                        'contentType': contentType,
                        'localUrl': localURL,
                        'assetType': 'Asset',
                        'assetLinqID': undefined,
                        'assetDoqID': undefined,
                        'duration': duration,
                    });*/
                }
            },
            function (dataReaderLoads) { // finished callback: set proper contentUrls, if not first, save it
                var i, dataReaderLoad;
                for (i = 0; i < dataReaderLoads.length; i++) {
                    dataReaderLoad = dataReaderLoads[i];
                    mediaMetadata[i].contentUrl = dataReaderLoad;
                }
                isCreatingMedia = true;
                $topProgressText.text("adding media");
                saveAssMedia(0); // starts the chain going
            },
            ['.jpg', '.png', '.gif', '.tif', '.tiff', '.mp4', '.mp3'], // filters
            false, // useThumbnail
            function () {
                $topProgressDiv.css("visibility", "hidden");
                $topInnerProgressBar.css("width", "0%");
                $topProgressText.text("uploading");
            }, // errorCallback
            true, // multiple file upload enabled?
            $topInnerProgressBar
        );
    }

    function saveAssMedia(i) { // call this from the finishedCallback in the file uploader for all assets not first in the list
        var activeMM = mediaMetadata[i];
        uploadHotspot({
            title: LADS.Util.encodeXML(activeMM.title || 'Untitled Media'),
            desc: LADS.Util.encodeXML(''),
            pos: Seadragon.Utils.getElementPosition($hotspotAnchor.children().first().get(0)), // bogus entry for now
            contentType: activeMM.contentType,
            contentUrl: activeMM.contentUrl,
            assetType: activeMM.assetType,
            metadata: {
                assetLinqID: activeMM.assetLinqID,
                assetDoqID: activeMM.assetDoqID
            },
            duration: activeMM.duration,
        },
        true,
        i);
    }

    /**
     * Execute a request to update or upload Hotspot data on the server.
     * @param info, an object with the following properties: title, desc, pos, contentType, 
     *      contentUrl, assetType, metadata (optional worktop info object)
     * @param background   is this upload going on in the background?
     * @param index        used for batch upload chaining
     */
    function uploadHotspot(info, background, index) {
        var title = info.title,
            desc = info.desc,
            pixel = info.pos,
            contentType = info.contentType,
            contentUrl = info.contentUrl,
            duration=info.duration,
            assetType = info.assetType,
            worktopInfo = info.metadata || {},
            dzPos = pixel ? zoomimage.viewer.viewport.pointFromPixel(pixel) : { x: 0, y: 0 }, // make sure this works...
            pixelAdjusted = zoomimage.viewer.viewport.pixelFromPoint(dzPos),
            isNewAsset = !worktopInfo.assetDoqID,
            rightbarLoadingSave;
        if (!background) {
            rightbarLoadingSave = $(document.createElement('div'));
            rightbarLoadingSave.css({
                'width': '20%',
                'height': '100%',
                'position': 'absolute',
                'background-color': 'rgba(0,0,0,.85)',
                'top': $('.topbar').css('height'),
                'right': '0%',
                'z-index': 100,

            });
            mainPanel.append(rightbarLoadingSave);
            LADS.Util.showLoading(rightbarLoadingSave, '20%');
            rightbarLoadingSave.attr('class', 'rightbarLoadingSave');
        }
        if (isNewAsset) {
            LADS.Worktop.Database.createHotspot(artwork.CreatorID, artwork.Identifier, createHotspotHelper,
                function () {
                    var popup = LADS.Util.UI.popUpMessage(null, "Hotspot not created.  You must log in to upload hotspot.");
                    $('body').append(popup);
                    $(popup).show();
                }, function () {
                    var popup = LADS.Util.UI.popUpMessage(null, "Hotspot not created.  There was an error contacting the server.");
                    $('body').append(popup);
                    $(popup).show();
            });
        }
        else {
            //TODO: asynch getLinqXML
            LADS.Worktop.Database.getLinqXML(worktopInfo.assetLinqID, createHotspotHelper);

        }

        function createHotspotHelper(isNewAsset, xmlHotspot) { // currently for creating both hotspots and assoc media
            var $xmlHotspot,
                hotspotId,
                hotspotContentId,
                hotspotContentDoq,
                $hotspotContentDoq,
                titleField,
                metadata,
                descField,
                contentTypeField,
                sourceField,
                mediaDuration,
                position;
            if (isNewAsset) {
                $xmlHotspot = $(xmlHotspot);
                hotspotId = $xmlHotspot.find("Identifier").text();
                hotspotContentId = $xmlHotspot.find("BubbleContentID:last").text();
            }
            else {
                $xmlHotspot = $(xmlHotspot);
                hotspotId = worktopInfo.assetLinqID;
                hotspotContentId = worktopInfo.assetDoqID;
            }
            var xml = LADS.Worktop.Database.getDoqXML(hotspotContentId);
            if (xml) {
                hotspotContentDoq = $.parseXML(xml);
                $hotspotContentDoq = $(hotspotContentDoq);
                // update doq info and send back to server
                titleField = $hotspotContentDoq.find('Name').text(title);
                metadata = $hotspotContentDoq.find('Metadata');
                descField = metadata.find("d3p1\\:Key:contains('Description') + d3p1\\:Value").text(desc);
                contentTypeField = metadata.find("d3p1\\:Key:contains('ContentType') + d3p1\\:Value").text(contentType);
                sourceField = metadata.find("d3p1\\:Key:contains('Source') + d3p1\\:Value").text(contentUrl);
                mediaDuration = metadata.find("d3p1\\:Key:contains('Duration') + d3p1\\:Value").text(duration);
                position = $xmlHotspot.find('Offset > d2p1\\:_x').text(dzPos.x); // why is position getting reset?
                position = $xmlHotspot.find('Offset > d2p1\\:_y').text(dzPos.y);
                //add linq type : Hotspot vs. Asset
                $xmlHotspot.find("d3p1\\:Key:contains('Type') + d3p1\\:Value").text(assetType);
                LADS.Worktop.Database.pushLinq(xmlHotspot, hotspotId);
                LADS.Worktop.Database.pushXML(hotspotContentDoq, hotspotContentId);
            }


            if (!background) {
                populateHotspotsList();
                if (!inEditHotspot) {
                    hideEditMediaUI();
                }
                rightbarLoadingSave.fadeOut();
                isUploading = false;
                isCreatingMedia = false;
            }
            else {
                if (index < numFiles - 1) {
                    saveAssMedia(index + 1);
                }
                else {
                    populateHotspotsList(); // asynchronous stuff going on in here. everything below it should be in a callback
                    isUploading = false;
                    isCreatingMedia = false;
                    $topProgressDiv.css("visibility", "hidden");
                    $topInnerProgressBar.css("width", "0%");
                }
            }
            inEditHotspot = false;
        }
    }

    /**
     * Hide the right panel with a slide out animation.
     */
    function hideEditMediaUI() {
        $hotspotAnchor.fadeOut(100);
        var $rightbar = $('.rightbar');
        if ($rightbar.hasClass('active')) {
            $rightbar.animate({ 'right': '-20%' }, 600);
            $rightbar.removeClass('active');
            hasBeenChanged = false;
        }
    }


    function makeSidebar() {
        var i;

        var sidebar = $(document.createElement('div'));
        $(sidebar).addClass("sidebar");
        $(sidebar).css({
            'width': '20%',
            'height': '100%',
            'position': 'relative',
            'left': '0%',
            'float': 'left',
            'background-color': 'rgba(0,0,0,0.85)',
            'z-index': 100,
        });

        textFieldContainer = $(document.createElement('div'));
        $(textFieldContainer).css({
            'position': 'relative',
            'height': '25%',
            'overflow': 'auto',
            padding: '0px 4% 0px 12%',
            'margin-top': '9.25%',
            'margin-bottom': '6.5%'
        });
        $(sidebar).append(textFieldContainer);

        createSidebarTextArea('Title', artwork.Name);
        createSidebarTextArea('Artist', artwork.Metadata.Artist);
        createSidebarTextArea('Year', artwork.Metadata.Year);
        //createSidebarTextArea('Accession Number', '');//not hooked up to the server, disable for the first release
        //createSidebarTextArea('Keywords', '');//not hooked up to the server, disable for the first release

        var buttonContainer = $(document.createElement('div'));
        buttonContainer.attr('class', 'buttonContainer');
        buttonContainer.css({
            position: 'relative',
            'margin-top': '4%',
            padding: '0px 4% 0px 12%',
        });
        sidebar.append(buttonContainer);

        var buttonCSS = {
            'margin-top': '2%',
            'margin-bottom': '3%',
            'width': '81%',
            'position': 'relative',
        };

        //var addInfoButton = $(document.createElement('button'));

        addInfoButton.text('Add Information Field');
        addInfoButton.attr('type', 'button');
        addInfoButton.css(buttonCSS);
        if (addInfoButtonDisable()) {
            addInfoButton.attr('disabled', 'disabled');
        }
        buttonContainer.append(addInfoButton);//not hooked up to the server, disable for first release

        var addInfoDialog = $(document.createElement('div'));
        addInfoDialog.attr('class', 'addInfoDialog');
        addInfoDialog.css({
            'padding': '4% 4%',
            'left': '105%',
            'margin-bottom': '2.5%',
            'top': '46%',
            'position': 'absolute',
            'background-color': 'rgba(0, 0, 0, 0.85)',
            'border-radius': '10px',
            'z-index': '100'
        });

        var addInfoDialogTriangle = $(document.createElement('div'));
        addInfoDialogTriangle.attr('class', 'addInfoDialogTriangle');
        addInfoDialogTriangle.css({
            'position': 'absolute',
            'top': '30%',
            'left': '-40px',
            'width': 0,
            'border-style': 'solid',
            'border-width': '20px',
            'border-color': 'transparent rgba(0, 0, 0, 0.85) transparent transparent',
            'z-index': '100'
        });


        var fieldTextArea = $(document.createElement('input'));
        fieldTextArea.attr('placeholder', 'Field');
        fieldTextArea.css({
            'border': '2px solid white',
            'margin-bottom': '2%'
        });

        var entryTextArea = $(document.createElement('input'));
        entryTextArea.attr('placeholder', 'Entry');
        entryTextArea.css({
            'border': '2px solid white',
            'margin-bottom': '5%'
        });

        var addButton = $(document.createElement('button'));
        addButton.addClass('addButton');
        addButton.text('Add');
        addButton.css({
            'color': 'white',
            'border': '2px solid white',
            'right': '1%',
            'position': 'relative',
            'float': 'right',
        });

        var cancelButton1 = $(document.createElement('button'));
        cancelButton1.addClass('cancelButton');
        $(cancelButton1).text('Cancel');
        $(cancelButton1).css({
            'color': 'white',
            'border': '2px solid white',
            'right': '2%',
            'position': 'relative',
            'float': 'right',
        });

        //create transparent div over addbutton div to disable clicking if there are more than 2 info fields.
        var cover = document.createElement('div');
        $(cover).attr('id', 'cover');
        $(cover).css({
            'height': '100%',
            'width': '100%',
            'top': '1%',
            'float': 'left',
            'position': 'relative',
            'background-color': 'white',
            'opacity': '0'
        });
        $(cover).bind('click', function () { return false; });



        $(addButton).click(function () {
            var field = LADS.Util.encodeText(fieldTextArea.val());
            var entry = LADS.Util.encodeText(entryTextArea.val());
            var valid = true;
            // valid only when it starts with number or alphabet
            if (field < '0' || (field.charAt(0) > '9' && field.charAt(0) < 'A') ||
                (field.charAt(0) > 'Z' && field.charAt(0) < 'a') || field.charAt(0) > 'z') {
                error.text('Please enter a valid field name');
                valid = false;
            }
            if (valid) {
                labelNameToLabel[field] = createSidebarTextArea(field, entry, true);
                addInfoDialog.fadeOut(100);
                error.text('');
                additionalCustomInfos += 1;
                if (addInfoButtonDisable()) {
                    addInfoButton.attr('disabled', 'disabled');
                }
            }
        }

           );

        var error = $(document.createElement('div'));
        error.css({
            color: 'red',
            'font-size': '90%',
        });

        $(cancelButton1)[0].onclick = function () {
            error.text('');
            $(addInfoDialog).fadeOut(100);
        };

        $(addInfoDialog).append(addInfoDialogTriangle);
        $(addInfoDialog).append(fieldTextArea);
        $(addInfoDialog).append(entryTextArea);
        $(addInfoDialog).append(error);
        $(addInfoDialog).append(addButton);
        $(addInfoDialog).append(cancelButton1);

        $(sidebar).append(addInfoDialog);
        $(addInfoDialog).hide();

        $(addInfoButton)[0].onclick = function () {
            if (hasBeenChanged) {
                //pop up editing media msg
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media.", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
            }
            else {
                hideEditMediaUI();
                rightbarLoadingDelete.fadeOut();
                //hideMenus();
                locPanelOpen = false;
                //if there are more than 2 info
                if (addInfoButtonDisable()) {
                    return;
                }
                else {
                    fieldTextArea.val('');
                    entryTextArea.val('');
                    error.text('');
                    $(addInfoDialog).fadeToggle(100);
                    //$('.addAssocMediaDialog').fadeOut();
                    toggleThumbnailPicker("close");
                    $('.locationPanelDiv').fadeOut();
                }
            }
        };

        function closeOnOutsideClick(evt) {
            evt.stopPropagation();
            var ibox = $('#mapDiv_infobox');
            if (evt.target === locationPanelDiv[0] || evt.target === editLocButton[0] || evt.target === ibox[0] || ibox.find(evt.target).length !== 0) {
                return;
            } else if (locationPanelDiv.find(evt.target).length === 0) {
                togglelp();
                if (customInfobox.visible()) {
                    customInfobox.hide();
                }
            }
        }

        //function that opens/closes the location panel with animations
        function togglelp() {
            // close all the other menus
            toggleThumbnailPicker("close");
            $(addInfoDialog).fadeOut();
            if (locPanelOpen) {
                locationPanelDiv.hide("slide", { direction: 'left' }, 500, function () {
                    sidebarHideButtonContainer.show();
                });
                $('body').off('mousedown', closeOnOutsideClick);
                locPanelOpen = false;
            } else {
                sidebarHideButtonContainer.hide();
                locationPanelDiv.show("slide", { direction: 'left' }, 500);
                locationPanelDiv.css({ display: 'inline' });
                locPanelOpen = true;

                // closing loc history on mouse interaction outside of the panel
                $('body').on('mousedown', closeOnOutsideClick);
            }
        }

        var editLocButton = $(document.createElement('button'));
        editLocButton.text('Edit Location History');
        editLocButton.attr('type', 'button');
        editLocButton.css(buttonCSS);
        editLocButton.click(function () {
            //hideMenus();
            if (hasBeenChanged) {
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
            } else {
                togglelp();
                hideEditMediaUI();
                rightbarLoadingDelete.fadeOut();
                drawLocationList();
            }
        });
        buttonContainer.append(editLocButton);

        // =============================start of locationPanelDiv================================
        //location panel
        var locationPanelDiv = $(document.createElement('div'));
        locationPanelDiv.addClass('locationPanelDiv');

        ///
        locationPanelDiv.css({
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: '100%',
            height: '85%',
            display: 'none',
            'z-index': '51'
        });

        $(root).append(locationPanelDiv);

        var locationPanel = $(document.createElement('div'));
        locationPanel.addClass('locationPanel');
        locationPanel.css({
            width: '70%',
            height: '90%',
            'z-indez': 99,
            'background-color': 'rgba(0,0,0,0.85);',
            'padding': '2% 2%',
        });
        locationPanelDiv.append(locationPanel);

        //little arrow that closes locationpanel
        var locationPanelToggle = $(document.createElement('div'));
        locationPanelToggle.addClass('locationpanelToggle');
        locationPanelToggle.css({
            position: 'absolute',
            height: '11%',
            width: '2%',
            top: '48%',
            left: '74%',
            'border-radius': '0px 10px 10px 0px',
            'background-color': 'rgba(0,0,0,0.85)',
        });
        //locationPanelToggle.click(togglelp);
        //locationPanelDiv.append(locationPanelToggle);

        var lpToggleimg = $(document.createElement('img'));
        lpToggleimg.addClass('lpToggleimg');
        lpToggleimg.attr('src', '/images/icons/Left.png');
        lpToggleimg.css({
            position: 'relative',
            top: '30%',
            width: 'auto',
            height: '30%',
        });
        locationPanelToggle.append(lpToggleimg);

        //the div where bing maps will show up in
        mapDiv = $(document.createElement('div'));
        mapDiv.addClass('mapDiv');
        mapDiv.attr('id', 'mapDiv');
        mapDiv.css({
            position: 'relative',
            width: '100%',
            height: '50%',
        });
        locationPanel.append(mapDiv);

        //make Bing map when mapDiv loads
        $(mapDiv).one('load', makeMap);
        //set interval to check whether mapDiv is inserted in DOM, then fire onload event
        //should work but does not...
        var mapDetectTimer = setInterval(function () {
            if ($('#mapDiv').length > 0) {
                $(mapDiv).trigger("load");
                clearInterval(mapDetectTimer);
            }
        }, 300);


        //area below the map with all the locations
        var bottomDiv = $(document.createElement('div'));
        bottomDiv.addClass('bottomDiv');
        bottomDiv.css({
            position: 'relative',
            height: '50%',
            width: '100%',
            'margin-top': '1.5%'
        });
        locationPanel.append(bottomDiv);

        //left side of the bottom area
        var leftDiv = $(document.createElement('div'));
        leftDiv.addClass('leftDiv');
        leftDiv.css({
            position: 'relative',
            height: '100%',
            width: '69%',
            'margin-right': '1%',
        });
        bottomDiv.append(leftDiv);

        //div where user searches for locations and adds them, hidden until 'add location' button is pressed
        var AddLocationDiv = $(document.createElement('div'));
        AddLocationDiv.addClass('addLocationDiv');
        AddLocationDiv.css({
            position: 'relative',
            height: '100%',
            width: '100%',
            display: 'none'
        });
        leftDiv.append(AddLocationDiv);

        //right side of the bottom area, containing all the existing locations of the artwork
        var rightDiv = $(document.createElement('div'));
        rightDiv.addClass('rightDiv');
        rightDiv.css({
            position: 'absolute',
            height: '100%',
            width: '29%',
            top: 0,
            right: 0,
        });
        bottomDiv.append(rightDiv);

        //search bar and search button
        var leftRow1 = $(document.createElement('div'));
        leftRow1.addClass('leftRow1');
        AddLocationDiv.append(leftRow1);

        searchBox = $(document.createElement('input'));
        searchBox.attr('type', 'text');
        searchBox.attr('placeholder', 'Search...');
        searchBox.css({
            width: '70%',
            'margin': '0px',
        });
        leftRow1.append(searchBox);

        var searchButton = $(document.createElement('button'));
        searchButton.text('Search');
        searchButton.css({
            'max-width': '25%',
            float: 'right',
        });
        searchButton.click(function () {
            if (searchBox[0].value === '') {
                LADS.Util.UI.drawPushpins(locationList, map);
                clearResults();
                helpboxAlert('Please type in the search bar');

            } else {
                map.entities.clear();
                customInfobox.hide();
                helpBox.fadeOut('fast');
                makeGeocodeStringRequest();
            }
        });
        leftRow1.append(searchButton);

        // search results
        var leftRow2 = $(document.createElement('div'));
        leftRow2.addClass('leftRow2');
        leftRow2.css({
            position: 'relative',
            height: '60%',
            'overflow-y': 'hidden',
            'overflow-x': 'hidden',
            margin: '2% 0%'
        });
        AddLocationDiv.append(leftRow2);

        helpBox = $(document.createElement('div'));
        helpBox.addClass('helpBox');
        helpBox.css({
            position: 'absolute',
            top: 0,
            left: 0,
            height: '70%',
            'text-align': 'center',
            'font-size': '100%',
            'color': 'white',
            'width': '100%'
        });
        helpBox.text(helpText);
        leftRow2.append(helpBox);

        resultsBox = $(document.createElement('div'));
        resultsBox.addClass('resultsBox');
        resultsBox.css({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '90%',
            'overflow-y': 'auto',
            'overflow-x': 'hidden',
        });
        leftRow2.append(resultsBox);

        //datepicker and confirm/cancel buttons
        var leftRow3 = $(document.createElement('div'));
        leftRow3.addClass('leftRow3');
        leftRow3.css({
            position: 'relative',
            bottom: '7.5%',
            width: '100%'
        });
        AddLocationDiv.append(leftRow3);

        var dateLabel = $(document.createElement('div'));
        dateLabel.text('Date');
        dateLabel.css({
            'color': 'white',
            'font-size': '100%'
        });
        leftRow3.append(dateLabel);

        var datePickerBox = $(document.createElement('div'));

        //My Own DatePicker
        datePicker = $(document.createElement('div'));
        datePicker.css({
            'width': '100%',
            float: 'left'
        });
        var monthtext = ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        dateBox = $(document.createElement('select'));
        monthBox = $(document.createElement('select'));
        yearBox = $(document.createElement('input'));

        // widths are hardcoded because typical entry lengths are fixed.
        var datepickerCSS = {
            'width': '120px',
            'margin-right': '0.5%',
            'font-size': '95%'
        };
        dateBox.css(datepickerCSS);
        dateBox.css({
            'width': '65px',
        });
        monthBox.css(datepickerCSS);

        // to accomodate "B.C." pre/post year entry, change to 75px
        yearBox.css({
            'font-size': '95%',
            'width': '50px',
        });

        var nullOption = $(document.createElement('option')).html('---').attr('value', -1);
        var spacingCSS = { 'margin-right': '.5%' };

        dateBox.addClass("datePicker dateBox");
        monthBox.addClass("datePicker monthBox");
        yearBox.addClass("datePicker yearBox");
        yearBox.attr('id', 'yearBox');

        datePicker.append(dateBox).append(monthBox).append(yearBox);
        datePickerBox.append(datePicker);

        leftRow3.append(datePickerBox);

        dateBox.append(nullOption.clone().attr('value', 0));
        monthBox.append(nullOption.clone().attr('value', 0));

        for (i = 0; i < 31; i++) {
            var dateOption = $(document.createElement('option'));
            dateOption.html(i + 1);
            dateOption.attr('value', i + 1);
            dateBox.append(dateOption);
        }
        for (i = 0; i < 12; i++) {
            var monthOption = $(document.createElement('option'));
            monthOption.html(monthtext[i]);
            monthOption.attr('value', i + 1);
            monthBox.append(monthOption);
        }

        //triggered everytime the datepicker has changed, resets the selected date
        function datePickerEvent() {
            $('div.results').css({ 'background-color': 'transparent', 'color': 'white' });
            var y = parseInt(yearBox[0].value, 10);
            var m = parseInt(monthBox[0][monthBox[0].selectedIndex].value, 10) - 1;
            var d = parseInt(dateBox[0][dateBox[0].selectedIndex].value, 10);
            if (m < 0 || isNaN(m)) {
                m = undefined;
            }
            if (d === 0 || isNaN(d)) {
                d = undefined;
            }
            if (y === '' || isNaN(y)) {
                m = undefined;
                d = undefined;
                y = undefined;
            }
            selectedDate = {
                year: y,
                month: m,
                day: d,
            };
        }

        dateBox.change(datePickerEvent);
        monthBox.change(datePickerEvent);
        yearBox.change(datePickerEvent);

        var addDescripButton = $(document.createElement('button'));
        addDescripButton.css({
            'margin-left': '1.5%',
            'margin-top': '1%',
            'min-width': '0px',
            'min-height': '0px',
            'width': '22%',
            'font-size': '100%'
        });
        addDescripButton.text("Edit Description");
        datePicker.append(addDescripButton);

        // begin edit description pane code
        var editDescriptionBox = $(document.createElement('div'));
        locationPanel.append(editDescriptionBox);
        editDescriptionBox.css({
            'background-color': 'rgba(0, 0, 0, 0.85)',
            'width': '30%',
            'height': '18%',
            'position': 'absolute',
            'bottom': '16%',
            'left': '25%',
        });

        var textAreaCSS = {
            'border': '2px solid Gray',
            'margin-bottom': '3%',
            'width': '100%',
            'float': 'left'
        };

        var descriptionText = $(document.createElement('textarea'));
        editDescriptionBox.append(descriptionText);
        descriptionText.attr('id', 'descriptionText');
        descriptionText.attr('placeholder', 'Description');
        descriptionText.attr('rows', '5');
        descriptionText.css(textAreaCSS);
        descriptionText.css({
            'padding': '0px 1px 0px 1px',
            'margin-top': '0px',
            'background-color': 'white',
            'position': 'absolute', 
            'width': '89%',
            'left': '5%',
            'top': '20px',
        });

        var cancelButton = $(document.createElement('button'));
        cancelButton.addClass('cancelEditDescButton');
        cancelButton.text('Cancel');
        cancelButton.css({
            'color': 'white',
            'border': '2px solid white',
            'position': 'absolute',
            'width': '15%',
            'bottom': '9.5%',
            'left': '5%',
            'height': '10%',
        });
        cancelButton.click(function () {
            if (unsavedDescription && unsavedDescription !== "") {
                descriptionText.val(unsavedDescription);
            }
            editingDescription = false;
            editDescriptionBox.hide();
        });

        editDescriptionBox.append(cancelButton);

        var saveButton = $(document.createElement('button'));
        saveButton.addClass('saveDescButton');
        saveButton.text('Save');
        saveButton.css({
            'color': 'white',
            'border': '2px solid white',
            'position': 'absolute',
            'width': '15%',
            'bottom': '9.5%',
            'right': '5%',
            'height': '10%',
            
        });
        saveButton.click(function () {
            unsavedDescription = descriptionText.val();
            editingDescription = false;
            editDescriptionBox.hide();
        });

        editDescriptionBox.append(saveButton);

        editDescriptionBox.hide();
        // end description pane 

        addDescripButton.on('click', function () {
            editingDescription = !editingDescription;
            if (editingDescription) {

                var descrBoxConstraints = LADS.Util.constrainAndPosition(locationPanel.width(), locationPanel.height(), {
                    width: 0.5,
                    height: 0.35,
                    max_width: 768,
                    max_height: 192,
                });

                editDescriptionBox.css({
                    'width': descrBoxConstraints.width + 'px',
                    'height': descrBoxConstraints.height + 'px',

                });

                var descriptionTextConstraints = LADS.Util.constrainAndPosition(editDescriptionBox.width(), editDescriptionBox.height(), {
                    center_h: true,
                    width: 0.9,
                    x_offset: 0.05,
                    y_offset: 0.12,
                    y_max_offset: 25,
                });
                descriptionText.css({
                    'top': descriptionTextConstraints.y + 'px',
                    'left': descriptionTextConstraints.x - 2 + 'px',
                    'width': descriptionTextConstraints.width + 'px',
                });
                editDescriptionBox.show();

                if (unsavedDescription) {
                    descriptionText.attr('value', selectedInfo);
                } else {
                    descriptionText.attr('value', "");
                }
            } else {
                editDescriptionBox.hide();
            }
        });


        // cancel button to hide addLocationDiv
        var cancelNewLocation = $(document.createElement('button'));
        cancelNewLocation.css({
            position: 'absolute',
            right: "16.5%",
            'margin-top': '1%',
            'min-width': '0px',
            'min-height': '0px',
            'width': '12%',
            'font-size': '100%'
        });
        cancelNewLocation.text('Cancel');
        cancelNewLocation.click(function (e) {
            selectedLocResource = undefined;
            selectedAddress = undefined;
            unsavedDescription = undefined;
            selectedDate = undefined;
            AddLocationDiv.hide('blind');
            addLocButton.show();
            LADS.Util.UI.drawPushpins(locationList, map);
            Microsoft.Maps.Events.removeHandler(mapAttachClick);
            clearDatePicker(datePicker);
        });
        datePicker.append(cancelNewLocation);

        // confirm button to add selected location
        var confirmNewLocation = $(document.createElement('button'));
        confirmNewLocation.css({
            position: 'absolute',
            right: '0%',
            'margin-top': '1%',
            'min-width': '0px',
            'min-height': '0px',
            'width': '15%',
            'font-size': '100%'
        });
        confirmNewLocation.text('Confirm');
        confirmNewLocation.click(function (e) {
            if (!addLocation()) {
                return;
            }
            editDescriptionBox.hide();
            AddLocationDiv.hide('blind');
            addLocButton.show();
            LADS.Util.UI.drawPushpins(locationList, map);
            Microsoft.Maps.Events.removeHandler(mapAttachClick);
            clearDatePicker(datePicker);
        });
        datePicker.append(confirmNewLocation);

        //popup bubble warning the user that a location has not been selected when confirm is pressed
        confirmBubble = $(document.createElement('div'));
        confirmBubble.attr('class', 'confirmBubble');
        confirmBubble.css({
            'padding': '4% 4%',
            'left': '63%',
            'margin-bottom': '4%',
            'top': '-150%',
            'position': 'absolute',
            'background-color': 'rgba(255,255,255,.6)',
            'border-radius': '10px',
            'z-index': '2',
            'font-weight': 'bold',
            'text-align': 'center'
        });
        confirmBubble.html('Please select a valid location');

        var confirmBubbleTriangle = $(document.createElement('div'));
        confirmBubbleTriangle.attr('class', 'confirmBubbleTriangle');
        confirmBubbleTriangle.css({
            'position': 'absolute',
            'top': '100%',
            'left': '40%',
            'width': 0,
            'border-style': 'solid',
            'border-width': '20px',
            'border-color': 'rgba(255,255,255,.6) transparent transparent transparent',
        });
        confirmBubble.append(confirmBubbleTriangle);
        leftRow3.append(confirmBubble);
        confirmBubble.hide();

        // 'Add Location' button that shows the addLocationDiv
        addLocButton = $(document.createElement('button'));
        addLocButton.css({
            position: 'absolute',
            float: 'left',
            'min-width': '0px',
            'min-height': '0px'
        });

        addLocButton.text('Add Location');
        mapAttachClick = null;
        addLocButton.click(function (e) {
            helpBox.show();
            searchBox.val('');
            clearResults();
            helpBox.fadeIn();
            LADS.Util.fitText(helpBox, 3.5);
            AddLocationDiv.show('blind');
            mapAttachClick = Microsoft.Maps.Events.addHandler(map, 'rightclick', addPushpinOntouch);
            addLocButton.hide();
        });
        leftDiv.append(addLocButton);

        // Locations title
        var locationsTitle = $(document.createElement('div'));
        locationsTitle.addClass('locationsTitle');
        locationsTitle.text('Locations');
        locationsTitle.css({
            color: 'white',
            'font-size': '185%',
            'position': 'relative',
            'top': '-0.75%',
        });
        rightDiv.append(locationsTitle);

        // Div where all locations will be appended
        locationsDiv = $(document.createElement('div'));
        locationsDiv.addClass("listOfLocations");
        locationsDiv.css({
            position: 'relative',
            height: '80%',
            'overflow-y': 'auto',
            'overflow-x': 'hidden',
        });
        rightDiv.append(locationsDiv);

        // =============================end of locationPanelDiv================================


        var editThumbnailButton = $(document.createElement('button'));
        editThumbnailButton.text('Edit Thumbnail');
        editThumbnailButton.attr('type', 'button');
        editThumbnailButton.css(buttonCSS);
        editThumbnailButton.click(function () {
            if (hasBeenChanged) {
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
            } else {
                hideEditMediaUI();
                rightbarLoadingDelete.fadeOut();
                toggleThumbnailPicker();
            }
        });
        buttonContainer.append(editThumbnailButton);



        var addHotspots = $(document.createElement('button'));
        $(addHotspots).addClass('addHotspots');
        $(addHotspots).text('New Hotspot');
        $(addHotspots).css(buttonCSS);
        //buttonContainer.append(addHotspots);

        var addAssocMedia = $(document.createElement('button'));
        addAssocMedia.addClass('addAssocMedia');
        addAssocMedia.text('New Associated Media');
        addAssocMedia.css(buttonCSS);
        //buttonContainer.append(addAssocMedia);

        // batch upload button
        var batchUploadMedia = $(document.createElement('button'));
        batchUploadMedia.addClass('batchUploadMedia');
        batchUploadMedia.text('Add New Asset(s)');
        batchUploadMedia.attr('type', 'button');
        batchUploadMedia.css(buttonCSS);
        buttonContainer.append(batchUploadMedia);

        //text associated media button
        var textAssocMedia = $(document.createElement('button'));
        textAssocMedia.addClass('textAssocMedia');
        textAssocMedia.text('Add Text Asset');
        textAssocMedia.attr('type', 'button');
        textAssocMedia.css(buttonCSS);
        buttonContainer.append(textAssocMedia);

        // === Associated Media & Hotspots
        var assocMediaLabel = $(document.createElement('div'));
        assocMediaLabel.addClass('assocMediaLabel');
        assocMediaLabel.text('Assets and Media');
        assocMediaLabel.css({
            color: 'white',
            'font-size': '150%',
            'margin-top': '2%',
        });
        buttonContainer.append(assocMediaLabel);


        //var y = $(addHotspots).position().top;
        //var addAssocMediaDialog = $(document.createElement('div'));
        //addAssocMediaDialog.attr('class', 'addAssocMediaDialog');
        //addAssocMediaDialog.css({
        //    'padding': '4% 4%',
        //    'left': '105%',
        //    'margin-bottom': '4%',
        //    'width': '40%',
        //    'position': 'absolute',
        //    'background-color': 'rgba(0, 0, 0, 0.7)',
        //    'border-radius': '10px',
        //    'z-index': '2'
        //});

        //var addAssocMediaDialogTriangle = $(document.createElement('div'));
        //addAssocMediaDialogTriangle.attr('class', 'addAssocMediaDialogTriangle');
        //addAssocMediaDialogTriangle.css({
        //    'position': 'absolute',
        //    'top': '30%',
        //    'left': '-40px',
        //    'width': 0,
        //    'border-style': 'solid',
        //    'border-width': '20px',
        //    'border-color': 'transparent rgba(0, 0, 0, 0.7) transparent transparent',
        //});

        //var hotspotButton = $(document.createElement('button'));
        //hotspotButton.addClass('hotspotButton')
        //hotspotButton.text('Hotspot');
        //hotspotButton.css({
        //    'color': 'white',
        //    'width': '100%',
        //    'margin-bottom': '2%',
        //    'border': '2px solid white',
        //    'padding': '2%',
        //    'position': 'relative',
        //});

        //var assocMediaButton = $(document.createElement('button'));
        //$(assocMediaButton).text('Associated Media');
        //$(assocMediaButton).css({
        //    'color': 'white',
        //    'width': '100%',
        //    'border': '2px solid white',
        //    'padding': '2%',
        //    'position': 'relative',
        //});

        var assocMediaEditor = document.createElement('div');
        var $assocMediaEditor = $(assocMediaEditor);
        $assocMediaEditor.addClass('assocMediaEditor');
        $assocMediaEditor.css({
            'width': '30%',
            'height': '60%',
            'color': 'white',
            'background-color': 'rgba(0,0,0,.85)',
            'position': 'absolute',
            'left': '40%',
            'top': '30%'
        });

        var assocMediaTitle = $(document.createElement('div'));
        $(assocMediaTitle).css({
            'color': 'white',
            'font-size': '175%',
            'padding': '1%',
            'margin': '1%',
            'background': 'none',
            'background-color': 'rgba(0,0,0,.85)',
            'border': 'none',
            'white-space': 'nowrap',
            'overflow': 'hidden',
            'height': '0px',
        });

        //function hideMenus() {
        //    $(addInfoDialog).fadeOut();
        //    if (locPanelOpen) {
        //        locationPanelDiv.hide("slide", { direction: 'left' }, 500, function () {
        //            sidebarHideButtonContainer.show();
        //        });
        //        locPanelOpen = false;
        //    }
        //    $(tnBorderWrapper).fadeOut();
        //}

        $(addHotspots).click(function () {
            if (hasBeenChanged) {
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
            } else {
                //addAssocMediaDialog.fadeOut(100);
                hideMenus();
                createNew = true;
                showEditMedia({ assetType: "Hotspot" });
            }
        });

        addAssocMedia.click(function () {
            if (hasBeenChanged) {
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
            } else {
                //addAssocMediaDialog.fadeOut(100);
                hideMenus();
                createNew = true;
                showEditMedia({ assetType: "Asset" });
            }
        });

        batchUploadMedia.on('click', function () {
            batchUploadMedia.blur();
            if (hasBeenChanged) {
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
            } else if (isUploading || isCreatingMedia) {
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "An upload is in progress. Please wait a few moments.", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
            } else {
                batchAssMedia();
            }
        });

        //for creation of edit menu for text media
        textAssocMedia.on('click', function () {
            //default to asset, not hotspot
            showEditMedia({ assetType: "Asset" },'' ,true);
        });

        //$(addAssocMediaDialog).append(addAssocMediaDialogTriangle);
        //$(addAssocMediaDialog).append(hotspotButton);
        //$(addAssocMediaDialog).append(assocMediaButton);

        //$(sidebar).append(addAssocMediaDialog);
        //$(addAssocMediaDialog).hide();

        //$(addHotspots)[0].onclick = function () {
        //    var y = $('.addHotspots').offset().top;
        //    y = y - $('.topbar').height() - ($('.addAssocMediaDialog').height() / 2);
        //    $(addAssocMediaDialog).css('top', y);
        //    $(addAssocMediaDialog).fadeToggle(100);
        //    $(addInfoDialog).fadeOut();
        //    toggleThumbnailPicker("close");
        //    if (locPanelOpen) {
        //        $('.locationPanelDiv').hide("slide", { direction: 'left' }, 500, function () {
        //            $('.sidebarHideButtonContainer').show();
        //        });
        //        locPanelOpen = false;
        //    };
        //    // fade out if the user takes no action after 10 seconds
        //    setTimeout(function () { $(addAssocMediaDialog).fadeOut(1000); }, 10000);
        //};

        // Hotspot/Asset list in edit mode
        var $assetContainer = $(document.createElement('div'));
        $assetContainer.attr('class', 'buttonContainer');
        $assetContainer.css({
            position: 'relative',
            top: '0%,',
            'margin-top': '2%',
            padding: '0px 4% 0px 12%',
            'overflow-y': 'auto',
            height: '30%'
        });
        $assetContainer.addClass('assetContainer');
        sidebar.append($assetContainer);

        populateHotspotsList($assetContainer);

        // === End Associated Media & Hotspots

        var sidebarHideButtonContainer = $(document.createElement('div'));
        $(sidebarHideButtonContainer).addClass('sidebarHideButtonContainer');
        $(sidebarHideButtonContainer).css({
            'top': '0%',
            'right': '0%',
            'position': 'relative',
            'width': '2%',
            'height': '100%',
            'float': 'left',
        });


        var sidebarHideButton = $(document.createElement('div'));
        $(sidebarHideButton).css({
            'top': '45%',
            'right': '0%',
            'position': 'relative',
            'width': '100%',
            'height': '10%',
            'background-color': 'rgba(0,0,0,.85)',
            'border-bottom-right-radius': '10px',
            'border-top-right-radius': '10px'
        });

        var sidebarHideIcon = document.createElement('img');
        $(sidebarHideIcon).css({ 'top': '39%', 'width': '40%', 'height': 'auto', 'position': 'relative', 'left': '20%' });
        $(sidebarHideIcon).attr('src', 'images/icons/Left.png');
        $(sidebarHideButton).append(sidebarHideIcon);

        $(sidebarHideButtonContainer).append(sidebarHideButton);

        var expanded = true;
        $(sidebarHideButton)[0].onclick = function () {

            if (expanded) {
                $(sidebarHideIcon).attr('src', 'images/icons/Right.png');
                expanded = false;
                $(sidebar).animate({ 'left': '-20%' }, 600);
                $(sidebarHideButtonContainer).animate({ 'left': '-20%' }, 600);

            }
            else {
                $(sidebarHideIcon).attr('src', 'images/icons/Left.png');
                $(sidebar).animate({ 'left': '0%' }, 600);
                $(sidebarHideButtonContainer).animate({ 'left': '0%' }, 600);

                expanded = true;
            }
        };

        mainPanel.append(sidebar);
        mainPanel.append(sidebarHideButtonContainer);


    }

    function createBasicDatePicker(loadDay, loadMonth, loadYear) {
        var bdp = $(document.createElement('div'));
        bdp.addClass("basicDatePicker");
        bdp.css({
            'width': '100%',
            float: 'left'
        });

        var nullOption = $(document.createElement('option')).html('---').attr('value', -1);
        var spacingCSS = { 'margin-right': '.5%' };
        var monthtext = ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        var date = $(document.createElement('select'));
        var month = $(document.createElement('select'));
        var year = $(document.createElement('input'));

        var dropdownCSS = {
            'min-width': '0px',
            'min-height': '0px',
            'width': '25%',
            'margin-right': '1%',
            'font-size': '95%'
        };

        date.css(dropdownCSS);
        date.css({
            width: '15%',
        });

        month.css(dropdownCSS);
        year.css({
            'font-size': '95%',
            'width': '12.5%',
            'margin-right': '2.5px'
        });

        bdp.append(date).append(month).append(year);
        var dateNull = nullOption.clone().attr('value', 0), monthNull = nullOption.clone().attr('value', 0);

        if (loadDay && loadDay === 0) {
            date.append(dateNull.attr('selected', 1));
        } else {
            date.append(dateNull);
        }
        if (loadMonth && loadMonth === 0) {
            month.append(monthNull).attr('selected', 1);
        } else {
            month.append(monthNull);
        }

        var i;
        for (i = 0; i < 31; i++) {
            var dateOption = $(document.createElement('option'));
            dateOption.html(i + 1);
            dateOption.attr('value', i + 1);
            if (loadDay && loadMonth && loadDay === i + 1) {
                dateOption.attr('selected', 1);
            }
            date.append(dateOption);
        }
        for (i = 0; i < 12; i++) {
            var monthOption = $(document.createElement('option'));
            monthOption.html(monthtext[i]);
            monthOption.attr('value', i + 1);
            if (loadMonth && loadMonth === i) {
                monthOption.attr('selected', 1);
            }
            month.append(monthOption);
        }
        if (loadYear) {
            year.val(loadYear);
        }

        //triggered everytime the datepicker has changed, resets the selected date
        function dateChangedEvent() {
            $('div.results').css({ 'background-color': 'transparent', 'color': 'white' });
            var y = parseInt(yearBox[0].value, 10);
            var m = monthBox[0][monthBox[0].selectedIndex].value;
            var d = dateBox[0][dateBox[0].selectedIndex].value;
            if (m === 0 || isNaN(m)) {
                m = undefined;
            } else {
                m = m - 1;
            }
            if (d === 0 || isNaN(d)) {
                d = undefined;
            }
            if (y === '' || isNaN(y)) {
                m = undefined;
                d = undefined;
                y = undefined;
            }
            selectedDate = {
                year: y,
                month: m,
                day: d,
            };
        }

        date.change(dateChangedEvent);
        month.change(dateChangedEvent);
        year.change(dateChangedEvent);

        return bdp;
    }

    function hideMenus() {
        $('.addInfoDialog').fadeOut();
        if (locPanelOpen) {
            $('.locationPanelDiv').hide("slide", { direction: 'left' }, 500, function () {
                $('.sidebarHideButtonContainer').show();
            });
            locPanelOpen = false;
        }
        $('.tnBorderWrapper').fadeOut();
    }

    function createSidebarTextArea(field, entry, animate) {


        var textareaContainer = $(document.createElement('div'));
        textareaContainer.addClass('textareaContainer');
        $(textareaContainer).css({
            'margin-bottom': '7%',
            'width': '100%',
            'position': 'relative',
        });

        var textarea = $(document.createElement('input'));
        textarea.attr('placeholder', field);
        textarea.css({
            'width': '80%',
            'font-size': '11pt'
        });

        artworkSettings[field] = textarea;


        $(textarea).val(entry);
        $(textarea).attr('title', field);
        var deleteFieldIcon;
        if (field !== 'Title' && field !== 'Keywords' && field !== 'Artist' && field !== 'Year') {
            deleteFieldIcon = document.createElement('img');
            $(deleteFieldIcon).attr('src', 'images/icons/minus.svg');
            $(deleteFieldIcon).css({
                'width': '6%',
                'height': 'auto',
                'position': 'relative',
                'left': '3%'
            });


            $(deleteFieldIcon).bind("click", { Param1: field, }, function (event) {
                additionalCustomInfos -= 1;
                if (!addInfoButtonDisable()) {
                    addInfoButton.removeAttr('disabled');
                }
                delete labelNameToLabel[event.data.Param1.split('_')[1]];
                textareaContainer.remove();

            });
        }

        if (animate) {
            textareaContainer.css('display', 'none');
        }

        $(textareaContainer).append(textarea);
        //not hooked up to the server, disable for first release
        $(textareaContainer).append(deleteFieldIcon);

        $(textFieldContainer).append(textareaContainer);
        if (animate) {
            textareaContainer.slideDown();
        }

        return textarea;
        //textarea.blur();
    }


    function createTopBar(topbarHeight) {
        // style the topbar
        topbar.addClass("topbar");
        topbar.css({
            "background-color": "rgb(63,55,53)",
            "color": "rgb(175,200,178)",
            "width": '100%',
            'height': topbarHeight + '%',
            'position': 'relative'
        });

        var backButton = document.createElement('img');
        $(backButton).attr('src', 'images/icons/Back.svg');
        $(backButton).css({
            'height': '63%',
            'margin-left': '1.2%',
            'float': 'left',
            'width': 'auto',
            'top': '18.5%',
            'position': 'relative',
        });
        $(topbar).append(backButton);

        backButton.onmousedown = function () {
            LADS.Util.UI.cgBackColor("backButton", backButton, false);
        };

        backButton.onclick = function () {
            var messageBox;
            if (isCreatingMedia) {
                messageBox = LADS.Util.UI.popUpMessage(null, "Adding media to artwork. Please wait a few moments.", null);
                $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(messageBox);
                $(messageBox).fadeIn(500, function () {
                    LADS.Util.UI.cgBackColor("backButton", backButton, true);
                });
            }
            else if (isUploading) {
                messageBox = LADS.Util.UI.PopUpConfirmation(goBack, "Asset upload in progress. Stop remaining upload and exit?", "Yes");
                $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(messageBox);
                $(messageBox).fadeIn(500, function () {
                    LADS.Util.UI.cgBackColor("backButton", backButton, true);
                });
            }
            else if (hasBeenChanged) {
                editingMediamsg = $(LADS.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
                LADS.Util.UI.cgBackColor("backButton", backButton, true);
            }
            else {
                goBack();
            }
        };

        function goBack() {
            if (assetUploader) {
                assetUploader.cancelPromises();
            }
            $(backButton).off('click');
            var tempSettings = new LADS.Authoring.NewSettingsView("Artworks", null, null, artwork.Identifier);
            LADS.Util.UI.slidePageRight(tempSettings.getRoot());
        }

        // save changes button

        var saveChangesButton = document.createElement('button');
        $(saveChangesButton).attr('type', 'button');
        $(saveChangesButton).text('Save Changes');
        var saveButtonSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
            {
                width: 0.1,
                max_width: 150,
                height: 0.45,
                max_height: 40,
                x_offset: 0.1,
                max_x_offset: 225,
                center_v: true,
            });
        var saveButtonFontSize = LADS.Util.getMaxFontSizeEM('Save Changes', 0.5, saveButtonSpecs.width * 0.8, saveButtonSpecs.height * 0.8, 0.01);
        $(saveChangesButton).css({
            'width': saveButtonSpecs.width + 'px',
            'height': saveButtonSpecs.height + 'px',
            'left': saveButtonSpecs.x + 'px',
            'top': saveButtonSpecs.y - 2 + 'px',
            'position': 'absolute',
            'font-size': saveButtonFontSize,
            'padding': '1px',
        });
        saveChangesButton.onclick = function () {
            var $savedLabel, messageBox;
            if (isUploading || isCreatingMedia) {
                messageBox = LADS.Util.UI.popUpMessage(null, ((isCreatingMedia) ? "Adding media to artwork. " : "Asset upload in progress. ") + "Please wait a few moments.", null);
                $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(messageBox);
                $(messageBox).fadeIn(500);
                return;
            }
            $savedLabel = $(savedLabel);
            addCustomFields();
            $savedLabel.text('Saving...');
            $savedLabel.show();
            pushChanges(function () {
                $savedLabel.text('Changes Saved.');

                setTimeout(function () {
                    $savedLabel.hide();
                }, 3000);
            }, function () {
                $savedLabel.hide();
                var popup = LADS.Util.UI.popUpMessage(null, "Changes have not been saved.  You must log in to save changes.");
                $('body').append(popup);
                $(popup).show();
            }, function () {
                $savedLabel.hide();
                var popup = LADS.Util.UI.popUpMessage(null, "Changes have not been saved.  There was an error contacting the server.");
                $('body').append(popup);
                $(popup).show();
            });
        };
        $(topbar).append(saveChangesButton);

        var savedLabel = document.createElement('label');
        $(savedLabel).css({
            'left': saveButtonSpecs.width + saveButtonSpecs.x + (0.02 * $(window).width()) + 'px',
            'top': saveButtonSpecs.y + (0.17 * saveButtonSpecs.height) - 2 + 'px',
            'position': 'absolute',
            'color': 'white',
            'font-size': saveButtonFontSize,
        });
        $(topbar).append(savedLabel);
        $(savedLabel).hide();

        var topProgBarSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
            {
                width: 0.25,
                height: 0.25,
                center_v: true,
            });

        $topProgressDiv = $(document.createElement('div'));
        $topProgressDiv.attr('id', 'topProgressDiv');
        $topProgressDiv.css({
            'width': topProgBarSpecs.width + 'px',
            'height': topProgBarSpecs.height + 'px',
            'visibility': 'hidden',
            'top': topProgBarSpecs.y + 'px',
            'right': '23%',
            'position': 'absolute',
        });

        $topProgressBar = $(document.createElement('div'));
        $topProgressBar.attr('id', 'topProgressBar');
        $topInnerProgressBar = $(document.createElement('div'));
        $topInnerProgressBar.attr('id', 'topInnerProgressBar');
        $topProgressBar.css({
            'width': '68%',
            'height': '70%',
            'right': '0px',
            'border-style': 'solid',
            'border-color': 'white',
            'display': 'inline-block',
            'position': 'absolute',
        });
        $topInnerProgressBar.css({
            'background-color': 'white', 'width': '0%', 'height': '100%'
        });

        $topProgressText = $(document.createElement('div'));
        $topProgressText.attr('id', 'topProgressText');
        $topProgressText.css({
            'left': 0,
            'height': '100%',
            'width': '27%',
            'margin-top': '-0.5%',
            'display': 'inline-block',
            'color': 'white',
            'position': 'absolute',
            'text-align': 'right', 
        });
        $topProgressText.text("uploading");
        
        $topProgressBar.append($topInnerProgressBar);
        $topProgressDiv.append($topProgressBar);
        $topProgressDiv.append($topProgressText);
        $(topbar).append($topProgressDiv);

        var topBarLabel = $(document.createElement('div'));
        var topBarLabelSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
            width: 0.4,
            height: 0.9,
        });
        topBarLabel.css({
            'margin-right': '2%',
            'margin-top': 8 * 0.045 + '%',
            'color': 'white',
            'position': 'absolute',
            'text-align': 'right',
            'right': '0px',
            'top': '0px',
            'height': topBarLabelSpecs.height + 'px',
            'width': topBarLabelSpecs.width + 'px',
        });

        var fontsize = LADS.Util.getMaxFontSizeEM('Tour Authoring', 0.5, topBarLabelSpecs.width, topBarLabelSpecs.height * 0.8);
        topBarLabel.css({ 'font-size': fontsize });

        topBarLabel.text('Artwork Editor');

        $(topbar).append(topBarLabel);

    }

    // adds custom fields to the XML
    function addCustomFields() {
        clearInfoFields();
        for (var infoName in labelNameToLabel) {
            // copy the node
            var node = artworkXML.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0];
            var newNode = node.cloneNode(true);

            // change value of copied node
            newNode.childNodes[0].textContent = LADS.Util.encodeXML("InfoField_" + infoName);
            newNode.childNodes[1].textContent = LADS.Util.encodeXML(labelNameToLabel[infoName][0].value);

            // add the node to the Metadata of the XML
            artworkXML.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].appendChild(newNode);
        }
    }

    function clearInfoFields() {
        var metadata = artworkXML.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes;

        for (var i = metadata.length - 1; i >= 0; i--) {
            if (metadata[i].childNodes[0].textContent.indexOf('InfoField_') != -1) {
                metadata[i].parentNode.removeChild(metadata[i]);
            }
        }

    }

    // adds the custom fields from the xml to the GUI
    function createCustomFields() {
        var metadata = artworkXML.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes;

        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].childNodes[0].textContent.indexOf('InfoField_') != -1) {
                labelNameToLabel[metadata[i].childNodes[0].textContent.split('_')[1]] = createSidebarTextArea(metadata[i].childNodes[0].textContent, metadata[i].childNodes[1].textContent, true);
            }
        }
    }

    function makeMap() {

        //Microsoft.Maps.registerModule("CustomInfoboxModule", "js/utils/BMv7.CustomInfobox/V7CustomInfobox.min.js");
        Microsoft.Maps.loadModule('Microsoft.Maps.Map', {
            callback: initMap
        });


        //Define custom properties for the pushpin class.
        //This is an example of one way to assign metadata to a shape.
        Microsoft.Maps.Pushpin.prototype.date = null;
        Microsoft.Maps.Pushpin.prototype.location = null;
        Microsoft.Maps.Pushpin.prototype.description = null;

        function initMap() {
            var mapOptions =
            {
                credentials: credentials,
                mapTypeID: Microsoft.Maps.MapTypeId.road,
                showScalebar: true,
                enableClickableLogo: false,
                enableSearchLogo: false,
                showDashboard: false,
                showMapTypeSelector: false,
                zoom: 2,
                center: new Microsoft.Maps.Location(20, 0)
            };
            var viewOptions = {
                mapTypeId: Microsoft.Maps.MapTypeId.road
            };

            map = new Microsoft.Maps.Map(document.getElementById('mapDiv'), mapOptions);

            customInfobox = new CustomInfobox(map, {
                color: 'rgba(0,0,0,0.65)', arrowColor: 'rgba(0,0,0,0.65)'
            });

            map.setView(viewOptions);
            locationList = LADS.Util.UI.getLocationList(artwork.Metadata);
            drawLocationList();
        }
        mapMade = true;
    }

    function getFontSize(factor) {
        return factor * (window.innerWidth / 1920) + '%';
    }

    //geocode methods
    //searching with string query
    function makeGeocodeStringRequest() {
        clearResults();
        var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations?query=" + encodeURI(searchBox.val()) + "&output=json&key=" + credentials;
        WinJS.xhr({
            url: geocodeRequest
        }).done(function (result) { // was called 'complete'
            geocodeStringCallback(result);
        },
        function (err) { // was called 'error'
        },
        function (result) { // was called 'progress'
            console.log(result.readystate);
        });
    }
    function geocodeStringCallback(result) {
        result = JSON.parse(result.responseText);
        //checks if results is undefined
        if (result && result.resourceSets && result.resourceSets.length > 0 && result.resourceSets[0].resources && result.resourceSets[0].resources.length > 0) {
            //sets view to first result
            var first = result.resourceSets[0].resources[0];
            //set bounding box
            var bbox = first.bbox;

            var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(
                new Microsoft.Maps.Location(bbox[0], bbox[1]),
                new Microsoft.Maps.Location(bbox[2], bbox[3])
            );
            map.setView({ bounds: viewBoundaries });

            //add a pushpin at the first location
            var location = new Microsoft.Maps.Location(first.point.coordinates[0], first.point.coordinates[1]);
            var pushpinOptions = {
                icon: '/images/icons/locationPin.png',
                width: 20,
                height: 30
            };
            var pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions);
            map.entities.push(pushpin);

            for (var i = 0; i < result.resourceSets[0].resources.length; i++) {
                addresults(result.resourceSets[0].resources[i]);
            }
        } else {
            helpboxAlert('No Results Found');
            LADS.Util.UI.drawPushpins(locationList, map);
        }
    }
    //add pushpin at center of the map
    function addPushpin() {
        map.entities.clear();
        customInfobox.hide();
        clearResults();
        var pushpinOptions = {
            draggable: true,
            icon: '/images/icons/locationPin.png',
            width: 20,
            height: 30
        };
        var startLocation = map.getCenter();
        var pushpin = new Microsoft.Maps.Pushpin(startLocation, pushpinOptions);
        Microsoft.Maps.Events.addHandler(pushpin, 'dragend', function (e) {
            clearResults();
            makeGeocodePointRequest(pushpin.getLocation());
        });
        map.entities.push(pushpin);
    }

    //add a pushpin as user clicks the map
    function addPushpinOntouch(e) {
        if (e.targetType == "map") {
            // hide help text
            helpBox.hide();

            //Get map unit x,y
            var point = new Microsoft.Maps.Point(e.getX(), e.getY());

            //Convert map point to location
            var location = e.target.tryPixelToLocation(point);

            //Print x y
            map.entities.clear();
            customInfobox.hide();
            clearResults();
            var pushpinOptions = {
                draggable: true,
                icon: '/images/icons/locationPin.png',
                width: 20,
                height: 30
            };
            var startLocation = map.getCenter();
            var pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(location.latitude, location.longitude), pushpinOptions);
            Microsoft.Maps.Events.addHandler(pushpin, 'dragend', function (e) {
                makeGeocodePointRequest(pushpin.getLocation());
            });
            selectedPoint = new Microsoft.Maps.Location(location.latitude, location.longitude);
            map.entities.push(pushpin);
            makeGeocodePointRequest(pushpin.getLocation());
        }
    }

    function makeGeocodePointRequest(location) {
        clearResults();
        var lat = location.latitude;
        var long = location.longitude;
        var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations/" + lat + "," + long + "?" + "output=json&key=" + credentials;
        WinJS.xhr({
            url: geocodeRequest
        }).then(GeocodePointCallback);
    }
    function GeocodePointCallback(result) {
        result = JSON.parse(result.responseText);
        for (var i = 0; i < result.resourceSets[0].resources.length; i++) {
            addresults(result.resourceSets[0].resources[i]);
        }
        if (result.resourceSets[0].resources.length !== 0) {
            createCustomAddressButton(result.resourceSets[0].resources[0]);
        } else {
            createCustomAddressButton(selectedPoint);
        }
    }

    //Search results manipulation methods
    function clearResults() {
        $('div.results').detach();
        selectedAddress = undefined;
        selectedLocResource = undefined;
    }

    function addresults(resource) {
        helpBox.fadeOut('fast');
        var result = $(document.createElement('div'));
        var text = resource.address.formattedAddress;
        var unselectedCSS = {
            'background-color': 'transparent',
            'color': 'white',
        };
        var selectedCSS = {
            'background-color': 'white',
            'color': 'black',
        };
        result.addClass('results');
        var resultConstraints = LADS.Util.constrainAndPosition(resultsBox.width(), resultsBox.height(), {
            width: 1,
            height: 0.14,
            max_height: 40,
        });
        var resultFontSize = LADS.Util.getMaxFontSizeEM(text, 0.5, resultConstraints.width * 0.95, resultConstraints.height * 0.95, 0.01);
        result.css({
            'color': 'white',
            width: resultConstraints.width + 'px',
            height: resultConstraints.height + 'px',
            'margin': '0 0 0.375% 0',
            'padding': '1% 1.5%',
            'font-size': resultFontSize,
            'position': 'relative',
            'overflow': 'hidden',
        });
        result.text(text);
        result.hover(function () {
            if (result[0].style.color === 'white') { // if text is white then box is unselected
                result.css({
                    'background-color': 'rgba(50, 50, 50, 0.65)',
                });
            }
        }, function () {
                if (result[0].style.color === 'white') {
                    result.css({
                        'background-color': 'transparent',
                    });
                }
        });
        result.click(resource, function (e) {
            $('div.results').css(unselectedCSS);
            $(this).css(selectedCSS);
            var bbox = e.data.bbox;
            var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(
                new Microsoft.Maps.Location(bbox[0], bbox[1]),
                new Microsoft.Maps.Location(bbox[2], bbox[3])
            );
            map.setView({ bounds: viewBoundaries });
            map.entities.clear();

            var location = new Microsoft.Maps.Location(resource.point.coordinates[0], resource.point.coordinates[1]);
            var pushpinOptions = {
                icon: '/images/icons/locationPin.png',
                width: 20,
                height: 30
            };
            var pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions);
            map.entities.push(pushpin);

            selectedLocResource = e.data;
            selectedAddress = e.data.address.formattedAddress;
        });        
        resultsBox.append(result);
    }

    function createCustomAddressButton(resource) {
        var customResult = $(document.createElement('div'));
        var text = $(document.createElement('div'));
        var save = $(document.createElement('button'));
        var customInput = $(document.createElement('input'));
        text.text('Add Custom Address');
        save.text('Save');
        var unselectedCSS = {
            'background-color': 'transparent',
            'color': 'white',
        };

        var selectedCSS = {
            'background-color': 'white',
            'color': 'black',
        };
        customResult.addClass('results');

        //var resource;
        //var lat = location.latitude;
        //var long = location.longitude;
        //var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations/" + lat + "," + long + "?" + "output=json&key=" + credentials;
        //WinJS.xhr({
        //    url: geocodeRequest
        //}).then(function (result) {
        //    result = JSON.parse(result.responseText);
        //    for (var i = 0; i < result.resourceSets[0].resources.length; i++) {
        //        // there will only ever be one...
        //        resource = result.resourceSets[0].resources[i];
        //    }
        //});

        var customResultConstraints = LADS.Util.constrainAndPosition(resultsBox.width(), resultsBox.height(), {
            width: 1,
            height: 0.14,
            max_height: 40,
        });
        var customResultFontSize = LADS.Util.getMaxFontSizeEM(text.text(), 0.5, customResultConstraints.width * 0.95, customResultConstraints.height * 0.95, 0.01);
        customResult.css({
            'color': 'white',
            width: customResultConstraints.width + 'px',
            height: customResultConstraints.height + 'px',
            'margin': '0 0 0 0',
            'padding': '1% 1.5%',
            'font-size': customResultFontSize,
            'position': 'relative',
            'overflow': 'hidden',
        });
        customInput.addClass('customInput');
        customInput.css({
            display: 'none',
            'height': '100%',
            width: '50%',
            float: 'left',
            border: '0px',
        });
        save.css({
            display: 'none',
            'margin-left': '2%',
            'float': 'left',
            'font-size': '85%',
            'margin-top': '-0.5%',
        });
        text.click(function () {
            $('div.results').css(unselectedCSS);
            text.hide();
            customInput.fadeIn();
            save.fadeIn();
            selectedLocResource = resource;
        });
        customResult.hover(function () {
            if (customResult[0].style.color === 'white') { // if text is white then box is unselected
                customResult.css({
                    'background-color': 'rgba(50, 50, 50, 0.65)',
                });
            }
        }, function () {
            if (customResult[0].style.color === 'white') {
                customResult.css({
                    'background-color': 'transparent',
                });
            }
        });

        //make the input box and save button disappear when other results are clicked
        $('div.results').click(function (event) {
            if ($(event.target) !== customResult) {
                customInput.hide();
                save.hide();
                text.fadeIn();
            }
        });
        save.click(resource, function (e) {
            e.stopPropagation();
            text.text(customInput.val());
            customInput.fadeOut('fast');
            save.fadeOut('fast', function () {
                customResult.append(text);
            });
            selectedLocResource = e.data;
            selectedAddress = customInput.val();
            customResult.css(selectedCSS);
            customResult.click(resource, function (evt) {
                $('div.results').css(unselectedCSS);
                customResult.css(selectedCSS);
                selectedAddress = customInput.val();
                selectedLocResource = evt.data;
            });
            text.fadeIn();
            text.unbind('click');
        });
        customResult.append(text);
        customResult.append(customInput);
        customResult.append(save);
        resultsBox.append(customResult);
    }

    //Called when a location is selected to be added to the artwork. Creates and populates an LocObject that is eventually pushed into the locationList object
    function addLocation() {
        if (!selectedLocResource) {
            console.log('no location selected');
            //confirmBubble.fadeIn(200, function () {
            //    setTimeout(function () { confirmBubble.fadeOut(); }, 1000);
            //});
            return false;
        }
        var newYear = parseInt(yearBox[0].value, 10);
        var newMonth = parseInt(monthBox[0][monthBox[0].selectedIndex].value, 10) - 1
        var newDay = parseInt(dateBox[0][dateBox[0].selectedIndex].value, 10);
        if (newMonth < 0 || isNaN(newMonth)) {
            newMonth = undefined;
        }
        if (newDay === 0 || isNaN(newDay)) {
            newDay = undefined;
        }
        if (newYear === '' || isNaN(newYear)) {
            newYear = undefined;
            newDay = undefined;
            newMonth = undefined;
        }
        selectedDate = {
            year: newYear,
            month: newMonth,
            day: newDay,
        }
        var locs = new LocObject(selectedLocResource, selectedAddress, selectedDate, unsavedDescription);

        var newLocation = LADS.Util.UI.addPushpinToLoc(locs, locationList.length);

        locationList.push(locs);
        drawLocationList();
        selectedDate = undefined;
        selectedLocResource = undefined;
        selectedAddress = undefined;
        unsavedDescription = undefined;

        return true;
    }
    
    // date comparison function
    function compareDates(a, b, phase) {
        phase = phase || 1;
        var aComp, bComp;
        if (!a.date || !b.date) {
            return 1;
        }
        switch (phase) {
            case 1:
                aComp = a.date.year;
                bComp = b.date.year;
                break;

            case 2:
                aComp = a.date.month;
                bComp = b.date.month;
                break;

            case 3:
                aComp = a.date.day;
                bComp = b.date.day;
                break;
        }
        
        if (aComp) {
            if (bComp) {
                if (bComp === aComp) {
                    if (phase === 3) {
                        return 0;
                    } else {
                        phase++;
                        return compareDates(a, b, phase);
                    }
                } else {
                    return aComp - bComp;
                }
            } else {
                return 1;
            }
        } else if (bComp) {
            return 1
        } else {
            return -1;
        }
    }

    //Generates the list of artwork locations in the artwork editor
    function drawLocationList() {

        locationList.sort(compareDates);
        $('div.locations').detach();
        map.entities.clear();
        

        //click handler helpers
        function removeButtonClicked(e) {
            e.data.div.slideUp(function() { e.data.div.detach(); });
            var removed = e.data.locationList.remove(e.data.obj);
            LADS.Util.UI.drawPushpins(locationList, map);
            drawLocationList();
            if (e.data.obj === currentLocation)
                customInfobox.hide();
            return false;
        }

        function editButtonClicked(e) {
            currentLocation = e.data.obj;
            setTimeout(function () {displayInfobox(e.data.obj); }, 300);
        }

        function newDivClicked(e) {
            LADS.Util.UI.drawPushpins(locationList, map);
            customInfobox.hide();
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

        function newDivHoverIn(e) {
            if (e.data[0].style.color === 'white') { // if text is white then box is unselected
                e.data.css({
                    'background-color': 'rgba(50, 50, 50, 0.65)',
                });
            }
        }

        function newDivHoverOut(e) {
            if (e.data[0].style.color === 'white') {
                e.data.css({
                    'background-color': 'transparent',
                });
            }
        }
        
        
        var i;
        for (i = 0; i < locationList.length; i++) {
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
            if (locationList[i].date && !isNaN(locationList[i].date.year)) {
                var year = locationList[i].date.year;
                if (year < 0) {
                    //add BC to years that are less than 0
                    year = Math.abs(year) + ' BC';
                }
                date = " - " + year;
            } else {
                date = ' - <i>Date Unspecified</i>';
            }
            var newDiv = $(document.createElement('div'));
            newDiv.addClass('locations');
            var entryConstraints = LADS.Util.constrainAndPosition(locationsDiv.width(), locationsDiv.height(), {
                width: 1,
                height: 0.16625,
                max_height: 45,
            });
            var infoString = String((i + 1) + '. ' + address + date);
            var calibrationLength = infoString.length;
            if (calibrationLength > 30) {
                calibrationLength = 30;
            }
            var locationFontSize = LADS.Util.getMaxFontSizeEM(infoString.substring(0, calibrationLength), 0.5, 1000, entryConstraints.height * 0.65, 0.01);
            newDiv.css({
                'color': 'white',
                'display': 'none',
                width: entryConstraints.width + 'px',
                height: entryConstraints.height + 'px',
                'margin': '0 0 0.375% 0',
                'position': 'relative',
                'overflow': 'hidden',
            });
            var locText = $(document.createElement('div'));
            locText.html((i + 1) + '. ' + address + date);
            locText.css({
                'width': '60%',
                'height': '100%',
                'white-space': 'nowrap',
                'overflow': 'hidden',
                'font-size': locationFontSize,
                'display': 'inline-block',
                'margin': '1.1% 0 0 3%',
                'text-overflow': 'ellipsis',
            });
            newDiv.append(locText);

            var removeButton = $(document.createElement('img'));
            removeButton.on('click', null, { div: newDiv, locationList: locationList, obj: locationList[i] }, removeButtonClicked); 
            removeButton.addClass('removeButton');
            removeButton.attr('src', 'images/icons/minus.svg');
            removeButton.css({
                'height': '80%',
                'width': 'auto',
                'margin-right': '5%',
                'margin-top': '0.825%',
                'display': 'inline-block',
                'position': 'relative',
                'right': '0px',
                'float': 'right',
            });
            newDiv.append(removeButton);
            var editButton = $(document.createElement('img')); // edit location details button
            editButton.on('click', null, { obj: locationList[i] }, editButtonClicked);
            editButton.addClass('editButton');
            editButton.attr('src', 'images/icons/edit.png');
            editButton.css({
                'height': '80%',
                'width': 'auto',
                'margin-right': '2%',
                'margin-top': '0.825%',
                'display': 'inline-block',
                'position': 'relative',
                'float': 'right',
            });
            newDiv.append(editButton);
            LADS.Util.UI.drawPushpins(locationList, map);
            newDiv.on('click', null, locationList[i], newDivClicked);
            newDiv.on('mouseenter', null, newDiv, newDivHoverIn).on('mouseleave', null, newDiv, newDivHoverOut);
            locationsDiv.append(newDiv);
            newDiv.fadeIn();
            if (locationList[i] === currentLocation) //If this location is currently under edition, select it
                newDiv.click();
        }
    }

    function displayInfobox(loc) {
        var pushpin = loc.pushpin;
        var latlong = pushpin._location;

        //make locationInfobox, popup that shows location information
        //This section has to be reproduced every time because dynamic text cannot be passed into the customInfobox.js effectively. 
        //Only initializing once and passing that object over would result in deletion of the children, 
        //and passing clones does not pass event handlers, etc.
        locationInfo = $(document.createElement('div'));
        locationInfo.attr('class', 'locationInfo');
        locationInfo.attr('id', 'locationInfo');
        locationInfo.css({
            'padding': '0px',
            'background-color': 'rgba(255,255,255,0)',
            'border-radius': '10px',
            'min-width': '250px',
            'max-width': '450px',
            'position': 'relative',
            'float': 'left'
        });

        var textAreaCSS = {
            'border': '2px solid Gray',
            'margin-bottom': '3%',
            'width': '100%',
            'float': 'left'
        };

        
        var dateEditor;
        if (loc.date && loc.date.year) { //If there is a valid year, initialize the datepicker with those values
            dateEditor = createBasicDatePicker(loc.date.day, loc.date.month, loc.date.year); //date picker for editing the location's date
        } else {
            dateEditor = createBasicDatePicker(); //date picker for editing the location's date
        }

        dateEditor.css({ 'margin-bottom': '3%' });

        locationTextArea = $(document.createElement('input'));
        locationTextArea.attr('placeholder', 'Location');
        locationTextArea.attr('id', 'locationTextArea');
        locationTextArea.css(textAreaCSS);

        descriptionTextArea = $(document.createElement('textarea'));
        descriptionTextArea.attr('id', 'descriptionTextArea');
        descriptionTextArea.attr('placeholder', 'Description');
        descriptionTextArea.attr('rows', '4');
        descriptionTextArea.css(textAreaCSS);
        descriptionTextArea.css({
            'padding': '0px 1px 0px 1px',
            'margin-top': '0px',
            'background-color': 'white'
        });

        var saveButton = $(document.createElement('button'));
        saveButton.addClass('addButton');
        saveButton.text('Save');
        saveButton.css({
            'color': 'white',
            'border': '2px solid white',
            'padding': '1%',
            'position': 'relative',
            'float': 'right',
            'left': '4px'
        });
        saveButton.click(function () {
            // same logic as datePickerEvent, REFACTORING!!!
            var y = parseInt(dateEditor[0].childNodes[2].value, 10);
            var m = parseInt(dateEditor[0].childNodes[1].value, 10) - 1;
            var d = parseInt(dateEditor[0].childNodes[0].value, 10);
            if (y === '' || isNaN(y)) {
                y = undefined;
                m = 0;
                d = 0;
            }
            if (m < 0 || isNaN(m)) {
                m = undefined;
            }
            if (d === 0 || isNaN(d)) {
                d = undefined;
            }
            loc.date = {
                year: y,
                month: m,
                day: d,
            };
            currentLocation.date = {
                year: y,
                month: m,
                day: d,
            };
            currentLocation.address = locationTextArea.val();
            currentLocation.info = descriptionTextArea.val();
            drawLocationList(); //redraw the locations list
        });

        $(locationInfo).append(dateEditor);
        $(locationInfo).append(locationTextArea);
        $(locationInfo).append(descriptionTextArea);
        $(locationInfo).append(saveButton);

        locationTextArea.attr('value', currentLocation.address);
        descriptionTextArea.attr('value', currentLocation.info);

        //Display Infobox
        customInfobox.show(latlong, locationInfo);
        $('#mapDiv_infobox_closeBtn').css({ 'color': 'gray', });
    }

    function toggleInfobox(e) {
        if (!customInfobox.visible()) {
            displayInfobox(e);
        } else {
            customInfobox.hide();
        }
    }

    //Function that displays an alert message in the helpbox for half a second and returns to previous state
    function helpboxAlert(alert) {
        helpBox.stop(true, true).fadeOut(100, function () {
            helpBox.text(alert).fadeIn(500, function () {
                setTimeout(function () {
                    helpBox.fadeOut(100, function () {
                        //Only show helptext when there aren't new results pushed into the resultsbox
                        if (resultsBox[0].childNodes.length === 0)
                            helpBox.text(helpText).fadeIn(500);
                    });
                }, 1000);
            });
        });
    }

    //Clears values in the datepicker
    function clearDatePicker(obj) {
        obj[0].childNodes[0].selectedIndex = 0; //reset date
        obj[0].childNodes[1].selectedIndex = 0; //reset month
        obj[0].childNodes[2].value = ''; //reset year

    }

    function pushChanges(onSuccess, onFail, onError) {

        setArtworkName(LADS.Util.encodeXML($(artworkSettings.Title).val()));
        setArtworkArtist(LADS.Util.encodeXML($(artworkSettings.Artist).val()));
        setArtworkYear(LADS.Util.encodeXML($(artworkSettings.Year).val()));
        //Render locationList to a json representation and set it to the Location field of the artwork xml
        setArtworkLocations(LADS.Util.encodeXML(JSON.stringify(locationList)));

        LADS.Worktop.Database.pushXML(artworkXML, artwork.Identifier, "Artwork", onSuccess, onFail, onError);

    }

    function setArtworkName(name) {
        if (name && name.length > 0)
            artworkXML.getElementsByTagName("Name")[0].childNodes[0].textContent = name;
        else
            artworkXML.getElementsByTagName("Name")[0].childNodes[0].textContent = LADS.Util.encodeXML(artworkXML.getElementsByTagName("Name")[0].childNodes[0].data);

    }

    function setArtworkArtist(artist) {
        //if (artist)// && artist.length > 0)
        getFieldValueFromMetadata(artworkXML, "Artist").textContent = artist || 'Artist';
        //else
        //    getFieldValueFromMetadata(artworkXML, "Artist").textContent = " ";
    }

    function setArtworkYear(year) {
        //if (year)// && year.length > 0)
        getFieldValueFromMetadata(artworkXML, "Year").textContent = year || '2013';
        //else
        //    getFieldValueFromMetadata(artworkXML, "Year").textContent = " ";
    }


    function getArtworkMetadata(artwork) {
        return artwork.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes;
    }

    function setThumbnail(url) {
        var metadata = getFieldValueFromMetadata(artworkXML, "Thumbnail");
        metadata.data = url;
    }

    /* This method is called to get the artwork document in XML form */
    function getArtworkXML() {
        var xml = LADS.Worktop.Database.getDoqXML(artwork.Identifier);
        var parser = new DOMParser();
        artworkXML = parser.parseFromString(xml, 'text/xml');
    }

    function setArtworkLocations(data) {
        getFieldValueFromMetadata(artworkXML, "Location").data = data;
    }

    function getFieldValueFromMetadata(xml, field) {
        var metadata = getMetaData(xml);
        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].childNodes[0].textContent === field) {
                var out = metadata[i].childNodes[1].childNodes[0];
                if (out) return out;

                metadata[i].childNodes[1].appendChild(xml.createTextNode(''));
                return metadata[i].childNodes[1].childNodes[0];
            }
        }
        return null;
    }
    function getMetaData(doq) {
        return doq.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes;
    }

    //Location Object, probably should be replaced with
    //something from the server //does this comment still apply? - yudi
    function LocObject(locResource, address, date, info) {
        this.resource = locResource;
        this.date = date;
        this.info = info;
        this.address = address;
        this.pushpin = null;
    }

    function toggleThumbnailPicker(toggle) {
        if (toggle == "close") {
            $(tnBorderWrapper).fadeOut();
            return;
        }
        if (locPanelOpen) {
            $('.locationPanelDiv').hide("slide", { direction: 'left' }, 500, function () {
                $('.sidebarHideButtonContainer').show();
            });
            locPanelOpen = false;
        }
        //$('.addAssocMediaDialog').fadeOut();
        $('.addInfoDialog').fadeOut();
        if ($(tnBorderWrapper)[0] === undefined) {
            makethumbnailPicker();
            $(tnBorderWrapper).fadeToggle(200);
        } else {
            $(tnBorderWrapper).fadeToggle(200);
        }
    }

    function makethumbnailPicker() {
        var mainPanelHeight = $('.mainPanel').height();
        var mainPanelWidth = $('.mainPanel').width();
        var ratio = 1.564;

        tnBorderWrapper = document.createElement('div');
        $(tnBorderWrapper).addClass('tnBorderWrapper');
        //$(tnBorderWrapper).addClass('hideMenus');
        $(tnBorderWrapper).css({
            position: 'relative',
            top: '0px',
            left: '0px',
            height: '100%',
            width: '100%',
            display: 'none',
        });

        var tnBorderCenter = document.createElement('div');
        $(tnBorderCenter).addClass("tnBorderCenter");
        $(tnBorderCenter).css({
            position: 'absolute',
            top: '15%',
            left: '25%',
            height: 50 + '%',
            width: ((50 * mainPanelHeight * ratio) / mainPanelWidth) + '%',
            'background-color': 'transparent',
            border: '2px solid white',
            'z-index': 60,
        });
        var tnBorderLeft = document.createElement('div');
        $(tnBorderLeft).addClass("tbBorderLeft");
        $(tnBorderLeft).css({
            position: 'absolute',
            top: '0%',
            left: 0,
            height: '100%',
            width: '25%',
            'background-color': 'rgba(0,0,0,.6)',
            'z-index': 50,
        });
        var tnBorderTop = document.createElement('div');
        $(tnBorderTop).addClass("tnBorderTop");
        $(tnBorderTop).css({
            position: 'absolute',
            top: '0%',
            left: '25%',
            height: '15%',
            width: $(tnBorderCenter).width() + '%',
            'background-color': 'rgba(0,0,0,.6)',
            'z-index': 50,
        });
        var tnBorderBottom = document.createElement('div');
        $(tnBorderBottom).addClass("tnBorderBottom");
        $(tnBorderBottom).css({
            position: 'absolute',
            top: (15 + $(tnBorderCenter).height()) + '%',
            left: '25%',
            height: (100 - $(tnBorderCenter).height() - $(tnBorderTop).height()) + '%',
            width: $(tnBorderCenter).width() + '%',
            'background-color': 'rgba(0,0,0,.6)',
            'z-index': 55,
        });
        var tnBorderRight = document.createElement('div');
        $(tnBorderRight).addClass("tnBorderRight");
        $(tnBorderRight).css({
            position: 'absolute',
            top: '0%',
            left: (25 + $(tnBorderCenter).width()) + '%',
            height: '100%',
            width: (100 - 25 - $(tnBorderCenter).width()) + '%',
            'background-color': 'rgba(0,0,0,.6)',
            'z-index': 50,
        });

        var artWorkInfo = document.createElement('div');
        $(artWorkInfo).addClass('artworkInfo');
        $(artWorkInfo).css({
            position: 'relative',
            width: '100%',
            height: '15%',
            'background-color': 'rgba(0,0,0,.6)',
            'color': 'white',
            'font-size': '300%',
            'text-align': 'center',
        });
        //should be replaced by artwork name
        $(artWorkInfo).text("Artwork Info");

        var tnHelp = document.createElement('div');
        $(tnHelp).addClass('tnHelp');
        $(tnHelp).css({
            position: 'relative',
            top: '15%',
            left: '0%',
            width: '100%',
            height: '29%',
            border: '3px double white',
            padding: '1%',
            'font-size': '120%',
            color: 'white',
        });
        $(tnHelp).text("Move and resize the artwork within the thumbnail window, and select “Save Thumbnail” when you’re happy with the composition.");
        var tnHelpPadding = (parseInt($(tnHelp).css('padding'), 10) / 100) * ($(tnBorderBottom).innerWidth() / 100) * root.width();
        var tnHelpBorder = parseInt($(tnHelp).css('border'), 10);
        var tnBottomWidth = ($(tnBorderBottom).innerWidth() / 100) * root.width();
        $(tnHelp).width(tnBottomWidth - 2 * tnHelpBorder - 2 * tnHelpPadding);

        var tnSave = document.createElement('button');
        $(tnSave).text("Save Thumbnail");
        $(tnSave).css({
            position: 'absolute',
            'right': '0px',
            'bottom': '15%',
        });
        $(tnSave).on("click", saveThumbnail);

        $(tnBorderCenter).append(artWorkInfo);
        $(tnBorderBottom).append(tnHelp);
        $(tnBorderBottom).append(tnSave);

        $(tnBorderWrapper).append(tnBorderTop);
        $(tnBorderWrapper).append(tnBorderLeft);
        $(tnBorderWrapper).append(tnBorderCenter);
        $(tnBorderWrapper).append(tnBorderBottom);
        $(tnBorderWrapper).append(tnBorderRight);
        mainPanel.append(tnBorderWrapper);

    }

    //functions for thumbnail upload
    function saveThumbnail() {
        var canvas = $("canvas");
        var ctx = canvas[0].getContext("2d");

        //gets position of thumbnail frame
        var x = $(".tnBorderCenter").offset().left;
        var y = $(".tnBorderCenter").offset().top;
        var width = $(".tnBorderCenter").outerWidth();
        var height = $(".tnBorderCenter").outerHeight();

        //gets imagedata from position of thumbnail frame
        var imgdata = ctx.getImageData(x, y, width, height);

        //creates tmpcanvas to redraw imgdata
        var tmpCanvas = document.createElement("canvas");
        //Set width of canvas like this not with CSS
        //CSS canvas size will stretch contents!!!
        tmpCanvas.width = imgdata.width;
        tmpCanvas.height = imgdata.height;
        var tmpCtx = tmpCanvas.getContext("2d");
        tmpCtx.putImageData(imgdata, 0, 0);

        //gets dataurl from tmpcanvas, ready to send to server!
        var dataurl = tmpCanvas.toDataURL();

        //spit out dataurl into body for testing.
        /*
        var link = document.createElement('a');
        root.append(link);
        var downloadURL = dataurl;
        downloadURL.replace("image/png", "image/octet-stream");
        link.href = downloadURL;
        link.download = "1.png";
        link.text = "download";
        */

        //uploadFile();

        LADS.Worktop.Database.uploadImage(dataurl, function (imageURL) {
            setThumbnail(imageURL);
            LADS.Worktop.Database.pushXML(artworkXML, artwork.Identifier, "Artwork",
                function () {
                    toggleThumbnailPicker();
                }, function () {
                    var popup = LADS.Util.UI.popUpMessage(null, "Thumbnail not saved.  You must log in to save changes.");
                    $('body').append(popup);
                    $(popup).show();
                }, function () {
                    var popup = LADS.Util.UI.popUpMessage(null, "Thumbnail not saved.  There was an error contacting the server.");
                    $('body').append(popup);
                    $(popup).show();
                });
        }, function () {
            var popup = LADS.Util.UI.popUpMessage(null, "Thumbnail not saved.  You must log in to save changes.");
            $('body').append(popup);
            $(popup).show();
        }, function () {
            var popup = LADS.Util.UI.popUpMessage(null, "Thumbnail not saved.  There was an error contacting the server.");
            $('body').append(popup);
            $(popup).show();
        });
        //push changes to server
    }
};