import Node from './node.js';

class Node3D extends Node {
    constructor() {
        super();
        this.name = "Node3D";

        // Transform components
        this.localPosition = glMatrix.vec3.create();  // Relative to parent
        this.worldPosition = glMatrix.vec3.create();  // Relative to world/root
        this.rotation = glMatrix.quat.create();
        this.scale = glMatrix.vec3.fromValues(1, 1, 1);

        // Cached matrices
        this.localMatrix = glMatrix.mat4.create();
        this.worldMatrix = glMatrix.mat4.create();
        this.needsUpdate = true;
    }

    updateMatrices() {
        // Always update if flagged or if parent has updated
        const parentNeedsUpdate = this.parent instanceof Node3D && this.parent.needsUpdate;

        if (this.needsUpdate || parentNeedsUpdate) { // Need update is essentially just a synonym for the dirty flag
            // Build local transform matrix
            glMatrix.mat4.fromRotationTranslationScale(
                this.localMatrix,
                this.rotation,
                this.localPosition,
                this.scale
            );

            // Calculate world matrix by combining with parent's world matrix
            if (this.parent instanceof Node3D) {
                glMatrix.mat4.multiply(this.worldMatrix, this.parent.worldMatrix, this.localMatrix);
            } else {
                glMatrix.mat4.copy(this.worldMatrix, this.localMatrix);
            }

            // Update world position
            glMatrix.vec3.set(this.worldPosition, 0, 0, 0);
            glMatrix.vec3.transformMat4(this.worldPosition, this.worldPosition, this.worldMatrix);

            // Mark update complete
            this.needsUpdate = false;

            // Force child updates when parent changes
            for (const child of this.children.values()) {
                if (child instanceof Node3D) {
                    child.needsUpdate = true;
                }
            }
        }
    }

    update(deltaTime) {
        this.updateMatrices();
        super.update(deltaTime);
    }

    // Transform methods
    setPosition(x, y, z) {
        glMatrix.vec3.set(this.localPosition, x, y, z);
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

    move(x, y, z) {
        glMatrix.vec3.add(this.localPosition, this.localPosition, [x, y, z]);
        this.needsUpdate = true;
        return this;
    }

    // You could also add convenience methods for single-axis movement
    moveX(amount) {
        this.localPosition[0] += amount;
        this.needsUpdate = true;
        return this;
    }

    moveY(amount) {
        this.localPosition[1] += amount;
        this.needsUpdate = true;
        return this;
    }

    moveZ(amount) {
        this.localPosition[2] += amount;
        this.needsUpdate = true;
        return this;
    }

    rotate(x, y, z) {
        const rotation = glMatrix.quat.create();
        glMatrix.quat.fromEuler(rotation, x * 180 / Math.PI, y * 180 / Math.PI, z * 180 / Math.PI);
        glMatrix.quat.multiply(this.rotation, this.rotation, rotation);
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
    getWorldPosition(out = glMatrix.vec3.create()) {
        glMatrix.vec3.copy(out, this.worldPosition);
        return out;
    }

    getLocalPosition(out = glMatrix.vec3.create()) {
        glMatrix.vec3.copy(out, this.localPosition);
        return out;
    }

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
        glMatrix.mat4.targetTo(lookAtMatrix, this.localPosition, target, up);
        glMatrix.mat4.getRotation(this.rotation, lookAtMatrix);
        this.needsUpdate = true;
        return this;
    }
}

export default Node3D;