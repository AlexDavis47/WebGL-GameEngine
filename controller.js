//FileName:     controller.js
//Programmer:   Dan Cliburn, Alexander Davis, Austin Medina, Maika West

let timer;
let deltaTime = 0.0;
let lastTime = 0.0;
let frame_rate = 60;
let frameRateArray = [];

// Input variables
let inputXModel = 0.0;
let inputYModel = 0.0;
let inputXLight = 0.0;
let inputYLight = 0.0;

let keys = {
    left: false,
    up: false,
    right: false,
    down: false,
    w: false,
    a: false,
    s: false,
    d: false,
    digit1: false,
    digit2: false,
    digit3: false,
    digit4: false,
};

function checkKeyDown(event) {
    if (event.keyCode === 37) keys.left = true;
    if (event.keyCode === 38) keys.up = true;
    if (event.keyCode === 39) keys.right = true;
    if (event.keyCode === 40) keys.down = true;
    if (event.keyCode === 87) keys.w = true;
    if (event.keyCode === 65) keys.a = true;
    if (event.keyCode === 83) keys.s = true;
    if (event.keyCode === 68) keys.d = true;
    if (event.keyCode === 49) keys.digit1 = true;
    if (event.keyCode === 50) keys.digit2 = true;
    if (event.keyCode === 51) keys.digit3 = true;
    if (event.keyCode === 52) keys.digit4 = true;
}

function checkKeyUp(event) {
    if (event.keyCode === 37) keys.left = false;
    if (event.keyCode === 38) keys.up = false;
    if (event.keyCode === 39) keys.right = false;
    if (event.keyCode === 40) keys.down = false;
    if (event.keyCode === 87) keys.w = false;
    if (event.keyCode === 65) keys.a = false;
    if (event.keyCode === 83) keys.s = false;
    if (event.keyCode === 68) keys.d = false;
    if (event.keyCode === 49) keys.digit1 = false;
    if (event.keyCode === 50) keys.digit2 = false;
    if (event.keyCode === 51) keys.digit3 = false;
    if (event.keyCode === 52) keys.digit4 = false;
}

function updateInput() {
    inputXModel = 0.0;
    inputYModel = 0.0;

    if (keys.left) inputXModel -= 1.0;
    if (keys.right) inputXModel += 1.0;
    if (keys.up) inputYModel += 1.0;
    if (keys.down) inputYModel -= 1.0;

    inputXLight = 0.0;
    inputYLight = 0.0;

    if (keys.a) inputXLight -= 1.0;
    if (keys.d) inputXLight += 1.0;
    if (keys.w) inputYLight += 1.0;
    if (keys.s) inputYLight -= 1.0;
}

function updateDeltaTime() {
    deltaTime = (Date.now() - lastTime) / 1000;
    lastTime = Date.now();
}

function update() {
    updateDeltaTime();

    if (!checkFocus() || deltaTime > 0.1) {
        deltaTime = 0;
        lastTime = Date.now();
        return;
    }

    if (keys.digit1) turnOffPointLights();
    if (keys.digit2) turnOnPointLights();
    if (keys.digit3) turnOffDirectionalLights();
    if (keys.digit4) turnOnDirectionalLights();


    updateInput();
    updateModel();
    calculateAverageFrameRate();
}

function checkFocus() {
    return document.hasFocus();
}

function calculateAverageFrameRate() {
    if (frameRateArray.length > 30) {
        frameRateArray.shift();
    }
    frameRateArray.push(1 / deltaTime);
    let sum = 0;
    for (let i = 0; i < frameRateArray.length; i++) {
        sum += frameRateArray[i];
    }
    let averageFrameRate = sum / frameRateArray.length;
    document.getElementById("actualFrameRate").innerHTML = Math.round(averageFrameRate);
}

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


function setFrameRate(rate) {
    frame_rate = rate;
    clearInterval(timer);
    frameRateArray = [];
    timer = setInterval(update, (1 / frame_rate) * 1000);
}

function initController() {
    setFrameRate(frame_rate);
    window.onkeydown = checkKeyDown;
    window.onkeyup = checkKeyUp;
}