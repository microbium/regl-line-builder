import createREGL from 'regl'
import { mat4 } from 'gl-matrix'
import Stats from '@jpweeks/rstats'
import { LineBuilder } from '../index'

const regl = createREGL({
  extensions: ['angle_instanced_arrays']
})
const setupCamera = regl({
  uniforms: {
    view: mat4.identity([]),
    projection: ({ viewportWidth, viewportHeight }) => {
      const w = viewportWidth / 2
      const h = viewportHeight / 2
      return mat4.ortho([], -w, w, h, -h, 0, 1)
    }
  }
})
const setupInstances = regl({
  attributes: {
    angle: {
      buffer: regl.prop('angles'),
      divisor: 1
    }
  },
  instances: (context, { angles }) => angles.length
})
const stats = new Stats()

// TODO: Import shared projection code with glslify
const vert = `
  precision highp float;

  uniform mat4 projection;
  uniform mat4 model;
  uniform mat4 view;
  uniform float aspect;

  uniform float thickness;
  uniform float miterLimit;

  attribute vec2 prevPosition;
  attribute vec2 currPosition;
  attribute vec2 nextPosition;

  attribute float offset;
  attribute vec4 color;
  attribute vec2 ud;

  attribute float angle;

  varying vec4 vColor;
  varying vec2 vUD;

  vec2 rotatedPosition (vec2 position, float angle) {
    return vec2(
      +cos(angle) * position.x + position.y * sin(angle),
      -sin(angle) * position.x + position.y * cos(angle));
  }

  void main() {
    vec2 aspectVec = vec2(aspect, 1.0);
    mat4 projViewModel = projection * view * model;

    // TODO: Refactor to import/export as standalone function
    vec4 prevProjected = projViewModel *
      vec4(rotatedPosition(prevPosition, angle), 0.0, 1.0);
    vec4 currProjected = projViewModel *
      vec4(rotatedPosition(currPosition, angle), 0.0, 1.0);
    vec4 nextProjected = projViewModel *
      vec4(rotatedPosition(nextPosition, angle), 0.0, 1.0);

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

    vec2 normal = vec2(-dir.y, dir.x) *
      clamp(len, 0.0, max(thickness, miterLimit)) / aspectVec;

    vColor = color;
    vUD = ud;

    gl_Position = currProjected + vec4(normal * offset, 0.0, 1.0);
  }
`

const lines = LineBuilder.create(regl, {
  vert,
  bufferSize: 300
})
const ctx = lines.getContext()

ctx.lineWidth = 20
ctx.strokeStyle = '#222222'
ctx.beginPath()
ctx.strokeRect(-500, -700, 1000, 1400)

regl.frame(({ tick }) => {
  const { sin } = Math
  const t0 = sin(tick * 0.1) * 0.5 + 0.5
  const t1 = sin(tick * 0.05)

  stats('frame').start()
  stats('fps').frame()
  setupCamera(() => {
    regl.clear({
      model: mat4.identity([]),
      color: [1, 1, 1, 1],
      depth: 1
    })

    setupInstances({
      angles: [
        t1 * Math.PI * 0.25,
        t1 * Math.PI * 0.6,
        t1 * Math.PI * 1.2
      ]
    }, () => {
      lines.draw({
        model: mat4.identity([]),
        tint: [1, 1, 1, 1],
        thickness: 1 + t0 * 0.5,
        miterLimit: 12
      })
    })
  })
  stats('frame').end()
  stats().update()
})
