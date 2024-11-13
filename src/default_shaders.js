/**
 * Developers: Alexander Davis, Maika West, Austin Medina.
 * Date: 11/12/2024
 */
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