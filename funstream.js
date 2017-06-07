'use strict'
module.exports = fun
// module.exports.FunStream = FunStream (modern classes, boo)

try {
  module.exports.Promise = require('bluebird')
} catch (ex) {
  module.exports.Promise = Promise
}

const MiniSyncSink = require('./mini-sync-sink')
const Transform = require('stream').Transform
const Writable = require('stream').Writable
const PassThrough = require('stream').PassThrough

function fun (stream, opts) {
  if (stream == null) {
    return new FunStream()
  }
  if (Array.isArray(stream)) {
    return funary(stream, opts)
  }
  if (typeof stream === 'object') {
    if ('pause' in stream) {
      return funify(stream, opts)
    }
    if ('write' in stream) {
      return stream // write streams can't be fun
    }
    if ('then' in stream) { // promises of fun
      const resultStream = new FunStream()
      stream.then(promised => fun(promised).pipe(resultStream), err => resultStream.emit('error', err))
      return resultStream
    }
    if (opts == null) {
      return new FunStream(stream)
    }
  }
  throw new Error(`funstream invalid arguments, expected: fun([stream | array], [opts]), got: fun(${[].map.call(arguments, arg => typeof arg).join(', ')})`)
}

function funify (stream, opts) {
  if (stream instanceof FunStream || stream.isFun) return stream
  stream.isFun = true
  stream.opts = opts || {}
  stream.async = stream.opts.async

  stream.filter = FunStream.prototype.filter
  stream.map = FunStream.prototype.map
  stream.reduce = FunStream.prototype.reduce
  stream.reduceTo = FunStream.prototype.reduceTo
  stream.reduceToArray = FunStream.prototype.reduceToArray
  stream.reduceToObject = FunStream.prototype.reduceToObject
  stream.forEach = FunStream.prototype.forEach
  stream.sync = FunStream.prototype.sync
  stream.async = FunStream.prototype.async

  const originalPipe = stream.pipe
  stream.pipe = function (into, opts) {
    this.on('error', (err, stream) => into.emit('error', err, stream || this))
    return funify(originalPipe.call(this, into, opts), this.opts)
  }
  return stream
}

function funary (array, opts) {
  const stream = new FunStream(opts)
  let index = 0
  setImmediate(sendArray)
  return stream

  function sendArray () {
    while (index < array.length) {
      if (!stream.write(array[index++])) {
        stream.once('drain', sendArray)
        return
      }
    }
    stream.end()
  }
}

class FunStream extends PassThrough {
  constructor (opts) {
    super(Object.assign({objectMode: true}, opts))
    this.opts = opts || {}
  }
  async () {
    this.opts.async = true
    return this
  }
  sync () {
    this.opts.async = false
    return this
  }
  pipe (into, opts) {
    this.on('error', (err, stream) => into.emit('error', err, stream || this))
    return funify(super.pipe(into, opts), this.opts)
  }
  filter (filterWith, opts) {
    const filter = FilterStream(filterWith, opts ? Object.assign(this.opts, opts) : this.opts)
    return this.pipe(filter)
  }
  map (mapWith, opts) {
    const map = MapStream(mapWith, opts ? Object.assign(this.opts, opts) : this.opts)
    return this.pipe(map)
  }
  reduce (reduceWith, initial, opts) {
    return new module.exports.Promise((resolve, reject) => {
      const reduce = this.pipe(ReduceStream(reduceWith, initial, opts ? Object.assign(this.opts, opts) : this.opts))
      reduce.once('error', reject)
      reduce.once('result', resolve)
    })
  }
  reduceTo (reduceWith, initial, opts) {
    let reduceToObjectWith
    if (isAsync(reduceWith, 2, opts)) {
      reduceToObjectWith = (acc, value, cb) => {
        return new module.exports.Promise((resolve, reject) => {
          const result = reduceWith(acc, value, err => err ? reject(err) : resolve())
          if (result && result.then) resolve(result)
        })
      }
    } else {
      /* eslint no-sequences:0 */
      reduceToObjectWith = (acc, value) => (reduceWith(acc, value), acc)
    }
    return this.reduce(reduceToObjectWith, initial, opts)
  }
  reduceToObject (reduceWith, opts) {
    return this.reduceTo(reduceWith, {}, opts)
  }
  reduceToArray (reduceWith, opts) {
    return this.reduceTo(reduceWith, [], opts)
  }
  forEach (consumeWith, opts) {
    return new module.exports.Promise((resolve, reject) => {
      const consume = this.pipe(ConsumeStream(consumeWith, opts ? Object.assign(this.opts, opts) : this.opts))
      consume.once('error', reject)
      consume.once('finish', resolve)
    })
  }
}
module.exports.FunStream = FunStream

class FunTransform extends Transform {
  constructor (opts) {
    super({objectMode: true})
    this.opts = opts || {}
  }
}
funify(FunTransform.prototype)

function isAsync (fun, args, opts) {
  if (fun.constructor.name === 'AsyncFunction') return true
  if (opts && opts.async != null) return opts.async
  return fun.length > args
}

function FilterStream (filterWith, opts) {
  if (isAsync(filterWith, 1, opts)) {
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
    } catch (ex) {
      return next(ex)
    }
  }
  filter (filterWith, opts) {
    if (isAsync(filterWith, 1, opts)) {
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
    } catch (ex) {
      next(ex)
    }
  }
  filter (filterWith, opts) {
    if (isAsync(filterWith, 1, opts)) {
      return super.filter(filterWith, opts)
    } else {
      this.filters.push(filterWith)
      return this
    }
  }
}

function MapStream (mapWith, opts) {
  if (isAsync(mapWith, 1, opts)) {
    return new MapStreamAsync(mapWith, opts)
  } else {
    return new MapStreamSync(mapWith, opts)
  }
}

class MapStreamAsync extends FunTransform {
  constructor (mapWith, opts) {
    super(opts)
    this.maps = [mapWith]
  }
  _transform (data, encoding, next) {
    this._runMaps(data, 0, next)
  }
  _runMaps (data, nextMap, next) {
    try {
      if (nextMap >= this.maps.length) {
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
      const result = this.maps[nextMap](data, handleResult)
      if (result && result.then) return result.then(keep => handleResult(null, keep), handleResult)
    } catch (ex) {
      next(ex)
    }
  }
  map (mapWith, opts) {
    if (isAsync(mapWith, 1, opts)) {
      this.maps.push(mapWith)
      return this
    } else {
      return super.map(mapWith, opts)
    }
  }
}

class MapStreamSync extends FunTransform {
  constructor (mapWith, opts) {
    super(opts)
    this.maps = [mapWith]
  }
  _transform (data, encoding, next) {
    try {
      this.push(this.maps.reduce((data, fn) => fn(data), data))
      next()
    } catch (ex) {
      next(ex)
    }
  }
  map (mapWith, opts) {
    if (isAsync(mapWith, 1, opts)) {
      return super.map(mapWith, opts)
    } else {
      this.maps.push(mapWith)
      return this
    }
  }
}

function ReduceStream (reduceWith, initial, opts) {
  if (isAsync(reduceWith, 2, opts)) {
    return new ReduceStreamAsync(reduceWith, initial)
  } else {
    return new ReduceStreamSync(reduceWith, initial)
  }
}
class ReduceStreamAsync extends Writable {
  constructor (reduceWith, initial) {
    super({objectMode: true})
    this.reduceWith = reduceWith
    this.acc = initial
  }
  _write (data, encoding, next) {
    if (this.acc == null) {
      this.acc = data
      next()
    } else {
      const handleResult = (err, value) => {
        this.acc = result
        next(err)
      }
      const result = this.reduceWith(this.acc, data, handleResult)
      if (result && result.then) return result.then(keep => handleResult(null, keep), handleResult)
    }
  }
  end () {
    super.end()
    this.emit('result', this.acc)
  }
}

class ReduceStreamSync extends MiniSyncSink {
  constructor (reduceWith, initial) {
    super()
    this.reduceWith = reduceWith
    this.acc = initial
  }
  write (data, encoding, next) {
    if (this.acc == null) {
      this.acc = data
    } else {
      try {
        this.acc = this.reduceWith(this.acc, data)
      } catch (ex) {
        this.emit(ex)
        return false
      }
    }
    if (next) next()
    return true
  }
  end () {
    super.end()
    this.emit('result', this.acc)
  }
}

function ConsumeStream (consumeWith, opts) {
  if (isAsync(consumeWith, 1, opts)) {
    return new ConsumeStreamAsync({consumeWith: consumeWith})
  } else {
    return new MiniSyncSink({write: consumeWith})
  }
}

class ConsumeStreamAsync extends Writable {
  constructor (opts) {
    super({objectMode: true})
    this.consumeWith = opts.consumeWith
  }
  _write (data, encoding, next) {
    const result = this.consumeWith(data, next)
    if (result && result.then) return result.then(keep => next(null, keep), next)
  }
}
