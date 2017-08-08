'use strict'
const Readable = require('stream').Readable
const FunStream = require('./fun-stream.js')
const OPTS = require('./fun-stream.js').OPTS
const DATA = Symbol('data')
const INDEX = Symbol('index')

class FunArray extends Readable {
  constructor (data, opts) {
    super({objectMode: true})
    FunArray.funInit.call(this, opts)
    this[DATA] = data
    this[INDEX] = 0
  }
  _read () {
    while (this[INDEX] < this[DATA].length) {
      if (!this.push(this[DATA][this[INDEX]++])) {
        return
      }
    }
    this.push(null)
  }
  forEach (forEachWith, forEachOpts) {
    const opts = Object.assign({}, this[OPTS], forEachOpts || {})
    if (FunStream.isAsync(forEachWith, 1, opts)) {
      return super.forEach(forEachWith, forEachOpts)
    } else {
      return opts.Promise(resolve => {
        process.nextTick(() => {
          this[DATA].forEach(v => forEachWith(v))
          resolve()
        })
      })
    }
  }
}
FunStream.mixin(FunArray)
module.exports = FunArray
