# funstream

Funstream gives you iteratorish methods on your streams.

```js
const fun = require('funstream')

fun(boringStream)
  .map(n => n + 1)
  .filter(n => n % 2)
  .map(n => `${n}\n`)
  .pipe(process.stdout)
// prints lines with 3 and 5
fun(boringStream)
  .map(n => n + 1)
  .filter(n => n % 2)
  .reduce((a, b) => a + b)
  .then(console.log)
// prints 8

// `fun()` takes all sorts of arguments…
// readable streams…
fun(process.stdin)
// Promised streams…
fun(fetch('https://example.com').then(r => r.body))
// generators…
function * mygen () {
  for (let ii = 0; ii < 10000; ++ii) {
    yield ii
  }
}
fun(mygen())
// arrays
fun([1, 2, 3, 4])
// writable streams are promises
fun(writestream)
  .then(() => console.log('finished!'))
  .catch(err => console.error('stream error', err)
// writable streams are streams AND promises
process.stdin.pipe(fun(writestream))
  .then(() => console.log('done!'))

// If you're not so keen on mutating things, why not try piping into a piping hot fun stream?
process.stdin.pipe(fun())
  .map(str => transformStr(str))
  .pipe(process.stdout)

// Fun functions can be sync…
.map(str => str.slice(10))

// Fun functions can be async…
.map(async str => (await transformStr(str)).slice(10))

// Fun functions can be promise returning…
.map(str => transformStr(str))

// Fun functions can be callback using…
.async().map((str, cb) => transformStrCB(str, cb))

// And you can bundle up some transforms into a transform stream:
const mytransformStream =
  fun(stream => stream.map(str => str.toUpperCase).
                       flatMap(v = [v, v]))

```

Funstream makes object streams better.

## Funstream constructors

### fun(readableStream[, opts]) → FunStream

This is probably what you want.

Makes an existing stream a funstream!  Has the advantage over `fun()` of
handling error propagation for you.  All funs are promises of their
completion too, so you can `await` or `.catch` your stream.

`opts` is an optional options object.  The only option currently is `async`
which let's you explicitly tell Funstream if your callbacks are sync or
async. If you don't include this we'll detect which you're using by looking
at the number of arguments your callback takes. Because promises and sync functions
take the same number of arguments, if you're using promise returning callbacks you'll need to
explicitly pass in `async: true`.

### fun(callback[, opts]) → FunStream

This lets you bundle a fun-stream pipeline up into a single transform stream
that you might pass to something else.  The callback receives a FunStream as
its only argument, chain off of that as you like and return the result.  The
stream returned by `fun()` will write to that first FunStream and read from
the end of your chain. (With the usual error propagation.)

### fun(writableStream[, opts]) → PromiseStream

Writable streams can't be fun per se, since being fun means having
iterators. What we can do is make them resolvable as promises, with an extra
feature or two.

### fun(array[,opts]) → FunStream

Returns a funstream that will receive entries from the array one at a time
while respecting back pressure.

### fun(string[,opts]) → FunStream

Returns a funstream that will receive entries from the array one at a time
while respecting back pressure.

### fun(generator[,opts]) → FunStream

Returns a funstream that will receive values from the generator one at a time
while respecting back pressure.

### fun(promise[,opts]) → FunStream

Returns a funstream that will consume the result of the promise exactly as
the equivalent plain value would be.  No data will be emitted until the promise
resolves. If it rejects it will be propagated as an error in the usual ways.

These are special, because the returned object only lazily becomes a stream. If you
treat it as a promise then no stream construction occurs.

### fun([opts]) → FunStream

Make a passthrough Funstream.  You can pipe into this to get access to our
handy methods.

### fun.with(todo[, opts]) → FunStream

For those times when you want to create a stream from nothing, or at least,
from a non-stream source, `fun.with` provides any easy interface for doing
that.

Pass it a function and you'll get a stream you can write to.  You can close
it off by just resolving your promise which is particularly convenient when
your function is declared `async`.

Constructs a passthrough funstream and passes it as an argument to `todo`.
`todo` is a function that returns a `Promise`. When the `Promise` resolves the
stream will end.

```js
let a
let b = fun.with(async st => { a = st })
a === b // true
```
```js
const result = await fun.with(st => {
  let count = 0
  return new Promise(function each (resolve) {
    if (++count === 5) return resolve()
    st.write(count)
    setTimeout(each, 100, resolve)
  })
}).list() // [ 0, 1, 2, 3, 4 ]
```


### fun.FunStream

Exactly the same as `stream.PassThrough` but with fun added.  `fun()` is
mostly the same as `new fun.FunStream()`.  (The former will use Bluebird for
promises if available but fallback to system promises.  The latter has no
magic and just uses system promises.)

### require('funstream/fun-stream').mixin

The core extension mechanism (otherwise unneeded).  It adds fun to an
existing class or object. Classes that have fun mixed in need to also call
`FunPassThrough.funInit.call(this, opts)` in their constructors.

## Funstream and Pipelines

Contrary to ordinary, BORING streams, we make sure errors are passed along
when we chain into something.  This applies when you `.map` or `.filter` but
it ALSO applies when you `.pipe`.

## PromiseStream methods

### .finished() → Promise

Available on Writable promise streams, the returned Promise will resolved
when the stream emits a `finish` event.  The promise will be rejected if the
stream emits an `error` event.

If the stream emits a `result` event then the stream will resolve with that
value.

### .closed() → Promise

Available on Writable promise streams, the returned Promise will resolved
when the stream emits a `close` event.  The promise will be rejected if the
stream emits an `error` event.

NOTE: Not all streams emit a `close` event and if you use this on a stream
that does not then it will never resolve.

## FunStream methods

This is the good stuff.  All callbacks can be sync or async.  You can
indicate this by setting the `async` property on the opts object either when
calling the method below or when constructing the objects to start with.
Values of the `async` property propagate down the chain, for example:

`.map(…, {async: true}).map(…)`

The second map callback will also be assume do to be async.

Multiple sync functions of the same time will be automatically aggregated
without constructing additional streams, so:

`.filter(n => n < 23).filter(n => n > 5)`

The second `filter` call actually returns the same stream object.  This does
mean that if you try to fork the streams in between it won't work. Sorry.

### .async() → this
### .sync() → this

Sets the stream `async` stream option to true and false respectively.

### .async(todo) → FunStream
### .sync(todo) → FunStream

Runs `todo` with a stream with the appropriate `async` option set.  The
returned value is restored to the previous setting.

```
fun([1,2,3])
  .filter(async n => n > 0)
  .sync(str => str.filter(n => n < 3).map(n => n * 2))
```

### .ended() → Promise

Returns a Promise that resolves when the stream emits an `end` event.  If
the stream emits an `error` event then it will reject.

### .pipe(target[, opts]) → FunStream(target)

Like an ordinary pipe, but funerer.  In addition mutating the target into a
funstream we also forward errors to it.

### .head(numberOfItems) → FunStream

Will only forward the first `numberOfItems` down stream.  The remainder are
ignored.  At the moment this does not end the stream after the
`numberOfItems` limit is hit, but in future it likely will.

```js
fun(stream)
  .head(5)
  .forEach(item => { // only sees the first five items regardless of how long the stream is.
  })
```

### .filter(filterWith[, opts]) → FunStream

Filter the stream! 

* `filterWith(data) → Boolean` (can throw)
* `filterWith(data, cb)` (and `cb(err, shouldInclude)`)
* `filterWith(data) → Promise(Boolean)

If `filterWith` returns true, we include the value in the output stream,
otherwise not.

### .map(mapWith[, opts]) → FunStream

Transform the stream! 

* `mapWith(data) → newData` (can throw)
* `mapWith(data, cb)` (and `cb(err, newData)`)
* `mapWith(data) → Promise(newData)

`data` is replaced with `newData` from `mapWith` in the output stream.

### .mutate(mutateWith[, opts]) → FunStream

`stream.mutate(data => {…})` is sugar for `stream.map(data => {…; return data})`

### .flat([, opts]) → FunStream

Flattens arrays in the streams into object emissions! That is to say, a stream of two objects:

```js
[1, 2, 3], [23, 42, 57]
```

Will become a stream of six objects:

```js
1, 2, 3, 23, 42, 57
```

This is implemented as `flatMap(v => v, opts)`

### .flatMap([, opts]) → FunStream

Transform all the stream elements and flatten any return values.  This is
the equivalent of:

```js
map(…).flat()
```

Only without multiple phases.

### .sort(sortWith, opts) → FunStream

WARNING: This has to load all of your content into memory in order to sort
it, so be sure to do your filtering or limiting (with `.head`) before you
call this. This results in a funstream fed from the sorted array.

`sortWith(a, b) → -1 | 0 | 1` – It's the usual sort comparison function.  It
must be synchronous as it's ultimately passed to `Array.sort`.

Sort a stream alphabetically:

```js
fun(stream)
  .sort((a, b) => a.localeCompare(b))
```

### .grab(grabWith, opts) → FunStream

WARNING: This has to load all of your content into memory in order to sort
it, so be sure to do your filtering or limiting (with `.head`) before you
call this. This results in a funstream fed from the sorted array.

`grabWith` is a synchronous function. It takes an array as an argument and
turns the return value back into a stream with `fun()`. The array
is produced by reading the entire stream, so be warned.

For example, sort can be implemented as:

```js
function sortStream (st) {
  return st.grab(v => v.sort(sortWith))
}
```

It makes it easy to apply array verbs to a stream that aren't otherwise
supported but it does mean loading the entire stream into memory.

It's the equivalent of `fun(grabWith(await stream.list()))`

### .list(opts) → FunStream

Alias: `.collect(opts)`

Promise an array of all of the values in the stream. Let's you do things like…

```js
const data = await fun().map(…).filter(…).list()
```


It's just sugar for: `reduceToArray((acc, val) => acc.push(val), opts)`

### .concat(opts) → FunStream

Promise a string produced by concatenating all of the values in the stream.

### .json(opts) → FunStream

Promise an object produced by JSON parsing the result of `.concat()`. Sugar for:

```js
stream.concat().then(str => JSON.parse(str))
```

### .reduce(reduceWith[, initial[, opts]]) → FunStream

Promise the result of computing everything.

* `reduceWith(acc, value) → acc` (can throw)
* `reduceWith(acc, value, cb)` (and `cb(err, acc)`)
* `reduceWith(acc, value) → Promise(acc)

Concat a stream:
```js
fun(stream)
  .reduce((acc, value) => acc + value)
  .then(wholeThing => { … })
```

The return value is _also_ a stream, so you can hang the usual event
listeners off it.  Reduce streams emit a `result` event just before
`finish` with the final value of the accumulator in the reduce.

### .reduceToArray(reduceWith, opts) → FunStream

Promise the result of reducing into an array.  Handy when you want to push
on to an array without worrying about your return value. This is sugar for:

```js
fun(stream)
  .reduce((acc, value) => { reduceWith(acc, value) ; return acc }, [])
```

### .reduceToArray(reduceWith, opts) → FunStream

Promise the result of reducing into an array. Handy when you want to build
an object without worrying about your return values. This is sugar for:

```js
fun(stream)
  .reduce((acc, value) => { reduceWith(acc, value) ; return acc }, {})
```

### .forEach(consumeWith[, opts]) → PromiseStream

Run some code for every chunk, promise that the stream is done.

Example, print each line:
```js
fun(stream)
  .forEach(chunk => console.log(chunk)
  .then(() => console.log('Done!'))
```

As with reduce streams the return value from `forEach` is  both a promise
and a stream.

## Benchmarks

<table>
<tr><th>map: fun sync</th><td>565 ops/s</td></tr>
<tr><th>map: fun async (cb)</th><td>454 ops/s</td></tr>
<tr><th>map: stream.Transform</th><td>403 ops/s</td></tr>
<tr><th>map: through2</th><td>311 ops/s</td></tr>
<tr><th>map: fun async (async/await)</th><td>304 ops/s</td></tr>
<tr><th>map: fun async (new Promise)</th><td>237</td></tr>
</table>
