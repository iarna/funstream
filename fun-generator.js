'use strict'
const Readable = require('stream').Readable
const FunStream = require('./fun-stream.js')

const ITER = Symbol('iter')

class FunGenerator extends Readable {
  constructor (iter, opts) {
    super({objectMode: true})
    FunGenerator.funInit.call(this, opts)
    this[ITER] = iter
  }
  _read () {
    while (true) {
      try {
        let current = this[ITER].next()
        if (current.done) return this.push(null)
        if (!this.push(current.value)) return
      } catch (err) {
        this.emit('error', err)
        return
      }
    }
  }
}
FunStream.mixin(FunGenerator)
module.exports = FunGenerator
