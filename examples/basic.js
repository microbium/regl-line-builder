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
  bufferSize: 300
})
const ctx = lines.getContext()

ctx.globalAlpha = 0.5
ctx.strokeStyle = '#ffeeee'
ctx.lineWidth = 10
ctx.beginPath()
ctx.moveTo(-100, 0)
ctx.lineTo(0, 100)
ctx.lineTo(-500, 500)
ctx.lineTo(-700, 0)
ctx.lineTo(-300, -300)
ctx.lineTo(-800, -600)
ctx.stroke()

ctx.lineWidth = 10
ctx.beginPath()
ctx.moveTo(100, 0)
ctx.lineTo(0, 100)
ctx.lineTo(500, 500)
ctx.lineTo(700, 0)
ctx.lineTo(300, -300)
ctx.lineTo(800, -600)
ctx.stroke()

ctx.globalAlpha = 0.95
ctx.strokeStyle = '#eeeeee'
ctx.lineWidth = 22
ctx.beginPath()
ctx.moveTo(-400, -400)
ctx.lineTo(-200, 100)
ctx.lineTo(-700, 500)
ctx.lineTo(-800, 200)
ctx.lineTo(-600, 100)
ctx.stroke()

ctx.strokeRect(-100, -200, 100, 200)
ctx.fill()

ctx.strokeRect(0, 200, 100, 200)
ctx.fill()

// ctx.beginPath()
// ctx.strokeRect(0, 0, 100, 200)
// ctx.fill()

ctx.lineWidth = 20
ctx.beginPath()
ctx.moveTo(400, -400)
ctx.lineTo(200, 100)
ctx.lineTo(700, 500)
ctx.lineTo(800, 200)
ctx.lineTo(600, 100)
ctx.stroke()

ctx.globalAlpha = 0.9
ctx.strokeStyle = '#eeffff'
ctx.lineWidth = 10
ctx.beginPath()
ctx.arc(400, 50, 50, 0, Math.PI)
ctx.stroke()
ctx.beginPath()
ctx.arc(-400, 50, 50, 0, Math.PI)
ctx.stroke()

ctx.strokeStyle = '#cccccc'
ctx.lineWidth = 30
ctx.beginPath()
ctx.arc(0, -400, 240, 0, Math.PI, true)
ctx.stroke()

regl.frame(({ tick }) => {
  const { sin } = Math
  const t0 = sin(tick * 0.1) * 0.5 + 0.5
  const t1 = sin(tick * 0.2) * 0.5 + 0.5

  stats('frame').start()
  stats('fps').frame()
  setupCamera(() => {
    regl.clear({
      color: [1, 1, 1, 1],
      depth: 1
    })

    lines.draw({
      model: mat4.identity([]),
      tint: [0.8 * t0, 0, 0.5 * t1, 1],
      thickness: 1 + t0 * 0.5,
      miterLimit: 12,
      adjustProjectedThickness: true
    })
  })
  stats('frame').end()
  stats().update()
})
