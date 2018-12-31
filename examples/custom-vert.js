import createREGL from 'regl'
import { mat4 } from 'gl-matrix'
import Stats from '@jpweeks/rstats'
import { LineBuilder } from '../index'
import vertShader from './shaders/instancing.vert'

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

const lines = LineBuilder.create(regl, {
  bufferSize: 300,
  drawLineArgs: {
    vert: vertShader
  }
})
const ctx = lines.getContext()

ctx.lineWidth = 20
ctx.strokeStyle = '#222222'
ctx.beginPath()
ctx.strokeRect(-500, -700, 1000, 1400)

regl.frame(({ tick }) => {
  const { sin } = Math
  const t0 = sin(tick * 0.1) * 0.5 + 0.5
  const t1 = sin(tick * 0.025)

  stats('frame').start()
  stats('fps').frame()
  setupCamera(() => {
    regl.clear({
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
        miterLimit: 12,
        adjustProjectedThickness: true
      })
    })
  })
  stats('frame').end()
  stats().update()
})
