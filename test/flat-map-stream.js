'use strict'
const test = require('tap').test
const fun = require('..')
const FlatMapStream = require('../flat-map-stream.js')

// Sync flatMap tests
test('sync flatMap: array results', t => {
  return fun([1, 2, 3]).flatMap(v => [v, v * 10])
    .list()
    .then(result => {
      t.isDeeply(result, [1, 10, 2, 20, 3, 30], 'array flattened')
    })
})

test('sync flatMap: single value result', t => {
  return fun([1, 2]).flatMap(v => v)
    .list()
    .then(result => {
      t.isDeeply(result, [1, 2], 'single value passed through')
    })
})

test('sync flatMap: empty array result', t => {
  return fun([1, 2, 3]).flatMap(v => v % 2 === 0 ? [] : [v])
    .list()
    .then(result => {
      t.isDeeply(result, [1, 3], 'empty arrays excluded')
    })
})

test('sync flatMap: iterable result (Set)', t => {
  return fun([1, 2]).flatMap(v => new Set([v, v * 10]))
    .list()
    .then(result => {
      t.isDeeply(result, [1, 10, 2, 20], 'Set iterable flattened')
    })
})

test('sync flatMap: throw in map function', t => {
  return fun([1])
    .flatMap(v => { throw new Error('boom') })
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'sync throw propagates')
    })
})

// Async flatMap - callback mode
test('async flatMap (callback): array results', t => {
  return fun([1, 2])
    .flatMap((v, cb) => cb(null, [v, v * 10]))
    .list()
    .then(result => {
      t.isDeeply(result, [1, 10, 2, 20], 'callback array flattened')
    })
})

test('async flatMap (callback): single value', t => {
  return fun([1, 2])
    .flatMap((v, cb) => cb(null, v))
    .list()
    .then(result => {
      t.isDeeply(result, [1, 2], 'callback single value')
    })
})

test('async flatMap (callback): empty array', t => {
  return fun([1, 2])
    .flatMap((v, cb) => cb(null, []))
    .list()
    .then(result => {
      t.isDeeply(result, [], 'callback empty array')
    })
})

test('async flatMap (callback): error', t => {
  return fun([1])
    .flatMap((v, cb) => cb(new Error('boom')))
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'callback error propagates')
    })
})

// Async flatMap - promise mode
test('async flatMap (promise): array results', t => {
  return fun([1, 2])
    .flatMap(v => Promise.resolve([v, v * 10]), {async: true})
    .list()
    .then(result => {
      t.isDeeply(result, [1, 10, 2, 20], 'promise array flattened')
    })
})

test('async flatMap (promise): single value', t => {
  return fun([1, 2])
    .flatMap(v => Promise.resolve(v), {async: true})
    .list()
    .then(result => {
      t.isDeeply(result, [1, 2], 'promise single value')
    })
})

test('async flatMap (promise): reject', t => {
  return fun([1])
    .flatMap(v => Promise.reject(new Error('boom')), {async: true})
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'promise rejection propagates')
    })
})

// Throw in async flatMap (caught by catch block)
test('async flatMap (callback): throw in map', t => {
  return fun([1])
    .flatMap((v, cb) => { throw new Error('boom') })
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'throw in async flatMap caught')
    })
})

// flat() method
test('flat: array of arrays', t => {
  return fun([[1, 2], [3, 4], [5, 6]]).flat()
    .list()
    .then(result => {
      t.isDeeply(result, [1, 2, 3, 4, 5, 6], 'flat flattens one level')
    })
})

// FlatMapStream factory
test('FlatMapStream factory: sync', t => {
  const fs = FlatMapStream(v => v, {async: false})
  t.ok(fs, 'created')
  t.pass('sync FlatMapStream created')
  t.end()
})

test('FlatMapStream factory: async', t => {
  const fs = FlatMapStream(v => v, {async: true})
  t.ok(fs, 'created')
  t.pass('async FlatMapStream created')
  t.end()
})

test('FlatMapStream factory: iterable with strings', t => {
  return fun(['ab', 'cd'])
    .flatMap(v => v) // strings are iterable
    .list()
    .then(result => {
      t.isDeeply(result, ['ab', 'cd'], 'strings as single values (not iterated)')
    })
})

// Async flatMap iterable result (non-array)
test('async flatMap (callback): iterable result (Set)', t => {
  return fun([1, 2])
    .flatMap((v, cb) => cb(null, new Set([v, v * 10])))
    .list()
    .then(result => {
      t.isDeeply(result, [1, 10, 2, 20], 'async iterable flattened')
    })
})

// flatMap with opts
test('flatMap with opts', t => {
  return fun([1, 2])
    .flatMap(v => [v, v * 10], {async: false})
    .list()
    .then(result => {
      t.isDeeply(result, [1, 10, 2, 20], 'flatMap with opts')
    })
})

// End-to-end
test('flatMap via fun(): basic', t => {
  return fun([1, 2, 3]).flatMap(v => [v, v * 10])
    .list()
    .then(result => {
      t.isDeeply(result, [1, 10, 2, 20, 3, 30], 'fun().flatMap() works')
    })
})
