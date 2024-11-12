import shaderManager from '../shader_manager.js';

class Material3D {
    constructor(name = "Material3D") {
        this.name = name;

        // Base material properties
        this.baseColor = [0.7, 0.7, 0.7];
        this.metallic = 0.0;
        this.roughness = 0.5;

        // Textures
        this.textures = new Map();
        this.mainTexture = null;

        // Shader program
        this._shaderProgram = null;
    }

    // Set the shader for this material
    async setShader(shaderPath) {
        const shaderName = `${this.name}_${Date.now()}`;
        this._shaderProgram = await shaderManager.loadShader(shaderName, shaderPath);
        return this;
    }

    // Get the current shader program
    getShaderProgram() {
        return this._shaderProgram;
    }

    setTexture(textureType, image) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.textures.set(textureType, texture);

        if (textureType === 'main') {
            this.mainTexture = texture;
        }

        return this;
    }

    destroy() {
        // Clean up textures
        for (const texture of this.textures.values()) {
            gl.deleteTexture(texture);
        }
        this.textures.clear();
        this.mainTexture = null;
    }
}

export default Material3D;