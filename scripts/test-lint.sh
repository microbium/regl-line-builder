PATH=$(npm bin):$PATH
export NODE_ENV=testing

eslint "src/**/*.js"
