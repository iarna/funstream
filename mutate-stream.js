'use strict'
let FunStream
const MapStream = require('./map-stream.js')

module.exports = MutateStream

function MutateStream (mapWith, opts) {
  if (!FunStream) FunStream = require('./fun-stream.js')
  if (FunStream.isAsync(mapWith, 1, opts)) {
    return new MutateStreamAsync(mapWith, opts)
  } else {
    return new MutateStreamSync(mapWith, opts)
  }
}
const MAPS = MapStream.MAPS

class MutateStreamAsync extends MapStream.Async {
  _runMaps (data, nextMutate, next) {
    try {
      if (nextMutate >= this[MAPS].length) {
        this.push(data)
        return next()
      }
      const handleResult = err => {
        if (err) {
          return next(err)
        } else {
          this._runMaps(data, nextMutate + 1, next)
        }
      }
      const result = this[MAPS][nextMutate](data, handleResult)
      if (result && result.then) return result.then(keep => handleResult(null, keep), handleResult)
    } catch (err) {
      next(err)
    }
  }
  mutate (mutateWith, opts) {
    if (!FunStream) FunStream = require('./fun-stream.js')
    if (FunStream.isAsync(mutateWith, 1, opts)) {
      this[MAPS].push(mutateWith)
      return this
    } else {
      return super.mutate(mutateWith, opts)
    }
  }
}

class MutateStreamSync extends MapStream.Sync {
  _transform (data, encoding, next) {
    try {
      this[MAPS].forEach(fn => fn(data))
      this.push(data)
      next()
    } catch (err) {
      next(err)
    }
  }
  mutate (mutateWith, opts) {
    if (!FunStream) FunStream = require('./fun-stream.js')
    if (FunStream.isAsync(mutateWith, 1, opts)) {
      return super.mutate(mutateWith, opts)
    } else {
      this[MAPS].push(mutateWith)
      return this
    }
  }
}
