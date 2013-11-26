[{
    "version": 1.0,
    "defaultScreenplayId": "SCP1",
    "screenplayProviderId": "DefaultScreenPlayInterpreter",
    "data": {
        "narrativeData": {
            "guid": "6aa09d19-cf2b-4c8e-8b57-7ea8701794f7",
            "timestamp": "2011-07-29T00:48:12.8847651Z",
            "title": "DigNarrative_072811v4",
            "author": "jergru",
            "aspectRatio": "WideScreen",
            "estimatedDuration": 328.464,
            "description": "Description",
            "branding": "MICROSOFT RESEARCH"
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
        "RinES": {
            "name": "MicrosoftResearch.Rin.RinExperienceStream",
            "version": 0.0
        }
    },
    "resources": {
        "R-1": {
            "uriReference": "../video/narrative.js"
        },
        "R-2": {
            "uriReference": "Rin_Overlays.js"
        }
    },
    "experiences": {
        "RinES-1": {
            "providerId": "RinES",
            "data": {
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                },
                "markers" : {
                    "beginAt" : 0,
                    "endAt" : 16.8918918
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-1",
                    "required": true
                }
            ],
            "experienceStreams" : {
                "defaultStream" : {
                    "duration" : 16.892
                }
            }
        },
        "RinOVerlayTest": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "<ContentType>MediaOverlays</ContentType>"
            },
            "resourceReferences": [
               {
                   "resourceId": "R-2",
                   "required": true
               }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 120,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "Overlay2": {
                                        "itemid": "Overlay2",
                                        "view": {
                                            "display": {
                                                "show": "true"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    },
    "screenplays" : {
        "SCP1" : {
            "data" : {
                "experienceStreamReferences": [
                    {
                        "experienceId" : "RinES-1",
                        "experienceStreamId" : "defaultStream",
                        "begin" : 0,
                        "duration" : 120,
                        "layer" : "foreground",
                        "dominantMedia" : "visual",
                        "volume" : 1
                    },
                    {
                        "experienceId": "RinOVerlayTest",
                        "experienceStreamId": "defaultStream",
                        "begin": 5,
                        "duration": 120,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    }
                ]
            }
        }
    }
}]
