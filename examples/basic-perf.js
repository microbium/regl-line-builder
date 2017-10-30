import createREGL from 'regl'
import { mat4 } from 'gl-matrix'
import Stats from '@jpweeks/rstats'
import { LineBuilder, projectThickness } from '../index'

const regl = createREGL()
const projection = mat4.create()
const setupCamera = regl({
  uniforms: {
    view: mat4.identity([]),
    projection: ({ viewportWidth, viewportHeight }) => {
      const w = viewportWidth / 2
      const h = viewportHeight / 2
      return mat4.ortho(projection, -w, w, -h, h, 0, 10)
    }
  }
})
const stats = new Stats()

const lines = LineBuilder.create(regl, {
  stride: 2,
  bufferSize: Math.pow(2, 16)
})
const ctx = lines.getContext()

function update ({ viewportWidth, viewportHeight }) {
  const { random } = Math
  const vw = viewportWidth - 20
  const vh = viewportHeight - 20

  lines.reset()

  for (let i = 0; i < 1400; i++) {
    let lineWidth = random() * 2 + 0.5
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
      color: [1, 1, 1, 1],
      depth: 1
    })

    lines.draw({
      model: mat4.identity([]),
      tint: [1, 1, 1, 1],
      thickness: projectThickness(projection, 1 + t0 * 0.5),
      miterLimit: 12
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
