import Model3D from "../nodes-core/model3d.js";

class Bullet extends Model3D {
    constructor(gl) {
        super(gl);
        this.name = "Bullet";
        this._speed = 10.0;  // Bullet speed, tune as needed
        this._maxLifeTime = 2.0;
        this._currentLifeTime = this._maxLifeTime;
    }

    async onInit(gl) {
        await super.onInit(gl);
        await this.loadModel('./assets/models/bullet/bullet.obj');
        await this.setShaderFromFile('./shaders/phong.glsl');
        this.setScale(0.1, 0.1, 0.1);
    }

    update(deltaTime) {
        if (this.updateLifetime(deltaTime)) {
            super.update(deltaTime);
            this.updateMovement(deltaTime);
        }
    }

    updateLifetime(deltaTime) {
        this._currentLifeTime -= deltaTime;
        if (this._currentLifeTime <= 0) {
            this.destroy();
            return false;
        }
        return true;
    }

    updateMovement(deltaTime) {
        const forward = this._forwardDirection; // Get world-space forward vector
        const movement = forward.map(component => component * this._speed * deltaTime);
        this.translate(...movement); // Move the bullet in the forward direction
    }

    setForwardDirection(direction) {
        // Normalize direction and set it to the bullet's movement direction
        const normalizedDirection = glMatrix.vec3.create();
        glMatrix.vec3.normalize(normalizedDirection, direction);
        this._forwardDirection = normalizedDirection;
    }
}

export default Bullet;
