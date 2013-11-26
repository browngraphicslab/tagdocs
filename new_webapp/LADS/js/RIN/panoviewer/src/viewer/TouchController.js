/**
 * This translates touchbegin,touchend,touchmove to
 * derived from Seadragon.TouchController.
 * zoom + pan operations on the viewer.
 *
 * @param {Object} containerDiv  This the div we're attaching events too.
 * @param {function (string, {x: number, y: number})} stateChangeHandler This gets
 *            invoked with state name 'base,tap,twofingertap,drag,pinch'
 *            and touch origin in page pixels.
 * @param {function ({x: number, y: number}, number)} zoomHandler  This gets
 *            invoked when zoom from due to a pinch happens, it incudes
 *            pinch center point as well as scale (1.0 = no zoom, 0.5 half size 2.0 double size.
 * @param {function({x: number, y: number}, {x:number, y:number})} panHandler This
 *            handler is invoked during a drag,it has the starting point and the change in x,y from the
 *            the start.
 * @param {function({x: number, y: number})} doubleTapHandler This
 *            handler is invoked during a on touch up of second tap,it has the center point x,y.
 */
function TouchController(containerDiv,
                         stateChangedHandler,
                         zoomHandler,
                         panHandler,
                         doubleTapHandler) {

    //Basically we manage a state machine for finger states.
    //
    // BASE_STATE           = no fingers
    // TAP_STATE            = user tapped.
    // TWO_FINGER_TAP_STATE = two fingers tapped
    // PINCH_STATE          = user pinched
    // DRAG_STATE           = user dragged/panned.
    // BASE_TAPPED_STATE    = user taped once, might be double tap so we go here.
    // DOUBLE_TAP_STATE     = user tapped twice with in a certain amount of time.
    //
    //  Each state is a collection of handlers that invokes
    //  our setCurrentState function to transition between states.
    //  in practice pinch and drag are what people. TAP, will just be transient.

    var self = this;

    var distanceOf = function(a,b) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        return Math.sqrt(dx*dx + dy*dy);
    };

    var BaseState = function(owner) {
        var owner = owner;
        var self = this;
        self.onTouchStart = function (e)  {
            var numTouches = e.touches.length;
            owner.touchPixelOrigin = owner.getTouchPixelOrigin(e);

            if(numTouches === 1) {
                owner.setCurrentState(owner.TAP_STATE);
            } else if(numTouches === 2) {
                owner.setCurrentState(owner.TWO_FINGER_TAP_STATE);
            };
        };

        self.onTouchMove = function (e)  {
            //do nothing.
        };

        self.onTouchEnd = function (e)  {
            //do nothing.
        };

        self.onGestureStart = function (e) {
            //do nothing.
        };

        self.onGestureChange = function (e) {
            //do nothing.
        };

        self.onGestureEnd = function (e) {
            //do nothing.
        };

        self.initialize = function() {
            //do nothing.
        };
        self.dispose = function() {
            //do nothing.
        };
        self.stateName = 'base';
    };

    var BaseTappedState = function(owner) {
        var self = this;
        var owner = owner;
        var timeoutID = null;

        self.timeoutHandler = function() {
            if(timeoutID)
            {
                clearTimeout(timeoutID);
                timerID = null;
            }
            owner.setCurrentState(owner.BASE_STATE);
        };

        self.onTouchStart = function (e)  {
            var numTouches = e.touches.length;
            owner.touchPixelOrigin = owner.getTouchPixelOrigin(e);

            if(numTouches === 1)
            {
                owner.setCurrentState(owner.DOUBLE_TAP_STATE);
                return
            }

            if(numTouches > 1) {
                owner.setCurrentState(owner.PINCH_STATE);
                return;
            };
        };

        self.onTouchMove = function (e)  {
            var numTouches = e.touches.length;
            // Go to dragging state if touch moved too far (threshold)
            var newTouchPixelOrigin = owner.getTouchPixelOrigin(e);
            var distance = distanceOf(newTouchPixelOrigin, owner.touchPixelOrigin);
            if (distance > owner.TAP_DISTANCE_THRESHOLD) {
                owner.setCurrentState(owner.DRAG_STATE);
            }
        };

        self.onTouchEnd = function (e)  {
            var numTouches = e.touches.length;
            if(numTouches === 0) {
                //TODO:
                // optional, do want single tap to do zoom?
                owner.setCurrentState(owner.BASE_STATE);
            }
        };

        self.onGestureStart = function (e) {
            // do nothing.
        };

        self.onGestureChange = function (e) {
            // do nothing.
        };

        self.onGestureEnd = function (e) {
            // do nothing.
        };

        self.initialize = function() {
            timeoutID = setTimeout(self.timeoutHandler, owner.DOUBLE_TAP_TIMEOUT);
        };

        self.dispose = function() {
            if(timeoutID) {
                clearTimeout(timeoutID);
                timeoutID = null
            }
        };
        self.stateName = 'basetapped';
    };


    var TapState = function(owner) {
        var self = this;
        var owner = owner;
        var timerID = null;

        self.timeoutHandler = function() {
            if(timerID)
            {
                clearTimeout(timerID);
                timerID = null;
            }
            owner.setCurrentState(owner.DRAG_STATE);
        };

        self.onTouchStart = function (e)  {
            var numTouches = e.touches.length;

            if(numTouches >= 1) {
                owner.setCurrentState(owner.PINCH_STATE);
                return;
            };
        };

        self.onTouchMove = function (e)  {
            var numTouches = e.touches.length;
            // Go to dragging state if touch moved too far (threshold)
            var newTouchPixelOrigin = owner.getTouchPixelOrigin(e);
            var distance = distanceOf(newTouchPixelOrigin, owner.touchPixelOrigin);
            if (distance > owner.TAP_DISTANCE_THRESHOLD) {
                owner.setCurrentState(owner.DRAG_STATE);
            }
        };

        self.onTouchEnd = function (e)  {
            var numTouches = e.touches.length;
            if(numTouches === 0) {
                //TODO:
                // optional, do want single tap to do zoom?
                owner.setCurrentState(owner.BASE_TAPPED_STATE);
            }
        };

        self.onGestureStart = function (e) {
            // do nothing.
        };

        self.onGestureChange = function (e) {
            // do nothing.
        };

        self.onGestureEnd = function (e) {
            // do nothing.
        };

        self.initialize = function() {
            timerID = setTimeout(self.timeoutHandler, owner.TAP_TIMEOUT);
        };

        self.dispose = function() {
            if(timerID) {
                clearTimeout(timerID);
                timerID = null
            }
        };
        self.stateName = 'tap';
    };

     var DoubleTapState = function(owner) {
        var self = this;
        var owner = owner;
        var timerID = null;

        self.timeoutHandler = function() {
            if(timerID)
            {
                clearTimeout(timerID);
                timerID = null;
            }
            owner.setCurrentState(owner.DRAG_STATE);
        };

        self.onTouchStart = function (e)  {
            var numTouches = e.touches.length;

            if(numTouches >= 1) {
                owner.setCurrentState(owner.PINCH_STATE);
                return;
            };
        };

        self.onTouchMove = function (e)  {
            var numTouches = e.touches.length;
            // Go to dragging state if touch moved too far (threshold)
            var newTouchPixelOrigin = owner.getTouchPixelOrigin(e);
            var distance = distanceOf(newTouchPixelOrigin, owner.touchPixelOrigin);
            if (distance > owner.TAP_DISTANCE_THRESHOLD) {
                owner.setCurrentState(owner.DRAG_STATE);
            }
        };

        self.onTouchEnd = function (e)  {
            var numTouches = e.touches.length;
            if(numTouches === 0) {
                //OK, so now we signal that user has double tapped.
                if(doubleTapHandler) {
                    doubleTapHandler(owner.touchPixelOrigin);
                }
                owner.setCurrentState(owner.BASE_STATE);
            }
        };

        self.onGestureStart = function (e) {
            // do nothing.
        };

        self.onGestureChange = function (e) {
            // do nothing.
        };

        self.onGestureEnd = function (e) {
            // do nothing.
        };

        self.initialize = function() {
            timerID = setTimeout(self.timeoutHandler, owner.TAP_TIMEOUT);
        };

        self.dispose = function() {
            if(timerID) {
                clearTimeout(timerID);
                timerID = null
            }
        };
        self.stateName = 'doubletap';
    };

    var DragState = function(owner) {
        var self = this;
        var owner = owner;

        self.onTouchStart = function (e)  {
            var numTouches = e.touches.length;
            if(numTouches >= 1) {
                owner.setCurrentState(owner.PINCH_STATE);
            }
        };
        self.onTouchMove = function (e)  {
            var numTouches = e.touches.length;

            if(numTouches >= 2)
            {
                //switch to punch if multiple touches.
                owner.setCurrentState(owner.PINCH_STATE);
                return;
            }

            // Go to dragging state if touch moved too far (threshold)
            var newTouchPixelOrigin = owner.getTouchPixelOrigin(e);
            var dx = newTouchPixelOrigin.x -  owner.touchPixelOrigin.x;
            var dy = newTouchPixelOrigin.y -  owner.touchPixelOrigin.y;

            if(panHandler) {
                panHandler(owner.touchPixelOrigin,  {x:dx , y:dy});
            }
        };

        self.onTouchEnd = function (e)  {
            var numTouches = e.touches.length;
            if(numTouches === 0) {
                owner.setCurrentState(owner.BASE_STATE);
            }
        };

        self.onGestureStart = function (e) {
            // do nothing.
        };

        self.onGestureChange = function (e) {
            // do nothing.
        };

        self.onGestureEnd = function (e) {
            // do nothing.
        };

        self.initialize = function() {
            // do nothing.
        };

        self.dispose = function() {
            //do nothing.
        };

        self.stateName = 'drag';
    };

    var TwoFingerTapState = function(owner) {
        var self = this;
        var owner = owner;
        var timerID = null;

        self.timeOutHandler = function() {
            if(timerID) {
                clearTimeout(timerID);
                timerID = null;
            }
            owner.setCurrentState(owner.DRAG_STATE);
        };

        self.onTouchStart = function (e)  {
            owner.setCurrentState(owner.PINCH_STATE);
        };

        self.onTouchMove = function (e)  {
            var numTouches = e.touches.length;
            // Go to dragging state if touch moved too far (threshold)
            var newTouchPixelOrigin = owner.getTouchPixelOrigin(e);
            var distance = distanceOf(newTouchPixelOrigin, owner.touchPixelOrigin);

            if (distance > owner.TAP_DISTANCE_THRESHOLD) {
                owner.setCurrentState(owner.DRAG_STATE);
            }
        };

        self.onTouchEnd = function (e)  {
            var numTouches = e.touches.length;
            if(numTouches === 0) {
                //TODO:
                // optional, do want single tap to do zoom?
                owner.setCurrentState(owner.BASE_STATE);
            }
        };

        self.onGestureStart = function (e) {
            // do nothing.
        };

        self.onGestureChange = function (e) {
            // do nothing.
        };

        self.onGestureEnd = function (e) {
            // do nothing.
        };

        self.initialize = function() {
            timerID = setTimeout(self.timeOutHandler, owner.TAP_TIMEOUT);
        };

        self.dispose = function() {
            if(timerID) {
                clearTimeout(timerID);
                timerID = null
            }
        };

        self.stateName = 'twofingertap';
    };

    var PinchState = function(owner) {
        var owner = owner;
        var self = this;
        self.onTouchStart = function (e)  {
            var numTouches = e.touches.length;
            owner.touchPixelOrigin = owner.getTouchPixelOrigin(e);

            if(numTouches === 1) {
                owner.setCurrentState(owner.TAP_STATE);
            };

            if(numTouches === 2) {
                owner.setCurrentState(owner.TWO_FINGER_TAP_STATE);
            };
        };
        self.onTouchMove = function (e)  {
            owner.touchPixelOrigin = owner.getTouchPixelOrigin(event);
        };

        self.onTouchEnd = function (e)  {
            var numTouches = e.touches.length;
            if(numTouches === 0) {
                owner.setCurrentState(owner.BASE_STATE);
            };
        };

        self.onGestureStart = function (e) {
            //do nothing.
        };

        self.onGestureChange = function (e) {
            //Switch to Drag if we're not actually scalling.
            // change is more than a certain threshold, e.g. 10%.
            //if (Math.abs(e.scale - 1) <= owner.SCALE_TRESHOLD) {
            //    owner.setCurrentState(owner.DRAG_STATE);
            //    return;
            //}

            zoomHandler(owner.touchPixelOrigin, e.scale);
        };

        self.onGestureEnd = function (e) {
            //do nothing.
        };

        self.initialize = function() {
            //do nothing.
        };
        self.dispose = function() {
            //do nothing.
        };

        self.stateName = 'pinch';
    };

    //Data shared between states.
    self.touchPixelOrigin;

   //Constants.
    self.DOUBLE_TAP_TIMEOUT = 20;           //ms;
    self.TAP_TIMEOUT = 800;           //ms;
    self.TAP_DISTANCE_THRESHOLD = 5; //pixels
    self.SCALE_THRESHOLD = 0.02;     //percent;
    self.TAP_ZOOM_FACTOR = 2.0;

    //State Nodes.
    self.BASE_STATE = new BaseState(self);
    self.BASE_TAPPED_STATE = new BaseTappedState(self);
    self.TAP_STATE = new TapState(self);
    self.DOUBLE_TAP_STATE = new DoubleTapState(self);
    self.TWO_FINGER_TAP_STATE = new TwoFingerTapState(self);
    self.PINCH_STATE = new PinchState(self);
    self.DRAG_STATE = new DragState(self);

    //functions used by State Implementations.
    var currentState;
    self.setCurrentState = function(state) {
        if(currentState)
        {
            currentState.dispose();
        }

        currentState = state;
        currentState.initialize();
        if(stateChangedHandler) {
            stateChangedHandler(currentState.stateName, self.touchPixelOrigin);
        }
    };

    self.getTouchPixelOrigin = function (e)  {
        var i, touch;
        var numTouches = e.touches.length;
        var touchPixelOrigin = {x:0.0, y: 0.0};
        //Compute centroid.
        for(i = 0; i < numTouches; ++i) {
            touch = e.touches[i];
            touchPixelOrigin.x += touch.pageX;
            touchPixelOrigin.y += touch.pageY;
        }
        touchPixelOrigin.x /= numTouches;
        touchPixelOrigin.y /= numTouches;
        return touchPixelOrigin;
    };

    //Our touch event hanlders that dispatch to state objects.
   self.onTouchStart = function (e)  {
        currentState.onTouchStart(e.originalEvent);
        e.preventDefault();
   };

   self.onTouchMove = function (e)  {
        currentState.onTouchMove(e.originalEvent);
        e.preventDefault();
   };

   self.onTouchEnd = function (e)  {
        currentState.onTouchEnd(e.originalEvent);
        e.preventDefault();
   };

   self.onGestureStart = function (e) {
        currentState.onGestureStart(e.originalEvent);
        e.preventDefault();
   };

   self.onGestureChange = function (e) {
        currentState.onGestureChange(e.originalEvent);
        e.preventDefault();
   };

   self.onGestureEnd = function (e) {
        currentState.onGestureEnd(e.originalEvent);
        e.preventDefault();
   };

   self.dispose = function() {
        $(containerDiv).unbind('touchstart',    self.onTouchStart);
        $(containerDiv).unbind('touchmove',     self.onTouchMove);
        $(containerDiv).unbind('touchend',      self.onTouchEnd);
        $(containerDiv).unbind('gesturestart',  self.onGestureStart);
        $(containerDiv).unbind('gesturechange', self.onGestureChange);
        $(containerDiv).unbind('gestureend',    self.onGestureEnd);

        if(self.BASE_STATE) {
            self.BASE_STATE.dispose();
        }

        if(self.TAP_STATE) {
            self.TAP_STATE.dispose();
        }

        if(self.TWO_FINGER_TAP_STATE) {
            self.TWO_FINGER_TAP_STATE.dispose();
        }

        if(self.PINCH_STATE) {
            self.PINCH_STATE.dispose();
        }

        if(self.DRAG_STATE) {
            self.DRAG_STATE.dispose();
        }
   };

    //Initialize.
    self.setCurrentState(self.BASE_STATE);

    //Start listening for events.
   $(containerDiv).bind('touchstart',    self.onTouchStart);
   $(containerDiv).bind('touchmove',     self.onTouchMove);
   $(containerDiv).bind('touchend',      self.onTouchEnd);
   $(containerDiv).bind('gesturestart',  self.onGestureStart);
   $(containerDiv).bind('gesturechange', self.onGestureChange);
   $(containerDiv).bind('gestureend',    self.onGestureEnd);
};
