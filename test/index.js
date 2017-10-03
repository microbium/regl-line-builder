import test from 'tape'
import createREGL from 'regl'
import { createContext } from './utils/create-context'
import { LineBuilder, line } from '../index'

var slice = Array.prototype.slice

test('export line shader', function (t) {
  t.plan(2)
  t.ok(line.vert, 'vert')
  t.ok(line.frag, 'frag')
})

test('export line builder', function (t) {
  t.plan(2)
  t.ok(LineBuilder != null)
  t.equal(typeof LineBuilder.create, 'function')
})

test('builder - create resources', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  t.plan(2)

  var ctx = LineBuilder.create(regl, {
    stride: 2,
    maxSize: 1024
  })

  var position = ctx.resources.position
  t.equal(position.view.constructor, Float32Array)
  t.equal(position.view.length, 1024 * 2 * 2)
})

test('builder - create geometry', function (t) {
  var gl = createContext(16, 16)
  var regl = createREGL(gl)

  t.plan(10)

  var ctx = LineBuilder.create(regl, {
    stride: 2,
    maxSize: 1024
  })
  var cursor = ctx.state.cursor
  var paths = ctx.state.paths
  var position = ctx.resources.position
  var offsetScale = ctx.resources.offsetScale

  ctx.beginPath()
  ctx.moveTo(10, 11)
  ctx.lineTo(20, 21)
  ctx.lineTo(30, 31)
  ctx.lineTo(40, 41)
  ctx.stroke()

  t.equal(cursor.element, 3)
  t.equal(cursor.vertex, 6)
  t.deepEqual(
    slice.call(position.view, 0, 6 * 2 * 2), [
      10, 11, 10, 11, 10, 11, 10, 11,
      20, 21, 20, 21,
      30, 31, 30, 31,
      40, 41, 40, 41, 40, 41, 40, 41])
  t.deepEqual(
    slice.call(offsetScale.view, 0, 6 * 2), [
      1, -1, 1, -1,
      1, -1,
      1, -1,
      1, -1, 1, -1])
  t.deepEqual(paths[0], {
    offset: 0,
    elementOffset: 0,
    count: 4,
    isClosed: false
  })

  ctx.beginPath()
  ctx.moveTo(50, 51)
  ctx.lineTo(60, 61)
  ctx.lineTo(70, 71)
  ctx.lineTo(80, 81)
  ctx.lineTo(90, 91)
  ctx.stroke()

  t.equal(cursor.element, 7)
  t.equal(cursor.vertex, 13)
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
      90, 91, 90, 91, 90, 91, 90, 91])
  t.deepEqual(
    slice.call(offsetScale.view, 0, 13 * 2), [
      1, -1, 1, -1,
      1, -1,
      1, -1,
      1, -1, 1, -1,
      1, -1, 1, -1,
      1, -1,
      1, -1,
      1, -1,
      1, -1, 1, -1])
  t.deepEqual(paths[1], {
    offset: 4,
    elementOffset: 12,
    count: 5,
    isClosed: false
  })
})
