#version 300 es

// Attributes
layout(location = 0) in vec3 aPosition;

// Uniforms for transformations
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    // Transform the vertex position
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(aPosition, 1.0);
}