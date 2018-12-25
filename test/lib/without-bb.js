'use strict'
const fun = require('../..')
process.noBB = true
fun.Promise = Promise
/* eslint-disable security/detect-non-literal-require */
require(process.cwd() + '/' + process.argv[2])
