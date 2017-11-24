'use strict'
const fun = require('./index.js')
const OPTS = Symbol('opts')
const ISFUN = Symbol('isFun')
const mixinPromiseStream = require('./mixin-promise-stream.js')
let FilterStream
let MapStream
let FlatMapStream
let ReduceStream
let ForEachStream

class FunStream {
  init (opts) {
    this[OPTS] = Object.assign({Promise: Promise}, opts || {})
    this[ISFUN] = true
    mixinPromiseStream(this[OPTS].Promise, this)
  }
  async (todo) {
    if (todo) {
      const value = this[OPTS].async
      this[OPTS].async = true
      const next = todo.call(this, this)
      next[OPTS].async = value
      return next
    } else {
      this[OPTS].async = true
      return this
    }
  }
  sync (todo) {
    if (todo) {
      const value = this[OPTS].async
      this[OPTS].async = false
      const next = todo.call(this, this)
      next[OPTS].async = value
      return next
    } else {
      this[OPTS].async = false
      return this
    }
  }
  pipe (into, opts) {
    this.on('error', err => {
      if (err.src === undefined) err.src = this
      into.emit('error', err)
    })
    return fun(super.pipe(into, opts), this[OPTS])
  }
  filter (filterWith, opts) {
    if (!FilterStream) FilterStream = require('./filter-stream.js')
    const filter = FilterStream(filterWith, opts ? Object.assign(this[OPTS], opts) : this[OPTS])
    return this.pipe(filter)
  }
  map (mapWith, opts) {
    if (!MapStream) MapStream = require('./map-stream.js')
    const map = MapStream(mapWith, opts ? Object.assign(this[OPTS], opts) : this[OPTS])
    return this.pipe(map)
  }
  flat (opts) {
    return this.sync(o => o.flatMap(v => v, opts))
  }
  flatMap (mapWith, opts) {
    if (!FlatMapStream) FlatMapStream = require('./flat-map-stream.js')
    const map = FlatMapStream(mapWith, opts ? Object.assign(this[OPTS], opts) : this[OPTS])
    return this.pipe(map)
  }
  head (maxoutput) {
    let seen = 0
    return this.sync(o => o.filter(() => seen++ < maxoutput))
  }
  reduce (reduceWith, initial, reduceOpts) {
    if (!ReduceStream) ReduceStream = require('./reduce-stream.js')
    const opts = Object.assign({}, this[OPTS], reduceOpts || {})
    return this.pipe(ReduceStream(reduceWith, initial, opts))
  }
  reduceTo (reduceWith, initial, reduceOpts) {
    const opts = Object.assign({}, this[OPTS], reduceOpts || {})
    let reduceToWith
    if (isAsync(reduceWith, 2, opts)) {
      reduceToWith = (acc, value, cb) => {
        return new opts.Promise((resolve, reject) => {
          const result = reduceWith(acc, value, err => err ? reject(err) : resolve())
          if (result && result.then) resolve(result)
        })
      }
    } else {
      /* eslint no-sequences:0 */
      reduceToWith = (acc, value) => (reduceWith(acc, value), acc)
    }
    return this.reduce(reduceToWith, initial, opts)
  }
  reduceToObject (reduceWith, opts) {
    return this.reduceTo(reduceWith, {}, opts)
  }
  reduceToArray (reduceWith, opts) {
    return this.reduceTo(reduceWith, [], opts)
  }
  list (opts) {
    return this.sync(o => o.reduceToArray((acc, val) => acc.push(val), opts))
  }
  grab (whenDone, opts) {
    return fun(this.list().then(v => whenDone(v)))
  }
  sort (sortWith, opts) {
    return this.grab(v => v.sort(sortWith))
  }
  concat (opts) {
    return this.sync(o => o.reduce((acc, val) => acc + val, '', opts))
  }
  forEach (forEachWith, forEachOpts) {
    if (!ForEachStream) ForEachStream = require('./for-each-stream.js')
    const opts = Object.assign({}, this[OPTS], forEachOpts || {})
    return this.pipe(ForEachStream(forEachWith, opts))
  }
}

FunStream.isFun = stream => Boolean(stream && stream[ISFUN])
FunStream.mixin = mixinFun
FunStream.isAsync = isAsync
FunStream.funInit = function () {
  const fn = this.init ? this.init
           : this.prototype && this.prototype.init ? this.prototype.init
           : FunStream.prototype.init
  return fn.apply(this, arguments)
}

FunStream.OPTS = OPTS

function isAsync (fun, args, opts) {
  if (fun.constructor.name === 'AsyncFunction') return true
  if (opts && opts.async != null) return opts.async
  return fun.length > args
}

function mixinFun (stream, opts) {
  if (FunStream.isFun(stream)) return stream

  const P = (opts && opts.Promise) || fun.Promise

  const cls = typeof stream === 'function' ? stream : null
  !cls && mixinPromiseStream(P, stream)
  const obj = cls ? cls.prototype : stream

  if (cls) {
    cls.isFun = FunStream.isFun
    cls.mixin = FunStream.mixin
    cls.isAsync = FunStream.isAsync
    cls.funInit = FunStream.funInit
  } else {
    FunStream.funInit.call(obj, opts)
  }

  obj.filter = FunStream.prototype.filter
  obj.map = FunStream.prototype.map
  obj.flat = FunStream.prototype.flat
  obj.flatMap = FunStream.prototype.flatMap
  obj.head = FunStream.prototype.head
  obj.reduce = FunStream.prototype.reduce
  obj.reduceTo = FunStream.prototype.reduceTo
  obj.reduceToArray = FunStream.prototype.reduceToArray
  obj.reduceToObject = FunStream.prototype.reduceToObject
  obj.concat = FunStream.prototype.concat
  obj.list = FunStream.prototype.list
  obj.grab = FunStream.prototype.grab
  obj.sort = FunStream.prototype.sort
  obj.forEach = FunStream.prototype.forEach
  obj.sync = FunStream.prototype.sync
  obj.async = FunStream.prototype.async

  const originalPipe = obj.pipe
  obj.pipe = function (into, opts) {
    this.on('error', err => {
      if (err.src === undefined) err.src = this
      into.emit('error', err)
    })
    return fun(originalPipe.call(this, into, opts), this[OPTS])
  }
  return obj
}
module.exports = FunStream

