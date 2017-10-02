import { inherit } from './utils/ctor'

var FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT

export function LineBuilder (regl, opts) {
  this.context = this.createContext(regl)
  this.state = this.createState(opts)
  this.resources = this.createResources()
  this.attributes = this.createAttributes()
}

inherit(null, LineBuilder, {
  createContext: function (regl) {
    return {
      regl: regl
    }
  },

  createState: function (opts) {
    var cursor = {
      index: 0,
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
    // var scales = new Float32Array(cursor.max * 2)
    // var uvs = new Float32Array(cursor.max * 2 * 3)

    var positionBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      length: positionView.length * FLOAT_BYTES
    })

    return {
      position: {
        view: positionView,
        buffer: positionBuffer
      }
    }
  },

  createAttributes: function () {
    var stride = this.state.stride
    var position = this.resources.position

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
      }
    }
  },

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
    var nextPath = {
      offset: state.cursor.index,
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

    var aix = cursor.index * stride * 2
    var aiy = aix + 1
    var bix = (cursor.index + 1) * stride * 2
    var biy = bix + 1

    positionView[aix] = positionView[aix + stride] = x
    positionView[aiy] = positionView[aiy + stride] = y
    positionView[bix] = positionView[bix + stride] = x
    positionView[biy] = positionView[biy + stride] = y

    activePath.count = 1
    cursor.index += 2
  },

  lineTo: function (x, y) {
    var state = this.state
    var activePath = state.activePath
    var cursor = state.cursor

    var resources = this.resources
    var positionView = resources.position.view
    var stride = cursor.stride

    var aix = cursor.index * stride * 2
    var aiy = aix + 1

    positionView[aix] = positionView[aix + stride] = x
    positionView[aiy] = positionView[aiy + stride] = y

    activePath.count += 1
    cursor.index += 1
  },

  closePath: function () {},

  stroke: function () {
    var state = this.state
    var cursor = state.cursor
    var stride = cursor.stride

    var resources = this.resources
    var positionView = resources.position.view

    var pix = (cursor.index - 1) * stride * 2
    var piy = pix + 1
    var aix = cursor.index * stride * 2
    var aiy = aix + 1

    positionView[aix] = positionView[aix + stride] = positionView[pix]
    positionView[aiy] = positionView[aiy + stride] = positionView[piy]

    cursor.index += 1
  }
})
