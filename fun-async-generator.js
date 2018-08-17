'use strict'
const Readable = require('stream').Readable
const FunStream = require('./fun-stream.js')

const ITER = Symbol('iter')

class FunAsyncGenerator extends Readable {
  constructor (iter, opts) {
    super({objectMode: true})
    FunAsyncGenerator.funInit.call(this, opts)
    this[ITER] = iter
  }
  _read () {
    this[ITER].next().then(current => {
      if (current.done) return this.push(null)
      if (!this.push(current.value)) return
      this._read()
    }).catch(err => {
      this.emit('error', err)
    })
  }
}
FunStream.mixin(FunAsyncGenerator)
module.exports = FunAsyncGenerator
