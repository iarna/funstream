'use strict'
const Benchmark = require('benchmark')
const fun = require('../')
const stream = require('stream')

class NullSink extends stream.Writable {
  constructor () {
    super({objectMode: true})
  }
  _write (data, encoding, next) {
    if (next) next()
    return true
  } 
}

const data = new Array(1000)
for (let ii = 0; ii< 1000; ++ii) {
  data.push(ii)
}


module.exports = suite => {
  suite.add('fun-sync', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      fun(data).sync().map(n => n + 1).map(n => n % 2).map(n => `${n}\n`).pipe(out)
    }
  })

  suite.add('fun-promise', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      fun(data).async().map(n => Promise.resolve(n + 1)).map(n => Promise.resolve(n % 2)).map(n => Promise.resolve(`${n}\n`)).pipe(out)
    }
  })

  suite.add('fun-async', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      fun(data).async().map(async n => n + 1).map(async n => n % 2).map(async n => `${n}\n`).pipe(out)
    }
  })

  suite.add('fun-cb', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      fun(data).async().map((n, cb) => cb(null, n + 1)).map((n, cb) => cb(null, n % 2)).map((n, cb) => cb(null, `${n}\n`)).pipe(out)
    }
  })

  suite.add('stream.Transform', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      fun(data).pipe(new stream.Transform({
        objectMode: true,
        transform (data, enc, cb) {
          this.push(data + 1)
          cb()
        }
      })).pipe(new stream.Transform({
        objectMode: true,
        transform (data, enc, cb) {
          this.push(data % 2)
          cb()
        }
      })).pipe(new stream.Transform({
        objectMode: true,
        transform (data, enc, cb) {
          this.push(`${data}\n`)
          cb()
        }
      })).pipe(out)
    }
  })

  suite.add('Array.map', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      data.map(n => n + 1).map(n => n % 2).map(n => `${n}\n`).forEach(n => out.write(n))
      out.end()
    }
  })

  suite.add('Array.map-single', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      data.map(n => `${(n + 1) % 2}\n`).forEach(n => out.write(n))
      out.end()
    }
  })

  suite.add('Array.map-single-oneloop', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      data.forEach(n => out.write(`${(n + 1) % 2}\n`))
      out.end()
    }
  })

  suite.add('for-C (a)', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      let ii
      for (ii = 0; ii < data.length; ++ii) {
        out.write(`${(data[ii] + 1) % 2}\n`)
      }
      out.end()
    }
  })

  suite.add('for-C (b)', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      for (let ii = 0; ii < data.length; ++ii) {
        out.write(`${(data[ii] + 1) % 2}\n`)
      }
      out.end()
    }
  })

  suite.add('for-in', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      for (let ii in data) {
        out.write(`${(data[ii] + 1) % 2}\n`)
      }
      out.end()
    }
  })

  suite.add('for-of', {
    defer: true,
    fn (deferred) {
      const out = new NullSink()
      out.on('finish', () => deferred.resolve())
      out.on('error', err => deferred.resolve(console.error('ERR', err)))
      for (var n of data) {
        out.write(`${(n + 1) % 2}\n`)
      }
      out.end()
    }
  })
}
