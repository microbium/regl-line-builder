import createREGL from 'regl'
import { mat4 } from 'gl-matrix'
import Stats from '@jpweeks/rstats'
import { LineBuilder } from '../index'

const COUNT = 33000

const regl = createREGL({
  extensions: ['OES_element_index_uint']
})
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
  bufferSize: COUNT * 6
})
const ctx = lines.getContext()

function update ({ viewportWidth, viewportHeight }) {
  const { random } = Math
  const vw = viewportWidth - 20
  const vh = viewportHeight - 20

  lines.reset()
  ctx.strokeStyle = '#ffffff'

  for (let i = 0; i < COUNT; i++) {
    let lineWidth = random() * 2 + 0.15
    let globalAlpha = random() * 0.9 + 0.1
    let x = (random() * 2 - 1) * vw
    let y = (random() * 2 - 1) * vh
    let r = random() * 50 + 20
    let rot = random() * Math.PI * 2

    ctx.globalAlpha = globalAlpha
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.rotate(rot)
    ctx.moveTo(x, y)
    ctx.lineTo(x + r, y + r)
    ctx.lineTo(x - r, y + r)
    ctx.closePath()
    ctx.stroke()
  }
}

const model = mat4.create()
function draw ({ tick }) {
  const { sin } = Math
  const t0 = sin(tick * 0.1) * 0.5 + 0.5

  setupCamera(() => {
    regl.clear({
      color: [1, 1, 1, 1],
      depth: 1
    })

    lines.draw({
      model,
      tint: [t0 * 0.5, t0 * 0.3, t0 * 0.6, 1],
      thickness: 1 + t0 * 2,
      miterLimit: 12,
      adjustProjectedThickness: true
    })
  })
}

let shouldUpdate = true
document.body.addEventListener('click', () => {
  shouldUpdate = !shouldUpdate
})

regl.frame((params) => {
  stats('fps').frame()
  stats('quads').set(lines.state.cursor.quad)
  stats('update').start()
  if (shouldUpdate) update(params)
  stats('update').end()
  stats('draw').start()
  draw(params)
  stats('draw').end()
  stats().update()
})
