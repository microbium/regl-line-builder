var resolve = require('rollup-plugin-node-resolve')
var commonjs = require('rollup-plugin-commonjs')
var babel = require('rollup-plugin-babel')

var NODE_ENV = process.env.NODE_ENV

// TODO: Fix removing glslify imports after compilation ...
function stripGlslify () {
  return {
    name: 'strip-glslify',
    transform: function (code, id) {
      var transformedCode = code.replace("import glsl from 'glslify'", '')
      return {
        code: transformedCode,
        map: { mappings: '' }
      }
    }
  }
}

var plugins = [
  resolve(),
  commonjs(),
  babel({
    exclude: 'node_modules/**'
  }),
  stripGlslify()
]

var configs = {
  development: {
    plugins: plugins
  },
  production: {
    plugins: plugins,
    output: [
      {
        format: 'umd',
        name: 'REGLLineBuilder',
        file: 'dist/index.js'
      },
      {
        format: 'es',
        file: 'dist/index.module.js'
      }
    ]
  }
}

module.exports = configs[NODE_ENV]
