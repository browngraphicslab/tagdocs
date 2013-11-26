var LADS = LADS || {};

LADS.Auth = (function () {
    "use strict";
    if (!LADS.AuthOverlay) {
        var overlay = generateOverlay();
        LADS.AuthOverlay = overlay.overlay;
        LADS.AuthSubmit = overlay.submit;
        LADS.AuthCancel = overlay.cancel;
        LADS.AuthInput = overlay.input;
        LADS.AuthError = overlay.error;
        LADS.AuthCircle = overlay.circle;
    }

    return {
        getToken: getToken,
        clearToken: clearToken,
        authenticate: authenticate,
        hashPass: hashPass,
        changePassword: changePassword,
    };

    function getToken() {
        return LADS.AuthToken || null;
    }

    function clearToken() {
        LADS.AuthToken = null;
    }

    function hashPass(passwd, salt) {
        var string = passwd + salt;
        var hash = CryptoJS.SHA256(string);
        for (var i = 0; i < 1023; i++) {
            hash = CryptoJS.SHA256(hash);
        }
        return hash;
    }

    function checkPassword(passwd, onSuccess, onFail, onError) {
        LADS.Worktop.Database.getSalt(function (salt) {
            LADS.Worktop.Database.getAuth(passwd, salt,
                function (token) {
                    LADS.AuthToken = token;
                    onSuccess();
                },
                onFail,
                onError);
        }, onError);
    }

    function changePassword(oldpass, newpass, onSuccess, onFail, onError) {
        if (!checkValidPassword(newpass)) {
            onFail('Password must contain at least 8 characters with 3 of the following types:<br>Lowercase letter<br>Uppercase letter<br>Number<br>Symbol');
            return;
        }
        LADS.Worktop.Database.getSalt(function (salt) {
            LADS.Worktop.Database.changePass(oldpass, salt, newpass,
                function (token) {
                    LADS.AuthToken = token;
                    onSuccess();
                },
                onFail,
                onError);
        });
    }

    function checkValidPassword(pass) {
        if (pass && pass.length >= 8) {
            var matches = 0;
            if (pass.match(/(?=.*[a-z])/)) {
                matches++;
            }
            if (pass.match(/(?=.*[A-Z])/)) {
                matches++;
            }
            if (pass.match(/(?=.*[\d])/)) {
                matches++;
            }
            if (pass.match(/(?=.*[\W])/)) {
                matches++;
            }
            if (matches >= 3) {
                return true;
            }
        }
        return false;
    }

    function authenticate(onSuccess, onCancel) {
        if (LADS.AuthToken) {
            LADS.Worktop.Database.checkToken(LADS.AuthToken, onSuccess, showForm, showForm);
        } else showForm();
        function showForm() {
            $('body').append(LADS.AuthOverlay);
            LADS.AuthInput.val('');
            LADS.AuthOverlay.fadeIn(500);
            LADS.AuthInput.focus();
            LADS.AuthSubmit.show();
            LADS.AuthCancel.show();
            LADS.AuthCancel.click(function () {
                LADS.AuthError.hide();
                LADS.AuthCircle.hide();
                LADS.AuthOverlay.fadeOut(500, function () {
                    LADS.AuthOverlay.remove();
                    if (onCancel)
                        onCancel();
                });
            });
            LADS.AuthSubmit.click(function () {
                LADS.AuthError.hide();
                LADS.AuthCircle.show();
                LADS.AuthSubmit.hide();
                LADS.AuthCancel.hide();
                checkPassword(LADS.AuthInput.val(), function () {
                    LADS.AuthError.hide();
                    LADS.AuthCircle.hide();
                    LADS.AuthOverlay.remove();
                    onSuccess();
                }, function () {
                    LADS.AuthError.html('Invalid Password. Please try again...');
                    LADS.AuthError.show();
                    LADS.AuthCircle.hide();
                    LADS.AuthSubmit.show();
                    LADS.AuthCancel.show();
                }, function () {
                    LADS.AuthError.html('There was an error contacting the server. Contact a server administrator if this error persists.');
                    LADS.AuthError.show();
                    LADS.AuthError.css({'bottom': '30%'});
                    LADS.AuthCircle.hide();
                    LADS.AuthSubmit.show();
                    LADS.AuthCancel.show();
                });
            });
        }
    }

    function generateOverlay(onSuccess, onCancel) {
        var overlay = $(document.createElement('div'));
        overlay.attr('id', 'loginOverlay');
        overlay.css({
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,0.6)',
            'z-index': 100000002,
        });

        var loginDialog = $(document.createElement('div'));
        loginDialog.attr('id', 'loginDialog');


        ///

        var loginDialogSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height(),

        {
            center_h: true,
            center_v: true,
            width: 0.5,
            height: 0.35,
            max_width: 560,
            max_height: 210,
        });
        loginDialog.css({
            position: 'absolute',
            left: loginDialogSpecs.x + 'px',
            top: loginDialogSpecs.y + 'px',
            width: loginDialogSpecs.width + 'px',
            height: loginDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });

        ///


        //loginDialog.css({
        //    position: 'absolute',
        //    left: '34%',
        //    width: 'auto',
        //    top: '30%',
        //    border: '3px double white',
        //    'background-color': 'black',
        //    'padding': '2.5% 2.5%',
        //});
        overlay.append(loginDialog);
        var dialogTitle = $(document.createElement('div'));
        dialogTitle.attr('id', 'dialogTitle');
        dialogTitle.css({

            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            //'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            //'overflow': 'hidden',
        });
        dialogTitle.text('Please enter authoring mode password.');

        var passwdInput = $(document.createElement('input'));
        passwdInput.attr({
            type: 'password',
            id: 'password',
            name: 'password',
            placeholder: 'password',
        });
        passwdInput.css({
            display: 'block',
            'position':'relative',
            margin: 'auto',
            'margin-top': '5%',
            'margin-bottom': '5%'
        });

        var errorMessage = $(document.createElement('div'));
        errorMessage.attr('id', 'errorMessage');
        errorMessage.css({
            color: 'white',
            //'font-size': '1.25em',
            'margin-bottom': '10px',
            'left': '10%',
            'width': '80%',
            'text-align': 'center',
            'bottom': '36%',
            'position': 'absolute',
        });
        errorMessage.html('Invalid Password. Please try again...'); //<br/>Please contact <a href="mailto:brown.touchartgallery@gmail.com">brown.touchartgallery@gmail.com</a> for password.');
        errorMessage.hide();

        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            //'margin-top': '10px',
            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'bottom': '-10%'
        });
        var submitButton = $(document.createElement('button'));
        submitButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
           'margin-left': '-2%',
        'display': 'inline-block',
        });
        var circle = $(document.createElement('img'));
        circle.css({
            'width': '20px',
            'height': 'auto',
            'display': 'none',
            'margin-right': '3%',
            'margin-top': '2.5%',
            'float': 'right'
        });
        circle.attr('src', 'images/icons/progress-circle.gif');


        submitButton.text('Submit');
        var authFailed = function () {
            errorMessage.show();
            circle.hide();
        };
        var submit = function () {
            errorMessage.hide();
            circle.show();
        };

        var cancelButton = $(document.createElement('button'));
        cancelButton.attr('type', 'button');
        cancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'float': "right",
            'margin-right': '-2%',
            'display': 'inline-block',
    });
        cancelButton.text('Cancel');
        loginDialog.append(dialogTitle);
        loginDialog.append(passwdInput);
        loginDialog.append(errorMessage);
        loginDialog.append(buttonRow);
        buttonRow.append(cancelButton);
        buttonRow.append(submitButton);
        buttonRow.append(circle);

        return {
            overlay: overlay,
            input: passwdInput,
            submit: submitButton,
            cancel: cancelButton,
            error: errorMessage,
            circle: circle
        };
    }
})();