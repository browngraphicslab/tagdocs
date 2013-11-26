/**
* Represents a viewport into the 3D scene
* @param {number} width The width of the viewport in pixels
* @param {number} height The height of the viewport in pixels
* @param {number} nearDistance The distance to the near plane
* @param {number} farDistance The distance to the far plane
* @constructor
*/
function Viewport(width, height, nearDistance, farDistance) {

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
