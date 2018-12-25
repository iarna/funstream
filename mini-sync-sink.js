'use strict'
const EventEmitter = require('events').EventEmitter
const mixinPromiseStream = require('./mixin-promise-stream.js')

class MiniSyncSink extends EventEmitter {
  constructor (opts) {
    super(opts)
    mixinPromiseStream(this, opts)
    if (opts.write) this._write = opts.write
  }
  write (data, encoding, next) {
    try {
      this._write(data, encoding)
      /* istanbul ignore next */
      if (next) next()
      return true
    } catch (err) {
      this.emit('error', err)
      return false
    }
  }
  end () {
    this.emit('prefinish')
    this.emit('finish')
  }
}

module.exports = MiniSyncSink
