// Simplex noise functions
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
}

// Simplex noise implementation
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439);

    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);

    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float waterlayer(vec2 uv, float scale, float time) {
    float noise1 = snoise(uv * 3.0 + time * 0.1) * 0.1;
    float noise2 = snoise(uv * 6.0 - time * 0.15) * 0.05;

    vec2 distorted_uv = uv + vec2(noise1, noise2);

    float pattern = 0.0;

    // Layer 1: Large waves
    pattern += sin(distorted_uv.x * 10.0 * scale + time) * 0.5 + 0.5;
    pattern *= sin(distorted_uv.y * 8.0 * scale - time * 0.5) * 0.5 + 0.5;

    // Layer 2: Medium waves
    float pattern2 = sin(distorted_uv.x * 20.0 * scale + time * 1.1) * 0.5 + 0.5;
    pattern2 *= sin(distorted_uv.y * 15.0 * scale + time * 0.8) * 0.5 + 0.5;
    pattern = mix(pattern, pattern2, 0.5);

    // Add fine detail with noise
    float detail = (snoise(distorted_uv * 40.0 * scale + time * 0.2) + 1.0) * 0.5;
    pattern = mix(pattern, detail, 0.1);

    return pattern;
}

vec4 water_effect(vec2 uv, float time) {
    const vec4 WATER_COL = vec4(0.04, 0.38, 0.88, 0.3); // Reduced alpha for additive blending
    const vec4 WATER2_COL = vec4(0.04, 0.35, 0.78, 0.3); // Reduced alpha for additive blending
    const vec4 FOAM_COL = vec4(0.8125, 0.9609, 0.9648, 0.4); // Reduced alpha for additive blending

    float pattern_scale = 1.0;
    float distortion_strength = 0.3;

    float noise_big = snoise(uv * 2.0 + time * 0.1) * distortion_strength;
    float noise_med = snoise(uv * 4.0 - time * 0.15) * (distortion_strength * 0.5);
    vec2 distorted_uv = uv + vec2(noise_big + noise_med);

    float water1 = waterlayer(distorted_uv, pattern_scale, time);
    float water2 = waterlayer(distorted_uv * 1.2 + vec2(0.5), pattern_scale * 1.5, -time * 0.8);

    vec4 water_color = mix(WATER_COL, WATER2_COL, water1);

    float foam_mask = smoothstep(0.4, 0.8, abs(water1 - water2));
    water_color = mix(water_color, FOAM_COL, foam_mask * 0.7);

    float highlight = pow(water1 * water2, 3.0) * 0.5;
    water_color.rgb += vec3(highlight);

    return water_color;
}

vec4 fragment(vec3 baseColor, vec3 normal, vec2 uv, vec4 previousPass) {
    vec2 tile = vec2(3.0, 3.0);
    float time = u_time * 0.2;

    // Generate water effect
    vec4 water_color = water_effect(uv * tile, time);

    // Add water effect to previous pass instead of replacing
    if(u_hasPreviousPass) {
        return previousPass + water_color * 0.5; // Reduced intensity for additive blend
    }

    // If no previous pass, just return water effect
    return water_color;
}