var Map = function () {
		var self = this;
		self.frameCount = 0;
		self.culler = new TiledImagePyramidCuller;
	};

Map.prototype = {
	animationDurationMS: 1000,

	cullMap: function (mapRmlSource, camera, visibleSet, isCachedUrl) {
		var delta = this._cullMap(mapRmlSource.dimension, mapRmlSource.tileSize, mapRmlSource.minimumLod, mapRmlSource.tileOverlap, mapRmlSource.tileBorder, mapRmlSource, "front", camera, visibleSet, isCachedUrl);
		return delta;
	},

	_cullMap: function (dimension, tileSize, minimumLod, tileOverlap, tileBorder, map, cubeFaceName, camera, visibleSet, isCachedUrl) {
		if (!map.tilePyramid) {
			map.tilePyramid = new TiledImagePyramid(cubeFaceName, dimension, dimension, tileSize, tileSize, minimumLod, tileOverlap, tileBorder);
		}
		if (!map.tileCoverage) {
			map.tileCoverage = new TiledImagePyramidCoverageMap(map.tilePyramid.minimumLod, map.tilePyramid.finestLod);
		}

        if(!map.isCachedTile) {
            map.isCachedTile = function(x,y,lod) {
                return isCachedUrl(map.tileSource(x,y,lod));
            };
        }

		var delta = this.culler.cull(
		map.tilePyramid, map.tileCoverage, this.getMapToCubeTransform, camera.getViewProjectionTransform(), camera.getViewport().getWidth(), camera.getViewport().getHeight(), null, visibleSet, cubeFaceName, map.tileSource, map.isCachedTile, this.frameCount);

		this.removeRenderablesBeingProcessed(delta);

		return delta;
	},

	removeRenderablesBeingProcessed: function (delta) {
		if (this._renderablesBeingLoaded) {
			this.removeCancelled(this._renderablesBeingLoaded, delta);
		}

		if (this._renderablesBeingAnimated) {
			this.removeCancelled(this._renderablesBeingAnimated, delta);
		}
	},

	removeCancelled: function (list, delta) {
		for (var i = 0; i < delta.removed.length; i++) {
			var id = delta.removed[i].id;
			if (list[id]) {
				delete list[id];
			}
		}
	},

	getMapToCubeTransform: function (dimension, whichFace) {
		var centerUnitImageBaseImageResolution = Matrix4x4.createTranslation(-0.5, -0.5, 0).multiply(Matrix4x4.createScale(1.0 / dimension, 1.0 / dimension, 1.0));
		var distanceFromCenterOfBubble = 0.5;
		var faceTransformBaseImageResolution;

		switch (whichFace) {
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

	/**
	 * Initialize Camera Controller.
	 */
	createController: function (initialMapEntities, camera, cameraParameters) {
		var cameraController = new MapCameraController(camera);
		if (initialMapEntities && initialMapEntities[0]) {
			var mapSource = initialMapEntities[0].source;

			if (mapSource.startingPitch != undefined) {
				cameraController.setPitchAndHeading(mapSource.startingPitch, mapSource.startingHeading);
			}

			var leftBound = mapSource.bounds.left;
			var rightBound = mapSource.bounds.right;
			var topBound = mapSource.bounds.top;
			var bottomBound = mapSource.bounds.bottom;
			var leftRightDelta = rightBound - leftBound;
			while (leftRightDelta <= 0) {
				leftRightDelta += 2 * MathHelper.PI;
			}
			var borderBufferPercentage = 1.05;

			var maxAllowedFov = MathHelper.degreesToRadians(90);
			var maxHorizontalFov = Math.min(maxAllowedFov, leftRightDelta * borderBufferPercentage);
			var maxVerticalFov = Math.min(maxAllowedFov, (bottomBound - topBound) * borderBufferPercentage);
			var finalFov = Math.max(maxVerticalFov, Math.min(maxAllowedFov, Viewport.convertHorizontalToVerticalFieldOfView(camera.getViewport().getAspectRatio(), maxHorizontalFov)));

			//Make sure we check that if the final vertical fov when converted to horizontal is > 90 that we
			//make the vertical fov smaller.  Don't want horizontal or vertical fov to be > 90
			var maxFovAsHorizontal = Viewport.convertVerticalToHorizontalFieldOfView(camera.getViewport().getAspectRatio(), finalFov);
			finalFov = Viewport.convertHorizontalToVerticalFieldOfView(camera.getViewport().getAspectRatio(), Math.min(maxAllowedFov, maxFovAsHorizontal));

			cameraController.setVerticalFov(finalFov);
		}
		return cameraController;
	},

	/**
	 * Implements the logic to cull panorama entities and emit tiles.
	 */
	cull: function (mapEntities, camera, visibleSet, isCachedUrl) {
		var i, j, k, mapTiles, result = {
			added: [],
			removed: []
		};
		for (i = 0; i < mapEntities.length; ++i) {
			mapTiles = this.cullMap(mapEntities[i].source, camera, visibleSet, isCachedUrl);
			result.added = result.added.concat(mapTiles.added);
			result.removed = result.removed.concat(mapTiles.removed);
		}++this.frameCount;
		return result;
	},

	/**
	 * Creates renderables for tiles
	 */
	generateRenderables: function (visibleEntities, renderer) {
		var self = this;
		var i, renderable, renderables = [];
		if (!this._renderablesBeingLoaded) {
			this._renderablesBeingLoaded = {};
		}

		for (i = 0; i < visibleEntities.length; ++i) {
			(function () {
				var entity = visibleEntities[i];
				var callbackInfo = {};
				renderable = new TexturedQuadRenderable(entity.tileWidth, entity.tileHeight, entity.transform, entity.url, null, null, false);
				renderable._entity = entity;
				renderable.entityId = entity.id;
				renderable._order = entity.tileId.levelOfDetail
				// We don't fade temp tiles
				if (!entity.tileId.isTemp) {
					entity.fullyOpaque = false;
				} else {
					entity.fullyOpaque = true;
				}
				entity.loaded = false;
				renderables.push(renderable);
				self._renderablesBeingLoaded[entity.id] = renderable;
			}());
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

	fetch: function (entities, downloader) {
		var i;
		if (entities.removed) {
			// assumes 1 download per item.
			for (i = 0; i < entities.removed.length; ++i) {
				downloader.cancel(entities.removed[i].id);
			}
		}

		if (entities.updated) {
			//Update any pending downloads
			for (i = 0; i < entities.updated.length; ++i) {
				downloader.updatePriority(entities.updated[i].url, entities.added[i].priority);
			}
		}

		if (entities.added) {
			//Enqueue downloads.
			for (i = 0; i < entities.added.length; ++i) {
				downloader.downloadImage(entities.added[i].url, entities.added[i].priority, entities.added[i].id);
			}
		}
	},

	processDownloads: function (completed, entityIdToRenderable, renderer) {
		for (var i = 0; i < completed.length; ++i) {
			var img = completed[i];
			var renderableId = entityIdToRenderable[img.token];
			if (renderableId && renderer._renderables[renderableId]) {
				//Should we be reaching down directly to the renderer this way?
				renderer._renderables[renderableId]._material._texture._image = img;
				renderer._renderables[renderableId]._material._texture._isReady = true;
				renderer._renderables[renderableId]._material._texture._isDirty = true;
			} else {
				Utils.log('error renderableId : ' + renderableId + 'is not in the scene');
			}
		}
	}
};

Config.MapExists = true;
