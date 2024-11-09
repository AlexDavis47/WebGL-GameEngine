class InputManager {
    constructor() {
        if (InputManager.instance) {
            return InputManager.instance;
        }
        InputManager.instance = this;

        // Key states
        this.keyStates = new Map();
        this.previousKeyStates = new Map();
        this.keyEventBuffer = new Map();

        // Mouse tracking
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.previousMouseX = 0;
        this.previousMouseY = 0;

        // Mouse button states
        this.mouseStates = new Map();
        this.previousMouseStates = new Map();
        this.mouseEventBuffer = new Map();

        // Pointer lock state
        this.isPointerLocked = false;

        return this;
    }



    initialize(canvas) {
        // Initialize pointer lock
        canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;

            if (this.isPointerLocked) {
                this.previousMouseX = this.mouseX;
                this.previousMouseY = this.mouseY;
            }
        });

        // Input event handlers
        document.addEventListener('keydown', (event) => {
            this.keyEventBuffer.set(event.code, true);
        });

        document.addEventListener('keyup', (event) => {
            this.keyEventBuffer.set(event.code, false);
        });

        document.addEventListener('mousedown', (event) => {
            this.mouseEventBuffer.set(event.button, true);
        });

        document.addEventListener('mouseup', (event) => {
            this.mouseEventBuffer.set(event.button, false);
        });

        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                this.mouseX += event.movementX;
                this.mouseY += event.movementY;
            } else {
                this.mouseX = event.clientX;
                this.mouseY = event.clientY;
            }
        });
    }

    async update() {
        // Store previous states
        this.keyStates.forEach((value, key) => {
            this.previousKeyStates.set(key, value);
        });

        this.mouseStates.forEach((value, button) => {
            this.previousMouseStates.set(button, value);
        });

        // Apply buffered events
        this.keyEventBuffer.forEach((value, key) => {
            this.keyStates.set(key, value);
        });

        this.mouseEventBuffer.forEach((value, button) => {
            this.mouseStates.set(button, value);
        });

        // Clear event buffers
        this.keyEventBuffer.clear();
        this.mouseEventBuffer.clear();

        // Update mouse deltas
        this.mouseDeltaX = this.mouseX - this.previousMouseX;
        this.mouseDeltaY = this.mouseY - this.previousMouseY;
        this.previousMouseX = this.mouseX;
        this.previousMouseY = this.mouseY;
    }

    // Input checking methods
    isKeyPressed(keyCode) {
        return this.keyStates.get(keyCode) === true;
    }

    isKeyJustPressed(keyCode) {
        return this.keyStates.get(keyCode) === true &&
            this.previousKeyStates.get(keyCode) !== true;
    }

    isKeyJustReleased(keyCode) {
        return this.keyStates.get(keyCode) !== true &&
            this.previousKeyStates.get(keyCode) === true;
    }

    isMouseButtonPressed(button) {
        return this.mouseStates.get(button) === true;
    }

    isMouseButtonJustPressed(button) {
        return this.mouseStates.get(button) === true &&
            this.previousMouseStates.get(button) !== true;
    }

    isMouseButtonJustReleased(button) {
        return this.mouseStates.get(button) !== true &&
            this.previousMouseStates.get(button) === true;
    }

    // Mouse position getters
    getMouseX() { return this.mouseX; }
    getMouseY() { return this.mouseY; }
    getMouseDeltaX() { return this.mouseDeltaX; }
    getMouseDeltaY() { return this.mouseDeltaY; }
    isPointerLockActive() { return this.isPointerLocked; }

    static getInstance() {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }
}

// Constants
export const MouseButton = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
    SCROLL_UP: 3,
    SCROLL_DOWN: 4
};

export const Keys = {
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

    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',

    SPACE: 'Space',
    SHIFT: 'ShiftLeft',
    CONTROL: 'ControlLeft',
    ALT: 'AltLeft',
    ENTER: 'Enter',
    ESCAPE: 'Escape'
};

const instance = new InputManager();
export default instance;