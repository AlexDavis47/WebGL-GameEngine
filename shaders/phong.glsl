vec3 light() {
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_cameraPosition - v_worldPos);

    vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0)); // Example directional light
    float diff = max(dot(normal, lightDir), 0.0);

    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

    return vec3(diff + spec * 0.5);
}

vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv) {
    vec3 lightContrib = light();
    return vec4(baseColor * (lightContrib + u_ambientLight), 1.0);
}