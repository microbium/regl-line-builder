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
  bufferSize: 30
})
const ctx = lines.getContext()

function draw () {
  ctx.save()
  ctx.rotate(-Math.PI / 4)
  ctx.lineWidth = 20
  ctx.strokeStyle = '#fff000'
  ctx.beginPath()
  ctx.moveTo(300, 300)
  ctx.lineTo(-300, -300)
  ctx.lineTo(-300, -500)
  ctx.lineTo(300, -300)
  ctx.closePath()
  ctx.stroke()
  ctx.strokeRect(-500, -700, 1000, 1400)
  ctx.restore()

  ctx.save()
  ctx.rotate(Math.PI / 4)
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.moveTo(-300, 300)
  ctx.lineTo(300, -300)
  ctx.lineTo(300, -500)
  ctx.lineTo(-300, -300)
  ctx.closePath()
  ctx.stroke()
  ctx.strokeRect(-500, -700, 1000, 1400)
  ctx.restore()
}

let count = 1
function onClick () {
  count++
  lines.resize(30 * count)
  lines.reset()

  for (let i = 0; i < count; i++) {
    ctx.save()
    ctx.scale(1.0 + 0.1 * i, 1.0)
    ctx.rotate(0.1 * i)
    draw()
    ctx.restore()
  }
}

document.addEventListener('click', onClick)
draw()

regl.frame(({ tick }) => {
  const { sin } = Math
  const t0 = sin(tick * 0.1) * 0.5 + 0.5

  stats('frame').start()
  stats('fps').frame()
  setupCamera(() => {
    regl.clear({
      color: [1, 1, 1, 1],
      depth: 1
    })

    lines.draw({
      model: mat4.identity([]),
      tint: [1, 1, 1, 1],
      thickness: 1 + t0 * 0.5,
      miterLimit: 12,
      adjustProjectedThickness: true
    })
  })
  stats('frame').end()
  stats().update()
})
