/* 
 * dz - AVL Tree implementation
 *
 * An AVL tree is a self-balancing binary search tree with average and 
 * worst case O(log n) for all basic operations, including min, max, and 
 * lookup. This makes it highly favorable for our purposes in storing 
 * displays and keyframes as they must be kept sorted but also be faster 
 * than O(n) for lookup since many interactions revolve around an 
 * arbitarily selected object of the larger set of all such objects, as 
 * determined by user interaction. 
 * 
 * This implementation requires that you define a compare function in 
 * the object you pass in, which it will use to sort your nodes.
 * The compare function of A should take in another element B and 
 * return either -1 if a < b, 1 if a > b, and 0 if they are identical. 
 * The AVLNode will adopt this comparison function so that nodes may be 
 * compared by their keys.
 * 
 */

function AVLTree(comparator) {
    "use strict";
    this._comparator = comparator;
    this._root = null; // the root node
    this._intermediates = []; // used to track intermediate steps while doing traversals; used for finding previous/next nodes
    this._current = null; // the current node being evaluated
}

// public add
AVLTree.prototype.add = function (toAdd) {
    // if first node, make the root node and return it
    if (!this._root) {
        this._root = new AVLNode(toAdd, this._comparator);
        return this._root;
    } else {
        // otherwise add the node and let the AVL mechanism balance + sort the tree
        var added = this._root.add(toAdd);
        this._root = added[0];
        return added[1];
    }
};

// public remove
AVLTree.prototype.remove = function (toRemove) {
    if (this._root) {
        var removed = this._root.remove(toRemove)
        this._root = removed[0];
        return removed[1];
    } else {
        return null;
    }
}

// public find
AVLTree.prototype.find = function (toFind) {
    var found = this._find(toFind);

    return (found) ? found._value : null;
};

// public findnext
AVLTree.prototype.findNext = function (current) {
    var currentNode = this._find(current, true);
    var next = this._next(currentNode);
    return (next) ? next._value : null;
};

// public findprevious
AVLTree.prototype.findPrevious = function (current) {
    var currentNode = this._find(current, true);
    var previous = this._previous(currentNode);
    return (previous) ? previous._value : null;
};

// public max
AVLTree.prototype.max = function () {
    var maximum = this._max();
    return (maximum) ? maximum._value : null;
};

// public min
AVLTree.prototype.min = function () {
    var minimum = this._min();
    return (minimum) ? minimum._value : null;
};

// public next (relative to current)
AVLTree.prototype.next = function () {
    this._current = this._next(this._current);
    return (this._current) ? this._current._value : null;
};

// public previous (relative to current)
AVLTree.prototype.previous = function () {
    this._current = this._previous(this._current);
    return (this._current) ? this._current._value : null;
};


/////////////////////////////
// Private functions below //
/////////////////////////////

// search for a specific node
AVLTree.prototype._find = function (toFind, saveSteps) {
    saveSteps = saveSteps || false;

    var found = this._root;
    if (saveSteps) {
        this._intermediates = [];
    }

    while (found !== null) {
        // find the outcome of the compare function
        var compare = this._comparator(toFind, found._value);

        // if not 0, then they are not identical and therefore we continue searching based upon the comparator's output
        // and the AVL tree's sorted characteristics
        if (compare !== 0) {
            // first save step if necessary 
            if (saveSteps) {
                this._intermediates.push(found);
            }
            
            // decide which way to go on the tree
            if (compare < 0) {
                found = found._left;
            } else {
                found = found._right;
            }
        } else {
            // if identical then we break the while loop because we've found what we wanted
            break;
        }
    }
    return found;
};

// find the node with minimum value, with optional choice to search only the subtree starting at a given node
AVLTree.prototype._min = function (start, saveSteps) {
    var current = start || this._root;
    saveSteps = saveSteps || false;

    // to find min we just have to find the leftmost node (not necessarily in the lowest layer)
    if (current) {
        while (current._left) {
            if (saveSteps) {
                this._intermediates.push(start)
            }
            current = current._left;
        }
    }
    return current;
};

// find the node with maximum value, with optional choice to search only the subtree starting at a given node
AVLTree.prototype._max = function (start, saveSteps) {
    var current = start || this._root;
    saveSteps = saveSteps || false;

    // to find max we just have to find the rightmost node (not necessarily in the lowest layer)
    if (current) {
        while (current._right) {
            if (saveSteps) {
                this._intermediates.push(start)
            }
            current = current._right;
        }
    }
    return current;
};

// find the subsequent node of the specified node as determined by key value order
AVLTree.prototype._next = function (current) {
    // if a node is specified, we find the subsequent node
    if (current) {
        // if there is a right child, we find the minimum node of the subtree beginning at the specified node
        if (current._right) {
            this._intermediates.push(current);
            current = this._min(current._right, true);
        } else {
            // if there is no right child we have to backtrack up the tree
            var intermediates = this._intermediates;
            var previous = intermediates.pop();

            // backtrack until we have left the immediate subtree containing the specified node
            while (previous && previous._right === current) {
                current = previous;
                previous = intermediates.pop();
            }
            
            // and then store that parent node as the next
            current = previous;
        }
    } else {
        // if node is unspecified we return the minimum node of the AVL tree.
        this._intermediates = [];
        current = this._min(this._root, true);
    }

    return current;
};

// find the previous node of the specified node as determined by key value order
AVLTree.prototype._previous = function (current) {
    // if a node is specified, we find the subsequent node
    if (current) {
        // if there is a left child, we find the minimum node of the subtree beginning at the specified node
        if (current._left) {
            this._saved.push(current);
            current = this._max(current._left, true);
        } else {
            // if there is no left child we have to backtrack up the tree
            var intermediates = this._intermediates;
            var previous = intermediates.pop();

            // backtrack until we have left the immediate subtree containing the specified node
            while (previous && previous._left === current) {
                current = previous;
                previous = intermediates.pop();
            }

            // and then store that parent node as the next
            current = previous;
        }
    } else {
        // if node is unspecified we return the maximum node of the AVL tree.
        this._intermediates = [];
        current = this._max(this._root, true);
    }

    return current;
};