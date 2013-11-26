[{
    "version": "1.0",
    "defaultScreenplayId": "SCP1",
    "data": {
        "narrativeData": {
            "guid": "e3ced195-0c8b-48f6-b42c-f989e52b4f03",
            "timestamp": "2013-03-04T03:20:59.690Z",
            "title": "TAGAuthoringPreview",
            "author": "TAG Authoring Tool",
            "aspectRatio": "WideScreen",
            "estimatedDuration": 180,
            "description": "TAG Tour",
            "branding": "TAG"
        }
    },
    "providers": {
        "ZMES": {
            "name": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
            "version": "1.0"
        },
        "AES": {
            "name": "MicrosoftResearch.Rin.AudioExperienceStream",
            "version": "1.0"
        },
        "screenplayProvider": {
            "name": "MicrosoftResearch.Rin.DefaultScreenplayProvider",
            "version": "1.0"
        },
        "FadeInOutTransitionService": {
            "name": "MicrosoftResearch.Rin.FadeInOutTransitionService",
            "version": "1.0"
        },
        "InkES": {
            "name": "MicrosoftResearch.Rin.InkExperienceStream",
            "version": "0.0"
        }
    },
    "resources": {
        "R-0": {
            "uriReference": "http://23.21.147.138:8086/LargeFiles/garidz/dz.xml"
        },
        "R-1": {
            "uriReference": "http://23.21.147.138:8086/Images/20121003064711/dz.xml"
        }
    },
    "experiences": {
        "Garibaldi Panorama": {
            "data": {
                "guid": "48880741-040a-4657-a3ef-0a2f9bbe27cd"
            },
            "providerId": "ZMES",
            "resourceReferences": [
                {
                    "resourceId": "R-0",
                    "required": "true"
                }
            ],
            "experienceStreams": {
                "Garibaldi Panorama-0": {
                    "duration": 9.849998283386231,
                    "header": {
                        "defaultKeyframeSequence": "Garibaldi Panorama-0"
                    },
                    "data": {
                        "layerProperties": {
                            "passthrough": false
                        },
                        "transition": {
                            "providerId": "FadeInOutTransitionService",
                            "inDuration": 0.5,
                            "outDuration": 0.5
                        },
                        "ContentType": "<SingleDeepZoomImage/>"
                    },
                    "keyframes": [
                        {
                            "offset": 0,
                            "init": true,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.00800160576212407,
                                            "y": -0.0009904834728978982
                                        },
                                        "span": {
                                            "x": 0.062007853592507774,
                                            "y": 0.01307978161716961
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 2.3357140949794237,
                            "init": false,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.00800160576212407,
                                            "y": -0.0009904834728978982
                                        },
                                        "span": {
                                            "x": 0.062007853592507774,
                                            "y": 0.01307978161716961
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 8.428999809265128,
                            "init": false,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.5592802553682435,
                                            "y": -0.0006361929723843647
                                        },
                                        "span": {
                                            "x": 0.062007853592507774,
                                            "y": 0.01307978161716961
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                "Garibaldi Panorama-1": {
                    "duration": 5.20050048828125,
                    "header": {
                        "defaultKeyframeSequence": "Garibaldi Panorama-1"
                    },
                    "data": {
                        "layerProperties": {
                            "passthrough": false
                        },
                        "transition": {
                            "providerId": "FadeInOutTransitionService",
                            "inDuration": 0.5,
                            "outDuration": 0.5
                        },
                        "ContentType": "<SingleDeepZoomImage/>"
                    },
                    "keyframes": [
                        {
                            "offset": 0,
                            "init": true,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.8268441295877509,
                                            "y": 0.004547345041348207
                                        },
                                        "span": {
                                            "x": 0.01953124999999998,
                                            "y": 0.006980895996093742
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 1.9875022888183586,
                            "init": false,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": 0.8268441295877509,
                                            "y": 0.004547345041348207
                                        },
                                        "span": {
                                            "x": 0.01953124999999998,
                                            "y": 0.006980895996093742
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            },
            "id": "Garibaldi Panorama",
            "experienceId": "Garibaldi Panorama"
        },
        "Highres": {
            "data": {
                "guid": "f2c6ad01-85bd-401e-9866-1795c4efa84b"
            },
            "providerId": "ZMES",
            "resourceReferences": [
                {
                    "resourceId": "R-1",
                    "required": "true"
                }
            ],
            "experienceStreams": {
                "Highres-0": {
                    "duration": 4,
                    "header": {
                        "defaultKeyframeSequence": "Highres-0"
                    },
                    "data": {
                        "layerProperties": {
                            "passthrough": false
                        },
                        "transition": {
                            "providerId": "FadeInOutTransitionService",
                            "inDuration": 0.5,
                            "outDuration": 0.5
                        },
                        "ContentType": "<SingleDeepZoomImage/>"
                    },
                    "keyframes": [
                        {
                            "offset": 0,
                            "init": true,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.28451395567817283,
                                            "y": -0.029695274969287977
                                        },
                                        "span": {
                                            "x": 2.2997111967422934,
                                            "y": 0.9881571548502043
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 1.4375,
                            "init": false,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.28451395567817283,
                                            "y": -0.029695274969287977
                                        },
                                        "span": {
                                            "x": 2.2997111967422934,
                                            "y": 0.9881571548502043
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                "Highres-1": {
                    "duration": 8.7,
                    "header": {
                        "defaultKeyframeSequence": "Highres-1"
                    },
                    "data": {
                        "layerProperties": {
                            "passthrough": false
                        },
                        "transition": {
                            "providerId": "FadeInOutTransitionService",
                            "inDuration": 0.5,
                            "outDuration": 0.5
                        },
                        "ContentType": "<SingleDeepZoomImage/>"
                    },
                    "keyframes": [
                        {
                            "offset": 0,
                            "init": true,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.4280800595145409,
                                            "y": 0.10061353170827009
                                        },
                                        "span": {
                                            "x": 1.825281986465882,
                                            "y": 0.7843008535595587
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "offset": 2.538000488281252,
                            "init": false,
                            "holdDuration": 0,
                            "state": {
                                "viewport": {
                                    "region": {
                                        "center": {
                                            "x": -0.4280800595145409,
                                            "y": 0.10061353170827009
                                        },
                                        "span": {
                                            "x": 1.825281986465882,
                                            "y": 0.7843008535595587
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            },
            "id": "Highres",
            "experienceId": "Highres"
        }
    },
    "screenplays": {
        "SCP1": {
            "data": {
                "experienceStreamReferences": [
                    {
                        "experienceId": "Highres",
                        "experienceStreamId": "Highres-0",
                        "begin": 0,
                        "duration": 4.5,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "Garibaldi Panorama",
                        "experienceStreamId": "Garibaldi Panorama-0",
                        "begin": 2.44949893951416,
                        "duration": 10.349998283386231,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "Garibaldi Panorama",
                        "experienceStreamId": "Garibaldi Panorama-1",
                        "begin": 13.349497222900391,
                        "duration": 5.70050048828125,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "Highres",
                        "experienceStreamId": "Highres-1",
                        "begin": 17.1989990234375,
                        "duration": 9.2,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    }
                ]
            }
        }
    }
}]