attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

varying vec3 v_normal;
varying vec3 v_worldPos;
varying vec2 v_texcoord;
varying mat3 v_TBN;

void setupVertex(vec3 position, vec3 normal, vec2 texcoord) {
    // Transform vertex to world space
    vec4 worldPosition = u_worldMatrix * vec4(position, 1.0);
    v_worldPos = worldPosition.xyz;

    // Transform normal to world space
    v_normal = normalize((u_normalMatrix * vec4(normal, 0.0)).xyz);

    // Calculate TBN matrix
    vec3 N = v_normal;
    vec3 T = normalize((u_normalMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
    T = normalize(T - dot(T, N) * N);
    vec3 B = cross(N, T);
    v_TBN = mat3(T, B, N);

    // Pass texture coordinates
    v_texcoord = texcoord;

    // Final position
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}

#pragma glslify: export(setupVertex)