/*global module:true, require: true */

module.exports = function(grunt) {

    // load local grunt tasks and helpers
    grunt.loadTasks('tools/grunt/');

    // banners for JS and HTML
    var bannerTemplate = '<%= pkg.name %> | <%= pkg.homepage %> | <%= grunt.template.today("yyyy-mm-dd") %>',
        jsBanner = '/*! ' + bannerTemplate + ' */\n',
        htmlBanner = '<!-- ' + bannerTemplate + ' -->\n';

    // generate a timestamped rin directory name for cdn deployment
    var rinTime = grunt.template.today('yyyy-mm-dd-HH-MM');

    // project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                banner: jsBanner
            },
            core: {
                src: [

                    // contracts
                    'src/contracts/IExperienceStream.js',
                    'src/contracts/IOrchestrator.js',
                    'src/contracts/DiscreteKeyframeESBase.js',
                    'src/contracts/InterpolatedKeyframeESBase.js',

                    // storyboard
                    'src/storyboard/BasicInterpolators.js',
                    'src/storyboard/nonLinearStoryboard.js',
                    'src/storyboard/trajectory.js',
                    'src/storyboard/ViewportInterpolator2D.js',

                    // embedded artifacts
                    'src/embededArtifacts/diagnostics.js',
                    'src/embededArtifacts/defaultBase2DGroupPolicy.js',
                    'src/embededArtifacts/defaultZoom2DItemPolicy.js',
                    'src/embededArtifacts/ambientAudioPolicy.js',
                    'src/embededArtifacts/layoutEngine.js',
                    'src/embededArtifacts/InteractionBehaviorService.js',
                    'src/embededArtifacts/artifactHost.js',
                    'src/embededArtifacts/embeddedArtifactsController.js',

                    // core functionality
                    'src/core/Common.js',
                    'src/core/ESItem.js',
                    'src/core/ESItemsManager.js',
                    'src/core/ESTimer.js',
                    'src/core/EventLogger.js',
                    'src/core/Orchestrator.js',
                    'src/core/OrchestratorProxy.js',
                    'src/core/Player.js',
                    'src/core/PlayerConfiguration.js',
                    'src/core/PlayerControl.js',
                    'src/core/ResourcesResolver.js',
                    'src/core/RinDataProxy.js',
                    'src/core/ScreenPlayInterpreter.js',
                    'src/core/StageAreaManager.js',
                    'src/core/TaskTimer.js',
                    'src/core/TransitionService.js',
                    'src/experiences/BufferingES.js',
                    'src/experiences/ESTimerES.js',
                    'src/experiences/PlaceholderES.js',
                    'src/experiences/PreloaderES.js',
                    'src/experiences/PlayerControllerES.js',

                    // default controller
                    'src/player/DefaultController.js',
                    'src/player/ControllerViewModel.js',

                    // xml and xrin helpers
                    'src/utilities/XmlHelper.js',
                    'src/utilities/SelfTest.js',
                    'src/utilities/RinDebugger.js'
                ],
                dest: 'web/lib/rin-core-1.0.js'
            },
            experiences: {
                src: [
                    'src/experiences/Namespace.js',

                    // experiences
                    'src/experiences/ImageES.js',
                    'src/experiences/DeepZoomES.js',
                    'src/experiences/VideoES.js',
                    'src/experiences/AudioES.js',
                    'src/experiences/MapES.js',
                    'src/experiences/PhotosynthES.js',
                    'src/experiences/PanoramicES.js',
                    'src/experiences/ContentBrowserES.js',
                    'src/experiences/OverlayES.js',
                    'src/experiences/InkES.js',
                    'src/experiences/WebViewES.js',
                    'src/experiences/RinES.js',
                    'src/experiences/LiteDiscreteES.js',
                    'src/experiences/LiteInterpolatedES.js',
                    'src/experiences/ImageCompareES.js',

                    // controls
                    'src/controls/PopupControl.js',

                    // interaction controls
                    'src/InteractionControls/CoreInteractionControlFactories.js',

                    // behaviors
                    'src/behaviors/PopupBehavior.js',

                    // embedded artifacts
                    'src/embededArtifacts/basicBehaviors.js',
                    'src/embededArtifacts/basicArtifacts.js',

                    // rin helper classes
                    'src/utilities/Gestures.js',
                    'src/utilities/JSONLoader.js',
                    'src/utilities/ESData.js'
                ],
                dest: 'web/lib/rin-experiences-1.0.js'
            },
            panoviewer: {
                options: {
                    // wrap output in an anonymous function
                    banner: jsBanner + '(function(){\n',
                    footer: '}());'
                },
                src: [
                    'panoviewer/src/renderer/Quirks.js',
                    'panoviewer/src/renderer/RendererCheckCSS3D.js',
                    'panoviewer/src/renderer/RendererCheckWebGL.js',
                    'panoviewer/src/math/*.js',
                    'panoviewer/src/common/Config.js',
                    'panoviewer/src/common/Utils.js',
                    'panoviewer/src/renderer/Renderer.js',
                    'panoviewer/src/renderer/RendererUtils.js',
                    'panoviewer/src/common/MemoryCache.js',
                    'panoviewer/src/common/DomainThrottle.js',
                    'panoviewer/src/common/PriorityNetworkDownloader.js',
                    'panoviewer/src/common/FloodFill.js',
                    'panoviewer/src/libs/CSSMatrix.js',
                    'panoviewer/src/renderer/RendererCSS3D.js',
                    'panoviewer/src/renderer/RendererWebGL.js',
                    'panoviewer/src/graphics/Viewport.js',
                    'panoviewer/src/graphics/PerspectiveCamera.js',
                    'panoviewer/src/common/ClassicSpring.js',
                    'panoviewer/src/common/SimpleSpline.js',
                    'panoviewer/src/viewer/RMLStore.js',
                    'panoviewer/src/common/BallisticPath.js',
                    'panoviewer/src/viewer/RotationalFixedPositionCameraController.js',
                    'panoviewer/src/viewer/TiledImagePyramid.js',
                    'panoviewer/src/viewer/TiledImagePyramidCoverageMap.js',
                    'panoviewer/src/viewer/TiledImagePyramidCuller.js',
                    'panoviewer/src/viewer/PhotosynthRml.js',
                    'panoviewer/src/viewer/Panorama.js',
                    'panoviewer/src/viewer/AttributionControlNoJQuery.js',
                    'panoviewer/src/viewer/GestureHelper.js',
                    'panoviewer/src/viewer/PanoTouchHelper.js',
                    'panoviewer/src/viewer/RWWViewer.js'
                ],
                dest: 'web/lib/pano-viewer.js'
            },
            rinStyles: {
                src: ['web/systemResources/themeResources/**/*.part.css'],
                dest: 'web/systemResources/themeResources/rin.css'
            },
            everestLibs: {
                src: [
                    'everest/libs/underscore-1.4.4.min.js',
                    'everest/libs/backbone.dev.js',
                    'everest/libs/transit-0.9.9.js',
                    'everest/libs/pxloader-all.min.js',
                    'everest/libs/modernizr-custom.js',
                    'everest/libs/detectizr.js',
                    'everest/libs/jquery.pxtouch.min.js',
                    'everest/libs/jquery.base64.js',
                    'everest/libs/knob.js'
                ],
                dest: 'everest/web/scripts/everest-libs.js'
            },
            everestApp: {
                src: [
                    'everest/web/scripts/templates.js',
                    'everest/js/namespace.js',
                    'everest/js/views/*.js',
                    'everest/js/data/*.js',
                    'everest/js/start.js'
                ],
                dest: 'everest/web/scripts/app.js'
            },
            everestRinLibs: {
                src: [
                    'everest/libs/modernizr-custom.js',
                    'everest/libs/detectizr-1.4.3.min.js',
                    'web/lib/seadragon-0.8.9-rin.js',
                    'web/lib/knockout-2.2.1.js',
                    'web/lib/jquery.easing.1.3.js',
                    'web/lib/jquery.pxtouch.min.js',
                    'everest/libs/purl.js',
                    'everest/libs/rinLoad.js'
                ],
                dest: 'everest/web/scripts/rin-libs.js'
            },
            everestRinIframe: {
                src: [
                    'everest/js/iframe/namespace.js',
                    'everest/js/data/AudioState.js',
                    'everest/js/iframe/playerControl.js',
                    'everest/js/iframe/GestureStroke.js',
                    'everest/js/iframe/PanoCircleZoom.js',
                    'everest/js/iframe/panoUrls.js',
                    'everest/js/iframe/rinMain.js'
                ],
                dest: 'everest/web/scripts/rin-iframe.js'
            },
            everestRinStyles: {
                src: ['everest/web/rin/systemResources/themeResources/**/*.part.css'],
                dest: 'everest/web/rin/systemResources/themeResources/rin.css'
            }
        },
        concatTmpl: {
            options: {
                banner: htmlBanner
            },
            rin: {
                src: ['web/systemResources/themeResources/**/*.tmpl.htm'],
                dest: 'web/systemResources/themeResources/rinTemplates.htm'
            },
            everestRin: {
                src: ['everest/web/rin/systemResources/themeResources/**/*.tmpl.htm'],
                dest: 'everest/web/rin/systemResources/themeResources/rinTemplates.htm'
            }
        },
        jshint: {
            // js hint
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    rin: true,
                    everest: true,
                    Backbone: true,
                    _: true,
                    PxLoader: true,
                    PxLoaderVideo: true,
                    Video: true,
                    THREE: true,
                    Modernizr: true
                }
            },
            all: [
                'Gruntfile.js',

                'everest/js/**/*.js',
                'everest/web/rin/narratives/intro/narrative.js',
                'everest/web/rin/systemResources/themeResources/popup/popup.js',

                // opting in for new or revised files
                'panoviewer/src/common/MemoryCache.js',
                'panoviewer/src/viewer/PanoTouchHelper.js',
                'src/experiences/ImageCompareES.js',
                'web/narratives/imagecompare/narrative.js'

                // TODO: enable JSHint for RIN sources
                //, '<%= concat.core.src %>'
                //, '<%= concat.experiences.src %>'
            ],

            // TODO: fix mixed tabs/spaces and merge with section above
            ignoreMixedTabsAndSpaces: {
                options: { smarttabs: true },
                files: {
                    src: [
                        'web/narratives/everest3m/**/*.js'
                    ]
                }
            }
        },
        jst: {
            everestTemplates: {
                options: {
                    templateSettings: {
                        variable: 'data'
                    },
                    prettify: true,
                    namespace: 'everest.templates',
                    processName: function(filename) {
                        return filename.split('/').pop().split('.')[0];
                    }
                },
                files: {
                    'everest/web/scripts/templates.js': ['everest/templates/*.html']
                }
            }
        },
        less: {
            everest: {
                files: {
                    'everest/web/css/app.css': [
                        'everest/css/reset.less',
                        'everest/css/app.less'
                    ],
                    'everest/web/css/rin.css': 'everest/css/rin.less'
                }
            }
        },
        uglify: {
            all: {
                options: {
                    banner: jsBanner
                },
                files: {
                    '<%= concat.core.dest %>': ['<%= concat.core.dest %>'],
                    '<%= concat.experiences.dest %>': ['<%= concat.experiences.dest %>'],
                    '<%= concat.panoviewer.dest %>': ['<%= concat.panoviewer.dest %>'],
                    '<%= concat.everestApp.dest %>': ['<%= concat.everestApp.dest %>'],
                    '<%= concat.everestRinIframe.dest %>': ['<%= concat.everestRinIframe.dest %>']
                }
            },
            libs : {
                // don't include the RIN specific header
                files: {
                    '<%= concat.everestLibs.dest %>': ['<%= concat.everestLibs.dest %>'],
                    '<%= concat.everestRinLibs.dest %>': ['<%= concat.everestRinLibs.dest %>']
                }
            }
        },
        clean: {

            everestScripts: [ 'everest/web/scripts/' ],

            // remove temporary templates.js file (after merged into app.js)
            everestTemplates: [ 'everest/web/scripts/templates.js' ],

            // clear the entire cdn directory
            azureCdn: [ 'everest/cdn/' ]
        },
        ver: {
            azure: {
                phases: [
                    {
                        files: [
                            'everest/cdn/images/**'
                        ],
                        references: [
                            'everest/cdn/css/*.css',
                            'everest/EverestAzure/Views/Home/Index.cshtml',
                            'everest/EverestAzure/Views/Home/Privacy.cshtml',
                            'everest/EverestAzure/Views/Account/Login.cshtml',
                            'everest/cdn/rin-' + rinTime + '/index.html'
                        ]
                    },
                    {
                        files: [
                            'everest/cdn/css/*.css',
                            'everest/cdn/scripts/*.js'
                        ],
                        references: [
                            'everest/EverestAzure/Views/Home/Index.cshtml',
                            'everest/EverestAzure/Views/Home/Privacy.cshtml',
                            'everest/EverestAzure/Views/Account/Login.cshtml',
                            'everest/cdn/rin-' + rinTime + '/index.html'
                        ]
                    }
                ]
            }
        },
        copy: {
            everest: {
                files: [
                    {
                        expand: true,
                        cwd: 'web/lib/',
                        src: [
                            'pano-viewer.js',
                            'rin-core-1.0.js',
                            'rin-experiences-1.0.js'
                        ],
                        dest: 'everest/web/scripts/'
                    },
                    {
                        // fallback copy of jquery
                        expand: true,
                        cwd: 'everest/libs/',
                        src: [ 'jquery.min.js' ],
                        dest: 'everest/web/scripts/'
                    },
                    {
                        expand: true,
                        cwd: 'web/narratives/everest3m/',
                        src: [ '**' ],
                        dest: 'everest/web/rin/narratives/everest3m/'
                    }
                ]
            },
            azure: {
                files: [
                    {
                        src: ['everest/web/index.html'],
                        dest: 'everest/EverestAzure/Views/Home/Index.cshtml'
                    },
                    {
                        src: ['everest/web/privacy.html'],
                        dest: 'everest/EverestAzure/Views/Home/Privacy.cshtml'
                    },
                    {
                        src: ['everest/html/Login.cshtml'],
                        dest: 'everest/EverestAzure/Views/Account/Login.cshtml'
                    },
                    {
                        expand: true,
                        cwd: 'everest/web/rin/',
                        src: ['**'],
                        dest: 'everest/cdn/rin-' + rinTime + '/'
                    },
                    {
                        expand: true,
                        cwd: 'everest/web/images/',
                        src: ['**'],
                        dest: 'everest/cdn/images/'
                    },
                    {
                        expand: true,
                        cwd: 'everest/web/css/',
                        src: ['**'],
                        dest: 'everest/cdn/css/'
                    },
                        {
                        expand: true,
                        cwd: 'everest/web/scripts/',
                        src: ['**'],
                        dest: 'everest/cdn/scripts/'
                    }
                ]
            }
        },
        replace: {
            azure: {
                options: {
                    variables: {
                        'src="scripts/': 'src="http://cdn-site.glacierworks.org/site/scripts/',
                        'href="css/': 'href="http://cdn-site.glacierworks.org/site/css/',
                        'data-cdn=""': 'data-cdn="http://cdn-site.glacierworks.org/site/"',
                        '"images/': '"http://cdn-site.glacierworks.org/site/images/',
                        'data-rin-time=""': 'data-rin-time="' + rinTime + '"'
                    },
                    prefix: ''
                },
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: [ 'everest/EverestAzure/Views/Home/Index.cshtml' ],
                        dest: 'everest/EverestAzure/Views/Home/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [ 'everest/EverestAzure/Views/Home/Privacy.cshtml' ],
                        dest: 'everest/EverestAzure/Views/Home/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [ 'everest/EverestAzure/Views/Account/Login.cshtml' ],
                        dest: 'everest/EverestAzure/Views/Account/'
                    }
                ]
            }
        },
        cssmin: {
            rin: {
                src: '<%= concat.rinStyles.dest %>',
                dest: '<%= concat.rinStyles.dest %>'
            },
            everest: {
                src: '<%= concat.everestRinStyles.dest %>',
                dest: '<%= concat.everestRinStyles.dest %>'
            }
        },
        
        sprite: {
            standard: {
                'src': ['everest/psd/export/*.png','!everest/psd/export/*2x.png'],
                'destImg': 'everest/web/images/sprites.png',
                'destCSS': 'everest/css/sprites.less',
                'imgPath': '../images/sprites.png',
                'engine': 'auto',
                'algorithm': 'diagonal'
            }
            // high DPI not supported in V1
            // highdpi: {
            //     'src': ['everest/psd/export/*2x.png'],
            //     'destImg': 'everest/web/images/sprites@2x.png',
            //     'destCSS': 'everest/css/sprites-ignore.less',
            //     'imgPath': '../images/sprites.png',
            //     'engine' : 'auto',
            //     'algorithm': 'diagonal'
            // },

        },
        imagemin: {
            dist: {
                options: {
                    // 0 (min) - 7 (max)
                    // details: https://github.com/gruntjs/grunt-contrib-imagemin
                    optimizationLevel: 2
                },
                files: {
                    'everest/web/images/sprites.png': 'everest/web/images/sprites.png'
                }
            }
        },

        qunit: {
            options: {
                // some tests take longer than 5 sec default
                timeout: 30 * 1000,
                verbose: true
            },
            all: {
                options: {
                    urls: [
                        'http://localhost:8000/tests/RINUnitTests.html'
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 8000,
                    base: 'web'
                }
            }
        },
        watch: {
            files: [
                'Gruntfile.js',
                '<%= concat.core.src %>',
                '<%= concat.experiences.src %>',
                '<%= concat.panoviewer.src %>',
                'everest/js/**/*.js',
                'everest/css/*.less',
                'everest/templates/*.html'
            ],
            tasks: ['default']
        }
    });

    // log each QUnit test as it is run
    var currentModule, currentTest;
    grunt.event.on('qunit.begin', function() {
        grunt.log.writeln('');
        grunt.log.write('.');
    });
    grunt.event.on('qunit.moduleStart', function(name) {
        currentModule = name;
    });
    grunt.event.on('qunit.testStart', function(name) {
        currentTest = (currentModule ? currentModule + ': ' : '') + name;
        grunt.log.writeln(currentTest);
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-ver');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    
    // don't load this on windows (because of difficult installation of the package)
    if (require('os').platform() !== 'win32') {
        grunt.loadNpmTasks('grunt-spritesmith');
    }

    grunt.registerTask('rin', [
        'jshint',
        'clean:everestScripts',
        'concat:core',
        'concat:experiences',
        'concat:panoviewer',
        'concat:rinStyles',
        'concatTmpl:rin'
    ]);

    grunt.registerTask('everest-base', [
        'rin',
        'jst:everestTemplates',
        'concat:everestApp',
        'concat:everestLibs',
        'clean:everestTemplates',
        'concat:everestRinLibs',
        'concat:everestRinIframe',
        'concat:everestRinStyles',
        'concatTmpl:everestRin'
    ]);

    // default task (everest debug)
    grunt.registerTask('default', [
        'rin',
        'everest-base',
        'copy:everest',
        'less'
    ]);

    // ship version with minified sources
    grunt.registerTask('ship', [
        'rin',
        'everest-base',
        'uglify',
        'copy:everest',
        'less',
        'cssmin',
        'test'
    ]);

    grunt.registerTask('test', ['connect', 'qunit']);

    // azure build
    grunt.registerTask('azure', [
        'ship',
        'clean:azureCdn',
        'copy:azure',
        'ver:azure',
        'replace:azure'
    ]);

    // sprite generation
    grunt.registerTask('images', ['sprite', 'imagemin']);


};