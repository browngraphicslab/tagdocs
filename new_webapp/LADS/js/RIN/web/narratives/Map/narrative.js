[{
    "header": {
        "guid": "b73292fd-8868-447f-8caf-1643d7e40e00",
        "timestamp": "0001-01-01T00:00:00",
        "startSegment": "defaultSegment"
    },
    "data": {
        "narrative-info": "<NarrativeData><Title>New Map Experience Stream Test</Title><Author>Eric Stollnitz</Author><Description>This is a test narrative for the map experience stream.</Description><AspectRatio>WideScreen</AspectRatio></NarrativeData>"
    },
    "segments": {
        "defaultSegment": {
            "header": {
                "estimatedDuration": 43.1,
                "defaultScreenPlay": "SCP1"
            },
            "resourceTable": {
                "content.items": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/MapItems.xml"
                },
                "thumbnail.msra": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/ThumbnailImages/AsiaLab.jpg"
                },
                "thumbnail.msri": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/ThumbnailImages/IndiaLab.jpg"
                },
                "thumbnail.msrc": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/ThumbnailImages/CambridgeLab.jpg"
                },
                "thumbnail.msrne": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/ThumbnailImages/NewEnglandLab.jpg"
                },
                "thumbnail.msrr": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/ThumbnailImages/RedmondLab.jpg"
                },
                "thumbnail.msrsv": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/ThumbnailImages/SiliconValleyLab.jpg"
                },
                "thumbnail.cmic": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/ThumbnailImages/CMIC.jpg"
                },
                "thumbnail.emic": {
                    "defaultUriReference": "$ROOT$/clientbin/DemoNarratives/MapDemo/ThumbnailImages/EMIC.jpg"
                },
                "R-4": {
                    "defaultUriReference": "Rin_Overlays.js"
                }
            },
            "experienceStreams": {
                "TwoDLayoutEngine-1": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": {
                            "name": "microsoftResearch.rin.twodlayoutengine",
                            "version": 0.0
                        }
                    },
                    "data": {
                        "ContentType": "<ContentType>TextOverlays</ContentType>"
                    },
                    "requiredResourcesOnLoad": [
						"R-4"
					],
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": {
                                "duration": 9.6
                            },
                            "keyframes": [
								{
								    "header": {
								        "offset": 0,
								        "holdDuration": 0.2
								    },
								    "data": {
								        "ea-selstate": {
								            "f4b39193-9935-460c-9c01-1eb91ed55087": {
								                "itemid": "f4b39193-9935-460c-9c01-1eb91ed55087",
								                "view": {
								                    "display": {
								                        "show": "true"
								                    }
								                },
								                "animation": {
								                    "offset": "0.5",
								                    "duration": "2.0"
								                }
								            }
								        }
								    }
								},
								{
								    "header": {
								        "offset": 9.2,
								        "holdDuration": 0.2
								    },
								    "data": {
								        "ea-selstate": {
								            "f4b39193-9935-460c-9c01-1eb91ed55087": {
								                "itemid": "f4b39193-9935-460c-9c01-1eb91ed55087",
								                "view": {
								                    "display": {
								                        "show": "false"
								                    }
								                },
								                "animation": {
								                    "offset": "0.5",
								                    "duration": "2.0"
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
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": {
                            "name": "microsoftResearch.rin.twodlayoutengine",
                            "version": 0.0
                        }
                    },
                    "data": {
                        "ContentType": "<ContentType>Video</ContentType>"
                    },
                    "requiredResourcesOnLoad": [
						"R-4"
					],
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": {
                                "duration": 15.0
                            },
                            "keyframes": [
								{
								    "header": {
								        "offset": 0,
								        "holdDuration": 0.2
								    },
								    "data": {
								        "ea-selstate": {
								            "fe281b96-cbc8-4734-8b6a-0a6b4b8c3a36": {
								                "itemid": "fe281b96-cbc8-4734-8b6a-0a6b4b8c3a36",
								                "view": {
								                    "display": {
								                        "show": "true"
								                    }
								                },
								                "animation": {
								                    "offset": "0.5",
								                    "duration": "2.0"
								                }
								            }
								        }
								    }
								},
								{
								    "header": {
								        "offset": 14,
								        "holdDuration": 0.2
								    },
								    "data": {
								        "ea-selstate": {
								            "fe281b96-cbc8-4734-8b6a-0a6b4b8c3a36": {
								                "itemid": "fe281b96-cbc8-4734-8b6a-0a6b4b8c3a36",
								                "view": {
								                    "display": {
								                        "show": "false"
								                    }
								                },
								                "animation": {
								                    "offset": "0.5",
								                    "duration": "2.0"
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
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": {
                            "name": "microsoftResearch.rin.twodlayoutengine",
                            "version": 0.0
                        }
                    },
                    "data": {
                        "ContentType": "<ContentType>TitleOverlays</ContentType>"
                    },
                    "requiredResourcesOnLoad": [
						"R-4"
					],
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": {
                                "duration": 9.6
                            },
                            "keyframes": [
								{
								    "header": {
								        "offset": 0,
								        "holdDuration": 0.2
								    },
								    "data": {
								        "ea-selstate": {
								            "40fa2b98-3dbf-4a98-90ea-5c5ecc6d729e": {
								                "itemid": "40fa2b98-3dbf-4a98-90ea-5c5ecc6d729e",
								                "view": {
								                    "display": {
								                        "show": "true"
								                    }
								                },
								                "animation": {
								                    "offset": "0.5",
								                    "duration": "2.0"
								                }
								            }
								        }
								    }
								},
								{
								    "header": {
								        "offset": 9.2,
								        "holdDuration": 0.19999999999999998
								    },
								    "data": {
								        "ea-selstate": {
								            "40fa2b98-3dbf-4a98-90ea-5c5ecc6d729e": {
								                "itemid": "40fa2b98-3dbf-4a98-90ea-5c5ecc6d729e",
								                "view": {
								                    "display": {
								                        "show": "false"
								                    }
								                },
								                "animation": {
								                    "offset": "0.5",
								                    "duration": "2.0"
								                }
								            }
								        }
								    }
								}
							]
                        }
                    }
                },
                "ES1": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": {
                            "name": "MicrosoftResearch.Rin.MapExperienceStream",
                            "version": "0.0"
                        }
                    },
                    "data": {
                        "default": "<Entities><RinItemCollection ResourceId='content.items' CollectionId='content.collection' GroupId='content.groups' ItemClickAction='ShowPopup'/><Pushpin Id='MSRA' Location='39.975883,116.330688' Label='Beijing, China' ItemId='msra'/><Pushpin Id='MSRI' Location='13.005457,77.580922' Label='Bangalore, India' ItemId='msri'/><Pushpin Id='MSRC' Location='52.2111612986822,0.0935609851276793' Label='Cambridge, UK' ItemId='msrc'/><Pushpin Id='MSRNE' Location='42.361011,-71.082876' Label='Cambridge, MA' ItemId='msrne'/><Pushpin Id='MSRR' Location='47.642015,-122.141694' Label='Redmond, WA' ItemId='msrr'/><Pushpin Id='MSRSV' Location='37.416041,-122.07569' Label='Mountain View, CA' ItemId='msrsv'/><Pushpin Id='CMIC' Location='29.966739,31.241233' Label='Cairo, Egypt' ItemId='cmic'/><Pushpin Id='EMIC' Location='50.791165,6.064469' Label='Aachen, Germany' ItemId='emic'/></Entities>"
                    },
                    "requiredResourcesOnLoad": [],
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": {
                                "duration": 43.1
                            },
                            "data": {},
                            "keyframes": [
                                {
                                    "header": {
                                        "offset": 0,
                                        "holdDuration": 3
                                    },
                                    "data": {
                                        "default": "<MapKeyframes><MapBoundsKeyframe North='73.536867782934081' West='-145.69894790480592' South='-43.812973651020741' East='138.36355209519408'/><MapStyleKeyframe Style='Road'/><MapEntityKeyframe EntityId='MSRC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRA' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRI' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRNE' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRR' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRSV' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='CMIC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='EMIC' IsVisible='true' IsHighlighted='false'/></MapKeyframes>",
                                        "TransitionTime": "<TransitionTime>0</TransitionTime>",
                                        "PauseDuration": "<PauseDuration>3</PauseDuration>",
                                        "keyframeThumbnail": "<Thumbnail>18682a15-5623-47f6-a914-9aedde667b5f.bmp</Thumbnail>"
                                    }
                                },
                                {
                                    "header": {
                                        "offset": 5.9,
                                        "holdDuration": 2
                                    },
                                    "data": {
                                        "default": "<MapKeyframes><MapBoundsKeyframe North='26.046455141283886' West='61.148368374363429' South='7.1984953426249945' East='96.304618374363429'/><MapStyleKeyframe Style='Road'/><MapEntityKeyframe EntityId='MSRC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRA' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRI' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRNE' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRR' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRSV' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='CMIC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='EMIC' IsVisible='true' IsHighlighted='false'/></MapKeyframes>",
                                        "TransitionTime": "<TransitionTime>2.9</TransitionTime>",
                                        "PauseDuration": "<PauseDuration>2</PauseDuration>",
                                        "keyframeThumbnail": "<Thumbnail>01d0b4a3-a627-4d19-95c2-7d626c7a3e45.bmp</Thumbnail>"
                                    }
                                },
                                {
                                    "header": {
                                        "offset": 11.4,
                                        "holdDuration": 3.3499999999999996
                                    },
                                    "data": {
                                        "default": "<MapKeyframes><MapBoundsKeyframe North='13.006709050686595' West='77.578700465584745' South='13.004356985383296' East='77.582992000008574'/><MapStyleKeyframe Style='Road'/><MapEntityKeyframe EntityId='MSRC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRA' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRI' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRNE' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRR' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRSV' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='CMIC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='EMIC' IsVisible='true' IsHighlighted='false'/></MapKeyframes>",
                                        "TransitionTime": "<TransitionTime>3.5</TransitionTime>",
                                        "PauseDuration": "<PauseDuration>3.3499999999999996</PauseDuration>",
                                        "keyframeThumbnail": "<Thumbnail>48cba57d-89a7-49d3-892f-0a10c728a9eb.bmp</Thumbnail>"
                                    }
                                },
                                {
                                    "header": {
                                        "offset": 17.65,
                                        "holdDuration": 1.5
                                    },
                                    "data": {
                                        "default": "<MapKeyframes><MapBoundsKeyframe North='52.812893104748113' West='-132.78178517538794' South='22.284273820330398' East='-62.469285175387959'/><MapStyleKeyframe Style='Road'/><MapEntityKeyframe EntityId='MSRC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRA' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRI' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRNE' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRR' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRSV' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='CMIC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='EMIC' IsVisible='true' IsHighlighted='false'/></MapKeyframes>",
                                        "TransitionTime": "<TransitionTime>2.9</TransitionTime>",
                                        "PauseDuration": "<PauseDuration>1.5</PauseDuration>",
                                        "keyframeThumbnail": "<Thumbnail>276786bb-7e9a-4270-a2c0-8ba45644d0b5.bmp</Thumbnail>"
                                    }
                                },
                                {
                                    "header": {
                                        "offset": 21.7,
                                        "holdDuration": 3
                                    },
                                    "data": {
                                        "default": "<MapKeyframes><MapBoundsKeyframe North='47.643695305385705' West='-122.14598298652678' South='47.640442408113159' East='-122.13739991767912'/><MapStyleKeyframe Style='Road'/><MapEntityKeyframe EntityId='MSRC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRA' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRI' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRNE' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRR' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRSV' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='CMIC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='EMIC' IsVisible='true' IsHighlighted='false'/></MapKeyframes>",
                                        "TransitionTime": "<TransitionTime>2.55</TransitionTime>",
                                        "PauseDuration": "<PauseDuration>3</PauseDuration>",
                                        "keyframeThumbnail": "<Thumbnail>eb2d4e9f-b9bc-4099-91c3-35d7d097c31f.bmp</Thumbnail>"
                                    }
                                },
                                {
                                    "header": {
                                        "offset": 29.7,
                                        "holdDuration": 3.9499999999999997
                                    },
                                    "data": {
                                        "default": "<MapKeyframes><MapBoundsKeyframe North='48.866344704238628' West='68.460941556344551' South='16.385768263532754' East='138.77344155634455'/><MapStyleKeyframe Style='Road'/><MapEntityKeyframe EntityId='MSRC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRA' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRI' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRNE' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRR' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRSV' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='CMIC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='EMIC' IsVisible='true' IsHighlighted='false'/></MapKeyframes>",
                                        "TransitionTime": "<TransitionTime>5</TransitionTime>",
                                        "PauseDuration": "<PauseDuration>3.9499999999999997</PauseDuration>",
                                        "keyframeThumbnail": "<Thumbnail>c4d95706-1681-4b53-9492-b864fbed1c68.bmp</Thumbnail>"
                                    }
                                },
                                {
                                    "header": {
                                        "offset": 38.65,
                                        "holdDuration": 4.45
                                    },
                                    "data": {
                                        "default": "<MapKeyframes><MapBoundsKeyframe North='39.97772635749655' West='116.32647581983457' South='39.9740266068419' East='116.33505888868223'/><MapStyleKeyframe Style='Road'/><MapEntityKeyframe EntityId='MSRC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRA' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRI' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRNE' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRR' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='MSRSV' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='CMIC' IsVisible='true' IsHighlighted='false'/><MapEntityKeyframe EntityId='EMIC' IsVisible='true' IsHighlighted='false'/></MapKeyframes>",
                                        "TransitionTime": "<TransitionTime>5</TransitionTime>",
                                        "PauseDuration": "<PauseDuration>4.45</PauseDuration>",
                                        "keyframeThumbnail": "<Thumbnail>73d2ad22-62c8-475f-9443-eb272f419b2f.bmp</Thumbnail>"
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
                        "ExperienceStreams": "<ExperienceStreams><ExperienceStream Id='VideoExperienceStream-2' Begin='23' Dur='15' Layer='overlay' DominantMedia='visual' Z-Index='0' Volume='0.6' /><ExperienceStream Id='TwoDLayoutEngine-1' Begin='1.64' Dur='9.6' Layer='overlay' DominantMedia='visual' Z-Index='0' Volume='0.6' /><ExperienceStream Id='TwoDLayoutEngine-2' Begin='12' Dur='9.6' Layer='overlay' DominantMedia='visual' Z-Index='0' Volume='0.6' /><ExperienceStream Id='ES1' Begin='0' Dur='43.1' Layer='foreground' DominantMedia='visual' Volume='0.6'/></ExperienceStreams>"
                    }
                }
            }
        }
    }
}]