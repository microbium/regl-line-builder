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

const ctx = LineBuilder.create(regl, {
  stride: 2,
  maxSize: 300
})

ctx.beginPath()
ctx.moveTo(0, 0)
ctx.lineTo(0, 100)
ctx.lineTo(500, 500)
ctx.lineTo(700, 0)
ctx.stroke()

ctx.beginPath()
ctx.moveTo(-400, -400)
ctx.lineTo(-200, 100)
ctx.lineTo(-700, 500)
ctx.stroke()

setupCamera(() => {
  regl.clear({
    color: [1, 1, 1, 1],
    depth: 1
  })

  ctx.update()
  ctx.draw({
    color: [0, 0, 0],
    thickness: 14 / 100,
    miterLimit: 1
  })
})
