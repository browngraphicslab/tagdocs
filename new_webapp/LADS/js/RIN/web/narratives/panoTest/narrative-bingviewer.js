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
        }
    },
    "resources": {
        "PanoramaResource": {
            "uriReference2": "http://cdn3.ps1.photosynth.net/pano/c01001300-APEfp_CjFS4/0.json",
            "uriReference": "http://cdn4.ps1.photosynth.net/pano/c01001400-AB0gCmPWPC4/0.json"
        },
        "EBC-Pumori-EAData": {
            "uriReference": "EBC_Pumori_050112_8bit_FLAT-SMALL-ext/Pano_EBC_Pumori_EAData.js"
        },
        "OverlaysResource": {
            "uriReference": "RIN_OVERLAYS.js"
        }
    },
    "experiences": {
        "PanoExperience-1": {
            "providerId": "PanoramicExperienceStream",
            "data": {
                "mode": "stresstest",
                "markers": {
                    "beginAt": 0,
                    "endAt": 20
                },
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                },
                "EmbeddedArtifacts": {
                    "datasource": "EBC-Pumori-EAData",
                    "artifactHost": "rin.embeddedArtifacts.ArtifactHost",
                    "policies": ["base2DGroupPolicy"]
                },
                "minFieldOfView": 0.01754,
                "interpolatorType": "vectorBased",
                "smoothTransitions": true,
                "enforceViewLimits": true,
                "viewShrinkFactor": 0.9
            },
            "resourceReferences": [
                {
                    "resourceId": "PanoramaResource",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 20,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0,
                            "data": { "fov": 0.7, "pitch": 0, "heading": -1 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.003,
                                            "y": 0.001
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.83
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 10,
                            "holdDuration": 0,
                            "data": { "fov": 0.4, "pitch": 0, "heading": -1 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 5.83,
                                            "y": 0.286
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.06966
                                        }
                                    }
                                }
                            }
                        }
                        ,
                        {
                            "offset": 32,
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
                            "offset": 35,
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
                            "offset": 40,
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
                    "duration": 40,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "OlderPanoramaViewer",
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
                                        "itemid": "OlderPanoramaViewer",
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