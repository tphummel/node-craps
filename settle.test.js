'use strict'

const tap = require('tap')
const settle = require('./settle.js')

tap.test('passLine: comeout win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'comeout win'
  }

  const result = settle.passLine({ hand, bets })
  t.equal(result.payout.type, 'comeout win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon comeout win')

  t.end()
})

tap.test('passLine: comeout loss', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'comeout loss'
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout, 'no payout on a comeout loss')
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon comeout loss')

  t.end()
})

tap.test('passLine: point win', function (t) {
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
  t.equal(result.payout.type, 'point win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon point win')

  t.end()
})

tap.test('passLine: point loss', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand = {
    result: 'seven out'
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout, 'no payout on seven out')
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon seven out')

  t.end()
})

tap.test('passLine: no bet', function (t) {
  const bets = {}

  const hand = {
    result: 'point win'
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout)
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
  t.notOk(result.payout)
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
