'use strict'
const test = require('tap').test
const fun = require('..')

test('fun(fun(fun()))', t => {
  const readable = fun()
  t.is(readable, fun(readable), 'funning a fun stream does nothing')
  t.done()
})
