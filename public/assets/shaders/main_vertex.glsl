#version 300 es
precision highp float;

#pragma glslify: setupVertex = require('./vertex.glsl')

void main() {
    setupVertex(a_position, a_normal, a_texcoord);
}
