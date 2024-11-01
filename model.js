/**
 * @file model.js
 * @programmers Dan Cliburn, Alexander Davis, Maika West, Austin Medina
 * @date 10/30/2024
 * @description Contains all the code for updating and rendering the scene
 */

let program;
let projection_matrix, view_matrix;
let modelMatrixLoc, viewMatrixLoc, projectionMatrixLoc;
let globalAmbientLightLoc;

let lights = [];
let ambientLightColor = [0.0, 0.0, 0.0];
let ambientLightIntensity = 0.0;


let uLightPositionLoc, uLightColorLoc, uLightDirectionLoc, uLightIsDirectionalLoc, uNumLightsLoc;
let constantAttenLoc, linearAttenLoc, quadraticAttenLoc;

/**
 * The collection of objects to be rendered in the scene. Will be updated and drawn each frame.
 * @type {*[]}
 */
let renderObjects = [];

/**
 * Creates a WebGL program from vertex and fragment shader sources.
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {string} vertexShaderSource - The source code of the vertex shader.
 * @param {string} fragmentShaderSource - The source code of the fragment shader.
 * @returns {WebGLProgram} The created WebGL program.
 * @throws Will throw an error if shader compilation or program linking fails.
 */
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader: " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader: " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

/**
 * Initializes the lighting settings for the scene.
 */

function initLights() {
    globalAmbientLightLoc = gl.getUniformLocation(program, "globalAmbientLight");
    uLightPositionLoc = gl.getUniformLocation(program, "uLightPosition");
    uLightColorLoc = gl.getUniformLocation(program, "uLightColor");
    uLightDirectionLoc = gl.getUniformLocation(program, "uLightDirection");
    uLightIsDirectionalLoc = gl.getUniformLocation(program, "uLightIsDirectional");
    uNumLightsLoc = gl.getUniformLocation(program, "uNumLights");
    constantAttenLoc = gl.getUniformLocation(program, "constantAttenuation");
    linearAttenLoc = gl.getUniformLocation(program, "linearAttenuation");
    quadraticAttenLoc = gl.getUniformLocation(program, "quadraticAttenuation");

    // Get the html color picker element
    const colorPicker = document.getElementById("globalAmbientLight");
    const ambientLightColor = hexToRgb(colorPicker.value);

    // Divide by 255 to get the color in the range [0, 1]
    ambientLightColor[0] /= 255;
    ambientLightColor[1] /= 255;
    ambientLightColor[2] /= 255;

    gl.uniform3f(globalAmbientLightLoc, ambientLightColor[0], ambientLightColor[1], ambientLightColor[2]);
    gl.uniform1f(constantAttenLoc, 1);
    gl.uniform1f(linearAttenLoc, 0.09);
    gl.uniform1f(quadraticAttenLoc, 0.032);

    setupInitialLights();
}

function setupInitialLights() {
    const light1 = new PointLight([0, 1, 1], [0.4, 0.2, 0.5, 5])
    addLight(light1);

    const light2 = new DirectionalLight([1, 1, 0], [0.2, 0.6, 0.25, 2])
    addLight(light2);
}

function addRandomPointLight() {
    const minDistanceFromZero = 0.8;
    const light = new PointLight(
        [
            Math.random() * 2 - 1, // X
            Math.random() * 2 - 1, // Y
            Math.random() * 2 - 1  // Z
        ],
        [
            Math.random(),         // R
            Math.random(),         // G
            Math.random(),         // B
            3                      // Intensity
        ]
    );

    const distance = Math.sqrt(light.position[0] ** 2 + light.position[1] ** 2 + light.position[2] ** 2);

    if (distance < minDistanceFromZero) {
        light.position[0] *= minDistanceFromZero / distance;
        light.position[1] *= minDistanceFromZero / distance;
        light.position[2] *= minDistanceFromZero / distance;
    }


    addLight(light);
}


function addRandomDirectionalLight() {
    const light = new DirectionalLight(
        [
            Math.random() * 2 - 1, // X
            Math.random() * 2 - 1, // Y
            Math.random() * 2 - 1  // Z
        ],
        [
            Math.random(),         // R
            Math.random(),         // G
            Math.random(),         // B
            3                      // Intensity
        ]
    );
    addLight(light);
}



function addLight(light) {
    if (lights.length >= 16) {
        console.error("Cannot add more lights, maximum number reached.");
        return;
    }

    lights.push(light);
    updateLightUniforms();
}

function removeLight(i) {
    lights.splice(i, 1);
    updateLightUniforms();
}

function removeAllLights() {
    lights = [];
    updateLightUniforms();
}

function updateLightUniforms() {
    const positions = new Float32Array(64);  // 16 lights * 4 components
    const colors = new Float32Array(64);
    const directions = new Float32Array(64);
    const isDirectional = new Int32Array(16);

    lights.forEach((light, index) => {
        positions.set(light.getPosition(), index * 4);
        colors.set(light.getColor(), index * 4);
        directions.set(light.getDirection(), index * 4);
        isDirectional[index] = light.isDirectionalLight() ? 1 : 0;
    });

    gl.uniform4fv(uLightPositionLoc, positions);
    gl.uniform4fv(uLightColorLoc, colors);
    gl.uniform4fv(uLightDirectionLoc, directions);
    gl.uniform1iv(uLightIsDirectionalLoc, isDirectional);
    gl.uniform1i(uNumLightsLoc, lights.length);
}


/**
 * Initializes the objects to be rendered in the scene.
 */
function initObjects() {
    // Initialize objects
    let cube = new ActorCube();
    addRenderObject(cube);
    //disable backface culling for the cube
    gl.disable(gl.CULL_FACE);
}

/**
 * Initializes the model, including shaders, matrices, lights, and objects.
 */
function initModel() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Initialize shaders
    try {
        const vertexShaderSource = loadGLSLShaderFile("shaders/phong.vert")
        const fragmentShaderSource = loadGLSLShaderFile("shaders/phong.frag")
        program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
        gl.useProgram(program);
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Could not initialize the GLSL shader program: " + e.message + "</p>";
        return;
    }

    // Get shader matrix locations
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // Initialize matrices
    var mat4 = glMatrix.mat4;
    projection_matrix = mat4.create();
    view_matrix = mat4.create();

    // Set initial camera position
    var eye = [0.0, 0.0, currentCameraDistance];
    var aim = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    mat4.lookAt(view_matrix, eye, aim, up);
    gl.uniformMatrix4fv(viewMatrixLoc, false, view_matrix);

    // Set initial projection
    const aspectRatio = gl.canvas.width / gl.canvas.height;
    mat4.perspective(
        projection_matrix,
        currentFOV,
        aspectRatio,
        0.1,
        200.0
    );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, projection_matrix);

    initLights();
    initObjects();
}


function loadGLSLShaderFile(filename) {
    var request = new XMLHttpRequest();
    request.open('GET', filename, false);
    request.send();
    return request.responseText;
}


/**
 * Adds an object to the collection of objects to be rendered.
 * @param {Object} object - The object to be added.
 */
function addRenderObject(object) {
    renderObjects.push(object);
}

/**
 * Sets the shininess property for all models in the scene.
 * @param {number} shininess - The shininess value to be set.
 */
function setModelsShininess(shininess) {
    for (let object of renderObjects) {
        object.model.setShininess(shininess);
    }
}

function hexToRgb(hex) {
    // Remove the hash
    hex = hex.replace("#", "");

    // Convert to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
}


function updateGlobalAmbientLight() {

    const r = ambientLightColor[0] * ambientLightIntensity;
    const g = ambientLightColor[1] * ambientLightIntensity;
    const b = ambientLightColor[2] * ambientLightIntensity;

    gl.uniform3f(globalAmbientLightLoc, r, g, b);
}

/**
 * Draws the scene by rendering all objects.
 */
function drawModel() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    for (let object of renderObjects) {
        if (object.draw) {
            gl.uniformMatrix4fv(modelMatrixLoc, false, object.modelMatrix);
            object.draw();
        }
    }
}

/**
 * Updates the model by updating the light position and all objects, then drawing the scene.
 */
function updateModel() {
    updateGlobalAmbientLight();
    for (let light of lights) {
        updateLightUniforms();
        light.update();
    }

    for (let object of renderObjects) {
        object.update();
    }

    drawModel();
}