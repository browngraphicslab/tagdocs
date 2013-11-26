/**
* A utility class for common functionality
* @class
*/
var Utils = {

    /**
     * Wraps console.log for debugging.
     */
    log : function() {
        if(window.console && Config.debug) {
            console.log.apply(console, arguments);
        }
    },

    /**
     * Applys prototype inheritance to the derived class, for more info see:
     * http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm
     * @param {Object} derived The derived classes constructor
     * @param {Object} base The base classes constructor
     */
    extend : function (derived, base) {

        /**
        * @constructor
        * @ignore
        */
        function Inheritance() {
        }
        Inheritance.prototype = base.prototype;

        derived.prototype = new Inheritance();
        derived.prototype.constructor = derived;
        derived.baseConstructor = base;
        derived.superClass = base.prototype;
    },

    _eventListeners : {},


    /**
     * This adds event handlers to an element. Note, you can subscribe to multiple events via space seperated list.
     */
    bind : function (element, eventName, handler, useCapture) {
        var i,
            eventNames = eventName.split(' ');

        for(i = 0; i < eventNames.length; ++i) {
            eventName = eventNames[i];

            if(!Utils._eventListeners[element]) {
                Utils._eventListeners[element] = {};
            }
            if(!Utils._eventListeners[element][eventName]) {
                Utils._eventListeners[element][eventName] = [];
            }

            // technique from:
            // http://blog.paranoidferret.com/index.php/2007/08/10/javascript-working-with-events/
            if (element.addEventListener) {
                if (eventName == 'mousewheel') {
                    element.addEventListener('DOMMouseScroll', handler, useCapture);
                }
                // we are still going to add the mousewheel -- not a mistake!
                // this is for opera, since it uses onmousewheel but needs addEventListener.
                element.addEventListener(eventName, handler, useCapture);
            } else if (element.attachEvent) {
                element.attachEvent('on' + eventName, handler);
                if (useCapture && element.setCapture) {
                    element.setCapture();
                }
            }

            Utils._eventListeners[element][eventName].push([handler, useCapture]);
        }
    },

    _unbindAll : function(element) {
        var k,eventListeners,i;
        if(Utils._eventListeners[element]) {
            for(k in Utils._eventListeners[element]) {
                for(i = 0; i <  Utils._eventListeners[element][k].length; ++i) {
                    Utils.unbind(element, k, Utils._eventListeners[element][k][i][0], Utils._eventListeners[element][k][i][1]);
                }
            }
        }
    },

    unbind : function(element, eventName, handler, useCapture) {
        if(element && !eventName) {
            Utils._unbindAll(element);
        } else {
            var i, j, k, count,
                eventNames = eventName.split(' ');
            for(i = 0; i < eventNames.length; ++i) {
                eventName = eventNames[i];

                if (element.removeEventListener) {
                    if (eventName == 'mousewheel') {
                        element.removeEventListener('DOMMouseScroll', handler, useCapture);
                    }
                    // we are still going to remove the mousewheel -- not a mistake!
                    // this is for opera, since it uses onmousewheel but needs removeEventListener.
                    element.removeEventListener(eventName, handler, useCapture);
                } else if (element.detachEvent) {
                    element.detachEvent('on' + eventName, handler);
                    if (useCapture && element.releaseCapture) {
                        element.releaseCapture();
                    }
                }

                if(Utils._eventListeners[element] && Utils._eventListeners[element][eventName]) {
                    for(j = 0; j < Utils._eventListeners[element][eventName].length; ++j) {
                        if(Utils._eventListeners[element][eventName][j][0] === handler) {
                            Utils._eventListeners[element][eventName][j].splice(j,1);
                        }
                    }
                    if(Utils._eventListeners[element][eventName].length === 0) {
                        delete Utils._eventListeners[element][eventName];
                    }
                }
            }

            count = 0;
            if(Utils._eventListeners[element]) {
                for(k in Utils._eventListeners[element]) {
                    ++count;
                }
                if(count === 0) {
                    delete Utils._eventListeners[element];
                }
            }
        }
    },

    /**
     * This sets the opacity which works across browsers
     */
    setOpacity : function() {
        /**
         * @param {Object} elem
         * @param {number} opacity
         */
        function w3c(elem, opacity) {
                elem.style.opacity = opacity;
        }
         /**
         * @param {Object} elem
         * @param {number} opacity
         */
        function ie(elem, opacity) {
            opacity *= 100;
            var filter;
            try {
                filter = elem.filters.item('DXImageTransform.Microsoft.Alpha');
                if (opacity < 100) {
                    filter.Opacity = opacity;
                    if (!filter.enabled) {
                        filter.enabled = true;
                    }
                } else {
                    filter.enabled = false;
                }
            }
            catch (ex) {
                if (opacity < 100) {
                    elem.style.filter = (elem.currentStyle || elem.runtimeStyle).filter + ' progid:DXImageTransform.Microsoft.Alpha(opacity=' + opacity + ')';
                }
            }
        }

        var d = document.createElement('div');
        return typeof d.style.opacity !== 'undefined' && w3c
               || typeof d.style.filter !== 'undefined' && ie
               || function() {};
    }(),

    /**
     * Adds CSS to a DOM element.
     * @param {Object} element
     * @param {Object} obj  These are key-value pairs of styles e.g. {backgroundColor: 'red'}
     */
    css : function(element, obj) {
        var k;
        for(k in obj) {
            if(obj.hasOwnProperty(k)) {
                if(k === 'opacity') {
                    Utils.setOpacity(element, obj[k]);
                } else {
                    element.style[k] = obj[k];
                }
            }
        }
    },

    /**
     * Get the scroll wheel data across browsers
     * @param {Object} e
     * @return {number}
     */
    getWheelDelta : function (e) {
        //Get the wheel data in a browser-agnostic way.
        //See http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        return e.detail ? e.detail * -1 : e.wheelDelta / 40;
    },

    /**
     * Tests if an url is of the form "data:/mimetype/base64data"
     * @param {string} url
     * @return {boolean}
     */
    isDataUrl : function(url) {
         return /^data:/.test(url);
    },

    /**
     *  Tests if the url is a relative url
     *  @param {string} url
     *  @return {boolean}
     */
    isRelativeUrl : function(url) {
        var hasProtocol = /^ftp:\/\//.test(url) || /^http:\/\//.test(url)  || /^https:\/\//.test(url)  || /^file:\/\//.test(url)
        return !hasProtocol;
    },

    hostnameRegexp : new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im'),
    filehostnameRegexp : new RegExp('^file\://([^/]+)', 'im'),

    /**
     * Returns the hostname
     * @param {string} url
     * @return {string}
     */
    getHostname : function(url) {
        var result =  Utils.hostnameRegexp.exec(url);
        if(!result || result.length !== 2) {
            result = Utils.filehostnameRegexp.exec(url);
        }

        if(!result || result.length !== 2) {
            return '';
        } else {
            return result[1].toString();
        }
    },

    /**
     * Determines if a pair of urls are on the same domain
     * @param {string} url1
     * @param {string} url2
     * @return  {boolean}
     */
    areSameDomain : function(url1, url2) {
        var host1 = Utils.getHostname(url1).toLowerCase(),
            host2 = Utils.getHostname(url2).toLowerCase();
        return host1 === host2;
    }
}
