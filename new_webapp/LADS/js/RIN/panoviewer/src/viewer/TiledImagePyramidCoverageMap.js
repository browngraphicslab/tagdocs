//
// This class manages walking up and down quad tree of tiles to compute what tiles are
// overlapping with deeper levels of the image pyramid.

var TiledImagePyramidCoverageMap = function(minimumLevelOfDetail, maximumLevelOfDetail) {
    var self = this,
        lod;

    if(minimumLevelOfDetail < 0) {
        throw 'minimumLevelOfDetail needs to be non negative';
    }
    if(maximumLevelOfDetail < 0) {
        throw 'maximimLevelOfDetail needs to be non negative';
    }
    if(!(minimumLevelOfDetail <= maximumLevelOfDetail)) {
        throw 'min should be less than or equal max lod';
    }

	self.x0 = -1;
    self.y0 = -1;
    self.x1 = -1;
    self.y1 = -1;
    self.levelOfDetail = maximumLevelOfDetail;
    self.minimumLevelOfDetail = minimumLevelOfDetail;
    self.occluderFlags = [];
    self.occludedFlags = [];

    for (lod = 0; lod <= self.levelOfDetail; ++lod) {
			self.occluderFlags.push({});
			self.occludedFlags.push({});
	}
};

TiledImagePyramidCoverageMap.prototype = {
    //Initializes with a new tile grid.
	initialize: function(levelOfDetail, x0, y0, x1, y1) {
		if (!(levelOfDetail >= 0)) {
            throw 'Expected ' + '(levelOfDetail >= 0)';
        }
		if (!(levelOfDetail <= this.occluderFlags.length - 1)) {throw 'Expected ' + '(levelOfDetail <= occluderFlags.length - 1)';}
		if (!(x0 < x1)) {throw 'Expected ' + '(x0 < x1)';}
		if (!(y0 < y1)) {throw 'Expected ' + '(y0 < y1)';}

		this.levelOfDetail = levelOfDetail;
		this.x0 = x0;
		this.y0 = y0;
		this.x1 = x1;
		this.y1 = y1;
	},

	// Marks a tile as an occluder.
	markAsOccluder: function(tileId, occluder) {
		this.setOccluderFlag(tileId.toString(), occluder);
	},

	// Must be called after initialize and before doing occlusion queries.
	calculateOcclusions: function() {
        var lod, x, y, bounds, occluded, tileId;
		for (lod = this.levelOfDetail; lod >= this.minimumLevelOfDetail; lod--) {
			if (lod != this.levelOfDetail) {
				bounds = this.getTileBoundsAtLod(lod);

				for (y = bounds.lodY0; y < bounds.lodY1; y++) {
					for (x = bounds.lodX0; x < bounds.lodX1; x++) {
						tileId = new TileId(lod, x, y);

						if (this.getOccluderFlag(tileId) !== undefined) {
							occluded =
								this.isChildIrrelevantOrOccluder(tileId, 0) &&
								this.isChildIrrelevantOrOccluder(tileId, 1) &&
								this.isChildIrrelevantOrOccluder(tileId, 2) &&
								this.isChildIrrelevantOrOccluder(tileId, 3);

							if (occluded) {
								this.setOccludedFlag(tileId, true);
								this.setOccluderFlag(tileId, true);
							} else {
								this.setOccludedFlag(tileId, false);
								this.setOccluderFlag(tileId, false);
							}
						}
					}
				}
			}
		}
	},

	//Returns true if the given tile is occluded by its descendents.
	isOccludedByDescendents: function(tileId) {
		return this.getOccludedFlag(tileId);
	},

	isChildIrrelevantOrOccluder: function(tileId, childIdx) {
		if (!((childIdx >= 0 && childIdx < 4))) {throw 'Expected ' + '(childIdx >= 0 && childIdx < 4)';}

		var childTileId = new TileId(tileId.levelOfDetail + 1, (tileId.x << 1) + childIdx % 2, (tileId.y << 1) + childIdx / 2);

		var bounds = this.getTileBoundsAtLod(childTileId.levelOfDetail);

		if (childTileId.x >= bounds.lodX0 && childTileId.x < bounds.lodX1 &&
			childTileId.y >= bounds.lodY0 && childTileId.y < bounds.lodY1) {
			var occluderFlag = this.getOccluderFlag(childTileId);
			return (occluderFlag === undefined) || occluderFlag;
		}
		else {
			// Child is off the grid, so it's clearly irrelevant.
			return true;
		}
	},

	getOccluderFlag: function(tileId) {
		return this.occluderFlags[tileId.levelOfDetail][tileId];
	},

	setOccluderFlag: function(tileId, occluderFlag) {
		this.occluderFlags[tileId.levelOfDetail][tileId] = occluderFlag;
	},

	getOccludedFlag: function(tileId) {
		return this.occludedFlags[tileId.levelOfDetail][tileId];
	},

	setOccludedFlag: function(tileId, occludedFlag) {
		this.occludedFlags[tileId.levelOfDetail][tileId] = occludedFlag;
	},

	getTileBoundsAtLod: function(lod) {
		var lodDiff = this.levelOfDetail - lod;

        return {
            lodX0 : this.x0 >> lodDiff,
            lodY0 : this.y0 >> lodDiff,
            lodX1 : MathHelper.divPow2RoundUp(this.x1, lodDiff),
            lodY1 : MathHelper.divPow2RoundUp(this.y1, lodDiff)
        };
	},

	getDescendents: function(tileId, filter) {
        var lod, x, y, bounds, occluded, tileId, result=[];
		for (lod = tileId.levelOfDetail+1; lod <= this.levelOfDetail; lod++) {
			bounds = this.getTileBoundsAtLod(lod);
			for (tileid in this.occluderFlags[lod]) {
				if (bounds.lodX0 <= tileid.x && tileid.x <= bounds.lodX1 &&
					bounds.lodY0 <= tileid.y && tileid.y <= bounds.lodY1)
					result.push(tileId.toString());
			}

		}
		return result;
	}

}
