/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Generates a narrative dynamically on the fly, 
* using a JSON object as datacontext
* Constraints: The following fields are expected in the json datacontext.
* 1. Estimated duration [duration or largeMediaDuration] of the narrative or the ES(in case of video, audio or a rin).
* 2. Any new ES providers not part of the current rin project has to be specified in [srcType]
* 3. Default aspect ratio is set to Widescreem, if there is a need for a differen one specify it in [aspectRatio]
* 4. If the Experiencestream has to have any keyframes, specify it in [keyframes]
* 5. If the resource urls [src] are relative urls, remember to specify the rootUrl in [rootUrl]
* 6. Multiple resource urls if required by the ES cannot be provided as of now. Capability to be added if necessary.
* Date: <placeholder for SDK release date>
*/

window.rin = window.rin || {};
window.rin.internal = window.rin.internal || {};

rin.internal.esDataGenerator = {
    _narrativeData: {
        "version": 1.0,
        "defaultScreenplayId": "SCP1",
        "screenplayProviderId": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
        "data": {
            "narrativeData": {
                "guid": "6aa09d19-cf2b-4c8e-8b57-7ea8701794f7",
                "aspectRatio": "$ASPECTRATIO$",
                "estimatedDuration": "$DURATION$",
                "branding": null
            }
        },
        "providers": {
            "$ESPROVIDER$": {
                "name": "$ESPROVIDER$",
                "version": 0.0
            },
            "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter": {
                "name": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
                "version": 0.0
            }
        },
        "resources": {
            "R-1": {
                "uriReference": "$RESOURCEREF$"
            }
        },
        "experiences": {
            "$ESID$": {
                "providerId": "$ESPROVIDER$",
                "data": {
                    "markers": {
                        "beginAt": '$STARTOFFSET$',
                        "endAt": '$ENDOFFSET$'
                    }
                },
                "resourceReferences": [
                        {
                            "resourceId": "R-1",
                            "required": true
                        }
                    ],
                "experienceStreams": {
                    "defaultStream": {
                        "duration": "0",
                        "data": {
                            "ContentType": "<$CONTENTTYPE$/>"
                        },
                        "keyframes": ["$KEYFRAMES$"]
                    }
                }
            }
        },
        "screenplays": {
            "SCP1": {
                "data": {
                    "experienceStreamReferences": [
					{
					    "experienceId": "$ESID$",
					    "experienceStreamId": "defaultStream",
					    "begin": "0",
					    "duration": "$DURATION$",
					    "layer": "foreground",
					    "dominantMedia": "visual",
					    "volume": '$VOLUME$'
					}]
                }
            }
        }
    },
    esSrcTypeToProviderDictionary: {
        "singledeepzoomimage": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
        "deepzoomimage": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
        "zoomableimage": "MicrosoftResearch.Rin.ImageExperienceStream",
        "image": "MicrosoftResearch.Rin.ImageExperienceStream",
        "zoomablevideo": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
        "zoomablemediacollection": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
        "video": "MicrosoftResearch.Rin.VideoExperienceStream",
        "audio": "MicrosoftResearch.Rin.AudioExperienceStream",
        "pivot": "MicrosoftResearch.Rin.PivotExperienceStream",
        "xps": "MicrosoftResearch.Rin.DocumentViewerExperienceStream",
        "photosynth": "MicrosoftResearch.Rin.PhotosynthES",
        "collection": "MicrosoftResearch.Rin.RinTemplates.$THEME$TwoDTemplateES",
        "collectiononed": "MicrosoftResearch.Rin.RinTemplates.$THEME$OneDTemplateES",
        "wall": "MicrosoftResearch.Rin.WallExperienceStream",
        "map": "MicrosoftResearch.Rin.MapExperienceStream"
    },
    getExperienceStream: function (context, themeName) {
        if (context === undefined)
            return;
        var esData = JSON.stringify(this._narrativeData);
        var providerName = this.esSrcTypeToProviderDictionary[context.srcType.toLowerCase()] || context.srcType;
        var keyframeData = context.keyframes || "";
        var aspectratio = context.aspectRatio || "None";
        var duration = context.duration || context.largeMediaDuration || context.smallMediaDuration || 0;
        var startOffset = context.largeMediaStartOffset || context.smallMediaStartOffset || 0;
        var endOffset = startOffset + duration;
        providerName = providerName.replace("$THEME$", themeName || "Metro");

        var esId = (context.id || "") + "_ES_" + Math.floor(Math.random() * 1000).toString() + "_Popup";

        esData = this.replaceAll('$ESID$', esId, esData);
        esData = this.replaceAll("$ESPROVIDER$", providerName, esData);
        esData = esData.replace('$RESOURCEREF$', context.src)
                       .replace('$CONTENTTYPE$', context.srcType)
                       .replace('$ASPECTRATIO$', aspectratio)
                       .replace('$DURATION$', duration)
                       .replace('$DURATION$', duration)
                       .replace('$STARTOFFSET$', startOffset)
                       .replace('$ENDOFFSET$', endOffset)
                       .replace('$VOLUME$', context.volume || 1)
                       .replace("$KEYFRAMES$", keyframeData);
        var esDataJSON = rin.util.parseJSON(esData);
        esDataJSON.id = esId;

        return esDataJSON;
    },

    replaceAll: function (find, replace, str) {
        return str.split(find).join(replace);
    }
};


