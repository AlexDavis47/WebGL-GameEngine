// shader_manager.js

import Light from "./nodes-core/light.js";

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
        
            // Light type enum
            const int LIGHT_POINT = 0;
            const int LIGHT_DIRECTIONAL = 1;
            const int LIGHT_AMBIENT = 2;
        
            // Generic light structure
            struct Light {
                int type;
                vec3 position;    // Used by point lights
                vec3 direction;   // Used by directional lights
                vec3 color;
                float intensity;
                float range;      // Used by point lights
            };
        
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
            uniform vec3 u_cameraPosition;
        
            // Light uniforms
            uniform Light u_lights[8];  // Increased size to handle all types
            uniform int u_numLights;
        
            // Output color
            out vec4 fragColor;
        
            // Forward declarations of user-defined functions
            vec3 light(Light light);
            vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv);
        
            void main() {
                vec3 baseColor = u_useTexture ? texture(u_mainTexture, v_texcoord).rgb : u_baseColor;
                
                // Get color from fragment function
                fragColor = fragment(baseColor, normalize(v_normal), v_texcoord);
            }
        
            // Default fragment implementation
            vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv) {
                vec3 lightContrib = vec3(0.0);
                vec3 ambient = vec3(0.0);
                
                // Accumulate contribution from each light
                for(int i = 0; i < u_numLights; i++) {
                    if(u_lights[i].type == LIGHT_AMBIENT) {
                        ambient += u_lights[i].color * u_lights[i].intensity;
                    } else {
                        lightContrib += light(u_lights[i]);
                    }
                }
                
                return vec4(baseColor * (lightContrib + ambient), 1.0);
            }
        
            // Default light implementation
            vec3 light(Light light) {
                return vec3(0.0);
            }`;

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

    setUniforms(program, camera, model, scene) {
        // Set all uniform types using our helper methods
        this.setTransformUniforms(program, camera, model);
        this.setLightUniforms(program, scene);
        this.setMaterialUniforms(program, model.material);
    }

    setTransformUniforms(program, camera, model) {
        const { uniforms } = program;
        const gl = this.gl;

        gl.uniformMatrix4fv(uniforms.get('u_worldMatrix'), false, model.worldMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_viewMatrix'), false, camera.viewMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_projectionMatrix'), false, camera.projectionMatrix);

        // Normal matrix (inverse transpose of world matrix)
        const normalMatrix = glMatrix.mat4.create();
        glMatrix.mat4.invert(normalMatrix, model.worldMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_normalMatrix'), false, normalMatrix);

        // Convert camera position to Float32Array if it isn't already
        let cameraPos;
        if (camera.position instanceof Float32Array) {
            cameraPos = camera.position;
        } else if (Array.isArray(camera.position)) {
            cameraPos = new Float32Array(camera.position);
        } else {
            // If it's a vec3 from glMatrix, convert it to Float32Array
            cameraPos = new Float32Array(camera.worldPosition || camera.position);
        }

        gl.uniform3fv(uniforms.get('u_cameraPosition'), cameraPos);
    }

    setLightUniforms(program, scene) {
        const { uniforms } = program;
        const gl = this.gl;

        // Get all lights in the scene
        const lights = scene.getAllNodesOfType(Light);
        gl.uniform1i(uniforms.get('u_numLights'), Math.min(lights.length, 8));

        // Set each light's uniforms
        lights.slice(0, 8).forEach((light, index) => {
            const lightData = light.getShaderLight();
            const prefix = `u_lights[${index}]`;

            // Ensure all vector data is Float32Array
            const position = new Float32Array(lightData.position);
            const direction = new Float32Array(lightData.direction);
            const color = new Float32Array(lightData.color);

            gl.uniform1i(uniforms.get(`${prefix}.type`), lightData.type);
            gl.uniform3fv(uniforms.get(`${prefix}.position`), position);
            gl.uniform3fv(uniforms.get(`${prefix}.direction`), direction);
            gl.uniform3fv(uniforms.get(`${prefix}.color`), color);
            gl.uniform1f(uniforms.get(`${prefix}.intensity`), lightData.intensity);
            gl.uniform1f(uniforms.get(`${prefix}.range`), lightData.range);
        });
    }

    setMaterialUniforms(program, material) {
        const { uniforms } = program;
        const gl = this.gl;

        gl.uniform3fv(uniforms.get('u_baseColor'), material.baseColor);
        gl.uniform1f(uniforms.get('u_metallic'), material.metallic);
        gl.uniform1f(uniforms.get('u_roughness'), material.roughness);
        gl.uniform1i(uniforms.get('u_useTexture'), material.texture ? 1 : 0);

        if (material.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, material.texture);
            gl.uniform1i(uniforms.get('u_mainTexture'), 0);
        }
    }

}

export default ShaderManager;