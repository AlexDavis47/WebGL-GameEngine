// shaders/phong.glsl

vec3 light(Light light) {
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_cameraPosition - v_worldPos);

    if(light.type == LIGHT_POINT) {
        // Calculate vector to light and its length
        vec3 toLight = light.position - v_worldPos;
        float distance = length(toLight);

        // Early exit if beyond range
        if(distance > light.range) {
            return vec3(0.0);
        }

        vec3 lightDir = normalize(toLight);

        // Calculate diffuse
        float diff = max(dot(normal, lightDir), 0.0);

        // Calculate specular
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

        // More aggressive attenuation
        float attenuation = clamp(1.0 - (distance / light.range), 0.0, 1.0);
        attenuation = attenuation * attenuation; // Square it for more aggressive falloff

        // Combine components
        vec3 diffuse = light.color * diff * light.intensity;
        vec3 specular = light.color * spec * light.intensity * 0.5;

        return (diffuse + specular) * attenuation;
    }

    return vec3(0.0);
}

vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv) {
    vec3 lightContrib = vec3(0.0);
    vec3 ambient = vec3(0.1); // Small ambient term for visibility

    for(int i = 0; i < u_numLights; i++) {
        if(u_lights[i].type == LIGHT_AMBIENT) {
            ambient += u_lights[i].color * u_lights[i].intensity;
        } else {
            lightContrib += light(u_lights[i]);
        }
    }

    vec3 finalColor = baseColor * (lightContrib + ambient);
    return vec4(finalColor, 1.0);
}