LADS.Util.makeNamespace("LADS.Layout.StartPage");

LADS.Layout.StartPage = function (options, startPageCallback, hideFirstPage) {
    "use strict";
    hideFirstPage = true; // FOR CERTIFICATION
    options = LADS.Util.setToDefaults(options, LADS.Layout.StartPage.default_options);
    var root = LADS.Util.getHtmlAjax('startPage.html');
    console.log("root = " + root);
    var overlay = root.find('.overlay');
    var dialogOverlay = $(document.createElement('div'));
    var passwdInput = $(document.createElement('input'));
    var serverPasswdInput = $(document.createElement('input'));
    var authoringTagBuffer = root.find('#authoringTagBuffer');
    var authoringModeLabelContainer = authoringTagBuffer.find("#authoringModeLabelContainer");
    var serverTagBuffer = root.find("#serverTagBuffer");
    var serverSetUpContainer = serverTagBuffer.find("#serverSetUpContainer");
    var serverDialogOverlay = $(document.createElement('div'));
    var repository = options.repository;

    var useAmazon = false; // should match what's in Worktop.Database.js
    var useAzure = true;

    var needPassword = false; //used to determine whether password input box appears

    if (localStorage.ip && localStorage.ip.indexOf(':') !== -1) {
        localStorage.ip = localStorage.ip.split(':')[0];
    }
    var serverURL = 'http://' + (localStorage.ip ? localStorage.ip + ':8080' : (useAmazon ? "ec2-23-21-147-138.compute-1.amazonaws.com:8080" : (useAzure ? "browntagserver.com:8080" : "10.116.71.58:8080")));
    console.log("checking server url: " + serverURL);

    // double-ended priority queue testing
    //var minComp = function (element) {
    //    return element.key;
    //};
    //var maxComp = function (element) {
    //    return -1 * element.key;
    //};

    var a = { key: 5, altkey: 7 }, b = { key: 8, altkey: 9 }, c = { key: 10, altkey: 14 }, d = { key: 25, altkey: 30 };
    //var depq = LADS.Util.createDoubleEndedPQ(minComp, maxComp)
    //depq.add(a);
    //depq.add(b);
    //depq.add(c);
    //depq.add(d);
    //if (depq.find(a) === a) {
    //    console.log("found a");
    //};

    // AVL tree testing
    var comparator = function (a, b) {
        if (a.key < b.key) {
            return -1;
        } else if (a.key > b.key) {
            return 1;
        } else {
            return 0;
        }
    };
    
    var avltree = new AVLTree(comparator);
    avltree.add(a);
    avltree.add(b);
    avltree.add(c);
    avltree.add(d);
    console.log(avltree.findNext(c).key);


    // first test server connectivity, then internet connectivity
    $.ajax({
        url: serverURL,
        dataType: "text",
        async: true,
        cache: false,
        success: function () {
            LADS.Worktop.Database.load(null, loadHelper);
            if (startPageCallback)
                startPageCallback(root);
            if (!localStorage.acceptDataUsage && Windows && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile() && Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile().getDataPlanStatus().dataLimitInMegabytes) {
                $("body").append(new LADS.Layout.InternetFailurePage("Data Limit", true).getRoot());
            }
        },
        error: function (err) {
            $.ajax({
                url: "http://google.com",
                dataType: "text",
                async: true,
                cache: false,
                success: function () {
                    $("body").empty();
                    $("body").append((new LADS.Layout.InternetFailurePage("Server Down")).getRoot());
                },
                error: function (err) {
                    $("body").empty();
                    $("body").append((new LADS.Layout.InternetFailurePage("No Internet")).getRoot());
                }
            });
        }
    });

    var that = {};

    //sets up the entire visual layout and images of the splash screen
    function loadHelper() {
        var fullScreen = root.find("#background")
        LADS.Util.Constants.set("START_PAGE_SPLASH", "images/birdtextile.jpg");
        fullScreen.css('background-image', "url(" + LADS.Worktop.Database.getStartPageBackground() + ")");

        var overlayColor = LADS.Worktop.Database.getOverlayColor();
        var overlayTransparency = LADS.Worktop.Database.getOverlayTransparency();

        var backgroundColor = LADS.Util.UI.hexToRGB(overlayColor) + overlayTransparency + ')';

        var imageBgColor = LADS.Worktop.Database.getLogoBackgroundColor();
        var logoContainer = overlay.find("#logoContainer");
        logoContainer.css('background-color', imageBgColor);

        var logo = logoContainer.find("#logo");
        logo.attr('src', LADS.Worktop.Database.getMuseumLogo());

        logoContainer.click(function (evt) {
            evt.stopPropagation();
        });

        overlay[0].onclick = switchPage;

        var brownInfoBox = overlay.find("#brownInfoBox");
        brownInfoBox[0].onclick = expandInfo;

        var expandInfoButton = brownInfoBox.find("#expandInfoButton");

        var expandImage = expandInfoButton.find("#expandImage");

        var tagName = brownInfoBox.find("#tagName");

        var fullTag = brownInfoBox.find("#fullTag");

        var infoExpanded = false; //used to expand/collapse info
        var brownPeople = document.createElement('div');
        $(brownPeople).addClass('brownPeople');
        brownPeople.innerText = "Brown University \nAndy van Dam, Alex Hills, Yudi Fu, Karishma Bhatia, Gregory Chatzinoff, John Connuck, David Correa, Mohsan Elahi, Aisha Ferrazares, Jessica Fu, Kaijan Gao, Jessica Herron, Ardra Hren, Hak Rim Kim, Inna Komarovsky, Ryan Lester, Benjamin LeVeque, Josh Lewis, Jinqing Li, Jeffery Lu, Xiaoyi Mao, Ria Mirchandani, Julie Mond, Ben Most, Jonathan Poon, Dhruv Rawat, Jacob Rosenfeld, Anqi Wen, Dan Zhang, Libby Zorn";

        var sponsoredText = document.createElement('label');
        $(sponsoredText).attr("id", "sponsoredText");
        $(sponsoredText).text('Sponsored by');

        var microsoftLogo = document.createElement('img');
        $(microsoftLogo).attr("id", "microsoftLogo");
        $(microsoftLogo).attr('src', 'images/icons/MicrosoftLogo.png');

        var museumName = document.createElement('div');
        var museumNameSpan = document.createElement('span');
        museumNameSpan.innerText = LADS.Worktop.Database.getMuseumName();
        $(museumNameSpan).attr('id', 'museumName');
        $(museumNameSpan).css('height', '100%');
        $(museumName).css({
            'position': 'relative',
            'word-wrap': 'break-word',
            'width': '100%',
            'height': '30%',
            'outline-offset': '0',
            'outline': '0',
            'padding-top': '-4%'
        });
        $(museumName).addClass("startPageInfo");
        $(museumName).attr("id", "divName");
        $(museumName).append($(museumNameSpan));

        var museumLoc = document.createElement('div');
        var museumLocSpan = document.createElement('span');
        museumLocSpan.innerText = LADS.Worktop.Database.getMuseumLoc();
        $(museumLoc).css({
            'position': 'relative',
            'font-size': '3em',
            'word-wrap': 'break-word',
            'width': '100%',
            'height': '20%'
        });
        $(museumLoc).attr("id", "subheading");
        $(museumLoc).addClass("startPageInfo");
        $(museumLoc).append($(museumLocSpan));

        var nameDivSize;
        var nameSpanSize;
        var fontSizeSpan;

        var loadedInterval2 = setInterval(function () {
            fixText();
            clearInterval(loadedInterval2);
        });

        function fixText() {
            if (LADS.Util.elementInDocument($(museumName))) {
                var subheadingFont = parseInt($(museumLoc).css('font-size'), 10);
                //here we are going to construct the function
                nameDivSize = $(museumName).height();
                fontSizeSpan = $(museumName).height();
                $(museumNameSpan).css('font-size', nameDivSize + 'px');
                nameSpanSize = $(museumNameSpan).height();
                while (nameDivSize < nameSpanSize) {
                    fontSizeSpan--;
                    $(museumNameSpan).css('font-size', fontSizeSpan + 'px');
                    nameSpanSize = $(museumNameSpan).height();
                }
                $(museumNameSpan).css('height', nameSpanSize);
            }
        }
        that.fixText = fixText;

        var museumInfoDiv = document.createElement('div');

        $(museumInfoDiv).css({
            'position': 'relative',
            'word-wrap': 'break-word',
            'width': '100%',
            'height': '50% '
        });

        $(museumInfoDiv).addClass("startPageInfo");
        $(museumInfoDiv).attr("id", "spanContainer");
        var museumInfoSpan = document.createElement('span');
        museumInfoSpan.innerText = LADS.Worktop.Database.getMuseumInfo();
        $(museumInfoSpan).attr('id', 'museumInfo');
        $(museumInfoDiv).append($(museumInfoSpan));
        var loadedInterval = setInterval(function () {
            if (LADS.Util.elementInDocument($(museumInfoDiv))) {
                var subheadingFont = parseInt($(museumLoc).css('font-size'), 10);
                LADS.Util.UI.fitTextInDiv($(museumInfoSpan), Math.round(subheadingFont * 2 / 3), Math.round(subheadingFont * 1 / 3));
                clearInterval(loadedInterval);
            }
        });

        var infoTextHolder = document.createElement('div');
        $(infoTextHolder).css({
            'top': "0%",
            'position': 'relative',
            'padding': '0% 4%',
            'height': '100%'
        });
        $(infoTextHolder).addClass('infoTextHolder');

        var infoDiv = document.createElement('div');
        $(infoDiv).css({
            'width': '100%',
            'top': "42%",
            'height': '45%',
            'position': 'absolute',
            'background-color': backgroundColor
        });
        $(infoDiv).addClass('infoDiv');
        $(overlay).append(infoDiv);
        $(infoDiv).insertAfter($(brownInfoBox));
        $(infoDiv).append(infoTextHolder);
        $(infoTextHolder).append(museumName);
        $(infoTextHolder).append(museumLoc);
        $(infoTextHolder).append(museumInfoDiv);

        //var infoDiv = overlay.find(".infoDiv");
        //$(infoDiv).css('background-color', backgroundColor);

        //var infoTextHolder = infoDiv.find('.infoTextHolder');

        //var museumName = infoTextHolder.find("#divName");
        //var museumNameSpan =museumName.find("#museumName");
        //museumNameSpan.text(LADS.Worktop.Database.getMuseumName());

        //var museumLoc = infoTextHolder.find("#subheading");
        //var museumLocSpan = museumLoc.find("#museumLocSpan");
        //museumLocSpan.text(LADS.Worktop.Database.getMuseumLoc());

        //var museumInfoDiv = infoTextHolder.find("#spanContainer");
        //var museumInfoSpan = museumInfoDiv.find("#museumInfo");
        //museumInfoSpan.text(LADS.Worktop.Database.getMuseumInfo());

        //var nameDivSize;
        //var nameSpanSize;
        //var fontSizeSpan;

        //var loadedInterval2 = setInterval(function () {
        //    fixText();
        //    clearInterval(loadedInterval2);
        //});

        //function fixText() {
        //    if (LADS.Util.elementInDocument($(museumName))) {
        //        var subheadingFont = parseInt($(museumLoc).css('font-size'), 10);
        //        //here we are going to construct the function
        //        nameDivSize = $(museumName).height();
        //        fontSizeSpan = $(museumName).height();
        //        $(museumNameSpan).css('font-size', nameDivSize + 'px');
        //        nameSpanSize = $(museumNameSpan).height();
        //        while (nameDivSize < nameSpanSize) {
        //            fontSizeSpan--;
        //            $(museumNameSpan).css('font-size', fontSizeSpan + 'px');
        //            nameSpanSize = $(museumNameSpan).height();
        //        }
        //        $(museumNameSpan).css('height', nameSpanSize);
        //    }
        //}
        //that.fixText = fixText;

        //var loadedInterval = setInterval(function () {
        //    if (LADS.Util.elementInDocument($(museumInfoDiv))) {
        //        var subheadingFont = parseInt($(museumLoc).css('font-size'), 10);
        //        LADS.Util.UI.fitTextInDiv($(museumInfoSpan), Math.round(subheadingFont * 2 / 3), Math.round(subheadingFont * 1 / 3));
        //        clearInterval(loadedInterval);
        //    }
        //});

        var serverSetUpLabel = serverSetUpContainer.find('#serverSetUpLabel');

        serverSetUpContainer.on('click', LADS.Util.UI.ChangeServerDialog);
        serverTagBuffer.on('click', function (evt) {
            evt.stopPropagation();
        });

        // duplicate?
        serverTagBuffer.on('click', function (evt) {
            evt.stopPropagation();
        });

        function openServerChange() {
            serverPasswdInput.val('avd');
            serverDialogOverlay.fadeIn(500);
        }

        var authoringModeIcon = authoringModeLabelContainer.find("#authoringModeIcon");

        authoringModeLabelContainer.on('click', openDialog);
        authoringTagBuffer.on('click', function (evt) {
            evt.stopPropagation();
        });

        /**
         * Allow changing ip address of the server (shows up in bottom right corner of splash screen)
         */
        var ipSave = function () {
            // VALIDATE IP, call serverIpValidationFailed if fails
            // show spinning circle
            serverCircle.show();

            // first check authoring password to make sure it's not a museum guest changing the server ip!
            LADS.Worktop.Database.getAuth($(serverPasswdInput).val(), validateIp, serverAuthFailed);
        };

        function validateIp() {
            serverPasswordErrorMessage.hide();
            var newIp = serverDialogInput.attr('value');
            newIp = (newIp.substring(0, 7) === 'http://') ? newIp : ('http://' + newIp);

            //check to see if it's valid
            $.ajax({
                url: newIp,
                dataType: "text",
                async: true,
                success: function () {
                    var oldIp = LADS.Worktop.Database.getURL();
                    localStorage.ip = newIp;
                    LADS.Worktop.Database.setURL(newIp);
                    LADS.Worktop.Database.testIp(validIp, invalidIp(oldIp));

                },
                error: function (err) {
                    serverErrorMessage.show();
                    serverCircle.hide();
                },
            });
        }
        function setPassedTrue() {
            passedServerAuth = true;
        }
        function serverAuthFailed() {
            serverCircle.hide();
            serverErrorMessage.hide();
            serverPasswordErrorMessage.show();
            return false;
        }
        function validIp() {
            serverCircle.hide();
            serverErrorMessage.hide();
            serverPasswordErrorMessage.hide();
            clearServerInputs();
            serverDialogOverlay.fadeOut(500);
        }
        function invalidIp(oldIp) {
            return function () {
                serverCircle.hide();
                serverPasswordErrorMessage.hide();
                serverErrorMessage.show();
                LADS.Worktop.Database.setURL(oldIp);
            };
        }
        function clearServerInputs() {
            serverPasswdInput.attr("value", "");
            serverDialogInput.attr("value", "");
        }
        //serverSaveButton[0].onclick = ipSave;

        var serverCancelButton = $(document.createElement('button'));
        serverCancelButton.attr("id", "serverCancelButton");
        serverCancelButton.attr('type', 'button');

        serverCancelButton.text('Cancel');
        serverCancelButton[0].onclick = function () {
            serverErrorMessage.hide();
            serverCircle.hide();
            clearServerInputs();
            serverDialogOverlay.fadeOut(500);
        };


        //////////////
        //////////////

        var touchHintDiv = overlay.find("#touchHintDiv");
        var touchHint = touchHintDiv.find("#touchHint");
        var handGif = touchHintDiv.find("#handGif");

        
        touchHintDiv.append(touchHint);
        touchHintDiv.append(handGif);
        LADS.Util.fitText(touchHint, 2);

        handGif[0].onclick = switchPage;
        //if (startPageCallback)
        //    startPageCallback(that);

        function preventClickThrough(event) {
            event.cancelBubble = true;
        }

        //this handes the animation for opening/closing the div that holds the information about the project
        function expandInfo(event) {
            event.cancelBubble = true;
            if (infoExpanded) {
                infoExpanded = false;
                $(expandImage).css({ 'transform': 'scaleX(1)' });
                $(expandInfoButton).animate({ width: '15%', 'border-top-left-radius': '0px' }, 700);
                $(brownInfoBox).animate({ width: '20%', height: '10%', right: "0%", 'border-top-left-radius': '0px' }, 700);
                $(sponsoredText).remove();
                $(microsoftLogo).remove();
                $(fullTag).animate({ left: '20%', top: '60%', 'font-size': '90%' }, 700);
                $(tagName).animate({ left: '20%', top: '10%', 'font-size': '250%' }, 700);
                $(brownPeople).animate({ "left": "75%", "top": "75%", 'font-size': '0%' }, 500);
            }
            else {
                infoExpanded = true;
                $(expandInfoButton).animate({ width: '8%', 'border-top-left-radius': '20px' }, 700);
                $(brownInfoBox).animate({ width: '60%', height: '25%', right: "0%", 'border-top-left-radius': '20px' }, 700);
                $(brownInfoBox).append(brownPeople);
                $(brownInfoBox).append(sponsoredText);
                $(brownInfoBox).append(microsoftLogo);
                $(expandImage).css({ 'transform': 'scaleX(-1)' });
                $(brownPeople).css({ "right": "0%", "bottom": "0%", "position": "absolute", "font-size": "0%" });
                $(brownPeople).animate({ "left": "12%", "top": "40%", "position": "absolute", "font-size": "80%" }, 700, 'swing', function () { $(brownPeople).fitText(5); });
                $(tagName).animate({ left: '12%', top: '3%', 'font-size': '300%' }, 700);
                $(fullTag).animate({ left: '12%', top: '25%', 'font-size': '150%' }, 700);
            }

        }

        //opens the exhibitions page on touch/click
        function switchPage() {
            var exhibitions = new LADS.Layout.Exhibitions();
            overlay[0].onclick = null; //prevent repeated clicks while switch occurs
            LADS.Util.UI.slidePageLeft(exhibitions.getRoot());
        }

        //opens the password dialog before allowing user to enter authoring mode
        function openDialog() {
            LADS.Auth.authenticate(enterAuthoringMode);
            return;
        }

        function enterAuthoringMode() {
            overlay[0].onclick = null; //prevent repeated clicks while switch occurs
            authoringModeLabelContainer.off('click');
            // authoringMode = new LADS.Layout.ContentAuthoring();
            var authoringMode = new LADS.Authoring.NewSettingsView();
            LADS.Util.UI.slidePageLeft(authoringMode.getRoot());
        }

        // Uncomment following line if you want the startup window to always show
        // localStorage.hideStartupWindow = "";

        // IS THIS STILL BEING USED????????????????????????????????
        if (!hideFirstPage && !localStorage.hideStartupWindow) { // commented out for app store certification until we have server set-up package implemented

            var firstOverlay = $(document.createElement('div'));
            firstOverlay.attr("id", "firstOverlay");
            firstOverlay.css({
                position: 'absolute',
                left: '0px',
                top: '0px',
                width: '100%',
                height: '100%',
                'background-color': 'rgba(0,0,0,0.6)',
                'z-index': 1000,
            });
            $(root).append(firstOverlay);

            var box = $(document.createElement('div'));
            box.attr("id", "depBox");
            box.css({
                'height': '20%', // changed this from 60% CERTIFICATION
                'width': '55%',
                'position': 'absolute',
                'top': '40%', // changed this from 20% CERTIFICATION
                'left': '25%',
                'background-color': 'black',
                'border': '3px double white',
            });
            firstOverlay.append(box);

            //var closeButton = $(document.createElement('img'));
            //closeButton.attr('src', 'images/icons/x.png');
            //closeButton.css({
            //    'position': 'absolute',
            //    'right': '1%',
            //    'top': '1%',
            //    'width': '5%',
            //    'height': 'auto',
            //});
            //closeButton.click(function () {
            //    firstOverlay.detach();
            //});
            //box.append(closeButton);

            var checkDiv = $(document.createElement('div'));
            checkDiv.css({
                'position': 'absolute',
                'left': '4%',
                'bottom': '2%',
            });
            var checkBox = $(document.createElement('input'));
            checkBox.attr('type', 'checkbox');
            checkBox.prop('checked', false);
            checkBox.css({
                '-ms-transform': 'scale(1.3)',

            });
            checkBox.click(function (evt) {
                if (checkBox.prop('checked')) {
                    localStorage.hideStartupWindow = "true";
                } else {
                    localStorage.hideStartupWindow = "";
                }
                evt.stopPropagation();
            });
            checkDiv.click(function () {
                if (checkBox.prop('checked')) {
                    localStorage.hideStartupWindow = "";
                    checkBox.prop('checked', false);
                } else {
                    localStorage.hideStartupWindow = "true";
                    checkBox.prop('checked', true);
                }
            });
            var checkText = $(document.createElement('div'));
            checkText.css({
                'display': 'inline-block',
                'font-size': '120%',
            });
            checkText.text("Don't show this menu again");
            checkDiv.append(checkBox).append(checkText);
            box.append(checkDiv);

            var availSoonText = $(document.createElement('div'));
            availSoonText.css({
                'font-size': '120%',
                'position': 'absolute',
                'right': '1%',
                'bottom': '2%',
                'width': '50%',
            });
            availSoonText.html(
                "TAG Server will be available for download shortly.  Contact us for server setup at <a href='mailto:brown.touchartgallery@outlook.com'>brown.touchartgallery@outlook.com</a>."
                );
            box.append(availSoonText);

            var div1 = $(document.createElement('div'));
            div1.css({
                'position': 'absolute',
                'top': '8%',
                'left': '1%',
                'width': '93%',
                'height': '60%', //changed this from 22% while we only have one option CERTIFICATION
                'color': 'white',
            });
            divHighlight(div1);
            var goImage1 = $(document.createElement('img'));
            goImage1.attr('src', 'images/back.svg');
            goImage1.css({
                'height': '44%',
                'width': 'auto',
                'position': 'absolute',
                'right': '1%',
                'top': '5%', // 28
                '-ms-transform': 'scale(-1)',
            });
            div1.append(goImage1);
            var title1 = $(document.createElement('label'));
            title1.css({
                'font-size': '250%',
                'margin-left': '3%',
                'width': '80%',
            });
            var sub1 = $(document.createElement('label'));
            sub1.css({
                'font-size': '160%',
                'margin-left': '3%',
                'width': '80%',
            });
            div1.append(title1).append('<br>').append(sub1);

            var div2 = $(document.createElement('div'));
            div2.css({
                'position': 'absolute',
                'top': '32%',
                'left': '1%',
                'width': '93%',
                'height': '22%',
                'color': 'gray',
            });
            //divHighlight(div2);
            var goImage2 = $(document.createElement('img'));
            goImage2.attr('src', 'images/Back_gray.svg');
            goImage2.css({
                'height': '44%',
                'width': 'auto',
                'position': 'absolute',
                'right': '1%',
                'top': '5%', // 28
                '-ms-transform': 'scale(-1)',
            });
            div2.append(goImage2);
            var title2 = $(document.createElement('label'));
            title2.css({
                'font-size': '250%',
                'margin-left': '3%',
                'width': '80%',
            });
            var sub2 = $(document.createElement('label'));
            sub2.css({
                'font-size': '160%',
                'margin-left': '3%',
                'width': '80%',
            });
            div2.append(title2).append('<br>').append(sub2);

            var div3 = $(document.createElement('div'));
            div3.css({
                'position': 'absolute',
                'top': '56%',
                'left': '1%',
                'width': '93%',
                'height': '22%',
                'color': 'gray',
            });
            //divHighlight(div3);
            var goImage3 = $(document.createElement('img'));
            goImage3.attr('src', 'images/Back_gray.svg');
            goImage3.css({
                'height': '44%',
                'width': 'auto',
                'position': 'absolute',
                'right': '1%',
                'top': '5%', // 28
                '-ms-transform': 'scale(-1)',
            });
            div3.append(goImage3);
            var title3 = $(document.createElement('label'));
            title3.css({
                'font-size': '250%',
                'margin-left': '3%',
                'width': '80%',
            });
            var sub3 = $(document.createElement('label'));
            sub3.css({
                'font-size': '160%',
                'margin-left': '3%',
                'width': '80%',
            });
            div3.append(title3).append('<br>').append(sub3);

            title1.text('Try Out TAG Demo');
            sub1.text('');
            div1.click(function () {
                firstOverlay.detach();
                checkDataUsage();
            });

            title2.text('Set Up Your Own TAG Server');
            sub2.text('');

            title3.text('Connect to TAG Server');
            sub3.text('');

            box.append(div1);
            //box.append(div2);
            //box.append(div3);
        }
        function divHighlight(div) {
            div.mousedown(function () {
                div.css({
                    'background-color': 'white',
                    'color': 'black',
                });
            });
            div.mouseup(function () {
                div.css({
                    'background-color': 'black',
                    'color': 'white',
                });
            });
            div.mouseleave(function () {
                div.css({
                    'background-color': 'black',
                    'color': 'white',
                });
            });
        }
    }

    function checkDataUsage() {
        console.log('');
    }

    function getRoot() {
        return root;
    }
    that.getRoot = getRoot;

    return that;
};



LADS.Layout.StartPage.default_options = {
    repository: "http://cs.brown.edu/research/lads/LADS2.0Data/repository.xml",
};