'use strict'
const test = require('tap').test
const PassThrough = require('stream').PassThrough
const MiniAsyncSink = require('../mini-async-sink.js')

test('basic', t => {
  let expected = ['abc', 'def', 'ghi']
  const font = new PassThrough({objectMode: true})
  const sink = new MiniAsyncSink({
    write (data, cb) {
      t.is(data, expected.shift(), 'got expected data')
      setImmediate(cb)
    }
  })
  font.pipe(sink)
  font.write('abc')
  font.write('def')
  font.end('ghi')
  sink.on('finish', t.end)
})

test('error', t => {
  let expected = ['abc', 'def']
  const font = new PassThrough({objectMode: true})
  const sink = new MiniAsyncSink({
    write (data, cb) {
      t.is(data, expected.shift(), 'got expected data')
      if (data === 'def') {
        setImmediate(cb, new Error('boom'))
      } else {
        setImmediate(cb)
      }
    }
  })
  font.pipe(sink)
  font.write('abc')
  font.write('def')
  sink.on('error', () => { t.pass('got error'); t.end() })
  sink.on('finish', () => t.fail('finished'))
})

test('throw', t => {
  let expected = ['abc', 'def']
  const font = new PassThrough({objectMode: true})
  const sink = new MiniAsyncSink({
    write (data, cb) {
      t.is(data, expected.shift(), 'got expected data')
      if (data === 'def') {
        throw new Error('boom')
      } else {
        setImmediate(cb)
      }
    }
  })
  font.pipe(sink)
  font.write('abc')
  font.write('def')
  sink.on('error', () => { t.pass('got error'); t.end() })
  sink.on('finish', () => t.fail('finished'))
})
