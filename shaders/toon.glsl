// shaders/toon.glsl

// Helper function to quantize values into bands
float getLightBand(float value, int bands) {
    float step = 1.0 / float(bands);
    return floor(value * float(bands)) * step;
}

// Forward declare the light function
vec3 light(Light light, vec3 viewDir);

vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv) {
    // Calculate view direction first
    vec3 viewDir = normalize(u_cameraPosition - v_worldPos);

    vec3 lightContrib = vec3(0.0);
    vec3 ambient = vec3(0.2); // Slightly higher ambient for toon shader

    for(int i = 0; i < u_numLights; i++) {
        if(u_lights[i].type == LIGHT_AMBIENT) {
            ambient += u_lights[i].color * u_lights[i].intensity;
        } else {
            lightContrib += light(u_lights[i], viewDir);
        }
    }

    // Quantize the final color
    vec3 finalColor = baseColor * (lightContrib + ambient);
    finalColor = vec3(
        getLightBand(finalColor.r, 8),
        getLightBand(finalColor.g, 8),
        getLightBand(finalColor.b, 8)
    );

    // Add outline
    float edgeCheck = dot(normalize(normal), viewDir);
    if(edgeCheck < 0.2) {
        return vec4(0.0, 0.0, 0.0, 1.0); // Black outline
    }

    return vec4(finalColor, 1.0);
}

// Implement the light function
vec3 light(Light light, vec3 viewDir) {
    vec3 normal = normalize(v_normal);

    if(light.type == LIGHT_POINT) {
        // Calculate vector to light and its length
        vec3 toLight = light.position - v_worldPos;
        float distance = length(toLight);

        // Early exit if beyond range
        if(distance > light.range) {
            return vec3(0.0);
        }

        vec3 lightDir = normalize(toLight);

        // Calculate diffuse with banding
        float diff = max(dot(normal, lightDir), 0.0);
        diff = getLightBand(diff, 3); // 3 bands for diffuse

        // Calculate specular with sharp cutoff
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = max(dot(viewDir, reflectDir), 0.0);
        spec = step(0.8, spec); // Sharp specular highlight

        // Stepped attenuation
        float attenuation = clamp(1.0 - (distance / light.range), 0.0, 1.0);
        attenuation = getLightBand(attenuation, 2); // 2 bands for attenuation

        // Combine components
        vec3 diffuse = light.color * diff * light.intensity;
        vec3 specular = light.color * spec * light.intensity * 0.5;

        return (diffuse + specular) * attenuation;
    }

    return vec3(0.0);
}