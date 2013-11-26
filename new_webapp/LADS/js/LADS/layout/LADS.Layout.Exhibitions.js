LADS.Util.makeNamespace("LADS.Layout.Exhibitions");

LADS.Layout.Exhibitions = function (options, exhibitionCallback) {
    "use strict";

    options = LADS.Util.setToDefaults(options, LADS.Layout.Exhibitions.default_options);
    var root, leftbar, displayarea, exhibitarea, currentfolder, currentExhElements, leftbarHeader, exhibitionLabel, toursLabel, selectText, exhibitionSpan, toursSpan, loadingArea,
        titlediv = null,
        sub1 = null,
        sub2 = null,
        switching = false,//boolean for switching the page
        exhibitelements = [], // this is shared between exhibitions and tours
        exhibTabSelected = true, //which tab is selected at the top (true for exhib, false for tour)
        firstLoad = true;
    var bgimage = $(document.createElement('div'));
    var currExhibition = null;
    var currTour = null;
    var relatedTours = []; // Object to store associated tours
    var numberOfTours;

    var that = {
        getRoot: getRoot,
        clickExhibition: clickExhibition,
        clickExhibitionByDoq: clickExhibitionByDoq,
        clickTourByDoq: clickTourByDoq,
        selectTourTab: selectTourTab,
        loadExhibit: loadExhibit,
    };


    init();

    return that;

    /**
    *initiates UI stuff
    */
    function init() {
        root = LADS.Util.getHtmlAjax('exhibitionsView.html');

        //create loading page
        loadingArea = root.find('#topDisplayArea');

        var progressCircCSS = { "position": 'absolute', 'z-index': '50', 'height': 'auto', 'width': '5%', 'left': '47.5%', 'top': '42.5%' };
        var centerhor = '0px';
        var centerver = '0px';
        
        var circle = LADS.Util.showProgressCircle(loadingArea, progressCircCSS, centerhor, centerver, false);

        //after loading finished
        // Background
        var overlay = root.find('#overlay');
        bgimage = root.find('#bgimage');

        // Sidebar
        leftbar = root.find('.leftbar');

        // Header w/ back-button, exhibit, tour selectors
        leftbarHeader = leftbar.find('.leftbar-header');

        // Back button/overlay area
        var backbuttonArea = leftbarHeader.find('.backbuttonArea');

        var backbuttonIcon = backbuttonArea.find('.backbuttonIcon');

        //wen
        //handles changing the color when clicking/mousing over on the backButton
        backbuttonIcon.mouseleave(function () {
            LADS.Util.UI.cgBackColor("backButton", backbuttonIcon, true);
        });
        backbuttonIcon.mousedown(function () {
            LADS.Util.UI.cgBackColor("backButton", backbuttonIcon, false);
        });

        //opens the splash screen when the back button is clicked
        backbuttonIcon.click(function () {
            backbuttonIcon.off('click');
            LADS.Layout.StartPage(null, function (root) {
                LADS.Util.Splitscreen.setOn(false);
                LADS.Util.UI.slidePageRight(root);
            }, true);
        });

        // Labels (Exhibition, Tours)
        exhibitionLabel = leftbarHeader.find('#exhibition-label');
        exhibitionSpan = exhibitionLabel.find('.exhibitionSpan');

        var fontSize = LADS.Util.getMaxFontSizeEM('Exhibitions', 1, $(window).width() * 0.1, 1000);
        exhibitionSpan.css({
            'font-size': fontSize,
        });

        //have exhibition mode selected
        exhibitionSpan.mousedown(function () {
            $(this).css({ 'color': 'white' });
            toursSpan.css({ 'color': 'gray' });
        });

        toursLabel = leftbarHeader.find('#tours-label');
        toursSpan = toursLabel.find('.toursSpan');
        toursSpan.css({
            'font-size': fontSize,
        });

        toursSpan.mousedown(function () {
            toursSpan.css({ 'color': 'white' });
            exhibitionSpan.css({ 'color': 'gray' });
        });

        // Buttons for sidebar to select Exhibitions
        exhibitarea = leftbar.find('.exhibitarea');

        //initiates feedback, currently commented out.
        var feedbackContainer = initFeedback();
        leftbar.append(feedbackContainer);

        // Main display area
        displayarea = root.find('#mainDisplayArea');

        // Initial text displayed in display area
        var displayHelp = displayarea.find('.displayHelp');

        var displayHelpTitle = displayHelp.find('.displayHelpTitle');
        displayHelpTitle.text("Welcome to the " + LADS.Worktop.Database.getMuseumName());

        var displayHelpText = displayHelp.find('.displayHelpText');

        // gets a list of exhibitions from the server or the cache
        LADS.Worktop.Database.getExhibitions(getExhibitionsHelper);

        /**helper function to exhibitions**/
        function getExhibitionsHelper(exhibitionsLocal) {
            //TODO: change to Aysn call after adding "_tourDirty"
            LADS.Worktop.Database.getAllTours(getAllToursHelper);

            function getAllToursHelper(tours) {
                // root.append(bgimage);
                // root.append(overlay);

                //append everything in callback
                // root.append(leftbar);
                // root.append(displayarea);

                //click funtions for Exhibitions and Tours tabs
                exhibitionSpan.click(function () {
                    var gotFirst = false,
                        firstIndex = 0;
                    if (!exhibTabSelected) {
                        exhibTabSelected = true;
                        exhibitarea.empty();
                        exhibitelements = [];
                        if (exhibitionsLocal[0]) {
                            $.each(exhibitionsLocal, function (i, e) {
                                var privateState;
                                if (e.Metadata.Private) {
                                    privateState = (/^true$/i).test(e.Metadata.Private);
                                } else {
                                    privateState = false;
                                }
                                if (!privateState) {
                                    if (!gotFirst) {
                                        firstIndex = i;
                                    }
                                    addExhibit(e);
                                    gotFirst = true;
                                }
                            });
                            if (currExhibition === null) {
                                clickExhibition(0);//have the first exhibition selected
                            }
                            else {
                                clickExhibitionByDoq(currExhibition);
                            }
                        }
                        toursLabel.css('color', 'rgb(85,85,85)');
                        exhibitionLabel.css('color', 'white');
                    }
                });

                toursSpan.click(function () {
                    var gotFirst = false,
                        firstIndex = 0;
                    if (exhibTabSelected) {
                        exhibTabSelected = false;
                        exhibitarea.empty();
                        exhibitelements = [];
                        if (tours[0]) {
                            $.each(tours, function (i, e) {
                                var privateState;
                                if (e.Metadata.Private) {
                                    privateState = (/^true$/i).test(e.Metadata.Private);
                                } else {
                                    privateState = false;
                                }
                                if (!privateState) {
                                    if (!gotFirst) {
                                        firstIndex = i;
                                    }
                                    addTour(e, tours);
                                    gotFirst = true;
                                }
                            });
                            if (!currTour) {
                                clickExhibition(firstIndex);//have the first tour selected
                            }
                            else {
                                clickTourByDoq(currTour);//have the previous tour selected if there is one
                            }
                        }
                        exhibitionLabel.css('color', 'rgb(85,85,85)');
                        toursLabel.css('color', 'white');
                    }
                });

                currentExhElements = {};
                currentExhElements.displayareasub = displayHelp;//asign displayhelp to displayareasub to each exhibition


                // Add exhibitions to sidebar
                var gotFirst = false;
                $.each(exhibitionsLocal, function (_, e) {
                    var privateState;
                    if (e.Metadata.Private) {
                        privateState = (/^true$/i).test(e.Metadata.Private);
                    } else {
                        privateState = false;
                    }
                    if (!privateState) {
                        if (!gotFirst) {
                            bgimage.css('background-image', "url(" + LADS.Worktop.Database.fixPath(e.Metadata.BackgroundImage) + ")");
                        }
                        addExhibit(e);
                        gotFirst = true;
                    }
                });
                //a space below the last exhibition div so that if there are many exhibitions, leftbar/exhibitarea will be scrollable
                var moreSpace = $(document.createElement('div'));
                moreSpace.addClass("moreSpace");
                exhibitarea.append(moreSpace);

                changeOrientation();
                loadingArea.hide();
                //console.log("in get exhibition helper");
                if (exhibitionCallback) {
                    exhibitionCallback(that);
                }
            }  // end getting tour
        }   // end getting exhibition
    }   //end init()

    /**
    *create send feedback
    *@return: feedbackContainer  
    */
    function initFeedback() {
        var feedbackContainer = leftbar.find('.feedbackContainer');
        
        var feedback = feedbackContainer.find('.feedback-text');
        
        var feedbackIcon = feedbackContainer.find('.feedback-icon');

        var feedbackBox = LADS.Util.UI.FeedbackBox(getCurrentType, getCurrentID);
        root.append(feedbackBox);

        feedbackContainer.click(makeFeedback);
        function makeFeedback() {
            $(feedbackBox).css({ 'display': 'block' });
        }
        return feedbackContainer;
    }

    function getCurrentType() {
        if (exhibTabSelected) {
            return "Exhibition";
        } else {
            return "Tour";
        }
    }

    function getCurrentID() {
        if (exhibTabSelected) {
            if (currExhibition) {
                return currExhibition.Identifier;
            } else {
                return "";
            }
        } else {
            if (currTour) {
                return currTour.Identifier;
            } else {
                return "";
            }
        }
    }

    /**
     * Adds exhibitions to page
     *@param: exhibition to add
     * Creates button in sidebar
     */
    function addExhibit(exhibition) {

        var title = exhibition.Name,
            toAddImage = $(document.createElement('img')),
            imgSrc = LADS.Worktop.Database.fixPath(exhibition.Metadata.BackgroundImage),
            toAdd = $(document.createElement('div')),
            subInfo = $(document.createElement('div')),
            text = exhibition.Metadata.Description ? exhibition.Metadata.Description : "",
            shortenedText = text.substr(0, 18) + "...";

        text = text.replace(/<br>/g, '').replace(/<br \/>/g, '');

        // intelligent truncate + ellipses insertion
        // BM - CSS3 is more intelligent
        //if (title.length > 15) {
        //    var hasSpace = false;
        //    var scanLength = Math.min(title.length, 24);
        //    for (var i = 14; i < scanLength ; i++) {
        //        if (title[i] === " " && !hasSpace) {
        //            title = title.substr(0, i) + "...";
        //            hasSpace = true;
        //        } else if (title[i] === "-" && i !== (scanLength - 1) && !hasSpace) {
        //            if (title[i + 1] === " ") {
        //                title = title.substr(0, i) + "...";
        //                hasSpace = true;
        //            }
        //        }
        //    }
        //    if (!hasSpace) {
        //        title = title.substr(0, 16) + "...";
        //    }
        //}

        //thumbnail for the exhibition
        toAddImage = $(document.createElement('img'));
        imgSrc = LADS.Worktop.Database.fixPath(exhibition.Metadata.BackgroundImage);
        toAddImage.attr("src", imgSrc);
        toAddImage.addClass('exhibition-thumbnail');

        toAdd = $(document.createElement('div'));
        toAdd.addClass('exhibition-selection');

        var titleBox = $(document.createElement('div'));
        titleBox.addClass('exhibition-title');

        var screenWidth = root.width();
        titleBox.text(title);
        if (screenWidth <= 1366) {
            //$(titleBox).fitText(0.35);
        } else {
            //$(titleBox).fitText(0.26);
        }

        var progressCircCSS = {
            'position': 'absolute',
            'left': '10%',
            'z-index': '50',
            'height': 'auto',
            'width': '9%',
            'top': '25%',
        };
        var circle = LADS.Util.showProgressCircle(toAdd, progressCircCSS, '0px', '0px', false);
        toAddImage.load(function () {
            LADS.Util.removeProgressCircle(circle);
        });

        toAdd.append(toAddImage);
        toAdd.append(titleBox);


        //subInfo = $(document.createElement('div'));
        //subInfo.css({
        //    width: "100%", left: "0%", top: "0%",
        //    'font-size': '60%', position: "relative", 'text-align': 'left'
        //});
        //text = exhibition.Metadata.Description ? exhibition.Metadata.Description : "";
        //text = text.replace(/<br>/g, '').replace(/<br \/>/g, '');
        //shortenedText = text.substr(0, 25) + "...";
        //subInfo.text(shortenedText);
        //toAdd.append(subInfo);

        exhibitarea.append(toAdd);
        toAdd.attr('flagClicked', 'false');
        toAdd.attr('id', 'exhib-' + exhibition.Identifier);
        toAdd.mousedown(function () {
            $(this).css({ 'background-color': 'white', 'color': 'black' });
        });
        toAdd.mouseleave(function () {
            if ($(this).attr('flagClicked') == 'false')
                $(this).css({ 'background-color': 'transparent', 'color': 'white' });
        });
        toAdd.click(function () {
            for (var i = 0; i < exhibitelements.length; i++) {
                // prevents animation if exhibit is already selected
                if (exhibitelements[i] != toAdd) {
                    exhibitelements[i].css({ 'background-color': 'transparent', 'color': 'white' });
                    exhibitelements[i].data("selected", false);
                    exhibitelements[i].attr('flagClicked', 'false');
                }
            }
            $(this).attr('flagClicked', 'true');
            currExhibition = exhibition;
            loadExhibit.call(toAdd, exhibition);
        });

        exhibitelements.push(toAdd);
    }

    /**
     * Adds tour to page
     * Creates button in sidebar
     *@param: tour to add,
     *@param: all the tours
     */
    function addTour(tour, allTours) {
        var title = tour.Name,
            toAddImage = $(document.createElement('img')),
            imgSrc = LADS.Worktop.Database.fixPath(tour.Metadata.Thumbnail),
            toAdd = $(document.createElement('div')),
            subInfo = $(document.createElement('div')),
            text = tour.Metadata.Description || "",
            shortenedText = text.substr(0, 20) + "...";

        text = text.replace(/<br>/g, '').replace(/<br \/>/g, '');

        // intelligent truncate + ellipses insertion
        //if (title.length > 15) {
        //    var hasSpace = false;
        //    var scanLength = Math.min(title.length, 24);
        //    for (var i = 14; i < scanLength ; i++) {
        //        if (title[i] === " " && !hasSpace) {
        //            title = title.substr(0, i) + "...";
        //            hasSpace = true;
        //        } else if (title[i] === "-" && i !== (scanLength - 1) && !hasSpace) {
        //            if (title[i + 1] === " ") {
        //                title = title.substr(0, i) + "...";
        //                hasSpace = true;
        //            }
        //        }
        //    }
        //    if (!hasSpace) {
        //        title = title.substr(0, 16) + "...";
        //    }
        //}

        toAddImage = $(document.createElement('img'));
        imgSrc = LADS.Worktop.Database.fixPath(tour.Metadata.Thumbnail);
        toAddImage.addClass('tour-thumbnail');
        toAddImage.attr("src", imgSrc);

        toAdd = $(document.createElement('div'));
        toAdd.addClass('tour-selection');

        var progressCircCSS = {
            'position': 'absolute',
            'left': '10%',
            'z-index': '50',
            'height': 'auto',
            'width': '9%',
            'top': '25%',
        };
        var circle = LADS.Util.showProgressCircle(toAdd, progressCircCSS, '0px', '0px', false);
        toAddImage.load(function () {
            LADS.Util.removeProgressCircle(circle);
        });

        var titleBox = $(document.createElement('div'));
        titleBox.addClass('tour-title');
        titleBox.text(title);
        var screenWidth = root.width();
        titleBox.text(title);
        if (screenWidth <= 1366) {
            //$(titleBox).fitText(0.35);
        } else {
            //$(titleBox).fitText(0.26);
        }
        toAdd.append(toAddImage);
        toAdd.append(titleBox);

        //toAdd.text(title);
        //subInfo = $(document.createElement('div'));
        //subInfo.css({
        //    width: "100%", left: "0%", top: "0%",
        //    'font-size': '60%', position: "relative", 'text-align': 'left'
        //});
        //text = tour.Metadata.Description ? tour.Metadata.Description : "";
        //text = text.replace(/<br>/g, '').replace(/<br \/>/g, '');
        //shortenedText = text.substr(0, 20) + "...";
        //subInfo.text(shortenedText);
        //toAdd.append(subInfo);

        exhibitarea.append(toAdd);

        toAdd.attr('flagClicked', 'false');
        toAdd.mousedown(function () {
            $(this).css({ 'background-color': 'white', 'color': 'black' });
        });
        toAdd.mouseleave(function () {
            if ($(this).attr('flagClicked') == 'false')
                $(this).css({ 'background-color': 'transparent', 'color': 'white' });
        });
        toAdd.mousedown(function () {
            $(this).css({ 'background-color': 'white', 'color': 'black' });

        });

        toAdd.click(function () {
            for (var i = 0; i < exhibitelements.length; i++) {
                // prevents animation if exhibit is already selected
                if (exhibitelements[i] != toAdd) {
                    exhibitelements[i].css({ 'background-color': 'transparent', 'color': 'white' });
                    exhibitelements[i].data("selected", false);
                    exhibitelements[i].attr('flagClicked', 'false');
                }
            }
            // the div that is clicked is passed as the context i.e. 'this'
            $(this).attr('flagClicked', 'true');
            currTour = tour;
            loadTour.call(toAdd, tour, allTours);
        });

        exhibitelements.push(toAdd);
    }

    /**
    *have a exhibition/tour selected
    *@param: index of selected exhibition
    */
    function clickExhibition(i) {
        if (exhibitelements[i])
            exhibitelements[i].click();
    }

    /**
    *return to the exhibition when clicks back button from catalog
    *@param: current exhibition
    */
    function clickExhibitionByDoq(doq) {
        exhibitionSpan.click();

        var i, currentEx, text,
            title = doq.Name;
        // intelligent truncate + ellipses insertion
        //if (title.length > 15) {
        //    var hasSpace = false;
        //    var scanLength = Math.min(title.length, 24);
        //    for (var i = 14; i < scanLength ; i++) {
        //        if (title[i] === " " && !hasSpace) {
        //            title = title.substr(0, i) + "...";
        //            hasSpace = true;
        //        } else if (title[i] === "-" && i !== (scanLength - 1) && !hasSpace) {
        //            if (title[i + 1] === " ") {
        //                title = title.substr(0, i) + "...";
        //                hasSpace = true;
        //            }
        //        }
        //    }
        //    if (!hasSpace) {
        //        title = title.substr(0, 16) + "...";
        //    }
        //}

        for (i = 0; i < exhibitelements.length; i++) {
            currentEx = exhibitelements[i];
            text = currentEx[0].innerText;
            if (text === title) {
                loadExhibit.call(exhibitelements[i], doq);
                currentEx[0].click();//have the current exhibition selected when go back to exhibition page
                break;
            }
        }
    }

    /**
    *return to tours page in exhibition mode when clicks back button from artmode.
    *@param: current artwork mode
    */
    function clickTourByDoq(doq) {
        toursSpan.click();
        var i, currTour, text,
            title = doq.Name;

        //if (title.length > 15) {
        //    var hasSpace = false;
        //    var scanLength = Math.min(title.length, 24);
        //    for (var i = 14; i < scanLength ; i++) {
        //        if (title[i] === " " && !hasSpace) {
        //            title = title.substr(0, i) + "...";
        //            hasSpace = true;
        //        } else if (title[i] === "-" && i !== (scanLength - 1) && !hasSpace) {
        //            if (title[i + 1] === " ") {
        //                title = title.substr(0, i) + "...";
        //                hasSpace = true;
        //            }
        //        }
        //    }
        //    if (!hasSpace) {
        //        title = title.substr(0, 16) + "...";
        //    }
        //}
        for (i = 0; i < exhibitelements.length; i++) {
            var currentTour = exhibitelements[i];
            text = currentTour[0].innerText;
            if (text === title) {
                loadTour.call(currentTour, doq);
                currentTour[0].click();//have the current exhibition selected when go back to exhibition page
                break;
            }
        }
    }

    /** 
    *Function to select the tour tab from a different page before switching to this page 
    */
    function selectTourTab() {
        toursSpan.click();
    }

    /**
     * When exhibition is selected in sidebar,
     * this function creates description to display in main display area
     * @param: selected exhibition
     */
    // BM - privateExhib is a little bit of a hack to get private exhibits
    // to show in settings view.  When set to true it just ignores anything
    // that relies on 'this' since 'this' doesn't exist for a private exhibit
    // (it doesn't have a label in the exhib list)
    function loadExhibit(exhibition, privateExhib) {

        if (!privateExhib && this.data("selected")) { return; }//if the exhibition has already been selected, do nothing

        if (!privateExhib)
            this.data("selected", true);
        // Start loading artwork now in background

        // Remove current contents of display area
        var d;
        if (firstLoad) {
            d = currentExhElements.displayareasub;
            d.animate({ 'opacity': 0 }, 100, function () {
                d.remove();
            });
            firstLoad = false;
        }
        else if (currentExhElements) {
            currentExhElements.block.remove();
            d = currentExhElements.displayareasub;
            d.css('z-index', 1000);
            d.animate({
                'left': '20%',
                top: '20%',
                width: '150%',
                height: '150%',
                opacity: 0,
            },
            500, function () {
                d.remove();
            });
        }

        var displayareasub = $(document.createElement('div'));
        displayareasub.addClass('displayareasub');
        displayareasub.css({ 'width': '100%', 'height': '100%', 'position': 'absolute' });
        displayarea.append(displayareasub);

        currentExhElements = {};
        currentExhElements.block = $(document.createElement('div'));
        if (!privateExhib) {
            currentExhElements.block.css({
                "top": $(this).position().top, "left": "100%", "height": $(this).css('height'),
                "width": "4%", "font-size": "1.5em", 'position': 'absolute',
                'border': 'solid transparent', 'border-width': '5px 0px 5px 0px',
                'background-color': 'rgba(255,255,255,0)', 'z-index': '50'
            });
        }


        // Make titles
        // fixed to work at small widths (in splitscreen and in portrait mode)
        titlediv = $(document.createElement('div'));
        titlediv.attr('id', 'exhibition-title');

        titlediv.addClass('exhibition-title');
        // Font size & line-height is probably the easiest thing to dynamically update here
        titlediv.css({
            'width': '90%',
            'margin-left': "10%", 'margin-top': "2%",
            'font-size': '5.7em',
            'text-align': 'left',
            'z-index': '40',
            'white-space': 'nowrap'
        });

        titlediv.html(exhibition.Name);
        //LADS.Util.fitText(titlediv, 0.7);
        displayareasub.append(titlediv);
        currentExhElements.title = titlediv;
        //subtitle1
        sub1 = $(document.createElement('div'));
        sub1.addClass('exhibition-subtitle-1');
        sub1.attr('id', 'exhibition-subtitle-1');

        sub1.html(exhibition.Metadata.Subheading1);
        //LADS.Util.fitText(sub1, 1.5);
        displayareasub.append(sub1);
        currentExhElements.sub1 = sub1;
        //subtitle2
        sub2 = $(document.createElement('div'));
        sub2.addClass('exhibition-subtitle-2');
        sub2.attr('id', 'exhibition-subtitle-2');

        sub2.html(exhibition.Metadata.Subheading2);
        // LADS.Util.fitText(sub2, 2);
        displayareasub.append(sub2);
        currentExhElements.sub2 = sub2;

        // Display contains description, thumbnails and view button
        var display = $(document.createElement('div'));
        display.addClass('exhibition-info');

        // Might need to push this down farther (make top larger)
        // Looks fine for now, though

        displayareasub.append(display);

        currentExhElements.display = display;

        // Contains text
        var contentdiv = $(document.createElement('div'));
        contentdiv.addClass('contentdiv');
        display.append(contentdiv);

        // Exhibition description container
        var descContainer = $(document.createElement('div'));
        descContainer.addClass('description-container');
        contentdiv.append(descContainer);

        // Thumbnails
        var img1 = $(document.createElement('img'));
        img1.attr('src', LADS.Worktop.Database.fixPath(exhibition.Metadata.DescriptionImage1));
        img1.attr('id', 'img1');
        descContainer.append(img1);

        var progressCircCSS = {
            'position': 'absolute',
            'float': 'right',
            'right': '13%',
            'z-index': '50',
            'height': '20%',
            'width': 'auto',
            'top': '10%',
        };
        var circle = LADS.Util.showProgressCircle(descContainer, progressCircCSS, '0px', '0px', false);
        img1.load(function () {
            LADS.Util.removeProgressCircle(circle);
        });
        // View button

        var selectExhibition = $(document.createElement('div'));
        selectExhibition.addClass('selectExhibition');
        descContainer.append(selectExhibition);

        var selectButton = $(document.createElement('img'));
        selectButton.addClass('selectButton');
        selectButton.attr('src', 'images/icons/forward.png');
        selectExhibition.append(selectButton);

        bgimage.css('background-image', "url(" + LADS.Worktop.Database.fixPath(exhibition.Metadata.BackgroundImage) + ")");

        // create a spinning circle
        var displayLoading = $(document.createElement('div'));
        displayLoading.addClass('exhibitionLoading');
        displayareasub.append(displayLoading);

        // create gray overlay
        var overlayOnRoot = $(document.createElement('div'));
        overlayOnRoot.attr('id', 'overlay1');
        overlayOnRoot.addClass('overlayOnRoot');
        root.append(overlayOnRoot);
        //have the selectbutton not draggable, change to black when clicked and change back to white when mouse leave.
        selectExhibition.mousedown(function () {
            LADS.Util.UI.cgBackColor("forwardButton", selectExhibition);
            $(selectText).css({ 'color': 'black' });
        });
        selectExhibition.mouseleave(function () {
            selectExhibition.css({ 'background-color': "transparent" });
        });

        //opens the exhibition we have just selected
        selectExhibition.click(function () {
            overlayOnRoot.show();
            //LADS.Util.showLoading(overlayOnRoot, '5%'); DisplayAreaSub already creates a loading circle
            LADS.Worktop.Database.getArtworks(exhibition, getArtworksHelper);

            function getArtworksHelper(artworks) {
                if (!artworks || !artworks[0]) {//pops up a box warning user there is no artwork in the selected exhibition
                    var noArtworksOptionBox = LADS.Util.UI.makeNoArtworksOptionBox();
                    root.append(noArtworksOptionBox);
                    $(noArtworksOptionBox).fadeIn(500);
                    overlayOnRoot.fadeOut();
                    return;
                }
                switchPage(exhibition);
                overlayOnRoot.fadeOut();
            }
        });

        selectText = $(document.createElement('div'));
        selectText.addClass('select-text');
        selectText.attr('id', 'exhibition-select-text');

        selectText.text("Explore this exhibition");
        selectText.css({
            'font-size': LADS.Util.getMaxFontSizeEM("Explore this exhibition", 1, 1000, selectExhibition.height()),
        });
        selectExhibition.append(selectText);
        //LADS.Util.fitText(selectText, .8); //josh

        //descriptiontext 
        var descriptiontext = $(document.createElement('div'));
        descriptiontext.addClass('description-text');
        descriptiontext.attr('id', 'description-text-exhib');

        //create the text fadeout effect for the top
        var topfadeout = $(document.createElement('div'));
        topfadeout.addClass('topfadeout');
        descContainer.append(topfadeout);
        //create the text fadeout effect for the bottom
        var bottomfadeout = $(document.createElement('div'));
        bottomfadeout.addClass('Exhibitionbottomfadeout');
        descContainer.append(bottomfadeout);
        //check the scroll state to make fadeout effect divs appear and disappear.
        descContainer.bind('scroll', function () {
            //if it reaches the bottom, hide the bottom fadeout effect. Otherwise, show it
            if (descContainer.scrollTop() + descContainer.innerHeight() >= descContainer[0].scrollHeight) {
                bottomfadeout.css({ 'display': 'none' });
            }
            else {
                bottomfadeout.css({ 'display': 'block' });
            }
            //if the scroller is not at the top, show the top fadeout effect. Otherwise, hide it.
            if (descContainer.scrollTop() > 0) {
                topfadeout.css({ 'display': 'block' });
            }
            else {
                topfadeout.css({ 'display': 'none' });
            }
        });
        var str;
        if (exhibition.Metadata.Description)
            str = exhibition.Metadata.Description.replace(/\n\r?/g, '<br>');
        else
            str = "";
        descriptiontext.html(str);
        //LADS.Util.fitText(descriptiontext, 2.5);
        descContainer.append(descriptiontext);

        //this is the area that contains a list of atours.
        var tourBar = $(document.createElement('div'));
        tourBar.addClass('tourBar');

        var text = $(document.createElement('div'));
        text.addClass('interactive-tour-text');
        text.html("<b>Interactive Tours in this Exhibition</b>");
        tourBar.append(text);

        var artworkContent = $(document.createElement('div'));
        artworkContent.addClass('artworkContent');
        tourBar.append(artworkContent);
        contentdiv.append(tourBar);

        //create left fadeout for tourbar
        var leftfadeout = $(document.createElement('div'));
        leftfadeout.addClass('leftfadeout');
        artworkContent.append(leftfadeout);

        //create the right fadeout for tourBar
        var rightfadeout = $(document.createElement('div'));
        rightfadeout.addClass('rightfadeout');
        artworkContent.append(rightfadeout);

        //check the scroll state to make fadeout effect divs appear and disappear.
        artworkContent.bind('scroll', function () {
            //if it reaches the bottom, hide the bottom fadeout effect. Otherwise, show it
            if (artworkContent.scrollLeft() + artworkContent.innerWidth() >= artworkContent[0].scrollWidth) {
                rightfadeout.css({ 'display': 'none' });
            }
            else {
                rightfadeout.css({ 'display': 'block' });
            }
            //if div scrolls to the left, show the top fadeout effect. Otherwise, hide it.
            if (artworkContent.scrollLeft() > 0) {
                leftfadeout.css({ 'display': 'block' });
            }
            else {
                leftfadeout.css({ 'display': 'none' });
            }
        });

        LADS.Util.showLoading(overlayOnRoot, '8%', '60%', '60%');
        overlayOnRoot.show();

        //get all the tours that are related
        LADS.Worktop.Database.getAllTours(function (tourInfo) {
            numberOfTours = 0;
            relatedTours = [];
            if (tourInfo.length > 0) {
                var exhibition_artworks = LADS.Worktop.Database.getArtworks(exhibition);
                if (exhibition_artworks && exhibition_artworks[0]) {
                    for (var i = 0; i < tourInfo.length; i++) {
                        if (tourInfo[i].Metadata.Private !== "true" && tourInfo[i].Metadata.RelatedArtworks) {
                            var relatedarts = JSON.parse(tourInfo[i].Metadata.RelatedArtworks);
                            for (var j = 0; j < relatedarts.length; j++) {
                                for (var k = 0; k < exhibition_artworks.length; k++) {
                                    if (exhibition_artworks[k].Identifier === relatedarts[j]) {
                                        // Add tour to viewer
                                        var tour = tourInfo[i];
                                        if (relatedTours.indexOf(tour) < 0) {
                                            artworkContent.append(makeTour(tour));
                                            relatedTours.push(tour);
                                            numberOfTours++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }


                if (numberOfTours === 0) {
                    //hide tour bar and show more text
                    text.css('visibility', 'hidden');
                    descContainer.css({ height: '100%' });
                    img1.css({ height: '39%' });
                    //img2.css({ height: '39%' }); //only one at present
                    //selectExhibition.css({ height: '8.5%' });
                    //hide bottomfadeout so it doesn't block the text
                    $('.Exhibitionbottomfadeout').css({ 'top': '95%' });
                    tourBar.hide();
                }
                else {
                    //adjusts size specific stuff only when it is loaded
                    text.css('visibility', 'visible');
                    tourBar.ready(function () {
                        tourBar.on("load", function () {
                            $('.tour').outerWidth(tourBar.outerWidth() / 4);
                            artworkContent.outerWidth($('.tour').outerWidth() * (1 + numberOfTours));
                        });
                    });
                }
            }
            else {
                //no tour at all

                //hide tour bar and show more text
                text.css('visibility', 'hidden');
                descContainer.css({ height: '100%' });
                img1.css({ height: '39%' });
                //img2.css({ height: '39%' });
                //selectExhibition.css({ height: '8.5%' });
            }

            overlayOnRoot.fadeOut();

            // hackish fix for overlay not fading out.
            setTimeout(function () {
                overlayOnRoot.fadeOut();
            }, 50);
        });

        if (!privateExhib)
            $(this).css({ 'background-color': 'rgb(255,255,255)', 'color': 'black' });

        currentExhElements.displayareasub = displayareasub;

        changeOrientation();

        $(document).ready(function () {
            displayareasub.css({ 'width': '60%', 'height': '60%' });
            setTimeout(function () {
                displayareasub.animate({
                    'width': '100%', 'height': '100%', 'left': '0%'
                }, 500);
            });
        });
    }

    /**
     * When a tour is selected in sidebar,
     * this function creates description to display in main display area
     * -David C.
     */
    function loadTour(tour, allTours) {
        if (this.data("selected")) { return; }//if the tour is already selected, do nothing

        this.data("selected", true);
        // Start loading artwork now in background
        var d;
        // Remove current contents of display area
        if (firstLoad) {
            d = currentExhElements.displayareasub;
            d.animate({ 'opacity': 0 }, 100, function () {
                d.remove();
            });
            firstLoad = false;
        }
        else if (currentExhElements) {
            currentExhElements.block.remove();
            d = currentExhElements.displayareasub;
            d.css('z-index', 1000);
            d.animate({
                'left': '20%',
                top: '20%',
                width: '150%',
                height: '150%',
                opacity: 0,
            },
            500, function () {
                d.remove();
            });
        }

        var displayareasub = $(document.createElement('div'));
        displayareasub.addClass('displayareasub');
        displayarea.append(displayareasub);

        currentExhElements = {};
        currentExhElements.block = $(document.createElement('div'));
        currentExhElements.block.css({
            "top": this.position().top, "left": "100%", "height": this.css('height'),
            "width": "4%", "font-size": "1.5em", 'position': 'absolute',
            'border': 'solid transparent', 'border-width': '5px 0px 5px 0px',
            'background-color': 'rgba(255,255,255,0)', 'z-index': '50'
        });

        // Make titles
        // fixed to work at small widths (in splitscreen and in portrait mode)
        titlediv = $(document.createElement('div'));
        titlediv.attr('id', 'tour-title');
        titlediv.addClass('tour-title');
        titlediv.css({
            'width': '85%',
            'margin-left': "10%", 'margin-top': "2%", "margin-right": "4%",
            'font-size': '2.7em',
            'text-align': 'left',
            'z-index': '40',
            'white-space': 'nowrap',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'height': '25%',
        });
        titlediv.html(tour.Name);
        // LADS.Util.fitText(titlediv, 1); //prev 0.7
        displayareasub.append(titlediv);
        currentExhElements.title = titlediv;

        /*****************************
        This is where the setting of the heading and the subheadin begin.*/

        sub1 = $(document.createElement('div'));
        sub1.addClass('tour-subtitle-1');
        sub1.attr('id', 'tour-subtitle-1');
        sub1.html(tour.Metadata.Subheading1);
        //LADS.Util.fitText(sub1, 1.5);
        displayareasub.append(sub1);
        currentExhElements.sub1 = sub1;

        sub2 = $(document.createElement('div'));
        sub2.addClass('tour-subtitle-2');
        sub2.attr('id', 'tour-subtitle-2');
        sub2.html(tour.Metadata.Subheading2);
        //LADS.Util.fitText(sub2, 2);
        displayareasub.append(sub2);
        currentExhElements.sub2 = sub2;
        /****************************************************************/


        // Display contains description, thumbnails and view button
        var display = $(document.createElement('div'));
        display.addClass('tour-info');

        // Might need to push this down farther (make top larger)
        displayareasub.append(display);

        currentExhElements.display = display;

        // Contains text
        var contentdiv = $(document.createElement('div'));
        contentdiv.addClass('contentdiv');
        display.append(contentdiv);

        // Tour description container
        var descContainer = $(document.createElement('div'));
        descContainer.addClass('description-container');
        descContainer.css({
            width: '100%',
            height: '60%',
            overflow: 'auto',
            'padding-right': '2%'
        });
        contentdiv.append(descContainer);


        // Thumbnails
        var imgwrapper = $(document.createElement('div'));
        imgwrapper.addClass("imgwrapper");
        var img1 = $(document.createElement('img'));
        img1.attr('src', LADS.Worktop.Database.fixPath(tour.Metadata.Thumbnail));
        img1.css({ "width": "auto", "height": "100%", "float": "right", 'margin-bottom': '2px', 'margin-left': '2%' }); //max : 49
        img1.attr('id', 'img1');
        imgwrapper.append(img1);
        descContainer.append(imgwrapper);

        /*******************************************
                I comment out all the images
                var img2 = $(document.createElement('img'));
                img2.attr('src', tour.Metadata.DescriptionImage2);
                img2.css({ "width": "auto", "height": "60%", "float": "right", 'margin-right': '5px', 'margin-left': '1%', 'margin-bottom': '1px' }); //height 73
                img2.attr('id', 'img2');
                contentdiv.append(img2);        contentdiv.append(img1); //append img1 second to preserve order
        
                descContainer.append(img2);
                **********************************************/

        // View button
        var selectTour = $(document.createElement('div'));
        selectTour.addClass('selectTour');

        descContainer.append(selectTour);

        var selectButton = $(document.createElement('img'));
        selectButton.addClass('selectButton');
        selectButton.attr('src', 'images/icons/Play.svg');

        selectButton.css({
            'padding-top': '2px',
            'padding-left': '3px',
            'z-index': 50,
            'vertical-align': 'middle',
            'float': 'left',
            'width': 'auto',
            'height': '90%',
        });

        bgimage.css('background-image', "url(" + LADS.Worktop.Database.fixPath(tour.Metadata.Thumbnail) + ")");

        selectTour.off('mousedown');
        selectTour.on('mousedown', function () {
            LADS.Util.UI.cgBackColor("forwardButton", selectTour);
            selectText.css({ 'color': 'white' });
        });
        selectTour.off('mouseleave');
        selectTour.on('mouseleave', function () {
            selectTour.css({ 'color': 'white', 'background-color': 'transparent' });
            selectText.css('color', 'black');
        });
        selectTour.off('click');
        selectTour.on('click', function () {
            switchPageTour(tour);
        });

        selectTour.append(selectButton);

        selectText = $(document.createElement('div'));
        selectText.addClass('select-text');
        selectText.attr('id', 'tour-select-text');

        selectText.text("Begin Tour");
        selectText.css({
            'font-size': LADS.Util.getMaxFontSizeEM("Begin Tour", 1, 1000, $(window).height() * 0.03),
        });
        selectTour.append(selectText);
        //LADS.Util.fitText(selectText, .5);

        var descriptiontext = $(document.createElement('div'));
        descriptiontext.addClass('description-text');
        descriptiontext.attr('id', 'description-text-tour');

        var string = '';
        if (tour.Metadata.Description) {
            string = tour.Metadata.Description.replace(/\n\r?/g, '<br>');
        }
        descriptiontext.html(string);
        //LADS.Util.fitText(descriptiontext, 2.5);
        descContainer.append(descriptiontext);

        //**************************************************************************
        //This is the part that varies from the artworks example.
        //It creates the "related artworks container"
        //If you want to comment it out comment out the following text until the next comments.
        //create the text fadeout effect for the top
        var topfadeout = $(document.createElement('div'));
        topfadeout.addClass('topfadeout');

        descriptiontext.append(topfadeout);
        //create the text fadeout effect for the bottom
        var bottomfadeout = $(document.createElement('div'));
        bottomfadeout.addClass('bottomfadeout');
        descriptiontext.append(bottomfadeout);

        //check the scroll state to make fadeout effect divs appear and disappear.
        descContainer.bind('scroll', function () {
            //if it reaches the bottom, hide the bottom fadeout effect. Otherwise, show it
            if (descContainer.scrollTop() + descContainer.innerHeight() >= descContainer[0].scrollHeight) {
                bottomfadeout.css({ 'display': 'none' });
            }
            else {
                bottomfadeout.css({ 'display': 'block' });
            }
            //if the scroller is not at the top, show the top fadeout effect. Otherwise, hide it.
            if (descContainer.scrollTop() > 0) {
                topfadeout.css({ 'display': 'block' });
            }
            else {
                topfadeout.css({ 'display': 'none' });
            }
        });
        var artworksBar = $(document.createElement('div'));
        artworksBar.addClass('artworksBar');

        var artworkContent = $(document.createElement('div'));
        artworkContent.addClass('artworkContent');

        var text = $(document.createElement('div'));
        text.addClass('interactive-tour-text');
        text.html("<b>Artworks in this Interactive Tour</b>");
        artworksBar.append(text);
        artworksBar.append(artworkContent);

        //create left fadeout for tourbar
        var leftfadeout = $(document.createElement('div'));
        leftfadeout.addClass('leftfadeout');
        artworkContent.append(leftfadeout);
        //create the right fadeout for tourBar
        var rightfadeout = $(document.createElement('div'));
        rightfadeout.addClass('rightfadeout');
        artworkContent.append(rightfadeout);

        //check the scroll state to make fadeout effect divs appear and disappear.
        artworkContent.bind('scroll', function () {
            //if it reaches the bottom, hide the bottom fadeout effect. Otherwise, show it
            if (artworkContent.scrollLeft() + artworkContent.innerWidth() >= artworkContent[0].scrollWidth) {
                rightfadeout.css({ 'display': 'none' });
            }
            else {
                rightfadeout.css({ 'display': 'block' });
            }
            //if div scrolls to the left, show the top fadeout effect. Otherwise, hide it.
            if (artworkContent.scrollLeft() > 0) {
                leftfadeout.css({ 'display': 'block' });
            }
            else {
                leftfadeout.css({ 'display': 'none' });
            }
        });

        contentdiv.append(artworksBar);
        //****************************************************** END of artworks

        var relatedArts = JSON.parse(tour.Metadata.RelatedArtworks);

        var displayLoading = $(document.createElement('div'));
        displayLoading.addClass('tourLoading');
        displayareasub.append(displayLoading);

        var overlayOnRoot = $(document.createElement('div'));
        overlayOnRoot.attr('id', 'overlay2');
        root.append(overlayOnRoot);
        LADS.Util.showLoading(displayLoading);
        //get all related artwork
        var artsAdded = {};

        function relatedArtHelper(nextArt, flag) {
            var _relatedTours = [];
            if (artsAdded[nextArt.Identifier]) return;
            artsAdded[nextArt.Identifier] = true;

            //if (allTours) {
            //    for (var k = 0; k < allTours.length; k++) {
            //        var currentTour = allTours[k];
            //        var privateState;
            //        if (currentTour.Metadata.Private) {
            //            privateState = (/^true$/i).test(currentTour.Metadata.Private);
            //        } else {
            //            privateState = false;
            //        }
            //        if (currentTour.Metadata.RelatedArtworks && !privateState) {
            //            var relatedarts = JSON.parse(currentTour.Metadata.RelatedArtworks);
            //            for (var j = 0; j < relatedarts.length; j++) {
            //                if (nextArt.Identifier === relatedarts[j]) {
            //                    // Add tour to viewer
            //                    if (_relatedTours.indexOf(currentTour) < 0) {
            //                        _relatedTours.push(currentTour);
            //                    }
            //                }
            //            }
            //        }
            //    }
            //}
            artworkContent.append(makeRelatedArt(nextArt, tour, _relatedTours));
            if (flag == relatedArts.length - 1) {
                overlayOnRoot.fadeOut();
                displayLoading.fadeOut();
            }
        }

        for (var i = 0; i < relatedArts.length; i++) {
            LADS.Worktop.Database.getDoqByGuid(relatedArts[i], i, relatedArtHelper);

        }

        if (relatedArts.length !== 0) {
            text.css('visibility', 'visible');
            descContainer.css({ height: "60%" });
            selectTour.css({ height: "12.3%" });
            artworksBar.ready(function () {
                artworksBar.on("load", function () {
                    $('.tour').outerWidth(artworksBar.outerWidth() / 4);
                    artworkContent.outerWidth($('.tour').outerWidth() * (1 + relatedArts.length));
                });
            });
        } else {
            overlayOnRoot.fadeOut();
            displayLoading.fadeOut();
            text.css('visibility', 'hidden');
        }

        this.css({ 'background-color': 'rgb(255,255,255)', 'color': 'black' });

        currentExhElements.displayareasub = displayareasub;

        changeOrientation();

        $(document).ready(function () {
            displayareasub.css({ 'width': '60%', 'height': '60%' });
            setTimeout(function () {
                overlayOnRoot.fadeOut();
                displayLoading.fadeOut();
                displayareasub.animate({
                    'width': '100%', 'height': '100%', 'left': '0%'
                }, 500);
            });
        });

    }

    /**
    * Function to add a related art to a tour at the bottom of the tour information section.  Takes the name of the tour to allow
    * the user to return to the appropriate tour when exiting artmode after entering it from the related art.
    *@return: related artworks
    */
    function makeRelatedArt(artInfo, tour, relatedTours) {
        var xml = LADS.Worktop.Database.getDoqXML(artInfo.Identifier);
        var parser = new DOMParser();
        var artworkXML = parser.parseFromString(xml, 'text/xml');
        if (artworkXML.getElementsByTagName('FolderId').length <= 1) {//if the artwork is not in any exhibition, don't show.
            return;
        }
        var art = $(document.createElement('div'));
        art.addClass('tour');
        art.css({
            'background-image': 'url(' + LADS.Worktop.Database.fixPath(artInfo.Metadata.Thumbnail) + ')'
        });

        var artName = $(document.createElement('div'));
        artName.addClass('tourName');

        var artTextName = artInfo.Name;

        if (artInfo.Name.length > 16) {
            artTextName = artTextName.substr(0, 16) + '...';
        }

        artName.text(artTextName);

        art.append(artName);
        //go to selected artwork mode when clicked
        art.click(function () {
            var curOpts = { catalogState: null, doq: artInfo, split: null };
            curOpts.split = 'L';
            var deepZoom = new LADS.Layout.Artmode("exhibitions", curOpts, tour);
            root.css({ 'overflow-x': 'hidden' });
            LADS.Util.UI.slidePageLeftSplit(root, deepZoom.getRoot());
        });

        return art;
    }

    /**
    *add related tours to an exhibition in the exhibition information section. 
    *@param: tourInfo 
    *@return: interactive tours to this exhibition
    */
    function makeTour(tourInfo) {
        var tour = $(document.createElement('div'));
        tour.addClass('tour');
        tour.css({
            'background-image': 'url(' + LADS.Worktop.Database.fixPath(tourInfo.Metadata.Thumbnail) + ')'
        });


        var tourName = $(document.createElement('div'));
        tourName.addClass('tourName');

        var tourTextName = tourInfo.Name;

        if (tourInfo.Name.length > 18) {
            tourTextName = tourTextName.substr(0, 18) + '...';
        }
        tourName.text(tourTextName);

        tour.append(tourName);

        tour.click(function () {
            switchPageTour(tourInfo);
        });

        return tour;
    }

    /**
    *switch the exhibition page to catalog/artmode
    */
    function switchPage(exhibition) {
        if (!switching) {
            switching = true;
            var catalog = new LADS.Layout.Catalog(exhibition);

            LADS.Util.UI.slidePageLeftSplit(root, catalog.getRoot(), function () {
                catalog.loadInteraction();
            });
        }
    }

    /**
    *switch player when currently in a tour page in exhibition
    */
    function switchPageTour(tour) {
        var rinData, rinPlayer;
        if (!switching) {
            switching = true;
            rinData = JSON.parse(unescape(tour.Metadata.Content));
            if (!rinData || !rinData.data) {
                var messageBox = $(LADS.Util.UI.popUpMessage(null, "Cannot play empty tour.", null));
                messageBox.css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 7);
                root.append(messageBox);
                messageBox.fadeIn(500);
                switching = false;
                return;
            }
            rinPlayer = new LADS.Layout.TourPlayer(rinData, tour);

            if (LADS.Util.Splitscreen.on()) {//if the splitscreen is on, exit it.
                var parentid = root.parent().attr('id');
                LADS.Util.Splitscreen.exit(parentid[parentid.length - 1]);
            }

            LADS.Util.UI.slidePageLeftSplit(root, rinPlayer.getRoot(), rinPlayer.startPlayback);
        }
    }

    /**
     * Function for reflowing page based on orientation / for splitscreen
     */
    function changeOrientation() {
        if (LADS.Util.Splitscreen.on()) { // Splitscreen and portrait mode
            leftbarHeader.css({
                height: '5%',
                width: '100%'
            });
            exhibitionLabel.css({
                width: '45%',
            });
            toursLabel.css({
                width: '45%',
            });
            if (selectText !== undefined) {
                selectText.css({
                    'font-size': '1em',
                    'letter-spacing': '0em',
                });
                titlediv.css({
                    'font-size': '3em',
                    'letter-spacing': '0em',
                });
                sub1.css({
                    'font-size': '1.5em',
                    'letter-spacing': '0em',
                });
                sub2.css({
                    'font-size': '1em',
                    'letter-spacing': '0em',
                });
            }
        } else { // Default
            leftbarHeader.css({
                height: '5%',
                width: '100%'
            });
            exhibitionLabel.css({
                width: '45%',
            });
            toursLabel.css({
                width: '45%',
            });
            if (selectText !== undefined) {
                selectText.css({
                    'font-size': LADS.Util.getMaxFontSizeEM("Begin Tour", 1, 1000, $(window).height() * 0.03),
                    'letter-spacing': 'inherit',
                });
                titlediv.css({
                    'font-size': '5.7em',
                    'letter-spacing': 'inherit',
                });
                if (sub1) {
                    sub1.css({
                        'font-size': '3em',
                        'letter-spacing': 'inherit',
                    });
                }
                if (sub2) {
                    sub2.css({
                        'font-size': '2em',
                        'letter-spacing': 'inherit',
                    });
                }
            }
        }
    }

    function getRoot() {
        return root;
    }

};

LADS.Layout.Exhibitions.default_options = { };