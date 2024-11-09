import PhysicsBody3D from './physics_body_3d.js';

class CharacterBody3D extends PhysicsBody3D {
    constructor() {
        super();
        this.name = "CharacterBody3D";

        // Core movement properties
        this.velocity = vec3.create();
        this.upDirection = vec3.fromValues(0, 1, 0);

        // Physics state
        this.isOnFloor = false;
        this.groundNormal = vec3.fromValues(0, 1, 0);
        this.groundCheckDistance = 1.0;
    }

    init(gl) {
        if (!this._collisionShape) {
            this.setCapsuleShape(0.5, 1.8);
        }

        const result = super.init(gl);

        if (this._body) {
            this._body.setAngularFactor(0, 1, 0);
            this._body.setCollisionFlags(2);
            this._body.setActivationState(4);
            this._body.setFriction(1.0);
        }

        return result;
    }

    setCapsuleShape(radius, height) {
        if (this._collisionShape) {
            Ammo.destroy(this._collisionShape);
        }
        this._collisionShape = new Ammo.btCapsuleShape(radius, Math.max(height - (radius * 2), 0));
        return this;
    }

    update(deltaTime) {
        if (!this._body) return super.update(deltaTime);

        // Keep character upright while preserving yaw
        const transform = new Ammo.btTransform();
        this._motionState.getWorldTransform(transform);
        const rot = transform.getRotation();
        const currentYaw = Math.atan2(2.0 * (rot.w() * rot.y()), 1.0 - 2.0 * (rot.y() * rot.y()));
        const uprightQuat = new Ammo.btQuaternion(0, Math.sin(currentYaw/2), 0, Math.cos(currentYaw/2));
        transform.setRotation(uprightQuat);

        this._body.setWorldTransform(transform);
        this._motionState.setWorldTransform(transform);

        // Update movement
        this.moveAndSlide(deltaTime);

        Ammo.destroy(transform);
        Ammo.destroy(uprightQuat);

        return super.update(deltaTime);
    }

    moveAndSlide(deltaTime) {
        const scene = this.getRootNode();
        if (!scene?._physicsWorld) return;

        const transform = new Ammo.btTransform();
        this._motionState.getWorldTransform(transform);
        const pos = transform.getOrigin();

        // Ground check
        const start = new Ammo.btVector3(pos.x(), pos.y() + 0.1, pos.z());
        const end = new Ammo.btVector3(pos.x(), pos.y() - this.groundCheckDistance, pos.z());
        const callback = new Ammo.ClosestRayResultCallback(start, end);

        scene._physicsWorld.rayTest(start, end, callback);

        // Debug output
        console.log("Ground check from:", pos.y() + 0.1, "to:", pos.y() - this.groundCheckDistance);
        console.log("Current Y position:", pos.y());
        console.log("Has hit:", callback.hasHit());

        if (callback.hasHit()) {
            const hitPoint = callback.get_m_hitPointWorld();
            console.log("Hit point Y:", hitPoint.y());
            console.log("Distance to ground:", pos.y() - hitPoint.y());

            const distanceToGround = pos.y() - hitPoint.y();
            this.isOnFloor = distanceToGround < 1.0; // Adjust this threshold as needed

            if (this.isOnFloor) {
                const normal = callback.get_m_hitNormalWorld();
                this.groundNormal[0] = normal.x();
                this.groundNormal[1] = normal.y();
                this.groundNormal[2] = normal.z();

                // Stop downward movement when on ground
                if (this.velocity[1] < 0) {
                    this.velocity[1] = 0;
                }

                // Keep consistent height above ground
                const targetHeight = hitPoint.y() + 0.9;
                if (Math.abs(pos.y() - targetHeight) > 0.01) {
                    pos.setY(targetHeight);
                }
            }
        } else {
            this.isOnFloor = false;
        }

        // Calculate movement
        const movement = vec3.scale(
            vec3.create(),
            this.velocity,
            deltaTime
        );

        // Move position
        pos.setValue(
            pos.x() + movement[0],
            pos.y() + movement[1],
            pos.z() + movement[2]
        );

        // Apply movement
        this._body.setWorldTransform(transform);
        this._motionState.setWorldTransform(transform);

        // Cleanup
        Ammo.destroy(transform);
        Ammo.destroy(start);
        Ammo.destroy(end);
        Ammo.destroy(callback);
    }

    setVelocity(x, y, z) {
        vec3.set(this.velocity, x, y, z);
        return this;
    }

    getVelocity() {
        return vec3.clone(this.velocity);
    }

    isOnGround() {
        return this.isOnFloor;
    }
}

export default CharacterBody3D;