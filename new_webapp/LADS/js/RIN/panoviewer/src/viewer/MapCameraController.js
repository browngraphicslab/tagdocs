/**
* This controls camera
* @constructor
*/
function MapCameraController(camera, upperPitchLimit, lowerPitchLimit) {

    this._camera = camera;
    this._upperPitchLimit = upperPitchLimit || MathHelper.degreesToRadians(90);
    this._lowerPitchLimit = lowerPitchLimit || MathHelper.degreesToRadians(-90);
    this._pitchSpring = new ClassicSpring(0.0005, 0.6, false);
    this._headingSpring = new ClassicSpring(0.001, 0.6, false);
    this._orientUpSpring = new ClassicSpring(0.01, 0.6, false);
    this._fieldOfViewSpring = new ClassicSpring(0.0033, 0.6, false);

	this._bubbleOriginXSpring = new ClassicSpring(0.001, 0.6, false);
	this._bubbleOriginYSpring = new ClassicSpring(0.001, 0.6, false);
	this._bubbleOriginZSpring = new ClassicSpring(0.001, 0.6, false);

    this._sourcePitch = 0;
    this._sourceHeading = 0;
    this._targetPitch = 0;
    this._targetHeading = 0;
    this.panoramaWorldTransform = Matrix4x4.createIdentity();
    this.panoramaLocalTransform = Matrix4x4.createIdentity();
    this._orientUpAxis = new Vector3(0, 1, 0);
    this._orientUpAngle = 0;
    this._targetUp = new Vector3(0, 1, 0);
	this._bubbleOrigin = new Vector3(0,0,0);

    var pitchAndHeading = this.getPitchAndHeading();
    this._pitchSpring.setCurrentAndTarget(pitchAndHeading[0]);
    this._headingSpring.setCurrentAndTarget(pitchAndHeading[1]);
    this._fieldOfViewSpring.setCurrentAndTarget(this._camera.getVerticalFov());

    this._minFieldOfView =  MathHelper.degreesToRadians(20);
    this._maxFieldOfView =  MathHelper.degreesToRadians(80);

    //Used for state tracking. If this grows beyond the bool & point.
    //we should refactor to use a state machine (see TouchController.js)

    this._startingPitchandHeading = null;
    this._startingPosition = null;
    this._isRotating = false;
    this._lastMovePoint = null;
}

MapCameraController.calculatePitchAndHeading = function (currentLook,
                                                            worldToLocalTransform) {

    //Bubble has a right handed coord system
    //look = 0,0,-1
    //up = 0,1,0
    //right = 1,0,0
    //so a currentLook of 0,0,-1 will give a heading of 0 radians

    var transformedLook = worldToLocalTransform.transformVector3(currentLook);
    var pitch = Math.atan2(transformedLook.y, Math.max(0, Math.sqrt(1 - transformedLook.y * transformedLook.y)));
    var heading = Math.atan2(transformedLook.x, -transformedLook.z);

    //Make heading always fall between 0 and 2PI
    if (heading < 0) {
        heading += (2 * Math.PI);
    }

    return [pitch, heading];
};

MapCameraController.prototype = {

    hasCompleted: function () {
        return !this.forceUpdate && this._pitchSpring.isSettled() &&
               this._headingSpring.isSettled() &&
               this._orientUpSpring.isSettled() &&
               this._fieldOfViewSpring.isSettled() &&
               this._bubbleOriginXSpring.isSettled() &&
               this._bubbleOriginYSpring.isSettled() &&
               this._bubbleOriginZSpring.isSettled()
			   ;
    },

    calculatePitchAndHeadingDelta: function (dx,
                                            dy,
                                            viewportWidth,
                                            viewportHeight,
                                            focalLength) {
        var pitch, heading;
        var aspectRatio = viewportWidth / viewportHeight;

        if (dx === 0) {
            heading = 0;
        }
        else {
            heading = 2 * Math.atan((aspectRatio * (dx / viewportWidth)) / focalLength);
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

    setPitchAndHeading: function (pitch, heading) {

        this._pitchSpring.setCurrentAndTarget(pitch);
        this._headingSpring.setCurrentAndTarget(heading);
        this.updateCameraProperties();
    },

	setBubbleOrigin: function(p) {
		this._bubbleOriginXSpring.setCurrentAndTarget(p.x);
		this._bubbleOriginYSpring.setCurrentAndTarget(p.y);
		this._bubbleOriginZSpring.setCurrentAndTarget(p.z);
		this._bubbleOrigin = p;
	},

    getPitchAndHeading: function () {
        var pitchAndHeading = MapCameraController.calculatePitchAndHeading(this._camera.getLook(),
                                                                              this.panoramaLocalTransform.multiply(this.panoramaWorldTransform.inverse()));
        return pitchAndHeading;
    },

    setVerticalFov: function (fov) {
        this._fieldOfViewSpring.setCurrentAndTarget(fov);
        this.updateCameraProperties();
    },

    getVerticalFov: function () {
        return this._fieldOfViewSpring.getCurrent();
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
        this._targetHeading = startingHeading - relativeHeading;
        if (this._targetHeading < 0) {
            this._targetHeading += 2 * Math.PI;
        }

        //We use - for relative pitch because a positive relative pitch means the user
        //must have had a negative movement in screen space it a swipe up, which means we
        //actually want to rotate down
        this._targetPitch = startingPitch - relativePitch;

        //The caller can specify the upper and lower limits of rotation, we need to honour them
        if (this._targetPitch > this._upperPitchLimit) {
            this._targetPitch = this._upperPitchLimit - 0.0001;
        }
        if (this._targetPitch < this._lowerPitchLimit) {
            this._targetPitch = this._lowerPitchLimit + 0.0001;
        }

        var worldToLocalTransform = this.panoramaLocalTransform.multiply(this.panoramaWorldTransform.inverse());
        var sourcePitchAndHeading = MapCameraController.calculatePitchAndHeading(this._camera.getLook(),
                                                                                    worldToLocalTransform);
        this._sourcePitch = sourcePitchAndHeading[0];
        this._sourceHeading = sourcePitchAndHeading[1];

        this._sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(this._sourceHeading, this._targetHeading);

        this._pitchSpring.setCurrent(this._sourcePitch);
        this._pitchSpring.setTarget(this._targetPitch);
        this._headingSpring.setCurrent(this._sourceHeading);
        this._headingSpring.setTarget(this._targetHeading);

        var sourceUp = this._camera.getUp();
        this._targetUp = new Vector3(0, 1, 0);
        this._orientUpAxis = sourceUp.cross(this._targetUp).normalize();
        this._orientUpAngle = -Math.acos(sourceUp.dot(this._targetUp));

        if (sourceUp.equals(this._targetUp)) {
            this._orientUpSpring.setCurrentAndTarget(1);
        }
        else {
            this._orientUpSpring.setCurrent(0);
            this._orientUpSpring.setTarget(1);
        }

    },

    update: function () {

        if (this.hasCompleted()) {
            return;
        }

        //Need this to be MS for classic spring
        var t = (new Date()).getTime();

        this._pitchSpring.step(t);
        this._headingSpring.step(t);
        this._orientUpSpring.step(t);
        this._fieldOfViewSpring.step(t);
		this._bubbleOriginXSpring.step(t);
		this._bubbleOriginYSpring.step(t);
		this._bubbleOriginZSpring.step(t);
        this.updateCameraProperties();
    },

    zoom: function (scaleFactor) {
        var proposedFov = this._camera.getVerticalFov() * scaleFactor;
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

    zoomIn: function () {
        this._fieldOfViewSpring.setTarget(this._camera.getVerticalFov() * this.discreteZoomFactor);
    },

    zoomOut: function () {
        this._fieldOfViewSpring.setTarget(Math.min(MathHelper.degreesToRadians(80), this._camera.getVerticalFov() / this.discreteZoomFactor));
    },

    updateCameraProperties: function () {

        //If the spring is not constrained to a target it might go over the allowable limits
        //so we want to make sure this doesn't happen
        var pitch = this._pitchSpring.getCurrent();
        if (pitch > this._upperPitchLimit) {
            pitch = this._upperPitchLimit - 0.0001;
        }
        if (pitch < this._lowerPitchLimit) {
            pitch = this._lowerPitchLimit + 0.0001;
        }

        var pitchRotation;
        var headingRotation;
        //var rollRotation;
        var bubbleLook = new Vector3(0, 0, -1);
        var bubbleUp = new Vector3(0, 1, 0);
        var bubbleSide = new Vector3(1, 0, 0);

        var worldTransform = Matrix4x4.createIdentity();
        var worldLook = worldTransform.transformVector3(bubbleLook);
        var worldUp = worldTransform.transformVector3(bubbleUp);
        var worldSide = worldTransform.transformVector3(bubbleSide);

        //Need - pitch because the math library uses left handed rotations, i.e.
        //a positive angle in the case of the x axis rotation will rotate down
        //(1,0,0) using left hand rule, but a positive pitch in the bubble means
        //that we want to look up so we need to negate this value.
        pitchRotation = Matrix4x4.createRotationX(pitch);
        headingRotation = Matrix4x4.createRotationY(-this._headingSpring.getCurrent());
        //rollRotation = Matrix4x4.createRotationZ(this._rollSpring.getCurrent());

        var newLook = headingRotation.multiply(pitchRotation).transformVector3(worldLook);

        if (!this._orientUpSpring.isSettled()) {
            var newUp = Quaternion.fromAxisAngle(this._orientUpAxis, (1 - this._orientUpSpring.getCurrent()) * this._orientUpAngle).transform(this._targetUp);
            this._camera.setUp(newUp);
        }

        //var bubbleOrigin = new Vector3(0, 0, 0);
        //var worldPosition = this._bubbleOrigin;
		var x = this._bubbleOriginXSpring.getCurrent();
		var y = this._bubbleOriginYSpring.getCurrent();
		var z = this._bubbleOriginZSpring.getCurrent();
		this._bubbleOrigin = new Vector3(x, y, z);
		worldPosition = this._bubbleOrigin;
        this._camera.setPosition(worldPosition);
        this._camera.setLook(newLook);
        // this._camera.setUp(newUp); //worldUp);

        this._camera.setVerticalFov(this._fieldOfViewSpring.getCurrent());
    },

    onGestureStart: function (e) {
        this._mouseDownPoint = new Vector2(e.screenX, e.screenY);
        this.beginRotation(e.screenX, e.screenY);
    },

    onGestureEnd: function (e) {
        this.endRotation();
        var mouseUpPoint = new Vector2(e.screenX, e.screenY);
        var delta = mouseUpPoint.subtract(this._mouseDownPoint).length();
    },

    onGestureChange: function (e) {
        this._lastMovePoint = new Vector2(this._mouseDownPoint.x + e.translationX, this._mouseDownPoint.y + e.translationY);
    },

    onDiscreteZoom: function (e) {
        //var wheelDelta = Utils.getWheelDelta(e);

        var zoomPoint = new Vector2(this._camera.getViewport().getWidth() / 2, this._camera.getViewport().getHeight() / 2);
        if (e.direction > 0) {
            this.zoomIn(zoomPoint);
        }
        else {
            this.zoomOut(zoomPoint);
        }
    },

    beginRotation: function (x, y) {
        this._isRotating = true;
        this._startingPosition = [x, y];
        this._startingPitchandHeading = this.getPitchAndHeading();
    },

    endRotation: function () {
        this._isRotating = false;
        this._lastMovePoint = null;
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
        //var viewport = this._rmlWindow.getGraphicsDevice().getCamera().getViewport();
        var viewport = this._camera.getViewport();
        var deltaMultiplier = 1.1;
        var dx = sx - this._startingPosition[0];
        var dy = sy - this._startingPosition[1];

        this.setRelativeTarget(this._startingPitchandHeading[0],
                                                      this._startingPitchandHeading[1],
                                                      dx,
                                                      dy,
                                                      viewport.getWidth(),
                                                      viewport.getHeight(),
                                                      deltaMultiplier);
    },

	onKeyDown: function(e) {
		var key = String.fromCharCode(e.keyCode);
		Utils.log("key: "+key);
		var pos = this._camera.getPosition();
		var z = Math.abs(Math.abs(pos.z)-0.5);
		var amount = z / 8;
		switch (key) {
			case 'A':
			case 'a':
				this._bubbleOriginXSpring.setTarget(this._bubbleOrigin.x - amount);
				this.forceUpdate = true;
				break;
			case 'D':
			case 'd':
				this._bubbleOriginXSpring.setTarget(this._bubbleOrigin.x + amount);
				this.forceUpdate = true;
				break;
			case 'W':
			case 'w':
				this._bubbleOriginYSpring.setTarget(this._bubbleOrigin.y + amount);
				this.forceUpdate = true;
				break;
			case 'S':
			case 's':
				this._bubbleOriginYSpring.setTarget(this._bubbleOrigin.y - amount);
				this.forceUpdate = true;
				break;
			case 'k':
			case 'K':
				this._bubbleOriginZSpring.setTarget(this._bubbleOrigin.z - amount);
				this.forceUpdate = true;
				break;
			case 'm':
			case 'M':
				this._bubbleOriginZSpring.setTarget(this._bubbleOrigin.z + amount);
				this.forceUpdate = true;
				break;
			case 'R':
			case 'r':
				this.setBubbleOrigin(new Vector3(0,0,0));
				this.forceUpdate = true;
				break;
		}
	},

    control: function (originalCamera, unprocessedEvents) {
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
                    this.onGestureChange(e);
                    break;
                case 'discreteZoom':
                    this.onDiscreteZoom(e);
                    break;
				case 'keydown':
					this.onKeyDown(e);
					break;
                default:
                    break;
            }
        }
        this.update();
        this.updateRotation();
		this.forceUpdate = false;
        return this._camera;
    }
};
