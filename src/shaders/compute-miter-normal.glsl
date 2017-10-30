// Based on WebGL lines demo
// (c) 2015 Matt DesLauriers. MIT License
// https://github.com/mattdesl/webgl-lines/

// TODO: Maybe make separate package to make reuse with custom shaders easier?
// TODO: Maybe use struct to pass some of this data?
vec2 computeMiterNormal (
  float aspect,
  float thickness,
  float miterLimit,
  vec4 prevProjected,
  vec4 currProjected,
  vec4 nextProjected
) {
  vec2 aspectVec = vec2(aspect, 1.0);

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
    if (int(miterLimit) == -1) {
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

  return vec2(-dir.y, dir.x) *
    clamp(len, 0.0, miterLimit) / aspectVec;
}

#pragma glslify: export(computeMiterNormal)
