class Object3D extends ObjectBase {
    constructor() {
        super();

        // Transform properties
        this._position = glMatrix.vec3.fromValues(0, 0, 0);
        this._rotation = glMatrix.vec3.fromValues(0, 0, 0);
        this._scale = glMatrix.vec3.fromValues(1, 1, 1);
        this._quaternion = glMatrix.quat.create();

        // Transform matrices
        this._localMatrix = glMatrix.mat4.create();
        this._worldMatrix = glMatrix.mat4.create();
        this._dirty = true;
    }

    // Position methods
    get position() {
        return this._position;
    }

    set position(value) {
        glMatrix.vec3.copy(this._position, value);
        this._markDirty();
    }

    // Rotation methods
    get rotation() {
        return this._rotation;
    }

    set rotation(value) {
        glMatrix.vec3.copy(this._rotation, value);

        // Create quaternion from Euler angles
        glMatrix.quat.fromEuler(
            this._quaternion,
            glMatrix.glMatrix.toDegrees(value[0]),  // X
            glMatrix.glMatrix.toDegrees(value[1]),  // Y
            glMatrix.glMatrix.toDegrees(value[2])   // Z
        );

        this._markDirty();
    }

    // Scale methods
    get scale() {
        return this._scale;
    }

    set scale(value) {
        glMatrix.vec3.copy(this._scale, value);
        this._markDirty();
    }

    // Matrix getters
    get localMatrix() {
        if (this._dirty) {
            this._updateLocalMatrix();
        }
        return this._localMatrix;
    }

    get worldMatrix() {
        // Always update world matrix when requested to ensure proper cascading
        this._updateWorldMatrix();
        return this._worldMatrix;
    }

    // Transform update methods
    _markDirty() {
        this._dirty = true;
        // Mark all children as dirty
        for (const child of this.children) {
            if (child instanceof Object3D) {
                child._markDirty();
            }
        }
    }

    _updateLocalMatrix() {
        // Create a fresh matrix
        glMatrix.mat4.identity(this._localMatrix);

        // Apply transformations in order: Scale -> Rotate -> Translate
        glMatrix.mat4.translate(this._localMatrix, this._localMatrix, this._position);

        // Create and apply rotation matrix
        const rotationMat = glMatrix.mat4.create();
        glMatrix.mat4.fromQuat(rotationMat, this._quaternion);
        glMatrix.mat4.multiply(this._localMatrix, this._localMatrix, rotationMat);

        // Apply scale
        glMatrix.mat4.scale(this._localMatrix, this._localMatrix, this._scale);

        this._dirty = false;
    }

    _updateWorldMatrix() {
        if (!this.parent || !(this.parent instanceof Object3D)) {
            // If no parent, world matrix is just local matrix
            glMatrix.mat4.copy(this._worldMatrix, this.localMatrix);
        } else {
            // Combine parent's world matrix with our local matrix
            glMatrix.mat4.multiply(
                this._worldMatrix,
                this.parent.worldMatrix,  // Get fresh parent world matrix
                this.localMatrix
            );
        }
    }

    // Transformation methods
    translate(offset) {
        glMatrix.vec3.add(this._position, this._position, offset);
        this._markDirty();
    }

    rotate(axis, angle) {
        // Create a rotation quaternion
        const rotationQuat = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(rotationQuat, axis, angle);

        // Apply to current rotation
        glMatrix.quat.multiply(this._quaternion, this._quaternion, rotationQuat);
        glMatrix.quat.normalize(this._quaternion, this._quaternion);

        // Update Euler angles
        const rotationMatrix = glMatrix.mat4.create();
        glMatrix.mat4.fromQuat(rotationMatrix, this._quaternion);

        // Extract Euler angles from rotation matrix
        const euler = this._extractEulerAngles(rotationMatrix);
        glMatrix.vec3.copy(this._rotation, euler);

        this._markDirty();
    }

    lookAt(target, up = glMatrix.vec3.fromValues(0, 1, 0)) {
        // Create lookAt matrix
        const lookAtMatrix = glMatrix.mat4.create();
        glMatrix.mat4.targetTo(lookAtMatrix, this._position, target, up);

        // Extract rotation only (remove translation)
        const rotationMatrix = glMatrix.mat4.clone(lookAtMatrix);
        rotationMatrix[12] = 0;
        rotationMatrix[13] = 0;
        rotationMatrix[14] = 0;

        // Convert to quaternion
        glMatrix.mat4.getRotation(this._quaternion, rotationMatrix);
        glMatrix.quat.normalize(this._quaternion, this._quaternion);

        // Update Euler angles
        const euler = this._extractEulerAngles(rotationMatrix);
        glMatrix.vec3.copy(this._rotation, euler);

        this._markDirty();
    }

    _extractEulerAngles(matrix) {
        // Assuming XYZ rotation order
        const euler = glMatrix.vec3.create();

        // Extract angles (in radians)
        euler[1] = Math.asin(-matrix[8]); // Y rotation

        if (Math.abs(matrix[8]) < 0.99999) { // Not at gimbal lock
            euler[0] = Math.atan2(matrix[9], matrix[10]); // X rotation
            euler[2] = Math.atan2(matrix[4], matrix[0]);  // Z rotation
        } else { // At gimbal lock
            euler[0] = Math.atan2(-matrix[6], matrix[5]);
            euler[2] = 0;
        }

        return euler;
    }
}