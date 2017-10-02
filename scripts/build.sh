PATH=$(npm bin):$PATH
export NODE_ENV=production

mkdir -p assets/scripts
browserify -t [ rollupify --config rollup.config.js ] src/index.js > dist/index.js
uglifyjs --compress --mangle -- dist/index.js > dist/index.min.js
