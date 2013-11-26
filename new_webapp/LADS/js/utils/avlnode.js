/*
 * dz - AVL Tree Node for AVL Tree implementation
 * 
 * This AVLNode performs various things like tree rebalancing, node 
 * removal, etc. among other things. You should never have to deal 
 * with the nodes directly if you are just using the AVL tree.
 * 
 */

function AVLNode(value, comparator) {
    "use strict";
    this._comparator = comparator;
    this._left = null;
    this._right = null;
    this._value = value;
    this._height = 1;
}

// adds new node
AVLNode.prototype.add = function (toAdd) {
    var compare = this._comparator(toAdd, this._value);
    var added; // array with (potentially) new child node after balancing + newly added node
    var addedNode;

    if (compare !== 0) {
        if (compare < 0) {
            if (this._left) {
                added = this._left.add(toAdd);
                this._left = added[0];
                addedNode = added[1];
            } else {
                this._left = new AVLNode(toAdd, this._comparator);
                addedNode = this._left;
            }
        } else if (compare > 0) {
            if (this._right) {
                added = this._right.add(toAdd);
                this._right = added[0];
                addedNode = added[1];
            } else {
                this._right = new AVLNode(toAdd, this._comparator);
                addedNode = this._right;
            }
        }
        return [this.balanceTree(), addedNode];
    } else {
        return [this, this];
    }
};

// remove node from tree
AVLNode.prototype.remove = function (toRemove) {
    var compare = this._comparator(toRemove, this._value);
    var removed;
    var removedNode;
    var newTree;

    if (compare) {
        if (compare < 0) {
            if (this._left) {
                removed = this._left.remove(toRemove);
                this._left = removed[0];
                removedNode = removed[1];
            } else {
                removedNode = null;
            }
        } else {
            if (this._right) {
                removed = this._right.remove(toRemove);
                this._right = removed[0];
                removedNode = removed[1];
            } else {
                removedNode = null;
            }
        }
        newTree = this;
    } else {
        removedNode = this;
        if (this._left == null) {
            newTree = this._right;
        } else if (this._right == null) {
            newTree = this._left;
        } else {
            newTree = this._left.merge(this._right);
            this._left = null;
            this._right = null;
        }
    }

    if (removedNode) {
        if (newTree) {
            return [newTree.balanceTree(), removedNode];
        } else {
            return [newTree, removedNode];
        }
    } else {
        return [this, null];
    }
};

// balances the AVL tree so that it maintains optimal properties.
AVLNode.prototype.balanceTree = function () {
    var leftHeight = (this._left != null) ? this._left._height : 0;
    var rightHeight = (this._right != null) ? this._right._height : 0;

    if (leftHeight > rightHeight + 1) {
        return this.swingRight();
    } else if (rightHeight > leftHeight + 1) {
        return this.swingLeft();
    } else {
        this.setHeight();
        return this;
    }

    return result;
};

// merges two trees into one
AVLNode.prototype.merge = function (toMerge) {
    if (toMerge == null) {
        return this;
    } else {
        var top;
        if (this._height > toMerge._height) {
            top = this;
            top._right = toMerge.merge(top._right);
        } else {
            top = toMerge;
            top._left = this.merge(top._left);
        }
        return top.balanceTree();
    }
};

// move nodes towards the left subtree
AVLNode.prototype.moveLeft = function () {
    var right = this._right;
    var rightLeft = right._left;

    this._right = rightLeft;
    right._left = this;
    this.setHeight();
    right.setHeight();
    return right;
};

// move nodes towards the right subtree
AVLNode.prototype.moveRight = function () {
    var left = this._left;
    var leftRight = left._right;

    this._left = leftRight;
    left._right = this;
    this.setHeight();
    left.setHeight();
    return left;
};


// set height of the node to be 1 + that of its children.
AVLNode.prototype.setHeight = function () {
    var leftHeight = (this._left) ? this._left._height : 0;
    var rightHeight = (this._right) ? this._right._height : 0;

    this._height = (leftHeight < rightHeight) ? rightHeight + 1 : leftHeight + 1;
};


// swing tree to the left 
AVLNode.prototype.swingLeft = function () {
    var right = this._right;
    var rightLeft = right._left;
    var rightRight = right._right;
    var left = this._left;

    var leftHeight = (left) ? left._height : 0;
    var rightLeftHeight = (rightLeft) ? rightLeft._height : 0;
    var rightRightHeight = (rightRight) ? rightRight._height : 0;

    if (rightLeftHeight > rightRightHeight) {
        this._right = right.moveRight();
    }

    return this.moveLeft();
};


// swing tree to the right
AVLNode.prototype.swingRight = function () {
    var left = this._left;
    var leftRight = left._right;
    var leftLeft = left._left;
    var right = this._right;

    var rightHeight = (right != null) ? right._height : 0;
    var leftRightHeight = (leftRight != null) ? leftRight._height : 0;
    var leftLeftHeight = (leftLeft != null) ? leftLeft._height : 0;

    if (leftRightHeight > leftLeftHeight) {
        this._left = left.moveLeft();
    }

    return this.moveRight();
};


// traverse entire tree
AVLNode.prototype.traverse = function (func) {
    if (this._left) {
        this._left.traverse(func);
    }

    func(this);

    if (this._right) {
        this._right.traverse(func);
    }
};


// toString for debugging printlines
AVLNode.prototype.toString = function () {
    return this._value.toString();
};