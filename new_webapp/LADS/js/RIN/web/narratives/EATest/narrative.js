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
			"uriReference" : "http://zoom.it/h"
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
		},
		"ea1": {
		    "uriReference": "eaData.js"
		}
	},
	"experiences" : {
		
	    "ZoomableMediaExperienceStream-2" : {
	        "providerId" : "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
	        "data" : {
	            "transition" : {
	                "providerId" : "MicrosoftResearch.Rin.FadeInOutTransitionService",
	                "inDuration" : 2,
	                "outDuration" : 2
	            },
	            "EmbeddedArtifacts": {
	                "datasource": "ea1",
	                "artifactHost": "rin.embeddedArtifacts.ArtifactHost",
                    "hideDuringPlay":true,
	                "policies": ["base2DGroupPolicy","ambientAudioPolicy"]
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
	                "keyframes" : []
	            }
	        }
	    },
	    "ZoomableMediaExperienceStream-3": {
	        "providerId": "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
	        "data": {
	            "transition": {
	                "providerId": "MicrosoftResearch.Rin.FadeInOutTransitionService",
	                "inDuration": 2,
	                "outDuration": 2
	            },
	            "viewportConstrainRatio": 0.2,
	            "viewportClamping": "all"
	        },
	        "resourceReferences": [
				{
				    "resourceId": "R-1",
				    "required": true
				}
	        ],
	        "experienceStreams": {
	            "defaultStream": {
	                "duration": 12.899999999999999,
	                "data": {
	                    "contentType": "SingleDeepZoomImage"
	                },
	                "keyframes": []
	            }
	        }
	    }
	},
	"screenplays" : {
		"SCP1" : {
			"data" : {
				"experienceStreamReferences" : [
					
					{
						"experienceId" : "ZoomableMediaExperienceStream-2",
						"experienceStreamId" : "defaultStream",
						"begin" : 0,
						"duration" : 12.899999999999999,
						"layer" : "foreground",
						"dominantMedia" : "visual",
						"volume" : 1
					}
				]
			}
		}
	}
}]