import createREGL from 'regl'
import { mat4 } from 'gl-matrix'
import Stats from '@jpweeks/rstats'
import { LineBuilder } from '../index'

const regl = createREGL()
const setupCamera = regl({
  uniforms: {
    view: mat4.fromTranslation([], [0, 0, -1200]),
    projection: ({ viewportWidth, viewportHeight }) => {
      const w = viewportWidth / 2
      const h = viewportHeight / 2
      const fov = Math.PI / 2
      const aspect = w / h
      return mat4.perspective([], fov, aspect, 0.01, 4000)
    }
  }
})
const stats = new Stats()

const lines = LineBuilder.create(regl, {
  dimensions: 3,
  bufferSize: 2048
})
const ctx = lines.getContext('3d')

function update ({ tick }) {
  const curve = polarCurve([], 120,
    (t) => Math.sin(2.5 * t) * 400)

  ctx.save()
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#222222'
  ctx.rotate(tick * 0.01, 'z')
  ctx.beginPath()
  curve.forEach((point, i) => {
    const t = i / (curve.length - 1)
    const x = point[0]
    const y = point[1]
    const z = (t * 2 - 1) * 600

    ctx.lineWidth = t * 30 + 2
    if (i === 0) ctx.moveTo(x, y, z)
    else ctx.lineTo(x, y, z)
  })
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.translate(0, 0, -6 * 100)
  ;(new Array(12).fill(0).forEach((n, i) => {
    const t = i / 11
    const radius = Math.sin(t * Math.PI) * 200 + 50

    ctx.lineWidth = i * 2
    ctx.strokeStyle = '#ff0000'
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.stroke()

    ctx.translate(0, 0, 100)
  }))
  ctx.restore()

  ctx.save()
  ctx.rotate(Math.PI / 2, 'y')
  ctx.rotate(tick * 0.02, 'x')
  ctx.translate(0, 300, 0)
  ;(new Array(24).fill(0).forEach((n, i) => {
    const t = i / 11
    const radius = Math.sin(t * Math.PI) * 200 + 50

    ctx.lineWidth = i * 2
    ctx.strokeStyle = '#333333'
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.stroke()

    ctx.translate(i * 2, 0, 200)
    ctx.rotate(Math.PI * 0.2, 'x')
  }))
  ctx.restore()
}

regl.frame(({ tick }) => {
  const { sin } = Math
  const t0 = sin(tick * 0.1) * 0.5 + 0.5

  stats('frame').start()
  stats('fps').frame()

  lines.reset()
  update({ tick })

  setupCamera(() => {
    regl.clear({
      color: [1, 1, 1, 1],
      depth: 1
    })

    lines.draw({
      model: mat4.fromRotation([],
        Math.PI * Math.sin(tick * 0.001),
        [0, 1, 0]),
      tint: [1, 1, 1, 1],
      thickness: (1 + t0 * 0.5) * 2,
      miterLimit: 2,
      adjustProjectedThickness: false
    })
  })
  stats('frame').end()
  stats().update()
})

function polarCurve (buffer, howMany, polarFn) {
  const thetaMax = Math.PI * 2
  for (let i = 0; i < howMany; i++) {
    const theta = i / (howMany - 1) * thetaMax
    const radius = polarFn(theta, i)
    const x = Math.cos(theta) * radius
    const y = Math.sin(theta) * radius
    buffer.push([x, y, 0])
  }
  return buffer
}
