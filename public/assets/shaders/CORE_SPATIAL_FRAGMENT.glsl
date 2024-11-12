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

// Multi-pass uniforms
uniform sampler2D u_previousPass;
uniform bool u_hasPreviousPass;

// Transform uniforms
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

// Add viewport uniforms
uniform vec4 u_viewport;  // x, y, width, height

// Light uniforms
uniform Light u_lights[8];
uniform int u_numLights;

// Time uniform
uniform float u_time;

// Output color
out vec4 fragColor;

// Forward declarations of user-defined functions
vec3 light(Light light);
vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass);

// Helper function to get screen-space coordinates accounting for viewport
vec2 getScreenSpaceCoords() {
    vec4 clipSpace = u_projectionMatrix * u_viewMatrix * vec4(v_worldPos, 1.0);
    vec3 ndc = clipSpace.xyz / clipSpace.w;

    // Convert NDC to viewport coordinates
    vec2 screenCoords = vec2(
    (ndc.x * 0.5 + 0.5) * u_viewport.z + u_viewport.x,
    (ndc.y * 0.5 + 0.5) * u_viewport.w + u_viewport.y
    );

    // Convert to texture coordinates (0 to 1)
    return screenCoords / vec2(u_viewport.z, u_viewport.w);
}

void main() {
    vec3 baseColor = u_useTexture ? texture(u_mainTexture, v_texcoord).rgb : u_baseColor;

    vec4 previousPass = vec4(0.0);
    if (u_hasPreviousPass) {
        vec2 screenUV = getScreenSpaceCoords();
        previousPass = texture(u_previousPass, screenUV);
    }

    fragColor = fragment(baseColor, normalize(v_normal), v_texcoord, previousPass);
}

// Default fragment implementation
vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass) {
    vec3 lightContrib = vec3(0.0);
    vec3 ambient = vec3(0.0);

    for(int i = 0; i < u_numLights; i++) {
        if(u_lights[i].type == LIGHT_AMBIENT) {
            ambient += u_lights[i].color * u_lights[i].intensity;
        } else {
            lightContrib += light(u_lights[i]);
        }
    }

    vec4 currentPass = vec4(baseColor * (lightContrib + ambient), 1.0);
    return u_hasPreviousPass ? currentPass * previousPass : currentPass;
}

// Default light implementation
vec3 light(Light light) {
    return vec3(0.0);
}