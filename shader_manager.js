// shader_manager.js

class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.shaderPrograms = new Map();
        this.defaultProgram = null;

        // Initialize the base spatial shader
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
        vec3 vertexModify(vec3 vertex, vec3 normal, vec2 uv) {
            return vertex;
        }

        void main() {
            // Start with original values
            vec3 vertex = a_position;
            vec3 normal = a_normal;
            vec2 uv = a_texcoord;
            
            // Apply user modifications
            vertex = vertexModify(vertex, normal, uv);
            
            // Transform vertex to world space
            vec4 worldPosition = u_worldMatrix * vec4(vertex, 1.0);
            v_worldPos = worldPosition.xyz;
            
            // Transform normal to world space
            v_normal = normalize((u_normalMatrix * vec4(normal, 0.0)).xyz);
            
            // Pass texture coordinates
            v_texcoord = uv;
            
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

        // Output color
        out vec4 fragColor;

        // User fragment modifications
        vec4 fragmentModify(vec3 baseColor, vec3 normal, vec2 uv) {
            return vec4(baseColor, 1.0);
        }

        void main() {
            // Get base color
            vec3 baseColor = u_useTexture ? texture(u_mainTexture, v_texcoord).rgb : u_baseColor;
            
            // Apply user modifications
            fragColor = fragmentModify(baseColor, normalize(v_normal), v_texcoord);
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

    createCustomShader(name, options = {}) {
        // Get the base spatial shader sources
        const baseProgram = this.shaderPrograms.get('spatial');
        let vertexShader = baseProgram.vertexSource;
        let fragmentShader = baseProgram.fragmentSource;

        // If custom vertex modifications are provided
        if (options.vertexModify) {
            vertexShader = vertexShader.replace(
                'vec3 vertexModify(vec3 vertex, vec3 normal, vec2 uv) {\n            return vertex;\n        }',
                `vec3 vertexModify(vec3 vertex, vec3 normal, vec2 uv) {\n            ${options.vertexModify}\n        }`
            );
        }

        // If custom fragment modifications are provided
        if (options.fragmentModify) {
            fragmentShader = fragmentShader.replace(
                'vec4 fragmentModify(vec3 baseColor, vec3 normal, vec2 uv) {\n            return vec4(baseColor, 1.0);\n        }',
                `vec4 fragmentModify(vec3 baseColor, vec3 normal, vec2 uv) {\n            ${options.fragmentModify}\n        }`
            );
        }

        // If additional uniforms are provided
        if (options.uniforms) {
            // Add uniform declarations to both shaders
            const uniformDeclarations = options.uniforms.map(u => `uniform ${u.type} ${u.name};`).join('\n');
            vertexShader = uniformDeclarations + '\n' + vertexShader;
            fragmentShader = uniformDeclarations + '\n' + fragmentShader;
        }

        return this.createProgram(name, vertexShader, fragmentShader);
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

// Example shader modifications that can be exported
export const redShader = {
    fragmentModify: `
        return vec4(1.0, 0.0, 0.0, 1.0); // Pure red
    `
};

export const phongShader = {
    fragmentModify: `
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = baseColor * diff;
        
        // Add specular
        vec3 viewDir = normalize(vec3(0.0, 0.0, 5.0) - v_worldPos);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = vec3(0.5) * spec;
        
        return vec4(diffuse + specular + baseColor * 0.1, 1.0);
    `
};

export default ShaderManager;