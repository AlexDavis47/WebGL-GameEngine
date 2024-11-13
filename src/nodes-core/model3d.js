/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import Node3D from './node3d.js';
import OBJLoader from "../util/obj_loader.js";
import MTLLoader from "../util/mtl_loader.js";
import shaderManager from '../shader_manager.js';
import Material3D from "./material_3d.js";
import GLTFLoader from "../util/GLTF_loader.js";

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

        this._submeshes = [];

        // Create default material
        this._material = new Material3D(this.name + "_Material");
    }

    async loadModel(path, options = {}) {
        this._useTextures = options.useTextures ?? this._useTextures;
        this._basePath = options.basePath ?? this.extractPath(path);

        const isGLTF = path.toLowerCase().endsWith('.gltf') || path.toLowerCase().endsWith('.glb');

        try {
            if (isGLTF) {
                console.log('Loading GLTF model:', path);
                await this._loadGLTF(path);
            } else {
                console.log('Loading OBJ model:', path);
                await this._loadOBJ(path);
            }
        } catch (error) {
            console.error('Error loading model:', path, error);
            throw error;
        }
    }

    async _loadOBJ(path) {
        const objResponse = await fetch(path);
        const objText = await objResponse.text();
        const modelData = OBJLoader.parse(objText);

        this.setGeometry(
            modelData.positions,
            modelData.indices,
            modelData.normals,
            modelData.texcoords
        );

        const mtlMatch = objText.match(/mtllib\s+([^\s]+)/);
        if (mtlMatch && this._useTextures) {
            await this.loadMaterial(this._basePath + mtlMatch[1]);
        }
    }


    async _loadGLTF(path) {
        const model = await GLTFLoader.load(path);
        this._submeshes = [];

        for (const mesh of model.meshes) {
            if (!mesh.positions.length) continue;

            const submesh = {
                vao: null,
                indexBuffer: null,
                indexCount: mesh.indices.length || 0,
                material: new Material3D(this.name + "_Material_" + this._submeshes.length)
            };

            // Create and bind VAO
            submesh.vao = gl.createVertexArray();
            gl.bindVertexArray(submesh.vao);

            // Position buffer (required)
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            // Normal buffer (optional)
            if (mesh.normals && mesh.normals.length > 0) {
                const normalBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);
                gl.enableVertexAttribArray(1);
                gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
            }

            // UV buffer (optional)
            if (mesh.texcoords && mesh.texcoords.length > 0) {
                const uvBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.texcoords), gl.STATIC_DRAW);
                gl.enableVertexAttribArray(2);
                gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
            }

            // Index buffer (required)
            if (mesh.indices && mesh.indices.length > 0) {
                submesh.indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, submesh.indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
                submesh.indexCount = mesh.indices.length;
            } else {
                // If no indices, create them
                const indices = new Array(mesh.positions.length / 3);
                for (let i = 0; i < indices.length; i++) indices[i] = i;
                submesh.indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, submesh.indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
                submesh.indexCount = indices.length;
            }

            // Set up material properties
            if (mesh.material) {
                submesh.material.updateFromGLTF(mesh.material);
                if (mesh.material.baseColorTexture) {
                    submesh.material.setTexture('albedo', mesh.material.baseColorTexture);
                }
                // Initialize material passes
                await submesh.material.initializePasses();
            }

            this._submeshes.push(submesh);
        }

        // Cleanup
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // If only one submesh, use it as the main mesh
        if (this._submeshes.length === 1) {
            this._vao = this._submeshes[0].vao;
            this._indexBuffer = this._submeshes[0].indexBuffer;
            this._indexCount = this._submeshes[0].indexCount;
            this._material = this._submeshes[0].material;
        }

        // Debug info
        console.log(`Loaded GLTF model with ${this._submeshes.length} submeshes`);
        this._submeshes.forEach((submesh, i) => {
            console.log(`Submesh ${i}: ${submesh.indexCount} indices`);
        });
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

    async render() {
        if (!this.enabled) return;

        const scene = this.getRootNode();

        // Debug check
        if (this._submeshes.length === 0 && !this._vao) {
            return;
        }

        // Ensure the material is initialized
        if (this._material && !this._material._initialized) {
            await this._material.initializePasses();
        }

        if (this._submeshes.length > 0) {
            // GLTF rendering path
            for (const submesh of this._submeshes) {
                if (!submesh.vao || submesh.indexCount === 0) continue;

                const program = submesh.material.getActiveProgram();
                if (!program) continue;

                gl.useProgram(program.program);
                shaderManager.setUniforms(program, scene.activeCamera, this, scene);

                gl.bindVertexArray(submesh.vao);
                gl.drawElements(gl.TRIANGLES, submesh.indexCount, gl.UNSIGNED_SHORT, 0);
                gl.bindVertexArray(null);
            }
        } else if (this._vao) {
            const program = this._material.getActiveProgram();
            if (!program) return;

            if (this._material._passes.length > 1) {
                // Multi-pass rendering
                for (let i = 0; i < this._material._passes.length; i++) {
                    this._material._activePass = i;
                    const currentPass = this._material._passes[i];
                    const passProgram = currentPass.program;
                    if (!passProgram) continue;

                    const isLastPass = i === this._material._passes.length - 1;

                    if (!isLastPass) {
                        if (!shaderManager.beginPass(i, this._material)) continue;
                    }

                    gl.useProgram(passProgram.program);
                    shaderManager.setUniforms(passProgram, scene.activeCamera, this, scene);

                    gl.bindVertexArray(this._vao);
                    gl.drawElements(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0);
                    gl.bindVertexArray(null);

                    if (!isLastPass) {
                        shaderManager.endPass();
                    }
                }
                this._material._activePass = 0;
            } else {
                // Single-pass rendering
                gl.useProgram(program.program);
                shaderManager.setUniforms(program, scene.activeCamera, this, scene);

                gl.bindVertexArray(this._vao);
                gl.drawElements(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0);
                gl.bindVertexArray(null);
            }
        }

        // Render children
        for (const child of this.children) {
            if (child.render) {
                await child.render();
            }
        }
    }

    onDestroy() {
        for (const submesh of this._submeshes) {
            if (submesh.vao) {
                gl.deleteVertexArray(submesh.vao);
            }
            if (submesh.indexBuffer) {
                gl.deleteBuffer(submesh.indexBuffer);
            }
            if (submesh.material) {
                submesh.material.destroy();
            }
        }
        this._submeshes = [];

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