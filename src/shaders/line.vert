precision highp float;

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
// attribute vec3 prevPosition;
// attribute vec3 currPosition;
// attribute vec3 nextPosition;

attribute float offsetScale;
// attribute vec3 uv;

// varying vec3 vUV;

void main() {
  vec2 aspectVec = vec2(aspect, 1.0);
  mat4 projViewModel = projection * view * model;

  vec4 prevProjected = projViewModel * vec4(prevPosition, 0.0, 1.0);
  vec4 currProjected = projViewModel * vec4(currPosition, 0.0, 1.0);
  vec4 nextProjected = projViewModel * vec4(nextPosition, 0.0, 1.0);

  // get 2D screen space with W divide and aspect correction
  vec2 prevScreen = prevProjected.xy / prevProjected.w * aspectVec;
  vec2 currScreen = currProjected.xy / currProjected.w * aspectVec;
  vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;

  vec2 dir = vec2(0.0);
  float len = thickness;

  // starting point uses (next - current)
  if (currScreen == prevScreen) {
    dir = normalize(nextScreen - currScreen);
  }
  // ending point uses (current - previous)
  else if (currScreen == nextScreen) {
    dir = normalize(currScreen - prevScreen);
  }
  // somewhere in middle, needs a join
  else {
    // get directions from (C - B) and (B - A)
    vec2 dirA = normalize((currScreen - prevScreen));
    if (int(miterLimit) == 0) {
      dir = dirA;
    } else {
      vec2 dirB = normalize((nextScreen - currScreen));
      // now compute the miter join normal and length
      vec2 tangent = normalize(dirA + dirB);
      vec2 perp = vec2(-dirA.y, dirA.x);
      vec2 miter = vec2(-tangent.y, tangent.x);
      dir = tangent;
      len /= dot(miter, perp);
    }
  }

  vec2 normal = vec2(-dir.y, dir.x) *
    clamp(len, 0.0, max(thickness, miterLimit)) / aspectVec;
  vec4 offset = vec4(normal * offsetScale, 0.0, 1.0);

  // vUV = uv;
  gl_Position = currProjected + offset;
}
