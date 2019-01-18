precision highp float;

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;

// #ifdef DIMENSIONS_3
// attribute vec3 position;
// #else
attribute vec2 position;
// #endif

attribute vec4 color;
attribute float id;

varying vec4 vColor;

void main() {
  mat4 projViewModel = projection * view * model;
  vec4 posProjected = projViewModel * vec4(position, 0.0, 1.0);

  vColor = color;

  gl_Position = posProjected * vec4(0.5, 0.5, 0.0, 1.0);
}
