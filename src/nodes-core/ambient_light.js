import Light, { LightType } from './light.js';

class AmbientLight extends Light {
    constructor() {
        super();
        this.type = LightType.AMBIENT;
    }
}

export default AmbientLight;