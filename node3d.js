import Node from './node.js';

class Node3D extends Node {
    constructor() {
        super();
        this.name = "Node3D";

        // Transform components
        this.position = glMatrix.vec3.create();
        this.rotation = glMatrix.quat.create();
        this.scale = glMatrix.vec3.fromValues(1, 1, 1);

        // Cached matrices
        this.localMatrix = glMatrix.mat4.create();
        this.worldMatrix = glMatrix.mat4.create();
        this.needsUpdate = true;
    }

    updateMatrices() {
        if (this.needsUpdate) {
            // Build local transform matrix
            glMatrix.mat4.fromRotationTranslationScale(
                this.localMatrix,
                this.rotation,
                this.position,
                this.scale
            );

            // Calculate world matrix
            if (this.parent instanceof Node3D) {
                glMatrix.mat4.multiply(this.worldMatrix, this.parent.worldMatrix, this.localMatrix);
            } else {
                glMatrix.mat4.copy(this.worldMatrix, this.localMatrix);
            }

            this.needsUpdate = false;
        }
    }

    update(deltaTime) {
        this.updateMatrices();
        super.update(deltaTime);
    }

    // Transform methods
    setPosition(x, y, z) {
        glMatrix.vec3.set(this.position, x, y, z);
        this.needsUpdate = true;
        return this;
    }

    setRotationFromEuler(x, y, z) {
        glMatrix.quat.fromEuler(this.rotation, x * 180 / Math.PI, y * 180 / Math.PI, z * 180 / Math.PI);
        this.needsUpdate = true;
        return this;
    }

    setScale(x, y, z) {
        glMatrix.vec3.set(this.scale, x, y, z);
        this.needsUpdate = true;
        return this;
    }

    translate(x, y, z) {
        glMatrix.vec3.add(this.position, this.position, [x, y, z]);
        this.needsUpdate = true;
        return this;
    }

    rotateX(angle) {
        glMatrix.quat.rotateX(this.rotation, this.rotation, angle);
        this.needsUpdate = true;
        return this;
    }

    rotateY(angle) {
        glMatrix.quat.rotateY(this.rotation, this.rotation, angle);
        this.needsUpdate = true;
        return this;
    }

    rotateZ(angle) {
        glMatrix.quat.rotateZ(this.rotation, this.rotation, angle);
        this.needsUpdate = true;
        return this;
    }

    // Utility methods
    getForwardVector(out = glMatrix.vec3.create()) {
        const forward = glMatrix.vec3.fromValues(0, 0, -1);
        glMatrix.vec3.transformQuat(out, forward, this.rotation);
        return out;
    }

    getRightVector(out = glMatrix.vec3.create()) {
        const right = glMatrix.vec3.fromValues(1, 0, 0);
        glMatrix.vec3.transformQuat(out, right, this.rotation);
        return out;
    }

    getUpVector(out = glMatrix.vec3.create()) {
        const up = glMatrix.vec3.fromValues(0, 1, 0);
        glMatrix.vec3.transformQuat(out, up, this.rotation);
        return out;
    }

    lookAt(target, up = glMatrix.vec3.fromValues(0, 1, 0)) {
        const lookAtMatrix = glMatrix.mat4.create();
        glMatrix.mat4.targetTo(lookAtMatrix, this.position, target, up);
        glMatrix.mat4.getRotation(this.rotation, lookAtMatrix);
        this.needsUpdate = true;
        return this;
    }
}

export default Node3D;