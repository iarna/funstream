'use strict'
const test = require('tap').test
const fun = require('..')
const Readable = require('stream').Readable

function createSyncSource (values) {
  const src = new Readable({objectMode: true})
  src._read = function () { values.forEach(v => this.push(v)); this.push(null) }
  return src
}

test('MutateStream factory: sync', t => {
  const ms = require('../mutate-stream.js')
  const m = ms(v => v, {async: false})
  t.ok(m, 'created')
  t.is(m.constructor.name, 'MutateStreamSync', 'sync variant')
  t.end()
})

test('MutateStream factory: async', t => {
  const ms = require('../mutate-stream.js')
  const m = ms(v => v, {async: true})
  t.ok(m, 'created')
  t.is(m.constructor.name, 'MutateStreamAsync', 'async variant')
  t.end()
})

test('MutateStream factory: auto-detect sync', t => {
  const ms = require('../mutate-stream.js')
  const fn = (data, cb) => cb(null, data)
  const m = ms(fn)
  t.ok(m, 'created')
  t.end()
})

test('sync mutate: modifies object in place', t => {
  const ms = require('../mutate-stream.js')
  const src = createSyncSource([{a: 1}, {a: 2}, {a: 3}])
  const mutator = ms(v => { v.a *= 10 }, {async: false})
  const results = []
  src.pipe(mutator)
    .on('data', d => results.push(d))
    .on('end', () => {
      t.isDeeply(results, [{a: 10}, {a: 20}, {a: 30}], 'objects modified in place')
      t.end()
    })
})

test('sync mutate: chained mutations', t => {
  const ms = require('../mutate-stream.js')
  const src = createSyncSource([{v: 1}])
  const m1 = ms(data => { data.v *= 2 }, {async: false})
  const m2 = ms(data => { data.v += 1 }, {async: false})
  const results = []
  src.pipe(m1).pipe(m2)
    .on('data', d => results.push(d))
    .on('end', () => {
      t.is(results[0].v, 3, 'chain: (1*2)+1')
      t.end()
    })
})

test('sync mutate: error thrown in mutation', t => {
  t.plan(1)
  fun([1]).mutate(() => { throw new Error('boom') })
    .on('error', err => {
      t.is(err.message, 'boom', 'sync mutation error propagates')
    })
})

test('sync mutate: no return value (void mutation)', t => {
  const results = []
  return fun([{x: 1}, {x: 2}])
    .mutate(d => { d.y = d.x * 10 })
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].y, 10, 'first modified')
      t.is(results[1].y, 20, 'second modified')
      t.is(results[0].x, 1, 'original x preserved')
    })
})

test('async mutate (callback): modifies in place', t => {
  const results = []
  return fun([{x: 1}, {x: 2}])
    .mutate((data, cb) => { data.x *= 10; cb() })
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].x, 10, 'callback mutation applied')
      t.is(results[1].x, 20, 'callback mutation applied')
    })
})

test('async mutate (callback): multiple chained', t => {
  const results = []
  return fun([{v: 1}])
    .mutate((data, cb) => { data.v *= 2; cb() })
    .mutate((data, cb) => { data.v += 1; cb() })
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].v, 3, 'chain: (1*2)+1')
    })
})

test('async mutate (callback): error in callback', t => {
  t.plan(1)
  fun([1]).mutate((data, cb) => cb(new Error('boom')))
    .on('error', err => {
      t.is(err.message, 'boom', 'callback error propagates')
    })
})

test('async mutate (promise): promise resolves after mutation', t => {
  const results = []
  return fun([{x: 1}])
    .mutate((data, cb) => setImmediate(() => { data.x *= 10; cb() }))
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].x, 10, 'promise mutation applied')
    })
})

test('async mutate (promise): promise rejection', t => {
  t.plan(1)
  fun([1]).mutate((data, cb) => setImmediate(() => cb(new Error('boom'))))
    .on('error', err => {
      t.is(err.message, 'boom', 'promise rejection propagates')
    })
})

test('mixed mutate chain: sync then async', t => {
  const results = []
  return fun([{v: 1}])
    .mutate(d => { d.v *= 2 })
    .mutate((d, cb) => { d.v += 1; cb() })
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].v, 3, 'sync then async chain')
    })
})

test('mixed mutate chain: async then sync', t => {
  const results = []
  return fun([{v: 1}])
    .mutate((d, cb) => { d.v *= 2; cb() })
    .mutate(d => { d.v += 1 })
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].v, 3, 'async then sync chain')
    })
})

test('mutate chaining: .mutate().mutate() on sync stream', t => {
  return fun([{v: 1}])
    .mutate(d => { d.v *= 2 })
    .mutate(d => { d.v += 1 })
    .list()
    .then(result => {
      t.isDeeply(result, [{v: 3}], 'chained mutations on sync stream')
    })
})

test('mutate-stream MAPS export', t => {
  const ms = require('../mutate-stream.js')
  const MapStream = require('../map-stream.js')
  t.is(ms.MAPS, undefined, 'mutate-stream does not export MAPS directly')
  t.ok(MapStream.MAPS, 'MapStream exports MAPS')
  t.end()
})

test('mutate via fun(): sync default', t => {
  const results = []
  return fun([{a: 1}, {a: 2}])
    .mutate(d => { d.a *= 10 })
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].a, 10, 'mutate via fun() works')
      t.is(results[1].a, 20)
    })
})

test('async mutate (callback): throw synchronously', t => {
  t.plan(1)
  fun([1]).mutate((data, cb) => { throw new Error('sync-throw') })
    .on('error', err => {
      t.is(err.message, 'sync-throw', 'sync throw in async mutate propagates')
    })
})

test('async mutate (callback): promise return (thenable path)', t => {
  const results = []
  return fun([{x: 1}])
    .mutate((data, cb) => {
      data.x *= 10
      cb()
      return Promise.resolve(data)
    })
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].x, 10, 'thenable return in async mutate works')
    })
})

test('mutate via fun(): async (detected from arity instead of opts)', t => {
  const results = []
  return fun([{a: 1}])
    .mutate((d, cb) => { d.a *= 10; cb() })
    .forEach(d => results.push(d))
    .then(() => {
      t.is(results[0].a, 10, 'async mutate via fun() works')
    })
})
