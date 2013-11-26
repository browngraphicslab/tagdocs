[{
    "version": 1.0,
    "defaultScreenplayId": "SCP1",
    "screenplayProviderId": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
    "data": {
        "narrativeData": {
            "guid": "6aa09d19-cf2b-4c8e-8b57-7ea8701794f7",
            "timestamp": "2011-07-29T00:48:12.8847651Z",
            "title": "Panorama Test Narrative",
            "author": "Tanuja",
            "aspectRatio": "WideScreen",
            "estimatedDuration": 20,
            "description": "Description",
            "branding": null
        }
    },
    "providers": {
        "microsoftResearch.rin.twodlayoutengine" : {
            "name" : "microsoftResearch.rin.twodlayoutengine",
            "version" : 0.0
        },
        "PlaceholderES": {
            "name": "MicrosoftResearch.Rin.PlaceholderExperienceStream",
            "version": 0.0
        },
        "FadeInOutTransitionService": {
            "name": "MicrosoftResearch.Rin.FadeInOutTransitionService",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter": {
            "name": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
            "version": 0.0
        },
        "PanoramicExperienceStream": {
            "name": "MicrosoftResearch.Rin.PanoramicExperienceStream",
            "version": 0.0
        },
        "SIVPanoramicExperienceStream": {
            "name": "MicrosoftResearch.Rin.PanoramicImmersiveViewerExperienceStream",
            "version": 0.0
        },
        "krPanoramicExperienceStream": {
            "name": "MicrosoftResearch.Rin.krPanoExperienceStream",
            "version": 0.0
        }
    },
    "resources": {
        "PanoramaResource-EBC-Pumori": {
            "uriReference": "http://cdn1.ps1.photosynth.net/pano/c01001100-ALAfS_+O3S0/0.json" 
        },

        "PanoramaResource-Everest-Base-Camp": {
            "uriReference": "http://cdn3.ps1.photosynth.net/pano/c01001300-ALEfmRCp3S0/0.json"
        },

        "PanoramaResource-ROI-Exhibit-Tent": {
            "uriReference": "http://cdn4.ps1.photosynth.net/pano/c01001400-ALAfrvWs3S0/0.json"
        },

        "krPanoramaResource-EBC-PUMORI": {
            "uriReference": "EBC_Pumori_050112_8bit_FLAT-SMALL-ext/EBC_Pumori_050112_8bit_FLAT-SMALL-ext.xml"
        },
        "krPanoramaResource-Everest-Base-Camp": {
            "uriReference": "EBC_Everest Base Camp/EBC_Everest Base Camp_pano25_36x18k_spherical-small-cube.xml"
        },
        "krPanoramaResource-ROI-Exhibit-Tent": {
            "uriReference": "EBC_RoI_Exhibit/EBC_RoI Exhibit Tent Interior_050312_pano12_36x18k_sph-small-cube.xml"
        },
        "OverlaysResource": {
            "uriReference": "RIN_OVERLAYS.js"
        }
    },
    "experiences": {
        "PanoExperience-1": {
            "providerId": "SIVPanoramicExperienceStream",
            "data": {
                "mode": "stresstest",
                "markers": {
                    "beginAt": 0,
                    "endAt": 10
                },
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "PanoramaResource-EBC-Pumori",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0,
                            "data": { "fov": 0.7, "pitch": 0, "heading": -1 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -1,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.7
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 3,
                            "holdDuration": 0,
                            "data": { "fov": 0.4, "pitch": 0, "heading": -1 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -1,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 6,
                            "holdDuration": 2,
                            "data": { "fov": 0.4, "pitch": 0, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 8,
                            "holdDuration": 0,
                            "data": { "fov": 0.4, "pitch": 0.08, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0.08
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 10,
                            "holdDuration": 0,
                            "data": { "fov": 0.7, "pitch": 0, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.7
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        "PanoExperience-2": {
            "providerId": "SIVPanoramicExperienceStream",
            "data": {
                "mode": "stresstest",
                "markers": {
                    "beginAt": 0,
                    "endAt": 10
                },
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "PanoramaResource-Everest-Base-Camp",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0,
                            "data": { "fov": 0.7, "pitch": 0, "heading": -1 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -1,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.7
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 3,
                            "holdDuration": 0,
                            "data": { "fov": 0.4, "pitch": 0, "heading": -1 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -1,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 6,
                            "holdDuration": 2,
                            "data": { "fov": 0.4, "pitch": 0, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 8,
                            "holdDuration": 0,
                            "data": { "fov": 0.4, "pitch": 0.08, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0.08
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 10,
                            "holdDuration": 0,
                            "data": { "fov": 0.7, "pitch": 0, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.7
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        "PanoExperience-3": {
            "providerId": "SIVPanoramicExperienceStream",
            "data": {
                "mode": "stresstest",
                "markers": {
                    "beginAt": 0,
                    "endAt": 10
                },
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "PanoramaResource-ROI-Exhibit-Tent",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0,
                            "data": { "fov": 0.7, "pitch": 0, "heading": -1 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -1,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.7
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 3,
                            "holdDuration": 0,
                            "data": { "fov": 0.4, "pitch": 0, "heading": -1 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -1,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 6,
                            "holdDuration": 2,
                            "data": { "fov": 0.4, "pitch": 0, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 8,
                            "holdDuration": 0,
                            "data": { "fov": 0.4, "pitch": 0.08, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0.08
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.4
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 10,
                            "holdDuration": 0,
                            "data": { "fov": 0.7, "pitch": 0, "heading": -0.5 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.7
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        "krPanoExperience-1": {
            "providerId": "krPanoramaResource-Everest-Base-Camp",
            "data": {
                "mode": "stresstest",
                "markers": {
                    "beginAt": 0,
                    "endAt": 10
                },
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                },
                "html5": "always",
                "wmode": "opaque"
            },
            "resourceReferences": [
                {
                    "resourceId": "krPanoramaResource-EBC-PUMORI",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 3,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 6,
                            "holdDuration": 2,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 47.76
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 9,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 90
                                        }
                                    }
                                }
                            }
                        }

                    ]
                }
            }
        },
        "krPanoExperience-2": {
            "providerId": "krPanoramicExperienceStream",
            "data": {
                "mode": "stresstest",
                "markers": {
                    "beginAt": 0,
                    "endAt": 10
                },
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                },
                "html5": "always",
                "wmode": "transparent"
            },
            "resourceReferences": [
                {
                    "resourceId": "krPanoramaResource-Everest-Base-Camp",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 3,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 6,
                            "holdDuration": 2,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 9,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        }

                    ]
                }
            }
        },
        "krPanoExperience-3": {
            "providerId": "krPanoramicExperienceStream",
            "data": {
                "mode": "stresstest",
                "markers": {
                    "beginAt": 0,
                    "endAt": 10
                },
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                },
                "html5": "always",
                "wmode": "transparent"
            },
            "resourceReferences": [
                {
                    "resourceId": "krPanoramaResource-ROI-Exhibit-Tent",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 3,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 6,
                            "holdDuration": 2,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 9,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 30
                                        }
                                    }
                                }
                            }
                        }

                    ]
                }
            }
        },
        "OverlayES": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "TitleOverlays",
                "artifactLayoutEngineInfo": {
                    "layoutMapper": "MicrosoftResearch.Rin.RinDataMapper.TwoDLayoutDataMapper",
                    "dataSource": {
                        "type": "Artifacts",
                        "resourceId": "OverlaysResource",
                        "dataMapper": "MicrosoftResearch.Rin.RinDataMapper.WxmlDataMapper",
                        "host": "Microsoft.Rin.EmbeddedArtifactHost.DefaultHost"
                    },
                    "environmentalPolicies": {
                        "MicrosoftResearch.Rin.ZoomLayerPolicy": null
                    }
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "OverlaysResource",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 20,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "SIVviewer",
                                        "view": {
                                            "display": {
                                                "show": true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 9.6,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "SIVviewer",
                                        "view": {
                                            "display": {
                                                "show": false
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 10,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "KrPanoviewerHTML5",
                                        "view": {
                                            "display": {
                                                "show": true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 19.6,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "KrPanoviewerHTML5",
                                        "view": {
                                            "display": {
                                                "show": false
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 20,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "KrPanoviewerHTML5",
                                        "view": {
                                            "display": {
                                                "show": true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 29.6,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "KrPanoviewerHTML5",
                                        "view": {
                                            "display": {
                                                "show": false
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 30,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "KrPanoviewerFlash",
                                        "view": {
                                            "display": {
                                                "show": true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 39.6,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "KrPanoviewerFlash",
                                        "view": {
                                            "display": {
                                                "show": false
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
    "screenplays": {
        "SCP1": {
            "data": {
                "experienceStreamReferences": [
                    {
                        "experienceId": "OverlayES",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration": 20,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "PanoExperience-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration": 10,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "krPanoExperience-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 10,
                        "duration": 10,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    }
                ]
            }
        }
    }
}]