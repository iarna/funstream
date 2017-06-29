'use strict'
module.exports = fun

const FunPassThrough = require('./fun-passthrough.js')
const FunArray = require('./fun-array.js')
const FunGenerator = require('./fun-generator.js')
const mixinPromiseStream = require('./promise-stream.js')

fun.FunStream = FunPassThrough

try {
  fun.Promise = require('bluebird')
} catch (ex) {
  fun.Promise = Promise
}

function fun (stream, opts) {
  if (stream == null) {
    return new FunPassThrough(Object.assign({Promise: fun.Promise}, opts || {}))
  }
  if (Array.isArray(stream)) {
    return new FunArray(stream, Object.assign({Promise: fun.Promise}, opts || {}))
  }
  if (typeof stream === 'object') {
    if (Symbol.iterator in stream) {
      return new FunGenerator(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    }
    if ('pause' in stream) {
      return FunPassThrough.mixin(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    }
    if ('write' in stream) {
      const P = (opts && opts.Promise) || fun.Promise
      return mixinPromiseStream(P, stream)
    }
    if ('then' in stream) { // promises of fun
      const resultStream = new FunPassThrough(Object.assign({Promise: fun.Promise}, opts || {}))
      stream.then(promised => {
        const srcStream = fun(promised)
        return FunPassThrough.isFun(srcStream) ? srcStream.pipe(resultStream) : resultStream.pipe(srcStream)
      }).catch(err => resultStream.emit('error', err))
      return resultStream
    }
    if (opts == null) {
      return new FunPassThrough(Object.assign({Promise: fun.Promise}, stream))
    }
  }
  throw new Error(`funstream invalid arguments, expected: fun([stream | array], [opts]), got: fun(${[].map.call(arguments, arg => typeof arg).join(', ')})`)
}
