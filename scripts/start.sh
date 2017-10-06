PATH=$(npm bin):$PATH
export NODE_ENV=development

SRC_NAME=$1
if [ $# -eq 0 ]
  then
    SRC_NAME='basic'
fi

echo "Running $SRC_NAME example ..."
budo examples/$SRC_NAME.js \
  --title "LineBuilder – $SRC_NAME" \
  --live -- -t [ "@jpweeks/rollupify" --config rollup.config.js ]
