var resolve = require('rollup-plugin-node-resolve')
var commonjs = require('rollup-plugin-commonjs')
var glslify = require('@shotamatsuda/rollup-plugin-glslify')
var cleanup = require('rollup-plugin-cleanup')

var NODE_ENV = process.env.NODE_ENV

var commonPlugins = [
  resolve({
    main: false,
    modulesOnly: true
  }),
  commonjs(),
  glslify()
]

var configs = {
  development: {
    plugins: commonPlugins
  },
  production: {
    plugins: [].concat(commonPlugins, [
      cleanup({
        maxEmptyLines: 1
      })
    ]),
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
