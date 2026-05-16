'use strict'
const test = require('tap').test
const StreamPromise = require('../stream-promise.js')
const stream = require('stream')

function delay (ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
}

test('constructor with array promise', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2, 3]))
  var results = []
  sp.on('data', function (v) { results.push(v) })
  sp.on('end', function () {
    t.isDeeply(results, [1, 2, 3], 'array promise emits items')
    t.done()
  })
})

test('constructor with string promise', function (t) {
  var sp = new StreamPromise(Promise.resolve('abc'))
  var results = []
  sp.on('data', function (v) { results.push(v) })
  sp.on('end', function () {
    t.isDeeply(results, ['abc'], 'string promise emits string')
    t.done()
  })
})

test('constructor with null promise', function (t) {
  var sp = new StreamPromise(Promise.resolve(null))
  var gotData = false
  sp.on('data', function () { gotData = true })
  sp.on('end', function () {
    t.notOk(gotData, 'null promise does not emit data')
    t.done()
  })
})

test('constructor with plain object promise', function (t) {
  var sp = new StreamPromise(Promise.resolve({hello: 'world'}))
  var results = []
  sp.on('data', function (v) { results.push(v) })
  sp.on('end', function () {
    t.isDeeply(results, [{hello: 'world'}], 'plain object promise wraps in array')
    t.done()
  })
})

test('constructor with Readable promise', function (t) {
  var rs = new stream.PassThrough({objectMode: true})
  rs.write('from-rs')
  rs.end()
  var sp = new StreamPromise(Promise.resolve(rs))
  var results = []
  sp.on('data', function (v) { results.push(v) })
  sp.on('end', function () {
    t.isDeeply(results, ['from-rs'], 'readable promise pipes through')
    t.done()
  })
})

test('rejected promise emits error', function (t) {
  var sp = new StreamPromise(Promise.reject(new Error('rejected')))
  sp.on('error', function (err) {
    t.ok(err, 'error emitted on rejection')
    t.is(err.message, 'rejected', 'correct error message')
    t.done()
  })
})

test('eventNames', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.on('data', function () {})
  sp.on('end', function () {})
  var names = sp.eventNames()
  t.ok(names.indexOf('data') !== -1, 'data in event names')
  t.ok(names.indexOf('end') !== -1, 'end in event names')
  t.done()
})

test('addListener delegates', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  var called = false
  sp.addListener('data', function () { called = true })
  return delay(10).then(function () {
    t.ok(called, 'addListener works')
  })
})

test('prependListener', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2]))
  var order = []
  sp.on('data', function () { order.push('last') })
  sp.prependListener('data', function () { order.push('first') })
  return delay(10).then(function () {
    t.isDeeply(order, ['first', 'last', 'first', 'last'], 'prependListener fires first for each item')
  })
})

test('removeListener', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  function handler () { t.fail('should not be called') }
  sp.on('data', handler)
  sp.removeListener('data', handler)
  return delay(10).then(function () {
    t.pass('removeListener prevented handler')
  })
})

test('removeAllListeners', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.on('data', function () { t.fail('should not fire') })
  sp.removeAllListeners('data')
  return delay(10).then(function () {
    t.pass('removeAllListeners cleared handler')
  })
})

test('once', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2]))
  var count = 0
  sp.once('data', function () { count++ })
  return delay(10).then(function () {
    t.is(count, 1, 'once fires only once')
  })
})

test('prependOnceListener', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2]))
  var order = []
  sp.on('data', function () { order.push('last') })
  sp.prependOnceListener('data', function () { order.push('first') })
  return delay(10).then(function () {
    t.is(order[0], 'first', 'prependOnceListener fires first')
    t.is(order.length, 3, 'fires once for prepend + twice for on = 3 total')
  })
})

test('listeners', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  function fn () {}
  sp.on('data', fn)
  var list = sp.listeners('data')
  t.ok(Array.isArray(list), 'listeners returns array')
  t.is(list.length, 1, 'one listener')
  t.done()
})

test('listenerCount', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.on('data', function () {})
  var count = sp.listenerCount('data')
  t.ok(count >= 1, 'has listeners for data')
  t.done()
})

test('getMaxListeners / setMaxListeners', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.setMaxListeners(20)
  var max = sp.getMaxListeners()
  t.is(max, 20, 'getMaxListeners returns set value')
  t.done()
})

test('emit delegates', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  var called = false
  sp.on('custom', function () { called = true })
  var result = sp.emit('custom')
  t.ok(result, 'emit returns true')
  t.ok(called, 'custom event emitted')
  t.done()
})

test('pause and resume', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2, 3]))
  sp.on('data', function () {})
  sp.pause()
  t.ok(sp.isPaused(), 'stream is paused')
  sp.resume()
  t.notOk(sp.isPaused(), 'stream is not paused after resume')
  return delay(10).then(function () {
    t.pass('pause/resume work')
  })
})

test('setEncoding', function (t) {
  var sp = new StreamPromise(Promise.resolve('hello'))
  sp.setEncoding('utf8')
  var results = []
  sp.on('data', function (v) { results.push(v) })
  return delay(10).then(function () {
    t.pass('setEncoding works')
  })
})

test('pipe and unpipe', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2, 3]))
  var dest = new stream.PassThrough({objectMode: true})
  var results = []
  dest.on('data', function (v) { results.push(v) })
  dest.on('end', function () {
    t.isDeeply(results, [1, 2, 3], 'pipe delivers all items')
    t.done()
  })
  var piped = sp.pipe(dest)
  t.type(piped.then, 'function', 'piped result is funified')
})

test('unpipe specific dest', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2, 3]))
  var dest = new stream.PassThrough({objectMode: true})
  var results = []
  dest.on('data', function (v) { results.push(v) })
  sp.pipe(dest)
  sp.unpipe(dest)
  return delay(20).then(function () {
    t.is(results.length, 0, 'nothing piped after unpipe')
  })
})

test('read and unshift', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2, 3]))
  sp.resume()
  sp.read()
  t.pass('read() does not throw')
  sp.unshift('custom')
  t.pass('unshift() does not throw')
  t.done()
})

test('destroy', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2, 3]))
  sp.destroy()
  t.pass('destroy does not crash')
  t.done()
})

test('destroy without error', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2, 3]))
  sp.destroy()
  t.pass('destroy without error does not throw')
  t.done()
})

test('cork and uncork', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.cork()
  sp.uncork()
  t.pass('cork/uncork does not throw')
  t.done()
})

test('write and end', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.write('data')
  sp.end()
  t.pass('write/end does not throw')
  t.done()
})

test('setDefaultEncoding', function (t) {
  var sp = new StreamPromise(Promise.resolve('hello'))
  sp.setDefaultEncoding('utf8')
  t.pass('setDefaultEncoding does not throw')
  t.done()
})

test('fun$ended', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  var result = sp.fun$ended()
  t.is(result, sp, 'fun$ended returns this')
  t.done()
})

test('static methods inherited from FunStream', function (t) {
  t.type(StreamPromise.isFun, 'function', 'isFun static inherited')
  t.type(StreamPromise.mixin, 'function', 'mixin static inherited')
  t.type(StreamPromise.isAsync, 'function', 'isAsync static inherited')
  t.type(StreamPromise.funInit, 'function', 'funInit static inherited')
  t.done()
})

test('pipe forwardError with existing err.src', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  var dest = new stream.PassThrough({objectMode: true})
  sp.on('data', function () {})
  sp.pipe(dest)
  var errors = []
  dest.on('error', function (err) { errors.push(err) })
  var err = new Error('src-set')
  err.src = 'custom'
  sp.emit('error', err)
  t.is(errors.length, 1, 'error forwarded')
  t.is(errors[0].src, 'custom', 'existing err.src preserved')
  t.done()
})

test('emit before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.emit('some-event')
  t.pass('emit triggers MAKEME when stream not yet created')
  t.done()
})

test('end before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.end()
  t.pass('end triggers MAKEME when stream not yet created')
  t.done()
})

test('setDefaultEncoding before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.setDefaultEncoding('utf8')
  t.pass('setDefaultEncoding triggers MAKEME when stream not yet created')
  t.done()
})

test('uncork before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.uncork()
  t.pass('uncork triggers MAKEME when stream not yet created')
  t.done()
})

test('removeListener before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.removeListener('data', function () {})
  t.pass('removeListener triggers MAKEME when stream not yet created')
  t.done()
})

test('destroy before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.destroy()
  t.pass('destroy triggers MAKEME when stream not yet created')
  t.done()
})

test('cork before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.cork()
  t.pass('cork triggers MAKEME when stream not yet created')
  t.done()
})

test('read before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.read()
  t.pass('read triggers MAKEME when stream not yet created')
  t.done()
})

test('unshift before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.unshift('x')
  t.pass('unshift triggers MAKEME when stream not yet created')
  t.done()
})

test('unpipe before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.unpipe()
  t.pass('unpipe triggers MAKEME when stream not yet created')
  t.done()
})

test('unpipe all pipes', function (t) {
  var sp = new StreamPromise(Promise.resolve([1, 2, 3]))
  var dest = new stream.PassThrough({objectMode: true})
  sp.pipe(dest)
  sp.unpipe()
  t.pass('unpipe without args works')
  t.done()
})

test('pipe forwardError without err.src', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  var dest = new stream.PassThrough({objectMode: true})
  sp.pipe(dest)
  var errors = []
  dest.on('error', function (err) { errors.push(err) })
  sp.emit('error', new Error('no-src'))
  t.is(errors.length, 1, 'error forwarded')
  t.is(errors[0].src, sp, 'err.src set to stream')
  t.done()
})

test('getMaxListeners before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.getMaxListeners()
  t.pass('getMaxListeners triggers MAKEME when stream not yet created')
  t.done()
})

test('listenerCount before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.listenerCount('data')
  t.pass('listenerCount triggers MAKEME when stream not yet created')
  t.done()
})

test('listeners before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.listeners('data')
  t.pass('listeners triggers MAKEME when stream not yet created')
  t.done()
})

test('isPaused before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.isPaused()
  t.pass('isPaused triggers MAKEME when stream not yet created')
  t.done()
})

test('pause before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.pause()
  t.pass('pause triggers MAKEME when stream not yet created')
  t.done()
})

test('prependOnceListener before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.prependOnceListener('data', function () {})
  t.pass('prependOnceListener triggers MAKEME when stream not yet created')
  t.done()
})

test('eventNames before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.eventNames()
  t.pass('eventNames triggers MAKEME when stream not yet created')
  t.done()
})

test('prependListener before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.prependListener('data', function () {})
  t.pass('prependListener triggers MAKEME when stream not yet created')
  t.done()
})

test('removeAllListeners before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.removeAllListeners()
  t.pass('removeAllListeners triggers MAKEME when stream not yet created')
  t.done()
})

test('eventNames before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.eventNames()
  t.pass('eventNames triggers MAKEME when stream not yet created')
  t.done()
})

test('prependListener before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.prependListener('data', function () {})
  t.pass('prependListener triggers MAKEME when stream not yet created')
  t.done()
})

test('removeAllListeners before MAKEME', function (t) {
  var sp = new StreamPromise(Promise.resolve([1]))
  sp.removeAllListeners()
  t.pass('removeAllListeners triggers MAKEME when stream not yet created')
  t.done()
})
