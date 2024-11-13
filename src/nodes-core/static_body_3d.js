/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
import PhysicsBody3D from './physics_body_3d.js';
import RAPIER from '@dimforge/rapier3d-compat';

class StaticBody3D extends PhysicsBody3D {
    constructor() {
        super();
        this.name = "StaticBody3D";
    }

    _createRigidBodyDesc() {
        return RAPIER.RigidBodyDesc.fixed();
    }

    _configureColliderDesc() {
        this._colliderDesc
            .setFriction(this._friction)
            .setRestitution(this._restitution);
    }

    get isStatic() {
        return true;
    }
}

export default StaticBody3D;