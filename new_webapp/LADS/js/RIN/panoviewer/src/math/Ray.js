/**
 * A class representing a 3D ray
 * @param {Vector3} origin The origin of the ray
 * @param {Vector3} direction The direction vector of the ray.  IMPORTANT: must be a unit vector
 * @constructor
 */
function Ray(origin, direction) {

    /**
     * The origin of the ray
     * @type {Vector3}
     */
    this.origin = origin;

    /**
     * A unit vector indicating the direction of the ray
     * @type {Vector3}
     */
    this.direction = direction;
};
