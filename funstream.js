'use strict'
module.exports = fun
module.exports.ify = funify
module.exports.ary = funary
// module.exports.FunStream = FunStream (modern classes, boo)

try {
  module.exports.Promise = require('bluebird')
} catch (ex) {
  module.exports.Promise = Promise
}

const MiniPass = require('minipass')
const MiniSyncSink = require('./mini-sync-sink')
const Transform = require('stream').Transform
const Writable = require('stream').Writable

function fun (opts) {
  return new FunStream(opts)
}

function funify (stream, opts) {
  stream.opts = opts || {}
  stream.async = stream.opts.async

  stream.filter = FunStream.prototype.filter
  stream.map = FunStream.prototype.map
  stream.forEach = FunStream.prototype.forEach

  const originalPipe = stream.pipe
  stream.pipe = function (into, opts) {
    this.on('error', err => into.emit('error', err))
    return fun(originalPipe.call(this, into, opts))
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

class FunStream extends MiniPass {
  constructor (opts) {
    super(opts)
    this.opts = opts || {}
    this.async = this.opts.async
  }
  pipe (into, opts) {
    this.on('error', err => into.emit('error', err))
    return fun(super.pipe(into, opts))
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
  constructor () {
    super({objectMode: true})
  }
}
funify(FunTransform.prototype)

function isAsync (fun, args, opts) {
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
    super()
    this.filters = [filterWith]
  }
  _transform (data, encoding, next) {
    this._runFilters(data, true, 0, next)
  }
  _runfilters (data, keep, nextFilter, next) {
    if (!keep) return next()
    if (nextFilter >= this.maps.length) {
      this.push(data)
      return next()
    }
    try {
      this.filters[nextFilter](data, (err, keep) => {
        if (err) {
          return next(err)
        } else {
          this._runFilters(data, keep, nextFilter + 1, next)
        }
      })
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

class FilterStreamSync extends FunStream {
  constructor (filterWith, opts) {
    super(opts)
    this.filters = [filterWith]
  }
  write (data, encoding, next) {
    try {
      if (this.filters.every(fn => fn(data))) {
        return super.write(data, encoding, next)
      } else {
        if (next) next()
        return true
      }
    } catch (ex) {
      this.emit('error', ex)
      if (next) next(ex)
      return false
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
    return new MapStreamAsync(mapWith)
  } else {
    return new MapStreamSync(mapWith)
  }
}

class MapStreamAsync extends FunTransform {
  constructor (mapWith) {
    super()
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
      this.maps[nextMap](data, (err, value) => {
        if (err) {
          return next(err)
        } else {
          this._runMaps(value, nextMap + 1, next)
        }
      })
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
  constructor (mapWith) {
    super()
    this.maps = [mapWith]
  }
  _transform (data, encoding, next) {
    for (var ii in this.maps) {
      data = this.maps[ii](data)
    }
    this.push(data)
    next()
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
      this.reduceWith(this.acc, data, (err, result) => {
        this.acc = result
        next(err)
      })
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
  constructor (consumeWith) {
    super()
    this.consumeWith = consumeWith
  }
  _write (data, encoding, next) {
    this.consumeWith(data, next)
  }
}
