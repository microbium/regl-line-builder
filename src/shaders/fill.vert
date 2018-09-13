precision highp float;

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;

// #ifdef DIMENSIONS_3
// attribute vec3 position;
// #else
attribute vec2 position;
// #endif

// attribute vec4 color;

void main() {
  mat4 projViewModel = projection * view * model;
  vec4 posProjected = projViewModel * vec4(position * 0.5, 0.0, 1.0);

  gl_Position = posProjected;
}
