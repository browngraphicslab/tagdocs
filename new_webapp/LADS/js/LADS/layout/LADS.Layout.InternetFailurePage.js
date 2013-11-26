LADS.Util.makeNamespace("LADS.Layout.InternetFailurePage");
LADS.Util.makeNamespace("LADS.Layout.InternetFailure");

LADS.Layout.InternetFailure.lastOverlay = {};

/*
    BM - Using this for more than internet failure, should
    be renamed/refactored in the future.
*/
LADS.Layout.InternetFailurePage = function (errorType, detach) {
    "use strict";

    this.getRoot = function () {
        return root;
    };


    var root = LADS.Util.getHtmlAjax('internetFailurePage.html');
    var mainPanel = root.find("#mainPanel");

    var needPassword = false; //used to determine whether password input box appears

    init();

    function init() {

        // var sadface = $(document.createElement('label'));
        // Commented out sadface for now
        //$(sadface).text(':(');
        // sadface.css({ 'font-size': '1000%', 'color': 'white', 'position': 'absolute', 'top': '12%', 'left': '35%' });

        var noticeBox = mainPanel.find("#noticeBox");

        var noticeLabel = noticeBox.find("#noticeLabel");

        var noticeText = getNoticeText(errorType);

        function getNoticeText(error) {
            if (error == "Server Down")
                return "The server is currently unavailable. Please contact the museum administrator for further information.";
            else if (error == "No Internet")
                return 'No internet connection was detected. The TAG application requires internet connectivity. Please ensure that you are connected to the internet and try again.';
            else if (error === "Internet Lost")
                return 'Internet connection lost. The TAG application requires internet connectivity. Please ensure that you are connected to the internet and try again.';
            else if (error === "Data Limit")
                return 'We have detected that you are on a limited data connection. TAG downloads large images, audio, and videos that can significantly increase your data usage.  By clicking "I Agree" you agree to allow TAG to download images, audio, and videos.  Clicking "I Disagree" will exit TAG.';
            return "";
        }

        noticeLabel.text(noticeText);

        var reconnectButton = noticeBox.find("#reconnectButton");

        var changeServerButton = $(document.createElement('button'));
        changeServerButton.attr("id", "changeServerButton");

        changeServerButton.on('click', LADS.Util.UI.ChangeServerDialog);

        if (errorType === "Data Limit") {
            reconnectButton.text('I Agree');

            var disagreeButton = $(document.createElement('button'));
            disagreeButton.attr("id", "disagreeButton");
            disagreeButton.text('I Disagree');
            noticeBox.append(disagreeButton);
            disagreeButton.click(function () {
                window.close();
            });
            reconnectButton.click(function () {
                localStorage.acceptDataUsage = "true";
                if (!detach) {
                    $("body").empty();
                    LADS.Layout.StartPage(null, function (page) {
                        $("body").append(page);
                    });
                } else {
                    root.remove();
                }
            });
        }
        else if (errorType === "Server Down") {
            reconnectButton.text('Reconnect');
            changeServerButton.text('Change Server');
            changeServerButton.attr('type', 'button');
            noticeBox.append(changeServerButton);
        }
        else {//shouldn't really happen?
            reconnectButton.text('Reconnect');
        }


        if (errorType !== "Data Limit") {
            reconnectButton.click(function () {

                noticeLabel.text("Reconnecting...");
                reconnectButton.hide();
                changeServerButton.hide();
                //sadface.hide();

                setTimeout(function () { // this timeout is here because the label didn't have time to reset itself otherwise
                    $.ajax({
                        url: 'http://' + localStorage.ip + ':8080',
                        dataType: "text",
                        async: false,
                        cache: false,
                        success: function () {
                            if (!detach) {
                                $("body").empty();
                                //$("body").append((new LADS.Layout.StartPage()).getRoot());
                                LADS.Layout.StartPage(null, function (page) {
                                    $("body").append(page);
                                });
                            } else {
                                root.remove();
                            }
                        },
                        error: function (err) {
                            $.ajax({
                                url: "http://google.com",
                                dataType: "text",
                                async: true,
                                cache: false,
                                success: function () {
                                    noticeLabel.text(getNoticeText("Server Down"));
                                    reconnectButton.show();
                                    changeServerButton.show();
                                    //sadface.show();
                                    //if (!detach) {
                                    //    $("body").empty();
                                    //    $("body").append((new LADS.Layout.InternetFailurePage("Server Down")).getRoot());
                                    //} else {
                                    //    root.detach();
                                    //    $("body").append((new LADS.Layout.InternetFailurePage("Server Down")).getRoot());
                                    //}
                                },
                                error: function (err) {
                                    noticeLabel.text(getNoticeText((errorType === "Internet Lost" ? "Internet Lost" : "No Internet")));
                                    reconnectButton.show();
                                    changeServerButton.show();
                                    //sadface.show();
                                    //if (!detach) {
                                    //    $("body").empty();
                                    //    $("body").append((new LADS.Layout.InternetFailurePage("No Internet")).getRoot());
                                    //} else {
                                    //    root.detach();
                                    //    $("body").append((new LADS.Layout.InternetFailurePage("No Internet")).getRoot());
                                    //}
                                }
                            });
                        }
                    });
                }, 100);
            });
        }

        var quitButton = $(document.createElement('button'));
        quitButton.text('Exit');
        quitButton.click(function () {


        });

        //$(noticeBox).append(quitButton);

        //mainPanel.append(sadface);
        LADS.Layout.InternetFailure.lastOverlay.root = root;
        LADS.Layout.InternetFailure.lastOverlay.type = errorType;
    }
};