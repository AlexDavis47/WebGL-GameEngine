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

    init(gl) {
        // Create and set up camera
        this._camera = new FPSCamera();
        this._camera
            .setPositionX(0)
            .setPositionY(2)
            .setPositionZ(5)
            .setPerspective(90, 0.1, 500000)
            .setMoveSpeed(5.0)
            .setLookSpeed(5);
        this.addChild(this._camera);
        this.setActiveCamera(this._camera);


        const ocean = new Model3D(gl);
        ocean.loadModel('./assets/models/ocean/ocean.obj');
        ocean.setShaderFromFile('./shaders/water.glsl');
        ocean.setPosition(0, -1, 0);
        ocean.setScale(10, 10, 10);
        this.addChild(ocean);


        const island = new Model3D(gl);
        island.loadModel('./assets/models/island/island.obj');
        island.setShaderFromFile('./shaders/phong.glsl');
        island.setPosition(0, -1, 0);
        this.addChild(island);


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

        // Initialize the scene hierarchy
        super.init(gl);
    }

    update(deltaTime) {
        super.update(deltaTime);
    }
}

export default TestScene;