var requestAnimationFrame =  window.requestAnimationFrame ||
                             window.msRequestAnimationFrame ||
                             window.mozRequestAnimationFrame ||
                             window.oRequestAnimationFrame ||
                             window.webkitRequestAnimationFrame ||
                             function(callback, element) {
                                 window.setTimeout(callback, 1000/30);
                             };

// TODO:
//   Get contract patching stuff instead of using self.mediaType[k] stuff.

/**
 * Prototype RML viewer.
 */
var RwwViewer = function (parentDiv, options) {
    var self = this,
        options = options || {},
        attributionChanged = options.attributionChanged || function() {} ,
        animating = options.animating == null ? true : options.animating,
        rootElement = document.createElement('div'),
        eventCapturingElement = document.createElement('div'),
        scene = new RMLStore(),
        showDebugMessages = true,
        showLowerFidelityWhileMoving = true,
        unprocessedEvents = [];
       
    //This is a member just for testing purposes.
    self.mediaType = {};
    if (Config.PanoramaExists) {
        self.mediaType['panorama'] = new Panorama();
    }
    if (Config.StreetsidePanoramaExists) {
        self.mediaType['streetsidePanorama'] = new StreetsidePanorama();
    }
    if (Config.MapExists) {
        self.mediaType['map'] = new Map();
    }
    
    if(!parentDiv) {
        throw 'expected div argument';
    }

    if (options.url) {
        //Load RML from an url.
        ///TODO
    } else if (options.rml) {
        //Use RML that is passed in.    
        scene.add(options.rml);
    } else {
        throw 'expected either url or rml property passed in the options object';
    }

    var width = options.width || parentDiv.offsetWidth;
    var height = options.height || parentDiv.offsetHeight;

    var commonStyles = {
        width: width + 'px',
        height: height + 'px',
        position: 'absolute',
        overflow: 'hidden',
        '-ms-user-select': 'none',
        '-moz-user-select': '-moz-none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
        '-ms-touch-action': 'none'
    }
    
    Utils.css(rootElement, commonStyles);
    Utils.css(rootElement, { backgroundColor: 'rgba(0,0,0,1)', direction: 'ltr' });
    Utils.css(eventCapturingElement, commonStyles);
    Utils.css(eventCapturingElement, { backgroundColor: 'rgba(0,0,0,0)', webkitTapHighlightColor: 'rgba(0,0,0,1)', tabIndex: 0 });

    var renderer;
    // in order to be able to get close enough in the map case (still not
    // enough. TODO: dynamically manage near and far in MapCameraController)
    var near = 0.00001;
    var far  = 4;
        
    var requiresCORS = false;
    var requiresTileOverlap = false;
    switch (options.renderer) {
        case 'css':
            renderer = new RendererCSS3D(rootElement, width, height);
            requiresTileOverlap = true;
            break;
        case 'webgl':
            renderer = new RendererWebGL(rootElement, width, height);
            requiresCORS = true;
            break;
        case 'flash':
            renderer = new RendererFlash(rootElement, width, height);
            requiresTileOverlap = true; //TODO: is this needed?
            break;
        default:
            //We try webgl first then css.
            try {
                renderer = new RendererWebGL(rootElement, width, height);
                requiresCORS = true;
            } catch (ex) {
                try {
                    if (rootElement.parentNode) {
                        rootElement.parentNode.removeChild(rootElement);
                    }
                    requiresTileOverlap = true;
                    renderer = new RendererCSS3D(rootElement, width, height);
                } catch (ex2) {
                    if (rootElement.parentNode) {
                        rootElement.parentNode.removeChild(rootElement);
                    }
                    renderer = null;
                }
            }

            if (renderer == null) {
                throw 'Could not create CSS3 or webgl renderer' + options.renderer;
            }
            break;
    }

    //Only attach event handlers and wire up the DOM etc.. when we know we won't throw on renderer creation.
    parentDiv.appendChild(rootElement);
    parentDiv.appendChild(eventCapturingElement);
    var gestureHelper = new PanoTouchHelper(eventCapturingElement);

    if (options.backgroundColor) {
        renderer.setClearColor(options.backgroundColor);
    }

    var attributionControl = null;
    //Setup overlay UI. 
    if(!options.hideAttribution && options.rml.source && options.rml.source.attribution) {
        attributionControl = new AttributionControl(parentDiv);
        attributionControl.setAttribution(options.rml.source.attribution);
    } 

    if(options.rml.source && options.rml.source.attribution) {
        attributionChanged(options.rml.source.attribution);
    }

    var alreadyFiredLoadedEvent = false;
    var tileDownloadFailed = function(failCount, successCount) {
        if (downloader.customFailFunc)
            downloader.customFailFunc();
        if (options.tileDownloadFailed)
            options.tileDownloadFailed(failCount, successCount);
        if (Config.tileDownloadFailed)
            Config.tileDownloadFailed();
    }
    var tileDownloadSucceeded = function (failCount, successCount) {
        if (options.tileDownloadSucceeded) {
            options.tileDownloadSucceeded(failCount, successCount);
        }

        if (!alreadyFiredLoadedEvent && options.loaded && !downloader.currentlyDownloading()) {
            options.loaded();
            alreadyFiredLoadedEvent = true;
        }
    }
    var downloader = new PriorityNetworkDownloader(requiresCORS, tileDownloadFailed, tileDownloadSucceeded);

    var viewport = new Viewport(width, height, near, far);
    var camera = new PerspectiveCamera();
    camera.setViewport(viewport);
    var cameraParameters = options.cameraParameters || {
        verticalFov: MathHelper.degreesToRadians(80),
        position: new Vector3(0, 0, 0),
        look: new Vector3(0, 0, -1),
        //Use the following for testing a more general initial view
        //look: (new Vector3(-1, 0, -1)).normalize(),
        up: new Vector3(0, 1, 0),
        side: new Vector3(1, 0, 0),
        leftBoundFactor: 0.98,
        rightBoundFactor: 0.98,
        topBoundFactor: 0.98,
        bottomBoundFactor: 0.98
    };


    camera.setPosition(cameraParameters.position);
    camera.setLook(cameraParameters.look);
    camera.setUp(cameraParameters.up);
    camera.setVerticalFov(cameraParameters.verticalFov);
    var activeController;

    //Give any initially loaded media a chance to override our default controller. Last one wins.
    objectCollection.loopByType(scene, function (k, entities) {
        if (entities.length > 0 && self.mediaType[k] && self.mediaType[k].createController) {
            activeController = self.mediaType[k].createController(entities, camera, cameraParameters);
            if (self.mediaType[k].outputMultiLODTiles != null) {
                Config.outputMultiLODTiles = self.mediaType[k].outputMultiLODTiles;
            }
            if (self.mediaType[k].scanConvertSize != null) {
                Config.scanConvertSize = self.mediaType[k].scanConvertSize;
            }
        }
    });

    var entityIdToRenderable = {};
    var visibleSet = { byType: {} };

    var animatingOut = [];
    var prevFrame = new Date();
    var prevSmoothedFrame = new Date();
    var smoothedFrameCount = 0;
    var smoothedFramerate = 0;

    var isCachedUrl = function(url) {
        var state = downloader.getState(url);
        return (state === TileDownloadState.ready);
    };

    //This is the main processing loop. 
    var hasBlockingDownload = false;
    var blockingDownloadTargetCount = -1,
        blockingDownloadSuccessCount = 0,
        blockingDownloadFailureCount = 0,
        blockingDownloadProgressCallback = null,
        blockingDownloadFinishCallback = null;
    var prefetchedTiles = {};

    this.getEntities = function (entityType) {
        return scene.byType[entityType];
    };

    var updateFrame = function () {
        if (hasBlockingDownload) {
            blockingDownloadSuccessCount += downloader.completed.length;
            downloader.update();
            blockingDownloadProgressCallback(blockingDownloadSuccessCount);
            if (blockingDownloadSuccessCount + blockingDownloadFailureCount ==
                    blockingDownloadTargetCount) {
                blockingDownloadFinishCallback(blockingDownloadSuccessCount,
                        blockingDownloadFailureCount);

                // reset
                self._resetDownloadAll();
            } else {
                if (animating) {
                    ++frameCount;
                    requestAnimationFrame(updateFrame);
                }
                return;
            }
        }
        var i, j, k,
        frustum,
        entity,
        pendingFetch = [],
        loaded = [],
        deltaVisibleSet = { byType: {} };

        /**
        * Update our RML graph based on network input 
        */
        var networkUpdate = { added: [], removed: [] }; //TODO use socket.io
        for (i = 0; i < networkUpdate.removed.length; ++i) {
            var obj = scene.byId[networkUpdate.removed[i]];
            deltaVisibleSet.byType[obj.type].removed = deltaVisibleSet.byType[obj.type].removed || [];
            deltaVisibleSet.byType[obj.type].removed.push(obj.id);
        };


        /**
        * Update our camera pose based on user input
        */
        camera = activeController.control(camera, gestureHelper.getQueuedEvents());

        var pose = camera.getPose();
        var toleranceInPixels = (self.prevCameraMoving) ? 0.1 : 1;

        var userInteracting = gestureHelper.userCurrentlyInteracting();
        var cameraMoving = (self.prevPose != null && !self.prevPose.isFuzzyEqualTo(pose, toleranceInPixels));

        var userInteractingWaitTime = 1000;

        if (userInteracting) {
            self.userInteractingTime = null;
        }
        else if (self.prevUserInteracting) {
            var now = (new Date()).valueOf();
            if (self.userInteractingTime == null) {
                self.userInteractingTime = now + userInteractingWaitTime;
            }

            if (self.userInteractingTime > now) {
                //still waiting for high fidelity time
                userInteracting = true;
            }
            else {
                self.userInteractingTime = null;
            }
        }

        var useLowerFidelity = showLowerFidelityWhileMoving && (userInteracting || cameraMoving);
        var fidelityChanged = (useLowerFidelity !== self.prevUseLowerFidelity);

        var doWorkThisFrame = fidelityChanged || useLowerFidelity || downloader.currentlyDownloading() || !self.prevPose.isFuzzyEqualTo(pose, 0.0001);

        var doWorkWaitTime = 500;

        if (doWorkThisFrame) {
            self.doWorkTime = null;
        }
        else if (self.prevDoWorkThisFrame) {
            var now = (new Date()).valueOf();
            if (self.doWorkTime == null) {
                self.doWorkTime = now + doWorkWaitTime;
            }

            if (self.doWorkTime > now) {
                //still doing work for a bit more in case I've missed anything
                doWorkThisFrame = true;
            }
            else {
                self.doWorkTime = null;
            }
        }

        self.prevPose = pose;
        self.prevUserInteracting = userInteracting;
        self.prevCameraMoving = cameraMoving;
        self.prevUseLowerFidelity = useLowerFidelity;
        self.prevDoWorkThisFrame = doWorkThisFrame;
        
        if (doWorkThisFrame) {
            objectCollection.loopByType(scene, function (k, entities) {
                if (entities.length > 0 && self.mediaType[k] && self.mediaType[k].cull) {
                    //Should this API take a view frustum or view projection matrix instead of camera?
                    visibleSet.byType[k] = visibleSet.byType[k] || [];
                    if (!visibleSet.byType[k].byId) {
                        visibleSet.byType[k].byId = {};
                    }
                   deltaVisibleSet.byType[k] = self.mediaType[k].cull(entities, camera, visibleSet.byType[k], isCachedUrl, useLowerFidelity, requiresTileOverlap);
                }
            });

            //Enqueue any new downloads and cancel downloads.
            objectCollection.loopByType(deltaVisibleSet, function (k, entities) {
                if (self.mediaType[k] && self.mediaType[k].fetch) {
                    self.mediaType[k].fetch(entities, downloader);
            }});

            var renderableToRemove = [];
            var renderableToAdd = [];
            var renderableEntityId = [];
            objectCollection.loopByType(deltaVisibleSet, function (k, entities) {
                var i = 0, id, generatedRenderable;
                if (entities.removed) {
                    for (i = 0; i < entities.removed.length; ++i) {
                        id = entities.removed[i].id;
                        renderableToRemove.push(entityIdToRenderable[id]);
                    }
                }

                if (entities.added && self.mediaType[k] && self.mediaType[k].generateRenderables) {
                    renderableToAdd = renderableToAdd.concat(self.mediaType[k].generateRenderables(entities.added, renderer));
                }
            });

            //Add the renderables to the scene.
            var renderableId = renderer.addRenderable(renderableToAdd);
            for (i = 0; i < renderableToAdd.length; ++i) {
                entityIdToRenderable[renderableToAdd[i].entityId] = renderableId[i];
            }

            //Process any downloaded resources and let renderables know.
            objectCollection.loopByType(deltaVisibleSet, function (k) {
                if (self.mediaType[k] && self.mediaType[k].processDownloads) {
                    //NOTE we'll need to revisit this with multiple entity types.
                    self.mediaType[k].processDownloads(downloader.completed, entityIdToRenderable, renderer);
            }});


            //Allow downloader to process any updates.
            downloader.update();

            //Do any animations that are required.
            objectCollection.loopByType(deltaVisibleSet, function (k, entities) {
                if (self.mediaType[k] && self.mediaType[k].updateRenderableStates) {
                    self.mediaType[k].updateRenderableStates(renderer);
                }
            });

            //Remove old renderables.
            for (i = 0; i < renderableToRemove.length; ++i) {
                for (var k in entityIdToRenderable) { //TODO opt.
                    if (entityIdToRenderable[k] === renderableToRemove[i]) {
                        delete entityIdToRenderable[renderableToRemove[i]];
                    }
                }
            }
            renderer.remove(renderableToRemove);

            //Do the actual Render.
            renderer.setViewProjectionMatrix(camera.getViewProjectionTransform());
            renderer.render(useLowerFidelity);

            //Update visible set
            objectCollection.loopByType(deltaVisibleSet, function (k, entities) {
                var i, j, element, updatedSet = [];
                visibleSet.byType[k] = visibleSet.byType[k] || [];
                visibleSet.byType[k] = visibleSet.byType[k].concat(entities.added);
            
                for(j = 0; j < visibleSet.byType[k].length; ++j) {
                    var removed = false;
                    for( i = 0; i < entities.removed.length; ++i) {
                        if (visibleSet.byType[k][j].id == entities.removed[i].id) {
                            removed = true;
                            break;
                        }
                    }
                    if (!removed)
                        updatedSet.push(visibleSet.byType[k][j]);
                }
                visibleSet.byType[k] = updatedSet;

                //build an index by id.
                visibleSet.byType[k].byId = {};
                for (i = 0; i < visibleSet.byType[k].length; ++i) {
                    element = visibleSet.byType[k][i];
                    visibleSet.byType[k].byId[element.id] = element;
                }
            });

            if (showDebugMessages) {
                var debugText = document.getElementById('debugText');
                if (debugText) {
                    var numberOfRenderables = 0;
                    for (var k in renderer._renderables) {
                        if (renderer._renderables.hasOwnProperty(k)) {
                            ++numberOfRenderables;
                        }
                    }

                    var now = new Date();

                    smoothedFrameCount++;
                    if ((now - prevSmoothedFrame) >= 500) {
                        smoothedFramerate = smoothedFrameCount / 0.5;
                        smoothedFrameCount = 0;
                        prevSmoothedFrame = now;
                    }

                    var message = ' frame count:' + frameCount + '  #renderables:' + numberOfRenderables + ' framerate:' + (1000 / (now - prevFrame)).toFixed(0) + ' smoothedFramerate:' + smoothedFramerate.toFixed(0);
                    debugText.innerHTML = message;

                    prevFrame = now;
                }
            }
        }

        if (animating) {
            ++frameCount;
            requestAnimationFrame(updateFrame);
        }

    };

    var frameCount = 0;

    //Kick off render loop.
    if (animating) {
        this.enableRendering();
    }

    self.dispose = function () {
        this.disableRendering();
        
        if (rootElement.parentNode) {
            rootElement.parentNode.removeChild(rootElement);
        }
        if (eventCapturingElement.parentNode) {
            eventCapturingElement.parentNode.removeChild(eventCapturingElement);
        }
        if(attributionControl) {
            attributionControl.dispose();
        }
    };

    self.getOverlayElement = function () {
        return eventCapturingElement;
    };

    self.getHitTestInvisibleOverlayElement = function () {
        return rootElement;
    };

    self.getActiveCameraController = function () {
        return activeController;
    };

    self.focusKeyboardElement = function () {
        gestureHelper.focusKeyboardElement();
    };

    self.setViewportSize = function (width, height) {
        Utils.css(rootElement, { width: width + 'px', height: height + 'px' });
        Utils.css(eventCapturingElement, { width: width + 'px', height: height + 'px' });
        renderer.setViewportSize(width, height);
        camera.setViewport(new Viewport(width, height, camera.getViewport().getNearDistance(), camera.getViewport().getFarDistance()));

        if (activeController.setViewportSize) {
            activeController.setViewportSize(width, height);
        }

        if (attributionControl) {
            attributionControl.updatePosition();
        }
    };

    self.getViewportSize = function () {
        return new Vector2(camera.getViewport().getWidth(), camera.getViewport().getHeight());
    };

    self.getViewState = function() {
        return {
            verticalFov: camera.getVerticalFov(),
            position: camera.getPosition(),
            look: camera.getLook(),
            up: camera.getUp(),
            side: camera.getLook().cross(camera.getUp())
        };
    };

    self.setShowLowerFidelityWhileMoving = function (enabled) {
        showLowerFidelityWhileMoving = enabled;
    };

    self.enableRendering = function () {
        if (!animating) {
            animating = true;
            gestureHelper.enable();
            requestAnimationFrame(updateFrame);
        }
    };

    self.disableRendering = function () {
        if (animating) {
            animating = false;
            gestureHelper.disable();
        }
    };

    self.projectOntoFaces = function (dimension, vector) {
        var results = [];
        self.doWorkPerFace(dimension, function (cam, faceName) {
            if (cam.getLook().dot(vector) <= 0) {
                return null;
            }

            //now project into 2d viewport space
            var projectedPoint = cam.projectTo2D(vector);

            //don't want to return a depth because it'll always be 1, so create a vector2 to return
            results.push({ face: faceName, point: new Vector2(projectedPoint.x, projectedPoint.y) });
        });

        return results;
    };

    self.doWorkPerFace = function (dimension, worker, refCamera) {
        if (refCamera) {
            worker(refCamera, "front");
        } else {
            var cameraLookAndUps = [
            { look: new Vector3(0, 0, -1), up: new Vector3(0, 1, 0) },
            { look: new Vector3(0, 0, 1), up: new Vector3(0, 1, 0) },
            { look: new Vector3(0, -1, 0), up: new Vector3(0, 0, 1) },
            { look: new Vector3(0, 1, 0), up: new Vector3(0, 0, 1) },
            { look: new Vector3(-1, 0, 0), up: new Vector3(0, 1, 0) },
            { look: new Vector3(1, 0, 0), up: new Vector3(0, 1, 0) }
            ];
            var faceNames = ["front", "back", "bottom", "top", "left", "right"];

            var vp = new Viewport(Math.floor(dimension), Math.floor(dimension), near, far);
            var cam = new PerspectiveCamera();
            cam.setViewport(vp);

            cam.setPosition(new Vector3(0, 0, 0));
            cam.setVerticalFov(MathHelper.degreesToRadians(90));

            for (var i = 0; i < cameraLookAndUps.length; i++) {
                cam.setLook(cameraLookAndUps[i].look);
                cam.setUp(cameraLookAndUps[i].up);

                worker(cam, faceNames[i]);
            }
        }
    };

    // Downloads all assets of the mediaType at the view setup as specified
    // by cameraParameters. Since runtime LOD calculations (computing the
    // average LODs for pano faces under perspective projection) can result
    // in more than one LOD levels, a set of multipliers can be specified
    // such that assets are fetched to cover the multiple runtime LODs.
    // A typical set of multipliers are [0.9, 1.2],
    // which correspond to 0.9x and 1.2x of viewport resolution, respectively
    self.downloadAll = function (mediaTypeName, multiplierArray, progressCallback, finishCallback, atLowLod, refCamera) {
        //hasBlockingDownload = true;

        var multipliers = multiplierArray || [1.0];

        var allTiles = {};

        for (var m = 0; m < multipliers.length; m++) {
            var scale = Math.tan(MathHelper.degreesToRadians(90) / 2) / Math.tan(camera.getVerticalFov() / 2) * multipliers[m];
            var dimension = viewport.getHeight() * scale;

            self.doWorkPerFace(dimension, function (cam, faceName) {
                var visibleSet = { byId: {} };
                var tiles = self.mediaType[mediaTypeName].cull(scene.byType[mediaTypeName], cam, visibleSet, isCachedUrl, atLowLod, requiresTileOverlap);
                if (tiles.added.length) {
                    var newTiles = tiles.added;

                    var i = 0;
                    //while (i < newTiles.length) {
                    //    if (newTiles[i].face === faceName) {
                    //        i++;
                    //    }
                    //    else {
                    //        //TODO: these tiles shouldn't be here in the first place, but it's easier at this point to just remove them instead of 
                    //        newTiles.splice(i, 1);
                    //    }
                    //}

                    newTiles.sort(function (a, b) { return b.tileId.levelOfDetail - a.tileId.levelOfDetail });
                    var lod = newTiles[0] && newTiles[0].tileId.levelOfDetail;
                    for (var i = 0; i < newTiles.length; i++) {
                        if (newTiles[i].tileId.levelOfDetail == lod)
                            allTiles[newTiles[i].id] = newTiles[i];
                        else
                            break;
                    }
                }
            }, refCamera);
        }

        if (refCamera) {
            return allTiles;
        } else {
            blockingDownloadSuccessCount = blockingDownloadFailureCount = 0;
            downloader.customFailFunc = function (failCount, successCount) {
                blockingDownloadFailureCount++;
            }

            var count = 0;
            for (var i in allTiles) {
                downloader.downloadImage(allTiles[i].url, allTiles[i].priority, allTiles[i].id);
                count++;
            }
            blockingDownloadTargetCount = count;

            blockingDownloadProgressCallback = progressCallback;
            blockingDownloadFinishCallback = finishCallback;

            prefetchedTiles = allTiles;

            return count;
        }
    };

    self.cancelDownloadAll = function() {
        for (var t in prefetchedTiles) {
            if (!isCachedUrl(prefetchedTiles[t].url))
                downloader.cancel(prefetchedTiles[t].url);
        }
        self._resetDownloadAll();
    };

    self._resetDownloadAll = function() {
        blockingDownloadTargetCount = 0;
        blockingDownloadSuccessCount = blockingDownloadFailureCount = 0;
        hasBlockingDownload = false;
        downloader.customFailFunc = null;
        blockingDownloadProgressCallback = null;
        blockingDownloadFinishCallback = null;
    };
};

// export viewer globally
window.RwwViewer = RwwViewer;
