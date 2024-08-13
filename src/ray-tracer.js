class RayTracer {

    // Static parameters
    static MAX_FPS = 999;
    static MAX_ANTI_ALIASING = 1280;
    static MAX_MAX_BOUNCES = 16;

    // HTML elements
    canvas;                 // canvas element to render to
    fps_module;             // module to display frame rate
    fps_counter;            // element to display frame rate

    // User settings
    show_fps;               // whether to display the frame rate
    pause;                  // whether to pause rendering
    camera_speed;           // speed of camera movement

    // Rendering settings
    custom_width;           // custom width of the canvas (0 for auto)
    custom_height;          // custom height of the canvas (0 for auto)
    fps_limit;              // target frame rate
    anti_aliasing;          // number of samples per pixel
    max_bounces;            // maximum number of bounces
    russian_roulette;       // probability of terminating a ray

    // Content
    scenes = [];            // list of scenes
    current_scene = -1;     // index of current scene

    // Private parameters
    _gpu;                   // GPU instance
    _movement = [0, 0, 0];  // camera movement

    constructor({
        canvas_id=null,
        fps_module_id=null,
        fps_counter_id=null,
        show_fps=false,
        pause=true,
        camera_speed=0.1,
        custom_screen_size=[0, 0],
        fps_limit=60,
        anti_aliasing=4,
        max_bounces=3,
        russian_roulette=0.1,
    }) {
            
        // Set HTML elements
        if (canvas_id === null) {
            throw new Error("canvas_id must be provided");
        }
        this.canvas = document.getElementById(canvas_id);
        if (this.canvas === null) {
            throw new Error("Canvas element not found");
        }

        if (fps_module_id === null) {
            throw new Error("fps_module_id must be provided");
        }
        this.fps_module = document.getElementById(fps_module_id);
        if (this.fps_module === null) {
            throw new Error("FPS module element not found");
        }

        if (fps_counter_id === null) {
            throw new Error("fps_counter_id must be provided");
        }
        this.fps_counter = document.getElementById(fps_counter_id);
        if (this.fps_counter === null) {
            throw new Error("FPS counter element not found");
        }

        // Set user settings
        this.show_fps = show_fps;
        this.pause = pause;

        if (!camera_speed instanceof Number || camera_speed <= 0) {
            throw new Error("camera_speed must be positive float");
        }
        this.camera_speed = camera_speed;

        // Set rendering settings
        if (!custom_screen_size instanceof Array || custom_screen_size.length !== 2 || custom_screen_size.some(isNaN) || custom_screen_size.some((value) => value < 0)) {
            throw new Error("custom_screen_size must be an array of 2 non-negative integers");
        }
        this.custom_width = custom_screen_size[0];
        this.custom_height = custom_screen_size[1];

        if (!fps_limit instanceof Number || fps_limit <= 0) {
            throw new Error("fps_limit must be positive integer");
        }
        if (fps_limit > RayTracer.MAX_FPS) {
            throw new Error(`fps_limit must be less than or equal to ${RayTracer.MAX_FPS}`);
        }
        this.fps_limit = Math.floor(fps_limit);

        if (!anti_aliasing instanceof Number || anti_aliasing <= 0) {
            throw new Error("anti_aliasing must be positive integer");
        }
        if (anti_aliasing > RayTracer.MAX_ANTI_ALIASING) {
            throw new Error(`anti_aliasing must be less than or equal to ${RayTracer.MAX_ANTI_ALIASING}`);
        }
        this.anti_aliasing = anti_aliasing;

        if (!max_bounces instanceof Number || max_bounces < 0) {
            throw new Error("max_bounces must be positive integer");
        }
        if (max_bounces > RayTracer.MAX_MAX_BOUNCES) {
            throw new Error(`max_bounces must be less than or equal to ${RayTracer.MAX_MAX_BOUNCES}`);
        }
        this.max_bounces = max_bounces;

        if (!russian_roulette instanceof Number || russian_roulette <= 0 || russian_roulette >= 1) {
            throw new Error("russian_roulette must be a float in (0, 1)");
        }
        this.russian_roulette = russian_roulette;

        // Initialize GPU
        this._gpu = new GPUX({ mode: 'gpu', canvas: this.canvas });
        kernelFunctions.forEach((f) => this._gpu.addFunction(f));

        // Set up event listeners
        document.addEventListener('keydown', (event) => {
            if (event.key === 'p' || event.key === 'P') {
                if (this.pause) {
                    console.log("starting");
                    this.start();
                } else {
                    console.log("stopping");
                    this.stop();
                }
            }
            if (event.key === 'w' || event.key === 'W') {
                this._movement[2] = 1;
            }
            if (event.key === 's' || event.key === 'S') {
                this._movement[2] = -1;
            }
            if (event.key === 'a' || event.key === 'A') {
                this._movement[0] = -1;
            }
            if (event.key === 'd' || event.key === 'D') {
                this._movement[0] = 1;
            }
            if (event.key === ' ') {
                this._movement[1] = 1;
            }
            if (event.key === 'Shift') {
                this._movement[1] = -1;
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'w' || event.key === 'W') {
                this._movement[2] = 0;
            }
            if (event.key === 's' || event.key === 'S') {
                this._movement[2] = 0;
            }
            if (event.key === 'a' || event.key === 'A') {
                this._movement[0] = 0;
            }
            if (event.key === 'd' || event.key === 'D') {
                this._movement[0] = 0;
            }
            if (event.key === ' ') {
                this._movement[1] = 0;
            }
            if (event.key === 'Shift') {
                this._movement[1] = 0;
            }
        });

    }

    add_scene(camera=new Camera(), objects=[new Sphere()]) {

        // Check if camera is an instance of Camera
        if (!camera instanceof Camera) {
            throw new TypeError("camera must be an instance of Camera");
        }

        // Check if objects is a non-empty array of Geometry
        if (!objects instanceof Array || objects.length === 0 || objects.some((object) => !object instanceof Geometry)) {
            throw new TypeError("objects must be a non-empty array of Geometry");
        }

        // Get screen size
        const width = this.custom_width === 0 ? window.innerWidth : this.custom_width;
        const height = this.custom_height === 0 ? window.innerHeight : this.custom_height;

        // Add scene
        this.scenes.push(new Scene({
            gpu: this._gpu,
            screen_width: width,
            screen_height: height,
            camera: camera,
            objects: objects,
            anti_aliasing: this.anti_aliasing,
            max_bounces: this.max_bounces,
            russian_roulette: this.russian_roulette,
        }));

    }

    switch_scene(index) {

    }

    /**
     * Start rendering the selected scene
     * 
     * Renders the first scene if none selected
     * @throws {Error} If there are no scenes to render
     */
    start() {
        if (this.scenes.length === 0) {
            throw new Error("No scenes to render");
        }
        if (this.current_scene === -1 || this.current_scene >= this.scenes.length) {
            this.current_scene = 0;
        }
        this.pause = false;
        this._render();
    }

    /**
     * Stop rendering the selected scene
     */
    stop() {
        this.pause = true;
    }

    /**
     * Render the selected scene
     */
    async _render() {

        const start = performance.now();

        // Handle camera movement
        const move_forward = this.scenes[this.current_scene].camera.direction.map((value) => value * this._movement[2] * this.camera_speed);
        const move_up = this.scenes[this.current_scene].camera.up.map((value) => value * this._movement[1] * this.camera_speed);
        const right = vec3_cross(this.scenes[this.current_scene].camera.up, this.scenes[this.current_scene].camera.direction);
        const move_right = right.map((value) => value * this._movement[0] * this.camera_speed);
        const move = vec3_add(vec3_add(move_forward, move_up), move_right);
        this.scenes[this.current_scene].camera.move(...move);

        // Render scene
        this.scenes[this.current_scene].render();
        // this.pause = true;

        const elapsed = performance.now() - start;
        
        if (elapsed < 1000 / this.fps_limit) {
            await sleep(1000 / this.fps_limit - elapsed);
        }

        if (this.show_fps) {
            this.fps_counter.innerHTML = Math.round(1000 / (performance.now() - start));
        }
        if (!this.pause) {
            requestAnimationFrame(() => {this._render()});
        }

    }

}
