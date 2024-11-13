uniform samplerCube u_skyboxTexture;

// Custom varying for skybox
out vec3 v_localPos;

vec3 vertex(vec3 position, vec3 normal, vec2 uv) {
    // Store local position for cube sampling
    v_localPos = position;

    // Remove translation from view matrix to keep skybox centered
    vec4 pos = u_projectionMatrix * mat4(mat3(u_viewMatrix)) * vec4(position, 1.0);
    return pos.xyz;
}

vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass) {
    // Sample cubemap texture
    vec3 skyColor = texture(u_skyboxTexture, normalize(v_localPos)).rgb;

    // Optional: Add atmosphere effect
    float atmosphere = 1.0 - max(dot(normalize(v_localPos), vec3(0.0, 1.0, 0.0)), 0.0);
    atmosphere = pow(atmosphere, 1.5);

    vec3 atmosphereColor = vec3(0.5, 0.7, 1.0);
    skyColor = mix(skyColor, atmosphereColor, atmosphere * 0.2);

    return vec4(skyColor, 1.0);
}