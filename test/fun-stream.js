'use strict'
const test = require('tap').test
const fun = require('..')
const FunStream = require('../fun-stream.js')
const stream = require('stream')

test('fun$ended', function (t) {
  const st = fun([1, 2, 3])
  const p = st.fun$ended()
  t.type(p.then, 'function', 'ended() returns a thenable')
  t.is(st.fun$ended(), p, 'ended() is cached')
  return st.list().then(function () {
    return p.then(function () {
      t.pass('ended() resolved after stream ends')
    })
  })
})

test('fun$ended throws on non-readable', function (t) {
  t.throws(function () {
    FunStream.prototype.fun$ended.call({})
  }, /not a readable stream/)
  t.done()
})

test('fun$finished', function (t) {
  const ws = new stream.Writable({objectMode: true, write: function (chunk, enc, cb) { cb() }})
  const mixinResult = FunStream.mixin(ws)
  const p = mixinResult.fun$finished()
  t.type(p.then, 'function', 'finished() returns a thenable')
  mixinResult.end()
  return p.then(function () {
    t.pass('finished() resolved')
    t.is(mixinResult.fun$finished(), p, 'finished() is cached')
  })
})

test('fun$finished throws on non-writable', function (t) {
  t.throws(function () {
    FunStream.prototype.fun$finished.call({})
  }, /not a writable stream/)
  t.done()
})

test('fun$closed', function (t) {
  const ws = new stream.Writable({objectMode: true, write: function (chunk, enc, cb) { cb() }})
  const mixinResult = FunStream.mixin(ws)
  const p = mixinResult.fun$closed()
  t.type(p.then, 'function', 'closed() returns a thenable')
  mixinResult.end()
  return p.then(function () {
    t.pass('closed() resolved')
    t.is(mixinResult.fun$closed(), p, 'closed() is cached')
  })
})

test('fun$closed throws on non-writable', function (t) {
  t.throws(function () {
    FunStream.prototype.fun$closed.call({})
  }, /not a writable stream/)
  t.done()
})

test('async(sync) with function argument', function (t) {
  const st = fun([1, 2, 3])
  st.sync()
  t.notOk(st[FunStream.OPTS].async, 'starts in sync mode')
  var called = false
  var result = st.async(function (str) {
    called = true
    t.ok(str[FunStream.OPTS].async, 'mode is async inside fn')
    return str
  })
  t.ok(called, 'function was called')
  t.notOk(st[FunStream.OPTS].async, 'original mode restored')
  t.notOk(result[FunStream.OPTS].async, 'result mode restored')
  return st.list().then(function () {
    t.pass('stream completed')
  })
})

test('async() without argument', function (t) {
  const st = fun([1, 2, 3])
  st.async()
  t.ok(st[FunStream.OPTS].async === true, 'async mode set without args')
  t.done()
})

test('sync(async) with function argument', function (t) {
  const st = fun([1, 2, 3])
  st.async()
  t.ok(st[FunStream.OPTS].async === true, 'async mode set initially')
  const result = st.sync(function (str) {
    return str.map(function (v) { return v * 2 })
  })
  t.ok(result[FunStream.OPTS].async === true, 'async mode restored after fn')
  return result.list().then(function (vals) {
    t.isDeeply(vals, [2, 4, 6], 'mapped values correct')
  })
})

test('sync() without argument', function (t) {
  const st = fun([1, 2, 3])
  st.sync()
  t.ok(st[FunStream.OPTS].async === false, 'sync mode set without args')
  t.done()
})

test('json()', function (t) {
  const st = fun()
  st.write('{"a":1}')
  st.write('{"b":2}')
  st.end()
  return st.concat().then(function (str) {
    t.is(str, '{"a":1}{"b":2}', 'concat works')
  })
})

test('json() parses concatenated JSON', function (t) {
  const st = fun()
  st.write('[1,2')
  st.write(',3]')
  st.end()
  return st.json().then(function (parsed) {
    t.isDeeply(parsed, [1, 2, 3], 'json() parses concatenated JSON')
  })
})

test('FunStream.isAsync detection', function (t) {
  t.ok(FunStream.isAsync(function (v, cb) {}, 1), 'function.length=2 > args=1 is async')
  t.notOk(FunStream.isAsync(function (v) {}, 1), 'function.length=1 <= args=1 is sync')
  t.notOk(FunStream.isAsync(function () {}, 1, {async: false}), 'opts.async=false overrides')
  t.ok(FunStream.isAsync(function () {}, 1, {async: true}), 'opts.async=true overrides')
  t.done()
})

test('FunStream.funInit via prototype.init', function (t) {
  function MyStream () {}
  MyStream.prototype.init = function (opts) {
    this.custom = true
    this.opts = opts
  }
  const obj = {}
  FunStream.funInit.call(obj, {test: true})
  t.notOk(obj.custom, 'no init since obj has no prototype link')
  t.done()
})

test('FunStream.funInit via own init', function (t) {
  const obj = {init: function (opts) { this.custom = true; this.opts = opts }}
  FunStream.funInit.call(obj, {own: true})
  t.ok(obj.custom, 'own init was called')
  t.done()
})

test('filter with opts', function (t) {
  const st = fun([1, 2, 3, 4])
  const filtered = st.filter(function (v) { return v % 2 === 0 }, {async: false})
  return filtered.list().then(function (vals) {
    t.isDeeply(vals, [2, 4], 'filter with opts works')
  })
})

test('map with opts', function (t) {
  const st = fun([1, 2, 3])
  const mapped = st.map(function (v) { return v * 10 }, {async: false})
  return mapped.list().then(function (vals) {
    t.isDeeply(vals, [10, 20, 30], 'map with opts works')
  })
})

test('flatMap with opts', function (t) {
  const st = fun([1, 2, 3])
  const flatted = st.flatMap(function (v) { return [v, v * 10] }, {async: false})
  return flatted.list().then(function (vals) {
    t.isDeeply(vals, [1, 10, 2, 20, 3, 30], 'flatMap with opts works')
  })
})

test('reduceTo with async reduceWith', function (t) {
  const st = fun([1, 2, 3])
  var called = 0
  const result = st.reduceTo(function (acc, value, cb) {
    called++
    acc.push(value * 2)
    cb(null)
  }, [])
  return result.then(function (vals) {
    t.isDeeply(vals, [2, 4, 6], 'async reduceTo works')
    t.is(called, 3, 'reduceWith called 3 times')
  })
})

test('reduceTo with reject in async reduceWith', function (t) {
  const st = fun([1, 2, 3])
  return st.reduceTo(function (acc, value, cb) {
    if (value === 2) return cb(new Error('boom'))
    acc.push(value)
    cb(null)
  }, []).then(function () {
    t.fail('should have rejected')
  }, function (err) {
    t.ok(err, 'promise rejected with error')
  })
})

test('FunStream.mixin with a class', function (t) {
  function CustomStream () {
    stream.Readable.call(this, {objectMode: true})
    this.data = [1, 2, 3]
    FunStream.funInit.call(this, {})
  }
  CustomStream.prototype = Object.create(stream.Readable.prototype)
  CustomStream.prototype._read = function () {
    var self = this
    if (self.data.length > 0) {
      self.push(self.data.shift())
    } else {
      self.push(null)
    }
  }
  FunStream.mixin(CustomStream)
  t.ok(CustomStream.isFun, 'isFun static on class')
  t.ok(CustomStream.mixin, 'mixin static on class')
  t.ok(CustomStream.isAsync, 'isAsync static on class')
  t.ok(CustomStream.funInit, 'funInit static on class')

  var instance = new CustomStream()
  t.ok(FunStream.isFun(instance), 'instance is fun')
  t.type(instance.map, 'function', 'instance has map')
  t.type(instance.filter, 'function', 'instance has filter')
  return instance.list().then(function (vals) {
    t.isDeeply(vals, [1, 2, 3], 'instance streams correctly')
  })
})

test('FunStream.mixin with a stream instance', function (t) {
  const ps = new stream.PassThrough({objectMode: true})
  ps.write('hello')
  ps.end()
  const result = FunStream.mixin(ps)
  t.is(result, ps, 'mixin returns the same stream')
  t.ok(FunStream.isFun(ps), 'stream is fun after mixin')
  t.type(ps.list, 'function', 'stream has list')
  return ps.list().then(function (vals) {
    t.isDeeply(vals, ['hello'], 'mixin works on instance')
  })
})

test('FunStream.mixin skips already fun streams', function (t) {
  const st = fun([1])
  const result = FunStream.mixin(st)
  t.is(result, st, 'already fun stream returned as-is')
  t.done()
})

test('pipe error forwarding', function (t) {
  const src = new stream.PassThrough({objectMode: true})
  const dest = new stream.PassThrough({objectMode: true})
  FunStream.mixin(src)
  var errors = []
  dest.on('error', function (err) { errors.push(err) })
  src.pipe(dest)
  var testErr = new Error('pipe error')
  src.destroy(testErr)
  setTimeout(function () {
    t.is(errors.length, 1, 'error forwarded')
    t.is(errors[0].message, 'pipe error', 'correct error')
    t.done()
  }, 50)
})

test('grab', function (t) {
  const st = fun([3, 1, 2])
  return st.grab(function (vals) {
    return vals.sort()
  }).then(function (vals) {
    t.isDeeply(vals, [1, 2, 3], 'grab sorts values')
  })
})

test('sort', function (t) {
  const st = fun([3, 1, 2])
  return st.sort().then(function (vals) {
    t.isDeeply(vals, [1, 2, 3], 'sort works')
  })
})

test('FunStream.isFun', function (t) {
  const st = fun([1, 2, 3])
  t.ok(FunStream.isFun(st), 'fun stream returns true')
  t.notOk(FunStream.isFun({}), 'plain object returns false')
  t.notOk(FunStream.isFun(null), 'null returns false')
  t.done()
})

test('FunStream.OPTS symbol', function (t) {
  const st = fun([1, 2, 3])
  t.ok(st[FunStream.OPTS], 'OPTS symbol accessible')
  t.done()
})

test('FunStream.funInit with no init method', function (t) {
  const obj = {}
  FunStream.funInit.call(obj, {test: true})
  t.ok(obj[FunStream.OPTS], 'OPTS was set via default init')
  t.done()
})

test('FunStream.funInit via prototype.init', function (t) {
  function Base () {}
  Base.prototype.init = function (opts) {
    this.initCalled = true
    this.opts = opts
  }
  const obj = Object.create(Base.prototype)
  FunStream.funInit.call(obj, {custom: true})
  t.ok(obj.initCalled, 'prototype.init called')
  t.ok(obj.opts.custom, 'opts passed through')
  t.done()
})

test('isAsync detects AsyncFunction', function (t) {
  t.ok(FunStream.isAsync(async function () {}, 0), 'async function detected')
  t.done()
})
