import Scene from './nodes-core/scene.js';
import FPSCamera from './nodes-custom/fps_camera.js';
import Model3D from "./nodes-core/model3d.js";
import PointLight from "./nodes-core/point_light.js";

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
            .setPerspective(80, 0.1, 1000)
            .setMoveSpeed(5.0) // 5 units per second
            .setLookSpeed(0.002);
        this.addChild(this.camera);
        this.activeCamera = this.camera;

        // Create and set up rockspire model
        rockspire = new Model3D(gl);
        await rockspire.loadModel('./assets/models/rockspire/rockspire.obj');
        rockspire.setPosition(0, 0, 0);
        rockspire.setScale(0.5, 0.5, 0.5);
        this.addChild(rockspire);
        await rockspire.setShaderFromFile('./shaders/phong.glsl');

        // Create and set up test cube model
        const testCube = new Model3D(gl);
        await testCube.loadModel('./assets/models/test_cube/cube.obj');
        rockspire.addChild(testCube);
        testCube.setPosition(0, 5, -8);
        await testCube.setShaderFromFile('./shaders/red.glsl');

        // Initialize models
        await rockspire.init(gl);
        await testCube.init(gl);

        const pointLight = new PointLight(gl)
        pointLight.setPosition(0, 0 ,0)
        pointLight.setColor(5, 1, 1)
        pointLight.setIntensity(1)
        pointLight.setRange(5)
        this.camera.addChild(pointLight)

        // Initialize the scene
        super.init(gl);
    }

    update(deltaTime) {
        super.update(deltaTime);
        rockspire.rotateY(0.01);
        rockspire.move(Math.cos(performance.now() / 1000) * 0.01, Math.sin(performance.now() / 1000) * 0.01, 0);
    }
}

export default TestScene;