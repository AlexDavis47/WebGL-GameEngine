import Scene from './scene.js';
import FPSCamera from './fps_camera.js';
import Model3D from "./model3d.js";

class TestScene extends Scene {
    constructor() {
        super();
        this.name = "TestScene";
        this.camera = null;
    }

    async init(gl) {
        // Create and set up camera
        this.camera = new FPSCamera()
            .setPosition(0, 2, 5)
            .setPerspective(60, 0.1, 1000)
            .setMoveSpeed(5.0)
            .setLookSpeed(0.002);

        this.addChild(this.camera);
        this.activeCamera = this.camera;

        // Create our test cube
        const cube = new Model3D(gl);
        await cube.loadModel('./assets/models/rockspire/rockspire.obj');
        cube.setPosition(0, 0, 0)
            .setScale(0.5, 0.5, 0.5);
        this.addChild(cube);

        // Set up basic scene lighting
        this.setAmbientLight(0.2, 0.2, 0.2);

        await cube.init(gl);  // Wait for cube to load
        super.init(gl);
    }

    update(deltaTime) {
        super.update(deltaTime);
    }
}

export default TestScene;