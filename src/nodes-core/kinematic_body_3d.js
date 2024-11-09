import PhysicsBody3D from './physics_body_3d.js';
import RAPIER from '@dimforge/rapier3d-compat';
import physicsManager from '../physics_manager.js';

class KinematicBody3D extends PhysicsBody3D {
    constructor() {
        super();
        this.name = "KinematicBody3D";

        // Character controller properties
        this._characterController = null;
        this._offset = 0.01; // Gap between character and environment

        // Movement settings
        this._maxClimbAngle = Math.PI / 4;  // 45 degrees
        this._minSlideAngle = Math.PI / 6;  // 30 degrees
        this._autoStepMaxHeight = 0.5;
        this._autoStepMinWidth = 0.2;
        this._enableAutoStepDynamic = true;
        this._snapToGroundDistance = 0.1;
    }

    _createRigidBodyDesc() {
        return RAPIER.RigidBodyDesc.kinematicPositionBased();
    }

    async _initPhysics() {
        await super._initPhysics();

        if (!this._characterController && physicsManager.world) {
            this._characterController = physicsManager.world.createCharacterController(this._offset);

            // Configure character controller
            this._characterController.setUp({ x: 0.0, y: 1.0, z: 0.0 });
            this._characterController.setMaxSlopeClimbAngle(this._maxClimbAngle);
            this._characterController.setMinSlopeSlideAngle(this._minSlideAngle);

            // Enable auto-stepping (for stairs and small obstacles)
            this._characterController.enableAutostep(
                this._autoStepMaxHeight,
                this._autoStepMinWidth,
                this._enableAutoStepDynamic
            );

            // Enable snapping to ground
            this._characterController.enableSnapToGround(this._snapToGroundDistance);

            // Enable pushing dynamic bodies
            this._characterController.setApplyImpulsesToDynamicBodies(true);
        }
    }

    // Movement method using character controller
    moveAndSlide(velocity, deltaTime) {
        if (!this._characterController || !this._collider) return;

        // Scale velocity by deltaTime
        const movement = {
            x: velocity[0] * deltaTime,
            y: velocity[1] * deltaTime,
            z: velocity[2] * deltaTime
        };

        // Compute movement taking into account obstacles
        this._characterController.computeColliderMovement(
            this._collider,
            movement
        );

        // Get the corrected movement
        const correctedMovement = this._characterController.computedMovement();

        // Apply the movement
        if (this._rigidBody) {
            const currentPos = this._rigidBody.translation();
            this._rigidBody.setNextKinematicTranslation({
                x: currentPos.x + correctedMovement.x,
                y: currentPos.y + correctedMovement.y,
                z: currentPos.z + correctedMovement.z
            });
        }

        // Handle collision events if needed
        for (let i = 0; i < this._characterController.numComputedCollisions(); i++) {
            const collision = this._characterController.computedCollision(i);
            this._handleCollision(collision);
        }
    }

    _handleCollision(collision) {
        // Override in derived classes to handle collisions
        // collision contains information about what was hit and where
    }

    // Configuration methods
    setMaxClimbAngle(angleRadians) {
        this._maxClimbAngle = angleRadians;
        if (this._characterController) {
            this._characterController.setMaxSlopeClimbAngle(angleRadians);
        }
        return this;
    }

    setMinSlideAngle(angleRadians) {
        this._minSlideAngle = angleRadians;
        if (this._characterController) {
            this._characterController.setMinSlopeSlideAngle(angleRadians);
        }
        return this;
    }

    setAutoStep(maxHeight, minWidth, enableDynamic = true) {
        this._autoStepMaxHeight = maxHeight;
        this._autoStepMinWidth = minWidth;
        this._enableAutoStepDynamic = enableDynamic;
        if (this._characterController) {
            this._characterController.enableAutostep(maxHeight, minWidth, enableDynamic);
        }
        return this;
    }

    setSnapToGround(distance) {
        this._snapToGroundDistance = distance;
        if (this._characterController) {
            this._characterController.enableSnapToGround(distance);
        }
        return this;
    }

    onDestroy() {
        if (this._characterController && physicsManager.world) {
            physicsManager.world.removeCharacterController(this._characterController);
            this._characterController = null;
        }
        super.onDestroy();
    }
}

export default KinematicBody3D;