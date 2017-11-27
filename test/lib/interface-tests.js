'use strict'
exports.streamTests = streamTests
exports.promiseTests = promiseTests

const FunStream = require('../..').FunStream
const PassThrough = require('stream').PassThrough
const qw = require('qw')

const testCases = qw`
  filter map flat flatMap reduceToObject reduceToArray reduce reduceTo list
  grab sort concat`

function streamTests (test, create, results) {
  test('stream', t => {
    t.test('pipe', t => {
      const target = new PassThrough({objectMode: true})
      const testcase = create().pipe(target)
      return streamContent(testcase).then(content => {
        t.is(Boolean(target.then), true, 'target stream was promisified')
        t.is(Boolean(FunStream.isFun(target)), true, 'target stream was funified')
        t.isDeeply(content, results.pipe.expected, 'target stream content is correct')
      })
    })
    t.test('head', t => {
      const testcase = create().head(2)
      return streamContent(testcase).then(content => {
        t.isDeeply(content, results.head.expected, 'target stream content is correct')
      })
    })
    t.test('forEach (sync)', t => {
      const calledWith = []
      return create().forEach(v => {
        calledWith.push(v)
      }).then(() => {
        t.isDeeply(calledWith, results.forEach.expected, 'foreach was called with each value')
      })
    })
    t.test('forEach (async)', t => {
      const calledWith = []
      return create().forEach((v, cb) => {
        calledWith.push(v)
        cb()
      }).then(() => {
        t.isDeeply(calledWith, results.forEach.expected, 'foreach was called with each value')
      })
    })

    runTestGroup('sync', g => {
      testCases.forEach(fn => g.maybe(fn, t => {
        const createWith = results[fn].create || create
        let args = results[fn].with || []
        if (typeof args === 'function') args = args()
        const stream = createWith()
        const testcase = stream[fn].apply(stream, args)
        return streamContent(testcase).then(content => {
          t.isDeeply(content, results[fn].expected, `${fn}: stream ok`)
        })
      }))
    })

    runTestGroup('async', g => {
      testCases.forEach(fn => g.maybe(fn, t => {
        const createWith = results[fn].create || create
        let args
        if (results[fn].withAsync) {
          args = results[fn].withAsync
          if (typeof args === 'function') args = args()
        } else {
          args = results[fn].with || []
          if (typeof args === 'function') args = args()
          if (typeof args[0] === 'function') {
            const tw = args[0]
            // our wrappers have to have an arity to autodetect as async
            if (tw.length === 1) {
              args[0] = function (v, cb) {
                return cb(null, tw(v))
              }
            } else if (tw.length === 2) {
              args[0] = function (v1, v2, cb) {
                return cb(null, tw(v1, v2))
              }
            } else {
              throw new Error('Unsupported arity: ' + tw.length)
            }
          }
        }
        const stream = createWith()
        const testcase = stream[fn].apply(stream, args)
        return streamContent(testcase).then(content => {
          t.isDeeply(content, results[fn].expected, `${fn}: stream ok`)
        })
      }))
    })
    function runTestGroup (name, todo) {
      let tg = new TestGroup(name, results)
      t.test(name, t => {
        tg.setT(t)
        todo.call(tg, tg)
        return tg.done()
      })
    }
    t.done()
  })
}

function streamContent (stream) {
  return new Promise((resolve, reject) => {
    stream.on('error', reject)
    const content = []
    stream.on('data', v => content.push(v))
    stream.on('end', () => resolve(content))
  })
}

function promiseTests (test, create, results) {
  test('promise', t => {
    runTestGroup('sync', g => {
      testCases.forEach(fn => g.maybe(fn, t => {
        const createWith = results[fn].create || create
        let args = results[fn].with || []
        if (typeof args === 'function') args = args()
        const stream = createWith()
        const testcase = stream[fn].apply(stream, args)
        return testcase.then(content => {
          t.isDeeply(content, results[fn].expected, `${fn}: stream ok`)
        })
      }))
    })

    runTestGroup('async', g => {
      testCases.forEach(fn => g.maybe(fn, t => {
        const createWith = results[fn].create || create
        let args
        if (results[fn].withAsync) {
          args = results[fn].withAsync
          if (typeof args === 'function') args = args()
        } else {
          args = results[fn].with || []
          if (typeof args === 'function') args = args()
          if (typeof args[0] === 'function') {
            const tw = args[0]
            // our wrappers have to have an arity to autodetect as async
            if (tw.length === 1) {
              args[0] = function (v, cb) {
                return cb(null, tw(v))
              }
            } else if (tw.length === 2) {
              args[0] = function (v1, v2, cb) {
                return cb(null, tw(v1, v2))
              }
            } else {
              throw new Error('Unsupported arity: ' + tw.length)
            }
          }
        }
        const stream = createWith()
        const testcase = stream[fn].apply(stream, args)
        return testcase.then(content => {
          t.isDeeply(content, results[fn].expected, `${fn}: stream ok`)
        })
      }))
    })
    function runTestGroup (name, todo) {
      let tg = new TestGroup(name, results)
      t.test(name, t => {
        tg.setT(t)
        todo.call(tg, tg)
        return tg.done()
      })
    }
    t.done()
  })
}

class TestGroup {
  constructor (type, results) {
    this.type = type
    this.results = results
    this.waitingOn = []
    this.t = null
  }
  setT (t) {
    this.t = t
  }
  maybe (fn, todo) {
    const skip = this.type + 'Skip'
    if (!this.results[fn] || this.results[fn][skip]) {
      return
    }
    this.waitingOn.push(todo(this.t))
  }
  done () {
    return Promise.all(this.waitingOn)
  }
}
