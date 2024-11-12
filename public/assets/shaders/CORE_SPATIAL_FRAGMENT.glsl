#version 300 es
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

// Time uniform
uniform float u_time;

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
}