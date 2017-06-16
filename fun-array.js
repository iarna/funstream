'use strict'
const Readable = require('stream').Readable
const FunStream = require('./fun-stream.js')

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
}
FunStream.mixin(FunArray)
module.exports = FunArray
