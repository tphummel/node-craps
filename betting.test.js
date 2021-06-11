'use strict'

const tap = require('tap')
const lib = require('./betting.js')

tap.test('minPassLineOnly', function (t) {
  const rules = {
    minBet: 5,
    maxOddsMultiple: {
      4: 3,
      5: 4,
      6: 5,
      8: 5,
      9: 4,
      10: 3
    }
  }

  const { bets: bets1 } = lib.minPassLineOnly({ rules })
  t.equal(bets1.passLine.amount, rules.minBet)

  const { bets: bets2 } = lib.minPassLineOnly({ rules, bets: bets1 })
  t.equal(bets2.passLine.amount, rules.minBet)

  t.end()
})
