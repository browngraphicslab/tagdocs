[{
    "header": {
        "startSegment": "defaultSegment",
        "guid": "1",
        "timestamp": "2011-08-05"
    },
    "data": {
        "narrative-info": "<narrative-info attr1='val1'><Author>Naren</Author><Description>First Test Rin.</Description><Title>Test Narrative for player testing</Title><Branding>Microsoft Research India</Branding><DurationInSeconds>39</DurationInSeconds></narrative-info>"
    },

    "segments": {
        "defaultSegment": {
            "header": {
                "estimatedDuration": 39,
                "defaultScreenPlay": "SCP1"
            },
            "data": {},
            "id": "defaultSegment",
            "owningNarrative": null,
            "resourceTable": {
                "R-1": { "defaultUriReference": "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/1_Grain%201080P_v3.mp4" },
                "R-2": { "defaultUriReference": "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/2_Grain%201080P_v3.mp4" },
                "R-3": { "defaultUriReference": "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/3_Grain%201080P_v3.mp4" },
                "R-4": { "defaultUriReference": "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/4_Grain%201080P_v3.mp4" },
                "R-5": { "defaultUriReference": "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/5_Grain%201080P_v3.mp4" },
                "R-6": { "defaultUriReference": "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/6_Grain%201080P_v3.mp4" },
                "R-7": { "defaultUriReference": "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/7_Grain%201080P_v3.mp4" },
                "R-8": { "defaultUriReference": "http://rin-red-1/rin/ClientBin/DemoNarratives/6aa09d19-cf2b-4c8e-8b57-7ea8701794f7/DigNarrative_072811v4_Media/DigNarrative_BGMusic.mp3" }

            },
            "experienceStreams": {
                "vid22": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.TestExperienceStream", "version": "0:0" }
                    },
                    "data": { "transition": "<info>", "default": "<info>Appear at 0-2secs</info>" },
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 0 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info></info>"}}],
                            "requiredResources": ["R-1"]
                        }
                    },
                    "requiredResourcesOnLoad": ["R-1"]
                },
                "vid23": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.TestExperienceStream", "version": "0:0" }
                    },
                    "data": { "transition": "<info/>", "default": "<info>Appear at 2-4secs</info>" },
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 0 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info></info>"}}],
                            "requiredResources": ["R-2"]
                        }
                    },
                    "requiredResourcesOnLoad": ["R-2"]
                },
                "vid24": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.TestExperienceStream", "version": "0:0" }
                    },
                    "data": { "transition": "<info/>", "default": "<info>Appear at 4-7secs</info>" },
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 0 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info></info>"}}],
                            "requiredResources": ["R-3"]
                        }
                    },
                    "requiredResourcesOnLoad": ["R-3"]
                },
                "vid25": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.TestExperienceStream", "version": "0:0" }
                    },
                    "data": { "transition": "<info/>", "default": "<info>Appear at 7-11secs</info>" },
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 0 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info></info>"}}],
                            "requiredResources": ["R-4"]
                        }
                    },
                    "requiredResourcesOnLoad": ["R-4"]
                },
                "vid26": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.TestExperienceStream", "version": "0:0" }
                    },
                    "data": { "transition": "<info/>", "default": "<info>Appear at 11-12secs</info>" },
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 0 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info></info>"}}],
                            "requiredResources": ["R-5"]
                        }
                    },
                    "requiredResourcesOnLoad": ["R-5"]
                },
                "vid27": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.TestExperienceStream", "version": "0:0" }
                    },
                    "data": { "transition": "<info/>", "default": "<info>Appear at 12-17secs</info>" },
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 0 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info></info>"}}],
                            "requiredResources": ["R-6"]
                        }
                    },
                    "requiredResourcesOnLoad": ["R-6"]
                },
                "vid28": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.TestExperienceStream", "version": "0:0" }
                    },
                    "data": { "transition": "<info/>", "default": "<info>Appear at 17-37secs</info>" },
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 0 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info>at 0</info>"} },
                                { "header": { "offset": 2, "holdDuration": 0.5 }, "data": { "default": "<info>at 2</info>"} },
                                { "header": { "offset": 4, "holdDuration": 0.5 }, "data": { "default": "<info>at 4</info>"} },
                                { "header": { "offset": 9, "holdDuration": 0.5 }, "data": { "default": "<info>at 9</info>"} },
                                { "header": { "offset": 13, "holdDuration": 0.5 }, "data": { "default": "<info>at 13</info>"}}],
                            "requiredResources": ["R-7"]
                        }
                    },
                    "requiredResourcesOnLoad": ["R-7"]
                },
                "aud7": {
                    "header": {
                        "defaultKeyframeSequence": "defaultSequence",
                        "provider": { "name": "MicrosoftResearch.Rin.AudioExperienceStream", "version": "0:0" }
                    },
                    "data": { "transition": "<info/>" },
                    "keyframeSequences": {
                        "defaultSequence": {
                            "header": { "duration": 0 },
                            "keyframes": [{ "header": { "offset": 0, "holdDuration": 0.5 }, "data": { "default": "<info></info>"}}],
                            "requiredResources": ["R-7"]
                        }
                    },
                    "requiredResourcesOnLoad": ["R-8"]
                }
            },
            "screenPlays": {
                "SCP1": {
                    "header": {},
                    "data": {
                        "experienceStreams": "<ExperienceStreams><ExperienceStream Id='vid22' Begin='0' Dur='2' Layer='foreground' DominantMedia='visual' Volume='1' /><ExperienceStream Id='vid23' Begin='2' Dur='2' Layer='foreground' DominantMedia='visual' Volume='1' /><ExperienceStream Id='vid24' Begin='4' Dur='3' Layer='foreground' DominantMedia='visual' Volume='1' /><ExperienceStream Id='vid25' Begin='7' Dur='4' Layer='foreground' DominantMedia='visual' Volume='1' /><ExperienceStream Id='vid26' Begin='11' Dur='1' Layer='foreground' DominantMedia='visual' Volume='1' /><ExperienceStream Id='vid27' Begin='12' Dur='5' Layer='foreground' DominantMedia='visual' Volume='1' /><ExperienceStream Id='vid28' Begin='17' Dur='20' Layer='foreground' DominantMedia='visual' Volume='1' /></ExperienceStreams>"
                    }
                }
            }
        }
    }
}]
