/**
* This controls camera
* @constructor
*/
function StreetsideCameraController(camera, cameraParameters, upperPitchLimit, lowerPitchLimit) {
    this._camera = camera;
    this._upperPitchLimit = upperPitchLimit || MathHelper.degreesToRadians(89.9);
    this._lowerPitchLimit = lowerPitchLimit || MathHelper.degreesToRadians(-89.9);
    this._worldUp = (cameraParameters && cameraParameters.up) ? cameraParameters.up : new Vector3(0, 1, 0);
    this._worldLook = (cameraParameters && cameraParameters.look) ? cameraParameters.look : new Vector3(0, 0, -1);
    this._worldSide = (cameraParameters && cameraParameters.side) ? cameraParameters.side : new Vector3(1, 0, 0);

    // The point on the screen when the mouseDown event fires
    // This represents the initial point on the screen when the user clicks
    this._mouseDownPoint = null;

    // The current point on the screen when the mouse moves after a mouseDown event
    // This represents the current location of the mouse during mouse drag
    this._currentMousePoint = null;

    // The previous point on the screen when the mouse moved after a mouseDown event
    // This represents the last location of the mouse during mouse drag
    this._previousMousePoint = null;

    this._startingPitch = null;
    this._startingHeading = null;
    this._animationInProgress = null;

    //TODO: make this settable
    this._accelerateHorizontalRotationNearPoles = true;
    this._maxPitchForAcceleratingHorizontalRotation = MathHelper.degreesToRadians(70);

    this._pitchSpring = new ClassicSpring(0.0028, 0.6, false);
    this._headingSpring = new ClassicSpring(0.0028, 0.6, false);
    this._fieldOfViewSpring = new ClassicSpring(0.0033, 0.6, false);

    this._pitchSpring.setCurrentAndTarget(0);
    this._headingSpring.setCurrentAndTarget(0);
    this._fieldOfViewSpring.setCurrentAndTarget(this._camera.getVerticalFov());

    this._minFieldOfView = MathHelper.degreesToRadians(20);
    this._maxFieldOfView = MathHelper.degreesToRadians(80);

    // public callbacks
    this.viewChangeCallback = null;
    this.targetViewChangeCallback = null;
}

StreetsideCameraController.prototype = {
    // Update the view when user drags the mouse
    _updateViewForMouseDrag: function () {

        if (this._currentMousePoint !== null)
        {
            // Only update the view if user drags the mouse
            if (this._mouseDownPoint !== null
                && this._previousMousePoint !== null
                && (this._previousMousePoint.x !== this._currentMousePoint.x || this._previousMousePoint.y !== this._currentMousePoint.y)) {
                var pitch = MathHelper.clamp(this._startingPitch + this._radiansPerPixelPitch * (this._currentMousePoint.y - this._mouseDownPoint.y), this._lowerPitchLimit, this._upperPitchLimit);
                var heading = MathHelper.normalizeRadian(this._startingHeading + this._radiansPerPixelHeading * (this._mouseDownPoint.x - this._currentMousePoint.x));
                this.setViewTarget(pitch, heading, null, false);
            }

            // Update _previousMousePoint so we don't needlessly update the view
            // when user pauses their drag action without letting go their mouse
            this._previousMousePoint = this._currentMousePoint;
        }
    },

    // Step up the springs if required
    // Return a flag indicating whether all the springs are settled
    _stepUpSpring: function () {
        //Need this to be MS for classic spring
        var springSettled = false;
        var t = (new Date()).getTime();

        if (this._pitchSpring.step(t)
            && this._headingSpring.step(t)
            && this._fieldOfViewSpring.step(t)) {
            springSettled = true;
        }

        return springSettled;
    },

    // internal function to set the Pitch.
    // Caller should always use setViewTarget() to set the pitch, otherwise the targetViewChangeCallback() won't get executed
    _setPitch: function (pitch, animate) {
        pitch = MathHelper.clamp(pitch, this._lowerPitchLimit, this._upperPitchLimit);

        if (animate) {
            this._pitchSpring.setTarget(pitch);
        }
        else {
            this._pitchSpring.setCurrentAndTarget(pitch);
        }
    },

    // internal function to set the Heading.
    // Caller should always use setViewTarget() to set the Heading, otherwise the targetViewChangeCallback() won't get executed
    _setHeading: function (heading, animate) {
        if (animate) {
            var currentHeading = this._headingSpring.getCurrent();
            currentHeading = MathHelper.pickStartHeadingToTakeShortestPath(currentHeading, heading);

            this._headingSpring.setCurrent(currentHeading);
            this._headingSpring.setTarget(heading);
        }
        else {
            this._headingSpring.setCurrentAndTarget(heading);
        }
    },

    // internal function to set the vertical fov.
    // Caller should always use setViewTarget() to set the vertical fov, otherwise the targetViewChangeCallback() won't get executed
    _setVerticalFov: function (fov, animate) {
        fov = MathHelper.clamp(fov, this._minFieldOfView, this._maxFieldOfView);

        if (animate) {
            this._fieldOfViewSpring.setTarget(fov);
        }
        else {
            this._fieldOfViewSpring.setCurrentAndTarget(fov);
            this._camera.setVerticalFov(fov);
        }
    },

    // Set new view target according to the specified pitch, heading and fov
    // Use null if you don't want to set a specific property
    // Invoke the targetViewChangeCallback() if any one property is updated.
    setViewTarget: function (pitch, heading, verticalFov, animate) {
        var targetUpdated = false;

        if (pitch !== null) {
            this._setPitch(pitch, animate);
            targetUpdated = true;
        }

        if (heading !== null) {
            this._setHeading(heading, animate);
            targetUpdated = true;
        }

        if (verticalFov !== null) {
            this._setVerticalFov(verticalFov, animate);
            targetUpdated = true;
        }

        if (targetUpdated && this.targetViewChangeCallback) {
            this.targetViewChangeCallback();
        }
    },

    getPitch: function () {
        return this._pitchSpring.getCurrent();
    },

    getHeading: function () {
        return this._headingSpring.getCurrent();
    },

    getVerticalFov: function () {
        return this._camera.getVerticalFov();
    },

    getMinVerticalFov: function () {
        return this._minFieldOfView;
    },

    getMaxVerticalFov: function () {
        return this._maxFieldOfView;
    },

    getCamera: function () {
        return this._camera;
    },

    calculateLookFromPitchAndHeading: function (pitch, heading, worldLook, worldUp, worldSide, applyHeadingBeforePitch) {
        //Need to negate heading because the quaternion rotates using the right hand rule
        //and we want positive heading to rotate to the right.
        var pitchRotation = Quaternion.fromAxisAngle(worldSide, pitch);
        var headingRotation = Quaternion.fromAxisAngle(worldUp, -heading);

        if (applyHeadingBeforePitch) {
            return pitchRotation.multiply(headingRotation).transform(worldLook);
        }
        else {
            return headingRotation.multiply(pitchRotation).transform(worldLook);
        }
    },

    tryPitchHeadingToPixel: function (pitch, heading) {
        //rotate vector to point at the correct pitch/heading
        var look = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldLook, this._worldUp, this._worldSide);

        //check to make sure it's in front of the view and not behind
        if (this._camera.getLook().dot(look) <= 0) {
            return null;
        }

        //now project into 2d viewport space
        var projectedPoint = this._camera.projectTo2D(look);

        //don't want to return a depth because it'll always be 1, so create a vector2 to return
        return new Vector2(projectedPoint.x, projectedPoint.y);
    },

    tryPixelToPitchHeading: function (pixel) {
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

        if (isNaN(pitch) || isNaN(heading)) {
            return null;
        }

        return { pitch: pitch, heading: heading };
    },

    update: function () {
        this._updateViewForMouseDrag();
        var springSettled = this._stepUpSpring();

        // Get current look by calculating it from the current pitch, heading and fov
        var pitch = this._pitchSpring.getCurrent();
        var heading = this._headingSpring.getCurrent();
        var fov = this._fieldOfViewSpring.getCurrent();

        this._look = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldLook, this._worldUp, this._worldSide);
        this._up = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldUp, this._worldUp, this._worldSide);
        this._side = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldSide, this._worldUp, this._worldSide);

        // Get the previous look, up and fov from the camera
        var prevLook = this._camera.getLook();
        var prevUp = this._camera.getUp();
        var prevFov = this._camera.getVerticalFov();

        // If current look, up and fov is different from previous, update camera with current view state
        // Also update the camera at begin and end of animation
        if (this._animationInProgress
            || (!this._animationInProgress && !springSettled)
            || !prevLook.equals(this._look) || !prevUp.equals(this._worldUp) || prevFov !== fov) {

            this._camera.setLook(this._look);
            this._camera.setUp(this._worldUp);
            this._camera.setVerticalFov(fov);

            if (this.viewChangeCallback != null) {
                this.viewChangeCallback({ animationInProgress: this._animationInProgress, animationSettled: springSettled });
            }
        }

        // Update animation status
        this._animationInProgress = !springSettled;
    },

    zoomIn: function () {
        //if we're already zooming in, increase from the current target.  If we're zooming out or stationary, then increase from the current fov.
        var fov = Math.min(this._fieldOfViewSpring.getTarget(), this._camera.getVerticalFov()) * 0.5;
        this.setViewTarget(null, null, fov, true);
    },

    zoomOut: function () {
        //if we're already zooming out, decrease from the current target.  If we're zooming in or stationary, then decrease from the current fov.
        var fov = Math.max(this._fieldOfViewSpring.getTarget(), this._camera.getVerticalFov()) * 2;
        this.setViewTarget(null, null, fov, true);
    },

    onGestureStart: function (e) {
        this._mouseDownPoint = new Vector2(e.screenX, e.screenY);
        this._startingPitch = this._pitchSpring.getCurrent();
        this._startingHeading = this._headingSpring.getCurrent();

        var viewport = this._camera.getViewport();
        this._radiansPerPixelPitch = this._camera.getVerticalFov() / viewport.getHeight();

        if (this._accelerateHorizontalRotationNearPoles) {
            //As the camera pitches towards the poles, the perceived horizontal rotation feels slower and slower
            //because we're using rotational speed instead of translational.
            //This code alters the horizontal rotation so that it matches what the translation speed would be.

            //As the pitch approaches the poles, the multiplier approaches infinity, so we clamp here (roughly 70 degrees)
            var clampedPitch = Math.min(Math.abs(this._startingPitch), this._maxPitchForAcceleratingHorizontalRotation);

            this._radiansPerPixelHeading = this._radiansPerPixelPitch / Math.sin(MathHelper.halfPI - clampedPitch);
        }
    },

    onGestureEnd: function (e) {
        this._mouseDownPoint = null;
        this._currentMousePoint = null;
        this._startingPitch = null;
        this._startingHeading = null;
        this._previousMousePoint = null;
    },

    gestureChange: function (e) {
        if (this._mouseDownPoint !== null) {
            this._currentMousePoint = new Vector2(this._mouseDownPoint.x + e.translationX, this._mouseDownPoint.y + e.translationY);
        }
    },

    onDiscreteZoom: function (e) {
        var zoomPoint = new Vector2(this._camera.getViewport().getWidth() / 2, this._camera.getViewport().getHeight() / 2);
        if (e.direction > 0) {
            this.zoomIn(zoomPoint);
        }
        else {
            this.zoomOut(zoomPoint);
        }
    },

    control: function (camera, unprocessedEvents) {
        var i, e;
        for (i = 0; i < unprocessedEvents.length; ++i) {
            e = unprocessedEvents[i];
            switch (e.type) {
                case 'gestureEnd':
                    this.onGestureEnd(e);
                    break;
                case 'gestureStart':
                    this.onGestureStart(e);
                    break;
                case 'gestureChange':
                    this.gestureChange(e);
                    break;
                case 'discreteZoom':
                    this.onDiscreteZoom(e);
                    break;
                default:
                    break;
            }
        }
        this.update();
        return this._camera;
    }
};