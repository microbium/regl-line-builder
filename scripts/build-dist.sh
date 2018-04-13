PATH=$(npm bin):$PATH
export NODE_ENV=production

cleanup_lines () {
  SRC=$1
  cat $SRC | sed '/^$/N;/^\n$/D' > $SRC.tmp
  rm $SRC
  mv $SRC.tmp $SRC
}

fix_glmat_umd_import () {
  SRC=$1
  GL_MAT_IMPORT="{vec2:global.vec2,vec3:global.vec3,mat2d:global.mat2d,mat4:global.mat4}"
  cat $SRC | sed "s/global.glMatrix/$GL_MAT_IMPORT/g" > $SRC.tmp
  rm $SRC
  mv $SRC.tmp $SRC
}

rm -rf dist
mkdir dist
rollup $* --config rollup.config.js index.js
cleanup_lines dist/regl-line-builder.js
cleanup_lines dist/regl-line-builder.module.js
fix_glmat_umd_import ./dist/regl-line-builder.js
