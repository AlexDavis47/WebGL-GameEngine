import Model3D from "../nodes-core/model3d.js";
import Bullet from "../nodes-custom/bullet.js";
import inputManager from "../input_manager.js";
import {vec3} from "gl-matrix";
import AudioPlayer from "../nodes-core/audio_player.js";

class Gun extends Model3D {
    constructor() {
        super();
        this.name = "Gun";

        // Current actual rotation (separate from the transform rotation)
        this._currentRotation = {
            x: 0,
            y: 0
        };

        // Target rotation we're lerping towards
        this._targetRotation = {
            x: 0,
            y: 0
        };

        // Current rotation velocity
        this._rotationVelocity = {
            x: 0,
            y: 0
        };

        // Constants for tuning the feel
        this._config = {
            MOUSE_SENSITIVITY: 0.0005,
            SPRING_STRENGTH: 5.0,
            DAMPING: 0.6,
            MAX_ROTATION: 0.4,
            RETURN_FORCE: 6.0,    // Constant force pulling back to center
            RECOIL: {
                IMMEDIATE: 0.15,  // Immediate kick up
                SUSTAINED: 0.05   // Slight sustained aim up
            },
            RETURN_RATE: 0.95     // Rate at which target rotation returns to center
        };

        this._audioPlayer = new AudioPlayer();
        this.addChild(this._audioPlayer);
    }

    playSound() {
        // Only play if audio system is unlocked
        this._audioPlayer.play();
    }


    async ready() {
        super.ready();

        // Preload the gun sound
        await this._audioPlayer.loadSound('./assets/sounds/bullet.mp3', {
            loop: false,
            volume: 0.3
        });

        await this.loadModel('./assets/models/gun/gun.obj');
        await this.setShaderFromFile('./assets/shaders/phong.glsl');
    }

    update(deltaTime) {
        this.updateGunPhysics(deltaTime);
        this.handleInput();
        super.update(deltaTime);
    }

    updateGunPhysics(deltaTime) {
        // Get mouse movement
        const deltaX = inputManager.getMouseDeltaX();
        const deltaY = inputManager.getMouseDeltaY();

        // Update target rotation based on mouse movement
        this._targetRotation.y -= deltaX * this._config.MOUSE_SENSITIVITY;
        this._targetRotation.x -= deltaY * this._config.MOUSE_SENSITIVITY;

        // Clamp target rotations
        this._targetRotation.x = Math.max(
            -this._config.MAX_ROTATION,
            Math.min(this._config.MAX_ROTATION, this._targetRotation.x)
        );
        this._targetRotation.y = Math.max(
            -this._config.MAX_ROTATION,
            Math.min(this._config.MAX_ROTATION, this._targetRotation.y)
        );

        // Calculate forces
        const forces = {
            x: this.calculateRotationForces(
                this._targetRotation.x,
                this._currentRotation.x
            ),
            y: this.calculateRotationForces(
                this._targetRotation.y,
                this._currentRotation.y
            )
        };

        // Update velocities with forces
        this._rotationVelocity.x += forces.x * deltaTime;
        this._rotationVelocity.y += forces.y * deltaTime;

        // Apply damping
        this._rotationVelocity.x *= this._config.DAMPING;
        this._rotationVelocity.y *= this._config.DAMPING;

        // Update current rotation
        this._currentRotation.x += this._rotationVelocity.x;
        this._currentRotation.y += this._rotationVelocity.y;

        // Apply the rotation to the transform (convert to degrees)
        this.setRotation(
            this._currentRotation.x * 180 / Math.PI,
            this._currentRotation.y * 180 / Math.PI,
            0
        );

        // Apply return force to target rotation
        this._targetRotation.x *= this._config.RETURN_RATE;
        this._targetRotation.y *= this._config.RETURN_RATE;
    }

    calculateRotationForces(targetRotation, currentRotation) {
        // Spring force (towards target)
        const springForce = (targetRotation - currentRotation) * this._config.SPRING_STRENGTH;

        // Return force (towards center)
        const returnForce = -currentRotation * this._config.RETURN_FORCE;

        return springForce + returnForce;
    }

    handleInput() {
        if (inputManager.isMouseButtonJustPressed(0)) {
            this.shoot();
        }
    }

    shoot() {
        this._rotationVelocity.x += this._config.RECOIL.IMMEDIATE;
        this._targetRotation.x += this._config.RECOIL.SUSTAINED;

        const bullet = new Bullet();

        // Get gun's world position and forward direction
        const worldPos = this.getPositionWorld();
        const forward = this.getForwardVector();

        // Now set its position and orientation
        bullet.setPositionWorld(worldPos[0], worldPos[1], worldPos[2]);

        // Calculate the target point by adding the forward vector to the position
        const targetPoint = vec3.create();
        vec3.add(targetPoint, worldPos, forward);

        // Make bullet look at the target point
        bullet.lookAt(targetPoint);

        bullet.translate(0.1, 0.15, -0.8);

        this.getRootNode().addChild(bullet);

        this.playSound();
    }


    // Configuration setters
    setMouseSensitivity(value) {
        this._config.MOUSE_SENSITIVITY = value;
        return this;
    }

    setSpringStrength(value) {
        this._config.SPRING_STRENGTH = value;
        return this;
    }

    setDamping(value) {
        this._config.DAMPING = value;
        return this;
    }

    setMaxRotation(value) {
        this._config.MAX_ROTATION = value;
        return this;
    }

    setReturnForce(value) {
        this._config.RETURN_FORCE = value;
        return this;
    }
}

export default Gun;