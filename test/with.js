'use strict'
const test = require('tap').test
const fun = require('../index.js')

test('with', t => {
  return fun.with(st => {
    let count = 0
    return new Promise(function each (resolve) {
      if (++count === 5) return resolve()
      st.write(count)
      setTimeout(each, 100, resolve)
    })
  }).list().then(result => {
    t.isDeeply(result, [ 1, 2, 3, 4 ])
  })
})

test('with-bad', t => {
  t.throws(() => fun.with((s) => 'nah'))
  t.done()
})

test('with-err', t => {
  t.plan(1)
  return fun.with(st => {
    let count = 0
    return new Promise(function each (resolve, reject) {
      if (++count === 5) return reject(new Error())
      st.write(count)
      setTimeout(each, 100, resolve, reject)
    })
  }).list().then(result => {
    t.fail()
  }, () => {
    t.pass()
  })
})
