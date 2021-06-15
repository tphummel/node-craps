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

tap.test('all', (t) => {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand = {
    result: 'point win'
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.payout.total, 10)
  t.equal(settled.payout.principal, 5)
  t.equal(settled.payout.profit, 5)

  t.end()
})
