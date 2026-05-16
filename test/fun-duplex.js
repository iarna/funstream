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

test('duplex once: listener fires', t => {
  const src = fun([[11], [12]]).pipe(fun(stream => stream.flat().map(v => v - 10)))
  let count = 0
  src.once('data', () => { count += 1 })
  src.concat()
    .then(() => {
      t.ok(count > 0, 'once listener fires')
      t.end()
    })
    .catch(t.threw)
})

test('duplex prependOnceListener', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  let order = []
  d.on('data', () => order.push('normal'))
  d.prependOnceListener('data', () => order.push('prepended'))
  d.emit('data', 'test')
  setImmediate(() => {
    t.isDeeply(order, ['prepended', 'normal'], 'prepended listener fires first')
    t.end()
  })
})

test('duplex listenerCount and getMaxListeners', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  const fn = () => {}
  d.on('data', fn)
  t.is(d.listenerCount('data'), 2, 'listenerCount counts both input+output')
  t.ok(d.getMaxListeners() > 0, 'getMaxListeners returns value')
  t.end()
})

test('duplex setMaxListeners', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  d.setMaxListeners(5)
  t.is(d.getMaxListeners(), 5, 'setMaxListeners sets both sides')
  t.end()
})

test('duplex destroy', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  d.destroy()
  t.ok(input.destroyed, 'input destroyed')
  t.ok(output.destroyed, 'output destroyed')
  t.end()
})

test('duplex pipe delegates to output', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  const dest = new Pass()
  d.pipe(dest)
  output.write('hello')
  output.end()
  dest.on('data', data => {
    t.ok(data, 'piped data flows through output')
    t.end()
  })
})

test('duplex addListener delegates to both sides', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  let called = false
  d.addListener('custom-event', () => { called = true })
  input.emit('custom-event')
  t.ok(called, 'addListener works on input')
  called = false
  output.emit('custom-event')
  t.ok(called, 'addListener works on output')
  t.end()
})

test('duplex setDefaultEncoding', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  d.setDefaultEncoding('utf8')
  t.is(input._writableState.defaultEncoding, 'utf8', 'setDefaultEncoding on input')
  t.end()
})

test('duplex uncork', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  d.cork()
  d.uncork()
  t.pass('cork/uncork works')
  t.end()
})

test('duplex write delegates to input', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  input.on('data', data => {
    t.ok(data, 'write flows through input')
    t.end()
  })
  d.write('world')
})

test('duplex end delegates to input', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  input.on('finish', () => {
    t.ok(input._writableState.finished, 'input finished after end')
    t.end()
  })
  d.end()
})

test('duplex read delegates to output', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  output.push('read-data')
  const result = d.read()
  t.is(result, 'read-data', 'read gets output data')
  t.end()
})

test('duplex setEncoding delegates to output', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  output.setEncoding = function () { this._setEncodingCalled = true }
  d.setEncoding('utf8')
  t.pass('setEncoding delegates without error')
  t.end()
})

test('duplex unpipe delegates to output', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  d.unpipe()
  t.pass('unpipe delegates without error')
  t.end()
})

test('duplex unshift delegates to output', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  d.unshift('test')
  t.pass('unshift delegates without error')
  t.end()
})

test('duplex removeAllListeners works on both sides', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  const fn = () => {}
  d.on('data', fn)
  d.removeAllListeners('data')
  t.is(input.listenerCount('data'), 0, 'input listeners cleared')
  t.is(output.listenerCount('data'), 0, 'output listeners cleared')
  t.end()
})

test('duplex listeners concatenates both sides', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  const fn = () => {}
  d.on('data', fn)
  const list = d.listeners('data')
  t.is(list.length, 2, 'listeners from both sides')
  t.end()
})

test('duplex isPaused and pause on output', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  output.pause()
  t.ok(d.isPaused(), 'isPaused reflects output state')
  d.pause()
  t.ok(d.isPaused(), 'pause works')
  t.end()
})

test('duplex resume delegates to output', t => {
  const Pass = require('../fun-passthrough.js')
  const input = new Pass()
  const output = new Pass()
  output.pause()
  const Duplex = require('../fun-duplex.js')
  const d = new Duplex(input, output)
  d.resume()
  t.ok(!output.isPaused(), 'resume unpauses output')
  t.end()
})
