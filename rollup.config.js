var babel = require('rollup-plugin-babel')

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

module.exports = {
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    stripGlslify()
  ],
  output: [
    {
      format: 'umd',
      name: 'REGL',
      file: 'dist/index.js'
    },
    {
      format: 'es',
      file: 'dist/index.module.js'
    }
  ]
}
