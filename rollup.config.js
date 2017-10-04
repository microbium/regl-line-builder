const babel = require('rollup-plugin-babel')

module.exports = {
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
}
