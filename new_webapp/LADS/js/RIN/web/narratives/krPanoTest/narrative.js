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
        "krPanoramicExperienceStream": {
            "name": "MicrosoftResearch.Rin.krPanoExperienceStream",
            "version": 0.0
        }
    },
    "resources": {
        "krPanoramaResource-Engelsbruecke": {
            "uriReference": "js-loadpano/pano1.xml"
        },
        "krPanoramaResource-EBC-PUMORI": {
            "uriReference": "js-loadpano/pano1.xml"
        }
    },
    "experiences": {
        "krPanoExperience-html5": {
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
                "wmode": "opaque"
            },
            "resourceReferences": [
                {
                    "resourceId": "krPanoramaResource-Engelsbruecke",
                    "required": true
                }
            ],
            "experienceStreams": {
                "defaultStream": {
                    "duration": 10,
                    "keyframes": [

                    ]
                }
            }
        },
        "krPanoExperience-Flash-window": {
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
                "html5": "never",
                "wmode": "window"
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
                                            "y": 90
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
                                            "y": 47.76
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
        "krPanoExperience-Flash-transparent": {
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
                "html5": "never",
                "wmode": "transparent"
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
                                            "y": 90
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
                                            "y": 47.76
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
        }
    },
    "screenplays": {
        "SCP1": {
            "data": {
                "experienceStreamReferences": [
                    {
                        "experienceId": "krPanoExperience-html5",
                        "experienceStreamId": "defaultStream",
                        "begin": 0,
                        "duration": 10,
                        "layer": "foreground",
                        "dominantMedia": "visual",
                        "volume": 1
                    },
                    {
                        "experienceId": "krPanoExperience-Flash-transparent",
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