import shaderManager from "../shader_manager.js";

class Material3D {
    constructor(name = "Material3D") {
        this.name = name;

        // Base material properties with defaults
        this.baseColor = [0.7, 0.7, 0.7];
        this.metallic = 0.0;
        this.roughness = 0.5;
        this.opacity = 1.0;

        // PBR specific properties
        this.metallicFactor = 1.0;
        this.roughnessFactor = 1.0;
        this.baseColorFactor = [1.0, 1.0, 1.0, 1.0];

        // Material textures
        this.albedoMap = null;
        this.normalMap = null;
        this.roughnessMap = null;
        this.metallicMap = null;

        // Shader program reference
        this._shaderProgram = null;

        // Custom uniforms storage
        this._uniforms = new Map();

        // Pass system
        this._passes = [];
        this._activePass = 0;
    }

    // Uniform methods
    setUniform(name, value) {
        this._uniforms.set(name, value);
        return this;
    }

    getUniform(name) {
        return this._uniforms.get(name);
    }

    hasUniform(name) {
        return this._uniforms.has(name);
    }

    // Pass management
    addPass(shaderPath) {
        this._passes.push({
            shaderPath,
            program: null,
            uniforms: new Map()
        });
        return this._passes.length - 1; // Return pass index
    }

    getPass(index) {
        return this._passes[index];
    }

    async initializePasses() {
        for (const pass of this._passes) {
            if (!pass.program) {
                const shaderName = `${this.name}_${Date.now()}_pass${this._passes.indexOf(pass)}`;
                pass.program = await shaderManager.loadShader(shaderName, pass.shaderPath);
            }
        }
    }

    setPassUniform(passIndex, name, value) {
        const pass = this._passes[passIndex];
        if (pass) {
            pass.uniforms.set(name, value);
        }
        return this;
    }

    getActiveProgram() {
        if (this._passes.length > 0) {
            return this._passes[this._activePass]?.program;
        }
        return this._shaderProgram;
    }

    // Shader management
    async setShader(shaderPath) {
        const shaderName = `${this.name}_${Date.now()}`;
        // glslify will process the imports
        this._shaderProgram = await shaderManager.loadShader(shaderName, shaderPath);
        return this;
    }

    getShaderProgram() {
        return this._shaderProgram;
    }

    setProgram(program) {
        this._shaderProgram = program;
        return this;
    }

    // Texture management
    setTexture(type, image) {
        if (!image) {
            console.warn(`Attempted to set ${type} texture with null image`);
            return this;
        }

        let texture;
        if (image instanceof WebGLTexture) {
            // If we're passed an existing WebGL texture, use it directly
            texture = image;
        } else {
            // Create new texture from image
            texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.generateMipmap(gl.TEXTURE_2D);

                // Set texture parameters
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            } catch (error) {
                console.error(`Failed to set ${type} texture:`, error);
                gl.deleteTexture(texture);
                return this;
            }
        }

        // Delete existing texture if it exists
        switch (type) {
            case 'albedo':
                if (this.albedoMap) gl.deleteTexture(this.albedoMap);
                this.albedoMap = texture;
                break;
            case 'normal':
                if (this.normalMap) gl.deleteTexture(this.normalMap);
                this.normalMap = texture;
                break;
            case 'roughness':
                if (this.roughnessMap) gl.deleteTexture(this.roughnessMap);
                this.roughnessMap = texture;
                break;
            case 'metallic':
                if (this.metallicMap) gl.deleteTexture(this.metallicMap);
                this.metallicMap = texture;
                break;
            default:
                console.warn(`Unknown texture type: ${type}`);
                gl.deleteTexture(texture);
                return this;
        }

        return this;
    }

    updateFromGLTF(gltfMaterial) {
        if (!gltfMaterial) return this;

        // Handle PBR properties
        if (gltfMaterial.pbrMetallicRoughness) {
            const pbr = gltfMaterial.pbrMetallicRoughness;

            if (pbr.baseColorFactor) {
                this.baseColorFactor = [...pbr.baseColorFactor];
                this.baseColor = pbr.baseColorFactor.slice(0, 3);
                this.opacity = pbr.baseColorFactor[3];
            }

            if (typeof pbr.metallicFactor === 'number') {
                this.metallicFactor = pbr.metallicFactor;
                this.metallic = pbr.metallicFactor;
            }

            if (typeof pbr.roughnessFactor === 'number') {
                this.roughnessFactor = pbr.roughnessFactor;
                this.roughness = pbr.roughnessFactor;
            }
        }

        // Store GLTF-specific properties in uniforms
        this._uniforms.set('u_BaseColorFactor', this.baseColorFactor);
        this._uniforms.set('u_MetallicFactor', this.metallicFactor);
        this._uniforms.set('u_RoughnessFactor', this.roughnessFactor);

        return this;
    }

    getMaterialUniforms() {
        const uniforms = new Map([
            ['u_BaseColor', this.baseColor],
            ['u_Metallic', this.metallic],
            ['u_Roughness', this.roughness],
            ['u_Opacity', this.opacity],
            // Add PBR specific uniforms
            ['u_BaseColorFactor', this.baseColorFactor],
            ['u_MetallicFactor', this.metallicFactor],
            ['u_RoughnessFactor', this.roughnessFactor],
            // Add texture uniforms if they exist
            ['u_AlbedoMap', this.albedoMap ? 0 : null],
            ['u_NormalMap', this.normalMap ? 1 : null],
            ['u_RoughnessMap', this.roughnessMap ? 2 : null],
            ['u_MetallicMap', this.metallicMap ? 3 : null],
        ]);

        // Add custom uniforms
        for (const [key, value] of this._uniforms) {
            uniforms.set(key, value);
        }

        return uniforms;
    }

    // Cleanup
    destroy() {
        // Clean up textures
        [this.albedoMap, this.normalMap, this.roughnessMap, this.metallicMap]
            .filter(texture => texture !== null)
            .forEach(texture => gl.deleteTexture(texture));

        this.albedoMap = null;
        this.normalMap = null;
        this.roughnessMap = null;
        this.metallicMap = null;

        // Clear uniforms
        this._uniforms.clear();

        // Clear passes
        this._passes.forEach(pass => {
            pass.uniforms.clear();
        });
        this._passes = [];
    }
}

export default Material3D;