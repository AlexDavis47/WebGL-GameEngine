import TestScene from './test_scene.js';
import ShaderManager from './shader_manager.js';
import { defaultVertexShader, defaultFragmentShader } from './default_shaders.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.gl = null;
        this.activeScene = null;
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.shaderManager = null;

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

        // Set canvas size to match display size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Create and set up test scene
        this.setScene(new TestScene());

        // Start game loop
        this.isRunning = true;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastFrameTime) / 1000.0; // Convert to seconds
        this.lastFrameTime = currentTime;

        // Clear the canvas
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Update and render active scene
        if (this.activeScene) {
            this.activeScene.update(deltaTime);
            this.activeScene.render(this.gl);
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    setScene(scene) {
        if (this.activeScene) {
            // Clean up previous scene if needed
            this.activeScene.cleanup();
        }
        this.activeScene = scene;
        if (this.activeScene) {
            this.activeScene.init(this.gl);
        }
    }
}

// Create and export game instance
const game = new Game();
export default game;