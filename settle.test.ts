import { test } from 'tap'
const { passLine, passOdds } = require('./settle')

interface Bet {
  amount: number
  isContract: boolean
}

interface Bets {
  pass?: {
    line?: Bet
    odds?: Bet
  }
}

interface Hand {
  result: string
  diceSum: number
  isComeOut?: boolean
  point?: number
}

test('passLine: comeout win', function (t) {
  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: false
      }
    }
  }

  const hand: Hand = {
    result: 'comeout win',
    diceSum: 7
  }

  const result = passLine({ hand, bets })
  t.equal(result.payout.type, 'comeout win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon comeout win')

  t.end()
})

test('passLine: comeout loss', function (t) {
  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: false
      }
    }
  }

  const hand: Hand = {
    result: 'comeout loss',
    diceSum: 3
  }

  const result = passLine({ hand, bets })
  t.notOk(result.payout, 'no payout on a comeout loss')
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon comeout loss')

  t.end()
})

test('passLine: point win', function (t) {
  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand: Hand = {
    result: 'point win',
    diceSum: 10
  }

  const result = passLine({ hand, bets })
  t.equal(result.payout.type, 'point win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon point win')

  t.end()
})

test('passLine: point loss', function (t) {
  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand: Hand = {
    result: 'seven out',
    diceSum: 7
  }

  const result = passLine({ hand, bets })
  t.notOk(result.payout, 'no payout on seven out')
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon seven out')

  t.end()
})

test('passLine: no bet', function (t) {
  const bets: Bets = {}

  const hand: Hand = {
    result: 'point win',
    diceSum: 8
  }

  const result = passLine({ hand, bets })
  t.notOk(result.payout)
  t.end()
})

test('passLine: bet, no win', function (t) {
  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand: Hand = {
    result: 'neutral',
    diceSum: 11,
    point: 5
  }

  const result = passLine({ hand, bets })
  t.notOk(result.payout)
  t.end()
})

test('passOdds: odds bet, no win', function (t) {
  const bets: Bets = {
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

  const hand: Hand = {
    result: 'neutral',
    isComeOut: false,
    point: 8,
    diceSum: 10
  }

  const result = passOdds({ hand, bets })
  t.notOk(result.payout)
  t.strictSame(result.bets, bets, 'settled bets are same as initial bets')
  t.end()
})

test('passOdds (4): odds bet, win', function (t) {
  const bets: Bets = {
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

  const hand: Hand = {
    result: 'point win',
    isComeOut: true,
    point: 4,
    diceSum: 4
  }

  const result = passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 15)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

test('passOdds (5): odds bet, win', function (t) {
  const bets: Bets = {
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

  const hand: Hand = {
    result: 'point win',
    isComeOut: true,
    point: 5,
    diceSum: 5
  }

  const result = passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 20)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

test('passOdds (6): odds bet, win', function (t) {
  const bets: Bets = {
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

  const hand: Hand = {
    result: 'point win',
    isComeOut: true,
    point: 6,
    diceSum: 6
  }

  const result = passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 25)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

test('passOdds (8): odds bet, win', function (t) {
  const bets: Bets = {
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

  const hand: Hand = {
    result: 'point win',
    isComeOut: true,
    point: 8,
    diceSum: 8
  }

  const result = passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 25)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
}) 