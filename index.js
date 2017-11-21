'use strict'
module.exports = fun

const isaStream = require('isa-stream')

let FunPassThrough
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

function fun (stream, opts) {
  if (stream == null) {
    if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
    return new FunPassThrough(Object.assign({Promise: fun.Promise}, opts || {}))
  }

  if (typeof stream === 'string' || Buffer.isBuffer(stream)) {
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
    if (Symbol.iterator in stream && 'next' in stream) {
      if (!FunGenerator) FunGenerator = require('./fun-generator.js')
      return new FunGenerator(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    } else if (isaStream.Readable(stream)) {
      if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
      return FunPassThrough.mixin(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    } else if (isaStream.Writable(stream)) {
      if (!mixinPromiseStream) mixinPromiseStream = require('./promise-stream.js')
      const P = (opts && opts.Promise) || fun.Promise
      return mixinPromiseStream(P, stream)
    } else if ('then' in stream) { // promises of fun
      if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
      const resultStream = new FunPassThrough(Object.assign({Promise: fun.Promise}, opts || {}))
      stream.then(promised => {
        const srcStream = fun(promised)
        return FunPassThrough.isFun(srcStream) ? srcStream.pipe(resultStream) : resultStream.pipe(srcStream)
      }).catch(err => resultStream.emit('error', err))
      return resultStream
    } else if (opts == null) {
      if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
      return new FunPassThrough(Object.assign({Promise: fun.Promise}, stream))
    }
  }
  throw new Error(`funstream invalid arguments, expected: fun([stream | array], [opts]), got: fun(${[].map.call(arguments, arg => typeof arg).join(', ')})`)
}
