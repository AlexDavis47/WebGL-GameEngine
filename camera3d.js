import Node3D from './node3d.js';

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

        // Camera control properties
        this.moveSpeed = 5.0;
        this.lookSpeed = 0.002;
        this.isPerspective = true;

        // For FPS controls
        this.pitch = 0;
        this.yaw = 0;

        // Orthographic properties
        this.orthoSize = 10;

        // Movement vectors
        this.forward = glMatrix.vec3.create();
        this.right = glMatrix.vec3.create();
        this.up = glMatrix.vec3.fromValues(0, 1, 0);
    }

    init(gl) {
        super.init(gl);
        this.updateProjectionMatrix(gl);
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
        // Update the camera's orientation based on pitch and yaw
        this.setRotationFromEuler(this.pitch, this.yaw, 0);

        // Get the forward and right vectors for movement
        this.getForwardVector(this.forward);
        this.getRightVector(this.right);

        // Create view matrix
        glMatrix.mat4.invert(this.viewMatrix, this.worldMatrix);
    }

    update(deltaTime) {
        this.updateMatrices();
        this.updateViewMatrix();

        // Only process input if pointer is locked
        if (isPointerLockActive()) {
            // Handle keyboard input for movement
            const moveAmount = this.moveSpeed * deltaTime;

            if (isKeyPressed(Keys.W)) {
                glMatrix.vec3.scaleAndAdd(this.position, this.position, this.forward, moveAmount);
            }
            if (isKeyPressed(Keys.S)) {
                glMatrix.vec3.scaleAndAdd(this.position, this.position, this.forward, -moveAmount);
            }
            if (isKeyPressed(Keys.A)) {
                glMatrix.vec3.scaleAndAdd(this.position, this.position, this.right, -moveAmount);
            }
            if (isKeyPressed(Keys.D)) {
                glMatrix.vec3.scaleAndAdd(this.position, this.position, this.right, moveAmount);
            }
            if (isKeyPressed(Keys.SPACE)) {
                glMatrix.vec3.scaleAndAdd(this.position, this.position, this.up, moveAmount);
            }
            if (isKeyPressed(Keys.SHIFT_LEFT)) {
                glMatrix.vec3.scaleAndAdd(this.position, this.position, this.up, -moveAmount);
            }

            // Handle mouse input for looking
            const dx = getMouseDeltaX();
            const dy = getMouseDeltaY();

            this.yaw -= dx * this.lookSpeed;
            this.pitch -= dy * this.lookSpeed;

            // Clamp pitch to prevent camera flipping
            this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

            this.needsUpdate = true;
        }

        super.update(deltaTime);
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

    setMoveSpeed(speed) {
        this.moveSpeed = speed;
        return this;
    }

    setLookSpeed(speed) {
        this.lookSpeed = speed;
        return this;
    }

    // Utility methods
    getFrustumCorners() {
        const corners = [];
        const near = this.near;
        const far = this.far;

        if (this.isPerspective) {
            const tanHalfFov = Math.tan(this.fov / 2);
            const nearHeight = 2 * near * tanHalfFov;
            const nearWidth = nearHeight * this.aspect;
            const farHeight = 2 * far * tanHalfFov;
            const farWidth = farHeight * this.aspect;

            // Near plane corners
            corners.push(
                [-nearWidth/2, -nearHeight/2, -near],
                [nearWidth/2, -nearHeight/2, -near],
                [nearWidth/2, nearHeight/2, -near],
                [-nearWidth/2, nearHeight/2, -near]
            );

            // Far plane corners
            corners.push(
                [-farWidth/2, -farHeight/2, -far],
                [farWidth/2, -farHeight/2, -far],
                [farWidth/2, farHeight/2, -far],
                [-farWidth/2, farHeight/2, -far]
            );
        } else {
            const width = this.orthoSize * this.aspect;
            const height = this.orthoSize;

            // Near plane corners
            corners.push(
                [-width, -height, -near],
                [width, -height, -near],
                [width, height, -near],
                [-width, height, -near]
            );

            // Far plane corners
            corners.push(
                [-width, -height, -far],
                [width, -height, -far],
                [width, height, -far],
                [-width, height, -far]
            );
        }

        // Transform corners to world space
        return corners.map(corner => {
            const worldCorner = glMatrix.vec3.create();
            glMatrix.vec3.transformMat4(worldCorner, corner, this.worldMatrix);
            return worldCorner;
        });
    }
}

export default Camera3D;