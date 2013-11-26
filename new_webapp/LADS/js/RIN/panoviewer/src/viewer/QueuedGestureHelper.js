//The intent of this class is to encapsulate various forms of touch and mouse input supported by
//different browsers and then fire a consistent set of events that can be used to control a camera.

function QueuedGestureHelper(elem) {
    var eventQueue = [];

    function eventHandler(e) {
        eventQueue.push(e);
    }

    var gestureHelper = new GestureHelper(elem, {
        gestureStart: eventHandler,
        gestureChange: eventHandler,
        gestureEnd: eventHandler,
        discreteZoom: eventHandler,
        keyDown: eventHandler,
        keyUp: eventHandler
    });

    this.enable = function () {
        gestureHelper.enable();
    };

    this.disable = function () {
        gestureHelper.disable();
    };

    this.isEnabled = function () {
        return gestureHelper.isEnabled();
    };

    this.getQueuedEvents = function () {
        var temp = eventQueue;
        eventQueue = [];
        return temp;
    };

    this.userCurrentlyInteracting = function () {
        return gestureHelper.userCurrentlyInteracting();
    };

    this.focusKeyboardElement = function () {
        gestureHelper.focusKeyboardElement();
    };
}
