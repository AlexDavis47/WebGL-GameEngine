import Model3D from "../nodes-core/model3d.js";

class Bullet extends Model3D {
    constructor() {
        super(gl);
        this.name = "Bullet";
        this._speed = 10.0;
        this._maxLifeTime = 2.0;
        this._currentLifeTime = this._maxLifeTime;
    }

    ready(gl) {
        super.ready(gl);
        this.loadModel('./assets/models/bullet/bullet.obj');
        this.setShaderFromFile('./assets/shaders/phong.glsl');
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
        const forward = this.getForwardVector();
        const movement = forward.map(component => component * this._speed * deltaTime);
        this.translateWorld(...movement); // Use world-space translation for consistent movement
    }

}

export default Bullet;
