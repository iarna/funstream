'use strict'
const FunTransform = require('./fun-transform.js')
let FunStream

module.exports = FilterStream

function FilterStream (filterWith, opts) {
  if (!FunStream) FunStream = require('./fun-stream.js')
  if (FunStream.isAsync(filterWith, 1, opts)) {
    return new FilterStreamAsync(filterWith, opts)
  } else {
    return new FilterStreamSync(filterWith, opts)
  }
}

class FilterStreamAsync extends FunTransform {
  constructor (filterWith, opts) {
    super(opts)
    this.filters = [filterWith]
  }
  _transform (data, encoding, next) {
    this._runFilters(data, true, 0, next)
  }
  _runFilters (data, keep, nextFilter, next) {
    if (!keep) return next()
    if (nextFilter >= this.filters.length) {
      this.push(data)
      return next()
    }
    try {
      const handleResult = (err, keep) => {
        if (err) {
          return next(err)
        } else {
          this._runFilters(data, keep, nextFilter + 1, next)
        }
      }

      const result = this.filters[nextFilter](data, handleResult)
      if (result && result.then) return result.then(keep => handleResult(null, keep), handleResult)
    } catch (err) {
      return next(err)
    }
  }
  filter (filterWith, opts) {
    if (!FunStream) FunStream = require('./fun-stream.js')
    if (FunStream.isAsync(filterWith, 1, opts)) {
      this.filters.push(filterWith)
      return this
    } else {
      return super.filter(filterWith, opts)
    }
  }
}

class FilterStreamSync extends FunTransform {
  constructor (filterWith, opts) {
    super(opts)
    this.filters = [filterWith]
  }
  _transform (data, encoding, next) {
    try {
      if (this.filters.every(fn => fn(data))) {
        this.push(data, encoding)
      }
      next()
    } catch (err) {
      next(err)
    }
  }
  filter (filterWith, opts) {
    if (!FunStream) FunStream = require('./fun-stream.js')
    if (FunStream.isAsync(filterWith, 1, opts)) {
      return super.filter(filterWith, opts)
    } else {
      this.filters.push(filterWith)
      return this
    }
  }
}
