[{
    "version": 1.0,
    "defaultScreenplayId": "SCP1",
    "screenplayProviderId": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
    "data": {
        "narrativeData": {
            "guid": "19d7fc7c-fe29-4d3a-b833-a373f40a77d3",
            "timestamp": "2010-12-30T06:06:04.1837774Z",
            "title": "Untitled",
            "author": "Gautham",
            "aspectRatio": "WideScreen",
            "estimatedDuration": 23,
            "description": "Description",
            "branding": null
        }
    },
    "providers": {
        "MicrosoftResearch.Rin.ZoomableMediaExperienceStream": {
            "name": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
            "version": 0.0
        },
        "microsoftResearch.rin.twodlayoutengine": {
            "name": "microsoftResearch.rin.twodlayoutengine",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter": {
            "name": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
            "version" : 0.0
        }
    },
    "resources": {
        "R-1": {
            "uriReference": "Rin_Overlays.js"
        },
        "R-2": {
            "uriReference": "http://zoom.it/KFRR"
        }
    },
    "experiences": {
        "ZoomableMediaExperienceStream-1": {
            "providerId": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
            "resourceReferences": [
                {
                    "resourceId": "R-2",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 23,
                    "data": {
                        "contentType": "SingleDeepZoomImage"
                    },
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 4.55,
                            "data": {
                                "default": "<ZoomableMediaKeyframe KeyTimePosition=\"1\" Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-43\" Viewport_X=\"0.26664663520367737\" Viewport_Y=\"0.049896005403890664\" Viewport_Width=\"0.56779306484711389\" Viewport_Height=\"0.31842448906966525\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"Rectangle\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.45873484761733829\" />",
                                "TransitionTime": "<TransitionTime>0</TransitionTime>",
                                "PauseDuration": "<PauseDuration>4.55</PauseDuration>",
                                "keyframeThumbnail": "<Thumbnail>a05b3098-fb38-4ff5-bafb-31fdb9b8eff7_keyframe_9eb14809-5c79-44c4-953a-c320b20c4e93.bmp</Thumbnail>"
                            },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.26664663520367737,
                                            "y": 0.049896005403890664
                                        },
                                        "span": {
                                            "x": 0.56779306484711389,
                                            "y": 0.31842448906966525
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 13.5,
                            "holdDuration": 9.4,
                            "data": {
                                "default": "<ZoomableMediaKeyframe KeyTimePosition=\"1\" Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-43\" Viewport_X=\"0.043295124570809237\" Viewport_Y=\"0.0673524247133677\" Viewport_Width=\"0.39430073947716243\" Viewport_Height=\"0.22112811740948976\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"Rectangle\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.45873484761733829\" />",
                                "TransitionTime": "<TransitionTime>8.95</TransitionTime>",
                                "PauseDuration": "<PauseDuration>9.4</PauseDuration>",
                                "keyframeThumbnail": "<Thumbnail>a05b3098-fb38-4ff5-bafb-31fdb9b8eff7_keyframe_b0519472-734c-4f85-958b-4908db2a930b.bmp</Thumbnail>"
                            },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.043295124570809237,
                                            "y": 0.0673524247133677
                                        },
                                        "span": {
                                            "x": 0.39430073947716243,
                                            "y": 0.22112811740948976
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        "MaskOverlay": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "MaskOverlay",
                "artifactLayoutEngineInfo": {
                    "layoutMapper": "MicrosoftResearch.Rin.RinDataMapper.TwoDLayoutDataMapper",
                    "dataSource": {
                        "type": "Artifacts",
                        "resourceId": "R-1",
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
                   "resourceId": "R-1",
                   "required": true
               }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration" : 9.2,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "Overlay2": {
                                        "itemid": "debe014e-02e2-4c81-9444-06e886232a1f",
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
                            "offset": 9,
                            "holdDuration": 0.2,
                            "data": {
                                "ea-selstate": {
                                    "Overlay2": {
                                        "itemid": "debe014e-02e2-4c81-9444-06e886232a1f",
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
                        "experienceId": "ZoomableMediaExperienceStream-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration": 23,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "MaskOverlay",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration" : 9.2,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0
                    }
                ]
            }
        }
    }
}]