var MathHelper = {};
MathHelper.max = function (a, b) {};
MathHelper.isZero = function(value) {};
MathHelper.min = function (a, b) {};
MathHelper.degreesToRadians = function (angle) {};
MathHelper.radiansToDegrees = function (angle) {};
MathHelper.random = function () {};
MathHelper.sin = function (angle) {};
MathHelper.asin = function (angle) {};
MathHelper.cos = function (angle) {};
MathHelper.acos = function (angle) {};
MathHelper.tan = function (angle) {};
MathHelper.atan = function (angle) {};
MathHelper.atan2 = function (y, x) {};
MathHelper.sqrt = function (v) {};
MathHelper.invSqrt = function (v) {};
MathHelper.abs = function (v) {};
MathHelper.isFinite = function (v) {};
MathHelper.clamp = function (v, min, max) {};

//var Vector2 = {};
/**
* @constructor
*/
function Vector2(x, y) {};
Vector2.dot= function (v) {};
Vector2.perp= function () {};
Vector2.normalize= function () {};
Vector2.length= function () {};
Vector2.lengthSquared= function () {};
Vector2.add= function (v) {};
Vector2.subtract=function (v) {};
Vector2.multiplyScalar= function (f) {};
Vector2.equals= function (v) {};
Vector2.toString= function () {};

/**
* @constructor
*/
function Vector3(x, y, z) {};
Vector3.dot= function (v) {};
Vector3.normalize= function () {};
Vector3.cross= function (v) {};
Vector3.length= function () {};
Vector3.lengthSquared= function () {};
Vector3.add= function (v) {};
Vector3.subtract= function (v) {};
Vector3.multiplyScalar= function (f) {};
Vector3.equals= function (v) {};
Vector3.toString= function () {};

/**
* @constructor
*/
function Vector4(x, y, z, w) {};
Vector4.createFromVector3 = function(v) {};
Vector4.dot= function (v) {};
Vector4.normalize= function () {};
Vector4.length= function () {};
Vector4.lengthSquared= function () {};
Vector4.add= function (v) {};
Vector4.subtract= function (v) {};
Vector4.multiplyScalar= function (f) {};
Vector4.equals= function (v) {};
Vector4.toString=function () {};

/**
* @constructor
*/
function Matrix4x4(m11, m12, m13, m14,
                   m21, m22, m23, m24,
                   m31, m32, m33, m34,
                   m41, m42, m43, m44) {};
Matrix4x4.createIdentity = function () {};
Matrix4x4.createScale = function (sx, sy, sz) {};
Matrix4x4.createTranslation = function (tx, ty, tz) {};
Matrix4x4.createRotationX = function (angle) {};
Matrix4x4.createRotationY = function (angle) {};
Matrix4x4.createRotationZ = function (angle) {};
Matrix4x4.add= function (m) {};
Matrix4x4.subtract= function (m) {};
Matrix4x4.multiply= function (m) {};
Matrix4x4.multiplyScalar= function (f) {};
Matrix4x4.transpose= function () {};
Matrix4x4.transformVector4= function (v) {};
Matrix4x4.transformVector3= function (v) {};
Matrix4x4.determinant= function () {};
Matrix4x4.inverse= function () {};
Matrix4x4.toString= function () {};
Matrix4x4.pullToZero= function() {};
Matrix4x4.flattenColumnMajor= function() {};

/**
* @constructor
*/
function Quaternion(w, x, y, z) {};
Quaternion.createIdentity = function () {};
Quaternion.fromRotationMatrix = function (m) {};
Quaternion.fromAxisAngle = function (axis, angle) {};
Quaternion.slerp = function (t, source, target) {};
Quaternion.dot= function (q) {};
Quaternion.length= function () {};
Quaternion.normalize= function () {};
Quaternion.inverse= function () {};
Quaternion.conjugate= function () {};
Quaternion.transform= function (v) {};
Quaternion.add= function (q) {};
Quaternion.multiply= function (q) {};
Quaternion.multiplyScalar= function (f) {};
Quaternion.toRotationMatrix= function () {};
Quaternion.toAxisAngle= function () {};
Quaternion.toString= function () {};

/**
* @constructor
*/
function Ray(origin, direction) {};

/**
* @constructor
*/
function Plane(a, b, c, d, point) {};
Plane.createFromPoints = function(p0, p1, p2) {};
Plane.createFromPointAndNormal = function(point, normal) {};
Plane.intersectWithRay = function(ray, plane) {};
Plane.transformNormal= function(transform) {};
Plane.toString= function() {};

var GraphicsHelper = {};
GraphicsHelper.createLookAtRH = function (position, look, up) {
};
GraphicsHelper.createPerspective = function (verticalFov,
                                             aspectRatio,
                                             near,
                                             far,
                                             digitalPan) {
};

GraphicsHelper.projectOntoPlane = function (position, plane) {
};

GraphicsHelper.createViewportToScreen = function (width, height) {
};
