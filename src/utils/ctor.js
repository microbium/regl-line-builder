export function ctor (Ctor) {
  return function () {
    var instance = Object.create(Ctor.prototype)
    Ctor.apply(instance, arguments)
    return instance
  }
}

export function inherit (ParentCtor, Ctor, proto) {
  Ctor.create = ctor(Ctor)
  if (ParentCtor) Ctor.prototype = Object.create(ParentCtor.prototype)
  Ctor.prototype.constructor = Ctor
  Object.assign(Ctor.prototype, proto)
}
