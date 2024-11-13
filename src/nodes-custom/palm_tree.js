/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import Model3D from "../nodes-core/model3d.js";
import Node3D from "../nodes-core/node3d.js";

class PalmTree extends Node3D {
    constructor() {
        super();
        this.name = "PalmTree";
        this.bottom = new Model3D();
        this.top = new Model3D();
    }

    async init() {
        await this.bottom.loadModel('./assets/models/tree/palm_trunk.obj');
        await this.bottom.addShaderPass('./assets/shaders/texture.glsl');
        await this.bottom.addShaderPass('./assets/shaders/phong.glsl');
        this.addChild(this.bottom);

        await this.top.loadModel('./assets/models/tree/palm_leaves.obj');
        await this.top.addShaderPass('./assets/shaders/texture.glsl');
        await this.top.addShaderPass('./assets/shaders/phong.glsl');
        this.addChild(this.top);

        await super.init();
    }
}

export default PalmTree;