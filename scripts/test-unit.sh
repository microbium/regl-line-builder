PATH=$(npm bin):$PATH
babel-tape-runner test/*.js | faucet
