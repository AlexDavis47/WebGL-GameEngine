// Define maximum number of lights
const MAX_POINT_LIGHTS = 4;
const MAX_DIRECTIONAL_LIGHTS = 2;

export const defaultVertexShader = `#version 300 es
precision highp float;

// Attributes
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

// Matrices
uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

// Outputs to fragment shader
out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;

void main() {
    // Calculate world position
    vec4 worldPosition = u_worldMatrix * vec4(a_position, 1.0);
    v_worldPos = worldPosition.xyz;
    
    // Transform normal to world space
    v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);
    
    // Pass texture coordinates
    v_texcoord = a_texcoord;
    
    // Calculate final position
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}`;

export const defaultFragmentShader = `#version 300 es
precision highp float;

// Structure definitions
struct PointLight {
    vec3 position;
    vec3 color;
    float intensity;
    float range;
};

struct DirectionalLight {
    vec3 direction;
    vec3 color;
    float intensity;
};

// Inputs from vertex shader
in vec3 v_normal;
in vec3 v_worldPos;
in vec2 v_texcoord;

// Light uniforms
uniform vec3 u_ambientLight;
uniform int u_numPointLights;
uniform int u_numDirectionalLights;
uniform PointLight u_pointLights[4];
uniform DirectionalLight u_directionalLights[2];

// Material uniforms
uniform vec3 u_baseColor;
uniform float u_metallic;
uniform float u_roughness;
uniform sampler2D u_mainTexture;
uniform bool u_useTexture;

// Camera position for specular
uniform vec3 u_cameraPosition;

out vec4 fragColor;

void main() {
    // For initial testing, let's use a simple diffuse calculation with ambient
    vec3 normal = normalize(v_normal);
    vec3 baseColor = u_useTexture ? texture(u_mainTexture, v_texcoord).rgb : u_baseColor;
    
    // Start with ambient
    vec3 result = baseColor * u_ambientLight;
    
    // Add a basic diffuse contribution from a default light direction
    vec3 defaultLightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(normal, defaultLightDir), 0.0);
    result += baseColor * diff;
    
    fragColor = vec4(result, 1.0);
}`;

// Helper class for setting shader uniforms
export class UniformSetter {
    static setBasicUniforms(gl, program, camera, model) {
        const { uniforms } = program;

        // Matrices
        gl.uniformMatrix4fv(uniforms.get('u_worldMatrix'), false, model.worldMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_viewMatrix'), false, camera.viewMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_projectionMatrix'), false, camera.projectionMatrix);

        // Normal matrix (inverse transpose of world matrix)
        const normalMatrix = glMatrix.mat4.create();
        glMatrix.mat4.invert(normalMatrix, model.worldMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(uniforms.get('u_normalMatrix'), false, normalMatrix);

        // Camera position for specular
        gl.uniform3fv(uniforms.get('u_cameraPosition'), camera.position);
    }

    static setLightUniforms(gl, program, scene) {
        const { uniforms } = program;

        // Ambient light
        gl.uniform3fv(uniforms.get('u_ambientLight'), scene.ambientLight);

        // Point lights
        let pointLights = scene.getAllNodesOfType('PointLight');
        gl.uniform1i(uniforms.get('u_numPointLights'), Math.min(pointLights.length, MAX_POINT_LIGHTS));

        pointLights.slice(0, MAX_POINT_LIGHTS).forEach((light, index) => {
            const baseUniform = `u_pointLights[${index}]`;
            gl.uniform3fv(uniforms.get(`${baseUniform}.position`), light.position);
            gl.uniform3fv(uniforms.get(`${baseUniform}.color`), light.color);
            gl.uniform1f(uniforms.get(`${baseUniform}.intensity`), light.intensity);
            gl.uniform1f(uniforms.get(`${baseUniform}.range`), light.range);
        });

        // Directional lights
        let dirLights = scene.getAllNodesOfType('DirectionalLight');
        gl.uniform1i(uniforms.get('u_numDirectionalLights'), Math.min(dirLights.length, MAX_DIRECTIONAL_LIGHTS));

        dirLights.slice(0, MAX_DIRECTIONAL_LIGHTS).forEach((light, index) => {
            const baseUniform = `u_directionalLights[${index}]`;
            gl.uniform3fv(uniforms.get(`${baseUniform}.direction`), light.direction);
            gl.uniform3fv(uniforms.get(`${baseUniform}.color`), light.color);
            gl.uniform1f(uniforms.get(`${baseUniform}.intensity`), light.intensity);
        });
    }

    static setMaterialUniforms(gl, program, material) {
        const { uniforms } = program;

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