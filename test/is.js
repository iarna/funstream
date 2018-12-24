'use strict'
const test = require('tap').test
const is = require('../is.js')
const Readable = require('stream').Readable
const Writable = require('stream').Writable

function * fromArray (arr) {
  for (let ii = 0; ii < arr.length; ++ii) {
    yield arr[ii]
  }
}
async function* fromAsyncArray (arr) {
  for (let ii = 0; ii < arr.length; ++ii) {
    yield arr[ii]
  }
}

test('scalar', t => {
  t.is(is.scalar(null), true, 'null')
  t.is(is.scalar(undefined), true, 'undefined')
  t.is(is.scalar(Buffer.alloc(2)), true, 'Buffer')
  t.is(is.scalar(''), true, 'String')
  t.is(is.scalar(123), true, 'Number')
  t.is(is.scalar(Infinity), true, 'Number (Infinity)')
  t.is(is.scalar(NaN), true, 'Number (NaN)')
  t.is(is.scalar(true), true, 'Boolean')
  t.is(is.scalar(Symbol()), true, 'Symbol')
  t.is(is.scalar([]), false, 'Array')
  t.is(is.scalar({}), false, 'Object')
  t.is(is.scalar(fromArray()), false, 'Iterator')
  t.is(is.scalar(fromAsyncArray()), false, 'AsyncIterator')
  t.is(is.scalar(Promise.resolve()), false, 'Promise')
  t.is(is.scalar(new Readable()), false, 'Readable')
  t.is(is.scalar(new Writable()), false, 'Writable')
  t.done()
})

test('iterator', t => {
  t.is(is.iterator(null), false, 'null')
  t.is(is.iterator(undefined), false, 'undefined')
  t.is(is.iterator(Buffer.alloc(2)), false, 'Buffer')
  t.is(is.iterator(''), false, 'String')
  t.is(is.iterator(123), false, 'Number')
  t.is(is.iterator(Infinity), false, 'Number (Infinity)')
  t.is(is.iterator(NaN), false, 'Number (NaN)')
  t.is(is.iterator(false), false, 'Boolean')
  t.is(is.iterator(Symbol()), false, 'Symbol')
  t.is(is.iterator([]), false, 'Array')
  t.is(is.iterator({}), false, 'Object')
  t.is(is.iterator(fromArray()), true, 'Iterator')
  t.is(is.iterator(fromAsyncArray()), false, 'AsyncIterator')
  t.is(is.iterator(Promise.resolve()), false, 'Promise')
  t.is(is.iterator(new Readable()), false, 'Readable')
  t.is(is.iterator(new Writable()), false, 'Writable')
  t.done()
})
test('thenable', t => {
  t.is(is.thenable(null), false, 'null')
  t.is(is.thenable(undefined), false, 'undefined')
  t.is(is.thenable(Buffer.alloc(2)), false, 'Buffer')
  t.is(is.thenable(''), false, 'String')
  t.is(is.thenable(123), false, 'Number')
  t.is(is.thenable(Infinity), false, 'Number (Infinity)')
  t.is(is.thenable(NaN), false, 'Number (NaN)')
  t.is(is.thenable(false), false, 'Boolean')
  t.is(is.thenable(Symbol()), false, 'Symbol')
  t.is(is.thenable([]), false, 'Array')
  t.is(is.thenable({}), false, 'Object')
  t.is(is.thenable(fromArray()), false, 'Iterator')
  t.is(is.thenable(fromAsyncArray()), false, 'AsyncIterator')
  t.is(is.thenable(Promise.resolve()), true, 'Promise')
  t.is(is.thenable(new Readable()), false, 'Readable')
  t.is(is.thenable(new Writable()), false, 'Writable')
  t.done()
})
test('plainObject', t => {
  t.is(is.plainObject(null), false, 'null')
  t.is(is.plainObject(undefined), false, 'undefined')
  t.is(is.plainObject(Buffer.alloc(2)), false, 'Buffer')
  t.is(is.plainObject(''), false, 'String')
  t.is(is.plainObject(123), false, 'Number')
  t.is(is.plainObject(Infinity), false, 'Number (Infinity)')
  t.is(is.plainObject(NaN), false, 'Number (NaN)')
  t.is(is.plainObject(false), false, 'Boolean')
  t.is(is.plainObject(Symbol()), false, 'Symbol')
  t.is(is.plainObject([]), false, 'Array')
  t.is(is.plainObject({}), true, 'Object')
  t.is(is.plainObject(fromArray()), false, 'Iterator')
  t.is(is.plainObject(fromAsyncArray()), false, 'AsyncIterator')
  t.is(is.plainObject(Promise.resolve()), false, 'Promise')
  t.is(is.plainObject(new Readable()), false, 'Readable')
  t.is(is.plainObject(new Writable()), false, 'Writable')
  t.done()
})
 test('asyncIterator', t => {
  t.is(is.asyncIterator(null), false, 'null')
  t.is(is.asyncIterator(undefined), false, 'undefined')
  t.is(is.asyncIterator(Buffer.alloc(2)), false, 'Buffer')
  t.is(is.asyncIterator(''), false, 'String')
  t.is(is.asyncIterator(123), false, 'Number')
  t.is(is.asyncIterator(Infinity), false, 'Number (Infinity)')
  t.is(is.asyncIterator(NaN), false, 'Number (NaN)')
  t.is(is.asyncIterator(false), false, 'Boolean')
  t.is(is.asyncIterator(Symbol()), false, 'Symbol')
  t.is(is.asyncIterator([]), false, 'Array')
  t.is(is.asyncIterator({}), false, 'Object')
  t.is(is.asyncIterator(fromArray()), false, 'Iterator')
  t.is(is.asyncIterator(fromAsyncArray()), true, 'AsyncIterator')
  t.is(is.asyncIterator(Promise.resolve()), false, 'Promise')
  t.is(is.asyncIterator(new Readable()), false, 'Readable')
  t.is(is.asyncIterator(new Writable()), false, 'Writable')
  t.done()
})
