var HotspotCreator = function() {
	this._hotspotImageSize = 128;
	this._distToEye = 0.5;
};

HotspotCreator.prototype.projectPolygonFromNDCToTexture =
function (imageSpaceEye, modelViewProjection, ndcPolygon, imageDim) {
	var inverseModelViewProjection = modelViewProjection.inverse();
	var polygonProjectedOntoImage = [];
	for (var i = 0; i < ndcPolygon.length; ++i) {
		var vImageSpace = inverseModelViewProjection.transformVector4(ndcPolygon[i]);
		vImageSpace.x /=vImageSpace.w;
		vImageSpace.y /= vImageSpace.w;
		vImageSpace.z /= vImageSpace.w;
		vImageSpace.w = 1.0;
		vImageSpace.y = imageDim-1 - vImageSpace.y; //Convert to from image space (Y-up) to texture space (Y-down).
		polygonProjectedOntoImage.push(vImageSpace);
	}

	return polygonProjectedOntoImage;
}

HotspotCreator.prototype.getClippedPolygon =
function(faceName, getModelTransform, viewProjectionTransform, faceDim) {
	var clipDim = 1024;
	var clipModelTransform = getModelTransform(clipDim, faceName);
	var ndcPolygon = [],
		i,
		clippedNDCPolygon,
		backProjectedPolygon,
		inverseModelTransform =  clipModelTransform.inverse(),
		projectorPosition = inverseModelTransform.transformVector4(new Vector4(0,0,0,1)),
		modelViewProjection = viewProjectionTransform.multiply(clipModelTransform),
		imageCorners = [
			new Vector4(0,0,0,1),
		new Vector4(0,clipDim,0,1),
		new Vector4(clipDim,clipDim,0,1),
		new Vector4(clipDim,0,0,1),
		];

	for(i = 0; i < imageCorners.length; ++i) {
		ndcPolygon.push(modelViewProjection.transformVector4(imageCorners[i]));
	}

	var clippedNDCPolygon = convexPolygonClipper.clip(new Vector4(-1,-1,-1) , new Vector4(1, 1, 1), ndcPolygon);
	var backProjectedPolygon = this.projectPolygonFromNDCToTexture(projectorPosition, modelViewProjection, clippedNDCPolygon, clipDim);

	var ratio = faceDim / clipDim;
	for(var i = 0; i < backProjectedPolygon.length; ++i) {
		backProjectedPolygon[i].x *= ratio;
		backProjectedPolygon[i].y = faceDim-1-
			(clipDim-1-backProjectedPolygon[i].y)*ratio;
	}

	return {
		ndcSpacePolygon : clippedNDCPolygon,
						textureSpacePolygon : backProjectedPolygon
	};
};

HotspotCreator.prototype.create = function(info, heading, pitch, fov, cameraFov, aspect,
		backgroundColor, animate) {
	if (heading < 0)
		heading += 2*Math.PI;

	var centeringMat = Matrix4x4.createTranslation(-this._hotspotImageSize/2, -this._hotspotImageSize/2, 0);
	var ratio = 1.0 / this._hotspotImageSize * (this._distToEye/Math.tan(fov/2) * 2);
	var scalingMat = Matrix4x4.createScale(ratio*aspect, ratio, 1);
	var posInDepthMat = Matrix4x4.createTranslation(0, 0, -this._distToEye);

	var rotMat = Matrix4x4.createRotationY(-heading).multiply(Matrix4x4.createRotationX(pitch)); //this.camera.getViewTransform().inverse();
	var hotspotMat = rotMat.multiply(posInDepthMat.multiply(scalingMat.multiply(centeringMat)));
	var textureURL = this.createTexture(this._hotspotImageSize, backgroundColor, true);
	var renderable;
	if (Config && Config.Render2DToTexture) {
		var textureURL = this.createTexture(this._hotspotImageSize, backgroundColor, true);
		renderable = new TexturedQuadRenderable(
			this._hotspotImageSize, this._hotspotImageSize,
			hotspotMat,
			textureURL,
			null, null, true);
	} else {
		// Render with the CSS overlay approach
		renderable = new TexturedQuadRenderable(
				this._hotspotImageSize, this._hotspotImageSize,
				hotspotMat);
		var canvas = renderable.canvas = {};
		canvas.fill = true;
		canvas.fillInflate = -0.1;
		canvas.fillStyle = 'rgb(64, 64, 64)';
		canvas.fillOpacity = 0.5;
		canvas.outline = true;
		canvas.outlineStyle = 'rgb(255, 255, 255)';
		canvas.outlineInflate = -0.15;
		canvas.outlineOpacity = 0.7;
		canvas.canvasOnly = true;
	}
	renderable.name = "hotspot";
	renderable.initialCameraFov = cameraFov;
	renderable.fov = fov;
	renderable.aspect = aspect;
	renderable.heading = heading;
	renderable.pitch = pitch;
	if (animate)
		renderable.anim = true;
	return renderable;

	/*
	var faceNames = ['front', 'left', 'right', 'back', 'bottom', 'top'];
	var hotspotPolygons = [];
	for (var i = 0; i < faceNames.length; ++i) {
		hotspotPolygons[faceNames[i]] =
			this.getClippedPolygon(faceNames[i],
					getModelTransform,
					this.camera.getViewProjectionTransform(),
					dimension);
	}
	return {
		info: info,
			geom: hotspotPolygons,
			texture: this.createTexture(backgroundColor)
	};
	*/
}

HotspotCreator.prototype.createTexture = function(size, backgroundColor, showBorders) {
	var buffer = document.createElement('canvas');
	var width = size, height = size;
	buffer.width = width;
	buffer.height = height;
	var context = buffer.getContext('2d');
	context.clearRect(0, 0, width, height);
	context.fillStyle = backgroundColor || 'gray';
	context.fillRect(0, 0, width, height);
    if (showBorders) {
        context.strokeStyle = 'white';
		context.lineWidth = 8;
        context.strokeRect(0,0,width,height);
        context.strokeStyle = '';
    }
	var textureURL = buffer.toDataURL();
	return textureURL;
}

HotspotCreator.prototype.update = function(renderable, camFov) {
	var centeringMat = Matrix4x4.createTranslation(-this._hotspotImageSize/2, -this._hotspotImageSize/2, 0);
	var powerLawScale = Math.sqrt(renderable.initialCameraFov / camFov);
	//var ratio = 1.0 / this._hotspotImageSize * (renderable.fov / MathHelper.degreesToRadians(90)) / powerLawScale;
	var ratio = 1.0 / this._hotspotImageSize * (this._distToEye * Math.tan(renderable.fov/2) * 2) / powerLawScale;
	var scalingMat = Matrix4x4.createScale(ratio*renderable.aspect, ratio, 1);
	var posInDepthMat = Matrix4x4.createTranslation(0, 0, -this._distToEye);

	var rotMat = Matrix4x4.createRotationY(-renderable.heading).multiply(Matrix4x4.createRotationX(renderable.pitch)); //this.camera.getViewTransform().inverse();
	var hotspotMat = rotMat.multiply(posInDepthMat.multiply(scalingMat.multiply(centeringMat)));
	renderable._transform = hotspotMat;
	renderable.transformUpdated = true;
}

HotspotCreator.prototype.contain = function(hotspot, cam, scrX, scrY) {
	var mvp = cam.getViewProjectionTransform().multiply(hotspot._transform);
	var verts = hotspot._geometry._vertices;
	var ndcPoly = [];
	// we know that hotspots are quads
	for (var i=0; i<verts.length; i+=3) {
		var v = mvp.transformVector4(new Vector4(verts[i], verts[i+1], verts[i+2], 1));
		ndcPoly.push(v);
	}
	var clippedNDCPoly = convexPolygonClipper.clip(new Vector4(-1,-1,-1) , new Vector4(1, 1, 1), ndcPoly);
	for (var i=0; i<clippedNDCPoly.length; i++) {
		clippedNDCPoly[i].x /= clippedNDCPoly[i].w;
		clippedNDCPoly[i].y /= clippedNDCPoly[i].w;
		clippedNDCPoly[i].z /= clippedNDCPoly[i].w;
		clippedNDCPoly[i].w = 1;
	}
	if (clippedNDCPoly.length == 0)
		return false;

    var w = cam.getViewport().getWidth(),
		h = cam.getViewport().getHeight();
	var scrPoly = new Array(clippedNDCPoly.length);
	for (var i=0; i<clippedNDCPoly.length; i++) {
		scrPoly[i] = new Vector2(
			(clippedNDCPoly[i].x*0.5+0.5) * w,
			(clippedNDCPoly[i].y*0.5+0.5) * h);
	}

	var result = this.pointInPoly(scrPoly, scrX, scrY);

	return result;
}

HotspotCreator.prototype.pointInPoly = function(points, x, y) {
		var i, j, c = false;
		for (i = 0, j = points.length-1; i < points.length; j = i++) {
			if ((((points[i].y <= y) && (y < points[j].y)) ||
						((points[j].y <= y) && (y < points[i].y))) &&
					(x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x))
				c =!c;
		}
		return c;
}
