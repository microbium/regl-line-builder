PATH=$(npm bin):$PATH
export NODE_ENV=production

uglifyjs --compress --mangle -- dist/regl-line-builder.js > dist/regl-line-builder.min.js
