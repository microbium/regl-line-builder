precision highp float;

#pragma glslify: computeMiterOffset = require(./compute-miter-offset)

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;
uniform float aspect;
uniform int adjustProjectedThickness;

uniform float thickness;
uniform float miterLimit;

#ifdef DIMENSIONS_3
attribute vec3 prevPosition;
attribute vec3 currPosition;
attribute vec3 nextPosition;
#else
attribute vec2 prevPosition;
attribute vec2 currPosition;
attribute vec2 nextPosition;
#endif

attribute float prevId;
attribute float currId;
attribute float nextId;

attribute float offset;
attribute vec4 color;
attribute vec2 ud;

varying vec4 vColor;
varying vec2 vUD;

void main() {
  mat4 projViewModel = projection * view * model;

#ifdef DIMENSIONS_3
  vec4 prevProjected = projViewModel * vec4(prevPosition, 1.0);
  vec4 currProjected = projViewModel * vec4(currPosition, 1.0);
  vec4 nextProjected = projViewModel * vec4(nextPosition, 1.0);
#else
  vec4 prevProjected = projViewModel * vec4(prevPosition, 0.0, 1.0);
  vec4 currProjected = projViewModel * vec4(currPosition, 0.0, 1.0);
  vec4 nextProjected = projViewModel * vec4(nextPosition, 0.0, 1.0);
#endif

  vec2 miterOffset = computeMiterOffset(
    projection, adjustProjectedThickness,
    aspect, thickness, miterLimit,
    prevId, currId, nextId,
    prevProjected, currProjected, nextProjected);

  vColor = color;
  vUD = ud;

  gl_Position = currProjected + vec4(miterOffset * offset, 0.0, 1.0);
}
