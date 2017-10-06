PATH=$(npm bin):$PATH
export NODE_ENV=production

uglifyjs --compress --mangle -- dist/index.js > dist/index.min.js
