'use strict'
module.exports = mixinPromise
const PROMISE = Symbol('promise')
const MAKEPROMISE = Symbol('makePromise')

function mixinPromise (Promise, stream) {
  const cls = typeof stream === 'function' ? stream : null
  const obj = cls ? cls.prototype : stream

  if (MAKEPROMISE in obj) return stream

  obj[MAKEPROMISE] = function () {
    this[PROMISE] = new Promise((resolve, reject) => {
      this.once('result', resolve)
      // finish should always lose any race w/ result
      this.once('finish', () => setImmediate(resolve))
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
  // work on builtin promises, thus the hard coded list above.
  for (let name in Promise.prototype) {
    if (name[0] === '_') continue
    if (name in obj) continue
    let func = Promise.prototype[name]
    obj[name] = function () {
      if (!this[PROMISE]) this[MAKEPROMISE]()
      return func.apply(this[PROMISE], arguments)
    }
  }
  return stream
}
