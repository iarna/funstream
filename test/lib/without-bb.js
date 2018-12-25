'use strict'
const fun = require('../..')
process.nobb = true
fun.Promise = Promise
require(process.cwd() + '/' + process.argv[2])
