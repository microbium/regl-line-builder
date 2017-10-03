import mat4 from 'gl-mat4'
import { inherit } from './utils/ctor'
import { line } from './shaders/line'

var FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT
var INT_BYTES = Uint16Array.BYTES_PER_ELEMENT
var CONTEXT_METHODS = [
  'beginPath',
  'moveTo',
  'lineTo',
  'closePath',
  'stroke'
]

export function LineBuilder (regl, opts) {
  this.context = this.createContext(regl)
  this.state = this.createState(opts)
  this.resources = this.createResources()
  this.attributes = this.createAttributes()
  this.draw = this.createDrawCommand()
}

inherit(null, LineBuilder, {
  createContext: function (regl) {
    return {
      regl: regl
    }
  },

  createState: function (opts) {
    var cursor = {
      vertex: 0,
      element: 0,
      stride: opts.stride,
      max: opts.maxSize
    }
    return {
      cursor: cursor,
      activePath: null,
      paths: []
    }
  },

  createResources: function () {
    var regl = this.context.regl
    var cursor = this.state.cursor

    var positionView = new Float32Array(cursor.max * cursor.stride * 2)
    var offsetScaleView = new Float32Array(cursor.max * 2)
    // var uvs = new Float32Array(cursor.max * 2 * 3)
    var elementsView = new Uint16Array(cursor.max * 4)

    var positionBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      length: positionView.length * FLOAT_BYTES
    })
    var offsetScaleBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      length: offsetScaleView.length * FLOAT_BYTES
    })
    var elementsBuffer = regl.elements({
      usage: 'dynamic',
      type: 'uint16',
      primitive: 'triangles',
      length: elementsView.length * INT_BYTES
    })

    return {
      position: {
        view: positionView,
        buffer: positionBuffer
      },
      offsetScale: {
        view: offsetScaleView,
        buffer: offsetScaleBuffer
      },
      elements: {
        view: elementsView,
        buffer: elementsBuffer
      }
    }
  },

  createAttributes: function () {
    var stride = this.state.cursor.stride
    var position = this.resources.position
    var offsetScale = this.resources.offsetScale

    return {
      prevPosition: {
        buffer: position.buffer,
        offset: 0,
        stride: FLOAT_BYTES * stride
      },
      currPosition: {
        buffer: position.buffer,
        offset: FLOAT_BYTES * stride * 2,
        stride: FLOAT_BYTES * stride
      },
      nextPosition: {
        buffer: position.buffer,
        offset: FLOAT_BYTES * stride * 4,
        stride: FLOAT_BYTES * stride
      },
      offsetScale: offsetScale.buffer
    }
  },

  createDrawCommand: function () {
    var attributes = this.attributes
    var regl = this.context.regl
    var resources = this.resources
    var state = this.state

    var uniforms = {
      model: mat4.identity([]),
      aspect: function (params) {
        return params.viewportWidth / params.viewportHeight
      },
      color: regl.prop('color'),
      thickness: regl.prop('thickness'),
      miterLimit: regl.prop('miterLimit')
    }
    var count = function () {
      return state.cursor.element * 6
    }
    var drawCommand = regl({
      vert: line.vert,
      frag: line.frag,
      uniforms: uniforms,
      attributes: attributes,
      elements: resources.elements.buffer,
      count: count,
      depth: { enable: false }
    })

    return function (params) {
      this.syncResourceBuffers()
      return drawCommand(params)
    }.bind(this)
  },

  syncResourceBuffers: function () {
    var position = this.resources.position
    var offsetScale = this.resources.offsetScale
    var elements = this.resources.elements
    position.buffer.subdata(position.view, 0)
    offsetScale.buffer.subdata(offsetScale.view, 0)
    elements.buffer.subdata(elements.view, 0)
  },

  getContext: function () {
    var that = this
    return CONTEXT_METHODS.reduce(function (map, key) {
      map[key] = that[key].bind(that)
      return map
    }, {})
  },

  // TODO: Resize resource buffers
  resize: function (count) {
    var cursor = this.state.cursor
    cursor.max = count
  },

  reset: function () {
    this.state = this.createState()
  },

  // Geometry Creation
  // -----------------
  //
  // - duplicate verts are expanded to line widths in shader
  // - doubly duplicated verts mark path start / end
  //

  beginPath: function () {
    var state = this.state
    var activePath = state.activePath
    var offset = !activePath ? 0
      : activePath.offset + activePath.count
    var elementOffset = !activePath ? 0
      : activePath.elementOffset + activePath.count + 4 + offset

    var nextPath = {
      offset: offset,
      elementOffset: elementOffset,
      count: 0,
      isClosed: false
    }

    state.activePath = nextPath
    state.paths.push(nextPath)
  },

  moveTo: function (x, y) {
    var state = this.state
    var activePath = state.activePath

    var cursor = state.cursor
    var stride = cursor.stride

    var resources = this.resources
    var positionView = resources.position.view
    var offsetScaleView = resources.offsetScale.view

    var aix = cursor.vertex * stride * 2
    var aiy = aix + 1
    var bix = (cursor.vertex + 1) * stride * 2
    var biy = bix + 1
    positionView[aix] = positionView[aix + stride] = x
    positionView[aiy] = positionView[aiy + stride] = y
    positionView[bix] = positionView[bix + stride] = x
    positionView[biy] = positionView[biy + stride] = y

    var ais = cursor.vertex * 2
    var bis = (cursor.vertex + 1) * 2
    offsetScaleView[ais + 0] = 1
    offsetScaleView[ais + 1] = -1
    offsetScaleView[bis + 0] = 1
    offsetScaleView[bis + 1] = -1

    activePath.count += 1
    cursor.vertex += 2
  },

  lineTo: function (x, y) {
    var state = this.state
    var activePath = state.activePath

    var cursor = state.cursor
    var stride = cursor.stride

    var resources = this.resources
    var positionView = resources.position.view
    var offsetScaleView = resources.offsetScale.view
    var elementsView = resources.elements.view

    var aix = cursor.vertex * stride * 2
    var aiy = aix + 1
    positionView[aix] = positionView[aix + stride] = x
    positionView[aiy] = positionView[aiy + stride] = y

    var ais = cursor.vertex * 2
    offsetScaleView[ais] = 1
    offsetScaleView[ais + 1] = -1

    var evi = cursor.element * 6
    var aio = activePath.elementOffset + (activePath.count - 1) * 2
    var bio = aio + 1
    var cio = aio + 2
    var dio = aio + 3
    elementsView[evi + 0] = aio
    elementsView[evi + 1] = bio
    elementsView[evi + 2] = cio
    elementsView[evi + 3] = cio
    elementsView[evi + 4] = bio
    elementsView[evi + 5] = dio

    activePath.count += 1
    cursor.element += 1
    cursor.vertex += 1
  },

  closePath: function () {},

  stroke: function () {
    var state = this.state
    var cursor = state.cursor
    var stride = cursor.stride

    var resources = this.resources
    var positionView = resources.position.view
    var offsetScaleView = resources.offsetScale.view

    var bix = (cursor.vertex - 1) * stride * 2
    var biy = bix + 1
    var aix = cursor.vertex * stride * 2
    var aiy = aix + 1
    var bis = (cursor.vertex - 1) * 2
    var ais = cursor.vertex * 2

    positionView[aix] = positionView[aix + stride] = positionView[bix]
    positionView[aiy] = positionView[aiy + stride] = positionView[biy]
    offsetScaleView[ais] = offsetScaleView[bis]
    offsetScaleView[ais + 1] = offsetScaleView[bis + 1]

    cursor.vertex += 1
  }
})
