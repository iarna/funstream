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
const MiniAsyncSink = require('./mini-async-sink')

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

function isAsync (fun, args, opts) {
  return (opts && opts.async != null && opts.async) || fun.length > args
}

function FilterStream (filterWith, opts) {
  if (isAsync(filterWith, 1, opts)) {
    return new FilterStreamAsync(filterWith, opts)
  } else {
    return new FilterStreamSync(filterWith, opts)
  }
}

class FilterStreamAsync extends FunStream {
  constructor (filterWith, opts) {
    super(opts)
    this.filterWith = filterWith
  }
  write (data, _, next) {
    const filtered = (err, result) => {
      if (err) {
        this.emit('error', err)
        if (next) next(err)
      } else if (super.write(data, null, next)) {
        this.emit('drain')
      }
    }
    const result = this.filterWith(data, filtered)
    if (result.then) {
      result.then(r => filtered(r), filtered)
    }
    return false
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
class MapStreamAsync extends FunStream {
  constructor (mapWith) {
    super()
    this.mapWith = mapWith
  }
  write (data, encoding, next) {
    const mapped = (err, result) => {
      if (err) return next && next(err)
      if (super.write(result, encoding, next)) {
        this.emit('drain')
      }
    }
    const result = this.mapWith(data, mapped)
    if (result.then) {
      result.then(r => mapped(r), mapped)
    }
    return false
  }
}

class MapStreamSync extends FunStream {
  constructor (mapWith) {
    super()
    this.maps = [mapWith]
  }
  write (data, encoding, next) {
    try {
      return super.write(this.maps.reduce((data, mapWith) => mapWith(data), data), encoding, next)
    } catch (ex) {
      this.emit('error', ex)
      if (next) next(ex)
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
class ReduceStreamAsync extends MiniAsyncSink {
  constructor (reduceWith, initial) {
    super()
    this.reduceWith = reduceWith
    this.acc = initial
  }
  write (data, encoding, next) {
    if (this.acc == null) {
      this.acc = data
      return true
    } else {
      this.reduceWith(this.acc, data, (err, result) => {
        if (err) return next && next(err)
        this.acc = result
        this.emit('drain')
        if (next) next()
      })
      return false
    }
  }
  end () {
    super.end()
    this.emit(result => this.acc)
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
      this.acc = this.reduceWith(this.acc, data)
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
    return new MiniAsyncSink({write: consumeWith})
  } else {
    return new MiniSyncSink({write: consumeWith})
  }
}
