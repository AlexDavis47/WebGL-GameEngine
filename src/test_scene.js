import Scene from './nodes-core/scene.js';
import FPSCamera from './nodes-custom/fps_camera.js';
import Model3D from "./nodes-core/model3d.js";
import PointLight from "./nodes-core/point_light.js";
import Gun from "./nodes-custom/gun.js";
import PhysicsBody3D from "./nodes-core/physics_body_3d.js";
import Player from "./nodes-custom/player.js";

class TestScene extends Scene {
    constructor() {
        super();
        this.name = "TestScene";
        this._camera = null;
    }

    async init(gl) {
        console.log('Initializing test scene...');

        // Create and set up camera
        const camera = new FPSCamera(gl);
        camera.setPosition(0, 2, 5);
        this.setActiveCamera(camera);
        this.addChild(camera);



        const ocean = new Model3D(gl);
        await ocean.loadModel('./assets/models/ocean/ocean.obj');
        await ocean.setShaderFromFile('/assets/shaders/water.glsl');
        ocean.setPosition(0, -1, 0);
        ocean.setScale(10, 10, 10);
        this.addChild(ocean);


        const sun = new PointLight(gl);
        sun.setPosition(0, 1000, 1000)
        sun.setRange(10000);
        sun.setIntensity(1.0);

        this.addChild(sun);


        // Island model
        const islandVisual = new Model3D(gl);
        await islandVisual.loadModel('./assets/models/island/island.obj');
        await islandVisual.setShaderFromFile('./assets/shaders/phong.glsl');
        this.addChild(islandVisual);


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
    }
}

export default TestScene;