[{
    "header": {
        "guid": "e3ced195-0c8b-48f6-b42c-f989e52b4f03",
        "timestamp": "2011-01-08T04:35:05.348278Z",
        "startSegment": "defaultSegment"
    },
    "data": {
        "narrative-info": "<NarrativeData><Title>Sample Narrative</Title><Author>MSRI</Author><Description>Sample Description</Description><Branding>MICROSOFT RESEARCH</Branding><AspectRatio>WideScreen</AspectRatio></NarrativeData>"
    },
    "segments": {
        "defaultSegment": {
            "header": {
                "estimatedDuration": 51,
                "defaultScreenPlay": "SCP1"
            },
            "resourceTable": {
                "R-1": {
                    "defaultUriReference": "http://zoom.it/LNLn"
                },
                "R-2": {
                    "defaultUriReference": "http://www.bing.com/az/hprichbg?p=rb%2fAbiskojakkaRiver_ROW8374954428_1366x768.jpg"
                }
            },
            "experienceStreams": {
                "ImageES-1": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.ImageExperienceStream", "version": "0:0" }
                    },
                    "data": {},
                    "requiredResourcesOnLoad": ["R-2"],
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 10 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info></info>"}}]
                        }
                    }
                },
                "ZoomableMediaExperienceStream-1": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": {
                            "name": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
                            "version": "0.0"
                        }
                    },
                    "data": {},
                    "requiredResourcesOnLoad": [
                        "R-1"
                    ],
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": {
                                "duration": 51
                            },
                            "data": {
                                "ContentType": "<SingleDeepZoomImage/>"
                            },
                            "keyframes": [
                             {
                                 "header": {
                                     "offset": 0,
                                     "holdDuration": 3
                                 },
                                 "data": {
                                     "default": "<ZoomableMediaKeyframe KeyTimePosition='1' Media_Type='SingleDeepZoomImage' Media_Source='R-1' Viewport_X='0' Viewport_Y='0' Viewport_Width='1' Viewport_Height='0.56236786469344613' Highlight_Visible='false' Highlight_X='0' Highlight_Y='0' Highlight_Width='0' Highlight_Height='0' Highlight_Render_Style='DottedRectangleBlue' Highlight_Render_Attribs='' Media_AspRatio='0.74999997764825888'/>"
                                 }
                             },
                               {
                                   "header": {
                                       "offset": 8,
                                       "holdDuration": 3
                                   },
                                   "data": {
                                       "default": "<ZoomableMediaKeyframe KeyTimePosition='1' Media_Type='SingleDeepZoomImage' Media_Source='R-1' Viewport_X='-5.3207660913467389' Viewport_Y='-2.9922278653239593' Viewport_Width='11.641532182693481' Viewport_Height='6.5468235953413663' Highlight_Visible='false' Highlight_X='0' Highlight_Y='0' Highlight_Width='0' Highlight_Height='0' Highlight_Render_Style='DottedRectangleBlue' Highlight_Render_Attribs='' Media_AspRatio='0.74999997764825888'/>"
                                   }
                               },
                               {
                                   "header": {
                                       "offset": 16,
                                       "holdDuration": 3
                                   },
                                   "data": {
                                       "default": "<ZoomableMediaKeyframe KeyTimePosition='1' Media_Type='SingleDeepZoomImage' Media_Source='R-1' Viewport_X='-0.0030803822920840579' Viewport_Y='0.29999162978440752' Viewport_Width='0.023650905753361953' Viewport_Height='0.0133005093665841' Highlight_Visible='false' Highlight_X='0' Highlight_Y='0' Highlight_Width='0' Highlight_Height='0' Highlight_Render_Style='DottedRectangleBlue' Highlight_Render_Attribs='' Media_AspRatio='0.74999997764825888'/>"
                                   }
                               },
                               {
                                   "header": {
                                       "offset": 24,
                                       "holdDuration": 3
                                   },
                                   "data": {
                                       "default": "<ZoomableMediaKeyframe KeyTimePosition='1' Media_Type='SingleDeepZoomImage' Media_Source='R-1' Viewport_X='0.93433897851841408' Viewport_Y='0.48355094894836648' Viewport_Width='0.017919902417597042' Viewport_Height='0.01007757725809897' Highlight_Visible='false' Highlight_X='0' Highlight_Y='0' Highlight_Width='0' Highlight_Height='0' Highlight_Render_Style='DottedRectangleBlue' Highlight_Render_Attribs='' Media_AspRatio='0.74999997764825888'/>"
                                   }
                               },
                               {
                                   "header": {
                                       "offset": 32,
                                       "holdDuration": 3
                                   },
                                   "data": {
                                       "default": "<ZoomableMediaKeyframe KeyTimePosition='1' Media_Type='SingleDeepZoomImage' Media_Source='R-1' Viewport_X='0.22327560413546665' Viewport_Y='0.40192245926903147' Viewport_Width='0.11371221000830037' Viewport_Height='0.06394809273194059' Highlight_Visible='false' Highlight_X='0' Highlight_Y='0' Highlight_Width='0' Highlight_Height='0' Highlight_Render_Style='DottedRectangleBlue' Highlight_Render_Attribs='' Media_AspRatio='0.74999997764825888'/>"
                                   }
                               },
                               {
                                   "header": {
                                       "offset": 40,
                                       "holdDuration": 3
                                   },
                                   "data": {
                                       "default": "<ZoomableMediaKeyframe KeyTimePosition='1' Media_Type='SingleDeepZoomImage' Media_Source='R-1' Viewport_X='0.13708992276553925' Viewport_Y='0.42091456199769056' Viewport_Width='0.11371221000830034' Viewport_Height='0.063948092731940576' Highlight_Visible='false' Highlight_X='0' Highlight_Y='0' Highlight_Width='0' Highlight_Height='0' Highlight_Render_Style='DottedRectangleBlue' Highlight_Render_Attribs='' Media_AspRatio='0.74999997764825888'/>"
                                   }
                               },
                               {
                                   "header": {
                                       "offset": 48,
                                       "holdDuration": 3
                                   },
                                   "data": {
                                       "default": "<ZoomableMediaKeyframe KeyTimePosition='1' Media_Type='SingleDeepZoomImage' Media_Source='R-1' Viewport_X='-0.40404146617567349' Viewport_Y='-0.12190111404962964' Viewport_Width='1.7954974397472157' Viewport_Height='1.009730061253191' Highlight_Visible='false' Highlight_X='0' Highlight_Y='0' Highlight_Width='0' Highlight_Height='0' Highlight_Render_Style='DottedRectangleBlue' Highlight_Render_Attribs='' Media_AspRatio='0.74999997764825888'/>"
                                   }
                               }
                            ]
                        }
                    }
                }
            },
            "screenPlays": {
                "SCP1": {
                    "header": {},
                    "data": {
                        "ExperienceStreams": "<ExperienceStreams><ExperienceStream Id='ImageES-1' Begin='0' Dur='10' Layer='foreground' DominantMedia='visual' Volume='0.6'/><ExperienceStream Id='ZoomableMediaExperienceStream-1' Begin='10' Dur='51' Layer='foreground' DominantMedia='visual' Volume='0.6'/></ExperienceStreams>"
                    }
                }
            }
        }
    }
}]