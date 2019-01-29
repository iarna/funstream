'use strict'
const FunTransform = require('./fun-transform.js')

class LineStream extends FunTransform {
  constructor (filterWith, opts) {
    super(opts)
    // as an array, not a string, to let data chunks be Strings or Buffers
    this.buffer = []
  }
  _transform (data, encoding, next) {
    let lastIndex = 0
    let newlineLoc = data.indexOf('\n')
    if (newlineLoc === -1) {
      this.buffer.push(data)
      return next()
    }
    while (newlineLoc !== -1) {
      let chunk = data.slice(lastIndex, newlineLoc)
      if (this.buffer.length > 0) {
        this.push(this.buffer.join('') + chunk)
        this.buffer = []
      } else {
        this.push(chunk)
      }
      lastIndex = newlineLoc + 1
      newlineLoc = data.indexOf('\n', lastIndex)
    }
    if (lastIndex < data.length) this.buffer = [data.slice(lastIndex)]
    next()
  }
  _flush (next) {
    if (this.buffer.length > 0) this.push(this.buffer.join(''))
    this.buffer = null
    next()
  }
}

module.exports = LineStream
