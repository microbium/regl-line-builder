PATH=$(npm bin):$PATH
export NODE_ENV=testing

tape test/*.js | tap-spec
