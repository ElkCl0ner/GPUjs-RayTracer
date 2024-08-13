class Camera {

    position;    // number[3]
    direction;   // number[3]
    up;          // number[3]
    fov;         // number (degrees)

    constructor(position=new Float32Array([0,0,0]), direction=new Float32Array([0,0,1]), up=new Float32Array([0,1,0]), fov=60) {
            
        // Check if position is an array of 3 finite numbers
        if (!position instanceof Array || position.length !== 3 || position.some(isNaN) || position.some((value) => !Number.isFinite(value))) {
            throw new TypeError("position must be an array of 3 numbers");
        }

        // Check if direction is an array of 3 finite numbers
        if (!direction instanceof Array || direction.length !== 3 || direction.some(isNaN) || direction.some((value) => !Number.isFinite(value))) {
            throw new TypeError("direction must be an array of 3 numbers");
        }

        // Check if up is an array of 3 finite numbers
        if (!up instanceof Array || up.length !== 3 || up.some(isNaN) || up.some((value) => !Number.isFinite(value))) {
            throw new TypeError("up must be an array of 3 numbers");
        }

        // Check if fov is a number in (0,180)
        if (isNaN(fov) || fov <= 0 || fov >= 180) {
            throw new TypeError("fov must be a number in (0,180)");
        }

        // Set instance variables
        this.position = position;
        this.direction = direction;
        this.up = up;
        this.fov = fov;

    }

    move (x, y, z) {
        // Check if x, y, z are finite numbers
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            throw new TypeError("x, y, z must be finite numbers");
        }

        // Move the camera
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;
    }

}
