import TestScene from './test_scene.js';
import ShaderManager from './shader_manager.js';
import { defaultVertexShader, defaultFragmentShader } from './default_shaders.js';

class Game {
    constructor(options = {}) {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.gl = null;

        // Scene management
        this.activeScene = null;
        this.shaderManager = null;

        // Game state
        this.isRunning = false;
        this.isPaused = false;

        // Timing
        this.lastFrameTime = 0;
        this.targetFPS = options.targetFPS || 120; // This is the default FPS value
        this.frameRateUnlocked = true;
        this.frameInterval = 1000 / this.targetFPS;
        this.accumulator = 0;

        // Resolution
        this.targetAspectRatio = options.aspectRatio || 16/9;
        this.pixelsPerUnit = options.pixelsPerUnit || 100; // For example, if you move by 1 unit, you move by 100 pixels (default)

        this.init();
    }

    init() {
        // Initialize WebGL context
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }

        // Initialize shader manager and create default shader
        this.shaderManager = new ShaderManager(this.gl);
        this.gl.shaderManager = this.shaderManager;
        const defaultProgram = this.shaderManager.createProgram(
            'default',
            defaultVertexShader,
            defaultFragmentShader
        );
        this.shaderManager.setDefaultProgram('default');
        this.gl.defaultProgram = defaultProgram;

        // Set clear color to black
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        // Enable depth testing
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        // Set up resize handling
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Create and set up test scene
        const scene = new TestScene();
        this.setScene(scene);

        // Start game loop
        this.isRunning = true;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    resizeCanvas() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;

        // Calculate the dimensions that maintain our target aspect ratio
        let width, height;
        const containerAspectRatio = containerWidth / containerHeight;

        if (containerAspectRatio > this.targetAspectRatio) {
            // Container is wider than target ratio - height determines size
            height = containerHeight;
            width = height * this.targetAspectRatio;
        } else {
            // Container is taller than target ratio - width determines size
            width = containerWidth;
            height = width / this.targetAspectRatio;
        }

        // Update canvas style for display size
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        // Center the canvas
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${(containerWidth - width) / 2}px`;
        this.canvas.style.top = `${(containerHeight - height) / 2}px`;

        // Set the canvas's internal resolution
        const pixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = width * pixelRatio;
        this.canvas.height = height * pixelRatio;

        // Update WebGL viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Notify active scene of resize (if it has a camera that needs updating)
        if (this.activeScene && this.activeScene.activeCamera) {
            this.activeScene.activeCamera.updateProjectionMatrix(this.gl);
        }
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        // Calculate frame delta and update accumulator
        let deltaTime = currentTime - this.lastFrameTime;
        let fixedDeltaTime = this.frameInterval / 1000;
        this.accumulator += deltaTime;

        // Update game at fixed time steps
        while (this.accumulator >= this.frameInterval) {
            // Convert from milliseconds to seconds, makes more sense to define values in terms
            // of seconds (e.g. velocity is units per second, not units per millisecond)
            fixedDeltaTime = this.frameInterval / 1000;

            // If our delta time is more than 120% of the expected frame time, we're falling behind, clamp the deltatime
            if (fixedDeltaTime > this.frameInterval * 1.2) {
                fixedDeltaTime = this.frameInterval * 1.2; // TODO: I didn't actually test if this works
            }

            if (!this.isPaused) {
                if (this.activeScene) {
                    this.activeScene.update(fixedDeltaTime);
                }
            }

            this.accumulator -= this.frameInterval;
        }

        // Render at screen refresh rate
        if (this.activeScene) {
            this.activeScene.render(this.gl);
        }

        this.lastFrameTime = currentTime;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    setScene(scene) {
        if (this.activeScene) {
            this.activeScene.cleanup(); // Clean up old scene
        }
        this.activeScene = scene;
        if (this.activeScene) {
            this.activeScene.init(this.gl); // Initialize new scene
        }
    }

    setTargetFPS(fps) {
        this.targetFPS = fps;
        this.frameInterval = 1000 / fps;
        return this;
    }

    setAspectRatio(ratio) {
        this.targetAspectRatio = ratio;
        this.resizeCanvas();
        return this;
    }

    pause() {
        this.isPaused = true;
        return this;
    }

    resume() {
        this.isPaused = false;
        this.lastFrameTime = performance.now(); // Reset to prevent large delta
        return this;
    }

    stop() {
        this.isRunning = false;
        return this;
    }
}

// Create game instance with options
const game = new Game({
    targetFPS: 60,
    aspectRatio: 16/9,
    pixelsPerUnit: 100
});

export default game;