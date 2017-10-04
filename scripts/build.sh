# TODO: Add es module build
PATH=$(npm bin):$PATH
export NODE_ENV=production

rm -rf dist
mkdir dist
browserify -t [ rollupify --config rollup.config.js ] index.js > dist/index.js
uglifyjs --compress --mangle -- dist/index.js > dist/index.min.js
