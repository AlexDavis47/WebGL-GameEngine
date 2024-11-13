const int LIGHT_POINT = 0;
const int LIGHT_DIRECTIONAL = 1;
const int LIGHT_AMBIENT = 2;

struct Light {
    int type;
    vec3 position;
    vec3 direction;
    vec3 color;
    float intensity;
    float range;
};

const float PI = 3.14159265359;
const float EPSILON = 0.0001;

#pragma glslify: export(Light)
#pragma glslify: export(LIGHT_POINT)
#pragma glslify: export(LIGHT_DIRECTIONAL)
#pragma glslify: export(LIGHT_AMBIENT)
#pragma glslify: export(PI)
#pragma glslify: export(EPSILON)
