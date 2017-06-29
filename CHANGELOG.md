
# 2.2.0

* Writable streams are now fun!  Fun a writable stream and get a
  promise/stream hybrid.  The promise part will resolve when the stream
  finishes, or rejects when it errors.  The stream part is still a perfectly
  ordinary write stream with all the usual features.
* Errors aren't fun, but they now at least cop to who was to blame for them in `error.src`.
* Generators can be fun! Fun a generator to get a fun stream of values.

* Bug fix: `forEach` fun now gets option choices and those your choice of promises.
* More symbols are more fun. isFun property is now Symbol(ISFUN) and no longer polutes your namespaces.
