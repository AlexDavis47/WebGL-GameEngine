// nodes-core/point_light.js
import Light, { LightType } from './light.js';

class PointLight extends Light {
    constructor(gl) {
        super(gl);
        this.type = LightType.POINT;
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
            position: new Float32Array(this.worldPosition),
            range: this.range
        };
    }
}

export default PointLight;