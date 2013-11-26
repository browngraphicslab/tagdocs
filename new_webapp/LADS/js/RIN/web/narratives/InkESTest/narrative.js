[{
    "data": {
        "narrativeData": {
            "aspectRatio": "WideScreen",
            "author": "aldo",
            "branding": "MICROSOFT RESEARCH",
            "description": "Description",
            "estimatedDuration": 328.464,
            "guid": "6aa09d19-cf2b-4c8e-8b57-7ea8701794f7",
            "timestamp": "2011-07-29T00:48:12.8847651Z",
            "title": "InkESTest"
        }
    },
    "defaultScreenplayId": "SCP1",
    "experiences": {
        "InkES1": {
            "data": {
                "linkToExperience": {
                    "embedding": {
                        "element": "box",
                        "region": {
                            "height": 0.20000000000000001,
                            "width": 0.20000000000000001,
                            "x": 0.5,
                            "y": 0.5
                        }
                    },
                    "enabled": true,
                    "experienceId": "z2"
                },
                "markers": {
                    "beginAt": 0,
                    "endAt": 16.8918918
                },
                "transition": {
                    "inDuration": 0.5,
                    "outDuration": 0.5,
                    "providerId": "FadeInOutTransitionService"
                }
            },
            "experienceStreams": { "defaultStream": { "duration": 16.891999999999999 } },
            "providerId": "InkES",
            "resourceReferences": []
        },
        "z2": {
            "data": {
                "transition": {
                    "inDuration": 2,
                    "outDuration": 2,
                    "providerId": "MicrosoftResearch.Rin.FadeInOutTransitionService"
                }
            },
            "experienceStreams": {
                "defaultStream": {
                    "data": { "contentType": "SingleDeepZoomImage" },
                    "duration": 12.899999999999999,
                    "keyframes": []
                }
            },
            "providerId": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
            "resourceReferences": [{
                "required": true,
                "resourceId": "R-1"
            }]
        }
    },
    "providers": {
        "DefaultScreenPlayInterpreter": {
            "name": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
            "version": 0.0
        },
        "FadeInOutTransitionService": {
            "name": "MicrosoftResearch.Rin.FadeInOutTransitionService",
            "version": 0.0
        },
        "InkES": {
            "name": "MicrosoftResearch.Rin.InkExperienceStream",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.ZoomableMediaExperienceStream": {
            "name": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
            "version": 0.0
        }
    },
    "resources": { "R-1": { "uriReference": "http://zoom.it/h" } },
    "screenplayProviderId": "DefaultScreenPlayInterpreter",
    "screenplays": {
        "SCP1": {
            "data": {
                "experienceStreamReferences": [{
                    "begin": 0,
                    "dominantMedia": "visual",
                    "duration": 120,
                    "experienceId": "z2",
                    "experienceStreamId": "defaultStream",
                    "layer": "foreground",
                    "volume": 1
                },
                                {
                                    "begin": 0,
                                    "dominantMedia": "visual",
                                    "duration": 120,
                                    "experienceId": "InkES1",
                                    "experienceStreamId": "defaultStream",
                                    "layer": "foreground",
                                    "volume": 1
                                }
                ]
            }
        }
    },
    "version": 1.0
}]