#pragma glslify: import(./constants.glsl)
#pragma glslify: calculatePBRLight = require(./pbr-functions.glsl)

uniform vec4 u_BaseColorFactor;
uniform float u_MetallicFactor;
uniform float u_RoughnessFactor;
uniform float u_AlphaCutoff;
uniform vec3 u_EmissiveFactor;

uniform sampler2D u_BaseColorMap;
uniform sampler2D u_MetallicRoughnessMap;
uniform sampler2D u_NormalMap;
uniform sampler2D u_EmissiveMap;
uniform sampler2D u_OcclusionMap;

uniform bool u_HasBaseColorMap;
uniform bool u_HasMetallicRoughnessMap;
uniform bool u_HasNormalMap;
uniform bool u_HasEmissiveMap;
uniform bool u_HasOcclusionMap;

uniform vec3 u_cameraPosition;
uniform Light u_lights[8];
uniform int u_numLights;

vec4 calculatePBRFragment(vec2 texcoord, vec3 worldPos, vec3 normal, mat3 TBN) {
    // Sample material properties
    vec4 baseColor = u_HasBaseColorMap ? texture2D(u_BaseColorMap, texcoord) * u_BaseColorFactor
    : u_BaseColorFactor;

    float metallic, roughness;
    if (u_HasMetallicRoughnessMap) {
        vec4 mrSample = texture2D(u_MetallicRoughnessMap, texcoord);
        metallic = mrSample.b * u_MetallicFactor;
        roughness = mrSample.g * u_RoughnessFactor;
    } else {
        metallic = u_MetallicFactor;
        roughness = u_RoughnessFactor;
    }

    float ao = u_HasOcclusionMap ? texture2D(u_OcclusionMap, texcoord).r : 1.0;

    // Get normal from normal map or use geometric normal
    vec3 N = u_HasNormalMap ? normalize(TBN * (texture2D(u_NormalMap, texcoord).xyz * 2.0 - 1.0))
    : normalize(normal);

    vec3 V = normalize(u_cameraPosition - worldPos);

    // Calculate lighting
    vec3 Lo = vec3(0.0);
    vec3 ambient = vec3(0.03) * baseColor.rgb * ao;

    for(int i = 0; i < u_numLights; i++) {
        if(u_lights[i].type == LIGHT_AMBIENT) {
            ambient += u_lights[i].color * u_lights[i].intensity * baseColor.rgb * ao;
        } else {
            Lo += calculatePBRLight(u_lights[i], N, V, worldPos, baseColor.rgb, metallic, roughness);
        }
    }

    vec3 color = ambient + Lo;

    // Add emissive
    if (u_HasEmissiveMap) {
        color += texture2D(u_EmissiveMap, texcoord).rgb * u_EmissiveFactor;
    } else {
        color += u_EmissiveFactor;
    }

    // HDR tonemapping
    color = color / (color + vec3(1.0));

    return vec4(color, baseColor.a);
}

#pragma glslify: export(calculatePBRFragment)