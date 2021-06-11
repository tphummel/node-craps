'use strict'

const tap = require('tap')
const settle = require('./settle.js')

tap.test('passLine', function (t) {
  const passLineBet = {
    amount: 5
  }

  const result = settle.passLine(passLineBet)
  t.equal(result.total, 10)
  t.equal(result.principal, 5)
  t.equal(result.profit, 5)

  t.end()
})
