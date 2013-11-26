var Panorama = function () {
    var self = this;
    self.frameCount = 0;
    self.culler = new TiledImagePyramidCuller;
    self.outputMultiLODTiles = false;
    self.scanConvertSize = 20;
    self.prevViewTransform = null;
    self.prevProjectionTransform = null;
};

Panorama.prototype = {
    animationDurationMS: 250,
    
    cullCubeTiles: function (cubeSource, camera, visibleSet, isCachedUrl, useLowerLod, requiresTileOverlap) {
        var delta = { added: [], removed: [] },
            faceDelta, i, propertyName,
            faceNames = ['front', 'left', 'right', 'back', 'bottom', 'top'];

        for (i = 0; i < faceNames.length; ++i) {
            propertyName = faceNames[i] + 'Face';
            if (cubeSource[propertyName]) {
                faceDelta = this.cullFace(cubeSource.dimension, cubeSource.tileSize, cubeSource.minimumLod, cubeSource.tileOverlap, cubeSource.tileBorder, cubeSource[propertyName], faceNames[i], camera, visibleSet, isCachedUrl, useLowerLod, requiresTileOverlap, cubeSource.atlasImage);
                delta.added = delta.added.concat(faceDelta.added);
                delta.removed = delta.removed.concat(faceDelta.removed);
            }
        }
        return delta;
    },

    cullFace: function (dimension, tileSize, minimumLod, tileOverlap, tileBorder, face, name, camera, visibleSet, isCachedUrl, useLowerLod, requiresTileOverlap, atlasImage) {
        if (!face.tilePyramid) {
            face.tilePyramid = new TiledImagePyramid(name, dimension, dimension, tileSize, tileSize, minimumLod, (requiresTileOverlap) ? 1 : tileOverlap, (requiresTileOverlap) ? 1 : tileBorder, atlasImage);

            if (requiresTileOverlap && tileOverlap == 0) {
                //TODO: handle case where tileOverlap doesn't equal tileBorder
                face.tilePyramid.fakeTileOverlaps = true;
            }
        }
        if (!face.tileCoverage) {
            face.tileCoverage = new TiledImagePyramidCoverageMap(face.tilePyramid.minimumLod, face.tilePyramid.finestLod);
        }
        if (!face.tileSource) {
            throw 'rml cube face requires tile source per face';
        }

        if(!face.isCachedTile){
            face.isCachedTile = function(x,y,lod) {
                return isCachedUrl(face.tileSource(x,y,lod));
            };
        }

        var faceClipBounds = this.getClipBounds(face.clip);

        var delta = this.culler.cull(
                face.tilePyramid,
                face.tileCoverage,
                this.getFaceTransform,
                camera.getViewProjectionTransform(),
                camera.getViewport().getWidth(),
                camera.getViewport().getHeight(),
                faceClipBounds,
                visibleSet,
                name,
                face.tileSource,
                face.isCachedTile,
                this.frameCount,
                useLowerLod);

        this.removeRenderablesBeingProcessed(delta);

        return delta;
    },

    removeRenderablesBeingProcessed: function(delta)  {
        if (this._renderablesBeingLoaded) {
            this.removeCancelled(this._renderablesBeingLoaded, delta);
        }

        if (this._renderablesBeingAnimated) {
            this.removeCancelled(this._renderablesBeingAnimated, delta);
        }
    },

    removeCancelled: function (list, delta) {
        for (var i=0; i<delta.removed.length; i++) {
            var id = delta.removed[i].id;
            if (list[id]) {
                delete list[id];
            }
        }
    },

    getFaceTransform: function (dimension, name) {
        var centerUnitImageBaseImageResolution = Matrix4x4.createTranslation(-0.5, -0.5, 0).multiply(Matrix4x4.createScale(1.0 / dimension, 1.0 / dimension, 1.0));
        var distanceFromCenterOfBubble = 0.5;
        var faceTransformBaseImageResolution;

        switch (name) {
            case 'front':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(0, 0, -distanceFromCenterOfBubble).multiply(centerUnitImageBaseImageResolution);
                break;

            case 'back':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(0, 0, distanceFromCenterOfBubble).multiply(Matrix4x4.createRotationY(MathHelper.degreesToRadians(180)).multiply(centerUnitImageBaseImageResolution));
                break;

            case 'left':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(-distanceFromCenterOfBubble, 0, 0).multiply(Matrix4x4.createRotationY(MathHelper.degreesToRadians(90)).multiply(centerUnitImageBaseImageResolution));
                break;

            case 'right':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(distanceFromCenterOfBubble, 0, 0).multiply(Matrix4x4.createRotationY(MathHelper.degreesToRadians(-90)).multiply(centerUnitImageBaseImageResolution));
                break;

            case 'top':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(0, distanceFromCenterOfBubble, 0).multiply(Matrix4x4.createRotationX(MathHelper.degreesToRadians(90)).multiply(centerUnitImageBaseImageResolution));
                break;

            case 'bottom':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(0, -distanceFromCenterOfBubble, 0).multiply(Matrix4x4.createRotationX(MathHelper.degreesToRadians(-90)).multiply(centerUnitImageBaseImageResolution));
                break;
            default:
                throw 'unexpected cube face name';
                break;
        }
        return faceTransformBaseImageResolution;
    },

    //Figure out the region where tiles are available in a cube face
    getClipBounds: function (vertices) {
        if (vertices == null) {
            return null;
        }

        var minX = 999999;
        var minY = 999999;
        var maxX = -9999999;
        var maxY = -9999999;
        for (var i = 0; i < vertices.length; i += 2) {
            var x = vertices[i];
            var y = vertices[i + 1];

            if (x < minX) { minX = x; }
            if (x > maxX) { maxX = x; }
            if (y < minY) { minY = y; }
            if (y > maxY) { maxY = y; }
        }
        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    },

    /**
    * Initialize Camera Controller.
    */
    createController: function (initialPanoramaEntities, camera, cameraParameters) {
        var cameraController = new RotationalFixedPositionCameraController(camera);
        if (initialPanoramaEntities && initialPanoramaEntities[0]) {
            //TODO: Ideally we'd do something smart for multiple cubes.
            var cubeSource = initialPanoramaEntities[0].source;

            if (cubeSource.startingPitch != undefined) {
                cameraController.setPitchAndHeading(cubeSource.startingPitch,
                                                                cubeSource.startingHeading);
            }

            // In a zoomed-in view, as you pan to far-right or far left, sometimes black triangles are seen at the top left, bottom right etc corners because the
            // background is seen due to perspective correction. So we limit the bounds further by a factor so that the effect is eliminated/reduced.
            var enforceViewLimits = (cameraParameters.enforceViewLimits == null) ? true : cameraParameters.enforceViewLimits;
            var leftBound = cubeSource.bounds.left;
            var rightBound = cubeSource.bounds.right;
            var topBound = cubeSource.bounds.top;
            var bottomBound = cubeSource.bounds.bottom;
            if (enforceViewLimits)
            {
                leftBound *= (cameraParameters.leftBoundFactor ? cameraParameters.leftBoundFactor : 0.98);
                rightBound *= (cameraParameters.rightBoundFactor ? cameraParameters.rightBoundFactor : 0.98);
                topBound *= (cameraParameters.topBoundFactor ? cameraParameters.topBoundFactor : 0.98);
                bottomBound *= (cameraParameters.bottomBoundFactor ? cameraParameters.bottomBoundFactor : 0.98);;
            }
            var leftRightDelta = rightBound - leftBound;
            while (leftRightDelta <= 0) {
                leftRightDelta += 2 * MathHelper.PI;
            }
            var borderBufferPercentage = 1.0;

            var maxAllowedFov = MathHelper.degreesToRadians(90);
            var maxHorizontalFov = Math.min(maxAllowedFov, leftRightDelta * borderBufferPercentage);
            var maxVerticalFov = Math.min(maxAllowedFov, (bottomBound - topBound) * borderBufferPercentage);
            var finalFov = Math.max(maxVerticalFov,
                                          Math.min(maxAllowedFov,
                                                         Viewport.convertHorizontalToVerticalFieldOfView(camera.getViewport().getAspectRatio(),
                                                                                                         maxHorizontalFov)));

            //Make sure we check that if the final vertical fov when converted to horizontal is > 90 that we
            //make the vertical fov smaller.  Don't want horizontal or vertical fov to be > 90
            var maxFovAsHorizontal = Viewport.convertVerticalToHorizontalFieldOfView(camera.getViewport().getAspectRatio(), finalFov);
            finalFov = Viewport.convertHorizontalToVerticalFieldOfView(camera.getViewport().getAspectRatio(),
                                                                       Math.min(maxAllowedFov, maxFovAsHorizontal));

            //negative top and bottom because rml uses a different convention than the camera controller
            cameraController = new RotationalFixedPositionCameraController(camera, -topBound, -bottomBound, rightBound, leftBound, enforceViewLimits, cameraParameters.minClientPreferredFieldOfView, cubeSource.dimension);
            cameraController.setVerticalFov(finalFov);
        }
        return cameraController;
    },

    /**
    * Implements the logic to cull panorama entities and emit tiles.
    */
    cull: function (panoramaEntities, camera, visibleSet, isCachedUrl, useLowerFidelity, requiresTileOverlap) {
        var i, j, k, panoramaTiles,
            result = { added: [], removed: [] };
        for (i = 0; i < panoramaEntities.length; ++i) {
            //TODO deal with multple panorama entities correctly.

            panoramaTiles = this.cullCubeTiles(panoramaEntities[i].source, camera, visibleSet, isCachedUrl, useLowerFidelity, requiresTileOverlap);
            result.added = result.added.concat(panoramaTiles.added);
            result.removed = result.removed.concat(panoramaTiles.removed);
        }
        ++this.frameCount;
        return result;
    },

    /**
     * Creates renderables for tiles
     */
    generateRenderables: function(visibleEntities, renderer) {
        var self = this;
        var i, renderable,  renderables = [];
        if (! this._renderablesBeingLoaded) {
            this._renderablesBeingLoaded = {};
        }

        var faceAtlasOffsets = {
            "front": 0,
            "right": 1,
            "back": 2,
            "left": 3,
            "bottom": 4,
            "top": 5
        };

        for(i = 0; i < visibleEntities.length; ++i) {
            (function() {
                var entity = visibleEntities[i];
                var callbackInfo = {};
                
                var offsetX = 0;
                var offsetY = 0;

                if (entity.tilePyramid.isAtlasTile(entity.tileId)) {
                    offsetX = faceAtlasOffsets[entity.face] * entity.tileWidth;
                }
                
                renderable = new TexturedQuadRenderable(entity.tileWidth, 
                    entity.tileHeight,
                    entity.transform,
                    entity.url,
                    null,
                    null,
                    false,
                    offsetX,
                    offsetY);
                renderable._entity = entity;
                renderable.entityId = entity.id;
                renderable._order = entity.tileId.levelOfDetail
                // We don't fade temp tiles or cached ones.
                if ( entity.tileId.isTemp  || entity.tileId.cached) {
                    entity.fullyOpaque = true;
                } else {
                    entity.fullyOpaque = false;
                }
                entity.loaded = false;
                renderables.push(renderable);
                self._renderablesBeingLoaded[entity.id] = renderable;
            } ());
        }
        return renderables;
    },

    /**
     * Update rendering state 
     */
    updateRenderableStates: function(renderer) {
        var animateTileEntry = true;

        if (! this._renderablesBeingAnimated) {
            this._renderablesBeingAnimated = {};
        }

        if (this._renderablesBeingLoaded) {
            var toDelete = [];
            for (var id in this._renderablesBeingLoaded) {
                var r = this._renderablesBeingLoaded[id];
                var entity = r._entity;
                var tileId = entity.tileId;

                if (r._material._texture._isReady) {
                    //Don't animate if tile is temporary (lower lod tile put in scene because higher lod isn't downloaded yet)
                    //Don't animate if we're rendering in lower lod mode (used when rotating to achieve better framerate)
                    if (animateTileEntry && !tileId.isTemp && !tileId.isLowerLod) {
                        renderer.animate(r,
                                {opacity:0.0}, 
                                {opacity:1.0}, 
                                this.animationDurationMS,
                                'ease-in-out');
                        entity.fullyOpaque = false;
                        this._renderablesBeingAnimated[id] = r;
                    } else {
                        entity.fullyOpaque = true;
                    }
                    toDelete.push(id);
                }
            }
            for (var i=0; i<toDelete.length; i++) {
                delete this._renderablesBeingLoaded[toDelete[i]];
            }
        }

        if (this._renderablesBeingAnimated) {
            var toDelete = [];
            for (id in this._renderablesBeingAnimated) {
                var r = this._renderablesBeingAnimated[id];
                if (r._material._animation._ended) {
                    toDelete.push(id);
                    r._entity.fullyOpaque = true;
                }
            }
            for (var i=0; i<toDelete.length; i++) {
                delete this._renderablesBeingAnimated[toDelete[i]];
            }
        }
    },

    fetch: function(entities, downloader) {
        var i, entity, len;
        if (entities.removed) {
            // assumes 1 download per item.
            for (i = 0, len = entities.removed.length; i < len; ++i) {
                downloader.cancel(entities.removed[i].id);
            }
        } 

        if (entities.updated) {
            //Update any pending downloads
            for (i = 0, len = entities.updated.length; i < len; ++i) {
                entity = entities.updated[i];
                downloader.updatePriority(entity.url, entity.priority);
            }
        }

        if (entities.added) {
            //Enqueue downloads.
            for (i = 0, len = entities.added.length; i < len; ++i) {
                entity = entities.added[i];
                downloader.downloadImage(entity.url, entity.priority, entity.id);
            }
        }
    },

    _drawBorders: function (currentTileContext, currentImage, neighborTexture, xOffset, yOffset) {
        var neighborSourceImage = neighborTexture._sourceImage;
        var neighborCanvas = neighborTexture._image;
        
        if (neighborSourceImage == null || neighborCanvas == null) {
            return;
        }
        
        var neighborContext = neighborCanvas.getContext('2d');

        currentTileContext.drawImage(neighborSourceImage, 1 + xOffset, 1 + yOffset);

        neighborContext.drawImage(currentImage, 1 - xOffset, 1 - yOffset);
    },

    _neighborOffsets: [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [-1, 0]],

    _processDownload: function (img, renderable, entityIdToRenderable, renderer) {
        var texture = renderable._material._texture;
        var entity = renderable._entity;
        var tilePyramid = entity.tilePyramid;
        var tileId = entity.tileId;

        if (texture._image != null) {
            //already been processed
            return;
        }

        if (tilePyramid.isAtlasTile(tileId)) {
            var dimensions = tilePyramid.getTileDimensions(tileId);

            var canvas = document.createElement('canvas');
            canvas.width = dimensions.x;
            canvas.height = dimensions.y;
            var context = canvas.getContext('2d');

            var offsetX = texture._offsetX;
            var offsetY = texture._offsetY;
            var width = texture._width;
            var height = texture._height;

            context.drawImage(img, offsetX, offsetY, width, height,
                                   0, 0, canvas.width, canvas.height);
            
            if (tilePyramid.fakeTileOverlaps) {
                context.drawImage(img, offsetX, offsetY, width, height,
                                       1, 1, canvas.width - 1, canvas.height - 1);
            }
            
            texture._image = canvas;
            texture._sourceImage = img;
        }
        else if (tilePyramid.fakeTileOverlaps) {
            //TODO: handle case where tileOverlap != tileBorder
            var canvas = document.createElement('canvas');
            canvas.width = tilePyramid.tileWidth + 2;
            canvas.height = tilePyramid.tileHeight + 2;
            var context = canvas.getContext('2d');
                    
            //First draw a stretched out version of the tile on the canvas to fill in the border with pixels from its own borders
            context.drawImage(img, 0, 0, tilePyramid.tileWidth + 2, tilePyramid.tileHeight + 2);
                    
            //Next draw the tile centered in the canvas.
            context.drawImage(img, 1, 1);
                    
            //Now iterate through the list of possible neighbors for this element.  For each, draw borders on this canvas and the neighbor canvas
            for (var j = 0; j < this._neighborOffsets.length; j++) {
                var neighborOffset = this._neighborOffsets[j];
                var neighbor = new TileId(tileId.levelOfDetail, tileId.x + neighborOffset[0], tileId.y + neighborOffset[1]);
                var neighborEntityId = entity.face + neighbor.toString();
                var neighborRenderableId = entityIdToRenderable[neighborEntityId];
                if (neighborRenderableId && renderer._renderables[neighborRenderableId]) {
                    var neighborTexture = renderer._renderables[neighborRenderableId]._material._texture;
                    this._drawBorders(context, img, neighborTexture, tilePyramid.tileWidth * neighborOffset[0], tilePyramid.tileHeight * neighborOffset[1]);
                }
            }

            texture._image = canvas;
            texture._sourceImage = img;
        }
        else {
            texture._image = img;
        }
        texture._isReady = true;
        texture._isDirty = true;
    },

    processDownloads: function(completed, entityIdToRenderable, renderer) {
        for(var i = 0; i < completed.length; ++i) {
            var img = completed[i];
            var renderableId = entityIdToRenderable[img.token];
            if(renderableId && renderer._renderables[renderableId]) {
                //Should we be reaching down directly to the renderer this way?
                
                var renderable = renderer._renderables[renderableId];
                var entity = renderable._entity;

                if (entity.tilePyramid.isAtlasTile(entity.tileId)) {
                    //set up the atlas image to allow processing of the atlas for all faces below
                    this.atlasImage = img;
                }
                else {
                    //process this renderable
                    this._processDownload(img, renderable, entityIdToRenderable, renderer);
                }
            } else {
                Utils.log('error renderableId : ' + renderableId + 'is not in the scene');
            }
        }

        if (this.atlasImage) {
            //process any tiles that are atlas images
            for (var entityId2 in entityIdToRenderable) {
                var renderableId2 = entityIdToRenderable[entityId2];
                var renderable2 = renderer._renderables[renderableId2];
                if (renderable2 && renderable2._entity) {
                    var entity2 = renderable2._entity;

                    if (entity2.tilePyramid.isAtlasTile(entity2.tileId)) {
                        this._processDownload(this.atlasImage, renderable2);
                    }
                }
            }
        }
    },

    parseQuaternion: function (qx, qy, qz) {
        //Since we know this is a unit quaternion we can calculate w
        var wSquared = 1.0 - (qx * qx + qy * qy + qz * qz);
        if (wSquared < MathHelper.zeroTolerance) {
            wSquared = 0.0;
        }
        return new Quaternion(Math.sqrt(wSquared), qx, qy, qz);
    }
};

Config.PanoramaExists = true;