/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import Node3D from "../nodes-core/node3d.js";
import Model3D from "../nodes-core/model3d.js";
import PointLight from "../nodes-core/point_light.js";

class Firefly extends Model3D {
    constructor() {
        super();
        this.name = "Firefly";
        this.light = new PointLight();

    }

    async init() {
        await this.loadModel('./assets/models/orb/orb.obj');
        await this.addShaderPass('./assets/shaders/texture.glsl');
        await this.addShaderPass('./assets/shaders/phong.glsl');

        this.light.setRange(10);
        this.light.setIntensity(1);
        this.light.setColor(Math.random(), Math.random(), Math.random());
        this.addChild(this.light);
        await super.init();

        this.randX = Math.random() * 5000 + 2000;
        this.randY = Math.random() * 5000 + 2000;
        this.randZ = Math.random() * 5000 + 2000;

    }

    async ready() {
        super.ready();
    }

    update(deltaTime) {
        super.update(deltaTime);

        this.setPosition(
            Math.sin(performance.now() / this.randX) * 4,
            Math.cos(performance.now() / this.randY) * 4 + 8,
            Math.cos(performance.now() / this.randZ) * 4
        )
    }
}

export default Firefly;