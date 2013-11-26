function StreetsideCubeFaceTileSource(urlFormat, defaultSubdomain) {
	//var lodDelta = VectorMath.ceilLog2(tileWidth);
	var lodDelta = 8;
	this.getTileUrl = function (x, y, lod) {
		// translate the levelOfDetail to zoom
		// zoom level 0 represents a single tile, levelOfDetail = 0 represents a single pixel
		// so the translation is done by substracting the "levelOfDetail" of a single tile
		var zoom = lod - lodDelta;
		var quadTile = new TileId(zoom, x, y);

		if (QuadKey.isInBounds(quadTile)) {
			var quadKey;
			var subdomain;
			if (quadTile.levelOfDetail === 0) {
				if (defaultSubdomain != null) {
					quadKey = QuadKey.fromTileId(quadTile, true);
					subdomain = defaultSubdomain;
				}
				else {
					return null;
				}
			}
			else {
				quadKey = QuadKey.fromTileId(quadTile, false);
				subdomain = quadKey.charAt(quadKey.length - 1);
			}

			return urlFormat.replace('{quadkey}', quadKey).replace('{subdomain}', subdomain);
		}
	}
}

var QuadKey = {
	/// returns the QuadKey that would represent given TileId
	fromTileId: function (tileId, allowZeroLod) {
		var minLod = 1;
		if (allowZeroLod) {
			minLod = 0;
		}
		//Debug.assert(tileId.levelOfDetail >= minLod && QuadKey.isInBounds(tileId), 'tileId is outside of quad pyramid bounds');

		var quadKey = '';
		var ix = tileId.x;
		var iy = tileId.y;
		for (var i = 0; i < tileId.levelOfDetail; i++) {
			quadKey = ((ix & 1) + 2 * (iy & 1)).toString() + quadKey;
			ix >>= 1;
			iy >>= 1;
		}
		return quadKey;
	},
	/// checks whether this tile is in QuadKey based pyramid bounds
	isInBounds: function (tileId) {
		if (tileId.x < 0 || tileId.y < 0) {
			return false;
		}
		var count = 1 << tileId.levelOfDetail;
		if (tileId.x >= count || tileId.y >= count) {
			return false;
		}
		return true;
	}
};