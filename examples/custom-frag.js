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
      return mat4.ortho([], -w, w, -h, h, 0, 1)
    },
    resolution: ({ viewportWidth, viewportHeight }) =>
      [viewportWidth, viewportHeight]
  }
})
const stats = new Stats()

const frag = `
precision highp float;
uniform vec2 resolution;
varying vec4 vColor;
void main() {
  vec2 coord = gl_FragCoord.xy / resolution;
  gl_FragColor = vColor * vec4(
    coord.x,
    0.6 - distance(coord, vec2(0.5)),
    coord.y,
    1.0);
}
`
const lines = LineBuilder.create(regl, {
  stride: 2,
  bufferSize: 300,
  drawArgs: {
    frag
  }
})
const ctx = lines.getContext()

ctx.save()
ctx.rotate(-Math.PI / 4)
ctx.lineWidth = 20
ctx.strokeStyle = '#eeccff'
ctx.beginPath()
ctx.moveTo(300, 300)
ctx.lineTo(-300, -300)
ctx.lineTo(-300, -500)
ctx.lineTo(300, -300)
ctx.closePath()
ctx.stroke()
ctx.strokeRect(-500, -700, 1000, 1400)
ctx.restore()

ctx.rotate(Math.PI / 4)
ctx.lineWidth = 10
ctx.strokeStyle = '#ffeecc'
ctx.beginPath()
ctx.moveTo(-300, 300)
ctx.lineTo(300, -300)
ctx.lineTo(300, -500)
ctx.lineTo(-300, -300)
ctx.closePath()
ctx.stroke()
ctx.strokeRect(-500, -700, 1000, 1400)

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
      tint: [1, 1, 1, 1],
      thickness: 1 + t0 * 0.5,
      miterLimit: 12
    })
  })
  stats('frame').end()
  stats().update()
})
