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

        // Framebuffer management for multi-pass rendering
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
        const spatialShader = await this.getShaderSource('./assets/shaders/CORE_SPATIAL.glsl');
        this.createProgram('spatial', spatialShader);
        this.setDefaultProgram('spatial');
    }

    createShaderWithDefines(type, source, defines = {}) {
        // Extract the version directive if it exists
        const versionMatch = source.match(/^(#version [^\n]*\n)/);
        const version = versionMatch ? versionMatch[1] : '';

        // Remove version from source if found
        const sourceWithoutVersion = versionMatch ?
            source.slice(versionMatch[1].length) :
            source;

        // Combine version, defines, and remaining source
        const processedSource = version +
            Object.entries(defines)
                .map(([key, value]) => `#define ${key} ${value}\n`)
                .join('') +
            sourceWithoutVersion;

        return this.createShader(type, processedSource);
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

    createProgram(name, shaderSource, customDefines = {}) {
        // Add appropriate shader type defines
        const vertexDefines = { ...customDefines, VERTEX_SHADER: 1 };
        const fragmentDefines = { ...customDefines, FRAGMENT_SHADER: 1 };

        const vertexShader = this.createShaderWithDefines(gl.VERTEX_SHADER, shaderSource, vertexDefines);
        const fragmentShader = this.createShaderWithDefines(gl.FRAGMENT_SHADER, shaderSource, fragmentDefines);

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
            shaderSource
        };

        this.shaderPrograms.set(name, programInfo);
        return programInfo;
    }


    createCustomShader(name, {shaderCode}) {
        // Get the base spatial shader source
        const baseProgram = this.shaderPrograms.get('spatial');
        if (!baseProgram || !baseProgram.shaderSource) {
            throw new Error('Base spatial shader not found');
        }

        // Update the function signatures in the replacement to match the base shader
        const updatedShaderCode = shaderCode.replace(
            /vec4\s+fragment\s*\(\s*vec3\s+baseColor\s*,\s*vec3\s+normal\s*,\s*vec2\s+uv\s*\)/g,
            'vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass)'
        );

        // Find and replace just the fragment function
        const modifiedSource = baseProgram.shaderSource.replace(
            /\/\/ Default fragment implementation[\s\S]*?^}(?=\s*\n)/m,
            updatedShaderCode
        );

        // Create the program with the modified source
        return this.createProgram(name, modifiedSource);
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
        this.setTransformUniforms(program, camera, model);
        this.setMaterialUniforms(program, model.material);
        this.setLightUniforms(program, scene);
        this.setCustomUniforms(program);
    }


    setTransformUniforms(program, camera, model) {
        const {uniforms} = program;

        if (uniforms.get('u_worldMatrix')) {
            gl.uniformMatrix4fv(uniforms.get('u_worldMatrix'), false, model.worldMatrix);
        }
        if (uniforms.get('u_viewMatrix')) {
            gl.uniformMatrix4fv(uniforms.get('u_viewMatrix'), false, camera.viewMatrix);
        }
        if (uniforms.get('u_projectionMatrix')) {
            gl.uniformMatrix4fv(uniforms.get('u_projectionMatrix'), false, camera.projectionMatrix);
        }

        // Normal matrix
        if (uniforms.get('u_normalMatrix')) {
            const normalMatrix = mat4.create();
            mat4.invert(normalMatrix, model.worldMatrix);
            mat4.transpose(normalMatrix, normalMatrix);
            gl.uniformMatrix4fv(uniforms.get('u_normalMatrix'), false, normalMatrix);
        }

        // Camera position for specular calculations
        if (uniforms.get('u_cameraPosition')) {
            const cameraPos = camera.getPositionWorld();
            gl.uniform3fv(uniforms.get('u_cameraPosition'), cameraPos);
        }

        // Viewport for multi-pass effects
        if (uniforms.get('u_viewport')) {
            const vp = gl.getParameter(gl.VIEWPORT);
            gl.uniform4fv(uniforms.get('u_viewport'), new Float32Array(vp));
        }
    }

    setLightUniforms(program, scene) {
        const {uniforms} = program;

        // Get all lights in the scene
        const lights = scene.findByType(Light);
        const numLights = Math.min(lights.length, 8); // Maximum 8 lights

        if (uniforms.get('u_numLights') !== null) {
            gl.uniform1i(uniforms.get('u_numLights'), numLights);
        }

        // Set each light's uniforms
        for (let i = 0; i < numLights; i++) {
            const light = lights[i];
            const lightData = light.getShaderLight();
            const prefix = `u_lights[${i}]`;

            // Set light type
            if (uniforms.get(`${prefix}.type`) !== null) {
                gl.uniform1i(uniforms.get(`${prefix}.type`), lightData.type);
            }

            // Set light position in world space
            if (uniforms.get(`${prefix}.position`) !== null) {
                const worldPos = light.getPositionWorld();
                gl.uniform3fv(uniforms.get(`${prefix}.position`), new Float32Array(worldPos));
            }

            // Set light direction in world space
            if (uniforms.get(`${prefix}.direction`) !== null) {
                const worldDir = light.getForwardVector();
                gl.uniform3fv(uniforms.get(`${prefix}.direction`), new Float32Array(worldDir));
            }

            // Set light color and intensity
            if (uniforms.get(`${prefix}.color`) !== null) {
                gl.uniform3fv(uniforms.get(`${prefix}.color`), new Float32Array(lightData.color));
            }
            if (uniforms.get(`${prefix}.intensity`) !== null) {
                gl.uniform1f(uniforms.get(`${prefix}.intensity`), lightData.intensity);
            }
            if (uniforms.get(`${prefix}.range`) !== null) {
                gl.uniform1f(uniforms.get(`${prefix}.range`), lightData.range || 10.0);
            }
        }
    }
    // In ShaderManager.js
    setMaterialUniforms(program, material) {
        const {uniforms} = program;
        if (!material) {
            console.warn('No material provided to setMaterialUniforms');
            return;
        }

        // Multi-pass handling
        const currentPass = material._activePass || 0;

        // Handle previous pass texture
        if (currentPass > 0 && this.pingPongBuffers.read) {
            if (uniforms.get('u_previousPass')) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.pingPongBuffers.read.texture);
                gl.uniform1i(uniforms.get('u_previousPass'), 0);
            }
            if (uniforms.get('u_hasPreviousPass')) {
                gl.uniform1i(uniforms.get('u_hasPreviousPass'), 1);
            }
        } else if (uniforms.get('u_hasPreviousPass')) {
            gl.uniform1i(uniforms.get('u_hasPreviousPass'), 0);
        }

        // Set PBR material properties with safe defaults
        const baseColorFactor = material.baseColorFactor || [1.0, 1.0, 1.0, 1.0];
        const metallicFactor = material.metallicFactor ?? 1.0;
        const roughnessFactor = material.roughnessFactor ?? 1.0;
        const emissiveFactor = material.emissiveFactor || [0.0, 0.0, 0.0];
        const baseColor = material.baseColor || [1.0, 1.0, 1.0];

        // Set uniforms with validation
        if (uniforms.get('u_BaseColorFactor')) {
            gl.uniform4fv(uniforms.get('u_BaseColorFactor'), new Float32Array(baseColorFactor));
        }
        if (uniforms.get('u_baseColor')) {
            gl.uniform3fv(uniforms.get('u_baseColor'), new Float32Array(baseColor));
        }
        if (uniforms.get('u_MetallicFactor')) {
            gl.uniform1f(uniforms.get('u_MetallicFactor'), metallicFactor);
        }
        if (uniforms.get('u_RoughnessFactor')) {
            gl.uniform1f(uniforms.get('u_RoughnessFactor'), roughnessFactor);
        }
        if (uniforms.get('u_EmissiveFactor')) {
            gl.uniform3fv(uniforms.get('u_EmissiveFactor'), new Float32Array(emissiveFactor));
        }

        // Handle textures
        let textureUnit = 1; // Start at 1 since 0 is used for previous pass

        // Base color / Albedo texture
        if (material.baseColorMap || material.albedoMap) {
            const texture = material.baseColorMap || material.albedoMap;
            if (uniforms.get('u_BaseColorMap')) {
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(uniforms.get('u_BaseColorMap'), textureUnit);
                gl.uniform1i(uniforms.get('u_HasBaseColorMap'), 1);
                textureUnit++;
            }
        } else if (uniforms.get('u_HasBaseColorMap')) {
            gl.uniform1i(uniforms.get('u_HasBaseColorMap'), 0);
        }

        // Legacy texture support
        if (material.albedoMap && uniforms.get('u_mainTexture')) {
            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, material.albedoMap);
            gl.uniform1i(uniforms.get('u_mainTexture'), textureUnit);
            gl.uniform1i(uniforms.get('u_useTexture'), 1);
            textureUnit++;
        } else if (uniforms.get('u_useTexture')) {
            gl.uniform1i(uniforms.get('u_useTexture'), 0);
        }

        // Custom uniforms from material
        if (material._uniforms) {
            for (const [name, value] of material._uniforms) {
                const location = uniforms.get(name);
                if (location !== null && location !== undefined) {
                    this.setUniformValue(location, value);
                }
            }
        }

        // Pass-specific uniforms
        const currentPassData = material._passes[currentPass];
        if (currentPassData && currentPassData.uniforms) {
            for (const [name, value] of currentPassData.uniforms) {
                const location = uniforms.get(name);
                if (location !== null && location !== undefined) {
                    this.setUniformValue(location, value);
                }
            }
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
        if (value === null || value === undefined) {
            console.warn('Attempted to set uniform with null or undefined value');
            return;
        }

        try {
            if (Array.isArray(value) || value instanceof Float32Array) {
                const array = value instanceof Float32Array ? value : new Float32Array(value);
                switch (array.length) {
                    case 2:
                        gl.uniform2fv(location, array);
                        break;
                    case 3:
                        gl.uniform3fv(location, array);
                        break;
                    case 4:
                        gl.uniform4fv(location, array);
                        break;
                    case 9:
                        gl.uniformMatrix3fv(location, false, array);
                        break;
                    case 16:
                        gl.uniformMatrix4fv(location, false, array);
                        break;
                    default:
                        console.warn(`Unexpected uniform array length: ${array.length}`);
                }
            } else if (typeof value === 'number') {
                gl.uniform1f(location, value);
            } else if (typeof value === 'boolean') {
                gl.uniform1i(location, value ? 1 : 0);
            }
        } catch (error) {
            console.error('Error setting uniform value:', error);
            console.debug('Location:', location, 'Value:', value);
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