// Override the fragment function to return pure red
vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv) {
    return vec4(1.0, 0.0, 0.0, 1.0);
}

// Override light function to do nothing since we're using pure red
vec3 light() {
    return vec3(0.0);
}