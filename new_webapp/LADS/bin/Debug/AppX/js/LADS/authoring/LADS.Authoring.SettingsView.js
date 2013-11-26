LADS.Util.makeNamespace("LADS.Authoring.SettingsView");

// This class lays out the general settings page and the exhibition settings page.
LADS.Authoring.SettingsView = function (layoutType, settingsViewCallback, backButtonType, showLoading) {
    var currentSetting = null;
    var prevSelectedSetting = null;
    var prevSelectedName = null;
    var middlePrevSelectedSetting = null;
    var middlePrevSelectedSettingText = null;
    var exhibitionfilter = null;
    var currentUploadedArtworkGuid = null;

    var root = $(document.createElement('div'));
    var topbar = $(document.createElement('div'));
    var mainPanel = $(document.createElement('div'));
    var leftSection = document.createElement('div');
    var middeLabel = document.createElement('div');
    var middleSection = document.createElement('div');
    var middleSettings = document.createElement('div');
    var rightSection = document.createElement('div');
    var rightSettings = document.createElement('div');
    var rightSettingsLabels = document.createElement('div');
    var rightSettingsFields = document.createElement('div');
    var rightSettingsEntries = document.createElement('div');
    var overlayOnRoot = $(document.createElement('div'));
    var editExhibitionCurrentSelected;
    var searchbar = document.createElement('textarea');
    var searchbarcontainer = document.createElement('div');
    var mainSettings = {};
    var mainDoq;
    var exhibitions, exhibitionNames, exhibitionCount = 0, exhibitionGuids;
    var currentExhibitionXML;
    var artworkByGuid = {};
    var currentArtwork = null;
    var currentTour = null;
    var artworkExhibition = {}; // mapping from artwork -> exhibitions it belongs to
    var exhibitionByGuid = {}; // mapping from ExhibitionGuid -> exhibition JSON object
    var artworkNames = [];
    var currentExhibitionNumber;
    var splashFrame;
    var filePicker = new Windows.Storage.Pickers.FileOpenPicker();
    var currentUpload;
    var changesSavedLabel;
    var prevSelectedExhibition;
    var topMiddleLabelContainer;
    var artworksList; /////////////////////////////////////////////
    var uploadingOverlay;
    var exhibitionCBArray = [];
    var artworkFolderId;
    var innerProgressBar;
    var searchIndices = [];
    var characterLimitLabel;
    var tourObjects;
    var passwordcontent;

    var that = {
        getRoot: getRoot,
        setView: setView,
        clickElementById: clickElementById,
        selectItemByName: selectItemByName,
        selectArtworkByGuid: selectArtworkByGuid
    };
    init();
    getMainDoq();
    return that;

    function getRoot() {
        return root;
    }

    function clickElementById(id) {
        var elem = $('#' + id);
        if (elem.length) {
            elem.click();
        } else {
            setTimeout(function () {
                clickElementById(id);
            }, 50);
        }
    }

    function setView(view) {
        $(leftSection).children('.labelContainer').each(function (i, e) {
            if (view === $(e).children('.label').text()) {
                $(e).click();
                return false;
            }
        });
    }

    function selectItemByName(name) {
        $(middleSettings).children('.labelContainer').each(function (i, e) {
            if (name === $(e).text()) {
                $(e).click();
                return false;
            }
        });
    }


    function selectArtworkByGuid(guid) {
        // bmost: hack to select artwork, retry every 50ms if it isn't in the DOM yet
        if ($('#artwork-' + guid).length == 0) {
            setTimeout(function () {
                selectArtworkByGuid(guid);
            }, 50);
            return;
        }
        $('#artwork-' + guid).click();
    }

    function selectTourByGuid(guid) {
        var tourNumber = 0;
        for (var tourNumber = 0; tourNumber < tourObjects.length; tourNumber++) {
            if (guid == tourObjects[tourNumber].Identifier) {
                currentTour = tourObjects[tourNumber];
                break;
            }
        }

        $(middleSettings).children('.labelContainer').each(function (i, e) {
            if (i == tourNumber) {
                $(e).click();
                return false;
            }
        });
    }

    this.selectArtworkByGuid = selectArtworkByGuid;


    function init() {
        root.css("background-color", "rgb(219,217,204)");
        root.css("color", "black");
        root.css("width", "100%");
        root.css("height", "100%");


        $(overlayOnRoot).addClass('overlayOnRoot');
        $(overlayOnRoot).css({
            'position': 'fixed',
            'width': '100%',
            'height': '100%',
            'top': '0',
            'left': '0',
            'background-color': 'rgba(0,0,0,0.5)',
            'z-index': '1000',
            'display': 'block'
        });

        var progressIcon = $(document.createElement('img'));
        progressIcon.css({
            'position': 'relative', 'top': '45%', 'left': '43%', 'width': '15%', 'height': 'auto',
        });
        progressIcon.attr('src', 'images/icons/progress-circle.gif');

        overlayOnRoot.append(progressIcon);

        //    LADS.Util.showLoading($(overlayOnRoot));
        $(root).append(overlayOnRoot);

        $(searchbar).css({ 'border-color': 'rgb(167,180,174)', 'left': '10%', 'min-width': '50%', 'max-width': '50%', 'min-height': '1.4em', 'max-height': '1.4em', 'position': 'relative', 'font-size': '170%', 'color': 'gray', 'height': '1em', 'border-width': '0.15em', });
        $(searchbar).text('Search');


        currentSetting = "General Settings";


        exhibitionByGuid = {};

        //LADS.Util.showLoading($(root));
        LADS.Worktop.Database.getExhibitions(getExhibitionsHelper);

        function getExhibitionsHelper(_exhibitions) {
            $('.overlayOnRoot').show();
            exhibitions = _exhibitions;
            _exhibitions.sort(function (a, b) {
                if (a.Name < b.Name) {
                    return -1;
                } else if (a.Name > b.Name) {
                    return 1;
                } else {
                    return 0;
                }
            });
            exhibitionNames = [];
            exhibitionGuids = [];
            for (var i = 0; i < _exhibitions.length; i++) {
                exhibitionByGuid[_exhibitions[i].Identifier] = _exhibitions[i];
                exhibitionNames.push(_exhibitions[i].Name);
                exhibitionGuids.push(_exhibitions[i].Identifier);
            }

            var topbarHeight = 8;
            createTopBar(topbarHeight);


            mainPanel.css({ width: '100%', height: (100 - topbarHeight) + '%' });
            makeLeftSection();
            makeFeedbackSection();
            makeMiddleSection();
            makeRightSection();
            root.append(topbar);
            root.append(mainPanel);

            // RYAN - moved to FileUploader
            uploadingOverlay = $(document.createElement('div'));
            uploadingOverlay.css({ 'position': 'absolute', 'left': '0%', 'top': '0%', 'background-color': 'rgba(0, 0, 0, .5)', 'width': '100%', 'height': '100%', 'z-index': '100' });

            var uploadOverlayText = $(document.createElement('label'));
            uploadOverlayText.css({ 'color': 'white', 'width': '10%', 'height': '5%', 'top': '38%', 'left': '40%', 'position': 'relative', 'font-size': '250%' });
            uploadOverlayText.text('Uploading File. Please wait.');

            var progressIcon = $(document.createElement('img'));
            progressIcon.css({
                'position': 'relative', 'top': '50%', 'left': '14%'
            });
            progressIcon.attr('src', 'images/icons/progress-circle.gif');

            var progressBar = $(document.createElement('div'));
            progressBar.css({
                'position': 'relative', 'top': '42%', 'left': '45%', 'border-style': 'solid', 'border-color': 'white', 'width': '10%', 'height': '2%'
            });

            innerProgressBar = $(document.createElement('div'));
            innerProgressBar.css({
                'background-color': 'white',
                'width': '0%', 'height': '100%'
            });

            progressBar.append(innerProgressBar);

            uploadingOverlay.append(uploadOverlayText);
            uploadingOverlay.append(progressBar);
            // RYAN - end of FileUploader section

            root.append(uploadingOverlay);
            uploadingOverlay.hide();
            if (settingsViewCallback && backButtonType == null) {
                settingsViewCallback(that);
            }

        }
    }
    var feedbackSelected = false;

    //Left panel to choose between different settings pages
    function makeLeftSection() {

        $(leftSection).css({ 'width': '25%', 'height': '100%', 'z-index': '100', 'position': 'relative', 'left': '0%', 'background-color': "rgb(219,217,204)", 'float': 'left' });
        createMainLabel('General Settings', 'Customize appearance');
        createMainLabel('Exhibitions', 'Edit exhibition settings');
        createMainLabel('Artworks', 'Edit list of artworks');
        createMainLabel('Tour Authoring', 'Build interactive tours');
        createMainLabel('Feedback', 'Comments and Reports');

        mainPanel.append(leftSection);
    }

    function makeFeedbackSection() {
        var feedbackComments = document.createElement('div');
        $(feedbackComments).addClass('feedbackComments');
        $(feedbackComments).css({
            'background-color': 'rgb(219, 217, 204)',
            'position': 'absolute',
            'z-index': '999', //too big?
            'left': '50%',
            'width': '50%',
            'height': '100%',
            'display': 'none'
        });
        var leveldiv = document.createElement('div');
        $(leveldiv).addClass('level');
        $(leveldiv).css({
            'position': 'relative',
            'top': '10%',
            'left': '5%',
            'height': '50%'
        });
        $(feedbackComments).append(leveldiv);
        var prioritylevel = document.createElement('label');
        $(prioritylevel).addClass('prioritylevel');
        $(prioritylevel).text('Priority Level');
        $(prioritylevel).css({
            'font-size': '1em',
            'position': 'absolute',
            'font-weight': '777',
            'top': '0.7%'
        });
        //var slider = document.createElement('div');
        //$(slider).addClass('slider');
        //$(slider).css({
        //    'left': '23%',
        //    'top': '0%',
        //    'width': '40%'
        //});
        //$(slider).slider();
        //$('ui-slider-handle ui-state-default ui-corner-all')
        //var handle = document.getElementsByClassName('ui-slider-handle ui-state-default ui-corner-all');
        //change the color of the handle to white

        //radio buttons
        var lowButton = document.createElement("input");
        $(lowButton).addClass('lowButton');
        lowButton.id = "lowButton";
        lowButton.setAttribute('Name', 'buttonRow');
        lowButton.setAttribute('type', 'Radio');
        $(lowButton).css({
            'position': 'absolute',
            'left': '18%'
        });
        var mediumButton = document.createElement("input");
        $(mediumButton).addClass('mediumButton');
        mediumButton.id = "mediumButton";
        mediumButton.setAttribute('Name', 'buttonRow');
        mediumButton.setAttribute('type', 'Radio');
        mediumButton.setAttribute('checked', 'true');
        $(mediumButton).css({
            'position': 'absolute',
            'left': '30%'
        });
        var highButton = document.createElement("input");
        $(highButton).addClass('highButton');
        highButton.id = "highButton";
        highButton.setAttribute('Name', 'buttonRow');
        highButton.setAttribute('type', 'Radio');
        $(highButton).css({
            'position': 'absolute',
            'left': '47%'
        });

        var low = document.createElement('label');
        $(low).addClass('low');
        $(low).text('Low');
        $(low).css({
            'font-size': '1em',
            'position': 'absolute',
            'font-weight': '777',
            'left': '24%',
            'top': '.7%'
        });
        var medium = document.createElement('label');
        $(medium).addClass('medium');
        $(medium).text('Medium');
        $(medium).css({
            'font-size': '1em',
            'position': 'absolute',
            'font-weight': '777',
            'left': '36%',
            'top': '.7%'
        });
        var high = document.createElement('label');
        $(high).addClass('high');
        $(high).text('High');
        $(high).css({
            'font-size': '1em',
            'position': 'absolute',
            'font-weight': '777',
            'left': '53%',
            'top': '.7%'
        });


        var checkbox = document.createElement('input');
        $(checkbox).addClass('checkbox');
        checkbox.id = "feedbackCheckBox";
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('checked', 'true');
        $(checkbox).css({
            'position': 'absolute',
            'top': '10%',
            'border': 'solid 2px gray'
        });

        var wantemail = document.createElement('label');
        $(wantemail).addClass('wantemail');
        $(wantemail).text('Email me questions and updates on this feature.');
        $(wantemail).css({
            'position': 'absolute',
            'left': '7%',
            'font-size': '1em',
            'top': '11%'
        });
        var address = document.createElement('label');
        $(address).addClass('address');
        $(address).text('Your email address');
        $(address).css({
            'position': 'absolute',
            'left': '7%',
            'font-size': '1em',
            'top': '20%'
        });
        var emailinput = document.createElement('input');
        $(emailinput).addClass('emailinput');
        $(emailinput).css({
            'position': 'absolute',
            'left': '35%',
            'top': '19%',
            'height': '7%',
            'width': '40%',
            'border': 'solid 2px gray'
        });

        var send = document.createElement('button');
        $(send).addClass('send');
        $(send).text('Send');
        $(send).css({
            'position': 'absolute',
            'left': '56.5%',
            'top': '40%',
            'border': '2px solid black',
            'color': 'black',
            'font-size': '1 em'
        });

        var sendingMsg = document.createElement('label');
        $(sendingMsg).addClass('sendingMsg');
        $(sendingMsg).text('Sending feedback...');
        $(sendingMsg).css({
            'position': 'absolute',
            'left': '56.5%',
            'top': '50%'
        });
        $(sendingMsg).hide();

        send.onclick = function () {
            $(sendingMsg).show();
            setTimeout(function () {
                $(sendingMsg).hide();
                //also clear textboxes and reset buttons after sending
                $(emailinput).val("");
                $(checkbox).prop('checked', 'true');
                $(mediumButton).prop('checked', 'true');
                var feedbackBox = document.getElementById('feedbackBox');
                $(feedbackBox).text("");
            }, 3000);
            feedbackSelected = false;
        }

        $(leveldiv).append(send);
        $(leveldiv).append(sendingMsg);
        $(leveldiv).append(emailinput);
        $(leveldiv).append(address);
        $(leveldiv).append(wantemail);
        $(leveldiv).append(checkbox);
        $(leveldiv).append(low);
        $(leveldiv).append(medium);
        $(leveldiv).append(high);
        $(leveldiv).append(lowButton);
        $(leveldiv).append(mediumButton);
        $(leveldiv).append(highButton);
        //$(leveldiv).append(slider);
        $(leveldiv).append(prioritylevel);
        //figure out the best place to append this!
        $(mainPanel).append(feedbackComments);
    }


    //helper function to generate settings page selector buttons
    function createMainLabel(name, subText) {
        var labelContainer = document.createElement('div');
        $(labelContainer).addClass('labelContainer');
        $(labelContainer).css({ 'top': '5%', 'position': 'relative', 'width': '100%', 'margin-bottom': '10%', 'padding-bottom': '2.5%' });

        var label = document.createElement('div');
        $(label).addClass('label');
        $(label).css({ 'top': '5%', 'position': 'relative', 'left': '10%', 'font-size': '350%', 'color': 'black', 'font-weight': '500' });
        $(label).text(name);
        LADS.Util.fitText(label, 0.9);

        var labelInfo = document.createElement('div');
        $(labelInfo).css({ 'top': '5%', 'position': 'relative', 'left': '10%', 'font-size': '200%', 'color': 'black' });
        $(labelInfo).text(subText);
        LADS.Util.fitText(labelInfo, 1.4);
        $(labelContainer).append(label);
        $(labelContainer).append(labelInfo);

        /*if (name == 'Tour Authoring') { //until tour authoring is available
            labelContainer.onclick = function () {
                //display message 
                var dialogOverlay = document.createElement('div');
                dialogOverlay.onclick = function () {
                    $(dialogOverlay).fadeOut(500);
                };
                dialogOverlay = $(dialogOverlay);
                dialogOverlay.attr('id', 'dialogOverlay');
                dialogOverlay.css({
                    display: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    'background-color': 'rgba(0,0,0,0.6)',
                    'z-index': '1000',
                });

                var tourAuthBox = document.createElement('div');
                $(tourAuthBox).addClass('tourAuthBox');
                $(tourAuthBox).css({
                    'width': '45%',
      
                    'position': 'fixed',
                    'top': '40%',
                    'left': '25%',
                    'padding': '2% 2%',
                    'background-color': 'black',
                    'border': '3px double white',
                    'z-index': '100',
                    'id': 'deleteOptionBox'
                });
                var tourAuthLabel = document.createElement('p');
                $(tourAuthLabel).css({
                    'font-size': '150%',
                    'text-align':'center',
                    'color':'white'
                });
                $(tourAuthLabel).text('Tour Authoring under development. Coming Soon.');
                dialogOverlay.append($(tourAuthBox));
                $(tourAuthBox).append($(tourAuthLabel));
                root.append(dialogOverlay);
                dialogOverlay.fadeIn(500);
                
            };
        }
        else {*/

        $(labelContainer).attr('flagClicked', 'false');
        labelContainer.onmousedown = function () {
            if (name == "Feedback") {
                return;
            }
            $(labelContainer).css({ 'background-color': 'white' });
            //if (name != "Feedback")
                //$(document.getElementsByClassName('overlayOnRoot')).fadeIn();
            //labelContainer.click();
        };
        labelContainer.onmouseup = function () {
            if ($(this).attr('flagClicked') == 'false')
                $(this).css({ 'background-color': 'transparent' });
        }
        labelContainer.onmouseleave = function () {
            if ($(this).attr('flagClicked') == 'false')
                $(this).css({ 'background-color': 'transparent' });
        }

        if (name == "Feedback") {
            $(label).css('color', 'gray');
            $(labelInfo).css('color', 'gray');
        }
        labelContainer.onclick = function () {
            if (name == "Feedback") {
                return;
            }
            if (prevSelectedName && prevSelectedName === name) {
                $('.overlayOnRoot').hide();
                return;
            }

            /************************/
            //pop up a window to confirm if the user is going to leave the current editing feedback page
            var feedbackWarning = document.createElement('div');
            $(feedbackWarning).addClass('feedbackWarning');
            $(feedbackWarning).css({
                'position': 'absolute',
                'top': '40%',
                'left': '35%',
                'height': '20%',
                'width': '30%',
                'background-color': 'black',
                'border': 'double white 1px'
            });
            var leavingmsg = document.createElement('label');
            $(leavingmsg).addClass('leavingmsg');
            $(leavingmsg).text('Are you sure you want to leave this page? \n   You have started writing feedback.');
            $(leavingmsg).css({ 'position': 'absolute', 'font-size': '1.2em', 'color': 'white', 'top': '20%', 'text-align': 'center' });
            $(feedbackWarning).append(leavingmsg);
            //confirm button for the warning msg, continue going to the other page when clicked
            var confirm = document.createElement('button');
            $(confirm).addClass('confirm');
            $(confirm).text('Leave Page');
            $(confirm).css({
                'position': 'absolute',
                'left': '15%',
                'bottom': '10%',
                'border': '2px solid white',
                'color': 'white',
                'font-size': '1 em',
                'text-color': '2%'
            });
            confirm.onclick = function () {
                feedbackSelected = false;
                //overlay disappear
                $(feedbackWarningOverlay).css({ 'display': 'none' });
                loadSetting();

            };
            $(feedbackWarning).append(confirm);
            //cancel button for the warning msg, stay in the feedback page when clicked
            var cancel = document.createElement('button');
            $(cancel).addClass('cancel');
            $(cancel).text('Cancel');
            $(cancel).css({
                'position': 'absolute',
                'left': '60%',
                'bottom': '10%',
                'border': '2px solid white',
                'color': 'white',
                'font-size': '1 em'
            });
            cancel.onclick = function () {
                $(feedbackWarningOverlay).css({
                    'display': 'none'
                })
                if (name !== "Feedback") {
                    $('.overlayOnRoot').fadeOut();
                    $(labelContainer).css({ 'background-color': "rgb(219,217,204)" });
                }
                feedbackSelected = true;
            }
            $(feedbackWarning).append(cancel);
            var feedbackWarningOverlay = LADS.Util.UI.blockInteractionOverlay();
            $(feedbackWarningOverlay).css({
                'display': 'none'
            })
            root.append(feedbackWarningOverlay);
            $(feedbackWarningOverlay).append(feedbackWarning);

            /************************/


            if (feedbackSelected === true) {
                if (feedbackSelected && name != "Feedback") {
                    $(feedbackWarningOverlay).css({
                        'display': 'block'
                    })
                    feedbackSelected = false;
                }

            } else {
                loadSetting();
            };
        }



        //set default selection as General sittings
        if (name == "General Settings") {
            $(labelContainer).click();
        }

        if (name != 'Exhibitions') {
            $(searchbar).text('Search');
        }


        $(leftSection).append(labelContainer);

        function loadSetting() {
            console.log("LOADING: " + name);
            currentSetting = name;

            if (name != "Exhibitions") {
                $(searchbar).hide();
            } else {
                $(searchbar).show();
            }

            if (prevSelectedSetting != null) {
                $(prevSelectedSetting).css({ 'background-color': "rgb(219,217,204)" });
                $(prevSelectedSetting).attr('flagClicked', 'false');
            }

            if (name == "Artworks") {

                //   $(document.getElementsByClassName('overlayOnRoot')).fadeIn();

                $('.overlayOnRoot').show();
                LADS.Worktop.Database.getAllArtworks(getAllArtworksHelper);

                $(rightSettingsEntries).css({ 'height': '44.36%' });

                function getAllArtworksHelper(artworks) {

                    artworksList = artworks;

                    if (artworksList[0]) {
                        artworksList.sort(function (a, b) {
                            if (a.Name < b.Name) {
                                return -1;
                            } else if (a.Name > b.Name) {
                                return 1;
                            } else {
                                return 0;
                            }
                        });
                    }

                    console.log("EMPTY SETTINGS A");
                    $(middleSettings).empty();
                    $(middeLabel).text(name);

                    // bmost: hackish fix for overlays not showing up when button is clicked
                    setTimeout(function () {
                        updateMiddlePanel(name);
                        if (!showLoading) {
                            $('.overlayOnRoot').hide();
                            showLoading = false;
                        }
                    }, 1);
                    $(labelContainer).css({ 'background-color': 'white' });
                    $(labelContainer).attr('flagClicked', 'true');
                    prevSelectedSetting = labelContainer;
                    prevSelectedName = name;
                }
            }
            else if (name == "Feedback") {
                //this works BUT need to have it only appear when on feedback
                //think about how to work with clicking off of elements

                //$(feedbackComments).css({ "display": "block" });
                var feedbackDiv = document.getElementsByClassName('feedbackComments');
                $(feedbackDiv).css({ "display": "block" });
            }


            else {
                $(rightSettingsEntries).css({ 'height': '55%' });
            }


            if (name != "Feedback") {
                var feedbackDiv = document.getElementsByClassName('feedbackComments');
                $(feedbackDiv).css({
                    "display": "none"
                });

                var emailInput = document.getElementsByClassName('emailinput');
                $(emailInput).val("");

                var checkBox = document.getElementById('feedbackCheckBox');
                $(checkBox).prop('checked', 'true');
                var mediumButton = document.getElementById('mediumButton');
                $(mediumButton).prop('checked', 'true');

            }

            if (name == "Artworks")
                return;

            if (name == "Exhibitions" || name == "Tour Authoring") {
                $('.overlayOnRoot').show();
            }

            //if (name != "Artworks") {
                $(rightSettingsEntries).css({ 'height': '55%' });
                console.log("EMPTY SETTINGS B");
                $(middleSettings).empty();
                $(middeLabel).text(name);
                // bmost: hackish fix for overlays not showing up when button is clicked
                setTimeout(function () {
                    updateMiddlePanel(name);
                    if (name == "Exhibitions") {
                        $('.overlayOnRoot').hide();
                    }
                }, 1);
            //}

            $(labelContainer).css({ 'background-color': 'white' });
            $(labelContainer).attr('flagClicked', 'true');
            prevSelectedSetting = labelContainer;
            prevSelectedName = name;
            //if (name == "Exhibitions") {
            //    $('.overlayOnRoot').hide();
            //}

        };
    }




    //on selecting a settings page, this function updates the information displayed regarding that settings mode
    function updateMiddlePanel(name, flag) {
        var entries = [];
        var type = [];
        var icons = [];
        var artworkGuids = [];
        var isFirst = true;
        switch (name) {

            case "General Settings":
                entries = getGeneralSettingsOptions();
                break;
            case "Exhibitions":
                exhibitionCount = 0;
                entries = getExhibitions();
                type = "exhibition";
                break;
            case "Artworks":

                currentUploadedArtworkGuid = (!artworksList[0]) ? null : artworksList[0].Identifier;

                for (var i = 0; i < artworksList.length; i++) {
                    entries.push(artworksList[i].Name);
                    //icons.push(artworksList[i].URL);
                    icons.push(artworksList[i].Metadata.Thumbnail);
                    artworkGuids.push(artworksList[i].Identifier);
                }
                type = "Artworks";
                break;
            case "Feedback":

                var feedbackBox = document.createElement('textarea');
                $(feedbackBox).addClass('feedbackBox');
                feedbackBox.id = "feedbackBox";
                $(feedbackBox).text("Questions or comments");
                $(feedbackBox).css({
                    'position': 'absolute',
                    'left': '5%',
                    'width': '70%',
                    'height': '80%',
                    'color': 'gray',
                    'border': '3px solid gray'
                });

                //used for having text reset only once from default to inputable
                var feedbackOn = false;
                $(middleSettings).append(feedbackBox);

                feedbackBox.onclick = function () {
                    if (feedbackOn === false) {
                        feedbackOn = true;
                        $(feedbackBox).text("");
                        $(feedbackBox).css({ 'color': 'black' });
                    }
                    feedbackSelected = true;
                }
                type = "Feedback";
                break;
        }
        var i = 0;

        // if name == "Tour Authoring"
        if (name == "Tour Authoring") {
            console.log("in tour authoring, get tour");
            getTours(function (localTours) {
                type = "Tours";
                $.each(localTours, function () {
                    var label = createMiddleLabel(this + "", "Tours", "", "", tourObjects[i]);
                    // Give labels unique ids based on the tour id
                    $(label).attr('id', 'tour-' + tourObjects[i].Identifier);
                    i++;
                });
                if (tourObjects[0])
                    selectTourByGuid(tourObjects[0].Identifier);
                //edit here
                //$('#newButton').css({ 'margin-top': '-8%', 'margin-right': '-8%', 'font-size': '80%', 'height': '60%' });
                $('#newButton').show();
                $('#newButton').unbind('click').click(function () {
                    // Create new document
                    $('.overlayOnRoot').fadeIn();
                    LADS.Worktop.Database.createTour(function (newtour) {
                        getTours(function (tours) {
                            console.log("EMPTY SETTINGS C");
                            $(middleSettings).empty();
                            var i = 0;
                            $.each(tours, function () {
                                var label = createMiddleLabel(this + "", "Tours", "", "", tourObjects[i]);
                                // Give labels unique ids based on the tour id
                                $(label).attr('id', 'tour-' + tourObjects[i].Identifier);
                                i++;
                            });
                            if (newtour)
                                selectTourByGuid(newtour.Identifier);
                            $('.overlayOnRoot').fadeOut();
                        });
                    });
                });

            });
        }


        if (type != "Tours") {
            $.each(entries, function () {
                if (type == 'Artworks') {
                   // if (i < 5)
                    var label = createMiddleLabel(this + "", type, icons[i], artworkExhibition[artworkGuids[i]], artworksList[i], isFirst);
                    $(label).attr('id', 'artwork-' + artworkGuids[i]);
                    isFirst = false;
                }

                else
                    createMiddleLabel(this + "", type, flag);
                i++;
            });
        }

        if (name == "Exhibitions") {
            console.log("in exhibition get list");
            $('#newButton').show();
            $(newButton).css({ 'margin-top': '3.7%' });
            $('#newButton').unbind('click').click(function () {
                // Create new document
                var newButtonLoading = $(document.getElementsByClassName("previewContainer"));
                LADS.Util.showLoading(newButtonLoading);
                
                $('.overlayOnRoot').show();
                LADS.Worktop.Database.createNewExhibition(function () {
                    console.log("create new exhibition?");
                    reloadExhibitions(null, function () {
                        LADS.Util.hideLoading(newButtonLoading);
                        newButtonLoading.css({ 'opacity': '1' });
                        $('.overlayOnRoot').hide();
                    });
                });

                //createExhibitionContent();
            });
        }
        else if (name != "Tour Authoring") {
            console.log("HIDING NEW BUTTON");
            $('#newButton').hide();
        }

        if (name == "Artworks")
            $('#importNew').show();
        else
            $('#importNew').hide();


        // bmost: what is this?
        var hello = $(searchbar).text();
        var papa = searchbar.innerText;

        //search filtering screws up the exhibition index, disable for release
        //if (name == 'Exhibitions' && $(searchbar).text() == 'Search') {
        if (name == 'Exhibitions' && $(searchbar).text() == 'Search') {
            $(topMiddleLabelContainer).append(searchbar);
        }
        else if (name != 'Exhibitions') {
            $(searchbar).remove();
            $(searchbar).text('')
            //search();
            $(searchbar).text('Search')
            searchIndices = [];

        }
        //$('.overlayOnRoot').fadeOut();
    }


    //add div elements to contain the information in the middle panel
    function createMiddleLabel(name, type, icon, exhibition, artworkObj, isFirst) {

        var labelContainer = document.createElement('div');
        $(labelContainer).addClass('labelContainer');
        $(labelContainer).css({
            'top': '1%',
            'position': 'relative',
            'width': '96%',
            'margin-bottom': '2%',
            'height': '7%',
            'left': '2%'
        });
        $(labelContainer).attr('flagClicked', 'true');
        $(middleSettings).append(labelContainer);

        var imgWidth = 0;
        if (type === 'Artworks') {
            var containerHeight = $(labelContainer).height();
            var containerWidth = $(labelContainer).width();
            var ratio = 1.564;
            var imgHeight = containerHeight * .80;
            imgWidth = imgHeight * ratio

            $(labelContainer).css({ 'height': '11%' });
            var imageThumbnail = document.createElement('img');
            $(imageThumbnail).attr('src', icon);
            $(imageThumbnail).css({
                'height': imgHeight + 'px',
                'width': imgWidth + 'px',
                'top': '20%', // 7
                'position': 'relative',
                'overflow': 'hidden',
                'float': 'left',
                'left': '5%'
            });

            if (isFirst)
                $('.overlayOnRoot').fadeOut();
            // add spinning circle for each image thumbnail
            var progressCircCSS = { "position": 'absolute', 'z-index': '50', 'height': 'auto', 'width': '10%', 'left': '5%', 'top': '20%' };
            var centerHor = '0px';
            var centerVert = '0px';
            var circle = LADS.Util.showProgressCircle($(labelContainer), progressCircCSS, centerHor, centerVert, false);
            $(imageThumbnail).load(function () {

                LADS.Util.removeProgressCircle(circle);
            });

            $(labelContainer).append(imageThumbnail);

            var numExhibitionLabel = document.createElement('div');
            //  if (exhibition.length == 1)
            //      $(numExhibitionLabel).text(exhibition.length + " Exhibition");
            //  else
            //      $(numExhibitionLabel).text(exhibition.length + " Exhibitions");

            $(numExhibitionLabel).css({ 'position': 'absolute', 'float': 'right', 'font-size': '130%', 'top': '52%', 'right': '37%' });
        }

        var label = document.createElement('div');
        $(label).addClass('label');

        var labelleft = (type === 'Artworks') ? 10 : 5;
        var labelTop = (type === 'Artworks') ? 20 : 5;

        var textWidth = $('.labelContainer').width() - $('.labelContainer').width() * 0.14 - imgWidth;
        if (textWidth === 0) { // Hack to keep things working before loading
            textWidth = 350;
        }
        $(label).css({
            'top': labelTop + "%",
            'position': 'relative',
            'left': labelleft + '%',
            'font-size': '185%',
            'color': 'black',
            'height': '100%', //100
            'width': textWidth + 'px',
            'float': 'left',
            //'white-space': 'no-wrap',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
        });

        $(label).text(name);
        $(label).attr('text', name);

        $(labelContainer).append(label);

        var exhibitionNumber = exhibitionCount;

        $(labelContainer).attr('flagClicked', 'false');
        labelContainer.onmousedown = function () {
            if (name == "Password Settings") {
                return;
            }
            $(labelContainer).css({ 'background-color': 'white' });
        };
        labelContainer.onmouseleave = function () {
            if ($(this).attr('flagClicked') == 'false')
                $(this).css({ 'background-color': 'transparent' });

        }
        if (name == "Password Settings") {
            $(label).css('color', 'gray');
        }
        labelContainer.onclick = function () {
            if (name == "Password Settings") {
                return;
            }
            if (middlePrevSelectedSetting == labelContainer) {
                return;
            }

            if (middlePrevSelectedSetting != null) {
                $(middlePrevSelectedSetting).css({ 'background-color': "rgb(219,217,204)" });

            }

            middlePrevSelectedSetting = labelContainer;
            $(middlePrevSelectedSetting).attr('flagClicked', 'true');
            middlePrevSelectedSettingText = label;

            $(rightSection).empty();
            $(rightSettings).empty();
            $(rightSettingsEntries).empty();
            $(rightSettingsFields).empty();
            $(rightSettingsLabels).empty();

            if (name == "Splash Screen") {
                createSplashScreenContent();
                $('.overlayOnRoot').fadeOut();
            }

            if (name == "Password Settings") {
                createPasswordSettingsContent();
            }

            else if (type == "exhibition") {
                //$('.overlayOnRoot').fadeIn();

                exhibitionCount = exhibitionNumber;

                //setTimeout(function () {
                    createExhibitionContent(name);
                //}, 1);

                LADS.Worktop.Database.getDoqXML(exhibitionGuids[currentExhibitionNumber], function (xml) {
                    var parser = new DOMParser();
                    currentExhibitionXML = parser.parseFromString(xml, 'text/xml');
                });
                //$('.overlayOnRoot').fadeOut();
                
            }
            else if (type == "Artworks") {
                createArtworkContent(artworkObj);
                currentArtwork = artworkObj;
                changeArtworkPreview();
            }
            else if (type === "Tours") {
                // temp name hack
                for (var i = 0; i < tourObjects.length; i++) {
                    if (tourObjects[i].Identifier == artworkObj.Identifier) {
                        currentTour = tourObjects[i]
                        break;
                    }
                }
                createTourContent();
                $('.overlayOnRoot').fadeOut();
            }
            //TODO: add other generators for content
            $(labelContainer).css({ 'background-color': 'white' });
        };

        if (type == 'Artworks') {
            $(labelContainer).append(numExhibitionLabel);

            if (currentUploadedArtworkGuid == artworkObj.Identifier)
                $(labelContainer).click();

        }

        if (name == "Splash Screen" || (name == getExhibitions()[0] && icon != "search")) {
            //|| name == getArtworks()[0]
            $(labelContainer).click();
        }

        //increment the total number of exhibitions if we created a new exhibition
        if (type == "exhibition") {
            exhibitionCount++;
        }

        // Return the labelContainer so it can be modified
        return labelContainer;
    }


    function createExhibitionContent() {
        createPreviewScreen('Exhibitions');
        createModifyContent();
        insertNameOfSetting();

        if (exhibitionCount == null)
            exhibitionCount = 0;

        var currentExhibit = exhibitions[exhibitionCount];
        insertSetting('Exhibition Name', 'textarea', null, currentExhibit.Name);
        insertSetting('Subheading 1', 'textarea', null, currentExhibit.Metadata.Subheading1);
        insertSetting('Subheading 2', 'textarea', null, currentExhibit.Metadata.Subheading2);
        insertSetting('Exhibition Description', 'textarea', null, currentExhibit.Metadata.Description);
        insertSetting('Exhibition Background Image', 'file', null, 'Change Background Image', 'bgimage');
        //insertSetting('Exhibition Background Size', 'dropdown', null, null, 'bgimage'); // not hooked up to the server, disable for release
        insertSetting('Exhibition Preview Image', 'file', null, 'Change Image', 'descriptionimg1');
       // insertSetting('Exhibition Description Image 2', 'file', null, 'Change Image', 'descriptionimg2');


        //This section has only the real modifiers. It has not headers nor the save button. 
        $(rightSettingsEntries).attr('id', 'pureSettings');

        $(rightSettings).append(rightSettingsEntries);
        $(rightSection).append(rightSettings);

        $(rightSection).attr('id', 'parentSetting');


    }


    function createArtworkContent(artworkObj) {
        createPreviewScreen('Artworks');
        createModifyContent();
        insertNameOfSetting();
        insertSetting('Title', 'blank', null, artworkObj.Name);
        insertSetting('Artist', 'blank', null, artworkObj.Metadata.Artist);
        insertSetting('Year', 'blank', null, artworkObj.Metadata.Year);
        //insertSetting('Medium', 'blank', null, artworkObj.Metadata.Medium);
        //removing location because it now contains the json text for image locations and should not be displayed
        //insertSetting('Location', 'blank', null, artworkObj.Metadata.Location);
        //insertSetting('Accession Number', 'blank');

        var editExhibitionsLabel = document.createElement('label');
        $(editExhibitionsLabel).css({ 'font-size': '200%', 'color': 'black' });
        $(editExhibitionsLabel).text('Exhibitions');


        var editExhibitionsButton = document.createElement('button');
        $(editExhibitionsButton).css({ 'border-color': 'black', 'color': 'black', 'position': 'relative', 'left': '5%' });
        $(editExhibitionsButton).text('Add to Exhibition');

        var editExhibitionsOverlay = LADS.Util.UI.blockInteractionOverlay();
        root.append(editExhibitionsOverlay);

        var editExhibitionsBox = document.createElement('div');

        $(editExhibitionsBox).addClass("editExhibitionsBox");
        $(editExhibitionsBox).css({
            'height': '70%',
            'width': '30%',
            'position': 'absolute',
            'top': '15%',
            'left': '34%',
            'background-color': 'black',
            'z-index': '10000',
            'border': '3px double white',
            'padding': '1.5%',
        });

        //sets minimum width of editexhibitionsbox
        if ($(root).width() * .3 < 450) {
            $(editExhibitionsBox).css({ width: '450px', });
        }

        var infoLabel = document.createElement('div');
        $(infoLabel).addClass("infoLabel");
        $(infoLabel).css({
            'width': '100%',
            'color': 'white',
            'font-size': '200%',
            'margin-bottom': '2%'
        });
        $(infoLabel).text('Choose the exhibitions you wish to link this artwork to.');

        var exhibitionsList = document.createElement('div');
        $(exhibitionsList).addClass("exhibitionsList");
        $(exhibitionsList).css({
            'width': '100%',
            'height' : '75%',
            'overflow': 'auto'
        });

        function exhibitionPicker(artworkObj) {
            exhibitionByGuid;
            artworkObj;
            var xml = LADS.Worktop.Database.getDoqXML(currentArtwork.Identifier);
            var parser = new DOMParser();
            var artworkXML = parser.parseFromString(xml, 'text/xml');
            exhibitionCBArray = [];
            var currentExhibitions = [];
            var exhibitionLabelArray = [];

            for (var i = 0; i < artworkXML.getElementsByTagName('FolderId').length; i++) {
                var exhib_id = artworkXML.getElementsByTagName('FolderId')[i].textContent;
                if (exhibitionByGuid[exhib_id] == undefined) {
                    artworkFolderId = exhib_id;
                } else {
                    currentExhibitions.push(exhib_id);
                }
            }

            for (var i = 0; i < exhibitions.length; i++) {
                var exhibitionLabelWrapper = document.createElement('div');
                var exhibitionCB = document.createElement('input');
                exhibitionCB.type = "checkbox";
                $(exhibitionCB).addClass("exhibitionCB");
                $(exhibitionCB).css({
                    float: 'right',
                    'margin-right': '20px',
                });
                exhibitionCB.name = "exhibitions";
                exhibitionCB.value = exhibitions[i].Identifier;
                if (currentExhibitions.indexOf(exhibitionCB.value) > -1) {
                    exhibitionCB.checked = true;
                };
                var exhibitionLabel = document.createElement('div');
                $(exhibitionLabel).css({
                    width: '80%',
                    color: 'white',
                    'font-size': '180%',
                });
                $(exhibitionLabel).text(exhibitions[i].Name);
                var exhibitionObject = exhibitions[i];

                $(exhibitionLabelWrapper).append(exhibitionCB);
                $(exhibitionLabelWrapper).append(exhibitionLabel);
                exhibitionLabelArray.push(exhibitionLabelWrapper);
                exhibitionCBArray.push(exhibitionCB);
            }
            $(exhibitionsList).empty();
            for (var i = 0; i < exhibitionLabelArray.length; i++) {
                $(exhibitionsList).append(exhibitionLabelArray[i]);
                $(exhibitionsList).append("<hr>");
            }
        }

        function readExhibitionCB() {
            var selectedExhibitions = [];
            for (var i = 0; i < exhibitionCBArray.length; i++) {
                if (exhibitionCBArray[i].checked === true) {
                    selectedExhibitions.push(exhibitionCBArray[i].value);
                }
            }
            selectedExhibitions.push(artworkFolderId);
            return selectedExhibitions;
        }


        var confirmationButtonDiv = document.createElement('div');
        $(confirmationButtonDiv).addClass("confirmationButtonDiv");
        $(confirmationButtonDiv).css({
            'width': '100%',
            'height': '10%',
        });
        var saveConfirmationButton = document.createElement('button');
        $(saveConfirmationButton).addClass('cancelConfirmationButton');
        $(saveConfirmationButton).css({ 'font-size': '140%', 'margin-left': '4%', 'float': 'right' });
        $(saveConfirmationButton).text('Save');
        var cancelConfirmationButton = document.createElement('button');
        $(cancelConfirmationButton).addClass('cancelConfirmationButton');
        $(cancelConfirmationButton).css({ 'font-size': '140%', 'margin-left': '2%', 'float': 'right' });
        $(cancelConfirmationButton).text('Cancel');


        cancelConfirmationButton.onclick = function () {
            $(editExhibitionsOverlay).fadeOut();
            editExhibitionCurrentSelected = null;
            if (prevSelectedExhibition != null)
                $(prevSelectedExhibition).css({ 'background-color': 'black', 'color': 'white' });

        }

        saveConfirmationButton.onclick = function () {

            $(editExhibitionsOverlay).fadeOut();
            // actually link the exhibitions
            var selectedExhibitions = readExhibitionCB();
            var creatorId = currentArtwork.CreatorID;

            var xml = LADS.Worktop.Database.getDoqXML(currentArtwork.Identifier);
            var parser = new DOMParser();
            var artworkXML = parser.parseFromString(xml, 'text/xml');
            //add artwork folder
            artworkXML.getElementsByTagName("_Folders")[0].childNodes[0].childNodes[0].textContent = creatorId;
            artworkXML.getElementsByTagName("_Folders")[0].childNodes[0].childNodes[1].textContent = selectedExhibitions[0];

            //delete old folders
            for (var i = 1; i < artworkXML.getElementsByTagName("FolderData").length; i++) {
                var y = artworkXML.getElementsByTagName("FolderData")[i];
                artworkXML.getElementsByTagName("_Folders")[0].removeChild(y);
            }

            //add remaining exhibitions
            for (var i = 1; i < selectedExhibitions.length; i++) {
                var node = artworkXML.getElementsByTagName("FolderData")[0];
                var newNode = node.cloneNode(true);
                //clones first node
                artworkXML.getElementsByTagName("_Folders")[0].appendChild(newNode);
                //edits info
                artworkXML.getElementsByTagName("_Folders")[0].childNodes[i].childNodes[0].textContent = creatorId;
                artworkXML.getElementsByTagName("_Folders")[0].childNodes[i].childNodes[1].textContent = selectedExhibitions[i];

            }

            //printExhibitions(artworkXML);

            LADS.Worktop.Database.pushXML(artworkXML, currentArtwork.Identifier, "Artwork");
        }

        function printExhibitions(artxml) {
            for (var i = 0; i < artxml.getElementsByTagName('FolderId').length; i++) {
                console.log(artxml.getElementsByTagName('FolderId')[i].textContent);
            }
        }

        $(confirmationButtonDiv).append(cancelConfirmationButton);
        $(confirmationButtonDiv).append(saveConfirmationButton);



        $(editExhibitionsBox).append(infoLabel);
        $(editExhibitionsBox).append(exhibitionsList);
        $(editExhibitionsBox).append(confirmationButtonDiv);


        $(editExhibitionsOverlay).append(editExhibitionsBox);

        editExhibitionsButton.onclick = function () {
            exhibitionPicker(currentArtwork);
            $(editExhibitionsOverlay).fadeToggle();
        };

        //This section has only the real modifiers. It has not headers nor the save button. 
        $(rightSettingsEntries).attr('id', 'pureSettings');
        $(rightSettingsEntries).css({
            'height': '44.36%',
            'margin-bottom': '3%'
        });

        $(rightSettings).append(rightSettingsEntries);
        $(rightSettings).append(editExhibitionsLabel);
        $(rightSettings).append(editExhibitionsButton);

        $(rightSection).append(rightSettings);

    }

    function makeMiddleSection(type) {

        $(middleSection).css({ 'width': '25%', 'height': '100%', 'z-index': '100', 'position': 'relative', 'left': '0%', 'background-color': "rgb(219,217,204)", 'float': 'left' });

        topMiddleLabelContainer = document.createElement('div');
        $(topMiddleLabelContainer).css({ 'top': '5%', 'position': 'relative', 'width': '100%', 'margin-bottom': '0' });


        $(middeLabel).css({ 'top': '5%', 'position': 'relative', 'float': 'left', 'left': '10%', 'font-size': '300%', 'color': 'black', 'width': '100%', 'font-weight': '500' });


        $(middeLabel).text(currentSetting);

        LADS.Util.fitText(middeLabel, 1.1);

        var newButton = $(document.createElement('button'));
        newButton.css({ 'float': 'left', 'color': 'black', 'border-color': 'black', 'min-width': '15%', 'position': 'absolute', 'left': '75%', 'margin-top': '3.7%' });
        newButton.text('New');
        newButton.attr('id', 'newButton');

        newButton.click(function () {
            // Create new document
            //LADS.Worktop.Database.createNewExhibition(function () { reloadExhibitions(); });
            console.log("new button created");
            //createExhibitionContent();
        });

        var importNewButton = $(document.createElement('button'));
        importNewButton.css({ 'float': 'right', 'color': 'black', 'border-color': 'black', 'min-width': '27%', 'position': 'absolute', 'left': '65%', 'margin-top': '3.7%' }); //left 67
        importNewButton.text('Import New');
        importNewButton.attr('id', 'importNew');

        // ARTWORK UPLOAD
        importNewButton.click(function () {
            var newName;
            LADS.Authoring.FileUploader(
                root,
                LADS.Authoring.FileUploadTypes.DeepZoom,
                // local callback - get filename
                function (file, localURL) {
                    newName = file.displayName;
                },
                // remote callback - save correct name
                function (url) {
                    $('.overlayOnRoot').show();
                    LADS.Worktop.Database.setArtworkDirty();
                    var check=0;
                    while (!check) {
                        console.log("checking for valid xml in file uploader response");
                        try {
                            newDoq = new Worktop.Doq(url);
                            check = 1;
                        }
                        catch (err) {
                            console.log("error in uploading, trying again: " + err.message);
                        }
                    }
                    LADS.Worktop.Database.getDoqXML(newDoq.Identifier, function (xml) {
                        var parser = new DOMParser(),
                            artXML = $(parser.parseFromString(xml, 'text/xml'));
                        artXML.find('Name').text(LADS.Util.encodeText(newName));
                        LADS.Worktop.Database.pushXML(artXML[0], newDoq.Identifier, "Artwork",
                            function () {
                                reloadArtworks(function () {
                                    $('.overlayOnRoot').hide();
                                });
                            });
                    });
                },
                ['*'], // TODO: what image types does this take?
                false, // show thumbnails, this is artwork!
                null, // error callback
                true // multiple file upload enabled
                );
        });



        $(middleSettings).css({ 'height': '80.5%', 'width': '100%', 'overflow-y': 'auto', 'position': 'relative', 'top': '6.5%' }); //top 4
        $(middleSettings).attr('id', 'middleSettingsLabelContainer');

        $(topMiddleLabelContainer).append(middeLabel);

        $(topMiddleLabelContainer).append(newButton);
        newButton.hide();
        $(topMiddleLabelContainer).append(importNewButton);

        LADS.Util.fitText(importNewButton, .6);

        importNewButton.hide();


        searchbar.onclick = function () {
            if ($(searchbar).text() == 'Search')
                $(searchbar).text('');
        };

        searchbar.onblur = function () {
            if ($(searchbar).text() == '')
                $(searchbar).text('Search');
        };

        searchbar.onkeyup = function () {

            search();
            console.log("EMPTY SETTINGS D");
            $(middleSettings).empty();
            updateMiddlePanel('Exhibitions', 'search');
        };

        $(topMiddleLabelContainer).addClass('topMiddleLabelContainer');
        $(middleSettings).addClass('middleSettings');
        $(middleSection).addClass('middleSettings');
        $(middleSection).append(topMiddleLabelContainer);
        $(middleSection).append(middleSettings);
        mainPanel.append(middleSection);
    }


    //function that filters results based on the search bar content
    function search() {
        var itemsToSearch = exhibitionNames;
        exhibitionfilter = [];
        searchIndices = [];
        $.each(itemsToSearch, function (i) {
            if ((this.toLowerCase()).indexOf($(searchbar).text().toLowerCase()) != -1) {
                exhibitionfilter.push(this);
                searchIndices.push(i);
            }
        });

        //TODO: add artworks search
    }

    function createTourContent() {
        createPreviewScreen('Tour');
        createModifyContent();
        insertNameOfSetting();

        insertSetting('Tour Name', 'textarea', null, currentTour.Name);
        insertSetting('Tour Description', 'textarea', null, currentTour.Metadata.Description);

        $(rightSettings).append(rightSettingsEntries);
        $(rightSection).append(rightSettings);

        $(rightSection).attr('id', 'parentSetting');
    }

    function makeRightSection() {
        $(rightSection).css({ 'width': '50%', 'height': '100%', 'position': 'relative', 'left': '0%', 'float': 'left' });
        $(rightSettings).css({ 'height': '50%', 'width': '100%', 'position': 'relative', "background-color": "rgb(219,217,204)", "left": "5.5%" });
        $(rightSettingsEntries).css({ 'width': '90%', 'height': '61%', 'position': 'relative', 'overflow': 'auto', 'top': '4%' });
        mainPanel.append(rightSection);
    }

    //generates splash screen settings
    function createSplashScreenContent() {



        createPreviewScreen(null, function () {
            createModifyContent();
            insertNameOfSetting();
            insertSetting('Background Image', 'file', null, 'Change Image', 'background');
            //insertSetting('Background Size', 'dropdown', null, null, 'background'); //not hooked up to the server, disable for release
            insertSetting('Overlay Color', 'colorpicker', null);
            insertSetting('Overlay Transparency', 'number', null, LADS.Worktop.Database.getOverlayTransparency(), 'overlayTrans');
            insertSetting('Museum Name', 'textarea', null, LADS.Worktop.Database.getMuseumName());
            insertSetting('Museum Location', 'textarea', null, LADS.Worktop.Database.getMuseumLoc());
            insertSetting('Museum Info', 'textarea', null, LADS.Worktop.Database.getMuseumInfo());
            insertSetting('Museum Logo', 'file', null, 'Change Logo', 'logo');
            insertSetting('Museum Logo Background color', 'colorpicker', null);

            //This section has only the real modifiers. It has not headers nor the save button. 
            $(rightSettingsEntries).attr('id', 'pureSettings');

            $(rightSettings).append(rightSettingsEntries);
            $(rightSection).append(rightSettings);
            if (backButtonType == 'Artworks' || backButtonType == 'Tours') {
                backButtonType = null;
                settingsViewCallback(that);
            }
        });
    }

    function createPasswordSettingsContent() {
        
        passwordcontent = true;
        insertSetting('', 'blank', null);
        insertSetting('', 'blank', null);
        insertSetting('', 'blank', null);
        insertSetting('', 'blank', null);
        insertSetting('Current password', 'password', null);
        insertSetting('New password', 'password', null);
        insertSetting('Confirm password', 'password', null);
        $(rightSettingsEntries).css('height', '80%');
        $(rightSettings).append(rightSettingsEntries);
        createModifyContent();
        $(rightSection).append(rightSettings);
        passwordcontent = false;
    }


    // RYAN - Moved into FileUploader
    function uploadFile(id, type) {
        //  var filePicker = new Windows.Storage.Pickers.FileOpenPicker();
        filePicker.fileTypeFilter.replaceAll(["*"]);

        filePicker.pickSingleFileAsync().then(function (file) {
            if (!file) {
                //printLog("No file selected");
                return;
            }

            var upload = new UploadOp();
            //  var uriString = document.getElementById("serverAddressField").value;
            //deep zoom creation

            if (type === "Standard")
                var uriString = LADS.Worktop.Database.getURL() + "/?Type=FileUpload&Client=Windows";
            else if (type === "Deepzoom")
                var uriString = LADS.Worktop.Database.getURL() + "/?Type=FileUploadDeepzoom&Client=Windows&Guid=" + LADS.Worktop.Database.getCreatorID();


            //var uriString = Worktop.Database.getURL() + "/?Type=FileUpload&Client=Windows";
            upload.start(uriString, file);

            // Store the upload operation in the uploadOps array.
            //    uploadOperations.push(upload);

            var objectUrl = window.URL.createObjectURL(file, { oneTimeOnly: true });

            if (id === 'background' || id === 'bgimage') {
                //set background image and dropdown menu that selects background size
                $('#' + id).css({
                    'background-image': 'url("' + objectUrl + '")',
                    'background-size': 'cover',
                });
                //related to background-size, disabled for release
                //$('#select')[0].selectedIndex = 0;
                //$('#select').change();
                if (id == 'background')
                    mainSettings["Background Image"] = file.path;

            } else if (id == 'logo') {
                //set image source
                $('#' + id)[0].src = objectUrl;
            }
        });

    }
    // RYAN - end of move




    /* 
    Generator for settings content.

    labelName: Name of the setting
    type: Chooses the type of setting
    clickFunction: function that activates onclick
    text: text that goes into buttons
    id: id of the element that will be manipulated (used for type == 'file' or 'dropdown')

    */
    function insertSetting(labelName, type, clickFunction, text, id) {
        //This new variable give the settings section a new structure containing on the left side the lable and on the right the fields.
        var rightSettingsSection = document.createElement('div');
        $(rightSettingsSection).css({
            'width': '100%',
            'clear': 'both',
            'margin-bottom': '3%',
            'float': 'left'
        });

        var label = document.createElement('div');
        $(rightSettingsSection).append(label);
        $(label).attr('class', 'setting_name');
        $(label).css({ 'font-size': '150%', 'float': 'left' });
        if (!passwordcontent) {
            $(label).css({ 'font-style': 'italic', 'width': '50%' });
        }
        else {
            $(label).css({ 'width': '35%' });
        }
        $(label).text(labelName);
        var itemContainer = document.createElement('div');

        $(itemContainer).css({'float': 'left' });
        if (!passwordcontent) {
            $(itemContainer).css({ 'width': '50%' });
        }
        else {
            $(itemContainer).css({ 'width': '65%' });
        }
        switch (type) {

            case "file":

                var item = document.createElement('div');
                var selectButton = document.createElement('button');
                $(selectButton).text(text);
                $(selectButton).css({ 'color': 'black', 'border-color': 'black', 'margin-left': '4.5%' });

                $(item).append(selectButton);

                //add event listener for file event
                //file.onchange = handleFileSelect(id);
                selectButton.onclick = function () {
                    currentUpload = labelName;
                    uploadFile(id, "Standard");
                };

                break;
            case "dropdown":
                var item = document.createElement('form');
                $(item).css({ 'width': '60%' });
                var select = document.createElement('select');
                $(select).css({ 'border-color': 'gray', 'color': 'gray' });
                $(select).attr('id', 'select');
                var optionArr = ['cover', '100% 100%', 'contain', 'auto'];
                for (var i = 0, option; option = optionArr[i]; i++) {
                    opt = document.createElement('option');
                    $(opt).attr('value', option);
                    $(opt).html(option);
                    $(select).append(opt);
                }

                //add event listener for dropdown menu
                select.onchange = function () {
                    $('#' + id).css('background-size', select.options[select.selectedIndex].text + '');
                };
                $(item).append(select);
                break;
            case "password":
                var item = document.createElement('input');
                $(item).attr('type', "password");
                $(item).attr('id', labelName);
                $(item).css({ 'border-color': 'gray', 'color': 'black', 'min-width': '95%' });
                $(item).css({ 'height': '2px'});
                break;

            case "textarea":
                var item = document.createElement('textarea');
                ////$(item).autoGrow();
                $(item).attr('class', 'text_displayed');
                $(item).css({ 'border-color': 'gray', 'color': 'gray', 'min-width': '80%', 'margin-left':'4.5%' });
                $(item).text(text);

                if (labelName === 'Museum Name') {
                    //update museum name when typing
                    item.onkeyup = changeText('museumName', item);
                    $(item).attr('maxlength', 40);
                } else if (labelName === 'Museum Location') {
                    //update museum subtitle when typing
                    item.onkeyup = changeText('subheading', item);
                    $(item).attr('maxlength', 45);
                } else if (labelName === 'Museum Info') {
                    //update museum info when typing                    
                    item.onkeyup = changeText('museumInfo', item);
                    $(item).attr('maxlength', 1174, item);
                } else if (labelName === 'Exhibition Name') {
                    item.onkeyup = changeText('exhibition-title', item);
                    $(item).attr('id', "exhibition-title-settings-editor");
                    $(item).attr('maxlength', 24);
                    var default_value = item.value;
                    $(item).focus(function () {
                        if (this.value == "Exhibition") {
                            this.value = '';
                        }
                    });
                    $(this).blur(function () {
                        if (this.value == '') {
                            this.value = default_value;
                        }
                    });
                }
                else if (labelName === 'Subheading 1') {
                    item.onkeyup = changeText('exhibition-subtitle-1', item);
                    $(item).attr('id', "exhibition-subtitle-1-settings-editor");
                    $(item).attr('maxlength', 53);
                    var default_value = item.value;
                    $(item).focus(function () {
                        if (this.value == "First Subheading") {
                            this.value = '';
                        }
                    });
                    $(this).blur(function () {
                        if (this.value == '') {
                            this.value = default_value;
                        }
                    });
                }
                else if (labelName === 'Subheading 2') {
                    item.onkeyup = changeText('exhibition-subtitle-2', item);
                    $(item).attr('id', "exhibition-subtitle-2-settings-editor");
                    $(item).attr('maxlength', 70);
                    var default_value = item.value;
                    $(item).focus(function () {
                        if (this.value == "Second Subheading") {
                            this.value = '';
                        }
                    });
                    $(this).blur(function () {
                        if (this.value == '') {
                            this.value = default_value;
                        }
                    });
                }
                else if (labelName === 'Exhibition Description') {
                    item.onkeyup = changeText('description-text', item);
                    $(item).attr('id', "description-text-settings-editor");
                    $(item).attr('maxlength', 1790);
                    $(item).focus(function () {
                        if (this.value == "Description") {
                            this.value = '';
                        }
                    });
                    $(this).blur(function () {
                        if (this.value == '') {
                            this.value = default_value;
                        }
                    });
                } else if (labelName === "Tour Name") {
                    $(item).attr('maxlength', 120);
                }
                // change text to default when no edition happened
                $(item).each(function () {
                    var default_value = this.value;
                    $(this).focus(function () {
                        if (this.value == "Untitled Tour"||this.value=="Tour Description") {
                            this.value = '';
                        }
                    });
                    $(this).blur(function () {
                        if (this.value == '') {
                            this.value = default_value;
                        }
                    });
                });

                //This next part makes the size adapt to the size of the text inserted
                item.addEventListener('DOMNodeInserted', function () {
                        var realHeight = item.scrollHeight;
                        $(item).css('height', realHeight + 'px');
                        $(item).autoSize();
                     });
    
                break;
            case "colorpicker":
                var item = document.createElement('input');
                $(item).attr('class', 'color');

                if (item.addEventListener) {
                    item.addEventListener('DOMNodeInserted', function () {

                        //initialize colorpicker object on current element
                        var myPicker = new jscolor.color(item, {});
                        if (labelName == 'Overlay Color') {
                            var infoDiv = $('.infoDiv');
                            if (infoDiv.length > 0) {
                                //initialize colorpicker value to be the current background color of the overlay
                                var color = infoDiv.css('background-color');
                                var hex = LADS.Util.UI.colorToHex(color);
                                $(item).val(hex);
                                $(item).css('margin-left', '4.5%');
                                myPicker.fromString(hex);

                                //set event handler to change overlay color as user manipulates the colorpicker
                                myPicker.onImmediateChange = function () { infoDiv.css('background-color', LADS.Util.UI.hexToRGB(item.value) + $('#overlayTrans').val() / 100.0 + ')') };
                            } else {
                                console.log("$('.infoDiv') length = 0");
                            }

                            //change text to default value when no edition
                            $('#overlayTrans').each(function () {
                                var default_value = this.value;
                                $(this).focus(function () {
                                    if (this.value == default_value) {
                                        this.value = '';
                                    }
                                });
                                $(this).blur(function () {
                                    if (this.value == '') {
                                        this.value = default_value;
                                    }
                                });
                            });

                        } else if (labelName == 'Museum Logo Background Color') {
                            var logoContainer = $('.logoContainer');
                            if (logoContainer.length > 0) {
                                //initialize colorpicker value to be the current background color of the museum logo
                                var color = $('.logoContainer').css('background-color');
                                var hex = LADS.Util.UI.colorToHex(color);
                                $(item).val(hex);
                                myPicker.fromString(hex);

                                //set event handler to change museum logo background color as user manipulates the colorpicker
                                myPicker.onImmediateChange = function () {
                                    $('#logoContainer').css('background-color', '#' + item.value);
                                };
                            } else {
                                console.log("$('.logoContainer') length = 0");
                            }
                        }
                    }, false);
                }

                break;
            case "blank":
                var item = document.createElement('p');
                $(item).text(text);
                // $(item).attr('id', 'slider');
                $(item).css({
                    'font-size': '135%',
                    'word-wrap': 'break-word',
                    'padding-right': '4%',
                    'margin': '0%'
                });
                //if (item.addEventListener) {
                //     item.addEventListener('DOMNodeInserted', setSlider, false);
                // }

                break;
            case "number":
                var item = document.createElement('textarea');
                //$(item).attr('class', 'text_displayed');
                $(item).attr('id', id);
                $(item).css({ 'border-color': 'gray', 'margin-left': '4.3%', 'color': 'gray', 'min-width': '20%' });
                $(item).text(parseFloat(text) * 100);//(text)
                $(item).numeric();
                $(item).autoSize();
                item.onkeyup = function () {
                    var num = parseInt($('#' + id).val());
                    num = (num > 100) ? 100 : num;
                    num = (num < 0) ? 0 : num;
                    if (!isNaN(num))
                        $(item).text(num);

                    var color = $('.infoDiv').css('background-color');
                    var idx = color.lastIndexOf(',') + 1;
                    alpha = color.substring(idx, color.lastIndexOf(')'));

                    color = $('.infoDiv').css('background-color');
                    idx = color.lastIndexOf(',') + 1;
                    alpha = color.substring(idx, color.lastIndexOf(')'));
                    $('.infoDiv').css('background-color', color.substring(0, idx) + num / 100.0 + ')');
                }
                break;
                //doesn't handle touch, useless
            case "slider": //jquery UI slider
                var item = document.createElement('div');
                $(item).attr('id', 'slider');
                $(item).css({ 'border-botton': '5em', 'width': '60%', 'float': 'left', 'top': '30%' });
                if (item.addEventListener) {
                    item.addEventListener('DOMNodeInserted', setSlider, false);
                }

                //slider value display
                var display = document.createElement('div');
                $(display).css({ 'width': '10%', 'float': 'left', 'height': '100%', 'margin-left': '6%', 'position': 'relative', 'top': '17%', 'font-weight': 'bold' });

        }
        mainSettings[labelName] = item;

        $(itemContainer).append(item);
        $(rightSettingsSection).append(itemContainer);

        if (display != null) {
            $(itemContainer).append(display);
        }
        //At this point the larger div appends each new section.
        $(rightSettingsEntries).append(rightSettingsSection);

        //function that sets images
        function handleFileSelect(target) {

            //closure to get the event while keeping the parameters of this function
            return function (evt) {
                var files = evt.target.files; // FileList object

                // Loop through the FileList and render image files as thumbnails.
                for (var i = 0, f; f = files[i]; i++) {

                    // Only process image files.
                    if (!f.type.match('image.*')) {
                        continue;
                    }

                    var reader = new FileReader();
                    // Read in the image file as a data URL.
                    reader.readAsDataURL(f);

                    // Closure to capture the file information.
                    reader.onload = (function (theFile) {
                        return function (e) {
                            if (id == 'background') {
                                $('#' + id).css({
                                    'background': 'url(' + e.target.result + ')',
                                    width: '100%',
                                });
                                //related to background-size, disabled for release
                                //$('#select')[0].selectedIndex = 0;
                                //$('#select').change();
                                mainSettings["Background Image"] = e.target.result;
                            } else if (id == 'logo') {
                                $('#' + id).attr('src', e.target.result);
                            }
                        };
                    })(f);
                }
            }
        }

        // function to initialize jquery ui slider within the settings page
        function setSlider() {
            $(item).ready(function () {
                var color = $('.overlay').css('background-color');
                var idx = color.lastIndexOf(',') + 1;
                alpha = color.substring(idx, color.lastIndexOf(')'));
                $(item).slider({
                    min: 0,
                    max: 1,
                    step: 0.01,
                    value: alpha,
                    slide: function (event, ui) {
                        color = $('.overlay').css('background-color');
                        idx = color.lastIndexOf(',') + 1;
                        alpha = color.substring(idx, color.lastIndexOf(')'));
                        $('.overlay').css('background-color', color.substring(0, idx) + ui.value + ')');
                        $(display).html(Math.round(ui.value * 100) + '%');
                    },
                    create: function (event, ui) {
                        $(display).html(Math.round(alpha * 100) + '%');
                    }
                });
            });

        }

        //function that when bind to an event, changes the element with the specified id to have the same text as the element the event originated from
        var nameDivSize;
        var nameSpanSize;
        var fontSizeSpan;
        var fontSizeArray;
        var fontSize;
        var divHeight;
        var spanHeight;
        var spanScrollHeight;
        function changeText(id, item) {
            return function (evt) {

                $('#' + id).html(evt.target.textContent.replace(/\n\r?/g, '<br />'));
                if ($(item).attr('maxlength') == item.value.length) {
                    $(characterLimitLabel).show();
                    setTimeout(function () {
                        $(characterLimitLabel).hide();
                    }, 3000);
                }
                //write fittext constraints below for the individual elements

                switch (id) {
                    case 'museumInfo':
                        var subheadingFont = parseInt($('#subheading').css('font-size'));
                        LADS.Util.UI.fitTextInDiv($('#' + id), Math.round(subheadingFont * 2 / 3), Math.round(subheadingFont * 1 / 3));
                        break;



                    case 'museumName':

                        /*
                        fontSizeDiv = $('#museumName').css('font-size');
                        fontSizeDiv = fontSizeDiv[0].splice(2, 2);
                        fontSizeSpan = $('#nameSpan').css('font-size');*/
                        //$(museumNameSpan).css('font-size', nameDivSize + 'px');
                        fontSizeSpan = $('#museumName').css('font-size');
                        fontSizeArray = fontSizeSpan.split("px");
                        fontSize = fontSizeArray[0];
                        spanHeight = $('#museumName').height();
                        divHeight = $('#divName').height();
                        while (spanHeight > divHeight) {
                            fontSize--;
                            $('#museumName').css('font-size', fontSize);
                            spanHeight = $('#museumName')[0].scrollHeight;
                        }

                        var subheadingFont = parseInt($('#subheading').css('font-size'));
                        LADS.Util.UI.fitTextInDiv($('#' + id), Math.round(subheadingFont * 5 / 3), Math.round(subheadingFont * 4 / 3));
                        break;
                }
            };
        }
    }

    // Changes the text of some element with id 'id' to the value
    // of an input 'item'.  Does no length checking (Used to update
    // the preview when the mode is changed).
    function changeTextSimple(id, item) {
        $('#' + id).html(item.val().replace(/\n\r?/g, '<br />'));
    }

    function logData(hex, rgb) {
        // $("#console").prepend('HEX: ' + hex + ' (RGB: ' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')<br />');
    }


    //preview screen for the current settings mode
    function createPreviewScreen(type, callback) {
      /*  var previewLoading = $(document.createElement('div'));
        $(previewLoading).addClass('previewLoading');
        $(previewLoading).css({
            'position': 'absolute',
            'width': '100%',
            'height': '54.36%',
            'top': '0px',
            'left': '0px',
            'background-color': 'rgba(0,0,0,0.5)',
            'display': 'none'
        });


        LADS.Util.showLoading($(previewLoading));
        $(rightSection).append(previewLoading);
        */
        var previewContainer = document.createElement('div');
        $(previewContainer).addClass('previewContainer');
        $(previewContainer).css({
            'position': 'relative',
            'width': '100%',
            'height': '54.36%',
            'top': '0%',
            'background': 'no-repeat center / contain black',

        });
        $(rightSection).append(previewContainer);



        //Splash screen preview
        if ($(middlePrevSelectedSetting).text() == 'Splash Screen' || type == "Exhibitions") {
            //get screen resolution
            var w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0], x = w.innerWidth || e.clientWidth || g.clientWidth, y = w.innerHeight || e.clientHeight || g.clientHeight;
            var ratio = x / y;

            //create div to display the entire splash screen
            splashFrame = document.createElement('div');
            $(splashFrame).addClass('splashFrame');
            $(splashFrame).css({
                'height': '100%',
                'width': '100%',
                'position': 'absolute',
                'color': 'white', // This is hardcoded since the page does not inherent the color settings
                'font-size': '6.5pt' // This is also hardcoded to make the font fit the screen
            });
            //$(splashFrame).attr('disabled', 'true');



            if ($(middlePrevSelectedSetting).text() == 'Splash Screen')
                // $(splashFrame).append((new LADS.Layout.StartPage()).getRoot());
                new LADS.Layout.StartPage(null, function (startPage) {

                    $(splashFrame).append(startPage.getRoot());
                    callback();
                });
            else if (type == "Exhibitions") {

                if (searchIndices.length != 0) {
                    exhibitionCount = searchIndices[exhibitionCount];
                }
                currentExhibitionNumber = exhibitionCount;
                new LADS.Layout.Exhibitions(null, exhibitionsHelper);

                function exhibitionsHelper(exhibition) {
                    exhibition.clickExhibition(exhibitionCount);

                    $(splashFrame).append(exhibition.getRoot());

                    $('.overlayOnRoot').fadeOut();

                }


            }

            $(previewContainer).append(splashFrame);
            $('.tour').outerWidth(($('.toursBar').outerWidth() / 60 * 100) / 3);
            $('.tourContent').outerWidth($('.tour').outerWidth() * 5);

            //create transparent div over preview div to disable clicking
            var cover = document.createElement('div');
            $(cover).attr('id', 'cover');
            $(cover).css({
                'height': '100%',
                'width': '100%',
                'float': 'left',
                'position': 'absolute',
                'background-color': 'white',
                'opacity': '0'
            });
            $(cover).bind('click', function () { return false; });
            $(previewContainer).append(cover);
            /*$(previewContainer).ready(function () {
                $(splashFrame).css({ 'height': $(previewContainer).width() / ratio + 'px' });
                console.log($(splashFrame).width());
            });*/
        }
        else if (type == 'Tour') {
            $(previewContainer).css({ 'background-image': 'url(' + currentTour.Metadata.Thumbnail + ')' });
        }
    }


    // changes the preview scren 
    function changeArtworkPreview() {

        $('.previewContainer').empty();


        var imgLoading = $(document.createElement('div'));
        $(imgLoading).addClass('imgLoading');
        $(imgLoading).css({
            'position': 'absolute',
            'width': '100%',
            'height': '54.36%',
            'top': '0px',
            'left': '0px',
            'background-color': 'rgba(0,0,0,0.5)',
        });


        LADS.Util.showLoading($(imgLoading));
        $(rightSection).append(imgLoading);
        var previewBackground = $('<img>').attr('src', currentArtwork.URL);
        previewBackground.load(function () {
            imgLoading.fadeOut();
            $('.previewContainer').css({ 'background-image': 'url(' + currentArtwork.URL + ')' });
        });


        $('.previewContainer').show();

    }

    function passwordsettingChanges() {
        console.log("am saving the passwordddd");
    }

    function createModifyContent() {
        // save & delete stuff including listeners

        var modifyButtonContainer = document.createElement('div');
        $(modifyButtonContainer).css({ 'position': 'relative', 'width': '90%', 'height': '10%', 'top': '2%' });
        var saveDraftButton = document.createElement('button');
        $(saveDraftButton).text('Save');
        $(saveDraftButton).css({ 'margin-right': '2.5%', 'position': 'relative', 'color': 'black', 'border-color': 'black', 'float': 'right' });

        var deleteButton = document.createElement('button');
        $(deleteButton).css({ 'margin-right': '3%', 'position': 'relative', 'color': 'black', 'border-color': 'black', 'float': 'left' });
        $(deleteButton).text('Delete');

        var catalogModeViewButton = document.createElement('button');
        $(catalogModeViewButton).text('View Catalog Mode');
        $(catalogModeViewButton).css({ 'margin-right': '3%', 'position': 'relative', 'color': 'black', 'border-color': 'black', 'float': 'left' });


        catalogModeViewButton.onclick = function () {


            if ($(catalogModeViewButton).text() == 'View Exhibition Mode') {
                $(splashFrame).empty();

                new LADS.Layout.Exhibitions(null, exhibitionsHelper);

                function exhibitionsHelper(exhibition) {
                    $(splashFrame).append(exhibition.getRoot());
                    exhibition.clickExhibition(exhibitionCount);


                    // Adjust the preview to match the entered text
                    changeTextSimple('exhibition-title', $('#exhibition-title-settings-editor'));
                    changeTextSimple('exhibition-subtitle-1', $('#exhibition-subtitle-1-settings-editor'));
                    changeTextSimple('exhibition-subtitle-2', $('#exhibition-subtitle-2-settings-editor'));
                    changeTextSimple('description-text', $('#description-text-settings-editor'));
                }

                $(catalogModeViewButton).text('View Catalog Mode');
            }
            else {
                var artworks = LADS.Worktop.Database.getArtworks(exhibitions[currentExhibitionNumber]);
                // if there is no artwork in the selected exhibition, alert user
                if (!artworks || !artworks[0]) {
                    var noArtworksOptionBox = LADS.Util.UI.makeNoArtworksOptionBox();
                    root.append(noArtworksOptionBox);
                    $(noArtworksOptionBox).fadeIn(500);
                    return;
                }
                $(splashFrame).empty();
                var catalogMode = new LADS.Layout.Catalog(exhibitions[currentExhibitionNumber]);
                $(splashFrame).append(catalogMode.getRoot());
                $(catalogModeViewButton).text('View Exhibition Mode');
            }
        }

        saveDraftButton.onclick = function () {
            //add action performed
            if (currentSetting == "General Settings") {
                if ($(middlePrevSelectedSetting).text() == 'Splash Screen') {
                    pushMainChanges();
                }
                else {
                    passwordsettingChanges();
                }

            }
            else if (currentSetting == "Exhibitions")
                pushExhibitionsSettings();
            else if (currentSetting == "Tour Authoring") {
                $('.overlayOnRoot').fadeIn();
                pushTourSettings();
            }
        };

        deleteButton.onclick = function () {
            var currentExhibitionName = exhibitionNames[currentExhibitionNumber];
            var confirmationBox = LADS.Util.UI.PopUpConfirmation(function () {
                // actually delete the artwork
                $('.overlayOnRoot').show();
                LADS.Worktop.Database.deleteDoq(exhibitionGuids[exhibitionCount], "Exhibition", function () {
                    reloadExhibitions(null, function () {
                        $('.overlayOnRoot').hide();
                    });
                });
            }, "Are you sure you want to delete " + currentExhibitionName + "?", "Delete");
            root.append(confirmationBox);
            $(confirmationBox).fadeIn(500);
        };

        if (currentSetting == "Exhibitions") {
            $(modifyButtonContainer).append(saveDraftButton);
            $(modifyButtonContainer).append(deleteButton);
            $(modifyButtonContainer).append(catalogModeViewButton);

            $(rightSettings).append(modifyButtonContainer);
        }
        else if (currentSetting == "General Settings") {
            if (passwordcontent) {
                $(rightSettingsEntries).append(saveDraftButton);
            } else {
                $(modifyButtonContainer).append(saveDraftButton);
                $(rightSettings).append(modifyButtonContainer);
            }
        }
        else if (currentSetting == "Artworks") {

            var editArtworkInfoButton = document.createElement('button');
            $(editArtworkInfoButton).text('Edit Artwork Info');
            $(editArtworkInfoButton).css({ 'border-color': 'black', 'top': '2%', 'color': 'black', 'position': 'relative' });
            $(modifyButtonContainer).append(editArtworkInfoButton);

            var deleteArtworkButton = document.createElement('button');
            $(deleteArtworkButton).text('Delete Artwork');
            $(deleteArtworkButton).css({ 'border-color': 'black', 'top': '2%', 'color': 'black', 'position': 'relative', 'left': '3%' });
            $(modifyButtonContainer).append(deleteArtworkButton);


            $(rightSettings).append(modifyButtonContainer);

            editArtworkInfoButton.onclick = function () {
                LADS.Util.UI.slidePageLeft((new LADS.Layout.ArtworkEditor(currentArtwork)).getRoot());
            };

            deleteArtworkButton.onclick = function () {
                var confirmationBox = LADS.Util.UI.PopUpConfirmation(function () {
                    $('.overlayOnRoot').show();
                    LADS.Worktop.Database.deleteDoq(currentArtwork.Identifier, "Artwork", function () {
                        reloadArtworks(function () {
                            $('.overlayOnRoot').hide();
                        });
                    });
                }, "Are you sure you want to delete "+currentArtwork.Name+"?", "Delete");

                root.append(confirmationBox);
                $(confirmationBox).fadeIn(500);
            };

        }
        else if (currentSetting == "Tour Authoring") {
            $(modifyButtonContainer).append(saveDraftButton);

            var editTourButton = document.createElement('button');
            $(editTourButton).text('Edit Tour');
            $(editTourButton).css({ 'border-color': 'black', 'top': '2%', 'color': 'black', 'position': 'relative' });
            $(modifyButtonContainer).append(editTourButton);

            var deleteTourButton = document.createElement('button');
            $(deleteTourButton).text('Delete Tour');
            $(deleteTourButton).css({ 'border-color': 'black', 'top': '2%', 'color': 'black', 'position': 'relative', 'left': '3%' });
            $(modifyButtonContainer).append(deleteTourButton);


            $(rightSettings).append(modifyButtonContainer);

            $(rightSection).append(rightSettings);

            editTourButton.onclick = function () {
                LADS.Util.UI.slidePageLeft((new LADS.Layout.TourAuthoringNew(currentTour)).getRoot());
            };

            deleteTourButton.onclick = function () {
                var confirmationBox = LADS.Util.UI.PopUpConfirmation(function () {
                    $('.overlayOnRoot').fadeIn();
                    LADS.Worktop.Database.deleteDoq(currentTour.Identifier, "Tour", function () {
                        refreshTours();
                    });
                }, "Are you sure you want to delete "+currentTour.Name+"?", "Delete");

                root.append(confirmationBox);
                $(confirmationBox).fadeIn(500);
            };


        }
    }

    function refreshTours(toselect) {
        getTours(function (tours) {
            console.log("EMPTY SETTINGS E");
            $(middleSettings).empty();
            var i = 0;
            $.each(tours, function () {
                createMiddleLabel(this + "", "Tours", "", "", tourObjects[i]);
                i++;
            });

            if (tourObjects[0])
                selectTourByGuid(tourObjects[0].Identifier);
            if (toselect)
                selectTourByGuid(toselect.Identifier);
            $('.overlayOnRoot').fadeOut();
        });
    }


    function insertNameOfSetting() {
        var settingsLabelDiv = document.createElement('div');
        $(settingsLabelDiv).css({ 'position': 'relative', 'width': '90%', 'height': '10%', 'top': '4%', 'margin-bottom': '4%' });

        characterLimitLabel = document.createElement('label');
        $(characterLimitLabel).text(' You have reached the limit of available characters');
        $(characterLimitLabel).css({ 'position': 'relative', 'font-size': getFontSize(150), 'color': 'black', 'font-style': 'italic' });
        $(characterLimitLabel).hide();

        var settingsLabel = document.createElement('label');
        $(settingsLabel).css({ 'position': 'relative', 'font-size': '130%', 'font-weight': 'bold'});
        $(settingsLabel).text($(middlePrevSelectedSettingText).text());
        $(settingsLabelDiv).append(settingsLabel);
        $(settingsLabelDiv).append(characterLimitLabel);
        $(rightSettings).append(settingsLabelDiv);
        //The following div modifis the background image, it continas all the setting options. Including labels and "save" button

        $(rightSettings).attr('id', 'settingDiv');
    }


    function createTopBar(topbarHeight) {
        // style the topbar
        topbar.css("background-color", "rgb(63,55,53)");
        topbar.css("color", "rgb(175,200,178)");
        topbar.css("width", '100%');
        topbar.css('height', topbarHeight + '%');

        // add the back button
        var backButtonArea = $(document.createElement('div'));
        backButtonArea.css({ "top": "20%", 'left': '1%', "width": "5%", "position": "relative", "float": "left" });

        var backButton = document.createElement('img');
        $(backButton).attr('src', 'images/icons/Back.svg');
        //$(backButton).css({ 'left': '1%', 'top': '10%', 'position': 'relative', 'float': 'left' });
        $(backButton).css({ 'width': '58%', 'height': '58%' });
        $(backButtonArea).append(backButton);
        $(topbar).append(backButtonArea);


        backButton.onmousedown = function () {
            LADS.Util.UI.cgBackColor("backButton", backButton, false);
        }

        backButton.onmouseleave = function () {
            LADS.Util.UI.cgBackColor("backButton", backButton, true);
        }

        backButton.onclick = function () {
            //$(".inkCanv").remove();
            //$(".rinInkContainer").remove();
            var startPage = new LADS.Layout.StartPage();
            LADS.Util.UI.slidePageRight(startPage.getRoot());
        };

        changesSavedLabel = document.createElement('label');
        $(changesSavedLabel).text('All Changes Saved');
        $(changesSavedLabel).css({ 'left': '70%', 'top': '15%', 'position': 'relative', 'font-size': getFontSize(120), 'color': 'white', 'font-style': 'italic' });
        $(topbar).append(changesSavedLabel);
        $(changesSavedLabel).hide();

        var titleLabel = document.createElement('label');
        $(titleLabel).text('Authoring Mode');
        $(titleLabel).css({
            'right': '2%',
            'top': '1.5%',
            'position': 'absolute',
            'font-size': getFontSize(260),
            'color': 'white'
        });
        $(topbar).append(titleLabel);

    }



    function getFontSize(factor) {
        return factor * (screen.width / 1920) + '%';
    }


    function getGeneralSettingsOptions() {
        //var generalSettings = ["Splash Screen", "Artwork Mode", "Catalog Mode"];
        var generalSettings = ["Splash Screen", "Password Settings"];
        return generalSettings;
    }

    // returns the filtered list of exhbitions if the value of the filtered list is not null.
    // else, it returns the entire list of exhibitions
    function getExhibitions() {
        if (exhibitionfilter)
            return exhibitionfilter;
        else
            return exhibitionNames;
    }




    function getTours(callback) {
        // call server to get current tours
        //var tours = ["Tour 1", "Tour 2", "Tour 3"];
        //LADS.Worktop.Database.createTour();
        var tours = [];
        LADS.Worktop.Database.getAllTours(function (localTourObjects) {
            tourObjects = localTourObjects;
            for (var i = 0; i < tourObjects.length; i++) {
                tours.push(tourObjects[i].Name);
            }
            callback(tours);
        });
    }

    /* This method is called to get the home page document in XML form */
    function getMainDoq() {
        var mainGuid = LADS.Worktop.Database.getMainGuid();
        var xml = LADS.Worktop.Database.getXML(mainGuid);
        var parser = new DOMParser();
        mainDoq = parser.parseFromString(xml, 'text/xml');
    }

    /* 
     * Gets all the values from the textfields/buttons, changes them in the local xml, 
     * and finally pushes them to the server using the pushes them to the server using 
     * pushXML(...) method in the LADS.Worktop.Database class
     */
    function pushMainChanges() {
        //setMainBackgroundImage('http://www.kurzweilai.net/images/Google-logo.jpg');
        setMuseumName(LADS.Util.encodeText(mainSettings["Museum Name"].textContent));
        setMuseumLocation(LADS.Util.encodeText(mainSettings["Museum Location"].textContent));
        setMuseumInfo(LADS.Util.encodeText(mainSettings["Museum Info"].textContent));
        setOverlayColor('#' + mainSettings["Overlay Color"].value);
        setOverlayTransparency(mainSettings["Overlay Transparency"].value / 100.0);
        setIconColor('#' + mainSettings['Museum Logo Background color'].value);

        //addMetadataToXML(mainDoq, "this is the key", "this is the value");

        LADS.Worktop.Database.pushXML(mainDoq, LADS.Worktop.Database.getMainGuid());

        $(changesSavedLabel).text('Main Changes Saved');
        $(changesSavedLabel).show();

        setTimeout(function () {
            $(changesSavedLabel).hide();
        }, 3000);
    }

    /* 
     * This method parses the Metadata fields and then checks whether the required metadata
     * field matches up with the one currently being looked at. Once it has found a match, it
     * returns the appropriate node corresponding to the field.
     */
    function getFieldValueFromMetadata(xml, field) {
        var metadata = getMetaData(xml);
        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].childNodes[0].textContent == field) {
                return metadata[i].childNodes[1].childNodes[0];
            }
        }
    }

    // returns the GUID of a given XML
    function getDoqIdentifier(xml) {
        return xml.getElementsByTagName("Identifier")[0].childNodes[0].data;
    }

    // this collection of methods sets the named field in the local xml
    function setMainBackgroundImage(url) {
        if (url)
            getFieldValueFromMetadata(mainDoq, "BackgroundImage").data = url;
    }




    function setIcon(url) {
        if (url)
            getFieldValueFromMetadata(mainDoq, "Icon").data = url;
    }

    function setIconColor(color) {
        if (color)
            getFieldValueFromMetadata(mainDoq, "IconColor").data = color;
    }

    function setMuseumName(name) {
        if (name && name.length > 0)
            getFieldValueFromMetadata(mainDoq, "MuseumName").data = name;
    }

    function setMuseumLocation(loc) {
        if (loc && loc.length > 0)
            getFieldValueFromMetadata(mainDoq, "MuseumLoc").data = loc;
    }

    function setMuseumInfo(info) {
        if (info && info.length > 0)
            getFieldValueFromMetadata(mainDoq, "MuseumInfo").data = info;
    }

    function setOverlayColor(color) {
        if (color && color.length > 0)
            getFieldValueFromMetadata(mainDoq, "OverlayColor").data = color;
    }

    function setOverlayTransparency(a) {
        getFieldValueFromMetadata(mainDoq, "OverlayTransparency").data = a;
    }

    function getMetaData(doq) {
        return doq.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes;
    }

    function addMetadataToXML(xml, key, value) {
        var dictsNode = xml.childNodes[0].childNodes[3].childNodes[0].childNodes[0].childNodes[1].childNodes[0];
        dictsNode.appendChild(xml.createElement("d3p1:KeyValueOfstringanyType"));
        dictsNode.getElementsByTagName("d3p1:KeyValueOfstringanyType")[dictsNode.childElementCount - 1].appendChild(xml.createElement("d3p1:Key"));
        dictsNode.getElementsByTagName("d3p1:KeyValueOfstringanyType")[dictsNode.childElementCount - 1].getElementsByTagName("d3p1:Key")[0].textContent = key;
        dictsNode.getElementsByTagName("d3p1:KeyValueOfstringanyType")[dictsNode.childElementCount - 1].appendChild(xml.createElement("d3p1:Value"));

        dictsNode.getElementsByTagName("d3p1:KeyValueOfstringanyType")[dictsNode.childElementCount - 1].getElementsByTagName("d3p1:Value")[0].textContent = value;
        dictsNode.getElementsByTagName("d3p1:KeyValueOfstringanyType")[dictsNode.childElementCount - 1].getElementsByTagName("d3p1:Value")[0].setAttribute("xmlns:d8p1", "http://www.w3.org/2001/XMLSchema");
        dictsNode.getElementsByTagName("d3p1:KeyValueOfstringanyType")[dictsNode.childElementCount - 1].getElementsByTagName("d3p1:Value")[0].setAttribute("i:type", "d8p1:string");

    }

    function pushTourSettings() {
        //modify/update the tour
        LADS.Worktop.Database.getDoqXML(currentTour.Identifier, function (xml) {
            var parser = new DOMParser();
            var tourXML = $(parser.parseFromString(xml, 'text/xml'));

            var name = mainSettings["Tour Name"].textContent;
            if (name.lastIndexOf(' ', 0) === 0 || name.lastIndexOf('\n', 0) === 0) {
                mainSettings["Tour Name"].textContent = tourXML.find('Name').text();
                $('.overlayOnRoot').hide();
                var messageBox = LADS.Util.UI.popUpMessage(null, "Tour Name cannot start with a space or new line.", null);
                $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 7);
                $(root).append(messageBox);
                $(messageBox).fadeIn(500);
                return;
            }

            //change name
            tourXML.find('Name').text(LADS.Util.encodeText(name));
            //change content, the json object
            tourXML.find("d3p1\\:Key:contains('Description') + d3p1\\:Value").text(LADS.Util.encodeText(mainSettings["Tour Description"].textContent));
            LADS.Worktop.Database.pushXML(tourXML[0], currentTour.Identifier, "Tour", function () {
                refreshTours(currentTour);
            });
        });
    }

    function pushExhibitionsSettings() {
        setExhibitionName(LADS.Util.encodeText(mainSettings["Exhibition Name"].textContent));
        setExhibitionSubheading1(LADS.Util.encodeText(mainSettings["Subheading 1"].textContent));
        setExhibitionSubheading2(LADS.Util.encodeText(mainSettings["Subheading 2"].textContent));
        setExhibitionDescription(LADS.Util.encodeText(mainSettings["Exhibition Description"].textContent));

        // addMetadataToXML(currentExhibitionXML, "dasdasd", "dasdasdas");
        $('.overlayOnRoot').show();
        LADS.Worktop.Database.pushXML(currentExhibitionXML, exhibitionGuids[currentExhibitionNumber], "Exhibitions", function () {
            reloadExhibitions(mainSettings["Exhibition Name"].textContent, function () {
                $('.overlayOnRoot').hide();
            });
        });



        $(changesSavedLabel).text('Exhibition Changes Saved');
        $(changesSavedLabel).show();

        setTimeout(function () {
            $(changesSavedLabel).hide();
        }, 3000);

    }


    function setExhibitionName(name) {
        if (name && name.length > 0)
            currentExhibitionXML.getElementsByTagName("Name")[0].childNodes[0].data = name;
    }

    function setExhibitionSubheading1(subheading) {
        if (subheading && subheading.length > 0)
            getFieldValueFromMetadata(currentExhibitionXML, "Subheading1").data = subheading;
    }

    function setExhibitionSubheading2(subheading) {
        if (subheading && subheading.length > 0)
            getFieldValueFromMetadata(currentExhibitionXML, "Subheading2").data = subheading;

    }

    function setExhibitionDescription(description) {
        if (description && description.length > 0)
            getFieldValueFromMetadata(currentExhibitionXML, "Description").data = description;

    }

    function setExhibitionBackgroundImage(url) {
        if (url && url.length > 0)
            getFieldValueFromMetadata(currentExhibitionXML, "BackgroundImage").data = url;

    }

    function getExhibitionMetaData(exhibition) {
        return exhibition.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes;
    }

    function setExhibitionDescriptionImage1(url) {
        if (url)
            getFieldValueFromMetadata(currentExhibitionXML, "DescriptionImage1").data = url;
    }

    function setExhibitionDescriptionImage2(url) {
        if (url)
            getFieldValueFromMetadata(currentExhibitionXML, "DescriptionImage2").data = url;
    }

    function reloadExhibitions(toSelect, callback) {
        console.log("RELOAD EXHIBITIONS CALLED");
        if (callback) {
            LADS.Worktop.Database.getExhibitions(function (result) {
                console.log(result.length);
                exhibitions = result;
                exhibitions.sort(function (a, b) {
                    if (a.Name < b.Name) {
                        return -1;
                    } else if (a.Name > b.Name) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                console.log("EMPTY SETTINGS F");
                $(middleSettings).empty();
                exhibitionCount = 0;
                exhibitionNames = [];
                exhibitionGuids = [];

                for (var i = 0; i < exhibitions.length; i++) {
                    exhibitionByGuid[exhibitions[i].Identifier] = exhibitions[i];
                    exhibitionNames.push(exhibitions[i].Name);
                    exhibitionGuids.push(exhibitions[i].Identifier);
                }

                $.each(exhibitionNames, function () {
                    createMiddleLabel(this + "", "exhibition");
                });

                if (toSelect) {
                    selectItemByName(toSelect);
                }
                callback();
            });
        } else {
            exhibitions = LADS.Worktop.Database.getExhibitions();
            exhibitions.sort(function (a, b) {
                if (a.Name < b.Name) {
                    return -1;
                } else if (a.Name > b.Name) {
                    return 1;
                } else {
                    return 0;
                }
            });
            console.log("EMPTY SETTINGS G");
            $(middleSettings).empty();
            exhibitionCount = 0;
            exhibitionNames = [];
            exhibitionGuids = [];

            for (var i = 0; i < exhibitions.length; i++) {
                exhibitionByGuid[exhibitions[i].Identifier] = exhibitions[i];
                exhibitionNames.push(exhibitions[i].Name);
                exhibitionGuids.push(exhibitions[i].Identifier);
            }

            $.each(exhibitionNames, function () {
                createMiddleLabel(this + "", "exhibition");
            });

            if (toSelect) {
                selectItemByName(toSelect);
            }
        }
    }

    function reloadArtworks(callback) {

        LADS.Worktop.Database.getAllArtworks(function (artworks) {
            artworksList = artworks;
            if (artworksList[0]) {
                artworksList.sort(function (a, b) {
                    if (a.Name < b.Name) {
                        return -1;
                    } else if (a.Name > b.Name) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            }
            console.log("EMPTY SETTINGS H");
            $(middleSettings).empty();
            var entries = [];
            var type = [];
            var icons = [];
            var artworkGuids = [];
            var isFirst = false;
            for (var i = 0; i < artworksList.length; i++) {
                // if (i == 0)
                //    currentUploadedArtworkGuid = artworksList[i].Identifier;
                //      isFirst = true;
                //  else
                //      isFirst = false;

                entries.push(artworksList[i].Name);
                icons.push(artworksList[i].Metadata.Thumbnail);
                artworkGuids.push(artworksList[i].Identifier);
            }

            var i = 0;
            $.each(entries, function () {
                var label = createMiddleLabel(this + "", "Artworks", icons[i], artworkExhibition[artworkGuids[i]], artworksList[i], isFirst);
                $(label).attr('id', 'artworks-' + artworkGuids[i]);
                i++;
            });
            if (callback)
                callback();
        });


    }


    // RYAN - Moved into FileUploader, to use in settings view need to rewrite giant "if"-branch in terms of callbacks from individual sections!
    function UploadOp() {
        var upload = null;
        var promise = null;

        this.start = function (uriString, file) {
            try {
                uploadingOverlay.show();

                var uri = new Windows.Foundation.Uri(uriString);
                var uploader = new Windows.Networking.BackgroundTransfer.BackgroundUploader();

                // Set a header, so the server can save the file (this is specific to the sample server).
                uploader.setRequestHeader("Filename", file.name);
                uploader.setRequestHeader("Content-Type", "multipart/form-data; boundary=----WebKitFormBoundaryqj1e7E6nvkEBR9N5");

                // Create a new upload operation.
                upload = uploader.createUpload(uri, file);

                // Start the upload and persist the promise to be able to cancel the upload.
                promise = upload.startAsync().then(complete, error, progress);
            } catch (err) {
                displayError(err);
            }
        };
        // On application activation, reassign callbacks for a upload
        // operation persisted from previous application state.
        this.load = function (loadedUpload) {
            try {
                upload = loadedUpload;
                promise = upload.attachAsync().then(complete, error, progress(upload));
            } catch (err) {
                displayError(err);
            }
        };
    }

    function complete(uploadOperation) {

        var response = uploadOperation.getResponseInformation();
        var iInputStream = uploadOperation.getResultStreamAt(0);
        var dataReader = new Windows.Storage.Streams.DataReader(iInputStream);
        var loadop = dataReader.loadAsync(10000000);
        //var status = loadop.status;
        loadop.operation.completed = function () {
            $(innerProgressBar).width(100 + "%");

            var dataReaderLoad = dataReader.readString(dataReader.unconsumedBufferLength);

            dataReaderLoad = $.trim(dataReaderLoad);

            //who wrote this? it's never used and breaks!! (only works with Deepzoom response)
            //var currentUploadedArtwork = new Worktop.Doq(dataReaderLoad);
            //var currentUploadedArtworkGuid = currentUploadedArtwork.Identifier;

            //resetting the progress bar
            if (currentUpload == "Background Image") {
                setMainBackgroundImage(dataReaderLoad);
            }
            else if (currentUpload == "Museum Logo") {
                setIcon(dataReaderLoad);
            }
            else if (currentUpload == "Exhibition Background Image") {
                setExhibitionBackgroundImage(dataReaderLoad);
            }
            else if (currentUpload == "Artwork") {
                LADS.Worktop.Database.setArtworkDirty();
                $('.overlayOnRoot').show();
                reloadArtworks(function () {
                    $('.overlayOnRoot').hide();
                });
            }
            else if (currentUpload == "Exhibition Preview Image") {
                $('#img1').attr('src', dataReaderLoad);
                setExhibitionDescriptionImage1(dataReaderLoad);
            }
            else if (currentUpload == "Exhibition Description Image 2") {
                $('#img2').attr('src', dataReaderLoad);
                setExhibitionDescriptionImage2(dataReaderLoad);
            }
            //else if (currentUpload
            uploadingOverlay.hide();
            $(innerProgressBar).width('0%');
        }
    }
    function error() {
        console.log('error in settingsview');
        $(uploadingOverlay).hide();
        var messageBox = LADS.Util.UI.popUpMessage(function () {
            $('.overlayOnRoot').show();
            reloadArtworks(function () {
                $('.overlayOnRoot').hide();
            });
        }, "There was an error uploading the file.", null);
        $(messageBox).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 7);
        $(root).append(messageBox);
        $(messageBox).fadeIn(500);
    }
    function progress(upload) {
        var percentComplete = upload.progress.bytesSent / upload.progress.totalBytesToSend;
        $(innerProgressBar).width(percentComplete * 90 + "%");
    }
    // RYAN - end of moved



}