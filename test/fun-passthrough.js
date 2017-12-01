'use strict'
const test = require('tap').test
const fun = require('..')
const FunStream = fun.FunStream
const isaReadable = require('isa-stream').Readable
const isaWritable = require('isa-stream').Writable
const streamTests = require('./lib/interface-tests.js').streamTests
const promiseTests = require('./lib/interface-tests.js').promiseTests
const Bluebird = require('bluebird')

function fromArray (arr) {
  const stream = fun()
  Bluebird.each(arr, v => {
    stream.write(v)
  }).then(() => {
    stream.end()
  })
  return stream
}

test('identity', t => {
  const gen = fromArray([1, 2, 3])
  t.is(Boolean(isaReadable(gen)), true, 'fun-passthrough: is readable')
  t.is(Boolean(isaWritable(gen)), true, 'fun-passthrough: is writable')
  t.is(Boolean(FunStream.isFun(gen)), true, 'fun-passthrough: isFun')
  t.done()
})

streamTests(test, () => fromArray([1, 2, 3]), {
  pipe: {expected: [1, 2, 3]},
  head: {expected: [1, 2]},
  forEach: {expected: [1, 2, 3]},
  filter: {with: [v => v > 1], expected: [2, 3]},
  map: {with: [v => v * 2], expected: [2, 4, 6]},
  flat: {create: () => fromArray([[1, 2], [3, 4]]), expected: [1, 2, 3, 4]},
  flatMap: {with: [v => [v, v]], expected: [1, 1, 2, 2, 3, 3]},
  reduceToObject: {with: [(acc, v) => { acc[v] = v * 2 }], expected: [{1: 2, 2: 4, 3: 6}]},
  reduceToArray: {with: [(acc, v) => acc.push(v * 3)], expected: [3, 6, 9]},
  reduceTo: {with: () => [(acc, v) => { acc.result += v }, {result: 0}], expected: [{result: 6}]},
  reduce: {with: [(acc, v) => acc + v], expected: [6]},
  list: {expected: [1, 2, 3]},
  grab: {create: () => fromArray([3, 2, 1]), with: [v => v.sort()], expected: [1, 2, 3], asyncSkip: true},
  sort: {create: () => fromArray([7, 6, 5]), expected: [5, 6, 7], asyncSkip: true},
  concat: {expected: ['123'], asyncSkip: true}
})

promiseTests(test, () => fromArray([1, 2, 3]), {
  reduceToObject: {with: [(acc, v) => { acc[v] = v * 2 }], expected: {1: 2, 2: 4, 3: 6}},
  reduceToArray: {with: [(acc, v) => acc.push(v * 3)], expected: [3, 6, 9]},
  reduceTo: {with: () => [(acc, v) => { acc.result += v }, {result: 0}], expected: {result: 6}},
  reduce: {with: [(acc, v) => acc + v], expected: 6},
  list: {expected: [1, 2, 3]},
  grab: {create: () => fromArray([3, 2, 1]), with: [v => v.sort()], expected: [1, 2, 3], asyncSkip: true},
  sort: {create: () => fromArray([7, 6, 5]), expected: [5, 6, 7], asyncSkip: true},
  concat: {expected: '123', asyncSkip: true}
})
