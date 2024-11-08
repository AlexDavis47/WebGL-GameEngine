import Node3D from './node3d.js';
import OBJLoader from "../util/obj_loader.js";

class PhysicsBody3D extends Node3D {
    constructor() {
        super();
        this.name = "PhysicsBody3D";

        // Physics properties
        this._body = null;
        this._mass = 1.0;
        this._rigidBodyInfo = null;
        this._motionState = null;
        this._collisionShape = null;
    }

    async init(gl) {
        await super.init(gl);

        if (this._collisionShape) {
            await this._initPhysics();
        }
    }

    async setCollisionFromOBJ(objPath, scale = 1.0) {
        try {
            const response = await fetch(objPath);
            const objText = await response.text();
            const modelData = OBJLoader.parse(objText);

            const tmpBtVectors = [];

            for (let i = 0; i < modelData.positions.length; i += 3) {
                tmpBtVectors.push(
                    new Ammo.btVector3(
                        modelData.positions[i] * scale,
                        modelData.positions[i + 1] * scale,
                        modelData.positions[i + 2] * scale
                    )
                );
            }

            const convexHull = new Ammo.btConvexHullShape();
            for (let btVec of tmpBtVectors) {
                convexHull.addPoint(btVec);
            }

            tmpBtVectors.forEach(btVec => Ammo.destroy(btVec));

            this._collisionShape = convexHull;
            return this;
        } catch (error) {
            console.error('Error loading collision mesh:', error);
            throw error;
        }
    }

    setPlaneShape(normalX = 0, normalY = 1, normalZ = 0) {
        if (this._collisionShape) {
            Ammo.destroy(this._collisionShape);
        }
        this._collisionShape = new Ammo.btStaticPlaneShape(
            new Ammo.btVector3(normalX, normalY, normalZ),
            0
        );
        return this;
    }

    setBoxShape(sx = 1, sy = 1, sz = 1) {
        if (this._collisionShape) {
            Ammo.destroy(this._collisionShape);
        }
        const halfExtents = new Ammo.btVector3(sx/2, sy/2, sz/2);
        this._collisionShape = new Ammo.btBoxShape(halfExtents);
        Ammo.destroy(halfExtents);
        return this;
    }

    async _initPhysics() {
        const scene = this.getRootNode();
        if (!scene?._physicsWorld) {
            console.error('No physics world found in scene');
            return;
        }

        if (!this._collisionShape) {
            console.error('No collision shape set');
            return;
        }

        // Calculate inertia
        const localInertia = new Ammo.btVector3(0, 0, 0);
        if (this._mass !== 0) {
            this._collisionShape.calculateLocalInertia(this._mass, localInertia);
        }

        // Create motion state
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        const pos = this.getPositionWorld();
        transform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));

        // Set initial rotation from Node3D
        const q = new Ammo.btQuaternion(
            this._localRotationQuat[0],
            this._localRotationQuat[1],
            this._localRotationQuat[2],
            this._localRotationQuat[3]
        );
        transform.setRotation(q);
        Ammo.destroy(q);

        this._motionState = new Ammo.btDefaultMotionState(transform);


        // Create rigid body
        this._rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(
            this._mass,
            this._motionState,
            this._collisionShape,
            localInertia
        );

        this._body = new Ammo.btRigidBody(this._rigidBodyInfo);

        // Set additional properties
        this._body.setFriction(0.5);
        this._body.setRollingFriction(0.1);
        this._body.setRestitution(0.2);
        this._body.setDamping(0.1, 0.1);

        // If static, disable deactivation
        if (this._mass === 0) {
            this._body.setCollisionFlags(this._body.getCollisionFlags() | 1);
            this._body.setActivationState(4);
        }

        // Add to physics world
        scene._physicsWorld.addRigidBody(this._body);

        // Cleanup
        Ammo.destroy(transform);
        Ammo.destroy(localInertia);
    }

    async update(deltaTime) {
        if (this._body && this._mass !== 0) {
            const ms = this._body.getMotionState();
            if (ms) {
                const transform = new Ammo.btTransform();
                ms.getWorldTransform(transform);

                // Get position
                const origin = transform.getOrigin();
                const x = origin.x();
                const y = origin.y();
                const z = origin.z();

                // Get rotation
                const rotation = transform.getRotation();
                const qx = rotation.x();
                const qy = rotation.y();
                const qz = rotation.z();
                const qw = rotation.w();

                if (!isNaN(x) && !isNaN(y) && !isNaN(z) &&
                    !isNaN(qx) && !isNaN(qy) && !isNaN(qz) && !isNaN(qw)) {
                    this.setPositionWorld(x, y, z);
                    // Set quaternion rotation directly
                    glMatrix.quat.set(this._localRotationQuat, qx, qy, qz, qw);
                    this.setDirty();
                }

                Ammo.destroy(transform);
            }
        }

        await super.update(deltaTime);
    }
    setMass(mass) {
        this._mass = mass;
        return this;
    }

    onDestroy() {
        if (this._body) {
            const scene = this.getRootNode();
            if (scene?._physicsWorld) {
                scene._physicsWorld.removeRigidBody(this._body);
            }
            Ammo.destroy(this._body);
            Ammo.destroy(this._motionState);
            Ammo.destroy(this._rigidBodyInfo);
            if (this._collisionShape) {
                Ammo.destroy(this._collisionShape);
            }
        }

        super.onDestroy();
    }
}

export default PhysicsBody3D;