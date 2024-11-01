//FileName:     abstract_model.js
//Programmers:  Alexander Davis, Maika West, Austin Medina
//Date:         10/30/2024
//Purpose:      Represents a 3D model in WebGL, contains a list of shapes that make up the model, and provides drawing functionality

class AbstractModel {
    constructor() {
        this.shapes = [];
    }

    addShape(vertices, colors, indices, shininess = 50.0, drawMode = gl.TRIANGLES, normals = null) {
        const shape = new Shape(vertices, colors, indices, drawMode, normals, shininess);
        if (!normals) {
            shape.calculateNormals();
        }
        this.shapes.push(shape);
        this.initBuffers(shape);
    }

    initBuffers(shape) {
        // Create and bind vertex buffer
        shape.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.vertices), gl.STATIC_DRAW);

        // Create and bind color buffer
        shape.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.colors), gl.STATIC_DRAW);

        // Create and bind normal buffer
        if (shape.normals) {
            shape.normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, shape.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.normals), gl.STATIC_DRAW);
        }

        // Create shininess buffer
        const shininessArray = new Float32Array(shape.vertices.length / 3).fill(shape.shininess);
        shape.shininessBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.shininessBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, shininessArray, gl.STATIC_DRAW);

        // Create and bind index buffer
        if (shape.indices) {
            shape.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);
        }

        // Clean up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    draw() {
        for (let shape of this.shapes) {
            // Bind vertex buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);

            // Bind color buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, shape.colorBuffer);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(1);

            // Bind normal buffer
            if (shape.normalBuffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, shape.normalBuffer);
                gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(2);
            }

            // Bind shininess buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, shape.shininessBuffer);
            gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(3);

            if (shape.indices) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
                gl.drawElements(shape.drawMode, shape.indices.length, gl.UNSIGNED_SHORT, 0);
            } else {
                gl.drawArrays(shape.drawMode, 0, shape.vertices.length / 3);
            }
        }

        // Clean up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    setShininess(shininess) {
        for (let shape of this.shapes) {
            shape.shininess = shininess;
            // Update shininess buffer
            const shininessArray = new Float32Array(shape.vertices.length / 3).fill(shininess);
            gl.bindBuffer(gl.ARRAY_BUFFER, shape.shininessBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, shininessArray, gl.STATIC_DRAW);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}