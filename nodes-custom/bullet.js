import Model3D from "../nodes-core/model3d.js";

class Bullet extends Model3D {
    constructor(gl) {
        super(gl);
        this.name = "Bullet";

        // Bullet properties
        this._speed = 10.0;
        this._maxLifeTime = 2.0;
        this._currentLifeTime = this._maxLifeTime;
    }

    async onInit(gl) {
        await super.onInit(gl);
        await this.loadModel('./assets/models/bullet/bullet.obj');
        await this.setShaderFromFile('./shaders/phong.glsl');  // Assuming you want to use phong shader
    }

    update(deltaTime) {
        // Handle lifetime first
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
        const forward = this.getForwardVector();
        const movement = forward.map(component => component * this._speed * deltaTime);
        this.translate(...movement);
    }

    // Configuration methods
    setSpeed(speed) {
        this._speed = speed;
        return this;
    }

    setLifeTime(time) {
        this._maxLifeTime = time;
        this._currentLifeTime = time;
        return this;
    }

    // Getters for bullet properties
    get speed() {
        return this._speed;
    }

    get lifeTime() {
        return this._currentLifeTime;
    }

    get maxLifeTime() {
        return this._maxLifeTime;
    }
}

export default Bullet;