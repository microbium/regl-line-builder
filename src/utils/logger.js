export function warnOnce (message) {
  var didWarn = false
  return function () {
    if (didWarn) return
    didWarn = true
    console.warn(message)
  }
}
