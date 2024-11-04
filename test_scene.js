import Scene from './nodes-core/scene.js';
import FPSCamera from './nodes-custom/fps_camera.js';
import Model3D from "./nodes-core/model3d.js";
import PointLight from "./nodes-core/point_light.js";

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
            .setMoveSpeed(5.0)
            .setLookSpeed(0.002);
        this.addChild(this.camera);
        this.activeCamera = this.camera;

        // Create rockspire model
        const rockspire = new Model3D(gl)
            .setPosition(0, 0, 0)
            .setScale(0.5, 0.5, 0.5);
        await rockspire.loadModel('./assets/models/rockspire/rockspire.obj');
        await rockspire.setShaderFromFile('./shaders/phong.glsl');
        rockspire.setName("rockspire");
        this.addChild(rockspire);

        // Create test cube as child of rockspire
        const testCube = new Model3D(gl)
            .setPosition(0, 6, -10);
        await testCube.loadModel('./assets/models/test_cube/cube.obj');
        await testCube.setShaderFromFile('./shaders/toon.glsl');
        rockspire.addChild(testCube);  // Add to rockspire before initializing
        testCube.setName("testCube");

        // Add cubes down y-axis
        for (let i = 0; i < 3; i++) {
            const cube = new Model3D(gl)
                .setPosition(0, i * -2, 0);
            await cube.loadModel('./assets/models/test_cube/cube.obj');
            await cube.setShaderFromFile('./shaders/toon.glsl');
            testCube.addChild(cube);

        }

        // Add cubes down z-axis
        for (let i = 0; i < 6; i++) {
            const cube = new Model3D(gl)
                .setPosition(0, 0, i * 2);
            await cube.loadModel('./assets/models/test_cube/cube.obj');
            await cube.setShaderFromFile('./shaders/toon.glsl');
            testCube.addChild(cube);
            if (i === 5) { // Add a red light to the last cube
                cube.setName("lightCube");
            }
        }

        // Add point light
        const pointLight = new PointLight(gl)
            .setPosition(0, 0, 0)
            .setColor(1, 1, 1)
            .setIntensity(1)
            .setRange(15);
        this.camera.addChild(pointLight);

        // Add a red point light to the light cube
        const lightCube = testCube.findByName("lightCube");
        if (lightCube) {
            const redLight = new PointLight(gl)
                .setPosition(0, -2, 0)
                .setColor(1, 0, 0)
                .setIntensity(1)
                .setRange(15);
            lightCube.addChild(redLight);
        }


        // add gun model
        const gun = new Model3D(gl)
        gun.loadModel('./assets/models/gun/gun.obj');
        gun.setShaderFromFile('./shaders/phong.glsl');
        gun.setPosition(0.4, -0.3, -0.4);
        gun.setScale(0.1, 0.1, 0.1);
        this.camera.addChild(gun);



        // Initialize the entire scene hierarchy
        await super.init(gl);
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Find rockspire and testCube using the scene graph
        const rockspire = this.findByName("rockspire");
        if (rockspire) {
            rockspire.rotateY(-0.15 * deltaTime);
            rockspire.move(0, Math.sin(performance.now() / 1000) * deltaTime * 0.2, 0);

            // TestCube should be a child of rockspire
            const testCube = rockspire.findByName("testCube");
            if (testCube) {
                testCube.rotateY(0.15 * deltaTime);
            }
        }
    }
}

export default TestScene;