import Node3D from './node3d.js';
import OBJLoader from "../util/obj_loader.js";
import MTLLoader from "../util/mtl_loader.js";
import shaderManager from '../shader_manager.js';

class Model3D extends Node3D {
    constructor() {
        super();
        this.name = "Model3D";
        this._vao = null;
        this._indexBuffer = null;
        this._indexCount = 0;
        this._shaderProgram = null;

        // Loading configuration
        this._useTextures = true;
        this._basePath = '';

        // Material properties
        this._material = {
            baseColor: [0.7, 0.7, 0.7],
            metallic: 0.0,
            roughness: 0.5,
            texture: null,
        };

        this._textures = new Map();
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
                    this.setTexture(material.diffuseMap, material.name);
                }
                if (material.diffuseColor) {
                    this.setBaseColor(...material.diffuseColor);
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
        // Create and setup texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Upload the image into the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Setup texture parameters
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Store the texture
        this._textures.set(materialName, texture);

        // Set as current material texture
        this._material.texture = texture;

        return this;
    }

    async ready() {
        // Any model-specific initialization
        await super.ready();
    }

    render() {
        if (!this._vao || !this.enabled) return;

        // Get the shader program (default if none set)
        const program = this._shaderProgram || shaderManager.getDefaultProgram();

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

        // Cleanup textures
        for (const texture of this._textures.values()) {
            gl.deleteTexture(texture);
        }
        this._textures.clear();

        super.onDestroy();
    }

    get material() {
        return this._material;
    }

    setBaseColor(r, g, b) {
        this._material.baseColor = [r, g, b];
        return this;
    }


    async setShaderFromFile(shaderPath) {
        const shaderName = `${this.name}_${Date.now()}`;
        this._shaderProgram = await shaderManager.loadShader(shaderName, shaderPath);
        return this;
    }
}

export default Model3D;