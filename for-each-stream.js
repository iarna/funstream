'use strict'
const Writable = require('stream').Writable
const MiniSyncSink = require('./mini-sync-sink')
const FunStream = require('./fun-stream.js')

module.exports = ForEachStream

function ForEachStream (consumeWith, opts) {
  if (FunStream.isAsync(consumeWith, 1, opts)) {
    return new ForEachStreamAsync({consumeWith: consumeWith})
  } else {
    return new MiniSyncSink({write: consumeWith})
  }
}

class ForEachStreamAsync extends Writable {
  constructor (opts) {
    super({objectMode: true})
    this.consumeWith = opts.consumeWith
  }
  _write (data, encoding, next) {
    const result = this.consumeWith(data, next)
    if (result && result.then) return result.then(keep => next(null, keep), next)
  }
}
