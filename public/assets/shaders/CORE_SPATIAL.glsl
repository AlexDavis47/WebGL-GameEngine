#version 300 es
precision highp float;

// ----- COMMON DEFINITIONS -----
const int LIGHT_POINT = 0;
const int LIGHT_DIRECTIONAL = 1;
const int LIGHT_AMBIENT = 2;

struct Light {
    int type;
    vec3 position;
    vec3 direction;
    vec3 color;
    float intensity;
    float range;
};

// ----- VERTEX SHADER -----
#ifdef VERTEX_SHADER
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;
out mat3 v_TBN;       // For normal mapping

// User vertex modifications (can be overridden)
vec3 vertex(vec3 vertex, vec3 normal, vec2 uv) {
    return vertex;
}

void main() {
    // Process vertex position through user function
    vec3 vertexPos = vertex(a_position, a_normal, a_texcoord);

    // Transform vertex to world space
    vec4 worldPosition = u_worldMatrix * vec4(vertexPos, 1.0);
    v_worldPos = worldPosition.xyz;

    // Transform normal to world space
    v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);

    // Calculate TBN matrix for normal mapping
    vec3 N = v_normal;
    vec3 T = normalize((u_normalMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
    T = normalize(T - dot(T, N) * N);
    vec3 B = cross(N, T);
    v_TBN = mat3(T, B, N);

    // Pass texture coordinates
    v_texcoord = a_texcoord;

    // Final position
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}
#endif

// ----- FRAGMENT SHADER -----
#ifdef FRAGMENT_SHADER
// Constants for PBR
const float PI = 3.14159265359;
const float EPSILON = 0.0001;

in vec3 v_normal;
in vec3 v_worldPos;
in vec2 v_texcoord;
in mat3 v_TBN;

// PBR material uniforms
uniform vec4 u_BaseColorFactor;
uniform float u_MetallicFactor;
uniform float u_RoughnessFactor;
uniform float u_AlphaCutoff;
uniform vec3 u_EmissiveFactor;

// Material textures
uniform sampler2D u_BaseColorMap;
uniform sampler2D u_MetallicRoughnessMap;
uniform sampler2D u_NormalMap;
uniform sampler2D u_EmissiveMap;
uniform sampler2D u_OcclusionMap;

// Texture flags
uniform bool u_HasBaseColorMap;
uniform bool u_HasMetallicRoughnessMap;
uniform bool u_HasNormalMap;
uniform bool u_HasEmissiveMap;
uniform bool u_HasOcclusionMap;

// Camera and scene uniforms
uniform vec3 u_cameraPosition;
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform vec4 u_viewport;

// Lighting uniforms
uniform Light u_lights[8];
uniform int u_numLights;

// Multi-pass uniforms
uniform sampler2D u_previousPass;
uniform bool u_hasPreviousPass;

// Time uniform for animations
uniform float u_time;

out vec4 fragColor;

// ----- PBR FUNCTIONS -----
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / max(denom, EPSILON);
}

float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    return nom / max(denom, EPSILON);
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(max(1.0 - cosTheta, 0.0), 5.0);
}

vec3 getNormalFromMap() {
    if (!u_HasNormalMap) return normalize(v_normal);

    vec3 tangentNormal = texture(u_NormalMap, v_texcoord).xyz * 2.0 - 1.0;
    return normalize(v_TBN * tangentNormal);
}

// Core lighting calculation
vec3 calculatePBRLight(Light light, vec3 N, vec3 V, vec3 albedo, float metallic, float roughness) {
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 Lo = vec3(0.0);

    if(light.type == LIGHT_POINT) {
        vec3 L = normalize(light.position - v_worldPos);
        vec3 H = normalize(V + L);
        float distance = length(light.position - v_worldPos);

        // Early exit if beyond range
        if(distance > light.range) return vec3(0.0);

        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = light.color * light.intensity * attenuation;

        // Cook-Torrance BRDF
        float NDF = DistributionGGX(N, H, roughness);
        float G   = GeometrySmith(N, V, L, roughness);
        vec3  F   = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + EPSILON;
        vec3 specular = numerator / denominator;

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        float NdotL = max(dot(N, L), 0.0);
        Lo = (kD * albedo / PI + specular) * radiance * NdotL;

        // Range-based attenuation
        if(distance > light.range * 0.75) {
            float fade = 1.0 - (distance - light.range * 0.75) / (light.range * 0.25);
            Lo *= fade * fade;
        }
    }
    else if(light.type == LIGHT_DIRECTIONAL) {
        vec3 L = normalize(-light.direction);
        vec3 H = normalize(V + L);
        vec3 radiance = light.color * light.intensity;

        float NDF = DistributionGGX(N, H, roughness);
        float G   = GeometrySmith(N, V, L, roughness);
        vec3  F   = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + EPSILON;
        vec3 specular = numerator / denominator;

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        float NdotL = max(dot(N, L), 0.0);
        Lo = (kD * albedo / PI + specular) * radiance * NdotL;
    }

    return Lo;
}

// Default fragment implementation (can be overridden)
vec4 fragment(vec3 albedo, vec3 normal, vec2 uv, vec4 previousPass) {
    // Sample material properties
    vec4 baseColor = u_HasBaseColorMap ? texture(u_BaseColorMap, uv) * u_BaseColorFactor
    : u_BaseColorFactor;

    float metallic, roughness;
    if (u_HasMetallicRoughnessMap) {
        vec4 mrSample = texture(u_MetallicRoughnessMap, uv);
        metallic = mrSample.b * u_MetallicFactor;
        roughness = mrSample.g * u_RoughnessFactor;
    } else {
        metallic = u_MetallicFactor;
        roughness = u_RoughnessFactor;
    }

    // Apply occlusion if available
    float ao = u_HasOcclusionMap ? texture(u_OcclusionMap, uv).r : 1.0;

    // Calculate lighting
    vec3 N = getNormalFromMap();
    vec3 V = normalize(u_cameraPosition - v_worldPos);

    vec3 Lo = vec3(0.0);
    vec3 ambient = vec3(0.03) * baseColor.rgb * ao;

    for(int i = 0; i < u_numLights; i++) {
        if(u_lights[i].type == LIGHT_AMBIENT) {
            ambient += u_lights[i].color * u_lights[i].intensity * baseColor.rgb * ao;
        } else {
            Lo += calculatePBRLight(u_lights[i], N, V, baseColor.rgb, metallic, roughness);
        }
    }

    vec3 color = ambient + Lo;

    // Add emissive
    if (u_HasEmissiveMap) {
        color += texture(u_EmissiveMap, uv).rgb * u_EmissiveFactor;
    } else {
        color += u_EmissiveFactor;
    }

    // HDR tonemapping
    color = color / (color + vec3(1.0));

    // Apply previous pass if needed
    vec4 finalColor = vec4(color, baseColor.a);
    return u_hasPreviousPass ? finalColor * previousPass : finalColor;
}

void main() {
    vec4 previousPass = vec4(0.0);
    if (u_hasPreviousPass) {
        vec2 screenUV = vec2(gl_FragCoord.xy / u_viewport.zw);
        previousPass = texture(u_previousPass, screenUV);
    }

    // Get base color for backwards compatibility
    vec3 baseColor = u_HasBaseColorMap ? texture(u_BaseColorMap, v_texcoord).rgb : u_BaseColorFactor.rgb;

    fragColor = fragment(baseColor, getNormalFromMap(), v_texcoord, previousPass);

    // Alpha cutoff
    if (fragColor.a < u_AlphaCutoff) {
        discard;
    }
}


#endif