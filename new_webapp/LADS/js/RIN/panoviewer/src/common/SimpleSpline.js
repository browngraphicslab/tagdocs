//Takes two points and the slope (called k) of the line at each of those points.
//Math is taken from http://en.wikipedia.org/wiki/Spline_interpolation on 7/18/2012
function SimpleSpline(x1, x2, y1, y2, k1, k2) {
    var x2MinusX1 = x2 - x1;
    var y2MinusY1 = y2 - y1;

    var a = (k1 * x2MinusX1) - y2MinusY1;
    var b = y2MinusY1 - (k2 * x2MinusX1);

    this.getValue = function (x) {
        var t = (x - x1) / x2MinusX1;
        var oneMinusT = 1 - t;

        var result = (oneMinusT * y1) + (t * y2) + (t * oneMinusT * ((a * oneMinusT) + (b * t)));

        return result;
    }
}

function CompositeSpline(xArray, yArray, kArray) {
    if (xArray.length !== yArray.length || xArray.length !== kArray.length || xArray.length < 2) {
        throw "CompositeSpline constructor requires three arrays of identical length of 2 or greater.";
    }
    
    var splines = [];
    var i;

    for (i = 0; i < xArray.length - 1; i++) {
        var iPlusOne = i + 1;
        splines.push(new SimpleSpline(xArray[i], xArray[iPlusOne], yArray[i], yArray[iPlusOne], kArray[i], kArray[iPlusOne]));
    }

    this.getValue = function (x) {
        //first pick which simple spline to use to get the value
        i = 0;
        while (i < xArray.length - 2 && x > xArray[i + 1]) {
            i++;
        }

        //then actually call that simple spline and return the value
        return splines[i].getValue(x);
    }
}
