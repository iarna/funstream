'use strict'
module.exports = fun

const is = require('./is.js')

let FunPassThrough
let FunArray
let FunDuplex
let FunGenerator
let FunAsyncGenerator
let StreamPromise
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
} catch (_) {
  fun.Promise = Promise
}

function fun (stream, opts) {
  if (stream == null) {
    if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
    return new FunPassThrough(Object.assign({Promise: fun.Promise}, opts || {}))
  }

  if (is.scalar(stream)) {
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
    if (is.Readable(stream)) {
      if (!FunPassThrough) FunPassThrough = require('./fun-passthrough.js')
      return FunPassThrough.mixin(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    } else if (is.asyncIterator(stream)) {
      if (!FunAsyncGenerator) FunAsyncGenerator = require('./fun-async-generator.js')
      return new FunAsyncGenerator(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    } if (is.iterator(stream)) {
      if (!FunGenerator) FunGenerator = require('./fun-generator.js')
      return new FunGenerator(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    } else if (is.thenable(stream)) { // promises of fun
      if (!StreamPromise) StreamPromise = require('./stream-promise.js')
      return new StreamPromise(stream, Object.assign({Promise: fun.Promise}, opts || {}))
    // note that promise-streamed writables are treated as promises, not as writables
    } else if (is.Writable(stream)) {
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
fun.with = (todo, opts) => {
  const st = fun(opts)
  const todoPromise = todo(st)
  if (!todoPromise.then) throw new Error('Callback supplied to fun.with did not return a thenable (Promise) as expected.')
  todoPromise.then(() => st.end(), err => st.emit('error', err))
  return st
}
