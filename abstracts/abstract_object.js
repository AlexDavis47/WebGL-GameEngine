//FileName:    abstract_object.js
//Programmers: Alexander Davis, Maika West, Austin Medina
//Date:        10/30/2024
//Purpose:     Abstract class for webgl models, implements functionality for transforming and rendering 3D models

class AbstractObject {
    constructor(model) {
        this.model = model;
        this.modelMatrix = glMatrix.mat4.create();
        this.position = glMatrix.vec3.create();
        this.rotation = glMatrix.vec3.create();
        this.scale = glMatrix.vec3.fromValues(1, 1, 1);
        this.baseScale = glMatrix.vec3.fromValues(1, 1, 1);
    }

    draw() {
        // Update model matrix
        glMatrix.mat4.identity(this.modelMatrix);
        glMatrix.mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        glMatrix.mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(this.modelMatrix, this.modelMatrix, glMatrix.vec3.multiply(glMatrix.vec3.create(), this.scale, this.baseScale));
        //glMatrix.mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);

        // Set the model matrix uniform
        let uModelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.modelMatrix);

        // Draw the model
        this.model.draw();
    }

    setPosition(x, y, z) {
        glMatrix.vec3.set(this.position, x, y, z);
    }

    setRotation(x, y, z) {
        glMatrix.vec3.set(this.rotation, x, y, z);
    }

    setScale(x, y, z) {
        glMatrix.vec3.set(this.scale, x, y, z);
    }



    update() {
        // Implement in inheritor
    }
}