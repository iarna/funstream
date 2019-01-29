'use strict'
const test = require('tap').test
const fun = require('..')

test('line-stream', t => {
  const st = fun()
  st.write('abc')
  st.write('def\n')
  st.write('ghi\njkl')
  st.write('mno')
  st.write('\npqr')
  st.write('\n\n')
  st.end()
  return st.lines().collect().then(values => {
    t.isDeeply(values, [ 'abcdef', 'ghi', 'jklmno', 'pqr', '' ])
  })
})
