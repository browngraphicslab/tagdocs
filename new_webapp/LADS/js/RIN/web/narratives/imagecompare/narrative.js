[{
    "version": 1.0,
    "defaultScreenplayId": "SCP1",
    "screenplayProviderId": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
    "data": {
        "narrativeData": {
            "guid": "bb78bc92-a8d0-4f3a-87fd-771f3f933eb7",
            "timestamp": "2013-04-05T23:26:23.186Z",
            "title": "Image Compare Experience Test",
            "author": "Joel",
            "aspectRatio": "WideScreen",
            "estimatedDuration": 20,
            "description": "Description",
            "branding": null
        }
    },
    "providers": {
        "ImageCompareESProvider": {
            "name": "MicrosoftResearch.Rin.ImageCompareExperienceStream",
            "version": 0.0
        },
        "FadeInOutTransitionService": {
            "name": "MicrosoftResearch.Rin.FadeInOutTransitionService",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter": {
            "name": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
            "version": 0.0
        }
    },
    "resources": {
        "LeftImage": { "uriReference": "images/left.jpg" },
        "RightImage": { "uriReference": "images/right.jpg" }
    },
    "experiences": {
        "ImageCompareExperience": {
            "providerId": "ImageCompareESProvider",
            "data": {
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0,
                    "outDuration": 0.5
                }
            },
            "resourceReferences": [
                { "resourceId": "LeftImage", "required": true },
                { "resourceId": "RightImage", "required": true }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 20,
                    "keyframes": [
                        { "offset":  0, "state": { "percent": 50 } },
                        { "offset":  1, "state": { "percent": 50 } },
                        { "offset":  8, "state": { "percent": 90 } },
                        { "offset": 15, "state": { "percent": 10 } },
                        { "offset": 20, "state": { "percent": 50 } }
                    ]
                }
            }
        }
    },
    "screenplays": {
        "SCP1": {
            "data": {
                "experienceStreamReferences": [
                    {
                        "experienceId": "ImageCompareExperience",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration": 20,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    }
                ]
            }
        }
    }
}]