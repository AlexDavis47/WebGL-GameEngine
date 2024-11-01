//FileName:     controller.js
//Programmer:   Dan Cliburn, Alexander Davis, Austin Medina, Maika West
//Date:         10/30/2021
//Description:  Contains code that helps the user interact with the program.

let deltaTime = 0.0;
let lastTime = 0.0;
let targetFPS = 60;
let frameRateArray = [];
let animationFrameId = null;

// Input variables for motion
let inputXModel = 0.0;
let inputYModel = 0.0;
let inputXLight = 0.0;
let inputYLight = 0.0;

function processInput() {
    // Reset input values
    inputXModel = 0.0;
    inputYModel = 0.0;
    inputXLight = 0.0;
    inputYLight = 0.0;

    // Model movement
    if (isKeyPressed(Keys.LEFT)) inputXModel -= 1.0;
    if (isKeyPressed(Keys.RIGHT)) inputXModel += 1.0;
    if (isKeyPressed(Keys.UP)) inputYModel += 1.0;
    if (isKeyPressed(Keys.DOWN)) inputYModel -= 1.0;

    // Light movement
    if (isKeyPressed(Keys.A)) inputXLight -= 1.0;
    if (isKeyPressed(Keys.D)) inputXLight += 1.0;
    if (isKeyPressed(Keys.W)) inputYLight += 1.0;
    if (isKeyPressed(Keys.S)) inputYLight -= 1.0;

    // Light toggles - only trigger on initial press
    if (isKeyJustPressed(Keys.ONE)) turnOffPointLights();
    if (isKeyJustPressed(Keys.TWO)) turnOnPointLights();
    if (isKeyJustPressed(Keys.THREE)) turnOffDirectionalLights();
    if (isKeyJustPressed(Keys.FOUR)) turnOnDirectionalLights();
}

function update(currentTime) {
    if (!lastTime) {
        lastTime = currentTime;
        scheduleNextFrame();
        return;
    }

    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Skip update if window lost focus or frame time is too large
    if (!document.hasFocus() || deltaTime > 0.1) {
        deltaTime = 0;
        scheduleNextFrame();
        return;
    }

    // Update input first
    updateInput();  // From InputManager
    processInput(); // Process our game-specific inputs

    // Update game state
    updateModel();

    // Calculate FPS
    calculateAverageFrameRate();

    // Schedule next frame
    scheduleNextFrame();
}

function scheduleNextFrame() {
    setTimeout(() => {
        animationFrameId = requestAnimationFrame(update);
    }, 1000 / targetFPS);
}

function calculateAverageFrameRate() {
    if (deltaTime === 0) return;

    if (frameRateArray.length > 30) {
        frameRateArray.shift();
    }
    frameRateArray.push(1 / deltaTime);

    const sum = frameRateArray.reduce((a, b) => a + b, 0);
    const averageFrameRate = sum / frameRateArray.length;

    document.getElementById("actualFrameRate").textContent = Math.round(averageFrameRate);
}

function setFrameRate(rate) {
    targetFPS = rate;
    frameRateArray = []; // Reset FPS history on rate change
}

function initController() {
    animationFrameId = requestAnimationFrame(update);
}

function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Light control functions
function turnOffPointLights() {
    for (let i = 0; i < lights.length; i++) {
        if (lights[i].isDirectional === false) {
            lights[i].setIntensity(0);
        }
    }
    updateLightUniforms();
}

function turnOnPointLights() {
    for (let i = 0; i < lights.length; i++) {
        if (lights[i].isDirectional === false) {
            lights[i].setIntensity(3);
        }
    }
    updateLightUniforms();
}

function turnOffDirectionalLights() {
    for (let i = 0; i < lights.length; i++) {
        if (lights[i].isDirectional === true) {
            lights[i].setIntensity(0);
        }
    }
    updateLightUniforms();
}

function turnOnDirectionalLights() {
    for (let i = 0; i < lights.length; i++) {
        if (lights[i].isDirectional === true) {
            lights[i].setIntensity(3);
        }
    }
    updateLightUniforms();
}