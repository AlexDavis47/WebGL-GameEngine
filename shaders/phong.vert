#version 300 es //specifies that we want OpenGL ES 3.0
//This vertex shader is based on Example 7.8 on pages 377 and 378 of the OpenGL Programming
//Guide (8th edition) with some tweaks to support shininess as a vertex property. I also
//modified the code somewhat to make it closer to the Phong Reflection Model discussed in class.
//For lab 7 it has been modified to allow the eye position to move around the scene. Lighting
//calculations are done in "eye" coordinates, so position and normal must be calculated appropriately.

layout(location = 0) in vec4 vertexPosition;
layout(location = 1) in vec4 vertexColor;
layout(location = 2) in vec3 vertexNormal;
layout(location = 3) in float vertexShininess;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec4 position; //position of the vertex in "eye" coordinates
out vec4 color;
out vec3 normal; //orientation of the normal in "eye" coordinates
out float shininess;

void main()
{
    //Assign the in variables (attributes) to out variables (varyings) so that
    //they can be accessed in the fragment shader for lighting calculations.
    position = viewMatrix * modelMatrix * vertexPosition; //position in "eye" coordinates
    color = vertexColor;
    //calculate the "normal matrix"
    mat4 modelViewMatrix = viewMatrix * modelMatrix;
    mat4 normalMatrix = transpose(inverse(modelViewMatrix));
    vec4 n = normalMatrix * vec4(vertexNormal, 0.0);
    normal = normalize(vec3(n.x, n.y, n.z)); //normalize just in case it is not a unit vector
    shininess = vertexShininess;

    //Here the input vertexPostion is multiplied by the model, view, and
    //projection matrices to determine the final position of the vertex
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vertexPosition;
}