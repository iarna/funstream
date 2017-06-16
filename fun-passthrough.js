'use strict'
const PassThrough = require('stream').PassThrough
const FunStream = require('./fun-stream.js')
class FunPassThrough extends PassThrough {
  constructor (opts) {
    super({objectMode: true})
    FunPassThrough.funInit.call(this, opts)
  }
}
FunStream.mixin(FunPassThrough)
module.exports = FunPassThrough
