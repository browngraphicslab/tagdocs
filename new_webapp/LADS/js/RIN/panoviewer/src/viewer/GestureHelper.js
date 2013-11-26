//The intent of this class is to encapsulate various forms of touch and mouse input supported by 
//different browsers and then fire a consistent set of events that can be used to control a camera.

function GestureHelper(elem, options) {
    var elem = elem;
    var gestureStartCallback = options.gestureStart || function () {};
    var gestureChangeCallback = options.gestureChange || function () {};
    var gestureEndCallback = options.gestureEnd || function () {};
    var discreteZoomCallback = options.discreteZoom || function () {};
    var keyDownCallback = options.keyDown || function () {};
    var keyUpCallback = options.keyUp || function () {};
    var enabled = false;
    var msGesture;

    function onGestureStart(e) {
        e.type = 'gestureStart';
        gestureStartCallback(e);
    }

    function onGestureChange(e) {
        e.type = 'gestureChange';
        gestureChangeCallback(e);
    }

    function onGestureEnd(e) {
        e.type = 'gestureEnd';
        gestureEndCallback(e);

        keyboardFocusElement.focus();
    }

    function onDiscreteZoom(e) {
        e.type = 'discreteZoom';
        discreteZoomCallback(e);
    }

    function onKeyDown(e) {
        keyDownCallback(e);
    }

    function onKeyUp(e) {
        keyUpCallback(e);
    }

    var msGestureGoing = false;
    var msPointerCount = 0;
    
    function msPointerDown(e) {
        //for IE10, we have to tell the gesture engine which pointers to use (all of them for our uses).
        try {
            msGesture.target = elem;
            msGesture.addPointer(e.pointerId);
            elem.msSetPointerCapture(e.pointerId);

            if (msPointerCount === 0) {
                msPointerCount = 1;
                onGestureStart({
                    clientX: e.clientX,
                    clientY: e.clientY,
                    screenX: e.screenX,
                    screenY: e.screenY
                });

                totalTranslationX = 0;
                totalTranslationY = 0;
                totalScale = 1;
            }
        } catch (e) {
            // e.code === 11, "InvalidStateError" happens when touch and click happens at the same time.
        }
    }

    function msPointerUp(e) {
        msPointerCount--;

        if (msPointerCount < 0) {
            //This can happen if the user drags a pointer/finger from outside the viewer into the viewer, then releases
            msPointerCount = 0;
        }

        if (!msGestureGoing && msPointerCount == 0) {
            
            onGestureEnd({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: totalTranslationX,
                translationY: totalTranslationY,
                scale: totalScale
            });
        }
    }

    var totalTranslationX;
    var totalTranslationY;
    var totalScale;

    function msGestureStart(e) {
        msGestureGoing = true;
    }

    function msGestureChange(e) {
        if (msGestureGoing) {
            totalTranslationX += e.translationX;
            totalTranslationY += e.translationY;
            totalScale *= e.scale;

            if (e.detail & e.MSGESTURE_FLAG_INERTIA) {
                //inertia phase

                onGestureEnd({
                    clientX: e.clientX,
                    clientY: e.clientY,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    translationX: totalTranslationX,
                    translationY: totalTranslationY,
                    scale: totalScale
                });

                msGestureGoing = false;
            }
            else {
                onGestureChange({
                    clientX: e.clientX,
                    clientY: e.clientY,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    translationX: totalTranslationX,
                    translationY: totalTranslationY,
                    scale: totalScale
                });
            }
        }
    }

    function msGestureEnd(e) {
        if (msGestureGoing) {
            onGestureEnd({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: totalTranslationX,
                translationY: totalTranslationY,
                scale: totalScale
            });
        }
    }

    var mouseDownPos = null;

    function mouseDown(e) {
        onGestureStart({
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY
        });

        mouseDownPos = { x: e.clientX, y: e.clientY };

        e.preventDefault();
    }

    function mouseMove(e) {
        if (mouseDownPos != null) {
            onGestureChange({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: e.clientX - mouseDownPos.x,
                translationY: e.clientY - mouseDownPos.y,
                scale: 1
            });

            e.preventDefault();
        }
    }

    function mouseUp(e) {
        if (mouseDownPos != null) {
            onGestureEnd({
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: e.clientX - mouseDownPos.x,
                translationY: e.clientY - mouseDownPos.y,
                scale: 1
            });

            mouseDownPos = null;

            e.preventDefault();
        }
    }

    function mouseWheel(e) {
        //Get the wheel data in a browser-agnostic way.
        //See http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        var wheelDelta =  e.detail ? e.detail * -1 : e.wheelDelta / 40;

        var direction;
        if (wheelDelta > 0) {
            direction = 1;
        }
        else if (wheelDelta < 0) {
            direction = -1;
        }

        onDiscreteZoom({
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            direction: direction
        });

        e.preventDefault();
    }

    function doubleClick(e) {
        onDiscreteZoom({
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            direction: 1
        });

        e.preventDefault();
    }

    //Webkit
    function gestureStart(e) {
    }

    function gestureChange(e) {
    }

    function gestureEnd(e) {
    }

    var attachHandlers;
    var detachHandlers;

    if (window.navigator.msPointerEnabled && window.MSGesture) { //(typeof MSGesture == "function")) {
    //IE10+.  Mouse, touch, and pen events all fire as MSPointer and MSGesture
        attachHandlers = function () {
            msGesture = new MSGesture();
            msGesture.target = elem;
            
            elem.addEventListener("MSPointerDown", msPointerDown, false);
            elem.addEventListener("MSPointerUp", msPointerUp, false);
            elem.addEventListener('MSGestureStart', msGestureStart, true);
            elem.addEventListener('MSGestureChange', msGestureChange, true);
            elem.addEventListener('MSGestureEnd', msGestureEnd, true);
            elem.addEventListener('dblclick', doubleClick, false);
            elem.addEventListener('mousewheel', mouseWheel, false);
        };

        detachHandlers = function () {
            elem.removeEventListener("MSPointerDown", msPointerDown, false);
            elem.removeEventListener("MSPointerUp", msPointerUp, false);
            elem.removeEventListener('MSGestureStart', msGestureStart, true);
            elem.removeEventListener('MSGestureChange', msGestureChange, true);
            elem.removeEventListener('MSGestureEnd', msGestureEnd, true);
            elem.removeEventListener('dblclick', doubleClick, false);
            elem.removeEventListener('mousewheel', mouseWheel, false);

            msGesture.target = null;
            msGesture = null;
        };
        
    }
    else if (window.ontouchstart) {
        //Webkit.  Fires touch, gesture, and mouse events.  Touch events turn into mouse events unless they're stopped

        //TODO: not yet implemented
    }
    else {
        //Browser doesn't support touch.  Only need to add support for mouse.
        attachHandlers = function () {
            elem.addEventListener('mousedown', mouseDown, false);
            elem.addEventListener('mousemove', mouseMove, false);
            elem.addEventListener('mouseup', mouseUp, false);
            elem.addEventListener('mousewheel', mouseWheel, false);
            elem.addEventListener('DOMMouseScroll', mouseWheel, false);
            elem.addEventListener('dblclick', doubleClick, false);
            document.addEventListener('mousemove', mouseMove, false);
            document.addEventListener('mouseup', mouseUp, false);

            if (window.parent && window != window.parent) {
                //If we're in a frame or iframe, then we won't get proper events when the mouse goes outside the frame, so just count it as a mouseup.
                document.addEventListener('mouseout', mouseUp, false);
            }
        };

        detachHandlers = function () {
            elem.removeEventListener('mousedown', mouseDown, false);
            elem.removeEventListener('mousemove', mouseMove, false);
            elem.removeEventListener('mouseup', mouseUp, false);
            elem.removeEventListener('mousewheel', mouseWheel, false);
            elem.removeEventListener('DOMMouseScroll', mouseWheel, false);
            elem.removeEventListener('dblclick', doubleClick, false);
            document.removeEventListener('mousemove', mouseMove, false);
            document.removeEventListener('mouseup', mouseUp, false);

            if (window.parent && window != window.parent) {
                document.removeEventListener('mouseout', mouseUp, false);
            }
        };
    }

    var keyboardFocusElement = document.createElement('input');
    keyboardFocusElement.readOnly = true;
    Utils.css(keyboardFocusElement, { width: '0px', height: '0px', opacity: 0 });

    var attachKeyboardHandlers = function () {
        elem.appendChild(keyboardFocusElement);

        keyboardFocusElement.addEventListener('keydown', onKeyDown, false);
        keyboardFocusElement.addEventListener('keyup', onKeyUp, false);
        keyboardFocusElement.focus();
    };

    var detachKeyboardHandlers = function () {
        keyboardFocusElement.removeEventListener('keydown', onKeyDown, false);
        keyboardFocusElement.removeEventListener('keyup', onKeyUp, false);

        if (keyboardFocusElement.parentNode) {
            keyboardFocusElement.parentNode.removeChild(keyboardFocusElement);
        }
    };

    //public interface
    this.enable = function () {
        attachHandlers();
        attachKeyboardHandlers();
        enabled = true;
    };

    this.disable = function () {
        detachHandlers();
        detachKeyboardHandlers();
        enabled = false;
    };

    this.isEnabled = function () {
        return enabled;
    };

    this.userCurrentlyInteracting = function () {
        //Intentionally exclude keyboard and mouse input.  Only care about touch input here.
        return msPointerCount > 0;
    };

    this.focusKeyboardElement = function () {
        keyboardFocusElement.focus();
    };
}