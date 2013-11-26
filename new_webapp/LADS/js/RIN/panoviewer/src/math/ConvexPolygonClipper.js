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
     * @param {Array.<Vector4>} polygon
     * @return {Array.<Vector4>}
     */
    clip: function (lowerClipBound, upperClipBound, polygon) {
        if(upperClipBound.x < lowerClipBound.x ||
           upperClipBound.y < lowerClipBound.y ||
           upperClipBound.z < lowerClipBound.z ) {
            throw 'clip bounds should have positive volume';
        }

        var options = {
            clipBounds : {
                x: lowerClipBound.x,
                y: lowerClipBound.y,
                z: lowerClipBound.z,
                sizeX: upperClipBound.x - lowerClipBound.x,
                sizeY: upperClipBound.y - lowerClipBound.y,
                sizeZ: upperClipBound.z - lowerClipBound.z
            },
            poly : polygon,
            polyTextureCoords : null,
            polyVertexCount : polygon.length,
            clippedPoly: new Array(polygon.length + 6),
            clippedPolyTextureCoords: null,
            clippedPolyVertexCount: 0,
            tempVertexBuffer: new Array(polygon.length + 6),
            tempTextureCoordBuffer: null
        };
        convexPolygonClipper.clipConvexPolygonGeneral(options);
        options.clippedPoly.length = options.clippedPolyVertexCount;
        return options.clippedPoly;
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
    clipConvexPolygonGeneral : function(options) {
        if(!options.clipBounds ) {
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

        if (options.polyTextureCoords != null)
        {
            if (options.polyTextureCoords.Length < options.polyVertexCount ||
                options.clippedPolyTextureCoords == null || options.clippedPolyTextureCoords.Length < options.polyVertexCount + 6 ||
                options.tempTextureCoordBuffer == null || options.tempTextureCoordBuffer.Length < options.polyVertexCount + 6)
            {
                throw 'polygon arrays must have sufficient capacity';
            }
        }

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

        var p0Idx, p1Idx,BC0, BC1;
        // Left
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = options.poly[p0Idx].x - options.clipBounds.x * options.poly[p0Idx].w;
                BC1 = options.poly[p1Idx].x - options.clipBounds.x * options.poly[p1Idx].w;

                options.BC0 = BC0;
                options.BC1 = BC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = options.poly;  //Notice here we use input poly, in others we'll use clippedPolyCurrent instead.
                options.clippedPolyTextureCoordsCurrent = options.polyTextureCoords;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }


        // Right
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = (options.clipBounds.x + options.clipBounds.sizeX) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].x;
                BC1 = (options.clipBounds.x + options.clipBounds.sizeX) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].x;


                options.BC0 = BC0;
                options.BC1 = BC1;
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
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Top
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = clippedPolyCurrent[p0Idx].y - options.clipBounds.y * clippedPolyCurrent[p0Idx].w;
                BC1 = clippedPolyCurrent[p1Idx].y - options.clipBounds.y * clippedPolyCurrent[p1Idx].w;

                options.BC0 = BC0;
                options.BC1 = BC1;
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
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Bottom
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = (options.clipBounds.y + options.clipBounds.sizeY) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].y;
                BC1 = (options.clipBounds.y + options.clipBounds.sizeY) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].y;

                options.BC0 = BC0;
                options.BC1 = BC1;
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
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Near
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = clippedPolyCurrent[p0Idx].z - options.clipBounds.z * clippedPolyCurrent[p0Idx].w;
                BC1 = clippedPolyCurrent[p1Idx].z - options.clipBounds.z * clippedPolyCurrent[p1Idx].w;

                options.BC0 = BC0;
                options.BC1 = BC1;
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
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Far
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = (options.clipBounds.z + options.clipBounds.sizeZ) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].z;
                BC1 = (options.clipBounds.z + options.clipBounds.sizeZ) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].z;


                options.BC0 = BC0;
                options.BC1 = BC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent;
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            // No need to swap current with output because this is the last clipping plane

            options.clippedPolyCurrent  = null;
            options.clippedPolyTextureCurrent  = null;
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
    genericClipAgainstPlane : function(options) {
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
            }

            // output P1
            options.clippedPoly[options.clippedPolyVertexCount] = options.clippedPolyCurrent[options.p1Idx];
            if (options.clippedPolyTextureCoords != null)
            {
                options.clippedPolyTextureCoords[options.clippedPolyVertexCount] = options.clippedPolyTextureCoordsCurrent[options.p1Idx];
            }
            options.clippedPolyVertexCount++;
        }
        else if (options.BC0 >= 0)
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
        }
    }
}
