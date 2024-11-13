
import Light, { LightType } from './light.js';

class DirectionalLight extends Light {
    constructor() {
        super();
        this.type = LightType.DIRECTIONAL;
        this.range = 10.0; // Default range
    }

    setRange(range) {
        this.range = range;
        return this;
    }

    getShaderLight() {
        const baseLight = super.getShaderLight();
        return {
            ...baseLight,
            // Convert worldPosition to Float32Array
            position: new Float32Array(this.getPositionWorld()),
            range: this.range
        };
    }
}

export default DirectionalLight;