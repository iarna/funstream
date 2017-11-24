'use strict'
module.exports = fun

const isaStream = require('isa-stream')

let FunPassThrough
let FunStream
let FunArray
let FunDuplex
let FunGenerator
let mixinPromiseStream

Object.defineProperty(fun, 'FunStream', {
  enumerable: true,
  configurable: true,
  get () {
    if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
    delete fun.FunStream
    fun.FunStream = FunPassThrough
    return FunPassThrough
  }
})

try {
  fun.Promise = require('bluebird')
} catch (ex) {
  fun.Promise = Promise
}

function isScalar (value) {
  if (value == null) return true
  if (Buffer.isBuffer(value)) return true
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'symbol':
      return true
    default:
      return false
  }
}

function isIterator (value) {
  return Symbol.iterator in value && 'next' in value
}

function isThenable (value) {
  return 'then' in value
}

function isPlainObject (value) {
  if (value == null) return false
  if (typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  if (Buffer.isBuffer(value)) return false
  if (isIterator(value)) return false
  if (isaStream.Readable(value)) return false
  if (isaStream.Writable(value)) return false
  if (isThenable(value)) return false
  return true
}

function fun (stream, opts) {
  if (stream == null) {
    if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
    return new FunPassThrough(Object.assign({Promise: fun.Promise}, opts || {}))
  }

  if (isScalar(stream)) {
    stream = [stream]
  }
  if (Array.isArray(stream)) {
    if (!FunArray) FunArray = require('./fun-array.js')
    return new FunArray(stream, Object.assign({Promise: fun.Promise}, opts || {}))
  }
  if (typeof stream === 'function') {
    if (!FunDuplex) FunDuplex = require('./fun-duplex.js')
    const input = fun(null, opts)
    const output = stream(input)
    return new FunDuplex(input, output, opts)
  }
  if (typeof stream === 'object') {
    if (isIterator(stream)) {
      if (!FunGenerator) FunGenerator = require('./fun-generator.js')
      return new FunGenerator(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    } else if (isaStream.Readable(stream)) {
      if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
      if (!FunStream) FunStream = require('./fun-stream.js')
      if (FunPassThrough.isFun(stream) && opts) {
        const funopts = Object.assign({Promise: fun.Promise}, opts)
        const curopts = stream[FunStream.OPTS]
        let diff = false
        for (let k of Object.keys(funopts).concat(Object.keys(curopts))) {
          if (funopts[k] !== curopts[k]) {
            diff = true
            break
          }
        }
        if (diff) return stream.pipe(new FunPassThrough(funopts))
      }
      return FunPassThrough.mixin(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    } else if ('then' in stream) { // promises of fun
      if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
      const resultStream = new FunPassThrough(Object.assign({Promise: fun.Promise}, opts || {}))
      stream.then(promised => {
        const srcStream = fun(promised)
        resultStream.emit('result', promised)
        return FunPassThrough.isFun(srcStream) ? srcStream.pipe(resultStream) : resultStream.pipe(srcStream)
      }).catch(err => resultStream.emit('error', err))
      return resultStream
    // note that promise-streamed writables are treated as promises, not as writables
    } else if (isaStream.Writable(stream)) {
      if (!mixinPromiseStream) mixinPromiseStream = require('./mixin-promise-stream.js')
      const P = (opts && opts.Promise) || fun.Promise
      return mixinPromiseStream(P, stream)
    } else if (opts == null) {
      if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
      return new FunPassThrough(Object.assign({Promise: fun.Promise}, stream))
    }
  }
  throw new Error(`funstream invalid arguments, expected: fun([stream | array], [opts]), got: fun(${[].map.call(arguments, arg => typeof arg).join(', ')})`)
}
