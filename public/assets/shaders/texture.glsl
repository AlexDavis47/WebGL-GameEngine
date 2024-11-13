// Default fragment implementation
vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass) {
    // Sample base color
    vec4 color = u_HasBaseColorMap ? texture(u_BaseColorMap, uv) * u_BaseColorFactor
    : vec4(baseColor, 1.0) * u_BaseColorFactor;


    // Add emissive if present
    if(u_HasEmissiveMap) {
        color.rgb += texture(u_EmissiveMap, uv).rgb * u_EmissiveFactor;
    } else {
        color.rgb += u_EmissiveFactor;
    }

    // Apply occlusion if available
    if(u_HasOcclusionMap) {
        color.rgb *= texture(u_OcclusionMap, uv).r;
    }

    return color;
}