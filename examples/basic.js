import createREGL from 'regl'
import mat4 from 'gl-mat4'
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

const lines = LineBuilder.create(regl, {
  stride: 2,
  maxSize: 300
})
const ctx = lines.getContext()

ctx.beginPath()
ctx.moveTo(100, 0)
ctx.lineTo(0, 100)
ctx.lineTo(500, 500)
ctx.lineTo(700, 0)
ctx.lineTo(300, -300)
ctx.lineTo(800, -600)
ctx.stroke()

ctx.beginPath()
ctx.moveTo(-400, -400)
ctx.lineTo(-200, 100)
ctx.lineTo(-700, 500)
ctx.lineTo(-800, 200)
ctx.lineTo(-600, 100)
ctx.stroke()

setupCamera(() => {
  regl.clear({
    color: [1, 1, 1, 1],
    depth: 1
  })

  lines.draw({
    color: [0, 0, 0],
    thickness: 14 / 100,
    miterLimit: 1
  })
})
