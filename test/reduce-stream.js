'use strict'
const test = require('tap').test
const fun = require('..')

test('sync errors', t => {
  return fun([1, 2, 3]).reduce((acc, val) => {
    if (val % 2) {
      throw new Error('ODD')
    } else {
      return acc + val
    }
  }).then(() => t.fail('got error'), () => t.pass('got error'))
})
