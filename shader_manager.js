// shader_manager.js

class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.shaderPrograms = new Map();
        this.defaultProgram = null;

        this.initializeSpatialShader();
    }

    initializeSpatialShader() {
        const spatialVertex = `#version 300 es
        precision highp float;

        // Built-in attributes
        in vec3 a_position;
        in vec3 a_normal;
        in vec2 a_texcoord;

        // Built-in uniforms
        uniform mat4 u_worldMatrix;
        uniform mat4 u_viewMatrix;
        uniform mat4 u_projectionMatrix;
        uniform mat4 u_normalMatrix;

        // Varyings for fragment shader
        out vec3 v_normal;
        out vec3 v_worldPos;
        out vec2 v_texcoord;

        // User vertex modifications
        vec3 vertex(vec3 vertex, vec3 normal, vec2 uv) {
            return vertex;
        }

        void main() {
            // Start with original values
            vec3 vertexPos = vertex(a_position, a_normal, a_texcoord);
            
            // Transform vertex to world space
            vec4 worldPosition = u_worldMatrix * vec4(vertexPos, 1.0);
            v_worldPos = worldPosition.xyz;
            
            // Transform normal to world space
            v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);
            
            // Pass texture coordinates
            v_texcoord = a_texcoord;
            
            // Final position
            gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
        }`;

        const spatialFragment = `#version 300 es
        precision highp float;

        // Inputs from vertex shader
        in vec3 v_normal;
        in vec3 v_worldPos;
        in vec2 v_texcoord;

        // Material uniforms
        uniform vec3 u_baseColor;
        uniform float u_metallic;
        uniform float u_roughness;
        uniform sampler2D u_mainTexture;
        uniform bool u_useTexture;
        uniform vec3 u_ambientLight;
        uniform vec3 u_cameraPosition;

        // Output color
        out vec4 fragColor;

        // Forward declarations of user-defined functions
        vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv);
        vec3 light();

        void main() {
            vec3 baseColor = u_useTexture ? texture(u_mainTexture, v_texcoord).rgb : u_baseColor;
            vec3 normal = normalize(v_normal);
            
            // Get color from fragment function
            fragColor = fragment(baseColor, normal, v_texcoord);
        }

        // Default fragment implementation
        vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv) {
            // Calculate lighting
            vec3 light = light();
            return vec4(baseColor * (light + u_ambientLight), 1.0);
        }

        // Default light implementation
        vec3 light() {
            return vec3(0.0);
        }`;

        // Create the base spatial shader program
        this.createProgram('spatial', spatialVertex, spatialFragment);
        this.setDefaultProgram('spatial');
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}\nShader source:\n${source}`);
        }

        return shader;
    }

    createProgram(name, vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }

        // Cache uniform locations
        const uniforms = new Map();
        const numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const uniformInfo = this.gl.getActiveUniform(program, i);
            uniforms.set(uniformInfo.name, this.gl.getUniformLocation(program, uniformInfo.name));
        }

        // Cache attribute locations
        const attributes = new Map();
        const numAttributes = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const attributeInfo = this.gl.getActiveAttrib(program, i);
            attributes.set(attributeInfo.name, this.gl.getAttribLocation(program, attributeInfo.name));
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
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const shaderCode = await response.text();
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
}

export default ShaderManager;