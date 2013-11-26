var StreetsideRml = {
    faceNames: ['frontFace', 'rightFace', 'backFace', 'leftFace', 'topFace', 'bottomFace'],
    faceQuadkeys: ['01', '02', '03', '10', '11', '12'],
    subdomainCount: 4,
    createCameraParameters: function (roll, pitch, heading, verticalFov) {
        var rotationMatrix = StreetsideRml.createRotationMatrix(roll, pitch, heading);
        return {
            'verticalFov': verticalFov || MathHelper.degreesToRadians(80),
            'position': new Vector3(0, 0, 0),
            'look': rotationMatrix.transformVector3(new Vector3(0, 0, -1)),
            'up': rotationMatrix.transformVector3(new Vector3(0, 1, 0)),
            'side': rotationMatrix.transformVector3(new Vector3(1, 0, 0))
        };
    },
    createRotationMatrix: function (roll, pitch, heading) {
        var rollRotation = Matrix4x4.createRotationZ(roll);
        var pitchRotation = Matrix4x4.createRotationX(-pitch);
        var headingRotation = Matrix4x4.createRotationY(heading);
        return rollRotation.multiply(pitchRotation.multiply(headingRotation));
    },
    create: function (urlFormat, bubbleId, startingHeading, startingPitch) {
        var rml = {
            id: 'streetsideCube' + bubbleId,
            type: 'streetsidePanorama',
            source: {
                'dimension': 2032,
                'tileSize': 254,
                'tileOverlap': 1,
                'tileBorder': 1,
                'minimumLod': 8,
                'bounds': {
                    'left': -3.141592653589793,
                    'right': 3.141592653589793,
                    'top': -1.5707963267948966,
                    'bottom': 1.5707963267948966
                },
                'startingPitch': startingPitch || 0,
                'startingHeading': startingHeading || 0,
                'projectorAspectRatio': 1,
                'projectorFocalLength': 0.5
            }
        };

        for (var i = 0; i < StreetsideRml.faceNames.length; i++) {
            var faceName = StreetsideRml.faceNames[i];
            var faceQuadkey = bubbleId + StreetsideRml.faceQuadkeys[i];
            var faceUrlFormat = urlFormat.replace('{quadkey}', faceQuadkey + '{quadkey}');
            var faceDefaultSubdomain = i % StreetsideRml.subdomainCount;
            rml.source[faceName] = {
                tileSource: (new StreetsideCubeFaceTileSource(faceUrlFormat, faceDefaultSubdomain)).getTileUrl,
                clip: [
					0,
					0,
					0,
					2032,
					2032,
					2032,
					2032,
					0
                ]
            };
        }
        return rml;
    }
};