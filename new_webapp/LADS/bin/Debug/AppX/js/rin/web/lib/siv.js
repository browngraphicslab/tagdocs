///#source 1 1 /Common/BuildPrefix.js
// The start of the immediate function that is going to keep all of our code in the 
// global private scope.
(function ()
{


///#source 1 1 /Debug/DebugHelper.js

var DebugHelper = {};

DebugHelper.debugEnabled = false;
DebugHelper.frameCount = 0;
DebugHelper.prevFrame = new Date();
DebugHelper.prevSmoothedFrame = new Date();
DebugHelper.smoothedFrame = new Date();
DebugHelper.smoothedFrameCount = 0;
DebugHelper.smoothedFrameRate = 0;
DebugHelper.debugTextElem = null;

DebugHelper.ResetFrameCount = function ()
{
    if (this.debugEnabled)
    {
        this.frameCount = 0;
    }
};

DebugHelper.IncrementFrameCount = function ()
{
    if (this.debugEnabled)
    {
        ++this.frameCount;
    }
};

DebugHelper.dispose = function ()
{
    if (DebugHelper.debugTextElem)
    {
        document.getElementById('parentDiv').removeChild(DebugHelper.debugTextElem);
        DebugHelper.debugTextElem = null;
    }
};

DebugHelper.ShowDebugMessages = function (renderer)
{
    if (this.debugEnabled)
    {
        if (!DebugHelper.debugTextElem)
        {
            DebugHelper.debugTextElem = document.createElement('div');
            var parentDiv = document.getElementById('parentDiv');
            parentDiv.appendChild(DebugHelper.debugTextElem);

            /* @disable(0092) */
            DebugHelper.debugTextElem.style.position = 'absolute';
            DebugHelper.debugTextElem.style.width = '700px';
            DebugHelper.debugTextElem.style.height = '50px';
            DebugHelper.debugTextElem.style.top = '610px';
            DebugHelper.debugTextElem.style.color = '#000000';
            DebugHelper.debugTextElem.style.backgroundColor = '#ffffff';
            DebugHelper.debugTextElem.style.fontSize = '12pt';
            /* @restore(0092) */
        }

        if (DebugHelper.debugTextElem)
        {
            var numberOfRenderables = renderer._viewModel.getVisibleElementsAsArray().length;

            var now = new Date();

            this.smoothedFrameCount++;
            if ((now - this.prevSmoothedFrame) >= 500)
            {
                this.smoothedFrameRate = this.smoothedFrameCount / 0.5;
                this.smoothedFrameCount = 0;
                this.prevSmoothedFrame = now;
            }

            var message = ' frame count:' + this.frameCount +
                          ' #renderables:' + numberOfRenderables +
                          ' framerate:' + (1000 / (now - this.prevFrame)).toFixed(0) +
                          ' smoothedFramerate:' + this.smoothedFrameRate.toFixed(0); 

            DebugHelper.debugTextElem.innerHTML = message;

            this.prevFrame = now;
        }
    }
    else if (DebugHelper.debugTextElem)
    {
        DebugHelper.dispose();
    }
};


///#source 1 1 /Math/ConvexPolygonClipper.js
/**
* @file ConvexPolygonClipper.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author undefined
* @date 2012-07-19
*/

/**
 * This is utility class for doing homogenous coordinate polygon clipping.
 */
var convexPolygonClipper = {
    /**
    * This performs clipping against the view volume (defined by upper and lower bounds).
    * It will return results as an array of vector4 points. 
    *
    * @param {Vector3} upperClipBound
    * @param {Vector3} lowerClipBound
    * @param {Array.<Vector4>} polygon - the polygon to clip
    * @param {Array.<Vector4>} polygonTexture - the associated texture polygon. or any other associated polygon. It will be clipped accoring to the {polygon} using linear interpolation
    *
    * @return {object} in a form of { polygon: {Array.<Vector4>} , polygonTexture: {Array.<Vector4>}, isClipped: bool}.
    */
    clip: function (lowerClipBound, upperClipBound, polygon, polygonTexture)
    {
        if (upperClipBound.x < lowerClipBound.x ||
            upperClipBound.y < lowerClipBound.y ||
            upperClipBound.z < lowerClipBound.z)
        {
            throw 'clip bounds should have positive volume';
        }

        var options = {
            clipBounds: {
                x: lowerClipBound.x,
                y: lowerClipBound.y,
                z: lowerClipBound.z,
                sizeX: upperClipBound.x - lowerClipBound.x,
                sizeY: upperClipBound.y - lowerClipBound.y,
                sizeZ: upperClipBound.z - lowerClipBound.z
            },
            poly: polygon,
            polyTextureCoords: polygonTexture || null,
            polyVertexCount: polygon.length,
            clippedPoly: new Array(polygon.length + 6),
            clippedPolyTextureCoords: polygonTexture === undefined || polygonTexture  == null ? null : new Array(polygonTexture.length + 6),
            clippedPolyVertexCount: 0,
            tempVertexBuffer: new Array(polygon.length + 6),
            tempTextureCoordBuffer: polygonTexture === undefined || polygonTexture == null ? null : new Array(polygonTexture.length + 6),
            isClipped: false
        };
        convexPolygonClipper.clipConvexPolygonGeneral(options);
        options.clippedPoly.length = options.clippedPolyVertexCount;
        return { polygon: options.clippedPoly, polygonTexture: options.clippedPolyTextureCoords, isClipped: options.isClipped };
    },


    /**
    * Clips a convex polygon against the provided clip volume in homogenous coordinates. Results
    * are undefined for a concave polygon or a polygon with overlapping edges.
    * 
    * This requires an option object with the following properites (that will get updated with results in place.)
    *  clipBounds  The 3D bounds the clipping, e.g. {x:-1,y:-1,z:0, sizeX:2,sizeY:2,sizeZ:1}.  Which is (-1,-1,0) to (1,1,1).
    *  poly  The polygon to clipped. This is an Array of Vector4.
    *  polyTextureCoords  Texture coordinates associated with the poly. May be null. This is an Array of Vector2 or null.
    *  polyVertexCount  The number of vertices in the polygon to be clipped.
    *  clippedPoly  The resulting clipped poly. This array must be at least polyVertexCount + 6 in length.
    *  clippedPolyTextureCoords  The texture coordinates of the resulting clipped poly. May be null if polyTextureCoords is null. The array must be at least polyVertexCount + 6 in length.
    *  clippedPolyVertexCount  The number of vertices in the clipped polygon.
    *  tempVertexBuffer  A buffer that's used for temporary storage in the algorithm. This is an Array of Vector4. This array must be at least polyVertexCount + 6 in length.
    *  tempTextureCoordBuffer  A buffer that's used for temporary storage in the algorithm. May be null if polyTextureCoords is null. This array must be at least polyVertexCount + 6 in length.
    *
    *
    * @param {Object} options
    */
    clipConvexPolygonGeneral: function (options)
    {
        if (!options.clipBounds)
        {
            throw 'expected clip bounds option';
        }
        // The algorithm used here is Sutherland-Hodgman extended to 3D. It basically works like so:
        //
        // P' = P
        // for each clipping plane:
        //     P = clip P' agsint clipping plane
        //     P' = P

        if (options.polyVertexCount < 3 || options.poly == null || options.poly.length < options.polyVertexCount ||
            options.clippedPoly == null || options.clippedPoly.length < options.polyVertexCount + 6 ||
            options.tempVertexBuffer == null || options.tempVertexBuffer.length < options.polyVertexCount + 6)
        {
            throw 'polygon arrays must have sufficient capacity';
        }

        /* @disable(0092) */
        if (options.polyTextureCoords != null)
        {
            if (options.polyTextureCoords.length < options.polyVertexCount ||
                options.clippedPolyTextureCoords == null || options.clippedPolyTextureCoords.Length < options.polyVertexCount + 6 ||
                options.tempTextureCoordBuffer == null || options.tempTextureCoordBuffer.Length < options.polyVertexCount + 6)
            {
                throw 'polygon arrays must have sufficient capacity';
            }
        }
        /* @restore(0092) */

        var t;
        t = options.tempVertexBuffer;
        options.tempVertexBuffer = options.clippedPoly;
        options.clippedPoly = t;
        t = null;

        t = options.tempTextureCoordBuffer;
        options.tempTextureCoordBuffer = options.clippedPolyTextureCoords;
        options.clippedPolyTextureCoords = t;
        t = null;

        var clippedPolyCurrent = options.tempVertexBuffer;
        var clippedPolyTextureCoordsCurrent = options.tempTextureCoordBuffer;
        var clippedPolyVertexCountCurrent = options.polyVertexCount;

        var p0Idx, p1Idx, bC0, bC1;
        // Left
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                bC0 = options.poly[p0Idx].x - options.clipBounds.x * options.poly[p0Idx].w;
                bC1 = options.poly[p1Idx].x - options.clipBounds.x * options.poly[p1Idx].w;

                options.BC0 = bC0;
                options.BC1 = bC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = options.poly; //Notice here we use input poly, in others we'll use clippedPolyCurrent instead.
                options.clippedPolyTextureCoordsCurrent = options.polyTextureCoords;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent;
            clippedPolyCurrent = options.clippedPoly;
            options.clippedPoly = t;
            t = null;
            t = clippedPolyTextureCoordsCurrent;
            clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords;
            options.clippedPolyTextureCoords = t;
            t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }


        // Right
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                bC0 = (options.clipBounds.x + options.clipBounds.sizeX) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].x;
                bC1 = (options.clipBounds.x + options.clipBounds.sizeX) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].x;


                options.BC0 = bC0;
                options.BC1 = bC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent;
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent;
            clippedPolyCurrent = options.clippedPoly;
            options.clippedPoly = t;
            t = null;
            t = clippedPolyTextureCoordsCurrent;
            clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords;
            options.clippedPolyTextureCoords = t;
            t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Top
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                bC0 = clippedPolyCurrent[p0Idx].y - options.clipBounds.y * clippedPolyCurrent[p0Idx].w;
                bC1 = clippedPolyCurrent[p1Idx].y - options.clipBounds.y * clippedPolyCurrent[p1Idx].w;

                options.BC0 = bC0;
                options.BC1 = bC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent;
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent;
            clippedPolyCurrent = options.clippedPoly;
            options.clippedPoly = t;
            t = null;
            t = clippedPolyTextureCoordsCurrent;
            clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords;
            options.clippedPolyTextureCoords = t;
            t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Bottom
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                bC0 = (options.clipBounds.y + options.clipBounds.sizeY) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].y;
                bC1 = (options.clipBounds.y + options.clipBounds.sizeY) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].y;

                options.BC0 = bC0;
                options.BC1 = bC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent;
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent;
            clippedPolyCurrent = options.clippedPoly;
            options.clippedPoly = t;
            t = null;
            t = clippedPolyTextureCoordsCurrent;
            clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords;
            options.clippedPolyTextureCoords = t;
            t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Near
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                bC0 = clippedPolyCurrent[p0Idx].z - options.clipBounds.z * clippedPolyCurrent[p0Idx].w;
                bC1 = clippedPolyCurrent[p1Idx].z - options.clipBounds.z * clippedPolyCurrent[p1Idx].w;

                options.BC0 = bC0;
                options.BC1 = bC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent;
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent;
            clippedPolyCurrent = options.clippedPoly;
            options.clippedPoly = t;
            t = null;
            t = clippedPolyTextureCoordsCurrent;
            clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords;
            options.clippedPolyTextureCoords = t;
            t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Far
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                bC0 = (options.clipBounds.z + options.clipBounds.sizeZ) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].z;
                bC1 = (options.clipBounds.z + options.clipBounds.sizeZ) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].z;


                options.BC0 = bC0;
                options.BC1 = bC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent;
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            // No need to swap current with output because this is the last clipping plane

            options.clippedPolyCurrent = null;
            options.clippedPolyTextureCurrent = null;
        }
    },

    /**
    * This helper function for the clipper it expects an options object with the following items. 
    * Note: Clipped Poly Vertex Count will be updated along with clipped poly.
    *
    * options.clippedPoly,  Vector4[]
    * options.clippedPolyTextureCoords, Vector2[] optional
    * options.clippedPolyVertexCount,   number
    * options.clippedPolyCurrent,     Vector4[]
    * options.clippedPolyTextureCoordsCurrent, Vector2[]
    * options.p0Idx,    number
    * options.p1Idx,   number
    * options.BC0, number
    * options.BC1 number
    *
    * @param {Object} options
    */
    genericClipAgainstPlane: function (options)
    {
        var alpha;
        if (options.BC1 >= 0)
        {
            // P1 inside

            if (options.BC0 < 0)
            {
                // P0 outside, P1 inside

                // Output intersection of P0, P1
                alpha = options.BC0 / (options.BC0 - options.BC1);
                options.clippedPoly[options.clippedPolyVertexCount] = options.clippedPolyCurrent[options.p0Idx].lerp(options.clippedPolyCurrent[options.p1Idx], alpha);
                if (options.clippedPolyTextureCoords != null)
                {
                    options.clippedPolyTextureCoords[options.clippedPolyVertexCount] = options.clippedPolyTextureCoordsCurrent[options.p0Idx].lerp(options.clippedPolyTextureCoordsCurrent[options.p1Idx], alpha);
                }
                options.clippedPolyVertexCount++;
                options.isClipped = true;
            }

            // output P1
            options.clippedPoly[options.clippedPolyVertexCount] = options.clippedPolyCurrent[options.p1Idx];
            if (options.clippedPolyTextureCoords != null)
            {
                options.clippedPolyTextureCoords[options.clippedPolyVertexCount] = options.clippedPolyTextureCoordsCurrent[options.p1Idx];
            }
            options.clippedPolyVertexCount++;

        } else if (options.BC0 >= 0)
        {
            // P0 inside clip plane, P1 outside

            // Output intersection of P0, P1
            alpha = options.BC0 / (options.BC0 - options.BC1);
            options.clippedPoly[options.clippedPolyVertexCount] = options.clippedPolyCurrent[options.p0Idx].lerp(options.clippedPolyCurrent[options.p1Idx], alpha);
            if (options.clippedPolyTextureCoords != null)
            {
                options.clippedPolyTextureCoords[options.clippedPolyVertexCount] = options.clippedPolyTextureCoordsCurrent[options.p0Idx].lerp(options.clippedPolyTextureCoordsCurrent[options.p1Idx], alpha);
            }
            options.clippedPolyVertexCount++;
            options.isClipped = true;
        }
    }
};

///#source 1 1 /Math/MathHelper.js
/**
 * The MathHelper class provides common math functions.
 * @class
*/
MathHelper = {};

/**
 * A small value indicating the maximum precision used for equaliy checks
 * @const
 * @type {number}
*/
MathHelper.zeroTolerance = 1e-12;

MathHelper.halfPI = Math.PI / 2;

/**
* PI times 2
* @const
* @type {number}
*/
MathHelper.twoPI = 2 * Math.PI;

/**
 * 180.0 divided by PI
 * @const
 * @type {number}
*/
MathHelper.oneEightyOverPI = 180.0 / Math.PI;

/**
 * PI divided by 180.0
 * @const
 * @type {number}
*/
MathHelper.piOverOneEighty = Math.PI / 180.0;

/**
 * Returns true if the number is close enough to zero to be considered zero
 * @param {number} value
 * @return {boolean}
 */
MathHelper.isZero = function (value)
{
    return Math.abs(value) < MathHelper.zeroTolerance;
};

/**
 * Converts radians to degrees
 * @param {number} angle An angle in degrees
 * @return {number}
*/
MathHelper.degreesToRadians = function (angle)
{
    return angle * MathHelper.piOverOneEighty;
};

/**
 * Converts degrees to radians
 * @param {number} angle An angle in radians
*/
MathHelper.radiansToDegrees = function (angle)
{
    return angle * MathHelper.oneEightyOverPI;
};

/**
 * Normalizes a radian angle to be between [0, 2 * PI)
 * @param {number} angle An angle in radians
 * @return {number}
*/
MathHelper.normalizeRadian = function (angle)
{
    while (angle < 0)
    {
        angle += MathHelper.twoPI;
    }
    while (angle >= MathHelper.twoPI)
    {
        angle -= MathHelper.twoPI;
    }
    return angle;
};

/**
 * Always want to take the shortest path between the source and the target i.e. if source
 * is 10 degrees and target is 350 degrees we want to travel 20 degrees not 340
 * @param {number} source heading in radians
 * @param {number} target heading in radians
 * @return {number} the new source heading, from which a linear path to the target will also be the shortest path around a circle
*/
MathHelper.pickStartHeadingToTakeShortestPath = function (source, target)
{
    //Always want to take the shortest path between the source and the target i.e. if source
    //is 10 degrees and target is 350 degrees we want to travel 20 degrees not 340
    if (Math.abs(target - source) > Math.PI)
    {
        if (source < target)
        {
            return source + MathHelper.twoPI;
        }
        else
        {
            return source - MathHelper.twoPI;
        }
    }
    else
    {
        return source;
    }
};

/**
 * Returns the inverse square root of the input parameter
 * @param {number} v input value
 * @return {number}
*/
MathHelper.invSqrt = function (v)
{
    return 1.0 / Math.sqrt(v);
};

/**
* Returns if the value is finite (i.e., less than POSITIVE_INFINITY and greater than NEGATIVE_INFINITY)
* @param {number} v input value
* @return {boolean} 
*/
MathHelper.isFinite = function (v)
{
    return v > Number.NEGATIVE_INFINITY && v < Number.POSITIVE_INFINITY;
};

/**
 * Returns the value v , clamped to [min,max] interval (so v > max would be max.)
 * @param {number} v input value
 * @param {number} min lower bound (inclusive) that we want to clamp v against.
 * @param {number} max upper bound (inclusiveP that we want to clamp v against.
 * @return {number}
*/
MathHelper.clamp = function (v, min, max)
{
    return (Math.min(Math.max(v, min), max));
};

/**
* Returns log of x to the specified base
* @param {number} x Value to log
* @param {number} base The base to use in the log operation
* @return {number}
*/
MathHelper.logBase = function (x, base)
{
    return Math.log(x) / Math.log(base);
};

/**
* Returns the ceiling of the log base 2 of the value.
* @return {number}
*/
MathHelper.ceilLog2 = function (value)
{
    return Math.ceil(MathHelper.logBase(value, 2));
};

/**
* Compares two values, returns <0 if v1 precedes v2, 0 if v1 == v2 and >0 if v1 follows v2
* @param {number} v1 First value
* @param {number} v2 Second value
* @return {number}
*/
MathHelper.compareTo = function (v1, v2)
{
    if (v1 < v2)
    {
        return -1;
    }
    else if (v1 === v2)
    {
        return 0;
    }
    else
    {
        return 1;
    }
};

MathHelper.divPow2RoundUp = function (value, power)
{
    return MathHelper.divRoundUp(value, 1 << power);
};

MathHelper.divRoundUp = function (value, denominator)
{
    return Math.ceil(value / denominator);
};

MathHelper.isPowerOfTwo = function (x)
{
    return (x & (x - 1)) == 0;
};

MathHelper.nextHighestPowerOfTwo = function (x)
{
    --x;
    for (var i = 1; i < 32; i <<= 1)
    {
        x = x | x >> i;
    }
    return x + 1;
};

///#source 1 1 /Math/Matrix2x2.js
/**
* @file Matrix2x2.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
* @deprecated
*/

/**
* Creates a 2x2 matrix
* @constructor
* @param {number} m00
* @param {number} m01
* @param {number} m10
* @param {number} m11
*/
/* @disable(0055) */
/* @constructor */function Matrix2x2(m00, m01, m10, m11)
{
    this.m00 = m00 || 0;
    this.m01 = m01 || 0;
    this.m10 = m10 || 0;
    this.m11 = m11 || 0;
}

/**
* Inverses the current matrix. 
* @return inverse matrix. If determinant is 0 returns {null}.
**/
Matrix2x2.prototype.inverse = function ()
{
    var d = this.m00 * this.m11 - this.m01 * this.m10;
    if (d == 0)
    {
        debugger;
        return null;
    }

    var id = 1 / d;

    return new Matrix2x2(id * this.m11, id * -this.m01, id * -this.m10, id * this.m00);
};

/**
* Multiplies current matrice by the {other}
*
* @param  {Matrix2x2} other -  to multiply with
*
* @return {Matrix2x2} result.
**/
Matrix2x2.prototype.dotMatrix2x2 = function (other)
{
    return new Matrix2x2(
        this.m00 * other.m00 + this.m01 * other.m10,
        this.m00 * other.m01 + this.m01 * other.m11,
        this.m10 * other.m00 + this.m11 * other.m10,
        this.m10 * other.m01 + this.m11 * other.m11
        );
};

/**
* Multiplies current matrice by the {other}
*
* @param  {Matrix2x2} other - to multiply with
*
* @return {Matrix2x2} result.
**/
Matrix2x2.prototype.dotVector2 = function (vec2)
{
    return new Vector2(
        vec2.x * this.m00 + vec2.y * this.m10,
        vec2.x * this.m01 + vec2.y * this.m11
    );
};

/**
* @desc Creates an identity matrix 2x2. New object is created each time the function is called.
*/
Matrix2x2.Identity = function ()
{
    return new Matrix2x2(1, 0, 0, 1);
};
/* @restore(0055) */

///#source 1 1 /Math/Matrix4x4.js

/**
* Creates a 4x4 matrix
* @constructor
* @param {number} m11
* @param {number} m12
* @param {number} m13
* @param {number} m14
* @param {number} m21
* @param {number} m22
* @param {number} m23
* @param {number} m24
* @param {number} m31
* @param {number} m32
* @param {number} m33
* @param {number} m34
* @param {number} m41
* @param {number} m42
* @param {number} m43
* @param {number} m44
*/
/* @constructor */function Matrix4X4(m11, m12, m13, m14,
                                     m21, m22, m23, m24,
                                     m31, m32, m33, m34,
                                     m41, m42, m43, m44)
{
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m14 = m14;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m24 = m24;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    this.m34 = m34;
    this.m41 = m41;
    this.m42 = m42;
    this.m43 = m43;
    this.m44 = m44;
}

/**
* Creates a copy of the matrix
* @param {Matrix4X4} m
* @return {Matrix4X4}
*/
Matrix4X4.createCopy = function (m)
{
    return new Matrix4X4(m.m11, m.m12, m.m13, m.m14,
                         m.m21, m.m22, m.m23, m.m24,
                         m.m31, m.m32, m.m33, m.m34,
                         m.m41, m.m42, m.m43, m.m44);
};

/**
* Returns an identity matrix
* @return {Matrix4X4}
*/
Matrix4X4.createIdentity = function ()
{
    return new Matrix4X4(1, 0, 0, 0,
                         0, 1, 0, 0,
                         0, 0, 1, 0,
                         0, 0, 0, 1);
};

/**
* Returns a scaling matrix
* @param {number} sx The x scaling factor
* @param {number} sy The y scaling factor
* @param {number} sz The z scaling factor
* @return {Matrix4X4}
*/
Matrix4X4.createScale = function (sx, sy, sz)
{
    return new Matrix4X4(sx, 0, 0, 0,
                         0, sy, 0, 0,
                         0, 0, sz, 0,
                         0, 0, 0, 1);
};

/**
* Returns a translation matrix to be used with a column vector p = M * v
* @param {number} tx The x translation value
* @param {number} ty The y translation value
* @param {number} tz The z translation value
* @return {Matrix4X4}
*/
Matrix4X4.createTranslation = function (tx, ty, tz)
{
    return new Matrix4X4(1, 0, 0, tx,
                         0, 1, 0, ty,
                         0, 0, 1, tz,
                         0, 0, 0, 1);
};

/**
* Returns a matrix that rotates a vector around the x axis, from the origin. The rotation matrix
* is a right handed rotation, a positive angle will rotate the vector anticlockwise around the x axis
* @param {number} angle The angle to rotate in radians
* @return {Matrix4X4}
*/
Matrix4X4.createRotationX = function (angle)
{
    return new Matrix4X4(1, 0, 0, 0,
                         0, Math.cos(angle), -Math.sin(angle), 0,
                         0, Math.sin(angle), Math.cos(angle), 0,
                         0, 0, 0, 1);
};

/**
* Returns a matrix that rotates a vector around the y axis, from the origin. The rotation matrix
* is a right handed rotation, a positive angle will rotate the vector anticlockwise around the y axis
* @param {number} angle The angle to rotate in radians
* @return {Matrix4X4}
*/
Matrix4X4.createRotationY = function (angle)
{
    return new Matrix4X4(Math.cos(angle), 0, Math.sin(angle), 0,
                         0, 1, 0, 0,
                         -Math.sin(angle), 0, Math.cos(angle), 0,
                         0, 0, 0, 1);
};

/**
* Returns a matrix that rotates a vector around the x axis, from the origin. The rotation matrix
* is a right handed rotation, a positive angle will rotate the vector anticlockwise around the x 
* axis. This version of this method does not instantiate a new matrix.
* @param {number} angle The angle to rotate in radians
* @param {number} out The resulting rotation matrix
*/
Matrix4X4.createRotationXOut = function (angle, out)
{
    out.m11 = 1;
    out.m12 = 0;
    out.m13 = 0;
    out.m14 = 0;

    out.m21 = 0;
    out.m22 = Math.cos(angle);
    out.m23 = -Math.sin(angle);
    out.m24 = 0;
              
    out.m31 = 0;
    out.m32 = Math.sin(angle);
    out.m33 = Math.cos(angle);
    out.m34 = 0;
    
    out.m41 = 0;
    out.m42 = 0;
    out.m43 = 0;
    out.m44 = 1;
};

/**
* Returns a matrix that rotates a vector around the y axis, from the origin. The rotation matrix
* is a right handed rotation, a positive angle will rotate the vector anticlockwise around the y 
* axis. This version of this method does not instantiate a new matrix.
* @param {number} angle The angle to rotate in radians
* @param {number} out The resulting rotation matrix
*/
Matrix4X4.createRotationYOut = function (angle, out)
{
    out.m11 = Math.cos(angle);
    out.m12 = 0;
    out.m13 = Math.sin(angle);
    out.m14 = 0;

    out.m21 = 0;
    out.m22 = 1;
    out.m23 = 0;
    out.m24 = 0;
    
    out.m31 = -Math.sin(angle);
    out.m32 = 0;
    out.m33 = Math.cos(angle);
    out.m34 = 0;
    
    out.m41 = 0;
    out.m42 = 0;
    out.m43 = 0;
    out.m44 = 1;
};

/**
* Returns a matrix that rotates a vector around the z axis, from the origin. The rotation matrix
* is a right handed rotation, a positive angle will rotate the vector anticlockwise around the z axis
* @param {number} angle The angle to rotate in radians
* @return {Matrix4X4}
*/
Matrix4X4.createRotationZ = function (angle)
{
    return new Matrix4X4(Math.cos(angle), -Math.sin(angle), 0, 0,
                         Math.sin(angle), Math.cos(angle), 0, 0,
                         0, 0, 1, 0,
                         0, 0, 0, 1);
};

Matrix4X4.prototype =
{
    /**
    * Adds matrix m to to the current matrix and returns the result
    * @param {Matrix4X4} m The matrix which will be added to the calling matrix
    * @return {Matrix4X4}
    */
    add: function (m)
    {
        return new Matrix4X4(this.m11 + m.m11, this.m12 + m.m12, this.m13 + m.m13, this.m14 + m.m14,
                             this.m21 + m.m21, this.m22 + m.m22, this.m23 + m.m23, this.m24 + m.m24,
                             this.m31 + m.m31, this.m32 + m.m32, this.m33 + m.m33, this.m34 + m.m34,
                             this.m41 + m.m41, this.m42 + m.m42, this.m43 + m.m43, this.m44 + m.m44);
    },

    /**
    * Adds matrix m to to the current matrix and returns the result
    * @param {Matrix4X4} m The matrix which will be added to the calling matrix
    * @return {Matrix4X4}
    */
    subtract: function (m)
    {
        return new Matrix4X4(this.m11 - m.m11, this.m12 - m.m12, this.m13 - m.m13, this.m14 - m.m14,
                             this.m21 - m.m21, this.m22 - m.m22, this.m23 - m.m23, this.m24 - m.m24,
                             this.m31 - m.m31, this.m32 - m.m32, this.m33 - m.m33, this.m34 - m.m34,
                             this.m41 - m.m41, this.m42 - m.m42, this.m43 - m.m43, this.m44 - m.m44);
    },

    /**
    * Multiples the calling matrix by matrix m and returns the result
    * @param {Matrix4X4} m input matrix
    * @return {Matrix4X4}
    */
    multiply: function (m)
    {
        return new Matrix4X4(this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31 + this.m14 * m.m41,
                             this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32 + this.m14 * m.m42,
                             this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33 + this.m14 * m.m43,
                             this.m11 * m.m14 + this.m12 * m.m24 + this.m13 * m.m34 + this.m14 * m.m44,

                             this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31 + this.m24 * m.m41,
                             this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32 + this.m24 * m.m42,
                             this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33 + this.m24 * m.m43,
                             this.m21 * m.m14 + this.m22 * m.m24 + this.m23 * m.m34 + this.m24 * m.m44,

                             this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31 + this.m34 * m.m41,
                             this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32 + this.m34 * m.m42,
                             this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33 + this.m34 * m.m43,
                             this.m31 * m.m14 + this.m32 * m.m24 + this.m33 * m.m34 + this.m34 * m.m44,

                             this.m41 * m.m11 + this.m42 * m.m21 + this.m43 * m.m31 + this.m44 * m.m41,
                             this.m41 * m.m12 + this.m42 * m.m22 + this.m43 * m.m32 + this.m44 * m.m42,
                             this.m41 * m.m13 + this.m42 * m.m23 + this.m43 * m.m33 + this.m44 * m.m43,
                             this.m41 * m.m14 + this.m42 * m.m24 + this.m43 * m.m34 + this.m44 * m.m44);
    },

    /**
    * Multiples the calling matrix by matrix m and sets the out values to the result.
    * This version of this method does not instantiate a new matrix.
    * @param {Matrix4X4} m input matrix
    * @param {Matrix4X4} out output matrix
    */
    multiplyOut: function (m, out)
    {
        out.m11 = this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31 + this.m14 * m.m41;
        out.m12 = this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32 + this.m14 * m.m42;
        out.m13 = this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33 + this.m14 * m.m43;
        out.m14 = this.m11 * m.m14 + this.m12 * m.m24 + this.m13 * m.m34 + this.m14 * m.m44;

        out.m21 = this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31 + this.m24 * m.m41;
        out.m22 = this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32 + this.m24 * m.m42;
        out.m23 = this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33 + this.m24 * m.m43;
        out.m24 = this.m21 * m.m14 + this.m22 * m.m24 + this.m23 * m.m34 + this.m24 * m.m44;

        out.m31 = this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31 + this.m34 * m.m41;
        out.m32 = this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32 + this.m34 * m.m42;
        out.m33 = this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33 + this.m34 * m.m43;
        out.m34 = this.m31 * m.m14 + this.m32 * m.m24 + this.m33 * m.m34 + this.m34 * m.m44;

        out.m41 = this.m41 * m.m11 + this.m42 * m.m21 + this.m43 * m.m31 + this.m44 * m.m41;
        out.m42 = this.m41 * m.m12 + this.m42 * m.m22 + this.m43 * m.m32 + this.m44 * m.m42;
        out.m43 = this.m41 * m.m13 + this.m42 * m.m23 + this.m43 * m.m33 + this.m44 * m.m43;
        out.m44 = this.m41 * m.m14 + this.m42 * m.m24 + this.m43 * m.m34 + this.m44 * m.m44;
    },



    /**
    * Multiples each element of the matrix by the scalar f and returns the result
    * @param {number} f input scalar
    * @return {Matrix4X4}
    */
    multiplyScalar: function (f)
    {
        return new Matrix4X4(this.m11 * f, this.m12 * f, this.m13 * f, this.m14 * f,
                             this.m21 * f, this.m22 * f, this.m23 * f, this.m24 * f,
                             this.m31 * f, this.m32 * f, this.m33 * f, this.m34 * f,
                             this.m41 * f, this.m42 * f, this.m43 * f, this.m44 * f);
    },

    /**
    * Returns the transpose of the calling matrix
    * @return {Matrix4X4}
    */
    transpose: function ()
    {
        return new Matrix4X4(this.m11, this.m21, this.m31, this.m41,
                             this.m12, this.m22, this.m32, this.m42,
                             this.m13, this.m23, this.m33, this.m43,
                             this.m14, this.m24, this.m34, this.m44);
    },

    /**
    * Multiples the matrix by the column vector v
    * @param {Vector4} v input vector
    * @return {Vector4}
    */
    transformVector4: function (v)
    {
        var x = v.x,
            y = v.y,
            z = v.z,
            w = v.w;
        return new Vector4(this.m11 * x + this.m12 * y + this.m13 * z + this.m14 * w,
                           this.m21 * x + this.m22 * y + this.m23 * z + this.m24 * w,
                           this.m31 * x + this.m32 * y + this.m33 * z + this.m34 * w,
                           this.m41 * x + this.m42 * y + this.m43 * z + this.m44 * w);
    },

    /**
    * Multiples the matrix by the column vector v. This version of this method does 
    * not instantiate a new Vector4.
    * @param {Vector4} v input vector
    * @param {Vector4} out result vector
    */
    transformVector4Out: function (v, out)
    {
        var x = v.x,
            y = v.y,
            z = v.z,
            w = v.w;
        out.x = this.m11 * x + this.m12 * y + this.m13 * z + this.m14 * w;
        out.y = this.m21 * x + this.m22 * y + this.m23 * z + this.m24 * w;
        out.z = this.m31 * x + this.m32 * y + this.m33 * z + this.m34 * w;
        out.w = this.m41 * x + this.m42 * y + this.m43 * z + this.m44 * w;
    },

    /**
    * Multiples the matrix by the column vector v. It is assumed the Vector3 v value
    * is equivalent to a Vector4 instance with a w value of 0
    * @param {Vector3} v input vector
    * @return {Vector3}
    */
    transformVector3: function (v)
    {
        return new Vector3(this.m11 * v.x + this.m12 * v.y + this.m13 * v.z,
                           this.m21 * v.x + this.m22 * v.y + this.m23 * v.z,
                           this.m31 * v.x + this.m32 * v.y + this.m33 * v.z);
    },

    /**
    * Multiples the matrix by the column vector v. It is assumed the Vector3 v value
    * is equivalent to a Vector4 instance with a w value of 0. This version of this 
    * method does not instantiate a new Vector3.
    * @param {Vector3} v input vector
    * @param {Vector3} out result vector
    */
    transformVector3Out: function (v, out)
    {
        out.x = this.m11 * v.x + this.m12 * v.y + this.m13 * v.z;
        out.y = this.m21 * v.x + this.m22 * v.y + this.m23 * v.z;
        out.z = this.m31 * v.x + this.m32 * v.y + this.m33 * v.z;
    },

    /**
    * Returns the determinant of the calling matrix
    * @return {number}
    */
    determinant: function ()
    {
        var a, b, c, d, e, f, g, h, i, j, k, l;
        a = this.m11 * this.m22 - this.m12 * this.m21;
        b = this.m11 * this.m23 - this.m13 * this.m21;
        c = this.m11 * this.m24 - this.m14 * this.m21;
        d = this.m12 * this.m23 - this.m13 * this.m22;
        e = this.m12 * this.m24 - this.m14 * this.m22;
        f = this.m13 * this.m24 - this.m14 * this.m23;
        g = this.m31 * this.m42 - this.m32 * this.m41;
        h = this.m31 * this.m43 - this.m33 * this.m41;
        i = this.m31 * this.m44 - this.m34 * this.m41;
        j = this.m32 * this.m43 - this.m33 * this.m42;
        k = this.m32 * this.m44 - this.m34 * this.m42;
        l = this.m33 * this.m44 - this.m34 * this.m43;
        return a * l - b * k + c * j + d * i - e * h + f * g;
    },

    /**
    * Returns the inverse of the calling matrix.  If the matrix cannot be inverted
    * the the identity matrix is returned.
    * @return {Matrix4X4}
    */
    inverse: function ()
    {
        var a, b, c, d, e, f, g, h, i, j, k, l, determinant, invD,
            m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44;

        a = this.m11 * this.m22 - this.m12 * this.m21;
        b = this.m11 * this.m23 - this.m13 * this.m21;
        c = this.m11 * this.m24 - this.m14 * this.m21;
        d = this.m12 * this.m23 - this.m13 * this.m22;
        e = this.m12 * this.m24 - this.m14 * this.m22;
        f = this.m13 * this.m24 - this.m14 * this.m23;
        g = this.m31 * this.m42 - this.m32 * this.m41;
        h = this.m31 * this.m43 - this.m33 * this.m41;
        i = this.m31 * this.m44 - this.m34 * this.m41;
        j = this.m32 * this.m43 - this.m33 * this.m42;
        k = this.m32 * this.m44 - this.m34 * this.m42;
        l = this.m33 * this.m44 - this.m34 * this.m43;
        determinant = a * l - b * k + c * j + d * i - e * h + f * g;
        if (Math.abs(determinant) < MathHelper.zeroTolerance)
        {
            return Matrix4X4.createIdentity();
        }

        m11 = this.m22 * l - this.m23 * k + this.m24 * j;
        m12 = -this.m12 * l + this.m13 * k - this.m14 * j;
        m13 = this.m42 * f - this.m43 * e + this.m44 * d;
        m14 = -this.m32 * f + this.m33 * e - this.m34 * d;

        m21 = -this.m21 * l + this.m23 * i - this.m24 * h;
        m22 = this.m11 * l - this.m13 * i + this.m14 * h;
        m23 = -this.m41 * f + this.m43 * c - this.m44 * b;
        m24 = this.m31 * f - this.m33 * c + this.m34 * b;

        m31 = this.m21 * k - this.m22 * i + this.m24 * g;
        m32 = -this.m11 * k + this.m12 * i - this.m14 * g;
        m33 = this.m41 * e - this.m42 * c + this.m44 * a;
        m34 = -this.m31 * e + this.m32 * c - this.m34 * a;

        m41 = -this.m21 * j + this.m22 * h - this.m23 * g;
        m42 = this.m11 * j - this.m12 * h + this.m13 * g;
        m43 = -this.m41 * d + this.m42 * b - this.m43 * a;
        m44 = this.m31 * d - this.m32 * b + this.m33 * a;
        invD = 1.0 / determinant;
        return new Matrix4X4(m11 * invD, m12 * invD, m13 * invD, m14 * invD,
                             m21 * invD, m22 * invD, m23 * invD, m24 * invD,
                             m31 * invD, m32 * invD, m33 * invD, m34 * invD,
                             m41 * invD, m42 * invD, m43 * invD, m44 * invD);
    },

    /**
    * Returns a string containing the current state of the matrix.  Useful for debugging purposes
    * @return {string}
    */
    toString: function ()
    {
        return this.m11 + ", " + this.m12 + ", " + this.m13 + ", " + this.m14 + "\n" +
               this.m21 + ", " + this.m22 + ", " + this.m23 + ", " + this.m24 + "\n" +
               this.m31 + ", " + this.m32 + ", " + this.m33 + ", " + this.m34 + "\n" +
               this.m41 + ", " + this.m42 + ", " + this.m43 + ", " + this.m44 + "\n";
    },

    /**
     * If a value in the matrix is less than the tolerance value to zero, explicitly set to 0
     */
    pullToZero: function ()
    {

        if (Math.abs(this.m11) < MathHelper.zeroTolerance) { this.m11 = 0.0; }
        if (Math.abs(this.m12) < MathHelper.zeroTolerance) { this.m12 = 0.0; }
        if (Math.abs(this.m13) < MathHelper.zeroTolerance) { this.m13 = 0.0; }
        if (Math.abs(this.m14) < MathHelper.zeroTolerance) { this.m14 = 0.0; }
        if (Math.abs(this.m21) < MathHelper.zeroTolerance) { this.m21 = 0.0; }
        if (Math.abs(this.m22) < MathHelper.zeroTolerance) { this.m22 = 0.0; }
        if (Math.abs(this.m23) < MathHelper.zeroTolerance) { this.m23 = 0.0; }
        if (Math.abs(this.m24) < MathHelper.zeroTolerance) { this.m24 = 0.0; }
        if (Math.abs(this.m31) < MathHelper.zeroTolerance) { this.m31 = 0.0; }
        if (Math.abs(this.m32) < MathHelper.zeroTolerance) { this.m32 = 0.0; }
        if (Math.abs(this.m33) < MathHelper.zeroTolerance) { this.m33 = 0.0; }
        if (Math.abs(this.m34) < MathHelper.zeroTolerance) { this.m34 = 0.0; }
        if (Math.abs(this.m41) < MathHelper.zeroTolerance) { this.m41 = 0.0; }
        if (Math.abs(this.m42) < MathHelper.zeroTolerance) { this.m42 = 0.0; }
        if (Math.abs(this.m43) < MathHelper.zeroTolerance) { this.m43 = 0.0; }
        if (Math.abs(this.m44) < MathHelper.zeroTolerance) { this.m44 = 0.0; }
    },

    /**
    * Returns the matrix as a 1D array, in column major order
    */
    flattenColumnMajor: function ()
    {
        return [this.m11, this.m21, this.m31, this.m41,
                this.m12, this.m22, this.m32, this.m42,
                this.m13, this.m23, this.m33, this.m43,
                this.m14, this.m24, this.m34, this.m44];
    },
    /**
    * Returns the matrix as a 1D array, in row major order
    */
    flattenRowMajor: function ()
    {
        return [this.m11, this.m12, this.m13, this.m14,
                this.m21, this.m22, this.m23, this.m24,
                this.m31, this.m32, this.m33, this.m34,
                this.m41, this.m42, this.m43, this.m44];
    }

};

///#source 1 1 /Math/Plane.js
/**
 * A plane in 3D space.  Created from the generalized plane equation coefficients
 * @param {number} a A plane coefficient of Ax + By + Cz + D = 0
 * @param {number} b B plane coefficient of Ax + By + Cz + D = 0
 * @param {number} c C plane coefficient of Ax + By + Cz + D = 0
 * @param {number} d D plane coefficient of Ax + By + Cz + D = 0
 * @param {?Vector3} point A point on the plane, can be null if not specified
 * @constructor
 */
/* @constructor */function Plane(a, b, c, d, point)
{

    /**
     * The A coefficent of the generalized plane equation Ax + By + Cz + D = 0
     * @type {number}
     */
    this.a = a;

    /**
     * The B coefficent of the generalized plane equation Ax + By + Cz + D = 0
     * @type {number}
     */
    this.b = b;

    /**
     * The C coefficent of the generalized plane equation Ax + By + Cz + D = 0
     * @type {number}
     */
    this.c = c;

    /**
     * The D coefficent of the generalized plane equation Ax + By + Cz + D = 0
     * @type {number}
     */
    this.d = d;

    /**
     * The normal to the plane
     * @type {Vector3}
     */
    this.normal = new Vector3(this.a, this.b, this.c);

    /**
     * A point on the plane, can be null if not given
     * @type {?Vector3}
     */
    this.point = point;
};

/**
 * Given 3 points lying on the plane, returns a Plane instance.  The normal to the 
 * plane is normalized and is created by (p1 - p0) X (p2 - p0)
 * @param {Vector3} p0
 * @param {Vector3} p1
 * @param {Vector3} p2
 * @return {Plane}
 */
Plane.createFromPoints = function (p0, p1, p2)
{
    var u = p1.subtract(p0);
    var v = p2.subtract(p0);
    var n = u.cross(v);
    n = n.normalize();

    var d = -1 * (n.x * p0.x + n.y * p0.y + n.z * p0.z);
    return new Plane(n.x, n.y, n.z, d, null);
};

/**
 * Given the plane normal and a point on the plane returns a Plane instance
 * @param {Vector3} point A point that lies on the plane
 * @param {Vector3} normal The normal to the plane - IMPORTANT: must be normalized
 * @return {Plane}
 */
Plane.createFromPointAndNormal = function (point, normal)
{

    var d = -1 * (normal.x * point.x + normal.y * point.y + normal.z * point.z);
    return new Plane(normal.x, normal.y, normal.z, d, point);
};

/**
 * Performs a plane/ray intersection, if the ray and plane do intersect in the direction
 * of the ray the point will be returned, otherwise null will be returned
 * @param {Ray} ray
 * @param {Plane} plane
 * @return {?Vector3}
 */
/* @disable(0055) */
Plane.intersectWithRay = function (ray, plane)
{

    if (plane.point === null)
    {
        throw 'requires plane.point to not equal null';
    }

    //Check to see if ray and plane are perpendicular
    var dDotn = ray.direction.dot(plane.normal);
    if (MathHelper.isZero(dDotn))
    {
        return null;
    }

    var distance = plane.point.subtract(ray.origin).dot(plane.normal) / ray.direction.dot(plane.normal);
    if (distance <= 0)
    {
        return null;
    }

    return ray.origin.add(ray.direction.multiplyScalar(distance));
};

Plane.prototype = {

    /**
     * Transforms the plane normal by the specified transform matrix and returns a new normal
     * @param {Matrix4X4} transform A transform to apply to the plane normal
     * @return {Vector3}
     */
    transformNormal: function (transform)
    {
        //Plane normal must be transformed by transpose(inverse(M)) to be correct
        var m = transform.inverse().transpose();
        var n = m.transformVector3(this.normal);
        return new Vector3(n.x, n.y, n.z);
    },

    /**
     * Returns a string containing the generalized plane equation coefficients, A, B, C and D
     * @return {string}
     */
    toString: function ()
    {
        return 'A:' + this.a + ', B:' + this.b + ', C:' + this.c + ', D:' + this.d;
    }
};
/* @restore(0055) */

///#source 1 1 /Math/Quaternion.js
//For more information I would recommend "Essential Mathematics For Games", Van Verth, Bishop

/**
* Quaternion
* @constructor
*/
/* @constructor */function Quaternion(w, x, y, z)
{
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
}

/**
* Returns the identity quaternion.
* @return {Quaternion}
*/
Quaternion.createIdentity = function () {
    return new Quaternion(1, 0, 0, 0);
};

/**
* Creates a Quaternion from a rotation matrix
* @param {Matrix4X4} m rotation matrix  
* @return {Quaternion} 
*/
Quaternion.fromRotationMatrix = function (m) {
    //See: http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

    /*jslint onevar: false */
    //JSLint and I don't agree, as type annotions mean we need multiple vars.

    /** @type {number} */
    var trace; 

    /** @type {number} */
    var temp; 

    /** @type {Quaternion} */
    var result;

    /** @type {number} */
    var largestIndex;

    result = new Quaternion(0, 0, 0, 0);
    trace = m.m11 + m.m22 + m.m33;
    if (trace > MathHelper.zeroTolerance) {
        result.w = Math.sqrt(trace + 1) * 0.5;
        temp = 1.0 / (4 * result.w);
        result.x = (m.m32 - m.m23) * temp;
        result.y = (m.m13 - m.m31) * temp;
        result.z = (m.m21 - m.m12) * temp;
    }
    else {
        largestIndex = 0;
        if (m.m22 > m.m11) {
            largestIndex = 1;
            if (m.m33 > m.m22) {
                largestIndex = 2;
            }
        }
        else if (m.m33 > m.m11) {
            largestIndex = 2;
        }
       
        switch (largestIndex) {
        case 0:
            result.x = 0.5 * Math.sqrt(m.m11 - m.m22 - m.m33 + 1);
            temp = 1.0 / (4 * result.x);
            result.w = (m.m32 - m.m23) * temp;
            result.y = (m.m12 + m.m21) * temp;
            result.z = (m.m13 + m.m31) * temp;
            break;
        case 1:
            result.y = 0.5 * Math.sqrt(m.m22 - m.m11 - m.m33 + 1);
            temp = 1.0 / (4 * result.y);
            result.w = (m.m13 - m.m31) * temp;
            result.x = (m.m12 + m.m21) * temp;
            result.z = (m.m23 + m.m32) * temp;
            break;
        case 2:
            result.z = 0.5 * Math.sqrt(m.m33 - m.m11 - m.m22 + 1);
            temp = 1.0 / (4 * result.z);
            result.w = (m.m21 - m.m12) * temp;
            result.x = (m.m13 + m.m31) * temp;
            result.y = (m.m32 + m.m23) * temp;
            break;
        }
    }
    return result;
};

/**
* Creates a Quaternion from an axis and an angle
* @param {Vector3} axis The rotation axis, must be a unit vector
* @param {number} angle An angle in radians.  A positive angle will rotate anticlockwise around the axis
* @return {Quaternion}
*/
Quaternion.fromAxisAngle = function (axis, angle) {
    var halfAngle, s;
    halfAngle = 0.5 * angle;
    s = Math.sin(halfAngle);
    return new Quaternion(Math.cos(halfAngle), axis.x * s, axis.y * s, axis.z * s);
};

/**
* Creates a Quaternion from an axis and an angle. This version of this method does not instantiate a new quaternion.
* @param {Vector3} axis The rotation axis, must be a unit vector
* @param {number} angle An angle in radians.  A positive angle will rotate anticlockwise around the axis
* @param {Quaternion} out the resulting Quaternion
*/
Quaternion.fromAxisAngleOut = function (axis, angle, out)
{
    var halfAngle, s;
    halfAngle = 0.5 * angle;
    s = Math.sin(halfAngle);
    out.w = Math.cos(halfAngle);
    out.x = axis.x * s;
    out.y = axis.y * s;
    out.z = axis.z * s;
};

/**
* Returns a quaternion that has been slerped between source and target by t amount
* @param {number} t A value between 0.0 and 1.0 inclusive
* @param {Quaternion} source The starting quaternion value
* @param {Quaternion} target The target quaternion value
* @return {Quaternion}
*/
Quaternion.slerp = function (t, source, target) {
    var cos, angle, sin, invSin, a, b;
    
    if (t === 0.0) {
        return source;
    }
    if (t >= 1.0) {
        return target;
    }
    
    cos = source.dot(target);
    angle = Math.acos(cos);

    if (Math.abs(angle) >= MathHelper.zeroTolerance) {
        sin = Math.sin(angle);
        invSin = 1.0 / sin;
        a = Math.sin((1.0 - t) * angle) * invSin;
        b = Math.sin(t * angle) * invSin;
        return source.multiplyScalar(a).add(target.multiplyScalar(b));
    }
    
    return source;
};

Quaternion.prototype = 
{
    /**
    * Returns the dot product of two Quaternions
    * @param {Quaternion} q input quaternion
    * @return {number}
    */
    dot: function (q) {
        return this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z;
    },
    
    /**
    * Calculates the length of the Quaternion
    * @return {number}
    */
    length: function () {
        return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
    },
    
    /**
    * Creates a unit length version of the Quaternion
    * @return {Quaternion}
    */
    normalize: function () {
        var length, inverseLength;
        
        length = this.length();
        if (length < MathHelper.zeroTolerance) {
            return new Quaternion(0.0, 0.0, 0.0, 0.0);
        }

        inverseLength = 1.0 / length;
        return new Quaternion(this.w * inverseLength,
                              this.x * inverseLength,
                              this.y * inverseLength,
                              this.z * inverseLength);
    },
    
    /**
    * Returns the inverse of the calling quaternion
    * @return {Quaternion} If the Quaternion cannot be inversed, a Quaternion with x,y,z,w == 0.0 is returned
    */
    inverse: function () {
        var norm, invNorm;
        
        norm = this.w * this.w + this.x * this.x + this.y * this.y * this.z * this.z;
        if (Math.abs(norm) > MathHelper.zeroTolerance) {
            invNorm = 1.0 / norm;
            return new Quaternion(this.w * invNorm,
                                  -this.x * invNorm,
                                  -this.y * invNorm,
                                  -this.z * invNorm);
        }
        return new Quaternion(0.0, 0.0, 0.0, 0.0);
    },
    
    /**
    * Returns the conjugate of the quaternion
    * @return {Quaternion}
    */
    conjugate: function () {
        return new Quaternion(this.w, -this.x, -this.y, -this.z);
    },
    
    /**
    * Applies the quaternion rotation to the input vector and returns the result
    * @param {Vector3} v input vector to be rotated
    * @return {Vector3} The rotated vector
    */
    transform: function (v) {
        
        //See Bishop, Van Verth (make sure to look at the errata)
        var p, d, c;
        d = 2.0 * (this.x * v.x + this.y * v.y + this.z * v.z);
        c = 2.0 * this.w;
        p = c * this.w - 1.0;
        return new Vector3(p * v.x + d * this.x + c * (this.y * v.z - this.z * v.y),
                           p * v.y + d * this.y + c * (this.z * v.x - this.x * v.z),
                           p * v.z + d * this.z + c * (this.x * v.y - this.y * v.x));
    },

    /**
    * Applies the quaternion rotation to the input vector and returns the result. This version of 
    * this method does not instantiate a new vector.
    * @param {Vector3} v input vector to be rotated
    * @param {Vector3} out The rotated vector
    */
    transformOut: function (v, out)
    {
        //See Bishop, Van Verth (make sure to look at the errata)
        var p, d, c;
        d = 2.0 * (this.x * v.x + this.y * v.y + this.z * v.z);
        c = 2.0 * this.w;
        p = c * this.w - 1.0;

        out.x = p * v.x + d * this.x + c * (this.y * v.z - this.z * v.y);
        out.y = p * v.y + d * this.y + c * (this.z * v.x - this.x * v.z);
        out.z = p * v.z + d * this.z + c * (this.x * v.y - this.y * v.x);
    },
    
    add: function (q) {
        return new Quaternion(this.w + q.w, this.x + q.x, this.y + q.y, this.z + q.z);
    },
    
    /**
    * Returns a Quaternion representing the result of multiplying the calling Quaternion by Quaternion q
    * like q2 * q1 where q1 is applied before q2
    * @param {Quaternion} q input quaternion
    * @return {Quaternion}
    */
    multiply: function (q) {
        return new Quaternion(this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
                              this.y * q.z - this.z * q.y + this.w * q.x + q.w * this.x,
                              this.z * q.x - this.x * q.z + this.w * q.y + q.w * this.y,
                              this.x * q.y - this.y * q.x + this.w * q.z + q.w * this.z);
    },

    /**
    * Returns a Quaternion representing the result of multiplying the calling Quaternion by Quaternion q.
    * This version of this method does not instantiate a new quaternion.
    * like q2 * q1 where q1 is applied before q2
    * @param {Quaternion} q input quaternion
    * @param {Quaternion} out result quaternion
    */
    multiplyOut: function (q, out)
    {
        out.w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
        out.x = this.y * q.z - this.z * q.y + this.w * q.x + q.w * this.x;
        out.y = this.z * q.x - this.x * q.z + this.w * q.y + q.w * this.y;
        out.z = this.x * q.y - this.y * q.x + this.w * q.z + q.w * this.z;
    },
    
    /**
    * Multiplies each element in the Quaternion by the scalar f
    * @param {number} f input scalar
    * @return {Quaternion}
    */
    multiplyScalar: function (f) {
        return new Quaternion(this.w * f, this.x * f, this.y * f, this.z * f);
    },
    
    /**
    * Converts the quaternion to a rotation matrix
    * @return {Matrix4X4}
    */
    toRotationMatrix: function () {
        var x, y, z, wx, wy, wz, xx, xy, xz, yy, yz, zz;
        x = 2.0 * this.x;
        y = 2.0 * this.y;
        z = 2.0 * this.z;
        wx = x * this.w;
        wy = y * this.w;
        wz = z * this.w;
        xx = x * this.x;
        xy = y * this.x;
        xz = z * this.x;
        yy = y * this.y;
        yz = z * this.y;
        zz = z * this.z;
        
        return new Matrix4X4(1.0 - (yy + zz), xy - wz, xz + wy, 0,
                             xy + wz, 1.0 - (xx + zz), yz - wx, 0,
                             xz - wy, yz + wx, 1.0 - (xx + yy), 0,
                             0, 0, 0, 1);
    },
    
    /**
    * Converts the Quaternion to an axis and an angle
    * @return {Vector4} Containing the values x,y,z,angle where angle is in radians
    */
    toAxisAngle: function () {
        var lengthSquared, inverseLength;
        
        lengthSquared = this.x * this.x + this.y * this.y + this.z * this.z;
        if (lengthSquared > MathHelper.zeroTolerance) {
            inverseLength = MathHelper.invSqrt(lengthSquared);
            return new Vector4(this.x * inverseLength, this.y * inverseLength, this.z * inverseLength, 2.0 * Math.acos(this.w));
        }
        return new Vector4(1, 0, 0, 0);
    },
    
    /**
    * Returns a string containing the current state of the Quaternion
    * @return {string}
    */
    toString: function () {
        return '[' + this.w + ', ' + this.x + ', ' + this.y + ', ' + this.z + ']';
    }
};

///#source 1 1 /Math/Ray.js
/**
 * A class representing a 3D ray
 * @param {Vector3} origin The origin of the ray
 * @param {Vector3} direction The direction vector of the ray.  IMPORTANT: must be a unit vector
 * @constructor
 */
function Ray(origin, direction) {

    /**
     * The origin of the ray
     * @type {Vector3}
     */
    this.origin = origin;

    /**
     * A unit vector indicating the direction of the ray
     * @type {Vector3}
     */
    this.direction = direction;
};

///#source 1 1 /Math/Rectangle.js
/**
*@constructor
*/
/* @constructor */function Rectangle(x, y, width, height)
{
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

Rectangle.prototype = {

    intersect: function (rect) {
        if (!this.intersectsWith(rect)) {
            this.x = this.y = this.width = this.height = 0;
        }
        else {
            var num = Math.max(this.x, rect.x);
            var num2 = Math.max(this.y, rect.y);
            this.width = Math.max((Math.min((this.x + this.width), (rect.x + rect.width)) - num), 0.0);
            this.height = Math.max((Math.min((this.y + this.height), (rect.y + rect.height)) - num2), 0.0);
            this.x = num;
            this.y = num2;
        }
    },

    intersectsWith: function (rect) {
        if ((this.width < 0.0) || (rect.width < 0.0)) {
            return false;
        }
        return ((((rect.x <= (this.x + this.width)) && ((rect.x + rect.width) >= this.x)) && (rect.y <= (this.y + this.height))) && ((rect.y + rect.height) >= this.y));
    },

    getLeft: function () {
        return this.x;
    },

    getRight: function () {
        return this.x + this.width;
    },

    getTop: function () {
        return this.y;
    },

    getBottom: function () {
        return this.y + this.height;
    }
};

///#source 1 1 /Math/Vector2.js
/**
* A vector class representing two dimensional space
* @constructor
* @param {number} x
* @param {number} y
*/
/* @constructor */function Vector2(x, y)
{
    this.x = x || 0;
    this.y = y || 0;
}

Vector2.clone = function (v) {
    return new Vector2(v.x, v.y);
};

Vector2.prototype = {
    /**
    * Calculates the dot product between the calling vector and parameter v
    * @param {Vector2} v input vector
    * @return {number}
    */
    dot: function (v) {
        return this.x * v.x + this.y * v.y;
    },

    /**
    * Returns a new vector that's perpendicular to this vector
    * @return {Vector2}
    */
    perp: function () {
        return new Vector2(this.y, -this.x);
    },

    /**
    * Creates a unit length version of the vector, which still points in the same direction as the original vector
    * @return {Vector2}
    */
    normalize: function () {
        var length, inverseLength;
        
        length = this.length();
        if (length < MathHelper.zeroTolerance) {
            return new Vector2(0.0, 0.0);
        }

        inverseLength = 1.0 / length;
        return new Vector2(this.x * inverseLength,
                           this.y * inverseLength);
    },

    /**
    * Calculates the length of the vector
    * @return {number}
    */
    length: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    /**
    * Calculates the length of the vector squared.  Useful if only a relative length
    * check is required, since this is more performant than the length() method
    * @return {number}
    */
    lengthSquared: function () {
        return this.x * this.x + this.y * this.y;
    },

    /**
    * Adds vector v to the current vector and returns the result.
    * @param {Vector2} v input vector
    * @returns {Vector2} A vector containing the addition of the two input vectors
    */
    add: function (v) {
        return new Vector2(this.x + v.x,
                           this.y + v.y);
    },

    /**
    * Subtracts vector v from the current vector and returns the result.
    * @param {Vector2} v input vector
    * @returns {Vector2} A vector containing the subtraction of the two input vectors
    */
    subtract: function (v) {
        return new Vector2(this.x - v.x,
                           this.y - v.y);
    },

    /**
    * Multiplies each element of the vector with scalar f and returns the result
    * @param {number} f a value that will be multiplied with each element of the vector
    * @return {Vector2}
    */
    multiplyScalar: function (f) {
        return new Vector2(this.x * f,
                           this.y * f);
    },

    /**
    * Checks if the calling vector is equal to parameter vector v
    * @param {Vector2} v input vector
    * @returns {boolean} A Boolean value, true if each element of the calling vector match input vector v, false otherwise
    */
    equals: function (v) {
        return this.x === v.x &&
               this.y === v.y;
    },

    /**
    * Linearly interpolates between two vectors (including w component).
    * @param {Vector2} other second vector to LERP between.
    * @param {number} alpha value between 0-1.
    * @return {Vector2} 
    */
    lerp: function(other, alpha) {
        return new Vector2(this.x + alpha*(other.x - this.x),
                           this.y + alpha*(other.y - this.y));
    },


    
    /**
    * Returns a string containing the current state of the vector, useful for debugging purposes
    * @return {string}
    */
    toString: function () {
        return '[' + this.x + ', ' + this.y + ']';
    }
};

///#source 1 1 /Math/Vector3.js
/**
* A vector class representing three dimensional space
* @constructor
* @param {number} x
* @param {number} y
* @param {number} z
*/
/* @constructor */function Vector3(x, y, z)
{
    this.x = x;
    this.y = y;
    this.z = z;
}

/**
* Creates a Vector3 instance from a Vector3 instance
* @param {Vector2} v A Vector2 instance
* @param {number} z The z value to return in the Vector3 instance
* @return {Vector3}
*/
Vector3.createFromVector2 = function(v, z) {
    return new Vector3(v.x, v.y, z);
};

Vector3.clone = function (v) {
    return new Vector3(v.x, v.y, v.z);
};

Vector3.prototype = {
    /**
    * Calculates the dot product between the calling vector and parameter v
    * @param {Vector3} v input vector
    * @return {number}
    */
    dot: function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    },

    /**
    * Creates a unit length version of the vector, which still points in the same direction as the original vector
    * @return {Vector3}
    */
    normalize: function () {
        var length, inverseLength;
        
        length = this.length();
        if (length < MathHelper.zeroTolerance) {
            return new Vector3(0.0, 0.0, 0.0);
        }

        inverseLength = 1.0 / length;


        return new Vector3(this.x * inverseLength,
                           this.y * inverseLength,
                           this.z * inverseLength);
    },

    /**
    * Creates a unit length version of the vector, which still points in the same direction 
    * as the original vector. This version of this method does not instantiate a new vector.
    * @param {Vector3} out result vector
    */
    normalizeOut: function (out)
    {
        var length, inverseLength;

        length = this.length();
        if (length < MathHelper.zeroTolerance)
        {
            out.x = 0.0;
            out.y = 0.0;
            out.z = 0.0;
            return;
        }

        inverseLength = 1.0 / length;

        out.x = this.x * inverseLength;
        out.y = this.y * inverseLength,
        out.z = this.z * inverseLength;
        return;
    },

    /**
    * Calculates the cross product of the vector and vector parameter v and returns the result
    * @param {Vector3} v input vector
    * @return {Vector3}
    */
    cross: function (v) {
        return new Vector3(this.y * v.z - this.z * v.y,
                           this.z * v.x - this.x * v.z,
                           this.x * v.y - this.y * v.x);
    },

    /**
    * Calculates the cross product of the vector and vector parameter v and returns the result.
    * This version of this method does not instantiate a new vector.
    * @param {Vector3} v input vector
    * @param {Vector3} out result vector
    */
    crossOut: function (v, out)
    {
        out.x = this.y * v.z - this.z * v.y;
        out.y = this.z * v.x - this.x * v.z;
        out.z = this.x * v.y - this.y * v.x;
    },

    /**
    * Calculates the length of the vector
    * @return {number}
    */
    length: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },

    /**
    * Calculates the length of the vector squared.  Useful if only a relative length
    * check is required, since this is more performant than the length() method
    * @return {number}
    */
    lengthSquared: function () {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    },

    /**
    * Adds vector v to the current vector and returns the result.
    * @param {Vector3} v input vector
    * @returns {Vector3} A vector containing the addition of the two input vectors
    */
    add: function (v) {
        return new Vector3(this.x + v.x,
                           this.y + v.y,
                           this.z + v.z);
    },

    /**
    * Subtracts vector v from the current vector and returns the result.
    * @param {Vector3} v input vector
    * @returns {Vector3} A vector containing the subtraction of the two input vectors
    */
    subtract: function (v) {
        return new Vector3(this.x - v.x,
                           this.y - v.y,
                           this.z - v.z);
    },

    /**
    * Subtracts vector v from the current vector and returns the result. This version of 
    * this method does not instantiate a new vector.
    * @param {Vector3} v input vector
    * @param {Vector3} out result vector
    */
    subtractOut: function (v, out)
    {
        out.x = this.x - v.x;
        out.y = this.y - v.y;
        out.z = this.z - v.z;
    },

    /**
    * Multiplies each element of the vector with scalar f and returns the result
    * @param {number} f a value that will be multiplied with each element of the vector
    * @return {Vector3}
    */
    multiplyScalar: function (f) {
        return new Vector3(this.x * f,
                           this.y * f,
                           this.z * f);
    },

    /**
    * Multiplies each element of the vector with scalar f and returns the result.
    * This version of this method does not instantiate a new vector.
    * @param {number} f a value that will be multiplied with each element of the vector
    * @param {Vector3} out result vector
    */
    multiplyScalarOut: function (f, out)
    {
        out.x = this.x * f;
        out.y = this.y * f;
        out.z = this.z * f;
    },

    /**
    * Checks if the calling vector is equal to parameter vector v
    * @param {Vector3} v input vector
    * @return {boolean} A Boolean value, true if each element of the calling vector match input vector v, false otherwise
    */
    equals: function (v) {
        return this.x === v.x &&
               this.y === v.y &&
               this.z === v.z;
    },

    /**
    * Linearly interpolates between two vectors (including w component).
    * @param {Vector3} other second vector to LERP between.
    * @param {number} alpha  value between 0-1.
    * @return {Vector3} 
    */
    lerp: function(other, alpha) {
        return new Vector3(this.x + alpha*(other.x - this.x),
                           this.y + alpha*(other.y - this.y),
                           this.z + alpha*(other.z - this.z));
    },

    /**
    * Returns a string containing the current state of the vector, useful for debugging purposes
    * @return {string}
    */
    toString: function () {
        return '[' + this.x + ', ' + this.y + ', ' + this.z + ']';
    }
};

///#source 1 1 /Math/Vector4.js
/**
* A vector class representing four dimensional space
* @constructor
* @param {number} x
* @param {number} y
* @param {number} z
* @param {number} w
*/
/* @constructor */function Vector4(x, y, z, w)
{
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
}

/**
 * Creates a Vector4 instance from a Vector3 isntance, w is set to 1.0
 * @param {Vector3} v
 * @return {Vector4}
 */
Vector4.createFromVector3 = function(v) {
    return new Vector4(v.x, v.y, v.z, 1);
};

Vector4.prototype = {
    /**
    * Calculates the dot product between the calling vector and parameter v
    * @param {Vector4} v input vector
    * @return {number}
    */
    dot: function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    },

    /**
    * Creates a unit length version of the vector, which still points in the same direction as the original vector
    * @return {Vector4}
    */
    normalize: function () {
        var length, inverseLength;
        
        length = this.length();
        if (length < MathHelper.zeroTolerance) {
            return new Vector4(0.0, 0.0, 0.0, 0.0);
        }

        inverseLength = 1.0 / length;
        return new Vector4(this.x * inverseLength,
                           this.y * inverseLength,
                           this.z * inverseLength,
                           this.w * inverseLength);
    },

    /**
    * Calculates the length of the vector
    * @return {number}
    */
    length: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    },

    /**
    * Calculates the length of the vector squared.  Useful if only a relative length
    * check is required, since this is more performant than the length() method
    * @return {number}
    */
    lengthSquared: function () {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    },

    /**
    * Adds vector v to the current vector and returns the result.
    * @param {Vector4} v input vector
    * @return {Vector4} A vector containing the addition of the two input vectors
    */
    add: function (v) {
        return new Vector4(this.x + v.x,
                           this.y + v.y,
                           this.z + v.z,
                           this.w + v.w);
    },

    /**
    * Subtracts vector v from the current vector and returns the result.
    * @param {Vector4} v input vector
    * @return {Vector4} A vector containing the subtraction of the two input vectors
    */
    subtract: function (v) {
        return new Vector4(this.x - v.x,
                           this.y - v.y,
                           this.z - v.z,
                           this.w - v.w);
    },

    /**
    * Multiplies each element of the vector with scalar f and returns the result
    * @param {number} f a value that will be multiplied with each element of the vector
    * @return {Vector4}
    */
    multiplyScalar: function (f) {
        return new Vector4(this.x * f,
                           this.y * f,
                           this.z * f,
                           this.w * f);
    },

    /**
    * Checks if the calling vector is equal to parameter vector v
    * @param {Vector4} v input vector
    * @return {boolean} A Boolean value, true if each element of the calling vector match input vector v, false otherwise
    */
    equals: function (v) {
        return this.x === v.x &&
               this.y === v.y &&
               this.z === v.z &&
               this.w === v.w;
    },

    /**
    * Linearly interpolates between two vectors (including w component).
    * @param {Vector4} other second vector to LERP between.
    * @param {number} alpha  value between 0-1.
    * @return {Vector4} 
    */
    lerp: function(other, alpha) {
        return new Vector4(this.x + alpha*(other.x - this.x),
                           this.y + alpha*(other.y - this.y),
                           this.z + alpha*(other.z - this.z),
                           this.w + alpha*(other.w - this.w));
    },

    /**
    * Returns a string containing the current state of the vector, useful for debugging purposes
    * @return {string}
    */
    toString: function () {
        return '[' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ']';
    }
};

///#source 1 1 /Math/GraphicsMathHelper.js
/**
* @file GraphicsMathHelper.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author cstein/vihalits
* @date 2012-07-19
*/

/**
* Provides common graphics helper function
* @class
*/
/* @disable(0092) */
var GraphicsHelper = {};

GraphicsHelper.rotatedPos = new Vector3(0, 0, 0);
GraphicsHelper.viewSide = new Vector3(0, 0, 0);
GraphicsHelper.viewUp = new Vector3(0, 0, 0);

/**
* Creates a right handed look at matrix.  This is with +Z coming
* towards the viewer, +X is to the right and +Y is up
* @param {Vector3} position The position of the eye
* @param {Vector3} look The look direction
* @param {Vector3} up The up direction
* @param {Vector3} out The result
*/
GraphicsHelper.createLookAtRHOut = function (position, look, up, out)
{
    var rotatedPos = GraphicsHelper.rotatedPos,
        viewSide = GraphicsHelper.viewSide,
        viewUp = GraphicsHelper.viewUp;

    // All the vector and matrix math are done in place/or re-used 
    // so other than the first instantiation of the objects when 
    // GraphicsHelper is loaded into memory, no extra objects are 
    // created.
    look.normalizeOut(look);
    up.normalizeOut(up);

    look.multiplyScalarOut(up.dot(look), viewUp);
    up.subtractOut(viewUp, viewUp);
    viewUp.normalizeOut(viewUp);
    look.crossOut(viewUp, viewSide);

    out.m11 = viewSide.x;
    out.m12 = viewSide.y;
    out.m13 = viewSide.z;
    out.m21 = viewUp.x;
    out.m22 = viewUp.y;
    out.m23 = viewUp.z;
    out.m31 = -look.x;
    out.m32 = -look.y;
    out.m33 = -look.z;
    out.transformVector3Out(position, rotatedPos);
    out.m14 = -rotatedPos.x;
    out.m24 = -rotatedPos.y;
    out.m34 = -rotatedPos.z;
};

/**
* Creates a perspective projection matrix for use with column vectors.
* The near and far planes are mapped to [0, -1]
* @param {number} verticalFov The vertical field of view
* @param {number} aspectRatio The aspect ratio of the viewport
* @param {number} near The distance to the near plane
* @param {number} far The distance to the far plane
* @param {Vector2} digitalPan X and Y value defining how much to translate the projected
* imagery in 2D.  Values are in viewport dimension, so a value of 1 for the X would mean shift
* all projected 2D values to the right viewportWidth pixels
* @return {Matrix4X4}
*/
GraphicsHelper.createPerspective = function (verticalFov,
                                             aspectRatio,
                                             near,
                                             far,
                                             digitalPan)
{

    var d;
    d = 1.0 / Math.tan(verticalFov / 2.0);

    var projection = new Matrix4X4(d / aspectRatio, 0, digitalPan.x * 2, 0,
                                   0, d, digitalPan.y * 2, 0,
                                   0, 0, far / (far - near), -(near * far) / (far - near),
                                   0, 0, -1, 0);
    return projection;
};

/**
 * Creates a perspective projection from clip volume boundaries. (like glFrustum).
 * note the following relations should hold l < r, b < t, n < f.
 * @param {number} l left 
 * @param {number} r right
 * @param {number} b bottom
 * @param {number} t top
 * @param {number} n near
 * @param {number} f far
 * @param {Matrix4X4} out The perspective projection.
 */
GraphicsHelper.createPerspectiveFromFrustumOut = function (l, r, b, t, n, f, out)
{
    out.m11 = (2.0 * n) / (r - l);
    out.m12 = 0.0;
    out.m13 = (r + l) / (r - l);
    out.m14 = 0.0;

    out.m21 = 0.0;
    out.m22 = (2.0 * n) / (t - b);
    out.m23 = (t + b) / (t - b);
    out.m24 = 0.0;

    out.m31 = 0.0;
    out.m32 = 0.0;
    out.m33 = (-1.0 * (f + n)) / (f - n);
    out.m34 = (-2.0 * f * n) / (f - n);

    out.m41 = 0.0;
    out.m42 = 0.0;
    out.m43 = -1.0;
    out.m44 = 0.0;
};

/** 
 * Creates a perpective projection (similiar to gluPerspective.) 
 * @param {number} verticalFov  fovy in radians.
 * @param {number} aspectRatio
 * @param {number} near  distance to the near z-plane. (Should be non-negative.)
 * @param {number} far   distance to the far  z-plane. (Should be non-negative, and greater than near.)
 * @param {Matrix4X4} out The perspective projection.
 */
GraphicsHelper.createPerspectiveOGLOut = function (verticalFov,
                                                   aspectRatio,
                                                   near,
                                                   far,
                                                   out)
{

    //Phrase this in terms of frustum boundaries, as that's how most texts present this projection..
    var yMax = near * Math.tan(verticalFov / 2),
        yMin = -yMax,
        xMin = yMin * aspectRatio,
        xMax = yMax * aspectRatio,
        zMin = near,
        zMax = far;
    GraphicsHelper.createPerspectiveFromFrustumOut(xMin, xMax, yMin, yMax, zMin, zMax, out);
};

/**
* Transforms all points onto the specified plane from the projector position
* @param {Vector3} position The position of the projector in world space
* @param {Plane} plane The plane where the geometry will be projected onto
* @return {Matrix4X4} A transform that projects any point onto the specified plane from the perspetive
*                     of the specified projector parameters
*/
GraphicsHelper.projectOntoPlane = function (position, plane)
{

    //See Real-time rendering, page 333, planar shadows, to see how the following matrix is derived

    var l = position;
    var n = plane.normal;
    var d = plane.d;
    var nDotL = n.dot(l);
    var m11 = nDotL + d - l.x * n.x;
    var m12 = -l.x * n.y;
    var m13 = -l.x * n.z;
    var m14 = -l.x * d;
    var m21 = -l.y * n.x;
    var m22 = nDotL + d - l.y * n.y;
    var m23 = -l.y * n.z;
    var m24 = -l.y * d;
    var m31 = -l.z * n.x;
    var m32 = -l.z * n.y;
    var m33 = nDotL + d - l.z * n.z;
    var m34 = -l.z * d;
    var m41 = -n.x;
    var m42 = -n.y;
    var m43 = -n.z;
    var m44 = nDotL;
    return new Matrix4X4(m11, m12, m13, m14,
                         m21, m22, m23, m24,
                         m31, m32, m33, m34,
                         m41, m42, m43, m44);
};

GraphicsHelper.createViewportToScreen = function (width, height)
{
    var n = Matrix4X4.createIdentity();
    n.m11 = width / 2.0;
    n.m12 = 0;
    n.m13 = 0;
    n.m14 = 0;

    n.m21 = 0;
    n.m22 = -1 * height / 2.0;
    n.m23 = 0;
    n.m24 = 0;

    n.m31 = 0;
    n.m32 = 0;
    n.m33 = 1;
    n.m34 = 0;

    n.m41 = width / 2;
    n.m42 = height / 2;
    n.m43 = 0;
    n.m44 = 1;
    n = n.transpose();
    return n;
};

GraphicsHelper.parseQuaternion = function (qx, qy, qz)
{
    //Since we know this is a unit quaternion we can calculate w
    var wSquared = 1.0 - (qx * qx + qy * qy + qz * qz);
    if (wSquared < MathHelper.zeroTolerance)
    {
        wSquared = 0.0;
    }
    return new Quaternion(Math.sqrt(wSquared), qx, qy, qz);
};

//TODO: everything GraphicsHelper._* here is datasource/world-specific and should not be kept here
GraphicsHelper._halfCube = 0.5;
GraphicsHelper._halfCubeSquared = GraphicsHelper._halfCube * GraphicsHelper._halfCube;
GraphicsHelper._cubeSide = GraphicsHelper._halfCube * 2;
/**
* This is used in places where the cornerbase would be required by the code, but would be neglected afterwards. 
* Do not use for any meaningfull purpose as values inside the array may be modified at any time
*/
GraphicsHelper._dummyCornerBase = [new Vector4(0, 1, 0, 1),
                                   new Vector4(0, 0, 0, 1),
                                   new Vector4(1, 0, 0, 1),
                                   new Vector4(1, 1, 0, 1)];
/**
* This would be the coords for the base cube side    
* TODO: This has little to no relation to what's going on later with this side. The setup of the side is very tightly related to a bunch of other code 
* in Geometry/Datasource classes and by no means is the utility/generic thing. Change here would adversely affect datasource math.
*/
GraphicsHelper.cubeSideBase = [new Vector4(-GraphicsHelper._halfCube, -GraphicsHelper._halfCube, -GraphicsHelper._halfCube, 1),
                                   new Vector4(-GraphicsHelper._halfCube, GraphicsHelper._halfCube, -GraphicsHelper._halfCube, 1),
                                   new Vector4(GraphicsHelper._halfCube, GraphicsHelper._halfCube, -GraphicsHelper._halfCube, 1),
                                   new Vector4(GraphicsHelper._halfCube, -GraphicsHelper._halfCube, -GraphicsHelper._halfCube, 1)];

/**
* This would be the coords for the base imagery, tied to the cube side OR to the tile on the cube side if cube side is tiled(happens on higher LODs)    
* TODO: The setup of the side is very tightly related to a bunch of other code in Geometry/Datasource classes and by no means is the utility/generic thing. 
* Change here would adversely affect datasource math.
*/
GraphicsHelper._texelCornersBase = [new Vector4(0, 1, 0, 1),
                                    new Vector4(0, 0, 0, 1),
                                    new Vector4(1, 0, 0, 1),
                                    new Vector4(1, 1, 0, 1)];

//TODO: should be rewritten in a way that optional params and the ones that are not used by any callee are the last ones or omitted at all.
/**
 * @desc  This function would split the {square} in a recursive way using either side halfing or angle halving technique. It is unticipated that 
 *        the polygon is a {Vector4}. Function would also split the corresponding {texelSquare} making shure split proportions are the same in both polygons.
 *        Currently only 4 point polygons are supported and the code is tested to work when polygon has the same Z coordinate in all 4 points. Results for arbitrary Z might be correct, but have not be verified yet.
 *        W component stays untouched. Original polygons do not get modified, but can be included in the result.
 * @param {array}    square - the 4 point {Vector4} array;
 * @param {array}    texelSquare the 4 point {Vector4} array;
 * @param {int}      depth  - the amount of splits to execute. 0 Would indicate the same polygon being returned. 1 would yield each side split half - thus 4 polygons, 2 - each side split 4 times - thus 16 polygons and so on.
 * @param {object}   initialParams - not used by the callee
 * @param {array}    splitTiles - an array that will hold all the split squares and texelSquares.  
 *                   If you only want squares, create a variable and set it to: {squares:[],texelSquares:[]}
 *                   This parameter is required.
 * @param {bool}     isSpheric -  to indicate if side split or angle(spheric) split should be used.
 * @param {array}    texelCornersBase - the default polygon to use for the intileTesselated things //TODO: remove this param as it's intention is lost with the current changes. 
 * @param {function} processorFunction - A processor function that will process the squares created
 *        by this method and add them to the splitTiles array any way necessary. Leaving this field
 *        null will default the method to only returning squares and texel squares in the splitTiles
 *        array. The method signature for the processorFunction should be:
 *
 *          processorFunction(splitTiles, square, texelSquare, processorFunctionData)
 *
 * @param {function} processorFunctionData - Optional data to pass to the processorFunction.
 * //TODO: these 2 params have no connection to the splitSquare function thus should be refactored out to the callee/consumer code.
 * @param {int} tileWidth - Optional tile width
 * @param {int} tileHeight - Optional tile height
 */
GraphicsHelper.splitSquareRecursive = function (square, texelSquare, depth, initialParams, splitTiles, isSpheric, texelCornersBase, processorFunction, processorFunctionData, tileWidth, tileHeight)
{
    if (!processorFunction)
    {
        processorFunction = function (resultSplitTiles, resultSquare, resultTexelSquare)
        {
            resultSplitTiles.squares.push(resultSquare);
            resultSplitTiles.texelSquares.push(resultTexelSquare);
        };
    }

    //currently code handles only squares, as the name implies.
    if (square.length != 4)
    {
        throw 'Invalid square array supplied.';
    }

    //recursive brake condition;
    if (depth == 0)
    {
        //calculate position of the split square in the virtual MxN grid 
        var squareZero = square[0];
        var squareTwo = square[2];
        var startingX = isSpheric ? (squareZero.x + squareTwo.x) / 2 : squareZero.x;
        var startingY = isSpheric ? (squareTwo.y + squareZero.y) / 2 : squareTwo.y;

        square.x = initialParams ? Math.floor((startingX - initialParams.initialX) / initialParams.widthFr) : 0;
        square.y = initialParams ? Math.floor(initialParams.total - (startingY - initialParams.initialY) / initialParams.heightFr) : 0;

        if (splitTiles)
        {
            processorFunction(splitTiles,
                              square,
                              texelSquare || texelCornersBase,
                              processorFunctionData,
                              tileWidth,
                              tileHeight);
        }

        return;
    }

    var firstVert = square[0],
        secondVert = square[1],
        fourthVert = square[3];

    //this is the structure that will hold miscelanious params needed for recursive calling
    initialParams = initialParams ||
    (function ()
    {
        //total is the number of rows/columns the final split square will have
        var total = Math.pow(2, depth),
        fvx = firstVert.x,
        fvy = firstVert.y;

        return {
            total: total,
            widthFr: Math.abs((fourthVert.x - fvx) / total),
            heightFr: Math.abs((secondVert.y - fvy) / total),
            initialX: fvx,
            initialY: fvy
        };
    }
    )();

    //split the square. Each side by half thus getting 4 new squares
    var newPolys = getFourPolys(square, isSpheric, texelSquare);

    depth--;
    //TODOL: replace with 4 function calls as code works only with 4 quads.
    for (var i = 0, newPolyslength = newPolys.xy.length; i < newPolyslength; i++)
    {
        GraphicsHelper.splitSquareRecursive(newPolys.xy[i],
                                            newPolys.uv ? newPolys.uv[i] : null,
                                            depth,
                                            initialParams,
                                            splitTiles,
                                            isSpheric,
                                            texelCornersBase,
                                            processorFunction,
                                            processorFunctionData,
                                            tileWidth,
                                            tileHeight);
    }

    //final exit after all recursions. all results should be accumulated in {splitTiles} object
    return;

    /**
    * @desc Utility function for the above code. Would split {poly} into 4 polys either evenly or using the angle split. Also splits the supplied {texelSquare} in appropriate proportions.
    * @param {array} poly        - the quad to split
    * @param {bool}  isSpheric   - split by halves or using the angle split
    * @param {array} texelSquare - the accompanying texture-space polygon.
    *
    * @return {object} in a form of {xy: polyArray, uv: textureArray}
    */
    function getFourPolys(poly, bIsSpheric, aTexelSquare)
    {
        //     H         +y  
        //  width/2      ^
        // 2-------3     |->+x
        // | 2 | 3 |
        //L|---|---|R height/2
        // | 1 | 4 |
        // 1-------4
        //     L
        var firstVertice = poly[0],
            secondVertice = poly[1],
            thirdVertice = poly[2],
            fourthVertice = poly[3],
            notUsed = -1,
            firstVertTs = null,
            secondVertTs = null,
            thirdVertTs = null,
            fourthVertTs = null,
            splitFunction = GraphicsHelper.splitFunction;

        //validate texture square -should match poly
        if (aTexelSquare)
        {
            firstVertTs = aTexelSquare[0];
            secondVertTs = aTexelSquare[1];
            thirdVertTs = aTexelSquare[2];
            fourthVertTs = aTexelSquare[3];
        }
        else
        {
            firstVertTs = GraphicsHelper._dummyCornerBase[0];
            secondVertTs = GraphicsHelper._dummyCornerBase[1];
            thirdVertTs = GraphicsHelper._dummyCornerBase[2];
            fourthVertTs = GraphicsHelper._dummyCornerBase[3];
        }

        //cache vars for better perf/redability
        var firstvx = firstVertice.x,
            firstvy = firstVertice.y,
            firstvz = firstVertice.z,
            firstvw = firstVertice.w,
            firstvTSx = firstVertTs.x,
            firstvTSy = firstVertTs.y,

            secondvx = secondVertice.x,
            secondvy = secondVertice.y,
            secondvz = secondVertice.z,
            secondvTSx = secondVertTs.x,
            secondvTSy = secondVertTs.y,

            thirdvx = thirdVertice.x,
            thirdvy = thirdVertice.y,
            thirdvz = thirdVertice.z,
            thirdvTSx = thirdVertTs.x,
            thirdvTSy = thirdVertTs.y,

            fourthvx = fourthVertice.x,
            fourthvy = fourthVertice.y,
            fourthvz = fourthVertice.z,
            fourthvTSx = fourthVertTs.x,
            fourthvTSy = fourthVertTs.y;

        //do the coordinates math
        var
        midX12 = splitFunction(bIsSpheric, firstvx, secondvx, firstvTSx, secondvTSx),
        midY12 = splitFunction(bIsSpheric, firstvy, secondvy, firstvTSy, secondvTSy),
        midZ12 = splitFunction(bIsSpheric, firstvz, secondvz, notUsed, notUsed),

        midX23 = splitFunction(bIsSpheric, secondvx, thirdvx, secondvTSx, thirdvTSx),
        midY23 = splitFunction(bIsSpheric, secondvy, thirdvy, secondvTSy, thirdvTSy),
        midZ23 = splitFunction(bIsSpheric, secondvz, thirdvz, notUsed, notUsed),

        midX34 = splitFunction(bIsSpheric, thirdvx, fourthvx, thirdvTSx, fourthvTSx),
        midY34 = splitFunction(bIsSpheric, thirdvy, fourthvy, thirdvTSy, fourthvTSy),
        midZ34 = splitFunction(bIsSpheric, thirdvz, fourthvz, notUsed, notUsed),

        midX41 = splitFunction(bIsSpheric, firstvx, fourthvx, firstvTSx, fourthvTSx),
        midY41 = splitFunction(bIsSpheric, firstvy, fourthvy, firstvTSy, fourthvTSy),
        midZ41 = splitFunction(bIsSpheric, firstvz, fourthvz, notUsed, notUsed);

        var middlePointX = splitFunction(bIsSpheric, midX23.xy, midX41.xy, midX23.uv, midX41.uv),
        middlePointY = splitFunction(bIsSpheric, midY12.xy, midY34.xy, midY12.uv, midY34.uv),
        middlePointZ = splitFunction(bIsSpheric, secondvz, fourthvz, notUsed, notUsed),
        middlePointXy = new Vector4(middlePointX.xy, middlePointY.xy, middlePointZ.xy, firstvw);

        var middlePointUv = new Vector4(middlePointX.uv, middlePointY.uv, 0, 1);

        //form 4 new polys with texture coords with the computed coordinates.
        return {
            xy:
                    [[
                        firstVertice,
                        new Vector4(midX12.xy, midY12.xy, midZ12.xy, firstvw),
                        middlePointXy,
                        new Vector4(midX41.xy, midY41.xy, midZ41.xy, firstvw)
                    ], [
                        new Vector4(midX12.xy, midY12.xy, midZ12.xy, firstvw),
                        secondVertice,
                        new Vector4(midX23.xy, midY23.xy, midZ23.xy, firstvw),
                        middlePointXy
                    ], [
                        middlePointXy,
                        new Vector4(midX23.xy, midY23.xy, midZ23.xy, firstvw),
                        thirdVertice,
                        new Vector4(midX34.xy, midY34.xy, midZ34.xy, firstvw)
                    ], [
                        new Vector4(midX41.xy, midY41.xy, midZ41.xy, firstvw),
                        middlePointXy,
                        new Vector4(midX34.xy, midY34.xy, midZ34.xy, firstvw),
                        fourthVertice
                    ]],
            uv: (aTexelSquare ?
            [[
                firstVertTs,
                new Vector4(midX12.uv, midY12.uv, 0, 1),
                middlePointUv,
                new Vector4(midX41.uv, midY41.uv, 0, 1)
            ], [
                new Vector4(midX12.uv, midY12.uv, 0, 1),
                secondVertTs,
                new Vector4(midX23.uv, midY23.uv, 0, 1),
                middlePointUv
            ], [
                middlePointUv,
                new Vector4(midX23.uv, midY23.uv, 0, 1),
                thirdVertTs,
                new Vector4(midX34.uv, midY34.uv, 0, 1)
            ], [
                new Vector4(midX41.uv, midY41.uv, 0, 1),
                middlePointUv,
                new Vector4(midX34.uv, midY34.uv, 0, 1),
                fourthVertTs
            ]] : null)
        };
    }
};

/**
    * @desc Utility function to determine how to compute arguments based on a flag
    *
    * @param {bool}  isSpheric - split by angle(true) or in halves(false)
    * @param {float} a - coord start
    * @param {float} b - coord end
    * @param {float} u - corresponding texture coord start
    * @param {float} v - corresponding texture coord end
    *
    * @return {object} in a form {xy: a,b split result, uv: u,v split result}
    */
GraphicsHelper.splitFunction = function(/*have it more general as a type*/isSphericTesselation, a, b, u, v)
{
    return isSphericTesselation ? splitByBisector(a, b, u, v, GraphicsHelper._halfCubeSquared) : simpleMiddle(a, b, u, v);

    function splitByBisector(x1, y1, x2, y2, halfCubeSquared)
    {
        var la = Math.sqrt(halfCubeSquared + x1 * x1),
            lb = Math.sqrt(halfCubeSquared + y1 * y1);

        var kb = lb / (la + lb),
            ka = la / (la + lb);

        return { xy: x1 * kb + y1 * ka, uv: x2 * kb + y2 * ka };
    }

    function simpleMiddle(x1, y1, x2, y2)
    {
        return { xy: (x1 + y1) / 2, uv: (x2 + y2) / 2 };
    }
};

/**
* @desc Calculates polygon area based on poly's vertices in 2D.
*
* @param {array}  poly - the array of points forming the polygon that we're going to calculated are for
* @param {object} size - if {poly} is in NDC - the correcponsing {width, height} object.
*
* @return {float} area.
*/
GraphicsHelper.CalculatePolyArea = function(poly, size)
{
    var workPoly = size ? [] : poly,
        computedArea = 0,
        vertex,
        vertex2;
    
    if (size)
    {
        for (var i = 0; i < poly.length; i++)
        {
            vertex = poly[i];
            workPoly.push(new Vector2(vertex.x * size.width, vertex.y * size.height));
        }
    }

    for (var j = 0; j < workPoly.length - 1; j++)
    {
        vertex = workPoly[j];
        vertex2 = workPoly[j + 1];
        computedArea += (vertex.x * vertex2.y - vertex2.x * vertex.y);
    }
    computedArea += workPoly[workPoly.length - 1].x * workPoly[0].y - workPoly[0].x * workPoly[workPoly.length - 1].y;
    computedArea /= 2;

    return Math.abs(computedArea);
};

/**
* @desc This would do an intersection test of polygons in 2D. This cannot work in 3D as many 2D assumptions are implicit in the code, 
* thus it's the caller responsibility to make sure 2 polygons are on the same plane.
* The algorithm is based on the "Separating Axis Theorem" which worx for !convex polygons only!.
*
* @param {array} polygonA - arbitrary polygon of at least {Vector2} objects
* @param {array} polygonB - arbitrary polygon of at least {Vector2} objects
*
* @return {bool} true if intersecting, false otherwise.
*/
GraphicsHelper.AreIntersecting = function (polygonA, polygonB)
{
    var aNormals = getNormals(polygonA);
    var bNormals = getNormals(polygonB);
    
    var allNormals = aNormals.concat(bNormals);
    
    //optimisation to cancel out same normals. Will save us time later when multiplying each poly's vertice by this normal.
    mainLoop: for (var j = 0; j < allNormals.length; j++)
    {
                  var testNormal = allNormals[j];

                  for (var k = j + 1; k < allNormals.length - 1; k++)
                  {
                      var loopNormal = allNormals[k];
                      var isZero = MathHelper.isZero(1 - Math.abs(testNormal.x * loopNormal.x + testNormal.y * loopNormal.y));
                      if (isZero)
                      {
                          delete allNormals[j];
                          continue mainLoop;
                      }
                  }
    }

    //project polygons to normals and see if projected pieces are intersecting
    for (var i = 0 ; i < allNormals.length; i++)
    {
        var normal = allNormals[i];
        if (!normal)
        {
            continue;
        }
        
        var projectedSegmentA = projectPolygon(polygonA, normal);
        var projectedSegmentB = projectPolygon(polygonB, normal);

        //found a gap between projections - polygons are not intersecting
        if ((projectedSegmentA.max < projectedSegmentB.min) || (projectedSegmentB.max < projectedSegmentA.min))
        {
            return false;
        }
    }

    // no separating line(gap) has been found no matter what normal we use
    return true;

    function projectPolygon(polygon, aNormal)
    {
        var result = null;

        for (var idx = 0 ; idx < polygon.length; idx++)
        {
            //do a projection of the vertex to the normal
            var position = polygon[idx].x * aNormal.x + polygon[idx].y * aNormal.y;

            if (result == null)
            {
                result = { min: position, max: position };
            }

            if (position < result.min)
            {
                result.min = position;
            }
            else if (position > result.max)
            {
                result.max = position;
            }
        }

        return result;
    }

    //normall will be the direction from 0.0 to the point. 
    //We normalize it and then multiply with other normals. If the outcome is -1 or 1 it means that we have basically the same normal
    //in this point so we can skip adding it. 
    //Since later we do dot products of normal with each vertice - this reduces the number of computation required thus yelding performance gain.
    function getNormals(polygon)
    {
        var result = [];

        var prev = polygon.length - 1;
        for (var kIdx = 0; kIdx < polygon.length; kIdx++)
        {
            var xNormal = polygon[kIdx].x - polygon[prev].x;
            var yNormal = polygon[kIdx].y - polygon[prev].y;

            var length = Math.sqrt(xNormal * xNormal + yNormal * yNormal);
            var newNormal = { x: xNormal / length, y: -yNormal / length };
            prev = kIdx;
            result.push(newNormal);
        }

        return result;
    }
};

/**
* applies  {transformationMatrix} to each point of the given polygon. Result is stored in the newly allocated array.
*/
GraphicsHelper.applyWorldTransformation = function(polygon, transformationMatrix)
{
    var worldSpacePoly = [];
    var numPolys = polygon.length;
    for (var k = 0; k < numPolys; k++)
    {
        worldSpacePoly.push(transformationMatrix.transformVector4(polygon[k]));
    }

    return worldSpacePoly;
};


/**
* This would calculate texel to pixel ratio for the cube side at a given FOV
*
* @param {float} cubeSideSizeNdc - size of the cube in normalized device coords.
* @param {int}   imposedSizePx   - the size in pixels that we take as a base. E.g. 1 would mean that the the cube is 1x1 px.
* @param {int}   portSizePx      - size of the area we need to know the ratio for. Has to correspont to {fov} arg. E.g. if {fov} is vertical - height should be used. Otherwise - width of the area should be used.
* @param {float} fov             - the corresponding filedOfView  
*
* @return {float} - the ratio.
*/
GraphicsHelper.calculateTexelToPixelRatioAtFov = function(cubeSideSizeNdc, imposedSizePx, portSizePx, fov)
{
    var percent = cubeSideSizeNdc * Math.tan(fov / 2);
    var texelToPixelRatio = (imposedSizePx * percent) / portSizePx;
    
    return texelToPixelRatio;
};

/**
* This would calculate FOV for the cube side at a given texel to pixel ratio.
*
* @param {float} cubeSideSizeNdc - size of the cube in normalized device coords.
* @param {int}   imposedSizePx   - the size in pixels that we take as a base. E.g. 1 would mean that the the cube is 1x1 px.
* @param {int}   portSizePx      - size of the area we need to know the ratio for. Has to correspont to {fov} arg. E.g. if {fov} is vertical - height should be used. Otherwise - width of the area should be used.
* @param {float} ratio           - texel to pixel ratio for the cube side at a given FOV. 
*
* @param {float} - the FOV in radians.
*/
GraphicsHelper.calculateFovAtTexelToPixelRatio = function (cubeSideSizeNdc, imposedSizePx, portSizePx, ratio)
{
    var result = Math.atan((ratio * portSizePx) / (imposedSizePx * cubeSideSizeNdc)) * 2;

    return result;
};

/* @restore(0092) */

///#source 1 1 /Common/Config.js
var Config = {
    debug: false,
    forceIERenderPath: true,
    outputMultiLODTiles: true,
    scanConvertSize: 40,
	polyInflate: 0.05
};

///#source 1 1 /Common/FloodFill.js
/* @disable(0092) */
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

        if (this.countCrossings(gridUpperLeftPoint, polygon, null, null) !== this.countCrossings(gridUpperRightPoint, polygon, null, null))
        {
            return true;
        }
        else if (this.countCrossings(gridLowerLeftPoint, polygon, null, null) !== this.countCrossings(gridLowerRightPoint, polygon, null, null))
        {
            return true;
        }
        else if (this.countCrossings(gridUpperLeftPoint, polygon, true, null) !== this.countCrossings(gridLowerLeftPoint, polygon, true, null))
        {
            return true;
        }
        else if (this.countCrossings(gridUpperRightPoint, polygon, true, null) !== this.countCrossings(gridLowerRightPoint, polygon, true, null))
        {
            return true;
        }
        else
        {
            return false;
        }
    },

    //Use crossing test.  If a ray going out from the point crosses an odd number of polygon line segments, then it's inside the polygon.  Else it's outside.
    //Logic is simple if we cast a ray to the right (positive x) direction
    //Short description: http://erich.realtimerendering.com/ptinpoly/
    //Longer description: Graphics Gems IV, Edited by Paul S Heckbert 1994, page 26
    pointInPolygon: function (point, polygon) {
        var crossCount = this.countCrossings(point, polygon, true, null);

        //If the ray crossed an odd number of segments, then the point is inside the polygon.
        return (crossCount % 2 === 1);
    },

    //var cachedHorizontalCrossings = {};
    //var cachedVerticalCrossings = {};
    cachedCrossings: {},

    countCrossings: function (point, polygon, castRayDown, force) {
        var adjustedPolygon = [];
        var i, j;
        var crossCount = 0;

		if(!force)
		{
			var hash = point.x + ',' + point.y + ((castRayDown) ? ',down' : ',right');

			if (this.cachedCrossings[hash] != null) {
				return this.cachedCrossings[hash];
			}
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
/* @restore(0092) */
///#source 1 1 /Common/Utils.js
/**
* RequestAnimationFrame normalizer
*/
/* @disable(0092) */
/* @disable(0146) */
var requestAnimationFrame = window.requestAnimationFrame ||
                            window.msRequestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.oRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            function (callback, element)
                            {
                                window.setTimeout(callback, 1000 / 60);
                            };

var cancelRequestAnimationFrame = window.cancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.oCancelRequestAnimationFrame ||
    window.msCancelRequestAnimationFrame || 
    clearTimeout;

/**
* A utility class for common functionality
* @class
*/
function extend(derived, base)
{

    /** 
    * @constructor
    * @ignore  
    */

    function Inheritance()
    {
    }

    Inheritance.prototype = base.prototype;

    derived.prototype = new Inheritance();
    derived.prototype.constructor = derived;
    derived.baseConstructor = base;
    derived.superClass = base.prototype;
    //TODO: trace different usages
    derived.__super = base;
}

var Utils = {
    /**
     * Wraps console.log for debugging.
     */
    log: function (msg)
    {
        if (window.console && DebugHelper.debugEnabled)
        {
            window.console.log(msg);
        }
    },

    /**
     * Applys prototype inheritance to the derived class, for more info see:
     * http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm
     * @param {Object} derived The derived classes constructor
     * @param {Object} base The base classes constructor
     */
    _eventListeners: {},

    /**
     * This adds event handlers to an element. Note, you can subscribe to multiple events via space seperated list.
     */
    bind: function (element, eventName, handler, useCapture)
    {
        var i,
            eventNames = eventName.split(' ');

        for (i = 0; i < eventNames.length; ++i)
        {
            eventName = eventNames[i];

            if (!Utils._eventListeners[element])
            {
                Utils._eventListeners[element] = {};
            }
            if (!Utils._eventListeners[element][eventName])
            {
                Utils._eventListeners[element][eventName] = [];
            }

            // technique from:
            // http://blog.paranoidferret.com/index.php/2007/08/10/javascript-working-with-events/
            if (element.addEventListener)
            {
                if (eventName == 'mousewheel')
                {
                    element.addEventListener('DOMMouseScroll', handler, useCapture);
                }
                // we are still going to add the mousewheel -- not a mistake!
                // this is for opera, since it uses onmousewheel but needs addEventListener.
                element.addEventListener(eventName, handler, useCapture);
            } else if (element.attachEvent)
            {
                element.attachEvent('on' + eventName, handler);
                if (useCapture && element.setCapture)
                {
                    element.setCapture();
                }
            }

            Utils._eventListeners[element][eventName].push([handler, useCapture]);
        }
    },

    _unbindAll: function (element)
    {
        var k, eventListeners, i;
        if (Utils._eventListeners[element])
        {
            for (k in Utils._eventListeners[element])
            {
                for (i = 0; i < Utils._eventListeners[element][k].length; ++i)
                {
                    Utils.unbind(element, k, Utils._eventListeners[element][k][i][0], Utils._eventListeners[element][k][i][1]);
                }
            }
        }
    },

    unbind: function (element, eventName, handler, useCapture)
    {
        if (element && !eventName)
        {
            Utils._unbindAll(element);
        } else
        {
            var i, j, k, count,
                eventNames = eventName.split(' ');
            for (i = 0; i < eventNames.length; ++i)
            {
                eventName = eventNames[i];

                if (element.removeEventListener)
                {
                    if (eventName == 'mousewheel')
                    {
                        element.removeEventListener('DOMMouseScroll', handler, useCapture);
                    }
                    // we are still going to remove the mousewheel -- not a mistake!
                    // this is for opera, since it uses onmousewheel but needs removeEventListener.
                    element.removeEventListener(eventName, handler, useCapture);
                } else if (element.detachEvent)
                {
                    element.detachEvent('on' + eventName, handler);
                    if (useCapture && element.releaseCapture)
                    {
                        element.releaseCapture();
                    }
                }

                if (Utils._eventListeners[element] && Utils._eventListeners[element][eventName])
                {
                    for (j = 0; j < Utils._eventListeners[element][eventName].length; ++j)
                    {
                        if (Utils._eventListeners[element][eventName][j][0] === handler)
                        {
                            Utils._eventListeners[element][eventName][j].splice(j, 1);
                        }
                    }
                    if (Utils._eventListeners[element][eventName].length === 0)
                    {
                        delete Utils._eventListeners[element][eventName];
                    }
                }
            }

            count = 0;
            if (Utils._eventListeners[element])
            {
                for (k in Utils._eventListeners[element])
                {
                    ++count;
                }
                if (count === 0)
                {
                    delete Utils._eventListeners[element];
                }
            }
        }
    },

    /**
     * This sets the opacity which works across browsers
     */
    setOpacity: function ()
    {
        /**
         * @param {Object} elem
         * @param {number} opacity
         */

        function w3c(elem, opacity)
        {
            elem.style.opacity = opacity;
        }

        /**
                * @param {Object} elem
                * @param {number} opacity
                */

        function ie(elem, opacity)
        {
            opacity *= 100;
            var filter;
            try
            {
                filter = elem.filters.item('DXImageTransform.Microsoft.Alpha');
                if (opacity < 100)
                {
                    filter.Opacity = opacity;
                    if (!filter.enabled)
                    {
                        filter.enabled = true;
                    }
                } else
                {
                    filter.enabled = false;
                }
            } catch (ex)
            {
                if (opacity < 100)
                {
                    elem.style.filter = (elem.currentStyle || elem.runtimeStyle).filter + ' progid:DXImageTransform.Microsoft.Alpha(opacity=' + opacity + ')';
                }
            }
        }

        var d = document.createElement('div');
        return typeof d.style.opacity !== 'undefined' && w3c
            || typeof d.style.filter !== 'undefined' && ie
            || function ()
            {
            };
    }(),

    /**
     * Adds CSS to a DOM element. 
     * @param {Object} element
     * @param {Object} obj  These are key-value pairs of styles e.g. {backgroundColor: 'red'}
     */
    css: function (element, obj)
    {
        var k;
        for (k in obj)
        {
            if (obj.hasOwnProperty(k))
            {
                if (k === 'opacity')
                {
                    Utils.setOpacity(element, obj[k]);
                } else
                {
                    element.style[k] = obj[k];
                }
            }
        }
    },

    /**
     * Get the scroll wheel data across browsers
     * @param {Object} e
     * @return {number}
     */
    getWheelDelta: function (e)
    {
        //Get the wheel data in a browser-agnostic way.
        //See http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        return e.detail ? e.detail * -1 : e.wheelDelta / 40;
    },

    /**
     * Tests if an url is of the form "data:/mimetype/base64data"
     * @param {string} url
     * @return {boolean}
     */
    isDataUrl: function (url)
    {
        return /^data:/.test(url);
    },

    /**
     *  Tests if the url is a relative url
     *  @param {string} url
     *  @return {boolean} 
     */
    isRelativeUrl: function (url)
    {
        var hasProtocol = /^ftp:\/\//.test(url) || /^http:\/\//.test(url) || /^https:\/\//.test(url) || /^file:\/\//.test(url);
        return !hasProtocol;
    },

    hostnameRegexp: new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im'),
    filehostnameRegexp: new RegExp('^file\://([^/]+)', 'im'),

    /**
     * Returns the hostname 
     * @param {string} url
     * @return {string}
     */
    getHostname: function (url)
    {
        var result = Utils.hostnameRegexp.exec(url);
        if (!result || result.length !== 2)
        {
            result = Utils.filehostnameRegexp.exec(url);
        }

        if (!result || result.length !== 2)
        {
            return '';
        }
        else
        {
            return result[1].toString();
        }
    },

    /**
     * Determines if a pair of urls are on the same domain
     * @param {string} url1
     * @param {string} url2
     * @return  {boolean} 
     */
    areSameDomain: function (url1, url2)
    {
        var host1 = Utils.getHostname(url1).toLowerCase(),
            host2 = Utils.getHostname(url2).toLowerCase();
        return host1 === host2;
    },

    /**
     * Helper method for adding a script element.
     * @param {string} url
     */
    addScriptElement: function (url)
    {
        var scriptElement = document.createElement('script');
        scriptElement.type = 'text/javascript';
        scriptElement.language = 'javascript';
        scriptElement.src = url;
        document.getElementsByTagName('head')[0].appendChild(scriptElement);
    },

    /**
     * This function implements a small subset of the .NET string.format method
     *
     *       Assumptions:
     *        - All arguments (excluding the formatString) are positive integers
     *        - The only allowed values after the colon inside braces are an uppercase 'X' or a string of zeros
     *
     *       Sample allowed values
     *       partialDotNetStringFormat("{0} asdf {1}", 10, 2)      => "10 asdf 2"
     *       partialDotNetStringFormat("{0:X} asdf {1}", 10, 2)    => "A asdf 2"
     *       partialDotNetStringFormat("{0:000} asdf {1}", 10, 2)  => "010 asdf 2"
     *
     * @param {string} formatString
     * @param {string}
     */
    partialDotNetStringFormat: function (formatString)
    {
        if (arguments.length === 0)
        {
            return "";
        }
        if (arguments.length === 1)
        {
            return formatString;
        }

        var result = "";
        var i = 0;
        while (i < formatString.length)
        {
            //First, output up to the next brace, then slice off the string enclosed in the braces
            var leftBrace = formatString.indexOf('{');
            if (leftBrace === -1)
            {
                return result + formatString;
            }

            result += formatString.substr(0, leftBrace);
            formatString = formatString.substr(leftBrace);
            var rightBrace = formatString.indexOf('}');
            if (rightBrace < 2)
            {
                //TODO: Something wrong.  Throw an exception? 
            }
            var numberFormat = formatString.substr(1, rightBrace - 1);
            formatString = formatString.substr(rightBrace + 1);

            //Now, figure out what to do with the part in the braces
            var numberFormatParts = numberFormat.split(':');

            //Determine which arg is represented by this format string
            var arg = arguments[parseInt(numberFormatParts[0]) + 1];

            if (numberFormatParts.length === 1)
            {
                //nothing special, just output the arg
                result += arg.toString();
            }
            else if (numberFormatParts[1] === 'X')
            {
                //hex, output the number in hex form
                result += arg.toString(16).toUpperCase();
            }
            else
            {
                //Assume that numberFormatParts[1] contains only zeros
                //prepend zeros in front of the number to match the number of zeros passed in
                var out = arg.toString();
                while (out.length < numberFormatParts[1].length)
                {
                    out = '0' + out;
                }
                result += out;
            }
        }

        return result;
    }
};
/* @restore(0146) */
/* @restore(0092) */

///#source 1 1 /Common/Event.js
/**
 * Event class allows an arbitrary number of event listeners to be called
 * when the fire(e) method is called.
 */
function Event()
{
    var _handlers = [];

    // PUBLIC METHODS

    /**
     * The fire(e) method is called to inform any attached event listeners
     * that the event has fired.
     * @param {object} e Event details object to pass to the event listener.
     */
    this.fire = function (e)
    {
        if (noHandlers())
        {
            return;
        }

        for (var i = 0, numHandlers = _handlers.length; i < numHandlers; i++)
        {
            _handlers[i](e);
        }
    };

    /**
     * Callers who want to be notified when an event has fired will pass 
     * their handler function to this method.
     * @param {function} handler The event handler to be called when the 
     *                   event has fired.
     */
    this.addEventListener = function (handler)
    {
        _handlers = _handlers || [];

        // Verify that the same handler isn't already registered.
        for (var i = 0, numHandlers = _handlers.length; i < numHandlers; i++)
        {
            if (_handlers[i] === handler)
            {
                return;
            }
        }

        _handlers.push(handler);
    };

    /**
     * Callers who want to be stop being notified when an event has fired 
     * will pass their previously assigned handler function to this method.
     * @param {function} handler The event handler to be removed.
     */
    this.removeEventListener = function (handler)
    {
        if (noHandlers())
        {
            return;
        }

        for (var i = 0, numHandlers = _handlers.length; i < numHandlers; i++)
        {
            if (_handlers[i] === handler)
            {
                // If the event handler is in the list, then remove it.
                _handlers.splice(i, 1);
            }
        }
    };

    // PRIVATE METHODS

    function noHandlers()
    {
        return !_handlers || _handlers.length === 0;
    }
};

///#source 1 1 /Renderer/ScreenGeometry.js
/* @disable(0092) */
function ScreenGeometry(geometryPolyArr, texturePolyArr)
{
    this.screenArray = geometryPolyArr,
    this.textureArray = texturePolyArr;
}

ScreenGeometry.prototype.GetVertex = function (i)
{
    this._vertexCache = this._vertexCache || new Array(this.geometryPolyArr.length);
    if (this._vertexCache[i] === undefined)
    {
        this._vertexCache[i] = { g: this.screenArray[i], t: this.textureArray[i] };
    }
    return this._vertexCache[i];
};
/* @restore(0092) */
///#source 1 1 /Renderer/Renderer.js
/**
* @file Renderer.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author undefined
* @date 2012-07-19
*/

/* @disable(0092) */

/* @constructor */function Texture(url, loadCallback, loadCallbackInfo, wrapS, wrapT, minFilter, magFilter)
{
    Texture.__super.call(this);

    this._url = url;
    this._loadCallback = loadCallback;
    this._loadCallbackInfo = loadCallbackInfo;
    this._image = null;

    this._wrapS = wrapS !== undefined ? wrapS : Texture.Wrap.CLAMP_TO_EDGE;
    this._wrapT = wrapT !== undefined ? wrapT : Texture.Wrap.CLAMP_TO_EDGE;

    this._minFilter = minFilter !== undefined ? minFilter : Texture.Filter.LINEAR_MIPMAP_LINEAR;
    this._magFilter = magFilter !== undefined ? magFilter : Texture.Filter.LINEAR;

    this._isReady = false;
    this._isDirty = false;
}

Texture.Wrap = {
    CLAMP_TO_EDGE: 1,
    REPEAT: 2
};

Texture.Filter = {
    NEAREST: 0,
    LINEAR: 1,
    LINEAR_MIPMAP_LINEAR: 2
};

extend(Texture, Object);

Texture.prototype.loadImageInDOM = function ()
{
    this._image = new Image();
    var tex = this;
    this._image.onload = function ()
    {
        if (tex._loadCallback)
        {
            tex._loadCallback(tex._url, tex._loadCallbackInfo, tex);
        }
        tex._isReady = true;
        tex._isDirty = true;
    };

    this._image.crossOrigin = ''; //Required for webgl textures.  Must be set before setting the src property.
    this._image.src = this._url;
};

/* @constructor */function AnimationBeginEndValues(begin, end)
{
    this.begin = begin;
    this.end = end;
    AnimationBeginEndValues.__super.call(this);
}
extend(AnimationBeginEndValues, Object);

/* @constructor */function Animation()
{
    Animation.__super.call(this);

    this.opacity = new AnimationBeginEndValues(1, 1);
    this.x = new AnimationBeginEndValues(0, 0);
    this.y = new AnimationBeginEndValues(0, 0);
    this.sx = new AnimationBeginEndValues(1, 1);
    this.sy = new AnimationBeginEndValues(1, 1);
    this.rotate = new AnimationBeginEndValues(0, 0);
    this._duration = 0;
    this._startT = 0;
    this._easingMode = "linear";

    this._ended = false;
    this._endCallbackInfo = null;
    this._endCallback = null;
}
extend(Animation, Object);
Animation.prototype.initStates = function (params)
{
    for (prop in params)
    {
        this[prop] = [params[prop], params[prop]];
    }
};

Animation.prototype.getEndStates = function ()
{
    var ret = {};
    for (prop in this)
    {
        if (this[prop] instanceof AnimationBeginEndValues)
            ret[prop] = this[prop].end;
    }
    return ret;
};

/* @constructor */function Material()
{
    Material.__super.call(this);
    Material._animation = null;
    Material._animationEndStates = null;
}

extend(Material, Object);

Material.prototype.apply = function (context)
{
    throw "You should not have reached base Material.apply().";
};

/* @constructor */function SingleTextureMaterial(tex)
{
    this._texture = tex;
    SingleTextureMaterial.__super.call(this);
}
extend(SingleTextureMaterial, Material);

/* @constructor */function Transform()
{
    this._rotX = this._rotY = this._rotZ = 0;
    this._translateX = this._translateY = this._translateZ = 0;
    this._scaleX = this._scaleY = this._scaleZ = 0;
    Transform.__super.call(this);
}
extend(Transform, Matrix4X4);

Transform.prototype.apply = function (context)
{
    throw "You should not have reached base Transform.apply().";
};

/**
 * Renderable binds geometry (often quads or triangles), materials (textures or shaders), and 
 * transforms (typically rotation,scale,translations.).
 */
/* @constructor */function Renderable(params)
{
    this._geometry = params.geometry || null;
    this._material = params.material || null;
    this._transform = params.transform || null;
}
extend(Renderable, Object);

var uniqueId = (function ()
{
    var count = (new Date()).getTime();
    return function ()
    {
        ++count;
        return count;
    };
})();


/**
* This is an abstract class to hold renderer common fields and logic. Please use concrete Renderer classes instead for real rendering.
* 
* @param {Window} win - the parent js window object
* @constructor 
*/

function Renderer(win)
{
    Renderer.__super.constructor.call(this);

    this._name = 'BaseRenderer';

    this._renderables = {};
    this._viewModel = null;
    this._removedRenderables = {};
    this._nodes = {};
    this._window = win;
    this._rootElement = null;
    this._viewProjMatrix = Matrix4X4.createIdentity();
    this._clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };

    this.SortRenderableFucntion = function(a, b)
    {
        var aOrder = a.id.levelOfDetail;
        var bOrder = b.id.levelOfDetail;

        if (aOrder && bOrder)
            return aOrder - bOrder;
        else if (!aOrder && !bOrder)
            return 0;
        else if (!aOrder)
            return -1;
        else
            return 1;
    };
}

extend(Renderer, Object);

/**
 * Draws any renderables added to the scene. This should be invoked once per frame.
 * Platforms provide specific implementations.
 */
Renderer.prototype.render = function()
{
    throw 'The renderer you are using does not implement the render() method.';
    /* Usual rendering logic:
    for (renderable in _renderables) {
        apply transform;
        apply material;
        draw geometry;
    }
    */
};

/**
 * This sets the viewModel of the scene
 *
 * @param {ViewModel} viewModel - the view model object to use.
 */
Renderer.prototype.setViewModel = function (viewModel)
{
    this._viewModel = viewModel;
};

/**
 * A helper that can be used by implementations of setClearColor.
 * @ignore 
 */
Renderer.prototype._checkClearColor = function (color)
{
    if (!color || color.r == null || color.g == null || color.b == null || color.a == null)
    {
        throw 'Color must include r,g,b,a numeric properties.';
    }
};

/**
 * Set the color to use for the initial frame buffer pixels (clearColor in GL parlance.) 
 * @param {{r:{number}, g:{number}, b:{number},a:{number}} color  The RGBA
 * components of the color between (each component should be between 0.0-1.0).
 */
Renderer.prototype.setClearColor = function (color)
{
    throw 'setClearColor is not implemented';
};


/**
 * Used for internal debugging of Renderer implementations.
 * @ignore
 * 
 */
Renderer.prototype._error = function (msg)
{
    if (Config.debug)
    {
        debugger;
        throw new Error(msg);
    }
};

/**
 * Enqueues an animation for execution. Try to use CSS style property names when possible. 
 * implementations should ignore properties they don't know how to animate to allow more 
 * advanced renderers to enhance the expierence when possible.
 *
 * @param {Material} renderable         The renderable whose properties/assets we'll be animating.
 * @param {Object}   startProperties    The property names (e.g.,
 *                                      'opacity','width','height') and values at the start. If this is null we
 *                                      Animate from current property state.
 * @param {Object}   endProperties      The property names (e.g.,
 *                                      'opacity','width','height') and values
 *                                      at the end of the animation.
 * @param {Number}   duration           The duration in ms.
 * @param {string?}  easing             The animation ease function, (e.g. 'linear', 'ease-in-out')
 */
Renderer.prototype.animate = function (renderable,
                                       startProperties,
                                       endProperties,
                                       duration,
                                       easing,
                                       completeCallback,
                                       completeCallbackInfo)
{
    throw 'The renderer does not implement animate function';
    //Implications.
    //   (a) materials are exposed
    //        - works fine for JS , how about for SL? 
    //   (b) property/values must make sense for materials (coupling.) 
    //   should this be on the renderable instead?
};

/**
 * Sets the view projection matrix of the scene .
 */
Renderer.prototype.setViewProjectionMatrix = function (mat)
{
    this._viewProjMatrix = mat;
};

Renderer.prototype.GetType = function ()
{
    throw "Renderer must support one of the rendering techniques such as '2D', '3D' etc.";
};


Renderer.prototype.InitViewElementOpacity = function (textureRenderable)
{
    var imageElement = textureRenderable.texturesWithPolygons[0].texture._image;
    
    //this is for parent/child drawing. basically when we transition too fast from LOD to LOD
    //parent might not have had a change to render to the fully opaque state
    //but adding 2 alphas creates unnecessary blinking which looks bad. Thus set the parent
    //to be fully opaque so that child would blend in nicely
    if (textureRenderable.id.levelOfDetail != textureRenderable.worldLod)
    {
        imageElement.opacity = 1;
    }
    /* debug stuff
    else
    {
        
        var parentId = renderable.id.getParent();
        if (imageElement.opacity < 1 && parentId && this.currentLod == 10)
        {
            debugger;
        }            
    }
    */

    if (imageElement.opacity === undefined)
    {
        imageElement.opacity = .1;
    }
};

Renderer.prototype.UpdateViewElementOpacity = function (textureRenderable, increment)
{
    var imageElement = textureRenderable.texturesWithPolygons[0].texture._image;
    
    if (imageElement.opacity < 1)
    {
        imageElement.opacity += increment;
    }
};
/* @restore(0092) */

///#source 1 1 /Renderer/RendererUtils.js
/* @disable(0092) */

/** 
 * This is a handy helper class that uses canvas to create a renderable that has fixed color
 * and a message. 
 */
function RendererUtils()
{
}

function TestQuadRenderable(width, height, transform, backgroundColor, text, loadTexture)
{
    TestQuadRenderable.__super.call(this, {});
    var self = this;
    var buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    var context = buffer.getContext('2d');
    context.clearRect(0, 0, width, height);
    context.fillStyle = backgroundColor || 'gray';
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'black';
    context.font = '12pt Segoe UI,sans-serif';
    context.fillText(text, width * 0.3, height * 0.3);
    var textureUrl = buffer.toDataURL(); //We pass this into texture below.
    var texture = new Texture(textureUrl, null, null, null, null, null, null);
    if (loadTexture)
    {
        texture.loadImageInDOM();
    }

    self._material = new SingleTextureMaterial(texture);
    self._transform = transform ? transform : Matrix4X4.createIdentity();
    //TODO: update this with the new geometry as generated in datasources
    //self._geometry = new QuadGeometry(width, height);
}

extend(TestQuadRenderable, Renderable);

RendererUtils.InitRenderableFor3D = function (renderable)
{
    //TODO: this accounts for 1 pixel tile overlap defined in the datasource.
    //TODO: find a way to send this info here from ViewController in some nice way.
    var EXPANSION_HACK = 2;
    var v0 = renderable.geometryPloygon[0];
    var v1 = renderable.geometryPloygon[1];
    var v2 = renderable.geometryPloygon[2];
    var v3 = renderable.geometryPloygon[3];
    renderable.geometryPloygon._vertices = [
        v0.x, v0.y, v0.z,
        v1.x, v1.y, v1.z,
        v2.x, v2.y, v2.z,
        v3.x, v3.y, v3.z
    ];


    //currently supports only 1 texture per renderable
    var textureWithPolygon = renderable.texturesWithPolygons[0].polygon;
    v0 = textureWithPolygon[0];
    v1 = textureWithPolygon[1];
    v2 = textureWithPolygon[2];
    v3 = textureWithPolygon[3];
    var texture = renderable.texturesWithPolygons[0].texture,
        iWidth = texture.dataSourceWidth + EXPANSION_HACK,
        iHeight = texture.dataSourceHeight + EXPANSION_HACK;


    //todo: make sure coords are in [0,1] range. account for tile overlap and border.
    renderable.geometryPloygon._texCoords = [
      v1.x / iWidth, v1.y / iHeight,
      v0.x / iWidth, v0.y / iHeight,
      v3.x / iWidth, v3.y / iHeight,
      v2.x / iWidth, v2.y / iHeight
    ];

    renderable.geometryPloygon._indices = [0, 1, 2, 0, 2, 3];
    //this._indices = [  0, 1, 1, 2,  2, 3, 3, 0, 0,2, 1,3 ];

    renderable.geometryPloygon._texCoordSize = 2;
    renderable.geometryPloygon._isDirty = true;

};

RendererUtils.DrawPolyLine = function (canvas, polyArr, logVerts)
{
    canvas.beginPath();

    if (logVerts)
    {
        Utils.log("===================Quad=========================");
        Utils.log('x: ' + polyArr[0].x + ' y: ' + polyArr[0].y);
    }
    canvas.moveTo(polyArr[0].x, polyArr[0].y);
    for (var i = 1; i < polyArr.length; i++)
    {
        if (logVerts)
        {
            Utils.log('x: ' + polyArr[i].x + ' y: ' + polyArr[i].y);
        }
        canvas.lineTo(polyArr[i].x, polyArr[i].y);
    }
    canvas.lineTo(polyArr[0].x, polyArr[0].y);
    if (logVerts)
    {
        Utils.log("===================STROKE=========================");
    }
    canvas.stroke();
};

RendererUtils.FilterType = { NORMFACTOR: 8 };
RendererUtils.FilterType.NO_FILTER = [0, 0, 0, 0, 1, 0, 0, 0, 0];
/* Gaussian kernel   
	   1 2 1
	   2 4 2
	   1 2 1
	   var _kernel = 
*/
RendererUtils.FilterType.GAUSSIAN = [1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0, 2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0];
/* Laplacian kernel (sharpen)
	   -1 -1 -1 
	   -1  8 -1
	   -1 -1 -1 
	     */
RendererUtils.FilterType.LAPLACIAN = [-1/RendererUtils.FilterType.NORMFACTOR,-1/RendererUtils.FilterType.NORMFACTOR,-1/RendererUtils.FilterType.NORMFACTOR,
    -1/RendererUtils.FilterType.NORMFACTOR,17/RendererUtils.FilterType.NORMFACTOR,-1/RendererUtils.FilterType.NORMFACTOR,
    -1/RendererUtils.FilterType.NORMFACTOR,-1/RendererUtils.FilterType.NORMFACTOR,-1/RendererUtils.FilterType.NORMFACTOR];

/* @restore(0092) */

///#source 1 1 /Renderer/Quirks.js
var quirks = new function() {
    var _ua = navigator.userAgent;
    /* @disable(0092) */
    var _isSafari = (navigator.vendor === 'Apple Computer, Inc.');
    /* @restore(0092) */
    var _isWebkit = _ua.indexOf('Webkit');
    var _chromeIndex = _ua.indexOf('Chrome');
    var _isChrome = _chromeIndex !== -1;
    var _firefoxIndex = _ua.indexOf('Firefox');
    var _isFirefox = _firefoxIndex !== -1;
    var _chromeVersion = _isChrome? parseInt(_ua.substring(_chromeIndex + 7)) : -1;
	var _firefoxVersion = _isFirefox? parseInt(_ua.substring(_firefoxIndex + 8)) : -1;
    var _isTrident = _ua.indexOf('Trident') !== -1;

    this.isWebGLCORSSupported = (_isChrome && _chromeVersion >= 13) ||
                                (_isFirefox  &&  _firefoxVersion >= 8);
    
    this.failsToRenderItemsNearContainerBorder = (_isChrome && _chromeVersion <= 19);
    this.isWebGLCORSRequired = (_isFirefox && _firefoxVersion > 4) || (_isChrome && _chromeVersion >= 13);
    this.useImageDisposer = _isSafari;
    this.supportsPreserve3D = !_isTrident && !_isFirefox; 
};

///#source 1 1 /Renderer/RendererCheckCSS3D.js
/* @disable(0092) */
var RendererCheckCSS3D = {};

RendererCheckCSS3D.isValidBrowser = function ()
{
    //Check that CSS3D transforms are here, otherwise throw an exception.
    //
    //  Future: Does it make sense to have a caps object we create in a singleton?

    var CSSMatrix = window.CSSMatrix || window.WebKitCSSMatrix || window.MSCSSMatrix || window.MozCSSMatrix;

    if (CSSMatrix == null || quirks.failsToRenderItemsNearContainerBorder)
    {
        RendererCheckCSS3D.isValidBrowser = function () { return false; };
        return false;
    }

    var matrix = new CSSMatrix();
    if (!matrix)
    {
        RendererCheckCSS3D.isValidBrowser = function () { return false; };
        return false;
    }

    //Test presence of properties  want.
    div = document.createElement('div');
    style = div.style;

    if ((style.webkitTransform === undefined) &&
       (style.msTransform === undefined) &&
       (style.mozTransform === undefined))
    {
        RendererCheckCSS3D.isValidBrowser = function () { return false; };
        return false;
    }

    if (quirks.supportsPreserve3D)
    {
        //Older CSS3-3D implementations are sometimes busted depending on the graphics drivers.
        //The testElement below creates a snippet of problematic DOM, then measure's the size on screen.
        //This is a webkit specific isue.

        var testElem = document.createElement('div');
        var testElemStyle = testElem.style;
        testElemStyle.width = '0px';
        testElemStyle.height = '0px';
        testElemStyle.position = 'absolute';
        testElemStyle.overflowX = 'hidden';
        testElemStyle.overflowY = 'hidden';
        testElemStyle.backgroundColor = 'rgb(0, 0, 0)';
        testElem.innerHTML = '<div style="position: absolute; z-index: -10; -webkit-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); -ms-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); -moz-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); "><div id="_rwwviewer_cssrenderer_test_id" style="width: 256px; height: 256px;"></div></div>';
        document.body.appendChild(testElem);
        var size = document.getElementById('_rwwviewer_cssrenderer_test_id').getClientRects()[0];
        document.body.removeChild(testElem);
        //With the canned set of nested divs and matrix transforms, the element should be 337 pixels in width and height.
        //Webkit sometimes expands things much further if the machine has old graphics drivers installed.
        if (Math.abs(size.width - 377) <= 1 && Math.abs(size.height - 377) <= 1)
        {
            //cache the value so that we only perform the check once
            RendererCheckCSS3D.isValidBrowser = function () { return true; };
            return true;
        }
        else
        {
            RendererCheckCSS3D.isValidBrowser = function () { return false; };
            return false;
        }
    }
    else
    {
        // Here we must be IE10, as we don't support preserve3d but can make a CSS matrix.
        RendererCheckCSS3D.isValidBrowser = function () { return true; };
        return true;
    }
};
/* @restore(0092) */

///#source 1 1 /Renderer/RendererCheckWebGL.js
/* @disable(0092) */
/* @disable(0055) */
var RendererCheckWebGL = {};

RendererCheckWebGL.getWebGLContext = function (win)
{
    if (win.getContext)
    {
        var possibleNames = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        for (var i = 0; i < possibleNames.length; ++i)
        {
            try
            {
                var context = win.getContext(possibleNames[i],{ antialias: true });
                if (context != null)
                {
                    return context;
                }
            }
            catch (ex)
            {
                // Do nothing.
            }
        }
    }
    return null;
};

RendererCheckWebGL.isValidBrowser = function ()
{
    var canvas = document.createElement('canvas');

    var gl = RendererCheckWebGL.getWebGLContext(canvas);
    if (!gl)
    {
        Utils.log("WebGL is not supported.");
        RendererCheckWebGL.isValidBrowser = function () { return false; };
        return false;
    } else if (quirks.isWebGLCORSRequired && !quirks.isWebGLCORSSupported)
    {
        Utils.log('CORS image textures are not supported in this browser');
        RendererCheckWebGL.isValidBrowser = function () { return false; };
        return false;
    }

    RendererCheckWebGL.isValidBrowser = function () { return true; };
    return true;
};
/* @restore(0055) */
/* @restore(0092) */

///#source 1 1 /Renderer/RendererCSS3D.js
//Polyfill the CSS matrix
/* @disable(0092) */
var CSSMatrix = window.CSSMatrix || window.WebKitCSSMatrix || window.MSCSSMatrix || window.MozCSSMatrix;

/* @constructor */function RendererCSS3D(win, width, height)
{
    RendererCSS3D.__super.call(this, win);

    this._width = width;
    this._height = height;

    var div, style, errorString = 'css3d is not supported';

    if (!RendererCheckCSS3D.isValidBrowser())
    {
        throw errorString;
    }

    this._rootElement = document.createElement('div');
    this._rootElement.width = this._width;
    this._rootElement.height = this._height;


    this._flatten3D = document.createElement('div');
    this._flatten3D.style.width = this._width + 'px';
    this._flatten3D.style.height = this._height + 'px';
    this._flatten3D.style.position = 'absolute';
    this._flatten3D.style.webkitTransformStyle = 'flat';
    this._flatten3D.style.msTransformStyle = 'flat';
    this._flatten3D.style.mozTransformStyle = 'flat';
    this._flatten3D.style.backgroundColor = 'rgba(' + this._clearColor.r * 255.0 + ',' + this._clearColor.g * 255.0 + ',' + this._clearColor.b * 255.0 + ',' + this._clearColor.a + ')';

    this._3dViewportDiv = document.createElement('div');
    this._3dViewportDiv.width = this._width;
    this._3dViewportDiv.height = this._height;
    this._3dViewportDiv.style.position = 'absolute';

    this._flatten3D.appendChild(this._3dViewportDiv);

    this._rootElement.appendChild(this._flatten3D);

    if (quirks.supportsPreserve3D && !Config.forceIERenderPath)
    {
        this._3dViewportDiv.style.webkitTransformStyle = 'preserve-3d';
        this._3dViewportDiv.style.webkitTransform = 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)';

        this._3dViewportDiv.style.mozTransformStyle = 'preserve-3d';
        this._3dViewportDiv.style.mozTransform = 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)';
    }

    //We do this last incase any earlier issues throw.
    win.appendChild(this._rootElement);
};
extend(RendererCSS3D, Renderer);

RendererCSS3D.prototype.ignoreEvent = function ()
{
    return false;
};

RendererCSS3D.prototype.setStyleProperties = function (element)
{
    // The default transform-origin is (50%, 50%) which is just
    // fine with us.
    //element.style.webkitTransformOrigin = '0px 0px 0';
    if (quirks.supportsPreserve3D && !Config.forceIERenderPath)
    {
        element.style.webkitTransformStyle = 'preserve-3d';
        element.style.mozTransformStyle = 'preserve-3d';
    }
    element.style.position = 'absolute';

    //Make sure elements are not dragable, otherwise Safari will show a dragged image
    //when you mouse down and drag, which is not what we want
    //Utils.bind(element, 'dragstart', this.ignoreEvent);
};

RendererCSS3D.prototype.clearStyleProperties = function (element)
{
    // The default transform-origin is (50%, 50%) which is just
    // fine with us.
    //element.style.webkitTransformOrigin = '0px 0px 0';
    element.style.webkitTransformStyle = '';
    element.style.msTransformStyle = '';
    element.style.mozTransformStyle = '';
    element.style.position = '';

    //Make sure elements are not dragable, otherwise Safari will show a dragged image
    //when you mouse down and drag, which is not what we want
    //Utils.unbind(element, 'dragstart',  this.ignoreEvent);
};

RendererCSS3D.prototype.setViewportSize = function (width, height)
{
    this._width = width;
    this._height = height;
    this._rootElement.width = this._width;
    this._rootElement.height = this._height;
    this._flatten3D.style.width = this._width;
    this._flatten3D.style.height = this._height;
    this._3dViewportDiv.width = this._width;
    this._3dViewportDiv.height = this._height;
};

var updateCSS = function (e, t)
{
    //Note: If setting as a string css can't handle scientific notation e.g. 1e-4
    e.style.webkitTransform = t;
    e.style.msTransform = t;
    e.style.mozTransform = t;
};
/**
 * This updates the leave node transforms with any 
 * intermediate transforms. Note: This is only used when quirks.supportsPreserve3D = false.
 */
RendererCSS3D.prototype.updateTransforms = function (node, transform)
{
    var current, i, identity,
    q = [];
    identity = new CSSMatrix();
    identity.m11 = 1.0;
    identity.m12 = 0.0;
    identity.m13 = 0.0;
    identity.m14 = 0.0;
    identity.m21 = 0.0;
    identity.m22 = 1.0;
    identity.m23 = 0.0;
    identity.m24 = 0.0;
    identity.m31 = 0.0;
    identity.m32 = 0.0;
    identity.m33 = 1.0;
    identity.m34 = 0.0;
    identity.m41 = 0.0;
    identity.m42 = 0.0;
    identity.m43 = 0.0;
    identity.m44 = 1.0;

    if (!node)
    {
        node = this._rootElement;
    }

    if (!transform)
    {
        transform = identity;
    }
    if (node['$$matrixTransform'])
    {
        transform = transform.multiply(node['$$matrixTransform']);
    }

    if (node.childNodes.length === 0 || node['$$isLeaf'])
    {
        updateCSS(node, transform);
    }
    else
    {
        updateCSS(node, identity);
        for (i = 0; i < node.childNodes.length; ++i)
        {
            this.updateTransforms(node.childNodes[i], transform);
        }
    }
};

RendererCSS3D.prototype.render = function ()
{
    // The is needed because the CSS coordinate system is compatible with 2D page 
    // transforms.
    //                  ^
    //                 /
    //                / -z (into screen).
    //               /
    //               --------------> +x
    //               |
    //               | +y 
    //               |
    //               V
    //
    //  see: http://developer.apple.com/library/safari/#documentation/InternetWeb/Conceptual/SafariVisualEffectsProgGuide/Transforms/Transforms.html
    var invertYAxisMatrix = Matrix4X4.createScale(1, -1, 1);

    viewportToScreenTransform = GraphicsHelper.createViewportToScreen(this._width, this._height);

    var cssScreenSpaceViewProjectionTransform = viewportToScreenTransform.multiply(this._viewProjMatrix.multiply(invertYAxisMatrix));
    this.setCSS3DViewProjection(cssScreenSpaceViewProjectionTransform);

    var i, j, added;
    var imageElement, texture;

    var delta = this._viewModel.GetDelta();
    for (id in delta.removed)
    {
        var r = this._viewModel.currentVisibleRenderables[id];
        if (!r) continue;
        var imgElement, divElement = document.getElementById(id);
        if (divElement)
        {
            imgElement = divElement.firstChild;
            if (imgElement)
            {
                this.clearStyleProperties(imgElement);
                if (imgElement.parentNode)
                {
                    //Since the caching layer caches images, we want to de-parent to ensure 
                    //consistent state.
                    imgElement.parentNode.removeChild(imgElement);
                }
            }
            else
            {
                this._error('Expected imgElement');
            }

            if (divElement.parentNode)
            {
                divElement.parentNode.removeChild(divElement);
            }

        }
        else
        {
            Utils.log('Cannot find and remove element');
        }
    }
    this._removedRenderables = {}; // de-ref and remove
    var allRenderables = this._viewModel.getVisibleRenderablesAsArray();
    for (var renderableId in allRenderables)
    {
        var renderable = allRenderables[renderableId];

        added = false;
        alreadyHasIt = false;
        imageElement = null;
        texture = null;
        if (renderable._material &&
            renderable._material._texture)
        {
            texture = renderable._material._texture;
            if (texture._isReady && texture._isDirty)
            {
                imageElement = renderable._material._texture._image;
                //We use deterministic ordering based on ids.
                //imageElement._order = renderableId;
            }
            else if (renderable.transformUpdated)
            {
                var img = renderable._material._texture._image;
                if (img.parentNode)
                {
                    this.setCSS3DTransform(img.parentNode, img,
                        renderable._entity.faceTransform, renderable._order);
                    renderable.transformUpdated = false;
                }
            }
        }
        if (imageElement == null)
        {
            continue;
        }

        imageElement._order = renderable._order;
        imageElement.style.zIndex = renderable._order;
        if (imageElement.parentNode)
        {
            this._error('Expected imageElement with no parent');
        }

        this.setStyleProperties(imageElement);

        var xformNode = document.createElement('div');
        xformNode.id = renderableId;
        xformNode.style.position = 'absolute';
        xformNode.style.zIndex = imageElement.style.zIndex;

        if (quirks.supportsPreserve3D && !Config.forceIERenderPath)
        {
            xformNode.style.webkitTransformOrigin = '0px 0px 0';
            xformNode.style.webkitTransformStyle = 'preserve-3d';

            xformNode.style.mozTransformOrigin = '0px 0px 0';
            xformNode.style.mozTransformStyle = 'preserve-3d';
        } else
        {
            xformNode['$$isLeaf'] = true;
        }

        xformNode.appendChild(imageElement);
        this.setCSS3DTransform(xformNode, imageElement, renderable._entity.faceTransform, renderable._order);

        for (j = 0; j < this._3dViewportDiv.childNodes.length; ++j)
        {
            var img3dv = this._3dViewportDiv.childNodes[j].childNodes[0];
            if (img3dv == undefined || img3dv == imageElement)
            {
                this._error('object state inconsistency');
            }
            if (img3dv && imageElement._order &&
                img3dv._order > imageElement._order)
            {
                added = true;
                //Due to image being in the transform node, we 
                //insert xform into the child of the div.
                this._3dViewportDiv.insertBefore(xformNode, this._3dViewportDiv.childNodes[j]);
                texture._isDirty = false;
                break;
            }
        }

        //If we're missing an order parameter or we are last, we append.
        if (!added)
        {
            this._3dViewportDiv.appendChild(xformNode);
            texture._isDirty = false;
        }

    }

    if (!quirks.supportsPreserve3D || Config.forceIERenderPath)
    {
        //Update the transforms top-down.
        this.updateTransforms(null, null);
    }


    var callbackRemaining = false;
    if (this._frameCallbacks)
    {
        for (var k = 0; k < this._frameCallbacks.length; k++)
        {
            if (this._frameCallbacks[k].count > 0)
            {
                callbackRemaining = true;
            }
            else if (this._frameCallbacks[k].count == 0)
            {
                this._frameCallbacks[k].cb();
            }
            this._frameCallbacks[k].count--;
        }
        if (!callbackRemaining)
        {
            this._frameCallbacks = [];
        }
    }
};

function createKeyFrames(name, keyframeprefix)
{
    // TODO: Figure out whether we need this.
    /* @disable(0058) */
    var keyframes = '@' + keyframeprefix + 'keyframes ' + name + ' { from {' + printObj(startProps) + ' } to {' + printObj(endProps) + ' } }';
    /* @restore(0058) */

    if (document.styleSheets && document.styleSheets.length)
    {
        document.styleSheets[0].insertRule(keyframes, 0);
    }
    else
    {
        this._error('Page must have style sheet');
        /*
        var s = document.createElement( 'style' );
        s.innerHTML = keyframes;
        document.getElementsByTagName('head')[0].appendChild(s);
        */
    }
};

RendererCSS3D.prototype.transitionEndCallback = function (event)
{
    if (this.completeCallback)
    {
        this.completeCallback(this.material, this.callbackInfo);
    }

    this.material._animation = { _ended: true };

    delete this.material;
    delete this.completeCallback;
    delete this.callbackInfo;

    this.removeEventListener('webkitTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
    this.removeEventListener('mozTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
    this.removeEventListener('MSTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
};

RendererCSS3D.prototype.animate = function (renderable,
                                            startProperties,
                                            endProperties,
                                            duration,
                                            easing,
                                            completeCallback,
                                            completeCallbackInfo)
{
    //Utils.log(printObj(startProperties) + ' \n'+printObj(endProperties));
    //TODO.
    //   There are two cases here.
    //   (1) We are animating a CSS property on a browser that suppoerts CSS3 animations
    //   (2) We are doing something that needs a timer.

    //Right now assume it is a texture material & just use jquery .
    if (renderable &&
        renderable._material &&
        renderable._material._texture &&
        renderable._material._texture._image)
    {
        var material = renderable._material;
        var cssStartProps = {}, cssEndProps = {};
        for (var j = 0; j < 2; j++)
        {
            var fromProps = j == 0 ? startProperties : endProperties;
            var toProps = j == 0 ? cssStartProps : cssEndProps;
            var transformStr = '';
            for (var prop in fromProps)
            {
                if (fromProps.hasOwnProperty(prop))
                {
                    switch (prop)
                    {
                        case 'opacity':
                            toProps['opacity'] = fromProps['opacity'];
                            break;
                        case 'x':
                            transformStr += 'translateX(-' +
                                fromProps['x'] + 'px) ';
                            break;
                        case 'y':
                            transformStr += 'translateY(' +
                                fromProps['y'] + 'px) ';
                            break;
                        case 'sx':
                            transformStr += 'scaleX(' +
                                fromProps['sx'] + ') ';
                            break;
                        case 'sy':
                            transformStr += 'scaleY(' +
                                fromProps['sy'] + ') ';
                            break;
                        case 'rotate':
                            transformStr += 'rotate(-' +
                                fromProps['rotate'] + 'deg) ';
                            break;
                    }
                }
            }
            if (transformStr != '')
            {
                toProps['-webkit-transform'] = transformStr;
                toProps['-ms-transform'] = transformStr;
                toProps['-moz-transform'] = transformStr;
            }
        }
        if (startProperties)
        {
            Utils.css(material._texture._image, {
                '-webkit-transition-duration': duration + 'ms',
                '-webkit-transition-timing-function': easing,
                '-ms-transition-duration': duration + 'ms',
                '-ms-transition-timing-function': easing,
                '-moz-transition-duration': duration + 'ms',
                '-moz-transition-timing-function': easing
            });
            Utils.css(material._texture._image, cssStartProps);
        }

        //These are explicitly removed in transitionEndCallback after it's done 
        //processing them.
        material._texture._image.material = material;
        material._texture._image.callbackInfo = completeCallbackInfo;
        material._texture._image.completeCallback = completeCallback;
        material._texture._image.addEventListener(
            'webkitTransitionEnd',
            RendererCSS3D.prototype.transitionEndCallback, false);
        material._texture._image.addEventListener(
            'MSTransitionEnd',
            RendererCSS3D.prototype.transitionEndCallback, false);
        material._texture._image.addEventListener(
            'mozTransitionEnd',
            RendererCSS3D.prototype.transitionEndCallback, false);
        var renderer = this;

        function startTransition()
        {
            Utils.css(material._texture._image, cssEndProps);
        };

        function FrameCallback(cb, count)
        {
            this.cb = cb;
            this.count = count;
        };

        if (this._frameCallbacks == undefined)
        {
            this._frameCallbacks = [];
        }

        /* @disable(0058) */
        this._frameCallbacks.push(new FrameCallback(startTransition, 1));
        /* @restore(0058) */

        material._animation = { _ended: false };
    }
};

RendererCSS3D.prototype.setCSS3DTransform = function (elem, image, transform, order)
{
    //Local coord system has y axis pointing down, change to have y axis pointing up.  Also the
    //transform origin is at the top left of the element, so need to translate it so that it is
    //at the bottom left of the element which lines up with the transform-origin of the outer 
    //div where the view/projection matrix is applied
    var invertY = Matrix4X4.createScale(1, -1, 1);

    //Use naturalHeight because IE10 doesn't report height correctly for this element.
    var height = Math.max(image.height || 0, image.naturalHeight || 0);

    var t = Matrix4X4.createTranslation(0, -height, 0);
    preTransform = invertY.multiply(t);
    postTransform = invertY;

    var m = invertY.multiply(transform.multiply(invertY.multiply(t)));

    m = postTransform.multiply(transform.multiply(preTransform));
    m = m.transpose();

    var mCss = new CSSMatrix();
    mCss.m11 = m.m11;
    mCss.m12 = m.m12;
    mCss.m13 = m.m13;
    mCss.m14 = m.m14;
    mCss.m21 = m.m21;
    mCss.m22 = m.m22;
    mCss.m23 = m.m23;
    mCss.m24 = m.m24;
    mCss.m31 = m.m31;
    mCss.m32 = m.m32;
    mCss.m33 = m.m33;
    mCss.m34 = m.m34;
    mCss.m41 = m.m41;
    mCss.m42 = m.m42;
    mCss.m43 = m.m43;
    mCss.m44 = m.m44;

    if (quirks.supportsPreserve3D && !Config.forceIERenderPath)
    {
        elem.style.webkitTransform = mCss;
        elem.style.mozTransform = mCss;
        elem.style.msTransform = mCss;
    } else
    {
        //We apply this transform  in updateTransforms. 
        elem['$$matrixTransform'] = mCss;
    }
};


RendererCSS3D.prototype.setCSS3DViewProjection = function (viewProjection)
{
    var m = viewProjection.transpose();

    //TODO:Webkit specific, need to abstract for other browsers
    var mCss = new CSSMatrix();
    mCss.m11 = m.m11;
    mCss.m12 = m.m12;
    mCss.m13 = m.m13;
    mCss.m14 = m.m14;
    mCss.m21 = m.m21;
    mCss.m22 = m.m22;
    mCss.m23 = m.m23;
    mCss.m24 = m.m24;
    mCss.m31 = m.m31;
    mCss.m32 = m.m32;
    mCss.m33 = m.m33;
    mCss.m34 = m.m34;
    mCss.m41 = m.m41;
    mCss.m42 = m.m42;
    mCss.m43 = m.m43;
    mCss.m44 = m.m44;

    if (quirks.supportsPreserve3D && !Config.forceIERenderPath)
    {
        //Note: If setting as a string css can't handle scientific notation e.g. 1e-4
        this._3dViewportDiv.style.webkitTransform = mCss;
        this._3dViewportDiv.style.mozTransform = mCss;
        this._3dViewportDiv.style.msTransform = mCss;
    } else
    {
        //Used by updateTransforms
        this._3dViewportDiv['$$matrixTransform'] = mCss;
    }
};

RendererCSS3D.prototype.setCSS3DOpacity = function (elem, opacity, duration)
{
    elem.style.webkitTransition = 'opacity ' + duration + 's linear';
    elem.style.mozTransition = 'opacity ' + duration + 's linear';
    elem.style.msTransition = 'opacity ' + duration + 's linear';
    elem.style.opacity = opacity;
};

RendererCSS3D.prototype.setClearColor = function (color)
{
    //Does some validation of input and throws if there is an issue.
    this._checkClearColor(color);

    this._clearColor = color;
    this._flatten3D.style.backgroundColor = 'rgba(' + this._clearColor.r * 255.0 + ',' + this._clearColor.g * 255.0 + ',' + this._clearColor.b * 255.0 + ',' + this._clearColor.a + ')';
};
/* @restore(0092) */
///#source 1 1 /Renderer/RendererWebGL.js
/* @disable(0092) */
/* @disable(0136) */
/* @constructor */function RendererWebGL(win, width, height)
{
    RendererWebGL.__super.call(this, win);

    this._width = width;
    this._height = height;

    var canvas = document.createElement('canvas');
    this._rootElement = canvas;
    this._rootElement.width = this._width;
    this._rootElement.height = this._height;

    this._gl = RendererCheckWebGL.getWebGLContext(this._rootElement);
    if (!this._gl)
    {
        throw "WebGL is not supported.";
    } else if (quirks.isWebGLCORSRequired && !quirks.isWebGLCORSSupported)
    {
        throw 'CORS image textures are not supported in this browser';
    }
    
    var gl = this._gl;

    gl.viewportWidth = this._width;
    gl.viewportHeight = this._height;

    gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
    gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
    this._gl.clearDepth(1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    this.init();

    //We do this last incase any earlier issues throw.
    win.appendChild(this._rootElement);
}
extend(RendererWebGL, Renderer);

function createShader(gl, shaderType, shaderText)
{
    var shader;
    shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderText);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        var error = gl.getShaderInfoLog(shader);
        Utils.log("Shader compiling error: " + error);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

RendererWebGL.prototype.init = function ()
{
    var vsText = '\
				 uniform mat4 u_modelViewProjMat; \
				 uniform mat4 u_localMat; \
				 \
				 /* the following can be optimized into one vec4 */ \
				 uniform vec2 u_opacityBE, u_xBE, u_yBE, u_rotateBE; \
				 uniform vec2 u_sxBE, u_syBE; \
				 uniform float u_texW, u_texH; \
				 attribute vec4 a_pos; \
				 attribute vec4 a_texCoord; \
				 varying vec2 v_texCoord; \
				 varying float v_opacity; \
				 \
				 void main() \
				 { \
				 	float opacity, x, y, rotate; \
					mat4 finalMat; \
					float a; \
					 \
					finalMat = u_modelViewProjMat; \
					opacity = u_opacityBE[0]; \
					 \
					vec4 pos = finalMat * a_pos; \
					v_texCoord = a_texCoord.xy; \
					v_opacity = opacity; \
					gl_Position = pos; \
				 }';

    var psText = '\
precision mediump float; \n\
#define KERNEL_SIZE 9 \n\
uniform sampler2D u_diffuseTex; \n\
uniform vec4 u_colorMult; \n\
uniform vec2 u_kernelOffsets[9]; \n\
uniform float u_kernel[9]; \n\
varying float v_opacity; \n\
varying vec2 v_texCoord; \n\
void main() { \n\
	vec2 texCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y); \n\
	/*vec4 color = texture2D(u_diffuseTex, texCoord); */\n\
	vec4 color = vec4(0); \n\
	for(int i=0; i<9; i++ ) { \n\
		vec4 tmp = texture2D(u_diffuseTex, texCoord.st + u_kernelOffsets[i]); \n\
		color += tmp * u_kernel[i]; \n\
	} \n\
	gl_FragColor = color * vec4(1,1,1,v_opacity); \n\
}';

    var gl = this._gl;

    this._vs = createShader(gl, gl.VERTEX_SHADER, vsText);
    this._ps = createShader(gl, gl.FRAGMENT_SHADER, psText);
    if (this._vs == null || this._ps == null)
        throw "Failure initializing webgl: shader";

    this._shaderProgram = gl.createProgram();
    gl.attachShader(this._shaderProgram, this._vs);
    gl.attachShader(this._shaderProgram, this._ps);
    gl.linkProgram(this._shaderProgram);

    if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS))
    {
        gl.deleteProgram(this._shaderProgram);
        gl.deleteShader(this._vs);
        gl.deleteShader(this._ps);
        return;
    }

    var numAttribs = gl.getProgramParameter(this._shaderProgram, gl.ACTIVE_ATTRIBUTES);
    this._attribs = new Array(numAttribs);
    this._attribLocations = {};
    for (var i = 0; i < numAttribs; i++)
    {
        var activeattrib = gl.getActiveAttrib(this._shaderProgram, i);
        this._attribs[i] = activeattrib;
        this._attribLocations[activeattrib.name] =
			gl.getAttribLocation(this._shaderProgram, activeattrib.name);
    }
    var numUniforms = gl.getProgramParameter(this._shaderProgram, gl.ACTIVE_UNIFORMS);
    this._uniforms = new Array(numUniforms);
    this._uniformLocations = {};
    for (var j = 0; j < numUniforms; j++)
    {
        var activeuniform = gl.getActiveUniform(this._shaderProgram, j);
        this._uniforms[j] = activeuniform;
        this._uniformLocations[activeuniform.name] = gl.getUniformLocation(
				this._shaderProgram, activeuniform.name);
    }
};

RendererWebGL.prototype.setViewportSize = function (width, height)
{
    this._width = width;
    this._height = height;
    this._rootElement.width = this._width;
    this._rootElement.height = this._height;

    this._gl.viewportWidth = this._width;
    this._gl.viewportHeight = this._height;
    this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
};
/* @disable(0058) */
RendererWebGL.prototype.render = function()
{
    var imageElement, texture;
    var gl = this._gl;

    // Clean up WebGL resources associated with removed renderables.
    // Have to do this because of web browsers hold a reference to
    // such resources (through a hash table). Therefore, if not 
    // deliberately deleted, textures and such will exist forever.
    // This is sad, and against everything else in JavaScript, but true.
    // http://www.khronos.org/webgl/public-mailing-list/archives/1106/msg00105.html
    //
    var delta = this._viewModel.getRemovedRenderablesAsArray();
    for (var i = 0; i < delta.length; i++)
    {
        var id = delta[i].viewElementId.id;

        var r = this._viewModel.currentVisibleRenderables[id];
        if (!r) continue;

        if (r.geometryPloygon.__gl_posBuffer)
            gl.deleteBuffer(r.geometryPloygon.__gl_posBuffer);

        if (r.geometryPloygon.__gl_indexBuffer)
            gl.deleteBuffer(r.geometryPloygon.__gl_indexBuffer);

        texture = renderable.texturesWithPolygons[0].texture;
        if (texture.__gl_texture)
            gl.deleteTexture(texture.__gl_texture);

        if (r.geometryPloygon.__gl_texCoordBuffer)
            gl.deleteBuffer(r.geometryPloygon.__gl_texCoordBuffer);
    }
    this._removedRenderables = {};

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set shader
    gl.useProgram(this._shaderProgram);

    //set no filter - use the images as they are.
    var kernel = new Float32Array(RendererUtils.FilterType.NO_FILTER);

    var allRenderables = this._viewModel.getVisibleRenderablesAsArray();
    allRenderables.sort(this.SortRenderableFucntion);

    for (var pass = 0; pass < 2; pass++)
    {
        if (pass == 1)
        {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        } else
        {
            gl.disable(gl.BLEND);
        }

        for (var j = 0, length = allRenderables.length; j < length; j++)
        {
            //var renderable = this._renderables[renderableId];
            var renderable = allRenderables[j];

            imageElement = null;
            texture = renderable.texturesWithPolygons[0].texture;
            if (texture._isReady)
            {
                imageElement = texture._image;
            }

            if (imageElement == null || renderable.geometryPloygon == null)
                continue;

            if (!renderable.geometryPloygon._vertices)
            {
                RendererUtils.InitRenderableFor3D(renderable);
            }

            // render opaque in pass 0, transparent in pass 1; assume transparent if there
            // is an animation on opacity. Because animation is done in shader, here we
            // don't know what the current opacity value is
            this.InitViewElementOpacity(renderable);

            if (pass == 0 && (imageElement.opacity < 1))
            {
                continue;
            }

            if (renderable.geometryPloygon._isDirty)
            {
                //create position buffer
                if (renderable.geometryPloygon.__gl_posBuffer)
                {
                    gl.deleteBuffer(renderable.geometryPloygon.__gl_posBuffer);
                }
                renderable.geometryPloygon.__gl_posBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, renderable.geometryPloygon.__gl_posBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderable.geometryPloygon._vertices), gl.STATIC_DRAW);

                //create texture coord buffer
                if (renderable.geometryPloygon.__gl_texCoordBuffer)
                {
                    gl.deleteBuffer(renderable.geometryPloygon.__gl_texCoordBuffer);
                }
                renderable.geometryPloygon.__gl_texCoordBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, renderable.geometryPloygon.__gl_texCoordBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderable.geometryPloygon._texCoords), gl.STATIC_DRAW);

                if (renderable.geometryPloygon._indices)
                {
                    if (renderable.geometryPloygon.__gl_indexBuffer)
                    {
                        gl.deleteBuffer(renderable.geometryPloygon.__gl_indexBuffer);
                    }
                    renderable.geometryPloygon.__gl_indexBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderable.geometryPloygon.__gl_indexBuffer);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, /* @disable(0058) */new Uint16Array(renderable.geometryPloygon._indices), /* @restore(0058) */gl.STATIC_DRAW);
                }

                renderable.geometryPloygon._isDirty = false;
            }
            
            // At this point we're sure the image is ready because of
            // the preceding logic
            var imageWidth = imageElement.width;
            var imageHeight = imageElement.height;
            if (texture._isDirty)
            {
                if (texture.__gl_texture)
                {
                    gl.deleteTexture(texture.__gl_texture);
                }
                texture.__gl_texture = gl.createTexture();
                
                gl.bindTexture(gl.TEXTURE_2D, texture.__gl_texture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                //TODO:undertand how and when this should be used. CLAMP_TO_EDGE and REPEAT are the options for thes guys
                var clampToEdge = gl.CLAMP_TO_EDGE;
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, clampToEdge);//CLAMP
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, clampToEdge);//CLAMP_TO_BORDER

                try
                {
                    if (!MathHelper.isPowerOfTwo(imageWidth) || !MathHelper.isPowerOfTwo(imageHeight))
                    {
                        var canvas = document.createElement("canvas");
                        canvas.width = MathHelper.nextHighestPowerOfTwo(imageWidth);
                        canvas.height = MathHelper.nextHighestPowerOfTwo(imageHeight);

                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(imageElement,
		                    0, 0, imageWidth, imageHeight,
		                    0, 0, canvas.width, canvas.height);
                        imageElement = canvas;
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
                    } else
                    {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);
                    }

                } catch(e)
                {
                    //If the correct headers aren't set on the image tiles, the gl.texImage2D() call will throw a security exception.
                    //Don't bother trying to draw this tile, but still attempt to draw the rest if possible.
                    continue;
                }

                gl.generateMipmap(gl.TEXTURE_2D);
                texture._isDirty = false;
            }
            
            

            // set matrix
            var finalMat = this._viewProjMatrix.multiply(renderable.transform);
            var glFinalMat = new Float32Array(finalMat.flattenColumnMajor());
            gl.uniformMatrix4fv(this._uniformLocations["u_modelViewProjMat"], false, glFinalMat);

            var stepW = 1.0 / imageWidth;
            var stepH = 1.0 / imageHeight;
            //TODO: this is strange. What do these offsets do??
            var _offsets = [-stepW, -stepH, 0.0, -stepH, stepW, -stepH, -stepW, 0.0, 0.0, 0.0, stepW, 0.0, -stepW, stepH, 0.0, stepH, stepW, stepH];
           /* var _offsets = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0];*/
            var offsets = new Float32Array(_offsets);

            gl.uniform2fv(this._uniformLocations["u_kernelOffsets[0]"], offsets);
            gl.uniform1fv(this._uniformLocations["u_kernel[0]"], kernel);

            //TODO: we do not have begin end anymore. So that may be refactored to 1 argument.
            gl.uniform2f(this._uniformLocations["u_opacityBE"], imageElement.opacity, imageElement.opacity);
            gl.uniform1f(this._uniformLocations["u_t"], -1);

            gl.enableVertexAttribArray(this._attribLocations["a_pos"]);
            gl.enableVertexAttribArray(this._attribLocations["a_texCoord"]);

            // set position source
            gl.bindBuffer(gl.ARRAY_BUFFER, renderable.geometryPloygon.__gl_posBuffer);
            gl.vertexAttribPointer(this._attribLocations["a_pos"], 3, gl.FLOAT, false, 0, 0);

            // set texture coords source
            gl.bindBuffer(gl.ARRAY_BUFFER, renderable.geometryPloygon.__gl_texCoordBuffer);
            gl.vertexAttribPointer(this._attribLocations["a_texCoord"],
                renderable.geometryPloygon._texCoordSize, gl.FLOAT, false, 0, 0);

            if (renderable.geometryPloygon._indices)
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderable.geometryPloygon.__gl_indexBuffer);

            // set texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture.__gl_texture);
            gl.uniform1i(this._uniformLocations["u_diffuseTex"], 0);

            gl.drawElements(gl.TRIANGLES, renderable.geometryPloygon._indices.length, gl.UNSIGNED_SHORT, 0);
            
            this.UpdateViewElementOpacity(renderable, .07);
        }
    } // pass
};
/* @restore(0058) */

RendererWebGL.prototype.animate = function (renderable,
                                       startProperties,
                                       endProperties,
                                       duration,
                                       easing,
                                       completeCallback,
                                       completeCallbackInfo)
{
    //since animation is remodeled and done now in the render loop this is currently empty.
};


RendererWebGL.prototype.setClearColor = function (color)
{
    //Does some validation of input and throws if there is an issue.
    this._checkClearColor(color);

    this._clearColor = color;
    this._gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
};

RendererWebGL.prototype.GetType = function ()
{
    return "3D";
};

/* @restore(0136) */
/* @restore(0092) */
///#source 1 1 /Renderer/RendererCanvas.js
/**
* @file RendererCanvas.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
*/


/* @disable(0092) */
/**
* This is the HTML5-Canvas based renderer. It can render precomputed quads with associated geometry. Cannot handle full 3D transfrom.
*
* @param {HTMLElement} win - the root element to attach to.
* @param {int} width - in pixels;
* @param {int} height - in pixels;
*
* @constructor 
*/
function RendererCanvas(win, width, height)
{
	RendererCanvas.__super.call(this, win);

	this._width = width;
	this._height = height;

	var canvas	= document.createElement('canvas');
	this._rootElement = canvas; 
	this._rootElement.width = this._width;
	this._rootElement.height = this._height;
	this._canvasContext = canvas.getContext("2d");
	this._expansionInPixels = RendererCanvas.STD_PIXEL_EXPANSION;
	
    //We do this last incase any earlier issues throw.
    win.appendChild(this._rootElement);
}
extend(RendererCanvas, Renderer);

RendererCanvas.STD_PIXEL_EXPANSION = window.chrome ? .0 : .5;

RendererCanvas.prototype.setViewportSize = function (width, height) {
	this._width = width;
	this._height = height;
	this._rootElement.width = width;
	this._rootElement.height = height;    
};

RendererCanvas.prototype.render = function()
{
    var imageElement, texture;

    var visibleElArr = this._viewModel.getVisibleRenderablesAsArray();
    visibleElArr.sort(this.SortRenderableFucntion);

    this.renderImageryB = true;

    if (DebugHelper.debugEnabled)
    {
        var tilesElem = document.getElementById('tiles');
        if (tilesElem)
        {
            this.showSquareB = tilesElem.checked;
        }

        var trianglesElem = document.getElementById('triangles');
        if (trianglesElem)
        {
            this.showTrianglesB = trianglesElem.checked;
        }

        var imagesElem = document.getElementById('images');
        if (imagesElem)
        {
            this.renderImageryB = imagesElem.checked;
        }
    }

    var canvas = this._canvasContext;

    canvas.fillStyle = this._fillStyle;
    canvas.fillRect(0, 0, this._width, this._height);

    var totalNumberOfTrianglesRendered = 0;
    for (var i = 0; i < visibleElArr.length; i++)
    {
        var renderable = visibleElArr[i];
        var geometry = renderable.geometryPloygon;

        
        //handle single texture for now
        var textureWithPoly = renderable.texturesWithPolygons[0];
        texture = textureWithPoly.texture;
        imageElement = texture._isReady ? texture._image : null;

        //skip drawing not yet loaded imagery
        if (imageElement == null || geometry == null)
        {
            continue; 
        }
        this.InitViewElementOpacity(renderable);
        
        //2D Renderer relies on this property being present as iit cannot do full 3D
        var renderedPolygons = geometry.intileTesselated;

        /**/ // this draws tessleation
        for (var inners = 0; this.renderImageryB && inners < renderedPolygons.length; inners++)
        {
            var renderedPolygon = renderedPolygons[inners];
            if (!renderedPolygon)
            {
                continue;
            }
            var screenArray = renderedPolygon.screenArray,
                textureArray = renderedPolygon.textureArray,
                startingScrVertice = screenArray[0],
                startingTexVertice = textureArray[0],
                secondScrTriangleVertice,
                secondTexTriangleVertice,
                thirdScrTriangleVertice,
                thirdTexTriangleVertice;

            //perf - avoid loop setup for the majority of cases.
            //if (renderable.id.levelOfDetail != renderable.worldLod)
            if (screenArray.length == 4)
            {
                secondScrTriangleVertice = screenArray[1];
                secondTexTriangleVertice = textureArray[1];
                thirdScrTriangleVertice = screenArray[2];
                thirdTexTriangleVertice = textureArray[2];

                /* @disable(0058) */
                drawTriangle(canvas, imageElement, imageElement.opacity,
                    startingScrVertice.x, startingScrVertice.y, secondScrTriangleVertice.x, secondScrTriangleVertice.y, thirdScrTriangleVertice.x, thirdScrTriangleVertice.y,
                    startingTexVertice.x, startingTexVertice.y, secondTexTriangleVertice.x, secondTexTriangleVertice.y, thirdTexTriangleVertice.x, thirdTexTriangleVertice.y,
                    this.showTrianglesB);

                secondScrTriangleVertice = screenArray[2];
                secondTexTriangleVertice = textureArray[2];
                thirdScrTriangleVertice = screenArray[3];
                thirdTexTriangleVertice = textureArray[3];

                drawTriangle(canvas, imageElement, imageElement.opacity,
                    startingScrVertice.x, startingScrVertice.y, secondScrTriangleVertice.x, secondScrTriangleVertice.y, thirdScrTriangleVertice.x, thirdScrTriangleVertice.y,
                    startingTexVertice.x, startingTexVertice.y, secondTexTriangleVertice.x, secondTexTriangleVertice.y, thirdTexTriangleVertice.x, thirdTexTriangleVertice.y,
                    this.showTrianglesB);
                /* @restore(0058) */
                totalNumberOfTrianglesRendered += 2;
            } else
            {
                for (var myIdx = 1, myIdxNext = 1, len = screenArray.length - 1; myIdxNext < len; myIdx = myIdxNext)
                {
                    myIdxNext = myIdx + 1;
                    secondScrTriangleVertice = screenArray[myIdx];
                    secondTexTriangleVertice = textureArray[myIdx];
                    thirdScrTriangleVertice = screenArray[myIdxNext];
                    thirdTexTriangleVertice = textureArray[myIdxNext];


                    /* @disable(0058) */
                    drawTriangle(canvas, imageElement, imageElement.opacity,
                        startingScrVertice.x, startingScrVertice.y, secondScrTriangleVertice.x, secondScrTriangleVertice.y, thirdScrTriangleVertice.x, thirdScrTriangleVertice.y,
                        startingTexVertice.x, startingTexVertice.y, secondTexTriangleVertice.x, secondTexTriangleVertice.y, thirdTexTriangleVertice.x, thirdTexTriangleVertice.y,
                        this.showTrianglesB);
                    /* @restore(0058) */

                    totalNumberOfTrianglesRendered++;
                }
            }
            //break;
        }

        this.UpdateViewElementOpacity(renderable, .15);
        //break;
        /**/
        if (DebugHelper.debugEnabled)
        {
            //tesselation quads
            /**/
            if (!this.renderImageryB && this.showTrianglesB)
            {
                canvas.strokeStyle = "teal";
                var screenGeometry = geometry.intileTesselated;
                for (var debugLoop = 0; debugLoop < screenGeometry.length; debugLoop++)
                {
                    if (screenGeometry[debugLoop])
                    {
                        RendererUtils.DrawPolyLine(canvas, screenGeometry[debugLoop].screenArray, null);
                    }
                }
            }
            /**/
            
            //Utils.log("======RENDERABLE: " + renderable.id.viewElementId + "=========================") ;
            //tile quad
            if (this.showSquareB)
            {
                var logVerts = false;
                canvas.strokeStyle = renderable.isClipped ? "red" : "cyan";
                RendererUtils.DrawPolyLine(canvas, geometry.screenArray, logVerts);
                canvas.strokeStyle = "black";
            }
        }
        /**/
    }
    
    if (DebugHelper.debugEnabled)
    {
        canvas.font = "14px Tahoma";
        canvas.strokeStyle = "blue";
        canvas.strokeText("Rendered triangles: " + totalNumberOfTrianglesRendered, this._width - 200, this._height - 50);
    }

    //Utils.log("********************PASS********************");
    


    function drawTriangle(ctx, image, opacity,
        x0, y0, x1, y1, x2, y2,
        sx0, sy0, sx1, sy1, sx2, sy2, debugTriangles)
    {

        /*
        if (!Intersects(0, RenderTriangle.Width, 0, RenderTriangle.Height, x0, y0, x1, y1, x2, y2))
        {
            return false;
        }
        */

        //double edgeOffset = isOutlined ? ContractionInPixels : ExpansionInPixels;
        //Vector2d expandedS0 = GetMiterPoint(Vector2d.Create(x0, y0), Vector2d.Create(x1, y1), Vector2d.Create(x2, y2), ExpansionInPixels);
        //Vector2d expandedS1 = GetMiterPoint(Vector2d.Create(x1, y1), Vector2d.Create(x0, y0), Vector2d.Create(x2, y2), ExpansionInPixels);
        //Vector2d expandedS2 = GetMiterPoint(Vector2d.Create(x2, y2), Vector2d.Create(x1, y1), Vector2d.Create(x0, y0), ExpansionInPixels);
        var fMiterPoint = miterPoint; //perf
        
        var expandedS0 = fMiterPoint(x0, y0, x1, y1, x2, y2);
        var expandedS1 = fMiterPoint(x1, y1, x0, y0, x2, y2);
        var expandedS2 = fMiterPoint(x2, y2, x1, y1, x0, y0);

        x0 = expandedS0.x;
        y0 = expandedS0.y;
        x1 = expandedS1.x;
        y1 = expandedS1.y;
        x2 = expandedS2.x;
        y2 = expandedS2.y;


        ctx.save();
        if (opacity < 1)
        {
            ctx.globalAlpha = opacity;
            this._expansionInPixels = 0.2;
        } else
        {
            this._expansionInPixels = RendererCanvas.STD_PIXEL_EXPANSION;
        }

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        if (debugTriangles)
        {
            canvas.strokeStyle = "blue";
            canvas.stroke();
        }
        ctx.clip();


        var denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
        if (denom == 0)
        {
            ctx.restore();
            return false;
        }

        var m11 = -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom;
        var m12 = (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom;
        var m21 = (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom;
        var m22 = -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom;
        var dx = (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / denom;
        var dy = (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / denom;

        ctx.transform(m11, m12, m21, m22, dx, dy);

        if (true)
        {
            ctx.drawImage(image, 0, 0);
        }
        ctx.restore();

        return true;
    }

    function miterPoint (p1X, p1Y, p2X, p2Y, p3X, p3Y)
    {
        //Vector2d edge1 = Vector2d.SubtractVector(p2, p1);
        var e1x = p2X - p1X;
        var e1y = p2Y - p1Y;

        //Vector2d edge2 = Vector2d.SubtractVector(p3, p1);
        var e2x = p3X - p1X;
        var e2y = p3Y - p1Y;

        //edge1.Normalize();
        var length = Math.sqrt(e1x * e1x + e1y * e1y);
        if (length != 0)
        {
            e1x /= length;
            e1y /= length;
        }

        //edge2.Normalize();
        length = Math.sqrt(e2x * e2x + e2y * e2y);
        if (length != 0)
        {
            e2x /= length;
            e2y /= length;
        }
        //Vector2d dir = Vector2d.Create(edge1.X + edge2.X, edge1.Y + edge2.Y);
        var dx = e1x + e2x;
        var dy = e1y + e2y;

        //dir.Normalize();
        length = Math.sqrt(dx * dx + dy * dy);
        if (length != 0)
        {
            dx /= length;
            dy /= length;
        }

        //Vector2d delta = Vector2d.Create(edge1.X - edge2.X, edge1.Y - edge2.Y);
        var deltax = e1x - e2x;
        var deltay = e1y - e2y;

        //double sineHalfAngle = delta.Length / 2;
        length = Math.sqrt(deltax * deltax + deltay * deltay);
        var sineHalfAngle = length / 2.0;

        

        var net = Math.min(2, this._expansionInPixels / sineHalfAngle);

        //dir.Extend(net);
        dx *= net;
        dy *= net;

        //return Vector2d.Create(p1.X-dir.X,p1.Y-dir.Y);
        return { x: p1X - dx, y: p1Y - dy };
    }

};

RendererCanvas.prototype.setClearColor = function (color) {
    
    this._clearColor = color;
	this._fillStyle = 'rgba(' + this._clearColor.r * 255.0 + ',' + this._clearColor.g * 255.0 + ',' + this._clearColor.b * 255.0 + ',' + this._clearColor.a + ')';
	
};

RendererCanvas.prototype.animate = function (renderable,
		startProperties,
		endProperties,
		duration,
		easing,
		endCallback,
		endCallbackInfo) {
    if (renderable &&
		renderable._material &&
		renderable._material._texture &&
		renderable._material._texture._image) {
        var material = renderable._material;
      
        var anim = material._animation = new Animation;
        if (material._animatableStates)
            anim.initStates(material._animatableStates);
        else
            material._animatableStates = anim.getEndStates();
        var prop;
        for (prop in startProperties) {
            if (startProperties.hasOwnProperty(prop)) {
                if (prop in anim) {
                    anim[prop].begin = startProperties[prop];
                }
            }
        }
        for (prop in endProperties) {
            if (endProperties.hasOwnProperty(prop)) {
                if (prop in anim) {
                    anim[prop].end = endProperties[prop];
                }
            }
        }
        // The timer for animation only starts after the
        // renderable is ready. If animate() is called on a
        // renderable that is not ready, it's animation's
        // _startT is set to -1.
        var d = new Date;
        if (material._texture._isReady)
            anim._startT = d.getTime();
        else
            anim._startT = -1;
        anim._duration = duration;
        anim._easingMode = easing;

        if (endCallback) anim._endCallback = endCallback;
        if (endCallbackInfo) anim._endCallbackInfo = endCallbackInfo;
    }
};

RendererCanvas.prototype.GetType = function()
{
    return "2D";
};

/* @restore(0092) */

///#source 1 1 /DataSource/ViewElements/ITesselator.js
/**
* @file ITesselator.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
*/

/**
* interface for Tesselator classes
* @constructor
*/
function ITesselator()
{
};

/**
* Creates the tesselation for the {IViewElement}.
*
* @param {IViewElement} iViewElement - the element to create tesselation for.
* @param {int} density               - the level of tesselation. Different tesselators will treat this differently.
*
* @return throws {Exception} - should not be used directly. Instead implementing classes should override the function.
*/
ITesselator.prototype.Tesselate = function (iViewElement, density, camera)
{
    throw "interface function called instead of implementation";
};

/**
* Returns the non-normalized floating poing number, indicating the tesselation density that is going to be generated for given viewElement.
*/
ITesselator.prototype.GetRawDensity = function (iViewElement, camera)
{
    throw "interface function called instead of implementation";
};
///#source 1 1 /DataSource/ViewElements/Tesselator.js
/**
* @file Tesselator.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
*/

/**
* Constructs the Tesselator object. This tesselator can create cubic and spheric based tesselations based on the {GraphicsHelper}.splitSquareRecursive fucntion usage. For more information about the tesselation pleae read the splitSquareRecursive function doc.
* Can determine the tesselation needed for the element if no density is supplied by comparing the elements 'screenPolyArea' property to the elements real pixel area.
* @see {Tesselator}._isSpheric
* @see {Tesselator}.ScreenQuadSize
* @see {Tesselator}.ScreenQuadSizeThreshold
* 
* @constructor
*/
function Tesselator()
{
    //inherit the interface
}

extend(Tesselator, ITesselator);

/**
* Determines which kind of tesselation should be applied.
* @see {GraphicsHelper}.splitSquareRecursive
*/
Tesselator._isSpheric = true;
// tesselation threshold. Can be improved to become agile as of environment used in
/**
* The size of the side of the area on the drawing canvas in pixels 
*/
Tesselator.ScreenQuadSize = 64;
/**
* The size of the area on the drawing canvas in pixels
*/
Tesselator.ScreenQuadSizeThreshold = Tesselator.ScreenQuadSize * Tesselator.ScreenQuadSize; // in screen px. 

Tesselator.setScreenQuadSize = function(sizeInPx)
{
    Tesselator.ScreenQuadSize = sizeInPx;
    Tesselator.ScreenQuadSizeThreshold = sizeInPx * sizeInPx;
    
    if (DebugHelper.debugEnabled)
    {
        var tessEls = document.getElementsByName("tess");
        for (var idx = 0; idx < tessEls.length; idx++)
        {
            if (tessEls[idx].value == sizeInPx)
            {
                tessEls[idx].checked = true;
                break;
            }
        }
    }
};

/**
* @see {ITesselator}.Tesselate() doc.
*/
Tesselator.prototype.Tesselate = function (iViewElement, density, camera)
{
    var newTesselation;
    if (density === 0)
    {
        return { squares: [iViewElement.geometryPolygon], texelSquares: [iViewElement.texturePolygon], density: 0 };
    }

    density = density || -1; 

    if (density < 0)
    {
        var depth = this.GetRawDensity(iViewElement, camera);
        //normalise depth
        depth = depth > density ? depth : density;
    } else
    {
        depth = density;
    }
    depth = depth >= 1 ? depth : 1;

    newTesselation = { squares: [], texelSquares: [], density: depth };
    GraphicsHelper.splitSquareRecursive(iViewElement.geometryPolygon, iViewElement.texturePolygon, depth, null, newTesselation, Tesselator._isSpheric, iViewElement.texturePolygon, null, null, null, null);
    newTesselation.density = depth;
    if (!newTesselation.density)
    {
        debugger;
    }

    return newTesselation;
};

/**
* @see {ITesseltor} for comments.
*/
Tesselator.prototype.GetRawDensity = function (iViewElement, camera)
{
    //determine which dimension is smaller to get fewer trianlgles
    var viewport = camera.getViewport(),
        vpWidth = viewport.getWidth(),
        vpHeight = viewport.getHeight();
    var takeHeight = vpHeight <= vpWidth;
    //determine the amount of world being covered by the camera.
    
    // get the height of the element. This is datasource-specific so we might want to think about moving this somewhere closer to datasource.
    var a0 = iViewElement.geometryPolygon[0].y,
        a1 = iViewElement.geometryPolygon[1].y,
        fov = camera.getVerticalFov(),
        
        portSize = vpHeight;
    
    if (!takeHeight)
    {
        fov = Viewport.convertVerticalToHorizontalFieldOfView(viewport.getAspectRatio(), fov);
        a0 = iViewElement.geometryPolygon[1].x;
        a1 = iViewElement.geometryPolygon[2].x;
        portSize = vpWidth;
    }
    
    var screenQuadSize = Tesselator.ScreenQuadSize;
    if (DebugHelper.debugEnabled)
    {
        var tessEls = document.getElementsByName("tess");
        for (var idx = 0; idx < tessEls.length; idx++)
        {
            if (tessEls[idx].checked == true)
            {
                screenQuadSize = tessEls[idx].value;
                break;
            }
        }
    }
    var elementHeight = Math.sqrt((a0 - a1) * (a0 - a1));
    var texelToPixel = GraphicsHelper.calculateTexelToPixelRatioAtFov(GraphicsHelper._cubeSide, screenQuadSize, portSize, fov);

    //since tesselator worx by recursively splitting element in half - determine the log of the number of tesselation occurences on the side.
    //Utils.log("Raw value: " + MathHelper.logBase(elementHeight / texelToPixel, 2));
    //floor should guaranties tesselation to be in [screenQuadSize, screenQuadSize*2] range
    var quadsInElement = elementHeight / texelToPixel;
    var recursiveTesselationQuotient = Math.floor(MathHelper.logBase(quadsInElement, 2));
    var reverseQuadsInElement = Math.pow(2, recursiveTesselationQuotient);
    //Utils.log("El LOD:" + iViewElement.viewElementId.levelOfDetail + " Tesselation: " + floor);
    return reverseQuadsInElement > quadsInElement ? recursiveTesselationQuotient - 1 : recursiveTesselationQuotient;
};

///#source 1 1 /DataSource/ViewElements/PanoramaElementTesselator.js
/**
* @file PanoramaElementTesselator.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
*/

/**
* Constructs the Tesselator object. This tesselator can create cubic and spheric based tesselations based on the {GraphicsHelper}.splitSquareRecursive fucntion usage. For more information about the tesselation pleae read the splitSquareRecursive function doc.
* Can determine the tesselation needed for the element if no density is supplied by comparing the elements 'screenPolyArea' property to the elements real pixel area.
* @see {PanoramaElementTesselator}._isSpheric
* @see {PanoramaElementTesselator}.ScreenQuadSize
* 
* @constructor
*/
function PanoramaElementTesselator()
{
    //inherit the interface
}

extend(PanoramaElementTesselator, ITesselator);

/**
* Determines which kind of tesselation should be applied.
* @see {GraphicsHelper}.splitSquareRecursive
*/
PanoramaElementTesselator._isSpheric = true;
// tesselation threshold. Can be improved to become agile as of environment used in
/**
* The size of the side of the area on the drawing canvas in pixels 
*/
PanoramaElementTesselator.ScreenQuadSize = 64;


PanoramaElementTesselator.setScreenQuadSize = function (sizeInPx)
{
    PanoramaElementTesselator.ScreenQuadSize = sizeInPx;
    PanoramaElementTesselator.ScreenQuadSizeThreshold = sizeInPx * sizeInPx;
    
    if (DebugHelper.debugEnabled)
    {
        var tessEls = document.getElementsByName("tess");
        for (var idx = 0; idx < tessEls.length; idx++)
        {
            if (tessEls[idx].value == sizeInPx)
            {
                tessEls[idx].checked = true;
                break;
            }
        }
    }
};

/**
* @see {ITesselator}.Tesselate() doc.
*/
PanoramaElementTesselator.prototype.Tesselate = function (iViewElement, density, camera)
{
    var nX, nY;
    //skip any computation for base level elements
    if (density === 0)
    {
        return { squares: [iViewElement.geometryPolygon], texelSquares: [iViewElement.texturePolygon], density: 0 };
    }

    density = density || -1;

    //override
    if (density < 0)
    {
        var viewport = camera.getViewport(),
        verticalFov = camera.getVerticalFov();

        PanoramaElementTesselator.prototype._updateTesselatorQuadSize();
        
        nX = PanoramaElementTesselator.prototype._getNumberOfSplits(iViewElement.geometryPolygon[1].x, iViewElement.geometryPolygon[2].x, Viewport.convertVerticalToHorizontalFieldOfView(viewport.getAspectRatio(), verticalFov), PanoramaElementTesselator.ScreenQuadSize, viewport.getWidth());
        nY = this.GetRawDensity(iViewElement, camera);

    } else
    {
        nX = nY = density;
    }

    //normalise
    if (nX < 1)
    {
        nX = 1;
    }
    if (nY < 1)
    {
        nY = 1;
    }
    
    //compute
    var geometryPolygon = iViewElement.geometryPolygon,
        texturePolygon = iViewElement.texturePolygon,
        startVertexZ = geometryPolygon[0].z,
        startVertexW = geometryPolygon[0].w,
        startX = geometryPolygon[1].x,
        endX = geometryPolygon[2].x,
        startXu = texturePolygon[1].x,
        endXu = texturePolygon[2].x,
        
        startY = geometryPolygon[0].y,
        startYv = texturePolygon[0].y,
        endY = geometryPolygon[1].y,
        endYv = texturePolygon[1].y;

    //prepare tesselation width points 
    var rangeX = [{ xy: startX, uv: startXu }, { xy: endX, uv: endXu }];
    getRangePoints(startX, endX, startXu, endXu, nX, rangeX);
    rangeX.sort(sortXyUvArrayByXy);

    //prepare tesselation height points 
    var rangeY = [{ xy: startY, uv: startYv }, { xy: endY, uv: endYv }];
    getRangePoints(startY, endY, startYv, endYv, nY, rangeY);
    rangeY.sort(sortXyUvArrayByXy);

    //prepare result data struture
    var numberOfElementsInTesselation = (rangeX.length - 1) * (rangeY.length - 1),
        squareIdx = 0,
        texelSquareIdx = 0,
        resultSquares = [numberOfElementsInTesselation],
        resultTexelSquares = [numberOfElementsInTesselation];
    
    //generate tesselation units
    //TODO: rather return the grid and make the renderer be able to draw tesselation grid.
    for (var xIdx = 0, xLen = rangeX.length - 1; xIdx < xLen; xIdx++)
    {
        for (var yIdx = 0, yLen = rangeY.length - 1; yIdx < yLen; yIdx++)
        {
            var firstVertX = rangeX[xIdx],
                firstVertY = rangeY[yIdx + 1],
                secondVertX = rangeX[xIdx + 1],
                secondVertY = rangeY[yIdx];
            
            
            resultSquares[squareIdx++] =
            [new Vector4(firstVertX.xy, firstVertY.xy, startVertexZ, startVertexW),
                new Vector4(firstVertX.xy, secondVertY.xy, startVertexZ, startVertexW),
                new Vector4(secondVertX.xy, secondVertY.xy, startVertexZ, startVertexW),
                new Vector4(secondVertX.xy, firstVertY.xy, startVertexZ, startVertexW)
            ];
            
            resultTexelSquares[texelSquareIdx++] =
            [new Vector4(firstVertX.uv, firstVertY.uv, startVertexZ, startVertexW),
                new Vector4(firstVertX.uv, secondVertY.uv, startVertexZ, startVertexW),
                new Vector4(secondVertX.uv, secondVertY.uv, startVertexZ, startVertexW),
                new Vector4(secondVertX.uv, firstVertY.uv, startVertexZ, startVertexW)
            ];
        }
    }


    var finalDensity = nX == nY ? nX : -1;
    
    return { squares: resultSquares, texelSquares: resultTexelSquares, density: finalDensity };

    function getRangePoints(a0, b0, u0, v0, numberOfSplits, rangeArray)
    {
        //recursive break condition
        if (numberOfSplits == 0)
        {
            return;
        }
        
        var splitResult = GraphicsHelper.splitFunction(PanoramaElementTesselator._isSpheric, a0, b0, u0, v0);
        var idx = rangeArray.length;
        rangeArray[idx] = splitResult;
        //subsplit the left section
        getRangePoints(a0, splitResult.xy, u0, splitResult.uv, numberOfSplits - 1, rangeArray);
        //subsplit the right section
        getRangePoints(splitResult.xy, b0, splitResult.uv, v0, numberOfSplits - 1, rangeArray);
    }

    function sortXyUvArrayByXy(a, b)
    {
        if (a.xy < b.xy)
        {
            return -1;
        }else if (a.xy > b.xy)
        {
            return 1;
        }
        return 0;
    }
};

/**
* @see {ITesseltor} for comments.
*/
PanoramaElementTesselator.prototype.GetRawDensity = function (iViewElement, camera)
{
    var viewport = camera.getViewport(),
        verticalFov = camera.getVerticalFov();

    PanoramaElementTesselator.prototype._updateTesselatorQuadSize();
    var numberOfSplitsY = PanoramaElementTesselator.prototype._getNumberOfSplits(iViewElement.geometryPolygon[0].y, iViewElement.geometryPolygon[1].y, verticalFov, PanoramaElementTesselator.ScreenQuadSize, viewport.getHeight());

    return numberOfSplitsY;
};

PanoramaElementTesselator.prototype._updateTesselatorQuadSize = function()
{
    if (DebugHelper.debugEnabled)
    {
        var tessEls = document.getElementsByName("tess");
        for (var idx = 0; idx < tessEls.length; idx++)
        {
            if (tessEls[idx].checked == true)
            {
                PanoramaElementTesselator.ScreenQuadSize = tessEls[idx].value;
            }
        }
    }
};

PanoramaElementTesselator.prototype._getNumberOfSplits = function(a0, a1, fov, desiredChunkSize, portSize)
{
    var elementHeight = Math.sqrt((a0 - a1) * (a0 - a1));
    var texelToPixel = GraphicsHelper.calculateTexelToPixelRatioAtFov(GraphicsHelper._cubeSide, desiredChunkSize, portSize, fov);

    //Utils.log("Raw value: " + MathHelper.logBase(elementHeight / texelToPixel, 2));

    return Math.floor(MathHelper.logBase(elementHeight / texelToPixel, 2));
};

///#source 1 1 /DataSource/ViewElements/CachingTesselator.js
/**
* @file CachingTesselator.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
*/

/**
* creates a caching proxy to the tesselator. Caching occurs based on the {iViewElement}.viewElementId.id property. Thus tesselations for unique elements are cached.
* Cache is stored in the internal object state so to clean the cache just 'loose' the object. Currently tesselator caches 2 tesselations for each element - high(requested) tesselation for fine rendering and and low(lower findelity) tesselation for 
* moving scenes.
* 
* @constructor
* @param {function} = constructor function of the {ITesselator} extended class.
*/
function CachingTesselator(iTesselatorClass)
{
    //behave like a tesselator.
    extend(this, iTesselatorClass);

    //internal cache object
    var cache = {};

    //override the tesselator function
    this.Tesselate = function (iViewElement, optionalDensity, camera)
    {
        var cacheId = iViewElement.viewElementId.id,
            tesselationReady = cache[cacheId],
            finalDensity = optionalDensity;

        if (!tesselationReady)
        {
            tesselationReady = {};
            cache[cacheId] = tesselationReady;
        }

        if (tesselationReady[optionalDensity] === undefined)
        {
            var newTesselation = iTesselatorClass.prototype.Tesselate.apply(this, [iViewElement, optionalDensity, camera]);
            finalDensity = newTesselation.density;
            tesselationReady[finalDensity] = newTesselation;
            //Utils.log("Tesselated at " + finalDensity);
        }
        //Utils.log("Tesselations: " + tesselationReady.squares.length);

        return tesselationReady[finalDensity];
    };

    this.GetRawDensity = function (iViewElement, camera)
    {
        return iTesselatorClass.prototype.GetRawDensity.call(this, iViewElement, camera);
    };
}
///#source 1 1 /View/WorldCuller.js
function WorldViewElementsCuller(camera)
{
    //Public API
    /* @disable(0136) */
    this.cullWorldAtLod = function(dataSource, lod)
    {
        var viewProjection = camera.getViewProjectionTransform(),
            viewElementResult = dataSource.getViewElements(lod),
            previousTransform,
            modelViewProjection = Matrix4X4.createIdentity(),
            resultById = {};
        
        //for each element of the world cull it according to current camera
        for (var viewElementIdStr in viewElementResult)
        {
            var viewElement = viewElementResult[viewElementIdStr];

            var viewElementId = viewElement.viewElementId;
            //TODO: this can be refactored into a class for delivering imagery for the datasource elements.
            var tileUrl = viewElement.textureSource(viewElementId.x, viewElementId.y, viewElementId.levelOfDetail);
            viewElement.priority = 0;
            viewElement.url = tileUrl;

            if (previousTransform != viewElement.faceTransform)
            {
                modelViewProjection = viewProjection.multiply(viewElement.faceTransform);
                previousTransform = viewElement.faceTransform;
            }

            //now we have to do that for each tile/ViewElement.
            //TODO: maybe someone would invent smth smart for the datasource so that we do not cull each ViewElement separately. Do not see what can be done here though yet.
            var clippedGeometry = this.genericCullPolygon(viewElement.geometryPolygon, viewElement.texturePolygon, modelViewProjection);

            if (!clippedGeometry)
            {
                continue;
            }

            viewElement.computedGeometry = clippedGeometry;
            viewElement.mvpMatrix = modelViewProjection;
            resultById[viewElementIdStr] = viewElement;
        }

        return resultById;
    };
    /* @restore(0136) */

    this.genericCullPolygon = function (polygon, texturePolygon, modelViewProjectionMatrix)
    {
        var clippedPolygon,
            clippedTexture;

        var ndcPolygon = GraphicsHelper.applyWorldTransformation(polygon, modelViewProjectionMatrix);

        var clippedPolygonCombined = convexPolygonClipper.clip(WorldViewElementsCuller.lowerVisibleBoundary, WorldViewElementsCuller.higherVisibleBoundary, ndcPolygon, texturePolygon);
        clippedPolygon = clippedPolygonCombined.polygon;
        clippedTexture = clippedPolygonCombined.polygonTexture;
        //manual hack to make the polygons correspond each other. Generally culling is done on the polygon and polygonTexture is just lerp'ed. So they should be same length
        clippedTexture.length = clippedPolygon.length;

        return clippedPolygon.length > 2 ? clippedPolygonCombined : undefined;
    };
}

WorldViewElementsCuller.lowerVisibleBoundary = new Vector4(-1, -1, -1, null);
WorldViewElementsCuller.higherVisibleBoundary = new Vector4(1, 1, 1, null);

///#source 1 1 /View/ViewElementPyramid.js
function ViewElementPyramid(dataSources, downloader, camera, worldCuller)
{
    var currentSettingsMap = {},
        numDataSources = dataSources.length,
        self = this;
    
    /* @disable(0092) */
    if (window.instrumentPerf && window.instrumentPerf.ttl)
    {
        /* @disable(0103) */
        calculateLodChange = function(dataSource)
        {
            return dataSource.getMinimumLod();
        };
        /* @restore(0103) */
    }
    /* @restore(0092) */
    
    for (var idx = 0; idx < numDataSources; idx++)
    {
        var currentDataSource = dataSources[idx];
        currentSettingsMap[currentDataSource.getDataSourceName()] = {
            currentLod: currentDataSource.getMinimumLod(),
            tesselationMap: {},
            lastLod: -1
        };
    }

    this.UpdateLodAndTesselation = function(dataSource, currentVisibleElements, isViewPortChanged)
    {
        var dataSourceName = dataSource.getDataSourceName(),
            currentSettings = currentSettingsMap[dataSourceName],
            currentLod = currentSettings.currentLod;

        var lodSettled = currentLod == currentSettings.lastLod;
        var lodUpdated = !lodSettled || isViewPortChanged;
        if (lodUpdated)
        {
            currentSettings.lastLod = currentLod;
            currentSettings.currentLod = currentLod = calculateLodChange(dataSource);
            //Utils.log("LOD updated to: " + currentLod);
        }
        
        var tesselationUpdated = updateTesselations(dataSourceName, lodUpdated, currentVisibleElements, currentLod, this.GetCurrentTesselationDensity(currentLod, dataSourceName));
        /*if (tesselationUpdated)
        {
            Utils.log("Tesselation updated to: " + currentSettingsMap[dataSourceName].tesselationMap[currentSettings.currentLod]);
        }*/

        return lodUpdated & tesselationUpdated;
    };
    
    //would return the current LOD for the datasource. if there is no current LOD computed - the datasource minimum will be returned
    this.GetCurrentLod = function(dataSourceName)
    {
        var currentLod = currentSettingsMap[dataSourceName].currentLod;
        if (!currentLod)
        {
            debugger; //set in constructor. should never happen.
        }
        return currentLod;
    };

    //this will be used when computing the tesselation for the 2d renderers. Generally we want to have uniform tesselation across all v
    //view elements in the datasource, so we do this with storing one value per datasource instead of computing the tesselation rate for each individual IViewElement
    this.GetCurrentTesselationDensity = function(lod, datasource)
    {
        var tesselationDensity = currentSettingsMap[datasource].tesselationMap[lod];
        return tesselationDensity ? tesselationDensity : -1;
    };

    this.EnrichWithParentIViewElements = function(dataSource, resultById)
    {
        var minimumLod = dataSource.getMinimumLod(),
            viewProjectionMatrix = camera.getViewProjectionTransform();

        for (var viewElementIdStr in resultById)
        {
            var iViewElement = resultById[viewElementIdStr];

            //check if item is in download cache - if not although it's nice to have it we probably won't at this renderer loop
            //also if an element is in download cache but has never been rendered it's nice to include it's parent so that we have a nice fade-in effect
            var dElement = downloader.AllCompleted.get(viewElementIdStr);
            if ((!dElement || (dElement.opacity === undefined || dElement.opacity < 1)) && iViewElement.viewElementId.levelOfDetail > minimumLod)
            {
                //Utils.log("Considered in need of cover: " + viewElementIdStr);
                //if not display parent untill it will become available
                var parentTileId = getFirstVisibleParent(iViewElement.viewElementId, minimumLod, dataSource);
                var parentTileIdStr = parentTileId.id;
                //Utils.log("Cover element: " + parentTileIdStr);

                if (isFailedDownload(iViewElement))
                {
                    //why waste time on this element if we cannot render it?
                    delete resultById[viewElementIdStr];
                }
                //Check if the parent has never been checked before. Other child might already have triggered calculation of this parent
                if (resultById[parentTileIdStr] === undefined)
                {
                    iViewElement = dataSource.getViewElementById(parentTileId);
                    if (isFailedDownload(iViewElement))
                    {
                        //Utils.log("Cover element download failed.");
                        //there's nothing more we can do.
                        continue;
                    }

                    var mvp = viewProjectionMatrix.multiply(iViewElement.faceTransform);
                    //Utils.log("Cover element state: " + downloader.getState(iViewElement.url));
                    iViewElement.mvpMatrix = mvp;
                    var cullResult = worldCuller.genericCullPolygon(iViewElement.geometryPolygon, iViewElement.texturePolygon, mvp);

                    if (!cullResult)
                    {
                        resultById[parentTileIdStr] = false; //like was calculated and is known to be not seen.
                        continue; //done here.
                    } else
                    {
                        iViewElement.computedGeometry = cullResult;
                        //TODO: this is copied from WorldCuller. That being said we need some init procedure for setting these fields up.
                        //TODO: Think of where to put it.
                        var tileUrl = iViewElement.textureSource(parentTileId.x, parentTileId.y, parentTileId.levelOfDetail);
                        iViewElement.priority = 0;
                        iViewElement.url = tileUrl;
                        resultById[parentTileIdStr] = iViewElement;
                    }
                } else //parent already has been calculated and should be present in the results if at all visible.
                {
                    continue;
                }
            }
        }
    };

    this.isBorderTile = function (dataSource, iViewElement)
    {
        return iViewElement.viewElementWidth != dataSource.worldConfiguration.source.tileSize || iViewElement.viewElementHeight != dataSource.worldConfiguration.source.tileSize;
    };
    
    //PRIVATE FUNCTIONS

    /**
    * So all of the code in this if is a lot of a 'hack' which is really dependednt on the way current datasources work.
    * it tries to come up with uniform tesselation(depth) for the datasource because most of the datasource viewelements are aligned together.
    * Thus if the tesselation is different for different elements based on their presense in the scene(which is more correct btw) - distortion does not not align nicely.
    *
    * @param {string}  dataSourceName - the name of the datasource for which tesselation is being updated
    * @param {boolean} isViewPortChanged - flag to indicate if canvas/cameraFov changed
    * @param {Object} currentElementsById - currently visible elements of the {dataSourceName} that are going to be rendered
    * @param {int} currentLod - current level of detail for the supplied {dataSourceName}
    * @param {int} currentTesselation - current tesselation level for the supplied {currentLod}
    *
    * @return {true} if tesselations were updated {false} if there were not enough valid elements to determine the tesselation reliably.
    * @see {GetCurrentTesselationDensity}.
    */
    function updateTesselations(dataSourceName, isViewPortChanged, currentElementsById, currentLod, currentTesselation)
    {
        var dataSource = dataSources[dataSourceName];
            
        //cache the tesselation depth if it has to occur
        //happens only if we do draw tesselation AND either FOV changed or we do not have that mean value at all yet.
        var doUpdate = isViewPortChanged || !currentTesselation || currentTesselation < 0;
        if (!doUpdate)
        {
            return false;
        }

        //Utils.log("LEVELED tesselation START.LOD [" + currentLod + "] ");
        var tesselationRecalculated = false;
            
        for (var v in currentElementsById)
        {
            var culledRes = currentElementsById[v];

            //if we see a parent tile - we skip it as it is would generally                 
            if (!culledRes || culledRes.viewElementId.levelOfDetail != currentLod)
            {
                continue;
            }

            //ignore small border elements calcualting the large picture
            //added the second condition because elements not donwloaded get calculated based on geometry and later they fail but the result of calculations is stored :(
            if (self.isBorderTile(dataSource, culledRes) || downloader.getState(culledRes.url) != TileDownloadState.ready)
            {
                //Utils.log("Border tile...");
                continue;
            }
            
            //one full element is enough with current datasources. when other datasources emerge this probably will have to change.
            var elementRawTesselationDensity = dataSource.getElementRawTesselationDensity(culledRes, camera);
            //Utils.log(culledRes.viewElementId.id + " :" + elementRawTesselationDensity);
            currentSettingsMap[dataSourceName].tesselationMap[currentLod] = elementRawTesselationDensity;
            
            //Utils.log("LOD [" + currentLod + "]. LEVELED tesselation: " + currentSettingsMap[dataSourceName].tesselationMap[currentLod]);
            tesselationRecalculated = true;
            
            break;
        }
         
        return tesselationRecalculated;
    };

    // private functions
    
    /**
     *This would try to determine if the curent LOD elements cover the viewport without a lot of stretching/shrinking. In case elements stretch the imagery a lot
     * or shrink it the LOD will be increased/decreased resulting in the next frame rendering with the new value.
     */
    function calculateLodChange(dataSource)
    {
        //return currentDataSource.getMinimumLod();  
        var minLod = dataSource.getMinimumLod(),
            maxLod = dataSource.getMaximumLod(),
            viewPort = camera.getViewport(),
            viewportHeight = viewPort.getHeight();
        

        var ndcRatio = GraphicsHelper.calculateTexelToPixelRatioAtFov(GraphicsHelper._cubeSide, dataSource.getWorldConfiguration().source.tileSize, viewportHeight, camera.getVerticalFov()); //do the calculation only when we haven't yet done it OR FOV changed.
        var newLod = minLod + Math.round(MathHelper.logBase(1 / ndcRatio, 2));

        //normalize due to API constraints.
        if (newLod > maxLod)
        {
            newLod = maxLod;
        }
        else if (newLod < minLod)
        {
            newLod = minLod;
        }

        if (DebugHelper.debugEnabled)
        {
            var lodv = document.getElementById('LODV');
            if (lodv)
            {
                lodv.innerHTML = "LOD: " + newLod;
                //alert("FOV is: " + camera.getVerticalFov());
            }
            //Utils.log("ratio: " + meanLodRatio + " NEXTLOD: " + newLod);
        }
        

        return newLod;
    }


    function getFirstVisibleParent(tileId, minLod, dataSource)
    {
        var parentId = tileId.getParent();
        if (parentId && !downloader.AllCompleted.get(parentId.id) && (parentId.levelOfDetail > minLod))
        {
            //enqueue for downloads
            var viewElementById = dataSource.getViewElementById(parentId);
            if (!isFailedDownload(viewElementById))
            {
                downloader.downloadImage(viewElementById.textureSource(parentId.x, parentId.y, parentId.levelOfDetail), 0, parentId.id);
            }

            parentId = getFirstVisibleParent(tileId.getParent(), minLod, dataSource);
        }

        return parentId;
    }

    function isFailedDownload(viewElement)
    {
        var elementState = downloader.getState(viewElement.url);
        return (elementState == TileDownloadState.failed || elementState == TileDownloadState.timedout);
    }

}

///#source 1 1 /View/ViewController.js

/**
* @file ViewController.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
*/

/**
* The ViewController has access to the {ISivDatasorces} and {InteractionController} so it can determine composition of the current scene.
* The ViewController will calculate the {IViewElements} in view, create {TextureRenderable} compose the ViewModel and use that to renderer 
* the scene with the provided renderer.
*
* @param {Renderer} renderer - the renderer to use when rendering the scenes
* @param {array}{ISivDatasource} dataSources - datasources which are currently supplying geometry for the scenes. Currently only 1 datasource at the time is supported.
* @param {Camera} camera - the camera object which would supply VieController with current(per frame) camera position
* @param {downloader} downloader - generic network resource downloader. Used to retrieve tiles from datasources.
*
* @constructor
*/
/* @disable(0092) */
/* @disable(0136) */
function ViewController(renderer, dataSources, camera, downloader)
{ 
    // PRIVATE MEMBER VARIABLES

    var viewModel = new ViewModel(),
        frameCount = 0,
        previousFov = -1, //used only for comparison with currentFOV to track the change
        isViewPortChanged = false,
        worldCuller = new WorldViewElementsCuller(camera),
        vePyramid = new ViewElementPyramid(dataSources, downloader, camera, worldCuller),
        viewPort = camera.getViewport(),
        viewPortWidth = viewPort.getWidth(),
        viewPortHeight = viewPort.getHeight(),
        SMALL_CANVAS_SIZE_PX = 800 * 600,
        MEDIUM_CANVAS_SIZE_PX = 1366 * 768;
    

    this.doPerfPingCall = function(boolFlag) 
    {
    };
    
    if (window.instrumentPerf)
    {
        this.doPerfPingCall = perfPingUponTilesLoaded;
    }

    renderer.setViewModel(viewModel);

    // PUBLIC METHODS

    /**
     * Prepares and renders one frame with renderables. Main execution function.
     *
     * @param {bool} isCachedUrl - TODO: investigate it's usage
     * @param {bool} useLowerFidelity - use this to achieve better performance via lower fidelity rendering.
     *
     * @return true if all elements were rendered with desired opacities. false if more cycles to render are needed.
     */
    this.RenderFrame = function(isCachedUrl, useLowerFidelity)
    {
        updateFromCamera();

        //prepare frame
        for (var i = 0, numDataSources = dataSources.length; i < numDataSources; i++)
        {
            var currentDatasource = dataSources[i],
                currentDataSourceName = currentDatasource.getDataSourceName();

            //this would fetch us the world delta.
            var worldDelta = getWorldElementsInView(currentDatasource, useLowerFidelity);
            viewModel.SetDelta(currentDataSourceName, worldDelta);

            //this will configure downloader to fetch the imagery when it's given time to.
            issueDownloadRequestsForMissingImagery(currentDataSourceName);

            generateTextureRenderables(currentDatasource);
            
            viewModel.syncAddedFromDeltaCurrentVisibleElements(currentDataSourceName);
            viewModel.syncUpdatedFromDeltaCurrentVisibleElements(currentDataSourceName, updateRenderableFromViewElement);

            //Process any downloaded resources and let renderables know here if needed.
            //...
            //Allow downloader to process any updates. This would issue download requestes to the browser
            downloader.update();

            updateTextureRenderablesWithImagery();

            viewModel.syncRemovedFromDeltaCurrentVisibleElements(currentDataSourceName);
            
            var wasUpdated = vePyramid.UpdateLodAndTesselation(currentDatasource, viewModel.currentVisibleElements[currentDataSourceName], isViewPortChanged);
            //consume the event if changes were made.
            if (wasUpdated)
            {
                isViewPortChanged = false;
            }
        }
        
        //render
        renderer.setViewProjectionMatrix(camera.getViewProjectionTransform());
        renderer.render(useLowerFidelity);

        ++frameCount;
        var visibleRenderablesAsArray = viewModel.getVisibleRenderablesAsArray();
        for (var inxb = 0, inxbLen = visibleRenderablesAsArray.length; inxb < inxbLen; inxb++)
        {
            var itm = visibleRenderablesAsArray[inxb];
            var textureWithPoly = itm.texturesWithPolygons[0];
            var texture = textureWithPoly.texture;
            var imageElement = texture._isReady ? texture._image : null;
            if (!imageElement || imageElement.opacity < 1)
            {
                break;
            }
        }
        var allRenderedOpaque = inxb == inxbLen;
        this.doPerfPingCall(allRenderedOpaque);
        
        DebugHelper.ShowDebugMessages(renderer);

        return allRenderedOpaque;
    };

    this.setViewChanged = function(didChange)
    {
        isViewPortChanged = didChange;
        var viewport = camera.getViewport(),
            width = viewport.getWidth(),
            height = viewport.getHeight(),
            renderingCanvas = width*height;

        if (renderingCanvas < SMALL_CANVAS_SIZE_PX)
        {
            Tesselator.setScreenQuadSize(32);
            PanoramaElementTesselator.setScreenQuadSize(32);
        }
        else if (renderingCanvas < MEDIUM_CANVAS_SIZE_PX)
        {
            Tesselator.setScreenQuadSize(64);
            PanoramaElementTesselator.setScreenQuadSize(64);
        } else
        {
            Tesselator.setScreenQuadSize(128);
            PanoramaElementTesselator.setScreenQuadSize(128);
        }
    };
    
    // PRIVATE METHODS

    function perfPingUponTilesLoaded(allRenderedOpaque)
    {
        //the first time we have nothing more to load - everything is presented to the user
        if (window.elapsed === undefined && !downloader.currentlyDownloading())
        {
            if (allRenderedOpaque)
            {
                window.elapsed = (new Date().getTime()) - window.instrumentPerf.startTime;
				document.getElementById("timerSpan").innerText = window.elapsed + " ms.";
                //alert("Total time to load: " + window.elapsed);
                var img = document.createElement('img');
                /* @disable(0058) */
                img.src = PingRequest.end;
                /* @restore(0058) */
            }
        }
    }

    function updateFromCamera()
    {
        viewPort = camera.getViewport();
        viewPortWidth = viewPort.getWidth();
        viewPortHeight = viewPort.getHeight();

        var nextVerticalFov = camera.getVerticalFov();

        //changed two degrees.
        var fovDiff = Math.abs(previousFov - nextVerticalFov);
        isViewPortChanged = !MathHelper.isZero(fovDiff);
        if (isViewPortChanged)
        {
            previousFov = nextVerticalFov;
        }
    }

    function getWorldElementsInView(currentDataSource, useLowerFidelity)
    {
        var withTesselation,
            is2D;
        is2D = renderer.GetType() == "2D";
        withTesselation = is2D; // currently we have 2 renderers and they work like this. if in future conditions change this code will too.

        //get the world we are working with
        var dataSourceName = currentDataSource.dataSourceName;
        var currentLod = vePyramid.GetCurrentLod(dataSourceName);
        var tesselationDensity = vePyramid.GetCurrentTesselationDensity(currentLod, dataSourceName);

        //apply perspective camera culling
        var culledResultById = worldCuller.cullWorldAtLod(currentDataSource, currentLod);

        // add parent viewElements for those that haven't yet been downloaded or fully displayed or failed.
        vePyramid.EnrichWithParentIViewElements(currentDataSource, culledResultById);

        //convert to array for speed.1Idx
        var culledResultArr = [];
        for (var tileId in culledResultById)
        {
            culledResultArr.push(culledResultById[tileId]);
        }
        var culledResultArrLen = culledResultArr.length;

        //As well canvas renderer knows how to render but not how what the geometry is. And ViewController is one managing datasources.
        if (is2D)
        {
            for (var index = 0; index < culledResultArrLen; index++)
            {
                var resultViewEl = culledResultArr[index];
                //overwrite computed 3d world geometry with screen space geometry for 2d renderers.
                resultViewEl.computedGeometry = currentDataSource.covertToScreenSpace(resultViewEl.computedGeometry.polygon, resultViewEl.computedGeometry.polygonTexture, viewPortWidth, viewPortHeight);
                if (withTesselation)
                {
                    tesselateIViewElement(currentDataSource, resultViewEl, tesselationDensity, is2D);
                }
            }
        }

        //determine which elements went out of camera's view and which are brought to the scene
        var delta = calculateCrudDelta(culledResultArr, dataSourceName);

        return delta;
    }

    /**
    * Tesselated the {IViewElement} using it's tesselator. A bit more complex than just the function call to account for cases when no tesselation is needed.
    * Tesselator does not cull elements - it just tesselates them and in case of 0 tesselation level the culled polygon should be used.
    * Also does the job of determining if the tesselated cell of the {IViewElement} is seen in the viewport. This way only visible tesselation is stored in the element.
    * 
    * @param {ISivDataSource} dataSource         - the datasource to use for culling tesselation cells
    * @param {IViewElement}   iViewElement       - the view element to tesselate
    * @param {int}            tesselationDensity - currently really tesselator specific. Depth of the tesselation in levels. @see {Tesselator} for more details
    * @param {boolean}        covertToScreenSpace- flag to indicate if converstion to screen space is needed. Maybe some renderers will do that on their own. 
    *
    * @return void. tesselation is stored in the {IViewElement}.computedGeometry.intileTesselated.
    */
    function tesselateIViewElement(dataSource, iViewElement, tesselationDensity, covertToScreenSpace)
    {

        var geometry = iViewElement.computedGeometry;


        //this basically means we're going to render untesselated viewElement
        if (tesselationDensity === 0)
        {
            //and by this time it is already converted to screen space implicity in geometry = covertToScreenSpace(clippedPolygon, clippedTexture);
            geometry.intileTesselated = [geometry];
            geometry.density = 0; 
        } else
        {
            var usingDensity = vePyramid.isBorderTile(dataSource, iViewElement) ? -1 : tesselationDensity;
            var newTesselation = dataSource.tesselate(iViewElement, usingDensity, camera);
            
            var squares = newTesselation.squares;
            var texelSquares = newTesselation.texelSquares;
            if (squares.length != texelSquares.length)
            {
                debugger;
            }
            geometry.intileTesselated = new Array(squares.length);
            var inTileIdx = 0;
            for (var i = 0, numSquares = squares.length; i < numSquares; i++)
            {
                var ndcPolygon = GraphicsHelper.applyWorldTransformation(squares[i], iViewElement.mvpMatrix);
                var clippedPolygonCombined = convexPolygonClipper.clip(WorldViewElementsCuller.lowerVisibleBoundary, WorldViewElementsCuller.higherVisibleBoundary, ndcPolygon, texelSquares[i]);

                //NOTE: we are not using the actual culled result of the clipper(and thus not passing the texture coords for lerp) because this is only for
                //'visibility test'. If we were to use this - renderer would yield different distortion for differently cut polygons and we're trying to
                //avoid that.
                //this check simply verifies that our clipped polygon consists of more than two points, which makes it a polygon, not a dot or a line.
                if (clippedPolygonCombined.polygon.length > 2)
                {
                    if (covertToScreenSpace)
                    {
                        var screenSpaceCoords = dataSource.covertToScreenSpace(ndcPolygon, texelSquares[i], viewPortWidth, viewPortHeight);
                        geometry.intileTesselated[inTileIdx] = screenSpaceCoords;
                        
                    } else
                    {
                        geometry.intileTesselated[inTileIdx] = new ScreenGeometry(ndcPolygon, texelSquares[i]);
                    }
                    inTileIdx++;
                }
            }
        }
    }

    //woud calculate Created/Updated/Deleted based on current viewModel and computed visibleElements. Works per datasource

    function calculateCrudDelta(visibleElements, datasourceName)
    {
        var added = [],
            updated = [],
            deleted = [],
            currentVisibleElements = viewModel.currentVisibleElements[datasourceName] || {};

        //update existing and push new elements
        //also build a fast index of worldElements for use later.
        var visibleElementsById = {}, id;

        var numVisibleElements = visibleElements.length;
        for (var i = 0; i < numVisibleElements; i++)
        {
            var visibleElement = visibleElements[i];
            id = visibleElement.viewElementId;
            if (!id)
            {
                continue;
            }

            var strId = id.id;

            if (currentVisibleElements[strId])
            {
                updated.push(visibleElement);
            } else
            {
                added.push(visibleElement);
            }
            visibleElementsById[strId] = visibleElement;
        }

        //remove occluded ones
        for (var elemId in currentVisibleElements)
        {
            if (!visibleElementsById[elemId])
            {
                deleted.push(currentVisibleElements[elemId]);
            }
        }

        return { added: added, updated: updated, removed: deleted };
    }

    function removeCancelled(list, delta)
    {
        var numRemoved = delta.removed.length;
        for (var i = 0; i < numRemoved; i++)
        {
            var id = delta.removed[i].entityId;
            if (list[id])
            {
                delete list[id];
            }
        }
    }

    /**
     * Creates TextureRenderables for IViewElements
     */

    function generateTextureRenderables(currentDataSource)
    { 
        var visibleEntities = viewModel.GetDelta(currentDataSource.getDataSourceName()).added,
            currentRenderables = viewModel.currentVisibleRenderables,
            currentLod = vePyramid.GetCurrentLod(currentDataSource.getDataSourceName()),
            renderable;

        
        for (var entitiesIndex = 0, numVisibleEntities = visibleEntities.length; entitiesIndex < numVisibleEntities; ++entitiesIndex)
        {
            var entity = visibleEntities[entitiesIndex];
            var entityTileId = entity.viewElementId;

            var textureWithPolygon = { texture: new Texture(entity.url, null, null, null, null, null, null), polygon: entity.texturePolygon.slice() };
            textureWithPolygon.texture.dataSourceWidth = entity.viewElementWidth;
            textureWithPolygon.texture.dataSourceHeight = entity.viewElementHeight;

            //TODO: support single texture renderables for now
            renderable = new TextureRenderable(entity.geometryPolygon, [textureWithPolygon], entityTileId, currentLod);
            updateRenderableFromViewElement(entity, renderable);

            /**/ //TODO: this would be particularly interesting for debugging purposes. Work on this later to have it rendering in-memory tiles.
            //renderable = new TestQuadRenderable(256, 256, entity.faceTransform, "cyan", entity.viewElementId, false);
            //renderable._entity = entity;
            //renderable.entityId = entityTileId.id;
            //renderable.pricep = entity.computedGeometry;
            //renderable._order = entityTileId.levelOfDetail;
            //renderable._material._texture._isReady = true;
            //renderable._material._texture._isDirty = true;
            //renderable._material._texture._image.width = 254;
            //renderable._material._texture._image.height = 254;
            //renderable._geometry._isDirty = true;
            /**/

            //since this is intended to create only new renderables there should be no updates here.
            if (currentRenderables[entityTileId.id])
            {
                debugger;
            }

            currentRenderables[entityTileId.id] = renderable;
        }
    }


    function updateRenderableFromViewElement(iViewElement, texturedRenderable)
    {
        switch (renderer.GetType())
        {
            case "2D":
                texturedRenderable.geometryPloygon = iViewElement.computedGeometry;
                break;
            case "3D":
                texturedRenderable.transform = iViewElement.faceTransform;
        }

        if (DebugHelper.debugEnabled)
        {
            texturedRenderable.isClipped = iViewElement.isClipped;
        }
    }

    function issueDownloadRequestsForMissingImagery(dataSourceName)
    {
        var i,
            entities = viewModel.GetDelta(dataSourceName);

        if (entities.removed && entities.removed.length > 0)
        {
            // assumes 1 download per item.
            //cancel any pending downloads for the resources that we might not need.
            var numRemovedEntities = entities.removed.length;
            for (i = 0; i < numRemovedEntities; ++i)
            {
                downloader.cancel(entities.removed[i].viewElementId.id);
            }
        }

        //TODO: added and updated items are currently out of sync so disable for now
        /*
        if (entities.updated) {
            // Update any pending downloads
            var numUpdatedEntities = entities.updated.length;
            for (i = 0; i < numUpdatedEntities; ++i) {
                downloader.updatePriority(entities.updated[i].url, entities.added[i].priority);
            }
        }
        */

        if (entities.added && entities.added.length > 0)
        {
            // Enqueue downloads.
            var numAddedEntities = entities.added.length;
            for (i = 0; i < numAddedEntities; ++i)
            {
                var addedEntity = entities.added[i];
                downloader.downloadImage(addedEntity.url, addedEntity.priority, addedEntity.viewElementId.id);
            }
        }
    }

    function updateTextureRenderablesWithImagery()
    {
        var visibleRenderablesAsArray = viewModel.getVisibleRenderablesAsArray();
        for (var m = 0; m < visibleRenderablesAsArray.length; m++)
        {
            var renderable = visibleRenderablesAsArray[m];
            //support 1 texture for now
            var textureWithPolygon = renderable.texturesWithPolygons[0].texture;
            if (!textureWithPolygon._image)
            {
                textureWithPolygon._image = downloader.AllCompleted.get(renderable.id.id);
                textureWithPolygon._isReady = true;
                textureWithPolygon._isDirty = true;
            }
        }
    }

}
/* @restore(0136) */
/* @restore(0092) */

///#source 1 1 /View/TextureRenderable.js
/**
* @file TextureRenderable.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
*/

/**
* This class serves as a container for the {ISivDataSource} processed entities. Once all {ViewController} world transformations are applied and textures are downloaded
* this would hold the result, that would than be attempted to be rendered by an instance of {Renderer}
*
* @param {array} geometryPloygon      - an array of {screenVertice, texelVertice}/{Vector4} objects depending on the {Renderer} capabilities.
* @param {array} texturesWithPolygons - array of {texture, polygon} objects
* @param {string} id                  - element UUID.
* @param {int}    worldLod            - LOD of the world(datasource) this element originates from. Used when rendering to determine if this is the currentLOD element or something else.
*
* @constructor
*/
function TextureRenderable(geometryPloygon, texturesWithPolygons, id, worldLod)
{
    this.geometryPloygon = geometryPloygon.slice();
    this.texturesWithPolygons = texturesWithPolygons.slice();
    
    this.id = id;
    this.worldLod = worldLod;
}
///#source 1 1 /View/ViewModel.js
/**
* @file ViewModel.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author vihalits
* @date 2012-07-19
*/

/**
* This would serve as a container for the current {IViewElement}s and corresponding {TextureRenderable}s. For the sake of maintainability it is good to keep both
* and have access to them using the same paradigms.
* Effectively this class elemets would compose a scene for any given frame.
*
* @constructor
*/
function ViewModel()
{
    //public properties
    //The @IViewElement elements
    this.currentVisibleElements = {};
    //The @TextureRenderable elements
    this.currentVisibleRenderables = {};

    //public functions
    /**
    * This would retrieve the { added , removed , updated } object for the datasourcel
    *
    * @param {string} datasource  - datasource UUID.
    *
    * @return {object} in a form of { added , removed , updated }
    */
    this.GetDelta = function (dataSource)
    {
        if (!delta[dataSource])
        {
            delta[dataSource] = { added: [], removed: [], updated: [] };
        }
        return delta[dataSource];
    };

    /**
    * sets the delta in a form of { added , removed , updated } for the given datasource
    *
    * @param {string} dataSourceName  - datasource UUID.
    * @param {object} newDelta  -  in a form of { added , removed , updated }
    *
    * @return {void}
    */
    this.SetDelta = function (dataSourceName, newDelta)
    {
        var currentDelta = delta[dataSourceName];
        if (currentDelta && (currentDelta.added.length != 0 || currentDelta.removed.length != 0 || currentDelta.updated.length != 0))
        {
            //should not set the new delta before the previous one has been fully settled.
            debugger;
        }
        delta[dataSourceName] = newDelta;
    };

    /**
    * Syncs 'added' from internal delta, set with {SetDelta()}, into the internal dictionaries. Many times it is useful to defer this process in time.
    * After sync 'added' from delta is cleared.
    *
    * @param {string} dataSourceName  - datasource UUID.
    */
    this.syncAddedFromDeltaCurrentVisibleElements = function (dataSourceName)
    {
        var currentDelta = delta[dataSourceName];

        var itemCollection = currentDelta.added,
            item;

        if (!this.currentVisibleElements[dataSourceName])
        {
            this.currentVisibleElements[dataSourceName] = {};
        }

        for (var i = 0; i < itemCollection.length; i++)
        {
            item = itemCollection[i];
            this.currentVisibleElements[item.viewElementId.id] = item;
            this.currentVisibleElements[dataSourceName][item.viewElementId.id] = item;
        }
        itemCollection.length = 0;

        visibleElementsChanged = visibleRenderablesChanged = true;
    };

    /**
    * Syncs 'updated' from internal delta, set with {SetDelta()}, into the internal dictionaries. Many times it is useful to defer this process in time.
    * After sync 'updated' from delta is cleared.
    *
    * @param {string}   dataSourceName  - datasource UUID.
    * @param {function} updateFunction - function to call when moving element from updated delta to current visible
    */
    this.syncUpdatedFromDeltaCurrentVisibleElements = function (dataSourceName, updateFunction)
    {
        var currentDelta = delta[dataSourceName];

        var itemCollection = currentDelta.updated,
            item;

        //datasource grouped objects should get updated here too, as those are merely object references and we're changing the object, not the reference.
        for (var i = 0; i < itemCollection.length; i++)
        {
            item = itemCollection[i];
            var itemId = item.viewElementId.id;

            var currentVisibleElement = this.currentVisibleElements[itemId];
            if (!currentVisibleElement) debugger; //should not be updating non -exising elements. smth is leaking somewhere.

            //currentVisibleElement.computedGeometry = item.computedGeometry;

            var currentRenderedElement = this.currentVisibleRenderables[itemId];
            if (currentRenderedElement)
            {
                updateFunction(currentVisibleElement, currentRenderedElement);
            }
        }
        itemCollection.length = 0;

        visibleElementsChanged = visibleRenderablesChanged = true;
    };

    //Since start I haven't seen the necessity to have renderables grouped by datasource yet.
    //when this necessity arises this part should be changed to have currentVisibleRenderable in chunks updated too.
    /**
    * Syncs 'removed' from internal delta, set with {SetDelta()}, into the internal dictionaries. Many times it is useful to defer this process in time.
    * After sync 'removed' from delta is cleared.
    */
    this.syncRemovedFromDeltaCurrentVisibleElements = function (dataSourceName)
    {
        var currentDelta = delta[dataSourceName];
        var itemCollection = currentDelta.removed;

        for (var i = 0; i < itemCollection.length; i++)
        {
            var itemId = itemCollection[i].viewElementId.id;

            itemCollection[i] = this.currentVisibleElements[itemId];
            delete this.currentVisibleElements[itemId];
            delete this.currentVisibleElements[dataSourceName][itemId];

            if (this.currentVisibleRenderables[itemId])
            {
                delete this.currentVisibleRenderables[itemId];
            }
        }
        itemCollection.length = 0;

        visibleElementsChanged = visibleRenderablesChanged = true;
    };

    /**
    * @return {array} of cached currentVisibleElements. Array returned will be the same(instance) if currentVisibleElements did not change between calls using sync* functions.
    */
    this.getVisibleElementsAsArray = function ()
    {
        visibleElementsChanged = convertToArrayConditional(this.currentVisibleElements, visibleElementsAsArrayCache, visibleElementsChanged);

        return visibleElementsAsArrayCache;
    };
    
    /**
    * @return {array} of cached currentVisibleRenderables. Array returned will be the same(instance) if currentVisibleRenderables did not change between calls using sync* functions.
    */
    this.getVisibleRenderablesAsArray = function ()
    {
        visibleRenderablesChanged = convertToArrayConditional(this.currentVisibleRenderables, visibleRenderablesAsArrayCache, visibleRenderablesChanged);

        return visibleRenderablesAsArrayCache;
    };
    
    /**
    * @return {array} of concatenated 'removed' arrays from all delta's.
    */
    this.getRemovedRenderablesAsArray = function ()
    {
        var result = [];
        for (dataSourceName in delta)
        {
            var currentDelta = delta[dataSourceName];
            result.concat(currentDelta.removed);

        }

        return result;
    };

    //private stuff
    var delta = {};
    var visibleElementsChanged = true;
    var visibleRenderablesChanged = true;
    var visibleElementsAsArrayCache = [];
    var visibleRenderablesAsArrayCache = [];

    function convertToArrayConditional(srcObject, outArray, doConversion)
    {
        if (doConversion)
        {
            outArray.length = 0;
            for (var visibleItemId in srcObject)
            {
                //here we filter out datasource holder elements and add all the visible renderables, regardless of datasorce
                if (!delta[visibleItemId])
                {
                    outArray.push(srcObject[visibleItemId]);
                }
            }
        }
        
        return false;
    }
}
///#source 1 1 /Graphics/Viewport.js
/**
* Represents a viewport into the 3D scene
* @param {number} width The width of the viewport in pixels
* @param {number} height The height of the viewport in pixels
* @param {number} nearDistance The distance to the near plane
* @param {number} farDistance The distance to the far plane
* @constructor
*/
/* @constructor */function Viewport(width, height, nearDistance, farDistance)
{

    /**
    * @private
    * @type {number}
    */
    this._width = width;

    /**
    * @private
    * @type {number}
    */
    this._height = height;

    /**
    * @private
    * @type {number}
    */
    this._aspectRatio = this._width / this._height;

    /**
    * @private
    * @type {number}
    */
    this._nearDistance = nearDistance;

    /**
    * @private
    * @type {number}
    */
    this._farDistance = farDistance;
}

/**
* Converts a horizontal fov to a vertical fov
* @param {number} aspectRatio The aspect ratio of the viewport
* @param {number} fov The horizontal fov to convert in radians
* @return {number} Vertical fov in radians
*/
Viewport.convertHorizontalToVerticalFieldOfView = function(aspectRatio, fov) {
    var focalLength = 0.5 / Math.tan(fov * 0.5);
    return 2 * Math.atan((0.5 * 1.0 / aspectRatio) / focalLength);
};

/**
* Converts a vertical fov to a horizontal fov
* @param {number} aspectRatio The aspect ratio of the viewport
* @param {number} fov The vertical fov to convert in radians
* @return {number} Horizontal fov in radians
*/
Viewport.convertVerticalToHorizontalFieldOfView = function(aspectRatio, fov) {
    var focalLength = (0.5 * 1.0 / aspectRatio) / Math.tan(fov * 0.5);
    return 2 * Math.atan(0.5 / focalLength);
};

Viewport.prototype = {

    /**
    * Returns the width of the viewport
    * @return {number}
    */
    getWidth: function () {
        return this._width;
    },

    /**
    * Returns the height of the viewport in pixels
    * @return {number}
    */
    getHeight: function () {
        return this._height;
    },

    /**
    * Returns the aspect ratio of the viewport
    * @return {number}
    */
    getAspectRatio: function () {
        return this._aspectRatio;
    },

    /**
    * Returns the near plane distance
    * @return {number}
    */
    getNearDistance: function () {
        return this._nearDistance;
    },

    /**
    * Returns the far plane distance
    * @return {number}
    */
    getFarDistance: function () {
        return this._farDistance;
    }
};

///#source 1 1 /Graphics/PerspectiveCamera.js
/**
* @file PerspectiveCamera.js
* @copyright Copyright (c) Microsoft Corporation.  All rights reserved.
*      
* @author undefined
* @date 2012-07-19
*/

/**
* This is some utility class, which is used by the camera-controlling code to better determine camera changes.
* @constructor 
*/
function PerspectiveCameraPose(viewport, digitalPan, position, up, look, fieldOfView)
{
    this.width = (viewport) ? viewport.getWidth() : 0;
    this.height = (viewport) ? viewport.getHeight() : 0;
    //this.digitalPan = Vector2.clone(digitalPan);
    //this.position = Vector3.clone(position);
    this.up = Vector3.clone(up);
    this.look = Vector3.clone(look);
    this.fieldOfView = fieldOfView;

    var fuzzyEquals = function (v1, v2, tolerance)
    {
        //assumes v1 and v2 are unit vectors
        //assumes tolerance is specified in radians
        var dotProduct = v1.dot(v2);

        if (dotProduct > 1.0)
        {
            dotProduct = 1.0;
        }
        else if (dotProduct < -1.0)
        {
            dotProduct = -1.0;
        }

        var difference = Math.acos(dotProduct);
        return difference < tolerance;
    };

    this.isFuzzyEqualTo = function (pose, toleranceInPixels)
    {
        //viewport width/height are discrete, so use exact equality
        if (this.width !== pose.width || this.height !== pose.height)
        {
            return false;
        }

        //get tolerance equal to the angle one pixel multiplied by the given tolerance
        var tolerance = toleranceInPixels * this.fieldOfView / this.height;

        if (Math.abs(this.fieldOfView - pose.fieldOfView) > tolerance)
        {
            return false;
        }

        if (!fuzzyEquals(this.up, pose.up, tolerance))
        {
            return false;
        }

        if (!fuzzyEquals(this.look, pose.look, tolerance))
        {
            return false;
        }

        //TODO: Compare position and digital pan.  Are they used anywhere?

        return true;
    };
}

/**
* Represents a camera that applies perspective distortion to a scene
*
* @param {Viewport} aViewport       - the viewport to use
* @param {object} aCameraParameters - object holding the verticalFov, position, look, up and side properties.
* 
* @constructor 
*/
function PerspectiveCamera(aViewport, aCameraParameters)
{
    var cameraParams = aCameraParameters || {
        verticalFov: MathHelper.degreesToRadians(80),
        position: new Vector3(-1, -1, 1),
        look: new Vector3(0, 0, -1),
        //Use the following for testing a more general initial view
        //look: (new Vector3(-1, 0, -1)).normalize(),
        up: new Vector3(0, 1, 0),
        side: new Vector3(1, 0, 0)
    };

    //private fields
    var cameraParameters = cameraParams,
    viewport = aViewport,
    digitalPan = new Vector2(0, 0),
    position = cameraParameters.position, //new Vector3(0, 0, 0);
    up = cameraParameters.up, //new Vector3(0, 1, 0);
    look = cameraParameters.look, //new Vector3(0, 0, -1);
    fieldOfView = cameraParameters.verticalFov, //Math.PI / 2;
    focalLength = -1,
    viewTransform = Matrix4X4.createIdentity(),
    projectionTransform = Matrix4X4.createIdentity(),
    viewProjectionTransform = Matrix4X4.createIdentity(),
    isDirty = true;
    
    //private methods
    
    /**
    * When called updates the view and projection transforms based on the current state of the system
    *
    * @ignore
    */
    function updateTransforms()
    {
        var denom = Math.tan(0.5 * fieldOfView);
        if (denom === 0.0)
        {
            focalLength = 1.0;
        }
        else
        {
            focalLength = 1.0 / denom;
        }

        GraphicsHelper.createLookAtRHOut(position, look, up, viewTransform);
        GraphicsHelper.createPerspectiveOGLOut(fieldOfView,
                                               viewport.getAspectRatio(),
                                               viewport.getNearDistance(),
                                               viewport.getFarDistance(),
                                               projectionTransform);
        projectionTransform.multiplyOut(viewTransform, viewProjectionTransform);
            
        isDirty = false;
    };
    
    //public API

    this.getCameraParameters = function()
    {
        return cameraParameters;
    };

    this.getPose = function()
    {
        return new PerspectiveCameraPose(viewport, digitalPan, position, up, look, fieldOfView);
    };

    /**
    * Sets the viewport on the camera
    *
    * @param {Viewport} viewport
    *
    * @return {void}
    */
    this.setViewport = function(newViewport)
    {
        viewport = newViewport;
        isDirty = true;
    };
    
    /**
    * Returns the viewport associated with the camera
    *
    * @return {Viewport}
    */
    this.getViewport = function()
    {
        return viewport;
    };
    
    /**
    * Sets the position of the camera
    *
    * @param {Vector3} aPosition
    */
    this.setPosition = function(aPosition)
    {
        position = aPosition;
        isDirty = true;
    };
    
    /**
    * Returns the position of the camera
    * @return {Vector3}
    */
    this.getPosition = function()
    {
        return position;
    };
    
    /**
    * Sets the vertical field of view of the camera
    *
    * @param {number} fieldOfView Angle in radians
    */
    this.setVerticalFov = function(aFieldOfView)
    {
        fieldOfView = aFieldOfView;
        isDirty = true;
    };
    
    /**
    * Returns the vertical field of view of the camera
    *
    * @return {number}
    */
    this.getVerticalFov = function()
    {
        return fieldOfView;
    };
    
    /**
    * Returns the focal length of the camera
    *
    * @return {number}
    */
    this.getFocalLength = function()
    {
        if (isDirty)
        {
            updateTransforms();
        }
        return focalLength;
    };
    
    /**
    * Sets the look direction of the camera
    *
    * @param {Vector3} aLook A unit look vector
    */
    this.setLook = function(aLook)
    {
        look = aLook;
        isDirty = true;
    };
    
    /**
    * Returns the current look vector of the camera
    *
    * @return {Vector3}
    */
    this.getLook = function()
    {
        return look;
    };
    
    /**
    * Sets the up direction of the camera
    *
    * @param {Vector3} aUp A unit up vector
    */
    this.setUp = function(aUp)
    {
        up = aUp;
        isDirty = true;
    };

    /**
    * Returns the current up vector of the camera
    *
    * @return {Vector3}
    */
    this.getUp = function()
    {
        return up;
    };
    
    /**
    * Sets the current digital pan on the camera
    *
    * @param {Vector2} pan The digital pan.  Values are in viewport space, meaning
    * a value of 0.5 for the width or height will shift the entire contents of the viewport
    * by half of the dimension of the viewport
    */
    this.setDigitalPan = function(pan)
    {
        digitalPan = pan;
        isDirty = true;
    };

    /**
    * Returns the current digital pan
    *
    * @return {Vector2}
    */
    this.getDigitalPan = function()
    {
        return digitalPan;
    };

    /**
    * Returns the current view transform
    *
    * @return {Matrix4X4}
    */
    this.getViewTransform = function ()
    {
        if (isDirty)
        {
            updateTransforms();
        }
        return viewTransform;
    };
    
    /**
    * Returns the current projection transform
    *
    * @return {Matrix4X4}
    */
    this.getProjectionTransform = function()
    {
        if (isDirty)
        {
            updateTransforms();
        }
        return projectionTransform;
    };

    /**
    * Returns the view projection transform.
    *
    * @return {Matrix4X4}
    */
    this.getViewProjectionTransform = function()
    {
        if (isDirty)
        {
            updateTransforms();
        }
        return viewProjectionTransform;
    };
    
    /**
    * Projects a 3D point to 2D. Notes points behind the camera will get back projected,
    * up to the caller to make sure the points passed to this function are infront of the camera
    *
    * @param {Vector3} point A point in 3D
    *
    * @return {Vector4} The z component gives the depth of the point.
    */
    this.projectTo2D = function(point)
    {

        if (isDirty)
        {
            updateTransforms();
        }

        //TODO: Cache all this

        var halfWidth = viewport.getWidth() * 0.5;
        var halfHeight = viewport.getHeight() * 0.5;
        var projected = viewProjectionTransform.transformVector4(Vector4.createFromVector3(point));
        projected.x /= projected.w;
        projected.y /= projected.w;
        projected.z = projected.w = 1;
        return (new Matrix4X4(halfWidth, 0, halfWidth, 0,
            0, -halfHeight, halfHeight, 0,
            0, 0, 1, 0,
            0, 0, 0, 1)).transformVector4(projected);
    };
}

///#source 1 1 /Common/ClassicSpring.js
/**
* Provides an exponential spring for animations
* @constructor
* @param {number} springConstant
* @param {number} damperConstant
* @param {boolean} allowOvershoot
*/
/* @disable(0092) */
/* @constructor */function ClassicSpring(springConstant, damperConstant, allowOvershoot)
{
    /**
    * @private
    * @type {number}
    */
    this._startTime = -1;

    /**
    * @private
    * @type {number}
    */
    this._initialValue = -1;

    /**
    * @private
    * @type {number}
    */
    this._timeInMillis = -1;

    /**
    * @private
    * @type {number}
    */
    this._springConstant = springConstant;

    /**
    * @private
    * @type {number}
    */
    this._damperConstant = damperConstant;

    /**
    * @private
    * @type {boolean}
    */
    this._allowOvershoot = allowOvershoot;

    /**
    * @private
    * @type {number}
    */
    this._current = 0;

    /**
    * @private
    * @type {number}
    */
    this._target = 0;

    /**
    * @private
    * @type {number}
    */
    this._velocity = 0;

    /**
    * @private
    * @type {number}
    */
    this._t = -1;

    /**
    * @private
    * @type {boolean}
    */
    this._isSettled = false;
}

ClassicSpring.prototype = {

    /**
    * When called updates the springs current value based on the current app time
    * @param {number} elapsedMilliseconds
    * @return {boolean} If the spring has settled true is returned, false otherwise
    */
    step: function (elapsedMilliseconds)
    {

        if (this._isSettled)
        {
            return true;
        }

        if (this._startTime == -1)
        {
            this._startTime = elapsedMilliseconds;
        }

        var self = this,
            delta = 0.0,
            curTargDiff,
            isSettled,
            dt,
            maxDelta,
            epsilon;

        if (this._t >= 0)
        {
            dt = elapsedMilliseconds - this._t;

            if (dt > 0)
            {
                curTargDiff = this._current - this._target;
                this._velocity += -this._springConstant * curTargDiff - this._damperConstant * this._velocity;
                delta = this._velocity * dt;

                // When the frame rate drops dramatically, dt can get crazy huge. This causes
                // the spring to fluctuate crazily. So if the delta is more than 100ms then
                // we just turn off overshoot so we don't get all the dramatic crazy fluctuations.
                if (!this._allowOvershoot || dt > 100)
                {
                    maxDelta = -curTargDiff;
                    if (Math.abs(maxDelta) < Math.abs(delta))
                    {
                        delta = maxDelta;
                        this._velocity = 0.0;
                    }
                }
                
                if (isTimedSpring())
                {
                    var timeProportion = (elapsedMilliseconds - this._startTime + 1) / this._timeInMillis;
                    this._current = this._initialValue + ((this._target - this._initialValue) * timeProportion);
                }
                else
                {
                    this._current += delta;
                }
            }
        }

        curTargDiff = this._current - this._target;
        epsilon = 0.0000001;

        isSettled = isTimedSpringElapsed() || isCurrentTargetBasicallyEqual();
        if (isSettled)
        {
            this.setCurrentToTarget();
        }
        else
        {
            this._t = elapsedMilliseconds;
        }

        this._isSettled = isSettled;
        return isSettled;

        function isTimedSpring()
        {
            /* @disable(0146) */
            return self._timeInMillis && self._timeInMillis != -1;
            /* @restore(0146) */
        }

        function isTimedSpringElapsed()
        {
            return isTimedSpring() &&
                   elapsedMilliseconds != self._startTime &&
                   elapsedMilliseconds - self._startTime > self._timeInMillis;
        }

        function isCurrentTargetBasicallyEqual()
        {
            return (curTargDiff < epsilon && curTargDiff > -epsilon) &&
                   (delta < epsilon && delta > -epsilon);
        }
    },

    /**
    * Returns true if the spring has completely settled
    * @return {boolean}
    */
    isSettled: function ()
    {
        return this._isSettled;
    },

    /**
    * Set a new target value
    * @param {number} target The new target
    * @param {number} timeInMillis The time in milliseconds desired to hit the new target
    */
    setTarget: function (target, timeInMillis)
    {
        if (this.target == target)
        {
            return;
        }

        this._target = target;

        this._timeInMillis = timeInMillis;
        if (timeInMillis)
        {
            this._startTime = -1;
            this._initialValue = this._current;
        }

        this._isSettled = false;
    },

    /**
    * Sets a new current value
    * @param {number} current
    */
    setCurrent: function (current)
    {
        this._current = current;
        this._isSettled = false;
    },

    /**
    * Sets the current value and also sets the target to the new current value
    * @param {number} target
    */
    setCurrentAndTarget: function (target)
    {
        this._target = target;
        this.setCurrentToTarget();
    },

    /**
    * Sets the current value to the target value immediately
    */
    setCurrentToTarget: function ()
    {
        this._current = this._target;
        this._velocity = 0.0;
        this._isSettled = true;
        this._t = -1;
        this._initialValue = -1;
        this._timeInMillis = -1;
    },

    /**
    * Returns the current target value
    * @return {number} the current target value
    */
    getTarget: function ()
    {
        return this._target;
    },

    /**
    * Returns the current value
    * @return {number} The current value
    */
    getCurrent: function ()
    {
        return this._current;
    }
};
/* @restore(0092) */

///#source 1 1 /Common/MultiSpring.js
/**
* Provides an exponential spring for animations of multiple dimensions.
* @constructor
* @param {number} springConstant
* @param {number} damperConstant
* @param {boolean} allowOvershoot
*/
/* @disable(0092) */
/* @constructor */function MultiSpring(springConstant, damperConstant, allowOvershoot)
{
    /**
    * @private
    * @type {ClassicSpring}
    */
    this._internalSpring = new ClassicSpring(springConstant, damperConstant, allowOvershoot);
    
    /**
    * @private
    * @type {array}
    */
    this._internalSpringCurrentValue = 0.0;

    /**
    * @private
    * @type {array}
    */
    this._internalSpringTargetValue = 1.0;

    /**
    * @private
    * @type {array}
    */
    this._current = [];

    /**
    * @private
    * @type {array}
    */
    this._initial = [];
    
    /**
    * @private
    * @type {array}
    */
    this._target = [];
}

MultiSpring.prototype = {

    /**
    * When called updates the springs current value based on the current app time
    * @param {number} elapsedMilliseconds
    * @return {boolean} If the spring has settled true is returned, false otherwise
    */
    step: function (elapsedMilliseconds)
    {
        if (this._internalSpring._isSettled)
        {
            return true;
        }

        var isSettled = this._internalSpring.step(elapsedMilliseconds);

        for (var i = 0, numValues = this._current.length; i < numValues; i++)
        {
            if (isSettled)
            {
                this._current[i] = this._target[i];
            }
            else
            {
                var target = this._target[i];
                var initial = this._initial[i];
                var diff = (target - initial) * this._internalSpring.getCurrent();
                this._current[i] = initial + diff;
            }
        }

        return isSettled;
    },

    /**
    * Returns true if the spring has completely settled
    * @return {boolean}
    */
    isSettled: function ()
    {
        return this._internalSpring._isSettled;
    },

    /**
    * Sets new target values
    * @param {number} targetArray The new targets
    */
    setTarget: function (targetArray)
    {
        var targetValuesAreTheSame = true;

        var numTargetValues = targetArray.length;
        if (numTargetValues == this._target.length)
        {
            for (var i = 0; i < numTargetValues; i++)
            {
                if (this._target[i] != targetArray[i])
                {
                    targetValuesAreTheSame = false;
                }
            }
        }
        else
        {
            targetValuesAreTheSame = false;
        }

        if (targetValuesAreTheSame)
        {
            return;
        }

        this._internalSpring.setTarget(this._internalSpringTargetValue, null);
        this._target = targetArray;
        this._internalSpring._isSettled = false;
    },

    /**
    * Sets a new current value
    * @param {array} current
    */
    setCurrent: function (current)
    {
        this._internalSpring.setCurrent(this._internalSpringCurrentValue);
        this._current = current;

        // Keep track of the initial values.
        this._initial = [];
        for (var i = 0; i < current.length; i++)
        {
            this._initial.push(current[i]);
        }

        this._internalSpring._isSettled = false;
    },

    /**
    * Sets the current value and also sets the target to the new current value
    * @param {number} target
    */
    setCurrentAndTarget: function (target)
    {
        this._internalSpring.setCurrentAndTarget(this._internalSpringTargetValue);
        this._target = target;
        this.setCurrentToTarget();
    },

    /**
    * Sets the current values to the target values immediately
    */
    setCurrentToTarget: function ()
    {
        for (var i = 0, numValues = this._current.length; i < numValues; i++)
        {
            this._current[i] = this._target[i];
        }
    },

    /**
    * Returns the current target value
    * @return {array} the current target values
    */
    getTarget: function ()
    {
        return this._target;
    },

    /**
    * Returns the current value
    * @return {array} The current values
    */
    getCurrent: function ()
    {
        return this._current;
    }
};
/* @restore(0092) */

///#source 1 1 /Input/GestureHelper.js
//The intent of this class is to encapsulate various forms of touch and mouse input supported by 
//different browsers and then fire a consistent set of events that can be used to control a camera.
/* @disable(0092) */
/* @disable(0136) */
function GestureHelper(element, options) {
    var elem = element;
    var gestureStartCallback = options.gestureStart || function () {};
    var gestureChangeCallback = options.gestureChange || function () {};
    var gestureEndCallback = options.gestureEnd || function () {};
    var discreteZoomCallback = options.discreteZoom || function () {};
    var keyDownCallback = options.keyDown || function () {};
    var keyUpCallback = options.keyUp || function () {};
    var enabled = false;
    var msGesture;

    function onGestureStart(e) {
        e.type = 'gestureStart';
        gestureStartCallback(e);
    }

    function onGestureChange(e) {
        e.type = 'gestureChange';
        gestureChangeCallback(e);
    }

    function onGestureEnd(e) {
        e.type = 'gestureEnd';
        gestureEndCallback(e);

        keyboardFocusElement.focus();
    }

    function onDiscreteZoom(e) {
        e.type = 'discreteZoom';
        discreteZoomCallback(e);
    }

    function onKeyDown(e) {
        keyDownCallback(e);
    }

    function onKeyUp(e) {
        keyUpCallback(e);
    }

    var msGestureGoing = false;
    var msPointerCount = 0;
    
    function msPointerDown(e) {
        //for IE10, we have to tell the gesture engine which pointers to use (all of them for our uses).
        elem.msSetPointerCapture(e.pointerId);
        msGesture.addPointer(e.pointerId);

        msPointerCount++;

        if (msPointerCount == 1) {
            
            onGestureStart({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY
            });

            totalTranslationX = 0;
            totalTranslationY = 0;
            totalScale = 1;
        }
    }

    function msPointerUp(e) {
        msPointerCount--;

        if (!msGestureGoing && msPointerCount == 0) {
            
            onGestureEnd({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: totalTranslationX,
                translationY: totalTranslationY,
                scale: totalScale
            });
        }
    }

    var reverseTranslationX;
    var totalTranslationX;
    var totalTranslationY;
    var totalScale;

    function msGestureStart(e) {
        msGestureGoing = true;
    }

    function msGestureChange(e) {
        if (msGestureGoing) {
            if (reverseTranslationX) {
                totalTranslationX -= e.translationX;
            }
            else {
                totalTranslationX += e.translationX;
            }
            totalTranslationY += e.translationY;
            totalScale *= e.scale;

            if (e.detail & e.MSGESTURE_FLAG_INERTIA) {
                //inertia phase

                onGestureEnd({
                    clientX: e.clientX,
                    clientY: e.clientY,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    translationX: totalTranslationX,
                    translationY: totalTranslationY,
                    scale: totalScale
                });

                msGestureGoing = false;
            }
            else {
                onGestureChange({
                    clientX: e.clientX,
                    clientY: e.clientY,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    translationX: totalTranslationX,
                    translationY: totalTranslationY,
                    scale: totalScale
                });
            }
        }
    }

    function msGestureEnd(e) {
        if (msGestureGoing) {
            onGestureEnd({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: totalTranslationX,
                translationY: totalTranslationY,
                scale: totalScale
            });
        }
    }

    var mouseDownPos = null;

    function mouseDown(e) {
        onGestureStart({
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY
        });

        mouseDownPos = { x: e.clientX, y: e.clientY };

        e.preventDefault();
    }

    function mouseMove(e) {
        if (mouseDownPos != null) {
            onGestureChange({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: e.clientX - mouseDownPos.x,
                translationY: e.clientY - mouseDownPos.y,
                scale: 1
            });

            e.preventDefault();
        }
    }

    function mouseUp(e) {
        if (mouseDownPos != null) {
            onGestureEnd({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: e.clientX - mouseDownPos.x,
                translationY: e.clientY - mouseDownPos.y,
                scale: 1
            });

            mouseDownPos = null;

            e.preventDefault();
        }
    }

    function mouseWheel(e) {
        //Get the wheel data in a browser-agnostic way.
        //See http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        var wheelDelta =  e.detail ? e.detail * -1 : e.wheelDelta / 40;
        
        var direction;
        if (wheelDelta > 0)
        {
            direction = 1;
        }
        else if (wheelDelta < 0)
        {
            direction = -1;
        }

        onDiscreteZoom({
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            direction: direction,
            wheelDelta: wheelDelta,
            mouseInteractionType: 'mousewheel'
        });

        e.preventDefault();
    }

    function doubleClick(e)
    {
        // We're using offsetX and offsetY here to deal with having multiple SIV instances on 
        // the same page.
        onDiscreteZoom({
            clientX: e.offsetX,
            clientY: e.offsetY,
            screenX: e.screenX,
            screenY: e.screenY,
            direction: 1
        });

        e.preventDefault();
    }

    //Webkit
    function gestureStart(e) {
    }

    function gestureChange(e) {
    }

    function gestureEnd(e) {
    }

    var attachHandlers;
    var detachHandlers;

    if (window.navigator.msPointerEnabled && window.MSGesture !== undefined) {
    //IE10+.  Mouse, touch, and pen events all fire as MSPointer and MSGesture
        attachHandlers = function ()
        {
            /* @disable(0058) */
            msGesture = new MSGesture();
            /* @restore(0058) */

            msGesture.target = elem;
            
            //In right-to-left context, the translationX values are backwards, so we have to reverse them.
            reverseTranslationX = (elem.parentNode.currentStyle['direction'] == 'rtl');

            elem.addEventListener("MSPointerDown", msPointerDown, false);
            elem.addEventListener("MSPointerUp", msPointerUp, false);
            elem.addEventListener('MSGestureStart', msGestureStart, true);
            elem.addEventListener('MSGestureChange', msGestureChange, true);
            elem.addEventListener('MSGestureEnd', msGestureEnd, true);
            elem.addEventListener('dblclick', doubleClick, false);
            elem.addEventListener('mousewheel', mouseWheel, false);
        };

        detachHandlers = function () {
            elem.removeEventListener("MSPointerDown", msPointerDown, false);
            elem.removeEventListener("MSPointerUp", msPointerUp, false);
            elem.removeEventListener('MSGestureStart', msGestureStart, true);
            elem.removeEventListener('MSGestureChange', msGestureChange, true);
            elem.removeEventListener('MSGestureEnd', msGestureEnd, true);
            elem.removeEventListener('dblclick', doubleClick, false);
            elem.removeEventListener('mousewheel', mouseWheel, false);

            msGesture = null;
        };
        
    }
    //else if (window.ontouchstart) {
    //    //Webkit.  Fires touch, gesture, and mouse events.  Touch events turn into mouse events unless they're stopped

    //    //TODO: not yet implemented
    //}
    else {
        //Browser doesn't support touch.  Only need to add support for mouse.
        attachHandlers = function () {
            elem.addEventListener('mousedown', mouseDown, false);
            elem.addEventListener('mousemove', mouseMove, false);
            elem.addEventListener('mouseup', mouseUp, false);
            elem.addEventListener('mousewheel', mouseWheel, false);
            elem.addEventListener('DOMMouseScroll', mouseWheel, false);
            elem.addEventListener('dblclick', doubleClick, false);
            document.addEventListener('mousemove', mouseMove, false);
            document.addEventListener('mouseup', mouseUp, false);
        };

        detachHandlers = function () {
            elem.removeEventListener('mousedown', mouseDown, false);
            elem.removeEventListener('mousemove', mouseMove, false);
            elem.removeEventListener('mouseup', mouseUp, false);
            elem.removeEventListener('mousewheel', mouseWheel, false);
            elem.removeEventListener('DOMMouseScroll', mouseWheel, false);
            elem.removeEventListener('dblclick', doubleClick, false);
            document.removeEventListener('mousemove', mouseMove, false);
            document.removeEventListener('mouseup', mouseUp, false);
        };
    }

    var keyboardFocusElement = document.createElement('input');
    keyboardFocusElement.readOnly = true;
    Utils.css(keyboardFocusElement, { width: '0px', height: '0px', opacity: 0 });

    var attachKeyboardHandlers = function () {
        elem.appendChild(keyboardFocusElement);

        keyboardFocusElement.addEventListener('keydown', onKeyDown, false);
        keyboardFocusElement.addEventListener('keyup', onKeyUp, false);
        keyboardFocusElement.focus();
    };

    var detachKeyboardHandlers = function () {
        keyboardFocusElement.removeEventListener('keydown', onKeyDown, false);
        keyboardFocusElement.removeEventListener('keyup', onKeyUp, false);

        if (keyboardFocusElement.parentNode) {
            keyboardFocusElement.parentNode.removeChild(keyboardFocusElement);
        }
    };

    //public interface
    this.enable = function () {
        attachHandlers();
        attachKeyboardHandlers();
        enabled = true;
    };

    this.disable = function () {
        detachHandlers();
        detachKeyboardHandlers();
        enabled = false;
    };

    this.isEnabled = function () {
        return enabled;
    };

    this.userCurrentlyInteracting = function () {
        //Intentionally exclude keyboard and mouse input.  Only care about touch input here.
        return msPointerCount > 0;
    };
}
/* @restore(0136) */
/* @restore(0092) */

///#source 1 1 /Input/QueuedGestureHelper.js
//The intent of this class is to encapsulate various forms of touch and mouse input supported by 
//different browsers and then fire a consistent set of events that can be used to control a camera.
/* @disable(0092) */
function QueuedGestureHelper(elem, userInteractingCallback) {
    var eventQueue = [];

    function eventHandler(e) {
        eventQueue.push(e);
        userInteractingCallback();
    }

    var gestureHelper = new GestureHelper(elem, {
        gestureStart: eventHandler,
        gestureChange: eventHandler,
        gestureEnd: eventHandler,
        discreteZoom: eventHandler,
        keyDown: eventHandler,
        keyUp: eventHandler
    });

    this.enable = function () {
        gestureHelper.enable();
    };

    this.disable = function () {
        gestureHelper.disable();
    };

    this.isEnabled = function () {
        return gestureHelper.isEnabled();
    };

    this.getQueuedEvents = function () {
        var temp = eventQueue;
        eventQueue = [];
        return temp;
    };

    this.userCurrentlyInteracting = function () {
        return gestureHelper.userCurrentlyInteracting();
    };
}
/* @restore(0092) */

///#source 1 1 /DataSource/InteractionControllers/InteractionController.js
/**
 * Base class for all interaction controllers. Interaction controllers convert user
 * interaction into appropriate camera actions. ICs use pitch, heading and fov springs 
 * to give smooth panning and zooming effects. In addition, the zoomToPoint spring controls
 * pitch, heading and fov with one spring to allow for smooth panning and zooming to a point.
 *
 * @param PerspectiveCamera The camera that the interaction controller will control.
 * @param object Any specific params such as initial up, side and look vectors. Can be null.
 * @param double Upper pitch limit for limiting the max pitch the camera can be set to. 
 *               Can be null. Defaults to 90 degrees.
 * @param double Lower pitch limit for limiting the max pitch the camera can be set to. 
 *               Can be null. Defaults to -90 degrees.
 */
/* @disable(0092) */
/* @disable(0055) */
/* @disable(0146) */
/* @constructor */function InteractionController(camera, cameraParameters, upperPitchLimit, lowerPitchLimit, minFOV)
{
    this._camera = camera;
    this._upperPitchLimit = upperPitchLimit || MathHelper.degreesToRadians(90);
    this._lowerPitchLimit = lowerPitchLimit || MathHelper.degreesToRadians(-90);

    this._upperHeadingLimit = null;
    this._lowerHeadingLimit = null;

    this._currentView = { pitch: 0, heading: 0, verticalFov: 0 };
    this._viewChanging = false;

    // The numbers used to instantiate these springs affect the "feel" of the inertia.
    this._pitchSpring = new ClassicSpring(0.01, 1, true);
    this._headingSpring = new ClassicSpring(0.01, 1, true);
    this._fieldOfViewSpring = new ClassicSpring(0.0033, 1, true);
    this._zoomToPointSpring = new MultiSpring(0.01, 1, false);
    this._zoomingToPoint = false;
    this._wheelZoomFudgeFactor = 0.1;

    this._pitchSpring.setCurrentAndTarget(0);
    this._headingSpring.setCurrentAndTarget(0);
    this._fieldOfViewSpring.setCurrentAndTarget(this._camera.getVerticalFov());

    if (minFOV)
    {
        // We always want the user to be able to zoom in a little even if the initial view
        // happens to be the max LOD. So we'll always give them at least a vertical FOV range 
        // between 80 and 40 degrees.
        var fortyDegreesInRadians = MathHelper.degreesToRadians(40);
        this._minFieldOfView = minFOV < fortyDegreesInRadians ? minFOV : fortyDegreesInRadians;

        // Right now we can't handle showing more detail than a vertical FOV of 5 degrees shows
        // so put a hard limit there.
        var absoluteMinimumFovForNow = MathHelper.degreesToRadians(5);
        this._minFieldOfView = this._minFieldOfView > absoluteMinimumFovForNow ? this._minFieldOfView : absoluteMinimumFovForNow;
    }
    else
    {
        this._minFieldOfView = MathHelper.degreesToRadians(20);
    }

    this._maxFieldOfView = MathHelper.degreesToRadians(80);

    this._worldUp = (cameraParameters && cameraParameters.up) ? cameraParameters.up : new Vector3(0, 1, 0);
    this._worldLook = (cameraParameters && cameraParameters.look) ? cameraParameters.look : new Vector3(0, 0, -1);
    this._worldSide = (cameraParameters && cameraParameters.side) ? cameraParameters.side : new Vector3(1, 0, 0);

    this._look = new Vector3(0, 0, 0);
    this._side = new Vector3(0, 0, 0);
    this._up = new Vector3(0, 0, 0);

    // These temporary Quaternions are in place so that on every update frame we no longer
    // have to instantiate these 3 quaternions and then have them garbage collected. Instead
    // these objects will just get re-used. This currently saves 9 object instantiations
    // on every frame as the method that uses these quaternions is called 3 times per frame.
    this._tempQuaternion = new Quaternion(0, 0, 0, 0);
    this._tempPitchRotationQuaternion = new Quaternion(0, 0, 0, 0);
    this._tempHeadingRotationQuaternion = new Quaternion(0, 0, 0, 0);

    this._lastGestureScale = null;
    this._startingPosition = null;

    this._discreteZoomFactor = 0.7;

    this._scrollSpeedX = 0;
    this._scrollSpeedY = 0;
    this._scrollAccX = 0;
    this._scrollAccY = 0;
    this._motionHandle = 0;
    this._scrollSpeedDamper = 0.9;
    this._scrollSpeedAdjustmentFactor = 200;

    // Public Events
    this.viewChangeEvent = new Event();
    this.viewChangeEndEvent = new Event();
}

InteractionController.prototype = {

    // PUBLIC METHODS

    /**
     * Returns the pitch and heading with the heading normalized to fall 
     * between 0 and 2PI.
     *
     * @return array
     */
    calculatePitchAndHeading: function ()
    {
        //Bubble has a right handed coord system
        //look = 0,0,-1
        //up = 0,1,0
        //right = 1,0,0
        //so a currentLook of 0,0,-1 will give a heading of 0 radians

        var pitch = this.getPitch();
        var heading = this.getHeading();

        //Make heading always fall between 0 and 2PI
        if (heading < 0)
        {
            heading += MathHelper.twoPI;
        }

        return { pitch: pitch, heading: heading };
    },

    /** 
     * Set new view target according to the specified pitch, heading and fov.
     * Use null if you don't want to set a specific property.
     * Invoke the targetViewChangeCallback() if any one property is updated.
     */
    setViewTarget: function (pitch, heading, verticalFov, animate, time)
    {
        this._zoomingToPoint = false;
        var targetUpdated = false;

        if (pitch !== null || heading != null)
        {
            pitch = pitch != 0 ? pitch || this.getPitch() : pitch;
            heading = heading != 0 ? heading || this.getHeading() : heading;

            this.setPitchAndHeading(pitch, heading, animate, time);
            targetUpdated = true;
        }

        if (verticalFov !== null)
        {
            this.setVerticalFov(verticalFov, animate, time);
            targetUpdated = true;
        }

        if (targetUpdated && this.targetViewChangeCallback)
        {
            /* @disable(0131) */
            this.targetViewChangeCallback();
            /* @restore(0131) */
        }
    },

    /**
     * Gets the current pitch, heading and verticalFov in one call.
     *
     * @return object
     */
    getView: function ()
    {
        this._currentView.pitch = this.getPitch();
        this._currentView.heading = this.getHeading();
        this._currentView.verticalFov = this.getVerticalFov();
        return this._currentView;
    },

    /**
     * Gets the current pitch.
     *
     * @return double
     */
    getPitch: function ()
    {
        return this._pitchSpring.getCurrent();
    },

    /**
     * Gets the current heading.
     *
     * @return double
     */
    getHeading: function ()
    {
        return this._headingSpring.getCurrent();
    },

    /**
     * Gets the current vertical field of view.
     *
     * @return double
     */
    getVerticalFov: function ()
    {
        return this._fieldOfViewSpring.getCurrent();
    },

    /**
     * Gets the minimum vertical field of view.
     *
     * @return double
     */
    getMinVerticalFov: function ()
    {
        return this._minFieldOfView;
    },

    /**
     * Gets the maximum vertical field of view.
     *
     * @return double
     */
    getMaxVerticalFov: function ()
    {
        return this._maxFieldOfView;
    },

    /**
     * Gets the minimum and maximum heading, pitch and vertical field of view.
     *
     * @return object
     */
    getBounds: function ()
    {
        return {
            left: this._lowerHeadingLimit,
            right: this._upperHeadingLimit,
            bottom: this._lowerPitchLimit,
            top: this._upperPitchLimit,
            minFov: this._minFieldOfView,
            maxFov: this._maxFieldOfView
        };
    },

    /**
     * Zooms out using the centerpoint of the screen.
     */
    zoomIn: function (animate)
    {
        this.setViewTarget(null, null, Math.max(this._minFieldOfView, this._camera.getVerticalFov() * this._discreteZoomFactor), animate, null);
    },

    /**
     * Zooms out using the centerpoint of the screen.
     */
    zoomOut: function (animate)
    {
        this.setViewTarget(null, null, Math.min(this._maxFieldOfView, this._camera.getVerticalFov() / this._discreteZoomFactor), animate, null);
    },

    // "PROTECTED" METHODS

    /**
     * Sets the pitch and heading. Generally callers should call setViewTarget
     * as doing so will fire the targetViewChangeCallback().
     *
     * @param double pitch
     * @param double heading
     * @param bool animate
     */
    setPitchAndHeading: function (pitch, heading, animate, time)
    {
        this._zoomingToPoint = false;

        pitch = this.constrainPitch(pitch);
        heading = this.constrainHeading(heading);

        if (animate)
        {
            this._pitchSpring.setTarget(pitch, time);

            var currentHeading = this._headingSpring.getCurrent();
            currentHeading = MathHelper.pickStartHeadingToTakeShortestPath(currentHeading, heading);

            this._headingSpring.setCurrent(currentHeading);
            this._headingSpring.setTarget(heading, time);
        }
        else
        {
            this._pitchSpring.setCurrentAndTarget(pitch);
            this._headingSpring.setCurrentAndTarget(heading);
            this.updateCameraProperties();
        }
    },

    /**
     * Sets the vertical field of view. Generally callers should call setViewTarget
     * as doing so will fire the targetViewChangeCallback().
     *
     * @param double fov
     * @param bool animate
     */
    setVerticalFov: function (fov, animate, time)
    {
        this._zoomingToPoint = false;

        var targetFov = MathHelper.clamp(fov, this._minFieldOfView, this._maxFieldOfView);

        if (animate)
        {
            this._fieldOfViewSpring.setTarget(targetFov, time);
        }
        else
        {
            this._fieldOfViewSpring.setCurrentAndTarget(targetFov);
        }
        this.updateCameraProperties();
    },

    tryPitchHeadingToPixel: function (pitch, heading)
    {
        //rotate vector to point at the correct pitch/heading
        var look = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldLook, this._worldUp, this._worldSide, null);

        //check to make sure it's in front of the view and not behind
        if (this._camera.getLook().dot(look) <= 0)
        {
            return null;
        }

        //now project into 2d viewport space
        var projectedPoint = this._camera.projectTo2D(look);

        //don't want to return a depth because it'll always be 1, so create a vector2 to return
        return new Vector2(projectedPoint.x, projectedPoint.y);
    },

    tryPixelToPitchHeading: function (pixel)
    {
        var viewport = this._camera.getViewport();
        var focalLength = this._camera.getFocalLength();

        var halfWidth = viewport.getWidth() / 2;
        var halfHeight = viewport.getHeight() / 2;
        var adjustedFocalLength = focalLength * halfHeight;

        var x = pixel.x - halfWidth;
        var y = pixel.y - halfHeight;

        var pitchDelta = -Math.atan2(y, adjustedFocalLength);
        var headingDelta = Math.atan2(x, adjustedFocalLength);

        //Calculate look by adding pitch and heading from current look/up/side
        var look = this.calculateLookFromPitchAndHeading(pitchDelta, headingDelta, this._look, this._up, this._side, true);

        upComponent = look.dot(this._worldUp);
        sideComponent = look.dot(this._worldSide);
        forwardComponent = look.dot(this._worldLook);

        //Now determine the pitch/heading off from the world look
        var pitch = Math.atan2(upComponent, Math.max(0, Math.sqrt(1 - upComponent * upComponent)));
        var heading = MathHelper.normalizeRadian(Math.atan2(sideComponent, forwardComponent));

        if (isNaN(pitch) || isNaN(heading))
        {
            return null;
        }

        return { pitch: pitch, heading: heading };
    },

    calculateLookFromPitchAndHeading: function (pitch, heading, worldLook, worldUp, worldSide, applyHeadingBeforePitch)
    {
        //Need to negate heading because the quaternion rotates using the right hand rule
        //and we want positive heading to rotate to the right.
        Quaternion.fromAxisAngleOut(worldSide, pitch, this._tempPitchRotationQuaternion);
        Quaternion.fromAxisAngleOut(worldUp, -heading, this._tempHeadingRotationQuaternion);

        if (applyHeadingBeforePitch)
        {
            this._tempPitchRotationQuaternion.multiplyOut(this._tempHeadingRotationQuaternion, this._tempQuaternion);
        }
        else
        {
            this._tempHeadingRotationQuaternion.multiplyOut(this._tempPitchRotationQuaternion, this._tempQuaternion);
        }

        return this._tempQuaternion.transform(worldLook);
    },

    constrainPitch: function (pitch)
    {
        return MathHelper.clamp(pitch, this._lowerPitchLimit, this._upperPitchLimit);
    },

    constrainHeading: function (heading)
    {
        if (!this._upperHeadingLimit)
        {
            return heading;
        }

        //Make heading always fall between 0 and 2PI
        if (heading < 0)
        {
            heading += MathHelper.twoPI;
        }

        if (this._lowerHeadingLimit < this._upperHeadingLimit)
        {
            return MathHelper.clamp(heading, this._lowerHeadingLimit, this._upperHeadingLimit);
        }
        else if ((heading > this._lowerHeadingLimit) && (heading < (this._upperHeadingLimit + MathHelper.twoPI)))
        {
            return heading;
        }
        else if (((heading + MathHelper.twoPI) > this._lowerHeadingLimit) && ((heading + MathHelper.twoPI) < (this._upperHeadingLimit + MathHelper.twoPI)))
        {
            return heading;
        }
        else
        {
            var minHeadingDist = Math.min(Math.abs(heading - this._lowerHeadingLimit), Math.abs(heading + MathHelper.twoPI - this._lowerHeadingLimit));
            var maxHeadingDist = Math.min(Math.abs(heading - this._upperHeadingLimit - MathHelper.twoPI), Math.abs(heading - this._upperHeadingLimit));

            var limit = (minHeadingDist < maxHeadingDist) ? this._lowerHeadingLimit : this._upperHeadingLimit;

            return limit;
        }
    },

    constrainVerticalFieldOfView: function (verticalFOV)
    {
        return MathHelper.clamp(verticalFOV, this._minFieldOfView, this._maxFieldOfView);
    },

    onDiscreteZoom: function (e, scale)
    {
        this._zoomingToPoint = true;

        // First determine our current pitch/heading and our target pitch/heading.
        var pitchAndHeadingCurrent = this.calculatePitchAndHeading();
        var pitchAndHeadingTarget = this.tryPixelToPitchHeading({ x: e.clientX, y: e.clientY });

        var tempCurrentHeading = pitchAndHeadingCurrent.heading;
        var tempTargetHeading = pitchAndHeadingTarget.heading;

        // Make sure the current heading never starts out more than 2 PI.
        tempCurrentHeading = tempCurrentHeading - Math.floor(tempCurrentHeading / MathHelper.twoPI) * MathHelper.twoPI;
        
        // If the current heading and target heading are more than PI difference than we know 
        // that we're dealing with the situation where the current heading is close to 2*PI and
        // the target heading is close to 0 or vice-versa. In this case we want to calculate the 
        // target heading using the formula below.
        if (Math.abs(tempCurrentHeading - tempTargetHeading) > Math.PI)
        {
            if (tempTargetHeading < tempCurrentHeading)
            {
                // If the target heading is less than the current heading then we can assume that
                // we are facing to the left of 0 degrees and are trying to zoom to the right of
                // 0 degrees. So add 2 PI to the targetHeading.
                tempTargetHeading += MathHelper.twoPI;
            }
            else
            {
                // If the target heading is less than the current heading then we can assume that
                // we are facing to the right of 0 degrees and are trying to zoom to the left of
                // 0 degrees. So add 2 PI to the currentHeading.
                tempCurrentHeading += MathHelper.twoPI;
            }
        }
        
        var zoomingOut = (e.direction && e.direction < 0) || scale > 1;

        // Determine the difference between the target pitch/heading and the current pitch/heading.
        var currentAndTargetPitchDifference = zoomingOut ? pitchAndHeadingCurrent.pitch - pitchAndHeadingTarget.pitch : pitchAndHeadingTarget.pitch - pitchAndHeadingCurrent.pitch;
        var currentAndTargetHeadingDifference = zoomingOut ? tempCurrentHeading - tempTargetHeading : tempTargetHeading - tempCurrentHeading;

        // Get the current and new vertical fields of view.
        var currentFieldOfView = this._camera.getVerticalFov();
        var newVerticalFieldOfView = determineNewVerticalFieldOfView(this);

        // If the target vertical field of view is already set to the max or min FOVs then just
        // return.
        var targetFieldOfView = this._zoomToPointSpring.getTarget()[2];
        if ((newVerticalFieldOfView == this._minFieldOfView && targetFieldOfView == this._minFieldOfView) ||
            (newVerticalFieldOfView == this._maxFieldOfView && targetFieldOfView == this._maxFieldOfView))
        {
            return;
        }

        // Then we're going to set our target values to the starting values plus half the difference 
        // between the current and target. This is what allows for the correct zoom-to-point effect.
        var targetPitch = this.constrainPitch(pitchAndHeadingCurrent.pitch + ((currentAndTargetPitchDifference) / 2.0));
        var targetHeading = tempCurrentHeading + ((currentAndTargetHeadingDifference) / 2.0);
        
        this._zoomToPointSpring.setCurrent([pitchAndHeadingCurrent.pitch, tempCurrentHeading, currentFieldOfView]);
        this._zoomToPointSpring.setTarget([targetPitch, targetHeading, newVerticalFieldOfView]);

        // Private helper method for determining the new vertical field of view.
        function determineNewVerticalFieldOfView(instance)
        {
            var tempVerticalFieldOfView,

                // TODO: FIX THIS: This isn't right, but the wheelDelta values are so inconsistent.
                // Eventually this will be used for pinch zooming as well.
                zoomScale = 2.0;//e.wheelDelta;

            if ((e.mouseInteractionType && e.mouseInteractionType == 'mousewheel') || (e.type && e.type == 'gestureChange'))
            {
                if (!zoomingOut)
                {
                    if (currentFieldOfView > instance._minFieldOfView + instance._wheelZoomFudgeFactor)
                    {
                        tempVerticalFieldOfView = instance.constrainVerticalFieldOfView(currentFieldOfView / zoomScale); // divide to zoom in
                    }
                    else
                    {
                        // If we're within the wheel zoom fudge factor from the minimum zoom level then just return the minimum zoom level.
                        return instance._minFieldOfView;
                    }
                }
                else
                {
                    if (currentFieldOfView < instance._maxFieldOfView - instance._wheelZoomFudgeFactor)
                    {
                        tempVerticalFieldOfView = instance.constrainVerticalFieldOfView(currentFieldOfView * zoomScale); // multiply to zoom out
                    }
                    else
                    {
                        // If we're within the wheel zoom fudge factor from the maximum zoom level then just return the maximum zoom level.
                        return instance._maxFieldOfView;
                    }
                }
            }
            else
            {
                // If not using the mousewheel then we can assume the pointer was double-tapped so zoom in one level.
                tempVerticalFieldOfView = instance.constrainVerticalFieldOfView(currentFieldOfView / 2.0); // divide to zoom in
            }

            return tempVerticalFieldOfView;
        };
    },

    onKeyDown: function (e)
    {
        var self = this;

        if (e.keyCode == '37') //left arrow
            startRotateHeading(-1);
        else if (e.keyCode == '38') //up arrow
            startRotatePitch(1);
        else if (e.keyCode == '39') //right arrow
            startRotateHeading(1);
        else if (e.keyCode == '40') //down arrow
            startRotatePitch(-1);
        else if (e.keyCode == '107' || e.keyCode == '187') //+ keypad or +/=
            self.zoomIn(true);
        else if (e.keyCode == '109' || e.keyCode == '189') //- keypad or -/_
            self.zoomOut(true);

        function startRotatePitch(acc)
        {
            self._scrollAccY = acc;
            self.moveCamera();
        };

        function startRotateHeading(acc)
        {
            self._scrollAccX = acc;
            self.moveCamera();
        };
    },

    onKeyUp: function (e)
    {
        var self = this;

        if (e.keyCode == '37' || e.keyCode == '39') //left or right arrow
            stopRotateHeading();
        else if (e.keyCode == '38' || e.keyCode == '40') //up or down arrow
            stopRotatePitch();

        function stopRotatePitch()
        {
            self._scrollAccY = 0;
        };

        function stopRotateHeading()
        {
            self._scrollAccX = 0;
        };
    },

    moveCamera: function ()
    {
        if (!this._motionHandle)
        {
            var self = this;

            this._motionHandle = setInterval(function ()
            {
                //Apply acceleration
                self._scrollSpeedX += self._scrollAccX;
                self._scrollSpeedY += self._scrollAccY;

                //Apply dampener
                self._scrollSpeedX *= self._scrollSpeedDamper;
                self._scrollSpeedY *= self._scrollSpeedDamper;

                var pitch = self.getPitch(),
                    heading = self.getHeading();

                //Modify pitch and heading
                pitch += self._scrollSpeedY / self._scrollSpeedAdjustmentFactor;
                heading += self._scrollSpeedX / self._scrollSpeedAdjustmentFactor;
                self.setPitchAndHeading(pitch, heading, null, null);

                //Came to a stop - remove motion handler
                if (Math.abs(self._scrollSpeedX) < 0.1 && Math.abs(self._scrollSpeedY) < 0.1)
                {
                    self.stopMovingCamera();
                    return;
                }
            }, 33); //cap at 30 fps
        }
    },

    stopMovingCamera: function ()
    {
        if (this._motionHandle)
        {
            clearInterval(this._motionHandle);
            this._motionHandle = 0;
        }
    }

};
/* @disable(0146) */
/* @disable(0055) */
/* @restore(0092) */
///#source 1 1 /DataSource/InteractionControllers/RotationalFixedPositionInteractionController.js
/**
* This controls the Photosynth panorama camera.
* @constructor
*/
/* @disable(0092) */
/* @disable(0055) */
/* @constructor */function RotationalFixedPositionInteractionController(camera, upperPitchLimit, lowerPitchLimit, dimension, minFOV)
{
    RotationalFixedPositionInteractionController.__super.call(this, camera, null, upperPitchLimit, lowerPitchLimit, minFOV);
    
    var self = this,
        _sourcePitch = 0,
        _sourceHeading = 0,
        _targetPitch = 0,
        _targetHeading = 0,
        _panoramaWorldTransform = Matrix4X4.createIdentity(),
        _panoramaLocalTransform = Matrix4X4.createIdentity().multiply(_panoramaWorldTransform),
        _deviceRotation = Matrix4X4.createIdentity(),
        _dimension = dimension,

        //Used for state tracking. If this grows beyond the bool & point.
        //we should refactor to use a state machine (see TouchController.js)
        _startingPitchandHeading = [],
        _isRotating = false,
        _lastMovePoint = null,
        _userInputing = false,

        // All these temp vectors and matrices are only instantiated here once 
        // instead of on every update frame. This saves 14 object instantiations 
        // per frame which also reduces garbage collection.
        _pitchRotation = Matrix4X4.createIdentity(),
        _headingRotation = Matrix4X4.createIdentity(),
        _pitchHeadingRotation = Matrix4X4.createIdentity(),
        _worldTransform = Matrix4X4.createIdentity(),
        _bubbleLook = new Vector3(0, 0, -1),
        _bubbleUp = new Vector3(0, 1, 0),
        _bubbleSide = new Vector3(1, 0, 0),
        _bubbleOrigin = new Vector3(0, 0, 0);

    setViewportSize(this._camera.getViewport().getWidth(), this._camera.getViewport().getHeight());

    // PUBLIC METHODS

    this.setViewportSize = setViewportSize;

    this.setDimension = function (dimension)
    {
        _dimension = dimension;
    };

    this.setBounds = function (bounds)
    {
        if (bounds.top >= 0)
        {
            this._upperPitchLimit = bounds.top;
            this._lowerPitchLimit = bounds.bottom;
        }

        var limit = Math.abs(bounds.left - bounds.right);

        // We only constrain the heading if the limit is < 2 * PI.
        if (limit < MathHelper.twoPI)
        {
            if (bounds.left > 0 && bounds.left < bounds.right)
            {
                // If the left bounds is greater than 0 and yet is less than the right bounds then 
                // let's swap them so our normal rules still apply and the bounds checking will 
                // handle them correctly.
                this._upperHeadingLimit = bounds.left;
                this._lowerHeadingLimit = bounds.right;
            }
            else
            {
                this._upperHeadingLimit = bounds.right;
                this._lowerHeadingLimit = bounds.left < 0 ? MathHelper.twoPI + bounds.left : bounds.left;
            }
        }
    };

    this.updateCameraProperties = function ()
    {
        var pitch, heading, fov;

        if (this._zoomingToPoint)
        {
            var pitchHeadingFov = this._zoomToPointSpring.getCurrent();
            pitch = pitchHeadingFov[0];
            heading = pitchHeadingFov[1];
            fov = pitchHeadingFov[2];
            this._pitchSpring.setCurrentAndTarget(pitch);
            this._headingSpring.setCurrentAndTarget(heading);
            this._fieldOfViewSpring.setCurrentAndTarget(fov);
        }
        else
        {
            //If the spring is not constrained to a target it might go over the allowable limits
            //so we want to make sure this doesn't happen
            pitch = this.constrainPitch(this.getPitch());
            heading = this.getHeading();
            fov = this.getVerticalFov();
        }

        _worldTransform.transformVector3Out(_bubbleLook, this._worldLook);
        _worldTransform.transformVector3Out(_bubbleUp, this._worldUp);
        _worldTransform.transformVector3Out(_bubbleSide, this._worldSide);

        //Need - pitch because the math library uses left handed rotations, i.e.
        //a positive angle in the case of the x axis rotation will rotate down
        //(1,0,0) using left hand rule, but a positive pitch in the bubble means
        //that we want to look up so we need to negate this value.
        Matrix4X4.createRotationXOut(pitch, _pitchRotation);
        Matrix4X4.createRotationYOut(-heading, _headingRotation);

        _headingRotation.multiplyOut(_pitchRotation, _pitchHeadingRotation);

        _pitchHeadingRotation.transformVector3Out(this._worldLook, this._look);
        _pitchHeadingRotation.transformVector3Out(this._worldUp, this._up);
        _pitchHeadingRotation.transformVector3Out(this._worldSide, this._side);

        var worldPosition = _bubbleOrigin;
        this._camera.setPosition(worldPosition);
        this._camera.setLook(this._look);
        this._camera.setUp(this._up);

        this._camera.setVerticalFov(fov);

        if (this.viewChangeEvent != null)
        {
            this.viewChangeEvent.fire(this.getView());
        }
    };

    this.control = function (originalCamera, unprocessedEvents)
    {
        var i, e;

        for (i = 0; i < unprocessedEvents.length; ++i)
        {
            e = unprocessedEvents[i];
            switch (e.type)
            {
                case 'gestureStart':
                    _userInputing = true;
                    this.stopMovingCamera();
                    onGestureStart(e);
                    break;
                case 'gestureChange':
                    onGestureChange(e);
                    break;
                case 'gestureEnd':
                    _userInputing = false;
                    onGestureEnd(e);
                    break;
                case 'discreteZoom':
                    this.onDiscreteZoom(e, null);
                    break;
                case 'keydown':
                    _userInputing = true;
                    this.onKeyDown(e);
                    break;
                case 'keyup':
                    _userInputing = false;
                    this.onKeyUp(e);
                    break;
                default:
                    break;
            }
        }

        if (this._gyrometer)
        {
            var now = new Date();
            var gyroReading = this._gyrometer.getCurrentReading();

            if (gyroReading &&
               this.prevGyroReading &&
               gyroReading.timestamp != this.prevGyroReading.timestamp &&
               !_userInputing &&
               this.prevFrameTime)
            {
                var pitchHeadingDelta = processGyrometerReading(gyroReading, now - this.prevFrameTime);

                if (pitchHeadingDelta[0] !== 0 && pitchHeadingDelta[1] !== 0)
                {
                    var pitchHeadingTarget = getTargetPitchAndHeading();
                    var pitch = pitchHeadingTarget[0] + pitchHeadingDelta[0];
                    var heading = pitchHeadingTarget[1] - pitchHeadingDelta[1];

                    this.setPitchAndHeading(pitch, heading, true);
                }
            }

            this.prevGyroReading = gyroReading;
            this.prevFrameTime = now;
        }

        update();
        updateRotation();

        return this._camera;
    };

    this.setGyrometer = function (gyrometer)
    {
        this._gyrometer = gyrometer;
    };

    // PRIVATE METHODS

    function setViewportSize(width, height)
    {
        if (_dimension)
        {
            this._minFieldOfView = height * MathHelper.degreesToRadians(90) / (_dimension * 2); //let them zoom in until each pixel is expanded to 2x2
        }
    };

    function getTargetPitchAndHeading()
    {
        return [self._pitchSpring.getTarget(), self._headingSpring.getTarget()];
    };

    function hasCompleted()
    {
        var zoomToPointSpringHasSettled = self._zoomToPointSpring.isSettled();
        if (zoomToPointSpringHasSettled)
        {
            self._zoomingToPoint = false;
        }

        return zoomToPointSpringHasSettled &&
               self._pitchSpring.isSettled() &&
               self._headingSpring.isSettled() &&
               self._fieldOfViewSpring.isSettled();
    };

    function calculatePitchAndHeadingDelta(dx,
                                           dy,
                                           viewportWidth,
                                           viewportHeight,
                                           focalLength)
    {
        var pitch, heading;
        var aspectRatio = viewportWidth / viewportHeight;

        if (dx === 0)
        {
            heading = 0;
        }
        else
        {
            heading = 2 * Math.atan((aspectRatio * (dx / viewportWidth)) / focalLength);
        }

        if (dy === 0)
        {
            pitch = 0;
        }
        else
        {
            //Using a -dy because dy is in screen space ie. 0,0 top left to w,h at the
            //bottom right, so a negative dy actually means a positive value in terms of pitch
            pitch = 2 * Math.atan((-dy / viewportHeight) / focalLength);
        }

        return [pitch, heading];
    };

    function update()
    {
        if (hasCompleted())
        {
            if (self._viewChanging && self.viewChangeEndEvent != null)
            {
                self.viewChangeEndEvent.fire(self.getView());
            }

            self._viewChanging = false;
            return;
        }

        self._viewChanging = true;

        //Need this to be MS for classic spring
        var t = (new Date()).getTime();

        self._zoomToPointSpring.step(t);
        self._pitchSpring.step(t);
        self._headingSpring.step(t);
        self._fieldOfViewSpring.step(t);

        self.updateCameraProperties();
    };
    
    function getRelativeTarget (startingPitch,
                                startingHeading,
                                dx,
                                dy,
                                viewportWidth,
                                viewportHeight,
                                deltaMultiplier)
    {
        dx *= deltaMultiplier;
        dy *= deltaMultiplier;

        var focalLength = self._camera.getFocalLength();
        var relativePitch;
        var relativeHeading;
        var pitchAndHeading = calculatePitchAndHeadingDelta(dx,
                                                            dy,
                                                            viewportWidth,
                                                            viewportHeight,
                                                            focalLength);

        relativePitch = pitchAndHeading[0];
        relativeHeading = pitchAndHeading[1];

        //use - heading because if the user swiped from left to right, they get a positive
        //heading value but a right to left swipe would mean we need to turn the camera
        //in the opposite direction
        var targetHeading = startingHeading - relativeHeading;
        if (targetHeading < 0)
        {
            targetHeading += MathHelper.twoPI;
        }

        //We use - for relative pitch because a positive relative pitch means the user
        //must have had a negative movement in screen space it a swipe up, which means we 
        //actually want to rotate down
        var targetPitch = startingPitch - relativePitch;

        var worldToLocalTransform = _deviceRotation.inverse().multiply(_panoramaLocalTransform);
        var sourcePitchAndHeading = [self._pitchSpring.getCurrent(), self._headingSpring.getCurrent()];
        var sourceHeading = sourcePitchAndHeading[1];
        sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(sourceHeading, targetHeading);

        return {
            fromPitch: sourcePitchAndHeading[0],
            fromHeading: sourceHeading,
            toPitch: targetPitch,
            toHeading: targetHeading
        };
    };

    function setRelativeTarget (startingPitch,
                                startingHeading,
                                dx,
                                dy,
                                viewportWidth,
                                viewportHeight,
                                deltaMultiplier)
    {
        self._zoomingToPoint = false;
        dx *= deltaMultiplier;
        dy *= deltaMultiplier;

        var focalLength = self._camera.getFocalLength();
        var relativePitch;
        var relativeHeading;
        var pitchAndHeading = calculatePitchAndHeadingDelta(dx,
                                                            dy,
                                                            viewportWidth,
                                                            viewportHeight,
                                                            focalLength);

        relativePitch = pitchAndHeading[0];
        relativeHeading = pitchAndHeading[1];

        //use - heading because if the user swiped from left to right, they get a positive
        //heading value but a right to left swipe would mean we need to turn the camera
        //in the opposite direction
        _targetHeading = self.constrainHeading(startingHeading - relativeHeading);

        //We use - for relative pitch because a positive relative pitch means the user
        //must have had a negative movement in screen space it a swipe up, which means we 
        //actually want to rotate down
        _targetPitch = startingPitch - relativePitch;

        //The caller can specify the upper and lower limits of rotation, we need to honour them
        if (_targetPitch > self._upperPitchLimit)
        {
            _targetPitch = self._upperPitchLimit - 0.0001;
        }
        if (_targetPitch < self._lowerPitchLimit)
        {
            _targetPitch = self._lowerPitchLimit + 0.0001;
        }

        var worldToLocalTransform = _deviceRotation.inverse().multiply(_panoramaLocalTransform);
        var sourcePitchAndHeading = [self._pitchSpring.getCurrent(), self._headingSpring.getCurrent()];
        _sourcePitch = sourcePitchAndHeading[0];
        _sourceHeading = sourcePitchAndHeading[1];

        _sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(_sourceHeading, _targetHeading);

        self._pitchSpring.setCurrent(_sourcePitch);
        self._pitchSpring.setTarget(_targetPitch);
        self._headingSpring.setCurrent(_sourceHeading);
        self._headingSpring.setTarget(_targetHeading);
    };

    function onGestureStart(e)
    {
        // Stops any current animations.
        self.setViewTarget(self.getPitch(), self.getHeading(), self.getVerticalFov(), false, null);

        self._lastGestureScale = 1;
        beginRotation(e.screenX, e.screenY);
    };

    function onGestureEnd(e)
    {
        self._lastGestureScale = null;
        endRotation();
        self._zoomingToPoint = false;
    };

    function onGestureChange(e)
    {
        var scaleDelta = self._lastGestureScale / e.scale;

        if (scaleDelta !== 1)
        {
            endRotation();

            // Determine the center point between the two fingers.
            var centerX = (self._startingPosition[0] + e.clientX) / 2,
                centerY = (self._startingPosition[1] + e.clientY) / 2;

            e.clientX = centerX;
            e.clientY = centerY;

            self.onDiscreteZoom(e, scaleDelta);
        }

        self._lastGestureScale = e.scale;

        _lastMovePoint = new Vector2(self._startingPosition[0] + e.translationX, self._startingPosition[1] + e.translationY);
    };

    function beginRotation(x, y)
    {
        _isRotating = true;
        self._startingPosition = [x, y];
        _startingPitchandHeading[0] = self.getPitch();
        _startingPitchandHeading[1] = self.getHeading();
    };

    function endRotation()
    {
        _isRotating = false;
        _lastMovePoint = null;
    };

    function updateRotation()
    {
        if (self._camera === null || _lastMovePoint === null || !_isRotating)
        {
            return;
        }

        var sx = _lastMovePoint.x;
        var sy = _lastMovePoint.y;
        var viewport = self._camera.getViewport();
        var deltaMultiplier = 1.1;
        var dx = sx - self._startingPosition[0];
        var dy = sy - self._startingPosition[1];

        setRelativeTarget(_startingPitchandHeading[0],
                          _startingPitchandHeading[1],
                          dx,
                          dy,
                          viewport.getWidth(),
                          viewport.getHeight(),
                          deltaMultiplier);
    };

    function processGyrometerReading(reading, timeDelta)
    {
        var threshold = (self.prevGyrometerReadingNonZero) ? 2 : 2;

        if (reading == null)
        {
            self.prevGyrometerReadingNonZero = false;
            return [0, 0];
        }

        if (Math.abs(reading.angularVelocityX) < threshold &&
            Math.abs(reading.angularVelocityY) < threshold &&
            Math.abs(reading.angularVelocityZ) < threshold)
        {
            //if the rotation is below some threshold, then it's probably sensor drift, so just ignore.
            self.prevGyrometerReadingNonZero = false;
            return [0, 0];
        }

        self.prevGyrometerReadingNonZero = true;

        //Value is given in degrees per second.  Convert to radians per millisecond.
        //Also adjust to current FOV.  If we didn't do this, then the camera goes crazy when zoomed in far.
        var multiplier = 1.5 * MathHelper.degreesToRadians(timeDelta / 1000) * Math.sin(self.getVerticalFov());

        var headingDelta = reading.angularVelocityY * multiplier;
        var pitchDelta = reading.angularVelocityX * multiplier;

        var currentOrientation = null;

        /* @disable(0058) */
        if (Windows && Windows.Graphics && Windows.Graphics.Display && Windows.Graphics.Display.DisplayProperties)
        {
            currentOrientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;
        }

        if (currentOrientation == null || currentOrientation === Windows.Graphics.Display.DisplayOrientations.none || currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscape)
        {
            return [pitchDelta, headingDelta];
        }
        else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.portrait)
        {
            return [headingDelta, -pitchDelta];
        }
        else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscapeFlipped)
        {
            return [-pitchDelta, -headingDelta];
        }
        else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.portraitFlipped)
        {
            return [-headingDelta, pitchDelta];
        }
        /* @restore(0058) */

        return [0, 0];
    };
}

/* @disable(0058) */
extend(RotationalFixedPositionInteractionController, InteractionController);
/* @restore(0058) */
/* @restore(0055) */
/* @restore(0092) */


///#source 1 1 /DataSource/InteractionControllers/CubeInteractionController.js
/**
* This interaction controller controls the Streetside cube camera.
* @constructor
*/
/* @disable(0092) */
/* @disable(0146) */
/* @disable(0055) */
/* @constructor */function CubeInteractionController(camera, cameraParameters, upperPitchLimit, lowerPitchLimit)
{
    CubeInteractionController.__super.call(this, camera, cameraParameters, upperPitchLimit, lowerPitchLimit);

    var self = this,

        // The point on the screen when the mouseDown event fires
        // This represents the initial point on the screen when the user clicks
        _mouseDownPoint = new Vector2(0,0),

        // The current point on the screen when the mouse moves after a mouseDown event
        // This represents the current location of the mouse during mouse drag
        _currentMousePoint = new Vector2(0,0),

        // The previous point on the screen when the mouse moved after a mouseDown event
        // This represents the last location of the mouse during mouse drag
        _previousMousePoint = new Vector2(-1,-1),

        _isMouseDown = false;
        _isCurrentMouseSet = false;
        _isPreviousMouseSet = false;

        _startingPitch = null;
        _startingHeading = null;
        _animationInProgress = null;
        _radiansPerPixelPitch = null;
        _radiansPerPixelHeading = null;

        //TODO: make this settable
        _accelerateHorizontalRotationNearPoles = true;
        _maxPitchForAcceleratingHorizontalRotation = MathHelper.degreesToRadians(70);

    // PUBLIC METHODS

    this.control = function (camera, unprocessedEvents)
    {
        var i, e;
        for (i = 0; i < unprocessedEvents.length; ++i)
        {
            e = unprocessedEvents[i];
            switch (e.type)
            {
                case 'gestureEnd':
                    onGestureEnd(e);
                    break;
                case 'gestureStart':
                    onGestureStart(e);
                    break;
                case 'gestureChange':
                    onGestureChange(e);
                    break;
                case 'discreteZoom':
                    this.onDiscreteZoom(e);
                    break;
                case 'keydown':
                    this.onKeyDown(e);
                    break;
                case 'keyup':
                    this.onKeyUp(e);
                    break;
                default:
                    break;
            }
        }

        this.updateCameraProperties();
        return this._camera;
    };

    this.updateCameraProperties = function ()
    {
        updateViewForMouseDrag();
        var springSettled = stepUpSpring();

        var pitch, heading, fov;

        if (this._zoomingToPoint)
        {
            var pitchHeadingFov = this._zoomToPointSpring.getCurrent();
            pitch = pitchHeadingFov[0];
            heading = pitchHeadingFov[1];
            fov = pitchHeadingFov[2];
            this._pitchSpring.setCurrentAndTarget(pitch);
            this._headingSpring.setCurrentAndTarget(heading);
            this._fieldOfViewSpring.setCurrentAndTarget(fov);
        }
        else
        {
            // Get current look by calculating it from the current pitch, heading and fov
            pitch = this.getPitch();
            heading = this.getHeading();
            fov = this.getVerticalFov();
        }

        this._look = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldLook, this._worldUp, this._worldSide, null);
        this._up = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldUp, this._worldUp, this._worldSide, null);
        this._side = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldSide, this._worldUp, this._worldSide, null);

        // Get the previous look, up and fov from the camera
        var prevLook = this._camera.getLook();
        var prevUp = this._camera.getUp();
        var prevFov = this._camera.getVerticalFov();

        // If current look, up and fov is different from previous, update camera with current view state
        // Also update the camera at begin and end of animation
        if (_animationInProgress
            || (!_animationInProgress && !springSettled)
            || !prevLook.equals(this._look) || !prevUp.equals(this._worldUp) || prevFov !== fov)
        {

            this._camera.setLook(this._look);
            this._camera.setUp(this._worldUp);
            this._camera.setVerticalFov(fov);

            if (this.viewChangeCallback != null)
            {
                /* @disable(0131) */
                this.viewChangeCallback({ animationInProgress: _animationInProgress, animationSettled: springSettled });
                /* @restore(0131) */
            }
        }

        // Update animation status
        _animationInProgress = !springSettled;
    };

    // PRIVATE METHODS

    // Update the view when user drags the mouse
    function updateViewForMouseDrag()
    {
        if (_isCurrentMouseSet)
        {
            // Only update the view if user drags the mouse
            if (_isMouseDown
                && _isPreviousMouseSet
                && (_previousMousePoint.x !== _currentMousePoint.x || _previousMousePoint.y !== _currentMousePoint.y))
            {
                var pitch = MathHelper.clamp(_startingPitch + _radiansPerPixelPitch * (_currentMousePoint.y - _mouseDownPoint.y), self._lowerPitchLimit, self._upperPitchLimit);
                var heading = MathHelper.normalizeRadian(_startingHeading + _radiansPerPixelHeading * (_mouseDownPoint.x - _currentMousePoint.x));
                self.setViewTarget(pitch, heading, null, true);
            }

            // Update _previousMousePoint so we don't needlessly update the view
            // when user pauses their drag action without letting go their mouse
            _previousMousePoint.x = _currentMousePoint.x;
            _previousMousePoint.y = _currentMousePoint.y;
            _isPreviousMouseSet = true;
        }
    };

    // Step up the springs if required
    // Return a flag indicating whether all the springs are settled
    function stepUpSpring()
    {
        //Need self to be MS for classic spring
        var springSettled = false;
        var t = (new Date()).getTime();

        var zoomToPointSpringSettled = self._zoomToPointSpring.step(t);
        var pSettled = self._pitchSpring.step(t);
        var hSettled = self._headingSpring.step(t);
        var fovSettled = self._fieldOfViewSpring.step(t);

        if (zoomToPointSpringSettled)
        {
            self._zoomingToPoint = false;
        }

        if (zoomToPointSpringSettled && pSettled && hSettled && fovSettled)
        {
            springSettled = true;
        }

        return springSettled;
    };

    function onGestureStart(e)
    {
        self._lastGestureScale = 1;
        _isMouseDown = true;
        _mouseDownPoint.x = e.screenX;
        _mouseDownPoint.y = e.screenY;
        _startingPitch = self._pitchSpring.getCurrent();
        _startingHeading = self._headingSpring.getCurrent();
        self._startingPosition = [e.screenX, e.screenY];

        var viewport = self._camera.getViewport();
        _radiansPerPixelPitch = self._camera.getVerticalFov() / viewport.getHeight();

        if (_accelerateHorizontalRotationNearPoles)
        {
            //As the camera pitches towards the poles, the perceived horizontal rotation feels slower and slower
            //because we're using rotational speed instead of translational.
            //This code alters the horizontal rotation so that it matches what the translation speed would be.

            //As the pitch approaches the poles, the multiplier approaches infinity, so we clamp here (roughly 70 degrees)
            var clampedPitch = Math.min(Math.abs(_startingPitch), _maxPitchForAcceleratingHorizontalRotation);

            _radiansPerPixelHeading = _radiansPerPixelPitch / Math.sin(MathHelper.halfPI - clampedPitch);
        }
    };

    function onGestureEnd(e)
    {
        self._lastGestureScale = null;
        _isMouseDown = false;
        _isCurrentMouseSet = false;
        _isPreviousMouseSet = false;
        _startingPitch = null;
        _startingHeading = null;
    };

    function onGestureChange(e)
    {
        var scaleDelta = self._lastGestureScale / e.scale;

        if (scaleDelta !== 1)
        {
            // Determine the center point between the two fingers.
            var centerX = (self._startingPosition[0] + e.clientX) / 2,
                centerY = (self._startingPosition[1] + e.clientY) / 2;

            e.clientX = centerX;
            e.clientY = centerY;

            self.onDiscreteZoom(e, scaleDelta);
        }
        else if (_isMouseDown)
        {
            _currentMousePoint.x = _mouseDownPoint.x + e.translationX;
            _currentMousePoint.y = _mouseDownPoint.y + e.translationY;
            _isCurrentMouseSet = true;
        }

        self._lastGestureScale = e.scale;
    };
}

extend(CubeInteractionController, InteractionController);
/* @restore(0055) */
/* @restore(0146) */
/* @restore(0092) */

///#source 1 1 /Common/MemoryCache.js
//------------------------------------------------------------------------------
// <Copyright From='2004' To='2020' Company='Microsoft Corporation'> 
//		Copyright (c) Microsoft Corporation. All Rights Reserved. 
//		Information Contained Herein is Proprietary and Confidential. 
// </Copyright>
//------------------------------------------------------------------------------

/**
 * Caches arbitary key(string)/value(object) pairs
 * Cache will hold at least [minEntries] entries, but might hold more.
 * @param {number} minEntries
 * @constructor
 */
/* @disable(0092) */
/* @disable(0136) */
var MemoryCache = function (minEntries)
{
    var self = this;

    var attributePrefix = '$$';
    var Debug = {};
    Debug.assert = function (a, b) { };

    // ****************************************
    // ** PRIVATE FIELDS 

    // array of hash tables to store the marking of recently downloaded
    // Note: this logic will maintian between _maxEntries and _maxEntries * _maxHashtables entries
    var _maxEntries = minEntries;
    var _maxHashtables = 3;
    var _countKey = attributePrefix + 'count';
    var _cache = [{}];
    _cache[0][_countKey] = 0;

    var _disposer;

    // **
    // ****************************************

    // ****************************************
    // ** PRIVILEGED METHODS

    /**
     * tries to get value for provided key
	 * doesn't return anything (a.k.a. returns "undefined") if there is no match
     * @param {string} key
     * @param {boolean=} refresh
     */
    /* @disable(0054) */
    self.get = function (key, refresh)
    {
        Debug.assert(typeof key === 'string', 'Argument: key');

        var value;

        // look for the value starting with latest hashtable
        var i = _cache.length;
        var latest = true;
        while (i--)
        {
            value = _cache[i][key];
            if (value !== undefined)
            {
                // refresh the value if we need to
                if (refresh && !latest)
                {
                    self.insert(key, value);
                }
                return value;
            }
            latest = false;
        }
    };
    /* @restore(0054) */

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    /**
     * inserts given value to the cache
     * @param {string} key
     * @param {Object} value
     */
    self.insert = function (key, value)
    {
        Debug.assert(typeof key === 'string', 'Argument: key');
        Debug.assert(value !== undefined, 'Argument: value');

        // in order to make expiration of cache preformat, use array of hashtables
        // store they key/value pair only in the latest hashtable
        // if the latest hasbtable is full, create a new one and drop the oldest
        var hashtable = _cache[_cache.length - 1];
        if (hashtable[key] === undefined)
        {
            // if the entry doesn't exist
            if (hashtable[_countKey] < _maxEntries)
            {
                // and the latest hastable is not full
                // simply increment entry count on it
                hashtable[_countKey]++;
            } else
            {
                // if the lastest hashtable if full
                // create a new hashtable
                hashtable = {};
                hashtable[_countKey] = 1;
                _cache.push(hashtable);

                // and if we go over limit, drop the oldest one
                if (_cache.length > _maxHashtables)
                {
                    var oldHashtable = _cache.shift();
                    if (_disposer)
                    {
                        // Note: "var k in" syntax is bad, but for this case it seems to be lesser of evils
                        // alternative is keeping track of all the keys in an array, which would slow down common scenarios
                        // where MemoryCahce doesn't need to dispose it's elements
                        for (var k in oldHashtable)
                        {
                            if (k !== _countKey && oldHashtable.hasOwnProperty(k))
                            {
                                var oldObject = oldHashtable[k];
                                // we also need to check if that object doesn't exist in newer tables
                                if (oldObject !== self.get(k, null))
                                {
                                    _disposer(oldObject);
                                }
                            }
                        }
                    }
                }
            }
        }

        // store the pair in the latest hashtable
        hashtable[key] = value;
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    /**
     * sets a function that should be used for disposing the elements
     * @param {Function} disposer
     */
    self.useDisposer = function (disposer)
    {
        _disposer = disposer;
    };

    /**
     * Returns the current size of the cache
     * @return {number}
     */
    self.size = function ()
    {
        var i, k, count = 0;
        for (i = 0; i < _cache.length; ++i)
        {
            if (_cache[i])
            {
                for (k in _cache[i])
                {
                    if (_cache[i].hasOwnProperty(k) && k !== _countKey)
                    {
                        ++count;
                    }
                }
            }
        }
        return count;
    };

    // **
    // ****************************************
};
/* @restore(0136) */
/* @restore(0092) */
///#source 1 1 /Common/PriorityNetworkDownloader.js
/** 
 * A priority tile downloader.
 * This is very simple and *doesn't* yet support grouping callbacks.
 * instead it's up to the application loop to call update and check AllCompleted array for new results.
 * @param {boolean} useCORS indicates if Cross Origin Resource Sharing image tags should be used.
 * @constructor
 */
/* @disable(0092) */
var PriorityNetworkDownloader = function (useCORS, tileDownloadFailedCallback, tileDownloadSucceededCallback)
{
    var self = this;

    self.useCORS = (useCORS || false);

    var _spacerImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

    // if image isn't downloaded in this many milliseconds, free up the download slot
    var _downloadTimeout = 5000;
    var _maxConcurrentTileDownloads = 6;

    var _queue = [];
    var _activeDownloadsCount = 0;
    var _activeDownloads = {};

    // cached image downloads: [url] -> [<img src=url/>];
    var downloadedCacheMinSize = 2*60;
    var _cahedByUrl = new MemoryCache(downloadedCacheMinSize);
    var _failed = new MemoryCache(30);
    var _allDownloadedUrls = new MemoryCache(200);

    var _succeedCount = 0;
    var _failCount = 0;

    //if no failure/success callbacks str specified, then define no-op ones
    tileDownloadFailedCallback = tileDownloadFailedCallback || function () { };
    tileDownloadSucceededCallback = tileDownloadSucceededCallback || function () { };

    // Safari (iPad and iPhone) and Android seem to leak memory when recycling images...
    if (quirks.useImageDisposer)
    {
        _cahedByUrl.useDisposer(function (o)
        {
            if (o && o.src)
            {
                o.src = _spacerImageUrl;
            }
        });
    }

    var attributePrefix = '$$';
    var _downloadRequestKey = attributePrefix + 'downloadRequest';
    var _timeoutIdKey = attributePrefix + 'timeoutid';
    var _processedKey = attributePrefix + 'processed';
    //Used when processing responses in AllCompleted.
    var _tokenKey = 'token';

    self.hasABlockingDownload = false;
    self.blockingDownloadTargetCount = -1,
    self.blockingDownloadSuccessCount = 0,
    self.blockingDownloadFailureCount = 0,
    self.blockingDownloadProgressCallback = null,
    self.blockingDownloadFinishCallback = null;
    self.prefetchedTiles = {};

    //TODO: look into the MemoryCache and probably replace that with this implementation.
    //CachingObject is more performant, guaranties FIFO order and has upper cap, which is more
    //robust on mobile applications where we'd like to cap the amount of cache rather then having the min value.
    self.AllCompleted = new MemoryCache(downloadedCacheMinSize);;
    //This would hold fresh downloads. Cleaned up upon every update() call
    self.currentCompleted = [];

    // PUBLIC METHODS

    // TODO: Do we need this method?  It doesn't appear to be being used.

    // Downloads all assets of the mediaType at the view setup as specified
    // by cameraParameters. Since runtime LOD calculations (computing the
    // average LODs for pano faces under perspective projection) can result
    // in more than one LOD levels, a set of multipliers can be specified
    // such that assets are fetched to cover the multiple runtime LODs.
    // A typical set of multipliers are [0.9, 1.2],
    // which correspond to 0.9x and 1.2x of viewport resolution, respectively
    //self.downloadAll = function (mediaTypeName, multiplierArray, progressCallback, finishCallback, atLowLod)
    //{
    //    self.hasABlockingDownload = true;

    //    var multipliers = multiplierArray || [1.0];

    //    var cameraLookAndUps = [
    //        { look: new Vector3(0, 0, -1), up: new Vector3(0, 1, 0) },
    //        { look: new Vector3(0, 0, 1), up: new Vector3(0, 1, 0) },
    //        { look: new Vector3(0, -1, 0), up: new Vector3(0, 0, 1) },
    //        { look: new Vector3(0, 1, 0), up: new Vector3(0, 0, 1) },
    //        { look: new Vector3(-1, 0, 0), up: new Vector3(0, 1, 0) },
    //        { look: new Vector3(1, 0, 0), up: new Vector3(0, 1, 0) }
    //    ];
    //    var faceNames = ["front", "back", "bottom", "top", "left", "right"];

    //    var allTiles = {};

    //    var numMultipliers = multipliers.length;
    //    for (var m = 0; m < numMultipliers; m++)
    //    {
    //        var scale = Math.tan(MathHelper.degreesToRadians(90) / 2) / Math.tan(camera.getVerticalFov() / 2) * multipliers[m];
    //        var vp = new Viewport(Math.floor(viewport.getHeight() * scale),
    //                Math.floor(viewport.getHeight() * scale), near, far);
    //        var cam = new PerspectiveCamera(null, null);
    //        cam.setViewport(vp);

    //        cam.setPosition(new Vector3(0, 0, 0));
    //        cam.setVerticalFov(MathHelper.degreesToRadians(90));
    //        var i, j;
    //        var numCameraLookAndUps = cameraLookAndUps.length;
    //        for (i = 0; i < numCameraLookAndUps; i++)
    //        {
    //            cam.setLook(cameraLookAndUps[i].look);
    //            cam.setUp(cameraLookAndUps[i].up);
    //            var visibleSet = { byId: {} };
    //            var tiles = dataSources[mediaTypeName].cull(viewModel.byType[mediaTypeName], cam, visibleSet, _isCachedUrl, atLowLod);
    //            if (tiles.added.length)
    //            {
    //                var newTiles = tiles.added;
    //                newTiles.sort(function (a, b) { return b.tileId.levelOfDetail - a.tileId.levelOfDetail; });
    //                var lod = newTiles[0].tileId.levelOfDetail;
    //                var numNewTiles = newTiles.length;
    //                for (j = 0; j < numNewTiles; j++)
    //                {
    //                    if (newTiles[j].tileId.levelOfDetail == lod)
    //                    {
    //                        allTiles[newTiles[j].id] = newTiles[j];
    //                    }
    //                    else
    //                    {
    //                        break;
    //                    }
    //                }
    //            }
    //        }
    //    }

    //    self.blockingDownloadSuccessCount = self.blockingDownloadFailureCount = 0;
    //    self.customFailFunc = function (failCount, successCount)
    //    {
    //        self.blockingDownloadFailureCount++;
    //    };
    //    var count = 0;
    //    for (var k in allTiles)
    //    {
    //        var currentTile = allTiles[k];
    //        self.downloadImage(currentTile.url, currentTile.priority, currentTile.id);
    //        //Utils.log(currentTile.id);
    //        count++;
    //    }
    //    self.blockingDownloadTargetCount = count;

    //    self.blockingDownloadProgressCallback = progressCallback;
    //    self.blockingDownloadFinishCallback = finishCallback;

    //    self.prefetchedTiles = allTiles;

    //    return count;
    //};

    self.hasBlockingDownload = function ()
    {
        if (self.hasABlockingDownload)
        {
            self.blockingDownloadSuccessCount += self.AllCompleted.Size();
            self.update();

            /* @disable(0131) */
            self.blockingDownloadProgressCallback(self.blockingDownloadSuccessCount);
            /* @restore(0131) */

            if (self.blockingDownloadSuccessCount + self.blockingDownloadFailureCount == self.blockingDownloadTargetCount)
            {
                /* @disable(0131) */
                self.blockingDownloadFinishCallback(self.blockingDownloadSuccessCount, self.blockingDownloadFailureCount);
                /* @restore(0131) */

                // reset
                self.resetDownloadAll();
            }
            else
            {
                return true;
            }
        }

        return false;
    };

    self.getState = function (url)
    {
        if (_cahedByUrl.get(url))
        {
            return TileDownloadState.ready;
        }
        if (_allDownloadedUrls.get(url))
        {
            return TileDownloadState.cacheExpired;
        }

        var failedState = _failed.get(url);
        if (failedState !== undefined)
        {
            return failedState;
        }

        if (_activeDownloads[url])
        {
            return TileDownloadState.downloading;
        }

        return TileDownloadState.none;
    };

    /**
     * enqueue an image to download
     * @param {string} url
     * @param {number} priority
     * @param {Object} token
     */
    self.downloadImage = function (url, priority, token)
    {
        if (self.getState(url) === TileDownloadState.ready)
        {
            //We've got it in the cache. Make it avaible immediately.
            self.AllCompleted.insert(token, _cahedByUrl.get(url));
        } else
        {
            _queue.push({
                url: url,
                priority: priority,
                token: token
            });
        }
    };

    /**
     * Update the priority on an pending download.
     * @param {string} url
     * @param {number} priority
     */
    self.updatePriority = function (url, priority)
    {
        //Look for duplicates...
        var i, found = false;
        for (i = 0; i < _queue.length; ++i)
        {
            if (_queue.url === url)
            {
                found = true;
                _queue.priority = priority;
                break;
            }
        }

        if (!found)
        {
            throw 'Expected item to be in queue.';
        }
    };

    /**
     * Cancel a pending download.
     * @param {string} url
     */
    self.cancel = function (url)
    {
        var i;
        //Remove from queues.
        if (_activeDownloads[url])
        {
            _endDownload(_activeDownloads[url], url);
        }
    };

    /**
     * Get the current size of the cache. This is
     * mainly for debugging and isn't performant.
     * @return {number}
     */
    self.getCacheSize = function ()
    {
        return _cahedByUrl.size();
    };

    self.currentlyDownloading = function ()
    {
        return _activeDownloadsCount != 0;
    };

    /**
     * Call this from the run-loop of the application.
     * This will process any AllCompleted downloads and trigger new downloads.
     */
    self.update = function ()
    {
        self.currentCompleted.length = 0;
        _queue.sort(function (l, r)
        {
            return r.priority - l.priority;
        });
        // starts downloads for highet priority images while download slots are available
        for (var i = 0; i < _queue.length; i++)
        {
            var downloadRequest = _queue[i];
            var url = downloadRequest.url;
            var downloadState = self.getState(url);
            switch (downloadState)
            {
                case TileDownloadState.none:
                case TileDownloadState.timedout:
                case TileDownloadState.cacheExpired:
                    if (_activeDownloadsCount < _maxConcurrentTileDownloads)
                    {
                        if (!_activeDownloads[url])
                        {
                            _activeDownloadsCount++;
                            var img = document.createElement('img');
                            _activeDownloads[url] = img;
                            img[_downloadRequestKey] = downloadRequest;
                            img.onload = _onDownloadComplete;
                            img.onerror = _onDownloadFailed;
                            img.onabort = _onDownloadFailed;
                            img[_timeoutIdKey] = window.setTimeout((function ()
                            {
                                var closureImg = img;
                                return function ()
                                {
                                    _onDownloadTimeout.call(closureImg);
                                };
                            })(), _downloadTimeout);

                            //Cross origin flag has gotten a bit more complicated.
                            // We have to deal with a few cases.
                            // (a) data uri which doesn't note require any CORS stuff.
                            // (b) rendering with CSS, thus un-needed
                            // (c) We are getting content from the same domain or relative url thus unneeded
                            // (d) We are getting content from another domain and using webgl - thus required.


                            var useCORS = false;

                            if (self.useCORS)
                            { //case (b)
                                useCORS = !Utils.isDataUrl(url) && //case (a)
                                          !Utils.isRelativeUrl(url) && //case (c-2)
                                          !Utils.areSameDomain(url, window.location.toString()); //case (c-1)
                            }

                            if (useCORS)
                            {
                                img.crossOrigin = '';
                            }

                            img.src = url;
                        }
                    }
                    break;
                case TileDownloadState.downloading:
                    break;
                default:
                    break;
            }
        }
    };

    // TODO: Not currently being used and _isCahcedUrl not defined in this class. Probably needs to be passed in.
    //self.cancelDownloadAll = function ()
    //{
    //    for (var t in prefetchedTiles)
    //    {
    //        if (!_isCachedUrl(prefetchedTiles[t].url))
    //        {
    //            self.cancel(prefetchedTiles[t].url);
    //        }
    //    }
    //    this._resetDownloadAll();
    //};

    self.resetDownloadAll = function ()
    {
        self.blockingDownloadTargetCount = 0;
        self.blockingDownloadSuccessCount = 0;
        self.blockingDownloadFailureCount = 0;
        self.hasABlockingDownload = false;
        self.customFailFunc = null;
        self.blockingDownloadProgressCallback = null;
        self.blockingDownloadFinishCallback = null;
    };

    // PRIVATE METHODS

    function _onDownloadComplete()
    {
        if (!this[_processedKey])
        {
            var url = this[_downloadRequestKey].url;
            _endDownload(this, url);

            _allDownloadedUrls.insert(url, true); // DON'T store the image here. Mobile devices cannot handle too many in-memory images.
            var token = this[_downloadRequestKey].token;
            this[_tokenKey] = token;
            self.AllCompleted.insert(token, this);
            self.currentCompleted.push(this[_downloadRequestKey]);
            
            _cahedByUrl.insert(url, this);

            _succeedCount++;
            tileDownloadSucceededCallback(_failCount, _succeedCount);
        }
    }

    function _onDownloadFailed()
    {
        if (!this[_processedKey])
        {
            var url = this[_downloadRequestKey].url;
            _endDownload(this, url);

            if (quirks.useImageDisposer)
            {
                this.src = _spacerImageUrl; //TODO
            }
            _failed.insert(url, TileDownloadState.failed);

            _failCount++;
            tileDownloadFailedCallback(_failCount, _succeedCount);
        }
    }

    function _onDownloadTimeout()
    {
        if (!this[_processedKey])
        {
            var url = this[_downloadRequestKey].url;
            _endDownload(this, url);

            if (quirks.useImageDisposer)
            {
                this.src = _spacerImageUrl; //TODO..
            }
            _failed.insert(url, TileDownloadState.timedout);

            _failCount++;
            tileDownloadFailedCallback(_failCount, _succeedCount);
        }
    }

    function _endDownload(img, url)
    {
        img[_processedKey] = true;
        img.onload = null;
        img.onerror = null;
        img.onabort = null;
        window.clearTimeout(img[_timeoutIdKey]);
        var downloadRequest = img[_downloadRequestKey];
        var i = _queue.length;
        while (i--)
        {
            if (_queue[i] === downloadRequest)
            {
                _queue.splice(i, 1);
            }
        }

        _activeDownloadsCount--;
        delete _activeDownloads[url];
    }
};

var TileDownloadState = {
    none: 0,
    downloading: 1,
    ready: 2,	// This means the image is decoded and in memory
    failed: 3,
    timedout: 4,
    cacheExpired: 5	// This means the image was requested at some point (so probably on disk), but not decoded and in memory
};
/* @restore(0092) */

///#source 1 1 /DataSource/DataSources/WorldConfiguration.js
/** 
 * This holds RML which is being used to configure the renderer. It 
 * does not do any IO. The update frame loop will compute a series 
 * of additions and removals of entities and applies them to this 
 * datastructure.
 */
/* @constructor */function WorldConfiguration()
{
    var self = this;

    /** 
     *  Holds arrays of entities indexed by id
     */
    self.byId = {};

    /**
     * Holds arrays of entities indexed by the entity type 
     */
    self.byType = {};

    /**
     * Adds an entity to the scene. 
     * It also updates book keeping structures (byId,byType,byName)
     */
    self.add = function (itemToAdd)
    {
        if (itemToAdd.id == null)
        {
            throw 'expected id property on the item';
        }
        if (!itemToAdd.type)
        {
            throw 'expected type property on the item';
        }

        self.byId[itemToAdd.id] = itemToAdd;
        self.byType[itemToAdd.type] = self.byType[itemToAdd.type] || [];
        self.byType[itemToAdd.type].push(itemToAdd);
    };

    /** 
     * This removes entity from the scene. 
     */
    self.remove = function (itemToRemoveId)
    {
        var obj;
        if (typeof (item) === 'number')
        {
            obj = self.byId[itemToRemoveId];
            self.byType[obj.type].remove(obj);
            if (self.byType[obj.type].length === 0)
            {
                delete self.byType[obj.type];
            }
            delete self.byId[itemToRemoveId];
        } else
        {
            throw 'Expected a single ID';
        }
    };

    /** 
     * Given an object of the form
     * {
     *   added: [{..},{..}]
     *   removed: [] //entityIds
     * }
     * This updates the scene accordingly.
     */
    self.update = function (delta)
    {
        var i;
        if (delta.added)
        {
            for (i = 0; i < delta.added.length; ++i)
            {
                self.add(delta.added[i]);
            }
        }

        if (delta.removed)
        {
            for (i = 0; i < delta.removed.length; ++i)
            {
                self.remove(delta.removed[i]);
            }
        }
    };
};


///#source 1 1 /DataSource/DataSources/SivDataSource.js
/**
* Abstract base class for all data sources.
* @constructor
*/
/* @constructor */ function SivDataSource()
{
    this.frameCount = 0;

    this.interactionController = null;
    this.viewElementContainers = [];
    this.initialCameraParams = null;
    this.dataSourceName = null;
    this.worldConfiguration = null;
};

SivDataSource.prototype = {
    animationDurationMS: 250,

    getInitialCameraParams: function ()
    {
        return this.initialCameraParams;
    },

    /**
     * Gets the name of the current data source.
     * @return {string}
     */
    getDataSourceName: function ()
    {
        return this.dataSourceName;
    },

    /**
     * Gets the world configuration of the current data source.
     * @return {WorldConfiguration}
     */
    getWorldConfiguration: function ()
    {
        return this.worldConfiguration;
    },

    /**
     * Gets the list of view elements to be rendered for the specified LOD.
     * @param {int} lod
     * @return {array} List of ViewElements to be rendered.
     */
    getViewElements: function (lod)
    {
        return this.viewElementContainers[0].getGeometry().getViewElements(lod);
    },

    /**
     * Gets a specific view element by its viewElementId.
     * @param {ViewElementId} viewElementId viewElementId of the ViewElement to be retrieved.
     * @return {ViewElement} The requested ViewElement.
     */
    getViewElementById: function (viewElementId)
    {
        return this.viewElementContainers[0].getGeometry().getViewElementById(viewElementId);
    },

    /**
     * Gets the interaction controller to be used with the current data source.
     * @return {InteractionController}
     */
    getInteractionController: function ()
    {
        return this.interactionController;
    },

    /**
     * Gets the minimum lod for the current data source.
     * @return {int} Minimum lod
     */
    getMinimumLod: function ()
    {
        return this.viewElementContainers[0].getGeometry().getMinimumLod();
    },

    /**
     * Gets the maximum lod for the current data source.
     * @return {int} Maximum lod
     */
    getMaximumLod: function ()
    {
        return this.viewElementContainers[0].getGeometry().getMaximumLod();
    },
    /* @disable(0092) */
    tesselate: function (iViewElement, density, camera)
    {
        return this.tesselator.Tesselate(iViewElement, density, camera);
    },

    getElementRawTesselationDensity: function (iViewElement, camera)
    {
        return this.tesselator.GetRawDensity(iViewElement, camera);
    },
    /* @restore(0092) */
    
    covertToScreenSpace: function (worldPoly, worldTexture, viewportWidth, viewportHeight)
    {
        return this.viewElementContainers[0].getGeometry().covertToScreenSpace(worldPoly, worldTexture, viewportWidth, viewportHeight);
    }
};

Config.SivDataSourceExists = true;

///#source 1 1 /DataSource/DataSources/PhotosynthSivDataSource.js
function JsonDownloadFailedError(message, innerException)
{
    this.message = message;
    this.innerException = innerException;
}

function JsonMalformedError(message, innerException)
{
    this.message = message;
    this.innerException = innerException;
}

/**
* The PhotosynthSivDataSource is used to display PhotoSynth imagery in a cube viewer.
* @constructor
*/
/* @disable(0092) */
/* @disable(0136) */
/* @constructor */function PhotosynthSivDataSource()
{
    PhotosynthSivDataSource.__super.call(this);
    this.tesselator = new CachingTesselator(PanoramaElementTesselator);

    this.worldConfiguration = null;
    this.dataSourceName = 'panorama';
    this.faceNames = ['front', 'right', 'back', 'left', 'top', 'bottom'];
    this.jsonWrapper = 'http://photosynth.net/jsonproxy.psfx?jsonUrl={0}';
    this.jsonpWrapperParam = '&jsCallback={0}';
    this.outputMultiLODTiles = false;
    this.scanConvertSize = 20;
    this.prevViewTransform = null;
    this.prevProjectionTransform = null;
    this.initialCameraParams = {
        verticalFov: MathHelper.degreesToRadians(60),
        position: new Vector3(0, 0, 0),
        look: new Vector3(0, .3, -1),
        up: new Vector3(0, 1, 0)
    };
}

extend(PhotosynthSivDataSource, SivDataSource);

/**
* Creates the world geometry from the specified jsonUri and then calls the passed in callback.
* @param {string} jsonUri
* @param {function} callback
* @param {function} absoluteUrlFunction
* @param {boolean} useNewFormat temporary
* @param {boolean} useCorsXhr allows user to specify that they want to download the JSON using CORS XHR
*/
PhotosynthSivDataSource.prototype.createFromJsonUri = function (jsonUri, callback, absoluteUrlFunction, useNewFormat, useCorsXhr)
{
    if (!jsonUri)
    {
        callback(null, new JsonMalformedError("The specified jsonUri cannot be null or empty", null));
    }

    if (window.WinJS)
    {
        this.createFromFullUrl(jsonUri, callback, null, false, useCorsXhr);
    }
    else if (useNewFormat)
    {
        this.createFromFullUrl(jsonUri, callback, absoluteUrlFunction, useNewFormat, useCorsXhr);
    }
    else
    {
        this.createFromFullUrl(this.jsonWrapper.replace('{0}', encodeURIComponent(jsonUri)), callback, null, useNewFormat, useCorsXhr);
    }
};

/**
* Creates the world geometry from the specified url and then calls the passed in callback.
* @param {string} url
* @param {function} callback
* @param {function} absoluteUrlFunction
* @param {boolean} useNewFormat temporary
* @param {boolean} useCorsXhr allows user to specify that they want to download the JSON using CORS XHR
*/
/* @disable(0058) */
PhotosynthSivDataSource.prototype.createFromFullUrl = function (url, callback, absoluteUrlFunction, useNewFormat, useCorsXhr)
{
    var self = this;

    if (window.WinJS) 
    {
        //Windows app; allowed to download x-domain json but not allowed to add x-domain script tags
        WinJS.xhr({ url: url }).then(function (data)
        {
            var json = null;

            try
            {
                json = JSON.parse(data.responseText);
            }
            catch (ex)
            {
                callback(null, new JsonMalformedError("The data returned for the pano is not valid json", ex));
                return;
            }

            this.createFromJson(json, null);

            if (self.worldConfiguration == null)
            {
                callback(null, new JsonMalformedError("The data returned for the pano is valid json but is not valid panorama data", null));
            }
            else
            {
                callback(self.worldConfiguration);
            }
        },
        function (error)
        {
            callback(null, new JsonDownloadFailedError("The url specified for the pano json data did not return a 200 success", error));
        });
    }
    else if (useCorsXhr)
    {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr)
        {
            xhr.open('GET', url, true);
        }
        else if (window.XDomainRequest)
        {
            xhr = new XDomainRequest();
            xhr.open('GET', url);
        }
        else
        {
            callback(null, new Error("The browser does not support CORS"));
            return;
        }
        
        xhr.onload = function ()
        {
            try
            {
                var json = JSON.parse(xhr.responseText);

                self.createFromJson(json, absoluteUrlFunction);
                callback(self.getWorldConfiguration());
            }
            catch (ex)
            {
                callback(null, new JsonMalformedError("The data returned for the pano is not valid json", ex));
                return;
            }
        };

        xhr.onerror = function ()
        {
            callback(null, new JsonDownloadFailedError("The url specified for the pano json data did not return a 200 success", null));
        };

        xhr.send();
    }
    else
    {
        //Not a windows app; not allowed to download x-domain json but allowed to add x-domain script tags

        //TODO: add error handling logic for non-WinJS case

        //Pick a new name each time.  In most cases, it will be PhotosynthCallback0 unless there's currently an active download.
        //This should have good caching behaviors when hitting things through a cdn.
        var globalCallbackName = 'PhotosynthCallback';
        var i = 0;
        while (window[globalCallbackName + i] != null)
        {
            i++;
        }
        globalCallbackName = globalCallbackName + i;

        window[globalCallbackName] = function (json)
        {
            self.createFromJson(json, absoluteUrlFunction);
            callback(self.getWorldConfiguration());
            delete window[globalCallbackName];
        };

        if (useNewFormat)
        {
            Utils.addScriptElement(url);
        }
        else
        {
            Utils.addScriptElement(url + self.jsonpWrapperParam.replace('{0}', globalCallbackName));
        }
        
    }
};
/* @restore(0058) */

/**
* Creates the world geometry from the passed in JSON.
* @param {string} json
* @param {function} absoluteUrlFunction
*/
PhotosynthSivDataSource.prototype.createFromJson = function (json, absoluteUrlFunction)
{
    //Here's an overview of all photosynth-related formats
    // http://sharepoint/sites/ipe/AR/AR%20Team%20Wiki/Photosynth%20Data%20Formats.aspx
    
    try
    {
        var author;
        var attributionUrl;
        var licenseUrl;
        var faceName;
        var face;
        var clip;

        if (json._json_synth && json._json_synth >= 1.01)
        {
            //Photosynth Panorama
            // http://sharepoint/sites/ipe/AR/Shared%20Documents/Human%20Scale/ICE%20Panorama%20Format.docx
            // http://micropedia/Pages/Photosynth%20JSON%20representation.aspx

            //Note: The format allows for short and long names for some elements.
            //      In practice only the short names are used so that's all that's supported here at the current time.

            var root, propertyName;

            //there's only one element in json.l, and the name of it is the cid of the pano
            for (propertyName in json.l)
            {
                if (json.l.hasOwnProperty(propertyName))
                {
                    root = json.l[propertyName];
                    break;
                }
            }

            var coordSystem = root.x[0];
            var cubemap = coordSystem.cubemaps[0];
            var bounds = cubemap.field_of_view_bounds;
            var projector = coordSystem.r[0];
            var rotationNode = projector.j;
            var startRotationNode = projector.start_relative_rotation;
            var startingPitch = 0;
            var startingHeading = 0;

            author = root.b;
            attributionUrl = root.attribution_url;
            licenseUrl = root.c;

            if (startRotationNode != null)
            {
                //calculate initial look direction
                var lookVector = new Vector3(0, 0, 1);
                var rotation = GraphicsHelper.parseQuaternion(rotationNode[4], rotationNode[5], rotationNode[6]);
                var startRelativeRotation = GraphicsHelper.parseQuaternion(startRotationNode[0], startRotationNode[1], startRotationNode[2]);
                var combinedRotations = rotation.multiply(startRelativeRotation);
                var startVector = combinedRotations.transform(lookVector);

                startingPitch = MathHelper.halfPI - Math.acos(startVector.y);
                startingHeading = Math.atan2(startVector.z, startVector.x);
            }
            
            var highlights = null;
            if (root.highlight_map && root.highlight_map.default_highlight)
            {
                highlights = root.highlight_map.default_highlight;
            }

            this.worldConfiguration = {
                id: 'panorama' + propertyName,
                type: 'panorama',
                source: {
                    'attribution': {
                        'author': author,
                        'attributionUrl': attributionUrl,
                        'licenseUrl': licenseUrl
                    },
                    'dimension': 0, //set to zero initially, then get the max from the cube faces below
                    'tileSize': 254,
                    'tileOverlap': 1,
                    'tileBorder': 1,
                    'minimumLod': 8,
                    'bounds': {
                        'left': MathHelper.degreesToRadians(bounds[0]),
                        'right': MathHelper.degreesToRadians(bounds[1]),
                        'top': MathHelper.degreesToRadians(bounds[3]),
                        'bottom': MathHelper.degreesToRadians(bounds[2])
                    },
                    'startingPitch': startingPitch,
                    'startingHeading': startingHeading,
                    'projectorAspectRatio': 1,
                    'projectorFocalLength': 0.5,
                    'highlights': highlights
                }
            };
            
            for (var i = 0; i < this.faceNames.length; i++)
            {
                faceName = this.faceNames[i];
                face = cubemap[faceName];
                if (face != null)
                {
                    this.worldConfiguration.source[faceName + 'Face'] = {
                        tileSource: (new PhotosynthPolygonTextureSource(face.u)).getTileUrl,
                        //TODO: This assumes a single loop of 4 vertices.  Technically the format allows arbitrary loops, but in practice it's not used that way.
                        clip: face.clip.vertices
                    };
                    this.worldConfiguration.source.dimension = Math.max(this.worldConfiguration.source.dimension, face.d[0], face.d[1]);
                }
            }
        }
        else if (json.cubemap_json_version < 2.0) // We only support 1.x for now.
        {
            // Partner Panorama
            // http://sharepoint/sites/photosynth/bluepano/File%20Format/DotPano%20File%20Format%20Spec.docx

            //If null or undefined, defaults to 1.  Only 0 if explicitly set to false.
            tileOverlap = (json.tile_overlap_borders === false) ? 0 : 1;
            var faceSize = json.face_size;

            this.worldConfiguration = {
                id: 'panorama',
                type: 'panorama',
                source: {
                    'dimension': faceSize, // Set to zero initially, then get the max from the cube faces below.
                    'tileSize': json.tile_size || 510, // Default to 510 unless otherwise specified per spec.
                    'tileOverlap': tileOverlap,
                    'tileBorder': tileOverlap,
                    'minimumLod': Math.ceil(Math.log(json.tile_size / Math.LN2)), // Default values here, in case they're not specified in the data.
                    'bounds': { // Default values here, in case they're not specified.
                        'left': 0,
                        'right': MathHelper.twoPI,
                        'top': MathHelper.halfPI,
                        'bottom': -MathHelper.halfPI
                    },
                    'startingPitch': 0,
                    'startingHeading': 0,
                    'projectorAspectRatio': 1,
                    'projectorFocalLength': 0.5
                }
            };

            if (json.field_of_view_bounds)
            {
                this.worldConfiguration.source.bounds = {
                    'left': MathHelper.degreesToRadians(json.field_of_view_bounds[0]),
                    'right': MathHelper.degreesToRadians(json.field_of_view_bounds[1]),
                    'bottom': MathHelper.degreesToRadians(json.field_of_view_bounds[2]),
                    'top': MathHelper.degreesToRadians(json.field_of_view_bounds[3])
                };
            }

            if (json.initial_look_direction)
            {
                this.worldConfiguration.source.startingPitch = MathHelper.degreesToRadians(json.initial_look_direction[0]);
                this.worldConfiguration.source.startingHeading = MathHelper.degreesToRadians(json.initial_look_direction[1]);
            }

            if (json.orientation)
            {
                this.worldConfiguration.source.orientation = {};
                this.worldConfiguration.source.orientation.roll = json.orientation[0];
                this.worldConfiguration.source.orientation.pitch = json.orientation[1];

                // If heading isn't included then default to 0.
                this.worldConfiguration.source.orientation.heading = json.orientation[2] || 0;
            }

            this.worldConfiguration.source.faceSize = faceSize;
            this.worldConfiguration.source.imageContentType = json.image_content_type || 'image/jpeg';
            this.worldConfiguration.source.imageExtension = json.image_extension || 'jpg';

            // Default to true unless explicitly set to false.
            this.worldConfiguration.source.hasAtlas = json.has_atlas === false ? false : true;

            for (var k = 0; k < this.faceNames.length; k++)
            {
                faceName = this.faceNames[k];
                face = json[faceName];
                if (face != null)
                {
                    if (face.tile_boundaries)
                    {
                        var tileBoundaries = face.tile_boundaries;
                        clip = [
                            tileBoundaries.left, tileBoundaries.top,
                            tileBoundaries.left, tileBoundaries.bottom,
                            tileBoundaries.right, tileBoundaries.bottom,
                            tileBoundaries.right, tileBoundaries.top
                        ];
                    }
                    else
                    {
                        clip = [
                            0, 0,
                            0, faceSize,
                            faceSize, faceSize,
                            faceSize, 0
                        ];
                    }
                    
                    this.worldConfiguration.source[faceName + 'Face'] = {
                        // The new pano format uses "formats/cubemap" as the start of the relative path.
                        tileSource: (new PhotosynthPolygonTextureSourceNewFormat(absoluteUrlFunction, 'formats/cubemap/' + faceName)).getTileUrl,
                        //TODO: This assumes a single loop of 4 vertices.  Technically the format allows arbitrary loops, but in practice it's not used that way.
                        clip: clip
                    };

                    this.worldConfiguration.source.maximumLod = Math.ceil(Math.log(this.worldConfiguration.source.faceSize) / Math.LN2);
                    this.worldConfiguration.source.minimumLod = Math.ceil(Math.log(this.worldConfiguration.source.tileSize) / Math.LN2);
                }
            }
        }
        else if (json.json_pano || json.panorama_json_version)
        {
            //Partner Panorama
            // http://sharepoint/sites/IPE/AR/Shared%20Documents/PartnerPanoJson.docx

            //If null or undefined, defaults to 1.  Only 0 if explicitly set to false.
            var tileOverlap = (json.tile_overlap_borders === false) ? 0 : 1;

            author = json.author;

            /* @disable(0053) */
            if (json.attribution_uri_format_string)
            {
                attributionUrl = Utils.partialDotNetStringFormat(json.attribution_uri_format_string, 0, 0);
            }
            /* @restore(0053) */

            licenseUrl = null; //Always mark partner panoramas as copyright.
            var publisher = json.publisher;

            this.worldConfiguration = {
                id: 'panorama' + propertyName,
                type: 'panorama',
                source: {
                    'attribution': {
                        'author': author,
                        'attributionUrl': attributionUrl,
                        'licenseUrl': licenseUrl,
                        'publisher': publisher
                    },
                    'dimension': 0, //set to zero initially, then get the max from the cube faces below
                    'tileSize': json.tile_size,
                    'tileOverlap': tileOverlap,
                    'tileBorder': tileOverlap,
                    'minimumLod': Math.ceil(Math.log(json.tile_size / Math.LN2)), //default values here, in case they're not specified in the data
                    'bounds': { //default values here, in case they're not specified
                        'left': 0,
                        'right': MathHelper.twoPI,
                        'top': MathHelper.halfPI,
                        'bottom': -MathHelper.halfPI
                    },
                    'startingPitch': 0,
                    'startingHeading': 0,
                    'projectorAspectRatio': 1,
                    'projectorFocalLength': 0.5
                }
            };

            if (json.field_of_view_bounds)
            {
                this.worldConfiguration.source.bounds = {
                    'left': MathHelper.degreesToRadians(json.field_of_view_bounds[0]),
                    'right': MathHelper.degreesToRadians(json.field_of_view_bounds[1]),
                    'bottom': MathHelper.degreesToRadians(json.field_of_view_bounds[2]),
                    'top': MathHelper.degreesToRadians(json.field_of_view_bounds[3])
                };
            }

            if (json.initial_look_direction)
            {
                this.worldConfiguration.source.startingPitch = MathHelper.degreesToRadians(json.initial_look_direction[0]);
                this.worldConfiguration.source.startingHeading = MathHelper.degreesToRadians(json.initial_look_direction[1]);
            }

            for (var j = 0; j < this.faceNames.length; j++)
            {
                faceName = this.faceNames[j];
                face = json[faceName];
                if (face != null)
                {
                    if (face.clip && face.clip.vertices)
                    {
                        clip = face.clip.vertices;
                    }
                    else
                    {
                        clip = [
                        0, 0,
                        0, face.dimensions[1],
                        face.dimensions[0], face.dimensions[1],
                        face.dimensions[0], 0
                        ];
                    }

                    var tileSourceToUse;

                    if (json.panorama_json_version)
                    {
                        tileSourceToUse = (new PhotosynthPolygonTextureSourceNewFormat(absoluteUrlFunction, faceName)).getTileUrl;
                    }
                    else
                    {
                        tileSourceToUse = (new PartnerPolygonTextureSource(face.tile_image_uri_format_string, face.dimensions[0], face.dimensions[1], json.tile_size, face.finest_lod, face.number_of_lods)).getTileUrl;
                    }

                    this.worldConfiguration.source[faceName + 'Face'] = {
                        tileSource: tileSourceToUse,
                        //TODO: This assumes a single loop of 4 vertices.  Technically the format allows arbitrary loops, but in practice it's not used that way.
                        clip: clip
                    };

                    this.worldConfiguration.source.dimension = Math.max(this.worldConfiguration.source.dimension, face.dimensions[0], face.dimensions[1]);
                    this.worldConfiguration.source.minimumLod = Math.ceil(Math.log(this.worldConfiguration.source.tileSize) / Math.LN2);
                }
            }
        }

        this.viewElementContainers.push(new PhotosynthCubeViewElementContainer(this.worldConfiguration));
        this._minimumLod = this.worldConfiguration.source.minimumLod;
        this._maximumLod = this.worldConfiguration.source.maximumLod || MathHelper.ceilLog2(this.worldConfiguration.source.dimension);
        this.baseImageWidth = this.baseImageHeight = this.worldConfiguration.source.dimension;
        this.tileHeight = this.tileWidth = this.worldConfiguration.source.tileSize;
    }
    catch (e)
    {
        //If the data isn't valid, an exception will get thrown.  Just return null to indicate parsing failure.
        if (window.console)
        {
            Utils.log(e);
        }
    }
};

/*
 * Initialize Camera Controller.
 */
PhotosynthSivDataSource.prototype.createController = function (worldConfigurationSource, camera, cameraParameters)
{
    var minFOV = null;

    if (worldConfigurationSource)
    {
        minFOV = GraphicsHelper.calculateFovAtTexelToPixelRatio(GraphicsHelper._cubeSide,
                                                                worldConfigurationSource.dimension,
                                                                camera.getViewport().getHeight(),
                                                                1.1); // Arbitrary texel/pixel ratio that "feels" good.
    }

    this.interactionController = new RotationalFixedPositionInteractionController(camera, null, null, null, minFOV);

    if (worldConfigurationSource)
    {
        //TODO: Ideally we'd do something smart for multiple cubes.
        if (worldConfigurationSource.startingPitch != undefined)
        {
            this.interactionController.setPitchAndHeading(worldConfigurationSource.startingPitch,
                                                          worldConfigurationSource.startingHeading,
                                                          null);
        }

        this.interactionController.setBounds(worldConfigurationSource.bounds);
        this.interactionController.setDimension(worldConfigurationSource.dimension);
        this.interactionController.setVerticalFov(MathHelper.degreesToRadians(80), null);
    }
    return this.interactionController;
};
/* @restore(0136) */
/* @restore(0092) */

///#source 1 1 /DataSource/DataSources/StreetsideSivDataSource.js
/**
* The StreetsideSivDataSource is used to display StreetSide imagery in a cube viewer.
* @constructor
*/
/* @disable(0092) */
/* @disable(0146) */
/* @constructor */function StreetsideSivDataSource(urlFormat, bubbleId, startingHeading, startingPitch)
{
    if (!urlFormat)
    {
        throw "urlFormat cannot be null or empty";
    }

    if (!bubbleId)
    {
        throw "bubbleId must be specified";
    }

    StreetsideSivDataSource.__super.call(this);
    this.tesselator = new CachingTesselator(Tesselator);

    var faceNames = ['frontFace', 'rightFace', 'backFace', 'leftFace', 'topFace', 'bottomFace'];
    var faceQuadkeys = ['01', '02', '03', '10', '11', '12'];
    var subdomainCount = 4;

    this.dataSourceName = 'streetsidePanorama';
    this.interactionController = null;
    this.worldConfiguration = {
         id: 'streetsideCube' + bubbleId,
         type: 'streetsidePanorama',
         source: {
            'dimension': 2032,
            'tileSize': 254,
            'tileOverlap': 1,
            'tileBorder': 1,
            'minimumLod': 8,
            'bounds': {
                'left': -3.141592653589793,
                'right': 3.141592653589793,
                'top': -1.5707963267948966,
                'bottom': 1.5707963267948966
            },
            'startingPitch': startingPitch || 0,
            'startingHeading': startingHeading || 0,
            'projectorAspectRatio': 1,
            'projectorFocalLength': 0.5
        }
    };

    this.initialCameraParams = this.createCameraParameters(MathHelper.degreesToRadians(0.07), MathHelper.degreesToRadians(-10.8), MathHelper.degreesToRadians(238.98999999999998), null);

    for (var i = 0; i < faceNames.length; i++)
    {
        var faceName = faceNames[i];
        var faceQuadkey = bubbleId + faceQuadkeys[i];
        var faceUrlFormat = urlFormat.replace('{quadkey}', faceQuadkey + '{quadkey}');
        var faceDefaultSubdomain = i % subdomainCount;
        this.worldConfiguration.source[faceName] = {
            tileSource: (new StreetsidePolygonTextureSource(faceUrlFormat, faceDefaultSubdomain)).getTileUrl,
            clip: [
                0,
                0,
                0,
                2032,
                2032,
                2032,
                2032,
                0
            ]
        };
    }

    this.viewElementContainers.push(new StreetsideCubeViewElementContainer(this.worldConfiguration));
}

extend(StreetsideSivDataSource, SivDataSource);

StreetsideSivDataSource.prototype.animationDurationMS = 0;

StreetsideSivDataSource.prototype.createController = function (initialPanoramaEntities, camera, cameraParameters)
{
    this.interactionController = new CubeInteractionController(camera, cameraParameters, null, null);
    if (initialPanoramaEntities)
    {
        //TODO: Ideally we'd do something smart for multiple cubes.
        var cubeSource = initialPanoramaEntities;

        var pitch;
        var heading;

        if (cubeSource.startingPitch != undefined)
        {
            pitch = cubeSource.startingPitch;
        }
        if (cubeSource.startingHeading != undefined)
        {
            heading = cubeSource.startingHeading;
        }

        this.interactionController.setViewTarget(pitch, heading, null, false);
    }
    return this.interactionController;
};

StreetsideSivDataSource.prototype.createCameraParameters = function (roll, pitch, heading, verticalFov) 
{
    var rotationMatrix = this.createRotationMatrix(roll, pitch, heading);
    return {
        'verticalFov': verticalFov || MathHelper.degreesToRadians(80),
        'position': new Vector3(0, 0, 0),
        'look': rotationMatrix.transformVector3(new Vector3(0, 0, -1)),
        'up': rotationMatrix.transformVector3(new Vector3(0, 1, 0)),
        'side': rotationMatrix.transformVector3(new Vector3(1, 0, 0))
    };
};

StreetsideSivDataSource.prototype.createRotationMatrix = function (roll, pitch, heading) 
{
    var rollRotation = Matrix4X4.createRotationZ(roll);
    var pitchRotation = Matrix4X4.createRotationX(-pitch);
    var headingRotation = Matrix4X4.createRotationY(heading);
    return rollRotation.multiply(pitchRotation.multiply(headingRotation));
};

Config.StreetsidePanoramaExists = true;
/* @restore(0146) */
/* @restore(0092) */

///#source 1 1 /DataSource/ViewElements/TileId.js
/**
 * @fileoverview This contains utilies for computed tiled image level of detail.
 */

/* @constructor */function TileId (levelOfDetail, x, y, faceName)
{
    var self = this;
    self.x = x ? Math.floor(x) : 0;
    self.y = y ? Math.floor(y) : 0;
    self.levelOfDetail = levelOfDetail ? Math.floor(levelOfDetail) : 0;

    // FaceName is better for debugging purposes, but if its not supplied then a timestamp will do.
    self.faceName = faceName || new Date().getTime();

    self.id = self.faceName.toString().concat(self.levelOfDetail.toString(), "_", self.x.toString(), "_", self.y.toString());
};

TileId.prototype = {
    hasParent: function ()
    {
        return this.levelOfDetail > 0;
    },

    getParent: function ()
    {
        if (!this.hasParent())
        {
            throw '0 level does not have a parent';
        }
        return new TileId(this.levelOfDetail - 1, this.x >> 1, this.y >> 1, this.faceName);
    },

    getChildren: function ()
    {
        var childX = this.x << 1,
            childY = this.y << 1;
        return [new TileId(this.levelOfDetail + 1, childX, childY, this.faceName),
                new TileId(this.levelOfDetail + 1, childX + 1, childY, this.faceName),
                new TileId(this.levelOfDetail + 1, childX, childY + 1, this.faceName),
                new TileId(this.levelOfDetail + 1, childX + 1, childY + 1, this.faceName)];
    },

    isChildOf: function (other)
    {
        if (this.levelOfDetail < other.levelOfDetail)
        {
            return false;
        }

        var lodDifference = this.levelOfDetail - other.levelOfDetail;
        return (this.x >> lodDifference) === other.x &&
               (this.y >> lodDifference) === other.y;
    },

    equals: function (other)
    {
        return this.x === other.x && this.y === other.y && this.levelOfDetail === this.levelOfDetail;
    },

    toString: function ()
    {
        return '(' + this.x + ',' + this.y + ',' + this.levelOfDetail + ')';
    }
};
///#source 1 1 /DataSource/ViewElements/ViewElement.js
/**
 * A ViewElement contains all the information needed by the renderer to render a
 * polygon.
 * 
 */
function ViewElement(geometryPolygon, texturePolygon, faceTransform, textureSource, viewElementId, viewElementWidth, viewElementHeight)
{
    /**
     * A list of vertices representing the polygon contained by this ViewElement.
     */
    this.geometryPolygon = geometryPolygon;

    /**
     * A list of vertices representing the polygon of the texture to be applied to 
     * the geometry polygon contained by this ViewElement.
     */
    this.texturePolygon = texturePolygon;

    /**
     * The transformation to be applied to the geometry and texture polygons contained
     * by this ViewElement.
     */
    this.faceTransform = faceTransform;

    /**
     * The TextureSource to be used to retrieve tiles/images that will be applied
     * as the texture to the geometry polygon conainted by this ViewElement.
     */
    this.textureSource = textureSource;

    /**
     * The ViewElementId for this ViewElement.
     */
    this.viewElementId = viewElementId;

    /**
     * If viewElementWidth isn't specified then use the default value of 256 which is 
     * the streetside default value.
     */
    this.viewElementWidth = viewElementWidth || 256;

    /**
     * If viewElementHeight isn't specified then use the default value of 256 which is 
     * the streetside default value.
     */
    this.viewElementHeight = viewElementHeight || 256;
}
///#source 1 1 /DataSource/ViewElements/CubeViewElementContainer.js
/* @disable(0092) */
function CubeViewElementContainer(geometry)
{
    this._geometry = geometry;
}

CubeViewElementContainer.prototype.getGeometry = function ()
{
    return this._geometry;
};
/* @restore(0092) */

///#source 1 1 /DataSource/ViewElements/PhotosynthCubeViewElementContainer.js
function PhotosynthCubeViewElementContainer(worldConfiguration)
{
    CubeViewElementContainer.apply(this, new Array(new PhotosynthGeometry(worldConfiguration)));
}

extend(PhotosynthCubeViewElementContainer, CubeViewElementContainer);
///#source 1 1 /DataSource/ViewElements/StreetsideCubeViewElementContainer.js
function StreetsideCubeViewElementContainer(worldConfiguration)
{
    CubeViewElementContainer.apply(this, new Array(new StreetsideGeometry(worldConfiguration)));
}

extend(StreetsideCubeViewElementContainer, CubeViewElementContainer);
///#source 1 1 /DataSource/Geometry/Geometry.js
/**
 * Abstract base class for cube-based geometry such as StreetsideGeometry and 
 * PhotosynthGeometry. 
 * @param {WorldConfiguration}
 */
/* @disable(0092) */
function WorldGeometry(worldConfiguration)
{
    this._worldConfiguration = worldConfiguration;
    this._viewElementsByLod = [];
    this._minimumLod = worldConfiguration.source.minimumLod;
    this._maximumLod = worldConfiguration.source.maximumLod || MathHelper.ceilLog2(worldConfiguration.source.dimension);
    this._baseImageWidth = worldConfiguration.source.dimension;
    this._baseImageHeight = worldConfiguration.source.dimension;
    this._tileWidth = worldConfiguration.source.tileSize;
    this._tileHeight = worldConfiguration.source.tileSize;
    this._tileOverlap = worldConfiguration.source.tileOverlap;
    this._tileBorder = worldConfiguration.source.tileBorder;
    this._faceNames = ['frontFace', 'rightFace', 'backFace', 'leftFace', 'topFace', 'bottomFace'];
}

WorldGeometry.prototype = {

    /**
     * Gets the minimum LOD for the current WorldGeometry.
     * @return {int} The minimum level of detail (lod) supported by the current geometry.
     */
    getMinimumLod: function ()
    {
        return this._minimumLod;
    },

    /**
     * Gets the maximum LOD for the current WorldGeometry.
     * @return {int} The maximum level of detail (lod) supported by the current geometry.
     */
    getMaximumLod: function ()
    {
        return this._maximumLod;
    },

    /**
     * Gets the list of view elements to render for the current WorldGeometry.
     * @param {WorldGeometry} Reference to current instance.
     * @param {function} The function to call that contains the logic for generating view elements.
     * @param {int} Level of detail (lod).
     * @return {array} List of ViewElements to be rendered.
     */
    getViewElements: function (instance, logic, lod)
    {
        if (lod < instance._minimumLod || lod > instance._maximumLod)
        {
            return null;
        }

        if (instance._viewElementsByLod[lod])
        {
            // If we've already generated the view elements for the specified lod
            // then just return them.
            return instance._viewElementsByLod[lod];
        }

        instance._viewElementsByLod[lod] = {};

        for (var i = 0; i < instance._faceNames.length; i++)
        {
            var faceName = instance._faceNames[i];
            var faceTransform = getFaceTransform(1, faceName);

            // This shift is needed later as the base coords are centered around (0;0). Basically that 
            // moves the coords back to what is defined in the comment for _imageCornersBase.
            faceTransform = faceTransform.multiply(Matrix4X4.createTranslation(GraphicsHelper._halfCube, GraphicsHelper._halfCube, GraphicsHelper._halfCube));

            var source = instance._worldConfiguration.source;
            if (source && source[faceName])
            {
                var processorFunctionData = {
                    'faceTransform': faceTransform,
                    'tileSource': source[faceName].tileSource,
                    'lod': lod,
                    'faceName': faceName
                };

                logic(processorFunction, processorFunctionData);
            }
        }

        function processorFunction(elements, square, texelSquare, data, tileWidth, tileHeight)
        {
            var denormalizedTexelSquare = [];
            var numTexelSquareVertices = texelSquare.length;
            for (var i = 0; i < numTexelSquareVertices; i++)
            {
                var originalVertex = texelSquare[i];

                denormalizedTexelSquare.push(new Vector4(originalVertex.x * (tileWidth),
                                                        originalVertex.y * (tileHeight),
                                                        originalVertex.z,
                                                        originalVertex.w));
            }

            var viewElementId = new TileId(data.lod, square.x, square.y, data.faceName);
            var viewElement = new ViewElement(square,
                                              denormalizedTexelSquare,
                                              data.faceTransform,
                                              data.tileSource,
                                              viewElementId,
                                              tileWidth,
                                              tileHeight);

            elements[viewElementId.id] = viewElement;
        }

        /**
         * Gets the face transform for the current Geometry given the dimension and 
         * the name of the face.
         * @param {double}
         * @param {string} The name of the face to get the face transform for.
         * @return {Matrix4X4} The face transform matrix for the specified face.
         */
        function getFaceTransform(dimension, name)
        {
            var centerUnitImageBaseImageResolution = Matrix4X4.createTranslation(-0.5, -0.5, 0).multiply(Matrix4X4.createScale(1.0 / dimension, 1.0 / dimension, 1.0));
            var distanceFromCenterOfBubble = 0.5;
            var faceTransformBaseImageResolution;

            switch (name)
            {
                case 'frontFace':
                    faceTransformBaseImageResolution = Matrix4X4.createTranslation(0, 0, -distanceFromCenterOfBubble).multiply(centerUnitImageBaseImageResolution);
                    break;

                case 'backFace':
                    faceTransformBaseImageResolution = Matrix4X4.createTranslation(0, 0, distanceFromCenterOfBubble).multiply(Matrix4X4.createRotationY(MathHelper.degreesToRadians(180)).multiply(centerUnitImageBaseImageResolution));
                    break;

                case 'leftFace':
                    faceTransformBaseImageResolution = Matrix4X4.createTranslation(-distanceFromCenterOfBubble, 0, 0).multiply(Matrix4X4.createRotationY(MathHelper.degreesToRadians(90)).multiply(centerUnitImageBaseImageResolution));
                    break;

                case 'rightFace':
                    faceTransformBaseImageResolution = Matrix4X4.createTranslation(distanceFromCenterOfBubble, 0, 0).multiply(Matrix4X4.createRotationY(MathHelper.degreesToRadians(-90)).multiply(centerUnitImageBaseImageResolution));
                    break;

                case 'topFace':
                    faceTransformBaseImageResolution = Matrix4X4.createTranslation(0, distanceFromCenterOfBubble, 0).multiply(Matrix4X4.createRotationX(MathHelper.degreesToRadians(90)).multiply(centerUnitImageBaseImageResolution));
                    break;

                case 'bottomFace':
                    faceTransformBaseImageResolution = Matrix4X4.createTranslation(0, -distanceFromCenterOfBubble, 0).multiply(Matrix4X4.createRotationX(MathHelper.degreesToRadians(-90)).multiply(centerUnitImageBaseImageResolution));
                    break;
                default:
                    throw 'unexpected cube face name';
            }
            return faceTransformBaseImageResolution;
        }

        return instance._viewElementsByLod[lod];
    },
    
    /**
    * converts cube-space coordinate polygon to screen-space coordinates
    * TODO: I need smth more generic here like just convert the value, or a flag to omit arrays creation for tesselated cells.
    */
    covertToScreenSpace: function(worldPoly, worldTexture, viewportWidth, viewportHeight)
    {
        var numPolyVertices = worldPoly.length;
        var textureArray = worldTexture, //this is for performance intersecting in the culler method.
            screenArray = new Array(numPolyVertices); //this is for performance calculating poly's area.

        var halfCube = GraphicsHelper._halfCube;
        //After carrying out the matrix multiplication, the homogeneous component w will, in general, not be equal to 1. 
        //Therefore, to map back into the real plane we must perform the homogeneous divide or perspective divide by dividing each component by w.

        for (var k = 0; k < numPolyVertices; ++k)
        {
            //After we've clipped we don't use W (or Z for that matter).			
            var screenPolygonVertice = worldPoly[k];
            var wc = screenPolygonVertice.w;

            //calculate back to vieport. See Panorama.getFaceTransform() to get the *0.5+0.5 magic.
            screenPolygonVertice.x = ((screenPolygonVertice.x / wc) * halfCube + halfCube) * viewportWidth;
            screenPolygonVertice.y = viewportHeight - ((screenPolygonVertice.y / wc) * halfCube + halfCube) * viewportHeight;
            screenPolygonVertice.z = screenPolygonVertice.z / wc;
            //screenPolygonVertice.w = 1.0;

            screenArray[k] = screenPolygonVertice;
        }

        return new ScreenGeometry(screenArray, textureArray);

    }
};
/* @restore(0092) */

///#source 1 1 /DataSource/Geometry/PhotosynthGeometry.js
/**
 * Photosynth-specific geometry.
 * @param {WorldConfiguration}
 */
/* @disable(0092) */
function PhotosynthGeometry(worldConfiguration)
{
    WorldGeometry.apply(this, arguments);
    var self = this;

    /**
     * Gets the list of view elements to render for the current Geometry.
     * @param {int} Level of detail (lod).
     * @return {array} List of ViewElements to be rendered.
     */
    this.getViewElements = function (lod)
    {
        return this.constructor.superClass.getViewElements(self, getViewElementsLogic, lod);
    };

    /**
     * Gets a specific view element by its viewElementId
     * @param {ViewElementId} The viewElementId of the ViewElement to be retrieved.
     * @return {ViewElement} The requested ViewElement..
     */
    /* @disable(0055) */
    this.getViewElementById = function (viewElementId)
    {
        if (viewElementId != null)
        {
            var viewElements = this.constructor.superClass.getViewElements(self, getViewElementsLogic, viewElementId.levelOfDetail);

            if (viewElements != null)
            {
                return viewElements[viewElementId.id];
            }
        }

        return null;
    };
    /* @restore(0055) */
    
    function getViewElementsLogic(processorFunction, processorFunctionData)
    {
        getViewElementsPerFace(self._worldConfiguration.source[processorFunctionData.faceName],
                               GraphicsHelper.cubeSideBase,
                               processorFunctionData.lod,
                               self._viewElementsByLod[processorFunctionData.lod],
                               self._tileWidth,
                               self._tileHeight,
                               self._baseImageWidth,
                               self._baseImageHeight,
                               self._maximumLod,
                               processorFunction,
                               processorFunctionData);
    };

    /**
     * Generates all the view elements for the specified cube face.
     *
     * @param {ISivDataSource} source - the dataSource object that has to contain the 'clip' property of the cube face. Function will not generate any elements which are _completely_ outside the clip region.
     * @param {array} cubeFace - the array of 4 {Vector4} vertices, forming the cube face. 
     * Next vertive vertice layout is expected. Other vetice layouts might not be supported
     *                +y  
     *      W         ^
     *  1-------2     |->+x   tile addressing is as follows |0,0|1,0|2,0|...
     *  |       |                                           |0,1|1,1|2,1|...
     *  |       |H                                          |0,2|1,2|2,2|...  
     *  |       |                                             .   .   .
     *  0-------3                                             .   .   . |n,n|
     * @param {int} lod                        - the numerical value of LOD we want this cube face to be split to.
     * @param {object} splitTiles              - the object to hold the resulting tiles.
     * @param {int} tileWidth                  - width of the texture space tile    
     * @param {int} tileHeight                 - height of the texture space tile    
     * @param {int} baseImageWidth             - width of the cube face in texture space at maximum LOD  
     * @param {int} baseImageHeight            - height of the cube face in texture space at maximum LOD  
     * @param {int} maximumLod                 - the maximum LOD this cube face can be rendered at
     * @param {function} processorFunction     - the function to use for the final generated tile
     * @param {function} processorFunctionData - the data to use for the final generated tile
     *
     * @return {void}
     */
    function getViewElementsPerFace(source,
                                    cubeFace,
                                    lod,
                                    splitTiles,
                                    tileWidth,
                                    tileHeight,
                                    baseImageWidth,
                                    baseImageHeight,
                                    maximumLod,
                                    processorFunction,
                                    processorFunctionData)
    {
        var startVertexX = cubeFace[0].x;
        var startVertexY = cubeFace[0].y;
        var startVertexZ = cubeFace[0].z;
        var startVertexW = cubeFace[0].w;

        //calculate the width of the cube face in image space at current lod.    
        var highestLodDiff = Math.pow(2, maximumLod - lod);
        var cubeSide = GraphicsHelper._cubeSide;

        //baseImageWidth is the width at the fines LOD. each LOD halves the size.
        var baseWidthAtLod = baseImageWidth / highestLodDiff;
        var baseHeightAtLod = baseImageHeight / highestLodDiff;

        //calculate the clip region in current LOD and normalize it to [0, cubeSide] x [0, cubeSide]
        //clip is usually in the system coordinates where Y is pointing down and polygon starts from the upper-left point like
        //               
        //     W         
        // 0-------3     |-->+x   
        // |       |     |       
        // |       |H    v +y   
        // |       |             
        // 1-------2         
        //

        var normalizedClipRegion = [];
        var clipForFace = source.clip;

        // clipForFace is a list of numbers that represent the x's and y's for each clip vertex. They 
        // are in the following format:
        // [0,128,0,992,1056,992,1056,128]
        // The evens are x values and the odds are y values. These need to be normalized and returned
        // as a list of Vector2's.
        var numVertices = clipForFace.length;
        
        if (numVertices % 2 != 0) 
        {
            throw 'The clip region defined for the current face is invalid.';
        }
        
        var endVertexY = cubeFace[1].y;
        for (var k = 0; k < numVertices; k += 2)
        {
            var vertexX = clipForFace[k];
            var vertexY = clipForFace[k + 1];
            normalizedClipRegion.push(new Vector2(startVertexX + (vertexX * cubeSide) / baseImageWidth, 
                                                  endVertexY - (vertexY * cubeSide) / baseImageHeight));
        }

        //now that we have the total width - we can calculate the number if tiles. We take the ceil because we expect a border tile
        var numberOfTilesForCurrentLodW = Math.ceil(baseWidthAtLod / tileWidth);
        var numberOfTilesForCurrentLodH = Math.ceil(baseHeightAtLod / tileHeight);

        var borderTileWidth = 0,
            borderTileHeight = 0,
            tileWidthAdvance = 1,
            tileHeightAdvance = 1;

        if (numberOfTilesForCurrentLodW > 1)
        {
            // If there are more than 1 tiles we need to calculate the width and height of the border tiles.
            borderTileWidth = Math.floor(baseWidthAtLod - tileWidth * (numberOfTilesForCurrentLodW - 1));
            borderTileHeight = Math.floor(baseHeightAtLod - tileHeight * (numberOfTilesForCurrentLodH - 1));

            tileWidthAdvance = cubeSide * (tileWidth / baseWidthAtLod);
            tileHeightAdvance = cubeSide * (tileHeight / baseHeightAtLod);
        }

        // Take care of inaccurate javascript math
        var hasBorderTileW = !MathHelper.isZero(borderTileWidth),
            hasBorderTileH = hasBorderTileW;

        if (!hasBorderTileW && numberOfTilesForCurrentLodW > 1)
        {
            numberOfTilesForCurrentLodW--;
            numberOfTilesForCurrentLodH--;
        }

        //this implies that cube face is not skewed. assuming next vertice layout
        //               +y  
        //     W         ^
        // 1-------2     |->+x   tile addressing is as follows |0,0|1,0|2,0|...
        // |       |                                           |0,1|1,1|2,1|...
        // |       |H                                          |0,2|1,2|2,2|...  
        // |       |                                             .   .   .
        // 0-------3                                             .   .   . |n,n|
        //         
        var numberOfFullTilesW = numberOfTilesForCurrentLodW - hasBorderTileW;
        var numberOfFullTilesH = numberOfTilesForCurrentLodH - hasBorderTileH;

        //if previous checks yielded same lengths for height and width than the advance should be the same too.
        if (tileWidthAdvance != tileHeightAdvance) debugger;

        //see function doc for more information
        var geometryColumns = CalculateTilesForSide(startVertexX, cubeFace[2].x, numberOfFullTilesW, tileWidthAdvance, hasBorderTileW);
        var geometryRows = CalculateTilesForSide(cubeFace[1].y, startVertexY, numberOfFullTilesH, -tileHeightAdvance, hasBorderTileH);

        var denormalizedBorderTileWidth = 0,
            denormalizedBorderTileHeight = 0;

        if (hasBorderTileW)
        {
            denormalizedBorderTileWidth = DetermineDenormalizedTileBorderSize(geometryColumns, baseWidthAtLod, tileWidth);
            denormalizedBorderTileHeight = DetermineDenormalizedTileBorderSize(geometryRows, baseHeightAtLod, tileHeight);
        }

        //clip generated full geometry against the clip region in texel space       
        for (var i = 0; i < numberOfTilesForCurrentLodW; i++)
        {
            for (var j = 0; j < numberOfTilesForCurrentLodH; j++)
            {
                var columnI = geometryColumns[i],
                    columnIPlus1 = geometryColumns[i + 1],
                    rowJ = geometryRows[j],
                    rowJPlus1 = geometryRows[j + 1];

                var tile = [new Vector4(columnI, rowJPlus1, startVertexZ, startVertexW),
                            new Vector4(columnI, rowJ, startVertexZ, startVertexW),
                            new Vector4(columnIPlus1, rowJ, startVertexZ, startVertexW),
                            new Vector4(columnIPlus1, rowJPlus1, startVertexZ, startVertexW)
                ];

                if (GraphicsHelper.AreIntersecting(tile, normalizedClipRegion))
                {
                    tile.x = i;
                    tile.y = j;

                    var actualTileWidth = baseWidthAtLod,
                        actualTileHeight = baseHeightAtLod;

                    if (hasBorderTileW)
                    {
                        // Sometimes the last tile in the list is a "border" tile which may 
                        // not be square. In this case we may need to set the tile height 
                        // and width in order to make the tile fit.
                        actualTileWidth = GetActualTileSizeFromIndex(i == numberOfTilesForCurrentLodW - 1, tileWidth, denormalizedBorderTileWidth);
                        actualTileHeight = GetActualTileSizeFromIndex(j == numberOfTilesForCurrentLodH - 1, tileHeight, denormalizedBorderTileHeight);
                    }

                    processorFunction(splitTiles,
                                        tile,
                                        GraphicsHelper._texelCornersBase,
                                        processorFunctionData,
                                        actualTileWidth,
                                        actualTileHeight);
                }
            }
        }

        return;

        function GetActualTileSizeFromIndex(isLastTileInArray, tileDimensionSize, denormalizedTileDimensionSize)
        {
            if (isLastTileInArray && tileDimensionSize != denormalizedTileDimensionSize)
            {
                return denormalizedTileDimensionSize;
            }

            return tileDimensionSize;
        }

        function DetermineDenormalizedTileBorderSize(geometryDimensionArray, baseImageDimensionSize, dimensionSize)
        {
            var normalizedSize = 0;
            var denormalizedBorderTileSize = dimensionSize;
            for (var i = 1, numColumns = geometryDimensionArray.length; i < numColumns; i++)
            {
                var currentNormalizedSize = geometryDimensionArray[i] - geometryDimensionArray[i - 1];
                if (normalizedSize == 0)
                {
                    normalizedSize = currentNormalizedSize;
                }
                else if (normalizedSize != currentNormalizedSize)
                {
                    denormalizedBorderTileSize = Math.abs(baseImageDimensionSize * currentNormalizedSize);
                }
            }

            return denormalizedBorderTileSize;
        }

        /**
        * This would calculate tile positions for the side. Merely split the segment [{sideStart}, {sideEnd}] into [start,point, point, point, ..., point, end] array.
        *
        * @param {float} sideStart       - the start of the segment 
        * @param {float} sideEnd         - the end of the segment 
        * @param {int} numberOfFullTiles - total number of points in the segment including {sideStart}
        * @param {float} tileAdvanceLen  - the length to add to the current point when splitting the segment
        * @param {bool} hasBorderTile    - flag to skip calculation of the border tile.
        *
        * @return {array} [start,float, float, float, ..., float, end] array.
        */
        function CalculateTilesForSide(sideStart, sideEnd, numberOfFullTiles, tileAdvanceLen, hasBorderTile)
        {
            if (numberOfFullTiles == 1 && !hasBorderTile)
            {
                return [sideStart, sideStart + tileAdvanceLen];
            }

            var tileIndexes = [sideStart];

            for (var i = 1, j = 0; i <= numberOfFullTiles; i++, j++)
            {
                tileIndexes[i] = tileIndexes[j] + tileAdvanceLen;
            }

            if (hasBorderTile)
            {
                tileIndexes.push(sideEnd);//the border tile
            }

            return tileIndexes;
        }
    }
}

extend(PhotosynthGeometry, WorldGeometry);
/* @restore(0092) */

///#source 1 1 /DataSource/Geometry/StreetsideGeometry.js
/**
 * Streetside-specific geometry.
 * @param {WorldConfiguration}
 */
/* @disable(0092) */
function StreetsideGeometry(worldConfiguration)
{
    WorldGeometry.apply(this, arguments);
    var self = this;
    
/**
 * Gets the list of view elements to render for the current Geometry.
 * @param {int} Level of detail (lod).
 * @return {array} List of ViewElements to be rendered.
 */
    this.getViewElements = function (lod)
    {
        return this.constructor.superClass.getViewElements(self, getViewElementsLogic, lod);
    };

    /**
     * Gets a specific view element by its viewElementId
     * @param {ViewElementId} The viewElementId of the ViewElement to be retrieved.
     * @return {ViewElement} The requested ViewElement..
     */
    /* @disable(0055) */
    this.getViewElementById = function (viewElementId)
    {
        if (viewElementId != null)
        {
            var viewElements = this.constructor.superClass.getViewElements(self, getViewElementsLogic, viewElementId.levelOfDetail);

            if (viewElements != null)
            {
                return viewElements[viewElementId.id];
            }
        }

        return null;
    };
    /* @restore(0055) */

    function getViewElementsLogic(processorFunction, processorFunctionData)
    {
        GraphicsHelper.splitSquareRecursive(GraphicsHelper.cubeSideBase,
                                            null,
                                            processorFunctionData.lod - self._minimumLod,
                                            null,
                                            self._viewElementsByLod[processorFunctionData.lod],
                                            false,
                                            GraphicsHelper._texelCornersBase,
                                            processorFunction,
                                            processorFunctionData,
                                            self._tileWidth,
                                            self._tileHeight);
    };
}

extend(StreetsideGeometry, WorldGeometry);
/* @restore(0092) */
///#source 1 1 /DataSource/TextureSource/TextureSources/PhotosynthPolygonTextureSource.js
var PhotosynthPolygonTextureSource = function (baseUrl)
{
    this.getTileUrl = function (x, y, lod)
    {
        return baseUrl + lod + '/' + x + '_' + y + '.jpg';
    };
};

var PhotosynthPolygonTextureSourceNewFormat = function (absoluteUrlFunction, faceName)
{
    this.getTileUrl = function (x, y, lod)
    {
        /* @disable(0131) */
        return absoluteUrlFunction() + faceName + '/' + lod + '/' + x + '_' + y + '.jpg';
        /* @restore(0131) */
    };
};

///#source 1 1 /DataSource/TextureSource/TextureSources/PartnerPolygonTextureSource.js
/* @disable(0055) */
var PartnerPolygonTextureSource = function (tileImageUriFormatString, width, height, tileSize, finestLod, numberOfLods)
{
    var defaultFinestLod = Math.ceil(Math.log(Math.max(width, height)) / Math.LN2);
    var lodDelta = defaultFinestLod - finestLod;
    var singleTileLod = Math.ceil(Math.log(tileSize) / Math.LN2);

    var horizontalTileCountMultiplier = width / Math.pow(2, defaultFinestLod);
    var verticalTileCountMultiplier = height / Math.pow(2, defaultFinestLod);

    this.getTileUrl = function (x, y, lod)
    {
        var normalizedLod = lod - lodDelta;

        if (normalizedLod > finestLod || normalizedLod <= (finestLod - numberOfLods))
        {
            return null;
        }

        //determine number of tiles at this lod
        var numHorizontalTilesAtLod = Math.ceil(Math.pow(2, lod - singleTileLod) * horizontalTileCountMultiplier);
        var numVerticalTilesAtLod = Math.ceil(Math.pow(2, lod - singleTileLod) * verticalTileCountMultiplier);

        /* @disable(0053) */
        return Utils.partialDotNetStringFormat(tileImageUriFormatString, normalizedLod, x, y);
        /* @restore(0053) */
    };
};
/* @restore(0055) */

///#source 1 1 /DataSource/TextureSource/TextureSources/StreetsidePolygonTextureSource.js
/* @disable(0146) */
/* @disable(0055) */
function StreetsidePolygonTextureSource(urlFormat, defaultSubdomain)
{
    //var lodDelta = VectorMath.ceilLog2(tileWidth);
    var lodDelta = 8;
    this.getTileUrl = function (x, y, lod)
    {
        // translate the levelOfDetail to zoom
        // zoom level 0 represents a single tile, levelOfDetail = 0 represents a single pixel
        // so the translation is done by substracting the "levelOfDetail" of a single tile
        var zoom = lod - lodDelta;
        var quadTile = new TileId(zoom, x, y, null);

        if (QuadKey.isInBounds(quadTile))
        {
            var quadKey;
            var subdomain;
            if (quadTile.levelOfDetail === 0)
            {
                if (defaultSubdomain != null)
                {
                    quadKey = QuadKey.fromTileId(quadTile, true);
                    subdomain = defaultSubdomain;
                }
                else
                {
                    return null;
                }
            }
            else
            {
                quadKey = QuadKey.fromTileId(quadTile, false);
                subdomain = quadKey.charAt(quadKey.length - 1);
            }

            return urlFormat.replace('{quadkey}', quadKey).replace('{subdomain}', subdomain);
        }

        return null;
    };
}

var QuadKey = {
    /// returns the QuadKey that would represent given TileId
    fromTileId: function (tileId, allowZeroLod)
    {
        var minLod = 1;
        if (allowZeroLod)
        {
            minLod = 0;
        }
        //Debug.assert(tileId.levelOfDetail >= minLod && QuadKey.isInBounds(tileId), 'tileId is outside of quad pyramid bounds');

        var quadKey = '';
        var ix = tileId.x;
        var iy = tileId.y;
        for (var i = 0; i < tileId.levelOfDetail; i++)
        {
            quadKey = ((ix & 1) + 2 * (iy & 1)).toString() + quadKey;
            ix >>= 1;
            iy >>= 1;
        }
        return quadKey;
    },
    /// checks whether this tile is in QuadKey based pyramid bounds
    isInBounds: function (tileId)
    {
        if (tileId.x < 0 || tileId.y < 0)
        {
            return false;
        }
        var count = 1 << tileId.levelOfDetail;
        if (tileId.x >= count || tileId.y >= count)
        {
            return false;
        }
        return true;
    }
};
/* @restore(0055) */
/* @restore(0146) */

///#source 1 1 /Common/AttributionControlNoJQuery.js
/**
 * This is a simple control for showing image attribution 
 * with creative common copyrights. It surfaces links to those
 * licenses, if no attribution is set, nothing is visible.
 * @constructor
 * @param {HTMLElement}  parentDiv 
 */
/* @disable(0092) */
var AttributionControl = function(parentDiv) {
    var self = this;
    self.lastAttribution = null;



    //This control is layedout as follows
    // 
    // ---------------------------------------------------------------------------------------------------------------
    // |   ByIcon  | NC_icon  | ND_icon  | SA_Icon | PD_icon | Copyright_icon  |  Author Link Text - Publisher Text  |
    // ---------------------------------------------------------------------------------------------------------------
    //
    // Depending on license we going to toggle the visiblity of the icons. 
    // We also update links to point to the creative commons website
    //
    var layout = ['<div id="attributionControl" class="panoramaAttributionControl panoramaAttributionControlContainer" >',
                  '<a id="icon_anchor" class="panoramaAttributionControl">',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="by_icon"></div>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="nc_icon"></div>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="nd_icon"></div>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="sa_icon"></div>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="pd_icon"></div></a>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="copyright_icon"></div>',
                  '<a class="panoramaAttributionControl" id="authorTextAnchor" href=""><span class="panoramaAttributionControl panoramaAttributionControlText"  id="authorText"></span></a>',
                  '<span class="panoramaAttributionControl panoramaAttributionControlText"  id="authorTextNoAnchor"></span>',
                  '<span class="panoramaAttributionControl panoramaAttributionControlText" id="attributionDash">&ndash;</span>',
                  '<span id="publisherText"class="panoramaAttributionControl panoramaAttributionControlText" ></span>', 
                  '</div>'].join(' ');
    
    
    var domAttributePrefix = "$$$$";

    var div = document.createElement('div'); 
    parentDiv.appendChild(div);

    //if running in a win8 app, we need to set the innerHTML inside this method
    if (typeof MSApp == 'object' && MSApp.execUnsafeLocalFunction) {
        MSApp.execUnsafeLocalFunction(function () { div.innerHTML = layout; });
    }
    else {
        div.innerHTML = layout;
    }
    
    parentDiv.removeChild(div);
    var controlDiv = div.firstChild;
    parentDiv.appendChild(controlDiv);
                 
    // All of the code below should use jQuery instead of these mickymouse grade helpers.
    // However -- some partner teams don't want the dependency.
    var hide = function(element) {
        if(!element[domAttributePrefix + 'displayValue']) {
            var  oldValue = element.style.display || window.getComputedStyle(element, null).getPropertyValue('display');
            element[domAttributePrefix + 'displayValue'];
        }
        Utils.css(element, {display:'none'});        
    };

    var show = function(element) {
        var originalValue = element[domAttributePrefix + 'displayValue'] || ((element.tagName === 'A' || element.tagName === 'SPAN')? 'inline': 'inline-block');
        Utils.css(element, {display:originalValue});        
    };

    var qs = function(id, rootElement) {
        if(!rootElement) {
            rootElement = document;
        }
        return rootElement.querySelector(id);
    };

    var text = function(element, value) {
        element.innerHTML = value;        
    };

    Utils.css(controlDiv, {'display':'block'});
    hide(controlDiv);

    //We use these table to populate
    //the Creative Commons related icons and links.
    var allIcons = ['pd_icon', 'by_icon', 'sa_icon', 'nc_icon', 'nd_icon', 'copyright_icon'];

    var ccAttributionType = {
        publicDomain : {
            pattern:'/publicdomain/',
            text:'This work is identified as Public Domain.',
            url:'http://creativecommons.org/licenses/publicdomain/',
            iconsToShow: ['pd_icon']
        },
        by : {
            pattern:'/by/',
            text: 'This work is licensed to the public under the Creative Commons Attribution license.',
            url:'http://creativecommons.org/licenses/by/3.0/',
            iconsToShow: ['by_icon']
        },
        bySa : {
            pattern:'/by-sa/',
            text:'This work is licensed to the public under the Creative Commons Attribution-ShareAlike license.',
            url:'http://creativecommons.org/licenses/by-sa/3.0/',
            iconsToShow: ['by_icon','sa_icon']
        },
        byNd : {
            pattern:'/by-nd/',
            text:'This work is licensed to the public under the Creative Commons Attribution-NoDerivatives license.',
            url:'http://creativecommons.org/licenses/by-nd/3.0/',
            iconsToShow: ['by_icon','nd_icon']
        },
        byNc : {
            pattern:'/by-nc/',
            text:'This work is licensed to the public under the Creative Commons Attribution-Non-commercial license.',
            url:'http://creativecommons.org/licenses/by-nc/3.0/',
            iconsToShow: ['by_icon','nc_icon']
        },
        byNcSa : {
            pattern:'/by-nc-sa/',
            text: 'This work is licensed to the public under the Creative Commons Attribution-Non-commercial-ShareAlike license.',
            url:'http://creativecommons.org/licenses/by-nc-sa/3.0/',
            iconsToShow: ['by_icon','nc_icon','sa_icon']
        },
        byNcNd : {
            pattern:'/by-nc-nd/',
            text:'This work is licensed to the public under the Creative Commons Attribution-Non-commercial-NoDerivatives license.',
            url:'http://creativecommons.org/licenses/by-nc-nd/3.0/',
            iconsToShow: ['by_icon','nc_icon','nd_icon']
        },
        copyright: {
            pattern:'',
            text:'This work is copyrighted.',
            url:'',
            iconsToShow: ['copyright_icon']
        }
    };

    var hideUI = function() {
        hide(controlDiv);
    };

    var updateUI = function(attribution) {
        var k,
            i,
            icon, el,
            attributionType = ccAttributionType.copyright;

        hide(controlDiv);

        //Hide all text.
        el = qs('#publisherText', controlDiv);
        hide(el);
        text(el, '');
        
        el = qs('#authorText', controlDiv);
        hide(el);
        text(el, '');
        
        el = qs('#authorTextAnchor', controlDiv);
        hide(el);
        el.title = '';
        el.href = '';
        
        el = qs('#authorTextNoAnchor', controlDiv);
        hide(el);
        text(el, '');

        el = qs('#attributionDash', controlDiv);
        hide(el);

        //Hide all icons
        for(i = 0 ; i < allIcons.length; ++i) {
            el = qs('#'+allIcons[i], controlDiv);
            hide(el);
        }
        el = qs('#icon_anchor', controlDiv);
        el.href = '';
        el.title = '';

        for(k in ccAttributionType) if(ccAttributionType.hasOwnProperty(k)) {
            if(attribution &&
               attribution.licenseUrl && 
               attribution.licenseUrl.indexOf(ccAttributionType[k].pattern) != -1)  {
                attributionType = ccAttributionType[k];
                break;
            }
        }

        for(i = 0; i < attributionType.iconsToShow.length; ++i) {
            icon = attributionType.iconsToShow[i];
            el = qs('#' + icon, controlDiv);
            show(el);
        }
        el = qs('#icon_anchor', controlDiv);
        el.title = attributionType.text;
        el.href  = attributionType.url || attribution.attributionUrl;

        if(!attribution.author && attribution.publisher) {
            el = qs('#publisherText', controlDiv);
            hide(el);
            text(el, '');
            if(attribution.attributionUrl) {
                el = qs('#authorText', controlDiv);
                show(el);
                text(el, attribution.publisher);

                el = qs('#authorTextAnchor', controlDiv);
                show(el);
                el.href = attribution.attributionUrl;
                el.title = attribution.attributionUrl;
            } else {
                el = qs('#authorTextNoAnchor', controlDiv);
                show(el);
                text(el, attribution.publisher);
            }
        } else  {
            if(attribution.publisher) {
                el = qs('#publisherText', controlDiv);
                show(el);   
                text(el, attribution.publisher);
                el = qs('#attributionDash', controlDiv);
                show(el);
            } else {
                el = qs('#publisherText', controlDiv);
                hide(el);
                text(el, '');
            }
            if(attribution.author) {
                if(attribution.attributionUrl) {
                    el = qs('#authorText', controlDiv);
                    show(el);
                    text(el, attribution.author);
                    el = qs('#authorTextAnchor', controlDiv);
                    show(el);
                    el.href = attribution.attributionUrl;
                    el.title = attribution.attributionUrl;
                } else {
                    el = qs('#authorTextNoAnchor', controlDiv);
                    show(el);
                    text(el, attribution.author);
                }
            }
        }
        show(controlDiv);
    };

    /** 
     * This updates the attribution information
     * @param {{author:string, publisher:string,attributionUrl:string, licenseUrl:string}} attribution 
     */
    self.setAttribution = function(attribution) {
        if((self.lastAttribution != null &&
            attribution.author === self.lastAttribution.author &&
            attribution.publisher === self.lastAttribution.publisher &&
            attribution.attributionUrl === self.lastAttribution.attributionUrl &&
            attribution.licenseUrl === self.lastAttribution.licenseUrl) || 
            self.lastAttribution === null) {
            updateUI(attribution);
            self.lastAttribution = attribution;
        }
    };

    /**
     * clear the attribution UI state.
     */
    self.clearAttrubution = function() {
        self.lastAttribution = null;
        hideUI();
    };

    /** 
     * Removed the UI from the DOM and cleans up. 
     */
    self.dispose = function ()
    {
        if (controlDiv && controlDiv.parentNode)
        {
            controlDiv.parentNode.removeChild(controlDiv);
            controlDiv = null;
        }
    };
};
/* @restore(0092) */

///#source 1 1 /SharedImmersiveViewer.js
/**
* The SharedImmersiveViewer class is the main class for instantiating and
* interacting with a shared immersive viewer.
* @constructor
* @param {HTMLElement} parentDiv - The div element that will contain the viewer
*                                instance.
* @param {object} options - Specifies startup parameters:
*                              - dataSources: list of data sources to display
*                              - renderer: the type of renderer to use options
*                                include "css", "Canvas2D", "webgl"
*                              - cameraParameters (optional)
*                              - hideAttributions: true/false
*                              - attributionChanged (optional): function to 
*                                call when the attribution changes
*                              - backgroundColor
*                              - width: viewport width
*                              - height: viewport height
*                              - top: the top position of the viewer on the page
*                              - left: the left position of the viewer on the page
*/
/* @disable(0092) */
var SharedImmersiveViewer = function (parentDiv, viewerOptions)
{
    // Validate args first.
    if (!parentDiv) 
    {
        throw 'expected div argument';
    }

    var buttonType = 'button';
    
    // PRIVATE MEMBERS
    var self = this,
        options = viewerOptions || {},
        attributionChanged = options.attributionChanged || function () { },
        animating = true,
        rootElement = document.createElement('div'),
        eventCapturingElement = document.createElement('div'),
        requiresCORS = false,
        renderer = null,
        worldConfiguration = new WorldConfiguration(),
        unprocessedEvents = [],
        dataSources = [],
        activeDataSourceName = null,
        width = options.width || parentDiv.offsetWidth,
        height = options.height || parentDiv.offsetHeight,
        attributionControl = null,
        activeController = null,
        animationRequestID,

        // in order to be able to get close enough in the map case (still not
        // enough. TODO: dynamically manage near and far in MapCameraController)
        near = 0.00001,
        far = 4,

        viewport = new Viewport(width, height, near, far),
        camera = null,
        downloader = null,
        viewController = null,
        viewChangeEndEventDetails = null;

        //**** Disable interactive control buttons
        //// Default UI buttons for controlling map interaction.
        //zoomInButton = document.createElement(buttonType),
        //zoomOutButton = document.createElement(buttonType),
        //headingLeftButton = document.createElement(buttonType),
        //headingRightButton = document.createElement(buttonType),
        //pitchUpButton = document.createElement(buttonType),
        //pitchDownButton = document.createElement(buttonType),
        //cssForDefaultUI = document.createElement('style');

    _setDataSources();
    _setCssForElements(width, height);
    _setRenderer();
    _setWorldConfiguration();
    _setAttributions();

    // Only attach event handlers and wire up the DOM etc.. when we know we won't throw 
    // on renderer creation.
    parentDiv.appendChild(rootElement);
    parentDiv.appendChild(eventCapturingElement);

    //**** Disable interactive control buttons
    //_createDefaultControls();

    // Enable gesture handling.
    var gestureHelper = new QueuedGestureHelper(eventCapturingElement, function () { });
    gestureHelper.enable();

    downloader = new PriorityNetworkDownloader(requiresCORS, _tileDownloadFailed, options.tileDownloadSucceeded);

    var initialCameraParams = null;

    var numDataSources = dataSources.length;
    for (var index = 0; index < numDataSources; index++)
    {
        initialCameraParams = dataSources[index].getInitialCameraParams();
        break;
    }
    camera = new PerspectiveCamera(viewport, initialCameraParams);

    // ViewController relies on renderer and viewModel.
    viewController = new ViewController(renderer, dataSources, camera, downloader);

    //Give any initially loaded media a chance to override our default controller. 
    // Last one wins.
    _overrideDefaultControllerIfNecessary();

    DebugHelper.ResetFrameCount();

    // PUBLIC EVENTS

    /**
    * The viewChangeEvent fires per frame while the view is changing. Usage is
    * as follows:
    *
    *   viewer.viewChangeEvent.addEventListener(viewChangeEventHandlerFunction);
    *   viewer.viewChangeEvent.removeEventListener(viewChangeEventHandlerFunction);
    *
    * Event handler signature is: function viewChangeEventHandlerFunction(e)
    *
    * The "e" param is an object with "pitch", "heading" and "verticalFov" 
    * members.
    */
    this.viewChangeEvent = new Event();

    /**
    * The viewChangeEndEvent fires once when the view has stopped changing. Usage is
    * as follows:
    *
    *   viewer.viewChangeEndEvent.addEventListener(viewChangeEndEventHandlerFunction);
    *   viewer.viewChangeEndEvent.removeEventListener(viewChangeEndEventHandlerFunction);
    *
    * Event handler signature is: function viewChangeEndEventHandlerFunction(e)
    *
    * The "e" param is an object with "pitch", "heading" and "verticalFov" 
    * members.
    */
    this.viewChangeEndEvent = new Event();

    // PUBLIC METHODS

    /**
    * Destructor for the viewer. Disables event handlers and removes any 
    * HTML elements added by the viewer.
    */
    this.dispose = function ()
    { 
        gestureHelper.disable();
        if (rootElement.parentNode)
        {
            rootElement.parentNode.removeChild(rootElement);
        }
        if (eventCapturingElement.parentNode)
        {
            eventCapturingElement.parentNode.removeChild(eventCapturingElement);
        }
        if (attributionControl)
        {
            attributionControl.dispose();
        }
        animating = false;

        _detachInternalEventHandlers();

        /* @disable(0136) */
        cancelRequestAnimationFrame(animationRequestID);
        /* @restore(0136) */

        DebugHelper.dispose();
    };

    /**
    * Sets the viewport size.
    * @param {int} width
    * @param {int} height
    */
    this.setViewportSize = function (width, height)
    {
        Utils.css(rootElement, { width: width + 'px', height: height + 'px' });
        Utils.css(eventCapturingElement, { width: width + 'px', height: height + 'px' });
        renderer.setViewportSize(width, height);
        camera.setViewport(new Viewport(width, height, camera.getViewport().getNearDistance(), camera.getViewport().getFarDistance()));
        viewController.setViewChanged(true);

        if (activeController.setViewportSize)
        {
            activeController.setViewportSize(width, height);
        }
    };

    /**
    * Gets the size of the current viewport.
    * @return {Vector2}
    */
    this.getViewportSize = function ()
    {
        return new Vector2(camera.getViewport().getWidth(), camera.getViewport().getHeight());
    };

    /**
    * Gets the current pitch, heading and verticalFov (all in radians) in one call.
    * @return object
    */
    this.getView = function ()
    {
        return dataSources[activeDataSourceName].getInteractionController().getView();
    };

    /**
    * Sets the view.
    * @param {double} pitch In radians. Valid values are between 1.5707963267948966 (90 degrees in radians looking straight up) 
    * and -1.5707963267948966 (-90 degrees in radians looking straight down). Can be null.
    * @param {double} heading The heading the camera is facing in radians. Can be null.
    * @param {double} verticalFov The verticalFov of the camera. Can be null.
    * @param {bool} animate True to animate to the new view. Can be null.
    * @param {double} time The time in milliseconds for the desired view target to be hit. Can be null.
    */
    this.setView = function (pitch, heading, verticalFov, animate, time)
    {
        dataSources[activeDataSourceName].getInteractionController().setViewTarget(pitch, heading, verticalFov, animate, time);
    };

    /**
    * Gets the camera pitch.
    * @return {double} The camera pitch in radians.
    */
    function getPitch()
    {
        return dataSources[activeDataSourceName].getInteractionController().getPitch();
    };
    this.getPitch = getPitch;

    /**
    * Sets the camera pitch.
    * @param {double} pitch In radians. Valid values are between 1.5707963267948966 (90 degrees in radians looking straight up) 
    * and -1.5707963267948966 (-90 degrees in radians looking straight down).
    * and -90 (looking straight down).
    * @param {bool} animate True to animate to the new pitch.
    * @param {double} time The time in milliseconds for the desired pitch to be hit. Can be null.
    */
    function setPitch(pitch, animate, time)
    {
        dataSources[activeDataSourceName].getInteractionController().setViewTarget(pitch, null, null, animate, time);
    };
    this.setPitch = setPitch;

    /**
    * Gets the camera heading.
    * @return {double} The heading in radians. 
    */
    function getHeading()
    {
        return dataSources[activeDataSourceName].getInteractionController().getHeading();
    };
    this.getHeading = getHeading;

    /**
    * Sets the camera heading.
    * @param {double} heading The heading the camera is facing in radians.
    * @param {bool} animate True to animate to the new heading.
    * @param {double} time The time in milliseconds for the desired heading to be hit. Can be null.
    */
    function setHeading(heading, animate, time)
    {
        dataSources[activeDataSourceName].getInteractionController().setViewTarget(null, heading, null, animate, time);
    };
    this.setHeading = setHeading;

    /**
    * Gets the view bounds.
    * @return {object} The view bounds (left, right, top, bottom, minFov and maxFov).
    */
    this.getBounds = function ()
    {
        return dataSources[activeDataSourceName].getInteractionController().getBounds();
    };

    /**
    * Gets the vertical fov.
    * @return {int} The current verticalFov.
    */
    function getVerticalFov()
    {
        return dataSources[activeDataSourceName].getInteractionController().getVerticalFov();
    };
    this.getVerticalFov = getVerticalFov;

    /**
    * Sets the vertical fov.
    * @param {int} verticalFov The verticalFov of the camera.
    * @param {bool} animate True to animate to the new verticalFov.
    * @param {double} time The time in milliseconds for the desired vertical fov to be hit. Can be null.
    */
    function setVerticalFov(verticalFov, animate, time)
    {
        dataSources[activeDataSourceName].getInteractionController().setViewTarget(null, null, verticalFov, animate, time);
    };
    this.setVerticalFov = setVerticalFov;

    /**
    * Zooms in to the next highest lod.
    * @param {bool} animate True to animate the zoom in.
    */
    function zoomIn(animate)
    {
        dataSources[activeDataSourceName].getInteractionController().zoomIn(animate);
    };
    this.zoomIn = zoomIn;

    /**
    * Zooms out to the next highest lod.
    * @param {bool} animate True to animate the zoom out.
    */
    function zoomOut(animate)
    {
        dataSources[activeDataSourceName].getInteractionController().zoomOut(animate);
    };
    this.zoomOut = zoomOut;

    /**
    * Gets the HTML element that is used to capture input events.
    * @return HTML element used to capture input
    */
    this.getEventCapturingElement = function ()
    {
        return eventCapturingElement;
    };

    // PRIVATE METHODS

    //This is the main processing loop. 
    function _updateFrame()
    {
        if (downloader.hasBlockingDownload())
        {
            if (animating)
            {
                DebugHelper.IncrementFrameCount();
                animationRequestID = requestAnimationFrame(_updateFrame);
            }
            return;
        }

        // Update our camera position based on user input.
        if (activeController && activeController.control)
        {
            /* @disable(0136) */
            var camera = activeController.control(camera, gestureHelper.getQueuedEvents());
            /* @restore(0136) */
        }
        else
        {
            return;
        }

        var pose = camera.getPose();
        var toleranceInPixels = (this.prevCameraMoving) ? 0.1 : 1;

        var userInteracting = gestureHelper.userCurrentlyInteracting();
        var cameraMoving = (this.prevPose != null && !this.prevPose.isFuzzyEqualTo(pose, toleranceInPixels));

        var userInteractingWaitTime = 1000;

        var now = (new Date()).valueOf();

        if (userInteracting)
        {
            this.userInteractingTime = null;
        }
        else if (this.prevUserInteracting)
        {
            if (this.userInteractingTime == null)
            {
                this.userInteractingTime = now + userInteractingWaitTime;
            }

            if (this.userInteractingTime > now)
            {
                // Still waiting for high fidelity time.
                userInteracting = true;
            }
            else
            {
                this.userInteractingTime = null;
            }
        }

        var useLowerFidelity = userInteracting || cameraMoving;
        var fidelityChanged = (useLowerFidelity !== this.prevUseLowerFidelity);

        var doWorkThisFrame = fidelityChanged || useLowerFidelity || downloader.currentlyDownloading() || !this.prevPose.isFuzzyEqualTo(pose, 0.0001);

        var doWorkWaitTime = 500;

        if (doWorkThisFrame)
        {
            this.doWorkTime = null;
        }
        else if (this.prevDoWorkThisFrame)
        {
            if (this.doWorkTime == null)
            {
                this.doWorkTime = now + doWorkWaitTime;
            }

            if (this.doWorkTime > now)
            {
                // Still doing work for a bit more in case I've missed anything.
                doWorkThisFrame = true;
            }
            else
            {
                this.doWorkTime = null;
            }
        }

        this.prevPose = pose;
        this.prevUserInteracting = userInteracting;
        this.prevCameraMoving = cameraMoving;
        this.prevUseLowerFidelity = useLowerFidelity;
        
        var doneRendering = true;

        // Render at least one more frame to make sure everything is rendered.
        if (doWorkThisFrame || this.prevDoWorkThisFrame)
        {
            doneRendering = viewController.RenderFrame(_isCachedUrl, useLowerFidelity);
        }

        this.prevDoWorkThisFrame = doWorkThisFrame || !doneRendering;

        // Fire the view change end event if one is waiting to be fired. There will
        // probably always be one if the view has changed.
        if (doneRendering && viewChangeEndEventDetails !== null)
        {
            self.viewChangeEndEvent.fire(viewChangeEndEventDetails);
            viewChangeEndEventDetails = null;
        }

        if (animating || !doneRendering)
        {
            DebugHelper.IncrementFrameCount();
            requestAnimationFrame(_updateFrame);
        }
    };

    /*
     * Goes through all the specified data sources and adds them to
     * a local dictionary of data sources with the name of the data
     * source as the key.
     */
    function _setDataSources()
    {
        var optionsDataSources = options.dataSources;
        var numDataSources = optionsDataSources.length;
        for (var i = 0; i < numDataSources; i++)
        {
            var dataSource = optionsDataSources[i];
            activeDataSourceName = activeDataSourceName || dataSource.getDataSourceName();
            dataSources[dataSource.getDataSourceName()] = dataSource; 
            dataSources.push(dataSource);
        }
    }

    function _attachInternalEventHandlers()
    {
        var interactionController = dataSources[activeDataSourceName].getInteractionController();
        interactionController.viewChangeEvent.addEventListener(_viewChangeEventHandler);
        interactionController.viewChangeEndEvent.addEventListener(_viewChangeEndEventHandler);
    }

    function _detachInternalEventHandlers()
    {
        var interactionController = dataSources[activeDataSourceName].getInteractionController();
        interactionController.viewChangeEvent.removeEventListener(_viewChangeEventHandler);
        interactionController.viewChangeEndEvent.removeEventListener(_viewChangeEndEventHandler);
    }

    function _viewChangeEventHandler(e)
    {
        self.viewChangeEvent.fire(e);
    }

    function _viewChangeEndEventHandler(e)
    {
        viewChangeEndEventDetails = e;
    }

    /*
     * Helper method for initially setting the CSS for the necessary 
     * HTML elements.
     */
    function _setCssForElements(width, height)
    {
        var rootElementCss = {
            width: width + 'px',
            height: height + 'px',
            position: 'absolute',
            overflow: 'hidden',
            backgroundColor: 'rgba(0,0,0,1)',
            direction: 'ltr', '-ms-touch-action': 'none'
        };

        var eventCapturingElementCss = {
            width: width + 'px',
            height: height + 'px',
            position: 'absolute',
            backgroundColor: 'rgba(0,0,0,0)',
            webkitTapHighlightColor: 'rgba(0,0,0,1)',
            tabIndex: 0,
            '-ms-touch-action': 'none'
        };

        // These options are mainly here for the case where there are multiple
        // instances of the SharedImmersiveViewer on the same page.
        if (options.top)
        {
            rootElementCss.top = options.top + 'px';
            eventCapturingElementCss.top = options.top + 'px';
        }

        if (options.left)
        {
            rootElementCss.left= options.left + 'px';
            eventCapturingElementCss.left = options.left + 'px';
        }

        Utils.css(rootElement, rootElementCss);
        Utils.css(eventCapturingElement, eventCapturingElementCss);
    }

    function _createDefaultControls()
    {
        var fifteenDegreesInRadians = 0.2617993877991494,
            twentyFiveDegreesInRadians = 0.4363323129985824;

        _createControl(zoomInButton, cssForDefaultUI, 'sivZoomInButton', '+', 65, 20, function (e) { _stopPropagation(e); zoomIn(true); }, 1);
        _createControl(zoomOutButton, cssForDefaultUI, 'sivZoomOutButton', '-', 20, 20, function (e) { _stopPropagation(e); zoomOut(true); }, 2);
        _createControl(pitchUpButton, cssForDefaultUI, 'sivPitchUpButton', '^', 42, 85, function (e) { _stopPropagation(e); setPitch(getPitch() + fifteenDegreesInRadians, true, null); }, 5);
        _createControl(headingLeftButton, cssForDefaultUI, 'sivHeadingLeftButton', '<', 65, 130, function (e) { _stopPropagation(e); setHeading(getHeading() - twentyFiveDegreesInRadians, true, null); }, 3);
        _createControl(headingRightButton, cssForDefaultUI, 'sivHeadingRightButton', '>', 20, 130, function (e) { _stopPropagation(e); setHeading(getHeading() + twentyFiveDegreesInRadians, true, null); }, 4);
        _createControl(pitchDownButton, cssForDefaultUI, 'sivPitchDownButton', 'v', 42, 170, function (e) { _stopPropagation(e); setPitch(getPitch() - fifteenDegreesInRadians, true, null); }, 6);

        cssForDefaultUI.type = 'text/css';
        eventCapturingElement.appendChild(cssForDefaultUI);
    }

    function _createControl(element, cssNode, id, text, right, top, eventHandler, tabIndex)
    {
        cssNode.innerHTML += ' .' + id +
                             ' { width: 35px;' +
                               ' height: 35px;' +
                               ' position: absolute;' +
                               ' right: ' + right + 'px;' +
                               ' top: ' + top + 'px;' +
                               ' tabIndex: ' + tabIndex + ' }';

        element.id = id;
        element.innerText = text;
        element.className = id;
        Utils.bind(element, 'click', eventHandler, null);
        Utils.bind(element, 'dblclick', _stopPropagation, null);
        eventCapturingElement.appendChild(element);
    }

    function _stopPropagation(e)
    {
        e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
    }

    /*
     * Helper method for determining the best renderer to use for the 
     * given renderer type.
     */
    function _setRenderer()
    {
        var rendererType = options.renderer;
        switch (rendererType)
        {
            case 'webgl':
                renderer = new RendererWebGL(rootElement, width, height);
                requiresCORS = true;
                break;
            case 'Canvas2D':
                renderer = new RendererCanvas(rootElement, width, height);
                break;
            default:
                //We try webgl first then css.
                try
                {
                    renderer = new RendererWebGL(rootElement, width, height);
                    requiresCORS = true;
                }
                catch (ex)
                {
                    try
                    {
                        if (rootElement.parentNode)
                        {
                            rootElement.parentNode.removeChild(rootElement);
                        }
                        renderer = new RendererCanvas(rootElement, width, height);
                    }
                    catch (ex2)
                    {
                        if (rootElement.parentNode)
                        {
                            rootElement.parentNode.removeChild(rootElement);
                        }
                        renderer = null;
                    }
                }

                if (renderer == null)
                {
                    throw 'Could not create canvas or webgl renderer' + rendererType;
                }
                break;
        }

        var clearColor =  DebugHelper.debugEnabled ? /*grey*/{r: .4, g: .4, b: .4, a: 1} : options.backgroundColor;
        if (renderer && clearColor)
        {
            renderer.setClearColor(clearColor);
        }
    }

    /*
     * Sets the world configuration (also referred to as RML) from the 
     * specified options.
     */
    function _setWorldConfiguration()
    {
        if (options.dataSources)
        {
            var numDataSources = dataSources.length;
            for (var index = 0; index < numDataSources; index++)
            {
                // Use RML that is passed in.
                worldConfiguration.add(dataSources[index].getWorldConfiguration());
            }
        }
        else
        {
            throw 'expected worldConfiguration property passed in the options object';
        }
    }

    /*
     * Sets up the attribution control.
     */
    function _setAttributions()
    {
        //Setup overlay UI. 
        if (!options.hideAttribution &&
            options.worldConfiguration &&
            options.worldConfiguration.source &&
            options.worldConfiguration.source.attribution)
        {
            attributionControl = new AttributionControl(parentDiv);
            attributionControl.setAttribution(options.worldConfiguration.source.attribution);
        }

        if (options.worldConfiguration &&
            options.worldConfiguration.source &&
            options.worldConfiguration.source.attribution)
        {
            attributionChanged(options.worldConfiguration.source.attribution);
        }
    }

    /*
     * Give any initially loaded media a chance to override our default controller. 
     * Last one wins.
     */
    function _overrideDefaultControllerIfNecessary()
    {
        //TODO: remove or make this smart.
        //currently this worx only due to the fact that we support only 1 datasource at a time.
        //IMO If there were to be a few datasources SIV would have to instantiate a smart controller on its own.
        //also it makes little or no sense to overwrite the current controller/config properties in a loop even for the same type of world object
        var numDataSources = dataSources.length;
        for (var i = 0; i < numDataSources; i++)
        {
            var datasourceObj = dataSources[i];
            if (datasourceObj.createController)
            {
                activeController = datasourceObj.createController(datasourceObj.worldConfiguration.source, camera, camera.getCameraParameters());
                if (datasourceObj.outputMultiLODTiles != null)
                {
                    Config.outputMultiLODTiles = datasourceObj.outputMultiLODTiles;
                }

                if (datasourceObj.scanConvertSize != null)
                {
                    Config.scanConvertSize = datasourceObj.scanConvertSize;
                }
            }
        }
    }

    /*
     * Calls any specified download failed methods if the download fails.
     */
    function _tileDownloadFailed(failCount, successCount)
    {
        if (downloader.customFailFunc)
        {
            downloader.customFailFunc();
        }

        if (options.tileDownloadFailed)
        {
            options.tileDownloadFailed();
        }

        if (Config.tileDownloadFailed)
        {
            Config.tileDownloadFailed();
        }
    }

    function _isCachedUrl(url)
    {
        var state = downloader.getState(url);
        return (state === TileDownloadState.ready);
    }

    _attachInternalEventHandlers();

    // Kick off render loop.
    requestAnimationFrame(_updateFrame);
};
/* @restore(0092) */

///#source 1 1 /Common/API.js
// This file defines the public API for the SharedImmersiveViewer.

/* @disable(0092) */
var MS = window.Microsoft || (window.Microsoft = {});
var iv = MS.ImmersiveViewer || (MS.ImmersiveViewer = {});
iv.SharedImmersiveViewer = SharedImmersiveViewer;
iv.PhotosynthSivDataSource = PhotosynthSivDataSource;
iv.StreetsideSivDataSource = StreetsideSivDataSource;
iv.JsonDownloadFailedError = JsonDownloadFailedError;
iv.JsonMalformedError = JsonMalformedError;
iv.Utils = Utils;
iv.DebugHelper = DebugHelper;
/* @restore(0092) */
///#source 1 1 /Common/BuildPostfix.js
// The end of the code that will keep all our code in the global private scope.
})();
