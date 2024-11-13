// Material constants for Phong shading
const float PHONG_AMBIENT = 0.1;
const float PHONG_SHININESS = 32.0;

vec3 light(Light light) {
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_cameraPosition - v_worldPos);
    vec3 lightContrib = vec3(0.0);

    if(light.type == LIGHT_POINT) {
        // Point light calculation
        vec3 lightDir = normalize(light.position - v_worldPos);
        float distance = length(light.position - v_worldPos);

        // Calculate diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * light.color;

        // Calculate specular
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), PHONG_SHININESS);
        vec3 specular = spec * light.color;

        // Calculate attenuation
        float attenuation = 1.0;
        if(distance > light.range) {
            attenuation = 0.0;
        } else {
            float fadeStart = light.range * 0.75;
            if(distance > fadeStart) {
                float fade = 1.0 - (distance - fadeStart) / (light.range - fadeStart);
                attenuation = fade * fade;
            }
        }

        lightContrib = (diffuse + specular) * light.intensity * attenuation;
    }
    else if(light.type == LIGHT_DIRECTIONAL) {
        // Directional light calculation
        vec3 lightDir = normalize(-light.direction);

        // Calculate diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * light.color;

        // Calculate specular
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), PHONG_SHININESS);
        vec3 specular = spec * light.color;

        lightContrib = (diffuse + specular) * light.intensity;
    }
    else if(light.type == LIGHT_AMBIENT) {
        // Ambient light calculation
        lightContrib = light.color * light.intensity * PHONG_AMBIENT;
    }

    return lightContrib;
}

vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass) {
    vec3 result = vec3(0.0);

    // Apply all lights
    for(int i = 0; i < u_numLights; i++) {
        result += light(u_lights[i]) * baseColor;
    }

    // Apply gamma correction
    result = pow(result, vec3(1.0/2.2));

    // Handle multi-pass rendering
    if(u_hasPreviousPass) {
        return vec4(result, 1.0) * previousPass;
    }

    return vec4(result, 1.0);
}