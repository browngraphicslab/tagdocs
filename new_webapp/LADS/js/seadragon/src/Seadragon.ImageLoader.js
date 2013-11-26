//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonImageLoader;

(function() {
    
    var TIMEOUT = 15000;     // milliseconds after which an image times out
    
    function Job(src, callback) {
        // Fields
        this.src = src;
        this.callback = callback;
        this.image = null;
        this.timeout = null;     // IE8 fix: no finishing event raised sometimes
        this.running = false;
    }

    Job.prototype.start = function () {
        var self = this;
        if (!self.running) {
            self.running = true;
            self.image = new Image();

            var successFunc = function () { self.finish(true); };
            var failureFunc = function () { self.finish(false); };
            var timeoutFunc = function () {
                SeadragonDebug.log("Image timed out: " + self.src);
                self.finish(false);
            };

            self.image.onload = successFunc;
            self.image.onabort = failureFunc;
            self.image.onerror = failureFunc;

            // consider it a failure if the image times out.
            self.timeout = window.setTimeout(timeoutFunc, TIMEOUT);

            self.image.src = self.src;
        }
    };

    Job.prototype.finish = function (success) {
        this.image.onload = null;
        this.image.onabort = null;
        this.image.onerror = null;

        if (this.timeout) {
            window.clearTimeout(this.timeout);
        }

        // call on a timeout to ensure asynchronous behavior
        this.callback(this.src, success ? this.image : null);
    };
    
    SeadragonImageLoader = Seadragon.ImageLoader = function() {
        
        // Fields
        
        var downloading = 0,    // number of Jobs currently downloading
            downloadQueue = []; // Jobs that have yet to be started
        
        // Helpers
        
        function onComplete(callback, src, image) {
            var newdl;
            downloading--;

            // finish loading
            if (typeof (callback) === "function") {
                setTimeout(function () {
                    try {
                        callback(image);
                    } catch (e) {
                        SeadragonDebug.error(e.name + " while executing " + src +
                                " callback: " + e.message, e);
                    }
                }, 2);
            }

            // launch jobs in queue
            while (downloading < SeadragonConfig.imageLoaderLimit && downloadQueue.length > 0) {
                newdl = downloadQueue.shift();
                if (!newdl.tile.loaded) {
                    setTimeout(newdl.job.start(), 2);
                    downloading++;
                }
            }
        }
        
        // Methods
        
        this.loadImage = function(tile, callback) {
            
            var func = SeadragonUtils.createCallback(null, onComplete, callback);
            var job = new Job(tile.url, func);

            // if there are too many jobs, save job to queue
            if (downloading >= SeadragonConfig.imageLoaderLimit) {
                downloadQueue.push({ job: job, tile: tile });
            } else {
                downloading++;
                job.start();
            }
            
            // returning true for now for legacy code
            tile.loading = true;
        };

        this.clear = function () {
            downloadQueue.map(function (v) {
                v.tile.loading = false;
            });
            downloadQueue = [];
        };
        
    };

})();
