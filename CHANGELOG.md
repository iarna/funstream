# 4.2.0

* Add `stream.fun.writable()` to get a promisey way of asserting a stream is ready for data
* Add `stream.toJson()` which takes a series of objects and emits them as a JSON stringified array.
* Add `stream.toNdjson()` which takes a series of objects and emits them as new-line delimited JSON.
* Add `stream.fromJson()` which is the same as `stream.json()`
* Add `stream.fromNdjson()` which is the same as `stream.ndjson()`
* Fixed `fun.finished` and `fun.ended`, which previously would refuse to run.

# 4.1.1

* Fix `stream.lines()` (and in turn `stream.ndjson()`) to support CRLF terminated lines.
* Fix a bug where if multiple chunks were emitted without newlines end them and then the stream closed, they would be emitted with newlines injected between them (but as a single "line").

# 4.1.0

* Add support for `stream.lines()` to split the stream on lines and emit one line at a time.
* Add support for `stream.ndjson()` to parse the stream as newline delimited JSON and emit one object at a time.

# 4.0.0

* Our recently introduced closed/finished/ended methods stomped on some stream implementation's use of them
  as properties. Change the API to put them in a safer place.

# 3.2.0

* Fix crash when a stream object's pipe method was readonly. (For example, with minipass.)
* Improve stream ducktyping to support minipass based streams.
* Fix error in reduceTo family of functions when promise returning reductions, where we were running
  all the reductions in parallel rather than waiting for them to complete individually.
* Guard against crashes when promises are rejected with null/undefined values.
* Improve error messaging on invalid arguments.
* Add support for `fun(123n)` working like `fun(123)`

# 3.1.0

* Fix bug where, when mixing in promise-streams (when upgrading a regular
  stream to a funstream), the provision of ended versus finished methods was
  swapped.
* Add support for async generators (thank you Node 10!!)
* Add `stream.mutate()`, which acts like `stream.map()` but doesn't do anything with the return value of the
  callback. `stream.mutate(_ => { ... })` is equiv of `stream.map(_ => { ...; return _})`
* Add `stream.collect()` as an alias for `stream.list()`
* Add `fun.with(cb)` constructor that passes the callback a stream that's ended when the promise
  returned by the callback is resolved. This makes manual writing to a stream far more convenient.
* Add `stream.json()` convenience method, equiv of `stream.concat().then(_ => JSON.parse(_))`
* Fix error propagation in `stream.reduce()`.
* Guard iterator/thenable type checking when given symbols. This would
  caused a crash if you constructed a funstream from a Symbol.  Weird, but
  shouldn't crash.

# 3.0.0

I'm doing a 3.0.0 to backout the feature added in 2.3.0 where Readable
streams were thenable.

This turns out to be very unfun.  Specifically it means that async functions
can't return fun-streams, something I very much want to do.

Because it's still sometimes nice to get a promise in these circumstances,
you can ask for one with a few ways:

`.finished()` is available on writable and duplex streams and resolves when the stream
emits `finish`.  Is is a no-op on writable streams, as they already are a
promise that resolves when the stream emits `finish`.

`.ended()` is available on readable and duplex streams and resolves when the
stream emits `end`.

`.closed()` is available on writable and duplex streams and resolves when the
stream emits `close`.  Note that not all streams emit `close` and if this is
one of those then the promise will never resolve.

# 2.6.1

* Revert: Patch to preserve funopts confuses itself.

# 2.6.0

* Feature: Lazily convert promises to streams.  If you funify a promise and
  use as a promise, no stream infrastructure will be created.  (This is
  important for promise-returning fun functions.)
* Feature: Funify writable promise-streams as if they were promises.  This
  means that if they a value that value will be preserved, and that means
  that `fun().reduce().forEach()` will work, for instance.
* Feature: `forEach` on array-streams now has a synchronous fast-path
  implementation, where we ignore the stream entirely and just loop over the
  in memory array.
* Tests: Many, MANY, were added. A number of files are at 100% coverage now.
* Fix: Async reduce streams previously would finish early and given incomplete results.
* Fix: The async reduceTo impelementation previously did not work at all.
* Fix: Reduce streams weren't copying along options from their parents.
  This only matters if you chain off of them as a fun-stream and not a
  promise.
* Fix: `.concat()` will now work with streams w/ elements that can't be added to strings. (eg, Symbols)
* Fix: If you pass an existing readable fun-stream to fun we used to just
  return it.  We still do that if you provide the same options as the
  fun-stream, if you didn't we pipe into a new one with your options.
* Fix: `.grab()` now returns a promise-stream.
* Fix: Sugar like `.concat()` would previously fail if you'd explictly set the mode to `.async()`. This is now fixed.

# 2.5.1

* Readme improvements

# 2.5.0

* Strings can now be fun too.
* Also Buffers.
* Improve stream duck typing
* Really, truely, all things are _also_ promises now.

# 2.4.0

* Add pipe-chain bundling in the form of `fun(stream => stream.pipe.chain)`.

# 2.3.2

* Fix async flatMap

# 2.3.1

* Eep actually include flat-map-stream in the artifact

# 2.3.0

New features!

* All streams are promises: `fun(mystream).then(…)` will wait wait for your
  stream to `end` in the case of read streams or `finish` in the case of
  write and duplex streams.
  There's no overhead to this: No promise is constructed if you don't call
  a promise method on the resulting objects.
  If you want a Bluebird (or other, non-native) promise implementation you
  can pass one in as an option `fun(mystream, {Promise: require('bluebird'})`
* flat: emit each object of an array as a new element of the stream
* flatMap: transform the input and apply flat as above to the output
* list: sugar for turning the stream into an array
* grab: opperate on the entire stream as an array while still chaining back
  into a stream
* concat: returns the entire stream as a single string

Improvements!

* forEach: sync calls have a fast-path now
* All module loading that can be lazy, now is lazy, for faster loads and
  less memory use.

Bug fixes!

* The async stream reducer was entirely broken. Now fixed.


# 2.2.0

* Writable streams are now fun!  Fun a writable stream and get a
  promise/stream hybrid.  The promise part will resolve when the stream
  finishes, or rejects when it errors.  The stream part is still a perfectly
  ordinary write stream with all the usual features.
* Errors aren't fun, but they now at least cop to who was to blame for them in `error.src`.
* Generators can be fun! Fun a generator to get a fun stream of values.

* Bug fix: `forEach` fun now gets option choices and those your choice of promises.
* More symbols are more fun. isFun property is now Symbol(ISFUN) and no longer polutes your namespaces.
