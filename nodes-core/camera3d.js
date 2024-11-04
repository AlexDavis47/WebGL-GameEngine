import Node3D from "./node3d.js";

class Camera3D extends Node3D {
    constructor() {
        super();
        this.name = "Camera3D";

        // Matrices (camera-specific)
        this._projectionMatrix = glMatrix.mat4.create();
        this._viewMatrix = glMatrix.mat4.create();

        // Camera settings
        this._isPerspective = true;
        this._fov = 60;  // In degrees
        this._aspect = 1.0;
        this._near = 0.1;
        this._far = 1000.0;
        this._orthoSize = 10;

        // Matrix update flags
        this._projectionDirty = true;

        // Cached data
        this._frustumPlanes = {
            near: glMatrix.vec4.create(),
            far: glMatrix.vec4.create(),
            left: glMatrix.vec4.create(),
            right: glMatrix.vec4.create(),
            top: glMatrix.vec4.create(),
            bottom: glMatrix.vec4.create()
        };
    }

    // Matrix management
    updateViewMatrix() {
        // View matrix is inverse of world matrix
        glMatrix.mat4.invert(this._viewMatrix, this.worldMatrix);
    }

    updateProjectionMatrix() {
        if (this._isPerspective) {
            glMatrix.mat4.perspective(
                this._projectionMatrix,
                this._fov * Math.PI / 180,  // Convert FOV to radians for gl-matrix
                this._aspect,
                this._near,
                this._far
            );
        } else {
            const size = this._orthoSize;
            glMatrix.mat4.ortho(
                this._projectionMatrix,
                -size * this._aspect,
                size * this._aspect,
                -size,
                size,
                this._near,
                this._far
            );
        }
        this._projectionDirty = false;
        this.updateFrustumPlanes();
    }

    // Camera setup
    setPerspective(fovDegrees, near, far) {
        this._isPerspective = true;
        this._fov = fovDegrees;
        this._near = near;
        this._far = far;
        this._projectionDirty = true;
        return this;
    }

    getFOV() {
        return this._fov;
    }

    setFOV(degrees) {
        this._fov = degrees;
        this._projectionDirty = true;
        return this;
    }

    setOrthographic(size, near, far) {
        this._isPerspective = false;
        this._orthoSize = size;
        this._near = near;
        this._far = far;
        this._projectionDirty = true;
        return this;
    }

    setAspectRatio(aspect) {
        this._aspect = aspect;
        this._projectionDirty = true;
        return this;
    }

    // Matrix access
    get projectionMatrix() {
        if (this._projectionDirty) {
            this.updateProjectionMatrix();
        }
        return this._projectionMatrix;
    }

    get viewMatrix() {
        this.updateViewMatrix();
        return this._viewMatrix;
    }

    // Frustum calculations
    updateFrustumPlanes() {
        const vp = glMatrix.mat4.create();
        glMatrix.mat4.multiply(vp, this.projectionMatrix, this.viewMatrix);

        // Extract the six frustum planes
        // Left plane
        this.extractFrustumPlane(vp, 3, 0, this._frustumPlanes.left);
        // Right plane
        this.extractFrustumPlane(vp, 3, -0, this._frustumPlanes.right);
        // Bottom plane
        this.extractFrustumPlane(vp, 3, 1, this._frustumPlanes.bottom);
        // Top plane
        this.extractFrustumPlane(vp, 3, -1, this._frustumPlanes.top);
        // Near plane
        this.extractFrustumPlane(vp, 3, 2, this._frustumPlanes.near);
        // Far plane
        this.extractFrustumPlane(vp, 3, -2, this._frustumPlanes.far);
    }

    extractFrustumPlane(vp, row, col, out) {
        const sign = Math.sign(col);
        const colAbs = Math.abs(col);
        out[0] = vp[row] + sign * vp[colAbs];
        out[1] = vp[row + 4] + sign * vp[colAbs + 4];
        out[2] = vp[row + 8] + sign * vp[colAbs + 8];
        out[3] = vp[row + 12] + sign * vp[colAbs + 12];

        // Normalize the plane
        const len = Math.sqrt(out[0] * out[0] + out[1] * out[1] + out[2] * out[2]);
        out[0] /= len;
        out[1] /= len;
        out[2] /= len;
        out[3] /= len;
    }

    // Frustum tests
    isPointVisible(point) {
        for (const plane of Object.values(this._frustumPlanes)) {
            if (plane[0] * point[0] + plane[1] * point[1] +
                plane[2] * point[2] + plane[3] <= 0) {
                return false;
            }
        }
        return true;
    }

    isSphereVisible(center, radius) {
        for (const plane of Object.values(this._frustumPlanes)) {
            if (plane[0] * center[0] + plane[1] * center[1] +
                plane[2] * center[2] + plane[3] <= -radius) {
                return false;
            }
        }
        return true;
    }

    // Override Node3D's setDirty to handle view matrix updates
    setDirty() {
        super.setDirty();
        // View matrix depends on world transform
        this.updateViewMatrix();
    }

    // Lifecycle methods
    onInit(gl) {
        super.onInit(gl);
        this.updateProjectionMatrix();
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
        this.updateViewMatrix();
    }
}

export default Camera3D;