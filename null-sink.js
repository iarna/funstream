'use strict'
const EventEmitter = require('events')

class NullSink extends EventEmitter {
  write (d) {
    return true
  }
  end () {
    this.emit('prefinish')
    this.emit('finish')
  }
}

module.exports = NullSink
