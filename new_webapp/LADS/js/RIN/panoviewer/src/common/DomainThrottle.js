

// Helps limit concurrent requests by domain
function DomainThrottle() {

    this.counts = {};
    this.totalCount = 0;

    // allow slightly more than browser max (8) so the browser can
    // immediately queue another download without waiting for the pano
    // to run the update loop.
    this.maxRequests = 10;
}

DomainThrottle.prototype.getDomainKey = function(url) {
    if (Utils.isDataUrl(url)) {
        return 'data';
    }

    if (Utils.isRelativeUrl(url)) {
        return '/';
    }

    return Utils.getHostname(url).toLowerCase();
};

DomainThrottle.prototype.canStart = function(url) {
    var key = this.getDomainKey(url);

    // always start data requests (no actual network request required)
    if (key === 'data') {
        return true;
    }

    var count = this.counts[key] || 0;
    return (count < this.maxRequests);
};

DomainThrottle.prototype.start = function(url) {
    var key = this.getDomainKey(url);
    if (this.counts[key] === undefined) {
        this.counts[key] = 1;
    } else {
        this.counts[key]++;
    }

    this.totalCount++;
};

DomainThrottle.prototype.stop = function(url) {
    var key = this.getDomainKey(url);
    if (this.counts[key] === undefined) {
        this.counts[key] = 0;
    } else {
        this.counts[key]--;
    }

    this.totalCount--;
};
