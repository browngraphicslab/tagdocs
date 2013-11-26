function BallisticPath(pitch1, heading1, fov1, pitch2, heading2, fov2, maxAllowedFov, durationScaleOverride) {
    //Approximate a field of view that will show both centerpoints at once but never have the middlepoint fov smaller than either fov1 or fov2
    var middleFov = Math.abs(pitch1 - pitch2) + Math.abs(heading1 - heading2);

    var minFov = Math.min(fov1, fov2);
    var maxFov = Math.max(fov1, fov2);

    var minDuration = 0.5;

    var pitchSpline, headingSpline, fovSpline;

    if (middleFov > maxFov) {
        //zoom out in the middle of the animation
        
        //Don't zoom out beyond the max allowable fov
        middleFov = Math.min(middleFov, maxAllowedFov);

        var fovDelta = (middleFov / maxFov) + (middleFov / minFov);
        var duration = (minDuration + Math.log(fovDelta)) * 700 * (durationScaleOverride ? durationScaleOverride : 1.0);

        pitchSpline = new SimpleSpline(0, duration, pitch1, pitch2, 0, 0);
        headingSpline = new SimpleSpline(0, duration, heading1, heading2, 0, 0);
        fovSpline = new CompositeSpline([0, duration / 2, duration], [fov1, middleFov, fov2], [0, 0, 0]);
    }
    else {
        //no mid-animation zoom-out

        var fovDelta = maxFov / minFov;
        var duration = (minDuration + Math.log(fovDelta)) * 700 * (durationScaleOverride ? durationScaleOverride : 1.0);

        pitchSpline = new SimpleSpline(0, duration, pitch1, pitch2, 0, 0);
        headingSpline = new SimpleSpline(0, duration, heading1, heading2, 0, 0);
        fovSpline = new SimpleSpline(0, duration, fov1, fov2, 0, 0);
    }

    this.getDuration = function () {
        return duration;
    };

    this.getCurrentPitch = function (time) {
        return pitchSpline.getValue(time);
    };

    this.getCurrentHeading = function (time) {
        return headingSpline.getValue(time);
    };

    this.getCurrentFov = function (time) {
        return fovSpline.getValue(time);
    };
}
