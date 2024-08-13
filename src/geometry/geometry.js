/**
 * Superclass for all objects in the scene
 * @abstract
 */
class Geometry {

    position;   // number[3]
    brdf;       // number[4]
    Le;         // number[3]

    /**
     * Constructor for Geometry
     * @abstract
     * @param {number[]} position - An array of 3 numbers representing the position of the object
     * @param {number[]} brdf - An array of 4 numbers representing the BRDF of the object
     * @param {number[]} Le - An array of 3 numbers representing the emitted light of the object
     */
    constructor(position=new Float32Array([0.,0.,0.]), brdf=new Float32Array([0.,0.,0.,0.]), Le=new Float32Array([0.,0.,0.])) {

            // Prevent direct instantiation of this class
            if (new.target === Geometry) {
                throw new TypeError("Cannot construct Geometry instances directly");
            }

            // Check if position is an array of 3 finite numbers
            if (!position instanceof Array || position.length !== 3 || position.some(isNaN) || position.some((value) => !Number.isFinite(value))) {
                throw new TypeError("position must be an array of 3 numbers");
            }

            // Check if brdf is an array of 4 numbers in [0,1]
            if (!brdf instanceof Array || brdf.length !== 4 || brdf.some(isNaN) || brdf[0] < 0 || brdf[0] > 1 || brdf[1] < 0 || brdf[1] > 1 || brdf[2] < 0 || brdf[2] > 1 || brdf[3] < 1) {
                throw new TypeError("brdf must be an array of 4 numbers");
            }

            // Check if Le is an array of 3 numbers in [0,1]
            if (!Le instanceof Array || Le.length !== 3 || Le.some(isNaN) || Le.some((value) => value < 0)) {
                throw new TypeError("Le must be an array of 3 positive numbers");
            }

            // Set instance variables
            this.position = position;
            this.brdf = brdf;
            this.Le = Le;

    }

    build() {
        throw new Error("Method 'build()' must be implemented in subclass");
    }

}
