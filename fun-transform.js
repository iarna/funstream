'use strict'
const Transform = require('stream').Transform
const FunStream = require('./fun-stream.js')
class FunTransform extends Transform {
  constructor (opts) {
    super({objectMode: true})
    FunTransform.funInit.call(this, opts)
  }
}
FunStream.mixin(FunTransform.prototype)

module.exports = FunTransform
