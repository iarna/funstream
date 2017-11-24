'use strict'
module.exports = mixinPromise
const PROMISE = Symbol('promise')
const MAKEPROMISE = Symbol('makePromise')

mixinPromise.PROMISE = PROMISE

function mixinPromise (Promise, stream) {
  const cls = typeof stream === 'function' ? stream : null
  const obj = cls ? cls.prototype : stream

  if (MAKEPROMISE in obj) return

  if (!(PROMISE in obj)) {
    obj[PROMISE] = null
    let error
    const onError = err => { error = err }
    obj.once('error', onError)
    if ('write' in stream) {
      let finished = false
      let result
      const onEarlyResult = value => { result = value }
      obj.once('result', onEarlyResult)
      const onEarlyFinish = () => setImmediate(() => { finished = true })
      obj.once('finish', onEarlyFinish)
      obj[MAKEPROMISE] = function () {
        if (error) {
          this.removeListener('result', onEarlyResult)
          this.removeListener('finish', onEarlyFinish)
          this[PROMISE] = Promise.reject(error)
        } else if (result || finished) {
          this.removeListener('error', onError)
          this[PROMISE] = Promise.resolve(result)
        } else {
          this[PROMISE] = new Promise((resolve, reject) => {
            this.removeListener('error', onError)
            this.removeListener('result', onEarlyResult)
            this.removeListener('finish', onEarlyFinish)
            this.once('result', resolve)
            // make sure finish will always lose any race w/ result
            this.once('finish', () => setImmediate(resolve))
            this.once('error', reject)
          })
        }
      }
    } else {
      let ended = false
      const onEarlyEnd = () => { ended = true }
      obj.once('end', onEarlyEnd)
      obj[MAKEPROMISE] = function () {
        if (error) {
          this.removeListener('end', onEarlyEnd)
          this[PROMISE] = Promise.reject(error)
        } else if (ended) {
          this.removeListener('error', onError)
          this[PROMISE] = Promise.resolve()
        } else {
          this.removeListener('end', onEarlyEnd)
          this.removeListener('error', onError)
          this[PROMISE] = new Promise((resolve, reject) => {
            this.once('end', resolve)
            this.once('error', reject)
          })
        }
      }
    }
  }

  // the core interface
  for (let name of ['then', 'catch']) {
    let func = obj[PROMISE] ? obj[PROMISE][name] : Promise.prototype[name]
    obj[name] = makeProxy(func)
  }
  // and everything else, iterating prototype doesn't
  // work on builtin promises, thus the hard coded list above.
  const methods = obj[PROMISE]
                ? Object.keys(obj[PROMISE].__proto__).concat(Object.keys(obj[PROMISE]))
                : Object.keys(Promise.prototype)
  methods.forEach(name => {
    if (name[0] === '_') return
    if (name in obj) return
    let func = Promise.prototype[name]
    if (typeof func !== 'function') return
    obj[name] = makeProxy(func)
  })
  return stream
}

function makeProxy (func) {
  return function () {
    if (!this[PROMISE]) this[MAKEPROMISE]()
    return func.apply(this[PROMISE], arguments)
  }
}
