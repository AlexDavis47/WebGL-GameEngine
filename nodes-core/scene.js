import Node from './node.js';
import Camera3D from './camera3d.js';
import Node3D from "./node3d.js";

class Scene extends Node3D {
    constructor() {
        super();
        this.name = "Scene";

        // Core scene properties
        this._ambientLight = [0.1, 0.1, 0.1];
        this._clearColor = [0.0, 0.0, 0.0, 1.0];
        this._activeCamera = null;
        this._gl = null;

        // Scene state
        this._renderingEnabled = true;
        this._physicsEnabled = true;
        this._debugMode = false;
        this._isRoot = true;

        // Physics
        this._physicsWorld = null;
        this._gravity = new Ammo.btVector3(0, -9.81, 0);
        this._physicsConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this._physicsDispatcher = new Ammo.btCollisionDispatcher(this._physicsConfiguration);
        this._physicsBroadphase = new Ammo.btDbvtBroadphase();
        this._physicsSolver = new Ammo.btSequentialImpulseConstraintSolver();
    }


    // Property accessors
    get ambientLight() {
        return [...this._ambientLight];
    }

    get clearColor() {
        return [...this._clearColor];
    }

    get activeCamera() {
        return this._activeCamera;
    }

    // Scene initialization
    init(gl) {
        if (!gl) {
            throw new Error("Scene requires a valid WebGL context for initialization");
        }

        this._gl = gl;
        this.setupGLState();
        this.setupPhysics();

        // Find first camera if none is active
        if (!this._activeCamera) {
            const camera = this.findByType(Camera3D)[0];
            if (camera) {
                this.setActiveCamera(camera);
            }
        }

        // Initialize all nodes in the scene
        super.init(gl);
    }

    setupPhysics() {
        if (typeof Ammo === 'undefined') {
            console.error('Ammo not initialized');
            return;
        }

        console.log("Setting up physics...");
        this._physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            this._physicsDispatcher,
            this._physicsBroadphase,
            this._physicsSolver,
            this._physicsConfiguration
        );
        console.log("Physics world created:", this._physicsWorld);
        this._physicsWorld.setGravity(this._gravity);
        console.log("Gravity set");
    }


    setupGLState() {
        const gl = this._gl;

        // Set initial GL state
        gl.clearColor(...this._clearColor);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        // Enable alpha blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    update(deltaTime) {
        if (!this._physicsEnabled) return;

        if (this._physicsWorld) {
            const fixedTimeStep = 1.0 / 60.0;
            const maxSubSteps = 3;
            this._physicsWorld.stepSimulation(fixedTimeStep, maxSubSteps);
        }

        super.update(deltaTime);
    }

    render(gl) {
        if (!this._renderingEnabled) return;

        // Clear buffers
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Ensure we have a camera
        if (!this._activeCamera) {
            console.warn('Scene has no active camera');
            return;
        }

        // Update view if camera changed
        this._activeCamera.updateViewMatrix();

        // Render all nodes in the scene
        super.render(gl);
    }

    // Scene management
    setActiveCamera(camera) {
        if (!(camera instanceof Camera3D)) {
            throw new Error('Active camera must be an instance of Camera3D');
        }

        this._activeCamera = camera;

        // Ensure camera is in the scene
        if (!this.contains(camera)) {
            this.addChild(camera);
        }

        return this;
    }

    setClearColor(r, g, b, a = 1.0) {
        this._clearColor = [r, g, b, a];
        if (this._gl) {
            this._gl.clearColor(r, g, b, a);
        }
        return this;
    }

    setAmbientLight(r, g, b) {
        this._ambientLight = [r, g, b];
        return this;
    }

    // Scene state management
    enableRendering(enabled = true) {
        this._renderingEnabled = enabled;
        return this;
    }

    enablePhysics(enabled = true) {
        this._physicsEnabled = enabled;
        return this;
    }

    enableDebug(enabled = true) {
        this._debugMode = enabled;
        return this;
    }

    // Node containment check
    contains(node) {
        let found = false;
        this.traverse(n => {
            if (n === node) found = true;
        });
        return found;
    }

    // Resource cleanup
    onDestroy() {
        // Clean up GL resources if needed
        this._gl = null;
        this._activeCamera = null;

        Ammo.destroy(this._physicsWorld);
        Ammo.destroy(this._gravity);
        Ammo.destroy(this._physicsConfiguration);
        Ammo.destroy(this._physicsDispatcher);
        Ammo.destroy(this._physicsBroadphase);
        Ammo.destroy(this._physicsSolver);


        super.onDestroy();
    }
}

export default Scene;