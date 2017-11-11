'use strict'
const Writable = require('stream').Writable
const MiniSyncSink = require('./mini-sync-sink')
let FunStream

module.exports = ReduceStream

function ReduceStream (reduceWith, initial, opts) {
  FunStream = require('./fun-stream.js')
  if (FunStream.isAsync(reduceWith, 2, opts)) {
    return new ReduceStreamAsync(reduceWith, initial)
  } else {
    return new ReduceStreamSync(reduceWith, initial)
  }
}

class ReduceStreamAsync extends Writable {
  constructor (reduceWith, initial) {
    super({objectMode: true})
    this.reduceWith = reduceWith
    this.acc = initial
  }
  _write (data, encoding, next) {
    if (this.acc == null) {
      this.acc = data
      next()
    } else {
      const handleResult = (err, value) => {
        this.acc = value
        next(err)
      }
      const result = this.reduceWith(this.acc, data, handleResult)
      if (result && result.then) return result.then(keep => handleResult(null, keep), handleResult)
    }
  }
  end () {
    this.emit('result', this.acc)
    super.end()
  }
}

class ReduceStreamSync extends MiniSyncSink {
  constructor (reduceWith, initial) {
    super()
    this.reduceWith = reduceWith
    this.acc = initial
  }
  write (data, encoding, next) {
    if (this.acc == null) {
      this.acc = data
    } else {
      try {
        this.acc = this.reduceWith(this.acc, data)
      } catch (ex) {
        this.emit(ex)
        return false
      }
    }
    if (next) next()
    return true
  }
  end () {
    this.emit('result', this.acc)
    super.end()
  }
}
