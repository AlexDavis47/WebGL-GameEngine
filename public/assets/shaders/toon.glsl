// Constants for toon shading
const float TOON_AMBIENT = 1.0;
const int LIGHT_BANDS = 6;     // Number of light bands for cel shading
const float BAND_SOFTNESS = 0.1; // Softness between bands
const float OUTLINE_THRESHOLD = 0.6; // Threshold for edge detection
const float SPECULAR_SHININESS = 16.0;

uniform float u_ambientLightAmount;

// Helper function to create cel-shaded bands
float celShade(float value, float bands, float softness) {
    float segment = 1.0 / bands;
    float rounded = floor(value * bands) * segment;
    // Add softness between bands
    float diff = (value * bands) - floor(value * bands);
    float stepped = smoothstep(0.0, softness, diff);
    return mix(rounded, rounded + segment, stepped);
}

vec3 light(Light light) {
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_cameraPosition - v_worldPos);
    vec3 lightContrib = vec3(0.0);

    if(light.type == LIGHT_POINT) {
        vec3 lightDir = normalize(light.position - v_worldPos);
        float distance = length(light.position - v_worldPos);

        // Calculate diffuse with cel shading
        float diff = max(dot(normal, lightDir), 0.0);
        diff = celShade(diff, float(LIGHT_BANDS), BAND_SOFTNESS);

        // Calculate specular highlight (simple round spot)
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), SPECULAR_SHININESS);
        spec = step(0.5, spec); // Creates a sharp specular highlight

        // Calculate attenuation
        float attenuation = 1.0;
        if(distance > light.range) {
            attenuation = 0.0;
        } else {
            float fadeStart = light.range * 0.75;
            if(distance > fadeStart) {
                float fade = 1.0 - (distance - fadeStart) / (light.range - fadeStart);
                attenuation = step(0.5, fade); // Sharp falloff for toon effect
            }
        }

        vec3 diffuse = diff * light.color;
        vec3 specular = spec * vec3(1.0); // White specular

        lightContrib = (diffuse + specular) * light.intensity * attenuation;
    }
    else if(light.type == LIGHT_DIRECTIONAL) {
        vec3 lightDir = normalize(-light.direction);

        // Calculate diffuse with cel shading
        float diff = max(dot(normal, lightDir), 0.0);
        diff = celShade(diff, float(LIGHT_BANDS), BAND_SOFTNESS);

        // Calculate specular highlight
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), SPECULAR_SHININESS);
        spec = step(0.5, spec);

        vec3 diffuse = diff * light.color;
        vec3 specular = spec * vec3(1.0);

        lightContrib = (diffuse + specular) * light.intensity;
    }
    else if(light.type == LIGHT_AMBIENT) {
        lightContrib = light.color * light.intensity * TOON_AMBIENT;
    }

    return lightContrib;
}

// Calculate outline
float getOutline(vec3 normal, vec3 viewDir) {
    float rim = 1.0 - max(dot(normal, viewDir), 0.0);
    return step(OUTLINE_THRESHOLD, rim);
}

vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass) {
    if (!u_hasPreviousPass) {
        return vec4(0.0);
    }

    vec3 viewDir = normalize(u_cameraPosition - v_worldPos);
    vec3 result = vec3(0.0);
    vec3 ambient = vec3(0.0);

    // Calculate lighting
    for(int i = 0; i < u_numLights; i++) {
        if(u_lights[i].type == LIGHT_AMBIENT) {
            ambient += light(u_lights[i]);
        } else {
            result += light(u_lights[i]);
        }
    }

    // Ensure minimum ambient light
    if (length(ambient) < 0.001) {
        ambient = vec3(TOON_AMBIENT);
    }

    // Calculate outline
    float outline = getOutline(normal, viewDir);

    // Combine lighting with base color
    vec3 finalColor = previousPass.rgb * (ambient + result);

    // Apply outline
    finalColor = mix(finalColor, vec3(0.0), outline);

    return vec4(finalColor, previousPass.a);
}