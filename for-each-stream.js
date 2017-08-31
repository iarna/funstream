'use strict'
const Writable = require('stream').Writable
let MiniSyncSink
let FunStream

module.exports = ForEachStream

function ForEachStream (consumeWith, opts) {
  if (!FunStream) FunStream = require('./fun-stream.js')
  if (FunStream.isAsync(consumeWith, 1, opts)) {
    return new ForEachStreamAsync({consumeWith: consumeWith})
  } else {
    if (!MiniSyncSink) MiniSyncSink = require('./mini-sync-sink.js')
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
