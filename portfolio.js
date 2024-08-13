const ray_tracer = new RayTracer({
    canvas_id: "screen",
    fps_module_id: "fps_module",
    fps_counter_id: "fps_counter",
    // custom_screen_size: [800, 600],
    show_fps: true,
    anti_aliasing: 4,
    max_bounces: 2,
    camera_speed: 0.2,
});
/*
ray_tracer.add_scene(
    new Camera(),
    [
        new Sphere(
            [0., 100., 0.],
            90.,
            [.7, 0., 0., 1.],
            [.7, .7, .7]
        ),
        new Sphere(
            [0., -10., 0.],
            9.5,
            [0., 0., .7, 1.],
            [0., 0., 0.]
        ),
        new Sphere(
            [-1., 1., 2.],
            1.,
            [0., .7, 0., 1.],
            [0., 0., 0.]
        )
    ]
);
*/
ray_tracer.add_scene(
    new Camera(
        // [0., 0., 0.],
        // vec3_norm([0., -.2, 1.]),
    ),
    [
        new Sphere(
            [-3., 0., 10.],
            2.,
            [0., 0., 0., 1.],
            [20., 15., 15.]
        ),
        new Sphere(
            [3., 0., 10.],
            2.,
            [1., 1., 1., 1.],
            [0., 0., 0.]
        ),
        new Sphere(
            [3., 6., 10.],
            2.,
            [0., 0., 0., 1.],
            [0., 1., .5]
        ),
        new Plane(
            [0., -2., 0.],
            [0., 1., 0.],
            [1., 1., 1., 1.],
            [0., 0., 0.]
        ),
        new Plane(
            [0., 0., 20.],
            [0., 0., -1.],
            [1., 1., 1., 1.],
            [0., 0., 0.]
        ),
        new Plane(
            [10., 0., 0.],
            [-1., 0., 0.],
            [1., 1., 1., 1.],
            [0., 0., 0.]
        ),
        new Plane(
            [-10., 0., 0.],
            [1., 0., 0.],
            [1., 1., 1., 1.],
            [0., 0., 0.]
        ),
    ]
);
