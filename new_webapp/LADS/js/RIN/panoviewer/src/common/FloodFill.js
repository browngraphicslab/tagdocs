
var PolygonTileFloodFiller = {

    floodFill: function (gridWidth, gridHeight, polygon, startingTile) {
        this.cachedCrossings = {};
        if (startingTile == null) {
            if (polygon.length == 0) {
                return [];
            }

            startingTile = this.calculateStartingTile(gridWidth, gridHeight, polygon);
        }

        var tileQueue = [startingTile];
        var tilesEnqueued = new Array(gridWidth * gridHeight);
        tilesEnqueued[startingTile.y * gridWidth + startingTile.x] = true;
        //var tileGrid = [];
        var result = [];

        while (tileQueue.length > 0) {
            var tile = tileQueue.shift();
            result.push(tile);

            var neighbors = [];

            if (this.tileCenterInPolygon(tile, polygon) || this.gridCrossesPolygon(tile, polygon)) {
                neighbors.push(this.getLeftNeighbor(tile));
                neighbors.push(this.getRightNeighbor(tile));
                neighbors.push(this.getTopNeighbor(tile));
                neighbors.push(this.getBottomNeighbor(tile));
            }

            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];

                if (this.isValidTile(neighbor, gridWidth, gridHeight) && !tilesEnqueued[neighbor.y * gridWidth + neighbor.x]) {
                    tileQueue.push(neighbor);
                    tilesEnqueued[neighbor.y * gridWidth + neighbor.x] = true;
                }
            }
        }

        this.cachedCrossings = null;

        return result;
    },

    calculateStartingTile: function (gridWidth, gridHeight, polygon) {
        var center = {x: 0, y: 0};
        for (var i = 0; i < polygon.length; i++) {
            center.x += polygon[i].x;
            center.y += polygon[i].y;
        }
        center.x /= polygon.length;
        center.y /= polygon.length;

        center.x = Math.floor(center.x);
        center.y = Math.floor(center.y);

        center.x = Math.max(0, center.x);
        center.y = Math.max(0, center.y);

        center.x = Math.min(gridWidth - 1, center.x);
        center.y = Math.min(gridHeight - 1, center.y);

        return center;
    },

    getLeftNeighbor: function (tile) {
        return {x: tile.x - 1, y: tile.y};
    },

    getRightNeighbor: function (tile) {
        return {x: tile.x + 1, y: tile.y};
    },

    getTopNeighbor: function (tile) {
        return {x: tile.x, y: tile.y - 1};
    },

    getBottomNeighbor: function (tile) {
        return {x: tile.x, y: tile.y + 1};
    },

    tileCenterInPolygon: function (tile, polygon) {
        //check center of tile
        return this.pointInPolygon({x: tile.x + 0.5, y: tile.y + 0.5}, polygon);
    },

    isValidTile: function (tile, gridWidth, gridHeight) {
        if (isNaN(tile.x) || isNaN(tile.y) || tile.x < 0 || tile.y < 0 || tile.x >= gridWidth || tile.y >= gridHeight) {
            return false;
        }
        return true;
    },

    normalizeNumber: function (number) {
        if (number >= 0) {
            return 1;
        }

        return -1;
    },

    gridCrossesPolygon: function (gridUpperLeftPoint, polygon) {
        //Assume gridUpperLeftPoint has x and y properties and that they are ints
        var gridUpperRightPoint = {x: gridUpperLeftPoint.x + 1, y: gridUpperLeftPoint.y};
        var gridLowerRightPoint = {x: gridUpperLeftPoint.x + 1, y: gridUpperLeftPoint.y + 1};
        var gridLowerLeftPoint = {x: gridUpperLeftPoint.x, y: gridUpperLeftPoint.y + 1};

        //var result = {};
        //
        //if (countCrossings(gridUpperLeftPoint, polygon) !== countCrossings(gridUpperRightPoint, polygon)) {
        //    result.top = true;
        //}
        //if (countCrossings(gridLowerLeftPoint, polygon) !== countCrossings(gridLowerRightPoint, polygon)) {
        //    result.bottom = true;
        //}
        //if (countCrossings(gridUpperLeftPoint, polygon, true) !== countCrossings(gridLowerLeftPoint, polygon, true)) {
        //    result.left = true;
        //}
        //if (countCrossings(gridUpperRightPoint, polygon, true) !== countCrossings(gridLowerRightPoint, polygon, true)) {
        //    result.right = true;
        //}
        //
        //return result;

        if (this.countCrossings(gridUpperLeftPoint, polygon) !== this.countCrossings(gridUpperRightPoint, polygon)) {
            return true;
        }
        else if (this.countCrossings(gridLowerLeftPoint, polygon) !== this.countCrossings(gridLowerRightPoint, polygon)) {
            return true;
        }
        else if (this.countCrossings(gridUpperLeftPoint, polygon, true) !== this.countCrossings(gridLowerLeftPoint, polygon, true)) {
            return true;
        }
        else if (this.countCrossings(gridUpperRightPoint, polygon, true) !== this.countCrossings(gridLowerRightPoint, polygon, true)) {
            return true;
        }
        else {
            return false;
        }
    },

    //Use crossing test.  If a ray going out from the point crosses an odd number of polygon line segments, then it's inside the polygon.  Else it's outside.
    //Logic is simple if we cast a ray to the right (positive x) direction
    //Short description: http://erich.realtimerendering.com/ptinpoly/
    //Longer description: Graphics Gems IV, Edited by Paul S Heckbert 1994, page 26
    pointInPolygon: function (point, polygon) {
        var crossCount = this.countCrossings(point, polygon);

        //If the ray crossed an odd number of segments, then the point is inside the polygon.
        return (crossCount % 2 === 1);
    },

    //var cachedHorizontalCrossings = {};
    //var cachedVerticalCrossings = {};
    cachedCrossings: {},

    countCrossings: function (point, polygon, castRayDown) {
        var adjustedPolygon = [];
        var i, j;
        var crossCount = 0;

        var hash = point.x + ',' + point.y + ((castRayDown) ? ',down' : ',right');

        if (this.cachedCrossings[hash] != null) {
            return this.cachedCrossings[hash];
        }

        if (castRayDown) {
            //if (cachedVerticalCrossings(

            //just switch the x and y of the polygon, then the rest of the math works out correctly
            for (i = 0; i < polygon.length; i++) {
                adjustedPolygon.push({x: polygon[i].y - point.y, y: polygon[i].x - point.x});
            }
        }
        else {
            for (i = 0; i < polygon.length; i++) {
                adjustedPolygon.push({x: polygon[i].x - point.x, y: polygon[i].y - point.y});
            }
        }

        for (i = 0; i < adjustedPolygon.length; i++) {
            j = i + 1;
            if (j >= adjustedPolygon.length) {
                j = 0;
            }

            var y0 = adjustedPolygon[i].y;
            var y1 = adjustedPolygon[j].y;
            var x0 = adjustedPolygon[i].x;
            var x1 = adjustedPolygon[j].x;

            var ySign0 = this.normalizeNumber(y0);
            var ySign1 = this.normalizeNumber(y1);
            var xSign0 = this.normalizeNumber(x0);
            var xSign1 = this.normalizeNumber(x1);

            if (ySign0 != ySign1) {
                //Points are on opposite sides of the ray being cast to the right, then the segment may cross.

                if (xSign0 === 1 && xSign1 === 1) {
                    //Points are both to the right of the point, so the segment must cross the ray.
                    crossCount++;
                }
                else if (xSign0 !== xSign1) {
                    //One point is to the right of the point and the other is to the left.  Need to actually do math to calculate if it intersects.
                    //Get line formula in format of y = mx + b, then calculate x-intercept.  Hint, it's b.
                    //If the x-intercept is positive, then the segment must cross the ray.

                    //Note, since we know x0 and x1 have different signs, we don't need to check (x0-x1) for being 0
                    var m = (y0 - y1) / (x0 - x1);
                    var b = y0 - (m * x0);
                    if (b >= 0) {
                        crossCount++;
                    }
                }
            }
        }

        this.cachedCrossings[hash] = crossCount;
        return crossCount;
    }
};
