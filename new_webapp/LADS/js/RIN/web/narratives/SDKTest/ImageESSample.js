[{
    "version": 1.0,
    "defaultScreenplayId": "SCP1",
    "screenplayProviderId": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
    "data": {
        "narrativeData": {
            "guid": "6aa09d19-cf2b-4c8e-8b57-7ea8701794f7",
            "timestamp": "2011-07-29T00:48:12.8847651Z",
            "title": "Image Experience Test",
            "author": "Gautham Mudambi",
            "aspectRatio": "WideScreen",
            "estimatedDuration": 100,
            "description": "Description",
            "branding": null
        }
    },
    "providers": {
        "ImageProvider": {
            "name": "MicrosoftResearch.Rin.ImageExperienceStream",
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
        "LenaImageResource": {
            "uriReference": "ImageESSample_Media/lena.png"
        }
    },
    "experiences": {
        "ImageExperience": {
            "providerId": "ImageProvider",
            "data": {
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "LenaImageResource",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 100,
                    "keyframes": [
                        {
                            "offset": 2,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 50,
                                            "y": 10
                                        },
                                        "span": {
                                            "x": 60,
                                            "y": 60
                                        }
                                    },
                                    "rotation": 90
                                }
                            }
                        }
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
                        "experienceId": "ImageExperience",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration": 100,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    }
                ]
            }
        }
    }
}]