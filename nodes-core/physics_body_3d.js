import Node3D from './node3d.js';
import OBJLoader from "../util/obj_loader.js";

class PhysicsBody3D extends Node3D {
    constructor() {
        super();
        this.name = "PhysicsBody3D";

        // Physics properties
        this._body = null;
        this._mass = 1.0;
        this._friction = 0.5;
        this._rollingFriction = 0.1;
        this._restitution = 0.2;
        this._linearDamping = 0.1;
        this._angularDamping = 0.1;
        this._kinematic = false;

        // Internal properties
        this._motionState = null;
        this._collisionShape = null;
        this._rigidBodyInfo = null;
        this._transform = null;
        this._tempTransform = null;

        // Cached vectors for performance
        this._tempBtVector = new Ammo.btVector3();
        this._tempBtQuaternion = new Ammo.btQuaternion();
    }

    async init(gl) {
        await super.init(gl);
        if (this._collisionShape) {
            await this._initPhysics();
        }
    }

    // Physics property setters
    setMass(mass) {
        this._mass = mass;
        if (this._body) {
            // Update inertia for existing body
            const localInertia = new Ammo.btVector3(0, 0, 0);
            if (mass !== 0) {
                this._collisionShape.calculateLocalInertia(mass, localInertia);
            }
            this._body.setMassProps(mass, localInertia);
            this._body.updateInertiaTensor();
            Ammo.destroy(localInertia);
        }
        return this;
    }

    setFriction(friction) {
        this._friction = friction;
        if (this._body) {
            this._body.setFriction(friction);
        }
        return this;
    }

    setRestitution(restitution) {
        this._restitution = restitution;
        if (this._body) {
            this._body.setRestitution(restitution);
        }
        return this;
    }

    setDamping(linear, angular) {
        this._linearDamping = linear;
        this._angularDamping = angular;
        if (this._body) {
            this._body.setDamping(linear, angular);
        }
        return this;
    }

    setKinematic(kinematic) {
        this._kinematic = kinematic;
        if (this._body) {
            const flags = this._body.getCollisionFlags();
            if (kinematic) {
                this._body.setCollisionFlags(flags | 2); // 2 = CF_KINEMATIC_OBJECT
                this._body.setActivationState(4); // 4 = DISABLE_DEACTIVATION
            } else {
                this._body.setCollisionFlags(flags & ~2);
                this._body.setActivationState(1); // 1 = ACTIVE_TAG
            }
        }
        return this;
    }

    // Shape setters with proper cleanup
    async setCollisionFromOBJ(objPath, scale = 1.0) {
        try {
            const response = await fetch(objPath);
            const objText = await response.text();
            const modelData = OBJLoader.parse(objText);

            if (this._collisionShape) {
                Ammo.destroy(this._collisionShape);
            }

            const convexHull = new Ammo.btConvexHullShape();
            const tempBtVec = new Ammo.btVector3();

            for (let i = 0; i < modelData.positions.length; i += 3) {
                tempBtVec.setValue(
                    modelData.positions[i] * scale,
                    modelData.positions[i + 1] * scale,
                    modelData.positions[i + 2] * scale
                );
                convexHull.addPoint(tempBtVec, true); // true = recompute local AABB
            }

            Ammo.destroy(tempBtVec);
            this._collisionShape = convexHull;

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
        if (this._collisionShape) {
            Ammo.destroy(this._collisionShape);
        }
        const halfExtents = new Ammo.btVector3(sx/2, sy/2, sz/2);
        this._collisionShape = new Ammo.btBoxShape(halfExtents);
        Ammo.destroy(halfExtents);

        if (this.initialized) {
            this._initPhysics();
        }
        return this;
    }

    // Override Node3D transform methods to update physics state
    setPosition(x, y, z) {
        super.setPosition(x, y, z);
        this._updatePhysicsTransform();
        return this;
    }

    setRotation(x, y, z) {
        super.setRotation(x, y, z);
        this._updatePhysicsTransform();
        return this;
    }

    // Physics transform synchronization
    _updatePhysicsTransform() {
        if (!this._body || this._kinematic) return;

        if (!this._tempTransform) {
            this._tempTransform = new Ammo.btTransform();
        }

        // Get world position and rotation
        const worldPos = this.getPositionWorld();
        this._tempBtVector.setValue(worldPos[0], worldPos[1], worldPos[2]);

        // Convert quaternion to Bullet quaternion
        const worldRot = this._worldRotationQuat;
        this._tempBtQuaternion.setValue(
            worldRot[0], worldRot[1], worldRot[2], worldRot[3]
        );

        this._tempTransform.setIdentity();
        this._tempTransform.setOrigin(this._tempBtVector);
        this._tempTransform.setRotation(this._tempBtQuaternion);

        // Update motion state
        this._body.setWorldTransform(this._tempTransform);
        this._motionState.setWorldTransform(this._tempTransform);

        // Activate the body
        this._body.activate(true);
    }

    async _initPhysics() {
        const scene = this.getRootNode();
        if (!scene?._physicsWorld) {
            console.error('No physics world found in scene');
            return;
        }

        // Clean up existing physics objects
        this._cleanupPhysics();

        // Create transform
        this._transform = new Ammo.btTransform();
        this._transform.setIdentity();

        // Set initial position
        const worldPos = this.getPositionWorld();
        this._tempBtVector.setValue(worldPos[0], worldPos[1], worldPos[2]);
        this._transform.setOrigin(this._tempBtVector);

        // Set initial rotation
        this._tempBtQuaternion.setValue(
            this._worldRotationQuat[0],
            this._worldRotationQuat[1],
            this._worldRotationQuat[2],
            this._worldRotationQuat[3]
        );
        this._transform.setRotation(this._tempBtQuaternion);

        // Create motion state
        this._motionState = new Ammo.btDefaultMotionState(this._transform);

        // Calculate inertia
        const localInertia = new Ammo.btVector3(0, 0, 0);
        if (this._mass !== 0) {
            this._collisionShape.calculateLocalInertia(this._mass, localInertia);
        }

        // Create rigid body
        this._rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(
            this._mass,
            this._motionState,
            this._collisionShape,
            localInertia
        );

        this._body = new Ammo.btRigidBody(this._rigidBodyInfo);

        // Set physics properties
        this._body.setFriction(this._friction);
        this._body.setRollingFriction(this._rollingFriction);
        this._body.setRestitution(this._restitution);
        this._body.setDamping(this._linearDamping, this._angularDamping);

        // Handle kinematic state
        if (this._kinematic) {
            this._body.setCollisionFlags(this._body.getCollisionFlags() | 2);
            this._body.setActivationState(4);
        }

        // Add to physics world
        scene._physicsWorld.addRigidBody(this._body);

        Ammo.destroy(localInertia);
    }

    update(deltaTime) {
        if (this._body && !this._kinematic) {
            const ms = this._body.getMotionState();
            if (ms) {
                if (!this._tempTransform) {
                    this._tempTransform = new Ammo.btTransform();
                }
                ms.getWorldTransform(this._tempTransform);

                // Get position
                const origin = this._tempTransform.getOrigin();
                const rotation = this._tempTransform.getRotation();

                // Update Node3D transform without triggering physics updates
                this._updateFromPhysics = true;
                this.setPositionWorld(origin.x(), origin.y(), origin.z());
                glMatrix.quat.set(
                    this._localRotationQuat,
                    rotation.x(),
                    rotation.y(),
                    rotation.z(),
                    rotation.w()
                );
                this._updateFromPhysics = false;
            }
        }

        super.update(deltaTime);
    }

    _cleanupPhysics() {
        if (this._body) {
            const scene = this.getRootNode();
            if (scene?._physicsWorld) {
                scene._physicsWorld.removeRigidBody(this._body);
            }
            Ammo.destroy(this._body);
            Ammo.destroy(this._motionState);
            Ammo.destroy(this._rigidBodyInfo);
            if (this._transform) {
                Ammo.destroy(this._transform);
            }
            if (this._tempTransform) {
                Ammo.destroy(this._tempTransform);
            }
        }
    }

    onDestroy() {
        this._cleanupPhysics();
        if (this._collisionShape) {
            Ammo.destroy(this._collisionShape);
        }
        Ammo.destroy(this._tempBtVector);
        Ammo.destroy(this._tempBtQuaternion);
        super.onDestroy();
    }
}

export default PhysicsBody3D;