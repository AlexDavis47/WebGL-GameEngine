import Scene from './nodes-core/scene.js';
import FPSCamera from './nodes-custom/fps_camera.js';
import Model3D from "./nodes-core/model3d.js";
import PointLight from "./nodes-core/point_light.js";
import Gun from "./nodes-custom/gun.js";
import PhysicsBody3D from "./nodes-core/physics_body_3d.js";

class TestScene extends Scene {
    constructor() {
        super();
        this.name = "TestScene";
        this._camera = null;
        this.deltaAccumulator = 0;
    }

    async init(gl) {
        console.log('Initializing test scene...');

        // Create and set up camera
        this._camera = new FPSCamera();
        this._camera
            .setPositionX(0)
            .setPositionY(5)
            .setPositionZ(5)
            .setPerspective(70, 0.1, 500000)
            .setMoveSpeed(5.0)
            .setLookSpeed(5);
        this.addChild(this._camera);
        this.setActiveCamera(this._camera);


        const ocean = new Model3D(gl);
        await ocean.loadModel('./assets/models/ocean/ocean.obj');
        await ocean.setShaderFromFile('./shaders/water.glsl');
        ocean.setPosition(0, -1, 0);
        ocean.setScale(10, 10, 10);
        this.addChild(ocean);


        const sun = new PointLight(gl);
        sun.setPosition(0, 1000, 1000)
        sun.setRange(10000);
        sun.setIntensity(1.0);

        this.addChild(sun);


        // Add gun model
        const gun = new Gun(gl);
        this._camera.addChild(gun);
        gun
            .setPositionX(0.4)
            .setPositionY(-0.3)
            .setPositionZ(-0.4)
            .setScaleUniform(0.05);

        // Island physics body
        const island = new PhysicsBody3D();
        await island.setCollisionFromOBJ('./assets/models/island/island.obj');
        island.setMass(0)  // Make it static
            .setPosition(0, -1, 0);
        this.addChild(island);

        // Island model
        const islandVisual = new Model3D(gl);
        await islandVisual.loadModel('./assets/models/island/island.obj');
        await islandVisual.setShaderFromFile('./shaders/phong.glsl');
        island.addChild(islandVisual);


        // Initialize the scene hierarchy
        super.init(gl);
    }

    async spawnTestBox() {
        const testBox = new PhysicsBody3D();
        await testBox.setCollisionFromOBJ('./assets/models/test_cube/cube.obj');
        testBox.setMass(1)
            .setPosition(0, 10, 0);
        this.addChild(testBox);

        const boxVisual = new Model3D();
        await boxVisual.loadModel('./assets/models/test_cube/cube.obj');
        await boxVisual.setShaderFromFile('./shaders/phong.glsl');
        testBox.addChild(boxVisual);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (isMouseButtonJustPressed(0)) {
            this.spawnTestBox();
        }
    }
}

export default TestScene;