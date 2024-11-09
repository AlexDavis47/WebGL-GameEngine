import CharacterBody3D from '../nodes-core/character_body_3d.js';
import Camera3D from '../nodes-core/camera3d.js';
import Gun from './gun.js';

class Player extends CharacterBody3D {
    constructor() {
        super();
        this.name = "Player";

        // Player properties
        this._moveSpeed = 150.0;
        this._gravity = -20.0;
        this._jumpForce = 15.0;

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

    update(deltaTime) {
        if (isPointerLockActive()) {
            this.handleRotation();
        }
        this.handleMovement(deltaTime);

        super.update(deltaTime);
    }

    handleRotation() {
        const dx = getMouseDeltaX();
        const dy = getMouseDeltaY();

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
        // Get current velocity and preserve Y component (for gravity/jumping)
        const currentVelocity = this.getVelocity();
        let velocityY = currentVelocity[1];

        // Apply gravity
        if (!this.isOnGround()) {
            velocityY += this._gravity * deltaTime;
        }

        // Handle jumping
        if (inputManager.isKeyPressed(Keys.SPACE) && this.isOnGround()) {
            velocityY = this._jumpForce;
        }

        // Calculate movement direction
        const moveDir = vec3.create();

        if (inputManager.isKeyPressed(Keys.W)) moveDir[2] -= 1;
        if (inputManager.isKeyPressed(Keys.S)) moveDir[2] += 1;
        if (inputManager.isKeyPressed(Keys.A)) moveDir[0] -= 1;
        if (inputManager.isKeyPressed(Keys.D)) moveDir[0] += 1;

        // Apply movement in facing direction
        if (vec3.length(moveDir) > 0) {
            vec3.normalize(moveDir, moveDir);

            const rotationQuat = quat.create();
            quat.setAxisAngle(rotationQuat, [0, 1, 0], this._yaw * Math.PI / 180);
            vec3.transformQuat(moveDir, moveDir, rotationQuat);

            this.setVelocity(
                moveDir[0] * this._moveSpeed,
                velocityY,
                moveDir[2] * this._moveSpeed
            );
        } else {
            this.setVelocity(0, velocityY, 0);
        }
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

    setJumpForce(force) {
        this._jumpForce = force;
        return this;
    }
}

export default Player;