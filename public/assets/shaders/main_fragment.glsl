#version 300 es
precision highp float;

#pragma glslify: calculatePBRFragment = require('./fragment.glsl')

out vec4 fragColor;

void main() {
    vec4 color = calculatePBRFragment(v_texcoord, v_worldPos, v_normal, v_TBN);

    if (color.a < u_AlphaCutoff) {
        discard;
    }

    fragColor = color;
}