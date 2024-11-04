import Scene from './nodes-core/scene.js';
import FPSCamera from './nodes-custom/fps_camera.js';
import Model3D from "./nodes-core/model3d.js";
import PointLight from "./nodes-core/point_light.js";
import Gun from "./nodes-custom/gun.js";

class TestScene extends Scene {
    constructor() {
        super();
        this.name = "TestScene";
        this._camera = null;
    }

    async init(gl) {
        // Create and set up camera
        this._camera = new FPSCamera();
        this._camera
            .setPositionX(0)
            .setPositionY(2)
            .setPositionZ(5)
            .setPerspective(60, 0.1, 5000)
            .setMoveSpeed(5.0)
            .setLookSpeed(5);
        this.addChild(this._camera);
        this.setActiveCamera(this._camera);

        // Create rockspire model
        const rockspire = new Model3D(gl);
        rockspire
            .setPositionX(0)
            .setPositionY(0)
            .setPositionZ(0)
            .setScaleUniform(0.5)
            .setName("rockspire");
        await rockspire.loadModel('./assets/models/rockspire/rockspire.obj');
        await rockspire.setShaderFromFile('./shaders/phong.glsl');
        this.addChild(rockspire);

        // Create test cube as child of rockspire
        const testCube = new Model3D(gl);
        testCube
            .setPositionX(0)
            .setPositionY(6)
            .setPositionZ(-10)
            .setName("testCube");
        await testCube.loadModel('./assets/models/test_cube/cube.obj');
        await testCube.setShaderFromFile('./shaders/toon.glsl');
        rockspire.addChild(testCube);

        // Add cubes down y-axis
        for (let i = 0; i < 3; i++) {
            const cube = new Model3D(gl);
            cube
                .setPositionX(0)
                .setPositionY(i * -2)
                .setPositionZ(0);
            await cube.loadModel('./assets/models/test_cube/cube.obj');
            await cube.setShaderFromFile('./shaders/toon.glsl');
            testCube.addChild(cube);
        }

        // Add cubes down z-axis
        for (let i = 0; i < 6; i++) {
            const cube = new Model3D(gl);
            cube
                .setPositionX(0)
                .setPositionY(0)
                .setPositionZ(i * 2);
            await cube.loadModel('./assets/models/test_cube/cube.obj');
            await cube.setShaderFromFile('./shaders/toon.glsl');
            testCube.addChild(cube);

            if (i === 5) {
                cube.setName("lightCube");
            }
        }

        // Add point light to camera
        const pointLight = new PointLight(gl);
        pointLight
            .setPositionX(0)
            .setPositionY(0)
            .setPositionZ(0)
            .setColor(1, 1, 1)
            .setIntensity(1)
            .setRange(15);
        this._camera.addChild(pointLight);

        // Add a red point light to the light cube
        const lightCube = testCube.findByName("lightCube");
        if (lightCube) {
            const redLight = new PointLight(gl);
            redLight
                .setPositionX(0)
                .setPositionY(-2)
                .setPositionZ(0)
                .setColor(1, 0, 0)
                .setIntensity(1)
                .setRange(15);
            lightCube.addChild(redLight);
        }

        // Add gun model
        const gun = new Gun(gl);
        this._camera.addChild(gun);
        gun
            .setPositionX(0.4)
            .setPositionY(-0.3)
            .setPositionZ(-0.4)
            .setScaleUniform(0.1);

        // Initialize the scene hierarchy
        await super.init(gl);
    }

    update(deltaTime) {
        // Find rockspire and testCube using the scene graph
        const rockspire = this.findByName("rockspire");
        if (rockspire) {
            // 360 degrees per second
            rockspire.rotate(0, -25 * deltaTime, 0);

            // Calculate vertical oscillation
            const verticalOffset = Math.sin(performance.now() / 1000) * deltaTime * 0.2;
            rockspire.translate(0, verticalOffset, 0);

            // TestCube should rotate at 360 degrees per second in the opposite direction
            const testCube = rockspire.findByName("testCube");
            if (testCube) {
                testCube.rotate(0, 25 * deltaTime, 0);
            }
        }

        super.update(deltaTime);
    }
}

export default TestScene;