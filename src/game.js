
import TestScene from './test_scene.js';
import ShaderManager from './shader_manager.js';
import { defaultVertexShader, defaultFragmentShader } from './default_shaders.js';
import engine from "./engine.js";
import input_manager from "./input_manager.js";
import physicsManager from "./physics_manager.js";
import audioManager from "./audio_manager.js";

class Game {
    constructor(options = {}) {
        // Canvas setup
        this._canvas = document.getElementById('gameCanvas');

        // Store reference in engine
        engine.game = this;

        // Scene management
        this._activeScene = null;

        // Game state
        this._isRunning = false;
        this._isPaused = false;

        // Timing
        this._lastFrameTime = 0;
        this._targetFPS = options.targetFPS || 60;
        this._fixedTimeStep = 1 / this._targetFPS;
        this._maxFrameTime = this._fixedTimeStep * 5;
        this._accumulator = 0;

        // Resolution
        this._targetAspectRatio = options.aspectRatio || 16/9;
        this._pixelsPerUnit = options.pixelsPerUnit || 100;

        this.init().then(r => console.log('Game initialized'));
    }


    async init() {
        // Initialize engine with our canvas
        await engine.init(this._canvas);


        this.setupGLState();
        this.setupEvents();
        this.resizeCanvas();
        await this.createInitialScene();

        this._isRunning = true;
        this._lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    setupGLState() {

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }

    setupEvents() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    async createInitialScene() {
        const scene = new TestScene();
        await this.setScene(scene);
    }

    onWindowResize() {
        this.resizeCanvas();
    }

    resizeCanvas() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;

        console.log('Container dimensions:', containerWidth, 'x', containerHeight);
        console.log('Target aspect ratio:', this._targetAspectRatio);

        // Set canvas resolution
        this._canvas.width = containerWidth * pixelRatio;
        this._canvas.height = containerHeight * pixelRatio;

        // Set canvas style
        this._canvas.style.width = `${containerWidth}px`;
        this._canvas.style.height = `${containerHeight}px`;

        // Calculate viewport dimensions
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

        console.log('Viewport dimensions:', viewportWidth, 'x', viewportHeight);
        console.log('Viewport aspect ratio:', viewportWidth / viewportHeight);

        // Set GL viewport
        gl.viewport(viewportX, viewportY, viewportWidth, viewportHeight);

        // Update camera with the correct aspect ratio
        if (this._activeScene?.activeCamera) {
            const viewportAspectRatio = viewportWidth / viewportHeight;
            console.log('Setting camera aspect ratio to:', viewportAspectRatio);
            this._activeScene.activeCamera.setAspectRatio(viewportAspectRatio);
        }
    }

    async gameLoop(currentTime) {
        if (!this._isRunning) return;

        await input_manager.update();

        // Calculate frame time and clamp it
        let deltaTime = (currentTime - this._lastFrameTime) / 1000;

        deltaTime = Math.min(deltaTime, this._maxFrameTime);

        // Update
        if (!this._isPaused) {
            physicsManager.step();
            if (this._activeScene) {
                this._activeScene.update(deltaTime);
            }
        }
        this._accumulator -= this._fixedTimeStep;

        // Render
        if (this._activeScene) {
            this._activeScene.render(gl);
        }



        this._lastFrameTime = currentTime;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    async setScene(scene) {
        if (this._activeScene) {
            this._activeScene.destroy();
        }
        this._activeScene = scene;
        if (this._activeScene) {
            await scene.init(gl);  // Wait for scene initialization
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
        return gl;
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