vec3 light(Light light) {
    return vec3(0.0);
}

vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv) {
    // Debug: Add a bit of light info to see if we're getting lights
    float debugLight = float(u_numLights > 0 ? 1 : 0);
    return vec4(1.0 * debugLight, 0.0, 0.0, 1.0);
}