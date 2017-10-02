const glsl = require('glslify') // FIXME

export var line = {
  frag: glsl('./line.frag'),
  vert: glsl('./line.vert')
}
