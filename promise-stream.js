'use strict'
module.exports = mixinPromise
const PROMISE = Symbol('Promise')
const MAKEPROMISE = Symbol('makePromise')

function mixinPromise (Promise, stream) {
  const cls = typeof stream === 'function' ? stream : null
  const obj = cls ? cls.prototype : stream

  if (MAKEPROMISE in obj) return stream

  obj[MAKEPROMISE] = function () {
    this[PROMISE] = new Promise((resolve, reject) => {
      this.once('finish', resolve)
      this.once('error', reject)
    })
  }

  // the core interface
  for (let name of ['then', 'catch']) {
    obj[name] = function () {
      let func = Promise.prototype[name]
      if (!this[PROMISE]) this[MAKEPROMISE]()
      return func.apply(this[PROMISE], arguments)
    }
  }
  // and everything else, iterating prototype doesn't
  // work on builtin promises.
  for (let name in Promise.prototype) {
    if (name[0] === '_' || name === 'then' || name === 'catch') continue
    let func = Promise.prototype[name]
    obj[name] = function () {
      if (!this[PROMISE]) this[MAKEPROMISE]()
      return func.apply(this[PROMISE], arguments)
    }
  }
  return stream
}
