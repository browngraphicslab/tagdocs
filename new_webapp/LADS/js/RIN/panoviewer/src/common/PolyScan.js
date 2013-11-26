/* Generic Convex Polygon Scan Conversion based on: */
/*
 * Generic Convex Polygon Scan Conversion and Clipping
 * by Paul Heckbert
 * from "Graphics Gems", Academic Press, 1990
 */

/*
 * poly_scan.c: point-sampled scan conversion of convex polygons
 *
 * Paul Heckbert	1985, Dec 1989
 */
/*
 * poly_scan: Scan convert a polygon, calling pixelproc at each pixel with an
 * interpolated this.Vertex structure.  Polygon can be clockwise or ccw.
 * Polygon is clipped in 2-D to win, the screen space window.
 *
 * Scan conversion is done on the basis of this.Vertex fields sx and sy.
 * These two must always be interpolated, and only they have special meaning
 * to this code; any other fields are blindly interpolated regardless of
 * their semantics.
 *
 * The pixelproc subroutine takes the arguments:
 *
 *	pixelproc(x, y, point)
 *	x, y are integers, window space coords for the pixel
 *	point is a PolygonScanConverter.Vertex
 *
 */

var PolygonScanConverter = {

POLY_NMAX : 32,

Vertex : function() {		/* A POLYGON VERTEX */
	this.sx=0; this.sy=0; this.sz=0; this.sw=1;	/* screen space position (sometimes homogeneous.) */
	this.u=0; this.v=0; this.q=0;		/* texture position (sometimes homogeneous) */
},

scanConvert: function (p, win, pixelproc) {
	var i, li, ri, y, ly, ry, top, rem;
	var ymin;
	var l=new this.Vertex(), r=new this.Vertex(),
		dl=new this.Vertex(), dr=new this.Vertex();

	if (p.n>this.POLY_NMAX) {
		Utils.log("PolygonScanConverter.scanConvert(): too many vertices: %d\n", p.n);
		return;
	}

	ymin = Number.POSITIVE_INFINITY;
	for (i=0; i<p.n; i++)		/* find top vertex (y points down) */
		if (p.vert[i].sy < ymin) {
			ymin = p.vert[i].sy;
			top = i;
		}

	li = ri = top;			/* left and right vertex indices */
	rem = p.n;				/* number of vertices remaining */
	y = Math.ceil(ymin-.5);			/* current scan line */
	ly = ry = y-1;			/* lower end of left & right edges */

	while (rem>0) {	/* scan in y, activating new edges on left & right */
		/* as scan line passes over new vertices */

		while (ly<=y && rem>0) {	/* advance left edge? */
			rem--;
			i = li-1;			/* step ccw down left side */
			if (i<0) i = p.n-1;
			this.incrementalize_y(p.vert[li], p.vert[i], l, dl, y);
			ly = Math.floor(p.vert[i].sy+.5);
			li = i;
		}
		while (ry<=y && rem>0) {	/* advance right edge? */
			rem--;
			i = ri+1;			/* step cw down right edge */
			if (i>=p.n) i = 0;
			this.incrementalize_y(p.vert[ri], p.vert[i], r, dr, y);
			ry = Math.floor(p.vert[i].sy+.5);
			ri = i;
		}

		while (y<ly && y<ry) {	    /* do scanlines till end of l or r edge */
			if (y>=win.y0 && y<=win.y1)
				if (l.sx<=r.sx) this.scanline(y, l, r, win, pixelproc);
				else		this.scanline(y, r, l, win, pixelproc);
			y++;
			this.increment(l, dl);
			this.increment(r, dr);
		}
	}
},

/* scanline: output scanline by sampling polygon at Y=y+.5 */

scanline: function(y, l, r, win, pixelproc) {
	var x, lx, rx;
	var p=new this.Vertex(), dp=new this.Vertex();

	lx = Math.ceil(l.sx-.5);
	if (lx<win.x0) lx = win.x0;
	rx = Math.floor(r.sx-.5);
	if (rx>win.x1) rx = win.x1;
	if (lx>rx) return;
	this.incrementalize_x(l, r, p, dp, lx);
	for (x=lx; x<=rx; x++) {		/* scan in x, generating pixels */
		pixelproc(x, y, p);
		this.increment(p, dp);
	}
},

/*
 * incrementalize_y: put intersection of line Y=y+.5 with edge between points
 * p1 and p2 in p, put change with respect to y in dp
 */

incrementalize_y : function(p1, p2, p, dp, y) {
	var dy, frac;

	dy = p2.sy - p1.sy;
	if (dy==0.) dy = 1.;
	frac = y+.5 - p1.sy;

	for (var prop in p1) {
		dp[prop] = (p2[prop]-p1[prop])/dy;
		p[prop] = p1[prop] + dp[prop] * frac;
	}
},

/*
 * incrementalize_x: put intersection of line X=x+.5 with edge between points
 * p1 and p2 in p, put change with respect to x in dp
 */

incrementalize_x : function(p1, p2, p, dp, x)
{
	var dx, frac;

	dx = p2.sx - p1.sx;
	if (dx==0.) dx = 1.;
	frac = x+.5 - p1.sx;

	for (var prop in p1) {
		dp[prop] = (p2[prop]-p1[prop])/dx;
		p[prop] = p1[prop] + dp[prop] * frac;
	}
},

increment : function(p, dp)
{
	for (var prop in p) {
		p[prop] += dp[prop];
	}
}

};
