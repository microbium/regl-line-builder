import mat4 from 'gl-mat4'
import { inherit } from './utils/ctor'
import { lineMesh } from './utils/elements'
import { line } from './shaders/line'

var FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT
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

    return {
      position: {
        view: positionView,
        buffer: positionBuffer
      },
      offsetScale: {
        view: offsetScaleView,
        buffer: offsetScaleBuffer
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

    var drawCommand = regl({
      vert: line.vert,
      frag: line.frag,
      uniforms: uniforms,
      attributes: attributes,

      // TODO: Optimize elements
      elements: function () {
        var elementIndexStart = 0
        return state.paths
          .reduce(function (indices, item, index) {
            if (index === 0) elementIndexStart = 0
            lineMesh(indices, item.count, item.offset + elementIndexStart)
            elementIndexStart += item.count + 4
            return indices
          }, [])
      },

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
    position.buffer.subdata(position.view, 0)
    offsetScale.buffer.subdata(offsetScale.view, 0)
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
    var offset = activePath ? activePath.offset + activePath.count : 0
    var nextPath = {
      offset: offset,
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
    var ais = cursor.vertex * 2
    var bis = (cursor.vertex + 1) * 2

    positionView[aix] = positionView[aix + stride] = x
    positionView[aiy] = positionView[aiy + stride] = y
    positionView[bix] = positionView[bix + stride] = x
    positionView[biy] = positionView[biy + stride] = y
    offsetScaleView[ais] = 1
    offsetScaleView[ais + 1] = -1
    offsetScaleView[bis] = 1
    offsetScaleView[bis + 1] = -1

    activePath.count += 1
    cursor.element += 1
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

    var aix = cursor.vertex * stride * 2
    var aiy = aix + 1
    var ais = cursor.vertex * 2

    positionView[aix] = positionView[aix + stride] = x
    positionView[aiy] = positionView[aiy + stride] = y
    offsetScaleView[ais] = 1
    offsetScaleView[ais + 1] = -1

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
