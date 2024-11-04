import Node from './node.js';

class Node3D extends Node {
    constructor() {
        super();
        this.name = "Node3D";

        // Transform components
        this._localPosition = glMatrix.vec3.create();
        this._localRotation = glMatrix.quat.create();
        this._localScale = glMatrix.vec3.fromValues(1, 1, 1);

        // World transform components (read-only)
        this._worldPosition = glMatrix.vec3.create();
        this._worldRotation = glMatrix.quat.create();
        this._worldScale = glMatrix.vec3.fromValues(1, 1, 1);

        // Matrices
        this._localMatrix = glMatrix.mat4.create();
        this._worldMatrix = glMatrix.mat4.create();
        this._dirty = true;

        // Cache for inverse world matrix (lazy computed)
        this._inverseWorldMatrix = glMatrix.mat4.create();
        this._inverseWorldDirty = true;
    }

    // Local Position Methods
    setPosition(x, y, z) {
        glMatrix.vec3.set(this._localPosition, x, y, z);
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
        return glMatrix.vec3.clone(this._localPosition);
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

        const worldPos = glMatrix.vec3.fromValues(x, y, z);
        const parentInverse = this.parent.inverseWorldMatrix;
        glMatrix.vec3.transformMat4(this._localPosition, worldPos, parentInverse);
        this.setDirty();
        return this;
    }

    setPositionWorldX(x) {
        const worldPos = this.getPositionWorld();
        worldPos[0] = x;
        return this.setPositionWorld(worldPos[0], worldPos[1], worldPos[2]);
    }

    setPositionWorldY(y) {
        const worldPos = this.getPositionWorld();
        worldPos[1] = y;
        return this.setPositionWorld(worldPos[0], worldPos[1], worldPos[2]);
    }

    setPositionWorldZ(z) {
        const worldPos = this.getPositionWorld();
        worldPos[2] = z;
        return this.setPositionWorld(worldPos[0], worldPos[1], worldPos[2]);
    }

    getPositionWorld() {
        this.updateWorldMatrix();
        return glMatrix.vec3.clone(this._worldPosition);
    }

    getPositionWorldX() {
        return this.getPositionWorld()[0];
    }

    getPositionWorldY() {
        return this.getPositionWorld()[1];
    }

    getPositionWorldZ() {
        return this.getPositionWorld()[2];
    }

    // Local Rotation Methods
    setRotation(x, y, z) {
        glMatrix.quat.fromEuler(this._localRotation, x, y, z);
        this.setDirty();
        return this;
    }

    setRotationX(rad) {
        const [_, y, z] = this.getRotation();
        return this.setRotation(rad, y, z);
    }

    setRotationY(rad) {
        const [x, _, z] = this.getRotation();
        return this.setRotation(x, rad, z);
    }

    setRotationZ(rad) {
        const [x, y, _] = this.getRotation();
        return this.setRotation(x, y, rad);
    }

    getRotation() {
        const euler = glMatrix.vec3.create();
        glMatrix.quat.getEuler(euler, this._localRotation);
        return euler;
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

    // World Rotation Methods (in radians)
    setRotationWorld(x, y, z) {
        if (!this.parent) {
            return this.setRotation(x, y, z);
        }

        const worldRot = glMatrix.quat.create();
        glMatrix.quat.fromEuler(worldRot, x, y, z);
        const parentInverseRot = glMatrix.quat.create();
        glMatrix.quat.conjugate(parentInverseRot, this.parent.getRotationWorldQuat());
        glMatrix.quat.multiply(this._localRotation, parentInverseRot, worldRot);
        this.setDirty();
        return this;
    }

    setRotationWorldX(rad) {
        const [_, y, z] = this.getRotationWorld();
        return this.setRotationWorld(rad, y, z);
    }

    setRotationWorldY(rad) {
        const [x, _, z] = this.getRotationWorld();
        return this.setRotationWorld(x, rad, z);
    }

    setRotationWorldZ(rad) {
        const [x, y, _] = this.getRotationWorld();
        return this.setRotationWorld(x, y, rad);
    }

    getRotationWorld() {
        this.updateWorldMatrix();
        const euler = glMatrix.vec3.create();
        glMatrix.quat.getEuler(euler, this._worldRotation);
        return euler;
    }

    // Relative transform methods
    rotate(x, y, z) {
        const rotation = glMatrix.quat.create();
        glMatrix.quat.fromEuler(rotation, x, y, z);
        glMatrix.quat.multiply(this._localRotation, this._localRotation, rotation);
        this.setDirty();
        return this;
    }

    rotateAround(point, axis, rad) {
        const worldPos = this.getPositionWorld();

        // Create rotation quaternion
        const rotation = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(rotation, axis, rad);

        // Translate point to origin
        glMatrix.vec3.subtract(worldPos, worldPos, point);

        // Rotate
        glMatrix.vec3.transformQuat(worldPos, worldPos, rotation);

        // Translate back
        glMatrix.vec3.add(worldPos, worldPos, point);

        // Set new position and apply rotation
        this.setPositionWorld(worldPos[0], worldPos[1], worldPos[2]);
        const currentRot = this.getRotationWorldQuat();
        glMatrix.quat.multiply(currentRot, rotation, currentRot);

        return this;
    }

    getRotationWorldQuat() {
        this.updateWorldMatrix();
        return glMatrix.quat.clone(this._worldRotation);
    }

    // Scale Methods (local only, world scale rarely needed)
    setScale(x, y, z) {
        glMatrix.vec3.set(this._localScale, x, y, z);
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
        return glMatrix.vec3.clone(this._localScale);
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

    // Relative transform methods
    translate(x, y, z) {
        const translation = glMatrix.vec3.fromValues(x, y, z);
        glMatrix.vec3.transformQuat(translation, translation, this._localRotation);
        glMatrix.vec3.add(this._localPosition, this._localPosition, translation);
        this.setDirty();
        return this;
    }

    translateWorld(x, y, z) {
        glMatrix.vec3.add(this._localPosition, this._localPosition, [x, y, z]);
        this.setDirty();
        return this;
    }

    lookAt(target, up = glMatrix.vec3.fromValues(0, 1, 0)) {
        const worldPos = this.getPositionWorld();
        const lookAtMatrix = glMatrix.mat4.create();

        glMatrix.mat4.targetTo(lookAtMatrix, worldPos, target, up);
        const worldRot = glMatrix.quat.create();
        glMatrix.mat4.getRotation(worldRot, lookAtMatrix);

        if (this.parent) {
            const parentInverseRot = glMatrix.quat.create();
            glMatrix.quat.conjugate(parentInverseRot, this.parent.getRotationWorldQuat());
            glMatrix.quat.multiply(this._localRotation, parentInverseRot, worldRot);
        } else {
            glMatrix.quat.copy(this._localRotation, worldRot);
        }

        this.setDirty();
        return this;
    }

    getForwardVector(out = glMatrix.vec3.create()) {
        const forward = glMatrix.vec3.fromValues(0, 0, -1);
        glMatrix.vec3.transformQuat(out, forward, this._localRotation);
        return out;
    }

    getRightVector(out = glMatrix.vec3.create()) {
        const right = glMatrix.vec3.fromValues(1, 0, 0);
        glMatrix.vec3.transformQuat(out, right, this._localRotation);
        return out;
    }

    getUpVector(out = glMatrix.vec3.create()) {
        const up = glMatrix.vec3.fromValues(0, 1, 0);
        glMatrix.vec3.transformQuat(out, up, this._localRotation);
        return out;
    }

    // And optionally, world-space versions:
    getWorldForwardVector(out = glMatrix.vec3.create()) {
        const forward = glMatrix.vec3.fromValues(0, 0, -1);
        glMatrix.vec3.transformQuat(out, forward, this._worldRotation);
        return out;
    }

    getWorldRightVector(out = glMatrix.vec3.create()) {
        const right = glMatrix.vec3.fromValues(1, 0, 0);
        glMatrix.vec3.transformQuat(out, right, this._worldRotation);
        return out;
    }

    getWorldUpVector(out = glMatrix.vec3.create()) {
        const up = glMatrix.vec3.fromValues(0, 1, 0);
        glMatrix.vec3.transformQuat(out, up, this._worldRotation);
        return out;
    }

    // Matrix management
    setDirty() {
        this._dirty = true;
        this._inverseWorldDirty = true;

        // Mark all children as dirty
        for (const child of this.children.values()) {
            if (child instanceof Node3D) {
                child.setDirty();
            }
        }
    }

    updateLocalMatrix() {
        glMatrix.mat4.fromRotationTranslationScale(
            this._localMatrix,
            this._localRotation,
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
            glMatrix.mat4.multiply(this._worldMatrix, parentWorld, this._localMatrix);

            // Extract world transform components
            glMatrix.mat4.getTranslation(this._worldPosition, this._worldMatrix);
            glMatrix.mat4.getRotation(this._worldRotation, this._worldMatrix);
            glMatrix.mat4.getScaling(this._worldScale, this._worldMatrix);
        } else {
            // Root node - world = local
            glMatrix.mat4.copy(this._worldMatrix, this._localMatrix);
            glMatrix.vec3.copy(this._worldPosition, this._localPosition);
            glMatrix.quat.copy(this._worldRotation, this._localRotation);
            glMatrix.vec3.copy(this._worldScale, this._localScale);
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
            glMatrix.mat4.invert(this._inverseWorldMatrix, this._worldMatrix);
            this._inverseWorldDirty = false;
        }
        return this._inverseWorldMatrix;
    }

    // Node hierarchy management overrides
    addChild(node) {
        super.addChild(node);
        if (node instanceof Node3D) {
            node.setDirty();
        }
        return this;
    }

    removeChild(node) {
        if (node instanceof Node3D) {
            // Convert child's transforms to world space before removal
            const worldPos = node.getPositionWorld();
            const worldRot = node.getRotationWorld();
            super.removeChild(node);
            node.setPositionWorld(...worldPos);
            node.setRotationWorld(...worldRot);
        } else {
            super.removeChild(node);
        }
        return this;
    }
}

export default Node3D;