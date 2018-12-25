'use strict'
const test = require('tap').test
const PassThrough = require('stream').PassThrough
const MiniSyncSink = require('../mini-sync-sink.js')

test('basic', t => {
  let expected = ['abc', 'def', 'ghi']
  const font = new PassThrough({objectMode: true})
  const sink = new MiniSyncSink({
    Promise,
    write (data) {
      t.is(data, expected.shift(), 'got expected data')
    }
  })
  sink.on('finish', t.end)
  font.pipe(sink)
  font.write('abc')
  font.write('def')
  font.end('ghi')
})

test('error', t => {
  let expected = ['abc', 'def']
  const font = new PassThrough({objectMode: true})
  const sink = new MiniSyncSink({
    Promise,
    write (data, cb) {
      t.is(data, expected.shift(), 'got expected data')
      if (data === 'def') {
        throw new Error('boom')
      }
    }
  })
  sink.on('error', () => { t.pass('got error'); t.end() })
  sink.on('finish', () => t.fail('finished'))
  font.pipe(sink)
  font.write('abc')
  font.write('def')
})
