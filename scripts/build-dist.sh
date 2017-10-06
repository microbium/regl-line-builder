PATH=$(npm bin):$PATH
export NODE_ENV=production

rm -rf dist
mkdir dist
rollup $* --config rollup.config.js index.js
