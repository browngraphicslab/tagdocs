LADS.Util.makeNamespace("Worktop.Database");

Worktop.Database = function (url) {

    // Set useAmazon to false and useAzure to true to use azure
    var useAmazon = false; // should match what's in LADS.Layout.StartPage.js
    var useAzure = true;
    var HTTP_PORT = LADS.Worktop.Database.HTTP_PORT;
    var HTTPS_PORT = LADS.Worktop.Database.HTTPS_PORT;
    var FILE_PORT = LADS.Worktop.Database.FILE_PORT;
    
    console.log("localStorage.ip = " + localStorage.ip);
    if (localStorage.ip === "137.117.37.220") localStorage.ip = "browntagserver.com"; // Switch to new domain for HTTPS
    var _baseURL = localStorage.ip ? localStorage.ip : (useAmazon ? "ec2-23-21-147-138.compute-1.amazonaws.com" :
        (useAzure ? "browntagserver.com" : "10.116.71.58")) /*unnamed*/;  // url of the server
    localStorage.ip = _baseURL; // added this to keep localStorage.ip current -bleveque
    console.log("after _baseURL set, localStorage.ip = " + localStorage.ip);
    var useServer = true;

    return {
        useAmazon: useAmazon,
        useAzure: useAzure,
        useServer: useServer,
        _baseURL: _baseURL,
        getURL: getURL,
        getFileURL: getFileURL,
        getSecureURL: getSecureURL,
        setURL: setURL,
        getDoqByGUID: getDoqByGUID,
        getDoqByName: getDoqByName,
        getDoqLinqsByGUID: getDoqLinqsByGUID,
        getLinqByGUID: getLinqByGUID,
        getDoqsInFolderByName: getDoqsInFolderByName,
        getDoqsInFolderByGUID: getDoqsInFolderByGUID,
        deleteDoq: deleteDoq,
        deleteLinq: deleteLinq,
        createEmptyDoq: createEmptyDoq,
        createHotspot: createHotspot,
        createNewExhibition: createNewExhibition,
        isUseServer: isUseServer,
        uploadImage: uploadImage,
        createTour: createTour,
        use: useAmazon,
        setBaseURL: setBaseURL,
    }; 

    function setBaseURL(url) {
        _baseURL = url;
    }


    // server vs. local bool
    function isUseServer() {
        return useServer;
    }

    // set server URL
    function setURL(url) {
        _baseURL = url;
    }

    // get server URL
    function getURL() {
        return "http://" + _baseURL + ':' + HTTP_PORT;
    }

    function getSecureURL() {
        var useHttps = LADS.Worktop.Database.checkSetting('UseHTTPS');
        if (useHttps && useHttps.toLowerCase() === 'true') {
            return "https://" + _baseURL + ':' + HTTPS_PORT;
        } else {
            return "http://" + _baseURL + ':' + HTTP_PORT;
        }
    }

    function getFileURL() {
        return "http://" + _baseURL + ':' + FILE_PORT;
    }

    // create new exhibition
    // Non-async version depricated, don't use
    function createNewExhibition() {
        var request = $.ajax({
            url: getSecureURL() + "/?Type=CreateExhibition&Guid=" + LADS.Worktop.Database.getCreatorID() + "&token=" + LADS.Auth.getToken(),
            type: "PUT",
            dataType: "text",
            async: false
        });
    }

    /* 
     * returns a worktop doq representing tour object
     */
    function createTour(onSuccess, onFail, onError) {
        var url = getSecureURL() + "/?Type=CreateTour&Guid=" + LADS.Worktop.Database.getCreatorID() + "&token=" + LADS.Auth.getToken();
        var isAsync = !!onSuccess;
        var result;
        var request = $.ajax({
            url: url,
            type: "PUT",
            dataType: "text",
            async: isAsync,
            success: function () {
                if (isAsync) {
                    if (request.responseText) {
                        try {
                            result = new Worktop.Doq(request.responseText);
                            onSuccess(result);
                        }
                        catch (err) {
                            console.log(err);
                        }
                    }
                }
            },
            error: function () {
                if (request.statusText === "Unauthorized")
                    LADS.Worktop.Database.checkAuth(function () { createTour(onSuccess, onFail, onError); }, onFail);
                else
                    onError && onError();
            },
        });
        if (!isAsync && request.responseText) {
            try {
                return new Worktop.Doq(request.responseText);
            }
            catch (err) {
                console.log("error in createTour: " + err.message);
            }
        }
    }

    /* 
     * The getDoqByGUID method returns a worktop doq when given a GUID. The method uses the local XML
     * if useServer == false.
     */
    function getDoqByGUID(guid, callback) {
        var doq;
        if (useServer)
            url = getURL() + "/?Type=Doq&Guid=" + guid;
        else
            url = "testXML/" + guid + ".xml";

        var isAsync = !!callback;

        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: isAsync,
            success: function () {
                if (isAsync && request.responseText) {
                    //try { //bleveque
                    var doq = new Worktop.Doq(request.responseText);
                    callback(doq);
                    return;
                    //}
                    //catch (err) {
                    //    console.log(err.message);
                    //    getDoqByGUID(guid, callback);
                    //}
                }
            },
            error: function (err) {
                return;
            }
        });

        request.fail(function (request, error) {
            console.log(error);
        });

        if (!isAsync && request.responseText) {
            try { //bleveque
                doq = new Worktop.Doq(request.responseText);
            }
            catch (e) {
                console.log(e.message);
                //doq = getDoqByGUID(guid, callback);
            }
            return doq;
        }
    }

    /* 
 * The getLinqByGUID method returns a worktop doq when given a GUID. The method uses the local XML
 * if useServer == false.
 */
    function getLinqByGUID(guid) {
        var linq;
        if (useServer)
            url = getURL() + "/?Type=Linq&Guid=" + guid;
        else
            url = "testXML/" + guid + ".xml";

        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: false
        });

        request.fail(function (request, error) {
            console.log(error);
        });

        if (request.responseText) {
            try {
                return new Worktop.Doq(request.responseText);
            }
            catch (err) {
                console.log("error in getLinqByGUID: " + err);
                getLinqByGUID(guid);
            }
        }
    }

    /* 
     * The deleteDoq method sends a DELETE request to the server. The server in turn
     * 'soft' deletes the document from the database.
     */
    function deleteDoq(guid, onSuccess, onFail, onError) {
        url = getSecureURL() + "/?Type=Doq&Guid=" + guid + "&token=" + LADS.Auth.getToken();
        var isAsync = !!onSuccess;

        $.ajax({
            type: 'DELETE',
            url: url,
            async: isAsync,
            success: function () {
                onSuccess && onSuccess();
            },
            error: function (err1, err2, status) {
                if (status === "Unauthorized")
                    LADS.Worktop.Database.checkAuth(function () { deleteDoq(guid, onSuccess, onFail, onError); }, onFail);
                else
                    onError && onError();
            },
        });
        return true;
    }

    /* 
     * The deleteLinq method sends a DELETE request to the server. The server in turn
     * 'soft' deletes the linq from the database.
     */
    // Appears to be unused, don't use it in the future!
    function deleteLinq(guid) {
        url = getSecureURL() + "/?Type=Linq&Guid=" + guid + "&token=" + LADS.Auth.getToken();

        $.ajax({
            type: 'DELETE',
            url: url,
            async: false
        });
        return true;
    }

    /* 
     * The getDoqByName method returns a worktop doq when given a Doq Name. The method uses the local XML
     * if useServer == false. This request is only used for querying Main since the other documents are
     * queried using their GUIDS
     */
    function getDoqByName(name) {
        var doq;
        // use local xml when useServer = false
        if (useServer)
            url = getURL() + "/?Type=Doq&Name=" + name;
        else
            url = "testXML/" + name + ".xml";

        var request = $.ajax({
            url: url,
            cache: false, // forces browser to not cache the data
            dataType: "text",
            async: false
        });

        if (request.responseText) {
            try {
                var newDoq = new Worktop.Doq(request.responseText);

                return newDoq;
            }
            catch (err) {
                console.log("error in getDoqByName: " + err);
                getDoqByName(name);
            }
        }

        request.fail(function (request, error) {
            console.log(error);
        });
    }

    // get all doqs in specified folder, using folder name
    function getDoqsInFolderByName(name) {
        var doq;
        url = getURL() + "/?Type=DoqsInFolder&Name=" + name;
        // TEST while X-Domain is not working
        // url = "testXML/" + name + "_Content.xml";
        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: false,
            error: function (err) {
                return;
            }
        });

        if (request.responseText) {
            try {
                doq = new Worktop.Doq(request.responseText);
            }
            catch (e) {
                console.log(e.message);
                doq = getDoqsInFolderByName(name);
            }
            return doq;
        }
    }

    // get doqs in specified folder, using GUID
    function getDoqsInFolderByGUID(guid) {
        var doq;
        if (useServer)
            url = getURL() + "/?Type=DoqsInFolder&Guid=" + guid;
        else
            url = "testXML/" + guid + "_Content.xml";
        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: false,
            error: function (err) {
                return;
            }
        });

        if (request.responseText) {
            try {
                return new Worktop.Doq(request.responseText);
            }
            catch (err) {
                console.log("error in getDoqsInFolderByGUID: " + err.message);
                getDoqsInFolderByGUID(guid);
            }

        }
    }

    // get doq links by GUID
    function getDoqLinqsByGUID(guid, callback) {
        var doq;
        var isAsync = !!callback;
        if (useServer)
            url = getURL() + "/?Type=AllDoqLinqs&Guid=" + guid;
        else
            url = "testXML/" + guid + "_Content.xml";
        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: isAsync,
            success: function () {
                if (isAsync && request.responseText) {
                    try {
                        var doq = new Worktop.Doq(request.responseText);
                        if (callback)
                            callback(doq);
                    }
                    catch (err) {
                        console.log("error in getDoqLinqsByGUID: " + err.message);
                        getDoqLinqsByGUID(guid, callback);
                    }
                }
            },
            error: function (err) {
                return;
            }
        });
        if (!isAsync) {
            if (request.responseText) {
                try {
                    return new Worktop.Doq(request.responseText);
                }
                catch (err) {
                    console.log("error in getDoqLinqsByGUID: " + err.message);
                    getDoqLinqsByGUID(guid);
                }
            }
        }

    }

    // make a new doq
    // looks like its not used, so don't use it in the future without modification
    function createEmptyDoq(getMainCreatorID) {
        url = getSecureURL() + "/?Type=CreateDoq&Guid=" + getMainCreatorID + "&token=" + LADS.Auth.getToken();
        var request = $.ajax({
            url: url,
            type: "PUT",
            dataType: "text",
            async: false
        });
        return request.responseXML;
    }

    // make a new linq between specified GUIDs
    // looks like its not used, so don't use it in the future without modification
    function createLinq(guid1, guid2) {
        url = getSecureURL() + "/?Type=CreateLinq&Guid=" + guid1 + "&Guid=" + guid2 + "&token=" + LADS.Auth.getToken();
        var request = $.ajax({
            url: url,
            type: "PUT",
            dataType: "text",
            async: false
        });
        return request.responseXML;
    }

    // create a hotspot on specified artwork
    function createHotspot(creatorID, artworkGUID, onSuccess, onFail, onError) {
        // SHOULD BE TESTED
        url = getSecureURL() + "/?Type=CreateHotspot&Guid=" + creatorID + "&Guid2=" + artworkGUID + "&token=" + LADS.Auth.getToken();// + "&h=" + LADS.Worktop.Database.hash(Date.now()/1000);
        var request = $.ajax({
            url: url,
            type: "PUT",
            dataType: "text",
            async: false
        });
        return request.responseXML;
    }

    // upload an image
    function uploadImage(dataurl, creatorID, onSuccess, onFail, onError) {
        url = getSecureURL() + "/?Type=FileUploadDataURL&Guid=" + creatorID + "&token=" + LADS.Auth.getToken();
        var request = $.ajax({
            url: url,
            type: "POST",
            dataType: "text",
            async: !!onSuccess,
            data: dataurl,
            success: function () {
                onSuccess && onSuccess(request.responseText);
            },
            error: function () {
                if (request.statusText === "Unauthorized")
                    LADS.Worktop.Database.checkAuth(function () { uploadImage(dataurl, creatorID, onSuccess, onFail, onError); }, onFail);
                else
                    onError && onError();
            },
        });
        return request.responseText;
    }

};

