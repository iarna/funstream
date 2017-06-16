'use strict'
const INIT = Symbol('init')
const OPTS = Symbol('opts')

class FunStream {
  [INIT] (opts) {
    this[OPTS] = opts || {}
    this.isFun = true
  }
  async () {
    this[OPTS].async = true
    return this
  }
  sync () {
    this[OPTS].async = false
    return this
  }
  pipe (into, opts) {
    this.on('error', (err, stream) => into.emit('error', err, stream || this))
    return mixinFun(super.pipe(into, opts), this[OPTS])
  }
  filter (filterWith, opts) {
    const filter = FilterStream(filterWith, opts ? Object.assign(this[OPTS], opts) : this[OPTS])
    return this.pipe(filter)
  }
  map (mapWith, opts) {
    const map = MapStream(mapWith, opts ? Object.assign(this[OPTS], opts) : this[OPTS])
    return this.pipe(map)
  }
  head (maxoutput) {
    let seen = 0
    return this.filter(() => seen++ < maxoutput)
  }
  reduce (reduceWith, initial, reduceOpts) {
    const opts = Object.assign({}, this[OPTS], reduceOpts || {})
    return new opts.Promise((resolve, reject) => {
      const reduce = this.pipe(ReduceStream(reduceWith, initial, opts))
      reduce.once('error', reject)
      reduce.once('result', resolve)
    })
  }
  reduceTo (reduceWith, initial, reduceOpts) {
    const opts = Object.assign({}, this[OPTS], reduceOpts || {})
    let reduceToObjectWith
    if (isAsync(reduceWith, 2, opts)) {
      reduceToObjectWith = (acc, value, cb) => {
        return new opts.Promise((resolve, reject) => {
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
  sort (sortWith, opts) {
    return fun(this.reduceToArray((acc, value) => acc.push(value)).then(values => values.sort(sortWith)))
  }
  forEach (foreachWith, forEachOpts) {
    const opts = Object.assign({}, this[OPTS], forEachOpts || {})
    return new opts.Promise((resolve, reject) => {
      const foreach = this.pipe(ForEachStream(foreachWith, opts))
      foreach.once('error', reject)
      foreach.once('finish', resolve)
    })
  }
}

FunStream.isFun = stream => Boolean(stream.isFun)
FunStream.mixin = mixinFun
FunStream.isAsync = isAsync

function isAsync (fun, args, opts) {
  if (fun.constructor.name === 'AsyncFunction') return true
  if (opts && opts.async != null) return opts.async
  return fun.length > args
}

function mixinFun (stream, opts) {
  if (FunStream.isFun(stream)) return stream

  const cls = typeof stream === 'function' ? stream : null
  const obj = cls ? cls.prototype : stream

  if (cls) {
    cls.isFun = FunStream.isFun
    cls.mixin = FunStream.mixin
    cls.isAsync = FunStream.isAsync
    cls.funInit = FunStream.prototype[INIT]
  } else {
    FunStream.prototype[INIT].call(obj, opts)
  }

  obj.filter = FunStream.prototype.filter
  obj.map = FunStream.prototype.map
  obj.head = FunStream.prototype.head
  obj.reduce = FunStream.prototype.reduce
  obj.reduceTo = FunStream.prototype.reduceTo
  obj.reduceToArray = FunStream.prototype.reduceToArray
  obj.reduceToObject = FunStream.prototype.reduceToObject
  obj.sort = FunStream.prototype.sort
  obj.forEach = FunStream.prototype.forEach
  obj.sync = FunStream.prototype.sync
  obj.async = FunStream.prototype.async

  const originalPipe = obj.pipe
  obj.pipe = function (into, opts) {
    this.on('error', (err, stream) => into.emit('error', err, stream || this))
    return mixinFun(originalPipe.call(this, into, opts), this[OPTS])
  }
  return obj
}

module.exports = FunStream

var FilterStream = require('./filter-stream.js')
var MapStream = require('./map-stream.js')
var ReduceStream = require('./reduce-stream.js')
var ForEachStream = require('./for-each-stream.js')
var fun = require('./index.js')
