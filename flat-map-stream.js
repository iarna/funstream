'use strict'
const FunTransform = require('./fun-transform.js')
let FunStream

module.exports = FlatMapStream

const MAP = Symbol('map')

function FlatMapStream (mapWith, opts) {
  if (!FunStream) FunStream = require('./fun-stream.js')
  if (FunStream.isAsync(mapWith, 1, opts)) {
    return new FlatMapStreamAsync(mapWith, opts)
  } else {
    return new FlatMapStreamSync(mapWith, opts)
  }
}

class FlatMapStreamAsync extends FunTransform {
  constructor (mapWith, opts) {
    super(opts)
    this[MAP] = mapWith
  }
  _transform (data, encoding, next) {
    const handleResult = (err, results) => {
      if (err) return next(err)
      if (Array.isArray(results)) {
        results.forEach(v => this.push(v))
      } else if (results && typeof results == 'object' && Symbol.iterator in results) {
        const ii = results[Symbol.iterator]();
        while (true) {
          const rr = ii.next()
          if (rr.done) break
          this.push(rr.value)
        }
      } else {
        this.push(results)
      }
      next()
    }
    try {
      const result = this[MAP](data, handleResult)
      if (result && result.then) return result.then(keep => handleResult(null, keep), handleResult)
    } catch (ex) {
      return handleResult(ex)
    }
  }
}

class FlatMapStreamSync extends FunTransform {
  constructor (mapWith, opts) {
    super(opts)
    this[MAP] = mapWith
  }
  _transform (data, encoding, next) {
    try {
      const results = this[MAP](data)
      if (Array.isArray(results)) {
        results.forEach(v => this.push(v))
      } else if (results && typeof results == 'object' && Symbol.iterator in results) {
        const ii = results[Symbol.iterator]();
        while (true) {
          const rr = ii.next()
          if (rr.done) break
          this.push(rr.value)
        }
      } else {
        this.push(results)
      }
      next()
    } catch (ex) {
      next(ex)
    }
  }
}
