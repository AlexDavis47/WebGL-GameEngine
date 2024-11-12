import Light from "./nodes-core/light.js";
import {mat4} from "gl-matrix";

class ShaderManager {
    constructor() {
        if (ShaderManager.instance) {
            return ShaderManager.instance;
        }
        ShaderManager.instance = this;

        this.shaderPrograms = new Map();
        this.defaultProgram = null;
        this.initialized = false;

        return this;
    }

    static getInstance() {
        if (!ShaderManager.instance) {
            ShaderManager.instance = new ShaderManager();
        }
        return ShaderManager.instance;
    }


    async init() {
        if (this.initialized) return;

        await this.initializeSpatialShader();
        this.initialized = true;
    }

    async getShaderSource(path) {
        try {
            // Handle pre-loaded shader strings
            if (typeof path === 'string' && path.includes('\n')) {
                return path;
            }

            console.log('Loading shader source from', path);

            // Load from file
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error loading shader source from ${path}:`, error);
            throw error;
        }
    }


    async initializeSpatialShader() {
        const spatialVertex = await this.getShaderSource('./assets/shaders/CORE_SPATIAL_VERTEX.glsl');
        const spatialFragment = await this.getShaderSource('./assets/shaders/CORE_SPATIAL_FRAGMENT.glsl');

        this.createProgram('spatial', spatialVertex, spatialFragment);
        this.setDefaultProgram('spatial');
    }

    createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}\nShader source:\n${source}`);
        }

        return shader;
    }

    createProgram(name, vertexSource, fragmentSource) {
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }

        // Cache uniform locations
        const uniforms = new Map();
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const uniformInfo = gl.getActiveUniform(program, i);
            uniforms.set(uniformInfo.name, gl.getUniformLocation(program, uniformInfo.name));
        }

        // Cache attribute locations
        const attributes = new Map();
        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const attributeInfo = gl.getActiveAttrib(program, i);
            attributes.set(attributeInfo.name, gl.getAttribLocation(program, attributeInfo.name));
        }

        const programInfo = {
            program,
            uniforms,
            attributes,
            vertexSource,    // Store sources for custom shader creation
            fragmentSource
        };

        this.shaderPrograms.set(name, programInfo);
        return programInfo;
    }

    createCustomShader(name, { shaderCode }) {
        // Get the base spatial shader sources
        const baseProgram = this.shaderPrograms.get('spatial');
        let vertexShader = baseProgram.vertexSource;
        let fragmentShader = baseProgram.fragmentSource;

        // Replace the default fragment and light functions with the custom ones
        // First, remove the default implementations
        fragmentShader = fragmentShader.replace(
            /\/\/ Default fragment implementation[\s\S]*?}[\s\S]*?\/\/ Default light implementation[\s\S]*?}/,
            shaderCode
        );

        return this.createProgram(name, vertexShader, fragmentShader);
    }

    async loadShader(name, path) {
        try {
            const shaderCode = await this.getShaderSource(path);
            return this.createCustomShader(name, { shaderCode });
        } catch (error) {
            console.error(`Error loading shader from ${path}:`, error);
            throw error;
        }
    }


    getProgram(name) {
        return this.shaderPrograms.get(name);
    }

    setDefaultProgram(name) {
        this.defaultProgram = this.getProgram(name);
    }

    getDefaultProgram() {
        return this.defaultProgram;
    }

    setUniforms(program, camera, model, scene) {
        // Basic transforms
        this.setTransformUniforms(program, camera, model);
        // Lighting
        this.setLightUniforms(program, scene);
        // Material
        this.setMaterialUniforms(program, model.material);
        // Custom uniforms
        this.setCustomUniforms(program);
    }

    setTransformUniforms(program, camera, model) {
        const { uniforms } = program;


        // Use proper matrix getters from new Node3D system
        gl.uniformMatrix4fv(uniforms.get('u_worldMatrix'), false, model.worldMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_viewMatrix'), false, camera.viewMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_projectionMatrix'), false, camera.projectionMatrix);

        // Normal matrix (inverse transpose of world matrix)
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, model.worldMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_normalMatrix'), false, normalMatrix);

        // Use proper world position from Node3D
        const cameraPos = new Float32Array(camera.getPositionWorld());
        gl.uniform3fv(uniforms.get('u_cameraPosition'), cameraPos);
    }

    setLightUniforms(program, scene) {
        const { uniforms } = program;


        // Get all lights in the scene
        const lights = scene.findByType(Light);
        const numLights = Math.min(lights.length, 8);

        if (uniforms.get('u_numLights')) {
            gl.uniform1i(uniforms.get('u_numLights'), numLights);
        }

        // Set each light's uniforms
        lights.slice(0, 8).forEach((light, index) => {
            const lightData = light.getShaderLight();
            const prefix = `u_lights[${index}]`;

            // Only set uniforms if they exist in the shader
            if (uniforms.get(`${prefix}.type`)) {
                gl.uniform1i(uniforms.get(`${prefix}.type`), lightData.type);
            }
            if (uniforms.get(`${prefix}.position`)) {
                gl.uniform3fv(uniforms.get(`${prefix}.position`), new Float32Array(light.getPositionWorld()));
            }
            if (uniforms.get(`${prefix}.direction`)) {
                gl.uniform3fv(uniforms.get(`${prefix}.direction`), new Float32Array(light.getForwardVector()));
            }
            if (uniforms.get(`${prefix}.color`)) {
                gl.uniform3fv(uniforms.get(`${prefix}.color`), new Float32Array(lightData.color));
            }
            if (uniforms.get(`${prefix}.intensity`)) {
                gl.uniform1f(uniforms.get(`${prefix}.intensity`), lightData.intensity);
            }
            if (uniforms.get(`${prefix}.range`)) {
                gl.uniform1f(uniforms.get(`${prefix}.range`), lightData.range);
            }
        });
    }

    setMaterialUniforms(program, material) {
        const { uniforms } = program;

        gl.uniform3fv(uniforms.get('u_baseColor'), material.baseColor);
        gl.uniform1f(uniforms.get('u_metallic'), material.metallic);
        gl.uniform1f(uniforms.get('u_roughness'), material.roughness);
        gl.uniform1i(uniforms.get('u_useTexture'), material.albedoMap ? 1 : 0);

        if (material.albedoMap) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, material.albedoMap);
            gl.uniform1i(uniforms.get('u_mainTexture'), 0);
        }
    }

    setCustomUniforms(program) {
        const { uniforms } = program;


        if (uniforms.get('u_time')) {
            gl.uniform1f(uniforms.get('u_time'), performance.now() / 1000.0);
        }
    }

}

const instance = new ShaderManager();
export default instance;