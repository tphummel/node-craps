'use strict'

const tap = require('tap')
const settle = require('./settle.js')

tap.test('passLine: win', function (t) {
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

  const result = settle.passLine({ hand, bets })
  t.equal(result.principal, 5)
  t.equal(result.profit, 5)

  t.end()
})

tap.test('passLine: no bet', function (t) {
  const bets = {}

  const hand = {
    result: 'point win'
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result)
  t.end()
})

tap.test('passLine: bet, no win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand = {
    result: 'neutral'
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result)
  t.end()
})

tap.test('all: pass line win', (t) => {
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

  t.equal(settled.payouts.total, 10)
  t.equal(settled.payouts.principal, 5)
  t.equal(settled.payouts.profit, 5)

  t.end()
})
