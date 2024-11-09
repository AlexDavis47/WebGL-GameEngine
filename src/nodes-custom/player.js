import KinematicBody3D from '../nodes-core/kinematic_body_3d.js';
import Camera3D from '../nodes-core/camera3d.js';
import Gun from './gun.js';
import { vec3, quat } from 'gl-matrix';
import inputManager, {Keys} from "../input_manager.js";

class Player extends KinematicBody3D {
    constructor() {
        super();
        this.name = "Player";

        // Movement properties
        this._moveSpeed = 5.0;
        this._jumpVelocity = 8.0;
        this._gravity = -20.0;

        // Rotation properties
        this._rotationSpeed = 0.1;
        this._yaw = 0;
        this._pitch = 0;
        this._pitchLimit = {
            min: -89,
            max: 89
        };

        // Camera setup
        this._camera = new Camera3D();
        this._camera.setPerspective(70, 0.1, 500000);
        this._camera.setPosition(0, 1.7, 0);
        this.addChild(this._camera);

        // Gun setup
        this._gun = new Gun();
        this._camera.addChild(this._gun);
        this._gun
            .setPositionX(0.4)
            .setPositionY(-0.3)
            .setPositionZ(-0.4)
            .setScaleUniform(0.05);
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
        // Get current velocity and apply gravity
        const velocity = this.getVelocity();
        velocity[1] += this._gravity * deltaTime;

        // Handle jumping
        if (inputManager.isKeyPressed(Keys.SPACE) && this.isOnFloor()) {
            velocity[1] = this._jumpVelocity;
        }

        // Get movement input
        const moveDir = vec3.create();
        if (inputManager.isKeyPressed(Keys.W)) moveDir[2] -= 1;
        if (inputManager.isKeyPressed(Keys.S)) moveDir[2] += 1;
        if (inputManager.isKeyPressed(Keys.A)) moveDir[0] -= 1;
        if (inputManager.isKeyPressed(Keys.D)) moveDir[0] += 1;

        // If we have movement input
        if (vec3.length(moveDir) > 0) {
            // Normalize movement direction
            vec3.normalize(moveDir, moveDir);

            // Get the forward direction based on player's yaw
            const forward = this.getForwardVector();
            const right = this.getRightVector();

            // Calculate movement direction relative to camera
            vec3.scale(forward, forward, -moveDir[2]); // Negative because forward is -Z
            vec3.scale(right, right, moveDir[0]);

            // Combine the directions
            vec3.add(moveDir, forward, right);
            vec3.normalize(moveDir, moveDir);

            // Apply movement speed
            velocity[0] = moveDir[0] * this._moveSpeed;
            velocity[2] = moveDir[2] * this._moveSpeed;
        } else {
            // No movement input, stop horizontal movement
            velocity[0] = 0;
            velocity[2] = 0;
        }

        // Update velocity
        this.setVelocity(velocity[0], velocity[1], velocity[2]);

        // Apply movement using character controller
        this.moveAndSlide(deltaTime);
    }

    update(deltaTime) {
        if (inputManager.isPointerLockActive()) {
            this.handleRotation();
            this.handleMovement(deltaTime);
        }
        console.log(this.isOnFloor());
        super.update(deltaTime);
    }

    // Accessors
    getCamera() {
        return this._camera;
    }

    setMoveSpeed(speed) {
        this._moveSpeed = speed;
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