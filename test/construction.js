'use strict'
const test = require('tap').test
const fun = require('..')
const FunStream = fun.FunStream
const stream = require('stream')
const Promise = require('bluebird')
const NullSink = require('../null-sink.js')

test('construction', t => {
  const plainFun = fun()
  t.is(FunStream.isFun(plainFun), true, 'fun() is fun')
  t.is(typeof plainFun.pause, 'function', 'fun() is readable')
  t.is(typeof plainFun.write, 'function', 'fun() is writable')

  const optFun = fun({async: true})
  t.is(FunStream.isFun(optFun), true, 'fun(opts) is fun')
  t.is(typeof optFun.pause, 'function', 'fun(opts) is readable')
  t.is(typeof optFun.write, 'function', 'fun(opts) is writable')

  const nullOptFun = fun(null, {async: true})
  t.is(FunStream.isFun(nullOptFun), true, 'fun(null, opts) is fun')
  t.is(typeof nullOptFun.pause, 'function', 'fun(null, opts) is readable')
  t.is(typeof nullOptFun.write, 'function', 'fun(null, opts) is writable')

  const arrayFun = fun([1, 2, 3])
  t.is(FunStream.isFun(arrayFun), true, 'fun(array) is fun')
  t.is(typeof arrayFun.pause, 'function', 'fun(array) is readable')
  t.is(typeof arrayFun.write, 'undefined', 'fun(array) is NOT writable')

  const readableFun = fun(new stream.Readable({read () { this.push(null) }}))
  t.is(FunStream.isFun(readableFun), true, 'fun(Readable) is fun')
  t.is(typeof readableFun.pause, 'function', 'fun(Readable) is readable')
  t.is(typeof readableFun.write, 'undefined', 'fun(Readable) is NOT writable')

  const writableFun = fun(new stream.Writable({write () { return true }}))
  t.is(FunStream.isFun(writableFun), false, 'fun(Writable) is NOT fun')
  t.is(typeof writableFun.pause, 'undefined', 'fun(Writable) is NOT readable')
  t.is(typeof writableFun.write, 'function', 'fun(Writable) is writable')

  t.throws(() => {
    fun(123)
  }, /invalid arguments/, "fun won't fun just anything")

  t.done()
})

test('promised construction', t => {
  const plainFun = fun(Promise.resolve())
  t.is(FunStream.isFun(plainFun), true, 'Promised fun() is fun')
  t.is(typeof plainFun.pause, 'function', 'Promised fun() is readable')
  t.is(typeof plainFun.write, 'function', 'Promised fun() is writable')

  const optFun = fun(Promise.resolve({async: true}))
  t.is(FunStream.isFun(optFun), true, 'Promised fun(opts) is fun')
  t.is(typeof optFun.pause, 'function', 'Promised fun(opts) is readable')
  t.is(typeof optFun.write, 'function', 'Promised fun(opts) is writable')

  const nullOptFun = fun(Promise.resolve(null, {async: true}))
  t.is(FunStream.isFun(nullOptFun), true, 'Promised fun(null, opts) is fun')
  t.is(typeof nullOptFun.pause, 'function', 'Promised fun(null, opts) is readable')
  t.is(typeof nullOptFun.write, 'function', 'Promised fun(null, opts) is writable')

  const arrayFun = fun(Promise.resolve([1, 2, 3]))
  t.is(FunStream.isFun(arrayFun), true, 'Promised fun(array) is fun')
  t.is(typeof arrayFun.pause, 'function', 'Promised fun(array) is readable')
  t.is(typeof arrayFun.write, 'function', 'Promised fun(array) is writable')

  const readableFun = fun(Promise.resolve(new stream.Readable({read () { this.push(null) }})))
  t.is(FunStream.isFun(readableFun), true, 'Promised fun(Readable) is fun')
  t.is(typeof readableFun.pause, 'function', 'Promised fun(Readable) is readable')
  t.is(typeof readableFun.write, 'function', "Promised fun(Readable) is writable (because we don't know any better)")

  const writableFun = fun(Promise.resolve(new stream.Writable({write () { return true }})))
  t.is(FunStream.isFun(writableFun), true, "Promised fun(Writable) is fun (because we don't know any better)")
  t.is(typeof writableFun.pause, 'function', "Promised fun(Writable) is readable (because we don't know any better)")
  t.is(typeof writableFun.write, 'function', 'Promised fun(Writable) is writable')

  t.test("fun won't fun just anything", t => {
    t.plan(1)
    // this is a deferred "thing that can't be a promise" which means it'll be
    // emitted as an error.  `rejectedFun` here is a NullSink that has a
    // FunStream piped into it.
    // When the promise rejects that gets emitted by the funstream and then,
    // in turn, forwarded to `rejectedFun`.
    const rejectedFun = fun(Promise.resolve(123)).pipe(new NullSink())
    let gotError = false
    rejectedFun.on('error', err => {
      gotError = true
      t.match(err, /invalid arguments/, 'invalid args error')
    })
    rejectedFun.on('finish', () => {
      t.is(gotError, true, 'got error in run')
    })
  })
  t.done()
})
