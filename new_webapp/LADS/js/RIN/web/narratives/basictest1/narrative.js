[{
    "version": 1.0,
    "defaultScreenplayId": "SCP1",
    "data": {
        "narrativeData": {
            "guid": "c97dafab-d266-4ca0-88a0-c7dce9816176",
            "timestamp": "2013-03-18T07:17:56.2266881Z",
            "title": "GCE-Content",
            "author": "josephj",
            "aspectRatio": "WideScreen",
            "estimatedDuration": 66.771999999999991,
            "description": "Description",
            "branding": null
        }
    },
    "providers": {
        "microsoftResearch.rin.twodlayoutengine": {
            "name": "microsoftResearch.rin.twodlayoutengine",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.VideoExperienceStream": {
            "name": "MicrosoftResearch.Rin.VideoExperienceStream",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService": {
            "name": "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2": {
            "name": "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.PhotosynthES": {
            "name": "MicrosoftResearch.Rin.PhotosynthES",
            "version": 0.0
        },
        "PanoramicExperienceStream": {
            "name": "MicrosoftResearch.Rin.PanoramicExperienceStream",
            "version": 0.0
        },
        "MicrosoftResearch.Rin.AudioExperienceStream": {
            "name": "MicrosoftResearch.Rin.AudioExperienceStream",
            "version": 0.0
        }
    },
    "resources": {
        "R-1": {
            "uriReference": "narrative_Media/RIN_OVERLAYS.js"
        },
        "R-2": {
            "uriReference": "http://0fd8fd0ff3f74c958a3aaefecedf82a0.cloudapp.net/rinHtml/narratives/JosephDemo/GCE-Content_Media/RIN_HIGHLIGHTS.js"
        },
        "R-3": {
            "uriReference": "http://0fd8fd0ff3f74c958a3aaefecedf82a0.cloudapp.net/rinHtml/narratives/JosephDemo/GCE-Content_Media/In_60fps.mp4"
        },
        "R-4": {
            "uriReference": "http://photosynth.net/view.aspx?cid=af587eb7-4650-410c-8d0c-f8b1f7bc3a6c"
        },
        "R-5": {
            "uriReference": "http://photosynth.net/view.aspx?cid=cf5a1dda-1b7e-4303-bfd9-643d4430ccec"
        },
        "R-6": {
            "uriReference": "http://photosynth.net/view.aspx?cid=05c8b846-e61e-4e7c-a6fa-1be3a21c66d5"
        },
        "R-7": {
            "uriReference": "http://photosynth.net/view.aspx?cid=b78fead7-5a9a-48fe-81be-92387d9936f9"
        },
        "R-8": {
            "uriReference": "http://0fd8fd0ff3f74c958a3aaefecedf82a0.cloudapp.net/rinHtml/narratives/JosephDemo/GCE-Content_Media/trailermusic02.mp3"
        },
        "R-9": {
            "uriReference": "http://0fd8fd0ff3f74c958a3aaefecedf82a0.cloudapp.net/rinHtml/narratives/JosephDemo/GCE-Content_Media/GW-KalapattharViewB-DB-VO.wma"
        },
        "R-10": {
            "uriReference": "http://0fd8fd0ff3f74c958a3aaefecedf82a0.cloudapp.net/rinHtml/narratives/JosephDemo/GCE-Content_Media/Comp_shortvideo.wmv"
        },
        "R-11": {
            "uriReference": "http://0fd8fd0ff3f74c958a3aaefecedf82a0.cloudapp.net/rinHtml/narratives/JosephDemo/GCE-Content_Media/Thumbnails/Comp_shortvideo_wmvthumb.jpg"
        },
        "R-12": {
            "uriReference": "http://www.zoom.it/u4IU"
        },
        "R-13": {
            "uriReference": "http://www.zoom.it/ctzf"
        },
        "PanoramaResource": {
            "uriReference": "https://s3.amazonaws.com/t1.360cities/metadata/40165-TAdemo"
        },
        "PanoramaResource-2": {
            "uriReference": "https://s3.amazonaws.com/t1.360cities/metadata/40165-TAdemo"
        }
    },
    "experiences": {
        "TwoDLayoutEngine-5": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "TitleOverlays",
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
                    "duration": 9.7999999999999989,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "71fcfe72-a4b3-4b59-9a46-39be314a671c",
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
                            "offset": 9.4,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "71fcfe72-a4b3-4b59-9a46-39be314a671c",
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
        },
        "TwoDLayoutEngine-1": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "TitleOverlays",
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
                    "duration": 9.6,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "45c15679-eb7f-4c3e-8085-89edc450c23c",
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
                            "offset": 9.2,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "45c15679-eb7f-4c3e-8085-89edc450c23c",
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
        },
        "VideoExperienceStream-2": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "Video",
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
                },
                {
                    "resourceId": "R-10",
                    "required": true
                },
                {
                    "resourceId": "R-11",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 3.8699999999999997,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "74332aaf-0424-4be9-b164-6dccd1ee3efb",
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
                            "offset": 3.4699999999999998,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "74332aaf-0424-4be9-b164-6dccd1ee3efb",
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
        },
        "TwoDLayoutEngine-6": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "TitleOverlays",
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
                    "duration": 9.7999999999999989,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "d3b4ec84-e637-4bdd-a4bd-b1e46bf20738",
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
                            "offset": 9.4,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "d3b4ec84-e637-4bdd-a4bd-b1e46bf20738",
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
                    "duration": 9.7999999999999989,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "472368c4-bbcc-4509-a198-3f87931b4b32",
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
                            "offset": 9.4,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "472368c4-bbcc-4509-a198-3f87931b4b32",
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
        },
        "TwoDLayoutEngine-2": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "TitleOverlays",
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
                    "duration": 9.7999999999999989,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "3d5a99c5-6fe3-4f01-b3d6-6bc85f114a55",
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
                            "offset": 9.4,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "3d5a99c5-6fe3-4f01-b3d6-6bc85f114a55",
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
        },
        "TwoDLayoutEngine-3": {
            "providerId": "microsoftResearch.rin.twodlayoutengine",
            "data": {
                "contentType": "TitleOverlays",
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
                    "duration": 9.7999999999999989,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "d0f3a139-d0b0-4c39-9c92-f18da359a190",
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
                            "offset": 9.4,
                            "holdDuration": 0.19999999999999998,
                            "data": {
                                "ea-selstate": {
                                    "item": {
                                        "itemid": "d0f3a139-d0b0-4c39-9c92-f18da359a190",
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
        },
        "VideoExperienceStream-1": {
            "providerId": "MicrosoftResearch.Rin.VideoExperienceStream",
            "data": {
                "transition": {
                    "providerId": "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService",
                    "inDuration": 2,
                    "outDuration": 2
                },
                "markers": {
                    "beginAt": 0,
                    "endAt": 15.017
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-3",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 15.017
                }
            }
        },
        "ZoomableMediaExperienceStreamV2-1": {
            "providerId": "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2",
            "data": {
                "transition": {
                    "providerId": "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService",
                    "inDuration": 2,
                    "outDuration": 2
                },
                "artifactLayoutEngineInfo": {
                    "layoutMapper": "MicrosoftResearch.Rin.RinDataMapper.TwoDLayoutDataMapper",
                    "dataSource": {
                        "type": "Highlights",
                        "resourceId": "R-2",
                        "dataMapper": "MicrosoftResearch.Rin.RinDataMapper.WxmlDataMapper",
                        "host": "Microsoft.Rin.EmbeddedArtifactHost.DefaultHost"
                    }
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-12",
                    "required": true
                },
                {
                    "resourceId": "R-2",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 26.9,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 3.55,
                            "data": {
                                "default": "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-12\" Viewport_X=\"0.26219823854885838\" Viewport_Y=\"0.030075948034381128\" Viewport_Width=\"0.32768\" Viewport_Height=\"0.18432\" Media_AspRatio=\"0.26531249446515004\" />",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/4234dfb0-6620-41f3-bf01-be9b12b3a3a8_keyframe_970499f4-291b-4532-87a1-b944a88d9720.bmp</Thumbnail>"
                            },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.26219823854885838,
                                            "y": 0.030075948034381128
                                        },
                                        "span": {
                                            "x": 0.32768,
                                            "y": 0.18432
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 23.9,
                            "holdDuration": 3,
                            "data": {
                                "default": "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-12\" Viewport_X=\"0.34124064226240491\" Viewport_Y=\"0.033957141068320332\" Viewport_Width=\"0.035184372088832\" Viewport_Height=\"0.019791209299968\" Media_AspRatio=\"0.26531249446515004\" />",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/4234dfb0-6620-41f3-bf01-be9b12b3a3a8_keyframe_7b1683d2-0204-426c-96ac-49eb6f1060a8.bmp</Thumbnail>"
                            },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.34124064226240491,
                                            "y": 0.033957141068320332
                                        },
                                        "span": {
                                            "x": 0.035184372088832,
                                            "y": 0.019791209299968
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        "ZoomableMediaExperienceStreamV2-2": {
            "providerId": "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2",
            "data": {
                "transition": {
                    "providerId": "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService",
                    "inDuration": 2,
                    "outDuration": 2
                },
                "artifactLayoutEngineInfo": {
                    "layoutMapper": "MicrosoftResearch.Rin.RinDataMapper.TwoDLayoutDataMapper",
                    "dataSource": {
                        "type": "Highlights",
                        "resourceId": "R-2",
                        "dataMapper": "MicrosoftResearch.Rin.RinDataMapper.WxmlDataMapper",
                        "host": "Microsoft.Rin.EmbeddedArtifactHost.DefaultHost"
                    }
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-13",
                    "required": true
                },
                {
                    "resourceId": "R-2",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10.5,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.5,
                            "data": {
                                "default": "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-13\" Viewport_X=\"0.014483951866138118\" Viewport_Y=\"0.040675607781449512\" Viewport_Width=\"0.26214400000000004\" Viewport_Height=\"0.14745600000000003\" Media_AspRatio=\"0.1929394256433884\" />",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/26b3f6a6-ce4e-4545-b124-864f6ca59704_keyframe_061c4cbd-2d3e-42c2-a6be-a079a9f81aae.bmp</Thumbnail>"
                            },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.014483951866138118,
                                            "y": 0.040675607781449512
                                        },
                                        "span": {
                                            "x": 0.26214400000000004,
                                            "y": 0.14745600000000003
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 5.5,
                            "holdDuration": 0,
                            "data": {
                                "default": "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-13\" Viewport_X=\"0.71665538043756694\" Viewport_Y=\"0.040675607781449512\" Viewport_Width=\"0.26214400000000004\" Viewport_Height=\"0.14745600000000003\" Media_AspRatio=\"0.1929394256433884\" />",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/26b3f6a6-ce4e-4545-b124-864f6ca59704_keyframe_3b688d80-330c-4776-8ab0-93b38d339e10.bmp</Thumbnail>"
                            },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.71665538043756694,
                                            "y": 0.040675607781449512
                                        },
                                        "span": {
                                            "x": 0.26214400000000004,
                                            "y": 0.14745600000000003
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 10.5,
                            "holdDuration": 0,
                            "data": {
                                "default": "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-13\" Viewport_X=\"0.80734008871266638\" Viewport_Y=\"0.1188643315868569\" Viewport_Width=\"0.028147497671065603\" Viewport_Height=\"0.01583421070400581\" Media_AspRatio=\"0.1929394256433884\" />",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/26b3f6a6-ce4e-4545-b124-864f6ca59704_keyframe_6f94bd27-972f-4e1e-be86-2236868c69c9.bmp</Thumbnail>"
                            },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.80734008871266638,
                                            "y": 0.1188643315868569
                                        },
                                        "span": {
                                            "x": 0.028147497671065603,
                                            "y": 0.01583421070400581
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        "PhotosynthES-3": {
            "providerId": "MicrosoftResearch.Rin.PhotosynthES",
            "data": {
                "transition": {
                    "providerId": "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService",
                    "inDuration": 2,
                    "outDuration": 2
                },
                "artifactLayoutEngineInfo": {
                    "layoutMapper": "MicrosoftResearch.Rin.RinDataMapper.PhotosynthLayoutDataMapper",
                    "dataSource": {
                        "type": "Highlights",
                        "resourceId": "R-2",
                        "dataMapper": "MicrosoftResearch.Rin.RinDataMapper.WxmlDataMapper",
                        "host": "Microsoft.Rin.EmbeddedArtifactHost.DefaultHost"
                    }
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-6",
                    "required": true
                },
                {
                    "resourceId": "R-2",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 13.649999999999999,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 2.9499999999999997,
                            "data": {
                                "default": "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-0.948122895027365</ThetaX><ThetaY>-1.39078056123171</ThetaY><ThetaZ>-1.53742598576004</ThetaZ><Zoom>1103.54863644614</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector><NormalizedZoom>0.82109273545099715</NormalizedZoom></PSKeyframe>",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/30b03bcc-0dbd-4d37-96f5-24ec64f996cf_keyframe_d5093574-c50a-4a07-b837-3da0a752f245.bmp</Thumbnail>"
                            }
                        },
                        {
                            "offset": 11.7,
                            "holdDuration": 1.95,
                            "data": {
                                "default": "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-0.629270418342185</ThetaX><ThetaY>-1.30604059899473</ThetaY><ThetaZ>-1.92205020197454</ThetaZ><Zoom>7502.6139309381</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector><NormalizedZoom>5.5823020319479912</NormalizedZoom></PSKeyframe>",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/30b03bcc-0dbd-4d37-96f5-24ec64f996cf_keyframe_83d26d5f-0be0-4b76-b340-b3b02b9ab243.bmp</Thumbnail>"
                            }
                        }
                    ]
                }
            }
        },
        "PhotosynthES-4": {
            "providerId": "MicrosoftResearch.Rin.PhotosynthES",
            "data": {
                "transition": {
                    "providerId": "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService",
                    "inDuration": 2,
                    "outDuration": 2
                },
                "artifactLayoutEngineInfo": {
                    "layoutMapper": "MicrosoftResearch.Rin.RinDataMapper.PhotosynthLayoutDataMapper",
                    "dataSource": {
                        "type": "Highlights",
                        "resourceId": "R-2",
                        "dataMapper": "MicrosoftResearch.Rin.RinDataMapper.WxmlDataMapper",
                        "host": "Microsoft.Rin.EmbeddedArtifactHost.DefaultHost"
                    }
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-7",
                    "required": true
                },
                {
                    "resourceId": "R-2",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 16.05,
                    "keyframes": [
                        {
                            "offset": 0,
                            "holdDuration": 0.5,
                            "data": {
                                "default": "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-1.25506178585813</ThetaX><ThetaY>-1.2171826330347</ThetaY><ThetaZ>-1.16706409769837</ThetaZ><Zoom>1100.38756799834</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector><NormalizedZoom>0.81874074999876489</NormalizedZoom></PSKeyframe>",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/18fb17d7-730d-4609-9c35-8712a3ae2145_keyframe_a3799e32-2a4c-4b60-965c-275ccf07ccd6.bmp</Thumbnail>"
                            }
                        },
                        {
                            "offset": 13.899999999999999,
                            "holdDuration": 2.15,
                            "data": {
                                "default": "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-1.35097651924833</ThetaX><ThetaY>0.708050878778656</ThetaY><ThetaZ>0.778233595246838</ThetaZ><Zoom>1100.38756799834</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector><NormalizedZoom>0.81874074999876489</NormalizedZoom></PSKeyframe>",
                                "ea-selstate": null,
                                "keyframeThumbnail": "<Thumbnail>Thumbnails/18fb17d7-730d-4609-9c35-8712a3ae2145_keyframe_661a6cf1-caed-40ce-a3a6-a1d398d9b954.bmp</Thumbnail>"
                            }
                        }
                    ]
                }
            }
        },
        "PanoExperience-1": {
            "providerId": "PanoramicExperienceStream",
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
                    "resourceId": "PanoramaResource",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10,
                    "keyframes": [
                        {
                            "offset": 2,
                            "holdDuration": 0,
                            "data": {
                                "fov": 0.8, "pitch": 0.1, "heading": 1
                            },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 1,
                                            "y": 0.1
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.8
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 6,
                            "holdDuration": 1,
                            "data": { "fov": 0.8, "pitch": 0.1, "heading": 2 },
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 2,
                                            "y": 0.1
                                        },
                                        "span": {
                                            "x": 0,
                                            "y": 0.8
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        "AudioExperienceStream-2": {
            "providerId": "MicrosoftResearch.Rin.AudioExperienceStream",
            "data": {
                "markers": {
                    "beginAt": 0,
                    "endAt": 22.429
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-9",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 22.429
                }
            }
        },
        "AudioExperienceStream-3": {
            "providerId": "MicrosoftResearch.Rin.AudioExperienceStream",
            "data": {
                "markers": {
                    "beginAt": 0,
                    "endAt": 41.6218125
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-8",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 41.622
                }
            }
        },
        "AudioExperienceStream-1": {
            "providerId": "MicrosoftResearch.Rin.AudioExperienceStream",
            "data": {
                "markers": {
                    "beginAt": 0,
                    "endAt": 41.6218125
                }
            },
            "resourceReferences": [
                {
                    "resourceId": "R-8",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 41.622
                }
            }
        }
    },
    "screenplays": {
        "SCP1": {
            "data": {
                "experienceStreamReferences": [
                    {
                        "experienceId": "TwoDLayoutEngine-5",
                        "experienceStreamId": "defaultStream",
                        "begin": 15.1,
                        "duration": 9.7999999999999989,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "TwoDLayoutEngine-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 0.3,
                        "duration": 9.4,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "VideoExperienceStream-2",
                        "experienceStreamId": "defaultStream",
                        "begin": 12.899999999999999,
                        "duration": 3.8699999999999997,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "TwoDLayoutEngine-6",
                        "experienceStreamId": "defaultStream",
                        "begin": 42.05,
                        "duration": 9.7999999999999989,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "MaskOverlay",
                        "experienceStreamId": "defaultStream",
                        "begin": 41.917,
                        "duration": 10.5,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "TwoDLayoutEngine-2",
                        "experienceStreamId": "defaultStream",
                        "begin": 52.65,
                        "duration": 9.6,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "TwoDLayoutEngine-3",
                        "experienceStreamId": "defaultStream",
                        "begin": 66.6,
                        "duration": 9.6,
                        "layer": "overlay",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "VideoExperienceStream-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration": 15.017,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "ZoomableMediaExperienceStreamV2-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 15.017,
                        "duration": 26.9,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "ZoomableMediaExperienceStreamV2-2",
                        "experienceStreamId": "defaultStream",
                        "begin": 41.917,
                        "duration": 10.5,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 0.6
                    },
                    {
                        "experienceId": "PanoExperience-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 52.417,
                        "duration": 13.649999999999999,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "AudioExperienceStream-2",
                        "experienceStreamId": "defaultStream",
                        "begin": 16.7,
                        "duration": 22.429,
                        "layer": "foreground",
                        "dominantMedia": "audio",
                        "volume": 1
                    },
                    {
                        "experienceId": "AudioExperienceStream-3",
                        "experienceStreamId": "defaultStream",
                        "begin": 42.15,
                        "duration": 41.622,
                        "layer": "foreground",
                        "dominantMedia": "audio",
                        "volume": 1
                    },
                    {
                        "experienceId": "AudioExperienceStream-1",
                        "experienceStreamId": "defaultStream",
                        "begin": 0.79999999999999993,
                        "duration": 41.622,
                        "layer": "foreground",
                        "dominantMedia": "audio",
                        "volume": 1
                    }
                ]
            }
        }
    }
}]