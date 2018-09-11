import { vec2, vec3 } from 'gl-matrix'
import { inherit } from './utils/ctor'

export function LinePath (opts) {
  this.dimensions = opts.dimensions
  this.offset = 0
  this.count = 0
  this.totalLength = 0
  this.isClosed = false
  this.points = []
}

inherit(null, LinePath, {
  reset: function () {
    this.offset = 0
    this.count = 0
    this.totalLength = 0
    this.isClosed = false
  },

  addPoint: function (pos) {
    var points = this.points
    var dimensions = this.dimensions
    var nextPoint = points[this.count++]

    if (!nextPoint) {
      nextPoint = dimensions === 2 ? vec2.create() : vec3.create()
      points.push(nextPoint)
    }

    if (dimensions === 2) {
      vec2.copy(nextPoint, pos)
    } else {
      vec3.copy(nextPoint, pos)
    }
  }
})
