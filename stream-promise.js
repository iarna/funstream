'use strict'
const fun = require('./index.js')
const FunStream = require('./fun-stream.js')
const PROMISE = require('./mixin-promise-stream.js').PROMISE
const STREAM = Symbol('stream')
const MAKEME = Symbol('makeme')
const PIPES = Symbol('pipes')
const UNPIPE = Symbol('unpipe')
const OPTS = FunStream.OPTS
const PassThrough = require('stream').PassThrough
const mixinPromiseStream = require('./mixin-promise-stream')
const is = require('./is.js')

// this is basically the opposite of the normal stream support, we START with a promise and
// only lazily construct a stream
class StreamPromise extends FunStream {
  constructor (promise, opts) {
    super()
    this[PROMISE] = promise
    const P = Object.getPrototypeOf(promise) === Promise.prototype ? Promise : opts.Promise
    mixinPromiseStream(this, {Promise: P})
    this.init(this, opts)
    this[PIPES] = new Map()
    this[UNPIPE] = []
  }

  [MAKEME] () {
    this[STREAM] = new PassThrough(Object.assign({objectMode: true}, this[OPTS]))
    this[PROMISE].then(promised => {
      const srcStream = fun(is.plainObject(promised) ? [promised] : promised)
      if (promised == null) srcStream.end()
      return StreamPromise.isFun(srcStream) ? srcStream.pipe(this) : this.pipe(srcStream)
    }).catch(err => this.emit('error', err))
  }

  fun$ended () {
    return this
  }

  // EventEmitter
  eventNames () {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].eventNames()
  }
  addListener (eventName, listener) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].addListener(eventName, listener)
    return this
  }
  on (eventName, listener) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].on(eventName, listener)
    return this
  }
  prependListener (eventName, listener) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].prependListener(eventName, listener)
    return this
  }
  removeListener (eventName, listener) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].removeListener(eventName, listener)
    return this
  }
  removeAllListeners (eventName, listener) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].removeAllListeners(eventName)
    return this
  }
  emit () {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].emit.apply(this[STREAM], arguments)
  }
  once (eventName, listener) {
    if (!this[STREAM]) this[MAKEME]()
    const input = this[STREAM]
    const handler = function () {
      if (input !== this) input.removeListener(eventName, handler)
      return listener.apply(this, arguments)
    }
    input.once(eventName, handler)
  }
  prependOnceListener (eventName, listener) {
    if (!this[STREAM]) this[MAKEME]()
    const input = this[STREAM]
    const handler = function () {
      if (input !== this) input.removeListener(eventName, handler)
      return listener.apply(this, arguments)
    }
    input.prependOnceListener(eventName, handler)
  }
  getMaxListeners () {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].getMaxListeners()
  }
  listenerCount (eventName) {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].listenerCount(eventName)
  }
  listeners (eventName) {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].listeners(eventName)
  }
  setMaxListeners (n) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].setMaxListeners(n)
    return this
  }
  // Readable
  isPaused () {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].isPaused()
  }
  pause () {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].pause()
    return this
  }
  pipe (dest, opts) {
    if (!this[STREAM]) this[MAKEME]()
    const forwardError = err => {
      if (err.src === undefined) err.src = this
      dest.emit('error', err)
    }
    this.on('error', forwardError)
    const wrapped = fun(this[STREAM].pipe(dest, opts), this[OPTS])
    this[UNPIPE].push([wrapped, dest])
    this[PIPES].set(dest, forwardError)
    return wrapped
  }
  read (size) {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].read(size)
  }
  resume () {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].resume()
    return this
  }
  setEncoding (enc) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].setEncoding(enc)
    return this
  }
  unpipe (dest) {
    if (!this[STREAM]) this[MAKEME]()
    const real = this[UNPIPE].filter(p => p[0] === dest)[0]
    if (real) dest = real[1]
    this[STREAM].unpipe(dest)
    const pipes = dest ? [dest] : this[PIPES].keys()
    pipes.forEach(pipe => {
      const real = this[UNPIPE].filter(p => p[0] === pipe)[0]
      const dest = real ? real[1] : pipe
      this[UNPIPE] = this[UNPIPE].filter(p => p[0] !== dest && p[1] !== dest)
      const listener = this[PIPES].get(dest)
      if (listener) this[STREAM].removeListener('error', listener)
      this[PIPES].delete(dest)
    })
  }
  unshift (chunk) {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].unshift(chunk)
  }
  // Readable & Writable
  destroy (error) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].destroy(error)
    this[STREAM].destroy(error)
    return this
  }
  // Writable
  cork () {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].cork()
  }
  end () {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].end.apply(this[STREAM], arguments)
  }
  setDefaultEncoding (encoding) {
    if (!this[STREAM]) this[MAKEME]()
    this[STREAM].setDefaultEncoding(encoding)
    return this
  }
  uncork () {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].uncork()
  }
  write () {
    if (!this[STREAM]) this[MAKEME]()
    return this[STREAM].write.apply(this[STREAM], arguments)
  }
}
// inherit the class methods too
Object.keys(FunStream).forEach(k => { StreamPromise[k] = FunStream[k] })

module.exports = StreamPromise
