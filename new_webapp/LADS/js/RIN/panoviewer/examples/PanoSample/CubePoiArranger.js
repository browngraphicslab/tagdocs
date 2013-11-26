//------------------------------------------------------------------------------
// <Copyright From='2004' To='2020' Company='Microsoft Corporation'>
//		Copyright (c) Microsoft Corporation. All Rights Reserved.
//		Information Contained Herein is Proprietary and Confidential.
// </Copyright>
//------------------------------------------------------------------------------

/**
* Arranges poi in a cube each frame.
*/
function CubePoiArranger(container, cameraController)
{
    var poiList = [];
    var containerWidth = container.offsetWidth;
    var containerHeight = container.offsetHeight;

	//This function intentionally does NOT use Gimme for perf reasons.  When testing on a reasonable machine
	//with 100 poi, I found that removing Gimme added about 1-2 frames per second to the framerate.
	function positionPoi(cubePoi)
    {
		var position = cameraController.tryPitchHeadingToPixel(cubePoi.pitch, cubePoi.heading);

		if (position == null ||
		    position.x < 0 ||
		    position.y < 0 ||
		    position.x > containerWidth ||
		    position.y > containerHeight)
		{
			if (cubePoi.elem.isShown !== false)
			{
				cubePoi.elem.style.display = 'none';
				cubePoi.elem.isShown = false;
			}
		}
		else
		{
			if (cubePoi.elem.isShown !== true)
			{
				cubePoi.elem.style.display = 'block';
				cubePoi.elem.isShown = true;
			}
			cubePoi.elem.style.left = (position.x - cubePoi.anchorPoint.x) + 'px';
			cubePoi.elem.style.top = (position.y - cubePoi.anchorPoint.y) + 'px';
		}
    }

    this.addPoi = function (cubePoi)
    {
		poiList.push(cubePoi);
		cubePoi.elem.style.display = 'none';
		cubePoi.elem.style.position = 'absolute';
		container.appendChild(cubePoi.elem);
		positionPoi(cubePoi);
    };

    this.removePoi = function (cubePoi)
    {
        for (var i = 0; i < poiList.length; i++)
        {
            if (poiList[i] === cubePoi)
            {
                poiList.splice(i, 1);
                break;
            }
        }

        if (cubePoi.elem.parentNode === container)
        {
            container.removeChild(cubePoi.elem);
        }
    };

    this.updatePoi = function (cubePoi)
    {
	positionPoi(cubePoi);
    };

    this.update = function ()
    {
	containerWidth = container.offsetWidth;
	containerHeight = container.offsetHeight;

	for (var i = 0; i < poiList.length; i++)
	{
		positionPoi(poiList[i]);
	}
    }
}