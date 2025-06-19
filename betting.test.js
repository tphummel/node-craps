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

tap.test('minPassLineMaxOdds: make new bet upon establishing point', (t) => {
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
    result: 'point set',
    point: 5
  }

  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const updatedBets = lib.minPassLineMaxOdds({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet, 'line bet is not changed')
  t.equal(updatedBets.pass.odds.amount, rules.maxOddsMultiple['5'] * rules.minBet, 'odds bet made properly')
  t.equal(updatedBets.new, updatedBets.pass.odds.amount)

  t.end()
})

tap.test('minPassLineMaxOdds: converge on odds bet after point set', (t) => {
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
    result: 'neutral',
    point: 5,
    diceSum: 8
  }

  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const updatedBets = lib.minPassLineMaxOdds({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, rules.minBet, 'line bet is not changed')
  t.equal(updatedBets.pass.odds.amount, rules.maxOddsMultiple['5'] * rules.minBet, 'odds bet made properly')
  t.equal(updatedBets.new, updatedBets.pass.odds.amount)

  t.end()
})

tap.test('minPassLineMaxOdds: continue existing bet', (t) => {
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
    result: 'neutral',
    point: 5,
    diceSum: 8
  }

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

  const updatedBets = lib.minPassLineMaxOdds({ rules, bets, hand })
  t.equal(updatedBets.pass.line.amount, bets.pass.line.amount, 'line bet is not changed')
  t.equal(updatedBets.pass.odds.amount, bets.pass.odds.amount, 'odds bet is not changed')
  t.notOk(updatedBets.new, 'no new bets were made')

  t.end()
})

tap.test('placeSixEight: make new place bets after point set', (t) => {
  const rules = {
    minBet: 6
  }

  const hand = {
    isComeOut: false,
    point: 5
  }

  const updatedBets = lib.placeSixEight({ rules, hand })

  t.equal(updatedBets.place.six.amount, rules.minBet)
  t.equal(updatedBets.place.eight.amount, rules.minBet)
  t.equal(updatedBets.new, rules.minBet * 2)

  t.end()
})

tap.test('placeSixEight: no new bets on comeout', (t) => {
  const rules = { minBet: 6 }
  const hand = { isComeOut: true }

  const updatedBets = lib.placeSixEight({ rules, hand })

  t.notOk(updatedBets.place)
  t.notOk(updatedBets.new)

  t.end()
})

tap.test('placeSixEight: existing bets remain', (t) => {
  const rules = { minBet: 6 }
  const hand = { isComeOut: false, point: 8 }

  const bets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }

  const updatedBets = lib.placeSixEight({ rules, bets, hand })

  t.equal(updatedBets.place.six.amount, 6)
  t.equal(updatedBets.place.eight.amount, 6)
  t.notOk(updatedBets.new)

  t.end()
})

tap.test('placeSixEight: place bets even when point is 6 or 8', (t) => {
  const rules = { minBet: 6 }
  const handSix = { isComeOut: false, point: 6 }

  const firstBets = lib.placeSixEight({ rules, hand: handSix })

  t.equal(firstBets.place.six.amount, rules.minBet)
  t.equal(firstBets.place.eight.amount, rules.minBet)
  t.equal(firstBets.new, rules.minBet * 2)

  delete firstBets.new

  const handEight = { isComeOut: false, point: 8 }
  const bets = lib.placeSixEight({ rules, bets: firstBets, hand: handEight })

  t.equal(bets.place.six.amount, rules.minBet)
  t.equal(bets.place.eight.amount, rules.minBet)
  t.notOk(bets.new)

  t.end()
})

tap.test('placeSixEight: bet rounds up to multiple of six', (t) => {
  const rules = { minBet: 5 }
  const hand = { isComeOut: false, point: 5 }

  const updatedBets = lib.placeSixEight({ rules, hand })

  t.equal(updatedBets.place.six.amount, 6)
  t.equal(updatedBets.place.eight.amount, 6)
  t.equal(updatedBets.new, 12)

  t.end()
})

tap.test('placeSixEightUnlessPoint: skip place bet matching point', (t) => {
  const rules = { minBet: 6 }

  const handSix = { isComeOut: false, point: 6 }
  const betsSix = lib.placeSixEightUnlessPoint({ rules, hand: handSix })

  t.notOk(betsSix.place?.six)
  t.equal(betsSix.place.eight.amount, rules.minBet)
  t.equal(betsSix.new, rules.minBet)

  const handEight = { isComeOut: false, point: 8 }
  const betsEight = lib.placeSixEightUnlessPoint({ rules, hand: handEight })

  t.equal(betsEight.place.six.amount, rules.minBet)
  t.notOk(betsEight.place?.eight)
  t.equal(betsEight.new, rules.minBet)

  t.end()
})

tap.test('minPassLineMaxOddsPlaceSixEight: odds and place bets adjusted', (t) => {
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

  const comeOut = { isComeOut: true }
  const first = lib.minPassLineMaxOddsPlaceSixEight({ rules, hand: comeOut })

  t.equal(first.pass.line.amount, rules.minBet)
  t.notOk(first.place)
  t.equal(first.new, rules.minBet)

  delete first.new

  const pointSix = { isComeOut: false, result: 'point set', point: 6 }
  const second = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: first, hand: pointSix })

  t.equal(second.pass.odds.amount, rules.maxOddsMultiple['6'] * rules.minBet)
  t.notOk(second.place?.six)
  t.equal(second.place.eight.amount, 6)
  t.equal(second.new, second.pass.odds.amount + 6)

  const pointSixAgain = { isComeOut: false, result: 'neutral', point: 6 }
  const third = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: second, hand: pointSixAgain })

  t.equal(third.pass.odds.amount, rules.maxOddsMultiple['6'] * rules.minBet)
  t.notOk(third.place?.six)
  t.equal(third.place.eight.amount, 6)

  t.end()
})
