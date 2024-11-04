import Scene from './scene.js';
import FPSCamera from './fps_camera.js';
import Model3D from "./model3d.js";

let rockspire;

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

        // Create our test rockspire
        rockspire = new Model3D(gl);
        await rockspire.loadModel('./assets/models/rockspire/rockspire.obj');
        rockspire.setPosition(0, 0, 0)
            .setScale(0.5, 0.5, 0.5);
        this.addChild(rockspire);

        // Create a test cube
        const testCube = new Model3D(gl);
        await testCube.loadModel('./assets/models/test_cube/cube.obj');
        rockspire.addChild(testCube);
        testCube.setPosition(0, 5, -8);


        // Set up basic scene lighting
        this.setAmbientLight(0.2, 0.2, 0.2);

        await rockspire.init(gl);  // Wait for cube to load
        super.init(gl);
    }

    update(deltaTime) {
        super.update(deltaTime);
        rockspire.rotateY(0.01);
        rockspire.move(Math.cos(performance.now() / 1000) * 0.01, Math.sin(performance.now() / 1000) * 0.01, 0);
    }
}

export default TestScene;