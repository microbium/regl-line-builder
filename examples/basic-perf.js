import createREGL from 'regl'
import mat4 from 'gl-mat4'
import { Stats } from '@jpweeks/rstats'
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
  maxSize: Math.pow(2, 16)
})
const ctx = lines.getContext()

function update ({ viewportWidth, viewportHeight }) {
  const { random } = Math
  const vw = viewportWidth - 20
  const vh = viewportHeight - 20

  lines.reset()

  for (let i = 0; i < 1400; i++) {
    let lineWidth = random() * 0.1 + 0.05
    let x = (random() * 2 - 1) * vw
    let y = (random() * 2 - 1) * vh
    let r = random() * 50 + 20

    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function draw ({ tick }) {
  const { sin } = Math
  const t0 = sin(tick * 0.1) * 0.5 + 0.5

  setupCamera(() => {
    regl.clear({
      model: mat4.identity([]),
      color: [1, 1, 1, 1],
      depth: 1
    })

    lines.draw({
      color: [0, 0, 0],
      thickness: (8 / 100) + t0 * (6 / 100),
      miterLimit: 1
    })
  })
}

regl.frame((params) => {
  stats('fps').frame()
  stats('update').start()
  update(params)
  stats('update').end()
  stats('draw').start()
  draw(params)
  stats('draw').end()
  stats().update()
})
