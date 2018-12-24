'use strict'
const test = require('tap').test
const fun = require('..')
const FunStream = fun.FunStream
const isaReadable = require('isa-stream').Readable
const isaWritable = require('isa-stream').Writable
const streamTests = require('./lib/interface-tests.js').streamTests
const promiseTests = require('./lib/interface-tests.js').promiseTests

function * fromArray (arr) {
  for (let ii = 0; ii < arr.length; ++ii) {
    yield arr[ii]
  }
}

function * fromArrayError (arr) {
  for (let ii = 0; ii < arr.length; ++ii) {
    if (ii > 0) throw new Error('Boom')
    yield ii
  }
}

test('identity', t => {
  const gen = fun(fromArray([1, 2, 3]))
  t.is(Boolean(isaReadable(gen)), true, 'fun-generator: is readable')
  t.is(Boolean(isaWritable(gen)), false, 'fun-generator: is not writable')
  t.is(Boolean(FunStream.isFun(gen)), true, 'fun-generator: isFun')
  t.done()
})

test('backpresure', t => {
  const data = []
  for (let ii = 0; ii<1000; ++ii) {
    data.push(ii)
  }
  const gen = fun(fromArray(data))
  return gen.list().then(result => t.isDeeply(result, data), () => t.fail())
})

test('errors', t => {
  const gen = fun(fromArrayError([1, 2, 3]))
  return gen.list().then(() => t.fail(), () => t.pass())
})

streamTests(test, () => fun(fromArray([1, 2, 3])), {
  pipe: {expected: [1, 2, 3]},
  head: {expected: [1, 2]},
  forEach: {expected: [1, 2, 3]},
  filter: {with: [v => v > 1], expected: [2, 3]},
  map: {with: [v => v * 2], expected: [2, 4, 6]},
  flat: {create: () => fun(fromArray([[1, 2], [3, 4]])), expected: [1, 2, 3, 4]},
  flatMap: {with: [v => [v, v]], expected: [1, 1, 2, 2, 3, 3]},
  reduceToObject: {with: [(acc, v) => { acc[v] = v * 2 }], expected: [{1: 2, 2: 4, 3: 6}]},
  reduceToArray: {with: [(acc, v) => acc.push(v * 3)], expected: [3, 6, 9]},
  reduceTo: {with: () => [(acc, v) => { acc.result += v }, {result: 0}], expected: [{result: 6}]},
  reduce: {with: [(acc, v) => acc + v], expected: [6]},
  list: {expected: [1, 2, 3]},
  grab: {create: () => fun(fromArray([3, 2, 1])), with: [v => v.sort()], expected: [1, 2, 3], asyncSkip: true},
  sort: {create: () => fun(fromArray([7, 6, 5])), expected: [5, 6, 7], asyncSkip: true},
  concat: {expected: ['123'], asyncSkip: true}
})

promiseTests(test, () => fun(fromArray([1, 2, 3])), {
  reduceToObject: {with: [(acc, v) => { acc[v] = v * 2 }], expected: {1: 2, 2: 4, 3: 6}},
  reduceToArray: {with: [(acc, v) => acc.push(v * 3)], expected: [3, 6, 9]},
  reduceTo: {with: () => [(acc, v) => { acc.result += v }, {result: 0}], expected: {result: 6}},
  reduce: {with: [(acc, v) => acc + v], expected: 6},
  list: {expected: [1, 2, 3]},
  grab: {create: () => fun(fromArray([3, 2, 1])), with: [v => v.sort()], expected: [1, 2, 3], asyncSkip: true},
  sort: {create: () => fun(fromArray([7, 6, 5])), expected: [5, 6, 7], asyncSkip: true},
  concat: {expected: '123', asyncSkip: true}
})
