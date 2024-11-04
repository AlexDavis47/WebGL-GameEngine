// State tracking
const keyStates = new Map(); // Current frame state
const previousKeyStates = new Map(); // Last frame state

// Mouse tracking
let mouseX = 0;
let mouseY = 0;
let mouseDeltaX = 0;
let mouseDeltaY = 0;
let previousMouseX = 0;
let previousMouseY = 0;

// Mouse button states
const mouseStates = new Map();
const previousMouseStates = new Map();

// Pointer lock state
let isPointerLocked = false;

// Initialize pointer lock
const canvas = document.getElementById('gameCanvas');
canvas.addEventListener('click', () => {
    if (!isPointerLocked) {
        canvas.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === canvas;

    // Reset mouse positions when pointer lock changes to prevent jumps
    if (isPointerLocked) {
        previousMouseX = mouseX;
        previousMouseY = mouseY;
    }
});

// Input event handlers
document.addEventListener('keydown', (event) => {
    keyStates.set(event.code, true);
});

document.addEventListener('keyup', (event) => {
    keyStates.set(event.code, false);
});

document.addEventListener('mousedown', (event) => {
    mouseStates.set(event.button, true);
});

document.addEventListener('mouseup', (event) => {
    mouseStates.set(event.button, false);
});

document.addEventListener('mousemove', (event) => {
    if (isPointerLocked) {
        // Use movementX/Y for pointer lock which gives us relative movement
        mouseX += event.movementX;
        mouseY += event.movementY;
    } else {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
});

// Core input checking functions
function isKeyPressed(keyCode) {
    return keyStates.get(keyCode) === true;
}

function isKeyJustPressed(keyCode) {
    return keyStates.get(keyCode) === true && previousKeyStates.get(keyCode) !== true;
}

function isKeyJustReleased(keyCode) {
    return keyStates.get(keyCode) !== true && previousKeyStates.get(keyCode) === true;
}

function isMouseButtonPressed(button) {
    return mouseStates.get(button) === true;
}

function isMouseButtonJustPressed(button) {
    return mouseStates.get(button) === true && previousMouseStates.get(button) !== true;
}

function isMouseButtonJustReleased(button) {
    return mouseStates.get(button) !== true && previousMouseStates.get(button) === true;
}

// Update function to be called at start of each frame
function updateInput() {
    // Store previous key states
    previousKeyStates.clear();
    keyStates.forEach((value, key) => {
        previousKeyStates.set(key, value);
    });

    // Store previous mouse states
    previousMouseStates.clear();
    mouseStates.forEach((value, button) => {
        previousMouseStates.set(button, value);
    });

    // Update mouse position
    mouseDeltaX = mouseX - previousMouseX;
    mouseDeltaY = mouseY - previousMouseY;
    previousMouseX = mouseX;
    previousMouseY = mouseY;
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

// Pointer lock status
function isPointerLockActive() {
    return isPointerLocked;
}

// Mouse button constants
const MouseButton = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
    SCROLL_UP: 3,
    SCROLL_DOWN: 4
};

// Key mappings using event.code values
const Keys = {
    // Letters
    A: 'KeyA',
    B: 'KeyB',
    C: 'KeyC',
    D: 'KeyD',
    E: 'KeyE',
    F: 'KeyF',
    G: 'KeyG',
    H: 'KeyH',
    I: 'KeyI',
    J: 'KeyJ',
    K: 'KeyK',
    L: 'KeyL',
    M: 'KeyM',
    N: 'KeyN',
    O: 'KeyO',
    P: 'KeyP',
    Q: 'KeyQ',
    R: 'KeyR',
    S: 'KeyS',
    T: 'KeyT',
    U: 'KeyU',
    V: 'KeyV',
    W: 'KeyW',
    X: 'KeyX',
    Y: 'KeyY',
    Z: 'KeyZ',

    // Numbers (main keyboard)
    ZERO: 'Digit0',
    ONE: 'Digit1',
    TWO: 'Digit2',
    THREE: 'Digit3',
    FOUR: 'Digit4',
    FIVE: 'Digit5',
    SIX: 'Digit6',
    SEVEN: 'Digit7',
    EIGHT: 'Digit8',
    NINE: 'Digit9',

    // Arrow keys
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',

    // Special keys
    SPACE: 'Space',
    ENTER: 'Enter',
    TAB: 'Tab',
    ESCAPE: 'Escape',
    BACKSPACE: 'Backspace',
    SHIFT_LEFT: 'ShiftLeft',
    SHIFT_RIGHT: 'ShiftRight',
    CONTROL_LEFT: 'ControlLeft',
    CONTROL_RIGHT: 'ControlRight',
    ALT_LEFT: 'AltLeft',
    ALT_RIGHT: 'AltRight',

    // Function keys
    F1: 'F1',
    F2: 'F2',
    F3: 'F3',
    F4: 'F4',
    F5: 'F5',
    F6: 'F6',
    F7: 'F7',
    F8: 'F8',
    F9: 'F9',
    F10: 'F10',
    F11: 'F11',
    F12: 'F12'
};