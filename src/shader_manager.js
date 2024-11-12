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

        // New: Framebuffer management for multi-pass rendering
        this.framebuffers = new Map();
        this.currentFramebuffer = null;

        this.pingPongBuffers = {
            read: null,
            write: null
        };

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
            if (typeof path === 'string' && path.includes('\n')) {
                return path;
            }

            // Note: glslify processing is handled by Vite plugin
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

    // In ShaderManager.js

    createCustomShader(name, {shaderCode}) {
        // Get the base spatial shader sources
        const baseProgram = this.shaderPrograms.get('spatial');
        let vertexShader = baseProgram.vertexSource;
        let fragmentShader = baseProgram.fragmentSource;

        // Update the function signatures in the replacement
        const updatedShaderCode = shaderCode.replace(
            /vec4\s+fragment\s*\(\s*vec3\s+baseColor\s*,\s*vec3\s+normal\s*,\s*vec2\s+uv\s*\)/g,
            'vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass)'
        );

        // Replace the default fragment and light functions with the custom ones
        fragmentShader = fragmentShader.replace(
            /\/\/ Default fragment implementation[\s\S]*?}[\s\S]*?\/\/ Default light implementation[\s\S]*?}/,
            updatedShaderCode
        );

        return this.createProgram(name, vertexShader, fragmentShader);
    }

    async loadShader(name, path) {
        try {
            const shaderCode = await this.getShaderSource(path);
            return this.createCustomShader(name, {shaderCode});
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

    // In ShaderManager.js, modify beginPass:

    beginPass(passIndex, material) {
        const pass = material._passes[passIndex];
        if (!pass) return false;

        // Get current viewport settings
        const vp = gl.getParameter(gl.VIEWPORT);
        const [vpX, vpY, vpWidth, vpHeight] = vp;

        const isLastPass = passIndex === material._passes.length - 1;
        if (isLastPass) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // Use the same viewport settings as the game
            gl.viewport(vpX, vpY, vpWidth, vpHeight);
            return true;
        }

        // Create or recreate buffers if needed
        if (!this.pingPongBuffers.read ||
            this.pingPongBuffers.read.width !== vpWidth ||
            this.pingPongBuffers.read.height !== vpHeight) {

            // Cleanup old buffers
            if (this.pingPongBuffers.read) {
                this.cleanupFramebuffer(this.pingPongBuffers.read);
            }
            if (this.pingPongBuffers.write) {
                this.cleanupFramebuffer(this.pingPongBuffers.write);
            }

            // Create new buffers at the viewport size
            this.pingPongBuffers.read = this.createFramebuffer(vpWidth, vpHeight);
            this.pingPongBuffers.write = this.createFramebuffer(vpWidth, vpHeight);
        }

        // Bind write buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingPongBuffers.write.framebuffer);

        // Use the same viewport settings for intermediate passes
        gl.viewport(vpX, vpY, vpWidth, vpHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        return true;
    }

    cleanupFramebuffer(fb) {
        if (fb.framebuffer) gl.deleteFramebuffer(fb.framebuffer);
        if (fb.texture) gl.deleteTexture(fb.texture);
        if (fb.depthBuffer) gl.deleteRenderbuffer(fb.depthBuffer);
    }


    createFramebuffer(width, height) {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        return {
            framebuffer,
            texture,
            depthBuffer,
            width,
            height
        };
    }

    // New: End a render pass
    endPass() {
        // Swap buffers
        const temp = this.pingPongBuffers.read;
        this.pingPongBuffers.read = this.pingPongBuffers.write;
        this.pingPongBuffers.write = temp;
    }


    setUniforms(program, camera, model, scene) {
        // Get the material
        const material = model.material;

        // Basic transforms
        this.setTransformUniforms(program, camera, model);

        // Lighting
        this.setLightUniforms(program, scene);

        // Material properties
        this.setMaterialUniforms(program, material);

        // Set material's custom uniforms
        this.setCustomMaterialUniforms(program, material);

        // Custom uniforms (like time)
        this.setCustomUniforms(program);
    }


    setTransformUniforms(program, camera, model) {
        const {uniforms} = program;

        gl.uniformMatrix4fv(uniforms.get('u_worldMatrix'), false, model.worldMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_viewMatrix'), false, camera.viewMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_projectionMatrix'), false, camera.projectionMatrix);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, model.worldMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_normalMatrix'), false, normalMatrix);

        const cameraPos = new Float32Array(camera.getPositionWorld());
        gl.uniform3fv(uniforms.get('u_cameraPosition'), cameraPos);

        // Add viewport uniform
        const vp = gl.getParameter(gl.VIEWPORT);
        if (uniforms.get('u_viewport')) {
            gl.uniform4fv(uniforms.get('u_viewport'), new Float32Array(vp));
        }
    }
    setLightUniforms(program, scene) {
        const {uniforms} = program;


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

    // In ShaderManager.js
    setMaterialUniforms(program, material) {
        const {uniforms} = program;
        const currentPass = material._activePass;

        // Handle previous pass texture if we're not in the first pass
        if (currentPass > 0 && this.pingPongBuffers.read) {
            // Bind read buffer's texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.pingPongBuffers.read.texture);

            if (uniforms.get('u_previousPass') !== null) {
                gl.uniform1i(uniforms.get('u_previousPass'), 0);
            }
            if (uniforms.get('u_hasPreviousPass') !== null) {
                gl.uniform1i(uniforms.get('u_hasPreviousPass'), 1);
            }
        } else {
            if (uniforms.get('u_hasPreviousPass') !== null) {
                gl.uniform1i(uniforms.get('u_hasPreviousPass'), 0);
            }
        }

        // Regular material uniforms
        gl.uniform3fv(uniforms.get('u_baseColor'), material.baseColor);
        gl.uniform1f(uniforms.get('u_metallic'), material.metallic);
        gl.uniform1f(uniforms.get('u_roughness'), material.roughness);

        if (material.albedoMap) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, material.albedoMap);
            gl.uniform1i(uniforms.get('u_mainTexture'), 1);
            gl.uniform1i(uniforms.get('u_useTexture'), 1);
        } else {
            gl.uniform1i(uniforms.get('u_useTexture'), 0);
        }
    }


    setCustomMaterialUniforms(program, material) {
        const {uniforms} = program;

        // Set any custom uniforms from the material
        for (const [name, value] of material._uniforms) {
            const location = uniforms.get(name);
            if (location) {
                this.setUniformValue(location, value);
            }
        }

        // Set pass-specific uniforms if we're in a pass
        const currentPass = material._passes[material._activePass];
        if (currentPass) {
            for (const [name, value] of currentPass.uniforms) {
                const location = uniforms.get(name);
                if (location) {
                    this.setUniformValue(location, value);
                }
            }
        }
    }


    setUniformValue(location, value) {
        if (Array.isArray(value)) {
            switch (value.length) {
                case 2:
                    gl.uniform2fv(location, value);
                    break;
                case 3:
                    gl.uniform3fv(location, value);
                    break;
                case 4:
                    gl.uniform4fv(location, value);
                    break;
                case 9:
                    gl.uniformMatrix3fv(location, false, value);
                    break;
                case 16:
                    gl.uniformMatrix4fv(location, false, value);
                    break;
            }
        } else if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else if (typeof value === 'boolean') {
            gl.uniform1i(location, value ? 1 : 0);
        }
    }


    setCustomUniforms(program) {
        const {uniforms} = program;


        if (uniforms.get('u_time')) {
            gl.uniform1f(uniforms.get('u_time'), performance.now() / 1000.0);
        }
    }

}

const shaderManager = new ShaderManager();
export default shaderManager;