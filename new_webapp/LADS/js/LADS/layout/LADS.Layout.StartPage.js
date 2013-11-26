LADS.Util.makeNamespace("LADS.Layout.StartPage");

LADS.Layout.StartPage = function(options, startPageCallback) {
	"use strict";
	options = LADS.Util.setToDefaults(options, LADS.Layout.StartPage.default_options);
	var root = LADS.Util.getHtmlAjax('startPage.html');
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

    // first test server connectivity, then internet connectivity
	LADS.Worktop.Database.load(null, loadHelper); // don't need server checks now
	startPageCallback && startPageCallback(root);
    // $.ajax({
    //         url: serverURL,
    //         dataType: "text",
    //         async: true,
    //         cache: false,
    //         success: function () {
    //             LADS.Worktop.Database.load(null, loadHelper);
    //             if (startPageCallback) {
    //                 startPageCallback(root);
    // 			}
    //         },
    //         error: function (err) {
    //             $("body").empty();
    //             $("body").append((new LADS.Layout.InternetFailurePage("Server Down")).getRoot());
    //         }
    //     });

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
        
        $(museumName).addClass("startPageInfo");
        $(museumName).attr("id", "divName");
        $(museumName).append($(museumNameSpan));

        var museumLoc = document.createElement('div');
        var museumLocSpan = document.createElement('span');
        museumLocSpan.innerText = LADS.Worktop.Database.getMuseumLoc();
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
        $(infoTextHolder).addClass('infoTextHolder');

        var infoDiv = document.createElement('div');
        $(infoDiv).addClass('infoDiv');
        $(overlay).append(infoDiv);
        $(infoDiv).insertAfter($(brownInfoBox));
        $(infoDiv).append(infoTextHolder);
        $(infoTextHolder).append(museumName);
        $(infoTextHolder).append(museumLoc);
        $(infoTextHolder).append(museumInfoDiv);

        var serverSetUpLabel = serverSetUpContainer.find('#serverSetUpLabel');

        serverSetUpContainer.on('click', LADS.Util.UI.ChangeServerDialog);
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