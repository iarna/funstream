'use strict'
const test = require('tap').test
const fun = require('..')
const FunStream = fun.FunStream
const isaReadable = require('isa-stream').Readable
const isaWritable = require('isa-stream').Writable
const streamTests = require('./lib/interface-tests.js').streamTests
const promiseTests = require('./lib/interface-tests.js').promiseTests

test('identity', t => {
  const arr = fun([[11], [12], [13]]).pipe(fun(stream => stream.flat().map(v => v - 10)))
  t.is(Boolean(isaReadable(arr)), true, 'fun-array: is readable')
  t.is(Boolean(isaWritable(arr)), true, 'fun-array: is writable')
  t.is(Boolean(FunStream.isFun(arr)), true, 'fun-array: isFun')
  t.done()
})

streamTests(test, () => fun([[11], [12], [13]]).pipe(fun(stream => stream.flat().map(v => v - 10))), {
  pipe: {expected: [1, 2, 3]},
  head: {expected: [1, 2]},
  forEach: {expected: [1, 2, 3]},
  filter: {with: [v => v > 1], expected: [2, 3]},
  map: {with: [v => v * 2], expected: [2, 4, 6]},
  flat: {create: () => fun([[1, 2], [3, 4]]), expected: [1, 2, 3, 4]},
  flatMap: {with: [v => [v, v]], expected: [1, 1, 2, 2, 3, 3]},
  reduceToObject: {with: [(acc, v) => { acc[v] = v * 2 }], expected: [{1: 2, 2: 4, 3: 6}]},
  reduceToArray: {with: [(acc, v) => acc.push(v * 3)], expected: [3, 6, 9]},
  reduceTo: {with: () => [(acc, v) => { acc.result += v }, {result: 0}], expected: [{result: 6}]},
  reduce: {with: [(acc, v) => acc + v], expected: [6]},
  list: {expected: [1, 2, 3]},
  grab: {create: () => fun([3, 2, 1]), with: [v => v.sort()], expected: [1, 2, 3], asyncSkip: true},
  sort: {create: () => fun([7, 6, 5]), expected: [5, 6, 7], asyncSkip: true},
  concat: {expected: ['123'], asyncSkip: true}
})

promiseTests(test, () => fun([[11], [12], [13]]).pipe(fun(stream => stream.flat().map(v => v - 10))), {
  reduceToObject: {with: [(acc, v) => { acc[v] = v * 2 }], expected: {1: 2, 2: 4, 3: 6}},
  reduceToArray: {with: [(acc, v) => acc.push(v * 3)], expected: [3, 6, 9]},
  reduceTo: {with: () => [(acc, v) => { acc.result += v }, {result: 0}], expected: {result: 6}},
  reduce: {with: [(acc, v) => acc + v], expected: 6},
  list: {expected: [1, 2, 3]},
  grab: {create: () => fun([3, 2, 1]), with: [v => v.sort()], expected: [1, 2, 3], asyncSkip: true},
  sort: {create: () => fun([7, 6, 5]), expected: [5, 6, 7], asyncSkip: true},
  concat: {expected: '123', asyncSkip: true}
})
