[{
    "header": {
        "guid": "e3ced195-0c8b-48f6-b42c-f989e52b4f03",
        "timestamp": "2012-11-05T03:29:41.953Z",
        "startSegment": "defaultSegment"
    },
    "data": {
        "narrative-info": "<NarrativeData><Title>TAGAuthoringPreview</Title><Author>TAG</Author><Description></Description><Branding></Branding><AspectRatio>WideScreen</AspectRatio></NarrativeData>",
        "Chapters-info": "<Chapters-info></Chapters-info>",
        "InteractivityMarkers": ""
    },
    "segments": {
        "defaultSegment": {
            "header": {
                "estimatedDuration": 30,
                "defaultScreenPlay": "SCP1"
            },
            "resourceTable": {
                "R-0": { "defaultUriReference": "http://23.21.147.138:8086/LargeFiles/garidz/dz.xml" },
                "R-1": { "defaultUriReference": "http://archive.bsrlive.brown.edu/archives/bsrbonusbeats/GaribaldiScene43Tour_mastered.mp3" }
            },
            "experienceStreams": {
                "Garibaldi Panorama": {
                    "header": {
                        "defaultKeyframeSequence": "Sequence-0",
                        "provider": { "name": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream", "version": "0.0" }
                    },
                    "data": {},
                    "requiredResourcesOnLoad": ["R-0"],
                    "keyframeSequences": {
                        "Sequence-0": {
                            "header": { "duration": 30 },
                            "data": { "ContentType": "<SingleDeepZoomImage/>" },
                            "keyframes": [{
                                "header": {
                                    "offset": 8,
                                    "holdDuration": 5
                                },
                                "data": {
                                    "default": "<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='0' Viewport_Y='-0.09984642817137874' Viewport_Width='1' Viewport_Height='0.2109375'/>",
                                    "TransitionTime": "<TransitionTime>0</TransitionTime>",
                                    "PauseDuration": "<PauseDuration>5</PauseDuration>",
                                    "keyframeThumbnail": "<Thumbnail>a50211c2-5294-475a-a445-3765cce3cfb7_keyframe_f9b50043-cf57-424f-a077-b88e4570e761.bmp</Thumbnail>"
                                }
                            }, {
                                "header": {
                                    "offset": 10,
                                    "holdDuration": 1.65
                                },
                                "data": {
                                    "default": "<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='-0.0027487570564886446' Viewport_Y='-0.0008792969149124591' Viewport_Width='0.06249999999999996' Viewport_Height='0.013183593749999991'/>",
                                    "TransitionTime": "<TransitionTime>0</TransitionTime>",
                                    "PauseDuration": "<PauseDuration>1.65</PauseDuration>",
                                    "keyframeThumbnail": "<Thumbnail>a50211c2-5294-475a-a445-3765cce3cfb7_keyframe_f9b50043-cf57-424f-a077-b88e4570e761.bmp</Thumbnail>"
                                }
                            }, {
                                "header": {
                                    "offset": 12,
                                    "holdDuration": 1.65
                                },
                                "data": {
                                    "default": "<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='-0.0027487570564886446' Viewport_Y='-0.0008792969149124591' Viewport_Width='0.06249999999999996' Viewport_Height='0.013183593749999991'/>",
                                    "TransitionTime": "<TransitionTime>0</TransitionTime>",
                                    "PauseDuration": "<PauseDuration>1.65</PauseDuration>",
                                    "keyframeThumbnail": "<Thumbnail>a50211c2-5294-475a-a445-3765cce3cfb7_keyframe_f9b50043-cf57-424f-a077-b88e4570e761.bmp</Thumbnail>"
                                }
                            }, {
                                "header": {
                                    "offset": 28,
                                    "holdDuration": 1.65
                                },
                                "data": {
                                    "default": "<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='0.9399484758049434' Viewport_Y='-0.0009154083036709022' Viewport_Width='0.06249999999999985' Viewport_Height='0.013183593749999968'/>",
                                    "TransitionTime": "<TransitionTime>0</TransitionTime>",
                                    "PauseDuration": "<PauseDuration>1.65</PauseDuration>",
                                    "keyframeThumbnail": "<Thumbnail>a50211c2-5294-475a-a445-3765cce3cfb7_keyframe_f9b50043-cf57-424f-a077-b88e4570e761.bmp</Thumbnail>"
                                }
                            }]
                        }
                    }
                },
                "GZAudio": {
                    "header": {
                        "defaultKeyframeSequence": "Sequence-0",
                        "provider": { "name": "MicrosoftResearch.Rin.AudioExperienceStream", "version": "0.0" }
                    },
                    "data": {},
                    "requiredResourcesOnLoad": ["R-1"],
                    "keyframeSequences": {
                        "Sequence-0": {
                            "header": { "duration": 30 },
                            "data": {},
                            "keyframes": []
                        }
                    }
                }
            },
            "screenPlays": {
                "SCP1": {
                    "header": {},
                    "data": {
                        "ExperienceStreams": "<ExperienceStreams><ExperienceStream Id='Garibaldi Panorama' KeyframeSequenceId='Sequence-0' Begin='0' Dur='30' Layer='foreground' DominantMedia='visual' Volume='1' /><ExperienceStream Id='GZAudio' KeyframeSequenceId='Sequence-0' Begin='0' Dur='30' Layer='background' DominantMedia='audio' Volume='1' /></ExperienceStreams>"
                    }
                }
            }
        }
    }
}
]