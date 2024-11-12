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

        // Create a default material
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

            // Debug: log all materials
            console.log('Loaded materials:', materials);

            // Apply the first material found
            for (const material of materials.values()) {
                console.log('Processing material:', material.name);
                console.log('Material properties:', {
                    diffuseMap: material.diffuseMap,
                    diffuseColor: material.diffuseColor
                });

                if (material.diffuseMap) {
                    console.log('Setting diffuse map to albedo');
                    this._material.setTexture('albedo', material.diffuseMap);
                }
                if (material.diffuseColor) {
                    console.log('Setting diffuse color:', material.diffuseColor);
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

    render() {
        if (!this._vao || !this.enabled) return;

        // Get the shader program from material or default
        const program = this._material.getShaderProgram() || shaderManager.getDefaultProgram();

        gl.useProgram(program.program);

        // Get scene from node hierarchy
        const scene = this.getRootNode();

        // Set all uniforms
        shaderManager.setUniforms(program, scene.activeCamera, this, scene);

        // Bind VAO and draw
        gl.bindVertexArray(this._vao);
        gl.drawElements(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        // Render children
        super.render();
    }



    onDestroy() {
        // Cleanup GL resources
        if (this._vao) {
            gl.deleteVertexArray(this._vao);
            this._vao = null;
        }

        if (this._indexBuffer) {
            gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        // Cleanup material
        if (this._material) {
            this._material.destroy();
        }

        super.onDestroy();
    }

    get material() {
        return this._material;
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
}

export default Model3D;