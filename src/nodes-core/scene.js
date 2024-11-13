import Node from './node.js';
import Camera3D from './camera3d.js';
import Node3D from "./node3d.js";
import physicsManager from "../physics_manager.js";

class Scene extends Node3D {
    constructor() {
        super();
        this.name = "Scene";

        // Core scene properties
        this._clearColor = [0.0, 0.0, 0.0, 1.0];
        this._activeCamera = null;

        // Scene state
        this._renderingEnabled = true;
        this._debugMode = false;
        this._isRoot = true;
    }


    get clearColor() {
        return [...this._clearColor];
    }

    get activeCamera() {
        return this._activeCamera;
    }

    // Scene initialization
    async init() {
        if (!gl) {
            throw new Error("Scene requires a valid WebGL context for initialization");
        }

        this.setupGLState();

        // Find first camera if none is active
        if (!this._activeCamera) {
            const camera = this.findByType(Camera3D)[0];
            if (camera) {
                this.setActiveCamera(camera);
            }
        }

        // Initialize all nodes in the scene
        await super.init();
    }

    setupGLState() {
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
        super.update(deltaTime);
    }

    render() {
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
        super.render();
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
        gl.clearColor(r, g, b, a);
        return this;
    }

    // Scene state management
    enableRendering(enabled = true) {
        this._renderingEnabled = enabled;
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
        this._activeCamera = null;
        super.onDestroy();
    }
}

export default Scene;