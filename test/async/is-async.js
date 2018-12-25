'use strict'
/* eslint-disable node/no-unsupported-features/es-syntax */
const test = require('tap').test
const is = require('../../is.js')

async function * fromAsyncArray (arr) {
  for (let ii = 0; ii < arr.length; ++ii) {
    yield arr[ii]
  }
}

test('scalar', t => {
  t.is(is.scalar(fromAsyncArray()), false, 'scalar')
  t.is(is.iterator(fromAsyncArray()), false, 'iterator')
  t.is(is.thenable(fromAsyncArray()), false, 'thenable')
  t.is(is.plainObject(fromAsyncArray()), false, 'plainObject')
  t.is(is.asyncIterator(fromAsyncArray()), true, 'asyncIterator')
  t.done()
})
