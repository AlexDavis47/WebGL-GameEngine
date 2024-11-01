#version 300 es
precision highp float;

uniform mat4 viewMatrix;
uniform vec3 globalAmbientLight;
uniform vec4 uLightPosition[16];
uniform vec4 uLightColor[16];
uniform vec4 uLightDirection[16];
uniform bool uLightIsDirectional[16];
uniform int uNumLights;
uniform float constantAttenuation;
uniform float linearAttenuation;
uniform float quadraticAttenuation;

in vec4 position;
in vec4 color;
in vec3 normal;
in float shininess;

out vec4 frag_color;

void main() {
    vec3 scatteredLight = globalAmbientLight * color.rgb;
    vec3 reflectedLight = vec3(0.0);
    vec3 surfaceSpecularColor = vec3(1.0);

    for(int i = 0; i < 16; i++) {
        if (i >= uNumLights) break;

        vec3 I = uLightColor[i].rgb * uLightColor[i].a;
        vec3 L;
        float f;

        if (!uLightIsDirectional[i]) {
            vec4 lightPos_eyeCoords = viewMatrix * uLightPosition[i];
            vec4 LTemp = lightPos_eyeCoords - position;
            L = vec3(LTemp.xyz);
            float d = length(L);
            L = normalize(L);

            float attenuationDenominator = constantAttenuation + linearAttenuation * d + quadraticAttenuation * d * d;
            f = attenuationDenominator < 0.001 ? 1.0 : 1.0 / attenuationDenominator;
        } else {
            vec4 lightDir_eyeCoords = viewMatrix * uLightDirection[i];
            L = normalize(-vec3(lightDir_eyeCoords.xyz));
            f = 1.0;
        }

        float diffuseModifier = max(0.0, dot(normalize(normal), L));
        float specularModifier = 0.0;

        if (diffuseModifier > 0.001) {
            vec3 r = normalize(reflect(-L, normal));
            vec3 v = normalize(-position.xyz);
            float specular = pow(max(0.0, dot(r, v)), shininess);
            specularModifier = specular * (shininess / 100.0);
        }

        reflectedLight += f * (
        (I * color.rgb * diffuseModifier) +
        (I * surfaceSpecularColor * specularModifier * uLightColor[i].a)
        );
    }

    vec3 sumOfLights = scatteredLight + reflectedLight;
    vec3 rgb = min(sumOfLights, vec3(1.0));
    frag_color = vec4(rgb, color.a);
}