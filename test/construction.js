'use strict'
const test = require('tap').test
const fun = require('..')
const FunStream = fun.FunStream
const stream = require('stream')
const Promise = require('bluebird')
const is = require('../is.js')

test('construction', t => {
  const resolutions = []
  function hasValue (stream, value, label) {
    resolutions.push(stream.concat().then(v => t.is(v, value, `${label} has expected value`)))
  }
  function isReadable (make, value, label) {
    const result = make()
    t.is(FunStream.isFun(result), true, `${label} is fun`)
    t.is(is.Readable(result), true, `${label} is readable`)
    t.is(is.Writable(result), false, `${label} IS NOT writable`)
    hasValue(result, value, label)
  }
  function isWritable (make, label) {
    const result = make()
    t.is(FunStream.isFun(result), false, `${label} is NOT fun`)
    t.is(is.Readable(result), false, `${label} IS NOT readable`)
    t.is(is.Writable(result), true, `${label} is writable`)
  }
  function isDuplex (make, value, label) {
    const result = make()
    t.is(FunStream.isFun(result), true, `${label} is fun`)
    t.is(is.Duplex(result), true, `${label} is duplex`)
    hasValue(result, value, label)
  }
  function funAndEnd () {
    const stream = fun.apply(null, arguments)
    stream.end()
    return stream
  }

  isDuplex(() => funAndEnd(), '', 'fun()')
  isDuplex(() => funAndEnd({async: true}), '', 'fun(opts)')
  isDuplex(() => funAndEnd(null, {async: true}), '', 'fun(null, opts)')
  isReadable(() => fun([1, 2, 3]), '123', 'fun(array)')
  isReadable(() => fun('abc'), 'abc', 'fun(string)')
  isReadable(() => fun(Buffer.from('abc')), 'abc', 'fun(buffer)')
  isReadable(() => fun(123), '123', 'fun(number)')
  isReadable(() => fun(false), 'false', 'fun(boolean)')
  isReadable(() => fun(Symbol('abc')), 'Symbol(abc)', 'fun(symbol)')

  function * mygen () {
    for (let ii = 0; ii < 3; ++ii) {
      yield ii
    }
  }
  isReadable(() => fun(mygen()), '012', 'fun(iterator)')
  isReadable(() => fun(new stream.Readable({read () { this.push('hi'); this.push(null) }})), 'hi', 'fun(Readable)')
  isWritable(() => fun(new stream.Writable({write () { return true }})), 'fun(Writable)')

  t.throws(() => {
    fun({}, {})
  }, /invalid arguments/, "fun won't fun just anything")
  return Promise.all(resolutions)
})

test('promised construction', t => {
  const resolutions = []
  function hasValue (stream, value, label) {
    resolutions.push(stream.concat().then(v => t.is(v, value, `Promised ${label} has expected value`)))
  }
  function assertFun (make, value, label) {
    const result = make()
    t.is(FunStream.isFun(result), true, `Promised ${label} is fun`)
    t.is(is.Readable(result), true, `Promised ${label} is readable`)
    t.is(is.Writable(result), true, `Promised ${label} is writable`)
    hasValue(result, value, label)
  }
  function funAndEnd () {
    const stream = fun.apply(null, arguments)
    stream.end()
    return stream
  }

  assertFun(() => funAndEnd(Promise.resolve()), '', 'fun()')
  assertFun(() => funAndEnd(Promise.resolve(), {async: true}), '', 'fun(promise, opts)')
  assertFun(() => fun(Promise.resolve([1, 2, 3])), '123', 'fun(array)')
  assertFun(() => fun(Promise.resolve('abc')), 'abc', 'fun(string)')
  assertFun(() => fun(Promise.resolve(Buffer.from('abc'))), 'abc', 'fun(buffer)')
  assertFun(() => fun(Promise.resolve(123)), '123', 'fun(number)')
  assertFun(() => fun(Promise.resolve(false)), 'false', 'fun(boolean)')
  assertFun(() => fun(Promise.resolve(Symbol('abc'))), 'Symbol(abc)', 'fun(symbol)')

  function * mygen () {
    for (let ii = 0; ii < 3; ++ii) {
      yield ii
    }
  }
  assertFun(() => fun(Promise.resolve(mygen())), '012', 'fun(iterator)')
  assertFun(() => fun(Promise.resolve(new stream.Readable({read () { this.push('hi'); this.push(null) }}))), 'hi', 'fun(Readable)')

  const writableFun = fun(Promise.resolve(new stream.Writable({write () { return true }})))
  t.is(FunStream.isFun(writableFun), true, "Promised fun(Writable) is fun (because we don't know any better)")
  t.is(typeof writableFun.pause, 'function', "Promised fun(Writable) is readable (because we don't know any better)")
  t.is(typeof writableFun.write, 'function', 'Promised fun(Writable) is writable')
  t.is(typeof writableFun.then, 'function', 'Promised fun(Writable) IS thenable (because everything always is)')

  const value = {}
  const rejectedFun = fun(Promise.resolve(value))
  rejectedFun.on('data', v => t.is(v, value, 'Promised object was streamed through verbatum'))
  resolutions.push(new Promise(resolve => {
    rejectedFun.on('error', err => {
      t.ifError(err, 'Promised objects are streamed w/o errors')
      resolve()
    })
    rejectedFun.on('finish', () => {
      t.pass('Promised objects are streamed w/o errors')
      resolve()
    })
  }))

  return Promise.all(resolutions)
})
