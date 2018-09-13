var glslify = require('@shotamatsuda/rollup-plugin-glslify')
var cleanup = require('rollup-plugin-cleanup')

var NODE_ENV = process.env.NODE_ENV

var commonPlugins = [
  glslify()
]

var globals = {
  'gl-matrix': 'glMatrix',
  'earcut': 'earcut'
}

var configs = {
  development: {
    plugins: commonPlugins
  },
  production: {
    external: ['gl-matrix', 'earcut'],
    plugins: [].concat(commonPlugins, [
      cleanup({
        maxEmptyLines: -1
      })
    ]),
    output: [
      {
        format: 'umd',
        name: 'REGLLineBuilder',
        file: 'dist/regl-line-builder.js',
        globals: globals
      },
      {
        format: 'es',
        file: 'dist/regl-line-builder.module.js',
        globals: globals
      }
    ]
  }
}

module.exports = configs[NODE_ENV]
