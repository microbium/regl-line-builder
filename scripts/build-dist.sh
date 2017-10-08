PATH=$(npm bin):$PATH
export NODE_ENV=production

cleanup_lines () {
  SRC=$1
  cat $SRC | sed '/^$/N;/^\n$/D' > $SRC.tmp
  rm $SRC
  mv $SRC.tmp $SRC
}

rm -rf dist
mkdir dist
rollup $* --config rollup.config.js index.js
cleanup_lines ./dist/index.js
cleanup_lines ./dist/index.module.js
