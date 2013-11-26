/**
 * The MathHelper class provides common math functions.
 * @class
*/
var MathHelper = {};

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
MathHelper.isZero = function(value) {
    return Math.abs(value) < MathHelper.zeroTolerance;
};

/**
 * Converts radians to degrees
 * @param {number} angle An angle in degrees
 * @return {number}
*/
MathHelper.degreesToRadians = function (angle) {
    return angle * MathHelper.piOverOneEighty;
};

/**
 * Converts degrees to radians
 * @param {number} angle An angle in radians
*/
MathHelper.radiansToDegrees = function (angle) {
    return angle * MathHelper.oneEightyOverPI;
};

/**
 * Normalizes a radian angle to be between [0, 2 * PI)
 * @param {number} angle An angle in radians
 * @return {number}
*/
MathHelper.normalizeRadian = function (angle) {
    while (angle < 0) {
        angle += MathHelper.twoPI;
    }
    while (angle >= MathHelper.twoPI) {
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
MathHelper.pickStartHeadingToTakeShortestPath = function (source, target) {
    //Always want to take the shortest path between the source and the target i.e. if source
    //is 10 degrees and target is 350 degrees we want to travel 20 degrees not 340
    if (Math.abs(target - source) > Math.PI) {
        if (source < target) {
            return source + MathHelper.twoPI;
        }
        else {
            return source - MathHelper.twoPI;
        }
    }
    else {
        return source;
    }
};

/**
 * Returns the inverse square root of the input parameter
 * @param {number} v input value
 * @return {number}
*/
MathHelper.invSqrt = function (v) {
    return 1.0 / Math.sqrt(v);
};

/**
* Returns if the value is finite (i.e., less than POSITIVE_INFINITY and greater than NEGATIVE_INFINITY)
* @param {number} v input value
* @return {boolean}
*/
MathHelper.isFinite = function (v) {
    return v > Number.NEGATIVE_INFINITY && v < Number.POSITIVE_INFINITY;
};

/**
 * Returns the value v , clamped to [min,max] interval (so v > max would be max.)
 * @param {number} v input value
 * @param {number} min lower bound (inclusive) that we want to clamp v against.
 * @param {number} max upper bound (inclusiveP that we want to clamp v against.
 * @return {number}
*/
MathHelper.clamp = function (v, min, max) {
    return (Math.min(Math.max(v, min), max));
};

/**
* Returns log of x to the specified base
* @param {number} x Value to log
* @param {number} base The base to use in the log operation
* @return {number}
*/
MathHelper.logBase = function (x, base) {
    return Math.log(x) / Math.log(base);
};

/**
* Returns the ceiling of the log base 2 of the value.
* @return {number}
*/
MathHelper.ceilLog2 = function (value) {
    return Math.ceil(MathHelper.logBase(value, 2));
};

/**
* Compares two values, returns <0 if v1 precedes v2, 0 if v1 == v2 and >0 if v1 follows v2
* @param {number} v1 First value
* @param {number} v2 Second value
* @return {number}
*/
MathHelper.compareTo = function (v1, v2) {
    if (v1 < v2) {
        return -1;
    }
    else if (v1 === v2) {
        return 0;
    }
    else {
        return 1;
    }
};

MathHelper.divPow2RoundUp = function(value, power) {
    return MathHelper.divRoundUp(value, 1 << power);
}

MathHelper.divRoundUp = function(value, denominator) {
    return Math.ceil(value / denominator);
}
