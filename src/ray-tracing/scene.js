class Scene {

    screen_width;
    screen_height;
    camera;
    kernel;

    objects;    // Array of not high-level objects

    built_objects;
    sphere_count = 0;
    plane_count = 0;

    constructor({
        gpu=new GPUX(),
        screen_width=800,
        screen_height=600,
        camera=new Camera(),
        objects=[new Sphere()],
        anti_aliasing=4,
        max_bounces=3,
        russian_roulette=.2,
    }) {

        // Set instance variables
        this.screen_width = screen_width;
        this.screen_height = screen_height;
        this.camera = camera;
        this.objects = objects;

        // Build scene objects
        this.build_objects();

        // Build kernel
        this.kernel = gpu.createKernel(
            function(
                camera_pos,
                x_ndc,
                y_ndc,
                z_ndc,
                objects,
                sphere_count,
                plane_count,
            ) {

            // Define constants
            const epsilon = 1e-6;

            // Get constants
            const x_step = this.constants.x_step;
            const y_step = this.constants.y_step;
            const sphere_size = this.constants.sphere_size;
            const plane_size = this.constants.plane_size;
            const anti_aliasing = this.constants.anti_aliasing;
            const max_bounces = this.constants.max_bounces;
            const russian_roulette = this.constants.russian_roulette;

            // Get thread index
            const i = this.thread.x;
            const j = this.thread.y;

            // TRACE RAY //

            let pixel_color = [0., 0., 0.];

            // Anti-aliasing
            for (let aa = 0; aa < anti_aliasing; aa++) {

                // EYE RAY //

                // Get eye ray origin
                let eye_origin = [camera_pos[0], camera_pos[1], camera_pos[2]];

                // Anti-aliasing: jittered sampling
                const x_jitter = Math.random() * x_step;
                const y_jitter = Math.random() * y_step;

                // Get pixel position in NDC
                const x_offset = -1. + i * x_step + x_jitter;
                const y_offset = -1. + j * y_step + y_jitter;

                // Calculate eye ray direction
                let eye_dir = vec3_norm([
                    z_ndc[0] + x_offset * x_ndc[0] + y_offset * y_ndc[0],
                    z_ndc[1] + x_offset * x_ndc[1] + y_offset * y_ndc[1],
                    z_ndc[2] + x_offset * x_ndc[2] + y_offset * y_ndc[2]
                ]);

                let Le = [0., 0., 0.];
                let throughput = [1., 1., 1.];

                // Bounce
                for (let bounce = 0; bounce < max_bounces + 1; bounce++) {  // +1 because one bounce should run the loop twice

                    let closest_t = -1;
                    let closest_normal = [0., 0., 0.];
                    let closest_brdf = [0., 0., 0., 0.];
                    
                    // Intersect objects
                    let object_offset = 0;

                    // Spheres
                    for (let k = 0; k < sphere_count; k++) {

                        // Get sphere offset
                        const offset = k * sphere_size;

                        // Get sphere position
                        const sphere_position = [objects[offset], objects[offset+1], objects[offset+2]];

                        // Get sphere radius
                        const sphere_radius = objects[offset+10];

                        // Get intersection
                        const t_new = intersect_sphere(eye_origin, eye_dir, sphere_position, sphere_radius);

                        // Update intersection if closer
                        if (t_new > 0 && (closest_t < 0 || t_new < closest_t)) {
                            closest_t = t_new;
                            closest_normal = vec3_norm(vec3_sub(vec3_add(eye_origin, vec3_mul_k(eye_dir, closest_t)), sphere_position));
                            closest_brdf = [objects[offset+3], objects[offset+4], objects[offset+5], objects[offset+6]];
                            Le = [objects[offset+7], objects[offset+8], objects[offset+9]];
                        }

                    }

                    object_offset += sphere_count * sphere_size;

                    // Planes
                    for (let l = 0; l < plane_count; l++) {
                            
                        // Get plane offset
                        const offset = object_offset + l * plane_size;

                        // Get plane position
                        const plane_position = [objects[offset], objects[offset+1], objects[offset+2]];

                        // Get plane normal
                        const plane_normal = [objects[offset+10], objects[offset+11], objects[offset+12]];

                        // Get intersection
                        const t_new = plane_intersect(eye_origin, eye_dir, plane_position, plane_normal);

                        // Update intersection if closer
                        if (t_new > 0 && (closest_t < 0 || t_new < closest_t)) {
                            closest_t = t_new;
                            closest_normal = plane_normal;
                            closest_brdf = [objects[offset+3], objects[offset+4], objects[offset+5], objects[offset+6]];
                            Le = [objects[offset+7], objects[offset+8], objects[offset+9]];
                        }
                    }

                    // Kill if ray got lost
                    if (closest_t < 0) {
                        throughput = [0., 0., 0.];
                        break;
                    }

                    // Debug: draw normals
                    // this.color(
                    //     Math.abs(closest_normal[0]),
                    //     Math.abs(closest_normal[1]),
                    //     Math.abs(closest_normal[2])
                    // )

                    // Stop if ray hit a light
                    if (Le[0] > 0. || Le[1] > 0. || Le[2] > 0.) {
                        break;
                    }

                    // Russian roulette
                    if (Math.random() < russian_roulette) {
                        throughput = [0., 0., 0.];
                        break;
                    }

                    // Bounce ray
                    //update eye_origin
                    eye_origin = vec3_add(eye_origin, vec3_mul_k(eye_dir, closest_t));
                    eye_origin = vec3_add(eye_origin, vec3_mul_k(closest_normal, epsilon)); // Offset to avoid self-intersection

                    //update eye_dir
                    //omega_o - opposite of eye_dir
                    const omega_o = vec3_mul_k(eye_dir, -1);

                    //omega_r - reflection of omega_o
                    const omega_r = vec3_sub(vec3_mul_k(closest_normal, 2 * vec3_dot(omega_o, closest_normal)), omega_o);

                    //new dir
                    const Xi_1 = Math.random();
                    const Xi_2 = Math.random();

                    const omega_z = Xi_1 ** (1 / closest_brdf[3] + 1);
                    const r = Math.sqrt(1 - omega_z ** 2);
                    const phi = 2 * Math.PI * Xi_2;
                    const omega_x = r * Math.cos(phi);
                    const omega_y = r * Math.sin(phi);

                    // Debug: draw untransformed next sample direction
                    // this.color(
                    //     Math.abs(omega_x),
                    //     Math.abs(omega_y),
                    //     Math.abs(omega_z)
                    // );

                    const transform_z = (closest_brdf[3] === 1.) ? closest_normal : omega_r;
                    const random_vector = [Math.random(), Math.random(), Math.random()];
                    const transform_x = vec3_norm(vec3_cross(transform_z, random_vector));
                    const transform_y = vec3_norm(vec3_cross(transform_z, transform_x));

                    // Debug: draw transform
                    // this.color(
                    //     Math.abs(transform_z[0]),
                    //     Math.abs(transform_z[1]),
                    //     Math.abs(transform_z[2])
                    // );

                    eye_dir = vec3_norm([
                        omega_x * transform_x[0] + omega_y * transform_y[0] + omega_z * transform_z[0],
                        omega_x * transform_x[1] + omega_y * transform_y[1] + omega_z * transform_z[1],
                        omega_x * transform_x[2] + omega_y * transform_y[2] + omega_z * transform_z[2]
                    ]);

                    // Debug: draw eye_dir
                    // this.color(
                    //     Math.abs(eye_dir[0]),
                    //     Math.abs(eye_dir[1]),
                    //     Math.abs(eye_dir[2])
                    // );

                    // Update throughput
                    //brdf
                    let brdf = [closest_brdf[0], closest_brdf[1], closest_brdf[2]];
                    const alpha = closest_brdf[3];
                    if (alpha === 1.) {
                        brdf = vec3_div_k(brdf, Math.PI);
                    } else {
                        brdf = vec3_mul_k(vec3_mul_k(brdf, (alpha + 1) / (2 * Math.PI)), Math.max(Math.pow(vec3_dot(omega_r, eye_dir), alpha), 0.));
                    }

                    // Debug: draw closest_normal
                    // this.color(
                    //     Math.abs(closest_normal[0]),
                    //     Math.abs(closest_normal[1]),
                    //     Math.abs(closest_normal[2])
                    // );

                    // Debug: draw brdf
                    // this.color(
                    //     Math.abs(brdf[0]),
                    //     Math.abs(brdf[1]),
                    //     Math.abs(brdf[2])
                    // );

                    //cosine
                    const cosine = Math.max(vec3_dot(eye_dir, closest_normal), 0.);

                    // Debug: draw cosine
                    // this.color(
                    //     Math.abs(cosine),
                    //     Math.abs(cosine),
                    //     Math.abs(cosine)
                    // );

                    //pdf
                    let pdf = 1.;
                    if (alpha === 1) {
                        pdf = 1 / Math.PI * Math.max(vec3_dot(closest_normal, eye_dir), 0);
                    } else {
                        pdf = (alpha + 1) / (2 * Math.PI) * Math.max(Math.pow(vec3_dot(omega_r, eye_dir), alpha), 0.);
                    }

                    // Debug: draw pdf
                    // this.color(
                    //     Math.abs(pdf),
                    //     Math.abs(pdf),
                    //     Math.abs(pdf)
                    // );

                    //update throughput
                    throughput = vec3_mul(throughput, vec3_mul_k(brdf, cosine / pdf));

                    // Debug: draw throughput
                    // this.color(
                    //     Math.abs(throughput[0]),
                    //     Math.abs(throughput[1]),
                    //     Math.abs(throughput[2])
                    // );

                }

                // Debug: draw Le
                // this.color(
                //     Math.abs(Le[0]),
                //     Math.abs(Le[1]),
                //     Math.abs(Le[2])
                // );

                // Debug: draw throughput // Bug: throughput gets reset to [1, 1, 1] after each anti-aliasing iteration
                // this.color(
                //     Math.abs(throughput[0]),
                //     Math.abs(throughput[1]),
                //     Math.abs(throughput[2])
                // );

                // Update pixel color
                const new_color = vec3_mul(Le, throughput);

                // Debug: draw new_color
                // this.color(
                //     Math.abs(new_color[0]),
                //     Math.abs(new_color[1]),
                //     Math.abs(new_color[2])
                // );

                pixel_color = vec3_add(vec3_mul_k(pixel_color, (aa / (aa + 1))), vec3_mul_k(new_color, (1 / (aa + 1))));    // Running average

            }

            // Draw pixels //

            this.color(
                pixel_color[0],
                pixel_color[1],
                pixel_color[2]
            );

        }, {
            output: [screen_width, screen_height],
            graphical: true,
            constants: {
                x_step: 2. / screen_width,
                y_step: 2. / screen_height,
                sphere_size: Sphere.build_size,
                plane_size: Plane.build_size,
                anti_aliasing: anti_aliasing,
                max_bounces: max_bounces,
                russian_roulette: russian_roulette,
            }
        });

    }

    build_objects() {

        this.built_objects = [];
            
        for (let i = 0; i < this.objects.length; i++) {
            const object = this.objects[i];
            if (object instanceof Sphere) {
                this.sphere_count++;
            }
            else if (object instanceof Plane) {
                this.plane_count++;
            } else {
                throw new TypeError("build_objects tried to build not an object");
            }
            this.built_objects.push(...object.build());
        }

    }

    render() {

        // Left-handed coordinate system
        const y_scale = Math.tan(this.camera.fov * Math.PI / 360);
        const x_scale = y_scale * (this.screen_width / this.screen_height);

        const z_ndc = [...this.camera.direction];
        const x_ndc = vec3_mul_k(vec3_norm(vec3_cross(this.camera.up, z_ndc)), x_scale);
        const y_ndc = vec3_mul_k(vec3_norm(vec3_cross(z_ndc, x_ndc)), y_scale);

        this.kernel(
            this.camera.position,
            x_ndc,
            y_ndc,
            z_ndc,
            this.built_objects,
            this.sphere_count,
            this.plane_count,
        );

    }

}
