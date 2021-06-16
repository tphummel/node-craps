'use strict'

const tap = require('tap')
const lib = require('./betting.js')

tap.test('minPassLineOnly: no bets yet, coming out', function (t) {
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

  const hand = {
    isComeOut: true
  }

  const updatedBets = lib.minPassLineOnly({ rules, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet)
  t.equal(updatedBets.new, 5)

  t.end()
})

tap.test('minPassLineOnly: bet exists, coming out', (t) => {
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

  const hand = {
    isComeOut: true
  }

  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: false
      }
    }
  }

  const updatedBets = lib.minPassLineOnly({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet)
  t.notOk(updatedBets.pass.line.isContract)
  t.notOk(updatedBets.new)

  t.end()
})

tap.test('minPassLineOnly: bet exists, point set', (t) => {
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

  const hand = {
    isComeOut: false,
    point: 6
  }

  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const updatedBets = lib.minPassLineOnly({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet)
  t.ok(updatedBets.pass.line.isContract)
  t.notOk(updatedBets.new)

  t.end()
})
