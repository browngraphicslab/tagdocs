/// <reference path="../web/lib/jquery-1.9.1.min.js" />
window.RinDragable = function(element, dragCallback, additionalHitTargets) {
    var isDragging = false, x, y;
    element.addEventListener('mousedown', function (e) {
        if (e.target === element || (additionalHitTargets && additionalHitTargets.indexOf(e.target) > -1)) {
            isDragging = true;
            x = e.pageX; y = e.pageY;
            element.setCapture();
            e.preventDefault();
            return false;
        }
    }, false);
    element.addEventListener('mouseup', function (e) {
        element.releaseCapture();
        isDragging = false;
        e.preventDefault();
        return false;
    }, false);
    element.addEventListener('mousemove', function (e) {
        if (isDragging) {
            isDragging = true;
            dragCallback(e.pageX - x, e.pageY - y);
            x = e.pageX; y = e.pageY;
            e.preventDefault();
            return false;
        }
    }, false);
}

window.RegionCapture = function (playerRoot, orchestrator) {
    var self = this;
    var captureContainer = null;
    var captureControl = null;

    function addCaptureControl() {
        captureContainer = document.createElement("div");
        captureControl = document.createElement("div");

        $(captureContainer).css(
            {
                width: "100%",
                height: "100%",
                //background: "red",
                pointerEvents: "none",
                position: "absolute",
                top: "0px",
                left: "0px;",
                zIndex: "2147483647",
                display:"none"
            }
            );
        $(captureControl).css(
            {
                width: "100px",
                height: "100px",
                background: "rgba(0,0,255,.2)",
                border:"1px dashed black",
                position: "absolute",
                left: "0px",
                top: "0px"
            }
            );

        var hr = document.createElement("div");
        var vr = document.createElement("div");
        
        $(hr).css(
            {
                width: "100%",
                height: "50%",
                background: "transparent",
                borderBottom: "1px dashed white",
                position: "absolute",
                left: "0px",
                top: "0px"
            }
            );
        $(vr).css(
            {
                width: "50%",
                height: "100%",
                background: "transparent",
                borderRight: "1px dashed white",
                position: "absolute",
                left: "0px",
                top: "0px"
            }
            );
        captureControl.appendChild(hr);
        captureControl.appendChild(vr);

        var br = document.createElement("div");
        $(br).css(
            {
                width: "8px",
                height: "8px",
                background: "white",
                position: "absolute",
                diaply:"block",
                bottom:"-8px",
                right:"-8px"
            }
            );

        new RinDragable(captureControl, function (dx, dy) {
            var elem = $(captureControl);
            elem.css("top", (parseFloat(elem.css("top")) + dy) + "px");
            elem.css("left", (parseFloat(elem.css("left")) + dx) + "px");
        }, [hr, vr]);

        new RinDragable(br, function (dx, dy) {
            var elem = $(captureControl);
            elem.css("width", (parseFloat(elem.css("width")) + dx) + "px");
            elem.css("height", (parseFloat(elem.css("height")) + dy) + "px");
        });

        captureContainer.appendChild(captureControl);
        playerRoot.appendChild(captureContainer);
        captureControl.appendChild(br);
    }

    this.toggleVisibility = function () {
        if (!captureContainer) {
            addCaptureControl();
        }
        $(captureContainer).toggle();
    };

    this.capture = function () {
        var esItems = orchestrator.getCurrentESItems();
        var proxy = null;

        for (var i = 0; i < esItems.length; i++) {
            if (esItems[i].experienceStream.getEmbeddedArtifactsProxy)
            {
                proxy = esItems[i].experienceStream.getEmbeddedArtifactsProxy({ render: function () { } });
                break;
            }
        }

        if (proxy != null)
        {
            var elem = $(captureControl);
            var result = {
                center: { x: 0, y: 0 },
                span: { x: 0, y: 0 },
                zoomLevel:0
            };
            var outPoint = { x: 0, y: 0 };

            proxy.convertPointToWorld2D({x:parseFloat(elem.css("left")),y:parseFloat(elem.css("top"))}, outPoint);
            result.center.x = outPoint.x;result.center.y = outPoint.y;
            
            proxy.convertPointToWorld2D({x:parseFloat(elem.css("left")) + parseFloat(elem.css("width")),y:parseFloat(elem.css("top")) + parseFloat(elem.css("height"))}, outPoint);
            result.span.x = Math.abs(outPoint.x - result.center.x);
            result.span.y = Math.abs(outPoint.y - result.center.y);

            proxy.convertPointToWorld2D({ x: parseFloat(elem.css("left")) + (parseFloat(elem.css("width")) / 2), y: parseFloat(elem.css("top")) + (parseFloat(elem.css("height")) / 2) }, outPoint);
            result.center.x = outPoint.x; result.center.y = outPoint.y;

            if(proxy.currentNormalizedZoom)
                result.zoomLevel = proxy.currentNormalizedZoom();

            return result;
        }
        
        return null;
    };
};