export function lineMesh (buffer, howMany, index) {
  for (var i = 0; i < howMany - 1; i++) {
    var a = index + i * 2
    var b = a + 1
    var c = a + 2
    var d = a + 3
    buffer.push(
      a, b, c,
      c, b, d)
  }
  return buffer
}
