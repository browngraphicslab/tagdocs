/**
*@constructor
*/
function Rectangle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

Rectangle.prototype = {

    intersect: function (rect) {
        if (!this.intersectsWith(rect)) {
            this.x = this.y = this.width = this.height = 0;
        }
        else {
            var num = Math.max(this.x, rect.x);
            var num2 = Math.max(this.y, rect.y);
            this.width = Math.max((Math.min((this.x + this.width), (rect.x + rect.width)) - num), 0.0);
            this.height = Math.max((Math.min((this.y + this.height), (rect.y + rect.height)) - num2), 0.0);
            this.x = num;
            this.y = num2;
        }
    },

    intersectsWith: function (rect) {
        if ((this.width < 0.0) || (rect.width < 0.0)) {
            return false;
        }
        return ((((rect.x <= (this.x + this.width)) && ((rect.x + rect.width) >= this.x)) && (rect.y <= (this.y + this.height))) && ((rect.y + rect.height) >= this.y));
    },

    getLeft: function () {
        return this.x;
    },

    getRight: function () {
        return this.x + this.width;
    },

    getTop: function () {
        return this.y;
    },

    getBottom: function () {
        return this.y + this.height;
    }
};
