export function setRGB (out, color) {
  var hexString = parseInt(color.replace(/^#/, ''), 16)
  var hex = Math.floor(hexString)
  out[0] = (hex >> 16 & 255) / 255
  out[1] = (hex >> 8 & 255) / 255
  out[2] = (hex & 255) / 255
}
