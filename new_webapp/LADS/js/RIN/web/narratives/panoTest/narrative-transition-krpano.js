[{
    "version": 1.0,
    "defaultScreenplayId": "SCP1",
    "screenplayProviderId": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
    "data": {
        "narrativeData": {
            "guid": "6aa09d19-cf2b-4c8e-8b57-7ea8701794f7",
            "timestamp": "2011-07-29T00:48:12.8847651Z",
            "title": "SIV Panorama viewer To DeepZoom transition",
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
        "SIVPanoramicExperienceStream": {
            "name": "MicrosoftResearch.Rin.PanoramicImmersiveViewerExperienceStream",
            "version": 0.0
        },
        "krPanoramicExperienceStream": {
            "name": "MicrosoftResearch.Rin.krPanoExperienceStream",
            "version": 0.0
        },
        "DeepZoomExperienceStream": {
            "name": "MicrosoftResearch.Rin.DeepZoomExperienceStream",
            "version": 0.0
        }
    },
    "resources": {
        "PanoramaResource-EBC-Pumori": {
            "uriReference": "http://cdn1.ps1.photosynth.net/pano/c01001100-ALAfS_+O3S0/0.json" 
        },
        "OverlaysResource": {
            "uriReference": "RIN_OVERLAYS.js"
        },
        "krPanoramaResource-EBC-PUMORI": {
            "uriReference": "EBC_Pumori_050112_8bit_FLAT-SMALL-ext/EBC_Pumori_050112_8bit_FLAT-SMALL-ext.xml"
        },
        "DeepZoom-EBC-Pumori": {
            "uriReference": "http://zoom.it/xCOo"
        },
        "EBC-Pumori-EAData": {
            "uriReference": "EBC_Pumori_050112_8bit_FLAT-SMALL-ext/EBC_Pumori_EAData.js"
        }
    },
    "experiences": {
        "krPanoExperience-1": {
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
                "EmbeddedArtifacts": {
                    "datasource": "EBC-Pumori-EAData",
                    "artifactHost": "rin.embeddedArtifacts.ArtifactHost",
                    "policies": ["base2DGroupPolicy"]
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
                                            "x": -5,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 60
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
                                            "x": -10,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 60
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 5,
                            "holdDuration": 2,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -10,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 47
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
                                            "x": -20,
                                            "y": 0
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 47
                                        }
                                    }
                                }
                            }
                        }

                    ]
                }
            }
        },
        "DeepZoomES-EBC-Pumori": {
            "providerId": "DeepZoomExperienceStream",
            "data": {
                "mode": "stresstest",
                "markers": {
                    "beginAt": 0,
                    "endAt": 10.899999999999999
                },
                "transition": {
                    "providerId": "FadeInOutTransitionService",
                    "inDuration": 0.5,
                    "outDuration": 0.5
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "DeepZoom-EBC-Pumori",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream" : {
                    "duration" : 10.0,
                    "data" : {
                        "contentType" : "SingleDeepZoomImage"
                    },
                    "keyframes" : [
						{
						    "offset": 0,
						    "holdDuration": 0.5,
						    "data": {
						        "default": "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-1\" Viewport_X=\"0.5923811970600481\" Viewport_Y=\"0.29659771339558905\" Viewport_Width=\"0.00025961484292674151\" Viewport_Height=\"0.00014609263999044406\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.53243931310913006\" />",
						        "TransitionTime": "<TransitionTime>0</TransitionTime>",
						        "PauseDuration": "<PauseDuration>0.5</PauseDuration>",
						        "keyframeThumbnail": "<Thumbnail>11a6ab9c-7cce-4c45-b4c4-bb45b6c44cdd_keyframe_cdd2ecd5-6e5f-45a7-b549-46d6bc835636.bmp</Thumbnail>"
						    },
						    "state": {
						        "viewport": {
						            "region": {
						                "center": {
						                    "x": 0.13501,
						                    "y": -0.004494
						                },
						                "span": {
						                    "x": 0.49057,
						                    "y": 0.272268
						                }
						            }
						        }
						    }
						},
						{
						    "offset": 2,
						    "holdDuration": 0,
						    "data": {
						        "default": "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-1\" Viewport_X=\"0.39608882833680603\" Viewport_Y=\"0.18008906525097232\" Viewport_Width=\"0.40629150524062591\" Viewport_Height=\"0.22863176056171641\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.53243931310913006\" />",
						        "TransitionTime": "<TransitionTime>8.75</TransitionTime>",
						        "PauseDuration": "<PauseDuration>0</PauseDuration>",
						        "keyframeThumbnail": "<Thumbnail>11a6ab9c-7cce-4c45-b4c4-bb45b6c44cdd_keyframe_08da70cf-827a-42c3-a5de-d0e5deead3ed.bmp</Thumbnail>"
						    },
						    "state": {
						        "viewport": {
						            "region": {
						                "center": {
						                    "x": 0.13501,
						                    "y": -0.004494
						                },
						                "span": {
						                    "x": 0.49057,
						                    "y": 0.272268
						                }
						            }
						        }
						    }
						},
						{
						    "offset": 9.25,
						    "holdDuration": 0,
						    "data": {
						        "default": "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-1\" Viewport_X=\"0.39608882833680603\" Viewport_Y=\"0.18008906525097232\" Viewport_Width=\"0.40629150524062591\" Viewport_Height=\"0.22863176056171641\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.53243931310913006\" />",
						        "TransitionTime": "<TransitionTime>8.75</TransitionTime>",
						        "PauseDuration": "<PauseDuration>0</PauseDuration>",
						        "keyframeThumbnail": "<Thumbnail>11a6ab9c-7cce-4c45-b4c4-bb45b6c44cdd_keyframe_08da70cf-827a-42c3-a5de-d0e5deead3ed.bmp</Thumbnail>"
						    },
						    "state": {
						        "viewport": {
						            "region": {
						                "center": {
						                    "x": 0.161373,
						                    "y": -0.007597543835996098
						                },
						                "span": {
						                    "x": 0.2667788,
						                    "y": 0.1480622
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
                    "duration": 60,
                    "keyframes": [
                        {
                            "offset": 0,
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
                            "offset": 9.6,
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
                            "offset": 10,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "DeepZoom",
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
                                        "itemid": "DeepZoom",
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
                        "experienceId": "krPanoExperience-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration": 10,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "DeepZoomES-EBC-Pumori",
                        "experienceStreamId": "defaultStream",
                        "begin": 10,
                        "duration": 10.0,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    }
                ]
            }
        }
    }
}]