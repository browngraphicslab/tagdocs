jQuery.fn.extend({
    rinTouchGestures: function (callback, options) {
        var swipeMinDistance = 20,
            swipeMaxDistance = $(window).width() * 0.8,
            swipeMinDelay = 50,
            swipeMaxDelay = 1000,
            doubleTapMinDelay = 50,
            doubleTapMaxDelay = 1000,
            longTapDelay = 1000;

        var captureGestures = {
            preventDefaults: true,
            swipe: true,
            doubleTap: false,
            longTap: false,
            simpleTap: false
        };

        options = options || captureGestures;

        for (var key in captureGestures) {
            if (typeof options[key] == "undefined") options[key] = captureGestures[key];
        }

        return this.each(function () {

            var gestureStartTime = null,
            lastTap = 0,
            longTapTimer = null,
            asLongTap = false;

            var startCoords = { x: 0, y: 0 };
            var endCoords = { x: 0, y: 0 };

            $(this).bind("touchstart mousedown", onGestureStart);

            if (options.swipe)
                $(this).bind("touchmove mousemove", onGestureMove);

            $(this).bind("touchend mouseup", onGestureEnd);

            function onGestureStart(e) {
                if (options.longTap) {
                    window.clearTimeout(longTapTimer);
                    asLongTap = false;
                    longTapTimer = window.setTimeout(
                        function () {
                            longTapEvent(e)
                        }
                        , longTapDelay);
                }

                gestureStartTime = (new Date).getTime();
                getCoordinates(startCoords, e);
                endCoords.x = 0;
                endCoords.y = 0;
            }

            function longTapEvent(e) {
                asLongTap = true;
                lastTap = 0;
                return callback.call(this, e, { gesture: 'longtap' });
            }

            function onSimpleTap(e) {
                if (options.longTap) {
                    window.clearTimeout(longTapTimer);
                }
                return callback.call(this, e, { gesture: 'simpletap' });
            }

            function onGestureMove(e) {
                if (options.preventDefaults) {
                    e.preventDefault();
                }
                if (options.longTap) {
                    window.clearTimeout(longTapTimer);
                }
                getCoordinates(endCoords, e);
            }

            function onGestureEnd(e) {
                var now = (new Date).getTime();

                if (options.preventDefaults) {
                    e.preventDefault();
                }
                if (options.longTap) {
                    window.clearTimeout(longTapTimer);
                    if (asLongTap) {
                        return false;
                    }
                }


                if (options.doubleTap) {
                    var delay = now - lastTap;
                    lastTap = now;
                    if ((delay > doubleTapMinDelay) && (delay < doubleTapMaxDelay)) {
                        lastTap = 0;
                        return callback.call(this, e, { gesture: 'doubletap', delay: delay });
                    }
                }

                if (options.swipe) {
                    var coords = {};
                    coords.delay = now - gestureStartTime;
                    coords.deltaX = endCoords.x - startCoords.x;
                    coords.deltaY = startCoords.y - endCoords.y;

                    absX = Math.abs(coords.deltaX);
                    absY = Math.abs(coords.deltaY);

                    coords.distance = (absX < absY) ? absY : absX;
                    coords.direction = (absX < absY) ? ((coords.deltaY < 0) ? 'down' : 'up') : (((coords.deltaX < 0) ? 'left' : 'right'));

                    if (endCoords.x != 0
                        && (coords.distance > swipeMinDistance)
                        && (coords.distance < swipeMaxDistance)
                        && (coords.delay > swipeMinDelay)
                        && (coords.delay < swipeMaxDelay)
                        ) {
                        lastTap = 0;
                        coords.gesture = 'swipe';
                        return callback.call(this, e, coords);
                    }
                }

                if (options.simpleTap)
                    onSimpleTap(e);
            }

            function getCoordinates(coords, e) {
                if (e.originalEvent !== undefined && e.originalEvent.targetTouches !== undefined && e.originalEvent.targetTouches.length > 0) {
                    coords.x = e.originalEvent.targetTouches[0].clientX;
                    coords.y = e.originalEvent.targetTouches[0].clientY;
                }
                else {
                    coords.x = e.clientX;
                    coords.y = e.clientY;
                }
            }
        });
    }
});
