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
  tream to `end` in the case of read streams or `finish` in the case of
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
