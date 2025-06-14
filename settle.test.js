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
    result: 'comeout win',
    diceSum: 7
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
    result: 'comeout loss',
    diceSum: 3
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
    result: 'point win',
    diceSum: 10
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
    result: 'seven out',
    diceSum: 7
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout, 'no payout on seven out')
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon seven out')

  t.end()
})

tap.test('passLine: no bet', function (t) {
  const bets = {}

  const hand = {
    result: 'point win',
    diceSum: 8
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
    result: 'neutral',
    diceSum: 11,
    point: 5
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout)
  t.end()
})

tap.test('passOdds: odds bet, no win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'neutral',
    isComeOut: false,
    point: 8,
    diceSum: 10
  }

  const result = settle.passOdds({ hand, bets })
  t.notOk(result.payout)
  t.strictSame(result.bets, bets, 'settled bets are same as initial bets')
  t.end()
})

tap.test('passOdds (4): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 15,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 4,
    diceSum: 4
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 15)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (5): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 20,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 5,
    diceSum: 5
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 20)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (6): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 6,
    diceSum: 6
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 25)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (8): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 8,
    diceSum: 8
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 25)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (9): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 20,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 9,
    diceSum: 9
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 20)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (10): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 15,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 10,
    diceSum: 10
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 15)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds: odds bet, seven out', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'seven out',
    isComeOut: true,
    point: 8,
    diceSum: 7
  }

  const result = settle.passOdds({ hand, bets })
  t.notOk(result.payout, 'no payout')
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('comeLine: come win on 7', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      isComeOut: true
    }
  }

  const hand = { diceSum: 7 }

  const result = settle.comeLine({ hand, bets })
  t.equal(result.payout.type, 'come win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.come)

  t.end()
})

tap.test('comeLine: craps 2', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      isComeOut: true
    }
  }

  const hand = { diceSum: 2 }

  const result = settle.comeLine({ hand, bets })
  t.notOk(result.payout)
  t.notOk(result.bets.come)

  t.end()
})

tap.test('comeLine: craps 3', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      isComeOut: true
    }
  }

  const hand = { diceSum: 3 }

  const result = settle.comeLine({ hand, bets })
  t.notOk(result.payout)
  t.notOk(result.bets.come)

  t.end()
})

tap.test('comeLine: craps 12', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      isComeOut: true
    }
  }

  const hand = { diceSum: 12 }

  const result = settle.comeLine({ hand, bets })
  t.notOk(result.payout)
  t.notOk(result.bets.come)

  t.end()
})

tap.test('comeLine: come win on 11', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      isComeOut: true
    }
  }

  const hand = { diceSum: 11 }

  const result = settle.comeLine({ hand, bets })
  t.equal(result.payout.type, 'come win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.come)

  t.end()
})

tap.test('comeLine: point win', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      isComeOut: false,
      point: 6
    }
  }

  const hand = { diceSum: 6 }

  const result = settle.comeLine({ hand, bets })
  t.equal(result.payout.type, 'come win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.come)

  t.end()
})

tap.test('comeOdds: odds bet, win', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      odds: { amount: 10 },
      isComeOut: false,
      point: 4
    }
  }

  const hand = { diceSum: 4 }

  const result = settle.comeOdds({ hand, bets })
  t.equal(result.payout.type, 'come odds win')
  t.equal(result.payout.principal, 10)
  t.equal(result.payout.profit, 20)
  t.notOk(result.bets.come.odds)

  t.end()
})

tap.test('comeOdds: odds bet, seven out', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      odds: { amount: 10 },
      isComeOut: false,
      point: 4
    }
  }

  const hand = { diceSum: 7 }

  const result = settle.comeOdds({ hand, bets })
  t.notOk(result.payout)
  t.notOk(result.bets.come.odds)

  t.end()
})

tap.test('comeOdds: odds bet, no action', function (t) {
  const bets = {
    come: {
      line: { amount: 5 },
      odds: { amount: 10 },
      isComeOut: false,
      point: 4
    }
  }

  const hand = { diceSum: 5 }

  const result = settle.comeOdds({ hand, bets })
  t.notOk(result.payout)
  t.strictSame(result.bets, bets, 'bets unchanged')

  t.end()
})

tap.test('all: pass line win', (t) => {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    point: 6,
    diceSum: 6
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.payouts.total, 65)
  t.equal(settled.payouts.principal, 30)
  t.equal(settled.payouts.profit, 35)

  t.end()
})
