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
