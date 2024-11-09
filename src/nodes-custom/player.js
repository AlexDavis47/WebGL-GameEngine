import KinematicBody3D from '../nodes-core/kinematic_body_3d.js';
import Camera3D from '../nodes-core/camera3d.js';
import Gun from './gun.js';
import { vec3, quat } from 'gl-matrix';
import inputManager, {Keys} from '../input_manager.js';

class Player extends KinematicBody3D {
    constructor() {
        super();
        this.name = "Player";

        // Player movement properties
        this._moveSpeed = 5.0;
        this._jumpVelocity = 5.0;

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

    async init() {
        await super.init();

        // Configure the character controller with sensible defaults
        if (this._characterController) {
            // Set up vector (Y-up in this case)
            this._characterController.setUp({ x: 0.0, y: 1.0, z: 0.0 });

            // Configure slope handling
            this._characterController.setMaxSlopeClimbAngle(Math.PI / 4);    // 45 degrees
            this._characterController.setMinSlopeSlideAngle(Math.PI / 3);    // 60 degrees

            // Configure auto-stepping (for stairs/small obstacles)
            this._characterController.enableAutostep(0.5, 0.2, true);

            // Enable ground snapping
            this._characterController.enableSnapToGround(0.1);

            // Enable interaction with dynamic bodies
            this._characterController.setApplyImpulsesToDynamicBodies(true);
        }
    }

    update(deltaTime) {
        if (inputManager.isPointerLockActive()) {
            this.handleRotation();
            this.handleMovement(deltaTime);
        }

        super.update(deltaTime);
    }

    handleRotation() {
        const dx = inputManager.getMouseDeltaX();
        const dy = inputManager.getMouseDeltaY();

        if (dx !== 0 || dy !== 0) {
            // Update yaw (player rotation)
            this._yaw -= dx * this._rotationSpeed;
            this.setRotation(0, this._yaw, 0);

            // Update pitch (camera rotation)
            this._pitch = Math.max(
                this._pitchLimit.min,
                Math.min(this._pitchLimit.max, this._pitch - dy * this._rotationSpeed)
            );
            this._camera.setRotation(this._pitch, 0, 0);
        }
    }

    handleMovement(deltaTime) {
        if (!this._characterController || !this._collider) return;

        // Calculate desired movement direction
        const moveDir = vec3.create();
        if (inputManager.isKeyPressed(Keys.W)) moveDir[2] -= 1;
        if (inputManager.isKeyPressed(Keys.S)) moveDir[2] += 1;
        if (inputManager.isKeyPressed(Keys.A)) moveDir[0] -= 1;
        if (inputManager.isKeyPressed(Keys.D)) moveDir[0] += 1;

        // Apply rotation to movement direction
        if (vec3.length(moveDir) > 0) {
            vec3.normalize(moveDir, moveDir);
            const rotationQuat = quat.create();
            quat.setAxisAngle(rotationQuat, [0, 1, 0], this._yaw * Math.PI / 180);
            vec3.transformQuat(moveDir, moveDir, rotationQuat);
        }

        // Scale by speed and delta time
        const movement = {
            x: moveDir[0] * this._moveSpeed * deltaTime,
            y: 0,
            z: moveDir[2] * this._moveSpeed * deltaTime
        };

        // Add jump velocity if space is pressed
        if (inputManager.isKeyPressed(Keys.SPACE)) {
            movement.y = this._jumpVelocity * deltaTime;
        }

        // Use Rapier's character controller to compute movement
        this._characterController.computeColliderMovement(
            this._collider,
            movement
        );

        // Get and apply the corrected movement
        const correctedMovement = this._characterController.computedMovement();
        const currentPos = this._rigidBody.translation();

        this._rigidBody.setNextKinematicTranslation({
            x: currentPos.x + correctedMovement.x,
            y: currentPos.y + correctedMovement.y,
            z: currentPos.z + correctedMovement.z
        });
    }

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

    setPitchLimits(min, max) {
        this._pitchLimit.min = min;
        this._pitchLimit.max = max;
        return this;
    }

    setJumpVelocity(velocity) {
        this._jumpVelocity = velocity;
        return this;
    }
}

export default Player;