'use strict'

const Benchmark = require('benchmark')
const fs = require('fs')
const path = require('path')

const suite = new Benchmark.Suite({
  onCycle (event) {
    const bench = event.target
    console.log(`     ${bench.name}`)
    console.log('------------------------------------------------')
    if (bench.error) {
      console.log('Error:', bench.error.message || bench.error)
    } else {
      console.log(`  ${
        bench.hz.toFixed(bench.hz < 100 ? 2 : 0)
      } ops/s @ ~${
        (bench.stats.mean * 1000).toFixed(3)
      }ms/op`)
      console.log(`  Sampled ${
        bench.stats.sample.length
      } in ${
        bench.times.elapsed.toFixed(2)}s.`)
    }
    console.log('================================================')
  }
})

fs.readdir(__dirname, (err, files) => {
  if (err) { throw err }
  files.forEach(f => {
    if (f[0] !== '.' && path.extname(f) === '.js' && f !== 'index.js') {
      require('./' + f)(suite)
    }
  })
  suite.run({async: true})
})
