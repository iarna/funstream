'use strict'
const test = require('tap').test
const fun = require('..')

test('ndjson-stream', t => {
  const st = fun()
  st.write('{"abc"')
  st.write(':true}\n')
  st.write('{"ghi":true}\n{"jkl')
  st.write('":true')
  st.write('}\n{"pqr":true}')
  st.write('\n\n')
  st.end()
  return st.ndjson().collect().then(values => {
    t.isDeeply(values, [ {abc: true}, {ghi: true}, {jkl: true}, {pqr: true} ])
  })
})

test('from-ndjson-stream', t => {
  const st = fun()
  st.write('{"abc"')
  st.write(':true}\n')
  st.write('{"ghi":true}\n{"jkl')
  st.write('":true')
  st.write('}\n{"pqr":true}')
  st.write('\n\n')
  st.end()
  // st.ndjson() is an alias for this, but coverage
  return st.fromNdjson().collect().then(values => {
    t.isDeeply(values, [ {abc: true}, {ghi: true}, {jkl: true}, {pqr: true} ])
  })
})
