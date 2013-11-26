function GridGeometry( width, height, nSegX, nSegY, useTris ) {
	GridGeometry.__super.call(this, {});

	var x, y,
	w2 = width / 2,
	h2 = height / 2,
	gridX = nSegX || 1,
	gridY = nSegY || 1,
	gridX1 = gridX + 1,
	gridY1 = gridY + 1,
	stepX = width / gridX,
	stepY = height / gridY;
	for( y = 0; y < gridY1; y++ ) {
		for( x = 0; x < gridX1; x++ ) {
			var xx = x * stepX;
			var yy = y * stepY;
			this._vertices.push(xx, yy, 0);
		}
	}
	for( y = 0; y < gridY; y++ ) {
		for( x = 0; x < gridX; x++ ) {
			var a = x + gridX1 * y, b = x + gridX1 * ( y + 1 ),
				c = ( x + 1 ) + gridX1 * ( y + 1 ),
				d = ( x + 1 ) + gridX1 * y;
			if (! useTris) {
				this._indices.push(a, b, c, d);
				this._texCoords.push(x / gridX, y / gridY ,
						x / gridX, ( y + 1 ) / gridY,
						(x + 1 ) / gridX, ( y + 1 ) / gridY,
						(x + 1 ) / gridX, y / gridY);
			} else {
				this._indices.push(a, b, c);
				this._indices.push(a, c, d);
				this._texCoords.push(x / gridX, y / gridY ,
						x / gridX, ( y + 1 ) / gridY,
						(x + 1 ) / gridX, ( y + 1 ) / gridY);
				this._texCoords.push(x / gridX, y / gridY ,
						(x + 1 ) / gridX, ( y + 1 ) / gridY,
						(x + 1 ) / gridX, y / gridY);
			}
		}
	}

	this._texCoordSize = 2;
	this._primitiveType = useTris ? Geometry.TRIANGLES : Geometry.QUADS;
	this._primitiveLength = gridX*gridY*(useTris?2:1);
	this._isDirty = true;
};

extend(GridGeometry, Geometry);

function QuadGeometry(width, height)
{
	this._vertices = [  width, height, 0,
                        0, height, 0,
                        0, 0, 0,
                        width, 0, 0 ];
	this._texCoords = [  1, 1,   0, 1,   0, 0,   1, 0 ];
    this._indices = [  0, 1, 2,   0, 2, 3 ];

	this._texCoordSize = 2;
	this._primitiveType = Geometry.TRIANGLES;
	this._primitiveLength = 2;
	this._isDirty = true;
}
function QuadGeometryWireframe(width, height)
{
	this._vertices = [  width, height, 0,
                        0, height, 0,
                        0, 0, 0,
                        width, 0, 0 ];
	this._texCoords = [  1, 1,   0, 1,   0, 0,   1, 0 ];
    this._indices = [  0, 1, 1, 2,  2, 3, 3, 0, 0,2, 1,3 ];

	this._texCoordSize = 2;
	this._primitiveType = Geometry.TRIANGLES;
	this._primitiveLength = 2;
	this._isDirty = true;
}

extend(QuadGeometry, Geometry);

function TexturedQuadRenderable(width, height, transform,
				textureURL, loadCallback, loadCallbackInfo, loadTextureInDOM, offsetX, offsetY) {

	TexturedQuadRenderable.__super.call(this, {});
	var self = this;


    this._geometry = new QuadGeometry(width, height);
	this._transform = transform ? transform : Matrix4x4.createIdentity();

	if (textureURL) {
		var texture = new Texture(textureURL, null, loadCallbackInfo, null, null, null, null, offsetX, offsetY, width, height);
		this._material = new SingleTextureMaterial(texture);

		if (loadTextureInDOM) {
			texture.loadImageInDOM();
		}
	}
}

extend(TexturedQuadRenderable, Renderable);

function UntexturedQuadRenderable(width, height, transform,
				textureURL, loadCallback, loadCallbackInfo, loadTextureInDOM) {

	UntexturedQuadRenderable.__super.call(this, {});
	var self = this;

    this._geometry = new QuadGeometry(width, height);
	this._material = null
	this._transform = transform ? transform : Matrix4x4.createIdentity();
}
extend(UntexturedQuadRenderable, Renderable);

/**
 * This is a handy helper class that uses canvas to create a renderable that has fixed color
 * and a message.
 */
function TestQuadRenderable(width, height, transform, backgroundColor, text, loadTexture) {
	TexturedQuadRenderable.__super.call(this, {});
	var self = this;
    var buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    var context = buffer.getContext('2d');
    context.clearRect(0, 0, width, height);
    context.fillStyle = backgroundColor || 'gray';
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'black';
    context.font = '12pt Segoe UI,sans-serif';
    context.fillText(text, width*0.3, height*0.3);
    var textureURL = buffer.toDataURL(); //We pass this into texture below.
	var texture = new Texture(textureURL);
    if(loadTexture) {
        texture.loadImageInDOM();
    }

	self._material = new SingleTextureMaterial(texture);
	self._transform = transform ? transform : Matrix4x4.createIdentity();
    self._geometry = new QuadGeometry(width, height);
}

extend(TexturedQuadRenderable, Renderable);
