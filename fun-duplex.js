'use strict'
const fun = require('./index.js')
const FunStream = require('./fun-stream.js')
const mixinPromiseStream = require('./promise-stream.js')
const INPUT = Symbol('input')
const OUTPUT = Symbol('output')

class Duplex {
  constructor (input, output, opts) {
    this[INPUT] = input
    this[OUTPUT] = output
    Duplex.funInit.call(this, opts)
  }
  // EventEmitter
  eventNames () {
    return this[INPUT].eventNames().concat(this[OUTPUT].eventNames())
  }
  addListener (eventName, listener) {
    this[INPUT].addListener(eventName, listener)
    this[OUTPUT].addListener(eventName, listener)
    return this
  }
  on (eventName, listener) {
    this[INPUT].on(eventName, listener)
    this[OUTPUT].on(eventName, listener)
    return this
  }
  prependListener (eventName, listener) {
    this[INPUT].prependListener(eventName, listener)
    this[OUTPUT].prependListener(eventName, listener)
    return this
  }
  removeListener (eventName, listener) {
    this[INPUT].removeListener(eventName, listener)
    this[OUTPUT].removeListener(eventName, listener)
    return this
  }
  removeAllListeners (eventName, listener) {
    this[INPUT].removeAllListeners(eventName)
    this[OUTPUT].removeAllListeners(eventName)
    return this
  }
  emit () {
    return this[INPUT].emit.apply(this[INPUT], arguments)
        || this[OUTPUT].emit.apply(this[OUTPUT], arguments)
  }
  once (eventName, listener) {
    const input = this[INPUT]
    const output = this[OUTPUT]
    const handler = function () {
      if (input !== this) input.removeListener(eventName, handler)
      if (output !== this) output.removeListener(eventName, handler)
      return listener.apply(this, arguments)
    }
    input.once(eventName, handler)
    output.once(eventName, handler)
  }
  prependOnceListener (eventName, listener) {
    const input = this[INPUT]
    const output = this[OUTPUT]
    const handler = function () {
      if (input !== this) input.removeListener(eventName, handler)
      if (output !== this) output.removeListener(eventName, handler)
      return listener.apply(this, arguments)
    }
    input.prependOnceListener(eventName, handler)
    output.prependOnceListener(eventName, handler)
  }
  getMaxListeners () {
    return Math.min(this[INPUT].getMaxListeners(), this[OUTPUT].getMaxListeners())
  }
  listenerCount (eventName) {
    return this[INPUT].listenerCount(eventName) + this[OUTPUT].listenerCount(eventName)
  }
  listeners (eventName) {
    return this[INPUT].listeners(eventName).concat(this[OUTPUT].listeners(eventName))
  }
  setMaxListeners (n) {
    this[INPUT].setMaxListeners(n)
    this[OUTPUT].setMaxListeners(n)
    return this
  }
  // Readable
  isPaused () {
    return this[OUTPUT].isPaused()
  }
  pause () {
    this[OUTPUT].pause()
    return this
  }
  pipe (dest, opts) {
    return this[OUTPUT].pipe(dest, opts)
  }
  read (size) {
    return this[OUTPUT].read(size)
  }
  resume () {
    this[OUTPUT].resume()
    return this
  }
  setEncoding (enc) {
    this[OUTPUT].setEncoding(enc)
    return this
  }
  unpipe (dest) {
    return this[OUTPUT].unpipe(dest)
  }
  unshift (chunk) {
    return this[OUTPUT].unshift(chunk)
  }
  // Readable & Writable
  destroy (error) {
    this[INPUT].destroy(error)
    this[OUTPUT].destroy(error)
    return this
  }
  // Writable
  cork () {
    return this[INPUT].cork()
  }
  end () {
    return this[INPUT].end.apply(this[INPUT], arguments)
  }
  setDefaultEncoding (encoding) {
    this[INPUT].setDefaultEncoding(encoding)
    return this
  }
  uncork () {
    return this[INPUT].uncork()
  }
  write () {
    return this[INPUT].write.apply(this[INPUT], arguments)
  }
}
FunStream.mixin(Duplex)

module.exports = Duplex
