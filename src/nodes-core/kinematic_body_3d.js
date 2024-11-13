/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import PhysicsBody3D from './physics_body_3d.js';
import RAPIER from '@dimforge/rapier3d-compat';
import {vec3} from 'gl-matrix';
import physicsManager from "../physics_manager.js";

class KinematicBody3D extends PhysicsBody3D {
    constructor() {
        super();
        this.name = "KinematicBody3D";

        // Core movement properties
        this._velocity = vec3.create();
        this._hasUpwardsVelocity = false;

        // Character controller configuration
        this._characterControllerParams = {
            offset: 0.01,
            maxSlopeClimbAngle: Math.PI / 4,
            minSlopeSlideAngle: Math.PI / 3,
            autoStepMaxHeight: 0.5,
            autoStepMinWidth: 0.2,
            enableDynamicBodies: true,
            snapToGroundDistance: 0.01
        };

        // State flags
        this._isOnFloor = false;
        this._isOnWall = false;
        this._isOnCeiling = false;
    }

    async init() {
        await super.init();

        if (!this._characterController && physicsManager.world) {
            this._characterController = physicsManager.world.createCharacterController(
                this._characterControllerParams.offset
            );

            this._configureCharacterController();
        }
    }

    setCapsuleShape(radius, height) {
        this._colliderDesc = RAPIER.ColliderDesc.capsule(radius, height);

        if (this.initialized) {
            return this._initPhysics();
        }
        return this;
    }


    _configureCharacterController() {
        if (!this._characterController) return;

        const params = this._characterControllerParams;

        this._characterController.setUp({ x: 0.0, y: 1.0, z: 0.0 });
        this._characterController.setMaxSlopeClimbAngle(params.maxSlopeClimbAngle);
        this._characterController.setMinSlopeSlideAngle(params.minSlopeSlideAngle);
        this._characterController.enableAutostep(
            params.autoStepMaxHeight,
            params.autoStepMinWidth,
            params.enableDynamicBodies
        );
        this._characterController.enableSnapToGround(params.snapToGroundDistance);
        this._characterController.setApplyImpulsesToDynamicBodies(true);
    }

    moveAndSlide(deltaTime) {
        if (!this._characterController || !this._collider) return;

        // Scale velocity by deltaTime to get movement
        const movement = {
            x: this._velocity[0] * deltaTime,
            y: this._velocity[1] * deltaTime,
            z: this._velocity[2] * deltaTime
        };

        // Compute movement with physics
        this._characterController.computeColliderMovement( // This is move and slide?
            this._collider,
            movement
        );

        // Get the corrected movement
        const correctedMovement = this._characterController.computedMovement();

        // Apply the movement to our rigid body
        const currentPos = this._rigidBody.translation();

        // Set next position but maintain our own rotation
        this._rigidBody.setNextKinematicTranslation({
            x: currentPos.x + correctedMovement.x,
            y: currentPos.y + correctedMovement.y,
            z: currentPos.z + correctedMovement.z
        });

        // Kinematic body does not simulate physics,
        // Always update rotation to match our Node3D rotation
        const rotation = this._worldRotationQuat;
        this._rigidBody.setRotation({
            x: rotation[0],
            y: rotation[1],
            z: rotation[2],
            w: rotation[3]
        }, true);

        // Update collision states
        this._updateCollisionStates();
    }


    _createRigidBodyDesc() {
        // Create a kinematic body that's locked from physics rotation
        return RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setLinearDamping(this._linearDamping)
            .setAngularDamping(this._angularDamping)
            .lockRotations() // Lock physics from affecting rotation
            .enabledRotations(false, false, false); // Disable rotation on all axes
    }


    _updateCollisionStates() {
        this._isOnFloor = false;
        this._isOnWall = false;
        this._isOnCeiling = false;

        if (this._hasUpwardsVelocity) return;

        const numCollisions = this._characterController.numComputedCollisions();
        for (let i = 0; i < numCollisions; i++) {
            const collision = this._characterController.computedCollision(i);
            const normalY = collision.normal1.y;

            if (normalY > 0.7) { // cos(45°) ≈ 0.7
                this._isOnFloor = true;
            } else if (normalY < -0.7) {
                this._isOnCeiling = true;
            } else if (Math.abs(normalY) < 0.7) {
                this._isOnWall = true;
            }
        }
    }

    // Velocity methods
    setVelocity(x, y, z) {
        vec3.set(this._velocity, x, y, z);
        return this;
    }

    getVelocity() {
        return vec3.clone(this._velocity);
    }

    // Character controller configuration methods
    setAutoStep(maxHeight, minWidth, enableDynamic = true) {
        this._characterControllerParams.autoStepMaxHeight = maxHeight;
        this._characterControllerParams.autoStepMinWidth = minWidth;
        this._characterControllerParams.enableDynamicBodies = enableDynamic;

        if (this._characterController) {
            this._characterController.enableAutostep(maxHeight, minWidth, enableDynamic);
        }
        return this;
    }

    setMaxSlopeClimbAngle(angle) {
        this._characterControllerParams.maxSlopeClimbAngle = angle;
        if (this._characterController) {
            this._characterController.setMaxSlopeClimbAngle(angle);
        }
        return this;
    }

    setMinSlopeSlideAngle(angle) {
        this._characterControllerParams.minSlopeSlideAngle = angle;
        if (this._characterController) {
            this._characterController.setMinSlopeSlideAngle(angle);
        }
        return this;
    }

    setSnapToGround(distance) {
        this._characterControllerParams.snapToGroundDistance = distance;
        if (this._characterController) {
            this._characterController.enableSnapToGround(distance);
        }
        return this;
    }

    // State getters
    isOnFloor() { return this._isOnFloor; }
    isOnWall() { return this._isOnWall; }
    isOnCeiling() { return this._isOnCeiling; }

    onDestroy() {
        if (this._characterController && physicsManager.world) {
            physicsManager.world.removeCharacterController(this._characterController);
            this._characterController = null;
        }
        super.onDestroy();
    }
}

export default KinematicBody3D;