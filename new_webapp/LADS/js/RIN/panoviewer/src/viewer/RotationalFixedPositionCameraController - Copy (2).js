/**
* This controls camera
* @constructor
*/
function RotationalFixedPositionCameraController(camera, upperPitchLimit, lowerPitchLimit, upperHeadingLimit, lowerHeadingLimit, enforceViewLimits, minClientPreferredFieldOfView, dimension) {

    this._camera = camera;
    this._enforceViewLimits = (enforceViewLimits == null) ? true : enforceViewLimits;
    this._upperPitchLimit = (upperPitchLimit == null) ? MathHelper.degreesToRadians(90) : upperPitchLimit;
    this._lowerPitchLimit = (lowerPitchLimit == null) ? MathHelper.degreesToRadians(-90) : lowerPitchLimit;
    this._upperHeadingLimit = (upperHeadingLimit == null) ? MathHelper.degreesToRadians(360) : MathHelper.normalizeRadian(upperHeadingLimit);
    this._lowerHeadingLimit = (lowerHeadingLimit == null) ? MathHelper.degreesToRadians(0) : MathHelper.normalizeRadian(lowerHeadingLimit);
    this._pitchSpring = new ClassicSpring(0.01, 0.6, false);
    this._headingSpring = new ClassicSpring(0.01, 0.6, false);
    this._fieldOfViewSpring = new ClassicSpring(0.0033, 0.6, false);
    this._sourcePitch = 0;
    this._sourceHeading = 0;
    this._targetPitch = 0;
    this._targetHeading = 0;
    this.panoramaWorldTransform = Matrix4x4.createIdentity();
    this.panoramaLocalTransform = Matrix4x4.createIdentity();
    this.deviceRotation = Matrix4x4.createIdentity();
    this.initInverseDeviceRotation = Matrix4x4.createIdentity();
    this._targetUp = new Vector3(0, 1, 0);

    var pitchAndHeading = this.getPitchAndHeading();
    this._pitchSpring.setCurrentAndTarget(pitchAndHeading[0]);
    this._headingSpring.setCurrentAndTarget(pitchAndHeading[1]);
    this._fieldOfViewSpring.setCurrentAndTarget(this._camera.getVerticalFov());

    this._maxPixelScaleFactor = 2; //Set max zoom such that each source pixel is expanded to 2x2 screen pixels
    this._dimension = dimension;
    this._minClientPreferredFieldOfView = minClientPreferredFieldOfView;
    this._minFieldOfView = minClientPreferredFieldOfView ? minClientPreferredFieldOfView : MathHelper.degreesToRadians(20);
    //****** TODO: Ideally we should take min of pitch range and (corrected value of) the heading range
    this._maxFieldOfView = (this._upperPitchLimit - this._lowerPitchLimit); 
    this.setViewportSize(this._camera.getViewport().getWidth(), this._camera.getViewport().getHeight());

    //Used for state tracking. If this grows beyond the bool & point.
    //we should refactor to use a state machine (see TouchController.js)

    this._startingPitchandHeading = null;
    this._startingPosition = null;
    this._isRotating = false;
    this._lastMovePoint = null;
    this._lastGestureScale = null;

    this.GestureType = {
        NONE: 0,
        DRAG: 1,
        PINCH: 2
    };
    this.gestureMode = this.GestureType.NONE;
}

RotationalFixedPositionCameraController.calculatePitchAndHeading = function (currentLook,
                                                            worldToLocalTransform) {

    //Bubble has a right handed coord system
    //look = 0,0,-1
    //up = 0,1,0
    //right = 1,0,0
    //so a currentLook of 0,0,-1 will give a heading of 0 radians
  
    var transformedLook = worldToLocalTransform.transformVector3(currentLook);
    var pitch = this._pitchSpring.getCurrent();
    var heading = MathHelper.normalizeRadian(this._headingSpring.getCurrent());

    return [pitch, heading];
};

RotationalFixedPositionCameraController.prototype = {

    hasCompleted: function () {
        return this._pitchSpring.isSettled() &&
               this._headingSpring.isSettled() &&
               this._fieldOfViewSpring.isSettled() &&
               this._ballisticPath == null &&
               !this._autoplay;
    },

    calculatePitchAndHeadingDelta: function(
        dx, dy, viewportWidth, viewportHeight, focalLength) {

        var pitch, heading;

        if (dx === 0) {
            heading = 0;
        }
        else {
            heading = 2 * Math.atan((dx / viewportHeight) / focalLength);
        }

        if (dy === 0) {
            pitch = 0;
        }
        else {
            //Using a -dy because dy is in screen space ie. 0,0 top left to w,h at the
            //bottom right, so a negative dy actually means a positive value in terms of pitch
            pitch = 2 * Math.atan((-dy / viewportHeight) / focalLength);
        }

        return [pitch, heading];
    },

    animateToPose: function (pitch, heading, fov, callback, simplePathOnly) {
        if (this._ballisticPathCallback) {
            //if an existing path is in motion, signal to the caller that it has stopped and that it did not reach the destination.
            this._ballisticPathCallback(false);
        }

        var maxFov = this._maxFieldOfView;
        if (simplePathOnly) {
            maxFov = Math.max(this._fieldOfViewSpring.getCurrent(), fov);
        }

        var sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(this._headingSpring.getCurrent(), heading);
        this._ballisticPath = new BallisticPath(this._pitchSpring.getCurrent(), sourceHeading, this._fieldOfViewSpring.getCurrent(), pitch, heading, fov, maxFov);
        this._ballisticStartTime = (new Date()).getTime();
        this._ballisticDuration = this._ballisticPath.getDuration();
        this._ballisticEasingSpline = new SimpleSpline(0, this._ballisticDuration, 0, this._ballisticDuration, 0.5, 0);
        this._ballisticPathCallback = callback;
    },

    _cancelCameraMovements: function (reachedDestination) {
        this._autoplay = false;
        
        if (this._ballisticPathCallback) {
            this._ballisticPathCallback(reachedDestination);
        }

        this._ballisticPath = null;
        this._ballisticStartTime = null;
        this._ballisticDuration = null;
        this._ballisticEasingSpline = null;
        this._ballisticPathCallback = null;
    },

    constrainPitch: function(pitch) {
        var upperLimit, lowerLimit;
        if (this._enforceViewLimits)
        {
            var fovAdjustment = this._fieldOfViewSpring.getCurrent() * 0.5;
            upperLimit = this._upperPitchLimit - fovAdjustment;
            lowerLimit = this._lowerPitchLimit + fovAdjustment;
        }
        else {
            upperLimit = this._upperPitchLimit;
            lowerLimit = this._lowerPitchLimit;
        }
        if (pitch > upperLimit) {
            pitch = upperLimit - 0.0001;
        } else if (pitch < lowerLimit) {
            pitch = lowerLimit + 0.0001;
        }

        return pitch;
    },

    _constrainHeading: function (heading) {
        var constrainedHeading = MathHelper.normalizeRadian(heading);

        var correctedupperHeadingLimit, correctedlowerHeadingLimit;
        
        if (this._enforceViewLimits) {
            var focalLength = (0.5 * 1.0 / this._camera.getViewport().getAspectRatio()) / Math.tan(this._fieldOfViewSpring.getCurrent() * 0.5);
            var horizontalFOV = 2 * Math.atan(0.5 / focalLength);
            //this._viewport.convertVerticalToHorizontalFieldOfView(this._camera.getViewport().getAspectRatio(), this._camera.getVerticalFov());
            correctedupperHeadingLimit = this._upperHeadingLimit - horizontalFOV * 0.5;
            correctedlowerHeadingLimit = this._lowerHeadingLimit + horizontalFOV * 0.5;
        }
        else {
            correctedupperHeadingLimit = this._upperHeadingLimit;
            correctedlowerHeadingLimit = this._lowerHeadingLimit;
        }
        if (MathHelper.isZero(correctedupperHeadingLimit - correctedlowerHeadingLimit)) {
            //Special case.  If 0 and 360 are passed in, they get normalized to the same value.
            //In this case, heading is completely unconstrained. (but it IS normalized)
            return constrainedHeading;
        }

        var distToLower, distToUpper;

        if (correctedlowerHeadingLimit > correctedupperHeadingLimit) {
            //Allowed region shown with equal signs
            // 0   up      low   2PI
            // |====|-------|====|
            if (constrainedHeading >= correctedlowerHeadingLimit || constrainedHeading <= correctedupperHeadingLimit) {
                return constrainedHeading;
            }
            else {
                distToLower = correctedlowerHeadingLimit - constrainedHeading;
                distToUpper = constrainedHeading - correctedupperHeadingLimit;
            }
        }
        else {
            //Allowed region shown with equal signs
            // 0   low     up    2PI
            // |----|=======|----|
            if (constrainedHeading >= correctedlowerHeadingLimit && constrainedHeading <= correctedupperHeadingLimit) {
                return constrainedHeading;
            }
            else if (constrainedHeading < correctedlowerHeadingLimit) {
                distToLower = correctedlowerHeadingLimit - constrainedHeading;
                distToUpper = constrainedHeading + MathHelper.twoPI - correctedupperHeadingLimit;
            }
            else { //(constrainedHeading > correctedupperHeadingLimit)
                distToLower = correctedlowerHeadingLimit - (constrainedHeading + MathHelper.twoPI);
                distToUpper = constrainedHeading - correctedupperHeadingLimit;
            }
        }

        return (distToLower < distToUpper) ? correctedlowerHeadingLimit : correctedupperHeadingLimit;
    },

    setAutoplay: function (autoplay) {
        this._autoplay = autoplay;
        this._prevUpdateTime = null;

        var timeToMoveByOneScreen = 4500; //experimentally determined to look pretty good.

        this._autoplayRadiansPerMillisecond = this._fieldOfViewSpring.getCurrent() / timeToMoveByOneScreen;
    },

    setPitchAndHeading: function (pitch, heading, animate) {
        this._cancelCameraMovements(false);

        var constrainedPitch = this.constrainPitch(pitch),
            constrainedHeading = this._constrainHeading(heading);

        if (animate) {
            this._pitchSpring.setTarget(constrainedPitch);
            
            var currentHeading = this._headingSpring.getCurrent();
            currentHeading = MathHelper.pickStartHeadingToTakeShortestPath(currentHeading, constrainedHeading);

            this._headingSpring.setCurrent(currentHeading);
            this._headingSpring.setTarget(constrainedHeading);
        }
        else {
            this._pitchSpring.setCurrentAndTarget(constrainedPitch);
            this._headingSpring.setCurrentAndTarget(constrainedHeading);
            this.updateCameraProperties();
        }
    },

    getPitchAndHeading: function () {
        var pitchAndHeading = [this._pitchSpring.getCurrent(), this._headingSpring.getCurrent()];
        return pitchAndHeading;
    },

    getTargetPitchAndHeading: function () {
        return [this._pitchSpring.getTarget(), this._headingSpring.getTarget()];
    },

    getVerticalFovLimits: function () {
        return { minimum: this._minFieldOfView, maximum: this._maxFieldOfView };
    },

    setVerticalFov: function (fov, animate) {
        this._cancelCameraMovements(false);

        var clampedFov = MathHelper.clamp(fov, this._minFieldOfView, this._maxFieldOfView);

        if (animate) {
            this._fieldOfViewSpring.setTarget(clampedFov);
        }
        else {
            this._fieldOfViewSpring.setCurrentAndTarget(clampedFov);
        }
        this.updateCameraProperties();
    },

    getVerticalFov: function () {
        return this._fieldOfViewSpring.getCurrent();
    },

    getMinVerticalFov: function () {
        return this._minFieldOfView;
    },

    getMaxVerticalFov: function () {
        return this._maxFieldOfView;
    },

    getRelativeTarget: function (startingPitch,
                                startingHeading,
                                dx,
                                dy,
                                viewportWidth,
                                viewportHeight,
                                deltaMultiplier) {
        dx *= deltaMultiplier;
        dy *= deltaMultiplier;

        var focalLength = this._camera.getFocalLength();
        var relativePitch;
        var relativeHeading;
        var pitchAndHeading = this.calculatePitchAndHeadingDelta(dx,
                                                                 dy,
                                                                 viewportWidth,
                                                                 viewportHeight,
                                                                 focalLength);

        relativePitch = pitchAndHeading[0];
        relativeHeading = pitchAndHeading[1];

        //use - heading because if the user swiped from left to right, they get a positive
        //heading value but a right to left swipe would mean we need to turn the camera
        //in the opposite direction
        var targetHeading = MathHelper.normalizeRadian(startingHeading - relativeHeading);

        //We use - for relative pitch because a positive relative pitch means the user
        //must have had a negative movement in screen space it a swipe up, which means we 
        //actually want to rotate down
        var targetPitch = startingPitch - relativePitch;

        var worldToLocalTransform = this.deviceRotation.inverse().multiply(this.panoramaLocalTransform.multiply(this.panoramaWorldTransform.inverse()));
        var sourcePitchAndHeading = [this._pitchSpring.getCurrent(), this._headingSpring.getCurrent()];
        var sourceHeading = sourcePitchAndHeading[1];
        sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(sourceHeading, targetHeading);

        return {
            fromPitch: sourcePitchAndHeading[0],
            fromHeading: sourceHeading,
            toPitch: targetPitch,
            toHeading: targetHeading
        }
    },

    setRelativeTarget: function (startingPitch,
                                startingHeading,
                                dx,
                                dy,
                                viewportWidth,
                                viewportHeight,
                                deltaMultiplier) {
        dx *= deltaMultiplier;
        dy *= deltaMultiplier;

        var focalLength = this._camera.getFocalLength();
        var relativePitch;
        var relativeHeading;
        var pitchAndHeading = this.calculatePitchAndHeadingDelta(
            dx,
            dy,
            viewportWidth,
            viewportHeight,
            focalLength);

        relativePitch = pitchAndHeading[0];
        relativeHeading = pitchAndHeading[1];

        //use - heading because if the user swiped from left to right, they get a positive
        //heading value but a right to left swipe would mean we need to turn the camera
        //in the opposite direction
        this._targetHeading = this._constrainHeading(startingHeading - relativeHeading);

        //We use - for relative pitch because a positive relative pitch means the user
        //must have had a negative movement in screen space it a swipe up, which means we 
        //actually want to rotate down
        this._targetPitch = startingPitch - relativePitch;

        //The caller can specify the upper and lower limits of rotation, we need to honor them
        this._targetPitch = this.constrainPitch(this._targetPitch);

        var worldToLocalTransform = this.deviceRotation.inverse().multiply(this.panoramaLocalTransform.multiply(this.panoramaWorldTransform.inverse()));
        var sourcePitchAndHeading = [this._pitchSpring.getCurrent(), this._headingSpring.getCurrent()]
        this._sourcePitch = sourcePitchAndHeading[0];
        this._sourceHeading = sourcePitchAndHeading[1];

        this._sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(this._sourceHeading, this._targetHeading);

        this._pitchSpring.setCurrent(this._sourcePitch);
        this._pitchSpring.setTarget(this._targetPitch);
        this._headingSpring.setCurrent(this._sourceHeading);
        this._headingSpring.setTarget(this._targetHeading);
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

        var upComponent = look.dot(this._worldUp);
        var sideComponent = look.dot(this._worldSide);
        var forwardComponent = look.dot(this._worldLook);

        //Now determine the pitch/heading off from the world look
        var pitch = Math.atan2(upComponent, Math.max(0, Math.sqrt(1 - upComponent * upComponent)));
        var heading = MathHelper.normalizeRadian(Math.atan2(sideComponent, forwardComponent));

        if (isNaN(pitch) || isNaN(heading)) {
            return null;
        }

        return { pitch: pitch, heading: heading };
    },

    update: function () {

        if (this.hasCompleted()) {
            return;
        }

        //Need this to be MS for classic spring
        var t = (new Date()).getTime();

        if (this._ballisticPath != null) {
            var timeDelta = t - this._ballisticStartTime;
            if (timeDelta > this._ballisticDuration) {
                this._cancelCameraMovements(true);
            }
            else {
                var easedTimeDelta = this._ballisticEasingSpline.getValue(timeDelta);

                this._pitchSpring.setCurrentAndTarget(this._ballisticPath.getCurrentPitch(easedTimeDelta));
                this._headingSpring.setCurrentAndTarget(this._ballisticPath.getCurrentHeading(easedTimeDelta));
                this._fieldOfViewSpring.setCurrentAndTarget(Math.min(this._ballisticPath.getCurrentFov(easedTimeDelta), this._maxFieldOfView));
            }
        }

        if (this._autoplay && this._prevUpdateTime) {
            var heading = this._headingSpring.getCurrent();

            var headingDelta = this._autoplayRadiansPerMillisecond * (t - this._prevUpdateTime);

            heading += headingDelta;
            heading = MathHelper.normalizeRadian(heading);

            var constrainedHeading = this._constrainHeading(heading);

            if (constrainedHeading != heading) {
                //Went off the edge.  Need to reverse the direction of the autoplay and back up the heading for this frame.
                heading -= 2 * headingDelta;

                this._autoplayRadiansPerMillisecond = -this._autoplayRadiansPerMillisecond;
            }

            this._headingSpring.setCurrentAndTarget(heading);
        }

        this._prevUpdateTime = t;

        if (this._ballisticPath == null) {
            this._pitchSpring.step(t);
            this._headingSpring.step(t);
            this._fieldOfViewSpring.step(t);
        }

        this.updateCameraProperties();
    },

    zoom: function (scaleFactor, fromTarget) {
        this._cancelCameraMovements(false);

        var proposedFov = (fromTarget) ? this._fieldOfViewSpring.getTarget() : this._fieldOfViewSpring.getCurrent();
        proposedFov *= scaleFactor;
        var targetFov = MathHelper.clamp(proposedFov, this._minFieldOfView, this._maxFieldOfView);

        this._fieldOfViewSpring.setTarget(targetFov);
    },

    zoomToggle: function () {
        var mid = (this._minFieldOfView + this._maxFieldOfView) / 2.0;
        if (this._camera.getVerticalFov() > mid) {
            this._fieldOfViewSpring.setTarget(this._minFieldOfView);
        } else {
            this._fieldOfViewSpring.setTarget(this._maxFieldOfView);
        }
    },

    discreteZoomFactor: 0.7,
    tapZoomFactor: 0.6,

    zoomIn: function (zoomFactor) {

        zoomFactor = zoomFactor || this.discreteZoomFactor;

        this._cancelCameraMovements(false);
        this._fieldOfViewSpring.setTarget(
            Math.max(
                this._minFieldOfView,
                this._camera.getVerticalFov() * zoomFactor));
    },

    zoomOut: function (zoomFactor) {

        zoomFactor = zoomFactor || this.discreteZoomFactor;

        this._cancelCameraMovements(false);
        this._fieldOfViewSpring.setTarget(
            Math.min(
                this._maxFieldOfView,
                this._camera.getVerticalFov() / zoomFactor));
    },

    updateCameraProperties: function () {

        //If the spring is not constrained to a target it might go over the allowable limits
        //so we want to make sure this doesn't happen
        var clampedFov = MathHelper.clamp(this._fieldOfViewSpring.getCurrent(), this._minFieldOfView, this._maxFieldOfView);
        var pitch = this.constrainPitch(this._pitchSpring.getCurrent());
        var heading = this._constrainHeading(this._headingSpring.getCurrent());

        var pitchRotation;
        var headingRotation;
        var bubbleLook = new Vector3(0, 0, -1);
        var bubbleUp = new Vector3(0, 1, 0);
        var bubbleSide = new Vector3(1, 0, 0);

        var worldTransform = Matrix4x4.createIdentity();

        this._worldLook = worldTransform.transformVector3(bubbleLook);
        this._worldUp = worldTransform.transformVector3(bubbleUp);
        this._worldSide = worldTransform.transformVector3(bubbleSide);

        //Need - pitch because the math library uses left handed rotations, i.e.
        //a positive angle in the case of the x axis rotation will rotate down
        //(1,0,0) using left hand rule, but a positive pitch in the bubble means
        //that we want to look up so we need to negate this value.
        pitchRotation = Matrix4x4.createRotationX(pitch);
        headingRotation = Matrix4x4.createRotationY(-heading);

        var rotation = headingRotation.multiply(pitchRotation);

        this._look = rotation.transformVector3(this._worldLook);
        this._up = rotation.transformVector3(this._worldUp);
        this._side = rotation.transformVector3(this._worldSide);

        var bubbleOrigin = new Vector3(0, 0, 0);
        var worldPosition = bubbleOrigin;
        this._camera.setPosition(worldPosition);
        this._camera.setLook(this._look);
        this._camera.setUp(this._up);

        this._camera.setVerticalFov(clampedFov);

        if (this.viewChangeCallback != null) {
            this.viewChangeCallback();
        }
    },

    onDiscreteZoom: function (x, y, zoomOut, zoomFactor) {

        // TODO: zoom doesn't support targets, but picking is too abrupt. revisit
        //this.pick(x, y);

        if (!zoomOut) {
            this.zoomIn(zoomFactor);
        } else {
            this.zoomOut(zoomFactor);
        }
    },

    onGestureStart: function (e) {
        this.gestureMode = this.GestureType.DRAG;
        this.userInputing = true;
        this._cancelCameraMovements(false);
        this._userInteracted();
        this.stopMovingCamera();
        this._lastGestureScale = 1;

        var start = e.paths[0].startPointer;
        this.beginRotation(start.x, start.y);
        this._gestureChanged = false;
    },

    onGestureMove: function (e) {
        if (this._isRotating && this.gestureMode === this.GestureType.DRAG) {
            this._gestureChanged = true;
            var movePointer = e.paths[0].movePointer;
            this._lastMovePoint = new Vector2(movePointer.x, movePointer.y);
        }
    },

    onGestureEnd: function () {
        this.userInputing = false;
        if (this._isRotating) {
            this._lastGestureScale = null;
            this.endRotation();
        }
        this.gestureMode = this.GestureType.NONE;
    },

    onPinchStartMove: function(e) {

        // check pinch-to-zoom mode threshold
        if (this.gestureMode !== this.GestureType.PINCH &&
            (e.scale < 0.8 || e.scale > 1.2)) {

            this.gestureMode = this.GestureType.PINCH;
        }

        if (this.gestureMode === this.GestureType.PINCH) {
            var scaleDelta = this._lastGestureScale / e.scale;
            if (scaleDelta !== 1) {

                // dampen scale slightly
                this.zoom(scaleDelta, true);
            }
            this._lastGestureScale = e.scale;
        }
    },

    onPinchEnd: function(e) {
        // go back to drag mode
        this.gestureMode = this.GestureType.DRAG;
    },

    beginRotation: function (x, y) {
        this._isRotating = true;
        this._startingPosition = [x, y];
        this._startingPitchandHeading = this.getPitchAndHeading();
    },

    updateRotation: function () {

        if (this._camera === null) {
            return;
        }

        if (this._lastMovePoint == null) {
            return;
        }

        if (!this._isRotating) {
            return;
        }

        var sx = this._lastMovePoint.x;
        var sy = this._lastMovePoint.y;
        var viewport = this._camera.getViewport();
        var deltaMultiplier = 1.1;
        var dx = sx - this._startingPosition[0];
        var dy = sy - this._startingPosition[1];

        this.setRelativeTarget(
            this._startingPitchandHeading[0],
            this._startingPitchandHeading[1],
            dx,
            dy,
            viewport.getWidth(),
            viewport.getHeight(),
            deltaMultiplier);
    },

    endRotation: function () {
        this._isRotating = false;
        this._lastMovePoint = null;
    },

    pick: function(x, y, zoomOut, zoomFactor) {
        // compute heading and pitch for mouse position
        var w = this._camera.getViewport().getWidth(),
            h = this._camera.getViewport().getHeight(),
            camFov = this._camera.getVerticalFov(),
            camAspect = this._camera.getViewport().getAspectRatio(),
            w2 = w/2,
            h2 = h/2;

        // TODO: (Joel) seems strange - revisit
        x -= 8; y -= 8;
        if (x < 0 || y < 0) {
            console.log("bad");
        }

        var dx = x - w2,
            dy = (h - 1 - y) - h2;
        var deltaPitch = Math.atan(dy / h2 * Math.tan(camFov/2)); 
        var deltaHeading = Math.atan(dx / w2 * Math.tan(camFov/2 * camAspect));

        var targetPitch = this._pitchSpring.getCurrent() + deltaPitch;
        var targetHeading = MathHelper.normalizeRadian(
            this._headingSpring.getCurrent() + deltaHeading);

        zoomFactor = zoomFactor || 1;

        var fov;
        if (zoomOut) {
            fov = Math.min(
                this._maxFieldOfView,
                this._camera.getVerticalFov() / zoomFactor);
        } else {
            fov = Math.max(
                this._minFieldOfView,
                this._camera.getVerticalFov() * zoomFactor);
        }

        this.animateToPose(targetPitch, targetHeading, fov);
    },

    deltaAngles: function (a1, a2) {
        var value = a1 - a2;

        while (value < -Math.PI) {
            value += 2 * Math.PI;
        }

        while (value >= Math.PI) {
            value -= 2 * Math.PI;
        }

        return value;
    },

    deltaThreshold: 0.01 * 0.01 + 0.01 * 0.01,

    isLargeChange: function (d1, d2) {
        return d1 * d1 + d2 * d2 > this.deltaThreshold;
    },

    userInputing: false,

    _userInteracted: function () {
        if (this.userInteractionCallback) {
            this.userInteractionCallback();
        }
    },

    control: function (originalCamera, unprocessedEvents) {
        var now = new Date();
        var i, e, zoomOut;

        for (i = 0; i < unprocessedEvents.length; ++i) {
            e = unprocessedEvents[i];
            switch (e.type) {
                case 'gesturestart':
                    this.onGestureStart(e);
                    break;
                case 'gesturemove':
                    this.onGestureMove(e);
                    break;
                case 'gestureend':
                    this.onGestureEnd();
                    break;
                case 'pinchstart':
                case 'pinchmove':
                    this.onPinchStartMove(e);
                    break;
                case 'pinchend':
                    this.onPinchEnd(e);
                    break;
                case 'mousewheel':
                    this._cancelCameraMovements(false);
                    this._userInteracted();
                    //console.log('mousehweel delta: ' + e.delta);
                    zoomOut = (e.delta < 0);
                    this.onDiscreteZoom(e.x, e.y, zoomOut);
                    break;
                case 'doubletap':
                    this._cancelCameraMovements(false);
                    this._userInteracted();
                    zoomOut = false;
                    this.pick(e.x, e.y, zoomOut, this.tapZoomFactor);
                    break;
                case 'holdstart':
                    this.onGestureEnd();
                    $.event.trigger('panohold');
                    break;
                case 'zoompoint':
                    //console.log(e.zoomInfo);
                    zoomOut = false;
                    this.pick(e.zoomInfo.x, e.zoomInfo.y, zoomOut, e.zoomInfo.scale);
                    break;
                case 'keydown':
                    this.userInputing = true;
                    this._cancelCameraMovements(false);
                    this._userInteracted();
                    this.onKeyDown(e);
                    break;
                case 'keyup':
                    this.userInputing = false;
                    this.onKeyUp(e);
                    break;
                default:
                    break;
            }
        }

        if (this._gyrometer) {
            var gyroReading = this._gyrometer.getCurrentReading();
            
            if (gyroReading &&
               this.prevGyroReading &&
               gyroReading.timestamp != this.prevGyroReading.timestamp &&
               !this.userInputing &&
               this._ballisticPath == null &&
               this.prevFrameTime) {
                var pitchHeadingDelta = this.processGyrometerReading(gyroReading, now - this.prevFrameTime);
                
                if (pitchHeadingDelta[0] !== 0 || pitchHeadingDelta[1] !== 0) {
                    var pitchHeadingTarget = this.getTargetPitchAndHeading();
                    var pitch = pitchHeadingTarget[0] + pitchHeadingDelta[0];
                    var heading = pitchHeadingTarget[1] - pitchHeadingDelta[1];

                    this.setPitchAndHeading(pitch, heading, true);
                }
            }

            this.prevGyroReading = gyroReading;
        }

        this.update();
        this.updateRotation();
        this.prevFrameTime = now;
        
        return this._camera;
    },

    setGyrometer: function (gyrometer) {
        this._gyrometer = gyrometer;
    },

    processGyrometerReading: function (reading, timeDelta) {
        var threshold = (this.prevGyrometerReadingNonZero) ? 2 : 2;

        if (reading == null) {
            this.prevGyrometerReadingNonZero = false;
            return [0,0];
        }

        if (Math.abs(reading.angularVelocityX) < threshold &&
            Math.abs(reading.angularVelocityY) < threshold &&
            Math.abs(reading.angularVelocityZ) < threshold) {
            //if the rotation is below some threshold, then it's probably sensor drift, so just ignore.
            this.prevGyrometerReadingNonZero = false;
            return [0,0];
        }

        this.prevGyrometerReadingNonZero = true;

        //Value is given in degrees per second.  Convert to radians per millisecond.
        //Also adjust to current FOV.  If we didn't do this, then the camera goes crazy when zoomed in far.
        var multiplier = 1.5 * MathHelper.degreesToRadians(timeDelta / 1000) * Math.sin(this.getVerticalFov());

        var headingDelta = reading.angularVelocityY * multiplier;
        var pitchDelta = reading.angularVelocityX * multiplier;

        var currentOrientation = null;

        if (Windows && Windows.Graphics && Windows.Graphics.Display && Windows.Graphics.Display.DisplayProperties) {
            currentOrientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;
        }

        if (currentOrientation == null || currentOrientation === Windows.Graphics.Display.DisplayOrientations.none || currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscape) {
            return [pitchDelta, headingDelta];
        }
        else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.portrait) {
            return [headingDelta, -pitchDelta];
        }
        else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscapeFlipped) {
            return [-pitchDelta, -headingDelta];
        }
        else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.portraitFlipped) {
            return [-headingDelta, pitchDelta];
        }
    },

    _updateMinFov: function () {
        // if _minClientPreferredFieldOfView was specified then honor it, else update the MinFOV
        if (this._dimension && !this._minClientPreferredFieldOfView) {
            this._minFieldOfView = this._height * MathHelper.degreesToRadians(90) / (this._dimension * this._maxPixelScaleFactor); //let them zoom in until each pixel is expanded to 2x2
        }
    },

    setMaxPixelScaleFactor: function (factor) {
        if (factor < 1) {
            throw "Max pixel scale factor must be 1 or greater";
        }

        this._maxPixelScaleFactor = factor;
        this._updateMinFov();
    },
    
    setViewportSize: function (width, height) {
        this._height = height;
        this._updateMinFov();
    },

    scrollSpeedX: 0,
    scrollSpeedY: 0,
    scrollAccX: 0,
    scrollAccY: 0,
    motionHandle: 0,

    onKeyDown: function (e) {

        if (e.keyCode == '37') //left arrow
            this.startRotateHeading(-1);
        else if (e.keyCode == '38') //up arrow
            this.startRotatePitch(1);
        else if (e.keyCode == '39') //right arrow
            this.startRotateHeading(1);
        else if (e.keyCode == '40') //down arrow
            this.startRotatePitch(-1);
        else if (e.keyCode == '107' || e.keyCode == '187') //+ keypad or +/=
            this.zoomIn();
        else if (e.keyCode == '109' || e.keyCode == '189') //- keypad or -/_
            this.zoomOut();
    },

    onKeyUp: function (e) {
        if (e.keyCode == '37' || e.keyCode == '39') //left or right arrow
            this.stopRotateHeading();
        else if (e.keyCode == '38' || e.keyCode == '40') //up or down arrow
            this.stopRotatePitch();
    },

    startRotatePitch: function (acc) {
        this.scrollAccY = acc;
        this.moveCamera();
    },

    stopRotatePitch: function () {
        this.scrollAccY = 0;
    },

    startRotateHeading: function (acc) {
        this.scrollAccX = acc;
        this.moveCamera();
    },

    stopRotateHeading: function () {
        this.scrollAccX = 0;
    },

    moveCamera: function () {
        var that = this;
        if (!this.motionHandle) {
            this.motionHandle = setInterval(function () {

                //Apply acceleration
                that.scrollSpeedX += that.scrollAccX;
                that.scrollSpeedY += that.scrollAccY;

                //Apply dampener
                that.scrollSpeedX *= 0.9;
                that.scrollSpeedY *= 0.9;

                var ph = that.getPitchAndHeading();

                //Modify pitch and heading
                ph[0] += that.scrollSpeedY / 200;
                ph[1] += that.scrollSpeedX / 200;
                that.setPitchAndHeading(ph[0], ph[1]);

                //Came to a stop - remove motion handler
                if (Math.abs(that.scrollSpeedX) < 0.1 && Math.abs(that.scrollSpeedY) < 0.1) {
                    that.stopMovingCamera();
                    return;
                }
            }, 33); //cap at 30 fps
        }
    },

    stopMovingCamera: function () {
        if( this.motionHandle) {
            clearInterval(this.motionHandle);
            this.motionHandle = 0;
        }
    }
};