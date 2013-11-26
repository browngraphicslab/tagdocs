/**
 * @fileoverview This contains utilies for computed tiled image level of detail.
 */

var TileId = function(levelOfDetail, x, y) {
    var self = this;
    self.x = Math.floor(x);
    self.y = Math.floor(y);
    self.levelOfDetail = Math.floor(levelOfDetail);
};

TileId.prototype = {
    hasParent : function () {
        return this.levelOfDetail > 0;
    },

    getParent : function () {
       if(!this.hasParent()) {
           throw '0 level does not have a parent';
       }
       return new TileId(this.levelOfDetail - 1, this.x >> 1, this.y >> 1);
    },

    getChildren : function () {
        var childX  = this.x << 1,
            childY  = this.y << 1;
        return [new TileId(this.levelOfDetail + 1, childX,     childY) ,
                new TileId(this.levelOfDetail + 1, childX + 1, childY) ,
                new TileId(this.levelOfDetail + 1, childX,     childY + 1),
                new TileId(this.levelOfDetail + 1, childX + 1, childY + 1)];
    },

    isChildOf : function (other) {
        if(this.levelOfDetail <  other.levelOfDetail) {
            return false;
        }

        var lodDifference = this.levelOfDetail - other.levelOfDetail;
        return (this.x >> this.levelOfDetail) === other.x &&
               (this.y >> this.levelOfDetail) === other.y;
    },

    equals : function(other) {
        return this.x === other.x && this.y === other.y && this.levelOfDetail  === this.levelOfDetail;
    },

    toString: function() {
        return '(' + this.x + ',' + this.y + ',' + this.levelOfDetail + ')';
    }
};

/**
 * This class has all the math around determining LOD and rendering tiled
 * content. Note here baseImage dimensions are of the original imagery at the
 * finest level of detail (the base of the mip-map pyramid.) Here tileWidth and
 * tileHeight are dimensions of source pixels in tiles thus do not include
 * overlap or borders.
 */
var TiledImagePyramid = function (name, baseImageWidth, baseImageHeight, tileWidth, tileHeight, minimumLod, tileOverlap, tileBorder, atlasImage) {
    if(!baseImageWidth || !baseImageHeight || !tileWidth || !tileHeight) {
        throw 'Expected baseImageWidth baseImageHeight tileWidth tileHeight as positive integer arguments';
    }

    this.baseImageWidth = baseImageWidth;
    this.baseImageHeight = baseImageHeight;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.minimumLod = minimumLod || 0;
    this.finestLod = MathHelper.ceilLog2(Math.max(baseImageWidth, baseImageHeight));
    this.tileOverlap = tileOverlap || 0;
    this.tileBorder = tileBorder || 0;

    this.atlasImage = atlasImage;

    this.name = name;

    this.lodHistory = {};
    this.callCount = 0;
}

var debugReturnedTiles = false;
var prevReturnedTiles = {};

TiledImagePyramid.prototype = {
    isAtlasTile: function (tileId) {
        return (this.atlasImage && tileId.levelOfDetail == this.minimumLod && tileId.x == 0 && tileId.y == 0);
    },
    
    getLodWidthInTiles : function(lod) {
        return MathHelper.divRoundUp(MathHelper.divPow2RoundUp(this.baseImageWidth,  this.finestLod - lod), this.tileWidth);    
    },

    getLodHeightInTiles : function(lod) {
        return MathHelper.divRoundUp(MathHelper.divPow2RoundUp(this.baseImageHeight,  this.finestLod - lod), this.tileHeight);    
    },

    getLodWidth : function(lod) {
        return MathHelper.divPow2RoundUp(this.baseImageWidth, this.finestLod - lod);
    },

    getLodHeight : function(lod) {
        return MathHelper.divPow2RoundUp(this.baseImageHeight, this.finestLod - lod);
    },

    getEdgeFlags: function(tileId) {
        return {
            isLeft  : tileId.x === 0 ,
            isRight : tileId.x === this.getLodWidthInTiles(tileId.levelOfDetail) - 1,
            isTop : tileId.y === 0 ,
            isBottom : tileId.y === this.getLodHeightInTiles(tileId.levelOfDetail) - 1 
        };
    },

    //Returns a Vector2 of the actual tile size.
    getTileDimensions: function (tileId) {
        //(1) We first compute what size (not including overlap) 
        //(2) We add overlap + border to compute physical size of the image.
        var lodWidth = this.getLodWidth(tileId.levelOfDetail);
        var lodHeight = this.getLodHeight(tileId.levelOfDetail);
        
        var width, height;

        if (this.isAtlasTile(tileId)) {
            width = lodWidth + (2 * this.tileBorder);
            height = lodHeight + (2 * this.tileBorder);
        }
        else {
            var edgeFlags = this.getEdgeFlags(tileId);

            //Max X assuming full tile width.
            var xMax = tileId.x * this.tileWidth + this.tileWidth - 1;
            //Take into account fractional tiles on boundary.
            width = (xMax < lodWidth)? this.tileWidth : this.tileWidth - (xMax - lodWidth);
            if(edgeFlags.isLeft || edgeFlags.isRight) {
                width += this.tileOverlap;
                width += this.tileBorder;
            }  else {
                //Interior tile.
                width += 2*this.tileOverlap;
            }

            var yMax = tileId.y*this.tileHeight + this.tileHeight - 1;
            height = (yMax < lodHeight)? this.tileHeight: this.tileHeight - (yMax - lodHeight);

            if(edgeFlags.isTop || edgeFlags.isBottom) {
                height += this.tileOverlap;
                height += this.tileBorder;
            } else {
                height += 2*this.tileOverlap;
            }
        }

        //Takes into acount border & overlap thus is the real texture size.
        var tileDimension = new Vector2(width, height);

        return tileDimension;
    },

    /**
     * Get the transform from tile's coordinates to base-image coordinates (uniform scale + translation.)
     */
    getTileTransform: function(tileId) {
        var scale = 1 << (this.finestLod - tileId.levelOfDetail); 

        var edgeFlags = this.getEdgeFlags(tileId);

        //Single Image Texture upsampled to Base Image Texture Space. 
        var scaleTransform = Matrix4x4.createScale(scale, scale, 1.0);
        var xPos = tileId.x * this.tileWidth;
        
        var lodHeight = this.getLodHeight(tileId.levelOfDetail);
        var yMax = tileId.y*this.tileHeight + this.tileHeight;
        var height = (yMax < lodHeight)? this.tileHeight: this.tileHeight - (yMax - lodHeight);
        //We flip but have to take into account partial tiles at the bottom . We don't do any factoring for overlap.
        var yPos = lodHeight - (height + tileId.y * this.tileHeight);

        var overlapTransform = Matrix4x4.createTranslation(edgeFlags.isLeft? -this.tileBorder: -this.tileOverlap,
                                                           edgeFlags.isTop?  -this.tileBorder: -this.tileOverlap,
                                                           0.0);

        //Position the tile in base image texture space.
        var translation = Matrix4x4.createTranslation(xPos, yPos, 0.0);

        return scaleTransform.multiply(translation.multiply(overlapTransform));
    },
    
    /**
     * Computes the level detail given a ratio of texels to pixels.
     */
    getLodFromTexelToPixelRatio : function(texelToPixelRatio) {
        return this.finestLod - MathHelper.logBase(texelToPixelRatio,2);
    },

    /**
     * Calculates the finest level of detail to use based on the render level of detail.
     */
    getDiscreteLod: function (lod) {
        // Round to the nearest LOD based on area, rather than rounding in log space. This means
        // rounding about N + Log_2(3/2) instead of N + 0.5.
        var renderLod = (lod - Math.floor(lod) < 0.5849625) ? Math.floor(lod) : Math.ceil(lod);


        // Clamp to [coarsestLod, this.finestLod], which causes the coarsest LOD to be shown even if it's being downsampled
        // by several levels.
        return MathHelper.clamp(renderLod, this.minimumLod, this.finestLod);

    },
    /**
     * The approach taken here is to average the texel/pixel ratio across all
     * of the line segments of the polygon.
     */ 
    getTexelRatio : function(screenSpacePolygon, textureSpacePolygon) {
        if(screenSpacePolygon.length !== textureSpacePolygon.length) {
            throw 'expected two equal length arrays';
        }

        var v0Idx = screenSpacePolygon.length - 1;
        var minTexelToPixelRatio = Number.MAX_VALUE;
        var maxTexelToPixelRatio = -Number.MAX_VALUE;
        var numberOfSegments = 0;
        var totalTexelToPixelRatio = 0;
        var texelLengths = [];
        var pixelLengths = [];
        for(var v1Idx = 0; v1Idx < screenSpacePolygon.length; ++v1Idx) {
            var baseImageSpaceV0X = textureSpacePolygon[v0Idx].x; //coords in base image
            var baseImageSpaceV0Y = textureSpacePolygon[v0Idx].y;
            var baseImageSpaceV1X = textureSpacePolygon[v1Idx].x; 
            var baseImageSpaceV1Y = textureSpacePolygon[v1Idx].y;

            //ndc goes [-1,-1]x[1,1]
            var screenSpaceV0X = screenSpacePolygon[v0Idx].x; //coords in display window
            var screenSpaceV0Y = screenSpacePolygon[v0Idx].y; 
            var screenSpaceV1X = screenSpacePolygon[v1Idx].x; 
            var screenSpaceV1Y = screenSpacePolygon[v1Idx].y; 

            var dx = screenSpaceV1X - screenSpaceV0X;
            var dy = screenSpaceV1Y - screenSpaceV0Y;

            var du = baseImageSpaceV1X - baseImageSpaceV0X;
            var dv = baseImageSpaceV1Y - baseImageSpaceV0Y;

            var texelLength = Math.sqrt(du*du + dv*dv);
            var pixelLength = Math.sqrt(dx*dx + dy*dy);
            if (pixelLength != 0) {
                var texelToPixelRatio = texelLength / pixelLength;
                minTexelToPixelRatio = Math.min(minTexelToPixelRatio, texelToPixelRatio);
                maxTexelToPixelRatio = Math.max(maxTexelToPixelRatio, texelToPixelRatio);
                totalTexelToPixelRatio += texelToPixelRatio;
                ++numberOfSegments;
            }
            texelLengths.push(texelLength);
            pixelLengths.push(pixelLength);
            v0Idx = v1Idx;
        }
        return {
            meanTexelToPixelRatio: totalTexelToPixelRatio/numberOfSegments,
            minTexelToPixelRatio: minTexelToPixelRatio,
            maxTexelToPixelRatio: maxTexelToPixelRatio,
            texelLengths: texelLengths,
            pixelLengths: pixelLengths
        };
    },

    _isInvalidNdcSpacePolygon: function (poly) {
        if (poly.length < 3) {
            return true;
        }

        if (!poly[0].equals) {
            return true;
        }

        for (var i = 1; i < poly.length; i++) {
            if (!poly[0].equals(poly[1])) {
                return false;
            }
        }

        return true;
    },

    /**
     * Returns the list of visible tiles. 
     */
    getVisibleTiles : function(getModelTransform, viewProjectionTransform, viewportWidth, viewportHeight, textureSpaceClipRect, useLowerLod) {
        var viewportTransform = GraphicsHelper.createViewportToScreen(viewportWidth, viewportHeight);
        var visibleTiles = [];
        //This will project and clip the polygon and provide NDC and texture space versions of the clipped polygon.
        var clippedPolygon = this.getClippedPolygon(getModelTransform, viewProjectionTransform);


        if(this._isInvalidNdcSpacePolygon(clippedPolygon.ndcSpacePolygon)) {
            return {
                visibleTiles: visibleTiles,
                textureSpacePolygon: clippedPolygon.textureSpacePolygon
            };
        }

        var textureSpacePolygon = [];
        var screenSpacePolygon = [];
        for(var i = 0; i < clippedPolygon.ndcSpacePolygon.length; ++i) {
            //After we've clipped we don't use W (or Z for that matter).
            clippedPolygon.textureSpacePolygon[i].x /= clippedPolygon.textureSpacePolygon[i].w;
            clippedPolygon.textureSpacePolygon[i].y /= clippedPolygon.textureSpacePolygon[i].w;
            clippedPolygon.textureSpacePolygon[i].z /= clippedPolygon.textureSpacePolygon[i].w;
            clippedPolygon.textureSpacePolygon[i].z = 0.0;
            clippedPolygon.textureSpacePolygon[i].w = 1.0;

            //This gets reused and mutated when we do tile grid rasterization.        
            textureSpacePolygon.push(new Vector2(clippedPolygon.textureSpacePolygon[i].x, clippedPolygon.textureSpacePolygon[i].y));

            //Again we only use NDC x,y. 
            clippedPolygon.ndcSpacePolygon[i].x /= clippedPolygon.ndcSpacePolygon[i].w;
            clippedPolygon.ndcSpacePolygon[i].y /= clippedPolygon.ndcSpacePolygon[i].w;
            clippedPolygon.ndcSpacePolygon[i].z /= clippedPolygon.ndcSpacePolygon[i].w;
            clippedPolygon.ndcSpacePolygon[i].w = 1.0;

            //Convert to screenspace TODO opt.
            var screenSpacePoint = viewportTransform.transformVector4(clippedPolygon.ndcSpacePolygon[i]);
            screenSpacePolygon.push(new Vector2(screenSpacePoint.x, screenSpacePoint.y));
        }

        //We apply clip rect , this is done by clipping
        // the texture space polygon with our texture space rectangle.
        if(textureSpaceClipRect) {
            var poly = convexPolygonClipper.clip(new Vector4(textureSpaceClipRect.getLeft(),textureSpaceClipRect.getTop(), 0) ,
                                                 new Vector4(textureSpaceClipRect.getRight(), textureSpaceClipRect.getBottom(), 0), clippedPolygon.textureSpacePolygon);
            textureSpacePolygon = [];
            //TODO optimize
            for(var i = 0; i < poly.length; ++i) {
                textureSpacePolygon.push(poly[i]);
            }
        } else {
            textureSpacePolygon = clippedPolygon.textureSpacePolygon;
        }

        var texelRatio = this.getTexelRatio(screenSpacePolygon, clippedPolygon.textureSpacePolygon);
        
        var preciseLod = this.getLodFromTexelToPixelRatio(texelRatio.meanTexelToPixelRatio);
        if (useLowerLod) {
            preciseLod -= 1.0;
        }
        var renderedLod = this.getDiscreteLod(preciseLod);

        var tileGridWidth = this.getLodWidthInTiles(renderedLod);
        var tileGridHeight = this.getLodWidthInTiles(renderedLod);

        if(tileGridWidth === 1 && tileGridHeight === 1) {
            visibleTiles.push(new TileId(renderedLod,0,0));
        } else {
            var modelTransform = getModelTransform(this.baseImageWidth, this.name);
            var modelViewProjection = viewProjectionTransform.multiply(modelTransform);
            var visibleTiles;
            if (Config.outputMultiLODTiles) {
                visibleTiles = this.intersectClippedPolyWithTileGrid_multiLOD2(modelViewProjection,
                        viewportWidth, viewportHeight,
                        textureSpacePolygon,
                        screenSpacePolygon,
                        tileGridWidth, 
                        tileGridHeight, 
                        this.tileWidth, 
                        this.tileHeight);
            } else {
                visibleTiles = this.intersectClippedPolyWithTileGrid(modelViewProjection,
                        textureSpacePolygon, 
                        textureSpacePolygon.length, 
                        this.finestLod, 
                        renderedLod, 
                        tileGridWidth, 
                        tileGridHeight, 
                        this.tileWidth, 
                        this.tileHeight);
            }
        }

        return {
            visibleTiles: visibleTiles,
            lod: renderedLod,
            preciseLod: preciseLod,
            finestRenderedLod: this.getLodFromTexelToPixelRatio(texelRatio.minTexelToPixelRatio),
            textureSpacePolygon: clippedPolygon.textureSpacePolygon
        };
    },

    /**
     * Transforms a polygon in NDC space into
     * texture space , accounting for the projection.
     */
    projectPolygonFromNDCToTexture : function (imageSpaceEye, modelViewProjection, ndcPolygon, imageDim) {
        var inverseModelViewProjection = modelViewProjection.inverse();
        var polygonProjectedOntoImage = [];
        for (var i = 0; i < ndcPolygon.length; ++i) {
            var vImageSpace = inverseModelViewProjection.transformVector4(ndcPolygon[i]); 
            vImageSpace.x /=vImageSpace.w;
            vImageSpace.y /= vImageSpace.w;
            vImageSpace.z /= vImageSpace.w;
            vImageSpace.w = 1.0;
            vImageSpace.y = imageDim-1 - vImageSpace.y; //Convert to from image space (Y-up) to texture space (Y-down).
            polygonProjectedOntoImage.push(vImageSpace); 
        }

        return polygonProjectedOntoImage;
    },

    /**
     * Returns the homogenous clipped NDC and Texture Space polygon
     * When very large images, such as a map whose dimensions are 2^27,
     * the inverse of the model matrix cannot be reliably computed if
     * it's a matrix for the entire original resolution. Therefore, we
     * do clipping on a low resolution of 1024 and scaling the results
     * to actual dimensions
     */
    getClippedPolygon : function(getModelTransform, viewProjectionTransform) {
        var clipDim = 1024;
        var clipModelTransform = getModelTransform(clipDim, this.name);
        var ndcPolygon = [],
            i,
            clippedNDCPolygon,
            backProjectedPolygon,
            inverseModelTransform =  clipModelTransform.inverse(),
            projectorPosition = inverseModelTransform.transformVector4(new Vector4(0,0,0,1)),
            modelViewProjection = viewProjectionTransform.multiply(clipModelTransform),
            imageCorners = [
            new Vector4(0,0,0,1),
            new Vector4(0,clipDim,0,1),
            new Vector4(clipDim,clipDim,0,1),
            new Vector4(clipDim,0,0,1),
        ];

        for(i = 0; i < imageCorners.length; ++i) {
            ndcPolygon.push(modelViewProjection.transformVector4(imageCorners[i]));
        }

        var clippedNDCPolygon = convexPolygonClipper.clip(new Vector4(-1,-1,-1) , new Vector4(1, 1, 1), ndcPolygon);    
        var backProjectedPolygon = this.projectPolygonFromNDCToTexture(projectorPosition, modelViewProjection, clippedNDCPolygon, clipDim);

        var ratio = this.baseImageHeight / clipDim;
        for(var i = 0; i < backProjectedPolygon.length; ++i) {
            backProjectedPolygon[i].x *= ratio;
            backProjectedPolygon[i].y = this.baseImageHeight-1-
                (clipDim-1-backProjectedPolygon[i].y)*ratio;
        }

        return {
            ndcSpacePolygon : clippedNDCPolygon,
            textureSpacePolygon : backProjectedPolygon
        };
    },

    /**
     * Tests if an oriented bounding box intersects an axis-aligned bounding box.
     * @param {Vector2} orientedBBox0 One endpoint of the oriented bounding box.
     * @param {Vector2} orientedBBox1 Second endpoint of the oriented bounding box.
     * @param {number} orientedBBoxWidth The width of the oriented bounding box, perpendicular to the line connecting the endpoints.
     * @param {Rectangle} axisAlignedBBox The aabox you are testing against.
     * @return {bool}
     */
    orientedBoundingBoxRectIntersecion: function(orientedBBox0, orientedBBox1, orientedBBoxWidth, axisAlignedBBox) {
        if (orientedBBoxWidth <= 0)
        {
            throw 'box must have positive width';
        }

        var norm = orientedBBox1.subtract(orientedBBox0).normalize();
        norm =  norm.multiplyScalar(orientedBBoxWidth * 0.5) ;
        var perp = new Vector2(-norm.y, norm.x);

        var boxCorners = [[
                orientedBBox0.add(perp).subtract(norm),
                orientedBBox1.add(perp).add(norm),
                orientedBBox1.subtract(perp).add(norm),
                orientedBBox0.subtract(perp).subtract(norm)
            ], [
                new Vector2(axisAlignedBBox.getLeft(), axisAlignedBBox.getTop()),
                new Vector2(axisAlignedBBox.getRight(), axisAlignedBBox.getTop()),
                new Vector2(axisAlignedBBox.getRight(), axisAlignedBBox.getBottom()),
                new Vector2(axisAlignedBBox.getLeft(), axisAlignedBBox.getBottom())
            ]
        ];

        var boxCorners0 = boxCorners[0];
        var boxCorners1 = boxCorners[1];

        // First we test if one OBB intersects another OBB 'one-way', then reverse and test again.
        for (var direction = 0; direction < 1; direction++)
        {
            var axis1 = boxCorners0[1].subtract(boxCorners0[0]);
            var axis2 = boxCorners0[3].subtract(boxCorners0[0]);
            axis1 = axis1.multiplyScalar( (1.0 / axis1.lengthSquared())) ;
            axis2 = axis2.multiplyScalar((1.0 / axis2.lengthSquared()));
            var origin1 = boxCorners0[0].dot(axis1);
            var origin2 = boxCorners0[0].dot(axis2);

            for (var a = 0; a < 2; a++)
            {
                var axis = ((a == 0) ? axis1 : axis2);
                var origin = ((a == 0) ? origin1 : origin2);
                var tMin = Number.MAX_VALUE;
                var tMax = Number.MIN_VALUE;

                var t = boxCorners1[0].dot(axis);
                if (t < tMin) tMin = t;
                if (t > tMax) tMax = t;
                t = boxCorners1[1].dot(axis);
                if (t < tMin) tMin = t;
                if (t > tMax) tMax = t;
                t = boxCorners1[2].dot(axis);
                if (t < tMin) tMin = t;
                if (t > tMax) tMax = t;
                t = boxCorners1[3].dot(axis);
                if (t < tMin) tMin = t;
                if (t > tMax) tMax = t;

                if ((tMin - origin) > 1.0 || (tMax - origin) < 0.0)
                    return false;
            }

            var tmp = boxCorners0;
            boxCorners0 = boxCorners1;
            boxCorners1 = tmp;
        }
        return true;
    },

    /**
     * Returns the square of the minimum distance between the point p and the line
     * passing through points line0 and line1. 
     *
     * inLineSegment in the output object is true if the point on the line that is closest to p is within the line segment [line0,line1].
     * @param {Vector2} line0 
     * @param {Vector2} line1
     * @param {Vector2} point
     * @return {{inLineSegment: boolean, distanceSquared: number}}
     */
    linePointDistanceSquared: function(line0, line1, point) {
        var distanceSquared = line0.subtract(line1).lengthSquared();
        var alpha = ((point.x - line0.x) * (line1.x - line0.x) + (point.y - line0.y) * (line1.y - line0.y)) / distanceSquared;

        var inLineSegment = alpha >= 0.0 && alpha <= 1.0;

        // This point is the intersection of the line with the tangent to the line that passes through the point p.
        var pIntersection = line0.lerp(line1, alpha);

        return {
            distanceSquared: pIntersection.subtract(point).lengthSquared(),
            inLineSegment: inLineSegment
        }
    },

    pointInPoly : function(points, x, y)
    {
        var i, j, c = false;
        for (i = 0, j = points.length-1; i < points.length; j = i++) {
            if ((((points[i].y <= y) && (y < points[j].y)) ||
                        ((points[j].y <= y) && (y < points[i].y))) &&
                    (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x))
                c =!c;
        }
        return c;
    },


    intersectClippedPolyWithTileGrid_multiLOD2: function(modelViewProjection, viewportWidth, viewportHeight, texSpacePoly, scrSpacePoly) {
        if (scrSpacePoly.length != texSpacePoly.length) {
            scrSpacePoly = [];
            for (var k=0; k<texSpacePoly.length; k++) {
                var vert = new Vector4(texSpacePoly[k].x, this.baseImageHeight-1-texSpacePoly[k].y, 0, 1);
                scrVert = modelViewProjection.transformVector4(vert);
                scrVert.x /=  scrVert.w;
                scrVert.y /=  scrVert.w;
                scrVert.x = (scrVert.x + 1) * 0.5 * viewportWidth; 
                scrVert.y = (scrVert.y + 1) * 0.5 * viewportHeight; 
                scrSpacePoly.push(scrVert);
            }
        }
                                                    
        var texelRatio = this.getTexelRatio(scrSpacePoly, texSpacePoly);
        var preciseLod = this.getLodFromTexelToPixelRatio(texelRatio.meanTexelToPixelRatio);
        var renderedLod = this.getDiscreteLod(preciseLod);

        var tileGridWidth = this.getLodWidthInTiles(renderedLod);
        var tileGridHeight = this.getLodWidthInTiles(renderedLod);
        var tiles = this.intersectClippedPolyWithTileGrid(modelViewProjection,
                        texSpacePoly, 
                        texSpacePoly.length, 
                        this.finestLod, 
                        renderedLod, 
                        tileGridWidth, 
                        tileGridHeight, 
                        this.tileWidth, 
                        this.tileHeight);

        var maxTexToPixRatio = MathHelper.logBase(this.baseImageWidth/viewportWidth);
        var changed = true;
        var newTiles;
        while (changed) {
            changed = false;

            var newTiles = [];
            for (var i=0; i<tiles.length; i++) {
                var tileId = tiles[i];

                var texSpaceClippedQuad;

                // sanity check
                lodDiff = this.finestLod - tileId.levelOfDetail;
                texX = (tileId.x << lodDiff) * this.tileWidth;
                texY = (tileId.y << lodDiff) * this.tileHeight;
                width = this.tileWidth << lodDiff; 
                height = this.tileWidth << lodDiff; 
                texSpaceClippedQuad = convexPolygonClipper.clip(
                        new Vector4(texX, texY, 0),
                        new Vector4(texX+width, texY+height,0),
                        texSpacePoly);
                if (! texSpaceClippedQuad.length) {
                    //It's possible that a tile declared visible by
                    //intersectClippedPolyWithTileGrid() is foudn not actually
                    //visible because scan-conversion in that function use
                    //a inflate factor to offset scan conversion inaccuracies
                    continue;
                }

                if (tileId.noSubdiv || tileId.levelOfDetail==this.finestLod) {
                    newTiles.push(tileId);
                    continue;
                }

                //subdivide
                var children = tileId.getChildren();
                var numNewLod = 0, numClippedOut = 0;
                for (var c=0; c<children.length; c++) {
                    // see if children are visible
                    var childTileId = children[c];
                    lodDiff = this.finestLod - childTileId.levelOfDetail;
                    texX = (childTileId.x << lodDiff) * this.tileWidth;
                    texY = (childTileId.y << lodDiff) * this.tileHeight;
                    width = this.tileWidth << lodDiff; 
                    height = this.tileWidth << lodDiff; 
                    var tolerance = 0.01;
                    texX += tolerance;
                    texY += tolerance;
                    width -= tolerance;
                    height -= tolerance;

                    var w2 = width/2, h2 = height/2;

                    var fullyContained = true;
                    for (var m=0; m<=1 && fullyContained; m++)
                        for (var n=0; n<=1 && fullyContained; n++) {
                            if (! this.pointInPoly(texSpacePoly, texX+m*width, texY+n*height))
                                fullyContained = false;
                        }



                    texSpaceClippedQuad = [];
                    if (! fullyContained) {
                        texSpaceClippedQuad = convexPolygonClipper.clip(
                            new Vector4(texX, texY, 0),
                            new Vector4(texX+width, texY+height,0),
                            texSpacePoly);
                    } else {
                        texSpaceClippedQuad.push(new Vector4(texX, texY, 0, 1));
                        texSpaceClippedQuad.push(new Vector4(texX+width, texY, 0, 1));
                        texSpaceClippedQuad.push(new Vector4(texX+width, texY+height, 0, 1));
                        texSpaceClippedQuad.push(new Vector4(texX, texY+height, 0, 1));
                    }

                    if (texSpaceClippedQuad.length > 0) {
                        var scrSpaceClippedQuad = [];
                        for (var v=0; v<texSpaceClippedQuad.length; v++) {
                            var vert = new Vector4(texSpaceClippedQuad[v].x,
                                    this.baseImageHeight-1-texSpaceClippedQuad[v].y, 0, 1);
                            scrVert = modelViewProjection.transformVector4(vert);
                            scrVert.x /=  scrVert.w;
                            scrVert.y /=  scrVert.w;
                            scrVert.x = (scrVert.x + 1) * 0.5 * viewportWidth; 
                            scrVert.y = (scrVert.y + 1) * 0.5 * viewportHeight; 
                            scrSpaceClippedQuad.push(scrVert);
                        }

                        var texelRatio = this.getTexelRatio(scrSpaceClippedQuad, texSpaceClippedQuad);
                        var preciseLod = this.getLodFromTexelToPixelRatio(texelRatio.meanTexelToPixelRatio);
                        var renderedLod = this.getDiscreteLod(preciseLod);
                        var maxPixelLengths = 0;
                        for (var l=0; l<texelRatio.pixelLengths.length; l++) {
                            if (texelRatio.pixelLengths[l] > maxPixelLengths)
                                maxPixelLengths = texelRatio.pixelLengths[l];
                        }
                        if (renderedLod > tileId.levelOfDetail ||
                            maxPixelLengths > this.tileWidth) {
                            newTiles.push(childTileId);
                            numNewLod ++;
                            changed = true;
                        }
                    } else
                        numClippedOut++;
                }
                if (numNewLod < children.length - numClippedOut) {
                    // at least one child areas has the same lod requirement as parent, and
                    // as a result it was not necessary to refine to that child tile; in this
                    // case, the parent tile is still useful
                    tileId.noSubdiv = true;
                    newTiles.push(tileId);
                }
            }

            if (changed)
                tiles = newTiles;
        }
        return tiles;
   },


    /**
     * Calculates the tiles in the specified LOD that intersect the visible 
     * region, which is provided as the UVs in clippedVerticesSS.
     * @param {Array.<Vector2>} clippedVerticesSSTexCoords
     * @param {number} nClippedVerticesSS
     * @param {number} finestLod
     * @param {number} lod
     * @param {number} tileGridWidth
     * @param {number} tileGridHeight
     * @param {number} tileWidth
     * @param {number} tileHeight
     * @return {Array.<TileId>}
     */
    intersectClippedPolyWithTileGrid: function(modelViewProjection, clippedVerticesSSTexCoords, nClippedVerticesSS, finestLod, lod, tileGridWidth, tileGridHeight, tileWidth, tileHeight) {
        // Transform UVs to LOD's tile space and find bounding box
        var xScale = (1.0 / ((1) << (finestLod - lod))) / tileWidth;
        var yScale = (1.0 / ((1) << (finestLod - lod))) / tileHeight;

        var tileIdCoords = new Array(nClippedVerticesSS);
        for (var i = 0; i < nClippedVerticesSS; i++) {
            tileIdCoords[i] = {x: clippedVerticesSSTexCoords[i].x * xScale,
                y: clippedVerticesSSTexCoords[i].y * yScale};
        }

        var tileOffsets = PolygonTileFloodFiller.floodFill(tileGridWidth, tileGridHeight, tileIdCoords);

        var tiles = [];
        for (var i = 0; i < tileOffsets.length; i++) {
            tiles.push(new TileId(lod, tileOffsets[i].x, tileOffsets[i].y));
        }

        return tiles;
    }
}