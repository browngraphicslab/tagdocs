LADS.Util.makeNamespace('LADS.Authoring.FileUploader');

/**
 * Enum of file upload types
 */
LADS.Authoring.FileUploadTypes = {
    Standard: 0,
    DeepZoom: 1
};

/**
 * Helper class for performing file uploads
 * Also creates HTML overlay that displays progress / spinning wheel
 * Note: everything is handled internally, no external API, does its thing then removes itself and disappears
 * @param root              Root of HTML, upload overlay will be appended to this while upload is running and removed when finished automatically!
 * @param type              Type of file upload (defined by FileUploadTypes)
 * @param localCallback     Callback passed local file info (args: <WinJS.StorageFile> file, <String> localURL)
 * @param finishedCallback  Callback to execute once upload is finished (standard args: <String> url; deepzoom args: <String> xmlDoq)
 * @param filters           Array of file types selectable by user
 * @param useThumbs         Use thumbnail view mode?
 * @param progressFunc      Function to keep track of progress (e.g. for displaying a progress bar somewhere)
 */
LADS.Authoring.FileUploader = function (root, type, localCallback, finishedCallback, filters, useThumbs, errorCallback, multiple, innerProgBar) {
    "use strict";
    var that = {};
    filters = filters || ["*"];
    multiple = multiple || false;


    var uploadingOverlay = $(document.createElement('div')),
        innerProgressBar = $(document.createElement('div')); // HTML upload overlay
    var filesFinished = 0;
    var numFiles = 100000;
    var dataReaderLoads = [];
    var uploadQueue = LADS.Util.createQueue();
    var globalUriStrings = [], globalFiles = [], globalUpload = null;
    var percentLoaded = 0;
    var totalBytesToSend = {}; // an entry for each upload object, indexed by guid
    var totalBytesSent = {};
    var promises = [];
    var globalFilesObject;
    var uploadFilesObject;
    var maxDuration = Infinity;
    var minDuration = -1;
    var size;
    var largeFiles = "";
    var longFiles = [];
    var shortFiles = [];
    var fileUploadError;
    var maxFileSize = 50 * 1024 * 1024;
    var maxDeepZoomFileSize = 250 * 1024 * 1024;

    // Basic HTML initialization
    (function init() {
        var uploadOverlayText = $(document.createElement('label')),
            progressIcon = $(document.createElement('img')),
            progressBar = $(document.createElement('div'));

        // Progress / spinner wheel overlay to display while uploading
        uploadingOverlay.attr("id", "uploadingOverlay");
        uploadingOverlay.css({ 'position': 'absolute', 'left': '0%', 'top': '0%', 'background-color': 'rgba(0, 0, 0, .5)', 'width': '100%', 'height': '100%', 'z-index': 100000100 });

        uploadOverlayText.css({ 'color': 'white', 'width': '10%', 'height': '5%', 'top': '38%', 'left': '40%', 'position': 'relative', 'font-size': '250%' });
        uploadOverlayText.text('Uploading file(s). Please wait.');

        progressIcon.css({
            'position': 'relative', 'top': '50%', 'left': '14%'
        });
        progressIcon.attr('src', 'images/icons/progress-circle.gif');

        progressBar.css({
            'position': 'relative', 'top': '42%', 'left': '45%', 'border-style': 'solid', 'border-color': 'white', 'width': '10%', 'height': '2%'
        });

        innerProgressBar.css({
            'background-color': 'white', 'width': '0%', 'height': '100%'
        });

        progressBar.append(innerProgressBar);
        uploadingOverlay.append(uploadOverlayText);
        uploadingOverlay.append(progressBar);
        uploadingOverlay.hide();
        root.append(uploadingOverlay);
    })();

    /**
     * Starts the file upload
     */
    (function uploadFile() {
        // Opens file picker
        var currentState = Windows.UI.ViewManagement.ApplicationView.value;        
        var filePicker = new Windows.Storage.Pickers.FileOpenPicker();
        if (useThumbs) {
            filePicker.viewMode = Windows.Storage.Pickers.PickerViewMode.thumbnail;
        } else {
            filePicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
        }
        filePicker.fileTypeFilter.replaceAll(filters);
        filePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
        try {
            if (multiple) { // batch upload
                filePicker.pickMultipleFilesAsync().then(
                    uploadFilesObject = function (filesObject) { // Now file has been picked
                            var uriStrings = [],
                                upload = new UploadOp(),
                                localURLs = [],
                                k, files = [],
                                //largeFiles = [],
                                hashedDate, newHashedDate; // local URL
                            globalFilesObject = filesObject;
                            totalBytesToSend = {};
                            totalBytesSent = {};
                            largeFiles = "";
                            longFiles = [];
                            shortFiles = [];
                            var bar = innerProgBar || innerProgressBar; // reset the width of the uploading bar
                            bar.width("0%");
                            if (filesObject.length === 0) {
                                removeOverlay();
                                addLocalCallback([], [])();
                                return;
                            }
                            // create an actual array out of the windows files object -- filter out files that are too large/long

                            function fileLimitHelper(file, i) {
                                file.getBasicPropertiesAsync().then(
                                    function (basicProperties) {
                                        size = basicProperties.size;

                                        numFiles = files.length; // global
                                        var maxSize;
                                        switch (type) {
                                            case LADS.Authoring.FileUploadTypes.Standard:
                                                maxSize = maxFileSize;
                                                break;
                                            case LADS.Authoring.FileUploadTypes.DeepZoom:
                                                maxSize = maxDeepZoomFileSize;
                                                break;
                                        }
                                        if (size < maxSize) {
                                            files.push(file);
                                        }
                                        else {                                            
                                            largeFiles += ("<br />" + file.name);
                                        }

                                        for (k = 0; k < files.length; k++) {
                                            localURLs.push(window.URL.createObjectURL(files[k], { oneTimeOnly: true }));
                                        }

                                        switch (type) {
                                            case LADS.Authoring.FileUploadTypes.Standard:
                                                for (k = 0; k < files.length; k++) {
                                                    uriStrings.push(LADS.Worktop.Database.getSecureURL() + "/?Type=FileUpload&Client=Windows" + "&token=" + LADS.Auth.getToken());
                                                }
                                                break;
                                            case LADS.Authoring.FileUploadTypes.DeepZoom:
                                                for (k = 0; k < files.length; k++) {
                                                    uriStrings.push(LADS.Worktop.Database.getSecureURL() + "/?Type=FileUploadDeepzoom&Client=Windows&Guid=" + LADS.Worktop.Database.getCreatorID() + "&token=" + LADS.Auth.getToken());
                                                }
                                                break;
                                        }

                                        if (i < filesObject.length - 1) {
                                            fileLimitHelper(filesObject[i + 1], i + 1);
                                        }
                                        else if (i === (filesObject.length - 1)) {
                                            checkDurations(files, function () {
                                                var mins, secs;
                                                if (files.length === 0 && largeFiles !== '') { //no > time-limit files
                                                    removeOverlay();
                                                    addLocalCallback([], [])();
                                                    //alert that all files failed.
                                                    fileUploadError = uploadErrorAlert(null, "The selected file(s) could not be uploaded because they exceed the 50MB file limit.", null);
                                                    $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                                                    $('body').append(fileUploadError);
                                                    $(fileUploadError).fadeIn(500);
                                                    return;
                                                }
                                                else if (files.length === 0 && longFiles.length > 0) { // no > 50MB files
                                                    removeOverlay();
                                                    addLocalCallback([], [])();
                                                    mins = Math.floor(maxDuration / 60);
                                                    secs = maxDuration % 60;
                                                    if (secs === 0) secs = '00';
                                                    else if (secs <= 9) secs = '0' + secs;

                                                    fileUploadError = uploadErrorAlert(null, "The selected file(s) could not uploaded because they exceed " + mins + ":" + secs + " in length.", null);

                                                    $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                                                    $('body').append(fileUploadError);
                                                    $(fileUploadError).fadeIn(500);
                                                    return;
                                                }
                                                else if (files.length === 0 && shortFiles.length > 0) { // no > 50MB files
                                                    removeOverlay();
                                                    addLocalCallback([], [])();
                                                    mins = Math.floor(minDuration / 60);
                                                    secs = minDuration % 60;
                                                    if (secs === 0) secs = '00';
                                                    else if (secs <= 9) secs = '0' + secs;

                                                    fileUploadError = uploadErrorAlert(null, "The selected file(s) could not uploaded because they are shorter than " + mins + ":" + secs + " in length.", null);

                                                    $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                                                    $('body').append(fileUploadError);
                                                    $(fileUploadError).fadeIn(500);
                                                    return;
                                                }
                                                else if (files.length === 0) {
                                                    removeOverlay();
                                                    addLocalCallback([], [])();
                                                    mins = Math.floor(maxDuration / 60);
                                                    secs = maxDuration % 60;
                                                    if (secs === 0) secs = '00';
                                                    else if (secs <= 9) secs = '0' + secs;

                                                    fileUploadError = uploadErrorAlert(null, "The selected file(s) could not be uploaded because they exceed the 50MB file limit or exceed the " + mins + ":" + secs + " duration limit.", null);
                                                    $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                                                    $('body').append(fileUploadError);
                                                    $(fileUploadError).fadeIn(500);
                                                    return;
                                                }
                                                globalFiles = files;
                                                numFiles = files.length; // global
                                                globalUriStrings = uriStrings;
                                                globalUpload = upload;

                                                uploadStart(0, upload)();
                                                addLocalCallback(files, localURLs)();
                                            });
                                        }

                                    }
                                );
                            }

                            fileLimitHelper(filesObject[0], 0);
                    });
            }
            else { // single upload (I don't think this is used anymore, since we got rid of the buttons in the artwork editor
                filePicker.pickSingleFileAsync().then(
                    function (file) { // Now file has been picked

                        // error check
                        if (!file) {
                            removeOverlay();
                            addLocalCallback([], [], [])();
                        }
                        else {
                            file.getBasicPropertiesAsync().then(
                                   function (basicProperties) {
                                       size = basicProperties.size;

                                       var maxSize;
                                       switch (type) {
                                           case LADS.Authoring.FileUploadTypes.Standard:
                                               maxSize = maxFileSize;
                                               break;
                                           case LADS.Authoring.FileUploadTypes.DeepZoom:
                                               maxSize = maxDeepZoomFileSize;
                                               break;
                                       }
                                       //50 MB size limit for standard, 250 MB size limit for deep zoom images
                                       if (size < maxSize) {
                                           checkDuration(file, function () {
                                               var uriString,
                                                   upload = new UploadOp(),
                                                   localURL; // local URL

                                               globalFiles = [file];
                                               numFiles = 1;

                                               localURL = window.URL.createObjectURL(file, { oneTimeOnly: true });

                                               // Set specifics of request by type
                                               switch (type) {
                                                   case LADS.Authoring.FileUploadTypes.Standard:
                                                       uriString = LADS.Worktop.Database.getSecureURL() + "/?Type=FileUpload&Client=Windows" + "&token=" + LADS.Auth.getToken();
                                                       break;
                                                   case LADS.Authoring.FileUploadTypes.DeepZoom:
                                                       uriString = LADS.Worktop.Database.getSecureURL() + "/?Type=FileUploadDeepzoom&Client=Windows&Guid=" + LADS.Worktop.Database.getCreatorID() + "&token=" + LADS.Auth.getToken();
                                                       break;
                                               }

                                               globalUriStrings = [uriString];
                                               globalUpload = upload;

                                               // Set up the upload
                                               var msg;
                                               if (typeof (msg = localCallback([file], [localURL], [uriString])) === 'string') {
                                                   fileUploadError = uploadErrorAlert(null, msg, null);
                                                   $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                                                   $('body').append(fileUploadError);
                                                   $(fileUploadError).fadeIn(500);
                                               } else {
                                                   upload.start(0);
                                               }
                                           }, function () { // longbad
                                               var mins = Math.floor(maxDuration / 60);
                                               var secs = maxDuration % 60;
                                               if (secs === 0) secs = '00';
                                               else if (secs <= 9) secs = '0' + secs;

                                               fileUploadError = uploadErrorAlert(null, "The selected file exceeded the " + mins + ":" + secs + " duration limit and could not be uploaded.", null);
                                               $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                                               $('body').append(fileUploadError);
                                               $(fileUploadError).fadeIn(500);
                                           }, function () { // shortbad
                                               var mins = Math.floor(minDuration / 60);
                                               var secs = minDuration % 60;
                                               if (secs === 0) secs = '00';
                                               else if (secs <= 9) secs = '0' + secs;

                                               fileUploadError = uploadErrorAlert(null, "The selected file is shorter than the " + mins + ":" + secs + " lower duration limit and could not be uploaded.", null);
                                               $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                                               $('body').append(fileUploadError);
                                               $(fileUploadError).fadeIn(500);
                                           });

                                       }


                                       else {
                                           fileUploadError = uploadErrorAlert(null, "The selected file exceeded the 50MB file limit and could not be uploaded.", null);
                                           $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                                           $('body').append(fileUploadError);
                                           $(fileUploadError).fadeIn(500);

                                       }

                                   });
                        }

                    });
            }
        } catch (e) {
            // file access failed
            console.log("file access failed: "+e.message);
            if (errorCallback)
                errorCallback();
        }
    })();

    function checkDuration(file, good, longbad, shortbad) {
        if (file.fileType === '.mp3') {
            // Get music properties
            file.properties.getMusicPropertiesAsync().done(function (musicProperties) {
                if (musicProperties.duration / 1000 > maxDuration) {
                    longbad();
                } else if (musicProperties.duration / 1000 < minDuration) {
                    shortbad();
                } else {
                    good();
                }
            },
            longbad); // error callback
        } else if (file.fileType === '.mp4') {
            file.properties.getMusicPropertiesAsync().done(function (videoProperties) {
                if (videoProperties.duration / 1000 > maxDuration) {
                    longbad();
                } else if (videoProperties.duration / 1000 < minDuration) {
                    shortbad();
                } else {
                    good();
                }
            },
            longbad); // error callback
        } else {
            good();
        }
    }

    function checkDurations(files, callback) {
        var removeVals = [];
        var done = 0;
        if (files.length === 0) {
            callback();
        }
        for (var i = 0; i < files.length; i++) {
            helper(i);
        }

        function helper(j) {
            checkDuration(files[j], function () {
                done++;
                if (done === files.length) remove();
            }, function () { // longbad
                removeVals.push(j);
                longFiles.push(files[j]);
                done++;
                if (done === files.length) remove();
            }, function () { // shortbad
                removeVals.push(j);
                shortFiles.push(files[j]);
                done++;
                if (done === files.length) remove();
            });
        }

        function remove() {
            removeVals.sort(function (a, b) { return b - a; });
            for (var i = 0; i < removeVals.length; i++) {
                files.splice(removeVals[i], 1);
            }
            callback();
        }
    }

    function uploadStart(i, upload) {
        return function () {
            upload.start(i);
        };
    }

    function addLocalCallback(files, localUrls, uriStrings) {
        return function () {
            localCallback(files, localUrls, uriStrings);
        };
    }

    // Helper functions

    /**
     * Appends overlay to root
     * (no idea if this will actually disable interactions too as is)
     */
    function addOverlay(elmt) {
        if ($("#uploadingOverlay").length === 0) {
            elmt.append(uploadingOverlay);
        }
    }

    /**
     * Totally remove the overlay from the DOM / destroy
     */
    function removeOverlay() {
        uploadingOverlay.remove();
    }

    /**
     * Inner class that performs actual upload operation
     * Taken from: http://msdn.microsoft.com/en-us/library/windows/apps/Hh700372.aspx
     */
    function UploadOp() {
        var upload = null,
            promise = null;

        /**
         * Starts upload of given file
         * @param uriString     Spec passed to server
         * @param file          File object representing file to be uploaded
         */
        this.start = function (i) {
            var uri, uploader;
            var uriString = globalUriStrings[i], file = globalFiles[i];
            try {
                addOverlay(root);
                uploadingOverlay.show();

                uri = new Windows.Foundation.Uri(uriString);
                uploader = new Windows.Networking.BackgroundTransfer.BackgroundUploader();

                // Set a header, so the server can save the file (this is specific to the sample server).
                uploader.setRequestHeader("Filename", file.name);
                uploader.setRequestHeader("Content-Type", "multipart/form-data; boundary=----WebKitFormBoundaryqj1e7E6nvkEBR9N5");

                // Create a new upload operation.
                upload = uploader.createUpload(uri, file);
                var ind = upload.guid; // property name in the totalBytesSent object
                totalBytesSent[ind] = 0;
                file.getBasicPropertiesAsync().then(
                    function (basicProperties) {
                        size = basicProperties.size;

                            // Start the upload and persist the promise to be able to cancel the upload.
                            promise = upload.startAsync().then(interComplete(i), error, progress);
                            promises.push(promise);
                    }
                );
            } catch (err) {
                removeOverlay();
                console.log(err.message);
            }
        };

        // On application activation, reassign callbacks for a upload
        // operation persisted from previous application state.
        this.load = function (loadedUpload) {
            try {
                upload = loadedUpload;
                promise = upload.attachAsync().then(complete, error, progress(upload));
            } catch (err) {
                removeOverlay();
                if (errorCallback)
                    errorCallback();
            }
        };
    }

    function interComplete(i) {
        return function (uploadOperation) {
            complete(uploadOperation, i);
        };
    }

    /**
     * Called when upload is completed
     * @param uploadOperation       Finished upload passed by background uploader
     */
    function complete(uploadOperation, i) {
        var response = uploadOperation.getResponseInformation(),
            iInputStream = uploadOperation.getResultStreamAt(0),
            dataReader = new Windows.Storage.Streams.DataReader(iInputStream),
            loadop = dataReader.loadAsync(10000000);

        // Once response is read
        loadop.operation.completed = function () {
            var dataReaderLoad = dataReader.readString(dataReader.unconsumedBufferLength);
            dataReaderLoads.push($.trim(dataReaderLoad)); // DEBUGGING: this function mutates the data
            finishedUpload();
        };
        if(i<numFiles-1) {
            uploadStart(i + 1, globalUpload)();
        }
    }

    function finishedUpload() {
        filesFinished += 1;
        if (filesFinished === numFiles) {
            removeOverlay();
            finishedCallback(dataReaderLoads);
            var msg = "", str, mins, secs;
            var longFilesExist = false;
            var i;
            if (largeFiles !== "") {
                msg = "The following file(s) exceeded the 50MB file limit:" + largeFiles;
            }
            if (longFiles.length) {
                longFilesExist = true;
                mins = Math.floor(maxDuration / 60);
                secs = maxDuration % 60;
                if (secs === 0) {
                    secs = '00';
                }
                else if (secs <= 9) {
                    secs = '0' + secs;
                }
                str = "The following file(s) exceeded the " + mins + ":" + secs + " duration limit:<br />";
                for (i = 0; i < longFiles.length; i++) {
                    str = str + longFiles[i].name + "<br />";
                }
                msg = msg + str;
            }
            if (shortFiles.length) {
                if (longFilesExist) {
                    msg = msg + "<br />";
                }
                mins = Math.floor(minDuration / 60);
                secs = minDuration % 60;
                if (secs === 0) {
                    secs = '00';
                }
                else if (secs <= 9) {
                    secs = '0' + secs;
                }
                str = "The following file(s) are shorter than the " + mins + ":" + secs + " lower duration limit:<br />";
                for (i = 0; i < shortFiles.length; i++) {
                    str = str + shortFiles[i].name + "<br />";
                }
                msg = msg + str;
            }
            if (msg) {
                var fileUploadError = uploadErrorAlert(null, msg, null, false, true);
                $(fileUploadError).css('z-index', LADS.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(fileUploadError);
                $(fileUploadError).fadeIn(500);
            }
        }
    }

    /**
     * If file upload fails
     */
    function error(err) {
        var shouldContinue = false;
        if (err.message.split(" ")[0] === "Unauthorized") {
            removeOverlay();
            console.log("unauthorized");
            LADS.Auth.authenticate(
                function () {
                    uploadFilesObject(globalFilesObject); // need to deal with this for single file uploads, too, if this ever comes back...
                },
                function () {
                    shouldContinue = true;
                    var popup = LADS.Util.UI.popUpMessage(null, "File(s) not uploaded. You must login to upload files.");
                    $('body').append(popup);
                    $(popup).show();
                }
            );
        }
        if (shouldContinue) {
            console.log('file upload error: ' + err.message);
            console.log(err.message);
            removeOverlay();
            
            if (errorCallback) {
                errorCallback();
            }
        }
    }

    /**
     * Called by uploader as upload progresses
     * @param upload        upload object / info
     */
    function progress(upload) {        
        var bar = innerProgBar || innerProgressBar;
        totalBytesToSend[upload.guid] = upload.progress.totalBytesToSend;
        var bytesSent = upload.progress.bytesSent;
        totalBytesSent[upload.guid] = bytesSent;
        var percentComplete = 0;
        for (var key in totalBytesSent) {
            if (totalBytesToSend[key]) {
                percentComplete += totalBytesSent[key] / (totalBytesToSend[key] * numFiles);

            }
        }        
        bar.width(percentComplete * 90 + "%");
    }

    function cancelPromises() {
        var i;
        for (i = 0; i < promises.length; i++) { // promise.cancel doesn't do anything for fulfilled promises
            promises[i].cancel();
        }
    }
    that.cancelPromises = cancelPromises;

    function setMaxDuration(seconds) {
        maxDuration = seconds;
    }
    that.setMaxDuration = setMaxDuration;

    function setMinDuration(seconds) {
        minDuration = seconds;
    }
    that.setMinDuration = setMinDuration;

    /**
    * copied from LADS.Util.UI because the boxes have crap CSS. tru fax.
    */
    function uploadErrorAlert(clickAction, message, buttonText, noFade, useHTML) {
        var overlay = LADS.Util.UI.blockInteractionOverlay();

        var confirmBox = document.createElement('div');
        var confirmBoxSpecs = LADS.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });

        $(confirmBox).css({
            position: 'absolute',
            left: confirmBoxSpecs.x + 'px',
            top: confirmBoxSpecs.y + 'px',
            width: confirmBoxSpecs.width + 'px',
            height: confirmBoxSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });

        var messageLabel = document.createElement('div');
        $(messageLabel).css({
            'color': 'white',
            'width': '90%',
            'height': '57.5%',
            'left': '5%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word',
            'overflow-y': 'auto',
        });
        if (useHTML) {
            $(messageLabel).html(message);
        } else {
            $(messageLabel).text(message);
        }
        var optionButtonDiv = document.createElement('div');
        $(optionButtonDiv).addClass('optionButtonDiv');
        $(optionButtonDiv).css({
            'height': '30%',
            'width': '98%',
            'position': 'absolute',
            'bottom': '0%',
            'right': '2%',
        });

        var confirmButton = document.createElement('button');
        $(confirmButton).css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'margin-right': '3%',
            'margin-top': '0%',
        });
        buttonText = (!buttonText || buttonText === "") ? "OK" : buttonText;
        $(confirmButton).text(buttonText);
        confirmButton.onclick = function () {
            if (clickAction)
                clickAction();
            removeAll();
        };

        function removeAll() {
            if (noFade) {
                $(overlay).hide();
                $(overlay).remove();
            } else {
                $(overlay).fadeOut(500, function () { $(overlay).remove(); });
            }
        }

        $(optionButtonDiv).append(confirmButton);

        $(confirmBox).append(messageLabel);
        $(confirmBox).append(optionButtonDiv);

        $(overlay).append(confirmBox);
        return overlay;
    }

    return that;
};