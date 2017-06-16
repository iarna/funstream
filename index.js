'use strict'
const FunPassThrough = require('./fun-passthrough.js')
const FunArray = require('./fun-array.js')

module.exports = fun
module.exports.FunStream = FunPassThrough

try {
  module.exports.Promise = require('bluebird')
} catch (ex) {
  module.exports.Promise = Promise
}

function fun (stream, opts) {
  if (stream == null) {
    return new FunPassThrough(Object.assign({Promise: module.exports.Promise}, opts || {}))
  }
  if (Array.isArray(stream)) {
    return new FunArray(stream, Object.assign({Promise: module.exports.Promise}, opts || {}))
  }
  if (typeof stream === 'object') {
    if ('pause' in stream) {
      return FunPassThrough.mixin(stream, Object.assign({Promise: module.exports.Promise}, opts || {}))
    }
    if ('write' in stream) {
      return stream // write streams can't be fun
    }
    if ('then' in stream) { // promises of fun
      const resultStream = new FunPassThrough()
      stream.then(promised => {
        const srcStream = fun(promised)
        return FunPassThrough.isFun(srcStream) ? srcStream.pipe(resultStream) : resultStream.pipe(srcStream)
      }).catch(err => resultStream.emit('error', err))
      return resultStream
    }
    if (opts == null) {
      return new FunPassThrough(Object.assign({Promise: module.exports.Promise}, stream))
    }
  }
  throw new Error(`funstream invalid arguments, expected: fun([stream | array], [opts]), got: fun(${[].map.call(arguments, arg => typeof arg).join(', ')})`)
}
