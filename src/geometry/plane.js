class Plane extends Geometry {

    static build_size = 13;

    normal;     // number[3]

    constructor(position=new Float32Array([0., 0., 0.]), normal=new Float32Array([0., 1., 0.]), brdf=new Float32Array([.7, 0., 0., 0.]), Le=new Float32Array([0., 0., 0.])) {
        super(position, brdf, Le);
        this.normal = normal;
    }

    build() {
        const output = new Float32Array(Plane.build_size);
        output.set(this.position, 0);
        output.set(this.brdf, 3);
        output.set(this.Le, 7);
        output.set(this.normal, 10);
        return output;
    }

}

function plane_intersect(eye_origin, eye_direction, plane_position, plane_normal) {

    const epsilon = 0.000001;

    const denominator = vec3_dot(eye_direction, plane_normal);
    if (Math.abs(denominator) < epsilon) {
        return -1;
    }

    const t = vec3_dot(vec3_sub(plane_position, eye_origin), plane_normal) / denominator;
    return t > epsilon ? t : -1;

}
