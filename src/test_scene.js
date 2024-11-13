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
import GLTFLoader from "./util/GLTF_loader.js";
import AmbientLight from "./nodes-core/ambient_light.js";
import Skybox from "./nodes-core/skybox.js";
import Radio from "./nodes-custom/radio.js";
import PalmTree from "./nodes-custom/palm_tree.js";

class TestScene extends Scene {
    constructor() {
        super();
        this.name = "TestScene";
        this._camera = null;
    }

    async init() {
        physicsManager.setGravity(0, -9.81, 0);


        // Player setup
        const player = new Player();
        player.setCapsuleShape(0.2, 0.3);
        this.addChild(player);
        this.setActiveCamera(player._camera);
        player.setPosition(0, 5, 0);

        const ocean = new Model3D();
        await ocean.loadModel('./assets/models/ocean/ocean.obj');
        await ocean.addShaderPass('./assets/shaders/water.glsl');
        ocean.setScale(10, 10, 10);
        this.addChild(ocean);


        const ambientLight = new AmbientLight();
        ambientLight.setIntensity(0.3);
        this.addChild(ambientLight);


        const sun = new PointLight();
        sun.setPosition(0, 1000, 1000)
        sun.setRange(10000);
        sun.setIntensity(1);

        this.addChild(sun);

        const radio = new Radio();

        this.addChild(radio);

        const chair = new PhysicsBody3D();
        await chair.setCollisionFromOBJ('./assets/models/chair/chair.obj');
        chair.setMass(1);

        const chairVisual = new Model3D();
        await chairVisual.loadModel('./assets/models/chair/chair.obj');
        await chairVisual.addShaderPass('./assets/shaders/texture.glsl');
        await chairVisual.addShaderPass('./assets/shaders/phong.glsl');
        chair.addChild(chairVisual);
        chair.setScale(0.5, 0.5, 0.5);

        chair.setPosition(0, 4, 3);
        this.addChild(chair);


        for (let i = 0; i < 5; i++) {
            const tree = new PalmTree();
            tree.setPosition(Math.random() * 30 - 15, 3, Math.random() * 30 - 15);
            tree.setRotation(Math.random() * 12, Math.random() * 360, Math.random() * 12);
            this.addChild(tree);
        }



        const island = new StaticBody3D();
        await island.setCollisionFromOBJ('./assets/models/island/island.obj');
        island.setPosition(0, 0, 0);

        this.addChild(island);

        // Island model
        const islandVisual = new Model3D();
        await islandVisual.loadModel('./assets/models/island/island.obj');
        await islandVisual.addShaderPass('./assets/shaders/texture.glsl');
        await islandVisual.addShaderPass('./assets/shaders/phong.glsl');

        island.addChild(islandVisual);


        // Create seagull ambiance
        for (let i = 0; i < 10; i++) {
            const audioPlayer = new AudioPlayer3D();
            await audioPlayer.loadSound('./assets/ambience/seagulls.mp3', {
                loop: true
            });
            audioPlayer.setPosition(Math.random() * 100 - 50, 10, Math.random() * 100 - 50);
            audioPlayer.setPitchRange(0.6, 1.7);
            audioPlayer.play();
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
        await boxVisual.addShaderPass('./assets/shaders/phong.glsl');
        await boxVisual.addShaderPass('./assets/shaders/water.glsl');
        testBox.addChild(boxVisual);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (inputManager.isKeyJustPressed(Keys.B)) {
            this.spawnTestBox();
        }
    }
}

export default TestScene;