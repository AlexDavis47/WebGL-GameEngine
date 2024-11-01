/**
 * @file view.js
 * @programmers Dan Cliburn, Alexander Davis, Maika West, Austin Medina
 * @date 10/30/2024
 * @description Contains all the code for setting up the WebGL context and camera
 */

let currentFOV = Math.PI / 3; // 60 degrees
let currentCameraDistance = 2.0;

/**
 * Updates the view matrix with the current camera distance and sends it to the shader.
 */
function updateCamera() {
    // Update view matrix with new camera distance
    var mat4 = glMatrix.mat4;
    view_matrix = mat4.create();

    var eye = [0.0, 0.0, currentCameraDistance];
    var aim = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];

    mat4.lookAt(view_matrix, eye, aim, up);
    gl.uniformMatrix4fv(viewMatrixLoc, false, view_matrix);
}

/**
 * Updates the projection matrix with the current field of view and sends it to the shader.
 */
function updateProjectionMatrix() {
    const aspectRatio = canvas.width / canvas.height;

    var mat4 = glMatrix.mat4;
    projection_matrix = mat4.create();

    const near = 0.1;
    const far = 200.0;

    mat4.perspective(
        projection_matrix,
        currentFOV,
        aspectRatio,
        near,
        far
    );

    gl.uniformMatrix4fv(projectionMatrixLoc, false, projection_matrix);
}

/**
 * Called when the window is resized to make sure the WebGL and HTML canvases are correctly sized.
 */
function resizeCanvas() {
    const holder = document.getElementById("canvas-holder");
    const rect = holder.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    updateProjectionMatrix();
}

/**
 * Initializes the WebGL context and sets up the canvas.
 */
function initView() {
    try {
        canvas = document.getElementById("webgl-canvas");
        gl = canvas.getContext("webgl2");
        if (!gl) {
            throw new Error("WebGL not supported.");
        }

        // Initial setup
        resizeCanvas();
        updateCamera();  // Make sure we call this initially

        // Add resize listener
        window.addEventListener('resize', resizeCanvas);
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>initView(): Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
}