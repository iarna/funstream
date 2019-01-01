'use strict'
const fun = require('./index.js')
const mixinPromiseStream = require('./mixin-promise-stream.js')
const is = require('isa-stream')
let FilterStream
let MapStream
let MutateStream
let FlatMapStream
let ReduceStream
let ForEachStream

const OPTS = Symbol('opts')
const ISFUN = Symbol('isFun')
const PROMISES = Symbol('promises')
const RESULT = Symbol('result')
const PIPE = Symbol('pipe')
class FunStream {
  init (opts) {
    this[OPTS] = Object.assign({Promise: Promise}, opts || {})
    this[ISFUN] = true
    this[PROMISES] = {}
    this[RESULT] = null
    this.fun = { ended: this.fun$ended, finished: this.fun$finished }
  }
  fun$ended () {
    if (!is.Readable(this)) throw new TypeError('This stream is not a readable stream, it will not end. Try `.finished()` instead.')
    if (this[PROMISES].ended) return this[PROMISES].ended
    return this[PROMISES].ended = new this[OPTS].Promise((resolve, reject) => {
      this.once('error', reject)
      this.once('end', () => setImmediate(resolve, this[RESULT]))
    })
  }
  fun$finished () {
    if (!is.Writable(this)) throw new TypeError('This stream is not a writable stream, it will not finish. Try `.ended()` instead.')
    if (this[PROMISES].finished) return this[PROMISES].finished
    return this[PROMISES].finished = new this[OPTS].Promise((resolve, reject) => {
      this.once('error', reject)
      this.once('finish', () => setImmediate(resolve, this[RESULT]))
    })
  }
  fun$closed () {
    if (!is.Writable(this)) throw new TypeError('This stream is not a writable stream, it will not close. Try `.ended()` instead.')
    if (this[PROMISES].closed) return this[PROMISES].closed
    return this[PROMISES].closed = new this[OPTS].Promise((resolve, reject) => {
      this.once('error', reject)
      this.once('close', resolve)
    })
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
  mutate (mutateWith, opts) {
    if (!MutateStream) MutateStream = require('./mutate-stream.js')
    const mutate = MutateStream(mutateWith, opts ? Object.assign(this[OPTS], opts) : this[OPTS])
    return this.pipe(mutate)
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
          const result = reduceWith(acc, value, err => err ? reject(err) : resolve(acc))
          if (result && result.then) result.then(() => resolve(acc), reject)
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
    return this.sync(o => o.reduce((acc, val) => acc + String(val), '', opts))
  }
  json (opts) {
    return this.concat().then(str => JSON.parse(str))
  }
  forEach (forEachWith, forEachOpts) {
    if (!ForEachStream) ForEachStream = require('./for-each-stream.js')
    const opts = Object.assign({}, this[OPTS], forEachOpts || {})
    return this.pipe(ForEachStream(forEachWith, opts))
  }
  pipe (into, opts) {
    this.on('error', err => {
      if (err && err.src === undefined) err.src = this
      into.emit('error', err)
    })
    const funified = fun(this[PIPE](into, opts), this[OPTS], opts && opts.what)
    return funified
  }
}

// collect (opts) is an alias of list
FunStream.prototype.collect = FunStream.prototype.list
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

  const cls = typeof stream === 'function' ? stream : null
  !cls && mixinPromiseStream(stream, Object.assign({Promise: fun.Promise}, opts || {}))
  const obj = cls ? cls.prototype : stream

  if (cls) {
    cls.isFun = FunStream.isFun
    cls.mixin = FunStream.mixin
    cls.isAsync = FunStream.isAsync
    cls.funInit = FunStream.funInit
  } else {
    FunStream.funInit.call(obj, opts)
  }

  if (is.Writable(obj)) {
    if (!cls || !obj.fun$finished) obj.fun$finished = FunStream.prototype.fun$finished
    if (!cls || !obj.fun$closed) obj.fun$closed = FunStream.prototype.fun$closed
  }
  if (is.Readable(obj)) {
    if (!cls || !obj.fun$ended) obj.fun$ended = FunStream.prototype.fun$ended
  }
  if (!cls || !obj.filter) obj.filter = FunStream.prototype.filter
  if (!cls || !obj.map) obj.map = FunStream.prototype.map
  if (!cls || !obj.mutate) obj.mutate = FunStream.prototype.mutate
  if (!cls || !obj.flat) obj.flat = FunStream.prototype.flat
  if (!cls || !obj.flatMap) obj.flatMap = FunStream.prototype.flatMap
  if (!cls || !obj.head) obj.head = FunStream.prototype.head
  if (!cls || !obj.reduce) obj.reduce = FunStream.prototype.reduce
  if (!cls || !obj.reduceTo) obj.reduceTo = FunStream.prototype.reduceTo
  if (!cls || !obj.reduceToArray) obj.reduceToArray = FunStream.prototype.reduceToArray
  if (!cls || !obj.reduceToObject) obj.reduceToObject = FunStream.prototype.reduceToObject
  if (!cls || !obj.concat) obj.concat = FunStream.prototype.concat
  if (!cls || !obj.json) obj.json = FunStream.prototype.json
  if (!cls || !obj.list) obj.list = FunStream.prototype.list
  if (!cls || !obj.collect) obj.collect = FunStream.prototype.collect
  if (!cls || !obj.grab) obj.grab = FunStream.prototype.grab
  if (!cls || !obj.sort) obj.sort = FunStream.prototype.sort
  if (!cls || !obj.forEach) obj.forEach = FunStream.prototype.forEach
  if (!cls || !obj.sync) obj.sync = FunStream.prototype.sync
  if (!cls || !obj.async) obj.async = FunStream.prototype.async

  obj[PIPE] = obj.pipe
  Object.defineProperty(obj, 'pipe', {
    value: FunStream.prototype.pipe,
    writable: true
  })
  return obj
}
module.exports = FunStream
