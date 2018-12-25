'use strict'
const test = require('tap').test
const fun = require('..')

test('sync 1', t => {
  const values = [1, 2]
  return fun([1, 2]).forEach(value => {
    t.is(value, values.shift())
  })
})

// second tests conditional loading of mini-sync-sink
test('sync 2', t => {
  const values = [1, 2]
  return fun([1, 2]).forEach(value => {
    t.is(value, values.shift())
  })
})

test('async promise', t => {
  const values = [1, 2]
  return fun([1, 2]).async().forEach(value => {
    t.is(value, values.shift())
    return Promise.resolve()
  })
})
