precision highp float;

#pragma glslify: computeMiterNormal = require(./compute-miter-normal)

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;
uniform float aspect;

uniform float thickness;
uniform float miterLimit;

// TODO: Enable compiling for 2 or 3 dimensional lines
attribute vec2 prevPosition;
attribute vec2 currPosition;
attribute vec2 nextPosition;

attribute float offset;
attribute vec4 color;
attribute vec2 ud;

varying vec4 vColor;
varying vec2 vUD;

void main() {
  mat4 projViewModel = projection * view * model;

  vec4 prevProjected = projViewModel * vec4(prevPosition, 0.0, 1.0);
  vec4 currProjected = projViewModel * vec4(currPosition, 0.0, 1.0);
  vec4 nextProjected = projViewModel * vec4(nextPosition, 0.0, 1.0);

  vec2 normal = computeMiterNormal(
    aspect, thickness, miterLimit,
    prevProjected, currProjected, nextProjected);

  vColor = color;
  vUD = ud;

  gl_Position = currProjected + vec4(normal * offset, 0.0, 1.0);
}
