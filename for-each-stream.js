'use strict'
const Writable = require('stream').Writable
const mixinPromiseStream = require('./promise-stream.js')
let MiniSyncSink
let FunStream

module.exports = ForEachStream

function ForEachStream (consumeWith, opts) {
  if (!FunStream) FunStream = require('./fun-stream.js')
  if (FunStream.isAsync(consumeWith, 1, opts)) {
    return new ForEachStreamAsync(Object.assign({consumeWith: consumeWith}, opts))
  } else {
    if (!MiniSyncSink) MiniSyncSink = require('./mini-sync-sink.js')
    return new MiniSyncSink(Object.assign({write: consumeWith}, opts))
  }
}

class ForEachStreamAsync extends Writable {
  constructor (opts) {
    super({objectMode: true})
    mixinPromiseStream(opts.Promise, this)
    this.consumeWith = opts.consumeWith
  }
  _write (data, encoding, next) {
    const result = this.consumeWith(data, next)
    if (result && result.then) return result.then(keep => next(null, keep), next)
  }
}
