import Node3D from './node3d.js';
import { UniformSetter } from '../default_shaders.js';
import OBJLoader from "../util/obj_loader.js";
import MTLLoader from "../util/mtl_loader.js";

class Model3D extends Node3D {
    constructor(gl) {
        super();
        this.name = "Model3D";
        this.gl = gl;
        this.vao = null;
        this.indexBuffer = null;
        this.indexCount = 0;
        this.shaderProgram = null;

        // Loading configuration
        this.useTextures = true;  // Whether to load and use textures from MTL
        this.basePath = '';       // Base path for model files

        // Material properties
        this.material = {
            baseColor: [0.7, 0.7, 0.7],
            metallic: 0.0,
            roughness: 0.5,
            texture: null,
        };

        this.textures = new Map();
    }

    /**
     * Load a model from an OBJ file
     * @param {string} objPath - Path to the OBJ file
     * @param {Object} options - Optional configuration
     * @param {boolean} options.useTextures - Whether to load textures (default: true)
     * @param {string} options.basePath - Base path for model files (default: directory of OBJ)
     * @returns {Promise<void>}
     */
    async loadModel(objPath, options = {}) {
        // Set up configuration
        this.useTextures = options.useTextures ?? this.useTextures;
        this.basePath = options.basePath ?? this.extractPath(objPath);

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
            if (mtlMatch && this.useTextures) {
                await this.loadMaterial(this.basePath + mtlMatch[1]);
            }

        } catch (error) {
            console.error('Error loading model:', objPath, error);
        }
    }

    /**
     * Extract the path from a file URL
     * @param {string} fileUrl - The complete file URL
     * @returns {string} The path without the filename
     */
    extractPath(fileUrl) {
        const lastSlash = fileUrl.lastIndexOf('/');
        return lastSlash >= 0 ? fileUrl.substring(0, lastSlash + 1) : '';
    }

    /**
     * Load and apply material from MTL file
     * @param {string} mtlPath - Path to the MTL file
     */
    async loadMaterial(mtlPath) {
        try {
            const mtlResponse = await fetch(mtlPath);
            const mtlText = await mtlResponse.text();
            const materials = await MTLLoader.parse(mtlText, this.basePath);

            // Apply the first material found (or you could handle multiple materials)
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
        }
    }

    setGeometry(vertices, indices, normals, uvs) {
        const gl = this.gl;

        // Create and bind VAO
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

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
            console.log('Setting up UV buffer with', uvs.length / 2, 'UV coordinates');
            const uvBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        } else {
            console.warn('No UV coordinates provided for model');
        }

        // Index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.indexCount = indices.length;

        // Cleanup
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return this;
    }

    setTexture(image, materialName = 'default') {
        const gl = this.gl;

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
        this.textures.set(materialName, texture);

        // Set as current material texture
        this.material.texture = texture;

        return this;
    }

    render(gl) {
        if (!this.vao) return;

        const program = this.shaderProgram || gl.defaultProgram;
        gl.useProgram(program.program);

        // Set uniforms
        UniformSetter.setBasicUniforms(gl, program, this.getScene().activeCamera, this);
        UniformSetter.setLightUniforms(gl, program, this.getScene());
        UniformSetter.setMaterialUniforms(gl, program, this.material);

        // Bind VAO and draw
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        super.render(gl);
    }

    cleanup() {
        const gl = this.gl;

        // Cleanup textures
        for (const texture of this.textures.values()) {
            gl.deleteTexture(texture);
        }
        this.textures.clear();

        if (this.vao) {
            gl.deleteVertexArray(this.vao);
            this.vao = null;
        }
        if (this.indexBuffer) {
            gl.deleteBuffer(this.indexBuffer);
            this.indexBuffer = null;
        }

        super.cleanup();
    }

    getScene() {
        let node = this;
        while (node.parent) {
            node = node.parent;
        }
        return node;
    }

    setBaseColor(r, g, b) {
        this.material.baseColor = [r, g, b];
        return this;
    }

    setCustomShader(shaderOptions) {
        const program = this.gl.shaderManager.createCustomShader(
            `${this.name}_shader`,
            shaderOptions
        );
        this.shaderProgram = program;
        return this;
    }
}

export default Model3D;