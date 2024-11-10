import KinematicBody3D from '../nodes-core/kinematic_body_3d.js';
import Camera3D from '../nodes-core/camera3d.js';
import Gun from './gun.js';
import { vec3 } from 'gl-matrix';
import inputManager, { Keys } from "../input_manager.js";
import AudioReceiver from "../nodes-core/audio_receiver.js";

class Player extends KinematicBody3D {
    constructor() {
        super();
        this.name = "Player";

        // Movement properties
        this._maxGroundSpeed = 10.0;
        this._groundAcceleration = 50.0;
        this._groundFriction = 60.0;
        this._maxAirSpeed = 10.0;
        this._airAcceleration = 35.0;
        this._airFriction = 0.0;
        this._jumpVelocity = 15.0;
        this._gravity = -20.0;

        // Timers for jump and coyote time
        this._coyoteTime = 0.1; // seconds
        this._jumpGraceTime = 0.1; // seconds
        this._coyoteTimer = 0.0;
        this._jumpGraceTimer = 0.0;

        // Rotation properties
        this._rotationSpeed = 0.1;
        this._yaw = 0;
        this._pitch = 0;
        this._pitchLimit = { min: -89, max: 89 };

        // Camera setup
        this._camera = new Camera3D();
        this._camera.setPerspective(70, 0.1, 500000);
        this._camera.setPosition(0, 1.7, 0); // camera height
        this.addChild(this._camera);

        // Gun setup
        this._gun = new Gun();
        this._camera.addChild(this._gun);
        this._gun
            .setPositionX(0.4)
            .setPositionY(-0.3)
            .setPositionZ(-0.4)
            .setScaleUniform(0.05);

        const audio_receiver = new AudioReceiver();
        this._camera.addChild(audio_receiver);

        // Movement direction vector
        this._inputVector = vec3.create();
    }

    handleRotation() {
        const dx = inputManager.getMouseDeltaX();
        const dy = inputManager.getMouseDeltaY();

        if (dx !== 0 || dy !== 0) {
            // Update yaw (horizontal rotation) - applied to player
            this._yaw -= dx * this._rotationSpeed;
            this.setRotation(0, this._yaw, 0);

            // Update pitch (vertical rotation) - applied to camera
            this._pitch = Math.max(
                this._pitchLimit.min,
                Math.min(this._pitchLimit.max, this._pitch - dy * this._rotationSpeed)
            );
            this._camera.setRotation(this._pitch, 0, 0);
        }
    }

    handleMovement(deltaTime) {
        // Get current velocity
        const velocity = this.getVelocity();

        // Apply gravity if not on the floor
        if (!this.isOnFloor()) {
            velocity[1] += this._gravity * deltaTime;
        }

        // Handle jumping (on the floor)
        if (inputManager.isKeyPressed(Keys.SPACE) && this.isOnFloor()) {
            velocity[1] = this._jumpVelocity;
            this._jumpGraceTimer = 0;
            this._coyoteTimer = 0;
        }

        // Handle coyote time and jump grace time (update timers)
        if (!this.isOnFloor()) {
            if (this._jumpGraceTimer > 0) {
                this._jumpGraceTimer -= deltaTime;
            }

            if (this._coyoteTimer > 0) {
                this._coyoteTimer -= deltaTime;
            }
        } else {
            this._coyoteTimer = this._coyoteTime; // Reset coyote time when on the floor
        }

        // Get movement input vector (WASD keys)
        const moveDir = vec3.create();
        if (inputManager.isKeyPressed(Keys.W)) moveDir[2] -= 1; // Forward
        if (inputManager.isKeyPressed(Keys.S)) moveDir[2] += 1; // Backward
        if (inputManager.isKeyPressed(Keys.A)) moveDir[0] -= 1; // Left
        if (inputManager.isKeyPressed(Keys.D)) moveDir[0] += 1; // Right

        let friction = this.isOnFloor() ? this._groundFriction : this._airFriction;

        // If there is any movement input, normalize the direction vector
        if (vec3.length(moveDir) > 0) {
            vec3.normalize(moveDir, moveDir); // Normalize the direction vector

            // Get the forward and right vectors based on the player's yaw (camera orientation)
            const forward = this.getForwardVector();
            const right = this.getRightVector();

            // Calculate movement direction relative to the camera
            vec3.scale(forward, forward, -moveDir[2]); // Negative because forward is -Z
            vec3.scale(right, right, moveDir[0]);

            // Combine forward and right movement directions
            vec3.add(moveDir, forward, right);
            vec3.normalize(moveDir, moveDir); // Re-normalize the resulting vector to ensure unit length

            // Adjust movement speed based on whether the player is on the ground or in the air
            let maxSpeed = this.isOnFloor() ? this._maxGroundSpeed : this._maxAirSpeed;
            let acceleration = this.isOnFloor() ? this._groundAcceleration : this._airAcceleration;

            // Smoothly apply acceleration towards target velocity
            velocity[0] = this.moveToward(velocity[0], moveDir[0] * maxSpeed, acceleration * deltaTime);
            velocity[2] = this.moveToward(velocity[2], moveDir[2] * maxSpeed, acceleration * deltaTime);
        } else {
            // No movement input, apply friction (decelerate)
            velocity[0] = velocity[0] * (1 - friction * deltaTime);
            velocity[2] = velocity[2] * (1 - friction * deltaTime);
        }

        // Update velocity
        this.setVelocity(velocity[0], velocity[1], velocity[2]);

        // Apply movement using character controller (move and slide)
        this.moveAndSlide(deltaTime);
    }

    // Move towards target value with smooth interpolation
    moveToward(current, target, maxChange) {
        const delta = target - current;
        if (Math.abs(delta) <= maxChange) {
            return target;
        } else {
            return current + Math.sign(delta) * maxChange;
        }
    }



    update(deltaTime) {
        if (inputManager.isPointerLockActive()) {
            this.handleRotation();
            this.handleMovement(deltaTime);
        }

        super.update(deltaTime);
    }

    // Accessors
    getCamera() {
        return this._camera;
    }

    setMoveSpeed(speed) {
        this._acceleration = speed;
        return this;
    }

    setRotationSpeed(speed) {
        this._rotationSpeed = speed;
        return this;
    }

    setJumpVelocity(velocity) {
        this._jumpVelocity = velocity;
        return this;
    }

    setGravity(gravity) {
        this._gravity = gravity;
        return this;
    }

    setPitchLimits(min, max) {
        this._pitchLimit.min = min;
        this._pitchLimit.max = max;
        return this;
    }
}

export default Player;
