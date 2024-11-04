import Camera3D from "../nodes-core/camera3d.js";
import Model3D from "../nodes-core/model3d.js";

class FPSCamera extends Camera3D {
    constructor() {
        super();
        this.name = "Fps_camera";

        // FPS control properties
        this.moveSpeed = 5.0;
        this.lookSpeed = 0.002;

        // Euler angles for rotation
        this.pitch = 0;
        this.yaw = 0;

        // Movement vectors
        this.forward = glMatrix.vec3.create();
        this.right = glMatrix.vec3.create();
        this.up = glMatrix.vec3.fromValues(0, 1, 0);
    }

    init(gl) {
        super.init(gl);
    }

    update(deltaTime) {
        // Only process input if pointer is locked
        if (isPointerLockActive()) {
            this.updateMovement(deltaTime);
            this.updateRotation();
        }

        super.update(deltaTime);
    }

    updateMovement(deltaTime) {
        const moveAmount = this.moveSpeed * deltaTime;

        // Update movement vectors based on current rotation
        this.getForwardVector(this.forward);
        this.getRightVector(this.right);

        // Handle keyboard input for movement
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

        this.needsUpdate = true;
    }

    updateRotation() {
        // Handle mouse input for looking
        const dx = getMouseDeltaX();
        const dy = getMouseDeltaY();

        this.yaw -= dx * this.lookSpeed;
        this.pitch -= dy * this.lookSpeed;

        // Clamp pitch to prevent camera flipping
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

        // Update rotation
        this.setRotationFromEuler(this.pitch, this.yaw, 0);

        this.needsUpdate = true;
    }

    // Configuration methods
    setMoveSpeed(speed) {
        this.moveSpeed = speed;
        return this;
    }

    setLookSpeed(speed) {
        this.lookSpeed = speed;
        return this;
    }
}

export default FPSCamera;