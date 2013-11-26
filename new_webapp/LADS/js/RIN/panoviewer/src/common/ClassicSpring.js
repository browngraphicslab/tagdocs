/**
* Provides an exponential spring for animations
* @constructor
* @param {number} springConstant
* @param {number} damperConstant
* @param {boolean} allowOvershoot
*/
function ClassicSpring(springConstant, damperConstant, allowOvershoot) {

    /**
    * @private
    * @type {number}
    */
    this._springConstant = springConstant;

    /**
    * @private
    * @type {number}
    */
    this._damperConstant = damperConstant;

    /**
    * @private
    * @type {boolean}
    */
    this._allowOvershoot = allowOvershoot;

    /**
    * @private
    * @type {number}
    */
    this._current = 0;

    /**
    * @private
    * @type {number}
    */
    this._target = 0;

    /**
    * @private
    * @type {number}
    */
    this._velocity = 0;

    /**
    * @private
    * @type {number}
    */
    this._t = -1;

    /**
    * @private
    * @type {boolean}
    */
    this._isSettled = false;
}

ClassicSpring.prototype = {

    /**
    * When called updates the springs current value based on the current app time
    * @param {number} elapsedMilliseconds
    * @return {boolean} If the spring has settled true is returned, false otherwise
    */
    step: function (elapsedMilliseconds) {

        if (this._isSettled) {
            return true;
        }

        var delta = 0.0,
            curTargDiff,
            isSettled,
            dt,
            maxDelta,
            epsilon;

        if (this._t >= 0) {
            dt = elapsedMilliseconds - this._t;
            if (dt > 0) {
                curTargDiff = this._current - this._target;
                this._velocity += -this._springConstant * curTargDiff - this._damperConstant * this._velocity;
                delta = this._velocity * dt;

                if (!this._allowOvershoot) {
                    maxDelta = -curTargDiff;
                    if ((delta > 0.0 && maxDelta > 0.0 && maxDelta < delta) ||
                       (delta < 0.0 && maxDelta < 0.0 && maxDelta > delta)) {
                        delta = maxDelta;
                        this._velocity = 0.0;
                    }
                }

                this._current += delta;
            }
        }

        curTargDiff = this._current - this._target;
        epsilon = 0.0000001;
        if ((curTargDiff < epsilon && curTargDiff > -epsilon) && (delta < epsilon && delta > -epsilon)) {
            isSettled = true;
            this.setCurrentToTarget();
        }
        else {
            isSettled = false;
            this._t = elapsedMilliseconds;
        }

        this._isSettled = isSettled;
        return isSettled;
    },

    /**
    * Returns true if the spring has completely settled
    * @return {boolean}
    */
    isSettled: function () {
        return this._isSettled;
    },

    /**
    * Set a new target value
    * @param {number} target The new target
    */
    setTarget: function (target) {
        if (this.target == target) {
            return;
        }

        this._target = target;
        this._isSettled = false;
    },

    /**
    * Sets a new current value
    * @param {number} current
    */
    setCurrent: function (current) {
        this._current = current;
        this._isSettled = false;
    },

    /**
    * Sets the current value and also sets the target to the new current value
    * @param {number} target
    */
    setCurrentAndTarget: function (target) {
        this._target = target;
        this.setCurrentToTarget();
    },

    /**
    * Sets the current value to the target value immediately
    */
    setCurrentToTarget: function () {
        this._current = this._target;
        this._velocity = 0.0;
        this._isSettled = true;
        this._t = -1;
    },

    /**
    * Returns the current target value
    * @return {number} the current target value
    */
    getTarget: function () {
        return this._target;
    },

    /**
    * Returns the current value
    * @return {number} The current value
    */
    getCurrent: function () {
        return this._current;
    }
};