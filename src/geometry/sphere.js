/**
 * Sphere primitive
 */
class Sphere extends Geometry {

    static build_size = 11;

    radius;     // number

    /**
     * Constructor for Sphere
     * @param {number[]} position - An array of 3 numbers representing the position of the sphere
     * @param {number} radius - A number representing the radius of the sphere
     * @param {number[]} brdf - An array of 4 numbers representing the BRDF of the sphere
     * @param {number[]} Le - An array of 3 numbers representing the emitted light of the sphere
     */
    constructor(position=new Float32Array([0., 0., 0.]), radius=1., brdf=new Float32Array([.7, 0., 0., 0.]), Le=new Float32Array([0., 0., 0.])) {
        super(position, brdf, Le);
        this.radius = radius;
    }

    build() {
        const output = new Float32Array(Sphere.build_size);
        output.set(this.position, 0);
        output.set(this.brdf, 3);
        output.set(this.Le, 7);
        output[10] = this.radius;
        return output;
    }
    
}

function intersect_sphere(eye_origin, eye_direction, sphere_position, sphere_radius) {

    const epsilon = 0.000001;

    const l = vec3_sub(eye_origin, sphere_position);
    const a = vec3_dot(eye_direction, eye_direction);
    const b = 2 * vec3_dot(eye_direction, l);
    const c = vec3_dot(l, l) - sphere_radius**2;
    const discriminant = b**2 - 4 * a * c;

    if (discriminant < 0) {
        return -1;
    } else {
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t = Math.min(t1, t2);
        const t_max = Math.max(t1, t2);
        return t > epsilon ? t : ((t_max > epsilon) ? t_max : -1);
    }

}
