import Node3D from './node3d.js';
import OBJLoader from "../util/obj_loader.js";
import RAPIER from '@dimforge/rapier3d-compat';
import physicsManager from '../physics_manager.js';
import {quat} from 'gl-matrix';

class PhysicsBody3D extends Node3D {
    constructor() {
        super();
        this.name = "PhysicsBody3D";

        // Physics properties
        this._rigidBody = null;
        this._collider = null;
        this._colliderDesc = null;

        // Properties that derived classes might want to override
        this._mass = 1.0;
        this._friction = 0.5;
        this._restitution = 0.2;
        this._linearDamping = 0.1;
        this._angularDamping = 0.1;

        this._tempPosition = [0, 0, 0];
        this._tempRotation = [0, 0, 0, 1];
    }

    async init() {
        if (this._colliderDesc) {
            await this._initPhysics();
        }
        await super.init();
    }

    // Base property setters
    setFriction(friction) {
        this._friction = friction;
        if (this._collider) {
            this._collider.setFriction(friction);
        }
        return this;
    }

    setRestitution(restitution) {
        this._restitution = restitution;
        if (this._collider) {
            this._collider.setRestitution(restitution);
        }
        return this;
    }

    setMass(mass) {
        this._mass = mass;
        if (this._rigidBody) {
            this._updatePhysicsProperties();
        }
        return this;
    }

    setDamping(linear, angular) {
        this._linearDamping = linear;
        this._angularDamping = angular;
        if (this._rigidBody) {
            this._rigidBody.setLinearDamping(linear);
            this._rigidBody.setAngularDamping(angular);
        }
        return this;
    }

    // Collision shape setters
    async setCollisionFromOBJ(objPath, scale = 1.0) {
        try {
            const response = await fetch(objPath);
            const objText = await response.text();
            const modelData = OBJLoader.parse(objText);

            const vertices = new Float32Array(modelData.positions.length);
            for (let i = 0; i < modelData.positions.length; i++) {
                vertices[i] = modelData.positions[i] * scale;
            }

            this._colliderDesc = RAPIER.ColliderDesc.convexHull(vertices);

            if (this._colliderDesc === null) {
                throw new Error('Failed to create convex hull from mesh');
            }

            if (this.initialized) {
                await this._initPhysics();
            }
            return this;
        } catch (error) {
            console.error('Error loading collision mesh:', error);
            throw error;
        }
    }

    setBoxShape(sx = 1, sy = 1, sz = 1) {
        this._colliderDesc = RAPIER.ColliderDesc.cuboid(sx/2, sy/2, sz/2);

        if (this.initialized) {
            return this._initPhysics();
        }
        return this;
    }

    // Protected methods for derived classes to override
    _createRigidBodyDesc() {
        return RAPIER.RigidBodyDesc.dynamic()
            .setLinearDamping(this._linearDamping)
            .setAngularDamping(this._angularDamping);
    }

    _configureColliderDesc() {
        this._colliderDesc.setDensity(this._mass)
            .setFriction(this._friction)
            .setRestitution(this._restitution);
    }

    async _initPhysics() {
        if (!physicsManager.initialized || !this._colliderDesc) {
            console.error('Physics manager not initialized or no collider description set');
            return;
        }

        this._cleanupPhysics();

        // Create rigid body with type determined by derived class
        const rigidBodyDesc = this._createRigidBodyDesc();

        // Set initial transform
        const worldPos = this.getPositionWorld();
        const worldRot = this._worldRotationQuat;

        rigidBodyDesc.setTranslation(worldPos[0], worldPos[1], worldPos[2]);
        rigidBodyDesc.setRotation({ x: worldRot[0], y: worldRot[1], z: worldRot[2], w: worldRot[3] });

        // Create the rigid body
        this._rigidBody = physicsManager.world.createRigidBody(rigidBodyDesc);

        // Configure and create collider
        this._configureColliderDesc();
        this._collider = physicsManager.world.createCollider(
            this._colliderDesc,
            this._rigidBody
        );
    }

    update(deltaTime) {
        if (this._rigidBody && !this.isStatic) {
            // Get the updated transform from physics
            const position = this._rigidBody.translation();
            const rotation = this._rigidBody.rotation();

            // Update Node3D transform without triggering physics updates
            this._updateFromPhysics = true;
            this.setPositionWorld(position.x, position.y, position.z);
            quat.set(this._localRotationQuat, rotation.x, rotation.y, rotation.z, rotation.w);
            this._updateFromPhysics = false;
        }

        super.update(deltaTime);
    }

    _cleanupPhysics() {
        if (this._rigidBody) {
            physicsManager.world.removeRigidBody(this._rigidBody);
            this._rigidBody = null;
            this._collider = null;
        }
    }


    onDestroy() {
        this._cleanupPhysics();
        super.onDestroy();
    }

    get isStatic() {
        return false;
    }
}

export default PhysicsBody3D;