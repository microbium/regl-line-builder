var test = require('tape')
var createREGL = require('regl')
var { createContext } = require('./utils/create-context')
var { LineBuilder, line } = require('../dist/index')

var slice = Array.prototype.slice

test('export line shader', function (t) {
  t.ok(line.vert, 'vert')
  t.ok(line.frag, 'frag')
  t.end()
})

test('export line builder', function (t) {
  t.ok(LineBuilder != null, 'LineBuilder')
  t.equal(typeof LineBuilder.create, 'function', 'LineBuilder.create')
  t.end()
})

test('builder - create resources', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  var lines = LineBuilder.create(regl, {
    stride: 2,
    bufferSize: 1024
  })

  var position = lines.resources.position
  var offset = lines.resources.offset
  var elements = lines.resources.elements

  t.equal(position.view.constructor, Float32Array,
    'position.view')
  t.equal(position.view.length, 1024 * 2 * 2,
    'position.view.length')
  t.equal(offset.view.constructor, Float32Array,
    'offset.view')
  t.equal(offset.view.length, 1024 * 2,
    'offset.view.length')
  t.equal(elements.view.constructor, Uint16Array,
    'elements.view')
  t.equal(elements.view.length, 1024 * 4,
    'elements.view.length')

  t.end()
})

test('builder - resize resources', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  var lines = LineBuilder.create(regl, {
    stride: 2,
    bufferSize: 1024
  })

  var position = lines.resources.position
  var offset = lines.resources.offset
  var elements = lines.resources.elements

  t.equal(position.view.constructor, Float32Array,
    'position.view')
  t.equal(position.view.length, 1024 * 2 * 2,
    'position.view.length')
  t.equal(offset.view.constructor, Float32Array,
    'offset.view')
  t.equal(offset.view.length, 1024 * 2,
    'offset.view.length')
  t.equal(elements.view.constructor, Uint16Array,
    'elements.view')
  t.equal(elements.view.length, 1024 * 4,
    'elements.view.length')

  lines.resize(2048)

  t.equal(position.view.constructor, Float32Array,
    'position.view')
  t.equal(position.view.length, 2048 * 2 * 2,
    'position.view.length')
  t.equal(offset.view.constructor, Float32Array,
    'offset.view')
  t.equal(offset.view.length, 2048 * 2,
    'offset.view.length')
  t.equal(elements.view.constructor, Uint16Array,
    'elements.view')
  t.equal(elements.view.length, 2048 * 4,
    'elements.view.length')

  t.end()
})

test('builder - create paths', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  var lines = LineBuilder.create(regl, {
    stride: 2,
    bufferSize: 1024
  })
  var ctx = lines.getContext()
  var cursor = lines.state.cursor
  var paths = lines.state.paths
  var position = lines.resources.position
  var offset = lines.resources.offset

  ctx.beginPath()
  ctx.moveTo(10, 11)
  ctx.lineTo(20, 21)
  ctx.lineTo(30, 31)
  ctx.lineTo(40, 41)
  ctx.stroke()

  t.equal(cursor.quad, 3,
    'cursor.quad')
  t.equal(cursor.element, 12,
    'cursor.element')
  t.equal(cursor.vertex, 6,
    'cursor.vertex')

  t.equal(paths[0].offset, 0,
    'paths[0].offset')
  t.equal(paths[0].count, 4,
    'paths[0].count')

  t.deepEqual(
    slice.call(position.view, 0, 6 * 2 * 2), [
      10, 11, 10, 11, 10, 11, 10, 11,
      20, 21, 20, 21,
      30, 31, 30, 31,
      40, 41, 40, 41, 40, 41, 40, 41],
    'position.view values')
  t.deepEqual(
    slice.call(offset.view, 0, 6 * 2), [
      0.5, -0.5, 0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5, 0.5, -0.5],
    'offset.view values')

  ctx.beginPath()
  ctx.moveTo(50, 51)
  ctx.lineTo(60, 61)
  ctx.lineTo(70, 71)
  ctx.lineTo(80, 81)
  ctx.lineTo(90, 91)
  ctx.stroke()

  t.equal(cursor.quad, 7,
    'cursor.quad')
  t.equal(cursor.element, 26,
    'cursor.element')
  t.equal(cursor.vertex, 13,
    'cursor.vertex')

  t.equal(paths[1].offset, 4,
    'paths[1].offset')
  t.equal(paths[1].count, 5,
    'paths[1].count')

  t.deepEqual(
    slice.call(position.view, 0, 13 * 2 * 2), [
      10, 11, 10, 11, 10, 11, 10, 11,
      20, 21, 20, 21,
      30, 31, 30, 31,
      40, 41, 40, 41, 40, 41, 40, 41,
      50, 51, 50, 51, 50, 51, 50, 51,
      60, 61, 60, 61,
      70, 71, 70, 71,
      80, 81, 80, 81,
      90, 91, 90, 91, 90, 91, 90, 91],
    'position.view values')
  t.deepEqual(
    slice.call(offset.view, 0, 13 * 2), [
      0.5, -0.5, 0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5, 0.5, -0.5,
      0.5, -0.5, 0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5, 0.5, -0.5],
    'offset.view values')

  t.end()
})

test('builder - close paths', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  var lines = LineBuilder.create(regl, {
    stride: 2,
    bufferSize: 1024
  })
  var ctx = lines.getContext()
  var cursor = lines.state.cursor
  var paths = lines.state.paths
  var position = lines.resources.position
  var offset = lines.resources.offset

  ctx.beginPath()
  ctx.moveTo(10, 11)
  ctx.lineTo(20, 21)
  ctx.lineTo(30, 31)
  ctx.lineTo(40, 41)
  ctx.closePath()
  ctx.stroke()

  t.equal(cursor.quad, 4,
    'cursor.quad')
  t.equal(cursor.element, 14,
    'cursor.element')
  t.equal(cursor.vertex, 7,
    'cursor.vertex')

  t.equal(paths[0].offset, 0,
    'paths[0].offset')
  t.equal(paths[0].count, 5,
    'paths[0].count')
  t.equal(paths[0].isClosed, true,
    'paths[0].isClosed')

  t.deepEqual(
    slice.call(position.view, 0, 7 * 2 * 2), [
      40, 41, 40, 41,
      10, 11, 10, 11,
      20, 21, 20, 21,
      30, 31, 30, 31,
      40, 41, 40, 41,
      10, 11, 10, 11,
      20, 21, 20, 21],
    'position.view values')
  t.deepEqual(
    slice.call(offset.view, 0, 7 * 2), [
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5],
    'offset.view values')

  t.end()
})

test('builder - set line width', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  var lines = LineBuilder.create(regl, {
    stride: 2,
    bufferSize: 1024
  })
  var ctx = lines.getContext()
  var style = lines.state.style
  var offset = lines.resources.offset

  ctx.lineWidth = 3
  t.equal(style.lineWidth, 3, 'style.lineWidth')

  ctx.beginPath()
  ctx.moveTo(10, 11)
  ctx.lineTo(20, 21)
  ctx.lineTo(40, 41)
  ctx.stroke()

  t.deepEqual(
    slice.call(offset.view, 0, 5 * 2), [
      1.5, -1.5, 1.5, -1.5,
      1.5, -1.5,
      1.5, -1.5, 1.5, -1.5],
    'offset.view values')

  t.end()
})

test('builder - set stroke style', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  var lines = LineBuilder.create(regl, {
    stride: 2,
    bufferSize: 1024
  })
  var ctx = lines.getContext()
  var style = lines.state.style
  var color = lines.resources.color

  ctx.globalAlpha = 0.5
  ctx.strokeStyle = '#ff0000'
  t.equal(style.strokeStyle, '#ff0000', 'style.strokeStyle')
  t.deepEqual(style.color, [1, 0, 0, 0.5], 'style.color')

  ctx.beginPath()
  ctx.moveTo(10, 11)
  ctx.lineTo(20, 21)
  ctx.lineTo(30, 31)
  ctx.stroke()

  t.deepEqual(
    slice.call(color.view, 0, 5 * 4 * 2), [
      1, 0, 0, 0.5, 1, 0, 0, 0.5, 1, 0, 0, 0.5, 1, 0, 0, 0.5,
      1, 0, 0, 0.5, 1, 0, 0, 0.5,
      1, 0, 0, 0.5, 1, 0, 0, 0.5, 1, 0, 0, 0.5, 1, 0, 0, 0.5],
    'color.view values')

  t.end()
})

test('builder - reset state', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  var lines = LineBuilder.create(regl, {
    stride: 2,
    bufferSize: 1024
  })
  var ctx = lines.getContext()
  var state = lines.state
  var cursor = state.cursor
  var style = state.style
  var paths = state.paths
  var position = lines.resources.position
  var offset = lines.resources.offset

  ctx.globalAlpha = 0.5
  ctx.strokeStyle = '#ff0000'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(10, 11)
  ctx.lineTo(20, 21)
  ctx.lineTo(30, 31)
  ctx.lineTo(40, 41)
  ctx.stroke()

  t.equal(cursor.quad, 3,
    'cursor.quad')
  t.equal(cursor.element, 12,
    'cursor.element')
  t.equal(cursor.vertex, 6,
    'cursor.vertex')
  t.equal(style.lineWidth, 2,
    'style.lineWidth')
  t.deepEqual(style.color, [1, 0, 0, 0.5],
    'style.color')

  t.equal(paths[0].offset, 0,
    'paths[0].offset')
  t.equal(paths[0].count, 4,
    'paths[0].count')
  t.equal(paths[0].isClosed, false,
    'paths[0].isClosed')

  t.deepEqual(
    slice.call(position.view, 0, 6 * 2 * 2), [
      10, 11, 10, 11, 10, 11, 10, 11,
      20, 21, 20, 21,
      30, 31, 30, 31,
      40, 41, 40, 41, 40, 41, 40, 41],
    'position.view values')
  t.deepEqual(
    slice.call(offset.view, 0, 6 * 2), [
      1, -1, 1, -1,
      1, -1,
      1, -1,
      1, -1, 1, -1],
    'offset.view values')

  lines.reset()
  ctx.beginPath()
  ctx.moveTo(50, 51)
  ctx.lineTo(60, 61)
  ctx.lineTo(70, 71)
  ctx.lineTo(80, 81)
  ctx.lineTo(90, 91)
  ctx.stroke()

  t.equal(state.cursor.quad, 4,
    'cursor.quad')
  t.equal(state.cursor.element, 14,
    'cursor.element')
  t.equal(state.cursor.vertex, 7,
    'cursor.vertex')
  t.equal(state.style.lineWidth, 1,
    'style.lineWidth')
  t.deepEqual(state.style.color, [0, 0, 0, 1],
    'style.color')

  t.equal(paths[0].offset, 0,
    'paths[0].offset')
  t.equal(paths[0].count, 5,
    'paths[0].count')
  t.equal(paths[0].isClosed, false,
    'paths[0].isClosed')

  t.deepEqual(
    slice.call(position.view, 0, 7 * 2 * 2), [
      50, 51, 50, 51, 50, 51, 50, 51,
      60, 61, 60, 61,
      70, 71, 70, 71,
      80, 81, 80, 81,
      90, 91, 90, 91, 90, 91, 90, 91],
    'position.view values')
  t.deepEqual(
    slice.call(offset.view, 0, 7 * 2), [
      0.5, -0.5, 0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5,
      0.5, -0.5, 0.5, -0.5],
    'offset.view values')

  t.end()
})

test('builder - save and restore state', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  var lines = LineBuilder.create(regl, {
    stride: 2,
    bufferSize: 1024
  })
  var ctx = lines.getContext()
  var state = lines.state
  var style = state.style

  ctx.globalAlpha = 0.5
  ctx.strokeStyle = '#ff0000'
  ctx.lineWidth = 2

  ctx.save()

  t.equal(state.saveStack.length, 1,
    'saveStack.length')
  t.deepEqual(state.saveStack[0].style, {
    lineWidth: 2,
    color: [1, 0, 0, 0.5]
  },
  'saveStack[0].style state')

  ctx.globalAlpha = 1
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 4

  t.deepEqual(style.color, [0, 1, 1, 1],
    'style.color')
  t.equal(style.lineWidth, 4,
    'style.lineWidth')

  ctx.restore()

  t.equal(state.saveStack.length, 0,
    'saveStack.length')
  t.deepEqual(style.color, [1, 0, 0, 0.5],
    'style.color')
  t.equal(style.lineWidth, 2,
    'style.lineWidth')

  t.end()
})
