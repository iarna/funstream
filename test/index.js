'use strict'
const test = require('tap').test
const fun = require('../index.js')
const requireInject = require('require-inject')
const FunPassThrough = require('../fun-passthrough.js')
const stream = require('stream')
const is = require('../is.js')

function freshfun () {
  const fun = requireInject('../index.js')
  if (process.noBB) fun.Promise = Promise
  return fun
}

if (process.noBB) {
  // this just ensures that test/lib/without-bb.js is doing its job
  test('no-blue', t => {
    t.is(fun.Promise, Promise, 'used regular promise')
    t.done()
  })
}

test('fun.FunStream', t => {
  const fun = freshfun()
  t.ok(fun() instanceof FunPassThrough, 'blank fun is fun')
  t.is(fun.FunStream, FunPassThrough, 'FunStream base class is right')
  t.done()
})

test('fun(Readable)', t => {
  const fun = freshfun()
  t.ok(is.Readable(fun(new stream.Readable())))
  // and again, for coverage
  t.ok(is.Readable(fun(new stream.Readable())))
  t.done()
})

test('fun(Writable)', t => {
  const fun = freshfun()
  t.ok(is.Writable(fun(new stream.Writable())))
  // and again, for coverage
  t.ok(is.Writable(fun(new stream.Writable())))
  t.done()
})

test('fun({})', t => {
  const fun = freshfun()
  t.ok(fun({}) instanceof FunPassThrough)
  t.done()
})
