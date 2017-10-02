PATH=$(npm bin):$PATH
export NODE_ENV=development
budo examples/basic.js --title 'LineBuilder' --live -- -t babelify -t glslify
