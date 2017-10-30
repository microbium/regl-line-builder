import { vec2 } from 'gl-matrix'

const scratchVec2 = vec2.create()
const singlePixel = vec2.set(vec2.create(), 2, 0)

export function projectThickness (projection, thickness) {
  const projectedThickness = vec2.transformMat4(
    scratchVec2, singlePixel, projection)
  return projectedThickness[0] * thickness
}
