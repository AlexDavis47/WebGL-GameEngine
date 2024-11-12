#version 300 es
            precision highp float;

// Built-in attributes
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

// Built-in uniforms
uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

// Varyings for fragment shader
out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;

// User vertex modifications
vec3 vertex(vec3 vertex, vec3 normal, vec2 uv) {
    return vertex;
}

void main() {
    // Start with original values
    vec3 vertexPos = vertex(a_position, a_normal, a_texcoord);

    // Transform vertex to world space
    vec4 worldPosition = u_worldMatrix * vec4(vertexPos, 1.0);
    v_worldPos = worldPosition.xyz;

    // Transform normal to world space
    v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);

    // Pass texture coordinates
    v_texcoord = a_texcoord;

    // Final position
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}