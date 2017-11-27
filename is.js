'use strict'
const isaStream = require('isa-stream')

exports.scalar = isScalar
exports.iterator = isIterator
exports.thenable = isThenable
exports.plainObject = isPlainObject
exports.Readable = isaStream.Readable
exports.Writable = isaStream.Writable
exports.Duplex = isaStream.Duplex

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
