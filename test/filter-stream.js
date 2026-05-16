'use strict'
const test = require('tap').test
const fun = require('..')
const FilterStream = require('../filter-stream.js')

test('sync filter: keep values > 1', t => {
  return fun([1, 2, 3, 4]).filter(v => v > 1)
    .list()
    .then(result => {
      t.isDeeply(result, [2, 3, 4], 'filtered correctly')
    })
})

test('sync filter: all pass', t => {
  return fun([1, 2]).filter(v => true)
    .list()
    .then(result => {
      t.isDeeply(result, [1, 2], 'all passed')
    })
})

test('sync filter: none pass', t => {
  return fun([1, 2]).filter(v => false)
    .list()
    .then(result => {
      t.isDeeply(result, [], 'none passed')
    })
})

test('sync filter: throw in filter function', t => {
  return fun([1, 2])
    .filter(v => { throw new Error('boom') })
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'throw error propagates')
    })
})

test('sync filter: chained filters', t => {
  return fun([1, 2, 3, 4, 5, 6])
    .filter(v => v % 2 === 0)
    .filter(v => v > 2)
    .list()
    .then(result => {
      t.isDeeply(result, [4, 6], 'chained sync filters')
    })
})

test('async filter (callback): keep some', t => {
  return fun([1, 2, 3])
    .filter((v, cb) => cb(null, v > 1))
    .list()
    .then(result => {
      t.isDeeply(result, [2, 3], 'async callback filter')
    })
})

test('async filter (callback): error in callback', t => {
  return fun([1])
    .filter((v, cb) => cb(new Error('boom')))
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'callback error propagates')
    })
})

test('async filter (callback): all pass then all fail', t => {
  return fun([1, 2, 3])
    .filter((v, cb) => cb(null, true))
    .filter((v, cb) => cb(null, false))
    .list()
    .then(result => {
      t.isDeeply(result, [], 'second filter excludes all')
    })
})

test('async filter (promise): keep some', t => {
  return fun([1, 2, 3])
    .filter(v => Promise.resolve(v > 1), {async: true})
    .list()
    .then(result => {
      t.isDeeply(result, [2, 3], 'async promise filter')
    })
})

test('async filter (promise): reject in promise', t => {
  return fun([1])
    .filter(v => Promise.reject(new Error('boom')), {async: true})
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'promise rejection propagates')
    })
})

test('async filter (promise): all pass then error', t => {
  return fun([1, 2])
    .filter(v => Promise.resolve(true), {async: true})
    .filter(v => Promise.reject(new Error('boom')), {async: true})
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'second filter promise error propagates')
    })
})

test('mixed filter chain: sync then async', t => {
  return fun([1, 2, 3, 4])
    .filter(v => v > 2)
    .filter((v, cb) => cb(null, v < 4))
    .list()
    .then(result => {
      t.isDeeply(result, [3], 'sync then async chain')
    })
})

test('mixed filter chain: async then sync', t => {
  return fun([1, 2, 3, 4])
    .filter((v, cb) => cb(null, v > 1))
    .filter(v => v < 4)
    .list()
    .then(result => {
      t.isDeeply(result, [2, 3], 'async then sync chain')
    })
})

test('filter with opts', t => {
  return fun([1, 2])
    .filter(v => v === 1, {async: false})
    .list()
    .then(result => {
      t.isDeeply(result, [1], 'filter with opts')
    })
})

test('FilterStream factory: sync', t => {
  const fs = FilterStream(v => v, {async: false})
  t.ok(fs, 'created')
  t.pass('sync FilterStream created')
  t.end()
})

test('FilterStream factory: async', t => {
  const fs = FilterStream(v => v, {async: true})
  t.ok(fs, 'created')
  t.pass('async FilterStream created')
  t.end()
})

test('filter: via fun().filter', t => {
  return fun([1, 2, 3, 4, 5]).filter(v => v % 2 === 0)
    .list()
    .then(result => {
      t.isDeeply(result, [2, 4], 'even numbers')
    })
})

test('async filter (callback): throw synchronously in filter', t => {
  return fun([1])
    .filter((v, cb) => { throw new Error('sync-throw') })
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'sync-throw', 'sync throw in async filter propagates')
    })
})

test('async FilterStream: sync filter delegates to super', t => {
  const FilterStream = require('../filter-stream.js')
  const fs = FilterStream(v => v, {async: true})
  const result = fs.filter(v => v > 1, {async: false})
  t.not(result, fs, 'sync filter on async stream returns new stream')
  t.end()
})
