import { test } from 'tap'
import { DiceResult, DieResult, HandResult, Point } from './consts'

const { minPassLineOnly, minPassLineMaxOdds } = require('./betting')

interface Rules {
  minBet: number
  maxOddsMultiple: {
    [key: number]: number
  }
}

interface Hand {
  isComeOut: boolean
  result?: string
  point?: number
  diceSum?: number
}

interface Bet {
  amount: number
  isContract: boolean
}

interface Bets {
  pass?: {
    line?: Bet
    odds?: Bet
  }
  new?: number
}

test('minPassLineOnly: no bets yet, coming out', function (t) {
  const rules: Rules = {
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

  const hand: Hand = {
    isComeOut: true
  }

  const updatedBets = minPassLineOnly({ rules, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet)
  t.equal(updatedBets.new, 5)

  t.end()
})

test('minPassLineOnly: bet exists, coming out', (t) => {
  const rules: Rules = {
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

  const hand: Hand = {
    isComeOut: true
  }

  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: false
      }
    }
  }

  const updatedBets = minPassLineOnly({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet)
  t.notOk(updatedBets.pass.line.isContract)
  t.notOk(updatedBets.new)

  t.end()
})

test('minPassLineOnly: bet exists, point set', (t) => {
  const rules: Rules = {
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

  const hand: Hand = {
    isComeOut: false,
    point: 6
  }

  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const updatedBets = minPassLineOnly({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet)
  t.ok(updatedBets.pass.line.isContract)
  t.notOk(updatedBets.new)

  t.end()
})

test('minPassLineMaxOdds: make new bet upon establishing point', (t) => {
  const rules: Rules = {
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

  const hand: Hand = {
    isComeOut: false,
    result: 'point set',
    point: 5
  }

  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const updatedBets = minPassLineMaxOdds({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet, 'line bet is not changed')
  t.equal(updatedBets.pass.odds.amount, rules.maxOddsMultiple['5'] * rules.minBet, 'odds bet made properly')
  t.equal(updatedBets.new, updatedBets.pass.odds.amount)

  t.end()
})

test('minPassLineMaxOdds: converge on odds bet after point set', (t) => {
  const rules: Rules = {
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

  const hand: Hand = {
    isComeOut: false,
    result: 'neutral',
    point: 5,
    diceSum: 8
  }

  const bets: Bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const updatedBets = minPassLineMaxOdds({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet, 'line bet is not changed')
  t.equal(updatedBets.pass.odds.amount, rules.maxOddsMultiple['5'] * rules.minBet, 'odds bet made properly')
  t.equal(updatedBets.new, updatedBets.pass.odds.amount)

  t.end()
})

test('minPassLineMaxOdds: continue existing bet', (t) => {
  const rules: Rules = {
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

  const hand: Hand = {
    isComeOut: false,
    result: 'neutral',
    point: 5,
    diceSum: 8
  }

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

  const updatedBets = minPassLineMaxOdds({ rules, bets, hand })
  if (bets.pass?.line && updatedBets.pass?.line) {
    t.equal(updatedBets.pass.line.amount, bets.pass.line.amount, 'line bet is not changed')
  }
  if (bets.pass?.odds && updatedBets.pass?.odds) {
    t.equal(updatedBets.pass.odds.amount, bets.pass.odds.amount, 'odds bet is not changed')
  }
  t.notOk(updatedBets.new, 'no new bets were made')

  t.end()
}) 