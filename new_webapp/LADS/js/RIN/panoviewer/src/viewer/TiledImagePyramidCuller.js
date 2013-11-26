// This is a helper class that computes the incremental change
// in visible tiles for the present model-view-projection and
// viewport setups. The actually culling and LOD determination
// is done by TiledImagePyramid.getVisibleTiles(), but this
// helper does the rest by figuring out the incremental changes,
// keeping old tiles alive before new and proper tiles become
// available and faded in, etc
//
var TiledImagePyramidCuller = function () {
};

var tileDebugPrint = false;
var prevVisibleTiles = {};


TiledImagePyramidCuller.prototype = {

	cull: function(tilePyramid,
				  tileCoverage,
				  getModelTransform,
				  viewProjection,
				  viewportWidth,
				  viewportHeight,
				  clip,
				  visibleSet,
				  prefix,
				  tileSource,
                  isTileAvailable,
				  frameCount,
                  useLowerLod) {
        var delta = { added: [], updated:[], removed: [] };
        var tileResult = tilePyramid.getVisibleTiles(getModelTransform,
                                                     viewProjection,
                                                     viewportWidth,
                                                     viewportHeight,
                                                     clip,
                                                     useLowerLod);

		if (tileDebugPrint) {
			if (prevVisibleTiles && prevVisibleTiles[prefix]) {
				for (var i=0; i<prevVisibleTiles[prefix].length; i++) {
					var j;
					for (j=0; j<tileResult.visibleTiles.length; j++)
						if (tileResult.visibleTiles[j].toString() == prevVisibleTiles[prefix][i].toString())
							break;
					if (j==tileResult.visibleTiles.length)
						Utils.log("frame="+frameCount+" getVisibleTiles remove "+prefix+":"+prevVisibleTiles[prefix][i]);
				}
				for (var i=0; i<tileResult.visibleTiles.length; i++) {
					var j;
					for (j=0; j<prevVisibleTiles[prefix].length; j++)
						if (tileResult.visibleTiles[i].toString() == prevVisibleTiles[prefix][j].toString())
							break;
					if (j==prevVisibleTiles[prefix].length)
						Utils.log("frame="+frameCount+" getVisibleTiles added "+prefix+":"+tileResult.visibleTiles[i]);
				}
			}
			prevVisibleTiles[prefix] = tileResult.visibleTiles.slice();
		}

        //Early out and don't bother computing occulder grid logic.
        if (tileResult.visibleTiles.length === 0) {
            //Remove tiles that now out of view.
            for (var i = 0; i < visibleSet.length; ++i) {
                var tile = visibleSet[i];
                if (tile.lastTouched !== frameCount && tile.tilePyramid === tilePyramid) {
                    delta.removed.push({ id: visibleSet[i].id });
                }
            }
            return delta;
        }

        var viewportTransform = GraphicsHelper.createViewportToScreen(viewportWidth, viewportHeight);
        //Used for LOD priority
		var modelTransform = getModelTransform(tilePyramid.baseImageWidth, tilePyramid.name);
        var modelToScreen = viewportTransform.multiply(viewProjection.multiply(modelTransform));

        var visibleTiles = [];
        visibleTiles.byId = {};
        for (var i = 0; i < tileResult.visibleTiles.length; ++i) {
            var tileId = tileResult.visibleTiles[i];
			tileId.isTemp = false;
            tileId.isLowerLod = useLowerLod;
            tileId.cached = isTileAvailable(tileId.x, tileId.y, tileId.levelOfDetail);

            var priority = 0;
            visibleTiles.push(tileId);
            visibleTiles[visibleTiles.length-1].priority = priority;
            visibleTiles.byId[tileId.toString()] = true;

			// Add ancestors just in case that they can be available before the
			// proper tile, e.g. the proper tile is not downloaded yet but an
			// ancestor is already in the cache. TODO: actually we have all the
			// information to make it entirely deterministic: we know which tiles
			// are available in the memory cache, it's just that the object that
			// holds such info is not passed down to this level. Also, the
			// MemoryCache object uses url as keys, not tileIds, and the mechanism
			// to go from tileIds to URLs is also upper level, not here. We should
			// pass such info down here, maybe through a isTileAvailable() callback
			// function, so that we be more intelligent here: when proper tile is
			// also in MemoryCache, we just use it, and don't animate it in; if
			// not, and if some ancestors are in cache, or even some
			// descendents are in cache and provide full coverage, we can use them
			// too. These are better than adding ancestors blindly as a preemptive
			// measure.
			// Add ancestors ONLY IF this is a new tile not in the current visibleSet yet
			// Otherwise this ancestors will be repeated added every frame
            if (! visibleSet.byId[prefix + tileId.toString()]) {
				var ancestorId = tileId;
				var maxDepth = 1, depth=1;
				while (ancestorId.levelOfDetail > tilePyramid.minimumLod
						&& depth++ <= maxDepth) {
					ancestorId = ancestorId.getParent();
					if (!visibleTiles.byId[ancestorId.toString()]) {
						// This is a temp (i.e. temoprary) tile because this is
						// not exactly what we want; however if it's available
						// we'll use it temporarily until the proper tile comes
						// in
						ancestorId.isTemp = true;
						visibleTiles.push(ancestorId);
						visibleTiles.byId[ancestorId.toString()] = true;
						visibleTiles[visibleTiles.length-1].priority = priority;
                        ancestorId.cached = isTileAvailable(ancestorId.x, ancestorId.y, ancestorId.levelOfDetail);
					}
				}
			}
        }

        visibleTiles.byId = null;

        for (var i = 0; i < visibleTiles.length; ++i) {
            var tileId = visibleTiles[i];
            var id = prefix + tileId.toString();
            if (!visibleSet.byId[id]) {
                var tileDimension = tilePyramid.getTileDimensions(tileId);
                var tileTransform = tilePyramid.getTileTransform(tileId);
                var tileTransformModelSpace = modelTransform.multiply(tileTransform);
                //Compute the center for transform purposes.

                var tileUrl = tileSource(tileId.x, tileId.y, tileId.levelOfDetail);

                delta.added.push({
                    type: 'tile',
                    id: id,
                    tileWidth: tileDimension.x,
                    tileHeight: tileDimension.y,
                    tileId: tileId,
                    transform: tileTransformModelSpace,
                    tilePyramid: tilePyramid,
                    lastTouched: tileId.isTemp?-1:frameCount,
                    face:prefix,
                    priority:priority,
                    url: tileUrl
                });
            } else {
                visibleSet.byId[id].lastTouched = tileId.isTemp?-1:frameCount;
                visibleSet.byId[id].priority = Math.max(tileId.priority, visibleSet.byId[id].priority);
                delta.updated.push(id);
            }
        }

		var old_and_new = (delta.added || []).concat(visibleSet || []);

		var boundAtLod = [];
        var maxLOD = Number.MIN_VALUE;
		var minLOD = Number.MAX_VALUE;
        for (var i = 0; i < old_and_new.length; ++i) {
			if (old_and_new[i].tilePyramid === tilePyramid) {
		var tileId = old_and_new[i].tileId;
				var lod = tileId.levelOfDetail;
				if (! boundAtLod[lod]) {
					boundAtLod[lod] = {};
					boundAtLod[lod].x0 = Number.MAX_VALUE;
					boundAtLod[lod].y0 = Number.MAX_VALUE;
					boundAtLod[lod].x1 = Number.MIN_VALUE;
					boundAtLod[lod].y1 = Number.MIN_VALUE;
				}
				var b  = boundAtLod[lod];
		b.x0 = Math.min(b.x0, tileId.x);
		b.y0 = Math.min(b.y0, tileId.y);
		b.x1 = Math.max(b.x1, tileId.x + 1);
		b.y1 = Math.max(b.y1, tileId.y + 1);
				maxLOD = Math.max(maxLOD, tileId.levelOfDetail);
				minLOD = Math.min(minLOD, tileId.levelOfDetail);

				if (Math.abs(b.x0-b.x1) > 100)
					debugger;
			}
        }
		// create bound at max lod
		var x0 = Number.MAX_VALUE;
		var y0 = Number.MAX_VALUE;
		var x1 = Number.MIN_VALUE;
		var y1 = Number.MIN_VALUE;
		for (var l = minLOD; l <= maxLOD; l++) {
			if (boundAtLod[l]) {
				var b = boundAtLod[l];
				var diff = maxLOD - l;
		x0 = Math.min(b.x0<<diff, x0);
		y0 = Math.min(b.y0<<diff, y0);
		x1 = Math.max(b.x1<<diff, x1);
		y1 = Math.max(b.y1<<diff, y1);
			}
		}

        tileCoverage.initialize(maxLOD, x0, y0, x1, y1);

        for (var i = 0; i < old_and_new.length; ++i) {
            var tile = old_and_new[i];

            if (tile.tilePyramid === tilePyramid && tile.lastTouched === frameCount) {
				// This is a tile that's proper for the current frame.
				if (! tile.fullyOpaque && ! tile.tileId.isTemp) {
					// If a proper tile is not yet loaded, or is not fully opaque, then
					// we'll still need tiles that previously covered its location to
					// keep the space filled, until the proper tiles becomes fully
					// available and opaque. In other words, a proper tile that is not
					// yet fully opaque keeps its ancestors and descendents alive.
					var descendents = tileCoverage.getDescendents(tile.tileId,
						function(tileIdStr) {
							return visibleSet.byId[prefix+tileIdStr]==undefined?false:true;
						});
					// Sanity check
					/*
					for (var k=0; k<descendents.length; k++) {
						if (visibleSet.byId[prefix+descendents[k]].lastTouched===frameCount)
							throw "crazy";
					}
					*/
					// the correct tile is not fully in or is being loaded,
					// so we still need its descendent to cover for it
					for (var k=0; k<descendents.length; k++) {
						visibleSet.byId[prefix+descendents[k]].keep = true;
                    }

					// Keep ancestors alive
					var ancestorId = tile.tileId;
					while (ancestorId.levelOfDetail > tilePyramid.minimumLod) {
						ancestorId = ancestorId.getParent();
						if (visibleSet.byId[prefix+ancestorId] != undefined) {
							visibleSet.byId[prefix+ancestorId].keep = true;
						}
					}
				}
            }
        }

		// Signal removal of all tiles in the visible set that are not proper for
		// current view AND not kept alive by proper tiles that are not ready yet
        for (var idStr in visibleSet.byId) {
            var tile = visibleSet.byId[idStr];
            if (!tile.keep && tile.lastTouched !== frameCount && tile.tilePyramid === tilePyramid) {
				var justAdded = false;
		for(var j = 0; j < delta.added.length;++j) {
			if(delta.added[j] === idStr) {
			delete delta.added[j];
						justAdded = true;
						break;
			}
		}

				if (! justAdded) {
			delta.removed.push({ id: idStr });
					for (var u=0; u<delta.updated.length; u++) {
						if (idStr == delta.updated[i])
							debugger;
					}
				}
            } if (tile.keep) {
				tile.keep = false;
            }
        }

        return delta;
    }
};
