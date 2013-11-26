function JsonDownloadFailedError(message, innerException) {
    this.message = message;
    this.innerException = innerException;
}

function JsonMalformedError(message, innerException) {
    this.message = message;
    this.innerException = innerException;
}

function createTileSource(baseUrl, atlasImage) {

    // first check for a custom tile source
    if (PhotosynthRml.TileSourceFactory) {
        return PhotosynthRml.TileSourceFactory(baseUrl, atlasImage);
    } else {

        // create the default tile source for photosynth
        return function(x, y, lod) {
            if (lod === 7 && x === 0 && y === 0) {
                return atlasImage;
            }
            return baseUrl + lod + '/' + x + '_' + y + '.jpg';
        }
    }
}

var PartnerPanoramaTileSource = function (tileImageUriFormatString, width, height, tileSize, finestLod, numberOfLods, atlasImage) {
    var defaultFinestLod = Math.ceil(Math.log(Math.max(width, height)) / Math.LN2);
    var lodDelta = defaultFinestLod - finestLod;
    var singleTileLod = Math.ceil(Math.log(tileSize) / Math.LN2);

    var minLod = finestLod - numberOfLods;

    var horizontalTileCountMultiplier = width / Math.pow(2, defaultFinestLod);
    var verticalTileCountMultiplier = height / Math.pow(2, defaultFinestLod);

    this.getTileUrl = function (x, y, lod) {
        var normalizedLod = lod - lodDelta;

        if (normalizedLod == minLod && atlasImage && x == 0 && y == 0) {
            //special case for atlas image, if present
            return atlasImage;
        }

        if (normalizedLod > finestLod || normalizedLod <= minLod) {
            return null;
        }

        //determine number of tiles at this lod
        var numHorizontalTilesAtLod = Math.ceil(Math.pow(2, lod - singleTileLod) * horizontalTileCountMultiplier);
        var numVerticalTilesAtLod = Math.ceil(Math.pow(2, lod - singleTileLod) * verticalTileCountMultiplier);

        return PhotosynthRml.partialDotNetStringFormat(tileImageUriFormatString, normalizedLod, x, y);
    };
};

var PhotosynthRml = {
    faceNames: ['front', 'right', 'back', 'left', 'top', 'bottom'],
    defaultPhotosynthServer: 'http://photosynth.net',
    jsonWrapper: '/jsonproxy.psfx?jsonUrl={0}',
    timeout: 10000, //10 seconds
    jsonpWrapperParam: '&jsCallback={0}',
    addScriptElement: function (url) {
        var scriptElement = document.createElement('script');
        scriptElement.type = 'text/javascript';
        scriptElement.language = 'javascript';
        scriptElement.src = url;
        document.getElementsByTagName('head')[0].appendChild(scriptElement);
    },
    createFromCid: function (cid, callback) {
        //PhotosynthRml.createFromFullUrl(PhotosynthRml.jsonWrapperCid.replace('{0}', cid), callback); //TODO: specify somehow that original json uri can't be attained (needed for determining the atlas image of ice panos)
        throw "createFromCid() has been deprecated";
    },
    createFromJsonUri: function (jsonUri, callback, imageTileUriSuffix, photosynthServer) {
        if (window.WinJS) {
            PhotosynthRml.createFromFullUrl(jsonUri, callback, null, imageTileUriSuffix);
        }
        else {
            if (!photosynthServer) {
                photosynthServer = PhotosynthRml.defaultPhotosynthServer;
            }

            PhotosynthRml.createFromFullUrl(photosynthServer + 
                PhotosynthRml.jsonWrapper.replace('{0}', encodeURIComponent(jsonUri)), callback, jsonUri, imageTileUriSuffix);
        }
    },
    createFromSameDomainJsonUri: function (jsonUri, callback, imageTileUriSuffix) {
        var request = new XMLHttpRequest();
        request.open("GET", jsonUri, true);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    PhotosynthRml.createFromJsonString(request.responseText, callback, jsonUri, imageTileUriSuffix);
                }
                else {
                    callback(null, new JsonDownloadFailedError("Response status is not 200"));
                }
            }
        };

        request.send();
    },
    createFromJsonString: function (jsonString, callback, jsonUri, imageTileUriSuffix) {
        var json = null;

            try {
                json = JSON.parse(jsonString);
            }
            catch (ex) {
                callback(null, new JsonMalformedError("The data returned for the pano is not valid json", ex));
                return;
            }

            var rml = PhotosynthRml.createFromJson(json, jsonUri, imageTileUriSuffix);

            if (rml == null) {
                callback(null, new JsonMalformedError("The data returned for the pano is valid json but is not valid panorama data"));
            }
            else {
                callback(rml);
            }
    },
    createFromFullUrl: function (url, callback, originalJsonUri, imageTileUriSuffix) {
        if (window.WinJS) {
            //Windows app; allowed to download x-domain json but not allowed to add x-domain script tags
            WinJS.xhr({ url: url }).then(function (response) {
                if (response.status === 200) {
                    PhotosynthRml.createFromJsonString(response.responseText, callback, originalJsonUri || url);
                }
                else {
                    callback(null, new JsonDownloadFailedError("Response status is not 200"));
                }
            },
            function (error) {
                callback(null, new JsonDownloadFailedError("The url specified for the pano json data did not return a 200 success", error));
            });
        }
        else {
            //Not a windows app; not allowed to download x-domain json but allowed to add x-domain script tags

            //TODO: add error handling logic for non-WinJS case

            //Pick a new name each time.  In most cases, it will be PhotosynthCallback0 unless there's currently an active download.
            //This should have good caching behaviors when hitting things through a cdn.
            var globalCallbackName = 'PhotosynthCallback';
            var i = 0;
            while (window[globalCallbackName + i] != null) {
                i++;
            }
            globalCallbackName = globalCallbackName + i;

            //set up a timeout in case the file silently fails to download.
            var timeout = window.setTimeout(function () {
                callback(null, new JsonDownloadFailedError("Download of the panorama json file timed out after " + PhotosynthRml.timeout + " milliseconds"));
                delete window[globalCallbackName];
            }, PhotosynthRml.timeout);

            window[globalCallbackName] = function (json) {
                callback(PhotosynthRml.createFromJson(json, originalJsonUri || url, imageTileUriSuffix));
                window.clearTimeout(timeout);
                delete window[globalCallbackName];
            };
            
            PhotosynthRml.addScriptElement(url + PhotosynthRml.jsonpWrapperParam.replace('{0}', globalCallbackName));
        }
    },
    createFromJson: function (json, jsonUri, imageTileUriSuffix) {
        //Here's an overview of all photosynth-related formats
        // http://sharepoint/sites/ipe/AR/AR%20Team%20Wiki/Photosynth%20Data%20Formats.aspx

        var rml;

        try {
            if (json._json_synth && json._json_synth >= 1.01) {
                //Photosynth Panorama
                // http://sharepoint/sites/ipe/AR/Shared%20Documents/Human%20Scale/ICE%20Panorama%20Format.docx
                // http://micropedia/Pages/Photosynth%20JSON%20representation.aspx

                //Note: The format allows for short and long names for some elements.
                //      In practice only the short names are used so that's all that's supported here at the current time.

                var root, propertyName;

                //there's only one element in json.l, and the name of it is the cid of the pano
                for (propertyName in json.l) {
                    if (json.l.hasOwnProperty(propertyName)) {
                        root = json.l[propertyName];
                        break;
                    }
                }

                var coordSystem = root.x[0];
                var cubemap = coordSystem.cubemaps[0];
                var bounds = cubemap.field_of_view_bounds;
                var projector = coordSystem.r[0];
                var rotationNode = projector.j;
                var startRotationNode = projector.start_relative_rotation;
                var startingPitch = 0;
                var startingHeading = 0;


                var author = root.b;
                var attributionUrl = root.attribution_url;
                var licenseUrl = root.c;

                if (startRotationNode != null) {
                    //calculate initial look direction
                    var lookVector = new Vector3(0, 0, 1);
                    var rotation = PhotosynthRml.parseQuaternion(rotationNode[4], rotationNode[5], rotationNode[6]);
                    var startRelativeRotation = PhotosynthRml.parseQuaternion(startRotationNode[0], startRotationNode[1], startRotationNode[2]);
                    var combinedRotations = rotation.multiply(startRelativeRotation);
                    var startVector = combinedRotations.transform(lookVector);

                    startingPitch = MathHelper.halfPI - Math.acos(startVector.y);
                    startingHeading = Math.atan2(startVector.z, startVector.x);
                }



                var highlights = null;
                if (root.highlight_map && root.highlight_map.default_highlight) {
                    highlights = root.highlight_map.default_highlight;
                }

                var atlasImage = null;
                if (cubemap.u && jsonUri) {
                    //Assume jsonUri ends in "/0.json" and remove everything after the slash
                    var baseUrl = jsonUri.substring(0, jsonUri.length - 6);

                    atlasImage = baseUrl + cubemap.u;
                }

                rml = {
                    id: 'panorama' + propertyName,
                    type: 'panorama',
                    source: {
                        'attribution': {
                            'author': author,
                            'attributionUrl': attributionUrl,
                            'licenseUrl': licenseUrl
                        },
                        'dimension': 0, //set to zero initially, then get the max from the cube faces below
                        'tileSize': 254,
                        'tileOverlap': 1,
                        'tileBorder': 1,
                        'minimumLod': (atlasImage != null) ? 7 : 8,
                        'bounds': {
                            'left': MathHelper.degreesToRadians(bounds[0]),
                            'right': MathHelper.degreesToRadians(bounds[1]),
                            'top': MathHelper.degreesToRadians(bounds[2]),
                            'bottom': MathHelper.degreesToRadians(bounds[3])
                        },
                        'startingPitch': startingPitch,
                        'startingHeading': startingHeading,
                        'projectorAspectRatio': 1,
                        'projectorFocalLength': 0.5,
                        'highlights': highlights,
                        'atlasImage': atlasImage
                    }
                };

                for (var i = 0; i < PhotosynthRml.faceNames.length; i++) {
                    var faceName = PhotosynthRml.faceNames[i];
                    var face = cubemap[faceName];
                    if (face != null) {
                        rml.source[faceName + 'Face'] = {
                            tileSource: createTileSource(face.u, atlasImage),
                            //TODO: This assumes a single loop of 4 vertices.  Technically the format allows arbitrary loops, but in practice it's not used that way.
                            clip: face.clip.vertices
                        };
                        rml.source.dimension = Math.max(rml.source.dimension, face.d[0], face.d[1]);
                    }
                }
            }
            else if (json.json_pano) {
                //Partner Panorama
                // http://sharepoint/sites/IPE/AR/Shared%20Documents/PartnerPanoJson.docx

                //If null or undefined, defaults to 1.  Only 0 if explicitly set to false.
                var tileOverlap = (json.tile_overlap_borders === false) ? 0 : 1;

                var author = json.author;
                var attributionUrl = PhotosynthRml.partialDotNetStringFormat(json.attribution_uri_format_string, 0, 0);
                var licenseUrl = null; //Always mark partner panoramas as copyright.
                var publisher = json.publisher;

                rml = {
                    id: 'panorama' + propertyName,
                    type: 'panorama',
                    source: {
                        'attribution': {
                            'author': author,
                            'attributionUrl': attributionUrl,
                            'licenseUrl': licenseUrl,
                            'publisher': publisher
                        },
                        'dimension': 0, //set to zero initially, then get the max from the cube faces below
                        'tileSize': json.tile_size,
                        'tileOverlap': tileOverlap,
                        'tileBorder': tileOverlap,
                        'minimumLod': Math.ceil(Math.log(json.tile_size / Math.LN2)), //default values here, in case they're not specified in the data
                        'bounds': { //default values here, in case they're not specified
                            'left': 0,
                            'right': MathHelper.twoPI,
                            'top': -MathHelper.halfPI,
                            'bottom': MathHelper.halfPI
                        },
                        'startingPitch': 0,
                        'startingHeading': 0,
                        'projectorAspectRatio': 1,
                        'projectorFocalLength': 0.5,
                        'atlasImage': json.atlas_image
                    }
                };

                if (json.atlas_image != null && imageTileUriSuffix != null) {
                    rml.source.atlasImage += imageTileUriSuffix;
                }

                if (json.hot_spots) {
                    var convertPitchHeading = function (pitchHeadingDegreesArray) {
                        return {
                            pitch: MathHelper.degreesToRadians(pitchHeadingDegreesArray[0]),
                            //The data format uses a different convention for heading direction, so we have to negate, then normalize it.
                            heading: MathHelper.normalizeRadian(MathHelper.degreesToRadians(-pitchHeadingDegreesArray[1]))
                        };
                    }

                    rml.hotspots = [];
                    for (var i = 0; i < json.hot_spots.length; i++) {
                        var hotspotJson = json.hot_spots[i];
                        var hotspot = {
                            title: hotspotJson.title,
                            location: convertPitchHeading(hotspotJson.location),
                            target: hotspotJson.target
                        };
                        
                        if (hotspotJson.transition) {
                            var transitionJson = hotspotJson.transition;

                            hotspot.transition = {
                                startLookDirection: convertPitchHeading(transitionJson.start_look_direction),
                                endLookDirection: convertPitchHeading(transitionJson.end_look_direction)
                            };

                            if (transitionJson.media) {
                                var mediaJson = transitionJson.media;
                                hotspot.transition.media = {
                                    type: mediaJson.type,
                                    uri: mediaJson.uri,
                                    verticalFov: MathHelper.degreesToRadians(mediaJson.vertical_field_of_view),
                                    dimensions: mediaJson.dimensions
                                };
                            }
                        }

                        rml.hotspots.push(hotspot);
                    }
                }

                if (json.field_of_view_bounds) {
                    rml.source.bounds = {
                        'left': MathHelper.degreesToRadians(json.field_of_view_bounds[0]),
                        'right': MathHelper.degreesToRadians(json.field_of_view_bounds[1]),
                        'top': MathHelper.degreesToRadians(json.field_of_view_bounds[2]),
                        'bottom': MathHelper.degreesToRadians(json.field_of_view_bounds[3])

                    };
                }

                if (json.initial_look_direction) {
                    rml.source.startingPitch = MathHelper.degreesToRadians(json.initial_look_direction[0]);
                    rml.source.startingHeading = MathHelper.degreesToRadians(json.initial_look_direction[1]);
                }

                for (var i = 0; i < PhotosynthRml.faceNames.length; i++) {
                    var faceName = PhotosynthRml.faceNames[i];
                    var face = json[faceName];
                    if (face != null) {
                        var clip;
                        if (face.clip && face.clip.vertices) {
                            clip = face.clip.vertices;
                        }
                        else {
                            clip = [
                                0, 0,
                                0, face.dimensions[1],
                                face.dimensions[0], face.dimensions[1],
                                face.dimensions[0], 0
                            ];
                        }

                        var tileFormatString = face.tile_image_uri_format_string;

                        if (imageTileUriSuffix != null) {
                            tileFormatString += imageTileUriSuffix;
                        }

                        rml.source[faceName + 'Face'] = {
                            tileSource: (new PartnerPanoramaTileSource(tileFormatString, face.dimensions[0], face.dimensions[1], json.tile_size, face.finest_lod, face.number_of_lods, rml.source.atlasImage)).getTileUrl,
                            //TODO: This assumes a single loop of 4 vertices.  Technically the format allows arbitrary loops, but in practice it's not used that way.
                            clip: clip
                        };
                        rml.source.dimension = Math.max(rml.source.dimension, face.dimensions[0], face.dimensions[1]);

                        if (face.finest_lod != null && face.number_of_lods != null) {
                            var defaultFinestLod = Math.ceil(Math.log(rml.source.dimension) / Math.LN2);

                            rml.source.minimumLod = defaultFinestLod - face.number_of_lods + 1;
                        }

                    }

                }

                if (rml.source.atlasImage != null) {
                    rml.source.minimumLod--;
                }

            }
            else {
                //unknown json format
                return null;
            }
        }
        catch (e) {
            //If the data isn't valid, an exception will get thrown.  Just return null to indicate parsing failure.
            if (window.console) {
                Utils.log(e);
            }
            return null;
        }

        return rml;
    },
    parseQuaternion: function (qx, qy, qz) {
        //Since we know this is a unit quaternion we can calculate w
        var wSquared = 1.0 - (qx * qx + qy * qy + qz * qz);
        if (wSquared < MathHelper.zeroTolerance) {
            wSquared = 0.0;
        }
        return new Quaternion(Math.sqrt(wSquared), qx, qy, qz);
    },
    partialDotNetStringFormat: function (formatString) {
        //This function implements a small subset of the .NET string.format method

        //Assumptions:
        // - All arguments (excluding the formatString) are positive integers
        // - The only allowed values after the colon inside braces are an uppercase 'X' or a string of zeros

        //Sample allowed values
        //partialDotNetStringFormat("{0} asdf {1}", 10, 2)      => "10 asdf 2"
        //partialDotNetStringFormat("{0:X} asdf {1}", 10, 2)    => "A asdf 2"
        //partialDotNetStringFormat("{0:000} asdf {1}", 10, 2)  => "010 asdf 2"

        if (arguments.length === 0) {
            return "";
        }
        if (arguments.length === 1) {
            return formatString;
        }

        var result = "";
        var i = 0;
        while (i < formatString.length) {
            //First, output up to the next brace, then slice off the string enclosed in the braces
            var leftBrace = formatString.indexOf('{');
            if (leftBrace === -1) {
                return result + formatString;
            }
            result += formatString.substr(0, leftBrace);
            formatString = formatString.substr(leftBrace)
            var rightBrace = formatString.indexOf('}');
            if (rightBrace < 2) {
                //TODO: Something wrong.  Throw an exception? 
            }
            var numberFormat = formatString.substr(1, rightBrace - 1);
            formatString = formatString.substr(rightBrace + 1);

            //Now, figure out what to do with the part in the braces
            var numberFormatParts = numberFormat.split(':');

            //Determine which arg is represented by this format string
            var arg = arguments[parseInt(numberFormatParts[0]) + 1];

            if (numberFormatParts.length === 1) {
                //nothing special, just output the arg
                result += arg.toString();
            }
            else if (numberFormatParts[1] === 'X') {
                //hex, output the number in hex form
                result += arg.toString(16).toUpperCase();
            }
            else {
                //Assume that numberFormatParts[1] contains only zeros
                //prepend zeros in front of the number to match the number of zeros passed in
                var out = arg.toString();
                while (out.length < numberFormatParts[1].length) {
                    out = '0' + out;
                }
                result += out;
            }
        }

        return result;
    }
};

// export photosynth viewer
window.PhotosynthRml = PhotosynthRml;