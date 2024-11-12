import shaderManager from '../shader_manager.js';

class Material3D {
    constructor(name = "Material3D") {
        this.name = name;

        // Base material properties with defaults
        this.baseColor = [0.7, 0.7, 0.7];
        this.metallic = 0.0;
        this.roughness = 0.5;

        // Material textures
        this.albedoMap = null;
        this.normalMap = null;
        this.roughnessMap = null;
        this.metallicMap = null;

        // Shader program reference
        this._shaderProgram = null;

        // Custom uniforms storage
        this._uniforms = new Map();
    }

    setUniform(name, value) {
        if (!this._shaderProgram) {
            console.warn(`Attempting to set uniform '${name}' but no shader is assigned to material '${this.name}'`);
            return this;
        }

        // Check if uniform exists in shader
        if (!this._shaderProgram.uniforms.get(name)) {
            console.warn(`Uniform '${name}' not found in shader for material '${this.name}'`);
            return this;
        }

        this._uniforms.set(name, value);
        return this;
    }

    getUniform(name) {
        return this._uniforms.get(name);
    }

    hasUniform(name) {
        return this._uniforms.has(name);
    }


    async setShader(shaderPath) {
        const shaderName = `${this.name}_${Date.now()}`;
        this._shaderProgram = await shaderManager.loadShader(shaderName, shaderPath);
        return this;
    }

    getShaderProgram() {
        return this._shaderProgram;
    }

    setTexture(type, image) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Set the appropriate texture map
        switch(type) {
            case 'albedo':
                this.albedoMap = texture;
                break;
            case 'normal':
                this.normalMap = texture;
                break;
            case 'roughness':
                this.roughnessMap = texture;
                break;
            case 'metallic':
                this.metallicMap = texture;
                break;
        }

        return this;
    }

    destroy() {
        // Clean up all textures
        [this.albedoMap, this.normalMap, this.roughnessMap, this.metallicMap]
            .filter(texture => texture !== null)
            .forEach(texture => gl.deleteTexture(texture));

        this.albedoMap = null;
        this.normalMap = null;
        this.roughnessMap = null;
        this.metallicMap = null;
    }
}

export default Material3D;