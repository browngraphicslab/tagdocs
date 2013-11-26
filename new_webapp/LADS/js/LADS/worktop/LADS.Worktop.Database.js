LADS.Util.makeNamespace("LADS.Worktop.Database");

LADS.Worktop.Database = (function () {
    var _db,
        _main,
        _exhibitions = [],
        _cacheXML = {},
        _exhibitionDirty = true,
        _artworkDirty = true,
        _tourDirty = true,
        _artworks = [],
        _tours = [],
        HTTP_PORT = '8080',
        HTTPS_PORT = '9001',
        FILE_PORT = '8086';

    return {
        HTTP_PORT: HTTP_PORT,
        HTTPS_PORT: HTTPS_PORT,
        FILE_PORT: FILE_PORT,
        getExhibitions: getExhibitions,
        getArtworks: getArtworks,
        getMuseumName: getMuseumName,
        getMuseumLoc: getMuseumLoc,
        getMuseumInfo: getMuseumInfo,
        getStartPageBackground: getStartPageBackground,
        getMuseumLogo: getMuseumLogo,
        getMuseumOverlayColor: getMuseumOverlayColor,
        getMuseumOverlayTransparency: getMuseumOverlayTransparency,
        getLogoBackgroundColor: getLogoBackgroundColor,
        load: load,
        getExhibitionBackgroundImage: getExhibitionBackgroundImage,
        updateCache: updateCache,
        getMainGuid: getMainGuid,
        getXML: getXML,
        pushXML: pushXML,
        pushLinq: pushLinq,
        getDoqXML: getDoqXML,
        getLinqXML: getLinqXML,
        getOverlayColor: getOverlayColor,
        getOverlayTransparency: getOverlayTransparency,
        deleteDoq: deleteDoq,
        deleteHotspot: deleteHotspot,
        getDoqLinqs: getDoqLinqs,
        createEmptyDoq: createEmptyDoq,
        createLinq: createLinq,
        reloadMain: reloadMain,
        hash: hash,

        createHotspot: createHotspot,
        getURL: getURL,
        getSecureURL: getSecureURL,
        setURL: setURL,
        getFileURL: getFileURL,
        createNewExhibition: createNewExhibition,
        getCreatorID: getCreatorID,
        parentDoq: parentDoq,
        getAllArtworks: getAllArtworks,
        setArtworkDirty: setArtworkDirty,
        isArtworkDirty: isArtworkDirty,
        isExhibitionDirty: isExhibitionDirty,
        getDoqByGuid: getDoqByGuid,
        getDoqByName: getDoqByName,
        uploadImage: uploadImage,
        createTour: createTour,
        getAllTours: getAllTours,
        getAuth: getAuth,
        getSalt: getSalt,
        testIp: testIp,
        checkToken: checkToken,
        fixPath: fixPath,
        checkAuth: checkAuth,
        getAllFeedback: getAllFeedback,
        createFeedback: createFeedback,
        changePass: changePass,
        changeServer: changeServer,
        checkSetting: checkSetting,
    }

    function load (repo, callback) {
        // Load database
        _db = new Worktop.Database(repo);

        // Populate
        if (callback) { // not in use right now
            var doq;
            // use local xml when useServer = false
            var name = "Main";
            var url;
            if (_db.useServer)
                url = _db.getURL() + "/?Type=Doq&Name=" + name;
            else
                url = "testXML/" + name + ".xml";
          
            var request = $.ajax({
                url: url,
                cache: false, // forces browser to not cache the data
                dataType: "text",
                async: true,
                success: function (data) {
                   
                    if (request.responseText) {
                        _main = new Worktop.Doq(request.responseText);
                        
                        callback();
                    }

                },
                error: function (err) {
                    return;
                }
            });
        }
        else {
          
            _main = _db.getDoqByName("Main");
        }
    }

    function reloadMain(callback) {
        if (callback) {
            var doq;
            var name = "Main";
            var url;
            if (_db.useServer)
                url = _db.getURL() + "/?Type=Doq&Name=" + name;
            else
                url = "testXML/" + name + ".xml";

            var request = $.ajax({
                url: url,
                cache: false, // forces browser to not cache the data
                dataType: "text",
                async: true,
                success: function (data) {
                    if (request.responseText) {
                        _main = new Worktop.Doq(request.responseText);
                        callback();
                    } else {
                    }
                },
                error: function (err) {
                    return;
                }
            });
        }
        else {
            _main = _db.getDoqByName("Main");
        }
    }

    function checkSetting(key, onSuccess) {
        if (onSuccess) {
            reloadMain(function () {
                onSuccess(_main.Metadata['Setting_' + key]);
            });
        } else {
            return _main.Metadata['Setting_' + key];
        }
    }

    function isExhibitionDirty() {
        return _exhibitionDirty;
    }

    function setExhibitionDirty(value) {
        _exhibitionDirty = value;
    }

    function getMuseumName() {
        return _main.Metadata["MuseumName"];
    }

    function getMuseumOverlayColor() {
        return _main.Metadata["OverlayColor"];
    }

    function getMuseumOverlayTransparency() {
        return _main.Metadata["OverlayTransparency"];
    }

    function getMuseumLoc() {
        return _main.Metadata["MuseumLoc"];
    }

    function getMuseumInfo() {
        return _main.Metadata["MuseumInfo"];
    }

    function getStartPageBackground() {
        return LADS.Worktop.Database.fixPath(_main.Metadata["BackgroundImage"]);
    }

    function getMuseumLogo() {
        return LADS.Worktop.Database.fixPath(_main.Metadata["Icon"]);
    }

    function getLogoBackgroundColor() {
        return _main.Metadata["IconColor"];
    }

    function getOverlayColor() {
        return _main.Metadata["OverlayColor"];
    }
    function getOverlayTransparency() {
        return _main.Metadata["OverlayTransparency"];
    }

    function getMainGuid() {
        return _main.Identifier;
    }

    function getExhibitionBackgroundImage() {
       // return getExhibitions(true)[0].Metadata["BackgroundImage"];
    }
    
    // 
    function getDoqXML(guid, callback) {
        if (callback) {
            _db.getDoqByGUID(guid, function () {
                callback(getXML(guid));
            });
        } else {
            _db.getDoqByGUID(guid);
            return getXML(guid);
        }
    }

    // get doq links using GUID - see worktop.database.js
    function getDoqLinqs(guid, callback) {
        if (callback) {
            _db.getDoqLinqsByGUID(guid, callback);
        } else 
            return _db.getDoqLinqsByGUID(guid);
    }

    function getLinqXML(guid, callback) {
        if (callback) {
            var linq;
            if (_db.useServer)
                url = _db.getURL() + "/?Type=Linq&Guid=" + guid;
            else
                url = "testXML/" + guid + ".xml";

            var request = $.ajax({
                url: url,
                dataType: "text",
                cache: false, // forces browser to not cache the data
                async: true,
                success: function () {
                    if (request.responseText) {
                        try {
                            new Worktop.Doq(request.responseText);
                            var xmlToParse = getXML(guid);
                            var xmlHotspot = $.parseXML(xmlToParse);
                            callback(false, xmlHotspot);
                        }
                        catch (err) {
                            console.log("error in getLinqXML: " + err);
                            getLinqXML(guid, callback);
                        }
                    }
                }
            });

            request.fail(function (request, error) {
                console.log(error);
            });

        }
        else {

            _db.getLinqByGUID(guid);
            return getXML(guid);
        }

    }

    // helper function for sorting a specified set
    function sortHelper(toSort) {
        toSort.sort(function (a, b) {
            if (a.Name < b.Name) {
                return -1;
            } else if (a.Name > b.Name) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    // get all exhibitions
    function getExhibitions(callback) {
        if (_exhibitionDirty) {
            if (callback) {
                var exhibits;
                var guid = _main.Identifier;
                var doq, url;
                if (_db.useServer)
                    url = _db.getURL() + "/?Type=DoqsInFolder&Guid=" + guid;
                else
                    url = "testXML/" + guid + "_Content.xml";


                var request = $.ajax({
                    url: url,
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: true,
                    success: function (data) {
                        _exhibitions = [];
                        if (request.responseText) {
                            try {
                                exhibits = new Worktop.Doq(request.responseText);
                                if (exhibits[0]) {
                                    $.each(exhibits, function (i, e) {
                                        if (e.Metadata.Type == "Exhibit") {
                                            _exhibitions.push(e);
                                        }
                                    });
                                }
                                _exhibitionDirty = false;
                                sortHelper(_exhibitions);
                                callback(_exhibitions);
                            }
                            catch (err) {
                                console.log("error in getExhibitions: " + err);
                                callback([]);
                            }
                        } else {
                            callback([]);
                        }
                    },
                    error: function (err) {
                        console.log("ajax fails in getExhibition");
                    }
                });
            } else {
                   _exhibitions = [];
                    var exhibits = _db.getDoqsInFolderByGUID(_main.Identifier);
                    if (exhibits[0]) {
                        $.each(exhibits, function (i, e) {
                            if (e.Metadata.Type == "Exhibit") {
                                _exhibitions.push(e);
                            }
                        });
                    }
                  
                    sortHelper(_exhibitions);
                return _exhibitions;
            }
        } else { // if has cache
            if (callback) {
                sortHelper(_exhibitions);
                callback(_exhibitions);

            } else {
                sortHelper(_exhibitions);
                return _exhibitions;
            }
        }
        
    }

    function deleteDoq(guid, type, onSuccess, onFail, onError) {
        setDirty(type);
        _db.deleteDoq(guid, onSuccess, onFail, onError);
    }

    /**
     * Soft delete a hotspot by deleting both the hotspot linq and doq files
     */
    function deleteHotspot(linqID, doqID, onSuccess, onFail, onError) {
       // _db.deleteLinq(linqID);
        var url = _db.getSecureURL() + "/?Type=Linq&Guid=" + linqID + "&token=" + LADS.Auth.getToken();

        var request = $.ajax({
            type: 'DELETE',
            url: url,
            async: true,
            success: function (data) {
                url = _db.getSecureURL() + "/?Type=Doq&Guid=" + doqID + "&token=" + LADS.Auth.getToken();

                $.ajax({
                    type: 'DELETE',
                    url: url,
                    async: true,
                    success: function (data) {
                        onSuccess && onSuccess();
                    },
                    error: function () {
                        if (request.statusText === "Unauthorized")
                            checkAuth(function () { deleteHotspot(linqID, doqID, onSuccess, onFail, onError); }, onFail);
                        else
                            onError && onError();
                    },
                });
            },
            error: function () {
                if (request.statusText === "Unauthorized")
                    checkAuth(function () { deleteHotspot(linqID, doqID, onSuccess, onFail, onError); }, onFail);
                else
                    onError && onError();
            }
        });
    }

    // get URL - see worktop.database.js
    function getURL() {
        return _db.getURL();
    }
    // get URL - see worktop.database.js
    function getSecureURL() {
        return _db.getSecureURL();
    }

    function getFileURL() {
        return _db.getFileURL();
    }

    // set URL - see worktop.databse.js
    function setURL(url) {
        _db.setURL(url);
    }
    
    // create a new exhibition
    function createNewExhibition(onSuccess, onFail, onError) {
        _exhibitionDirty = true;
        if (onSuccess) {
            var request = $.ajax({
                url: _db.getSecureURL() + "/?Type=CreateExhibition&Guid=" + LADS.Worktop.Database.getCreatorID() + "&token=" + LADS.Auth.getToken(),
                type: "PUT",
                dataType: "text",
                async: true,
                success: function (data) {
                    var result;
                    if (request.responseText) {
                        try {
                            result = new Worktop.Doq(request.responseText);
                            onSuccess && onSuccess(result);
                        }
                        catch (err) {
                            onError && onError();
                        }
                    } else {
                        checkAuth(function () { createNewExhibition(onSuccess, onFail, onError); }, onFail);
                    }
                },
                error: function () {
                    if (request.statusText === "Unauthorized")
                        checkAuth(function () { createNewExhibition(onSuccess, onFail, onError); }, onFail);
                    else
                        onError && onError();
                }
            });
        }
        else {
            _db.createNewExhibition();
        }
    }

    // Non-async version depricated, always give an onSuccess function
    function createTour(onSuccess, onFail, onError) {
        setDirty("Tour");
        if (onSuccess) {
            _db.createTour(onSuccess, onFail, onError);
        } else {
            return _db.createTour();
        }
    }
    
    // get all artwork
    function getAllArtworks(callback) {
        _artworkDirty = true;
        if (callback) {

            // TODO: will run if(_artworkDirty){} immediately 
            if (!_db.isUseServer()) {

                var request = $.ajax({
                    url: 'testXML/AllArtworks.xml',
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: true,
                    success: function () {
                        if (request.responseText) {
                            _artworks = new Worktop.Doq(request.responseText);
                            callback(_artworks);
                        }
                        
                    },
                    error: function (err) {
                    }
                });
           }

            if (_artworkDirty) {
                var doq;
                var url = getURL() + "/?Type=DoqsInFolder&Name=Artworks";

                var request = $.ajax({
                    url: url,
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: true,
                    success: function () {
                        if (request.responseText) {
                            _artworks = new Worktop.Doq(request.responseText);
                            _artworkDirty = false;
                            callback(_artworks);
                        }
                    },
                    error: function (err) {
                    }
                });
            } else {
                callback(_artworks);
            }
        } else {

            if (!_db.isUseServer()) {

                var request = $.ajax({
                    url: 'testXML/AllArtworks.xml',
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: false,
                    error: function (err) {
                        return;
                    }
                });
                if (request.responseText) {
                    try {
                        _artworks = new Worktop.Doq(request.responseText);
                    }
                    catch (err) {
                        console.log("error in getAllArtworks: " + err);
                        getAllArtworks(callback);
                    }
                }
                return _artworks;
            }

            if (_artworkDirty) {
                var doq;
                var url = getURL() + "/?Type=DoqsInFolder&Name=Artworks";

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
                        _artworks = new Worktop.Doq(request.responseText);
                    }
                    catch (err) {
                        console.log("error in getAllArtworks: " + err.message);
                        getAllArtworks(callback);
                    }
                }
                _artworkDirty = false;
            }
            return _artworks;
        }
    }

    // get a specified doq by its GUID
    function getDoqByGuid(guid, flag, callback, error) {
        //any reason why this wasn't returning anything before?
        if (callback) {
            var url;
            if (_db.useServer)
                url = _db.getURL() + "/?Type=Doq&Guid=" + guid;
            else
                url = "testXML/" + guid + ".xml";

            var request = $.ajax({
                url:url,
                dataType: "text",
                cache: false, // forces browser to not cache the data
                async: true,
                success: function () {
                    if (request.responseText) {
                        //try {
                        var newDoq = new Worktop.Doq(request.responseText);
                        callback (newDoq, flag);
                        //}
                        //catch (err) {
                            //console.log("bad xml response in getDoqByGuid: " + err.message);
                           // getDoqByGuid(guid, flag, callback);
                        //}
                    }
                },
                error: function (err) {
                    console.log(err);
                    error && error();
                }
            });
        }
        else
            return _db.getDoqByGUID(guid);
    }

    // get doq by name - see Worktop.Database.js
    function getDoqByName(name) {
        return _db.getDoqByName(name);
    }

    //function getArtworks(exhibit, force) {
    function getArtworks(exhibit, callback){
        if (callback) {

            var guid = exhibit.Identifier;
            
            var doq;
            var url;
            if (_db.useServer)
                url = _db.getURL() + "/?Type=DoqsInFolder&Guid=" + guid;
            else
                url = "testXML/" + guid + "_Content.xml";
            var request = $.ajax({
                url: url,
                dataType: "text",
                cache: false, // forces browser to not cache the data
                async: true,
                success: function () {
                    console.log("artwork success");
                    if (request.responseText) {
                        try {
                            var artworks = new Worktop.Doq(request.responseText);
                        }
                        catch (err) {
                            console.log("error in getArtworks: " + err.message);
                            //getArtworks(exhibit, callback);
                        }
                    }

                    if (artworks && artworks[0]) { // Check that there is actually something in the array
                        $.each(artworks, function (i, artwork) {
                            if (artwork.Type == "Artwork") {
                                artworks.push(artwork);
                            }
                        });
                        exhibit.artworks = artworks || [];
                        // add sort function to each exhibit
                        var compare = function (a, b) { return a == b ? 0 : a > b ? 1 : -1; };
                        exhibit.sort = function (sortBy) {
                            exhibit.artworks.sort(function (a, b) {
                                if (typeof sortBy === "string") {
                                    if (sortBy === "Title") {
                                        return compare(a.Name, b.Name);
                                    } else {
                                        return compare(a.Metadata[sortBy], b.Metadata[sortBy]);
                                    }
                                }
                                for (var field in sortBy) {
                                    sortField = sortBy[field];
                                    if (sortField === "Title") {
                                        if (!a.Name) return -1;
                                        if (!b.Name) return 1;
                                        var comp = compare(a.Name, b.Name);
                                        if (comp !== 0) return comp;
                                    }
                                    else {
                                        if (!a.metadataGet(sortField)) return -1;
                                        if (!b.metadataGet(sortField)) return 1;
                                        var comp = compare(a.metadataGet(sortField), b.metadataGet(sortField));
                                        if (comp !== 0) return comp;
                                    }
                                }
                                return 0;
                            });
                        }
                    }
                    callback(artworks);
                },
                error: function (err) {
                    return;
                }
            });

        } else {
            var artworks = _db.getDoqsInFolderByGUID(exhibit.Identifier);
            if (artworks && artworks[0]) { // Check that there is actually something in the array
                $.each(artworks, function (i, artwork) {
                    if (artwork.Type == "Artwork") {
                        artworks.push(artwork);
                    }
                });
                exhibit.artworks = artworks || [];
                // add sort function to each exhibit
                var compare = function (a, b) { return a == b ? 0 : a > b ? 1 : -1; };
                exhibit.sort = function (sortBy) {
                    exhibit.artworks.sort(function (a, b) {
                        if (typeof sortBy === "string") {
                            if (sortBy === "Title") {
                                return compare(a.Name, b.Name);
                            } else {
                                return compare(a.Metadata[sortBy], b.Metadata[sortBy]);
                            }
                        }
                        for (var field in sortBy) {
                            sortField = sortBy[field];
                            if (sortField === "Title") {
                                if (!a.Name) return -1;
                                if (!b.Name) return 1;
                                var comp = compare(a.Name, b.Name);
                                if (comp !== 0) return comp;
                            }
                            else {
                                if (!a.metadataGet(sortField)) return -1;
                                if (!b.metadataGet(sortField)) return 1;
                                var comp = compare(a.metadataGet(sortField), b.metadataGet(sortField));
                                if (comp !== 0) return comp;
                            }
                        }
                        return 0;
                    });
                }
            }
            return artworks;
        }
    }

    function updateCache(guid, xml) {
        
        _cacheXML[guid] = xml;
    }

    function getXML(guid) {
        return _cacheXML[guid];
    }

    /* 
     * The pushXML(...) method takes an XML object and a GUID. It then parses the XML
     * object, converts it into text, and then sends the text-based XML to the server.
     * If the XML was valid and accepted by the server, the method success() is called.
     */
    function pushXML(data, guid, type, onSuccess, onFail, onError) {

        setDirty(type);        
        
        var xmlstr = "";
        if (typeof data == 'string') {
            xmlstr = data;
        }  else {
            xmlstr = parseXML(data.childNodes[0], xmlstr);
        }
        var url = _db.getSecureURL() + "/?Type=Doq&Guid=" + guid + "&token=" + LADS.Auth.getToken();
        
        var isAsync = !!onSuccess;

        $.ajax({
            type: 'POST',
            url: url,
            data: xmlstr,
            async: isAsync,
            success: function () {
                onSuccess && onSuccess();
            },
            error: function (err, err2, status) {
                if ($("#dialogOverlay").length > 0) {
                    $("#dialogOverlay").hide();
                }
                if (status === "Unauthorized") {
                    checkAuth(function () { pushXML(data, guid, type, onSuccess, onFail, onError); }, onFail);
                }
                else
                    onError && onError();
            },
            dataType: 'text'
        });
    }

        /* 
     * The pushLinq(...) method takes an XML object and a GUID. It then parses the XML
     * object, converts it into text, and then sends the text-based XML to the server.
     * If the XML was valid and accepted by the server, the method success() is called.
     */
    function pushLinq(data, guid, type, onSuccess, onFail, onError) {

        setDirty(type);        
        
        var xmlstr = "";
        if (typeof data == 'string') {
            xmlstr = data;
        }  else {
            xmlstr = parseXML(data.childNodes[0], xmlstr);
        }
        var url = _db.getSecureURL() + "/?Type=Linq&Guid=" + guid + "&token=" + LADS.Auth.getToken();

        $.ajax({
            type: 'POST',
            url: url,
            data: xmlstr,
            async: false,
            success: function () {
                onSuccess && onSuccess();
            },
            error: function (err, err2, status) {
                if (status === "Unauthorized")
                    checkAuth(function () { pushLinq(data, guid, type, onSuccess, onFail, onError); }, onFail);
                else
                    onError && onError();
            },
            dataType: 'text'
        });
    }
    /* 
     * The parse(...) method a string   . It then parses the XML
     * object, converts it into text, and then sends the text-based XML to the server.
     * If the XML was valid and accepted by the server, the method success() is called.
     */
    function parseXML(data, xmlstring) {
        if (data.tagName) {
            xmlstring = xmlstring.concat("<" + data.tagName);
            for (var i = data.attributes.length - 1; i >= 0; i--) {
                xmlstring = xmlstring.concat(" " + data.attributes[i].nodeName + "=\"" + data.attributes[i].nodeValue + "\"");
            }
            xmlstring = xmlstring.concat(">");

            for (var i = 0; i < data.childNodes.length; i++) {
                xmlstring = parseXML(data.childNodes[i], xmlstring);
            }

            xmlstring = xmlstring.concat("</" + data.tagName + ">");
        }
        else {
            xmlstring = xmlstring.concat(data.data);
        }
        return xmlstring;
    }

    function createEmptyDoq(getMainCreatorID) {
        return _db.createEmptyDoq(_main.CreatorID);
    }

    function createLinq(guid1, guid2) {
        return _db.createLinq();
    }

    // create image hotspot
    function createHotspot(creatorID, artworkGUID, onSuccess, onFail, onError) {
        if (onSuccess) {
            var url = _db.getSecureURL() + "/?Type=CreateHotspot&Guid=" + creatorID + "&Guid2=" + artworkGUID + "&token=" + LADS.Auth.getToken();
            
            var request = $.ajax({
                url: url,
                type: "PUT",
                dataType: "text",
                async: true,
                success: function () {
                    onSuccess && onSuccess(true, request.responseXML);
                },
                error: function () {
                    if (request.statusText === "Unauthorized")
                        checkAuth(function () { createHotspot(creatorID, artworkGUID, onSuccess, onFail, onError); }, onFail);
                    else
                        onError && onError();
                },
            });
           
        }
        else
        return _db.createHotspot(creatorID, artworkGUID, onSuccess, onFail, onError);
    }

    function getCreatorID() {
        return _main.CreatorID;
    }

    // get parent doq
    function parentDoq(guid1, guid2) {
        var url = _db.getURL() + "/?Type=AddParent&Guid=" + guid1 + "&Guid2=" + guid2;

        $.ajax({
            type: 'POST',
            url: url,
            dataType: 'text'
        });

        setDirty("Artwork");
    }

    // set artwork dirty 
    function setArtworkDirty() {
        _artworkDirty = true;
    }

    // bool for dirty artwork
    function isArtworkDirty() {
        return _artworkDirty;
    }

    // upload image
    function uploadImage(dataurl, onSuccess, onFail, onError) {
        var location = _db.uploadImage(dataurl, getCreatorID(), onSuccess, onFail, onError);
        return location;
    }

    function checkAuth(onSuccess, onCancel) {
        LADS.Auth.authenticate(onSuccess, onCancel);
    }

    // get all tours
    function getAllTours(callback) {
        // bmost: Temporarily making it so that tours don't get cached.
        // If a curator changes a tour on one machine, other machines
        // will have the old tour cached.
        _tourDirty = true;
        if (_tourDirty) {
            if (callback) {
                var name = "Tour";
                var doq, tours;
                _tours = [];
                var url = _db.getURL() + "/?Type=DoqsInFolder&Name=" + name;
                var request = $.ajax({
                    url: url,
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: true,
                    success: function (data) {
                        _tours = [];
                        if (request.responseText) {
                            try {
                                tours = new Worktop.Doq(request.responseText);

                                if (tours && tours[0]) {
                                    $.each(tours, function (i, t) {
                                        _tours.push(t);
                                    });
                                    _tourDirty = false;
                                } else {
                                    _tourDirty = true;
                                }
                                sortHelper(_tours);
                                callback(_tours);
                            } catch (e) {
                                callback([]);
                            }
                        }
                    },
                    error: function (err) {
                        console.log("ajax fail in getAlltours");
                    }
                });

            }
            else {
                _tours = [];
                var tours = _db.getDoqsInFolderByName("Tour");
                if (tours && tours[0]) {
                    $.each(tours, function (i, t) {
                        _tours.push(t);
                    });
                }
                sortHelper(_tours);
                return _tours;
            }
        } else {
            if (callback) {
                callback(_tours);
            } else {
                return _tours;
            }
        }
    }

    function getAllFeedback(onSuccess, onError) {
        var url = _db.getURL() + "/?Type=DoqsInFolder&Name=Feedback";
        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: true,
            success: function (data) {
                if (request.responseText) {
                    try {
                        feedback = new Worktop.Doq(request.responseText);
                        onSuccess(feedback[0] ? feedback : []);
                    } catch (e) {
                        console.log(e.message);
                        onError && onError();
                    }
                }
            },
            error: function (err) {
                console.log("ajax fail in getAllFeedback");
                onError && onError();
            }
        });
    }

    function createFeedback(text, sourceType, sourceID, onSuccess, onError) {
        var request = $.ajax({
            url: _db.getURL() + "/?Type=CreateFeedback&Guid=" + LADS.Worktop.Database.getCreatorID() 
                + "&text=" + escape(text) 
                + "&sourcetype=" + escape(sourceType)
                + "&sourceid=" + escape(sourceID),
            type: "PUT",
            dataType: "text",
            async: true,
            success: function (data) {
                onSuccess && onSuccess();
            },
            error: function () {
                onError && onError();
            }
        });
    }

    function testIp(onSuccess, onError) {
        var name = "Tour";
        var doq, tours;
        _tours = [];
        var url = _db.getURL() + "/?Type=DoqsInFolder&Name=" + name;
        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: true,
            success: function (data) {
                onSuccess();
            },
            error: function (err) {
                onError();
            }
        });

    }

    function getSalt(onSuccess, onError) {
        var url = _db.getSecureURL() + "/?Type=Salt&Name=Salt";
        var request = $.ajax({
            type: 'GET',
            url: url,
            async: true,
            cache: false,
            success: function () {
                onSuccess(request.responseText);
            },
            error: function () {
                onError && onError();
            },
        });
    }

    // password authentication
    function getAuth(password, salt, onSuccess, onFail, onError) {
        var url = _db.getSecureURL() + "/?Type=Auth&Name=" + LADS.Auth.hashPass(password, salt);
        var request = $.ajax({
            type: 'GET',
            url: url,
            async: true,
            cache: false,
            success: function () {
                if (request.statusText === "Authorized") {
                    onSuccess(request.responseText);
                }
                else {
                    onFail && onFail();
                }
            },
            error: function (err) {
                if (request.statusText === "Invalid password") {
                    onFail && onFail();
                } else if (onError)
                    onError();
            }
        });
    }

    function changePass(oldpass, salt, newpass, onSuccess, onFail, onError) {
        var url = _db.getSecureURL() + "/?Type=ChangePassword&Name=" + LADS.Auth.hashPass(oldpass, salt) + "&new=" + newpass;
        var request = $.ajax({
            type: 'POST',
            url: url,
            async: true,
            cache: false,
            success: function () {
                if (request.statusText === "Authorized") {
                    onSuccess(request.responseText);
                }
                else {
                    onFail && onFail();
                }
            },
            error: function (err) {
                if (request.statusText === "Invalid password") {
                    onFail && onFail();
                } else if (onError)
                    onError();
            }
        });
    }

    function checkToken(token, onSuccess, onFail, onError) {
        var url = _db.getSecureURL() + "/?Type=CheckToken&Name=" + token;
        var request = $.ajax({
            type: 'HEAD',
            url: url,
            async: true,
            cache: false,
            success: function () {
                if (request.statusText === "OK") {
                    onSuccess && onSuccess();
                }
                else {
                    onFail && onFail();
                }
            },
            error: function (err) {
                if (request.statusText === "Unauthorized") {
                    onFail && onFail();
                } else {
                    onError && onError();
                }
            }
        });
    }

    // use this at some point to validate that the inputted ip address is actually the ip address for a TAG server
    // we can have an array of valid ips on the server
    function validateIp(ip, onSuccess, onError) {
        var url = _db.getURL() + "/?Type=IP&Name=" + ip; // type=IP -- deal with this in server.cs ?
        var request = $.ajax({
            type: 'HEAD',
            url: url,
            async: true,
            password: password,
            success: function () {
                if (request.statusText === "Authorized") {
                    onSuccess();
                }
                else {
                    onError();
                }
            },
            error: function (err) {
                if (request.statusText === "Authorized") {
                    onSuccess();
                }
                else {
                    onError();
                }
            }
        });
    }

    /*
        Change the server to newAddress
        If oldPass is supplied then authoring password for the old
        server is checked
        onConnect is called on successful connection to the new server
        onFail is called otherwise
        After this function is successful everything is updated to use the new server,
        but the current page will need to be reloaded
    */
    function changeServer(newAddress, oldPass, onConnect, onFail) {
        newAddress = LADS.Util.formatAddress(newAddress);
        if (oldPass) {
            getSalt(function (salt) {
                getAuth(oldPass, salt, checkServer, onFail, onFail);
            }, onFail);
        } else {
            checkServer();
        }
        function checkServer() {
            try{
                var request = $.ajax({
                    type: 'GET',
                    url: 'http://' + newAddress + ':8080' + '/?Type=Doq&Name=Main',
                    cache: false, // forces browser to not cache the data
                    //dataType: "text",
                    async: true,
                    success: function (data) {
                        if (request.responseText) {
                            try {
                                _main = new Worktop.Doq(request.responseText);
                                localStorage.ip = newAddress;
                                onConnect && onConnect();
                            }
                            catch (err) {
                                onFail && onFail();
                            }
                        } else {
                            onFail && onFail();
                        }
                    },
                    error: onFail
                });
            }
            catch(error){
                onFail && onFail();
            }
        }
    }

    // set specified screen to dirty
    function setDirty(type) {
        switch (type) {
            case "Exhibition":
            case "Exhibitions":
                _exhibitionDirty = true;
                break;
            case "Artwork":
                _artworkDirty = true;
                break;
            case "Tour":
                _tourDirty = true;
                break;
        }
    }

    function hash(n) {
        return ((0x0000FFFF & n) << 16) + ((0xFFFF0000 & n) >> 16);
    }

    function fixPath(path) {
        if (path) {
            if (path.indexOf('http') !== -1 || path.indexOf('blob:') !== -1) {
                return path;
            } else {
                if (path.indexOf('/') !== 0) path = '/' + path;
                return _db.getFileURL() + path;
            }
        }
    }

})();