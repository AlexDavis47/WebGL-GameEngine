import TestScene from './test_scene.js';
import ShaderManager from './shader_manager.js';
import { defaultVertexShader, defaultFragmentShader } from './default_shaders.js';

class Game {
    constructor(options = {}) {
        // Canvas setup
        this._canvas = document.getElementById('gameCanvas');
        this._gl = null;

        // Scene management
        this._activeScene = null;
        this._shaderManager = null;

        // Game state
        this._isRunning = false;
        this._isPaused = false;

        // Timing
        this._lastFrameTime = 0;
        this._targetFPS = options.targetFPS || 60;
        this._fixedTimeStep = 1 / this._targetFPS;
        this._maxFrameTime = this._fixedTimeStep * 5; // Prevent spiral of death
        this._accumulator = 0;

        // Resolution
        this._targetAspectRatio = options.aspectRatio || 16/9;
        this._pixelsPerUnit = options.pixelsPerUnit || 100;

        this.init();
    }

    init() {
        // Initialize WebGL context
        this._gl = this._canvas.getContext('webgl2');
        if (!this._gl) {
            console.error('WebGL2 not supported');
            return;
        }

        // Initialize shader manager
        this.initializeShaderManager();

        // Setup GL state
        this.setupGLState();

        // Setup window events
        this.setupEvents();

        // Do initial resize
        this.resizeCanvas();  // Add this line before scene creation

        // Create and setup initial scene
        this.createInitialScene();

        // Start game loop
        this._isRunning = true;
        this._lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    initializeShaderManager() {
        this._shaderManager = new ShaderManager(this._gl);
        this._gl.shaderManager = this._shaderManager;
        const defaultProgram = this._shaderManager.createProgram(
            'default',
            defaultVertexShader,
            defaultFragmentShader
        );
        this._shaderManager.setDefaultProgram('default');
        this._gl.defaultProgram = defaultProgram;
    }

    setupGLState() {
        const gl = this._gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }

    setupEvents() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    createInitialScene() {
        const scene = new TestScene();
        this.setScene(scene);
    }

    onWindowResize() {
        this.resizeCanvas();
    }

    resizeCanvas() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;

        // Use container dimensions directly for canvas resolution
        this._canvas.width = containerWidth * pixelRatio;
        this._canvas.height = containerHeight * pixelRatio;

        // Set style size to container dimensions
        this._canvas.style.width = `${containerWidth}px`;
        this._canvas.style.height = `${containerHeight}px`;

        // Calculate viewport dimensions to maintain aspect ratio
        let viewportWidth, viewportHeight;
        const containerAspectRatio = containerWidth / containerHeight;

        if (containerAspectRatio > this._targetAspectRatio) {
            // Container is wider - fit to height
            viewportHeight = this._canvas.height;
            viewportWidth = viewportHeight * this._targetAspectRatio;
        } else {
            // Container is taller - fit to width
            viewportWidth = this._canvas.width;
            viewportHeight = viewportWidth / this._targetAspectRatio;
        }

        // Center the viewport
        const viewportX = (this._canvas.width - viewportWidth) / 2;
        const viewportY = (this._canvas.height - viewportHeight) / 2;

        // Set GL viewport
        this._gl.viewport(viewportX, viewportY, viewportWidth, viewportHeight);

        // Update camera if it exists
        if (this._activeScene?.activeCamera) {
            this._activeScene.activeCamera.updateProjectionMatrix(this._gl);
        }
    }

    gameLoop(currentTime) {
        if (!this._isRunning) return;

        // Calculate frame time and clamp it
        let frameTime = (currentTime - this._lastFrameTime) / 1000;
        frameTime = Math.min(frameTime, this._maxFrameTime);

        this._accumulator += frameTime;

        // Update at fixed time step
        while (this._accumulator >= this._fixedTimeStep) {
            if (!this._isPaused && this._activeScene) {
                this._activeScene.update(this._fixedTimeStep);
            }
            this._accumulator -= this._fixedTimeStep;
        }

        // Render
        if (this._activeScene) {
            this._activeScene.render(this._gl);
        }

        this._lastFrameTime = currentTime;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    setScene(scene) {
        if (this._activeScene) {
            this._activeScene.destroy();
        }
        this._activeScene = scene;
        if (this._activeScene) {
            this._activeScene.init(this._gl);
        }
    }

    // Configuration methods
    setTargetFPS(fps) {
        this._targetFPS = fps;
        this._fixedTimeStep = 1 / fps;
        return this;
    }

    setAspectRatio(ratio) {
        this._targetAspectRatio = ratio;
        this.resizeCanvas();
        return this;
    }

    // Game state methods
    pause() {
        this._isPaused = true;
        return this;
    }

    resume() {
        this._isPaused = false;
        this._lastFrameTime = performance.now();
        return this;
    }

    stop() {
        this._isRunning = false;
        return this;
    }

    // Getters
    get gl() {
        return this._gl;
    }

    get canvas() {
        return this._canvas;
    }

    get activeScene() {
        return this._activeScene;
    }

    get isPaused() {
        return this._isPaused;
    }

    get isRunning() {
        return this._isRunning;
    }
}

// Create game instance with options
const game = new Game({
    targetFPS: 120,
    aspectRatio: 16/9,
    pixelsPerUnit: 100
});

export default game;