'use strict'
const EventEmitter = require('events').EventEmitter

class MiniAsyncSink extends EventEmitter {
  constructor (opts) {
    super(opts)
    if (!opts) opts = {}
    if (opts.write) this._write = opts.write
  }
  write (data, encoding, next) {
    try {
      this._write(data, err => {
        if (err) return this.emit('error', err)
        this.emit('drain')
        if (next) next()
      })
    } catch (err) {
      this.emit('error', err)
    }
    return false
  }
  end () {
    this.emit('prefinish')
    this.emit('finish')
  }
}

module.exports = MiniAsyncSink
