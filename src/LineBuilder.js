import identity from 'gl-mat4/identity'
import { inherit } from './utils/ctor'
import { line } from './shaders/line'

var FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT
var INT_BYTES = Uint16Array.BYTES_PER_ELEMENT
var CONTEXT_METHODS = [
  'beginPath',
  'moveTo',
  'lineTo',
  'arc',
  'closePath',
  'stroke'
]
var CONTEXT_ACCESSORS = [
  'lineWidth'
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
      quad: 0,
      stride: opts.stride,
      max: opts.maxSize
    }
    var sync = {
      vertex: 0
    }
    var style = {
      lineWidth: 1
    }
    return {
      cursor: cursor,
      sync: sync,
      style: style,
      activePath: null,
      paths: []
    }
  },

  createResources: function () {
    var regl = this.context.regl
    var cursor = this.state.cursor

    var positionView = new Float32Array(cursor.max * cursor.stride * 2)
    var offsetView = new Float32Array(cursor.max * 2)
    // var uvs = new Float32Array(cursor.max * 2 * 3)
    var elementsView = new Uint16Array(cursor.max * 4)

    var positionBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      length: positionView.length * FLOAT_BYTES
    })
    var offsetBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      length: offsetView.length * FLOAT_BYTES
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
      offset: {
        view: offsetView,
        buffer: offsetBuffer
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
    var offset = this.resources.offset

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
      offset: offset.buffer
    }
  },

  createDrawCommand: function () {
    var attributes = this.attributes
    var regl = this.context.regl
    var resources = this.resources
    var state = this.state

    var uniforms = {
      model: identity([]),
      aspect: function (params) {
        return params.viewportWidth / params.viewportHeight
      },
      color: regl.prop('color'),
      thickness: regl.prop('thickness'),
      miterLimit: regl.prop('miterLimit')
    }
    var count = function () {
      return state.cursor.quad * 6
    }
    // TODO: Share base regl command between multiple LineBuilder instances
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
      if (state.sync.vertex < state.cursor.vertex) {
        this.syncResourceBuffers()
        state.sync.vertex = state.cursor.vertex
      }
      return drawCommand(params)
    }.bind(this)
  },

  syncResourceBuffers: function () {
    var position = this.resources.position
    var offset = this.resources.offset
    var elements = this.resources.elements
    position.buffer.subdata(position.view, 0)
    offset.buffer.subdata(offset.view, 0)
    elements.buffer.subdata(elements.view, 0)
  },

  getContext: function () {
    var that = this
    var state = this.state
    var map = {}
    CONTEXT_METHODS.forEach(function (key) {
      map[key] = that[key].bind(that)
    })
    CONTEXT_ACCESSORS.forEach(function (key) {
      var accessor = that[key]
      Object.defineProperty(map, key, accessor(state))
    })
    return map
  },

  // TODO: Resize resource buffers
  resize: function (count) {
    var cursor = this.state.cursor
    cursor.max = count
  },

  reset: function () {
    var state = this.state
    state.cursor.quad = 0
    state.cursor.element = 0
    state.cursor.vertex = 0
    state.sync.vertex = 0
    state.style.lineWidth = 1
    state.activePath = null
    state.paths = []
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
    var lineWidth = state.style.lineWidth * 0.5

    var resources = this.resources
    var positionView = resources.position.view
    var offsetView = resources.offset.view

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
    offsetView[ais + 0] = lineWidth
    offsetView[ais + 1] = -lineWidth
    offsetView[bis + 0] = lineWidth
    offsetView[bis + 1] = -lineWidth

    activePath.count += 1
    cursor.vertex += 2
  },

  lineTo: function (x, y) {
    var state = this.state
    var activePath = state.activePath

    var cursor = state.cursor
    var stride = cursor.stride
    var lineWidth = state.style.lineWidth * 0.5

    var resources = this.resources
    var positionView = resources.position.view
    var offsetView = resources.offset.view
    var elementsView = resources.elements.view

    var aix = cursor.vertex * stride * 2
    var aiy = aix + 1
    positionView[aix] = positionView[aix + stride] = x
    positionView[aiy] = positionView[aiy + stride] = y

    // FIXME: Implement correct intermediate lineWidth changes
    var ais = cursor.vertex * 2
    offsetView[ais] = lineWidth
    offsetView[ais + 1] = -lineWidth

    var evi = cursor.quad * 6
    var aio = cursor.element
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
    cursor.quad += 1
    cursor.element += 2
    cursor.vertex += 1
  },

  // TODO: Enable configuring segment precision
  arc: function (x, y, radius, startAngle, endAngle, anticlockwise) {
    var delta = endAngle - startAngle
    var dir = anticlockwise === true ? -1 : 1
    var count = Math.ceil(delta / (Math.PI / 10))

    for (var i = 0; i < count; i++) {
      var t = i / (count - 1)
      var angle = startAngle + t * delta * dir
      var ax = x + Math.cos(angle) * radius
      var ay = y + Math.sin(angle) * radius

      if (i === 0) this.moveTo(ax, ay)
      else this.lineTo(ax, ay)
    }
  },

  closePath: function () {
    var state = this.state
    var activePath = state.activePath
    var cursor = state.cursor
    var stride = cursor.stride

    var resources = this.resources
    var positionView = resources.position.view

    var bi = cursor.vertex - activePath.count
    var bix = bi * stride * 2
    var biy = bix + 1

    var x = positionView[bix]
    var y = positionView[biy]

    this.lineTo(x, y)
    activePath.isClosed = true
  },

  copyPosition: function (ai, bi) {
    var state = this.state
    var cursor = state.cursor
    var stride = cursor.stride

    var resources = this.resources
    var positionView = resources.position.view

    var aix = ai * stride * 2
    var aiy = aix + 1
    var bix = bi * stride * 2
    var biy = bix + 1

    positionView[aix] = positionView[aix + stride] = positionView[bix]
    positionView[aiy] = positionView[aiy + stride] = positionView[biy]
  },

  stroke: function () {
    var state = this.state
    var activePath = state.activePath
    var cursor = state.cursor
    var stride = cursor.stride

    var resources = this.resources
    var positionView = resources.position.view
    var offsetView = resources.offset.view

    var si = cursor.vertex - activePath.count
    var bi = cursor.vertex - 1
    var ai = cursor.vertex

    var bix = bi * stride * 2
    var biy = bix + 1
    var aix = ai * stride * 2
    var aiy = aix + 1
    var bis = bi * 2
    var ais = ai * 2

    positionView[aix] = positionView[aix + stride] = positionView[bix]
    positionView[aiy] = positionView[aiy + stride] = positionView[biy]
    offsetView[ais] = offsetView[bis]
    offsetView[ais + 1] = offsetView[bis + 1]

    cursor.element += 6
    cursor.vertex += 1

    if (activePath.isClosed) {
      this.copyPosition(si - 1, bi - 1)
      this.copyPosition(ai, si + 1)
    }
  },

  lineWidth: function (state) {
    return {
      get: function () {
        return state.style.lineWidth
      },
      set: function (v) {
        state.style.lineWidth = v
        return v
      }
    }
  }
})
