PATH=$(npm bin):$PATH
export NODE_ENV=testing

babel-tape-runner test/*.js | tap-spec
