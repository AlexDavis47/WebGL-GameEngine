import Camera3D from "../nodes-core/camera3d.js";
import Model3D from "../nodes-core/model3d.js";
import inputManager, {Keys} from "../input_manager.js";
import {vec3, quat, glMatrix} from "gl-matrix";

class FPSCamera extends Camera3D {
    constructor() {
        super();
        this.name = "FPS_Camera";

        // FPS control properties
        this._moveSpeed = 5.0;
        this._lookSpeed = 3;  // Changed to be more intuitive in degrees

        // Euler angles for rotation in degrees?
        this._pitch = 0;
        this._yaw = 0;

        // Cached movement vectors
        this._forward = vec3.create();
        this._right = vec3.create();
        this._up = vec3.fromValues(0, 1, 0);

        // Movement constraints (in radians)
        this._pitchLimit = {
            min: -89, // Allowing full 90 degrees causes math issues related to movement
            max: 89
        };
    }

    update(deltaTime) {
        if (inputManager.isPointerLockActive()) {
            this.updateMovement(deltaTime);
            this.updateRotation();
        }

        super.update(deltaTime);
    }

    updateMovement(deltaTime) {
        const moveAmount = this._moveSpeed * deltaTime;
        const movement = vec3.create();

        // Get world-space movement vectors
        this.getForwardVector(this._forward);
        this.getRightVector(this._right);

        // Zero out Y component for forward and right vectors
        // This keeps movement horizontal regardless of where we're looking
        this._forward[1] = 0;
        this._right[1] = 0;

        // Normalize the vectors after zeroing Y
        vec3.normalize(this._forward, this._forward);
        vec3.normalize(this._right, this._right);

        // Process keyboard input
        if (inputManager.isKeyPressed(Keys.W)) {
            vec3.scaleAndAdd(movement, movement, this._forward, moveAmount);
        }
        if (inputManager.isKeyPressed(Keys.S)) {
            vec3.scaleAndAdd(movement, movement, this._forward, -moveAmount);
        }
        if (inputManager.isKeyPressed(Keys.A)) {
            vec3.scaleAndAdd(movement, movement, this._right, -moveAmount);
        }
        if (inputManager.isKeyPressed(Keys.D)) {
            vec3.scaleAndAdd(movement, movement, this._right, moveAmount);
        }
        if (inputManager.isKeyPressed(Keys.SPACE)) {
            vec3.scaleAndAdd(movement, movement, this._up, moveAmount);
        }
        if (inputManager.isKeyPressed(Keys.SHIFT)) {
            vec3.scaleAndAdd(movement, movement, this._up, -moveAmount);
        }

        // Apply movement if any
        if (vec3.length(movement) > 0) {
            this.translateWorld(movement[0], movement[1], movement[2]);
        }
    }

    updateRotation() {
        const dx = inputManager.getMouseDeltaX();
        const dy = inputManager.getMouseDeltaY();

        if (dx !== 0 || dy !== 0) {
            // Convert mouse movement to radians
            // Mouse delta * lookSpeed gives us degrees, then convert to radians
            const deltaYaw = -(dx * this._lookSpeed) * Math.PI / 180;
            const deltaPitch = -(dy * this._lookSpeed) * Math.PI / 180;

            this._yaw += deltaYaw;
            this._pitch += deltaPitch;

            // Clamp pitch
            this._pitch = Math.max(
                this._pitchLimit.min,
                Math.min(this._pitchLimit.max, this._pitch)
            );

            // Values are already in radians for Node3D
            this.setRotation(this._pitch, this._yaw, 0);
        }
    }


    // Configuration methods
    setMoveSpeed(speed) {
        this._moveSpeed = speed;
        return this;
    }

    setLookSpeed(speed) {
        this._lookSpeed = speed;
        return this;
    }

    setPitchLimits(minPitch, maxPitch) {
        this._pitchLimit.min = minPitch;
        this._pitchLimit.max = maxPitch;
        return this;
    }

    // Getters
    get moveSpeed() {
        return this._moveSpeed;
    }

    get lookSpeed() {
        return this._lookSpeed;
    }

    get pitch() {
        return this._pitch;
    }

    get yaw() {
        return this._yaw;
    }

    // Movement vector getters
    getMovementVectors() {
        return {
            forward: [...this._forward],
            right: [...this._right],
            up: [...this._up]
        };
    }
}

export default FPSCamera;