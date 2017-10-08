import createREGL from 'regl'
import { mat4 } from 'gl-matrix'
import Stats from '@jpweeks/rstats'
import { LineBuilder } from '../index'

const regl = createREGL()
const setupCamera = regl({
  uniforms: {
    view: mat4.identity([]),
    projection: ({ viewportWidth, viewportHeight }) => {
      const w = viewportWidth / 2
      const h = viewportHeight / 2
      return mat4.ortho([], -w, w, -h, h, 0, 10)
    }
  }
})
const stats = new Stats()

const lines = LineBuilder.create(regl, {
  stride: 2,
  maxSize: 300
})
const ctx = lines.getContext()

ctx.save()
ctx.rotate(-Math.PI / 4)
ctx.lineWidth = 1
ctx.beginPath()
ctx.moveTo(300, 300)
ctx.lineTo(-300, -300)
ctx.lineTo(-300, -500)
ctx.lineTo(300, -300)
ctx.closePath()
ctx.stroke()
ctx.strokeRect(-500, 700, 1000, 1400)
ctx.restore()

ctx.rotate(Math.PI / 4)
ctx.lineWidth = 2
ctx.beginPath()
ctx.moveTo(-300, 300)
ctx.lineTo(300, -300)
ctx.lineTo(300, -500)
ctx.lineTo(-300, -300)
ctx.closePath()
ctx.stroke()
ctx.strokeRect(-500, 700, 1000, 1400)

regl.frame(({ tick }) => {
  const { sin } = Math
  const t0 = sin(tick * 0.1) * 0.5 + 0.5

  stats('frame').start()
  stats('fps').frame()
  setupCamera(() => {
    regl.clear({
      model: mat4.identity([]),
      color: [1, 1, 1, 1],
      depth: 1
    })

    lines.draw({
      model: mat4.identity([]),
      color: [0, 0, 0],
      thickness: (8 / 100) + t0 * (6 / 100),
      miterLimit: 1
    })
  })
  stats('frame').end()
  stats().update()
})
