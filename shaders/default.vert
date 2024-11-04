#version 300 es
precision highp float;

// Attributes
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

// Matrices
uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

// Outputs to fragment shader
out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;

void main() {
    // Calculate world position
    vec4 worldPosition = u_worldMatrix * vec4(a_position, 1.0);
    v_worldPos = worldPosition.xyz;

    // Transform normal to world space
    v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);

    // Pass texture coordinates
    v_texcoord = a_texcoord;

    // Calculate final position
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}