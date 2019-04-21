'use strict'
const test = require('tap').test
const fun = require('..')

test('json-stream', t => {
  const st = fun()
  st.write('[{"abc"')
  st.write(':true},\n')
  st.write('{"ghi":true},{"jkl')
  st.write('":true')
  st.write('},{"pqr":true}')
  st.write('\n]\n')
  st.end()
  return st.json().then(values => {
    t.isDeeply(values, [ {abc: true}, {ghi: true}, {jkl: true}, {pqr: true} ])
  })
})

test('from-json-stream', t => {
  const st = fun()
  st.write('[{"abc"')
  st.write(':true},\n')
  st.write('{"ghi":true},{"jkl')
  st.write('":true')
  st.write('},{"pqr":true}')
  st.write('\n]\n')
  st.end()
  // st.ndjson() is an alias for this, but coverage
  return st.fromJson().then(values => {
    t.isDeeply(values, [ {abc: true}, {ghi: true}, {jkl: true}, {pqr: true} ])
  })
})

test('to-json-stream', t => {
  const st = fun()
  st.write({abc: true})
  st.write({ghi: true})
  st.end()
  return st.toJson().concat().then(result => {
    t.isDeeply(result, '[{"abc":true},{"ghi":true}]')
  })
})
