import Node3D from './node3d.js';
import OBJLoader from "../util/obj_loader.js";
import MTLLoader from "../util/mtl_loader.js";
import shaderManager from '../shader_manager.js';
import Material3D from "./material_3d.js";

class Model3D extends Node3D {
    constructor() {
        super();
        this.name = "Model3D";
        this._vao = null;
        this._indexBuffer = null;
        this._indexCount = 0;

        // Loading configuration
        this._useTextures = true;
        this._basePath = '';

        // Create default material
        this._material = new Material3D(this.name + "_Material");
    }


    async loadModel(objPath, options = {}) {
        // Set up configuration
        this._useTextures = options.useTextures ?? this._useTextures;
        this._basePath = options.basePath ?? this.extractPath(objPath);

        try {
            // Load OBJ
            const objResponse = await fetch(objPath);
            const objText = await objResponse.text();
            const modelData = OBJLoader.parse(objText);

            // Set up geometry
            this.setGeometry(
                modelData.positions,
                modelData.indices,
                modelData.normals,
                modelData.texcoords
            );

            // Get MTL filename from OBJ if present
            const mtlMatch = objText.match(/mtllib\s+([^\s]+)/);
            if (mtlMatch && this._useTextures) {
                await this.loadMaterial(this._basePath + mtlMatch[1]);
            }

        } catch (error) {
            console.error('Error loading model:', objPath, error);
            throw error;
        }
    }

    extractPath(fileUrl) {
        const lastSlash = fileUrl.lastIndexOf('/');
        return lastSlash >= 0 ? fileUrl.substring(0, lastSlash + 1) : '';
    }

    async loadMaterial(mtlPath) {
        try {
            const mtlResponse = await fetch(mtlPath);
            const mtlText = await mtlResponse.text();
            const materials = await MTLLoader.parse(mtlText, this._basePath);

            // Apply the first material found
            for (const material of materials.values()) {
                if (material.diffuseMap) {
                    this._material.setTexture('albedo', material.diffuseMap);
                }
                if (material.diffuseColor) {
                    this._material.baseColor = material.diffuseColor;
                }
                break; // Just use the first material for now
            }
        } catch (error) {
            console.error('Error loading material:', mtlPath, error);
            throw error;
        }
    }


    setGeometry(vertices, indices, normals, uvs) {
        // Create and bind VAO
        this._vao = gl.createVertexArray();
        gl.bindVertexArray(this._vao);

        // Position buffer (location 0)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // Normal buffer (location 1)
        if (normals && normals.length > 0) {
            const normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }

        // UV buffer (location 2)
        if (uvs && uvs.length > 0) {
            const uvBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        }

        // Index buffer
        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this._indexCount = indices.length;

        // Cleanup
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return this;
    }

    setTexture(image, materialName = 'default') {
        this._material.setTexture('albedo', image);
        return this;
    }


    async ready() {
        // Any model-specific initialization
        await super.ready();
    }

    // In Model3D.js render() method
    render() {
        if (!this._vao || !this.enabled) return;

        const scene = this.getRootNode();

        if (this._material._passes.length > 0) {
            // Execute each pass
            for (let i = 0; i < this._material._passes.length; i++) {
                // Set the current pass
                this._material._activePass = i;

                // Check if this is the final pass
                const isLastPass = i === this._material._passes.length - 1;

                if (isLastPass) {
                    // Final pass renders to screen
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                } else {
                    // Begin the pass using ShaderManager for intermediate passes
                    if (!shaderManager.beginPass(i, this._material)) {
                        continue;
                    }
                }

                // Get the program for this pass
                const program = this._material._passes[i].program;
                gl.useProgram(program.program);

                // Set all uniforms for this pass
                shaderManager.setUniforms(program, scene.activeCamera, this, scene);

                // Draw
                gl.bindVertexArray(this._vao);
                gl.drawElements(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0);
                gl.bindVertexArray(null);

                // Only end the pass if it's not the final pass
                if (!isLastPass) {
                    shaderManager.endPass();
                }
            }

            // Reset active pass
            this._material._activePass = 0;
        } else {
            // Original single-pass rendering
            const program = this._material.getShaderProgram() || shaderManager.getDefaultProgram();
            gl.useProgram(program.program);

            shaderManager.setUniforms(program, scene.activeCamera, this, scene);

            gl.bindVertexArray(this._vao);
            gl.drawElements(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        }

        // Render children
        super.render();
    }




    onDestroy() {
        if (this._vao) {
            gl.deleteVertexArray(this._vao);
            this._vao = null;
        }

        if (this._indexBuffer) {
            gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        if (this._material) {
            this._material.destroy();
        }

        super.onDestroy();
    }

    get material() {
        return this._material;
    }

    set material(newMaterial) {
        if (this._material) {
            this._material.destroy();
        }
        this._material = newMaterial;
    }

    setBaseColor(r, g, b) {
        this._material.baseColor = [r, g, b];
        return this;
    }

    async setShaderFromFile(shaderPath) {
        await this._material.setShader(shaderPath);
        return this;
    }

    async addShaderPass(shaderPath) {
        const passIndex = this._material.addPass(shaderPath);
        await this._material.initializePasses();
        return passIndex;
    }

    setPassUniform(passIndex, name, value) {
        this._material.setPassUniform(passIndex, name, value);
        return this;
    }
}

export default Model3D;