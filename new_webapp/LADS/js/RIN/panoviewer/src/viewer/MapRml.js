var VETileSource = (function() {
    // Details of the Bing Maps tile system are here.
    // Their scheme uses quadkeys. Zoom level 1 in their schema is lod 9 in ours.
    // http://msdn.microsoft.com/en-us/library/bb259689.aspx

    var GEN_KEY = '863';                // The VE tile sourc uses generation ids to invalidate cache when new imagery is
                                        // published. This is what the g=X parameter is form. There is a service to get
                                        // the latest information, but we'll use fixed GEN ID for simplicity.

    var TILE_URL_FORMAT = 'http://ecn.t{stripe}.tiles.virtualearth.net/tiles/{mode}{quadkey}?g={generationid}&mkt=en-us&lbl=l1&stl=h&shading=hill&n=z';



    return function(mode) {
		// Fields
		var self = this;
        self.tileBorder = 0;
        self.tileOverlap = 0;
        self.tileSize = 256;
        self.minLevel = 9; // 9 is highest empty level , that is we start out with 4 tiles for the world.
        self.maxLevel = self.minLevel + 19 - 1; // 19 actual tiled levels
        self.dimension = 1 << self.maxLevel;  // Bing Maps tiles are a filled multiple of tile size. Unlike DZIs or panoramas.


        // Helpers
        var getQuadKey = function(x, y, level) {
            var key = [];
            for (var i = level; i >= self.minLevel; i--) {
                var digit = 0;
                var mask = 1 << (i - self.minLevel);

                if ((x & mask) != 0) digit += 1;
                if ((y & mask) != 0) digit += 2;

                key.push(digit);
            }
            return key;
        };

		// Properties
		self.mode = mode ? mode : this.Modes.AERIAL;


		self.getTileUrl = function (x, y, level) {
		    var	quadKey = getQuadKey(x, y, level),
                stripe =  quadKey[quadKey.length - 1], //We use the last digit of quad key to stripe network request across for Tile front ends.
                tileUrl;


            tileUrl = TILE_URL_FORMAT.replace('{stripe}', stripe)
                                     .replace('{mode}', self.mode)
                                     .replace('{quadkey}', quadKey.join(''))
                                     .replace('{generationid}', GEN_KEY);
			return tileUrl;
		};
};}());

// Arguments for the constructor.
VETileSource.Modes = {
	AERIAL: 'a',
	HYBRID: 'h',
	ROAD: 'r'
};

var MapRml = {
	create: function () {
		var rml,
            veTileSource = new VETileSource(VETileSource.Modes.ROAD);

		try {
			rml = {
				id: 'map',
				type: 'map',
				source: {
					'dimension': veTileSource.dimension,
					'tileSize': veTileSource.tileSize,
					'tileOverlap': veTileSource.tileOverlap,
					'tileBorder': veTileSource.tileBorder,
					'minimumLod': veTileSource.minLevel,
                    //TODO bounds, view stuff are pano camera controller specific should get removed once map cam controller g
                    //    gets fleshed out.
					'bounds': {
						'left': 0,
						'right': MathHelper.twoPI,
						'top': MathHelper.halfPI,
						'bottom': -MathHelper.halfPI
					},
					'startingPitch': 0,
					'startingHeading': 0,
					'projectorAspectRatio': 1,
					'projectorFocalLength': 0.5,
					'tileSource': veTileSource.getTileUrl,
				}
			};
		} catch (e) {
			if (window.console) {
				console.log(e);
			}
			return null;
		}

		return rml;
	},
};
