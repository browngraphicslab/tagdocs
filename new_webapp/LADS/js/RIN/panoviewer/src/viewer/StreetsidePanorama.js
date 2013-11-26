function StreetsidePanorama() {
	StreetsidePanorama.__super.call(this);
}

extend(StreetsidePanorama, Panorama);

StreetsidePanorama.prototype.animationDurationMS = 0;

StreetsidePanorama.prototype.createController = function (initialPanoramaEntities, camera, cameraParameters) {
    var cameraController = new StreetsideCameraController(camera, cameraParameters);
    if (initialPanoramaEntities && initialPanoramaEntities[0]) {
        //TODO: Ideally we'd do something smart for multiple cubes.
        var cubeSource = initialPanoramaEntities[0].source;

        var pitch;
        var heading;

        if (cubeSource.startingPitch != undefined) {
            pitch = cubeSource.startingPitch;
        }
        if (cubeSource.startingHeading != undefined) {
            heading = cubeSource.startingHeading;
        }

        cameraController.setViewTarget(pitch, heading, null, false);
    }
    return cameraController;
};

Config.StreetsidePanoramaExists = true;
