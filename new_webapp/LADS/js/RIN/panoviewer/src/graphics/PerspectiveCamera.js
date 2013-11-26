function PerspectiveCameraPose(viewport, digitalPan, position, up, look, fieldOfView) {
    this.width = (viewport) ? viewport.getWidth() : 0;
    this.height = (viewport) ? viewport.getHeight() : 0;
    //this.digitalPan = Vector2.clone(digitalPan);
    //this.position = Vector3.clone(position);
    this.up = Vector3.clone(up);
    this.look = Vector3.clone(look);
    this.fieldOfView = fieldOfView;

    var fuzzyEquals = function (v1, v2, tolerance) {
        //assumes v1 and v2 are unit vectors
        //assumes tolerance is specified in radians
        var dotProduct = v1.dot(v2);

        if (dotProduct > 1.0) {
            dotProduct = 1.0;
        }
        else if (dotProduct < -1.0) {
            dotProduct = -1.0;
        }

        var difference = Math.acos(dotProduct);
        return difference < tolerance;
    };

    this.isFuzzyEqualTo = function (pose, toleranceInPixels) {
        //viewport width/height are discrete, so use exact equality
        if (this.width !== pose.width || this.height !== pose.height) {
            return false;
        }

        //get tolerance equal to the angle one pixel multiplied by the given tolerance
        var tolerance = toleranceInPixels * this.fieldOfView / this.height;

        if (Math.abs(this.fieldOfView - pose.fieldOfView) > tolerance) {
            return false;
        }

        if (!fuzzyEquals(this.up, pose.up, tolerance)) {
            return false;
        }

        if (!fuzzyEquals(this.look, pose.look, tolerance)) {
            return false;
        }

        //TODO: Compare position and digital pan.  Are they used anywhere?

        return true;
    };
}

/**
* Represents a camera that applies perspective distortion to a scene
* @constructor
*/
function PerspectiveCamera() {

    /**
    * @private
    * @type {Viewport}
    */
    this._viewport = null;

    /**
    * @private
    * @type {Vector2}
    */
    this._digitalPan = new Vector2(0, 0);

    /**
    * @private
    * @type {Vector3}
    */
    this._position = new Vector3(0, 0, 0);

    /**
    * @private
    * @type {Vector3}
    */
    this._up = new Vector3(0, 1, 0);

    /**
    * @private
    * @type {Vector3}
    */
    this._look = new Vector3(0, 0, -1);

    /**
    * @private
    * @type {number}
    */
    this._fieldOfView = Math.PI / 2;

    /**
    * @private
    * @type {number}
    */
    this._focalLength = -1;

    /**
    * @private
    * @type {Matrix4x4}
    */
    this._viewTransform = Matrix4x4.createIdentity();

    /**
    * @private
    * @type {Matrix4x4}
    */
    this._projectionTransform = Matrix4x4.createIdentity();

    /**
    * @private
    * @type {boolean}
    */
    this._isDirty = true;

}

PerspectiveCamera.prototype = {

    getPose: function () {
        return new PerspectiveCameraPose(this._viewport, this._digitalPan, this._position, this._up, this._look, this._fieldOfView);
    },

    /**
    * When called marks the camera as being dirty
    * @ignore
    */
    _setDirty: function () {
        this._isDirty = true;
    },

    /**
    * Sets the viewport on the camera
    * @param {Viewport} viewport
    */
    setViewport: function (viewport) {
        this._viewport = viewport;
        this._setDirty();
    },

    /**
    * Returns the viewport associated with the camera
    * @return {Viewport}
    */
    getViewport: function () {
        return this._viewport;
    },

    /**
    * Sets the position of the camera
    * @param {Vector3} position
    */
    setPosition: function (position) {
        this._position = position;
        this._setDirty();
    },

    /**
    * Returns the position of the camera
    * @return {Vector3}
    */
    getPosition: function () {
        return this._position;
    },

    /**
    * Sets the vertical field of view of the camera
    * @param {number} fieldOfView Angle in radians
    */
    setVerticalFov: function (fieldOfView) {
        this._fieldOfView = fieldOfView;
        this._setDirty();
    },

    /**
    * Returns the vertical field of view of the camera
    * @return {number}
    */
    getVerticalFov: function () {
        return this._fieldOfView;
    },

    /**
    * Returns the focal length of the camera
    * @return {number}
    */
    getFocalLength: function () {
        if (this._isDirty) {
            this._updateTransforms();
        }
        return this._focalLength;
    },

    /**
    * Sets the look direction of the camera
    * @param {Vector3} look A unit look vector
    */
    setLook: function (look) {
        this._look = look;
        this._setDirty();
    },

    /**
    * Returns the current look vector of the camera
    * @return {Vector3}
    */
    getLook: function () {
        return this._look;
    },

    /**
    * Sets the up direction of the camera
    * @param {Vector3} up A unit up vector
    */
    setUp: function (up) {
        this._up = up;
        this._setDirty();
    },

    /**
    * Returns the current up vector of the camera
    * @return {Vector3}
    */
    getUp: function () {
        return this._up;
    },

    /**
    * Sets the current digital pan on the camera
    * @param {Vector2} pan The digital pan.  Values are in viewport space, meaning
    * a value of 0.5 for the width or height will shift the entire contents of the viewport
    * by half of the dimension of the viewport
    */
    setDigitalPan: function(pan) {
        this._digitalPan = pan;
        this._setDirty();
    },

    /**
    * Returns the current digital pan
    * @return {Vector2}
    */
    getDigitalPan: function() {
        return this._digitalPan;
    },

    /**
    * Returns the current view transform
    * @return {Matrix4x4}
    */
    getViewTransform: function () {
        if (this._isDirty) {
            this._updateTransforms();
        }
        return this._viewTransform;
    },

    /**
    * Returns the current projection transform
    * @return {Matrix4x4}
    */
    getProjectionTransform: function () {
        if (this._isDirty) {
            this._updateTransforms();
        }
        return this._projectionTransform;
    },

    /**
    * Returns the view projection transform.
    * @return {Matrix4x4}
    */
    getViewProjectionTransform: function () {
        if(this._isDirty) {
            this._updateTransforms();
        }
        return this._projectionTransform.multiply(this._viewTransform);
    },

    /**
    * Projects a 3D point to 2D. Notes points behind the camera will get back projected,
    * up to the caller to make sure the points passed to this function are infront of the camera
    * @param {Vector3} point A point in 3D
    * @return {Vector4} The z component gives the depth of the point.
    */
    projectTo2D: function (point) {

        if (this._isDirty) {
            this._updateTransforms();
        }

        //TODO: Cache all this

        var halfWidth = this._viewport.getWidth() * 0.5;
        var halfHeight = this._viewport.getHeight() * 0.5;
        var projected = this._projectionTransform.multiply(this._viewTransform).transformVector4(Vector4.createFromVector3(point));
        projected.x /= projected.w;
        projected.y /= projected.w;
        projected.z = projected.w = 1;
        return (new Matrix4x4(halfWidth, 0, halfWidth, 0,
                               0, -halfHeight, halfHeight, 0,
                              0, 0, 1, 0,
                               0, 0, 0, 1)).transformVector4(projected);
    },

    /**
    * When called updates the view and projection transforms based on the current state of the system
    * @ignore
    */
    _updateTransforms: function () {
        var denom = Math.tan(0.5 * this._fieldOfView);
        if (denom === 0.0) {
            this._focalLength = 1.0;
        }
        else {
            this._focalLength = 1.0 / denom;
        }

        this._viewTransform = GraphicsHelper.createLookAtRH(this._position, this._look, this._up);
        this._projectionTransform = GraphicsHelper.createPerspectiveOGL(this._fieldOfView,
                                                                        this._viewport.getAspectRatio(),
                                                                        this._viewport.getNearDistance(),
                                                                        this._viewport.getFarDistance(),
                                                                        this._digitalPan);
        this._isDirty = false;
    }
};
