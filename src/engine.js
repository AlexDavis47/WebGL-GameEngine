import { mat4, vec3 } from 'gl-matrix';
import shaderManager from './shader_manager';

// This is a singleton class, contains helpful globals and init code.
class Engine {
    constructor() {
        if (Engine.instance) {
            return Engine.instance;
        }

        // Initialize properties in constructor
        this.gl = null;
        this.game = null;
        this.shaderManager = null;

        Engine.instance = this;
        return this;
    }


    init(canvas) {
        // Initialize WebGL
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }

        // Make gl globally available
        window.gl = this.gl;

        // Initialize shader manager after GL context is created
        shaderManager.initialize();

        return this;
    }

    static getInstance() {
        if (!Engine.instance) {
            Engine.instance = new Engine();
        }
        return Engine.instance;
    }
}

// Create the instance
const instance = new Engine();

// Export the instance directly
export default instance;