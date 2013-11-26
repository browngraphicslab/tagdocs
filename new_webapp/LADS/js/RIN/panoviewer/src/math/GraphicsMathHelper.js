/**
* Provides common graphics helper function
* @class
*/
var GraphicsHelper = {};

/**
* Creates a right handed look at matrix.  This is with +Z coming
* towards the viewer, +X is to the right and +Y is up
* @param {Vector3} position The position of the eye
* @param {Vector3} look The look direction
* @param {Vector3} up The up direction
* @return {Matrix4x4}
*/
GraphicsHelper.createLookAtRH = function (position, look, up) {
    var rotatedPos, viewSide, viewUp, result;

    look = look.normalize();
    up = up.normalize();
    viewUp = up.subtract(look.multiplyScalar(up.dot(look))).normalize();
    viewSide = look.cross(viewUp);

    result = Matrix4x4.createIdentity();
    result.m11 = viewSide.x;
    result.m12 = viewSide.y;
    result.m13 = viewSide.z;
    result.m21 = viewUp.x;
    result.m22 = viewUp.y;
    result.m23 = viewUp.z;
    result.m31 = -look.x;
    result.m32 = -look.y;
    result.m33 = -look.z;
    rotatedPos = result.transformVector3(position);
    result.m14 = -rotatedPos.x;
    result.m24 = -rotatedPos.y;
    result.m34 = -rotatedPos.z;
    return result;
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
* @return {Matrix4x4}
*/
GraphicsHelper.createPerspective = function (verticalFov,
                                             aspectRatio,
                                             near,
                                             far,
                                             digitalPan) {

    var d;
    d = 1.0 / Math.tan(verticalFov / 2.0);

    var projection = new Matrix4x4(d / aspectRatio, 0, digitalPan.x * 2, 0,
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
 * @return {Matrix4x4} The perspective projection.
 */
GraphicsHelper.createPerspectiveFromFrustum = function (l, r, b, t, n,f) {
    return new Matrix4x4( (2.0*n)/(r-l),           0.0,        (r+l)/(r-l),              0.0,
                                    0.0, (2.0*n)/(t-b),        (t+b)/(t-b),              0.0,
                                    0.0,           0.0, (-1.0*(f+n))/(f-n), (-2.0*f*n)/(f-n),
                                    0.0,           0.0,               -1.0,              0.0);

};

/**
 * Creates a perpective projection (similiar to gluPerspective.)
 * @param {number} verticalFov  fovy in radians.
 * @param {number} aspectRatio
 * @param {number} near  distance to the near z-plane. (Should be non-negative.)
 * @param {number} far   distance to the far  z-plane. (Should be non-negative, and greater than near.)
 * @return {Matrix4x4} The perspective projection.
 */
GraphicsHelper.createPerspectiveOGL = function (verticalFov,
                                                aspectRatio,
                                                near,
                                                far) {

    //Phrase this in terms of frustum boundaries, as that's how most texts present this projection..
    var yMax = near * Math.tan(verticalFov/2),
        yMin = -yMax,
        xMin = yMin * aspectRatio,
        xMax = yMax * aspectRatio,
        zMin = near,
        zMax = far;
   return  GraphicsHelper.createPerspectiveFromFrustum(xMin, xMax, yMin, yMax, zMin, zMax);
};

/**
* Transforms all points onto the specified plane from the projector position
* @param {Vector3} position The position of the projector in world space
* @param {Plane} plane The plane where the geometry will be projected onto
* @return {Matrix4x4} A transform that projects any point onto the specified plane from the perspetive
*                     of the specified projector parameters
*/
GraphicsHelper.projectOntoPlane = function (position, plane) {

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
    return new Matrix4x4(m11, m12, m13, m14,
                         m21, m22, m23, m24,
                         m31, m32, m33, m34,
                         m41, m42, m43, m44);
};

GraphicsHelper.createViewportToScreen = function (width, height) {
    var n = Matrix4x4.createIdentity();
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
