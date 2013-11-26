/**
 * A priority tile downloader.
 * This is very simple and *doesn't* yet support grouping callbacks.
 * instead it's up to the application loop to call update and check completed array for new results.
 * @param {boolean} useCORS indicates if Cross Origin Resource Sharing image tags should be used.
 * @constructor
 */
var PriorityNetworkDownloader = function(useCORS, tileDownloadFailedCallback, tileDownloadSucceededCallback) {
    var self = this;

    self.useCORS = (useCORS || false);

    var _spacerImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

    // if image isn't downloaded in this many milliseconds, free up the download slot
    var _downloadTimeout = 10000;

    var _throttle = new DomainThrottle();

    var _queue = [];
    var _activeDownloads = {};

    // cached image downloads: [url] -> [<img src=url/>];
    var _downloaded = new MemoryCache(300);
    var _failed = new MemoryCache(100);
    var _allDownloadedUrls = new MemoryCache(3000);

    var _succeedCount = 0;
    var _failCount = 0;

    //if no failure/success callbacks str specified, then define no-op ones
    tileDownloadFailedCallback = tileDownloadFailedCallback || function() {};
    tileDownloadSucceededCallback = tileDownloadSucceededCallback || function() {};

    // Safari (iPad and iPhone) and Android seem to leak memory when recycling images...
    if (quirks.useImageDisposer) {
        _downloaded.useDisposer(function(o) {
            if (o && o.src) {
                o.src = _spacerImageUrl;
            }
        });
    }

    var attributePrefix = '$$'
    var _downloadRequestKey = attributePrefix + 'downloadRequest';
    var _timeoutIdKey = attributePrefix + 'timeoutid';
    var _processedKey = attributePrefix + 'processed';
    var _consumedActiveCountKey = attributePrefix + 'consumedActiveCount';
    //Used when processing responses in completed.
    var _tokenKey = 'token';

    self.completed = [];

    self.getState = function(url) {
        if (_downloaded.get(url)) {
            return TileDownloadState.ready;
        }
        if (_allDownloadedUrls.get(url)) {
            return TileDownloadState.cacheExpired;
        }

        var failedState = _failed.get(url);
        if (failedState !== undefined) {
            return failedState;
        }

        if (_activeDownloads[url]) {
            return TileDownloadState.downloading;
        }

        return TileDownloadState.none;
    };

    /**
     * enqueue an image to download
     * @param {string} url
     * @param {number} priority
     * @param {Object} token
     */
    self.downloadImage = function(url, priority, token) {
        if (self.getState(url) === TileDownloadState.ready) {
            //We've got it in the cache. Make it avaible immediately.
            self.completed.push(_downloaded.get(url));
        } else {
            _queue.push({
                url: url,
                priority: priority,
                token: token
            });
        }
    };

    /**
     * Update the priority on an pending download.
     * @param {string} url
     * @param {number} priority
     */
    self.updatePriority = function(url, priority) {
        //Look for duplicates...
        var i, found = false;
        for (i = 0; i < _queue.length; ++i) {
            if (_queue.url === url) {
                found = true;
                _queue.priority = priority;
                break;
            }
        }

        if (!found) {
            throw 'Expected item to be in queue.'
        }
    };

    /**
     * Cancel a pending download.
     * @param {string} url
     */
    self.cancel = function(url) {
        var i;
        //Remove from queues.
        if (_activeDownloads[url]) {
            _endDownload(_activeDownloads[url], url);
        }

        i = self.completed.length;
        while (i--) {
            if (self.completed[i].src === url) {
                self.completed[i].splice(i, 1);
            }
        }
    };

    /**
     * Get the current size of the cache. This is
     * mainly for debugging and isn't performant.
     * @return {number}
     */
    self.getCacheSize = function() {
        return _downloaded.size();
    };

    self.currentlyDownloading = function() {
        return _throttle.totalCount > 0;
    };

    function startImageDownload(downloadRequest, consumeActiveCount) {

        var url = downloadRequest.url;

        // TODO: would be better to put data on the downloadRequest
        // object instead of on the Image object (owned by the browser)
        var img = document.createElement('img');
        _activeDownloads[url] = img;
        img[_downloadRequestKey] = downloadRequest;
        img.onload = _onDownloadComplete;
        img.onerror = _onDownloadFailed;
        img.onabort = _onDownloadFailed;
        if (consumeActiveCount) {
            img[_consumedActiveCountKey] = true;
            _throttle.start(url);
        }
        img[_timeoutIdKey] = window.setTimeout((function() {
            var closureImg = img;
            return function() {
                _onDownloadTimeout.call(closureImg);
            };
        })(), _downloadTimeout);

        //Cross origin flag has gotten a bit more complicated.
        // We have to deal with a few cases.
        // (a) data uri which doesn't note require any CORS stuff.
        // (b) rendering with CSS, thus un-needed
        // (c) We are getting content from the same domain or relative url thus unneeded
        // (d) We are getting content from another domain and using webgl - thus required.


        var useCORS = false;

        if (self.useCORS) { //case (b)
            useCORS = !Utils.isDataUrl(url) && //case (a)
            !Utils.isRelativeUrl(url) && //case (c-2)
            !Utils.areSameDomain(url, window.location.toString()); //case (c-1)
        }

        if (useCORS) {
            img.crossOrigin = '';
        }

        img.src = url;
    }

    /**
     * Call this from the run-loop of the application.
     * This will process any completed downloads and trigger new downloads.
     */
    self.update = function() {
        self.completed = [];
        _queue.sort(function(l, r) {
            return r.priority - l.priority;
        });

        var blockedDownloads = 0;

        // starts downloads for highet priority images while download slots are available
        for (var i = 0; i < _queue.length; i++) {
            var downloadRequest = _queue[i],
                downloadState = self.getState(downloadRequest.url);
            switch (downloadState) {
                case TileDownloadState.none:
                case TileDownloadState.timedout:
                    if (_throttle.canStart(downloadRequest.url)) {
                        startImageDownload(downloadRequest, true);
                    } else {
                        blockedDownloads++;
                    }
                    break;
                case TileDownloadState.cacheExpired:
                    //console.log('download cache expired image immediately');
                    startImageDownload(downloadRequest, false);
                    break;
                case TileDownloadState.downloading:
                    break;
                case TileDownloadState.ready:
                    //This case can happen with the atlas image on the first frame, where it is requested multiple times in the same frame
                    self.completed.push(_queue[i].url);
                    _queue.splice(i, 1);
                    i--;
                    break;
                default:
                    break;
            }
        }

        if (blockedDownloads > 0) {
            //console.log('pano blocked downloads: ' + blockedDownloads + ' at ' + new Date().toLocaleTimeString());
            //console.log(_throttle.counts);
        }
    };

    function _onDownloadComplete() {
        if (!this[_processedKey]) {
            var url = this[_downloadRequestKey].url;
            _endDownload(this, url);

            _allDownloadedUrls.insert(url, true); // DON'T store the image here. Mobile devices cannot handle too many in-memory images.
            self.completed.push(this);
            this[_tokenKey] = this[_downloadRequestKey].token;
            _downloaded.insert(url, this);

            _succeedCount++;
            tileDownloadSucceededCallback(_failCount, _succeedCount);
        }
    }

    function _onDownloadFailed() {
        if (!this[_processedKey]) {
            var url = this[_downloadRequestKey].url;
            _endDownload(this, url);

            if (quirks.useImageDisposer) {
                this.src = _spacerImageUrl; //TODO
            }
            _failed.insert(url, TileDownloadState.failed);

            _failCount++;
            tileDownloadFailedCallback(_failCount, _succeedCount);
        }
    }

    function _onDownloadTimeout() {
        if (!this[_processedKey]) {
            var url = this[_downloadRequestKey].url;
            _endDownload(this, url);

            if (quirks.useImageDisposer) {
                this.src = _spacerImageUrl; //TODO..
            }
            _failed.insert(url, TileDownloadState.timedout);

            _failCount++;
            tileDownloadFailedCallback(_failCount, _succeedCount);
        }
    }

    function _endDownload(img, url) {
        img[_processedKey] = true;
        img.onload = null;
        img.onerror = null;
        img.onabort = null;
        window.clearTimeout(img[_timeoutIdKey]);
        var downloadRequest = img[_downloadRequestKey];
        var i = _queue.length;
        while (i--) {
            if (_queue[i] === downloadRequest) {
                _queue.splice(i, 1);
            }
        }

        if (img[_consumedActiveCountKey]) {
            _throttle.stop(url);
        }

        delete _activeDownloads[url];

        i = self.completed.length;

    }
};

var TileDownloadState = {
    none: 0,
    downloading: 1,
    ready: 2, // This means the image is decoded and in memory
    failed: 3,
    timedout: 4,
    cacheExpired: 5 // This means the image was requested at some point (so probably on disk), but not decoded and in memory
};