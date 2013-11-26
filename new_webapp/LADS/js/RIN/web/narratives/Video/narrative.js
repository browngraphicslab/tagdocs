[{
	"version" : 1.0,
	"defaultScreenplayId": "SCP1",
	"screenplayProviderId": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
	"data" : {
		"narrativeData" : {
			"guid" : "6aa09d19-cf2b-4c8e-8b57-7ea8701794f7",
			"timestamp" : "2011-07-29T00:48:12.8847651Z",
			"title" : "DigNarrative_072811v4",
			"author" : "jergru",
			"aspectRatio" : "WideScreen",
			"estimatedDuration" : 328.464,
			"description" : "Description",
			"branding" : null
		}
	},
	"providers" : {
		"MicrosoftResearch.Rin.VideoExperienceStream" : {
			"name" : "MicrosoftResearch.Rin.VideoExperienceStream",
			"version" : 0.0
		},
		"MicrosoftResearch.Rin.FadeInOutTransitionService" : {
		    "name" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
		    "version" : 0.0
		},
		"MicrosoftResearch.Rin.MapExperienceStream" : {
			"name" : "MicrosoftResearch.Rin.MapExperienceStream",
			"version" : 0.0
		},
		"MicrosoftResearch.Rin.ZoomableMediaExperienceStream" : {
			"name" : "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
			"version" : 0.0
		},
		"MicrosoftResearch.Rin.PhotosynthES" : {
			"name" : "MicrosoftResearch.Rin.PhotosynthES",
			"version" : 0.0
		},
		"MicrosoftResearch.Rin.AudioExperienceStream" : {
			"name" : "MicrosoftResearch.Rin.AudioExperienceStream",
			"version" : 0.0
		},
		"MicrosoftResearch.Rin.DefaultScreenPlayInterpreter": {
		    "name": "MicrosoftResearch.Rin.DefaultScreenPlayInterpreter",
		    "version": 0.0
		}
	},
	"resources" : {
		"R-1" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/dzc_output.xml"
		},
		"R-7" : {
			"uriReference" : "http://photosynth.net/view.aspx?cid=5007e5dd-898c-4daa-90f7-4c228273a51e"
		},
		"R-9" : {
			"uriReference" : "http://photosynth.net/view.aspx?cid=9ecb2489-2684-425f-a4da-6e1571fab29a"
		},
		"R-17" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/dzc_output-wsu.xml"
		},
		"R-26" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/1_Grain%201080P_v3.mp4"
		},
		"R-27" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/2_Grain%201080P_v3.mp4"
		},
		"R-28" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/3_Grain%201080P_v3.mp4"
		},
		"R-29" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/4_Grain%201080P_v3.mp4"
		},
		"R-30" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/5_Grain%201080P_v3.mp4"
		},
		"R-31" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/6_Grain%201080P_v3.mp4"
		},
		"R-32" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/7_Grain%201080P_v3.mp4"
		},
		"R-33" : {
			"uriReference" : "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/DigNarrative_BGMusic.mp3"
		}
	},
	"experiences" : {
		"VideoExperienceStream-22" : {
			"providerId" : "MicrosoftResearch.Rin.VideoExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				},
				"markers" : {
					"beginAt" : 0,
					"endAt" : 32.615949199999996
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-26",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 32.616
				}
			}
		},
		"MapExperienceStream-1" : {
			"providerId" : "MicrosoftResearch.Rin.MapExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				}
			},
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 11.2,
					"data" : {
						"contentType" : "Map"
					},
					"keyframes" : [
						{
							"offset" : 0,
							"holdDuration" : 0.5,
							"data" : {
								"default" : "<MapKeyframes><MapBoundsKeyframe North=\"47.680274964232453\" West=\"-122.2123269861589\" South=\"47.676937659456669\" East=\"-122.20351861175399\" /><MapStyleKeyframe Style=\"AerialWithLabels\" /><MapEntityKeyframe EntityId=\"Kirkland, WA\" IsVisible=\"true\" IsHighlighted=\"false\" /></MapKeyframes>",
								"TransitionTime" : "<TransitionTime>0</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0.5</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>4a979432-93ee-418d-a7b0-2dc1b3169737_keyframe_ac732c6f-86f2-46bd-b4f2-bd18d4c4eb67.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : -122.20792279895645,
											"y" : 47.678606311844561
										},
										"span" : {
											"x" : 0.0088083744049072266,
											"y" : 0.0033373047757834229
										}
									}
								},
								"map" : {
									"style" : "AerialWithLabels"
								}
							}
						},
						{
							"offset" : 11.2,
							"holdDuration" : 0,
							"data" : {
								"default" : "<MapKeyframes><MapBoundsKeyframe North=\"47.504210869314292\" West=\"-117.62203350663185\" South=\"47.477416478892096\" East=\"-117.55156651139259\" /><MapStyleKeyframe Style=\"AerialWithLabels\" /><MapEntityKeyframe EntityId=\"Kirkland, WA\" IsVisible=\"true\" IsHighlighted=\"false\" /><MapEntityKeyframe EntityId=\"Pasco, WA\" IsVisible=\"true\" IsHighlighted=\"false\" /><MapEntityKeyframe EntityId=\"Eastern Washington University, WA\" IsVisible=\"true\" IsHighlighted=\"false\" /></MapKeyframes>",
								"TransitionTime" : "<TransitionTime>10.7</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>4a979432-93ee-418d-a7b0-2dc1b3169737_keyframe_f35e8ccd-6526-43b5-9d09-717df249934d.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : -117.58680000901222,
											"y" : 47.490813674103194
										},
										"span" : {
											"x" : 0.070466995239257813,
											"y" : 0.026794390422196557
										}
									}
								},
								"map" : {
									"style" : "AerialWithLabels"
								}
							}
						}
					]
				}
			}
		},
		"VideoExperienceStream-23" : {
			"providerId" : "MicrosoftResearch.Rin.VideoExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				},
				"markers" : {
					"beginAt" : 0,
					"endAt" : 16.8918918
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-27",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 16.892
				}
			}
		},
		"ZoomableMediaExperienceStream-2" : {
			"providerId" : "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-1",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 12.899999999999999,
					"data" : {
						"contentType" : "SingleDeepZoomImage"
					},
					"keyframes" : [
						{
							"offset" : 0,
							"holdDuration" : 0.5,
							"data" : {
								"default" : "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-1\" Viewport_X=\"0.5923811970600481\" Viewport_Y=\"0.29659771339558905\" Viewport_Width=\"0.00025961484292674151\" Viewport_Height=\"0.00014609263999044406\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.53243931310913006\" />",
								"TransitionTime" : "<TransitionTime>0</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0.5</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>11a6ab9c-7cce-4c45-b4c4-bb45b6c44cdd_keyframe_cdd2ecd5-6e5f-45a7-b549-46d6bc835636.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : 0.5923811970600481,
											"y" : 0.29659771339558905
										},
										"span" : {
											"x" : 0.00025961484292674151,
											"y" : 0.00014609263999044406
										}
									}
								}
							}
						},
						{
							"offset" : 9.25,
							"holdDuration" : 0,
							"data" : {
								"default" : "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-1\" Viewport_X=\"0.39608882833680603\" Viewport_Y=\"0.18008906525097232\" Viewport_Width=\"0.40629150524062591\" Viewport_Height=\"0.22863176056171641\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.53243931310913006\" />",
								"TransitionTime" : "<TransitionTime>8.75</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>11a6ab9c-7cce-4c45-b4c4-bb45b6c44cdd_keyframe_08da70cf-827a-42c3-a5de-d0e5deead3ed.bmp</Thumbnail>"
							},
							"state": {
							    "viewport": {
							        "region": {
							            "center": {
							                "x": 0.39608882833680603,
							                "y": 0.18008906525097232
							            },
							            "span": {
							                "x": 0.40629150524062591,
							                "y": 0.22863176056171641
							            }
							        }
							    }
							}
						},
						{
							"offset" : 12.9,
							"holdDuration" : 0,
							"data" : {
								"default" : "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-1\" Viewport_X=\"0.010699581373896733\" Viewport_Y=\"0.1466652050468033\" Viewport_Width=\"0.32768\" Viewport_Height=\"0.18439483556638245\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.53243931310913006\" />",
								"TransitionTime" : "<TransitionTime>3.65</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>11a6ab9c-7cce-4c45-b4c4-bb45b6c44cdd_keyframe_e315fb66-dfa5-4f34-b484-fcba3c0ca08e.bmp</Thumbnail>"
							},
							"state": {
							    "viewport": {
							        "region": {
							            "center": {
							                "x": 0.010699581373896733,
							                "y": 0.1466652050468033
							            },
							            "span": {
							                "x": 0.32768,
							                "y": 0.18439483556638245
							            }
							        }
							    }
							}
						}
					]
				}
			}
		},
		"VideoExperienceStream-24" : {
			"providerId" : "MicrosoftResearch.Rin.VideoExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				},
				"markers" : {
					"beginAt" : 0,
					"endAt" : 16.975308599999998
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-28",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 16.974999999999998
				}
			}
		},
		"MapExperienceStream-2" : {
			"providerId" : "MicrosoftResearch.Rin.MapExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				}
			},
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 13.5,
					"data" : {
						"contentType" : "Map"
					},
					"keyframes" : [
						{
							"offset" : 0,
							"holdDuration" : 0.5,
							"data" : {
								"default" : "<MapKeyframes><MapBoundsKeyframe North=\"47.492870390294023\" West=\"-117.5903161988573\" South=\"47.489521115756212\" East=\"-117.58150782445239\" /><MapStyleKeyframe Style=\"AerialWithLabels\" /><MapEntityKeyframe EntityId=\"Eastern Washington University, WA\" IsVisible=\"true\" IsHighlighted=\"false\" /></MapKeyframes>",
								"TransitionTime" : "<TransitionTime>0</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0.5</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>4a979432-93ee-418d-a7b0-2dc1b3169737_keyframe_b72423c6-f8e6-4ff8-a167-b0bf6b80b44b.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : -117.58591201165484,
											"y" : 47.491195753025117
										},
										"span" : {
											"x" : 0.0088083744049072266,
											"y" : 0.0033492745378111977
										}
									}
								},
								"map" : {
									"style" : "AerialWithLabels"
								}
							}
						},
						{
							"offset" : 13.5,
							"holdDuration" : 0,
							"data" : {
								"default" : "<MapKeyframes><MapBoundsKeyframe North=\"47.006249613375132\" West=\"-120.54391510622142\" South=\"47.002869425417\" East=\"-120.53510673181651\" /><MapStyleKeyframe Style=\"AerialWithLabels\" /><MapEntityKeyframe EntityId=\"Central Washington University, WA\" IsVisible=\"true\" IsHighlighted=\"false\" /></MapKeyframes>",
								"TransitionTime" : "<TransitionTime>13</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>4a979432-93ee-418d-a7b0-2dc1b3169737_keyframe_19d84fc5-4439-4306-83eb-7037c18607f1.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : -120.53951091901897,
											"y" : 47.004559519396068
										},
										"span" : {
											"x" : 0.0088083744049072266,
											"y" : 0.0033801879581289995
										}
									}
								},
								"map" : {
									"style" : "AerialWithLabels"
								}
							}
						}
					]
				}
			}
		},
		"VideoExperienceStream-25" : {
			"providerId" : "MicrosoftResearch.Rin.VideoExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				},
				"markers" : {
					"beginAt" : 0,
					"endAt" : 27.6109442
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-29",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 27.610999999999997
				}
			}
		},
		"PhotosynthES-1" : {
			"providerId" : "MicrosoftResearch.Rin.PhotosynthES",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-7",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 10.15,
					"data" : {
						"contentType" : "Photosynth"
					},
					"keyframes" : [
						{
							"offset" : 0,
							"holdDuration" : 0.5,
							"data" : {
								"default" : "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-1.01317208669706</ThetaX><ThetaY>-0.851574479709634</ThetaY><ThetaZ>-1.20591867288462</ThetaZ><Zoom>960</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector></PSKeyframe>",
								"TransitionTime" : "<TransitionTime>0</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0.5</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>01903ada-93d4-4412-a71f-33d418758acf_keyframe_f21bce7e-1b73-4c99-a2c4-2b3f6714b587.bmp</Thumbnail>"
							}
						},
						{
							"offset" : 10.15,
							"holdDuration" : 0,
							"data" : {
								"default" : "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-0.753014863363821</ThetaX><ThetaY>-1.43581613385532</ThetaY><ThetaZ>-1.77356609261266</ThetaZ><Zoom>640</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector></PSKeyframe>",
								"TransitionTime" : "<TransitionTime>9.65</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>01903ada-93d4-4412-a71f-33d418758acf_keyframe_807a7405-c898-401c-9393-6ee932a3e720.bmp</Thumbnail>"
							}
						}
					]
				}
			}
		},
		"VideoExperienceStream-26" : {
			"providerId" : "MicrosoftResearch.Rin.VideoExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				},
				"markers" : {
					"beginAt" : 0,
					"endAt" : 24.0657323
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-30",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 24.066
				}
			}
		},
		"MapExperienceStream-3" : {
			"providerId" : "MicrosoftResearch.Rin.MapExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				}
			},
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 11.15,
					"data" : {
						"contentType" : "Map"
					},
					"keyframes" : [
						{
							"offset" : 0,
							"holdDuration" : 0.5,
							"data" : {
								"default" : "<MapKeyframes><MapBoundsKeyframe North=\"47.008673201159809\" West=\"-120.54993479204589\" South=\"47.001912918083235\" East=\"-120.53231804323607\" /><MapStyleKeyframe Style=\"AerialWithLabels\" /><MapEntityKeyframe EntityId=\"Central Washington University, WA\" IsVisible=\"true\" IsHighlighted=\"false\" /></MapKeyframes>",
								"TransitionTime" : "<TransitionTime>0</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0.5</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>93999c8d-e354-4de4-8957-cc233b32e74c_keyframe_e23cbdc5-ea05-4f04-9b4d-b93c68027151.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : -120.54112641764098,
											"y" : 47.005293059621522
										},
										"span" : {
											"x" : 0.017616748809814453,
											"y" : 0.0067602830765736144
										}
									}
								},
								"map" : {
									"style" : "AerialWithLabels"
								}
							}
						},
						{
							"offset" : 11.15,
							"holdDuration" : 0,
							"data" : {
								"default" : "<MapKeyframes><MapBoundsKeyframe North=\"46.732693048831386\" West=\"-117.16353471247081\" South=\"46.730994345992663\" East=\"-117.15913052526835\" /><MapStyleKeyframe Style=\"AerialWithLabels\" /></MapKeyframes>",
								"TransitionTime" : "<TransitionTime>10.65</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>keyframe_b16e388d-2fde-40b8-9128-4f907c04645b.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : -117.16133261886958,
											"y" : 46.731843697412025
										},
										"span" : {
											"x" : 0.0044041872024536133,
											"y" : 0.0016987028387234204
										}
									}
								},
								"map" : {
									"style" : "AerialWithLabels"
								}
							}
						}
					]
				}
			}
		},
		"VideoExperienceStream-27" : {
			"providerId" : "MicrosoftResearch.Rin.VideoExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				},
				"markers" : {
					"beginAt" : 0,
					"endAt" : 7.5909242
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-31",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 7.5909999999999993
				}
			}
		},
		"PhotosynthES-2" : {
			"providerId" : "MicrosoftResearch.Rin.PhotosynthES",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-9",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 12.049999999999999,
					"data" : {
						"contentType" : "Photosynth"
					},
					"keyframes" : [
						{
							"offset" : 0,
							"holdDuration" : 0.5,
							"data" : {
								"default" : "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-1.47622898922065</ThetaX><ThetaY>-1.27387849295236</ThetaY><ThetaZ>-0.979665379120639</ThetaZ><Zoom>1056</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector></PSKeyframe>",
								"TransitionTime" : "<TransitionTime>0</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0.5</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>9a77ef12-f82c-4d30-952d-de30691ed830_keyframe_ec359206-4bdf-43a6-97a4-f2a4f2466a56.bmp</Thumbnail>"
							}
						},
						{
							"offset" : 7.05,
							"holdDuration" : 0,
							"data" : {
								"default" : "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-1.38575060398161</ThetaX><ThetaY>-0.557789560162752</ThetaY><ThetaZ>-0.62127253455627</ThetaZ><Zoom>640</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector></PSKeyframe>",
								"TransitionTime" : "<TransitionTime>6.55</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>9a77ef12-f82c-4d30-952d-de30691ed830_keyframe_0ea6150d-759f-4712-9c86-2bed99279265.bmp</Thumbnail>"
							}
						},
						{
							"offset" : 12.05,
							"holdDuration" : 0,
							"data" : {
								"default" : "<PSKeyframe><X>0</X><Y>0</Y><Z>0</Z><ThetaX>-1.17380247565897</ThetaX><ThetaY>-0.491195076610742</ThetaY><ThetaZ>-0.683036918812934</ThetaZ><Zoom>1056</Zoom><PanX>0</PanX><PanY>0</PanY><View>Image</View><Projector>0:0:0</Projector></PSKeyframe>",
								"TransitionTime" : "<TransitionTime>5</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>9a77ef12-f82c-4d30-952d-de30691ed830_keyframe_a27edd78-a041-4397-8bee-b14b02c201d0.bmp</Thumbnail>"
							}
						}
					]
				}
			}
		},
		"ZoomableMediaExperienceStream-3" : {
			"providerId" : "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-17",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 14.799999999999999,
					"data" : {
						"contentType" : "SingleDeepZoomImage"
					},
					"keyframes" : [
						{
							"offset" : 0,
							"holdDuration" : 0.5,
							"data" : {
								"default" : "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-17\" Viewport_X=\"0.2059674376509722\" Viewport_Y=\"0.3061605625389604\" Viewport_Width=\"6.9940073211584552E-05\" Viewport_Height=\"3.9357264097140149E-05\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.57830302012511348\" />",
								"TransitionTime" : "<TransitionTime>0</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0.5</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>8175d852-2cf9-47e9-a4ea-cb55b8280cef_keyframe_ec146c6b-825c-4627-a059-90c1ad11886c.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : 0.2059674376509722,
											"y" : 0.3061605625389604
										},
										"span" : {
											"x" : "6.9940073211584552E-05",
											"y" : "3.9357264097140149E-05"
										}
									}
								}
							}
						},
						{
							"offset" : 10.7,
							"holdDuration" : 0,
							"data" : {
								"default" : "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-17\" Viewport_X=\"0.038269497088495363\" Viewport_Y=\"0.069852080565769664\" Viewport_Width=\"0.82214160956325755\" Viewport_Height=\"0.46264241610015228\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.57830302012511348\" />",
								"TransitionTime" : "<TransitionTime>10.2</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>8175d852-2cf9-47e9-a4ea-cb55b8280cef_keyframe_b9d3e2f3-e3fc-4241-ac13-4176a2f0b914.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : 0.038269497088495363,
											"y" : 0.069852080565769664
										},
										"span" : {
											"x" : 0.82214160956325755,
											"y" : 0.46264241610015228
										}
									}
								}
							}
						},
						{
							"offset" : 14.799999999999999,
							"holdDuration" : 0,
							"data" : {
								"default" : "<ZoomableMediaKeyframe Media_Type=\"SingleDeepZoomImage\" Media_Source=\"R-17\" Viewport_X=\"0.10437828754170628\" Viewport_Y=\"0.24024323931537975\" Viewport_Width=\"0.26642659156798426\" Viewport_Height=\"0.14992580426846375\" Highlight_Visible=\"false\" Highlight_X=\"0\" Highlight_Y=\"0\" Highlight_Width=\"0\" Highlight_Height=\"0\" Highlight_Render_Style=\"NoHighlight\" Highlight_Render_Attribs=\"\" Media_AspRatio=\"0.57830302012511348\" />",
								"TransitionTime" : "<TransitionTime>4.1</TransitionTime>",
								"PauseDuration" : "<PauseDuration>0</PauseDuration>",
								"keyframeThumbnail" : "<Thumbnail>8175d852-2cf9-47e9-a4ea-cb55b8280cef_keyframe_20d77987-a4c4-481f-9cb7-b63d39da823a.bmp</Thumbnail>"
							},
							"state" : {
								"viewport" : {
									"region" : {
										"center" : {
											"x" : 0.10437828754170628,
											"y" : 0.24024323931537975
										},
										"span" : {
											"x" : 0.26642659156798426,
											"y" : 0.14992580426846375
										}
									}
								}
							}
						}
					]
				}
			}
		},
		"VideoExperienceStream-28" : {
			"providerId" : "MicrosoftResearch.Rin.VideoExperienceStream",
			"data" : {
				"transition" : {
					"providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
					"inDuration" : 2,
					"outDuration" : 2
				},
				"markers" : {
					"beginAt" : 0,
					"endAt" : 24.3993993
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-32",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 24.398999999999997
				}
			}
		},
		"AudioExperienceStream-7" : {
			"providerId" : "MicrosoftResearch.Rin.AudioExperienceStream",
			"data" : {
				"markers" : {
					"beginAt" : 0,
					"endAt" : 328.464
				}
			},
			"resourceReferences" : [
				{
					"resourceId" : "R-33",
					"required" : true
				}
			],
			"experienceStreams" : {
				"defaultStream" : {
					"duration" : 328.464
				}
			}
		}
	},
	"screenplays" : {
		"SCP1" : {
			"data" : {
				"experienceStreamReferences" : [
					{
						"experienceId" : "VideoExperienceStream-22",
						"experienceStreamId" : "defaultStream",
						"begin" : 0,
						"duration" : 32.616,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "MapExperienceStream-1",
						"experienceStreamId" : "defaultStream",
						"begin" : 32.616,
						"duration" : 11.2,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "VideoExperienceStream-23",
						"experienceStreamId" : "defaultStream",
						"begin" : 43.816,
						"duration" : 16.892,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "ZoomableMediaExperienceStream-2",
						"experienceStreamId" : "defaultStream",
						"begin" : 60.708,
						"duration" : 12.899999999999999,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "VideoExperienceStream-24",
						"experienceStreamId" : "defaultStream",
						"begin" : 73.608,
						"duration" : 16.974999999999998,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "MapExperienceStream-2",
						"experienceStreamId" : "defaultStream",
						"begin" : 90.583,
						"duration" : 13.5,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "VideoExperienceStream-25",
						"experienceStreamId" : "defaultStream",
						"begin" : 104.083,
						"duration" : 27.610999999999997,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "PhotosynthES-1",
						"experienceStreamId" : "defaultStream",
						"begin" : 131.694,
						"duration" : 10.15,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "VideoExperienceStream-26",
						"experienceStreamId" : "defaultStream",
						"begin" : 141.844,
						"duration" : 24.066,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "MapExperienceStream-3",
						"experienceStreamId" : "defaultStream",
						"begin" : 165.91,
						"duration" : 11.15,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "VideoExperienceStream-27",
						"experienceStreamId" : "defaultStream",
						"begin" : 177.06,
						"duration" : 7.5909999999999993,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "PhotosynthES-2",
						"experienceStreamId" : "defaultStream",
						"begin" : 184.651,
						"duration" : 12.049999999999999,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "ZoomableMediaExperienceStream-3",
						"experienceStreamId" : "defaultStream",
						"begin" : 196.70100000000002,
						"duration" : 14.799999999999999,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "VideoExperienceStream-28",
						"experienceStreamId" : "defaultStream",
						"begin" : 211.50100000000003,
						"duration" : 24.398999999999997,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					},
					{
						"experienceId" : "AudioExperienceStream-7",
						"experienceStreamId" : "defaultStream",
						"begin" : 0,
						"duration" : 328.464,
						"layer" : "background",
						"dominantMedia" : "audio",
						"volume" : 1
					}
				]
			}
		}
	}
}]