'use strict'
let FunStream
const FunTransform = require('./fun-transform.js')

module.exports = MapStream

const MAPS = Symbol('maps')

function MapStream (mapWith, opts) {
  if (!FunStream) FunStream = require('./fun-stream.js')
  if (FunStream.isAsync(mapWith, 1, opts)) {
    return new MapStreamAsync(mapWith, opts)
  } else {
    return new MapStreamSync(mapWith, opts)
  }
}

class MapStreamAsync extends FunTransform {
  constructor (mapWith, opts) {
    super(opts)
    this[MAPS] = [mapWith]
  }
  _transform (data, encoding, next) {
    this._runMaps(data, 0, next)
  }
  _runMaps (data, nextMap, next) {
    try {
      if (nextMap >= this[MAPS].length) {
        this.push(data)
        return next()
      }
      const handleResult = (err, value) => {
        if (err) {
          return next(err)
        } else {
          this._runMaps(value, nextMap + 1, next)
        }
      }
      const result = this[MAPS][nextMap](data, handleResult)
      if (result && result.then) return result.then(keep => handleResult(null, keep), handleResult)
    } catch (ex) {
      next(ex)
    }
  }
  map (mapWith, opts) {
    if (!FunStream) FunStream = require('./fun-stream.js')
    if (FunStream.isAsync(mapWith, 1, opts)) {
      this[MAPS].push(mapWith)
      return this
    } else {
      return super.map(mapWith, opts)
    }
  }
}

class MapStreamSync extends FunTransform {
  constructor (mapWith, opts) {
    super(opts)
    this[MAPS] = [mapWith]
  }
  _transform (data, encoding, next) {
    try {
      this.push(this[MAPS].reduce((data, fn) => fn(data), data))
      next()
    } catch (ex) {
      next(ex)
    }
  }
  map (mapWith, opts) {
    if (!FunStream) FunStream = require('./fun-stream.js')
    if (FunStream.isAsync(mapWith, 1, opts)) {
      return super.map(mapWith, opts)
    } else {
      this[MAPS].push(mapWith)
      return this
    }
  }
}
