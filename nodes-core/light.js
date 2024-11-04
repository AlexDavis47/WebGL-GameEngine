// nodes-core/light.js
import Node3D from './node3d.js';

export const LightType = {
    POINT: 0,
    DIRECTIONAL: 1,
    AMBIENT: 2
};

class Light extends Node3D {
    constructor(gl) {
        super();
        this.gl = gl;
        this.color = [1.0, 1.0, 1.0]; // Default white light
        this.intensity = 1.0;
        this.type = null; // Must be set by child classes
    }

    setColor(r, g, b) {
        this.color = [r, g, b];
        return this;
    }

    setIntensity(intensity) {
        this.intensity = intensity;
        return this;
    }

    // Base light data structure that matches our shader's Light struct
    getShaderLight() {
        return {
            type: this.type,
            // Ensure all vectors are Float32Arrays for WebGL
            position: new Float32Array([0, 0, 0]),
            direction: new Float32Array([0, -1, 0]),
            color: new Float32Array(this.color),
            intensity: this.intensity,
            range: 0
        };
    }
    update(deltaTime) {
        console.log(this.getWorldPosition())
        super.update(deltaTime);
    }
}

export default Light;