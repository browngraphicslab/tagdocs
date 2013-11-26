/**
 * tests.js
 * Prints out some basic dependency information.
 */

LADS.Util.makeNamespace("LADS.TESTS");

console.log("Checking setup\n-------------------");
console.log("LADS: "+LADS);
console.log("LADS.Util: "+LADS.Util);
console.log("Seadragon: "+Seadragon);
console.log("jQuery: "+jQuery);
console.log("localStorage.ip: "+localStorage.ip);

var startRoot = LADS.Util.getHtmlAjax('startPage.html');

console.log("LADS.Util.getHtmlAjax valid: "+(!!startRoot));

var a = { key: 5, altkey: 7 }, b = { key: 8, altkey: 9 }, c = { key: 10, altkey: 14 }, d = { key: 25, altkey: 30 };

// AVL tree testing
var comparator = function (a, b) {
    if (a.key < b.key) {
        return -1;
    } else if (a.key > b.key) {
        return 1;
    } else {
        return 0;
    }
};

var avltree = new AVLTree(comparator);
avltree.add(a);
avltree.add(b);
avltree.add(c);
avltree.add(d);
console.log("AVL tree testing: "+avltree.findNext(c).key);


console.log("-------------------\n")