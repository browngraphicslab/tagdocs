package
{
	import flash.display.Sprite;
	import flash.display.Shape;
	import flash.display.Graphics;
	import flash.geom.*;
	import flash.events.*;
	import flash.display.Loader;
	import flash.display.Sprite;
    import flash.display.BitmapData;
    import flash.display.Loader;
    import flash.net.URLRequest;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.geom.Matrix;
	import flash.net.URLLoader;
	import flash.external.ExternalInterface;
	import flash.system.Security;
	import com.flashdynamix.utils.SWFProfiler;
	import flash.display.*;
	import flash.utils.getTimer;


	public class Main extends MovieClip
	{

		//the camera matrix
		var cam:Matrix3D;
		//this is the sprite that all 3d objects are drawn to
		var container:Sprite = new Sprite();

		//keeps track of all the Renderables
		//a valid id has a Renderable object
		//an invalid id is undefined or null
		var renders:Array = new Array();
		var toDraw:Array = new Array();

		//keep track of all the renderables
		//a valid id holds a Renderable object an invalid ID contains null or undefined
		var renderables:Object = new Object();
		var renderableNum:int = 0;

		//keep track of all the textures
		//an unloaded texture is the url of the location of the texture
		//a invalid ID is null or undefined
		//a valid loaded ID is a BitmapData object
		var tex:Object = new Object();
		var texName:Object = new Object();
		var texNum:int = 0;

		//keeps track of all geometry
		//a valid ID gives a Geometry object
		//an invalid one gives null or undefined
		var geom:Object = new Object();
		var geomNum:int = 0;

		///keeps track of all transforms
		//a valid ID gives a Matrix3d object
		//an invalid ID gives null or undefined
		var tran:Object = new Object();
		var tranNum:int = 0;

		//these are just for the demo program not for the library code
		//they are to be seperated out
		var g:String;
		var t:String;
		var te:String;
		var dataString:String="";
		var dataStringSmall:String="";

		var bg:Sprite = new Sprite();



		public function Main():void
		{
			//set antialiasing as well as how the .swf scales
			stage.quality = StageQuality.HIGH;
			stage.scaleMode = StageScaleMode.EXACT_FIT;

			//fill all the tweening tables used for easing in animation
			Renderable.init();
			//begin the profiler for checking on fps+memory usage
			SWFProfiler.init(stage, this);

			//bg is used for a background color, container is the sprite that gets
			//drawn to by the renderables
			addChild(bg);
			addChild(container);

			//set up a default simple projection matrix
			setViewProjectionMatrix([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,1,0]);

			//expose the function calls to javascript
			ExternalInterface.addCallback("createGeometry",createGeometry);
			ExternalInterface.addCallback("deleteGeometry",deleteGeometry);
			ExternalInterface.addCallback("createTexture",createTexture);
			ExternalInterface.addCallback("loadTexture",loadTexture);
			ExternalInterface.addCallback("unloadTexture",unloadTexture);
			ExternalInterface.addCallback("isTextureFetched",isTextureFetched);
			ExternalInterface.addCallback("deleteTexture",deleteTexture);
			ExternalInterface.addCallback("createTransform",createTransform);
			ExternalInterface.addCallback("deleteTransform",deleteTransform);
			ExternalInterface.addCallback("createRenderable",createRenderable);
			ExternalInterface.addCallback("deleteRenderable",deleteRenderable);
			ExternalInterface.addCallback("addRenderable",addRenderable);
			ExternalInterface.addCallback("removeRenderable",removeRenderable);
			ExternalInterface.addCallback("animateRenderable",animateRenderable);
			ExternalInterface.addCallback("createTexturedGridRenderable",createTexturedGridRenderable);
			ExternalInterface.addCallback("setViewProjectionMatrix",setViewProjectionMatrix);
			ExternalInterface.addCallback("render",render);
			ExternalInterface.addCallback("setRenderingOptions",setRenderingOptions);
			ExternalInterface.addCallback("getRenderableData",getRenderableData);
			ExternalInterface.addCallback("getError",getError);

			ExternalInterface.addCallback("queryRenderableTextureLoaded",queryRenderableTextureLoaded);
			ExternalInterface.addCallback("queryRenderableAnimationEnded",queryRenderableAnimationEnded);
			ExternalInterface.addCallback("clearColor",clearColor);

			ExternalInterface.call("window.RWW.flashInitialized");

			//DEMO
			//we want the renderer to run every frame if we're doing
			//pure as3
			//addEventListener(Event.ENTER_FRAME,render);
			/*
			//load the text files in
			var myTextLoader:URLLoader = new URLLoader();
			myTextLoader.addEventListener(Event.COMPLETE, onLoaded);
			myTextLoader.load(new URLRequest("./data/lobby/lobby-hi.txt"));

			myTextLoader = new URLLoader();
			myTextLoader.addEventListener(Event.COMPLETE, onLoaded2);
			myTextLoader.load(new URLRequest("./data/lobby/lobby.txt"));

			ExternalInterface.addCallback("getData",returnData);
			ExternalInterface.addCallback("getDataSmall",returnDataSmall);
			*/
		}

		//DEMO
		/*

		//used for getting the data from the text files
		function returnData():String{
			return dataString;
		}
		function returnDataSmall():String{
			return dataStringSmall;
		}

		//called when lobby.txt loads
		function onLoaded2(e:Event):void{
			dataStringSmall = e.target.data;

			dataStringSmall = replaceAll(dataStringSmall,"{","");
			dataStringSmall = replaceAll(dataStringSmall,"}","");
			dataStringSmall = replaceAll(dataStringSmall,",",":");
			dataStringSmall = replaceAll(dataStringSmall,"[","");
			dataStringSmall = replaceAll(dataStringSmall,"]","");
			dataStringSmall = replaceAll(dataStringSmall,"\"","");
		*/
			//var rex:RegExp = /[\s\r\n]*/gim;
/*
			dataStringSmall = dataStringSmall.replace(rex,"");
		}



		//called when lobby-hi.txt loads
		function onLoaded(e:Event):void{
			dataString = e.target.data;

			dataString = replaceAll(dataString,"{","");
			dataString = replaceAll(dataString,"}","");
			dataString = replaceAll(dataString,",",":");
			dataString = replaceAll(dataString,"[","");
			dataString = replaceAll(dataString,"]","");
			dataString = replaceAll(dataString,"\"","");
			*/
		//	var rex:RegExp = /[\s\r\n]*/gim;
/*
			dataString = dataString.replace(rex,"");
			createRenderables();
			//trace(obj);
		}

		//creates the renderables for the lobby-hi curbe
		var createdRenderables = new Array();
		function createRenderables(){
			trace("creating renderables");
			var obj:Array = dataString.split(";");
			for(var i:int=0;i<obj.length;i++){
				obj[i] = obj[i].split(":");
			}


			for(i=0;i<obj.length;i++){
				var x:int = i%3;
				var y:int = Math.floor(i/3);
				var z:int = 0;
				if(x==1)z=20;
				if(x==2)z=40;

				//we want the renderables to use the textures height
				//and width so we set height and width to -1 here
				var height:Number = -1;
				var width:Number= -1;
				var tran:Array = obj[i].slice(1,1+16);

				//create the renderable
				var rend = createTexturedGridRenderable(width,height,1,1,tran,"./data/lobby/"+obj[i][obj[i].length-1],true);
				//add the renderable so it's drawn
				addRenderable(rend);

				//animate all the renderables so that they fade in
				var begin:Object = new Object;
				var end:Object = new Object;
				begin.opacity=0;
				end.opacity=1;
				//push them all into the createdRenderables array so
				//we can use them later if we want to
				createdRenderables.push(rend);
				animateRenderable(rend,begin,end,1,"ease-in-out");
			}
		}





		var transformsForCube:Array = new Array();
		//again this function is just for laoding the text file
		function replaceAll(s:String,toReplace:String, r:String):String{
			var old:String=s.replace(toReplace,r);
			while(s!=old){
				s=old;
				old = s.replace(toReplace,r);
			}
			return old;
		}

		var xRotation:Number = 0;
		var yRotation:Number = 0;
		*/
		//END DEMO



		//currentTime is set each render call and is used for the
		//timing of all the renderable animations
		var currentTime:Number;
		function render(e:Event=null){
			currentTime=flash.utils.getTimer();
			//clear the container sprite of last frames drawing
			//clearColor(0xfff0000);
			container.graphics.clear();
			/*DEMO
			//if(keys[37])cam.appendRotation(4,Vector3D.Y_AXIS);
			//if(keys[39])cam.appendRotation(-4,Vector3D.Y_AXIS);
			*/
			if(sorted)toDraw.sort(orderSort);

			//draw all the renderables onto the container sprite
			for(var i:int=0;i<toDraw.length;i++){
				toDraw[i].draw();
			}
		}

		//used for sorting te renderables according to order
		function orderSort(a:Renderable,b:Renderable){
			return a.order-b.order;
		}


		/* all the options can be set here they are...
		backfaceCulling - turns backface culling on or off
		sorted - sorts the renderables by order before drawing
		antialias - turns on or off antialiasing
		*/
		var backfaceCulling:Boolean = true;
		var cullingOption:String = "positive";
		var sorted:Boolean = false;
		var antialias:Boolean = true;
		function setRenderingOptions(props){
			if(!props)return;
			if(props["backface_culling"]!=undefined)backfaceCulling = props["backface_culling"];
			if(props["sort_by_order"]!=undefined)sorted = props["sort_by_order"];
			if(props["antialias"]!=undefined)antialias = props.antialias;
			if(props.backfaceCulling)cullingOption="positive";
			else cullingOption = "none";

			//antialiasing can only be done in High quality mode but everything
			//runs faster at low quality so adjust the quality of the
			//movie here in addition to smoothing the textures during rendering
			if(props.antialias)stage.quality = StageQuality.HIGH;
			else stage.quality = StageQuality.LOW;
		}

		var bgColor:int = 0xffffff;
		function clearColor(color:int){
			bgColor=color;
			//erase the bg sprite and fill it with whatever color is passed in
			bg.graphics.clear();
			bg.graphics.beginFill(bgColor);
			bg.graphics.drawRect(0,0,stage.stageWidth,stage.stageHeight);
		}

		//returns true if the texture the renderable uses is fetched
		//and false otherwise
		//note if the texture has an incorrect address this will always be false
		function queryRenderableTextureLoaded(renderableId:String){
			if(!renderables[renderableId]) return true;
			return isTextureFetched(renderables[renderableId].rtexID);
		}

		//returns true if the renderable is currently animated false otherwise
		//returns true also if the renderable is waiting for it's texture to load
		//so hasn't started animating yet but will as soon as it's texture loads
		function queryRenderableAnimationEnded(renderableId){
			if(!renderables[renderableId]) return true;
			return renderables[renderableId].animationFinished;
		}

		var errorString:String = null;
		function getError():String{
			var toReturn:String = errorString;
			errorString=null;
			return toReturn;
		}

		function getRenderableData(renderableId:String){
			var rend:Renderable = renderables[renderableId];
			if( rend==null){
				errorString = "getRenderableData invalid ID";
				return null;
			}
			return {texture:rend.texID, geometry:rend.geomId, transform:rend.tranId};
		}
		function animateRenderable(renderableId:String, beginProperties:Object, endProperties:Object,duration:Number,easing:String){
			var toAnimate:Renderable = renderables[renderableId];
			if(!(toAnimate is Renderable)){
				errorString = "animateRenderable invalid ID";
				return;
			}

			//starts the animation for queryRenderableAnimationEnded
			toAnimate.startAnimation=true;
			toAnimate.animationFinished=false;
			toAnimate.easing = easing;

			if(!(Renderable.easingFuncTables[toAnimate.easing] is Array)){
				errorString = "animateRenderable invalid easing function";
				return;
			}
			if(!endProperties || !beginProperties){
				errorString = "animateRenderable invalid end/begin properties";
				return;
			}
			toAnimate.beginProperties=beginProperties;
			toAnimate.endProperties=endProperties;

			toAnimate.duration=duration;
		}

		function createTexturedGridRenderable(width:Number, height:Number, subdivX:int, subdivY:int, transform:Array, textureURL:String, loadNow:Boolean):String{
			var t = createTransform(transform);
			var te = createTexture(textureURL,loadNow);

			//these are all used for creating a geometry
			var vertex:Array = new Array();
			var uvt:Array = new Array();
			var indices:Array = new Array();
			//get the width and height of 1 subdivision of the grid
			var tempWidth:Number = width/subdivX;
			var tempHeight:Number = height/subdivY;
			for(var i:int=0;i<subdivX;i++){
				for(var j:int = 0;j<subdivY;j++){
					var minX:Number = tempWidth*(i);
					var maxX:Number = tempWidth*(i+1);
					var minY:Number = tempHeight*(j);
					var maxY:Number = tempHeight*(j+1);
					//push vertex's for this subdivision
					vertex.push(minX,minY,0, maxX,minY,0, minX,maxY,0, maxX,maxY,0);
					var count:int = (i*subdivY)+j;
					//push indices for this subdivision
					indices.push(0+count*4,1+count*4,2+count*4, 1+count*4,3+count*4,2+count*4);
					minX = 1/subdivX*i;
					maxX = 1/subdivX*(i+1);
					minY = 1/subdivY*j;
					maxY = 1/subdivY*(j+1);
					//push uvt data for this subdivision
					uvt.push(minX,minY, maxX,minY, minX,maxY, maxX,maxY);
				}
			}
			var g = createGeometry(vertex,uvt,indices,0);
			var rend = createRenderable(g,te,t,1,true);
			if(width==-1 && height==-1){
				if(renderables[rend]){
					renderables[rend].loadWidthandHeight=true;
					renderables[rend].subdivX=subdivX;
					renderables[rend].subdivX=subdivY;
				}
			}
			return rend;
		}

		/*
		xform is an array of 16 floats; it is the composite view and projection matrix. It transforms from
		world space into NDC space. It does not contain the transformation from NDC space to viewport
		*/
		function setViewProjectionMatrix(xform:Array){
			if(xform.length!=16){
				errorString = "setViewProjectionMatrix xform is not correct size";
				return;
			}
			xform = this.rowToColumn(xform);
			cam = new Matrix3D(Vector.<Number>(xform));
		}

		/*
		Returns a renderable ID. A renderable is a basic unit of rendering. It’s comprised of a geometry,
		a texture, and a transform. Order is used to sort the renderables before drawing, if that option is
		on using setRenderableOptions
		*/
		function createRenderable(geometryId:String, textureId:String, transformId:String, order:int, simple:Boolean = false,loadWidthandHeight:Boolean=false):String{
			if(!geom[geometryId]){
				errorString = "createRenderable invalid geometryId";
				return null;
			}
			if(!tex[textureId]){
				errorString = "createRenderable invalid textureId";
				return null;
			}
			if(!tran[transformId]){
				errorString = "createRenderable invalid transformId";
				return null;
			}

			var rend:Renderable = new Renderable(this,geometryId,transformId,textureId);
			var toReturn:String = "rend"+renderableNum;
			rend.loadWidthandHeight=loadWidthandHeight;
			renderableNum++;
			renderables[toReturn] = rend;
			rend.order=order;

			//this is used for deleteRenderable if the renderable was created using
			//createTexturedGridRenderable this is true, otherwise it defaults to false
			//if it is true then when deleteRenderable is called the texture,geom, and transform
			//are also deleted
			rend.simpleCreation = simple;
			return toReturn;
		}

		/*
		Deletes the renderable specified by renderableId.
		if it was created with createGridRenderable
		then it's texture, geom, and transform are also deleted
		*/
		function deleteRenderable(renderableId:String){
			if(!renderables[renderableId])errorString = "deleteRenderable invalid ID";
			removeRenderable(renderableId);
			if(renderables[renderableId])renderables[renderableId].clean();
			renderables[renderableId]=null;
		}

		/*
		This adds the renderable to the Renderer (i.e. add it to the list of renderables the Renderer is to
		render), so that it will be rendered. The next time render is drawn this renderable
		will be drawn to the screen.
		*/
		function addRenderable(renderableId){
			if(!renderables[renderableId]){
				errorString = "addRenderable invalid ID";
				return;
			}
			toDraw.push(renderables[renderableId]);
		}

		/*
		Remove the renderable from the Renderer so that it’s no longer rendered
		*/
		function removeRenderable(renderableId:String){
			var index = toDraw.indexOf(renderables[renderableId]);
			if(index==-1){errorString = "removeRenderable invalid ID"; return;}
			//remove the renderable from the array that is drawn every render
			toDraw.splice(index,1);
		}

		/*
		Returns a texture ID. url is a URL or local file name. If the 2nd
		argument is true, the texture is to loaded immediately.
		otherwise it will be loaded with the loadTexture function
		Currently supported textures are .jpg, .gif, .png, and .swf
		*/
		function createTexture(url:String,loadNow:Boolean){
			var toReturn:String = "tex"+texNum;
			tex[toReturn]=url;
			texNum++;
			if(loadNow){
				loadTexture(toReturn);
			}
			return toReturn;
		}

		/*
		Load the texture specified by textureID into memory.
		If the texture id does not exist or is already loaded then this function does nothing
		*/
		function loadTexture(textureID:String){
			if( (tex[textureID] is String)){
				var request:URLRequest = new URLRequest(tex[textureID]);
				var loader:Loader = new Loader();
				loader.load(request);
				loader.contentLoaderInfo.addEventListener(Event.COMPLETE, done);
				loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);


				//called if there is an error loading the texture
				function ioErrorHandler(){
					errorString = "invalid texture url "+tex[textureID];
				}

				//called when the texture is loaded correctly
				function done(){
					//create a BitmapData to store the texture and then draw
					//the loaded resource onto the bitmap
					var myBitmap:BitmapData = new BitmapData(loader.width, loader.height );
					myBitmap.draw(loader, new Matrix());
					texName[textureID] = tex[textureID];
					tex[textureID]=myBitmap;

				}
			}
		}

		/*
		unloades the texture provided by textureID
		the image will most likely still be stored in the browsers cache though
		so later calls to load Texture will use the cached version.
		*/
		function unloadTexture(textureID:String){
			var myBitmap = tex[textureID];
			if( !(myBitmap is BitmapData)){
				errorString = "unloadTexture invalidId";
				return;
			}
			//set the table back to the url of the texture in case
			//it is reloaded
			tex[textureID]=texName[textureID];
			//free up the memory from the texture
			myBitmap.dispose();

		}

		//Delete the texture specified by textureID
		function deleteTexture(textureID:String){
			if(!(tex[textureID] is BitmapData)){
				tex[textureID]=null;
				errorString = "deleteTexture invalid ID";
				return;
			}
			//this forces the bitmap's memory to be freed
			tex[textureID].dispose();
			tex[textureID]=null;
		}

		//returns true if the texture is fetched and false otherwise
		function isTextureFetched(textureID:String):Boolean{
			if(tex[textureID] is BitmapData)return true;
			else return false;
		}


		/*
		Returns a geometry ID. Vertices is an array of floats, interpreted as 3‐vectors, texcoords
		interpreted as 2‐vectors, geomType is 0 for Triangle, and 1 for Quad.
		*/
		function createGeometry(vertices:Array,texcoords:Array,indices:Array, geomType:int):String{
			//in rendering everything is drawn as triangles so if the geomType is
			//1 for quad then we need to split each quad into 2 triangles
			if(geomType==1){
				var newIndices:Array = new Array();
				for(var i:int = 0;i<indices.length/4;i++){
					var i6 = i*6;
					var i4 = i*4;
					newIndices[i6]=indices[i4];
					newIndices[i6+1]=indices[i4+1];
					newIndices[i6+2]=indices[i4+2];
					newIndices[i6+3]=indices[i4+1];
					newIndices[i6+4]=indices[i4+3];
					newIndices[i6+5]=indices[i4+2];
				}
				indices=newIndices;
			}

			//flash uses 0,0 for the upper left corner where opengl
			//uses 0,0 for the lower left corner so we have to flip
			//all the y values of the uvt cordinates
			for(i = 0;i<texcoords.length/2;i++){
				texcoords[i*2+1]=1-texcoords[i*2+1];
			}

			var g:Geometry = new Geometry(vertices,Vector.<Number>(texcoords),Vector.<int>(indices),this);
			var toReturn:String = "geom"+geomNum;
			geomNum++;
			geom[toReturn]=g;
			return toReturn;
		}

		/*
		Delete the geometry specified by ID
		*/
		function deleteGeometry(geometryID:String):void{
			if(!geom[geometryID])errorString = "deleteGeometry invalid ID";
			geom[geometryID]=null;
		}

		/*
		Returns a transform ID. Xform is an array of 16 floats, specifying a 4x4 matrix in row‐major order.
		Its construction follows practices in Forley and Van Dam, 2nd Ed
		*/
		function createTransform(xform:Array):String{
			//note that flashes 3d Matrix are specified in column major order while
			//this function takes an array in row major so conversion is neccesary.

			if(xform.length!=16){
				errorString = "createTransform incorrect xform size";
				return null;
			}
			xform = rowToColumn(xform);
			var transform = Vector.<Number>(xform);

			//if the passed in array had anything other then numbers
			//they show up as NaN now so we need to check to make sure
			//there are no NaN in our Vector
			for(var i:int = 0;i<transform.length;i++){
				if(isNaN(transform[i])){
					errorString = "createTransform incorrect input type";
					return null;
				}
			}
			var m:Matrix3D = new Matrix3D(transform);

			var toReturn:String = "tran"+tranNum;
			tranNum++;
			tran[toReturn]=m;
			return toReturn;
		}

		//Delete the transform specified by xformId.
		function deleteTransform(xformID:String):void{
			if(!tran[xformID])errorString = "deleteTransform invalid ID";
			tran[xformID]=null;
		}


		//scales a vector3d vector by the w component of that vector
		function normalize(v:Vector3D):Vector3D{
			if(v.w==0)trace("error");
			v.w=Math.abs(v.w);
			v.x=v.x/v.w;
			v.y=v.y/v.w;
			v.z=v.z/v.w;
			return v;
		}

		//takes a rowMajor array and returns a new columnMajor array
		//Matrix3d is column major
		function rowToColumn(rowMajor:Array):Array{
			var columnMajor:Array = new Array();

			for(var x:int=0;x<4;x++){
				for(var y:int=0;y<4;y++){
					columnMajor[y%4+x*4] = rowMajor[x%4+y*4];
					if(columnMajor[y%4+x*4]==undefined)columnMajor[y%4+x*4]=0;
				}
			}
			return columnMajor;
		}

	}

}
