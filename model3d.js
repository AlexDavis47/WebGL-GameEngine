import Node3D from './node3d.js';
import { UniformSetter } from './default_shaders.js';

class Model3D extends Node3D {
    constructor(gl) {
        super();
        this.name = "Model3D";
        this.gl = gl;
        this.vao = null;
        this.indexBuffer = null;
        this.indexCount = 0;
        this.shaderProgram = null; // Custom shader program, if null uses default

        // Default material properties
        this.material = {
            baseColor: [0.7, 0.7, 0.7], // Light gray
            metallic: 0.0,
            roughness: 0.5,
            texture: null,
        };
    }

    setGeometry(vertices, indices, normals, uvs) {
        const gl = this.gl;

        // Create and bind VAO
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Position buffer
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // Normal buffer
        if (normals) {
            const normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }

        // UV buffer
        if (uvs) {
            const uvBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        }

        // Index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.indexCount = indices.length;

        // Cleanup
        gl.bindVertexArray(null);
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

    getScene() {
        let node = this;
        while (node.parent) {
            node = node.parent;
        }
        return node;
    }

    // Add material setters
    setBaseColor(r, g, b) {
        this.material.baseColor = [r, g, b];
        return this;
    }
}

export default Model3D;