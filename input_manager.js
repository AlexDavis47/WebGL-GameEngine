// Current state tracking
const pressedKeys = new Set();
const pressedMouseButtons = new Set();

// Previous frame state tracking
const previousKeys = new Set();
const previousMouseButtons = new Set();

// Mouse position tracking
let mouseX = 0;
let mouseY = 0;
let mouseDeltaX = 0;
let mouseDeltaY = 0;
let previousMouseX = 0;
let previousMouseY = 0;

// Input event handlers
document.addEventListener('keydown', (event) => {
    pressedKeys.add(event.code);
});

document.addEventListener('keyup', (event) => {
    pressedKeys.delete(event.code);
});

document.addEventListener('mousedown', (event) => {
    pressedMouseButtons.add(event.button);
});

document.addEventListener('mouseup', (event) => {
    pressedMouseButtons.delete(event.button);
});

document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

// Core input checking functions
function isKeyPressed(keyCode) {
    return pressedKeys.has(keyCode);
}

function isKeyJustPressed(keyCode) {
    return pressedKeys.has(keyCode) && !previousKeys.has(keyCode);
}

function isKeyJustReleased(keyCode) {
    return !pressedKeys.has(keyCode) && previousKeys.has(keyCode);
}

function isMouseButtonDown(button) {
    return pressedMouseButtons.has(button);
}

function isMouseButtonPressed(button) {
    return pressedMouseButtons.has(button) && !previousMouseButtons.has(button);
}

function isMouseButtonReleased(button) {
    return !pressedMouseButtons.has(button) && previousMouseButtons.has(button);
}

// Mouse position getters
function getMouseX() {
    return mouseX;
}

function getMouseY() {
    return mouseY;
}

function getMouseDeltaX() {
    return mouseDeltaX;
}

function getMouseDeltaY() {
    return mouseDeltaY;
}

// Update function to be called each frame
function updateInput() {
    // Update mouse delta
    mouseDeltaX = mouseX - previousMouseX;
    mouseDeltaY = mouseY - previousMouseY;
    previousMouseX = mouseX;
    previousMouseY = mouseY;

    // Store current frame's state for next frame
    previousKeys.clear();
    previousMouseButtons.clear();
    pressedKeys.forEach(key => previousKeys.add(key));
    pressedMouseButtons.forEach(button => previousMouseButtons.add(button));
}

// Common key codes for convenience
const Keys = {
    W: 'KeyW',
    A: 'KeyA',
    S: 'KeyS',
    D: 'KeyD',
    SPACE: 'Space',
    SHIFT: 'ShiftLeft',
    CTRL: 'ControlLeft',
    ONE: 'Digit1',
    TWO: 'Digit2',
    THREE: 'Digit3',
    FOUR: 'Digit4',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown'
};

// Mouse button codes for convenience
const MouseButton = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};