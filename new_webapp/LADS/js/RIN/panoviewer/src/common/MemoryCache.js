//------------------------------------------------------------------------------
// <Copyright From='2004' To='2020' Company='Microsoft Corporation'>
//      Copyright (c) Microsoft Corporation. All Rights Reserved.
//      Information Contained Herein is Proprietary and Confidential.
// </Copyright>
//------------------------------------------------------------------------------

/**
 * Caches arbitary key(string)/value(object) pairs
 * @param {number} maxEntries
 * @constructor
 */
function MemoryCache(maxEntries) {

    var Debug = {};
    Debug.assert = function(a, b) {};

    var _cache = {},
        _keys = [], // FIFO queue of key names for cached objects
        _disposer = null;

    /**
     * tries to get value for provided key
     * doesn't return anything (a.k.a. returns "undefined") if there is no match
     * @param {string} key
     * @param {boolean=} refresh
     */
    this.get = function(key, refresh) {
        Debug.assert(typeof key === 'string', 'Argument: key');

        var value = _cache[key];

        // the refresh flag essentially converts to LRU cache
        // by moving key to the end of the ejection queue
        if (refresh && value !== undefined) {
            var index = _keys.indexOf(key);
            if (index >= 0) {

                // extract key and move to the end
                _keys.splice(index, 1, key);
            }
        }

        return value;
    };

    /**
     * inserts given value to the cache
     * @param {string} key
     * @param {Object} value
     */
    this.insert = function(key, value) {
        Debug.assert(typeof key === 'string', 'Argument: key');
        Debug.assert(value !== undefined, 'Argument: value');

        // see if the value exists and always update cache
        var existingValue = this.get(key, true);
        _cache[key] = value;

        // only need to add key if value isn't already cached
        if (existingValue === undefined) {
            _keys.push(key);
        }

        // see if we need to trim the cache
        if (_keys.length > maxEntries) {
            var oldKey = _keys[0],
                oldValue = _cache[oldKey];
            delete _cache[oldKey];

            if (_disposer) {
                _disposer(oldValue);
            }
        }
    };

    /**
     * sets a function that should be used for disposing the elements
     * @param {Function} disposer
     */
    this.useDisposer = function(disposer) {
        _disposer = disposer;
    };

    /**
     * Returns the current size of the cache
     * @return {number}
     */
    this.size = function() {
        return _keys.length;
    };
}