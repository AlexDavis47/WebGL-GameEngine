let gl;
let root;
let activeCamera;
let shaders = new Map();
let models = new Map();
let lights = [];
let ambientLightColor = [0.0, 0.0, 0.0];
let ambientLightIntensity = 0.0;

// Shader locations
let modelMatrixLoc;
let viewMatrixLoc;
let projectionMatrixLoc;
let globalAmbientLightLoc;
let uLightPositionLoc;
let uLightColorLoc;
let uLightDirectionLoc;
let uLightIsDirectionalLoc;
let uNumLightsLoc;

let test;

/**
 * Loads a GLSL shader file asynchronously
 * @param {string} filename - Path to the shader file
 * @returns {Promise<string>} The shader source code
 */
async function loadGLSLShaderFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        throw new Error(`Failed to load shader file ${filename}: ${error.message}`);
    }
}

// Update initModel to be async and use await for shader loading
async function initModel() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Create root object
    root = new ObjectBase();

    // Initialize shaders
    try {
        const vertexShaderSource = await loadGLSLShaderFile("shaders/test.vert");
        const fragmentShaderSource = await loadGLSLShaderFile("shaders/test.frag");

        const shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
        shaders.set('default', shader);
        shader.use();

        // Get shader locations
        modelMatrixLoc = gl.getUniformLocation(shader.program, "modelMatrix");
        viewMatrixLoc = gl.getUniformLocation(shader.program, "viewMatrix");
        projectionMatrixLoc = gl.getUniformLocation(shader.program, "projectionMatrix");
        globalAmbientLightLoc = gl.getUniformLocation(shader.program, "globalAmbientLight");
        uLightPositionLoc = gl.getUniformLocation(shader.program, "uLightPosition");
        uLightColorLoc = gl.getUniformLocation(shader.program, "uLightColor");
        uLightDirectionLoc = gl.getUniformLocation(shader.program, "uLightDirection");
        uLightIsDirectionalLoc = gl.getUniformLocation(shader.program, "uLightIsDirectional");
        uNumLightsLoc = gl.getUniformLocation(shader.program, "uNumLights");
    } catch (e) {
        console.error("Could not initialize shaders:", e);
        return;
    }

    // Rest of initialization
    setupCamera();
    await initObjects();
    root.init();
}

/**
 * Set up the camera
 */
function setupCamera() {
    activeCamera = new Camera3D(
        30 * Math.PI,  // 60 degrees in radians
        gl.canvas.width / gl.canvas.height,
        0.1,
        1000
    );

    // Position camera
    activeCamera.position = glMatrix.vec3.fromValues(0, 0, 5);
    activeCamera.lookAt(glMatrix.vec3.fromValues(0, 0, 0));

    console.log('Camera setup:', {
        position: activeCamera.position,
        fov: activeCamera.fov,
        aspect: activeCamera.aspect,
        near: activeCamera.near,
        far: activeCamera.far
    });

    root.addChild(activeCamera);
}

/**
 * Set up the initial scene objects
 */
async function initObjects() {
    // Create test cube
    const cube = new Model3D(gl);
    await cube.loadFromOBJ(await loadFile("objs/test.obj"));

    test = cube;

    const cube2 = new Model3D(gl);
    await cube2.loadFromOBJ(await loadFile("objs/test.obj"));
    cube.addChild(cube2);
    cube2.scale = glMatrix.vec3.fromValues(0.5, 0.5, 0.5);
    cube2.position = glMatrix.vec3.fromValues(2, 0, 0);

    // Add to scene graph
    root.addChild(cube);
    root.addChild(cube2);
}


function loadFile(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
            } else {
                reject(`Failed to load ${url}: ${xhr.statusText}`);
            }
        };
        xhr.onerror = () => {
            reject(`Failed to load ${url}`);
        };
        xhr.send();
    });
}

/**
 * Update and render the scene
 */
function updateModel() {

    const rotationSpeed = 0.01;
    test.rotate([0, 1, 0], rotationSpeed);

    // Update scene graph
    if (root) {
        root.update(deltaTime);
    }

    // Update lighting
    updateGlobalAmbientLight();
    updateLightUniforms();

    // Render
    drawModel();
}

/**
 * Draw the scene
 */
function drawModel() {

    // Set clear color to dark gray for visibility
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!activeCamera) {
        console.log('No active camera');
        return;
    }

    const shader = shaders.get('default');
    if (!shader) {
        console.log('No default shader');
        return;
    }

    shader.use();

    // Log transformation matrices for debugging
    console.log('View Matrix:', activeCamera.viewMatrix);
    console.log('Projection Matrix:', activeCamera.projectionMatrix);

    // Update camera matrices
    gl.uniformMatrix4fv(viewMatrixLoc, false, activeCamera.viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, activeCamera.projectionMatrix);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // Disable backface culling for testing
    gl.disable(gl.CULL_FACE);

    // Optional: Enable wireframe mode for debugging
    // gl.polygonMode(gl.FRONT_AND_BACK, gl.LINE);  // Note: This isn't supported in WebGL, need alternative

    // Set viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Render all visible objects in the scene graph
    root.traverse(node => {
        if (node instanceof Model3D && node.isVisibleInTree()) {
            // Log model matrix for debugging
            console.log('Model Matrix:', node.worldMatrix);

            gl.uniformMatrix4fv(modelMatrixLoc, false, node.worldMatrix);
            node.draw(shader);
        }
    });
}

/**
 * Add a light to the scene
 */
function addLight(light) {
    if (lights.length >= 16) {
        console.error("Cannot add more lights, maximum number reached.");
        return;
    }
    lights.push(light);
    updateLightUniforms();
}

/**
 * Update the light uniforms in the shader
 */
function updateLightUniforms() {
    const positions = new Float32Array(64);  // 16 lights * 4 components
    const colors = new Float32Array(64);
    const directions = new Float32Array(64);
    const isDirectional = new Int32Array(16);

    lights.forEach((light, index) => {
        if (light.isDirectional) {
            directions.set([...light.direction, 0.0], index * 4);
            positions.set([0, 0, 0, 0], index * 4);
        } else {
            positions.set([...light.position, 1.0], index * 4);
            directions.set([0, 0, 0, 0], index * 4);
        }

        colors.set([...light.color, light.intensity], index * 4);
        isDirectional[index] = light.isDirectional ? 1 : 0;
    });

    gl.uniform4fv(uLightPositionLoc, positions);
    gl.uniform4fv(uLightColorLoc, colors);
    gl.uniform4fv(uLightDirectionLoc, directions);
    gl.uniform1iv(uLightIsDirectionalLoc, isDirectional);
    gl.uniform1i(uNumLightsLoc, lights.length);
}

/**
 * Update ambient lighting
 */
function updateGlobalAmbientLight() {
    const r = ambientLightColor[0] * ambientLightIntensity;
    const g = ambientLightColor[1] * ambientLightIntensity;
    const b = ambientLightColor[2] * ambientLightIntensity;

    gl.uniform3f(globalAmbientLightLoc, r, g, b);
}

