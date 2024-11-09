import Node from './node.js';
import QuaternionUtils from "../util/quaternion_utils.js";
import {vec3, mat4, quat} from "gl-matrix";

class Node3D extends Node {
    constructor() {
        super();
        this.name = "Node3D";

        // Transform components
        this._localPosition = vec3.create();
        this._localRotationQuat = quat.create();
        this._localScale = vec3.fromValues(1, 1, 1);

        // World transform components
        this._worldPosition = vec3.create();
        this._worldRotationQuat = quat.create();
        this._worldScale = vec3.fromValues(1, 1, 1);

        // Matrices
        this._localMatrix = mat4.create();
        this._worldMatrix = mat4.create();
        this._inverseWorldMatrix = mat4.create();

        // Flags
        this._dirty = true;
        this._inverseWorldDirty = true;
        this._isRoot = false;
    }

    // Local Position Methods
    setPosition(x, y, z) {
        vec3.set(this._localPosition, x, y, z);
        this.setDirty();
        return this;
    }

    setPositionX(x) {
        this._localPosition[0] = x;
        this.setDirty();
        return this;
    }

    setPositionY(y) {
        this._localPosition[1] = y;
        this.setDirty();
        return this;
    }

    setPositionZ(z) {
        this._localPosition[2] = z;
        this.setDirty();
        return this;
    }

    getPosition() {
        return vec3.clone(this._localPosition);
    }

    getPositionX() {
        return this._localPosition[0];
    }

    getPositionY() {
        return this._localPosition[1];
    }

    getPositionZ() {
        return this._localPosition[2];
    }

    // World Position Methods
    setPositionWorld(x, y, z) {
        if (!this.parent) {
            return this.setPosition(x, y, z);
        }

        // Check if parent is initialized
        if (!this.parent.initialized) {
            console.warn('Parent not initialized, setting local position directly');
            return this.setPosition(x, y, z);
        }

        const worldPos = vec3.fromValues(x, y, z);
        try {
            const parentInverse = this.parent.inverseWorldMatrix;
            if (!parentInverse) {
                console.warn('Parent inverse matrix not available, setting local position directly');
                return this.setPosition(x, y, z);
            }
            vec3.transformMat4(this._localPosition, worldPos, parentInverse);
            this.setDirty();
        } catch (error) {
            console.warn('Error transforming position, falling back to direct position', error);
            return this.setPosition(x, y, z);
        }
        return this;
    }

    getPositionWorld() {
        this.updateWorldMatrix();
        return vec3.clone(this._worldPosition);
    }

    // Local Rotation Methods (in degrees)
    setRotation(x, y, z) {
        const xRad = QuaternionUtils.toRadians(x);
        const yRad = QuaternionUtils.toRadians(y);
        const zRad = QuaternionUtils.toRadians(z);

        this._localRotationQuat = QuaternionUtils.fromEulerRadians(xRad, yRad, zRad);
        this.setDirty();
        return this;
    }

    setRotationX(degrees) {
        const [_, y, z] = this.getRotation();
        return this.setRotation(degrees, y, z);
    }

    setRotationY(degrees) {
        const [x, _, z] = this.getRotation();
        return this.setRotation(x, degrees, z);
    }

    setRotationZ(degrees) {
        const [x, y, _] = this.getRotation();
        return this.setRotation(x, y, degrees);
    }

    getRotation() {
        const [x, y, z] = QuaternionUtils.toEulerRadians(this._localRotationQuat);
        return [
            QuaternionUtils.toDegrees(x),
            QuaternionUtils.toDegrees(y),
            QuaternionUtils.toDegrees(z)
        ];
    }

    getRotationX() {
        return this.getRotation()[0];
    }

    getRotationY() {
        return this.getRotation()[1];
    }

    getRotationZ() {
        return this.getRotation()[2];
    }

    // World Rotation Methods (in degrees)
    setRotationWorld(x, y, z) {
        if (!this.parent) {
            return this.setRotation(x, y, z);
        }

        const xRad = QuaternionUtils.toRadians(x);
        const yRad = QuaternionUtils.toRadians(y);
        const zRad = QuaternionUtils.toRadians(z);

        const worldRot = QuaternionUtils.fromEulerRadians(xRad, yRad, zRad);
        const parentInverseRot = quat.create();
        quat.conjugate(parentInverseRot, this.parent._worldRotationQuat);
        quat.multiply(this._localRotationQuat, parentInverseRot, worldRot);

        this.setDirty();
        return this;
    }

    getWorldRotation() {
        this.updateWorldMatrix();
        const [x, y, z] = QuaternionUtils.toEulerRadians(this._worldRotationQuat);
        return [
            QuaternionUtils.toDegrees(x),
            QuaternionUtils.toDegrees(y),
            QuaternionUtils.toDegrees(z)
        ];
    }

    // Scale Methods
    setScale(x, y, z) {
        vec3.set(this._localScale, x, y, z);
        this.setDirty();
        return this;
    }

    setScaleX(x) {
        this._localScale[0] = x;
        this.setDirty();
        return this;
    }

    setScaleY(y) {
        this._localScale[1] = y;
        this.setDirty();
        return this;
    }

    setScaleZ(z) {
        this._localScale[2] = z;
        this.setDirty();
        return this;
    }

    setScaleUniform(scale) {
        return this.setScale(scale, scale, scale);
    }

    getScale() {
        return vec3.clone(this._localScale);
    }

    getScaleX() {
        return this._localScale[0];
    }

    getScaleY() {
        return this._localScale[1];
    }

    getScaleZ() {
        return this._localScale[2];
    }

    // Relative Transform Methods
    translate(x, y, z) {
        const translation = vec3.fromValues(x, y, z);
        vec3.transformQuat(translation, translation, this._localRotationQuat);
        vec3.add(this._localPosition, this._localPosition, translation);
        this.setDirty();
        return this;
    }

    translateWorld(x, y, z) {
        vec3.add(this._localPosition, this._localPosition, [x, y, z]);
        this.setDirty();
        return this;
    }

    rotate(x, y, z) {
        const xRad = QuaternionUtils.toRadians(x);
        const yRad = QuaternionUtils.toRadians(y);
        const zRad = QuaternionUtils.toRadians(z);

        const rotation = QuaternionUtils.fromEulerRadians(xRad, yRad, zRad);
        quat.multiply(this._localRotationQuat, this._localRotationQuat, rotation);

        this.setDirty();
        return this;
    }

    rotateAround(point, axis, degrees) {
        const rad = QuaternionUtils.toRadians(degrees);
        const worldPos = this.getPositionWorld();

        const rotation = quat.create();
        quat.setAxisAngle(rotation, axis, rad);

        vec3.subtract(worldPos, worldPos, point);
        vec3.transformQuat(worldPos, worldPos, rotation);
        vec3.add(worldPos, worldPos, point);

        this.setPositionWorld(worldPos[0], worldPos[1], worldPos[2]);

        const worldRot = this._worldRotationQuat;
        quat.multiply(worldRot, rotation, worldRot);

        return this;
    }

    lookAt(target, up = vec3.fromValues(0, 1, 0)) {
        const worldPos = this.getPositionWorld();
        const lookAtMatrix = mat4.create();
        mat4.targetTo(lookAtMatrix, worldPos, target, up);

        const worldRot = quat.create();
        mat4.getRotation(worldRot, lookAtMatrix);

        if (this.parent) {
            const parentInverseRot = quat.create();
            quat.conjugate(parentInverseRot, this.parent._worldRotationQuat);
            quat.multiply(this._localRotationQuat, parentInverseRot, worldRot);
        } else {
            quat.copy(this._localRotationQuat, worldRot);
        }

        this.setDirty();
        return this;
    }

    // Direction Vectors
    getForwardVector(out = vec3.create()) {
        const forward = vec3.fromValues(0, 0, -1);
        this.updateWorldMatrix();
        vec3.transformQuat(out, forward, this._worldRotationQuat);
        return out;
    }

    getRightVector(out = vec3.create()) {
        const right = vec3.fromValues(1, 0, 0);
        this.updateWorldMatrix();
        vec3.transformQuat(out, right, this._worldRotationQuat);
        return out;
    }

    getUpVector(out = vec3.create()) {
        const up = vec3.fromValues(0, 1, 0);
        this.updateWorldMatrix();
        vec3.transformQuat(out, up, this._worldRotationQuat);
        return out;
    }

    // Matrix Management
    setDirty() {
        this._dirty = true;
        this._inverseWorldDirty = true;

        for (const child of this.children.values()) {
            if (child instanceof Node3D) {
                child.setDirty();
            }
        }
    }

    updateLocalMatrix() {
        mat4.fromRotationTranslationScale(
            this._localMatrix,
            this._localRotationQuat,
            this._localPosition,
            this._localScale
        );
        this._dirty = false;
    }

    updateWorldMatrix() {
        if (this._dirty) {
            this.updateLocalMatrix();
        }

        if (this.parent instanceof Node3D) {
            const parentWorld = this.parent.worldMatrix;
            mat4.multiply(this._worldMatrix, parentWorld, this._localMatrix);

            mat4.getTranslation(this._worldPosition, this._worldMatrix);
            mat4.getRotation(this._worldRotationQuat, this._worldMatrix);
            mat4.getScaling(this._worldScale, this._worldMatrix);
        } else {
            mat4.copy(this._worldMatrix, this._localMatrix);
            vec3.copy(this._worldPosition, this._localPosition);
            quat.copy(this._worldRotationQuat, this._localRotationQuat);
            vec3.copy(this._worldScale, this._localScale);
        }
    }

    get localMatrix() {
        if (this._dirty) {
            this.updateLocalMatrix();
        }
        return this._localMatrix;
    }

    get worldMatrix() {
        this.updateWorldMatrix();
        return this._worldMatrix;
    }

    get inverseWorldMatrix() {
        this.updateWorldMatrix();
        if (this._inverseWorldDirty) {
            mat4.invert(this._inverseWorldMatrix, this._worldMatrix);
            this._inverseWorldDirty = false;
        }
        return this._inverseWorldMatrix;
    }
}

export default Node3D;