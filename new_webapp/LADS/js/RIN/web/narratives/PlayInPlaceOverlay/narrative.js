[{
    "version" : 1.0,
    "defaultScreenplayId" : "SCP1",
    "screenplayProviderId" : "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
    "data" : {
        "narrativeData" : {
            "guid" : "1d0a61f1-c36b-4644-a1e2-fba9326ca80b",
            "timestamp" : "2013-03-26T06:58:07.3043901Z",
            "title" : "Test2",
            "author" : "v-poornr",
            "aspectRatio" : "WideScreen",
            "estimatedDuration" : 25.919999999999998,
            "description" : "Description",
            "branding" : null
        }
    },
    "providers" : {
        "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter" : {
            "name" : "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
            "version" : 0.0
        },
        "microsoftResearch.rin.twodlayoutengine" : {
            "name" : "microsoftResearch.rin.twodlayoutengine",
            "version" : 0.0
        },
        "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2" : {
            "name" : "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2",
            "version" : 0.0
        },
        "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService" : {
            "name" : "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService",
            "version" : 0.0
        }
    },
    "resources" : {
        "R-3" : {
            "uriReference" : "Test2_Media/RIN_OVERLAYS.js"
        },
        "R-4" : {
            "uriReference" : "Test2_Media/RIN_HIGHLIGHTS.js"
        },
        "ScreenplayProperties" : {
            "uriReference" : "Test2_Media/screenplayproperties.XML"
        },
        "R-5" : {
            "uriReference" : "Test2_Media/Wildlife.wmv"
        },
        "R-6" : {
            "uriReference" : "Test2_Media/2.jpg"
        },
        "R-7" : {
            "uriReference" : "http://az17600.vo.msecnd.net/rincontent/Published/19d7fc7c-fe29-4d3a-b833-a373f40a77d3/LadakhRIN_01_Media/damagedhouses.wmv"
        },
        "R-8" : {
            "uriReference" : "Test2_Media/video.png"
        }
    },
    "experiences" : {
        "TwoDLayoutEngine-2" : {
            "providerId" : "microsoftResearch.rin.twodlayoutengine",
            "data" : {
                "contentType" : "TitleOverlays",
                "artifactLayoutEngineInfo" : {
                    "layoutMapper" : "MicrosoftResearch.Rin.RinDataMapper.TwoDLayoutDataMapper",
                    "dataSource" : {
                        "type" : "Artifacts",
                        "resourceId" : "R-3",
                        "dataMapper" : "MicrosoftResearch.Rin.RinDataMapper.WxmlDataMapper",
                        "host" : "Microsoft.Rin.EmbeddedArtifactHost.DefaultHost"
                    },
                    "environmentalPolicies" : {
                        "MicrosoftResearch.Rin.ZoomLayerPolicy" : null
                    }
                }
            },
            "resourceReferences" : [
                {
                    "resourceId" : "R-3",
                    "required" : true
                }
            ],
            "experienceStreams" : {
                "defaultStream" : {
                    "duration" : 3.1999999999999997,
                    "keyframes" : [
                        {
                            "offset" : 0,
                            "holdDuration" : 0.19999999999999998,
                            "data" : {
                                "ea-selstate" : {
                                    "item" : {
                                        "itemid" : "6b482e5e-0616-499e-8405-50b954d6bd70",
                                        "view" : {
                                            "display" : {
                                                "show" : true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset" : 2.8,
                            "holdDuration" : 0.19999999999999998,
                            "data" : {
                                "ea-selstate" : {
                                    "item" : {
                                        "itemid" : "6b482e5e-0616-499e-8405-50b954d6bd70",
                                        "view" : {
                                            "display" : {
                                                "show" : false
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
        "TwoDLayoutEngine-3" : {
            "providerId" : "microsoftResearch.rin.twodlayoutengine",
            "data" : {
                "contentType" : "TitleOverlays",
                "artifactLayoutEngineInfo" : {
                    "layoutMapper" : "MicrosoftResearch.Rin.RinDataMapper.TwoDLayoutDataMapper",
                    "dataSource" : {
                        "type" : "Artifacts",
                        "resourceId" : "R-3",
                        "dataMapper" : "MicrosoftResearch.Rin.RinDataMapper.WxmlDataMapper",
                        "host" : "Microsoft.Rin.EmbeddedArtifactHost.DefaultHost"
                    },
                    "environmentalPolicies" : {
                        "MicrosoftResearch.Rin.ZoomLayerPolicy" : null
                    }
                }
            },
            "resourceReferences" : [
                {
                    "resourceId" : "R-3",
                    "required" : true
                }
            ],
            "experienceStreams" : {
                "defaultStream" : {
                    "duration" : 2.12,
                    "keyframes" : [
                        {
                            "offset" : 0,
                            "holdDuration" : 0.19999999999999998,
                            "data" : {
                                "ea-selstate" : {
                                    "item" : {
                                        "itemid" : "c2ba3417-147e-43fe-82ad-c66fce03e161",
                                        "view" : {
                                            "display" : {
                                                "show" : true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset" : 1.72,
                            "holdDuration" : 0.19999999999999998,
                            "data" : {
                                "ea-selstate" : {
                                    "item" : {
                                        "itemid" : "c2ba3417-147e-43fe-82ad-c66fce03e161",
                                        "view" : {
                                            "display" : {
                                                "show" : false
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
        "VideoExperienceStream-1" : {
            "providerId" : "microsoftResearch.rin.twodlayoutengine",
            "data" : {
                "contentType" : "Video",
                "artifactLayoutEngineInfo" : {
                    "layoutMapper" : "MicrosoftResearch.Rin.RinDataMapper.TwoDLayoutDataMapper",
                    "dataSource" : {
                        "type" : "Artifacts",
                        "resourceId" : "R-3",
                        "dataMapper" : "MicrosoftResearch.Rin.RinDataMapper.WxmlDataMapper",
                        "host" : "Microsoft.Rin.EmbeddedArtifactHost.DefaultHost"
                    },
                    "environmentalPolicies" : {
                        "MicrosoftResearch.Rin.ZoomLayerPolicy" : null
                    }
                }
            },
            "resourceReferences" : [
                {
                    "resourceId" : "R-3",
                    "required" : true
                },
                {
                    "resourceId" : "R-7",
                    "required" : true
                },
                {
                    "resourceId" : "R-8",
                    "required" : true
                }
            ],
            "experienceStreams" : {
                "defaultStream" : {
                    "duration" : 14.966999999999999,
                    "keyframes" : [
                        {
                            "offset" : 0,
                            "holdDuration" : 0.19999999999999998,
                            "data" : {
                                "ea-selstate" : {
                                    "item" : {
                                        "itemid" : "f797094b-7e89-4a85-842c-73e87dfa3426",
                                        "view" : {
                                            "display" : {
                                                "show" : true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset" : 14.567,
                            "holdDuration" : 0.19999999999999998,
                            "data" : {
                                "ea-selstate" : {
                                    "item" : {
                                        "itemid" : "f797094b-7e89-4a85-842c-73e87dfa3426",
                                        "view" : {
                                            "display" : {
                                                "show" : false
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
        "ZoomableMediaExperienceStreamV2-1" : {
            "providerId" : "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2",
            "data" : {
                "transition" : {
                    "providerId" : "MicrosoftResearch.Rin.SLPlayer.FadeInOutTransitionService",
                    "inDuration" : 2,
                    "outDuration" : 2
                }
            },
            "resourceReferences" : [
                {
                    "resourceId" : "R-6",
                    "required" : true
                }
            ],
            "experienceStreams" : {
                "defaultStream" : {
                    "duration" : 25.919999999999998
                }
            }
        }
    },
    "screenplays" : {
        "SCP1" : {
            "data" : {
                "experienceStreamReferences" : [
                    {
                        "experienceId" : "TwoDLayoutEngine-2",
                        "experienceStreamId" : "defaultStream",
                        "begin" : 0.44,
                        "duration" : 3.1999999999999997,
                        "layer" : "overlay",
                        "dominantMedia" : "visual",
                        "volume" : 0.6
                    },
                    {
                        "experienceId" : "TwoDLayoutEngine-3",
                        "experienceStreamId" : "defaultStream",
                        "begin" : 4.56,
                        "duration" : 2.12,
                        "layer" : "overlay",
                        "dominantMedia" : "visual",
                        "volume" : 0.6
                    },
                    {
                        "experienceId" : "VideoExperienceStream-1",
                        "experienceStreamId" : "defaultStream",
                        "begin" : 7.04,
                        "duration" : 14.966999999999999,
                        "layer" : "overlay",
                        "dominantMedia" : "visual",
                        "volume" : 0.6
                    },
                    {
                        "experienceId" : "ZoomableMediaExperienceStreamV2-1",
                        "experienceStreamId" : "defaultStream",
                        "begin" : 0,
                        "duration" : 25.919999999999998,
                        "layer" : "foreground",
                        "dominantMedia" : "visual",
                        "volume" : 0.6
                    }
                ]
            }
        }
    }
}]