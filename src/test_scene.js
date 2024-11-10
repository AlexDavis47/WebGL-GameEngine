import Scene from './nodes-core/scene.js';
import FPSCamera from './nodes-custom/fps_camera.js';
import Model3D from "./nodes-core/model3d.js";
import PointLight from "./nodes-core/point_light.js";
import Gun from "./nodes-custom/gun.js";
import PhysicsBody3D from "./nodes-core/physics_body_3d.js";
import Player from "./nodes-custom/player.js";
import inputManager, {Keys} from "./input_manager.js";
import physicsManager from "./physics_manager.js";
import StaticBody3D from "./nodes-core/static_body_3d.js";
import AudioPlayer from "./nodes-core/audio_player.js";
import AudioPlayer3D from "./nodes-core/audio_player_3d.js";

class TestScene extends Scene {
    constructor() {
        super();
        this.name = "TestScene";
        this._camera = null;
    }

    async init() {
        console.log('Initializing test scene...');
        physicsManager.setGravity(0, -9.81, 0);


        // Player setup
        const player = new Player();
        player.setCapsuleShape(0.2, 0.3);
        this.addChild(player);
        this.setActiveCamera(player._camera);
        player.setPosition(0, 5, 0);

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const ocean = new Model3D();
                await ocean.loadModel('./assets/models/ocean/ocean.obj');
                await ocean.setShaderFromFile('./assets/shaders/water.glsl');
                ocean.setPosition(i * 500 - (500 * 2.5), -2, j * 500 - (500 * 2.5));
                ocean.setScale(10, 10, 10);
                this.addChild(ocean);
            }
        }

        const sun = new PointLight();
        sun.setPosition(0, 1000, 1000)
        sun.setRange(10000);
        sun.setIntensity(1.0);

        this.addChild(sun);

        const island = new StaticBody3D();
        await island.setCollisionFromOBJ('./assets/models/island/island.obj');
        island.setPosition(0, 0, 0);

        this.addChild(island);
        // Island model
        const islandVisual = new Model3D();
        await islandVisual.loadModel('./assets/models/island/island.obj');
        await islandVisual.setShaderFromFile('./assets/shaders/phong.glsl');

        island.addChild(islandVisual);

        for (let i = 0; i < 25; i++) {
            // Island static body
            const island = new StaticBody3D();
            await island.setCollisionFromOBJ('./assets/models/island/island.obj');
            island.setPosition(Math.random() * 200 - 100, 0, Math.random() * 200 - 100);
            island.setRotation(0, Math.random() * Math.PI * 2, 0);

            this.addChild(island);
            // Island model
            const islandVisual = new Model3D();
            await islandVisual.loadModel('./assets/models/island/island.obj');
            await islandVisual.setShaderFromFile('./assets/shaders/phong.glsl');

            // move the island down based on it's distance from the center
            const distance = Math.sqrt(island.getPositionWorld()[0] ** 2 + island.getPositionWorld()[2] ** 2);
            island.setPositionY(-distance / 20);


            island.addChild(islandVisual);
        }


        // Initialize the scene hierarchy
        await super.init();
    }

    async spawnTestBox() {
        const testBox = new PhysicsBody3D();
        await testBox.setCollisionFromOBJ('./assets/models/test_cube/cube.obj');
        testBox.setMass(1);
        testBox.setPosition(Math.random() * 10 - 5, 10, Math.random() * 10 - 5);


        this.addChild(testBox);

        const boxVisual = new Model3D();
        await boxVisual.loadModel('./assets/models/test_cube/cube.obj');
        await boxVisual.setShaderFromFile('./assets/shaders/toon.glsl');
        testBox.addChild(boxVisual);

        const audioPlayer = new AudioPlayer3D();
        await audioPlayer.loadSound('./assets/ambience/seagulls.mp3', {
            loop: true
        });
        testBox.addChild(audioPlayer);
        audioPlayer.play();
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (inputManager.isKeyJustPressed(Keys.B)) {
            this.spawnTestBox();
        }
    }
}

export default TestScene;