class Camera3D extends Object3D {
    constructor(fov = 45, aspect = 1, near = 0.1, far = 1000) {
        super();

        // Get glMatrix modules
        const { mat4 } = glMatrix;

        // Camera properties
        this._fov = fov;
        this._aspect = aspect;
        this._near = near;
        this._far = far;

        // Cache projection matrix
        this._projectionMatrix = mat4.create();
        this._viewMatrix = mat4.create();
        this._projectionDirty = true;

        // Initial projection matrix calculation
        this._updateProjectionMatrix();
    }

    // Projection property getters/setters
    get fov() {
        return this._fov;
    }

    set fov(value) {
        this._fov = value;
        this._projectionDirty = true;
    }

    get aspect() {
        return this._aspect;
    }

    set aspect(value) {
        this._aspect = value;
        this._projectionDirty = true;
    }

    get near() {
        return this._near;
    }

    set near(value) {
        this._near = value;
        this._projectionDirty = true;
    }

    get far() {
        return this._far;
    }

    set far(value) {
        this._far = value;
        this._projectionDirty = true;
    }

    // Matrix getters
    get projectionMatrix() {
        if (this._projectionDirty) {
            this._updateProjectionMatrix();
        }
        return this._projectionMatrix;
    }

    get viewMatrix() {
        const { mat4 } = glMatrix;
        // View matrix is the inverse of the camera's world transform
        mat4.invert(this._viewMatrix, this.worldMatrix);
        return this._viewMatrix;
    }

    // Update methods
    _updateProjectionMatrix() {
        const { mat4 } = glMatrix;
        mat4.perspective(
            this._projectionMatrix,
            this._fov * (Math.PI / 180), // Convert FOV to radians
            this._aspect,
            this._near,
            this._far
        );
        this._projectionDirty = false;
    }

    // Utility methods
    setViewport(width, height) {
        this._aspect = width / height;
        this._projectionDirty = true;
    }

    // Ray casting methods for picking
    screenToRay(screenX, screenY, viewportWidth, viewportHeight) {
        const { vec3, vec4, mat4 } = glMatrix;

        // Convert screen coordinates to clip space (-1 to 1)
        const clipX = (screenX / viewportWidth) * 2 - 1;
        const clipY = 1 - (screenY / viewportHeight) * 2; // Flip Y

        // Create near and far points in clip space
        const nearPoint = vec4.fromValues(clipX, clipY, -1, 1);
        const farPoint = vec4.fromValues(clipX, clipY, 1, 1);

        // Create inverse projection-view matrix
        const inverseProjection = mat4.create();
        const inverseView = mat4.create();
        const inversePV = mat4.create();

        mat4.invert(inverseProjection, this.projectionMatrix);
        mat4.invert(inverseView, this.viewMatrix);
        mat4.multiply(inversePV, inverseView, inverseProjection);

        // Transform to world space
        const nearWorld = vec4.create();
        const farWorld = vec4.create();
        vec4.transformMat4(nearWorld, nearPoint, inversePV);
        vec4.transformMat4(farWorld, farPoint, inversePV);

        // Perspective divide
        vec4.scale(nearWorld, nearWorld, 1 / nearWorld[3]);
        vec4.scale(farWorld, farWorld, 1 / farWorld[3]);

        // Create ray
        const rayOrigin = vec3.fromValues(nearWorld[0], nearWorld[1], nearWorld[2]);
        const rayDirection = vec3.create();
        vec3.subtract(rayDirection,
            vec3.fromValues(farWorld[0], farWorld[1], farWorld[2]),
            rayOrigin
        );
        vec3.normalize(rayDirection, rayDirection);

        return {
            origin: rayOrigin,
            direction: rayDirection
        };
    }

    // View frustum methods
    getFrustumPlanes() {
        const { vec4, mat4 } = glMatrix;

        // Combine view and projection matrices
        const viewProj = mat4.create();
        mat4.multiply(viewProj, this.projectionMatrix, this.viewMatrix);

        // Extract planes from view-projection matrix
        // Each plane is represented as a vec4 where (x,y,z) is the normal and w is the distance
        return {
            near:   this._extractPlane(viewProj, 3, 2),  // Near
            far:    this._extractPlane(viewProj, 3, -2), // Far
            left:   this._extractPlane(viewProj, 0, 1),  // Left
            right:  this._extractPlane(viewProj, 0, -1), // Right
            top:    this._extractPlane(viewProj, 1, -1), // Top
            bottom: this._extractPlane(viewProj, 1, 1)   // Bottom
        };
    }

    _extractPlane(matrix, row, sign) {
        const { vec4 } = glMatrix;
        const plane = vec4.create();

        // Extract plane coefficients from the view-projection matrix
        for (let i = 0; i < 4; i++) {
            plane[i] = matrix[i * 4 + row] + sign * matrix[i * 4 + 3];
        }

        // Normalize the plane
        const length = Math.sqrt(
            plane[0] * plane[0] +
            plane[1] * plane[1] +
            plane[2] * plane[2]
        );

        vec4.scale(plane, plane, 1 / length);
        return plane;
    }
}