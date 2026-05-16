'use strict'
const test = require('tap').test
const fun = require('..')
const MapStream = require('../map-stream.js')

test('sync map: double each value', t => {
  return fun([1, 2, 3]).map(v => v * 2)
    .list()
    .then(result => {
      t.isDeeply(result, [2, 4, 6], 'doubled')
    })
})

test('sync map: chained maps', t => {
  return fun([1, 2])
    .map(v => v * 2)
    .map(v => v + 1)
    .list()
    .then(result => {
      t.isDeeply(result, [3, 5], 'chained: (1*2)+1, (2*2)+1')
    })
})

test('sync map: throw in map function', t => {
  return fun([1])
    .map(v => { throw new Error('boom') })
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'sync map throw propagates')
    })
})

test('async map (callback): transform value', t => {
  return fun([1, 2])
    .map((v, cb) => cb(null, v * 10))
    .list()
    .then(result => {
      t.isDeeply(result, [10, 20], 'callback map')
    })
})

test('async map (callback): error in callback', t => {
  return fun([1])
    .map((v, cb) => cb(new Error('boom')))
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'callback error propagates')
    })
})

test('async map (callback): chained', t => {
  return fun([1])
    .map((v, cb) => cb(null, v * 2))
    .map((v, cb) => cb(null, v + 1))
    .list()
    .then(result => {
      t.isDeeply(result, [3], 'chained callback maps: (1*2)+1')
    })
})

test('async map (promise): resolve', t => {
  return fun([1, 2])
    .map(v => Promise.resolve(v * 10), {async: true})
    .list()
    .then(result => {
      t.isDeeply(result, [10, 20], 'promise map')
    })
})

test('async map (promise): reject', t => {
  return fun([1])
    .map(v => Promise.reject(new Error('boom')), {async: true})
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'promise rejection propagates')
    })
})

test('async map (promise): chained then error', t => {
  return fun([1, 2])
    .map(v => Promise.resolve(v * 2), {async: true})
    .map(v => Promise.reject(new Error('boom')), {async: true})
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'boom', 'second map promise error')
    })
})

test('mixed map chain: sync then async', t => {
  return fun([1])
    .map(v => v * 2)
    .map((v, cb) => cb(null, v + 1))
    .list()
    .then(result => {
      t.isDeeply(result, [3], 'sync then async map')
    })
})

test('mixed map chain: async then sync', t => {
  return fun([1])
    .map((v, cb) => cb(null, v * 2))
    .map(v => v + 1)
    .list()
    .then(result => {
      t.isDeeply(result, [3], 'async then sync map')
    })
})

test('map with opts', t => {
  return fun([1, 2])
    .map(v => v * 10, {async: false})
    .list()
    .then(result => {
      t.isDeeply(result, [10, 20], 'map with opts')
    })
})

test('MapStream factory: sync', t => {
  const ms = MapStream(v => v, {async: false})
  t.ok(ms, 'created')
  t.pass('sync MapStream created')
  t.end()
})

test('MapStream factory: async', t => {
  const ms = MapStream(v => v, {async: true})
  t.ok(ms, 'created')
  t.pass('async MapStream created')
  t.end()
})

test('MapStream factory: auto-detect', t => {
  const ms = MapStream(v => v)
  t.ok(ms, 'auto-created')
  t.pass('MapStream auto-detect works')
  t.end()
})

test('MapStream.MAPS export', t => {
  t.ok(MapStream.MAPS, 'MAPS symbol exported')
  t.is(typeof MapStream.MAPS, 'symbol', 'MAPS is a symbol')
  t.end()
})

// MapStream.Async and MapStream.Sync
test('MapStream.Async and MapStream.Sync classes', t => {
  const ms = require('../map-stream.js')
  t.ok(ms.Async, 'MapStream.Async exists')
  t.ok(ms.Sync, 'MapStream.Sync exists')
  t.end()
})

test('async map (callback): throw synchronously', t => {
  return fun([1])
    .map((v, cb) => { throw new Error('sync-throw') })
    .list()
    .then(() => t.fail('should have errored'))
    .catch(err => {
      t.is(err.message, 'sync-throw', 'sync throw in async map propagates')
    })
})

test('async MapStream: sync map delegates to super', t => {
  const MapStream = require('../map-stream.js')
  const ms = MapStream(v => v, {async: true})
  const result = ms.map(v => v * 2, {async: false})
  t.not(result, ms, 'sync map on async stream returns new stream')
  t.end()
})

test('map via fun(): basic', t => {
  return fun([1, 2, 3]).map(v => v * 10)
    .list()
    .then(result => {
      t.isDeeply(result, [10, 20, 30], 'fun().map() works')
    })
})
