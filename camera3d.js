import Node3D from "./node3d.js";

class Camera3D extends Node3D {
    constructor() {
        super();
        this.name = "Camera3D";

        // Projection matrix and related properties
        this.projectionMatrix = glMatrix.mat4.create();
        this.viewMatrix = glMatrix.mat4.create();

        // Perspective camera properties
        this.fov = 60.0 * Math.PI / 180.0; // 60 degrees in radians
        this.aspect = 1.0;
        this.near = 0.1;
        this.far = 1000.0;

        // Camera type flag
        this.isPerspective = true;

        // Orthographic properties
        this.orthoSize = 10;
    }

    updateProjectionMatrix(gl) {
        const aspect = gl.canvas.width / gl.canvas.height;
        this.aspect = aspect;

        if (this.isPerspective) {
            glMatrix.mat4.perspective(
                this.projectionMatrix,
                this.fov,
                aspect,
                this.near,
                this.far
            );
        } else {
            const size = this.orthoSize;
            glMatrix.mat4.ortho(
                this.projectionMatrix,
                -size * aspect,
                size * aspect,
                -size,
                size,
                this.near,
                this.far
            );
        }
    }

    updateViewMatrix() {
        glMatrix.mat4.invert(this.viewMatrix, this.worldMatrix);
    }

    update(deltaTime) {
        this.updateMatrices();
        this.updateViewMatrix();
        super.update(deltaTime);
    }

    init(gl) {
        super.init(gl);
        this.updateProjectionMatrix(gl);
    }

    // Camera configuration methods
    setPerspective(fov, near, far) {
        this.isPerspective = true;
        this.fov = fov * Math.PI / 180.0; // Convert to radians
        this.near = near;
        this.far = far;
        return this;
    }

    setOrthographic(size, near, far) {
        this.isPerspective = false;
        this.orthoSize = size;
        this.near = near;
        this.far = far;
        return this;
    }
}

export default Camera3D;