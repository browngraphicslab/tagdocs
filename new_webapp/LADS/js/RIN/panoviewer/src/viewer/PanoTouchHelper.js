
function PanoTouchHelper(el) {
    var eventQueue = [],
        activePointers = 0,
        enabled = false,
        $ = jQuery,
        created = Date.now();

    function onMouseWheel(e) {
        // normalize wheel delta
        var oe = e.originalEvent,
            delta = 0;
        if (oe.detail) {
            delta = oe.detail * -1;
        } else if (oe.wheelDeltaY) {
            delta = oe.wheelDeltaY / 40;
        } else if (oe.wheelDeltaX) {
            // chrome fires horizontal scroll events which we don't want
            return;
        } else if (oe.wheelDelta) {
            delta = oe.wheelDelta / 40;
        }

        // get the mouse coordinate relative to the page
        // http://www.quirksmode.org/js/events_properties.html
        var x = 0, y = 0;
        if (oe.pageX || oe.pageY) {
            x = oe.pageX;
            y = oe.pageY;
        } else if (oe.clientX || oe.clientY) {
            var docEl = document.documentElement,
                docBody = document.body;
            x = oe.clientX + docBody.scrollLeft + docEl.scrollLeft;
            y = oe.clientY + docBody.scrollTop + docEl.scrollTop;
        }

        var wheelEvent = new $.Event('mousewheel', {
            x: x,
            y: y,
            delta: delta,
            originalEvent: e
        });

        queueEventAndPreventDefault(wheelEvent);
    }

    function queueEvent(e) {
        eventQueue.push(e);
    }

    function queueEventAndPreventDefault(e) {
        eventQueue.push(e);

        // we don't want events to manipulate the screen
        e.preventDefault();
    }

    function onZoom(e, zoomInfo) {
        e.zoomInfo = zoomInfo;
        queueEventAndPreventDefault(e);    
    }

    function queueKeyEvent(e) {
        //console.log('panoTouch (' + created + ') key event: ' + e.type + ' at: ' + e.timestamp);
        queueEvent(e);
    }

    var eventListeners = {
        pointerstart: function(e) { activePointers++; },
        pointerend: function(e) { activePointers--; },
        gesturestart: queueEventAndPreventDefault,
        gesturemove: queueEventAndPreventDefault,
        gestureend: queueEventAndPreventDefault,
        pinchstart: queueEventAndPreventDefault,
        pinchmove: queueEventAndPreventDefault,
        pinchend: queueEventAndPreventDefault,
        tap: queueEventAndPreventDefault,
        doubletap: queueEventAndPreventDefault,
        holdstart: queueEventAndPreventDefault,
        mousewheel:  onMouseWheel,
        DOMMouseScroll: onMouseWheel,
        zoompoint: onZoom
    };

    var docListeners = {
        keydown: queueKeyEvent,
        keyup: queueKeyEvent
    };

    // TODO: (Joel) need to enable / disable pxtouch events
    $(el).on(eventListeners);

    var useTopDocument = false;
    try {
        useTopDocument = (document !== top.document);
    } catch(ex) {
        // ignore exception when accessing doc from another domain
    }

    this.enable = function () {
        if (!enabled) {

            // TODO: (Joel) re-enable
            //$(el).on(eventListeners);

            $(document).on(docListeners);
            if (useTopDocument) {
                $(top.document).on(docListeners);
            }
            enabled = true;
        }
    };

    this.disable = function () {
        if (enabled) {

            // TODO: (Joel) re-enable
            //$(el).off(eventListeners);

            $(document).off(docListeners);
            if (useTopDocument) {
                $(top.document).off(docListeners);
            }
            enabled = false;
        }
    };

    this.isEnabled = function () {
        return enabled;
    };

    this.getQueuedEvents = function () {
        var temp = eventQueue;
        eventQueue = [];
        return temp;
    };

    this.userCurrentlyInteracting = function () {
        //if (activePointers > 0) { console.log('active pointers:' + activePointers); }

        return (activePointers > 0);
    };

    this.focusKeyboardElement = function () {
        // TODO: implement
    };
}
