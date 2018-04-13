# REGL LineBuilder

[![Stability][stability-image]][stability-url]
[![Build Status][travis-image]][travis-url]
[![Code Style][style-image]][style-url]
![File Size][size-image]

[![Pretty Face][pretty-face-image]][pretty-face-url]

Draw pretty lines in **WebGL** with the **Canvas2D** API.


## Example

```javascript
import createREGL from 'regl'
import { mat4 } from 'gl-matrix'
import { LineBuilder } from 'regl-line-builder'

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
  bufferSize: 300
})
const ctx = lines.getContext()

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
ctx.strokeRect(-500, 700, 1000, 1400)
ctx.restore()

ctx.rotate(Math.PI / 4)
ctx.lineWidth = 10
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

  setupCamera(() => {
    regl.clear({
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
})

```


## Install

```
npm install regl-line-builder --save
```


## License

(c) 2017 Jay Weeks. MIT License  
(c) 2015 Matt DesLauriers where noted. MIT License


[stability-url]: https://nodejs.org/api/documentation.html#documentation_stability_index
[stability-image]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[travis-url]: https://travis-ci.org/jpweeks/regl-line-builder
[travis-image]: https://img.shields.io/travis/jpweeks/regl-line-builder/master.svg?style=flat-square
[style-url]: https://standardjs.com
[style-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[size-image]: https://badge-size.herokuapp.com/jpweeks/regl-line-builder/master/dist/regl-line-builder.min.js.svg?compression=gzip&style=flat-square
[pretty-face-url]: http://requirebin.com/?gist=aa0328bbb030e868863fc57e3b17f8e2
[pretty-face-image]: ./assets/images/pretty-face.png
