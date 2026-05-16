'use strict'
const test = require('tap').test
const mixinPromise = require('../mixin-promise-stream.js')
const stream = require('stream')
const PassThrough = require('stream').PassThrough

function delay (ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
}

test('writable early result', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  ps.emit('result', 42)
  return ps.then(function (v) {
    t.is(v, 42, 'resolved with early result')
  })
})

test('writable early finish', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  ps.end()
  return delay(10).then(function () {
    return ps.then(function (v) {
      t.is(v, undefined, 'resolved after early finish')
    })
  })
})

test('writable early error', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  ps.emit('error', new Error('early err'))
  return delay(10).then(function () {
    return ps.then(function () {
      t.fail('should not resolve')
    }).catch(function (err) {
      t.ok(err, 'rejected with early error')
      t.is(err.message, 'early err', 'correct error')
    })
  })
})

test('writable lazy result', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  var p = ps.then(function (v) {
    t.is(v, 99, 'resolved with lazy result')
  })
  ps.emit('result', 99)
  return p
})

test('writable lazy finish', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  var resolved = false
  ps.then(function () { resolved = true })
  ps.end()
  return delay(10).then(function () {
    t.ok(resolved, 'resolved after lazy finish')
  })
})

test('writable lazy error', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  var p = ps.then(function () {
    t.fail('should not resolve')
  }).catch(function (err) {
    t.ok(err, 'rejected with lazy error')
    t.is(err.message, 'lazy err', 'correct error')
  })
  ps.emit('error', new Error('lazy err'))
  return p
})

test('writable fun$closed early close', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  ps.emit('close')
  return delay(10).then(function () {
    return ps.fun$closed().then(function () {
      t.pass('fun$closed resolved after early close')
    })
  })
})

test('writable fun$closed lazy close', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  var p = ps.fun$closed().then(function () {
    t.pass('fun$closed resolved after lazy close')
  })
  ps.emit('close')
  return p
})

test('writable fun$closed early error', function (t) {
  const ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  ps.emit('error', new Error('boom'))
  var result = ps.fun$closed()
  t.is(result, ps, 'fun$closed returns stream when error before call')
  t.done()
})

test('readable early result', function (t) {
  var rs = new stream.Readable({objectMode: true, read: function () { this.push(null) }})
  mixinPromise(rs, {Promise: Promise})
  rs.emit('result', 42)
  rs.resume()
  return rs.then(function () {
    t.pass('resolved for readable early result')
  })
})

test('readable early end', function (t) {
  var rs = new stream.Readable({objectMode: true, read: function () { this.push(null) }})
  mixinPromise(rs, {Promise: Promise})
  rs.resume()
  return delay(10).then(function () {
    return rs.then(function () {
      t.pass('resolved after early end')
    })
  })
})

test('readable early error', function (t) {
  var rs = new stream.Readable({objectMode: true, read: function () {}})
  mixinPromise(rs, {Promise: Promise})
  rs.emit('error', new Error('boom'))
  return delay(10).then(function () {
    return rs.then(function () {
      t.fail('should not resolve')
    }).catch(function (err) {
      t.ok(err, 'rejected with early error')
    })
  })
})

test('readable lazy result', function (t) {
  var rs = new stream.Readable({objectMode: true, read: function () { this.push(null) }})
  mixinPromise(rs, {Promise: Promise})
  var p = rs.then(function () {
    t.pass('resolved with lazy result')
  })
  rs.emit('result', 88)
  rs.resume()
  return p
})

test('readable lazy end', function (t) {
  var rs = new stream.Readable({objectMode: true, read: function () { this.push(null) }})
  mixinPromise(rs, {Promise: Promise})
  var resolved = false
  rs.resume()
  return delay(10).then(function () {
    return rs.then(function () { resolved = true }).then(function () {
      t.ok(resolved, 'resolved after lazy end')
    })
  })
})

test('then idempotency', function (t) {
  var ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  var p1 = ps.then(function () {})
  var p2 = ps.then(function () {})
  t.not(p1, p2, 'each .then() call returns a different promise')
  ps.emit('result', 1)
  return Promise.all([p1, p2])
})

test('catch after error', function (t) {
  var ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  ps.emit('error', new Error('catch test'))
  return delay(10).then(function () {
    return ps.then(function () {
      t.fail('should not resolve')
    }).catch(function (err) {
      t.ok(err, 'caught error via .catch()')
      t.is(err.message, 'catch test', 'correct error')
    })
  })
})

test('already mixed returns early', function (t) {
  var ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  var then1 = ps.then
  mixinPromise(ps, {Promise: Promise})
  t.is(ps.then, then1, 'then unchanged after second mixin')
  t.done()
})

test('writable fun$finished is nop', function (t) {
  var ps = new PassThrough({objectMode: true})
  mixinPromise(ps, {Promise: Promise})
  var result = ps.fun$finished()
  t.is(result, ps, 'fun$finished returns this')
  t.done()
})

test('readable fun$ended is nop', function (t) {
  var rs = new stream.Readable({objectMode: true, read: function () {}})
  mixinPromise(rs, {Promise: Promise})
  var result = rs.fun$ended()
  t.is(result, rs, 'fun$ended returns this')
  t.done()
})
