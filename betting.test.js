import tap from 'tap'
import * as lib from './betting.js'

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

tap.test('lineMaxOdds: new line bet only', (t) => {
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

  const hand = { isComeOut: true }

  const updatedBets = lib.lineMaxOdds({
    rules,
    hand,
    shouldMakeLineBet: true,
    shouldMakeOddsBet: false,
    point: 4,
    betKey: 'pass'
  })

  t.equal(updatedBets.pass.line.amount, rules.minBet)
  t.equal(updatedBets.new, rules.minBet)

  t.end()
})

tap.test('lineMaxOdds: add odds to existing line bet', (t) => {
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

  const hand = { isComeOut: false, point: 6 }
  const bets = { pass: { line: { amount: rules.minBet } } }

  const updatedBets = lib.lineMaxOdds({
    rules,
    hand,
    bets,
    shouldMakeLineBet: false,
    shouldMakeOddsBet: true,
    point: hand.point,
    betKey: 'pass'
  })

  t.equal(updatedBets.pass.odds.amount, rules.maxOddsMultiple['6'] * rules.minBet)
  t.equal(updatedBets.new, updatedBets.pass.odds.amount)

  t.end()
})

tap.test('minComeLineMaxOdds: create pending come bet and add odds', (t) => {
  const rules = {
    minBet: 5,
    maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
  }

  const hand = { isComeOut: false, point: 6 }
  const bets = { come: { points: { 5: [{ line: { amount: 5 } }] } } }

  const updated = lib.minComeLineMaxOdds({ rules, bets, hand, maxComeBets: 2 })

  t.equal(updated.come.pending.length, 1, 'adds a new pending come bet')
  t.equal(updated.come.pending[0].amount, rules.minBet)
  t.equal(updated.come.points[5][0].odds.amount, rules.maxOddsMultiple['5'] * rules.minBet, 'adds odds behind come point')
  t.equal(updated.new, rules.minBet + updated.come.points[5][0].odds.amount, 'tracks new wagers')

  t.end()
})

tap.test('minComeLineMaxOdds: only one pending come bet at a time', (t) => {
  const rules = {
    minBet: 5,
    maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
  }

  const hand = { isComeOut: false, point: 6 }
  const bets = { come: { pending: [{ amount: 5 }], points: {} } }

  const updated = lib.minComeLineMaxOdds({ rules, bets, hand, maxComeBets: 3 })

  t.equal(updated.come.pending.length, 1, 'does not stack pending come bets')
  t.notOk(updated.new, 'no additional come bet added')

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

tap.test('placeSixEightUnlessPoint: pre-existing place 6 removed when point changes to 6, bets.new stays 0', (t) => {
  const rules = { minBet: 6 }
  const existingBets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }
  const hand = { isComeOut: false, point: 6 }

  const result = lib.placeSixEightUnlessPoint({ rules, hand, bets: existingBets })

  t.notOk(result.place?.six, 'pre-existing place 6 is removed when it matches the point')
  t.equal(result.place?.eight?.amount, 6, 'place 8 is untouched')
  t.equal(result.new, 0, 'bets.new is 0 — no free credit for removing a pre-existing bet')

  t.end()
})

tap.test('placeSixEightUnlessPoint: pre-existing place 8 removed when point changes to 8, bets.new stays 0', (t) => {
  const rules = { minBet: 6 }
  const existingBets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }
  const hand = { isComeOut: false, point: 8 }

  const result = lib.placeSixEightUnlessPoint({ rules, hand, bets: existingBets })

  t.equal(result.place?.six?.amount, 6, 'place 6 is untouched')
  t.notOk(result.place?.eight, 'pre-existing place 8 is removed when it matches the point')
  t.equal(result.new, 0, 'bets.new is 0 — no free credit for removing a pre-existing bet')

  t.end()
})

tap.test('placeSixEightUnlessPassOrCome: pre-existing place 6 removed when covered by pass point, bets.new stays 0', (t) => {
  const rules = { minBet: 6 }
  const existingBets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }
  const hand = { isComeOut: false, point: 6 }

  const result = lib.placeSixEightUnlessPassOrCome({ rules, hand, bets: existingBets })

  t.notOk(result.place?.six, 'pre-existing place 6 is removed when covered by the pass point')
  t.equal(result.place?.eight?.amount, 6, 'place 8 is untouched')
  t.equal(result.new, 0, 'bets.new is 0 — no free credit for removing a pre-existing bet')

  t.end()
})

tap.test('placeSixEightUnlessPassOrCome: pre-existing place 6 removed when covered by come bet, bets.new stays 0', (t) => {
  const rules = { minBet: 6 }
  const existingBets = {
    place: { six: { amount: 6 }, eight: { amount: 6 } },
    come: { points: { 6: [{ line: { amount: 6 } }] } }
  }
  const hand = { isComeOut: false, point: 9 }

  const result = lib.placeSixEightUnlessPassOrCome({ rules, hand, bets: existingBets })

  t.notOk(result.place?.six, 'pre-existing place 6 is removed when a come bet covers 6')
  t.equal(result.place?.eight?.amount, 6, 'place 8 is untouched')
  t.equal(result.new, 0, 'bets.new is 0 — no free credit for removing a pre-existing bet')

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

tap.test('minPassLinePlaceSixEight: comeout establishes pass line', (t) => {
  const rules = { minBet: 5 }
  const comeOut = { isComeOut: true }

  const bets = lib.minPassLinePlaceSixEight({ rules, hand: comeOut })

  t.equal(bets.pass.line.amount, rules.minBet)
  t.notOk(bets.place, 'no place bets on comeout')
  t.equal(bets.new, rules.minBet)

  t.end()
})

tap.test('minPassLinePlaceSixEight: point 6 adds only place 8', (t) => {
  const rules = { minBet: 5 }

  const comeOut = { isComeOut: true }
  const first = lib.minPassLinePlaceSixEight({ rules, hand: comeOut })
  delete first.new

  const pointSix = { isComeOut: false, result: 'point set', point: 6 }
  const second = lib.minPassLinePlaceSixEight({ rules, bets: first, hand: pointSix })

  t.equal(second.pass.line.amount, rules.minBet)
  t.notOk(second.place?.six, 'no place 6 when 6 is the point')
  t.equal(second.place.eight.amount, 6)
  t.equal(second.new, 6)

  t.end()
})

tap.test('minPassLinePlaceSixEight: point 8 adds only place 6', (t) => {
  const rules = { minBet: 5 }

  const comeOut = { isComeOut: true }
  const first = lib.minPassLinePlaceSixEight({ rules, hand: comeOut })
  delete first.new

  const pointEight = { isComeOut: false, result: 'point set', point: 8 }
  const second = lib.minPassLinePlaceSixEight({ rules, bets: first, hand: pointEight })

  t.equal(second.pass.line.amount, rules.minBet)
  t.equal(second.place.six.amount, 6)
  t.notOk(second.place?.eight, 'no place 8 when 8 is the point')
  t.equal(second.new, 6)

  t.end()
})

tap.test('minPassLinePlaceSixEight: point 5 adds both place bets', (t) => {
  const rules = { minBet: 5 }

  const comeOut = { isComeOut: true }
  const first = lib.minPassLinePlaceSixEight({ rules, hand: comeOut })
  delete first.new

  const pointFive = { isComeOut: false, result: 'point set', point: 5 }
  const second = lib.minPassLinePlaceSixEight({ rules, bets: first, hand: pointFive })

  t.equal(second.pass.line.amount, rules.minBet)
  t.equal(second.place.six.amount, 6)
  t.equal(second.place.eight.amount, 6)
  t.equal(second.new, 12)

  t.end()
})

tap.test('minPassLinePlaceSixEight: existing bets remain unchanged', (t) => {
  const rules = { minBet: 5 }

  const hand = { isComeOut: false, point: 5 }
  const bets = {
    pass: { line: { amount: 5, isContract: true } },
    place: { six: { amount: 6 }, eight: { amount: 6 } }
  }

  const updated = lib.minPassLinePlaceSixEight({ rules, bets, hand })

  t.equal(updated.pass.line.amount, 5)
  t.equal(updated.place.six.amount, 6)
  t.equal(updated.place.eight.amount, 6)
  t.notOk(updated.new, 'no new bets when all exist')

  t.end()
})

tap.test('minPassLineMaxOddsMinComeLineMaxOdds: adds come bet after point set', (t) => {
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
  const first = lib.minPassLineMaxOddsMinComeLineMaxOdds({ rules, hand: comeOut })

  t.equal(first.pass.line.amount, rules.minBet)
  t.notOk(first.come, 'no come bet on comeout')
  t.equal(first.new, rules.minBet)

  delete first.new

  const pointSix = { isComeOut: false, result: 'point set', point: 6 }
  const second = lib.minPassLineMaxOddsMinComeLineMaxOdds({ rules, bets: first, hand: pointSix })

  t.equal(second.pass.odds.amount, rules.maxOddsMultiple['6'] * rules.minBet)
  t.equal(second.come.pending.length, 1, 'adds one pending come bet after point set')
  t.equal(second.come.pending[0].amount, rules.minBet)
  t.equal(second.new, rules.maxOddsMultiple['6'] * rules.minBet + rules.minBet)

  t.end()
})

tap.test('passCome68: adds pass odds, come bet, and place bets not on pass point', (t) => {
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
  const first = lib.passCome68({ rules, hand: comeOut })

  t.equal(first.pass.line.amount, rules.minBet)
  t.notOk(first.come, 'no come bet on comeout')
  t.notOk(first.place, 'no place bets on comeout')
  t.equal(first.new, rules.minBet)

  delete first.new

  const pointSix = { isComeOut: false, result: 'point set', point: 6 }
  const second = lib.passCome68({ rules, bets: first, hand: pointSix })

  t.equal(second.pass.odds.amount, rules.maxOddsMultiple['6'] * rules.minBet)
  t.equal(second.come.pending.length, 1, 'adds one pending come bet after point set')
  t.notOk(second.place?.six, 'skip place 6 when 6 is the pass point')
  t.equal(second.place.eight.amount, 6)
  t.equal(second.new, second.pass.odds.amount + rules.minBet + 6)

  t.end()
})

tap.test('passCome68: skips place bets covered by come points', (t) => {
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

  const hand = { isComeOut: false, result: 'neutral', point: 5 }
  const bets = {
    pass: { line: { amount: 5, isContract: true }, odds: { amount: 20 } },
    come: { points: { 6: [{ line: { amount: 5 } }] } }
  }

  const updated = lib.passCome68({ rules, bets, hand })

  t.notOk(updated.place?.six, 'skip place 6 when come point is 6')
  t.equal(updated.place.eight.amount, 6)
  t.equal(updated.new, rules.maxOddsMultiple['6'] * rules.minBet + 6)

  t.end()
})

tap.test('passcome2place68: adds pass odds, two come bets, and place bets', (t) => {
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
  const first = lib.passcome2place68({ rules, hand: comeOut })

  t.equal(first.pass.line.amount, rules.minBet)
  t.notOk(first.come, 'no come bet on comeout')
  t.notOk(first.place, 'no place bets on comeout')
  t.equal(first.new, rules.minBet)

  delete first.new

  const pointSix = { isComeOut: false, result: 'point set', point: 6 }
  const second = lib.passcome2place68({ rules, bets: first, hand: pointSix })

  t.equal(second.pass.odds.amount, rules.maxOddsMultiple['6'] * rules.minBet)
  t.equal(second.come.pending.length, 1, 'adds one pending come bet after point set')
  t.notOk(second.place?.six, 'skip place 6 when 6 is the pass point')
  t.equal(second.place.eight.amount, 6)
  t.equal(second.new, second.pass.odds.amount + rules.minBet + 6)

  t.end()
})

tap.test('passcome2place68: maintains two come bets with odds', (t) => {
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

  const hand = { isComeOut: false, result: 'neutral', point: 6 }
  const bets = {
    pass: { line: { amount: 5, isContract: true }, odds: { amount: 25 } },
    come: {
      points: {
        4: [{ line: { amount: 5 } }],
        5: [{ line: { amount: 5 } }]
      }
    },
    place: { eight: { amount: 6 } }
  }

  const updated = lib.passcome2place68({ rules, bets, hand })

  // Should add odds to both come points
  t.equal(updated.come.points[4][0].odds.amount, rules.maxOddsMultiple['4'] * rules.minBet, 'adds odds to come point 4')
  t.equal(updated.come.points[5][0].odds.amount, rules.maxOddsMultiple['5'] * rules.minBet, 'adds odds to come point 5')
  t.equal(updated.new, rules.maxOddsMultiple['4'] * rules.minBet + rules.maxOddsMultiple['5'] * rules.minBet)

  t.end()
})

tap.test('passcome2place68: adds second come bet when only one exists', (t) => {
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

  const hand = { isComeOut: false, result: 'neutral', point: 6 }
  const bets = {
    pass: { line: { amount: 5, isContract: true }, odds: { amount: 25 } },
    come: {
      points: {
        4: [{ line: { amount: 5 }, odds: { amount: 15 } }]
      }
    },
    place: { eight: { amount: 6 } }
  }

  const updated = lib.passcome2place68({ rules, bets, hand })

  t.equal(updated.come.pending.length, 1, 'adds second pending come bet')
  t.equal(updated.come.pending[0].amount, rules.minBet)
  t.equal(updated.new, rules.minBet)

  t.end()
})

tap.test('passcome2place68: skips place bets covered by two come points', (t) => {
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

  const hand = { isComeOut: false, result: 'neutral', point: 5 }
  const bets = {
    pass: { line: { amount: 5, isContract: true }, odds: { amount: 20 } },
    come: {
      points: {
        6: [{ line: { amount: 5 }, odds: { amount: 25 } }],
        8: [{ line: { amount: 5 } }]
      }
    }
  }

  const updated = lib.passcome2place68({ rules, bets, hand })

  // Should add odds to come point 8
  t.equal(updated.come.points[8][0].odds.amount, rules.maxOddsMultiple['8'] * rules.minBet)
  // Should not create place bets for 6 or 8 since they're covered by come points
  t.notOk(updated.place?.six, 'skip place 6 when come point is 6')
  t.notOk(updated.place?.eight, 'skip place 8 when come point is 8')
  t.equal(updated.new, rules.maxOddsMultiple['8'] * rules.minBet)

  t.end()
})

// Priority 2: Test all points (4, 5, 6, 8, 9, 10) with odds calculations
tap.test('minPassLineMaxOdds: all points have correct odds multiples', (t) => {
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

  const points = [4, 5, 6, 8, 9, 10]

  points.forEach(point => {
    const bets = {
      pass: {
        line: {
          amount: 5,
          isContract: true
        }
      }
    }

    const hand = {
      isComeOut: false,
      result: 'point set',
      point
    }

    const updated = lib.minPassLineMaxOdds({ rules, bets, hand })

    t.equal(updated.pass.odds.amount, rules.maxOddsMultiple[point] * rules.minBet,
      `point ${point} should have ${rules.maxOddsMultiple[point]}x odds`)
    t.equal(updated.new, rules.maxOddsMultiple[point] * rules.minBet,
      `point ${point} new bet amount correct`)
  })

  t.end()
})

tap.test('minPassLineMaxOddsPlaceSixEight: all points work correctly', (t) => {
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

  // Point 4: both place bets should be added
  const point4Hand = { isComeOut: false, result: 'point set', point: 4 }
  const bets4 = { pass: { line: { amount: 5, isContract: true } } }
  const result4 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: bets4, hand: point4Hand })

  t.equal(result4.pass.odds.amount, 15, 'point 4 has 3x odds')
  t.equal(result4.place.six.amount, 6, 'place 6 added for point 4')
  t.equal(result4.place.eight.amount, 6, 'place 8 added for point 4')
  t.equal(result4.new, 27, 'total new bets for point 4')

  // Point 5: both place bets should be added
  const point5Hand = { isComeOut: false, result: 'point set', point: 5 }
  const bets5 = { pass: { line: { amount: 5, isContract: true } } }
  const result5 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: bets5, hand: point5Hand })

  t.equal(result5.pass.odds.amount, 20, 'point 5 has 4x odds')
  t.equal(result5.place.six.amount, 6, 'place 6 added for point 5')
  t.equal(result5.place.eight.amount, 6, 'place 8 added for point 5')
  t.equal(result5.new, 32, 'total new bets for point 5')

  // Point 6: only place 8 should be added
  const point6Hand = { isComeOut: false, result: 'point set', point: 6 }
  const bets6 = { pass: { line: { amount: 5, isContract: true } } }
  const result6 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: bets6, hand: point6Hand })

  t.equal(result6.pass.odds.amount, 25, 'point 6 has 5x odds')
  t.notOk(result6.place?.six, 'no place 6 when 6 is the point')
  t.equal(result6.place.eight.amount, 6, 'place 8 added for point 6')
  t.equal(result6.new, 31, 'total new bets for point 6')

  // Point 8: only place 6 should be added
  const point8Hand = { isComeOut: false, result: 'point set', point: 8 }
  const bets8 = { pass: { line: { amount: 5, isContract: true } } }
  const result8 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: bets8, hand: point8Hand })

  t.equal(result8.pass.odds.amount, 25, 'point 8 has 5x odds')
  t.equal(result8.place.six.amount, 6, 'place 6 added for point 8')
  t.notOk(result8.place?.eight, 'no place 8 when 8 is the point')
  t.equal(result8.new, 31, 'total new bets for point 8')

  // Point 9: both place bets should be added
  const point9Hand = { isComeOut: false, result: 'point set', point: 9 }
  const bets9 = { pass: { line: { amount: 5, isContract: true } } }
  const result9 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: bets9, hand: point9Hand })

  t.equal(result9.pass.odds.amount, 20, 'point 9 has 4x odds')
  t.equal(result9.place.six.amount, 6, 'place 6 added for point 9')
  t.equal(result9.place.eight.amount, 6, 'place 8 added for point 9')
  t.equal(result9.new, 32, 'total new bets for point 9')

  // Point 10: both place bets should be added
  const point10Hand = { isComeOut: false, result: 'point set', point: 10 }
  const bets10 = { pass: { line: { amount: 5, isContract: true } } }
  const result10 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: bets10, hand: point10Hand })

  t.equal(result10.pass.odds.amount, 15, 'point 10 has 3x odds')
  t.equal(result10.place.six.amount, 6, 'place 6 added for point 10')
  t.equal(result10.place.eight.amount, 6, 'place 8 added for point 10')
  t.equal(result10.new, 27, 'total new bets for point 10')

  t.end()
})

// Priority 2: Test state transitions
tap.test('minPassLineMaxOddsPlaceSixEight: full roll cycle comeout to seven out', (t) => {
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

  // Roll 1: Comeout - establish pass line
  const roll1Hand = { isComeOut: true }
  const roll1Bets = lib.minPassLineMaxOddsPlaceSixEight({ rules, hand: roll1Hand })

  t.equal(roll1Bets.pass.line.amount, 5, 'roll 1: pass line established')
  t.notOk(roll1Bets.place, 'roll 1: no place bets on comeout')
  t.equal(roll1Bets.new, 5, 'roll 1: only pass line bet')

  delete roll1Bets.new

  // Roll 2: Point set to 5 - add odds and place bets
  const roll2Hand = { isComeOut: false, result: 'point set', point: 5 }
  const roll2Bets = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: roll1Bets, hand: roll2Hand })

  t.equal(roll2Bets.pass.line.amount, 5, 'roll 2: pass line remains')
  t.equal(roll2Bets.pass.odds.amount, 20, 'roll 2: pass odds added')
  t.equal(roll2Bets.place.six.amount, 6, 'roll 2: place 6 added')
  t.equal(roll2Bets.place.eight.amount, 6, 'roll 2: place 8 added')
  t.equal(roll2Bets.new, 32, 'roll 2: odds + both place bets')

  delete roll2Bets.new

  // Roll 3: Neutral roll (e.g., rolled 4) - no changes
  const roll3Hand = { isComeOut: false, result: 'neutral', point: 5, diceSum: 4 }
  const roll3Bets = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: roll2Bets, hand: roll3Hand })

  t.equal(roll3Bets.pass.line.amount, 5, 'roll 3: pass line unchanged')
  t.equal(roll3Bets.pass.odds.amount, 20, 'roll 3: odds unchanged')
  t.equal(roll3Bets.place.six.amount, 6, 'roll 3: place 6 unchanged')
  t.equal(roll3Bets.place.eight.amount, 6, 'roll 3: place 8 unchanged')
  t.notOk(roll3Bets.new, 'roll 3: no new bets')

  // Roll 4: Another neutral roll (e.g., rolled 9) - still no changes
  const roll4Hand = { isComeOut: false, result: 'neutral', point: 5, diceSum: 9 }
  const roll4Bets = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: roll3Bets, hand: roll4Hand })

  t.equal(roll4Bets.pass.line.amount, 5, 'roll 4: pass line unchanged')
  t.equal(roll4Bets.pass.odds.amount, 20, 'roll 4: odds unchanged')
  t.notOk(roll4Bets.new, 'roll 4: no new bets')

  t.end()
})

tap.test('minPassLinePlaceSixEight: full roll cycle with multiple neutral rolls', (t) => {
  const rules = { minBet: 5 }

  // Roll 1: Comeout
  const roll1Hand = { isComeOut: true }
  const roll1Bets = lib.minPassLinePlaceSixEight({ rules, hand: roll1Hand })

  t.equal(roll1Bets.pass.line.amount, 5)
  t.equal(roll1Bets.new, 5)

  delete roll1Bets.new

  // Roll 2: Point set to 4
  const roll2Hand = { isComeOut: false, result: 'point set', point: 4 }
  const roll2Bets = lib.minPassLinePlaceSixEight({ rules, bets: roll1Bets, hand: roll2Hand })

  t.equal(roll2Bets.place.six.amount, 6)
  t.equal(roll2Bets.place.eight.amount, 6)
  t.equal(roll2Bets.new, 12)

  delete roll2Bets.new

  // Roll 3-5: Neutral rolls
  let currentBets = roll2Bets
  const neutralNumbers = [5, 9, 10]

  neutralNumbers.forEach((num, idx) => {
    const hand = { isComeOut: false, result: 'neutral', point: 4, diceSum: num }
    const bets = lib.minPassLinePlaceSixEight({ rules, bets: currentBets, hand })

    t.equal(bets.pass.line.amount, 5, `neutral roll ${idx + 1}: pass line unchanged`)
    t.equal(bets.place.six.amount, 6, `neutral roll ${idx + 1}: place 6 unchanged`)
    t.equal(bets.place.eight.amount, 6, `neutral roll ${idx + 1}: place 8 unchanged`)
    t.notOk(bets.new, `neutral roll ${idx + 1}: no new bets`)

    currentBets = bets
  })

  t.end()
})

// Priority 3: Invariant tests - properties that should always hold
tap.test('invariant: bets.new always equals sum of new bet amounts', (t) => {
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

  // Test minPassLineOnly
  const result1 = lib.minPassLineOnly({ rules, hand: { isComeOut: true } })
  t.equal(result1.new, result1.pass.line.amount, 'minPassLineOnly: new equals pass line')

  // Test minPassLineMaxOdds
  const bets2 = { pass: { line: { amount: 5, isContract: true } } }
  const result2 = lib.minPassLineMaxOdds({ rules, bets: bets2, hand: { isComeOut: false, point: 6 } })
  t.equal(result2.new, result2.pass.odds.amount, 'minPassLineMaxOdds: new equals odds')

  // Test placeSixEight
  const result3 = lib.placeSixEight({ rules, hand: { isComeOut: false, point: 5 } })
  t.equal(result3.new, result3.place.six.amount + result3.place.eight.amount,
    'placeSixEight: new equals sum of place bets')

  // Test minPassLineMaxOddsPlaceSixEight composition
  const result4a = lib.minPassLineMaxOddsPlaceSixEight({ rules, hand: { isComeOut: true } })
  t.equal(result4a.new, result4a.pass.line.amount, 'composition comeout: new equals pass line')

  delete result4a.new
  const result4b = lib.minPassLineMaxOddsPlaceSixEight({
    rules,
    bets: result4a,
    hand: { isComeOut: false, result: 'point set', point: 4 }
  })
  const expectedNew = result4b.pass.odds.amount + result4b.place.six.amount + result4b.place.eight.amount
  t.equal(result4b.new, expectedNew, 'composition point set: new equals odds + place bets')

  t.end()
})

tap.test('invariant: existing bets never modified, only added or removed', (t) => {
  const rules = { minBet: 5 }
  const originalBets = {
    pass: {
      line: { amount: 5, isContract: true, customProp: 'test' }
    }
  }

  const hand = { isComeOut: false, point: 5 }
  const result = lib.minPassLineOnly({ rules, bets: originalBets, hand })

  t.equal(result.pass.line.amount, originalBets.pass.line.amount, 'amount unchanged')
  t.equal(result.pass.line.isContract, originalBets.pass.line.isContract, 'isContract unchanged')
  t.equal(result.pass.line.customProp, originalBets.pass.line.customProp, 'custom props preserved')

  t.end()
})

tap.test('invariant: strategies are idempotent when called with same state', (t) => {
  const rules = {
    minBet: 5,
    maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
  }

  const hand = { isComeOut: false, point: 6 }
  const bets = {
    pass: {
      line: { amount: 5, isContract: true },
      odds: { amount: 25 }
    },
    place: { eight: { amount: 6 } }
  }

  // Call the strategy twice with the same input
  const result1 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets, hand })
  const result2 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: result1, hand })

  t.equal(result1.new, 0, 'first call produces no new bets when all bets exist')
  t.equal(result2.new, 0, 'second call produces no new bets')

  // Remove 'new' fields for comparison
  delete result1.new
  delete result2.new

  t.same(result1, result2, 'results are identical when state unchanged')

  t.end()
})

tap.test('invariant: place bets never created for point 6 or 8', (t) => {
  const rules = { minBet: 5 }

  // Point 6
  const result6 = lib.placeSixEightUnlessPoint({ rules, hand: { isComeOut: false, point: 6 } })
  t.notOk(result6.place?.six, 'no place 6 when 6 is point')
  t.ok(result6.place?.eight, 'place 8 exists when 6 is point')

  // Point 8
  const result8 = lib.placeSixEightUnlessPoint({ rules, hand: { isComeOut: false, point: 8 } })
  t.ok(result8.place?.six, 'place 6 exists when 8 is point')
  t.notOk(result8.place?.eight, 'no place 8 when 8 is point')

  t.end()
})

// Priority 3: Composition contract tests
tap.test('composition: strategies compose without conflicts', (t) => {
  const rules = {
    minBet: 5,
    maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
  }

  const hand = { isComeOut: false, result: 'point set', point: 5 }
  const initialBets = { pass: { line: { amount: 5, isContract: true } } }

  // Apply strategies separately
  const afterOdds = lib.minPassLineMaxOdds({ rules, bets: initialBets, hand })
  delete afterOdds.new
  const afterPlace = lib.placeSixEightUnlessPoint({ rules, bets: afterOdds, hand })

  // Apply composed strategy
  const composed = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: initialBets, hand })

  // Results should be the same (ignoring the 'new' field)
  delete afterPlace.new
  delete composed.new

  t.same(composed, afterPlace, 'composed strategy produces same result as sequential application')

  t.end()
})

tap.test('composition: order independence for independent bets', (t) => {
  const rules = { minBet: 5 }
  const hand = { isComeOut: false, point: 5 }

  // Apply in order: pass line then place bets
  const order1Step1 = lib.minPassLineOnly({ rules, hand: { isComeOut: true } })
  delete order1Step1.new
  const order1Step2 = lib.placeSixEightUnlessPoint({ rules, bets: order1Step1, hand })
  delete order1Step2.new

  // The minPassLinePlaceSixEight does the same thing
  const combined1 = lib.minPassLinePlaceSixEight({ rules, hand: { isComeOut: true } })
  delete combined1.new
  const combined2 = lib.minPassLinePlaceSixEight({ rules, bets: combined1, hand })
  delete combined2.new

  t.same(combined2, order1Step2, 'composed function produces consistent results')

  t.end()
})

tap.test('composition: all strategies handle missing bets parameter', (t) => {
  const rules = { minBet: 5 }
  const hand = { isComeOut: true }

  t.doesNotThrow(() => lib.minPassLineOnly({ rules, hand }), 'minPassLineOnly handles missing bets')
  t.doesNotThrow(() => lib.minPassLineMaxOdds({ rules, hand }), 'minPassLineMaxOdds handles missing bets')
  t.doesNotThrow(() => lib.placeSixEight({ rules, hand }), 'placeSixEight handles missing bets')
  t.doesNotThrow(() => lib.minPassLinePlaceSixEight({ rules, hand }), 'minPassLinePlaceSixEight handles missing bets')
  t.doesNotThrow(() => lib.minPassLineMaxOddsPlaceSixEight({ rules, hand }), 'minPassLineMaxOddsPlaceSixEight handles missing bets')

  t.end()
})

tap.test('noBetting: returns no bets on comeout', (t) => {
  const result = lib.noBetting({ hand: { isComeOut: true } })

  t.equal(result.new, 0, 'no new wager')
  t.notOk(result.pass, 'no pass bet')
  t.notOk(result.come, 'no come bet')
  t.notOk(result.place, 'no place bet')

  t.end()
})

tap.test('noBetting: returns no bets with point established', (t) => {
  const result = lib.noBetting({ hand: { isComeOut: false, point: 8 } })

  t.equal(result.new, 0, 'no new wager')
  t.notOk(result.pass, 'no pass bet')
  t.notOk(result.come, 'no come bet')
  t.notOk(result.place, 'no place bet')

  t.end()
})

tap.test('noBetting: works with no arguments', (t) => {
  t.doesNotThrow(() => lib.noBetting(), 'noBetting handles no arguments')
  const result = lib.noBetting()
  t.equal(result.new, 0, 'no new wager')

  t.end()
})

tap.test('composition: strategies preserve bet structure integrity', (t) => {
  const rules = {
    minBet: 5,
    maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
  }

  const comeOut = { isComeOut: true }
  const result1 = lib.minPassLineMaxOddsPlaceSixEight({ rules, hand: comeOut })

  t.ok(result1.pass, 'pass object exists')
  t.ok(result1.pass.line, 'pass.line exists')
  t.type(result1.pass.line.amount, 'number', 'pass.line.amount is a number')

  delete result1.new

  const pointSet = { isComeOut: false, result: 'point set', point: 6 }
  const result2 = lib.minPassLineMaxOddsPlaceSixEight({ rules, bets: result1, hand: pointSet })

  t.ok(result2.pass.odds, 'pass.odds exists after point set')
  t.type(result2.pass.odds.amount, 'number', 'pass.odds.amount is a number')
  t.ok(result2.place, 'place object exists after point set')
  t.ok(result2.place.eight, 'place.eight exists when point is 6')
  t.type(result2.place.eight.amount, 'number', 'place.eight.amount is a number')

  t.end()
})

tap.test('fiveCountMinPassLineMaxOddsPlaceSixEight: is exported and callable', (t) => {
  const rules = { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }

  t.doesNotThrow(() => {
    lib.fiveCountMinPassLineMaxOddsPlaceSixEight({ rules, hand: { isComeOut: true }, playerMind: {} })
  })

  t.end()
})

tap.test('pressPlaceSixEight: no bets on come-out', (t) => {
  const rules = { minBet: 5 }
  const playerMind = {}

  const bets = lib.pressPlaceSixEight({ rules, hand: { isComeOut: true }, playerMind })

  t.notOk(bets.place, 'no place bets on come-out')
  t.equal(bets.new, 0)
  t.end()
})

tap.test('pressPlaceSixEight: places six and eight at initial amount on first point-phase call', (t) => {
  const rules = { minBet: 5 }
  const playerMind = {}

  const bets = lib.pressPlaceSixEight({ rules, hand: { isComeOut: false, result: 'point set', point: 5 }, playerMind })

  t.equal(bets.place.six.amount, 6, 'six placed at $6 (nearest multiple of 6 >= minBet)')
  t.equal(bets.place.eight.amount, 6, 'eight placed at $6')
  t.equal(bets.new, 12)
  t.end()
})

tap.test('pressPlaceSixEight: presses six by $6 after a six win', (t) => {
  const rules = { minBet: 5 }
  const playerMind = {}

  let bets = lib.pressPlaceSixEight({ rules, hand: { isComeOut: false, result: 'point set', point: 5 }, playerMind })
  delete bets.new

  // simulate six winning: settle removes place.six
  delete bets.place.six

  bets = lib.pressPlaceSixEight({ rules, bets, hand: { isComeOut: false, result: 'neutral', point: 5 }, playerMind })

  t.equal(bets.place.six.amount, 12, 'six pressed to $12 after win')
  t.equal(bets.place.eight.amount, 6, 'eight unchanged')
  t.end()
})

tap.test('pressPlaceSixEight: presses eight by $6 after an eight win', (t) => {
  const rules = { minBet: 5 }
  const playerMind = {}

  let bets = lib.pressPlaceSixEight({ rules, hand: { isComeOut: false, result: 'point set', point: 5 }, playerMind })
  delete bets.new

  // simulate eight winning
  delete bets.place.eight

  bets = lib.pressPlaceSixEight({ rules, bets, hand: { isComeOut: false, result: 'neutral', point: 5 }, playerMind })

  t.equal(bets.place.six.amount, 6, 'six unchanged')
  t.equal(bets.place.eight.amount, 12, 'eight pressed to $12 after win')
  t.end()
})

tap.test('pressPlaceSixEight: press accumulates across multiple wins on same number', (t) => {
  const rules = { minBet: 5 }
  const playerMind = {}
  const pointHand = { isComeOut: false, result: 'neutral', point: 5 }

  let bets = lib.pressPlaceSixEight({ rules, hand: { isComeOut: false, result: 'point set', point: 5 }, playerMind })
  delete bets.new

  delete bets.place.six
  bets = lib.pressPlaceSixEight({ rules, bets, hand: pointHand, playerMind })
  t.equal(bets.place.six.amount, 12, 'six at $12 after first win')
  delete bets.new

  delete bets.place.six
  bets = lib.pressPlaceSixEight({ rules, bets, hand: pointHand, playerMind })
  t.equal(bets.place.six.amount, 18, 'six at $18 after second win')
  t.end()
})

tap.test('pressPlaceSixEight: no press and no new wager when bets stay on table', (t) => {
  const rules = { minBet: 5 }
  const playerMind = {}

  let bets = lib.pressPlaceSixEight({ rules, hand: { isComeOut: false, result: 'point set', point: 5 }, playerMind })
  delete bets.new

  bets = lib.pressPlaceSixEight({ rules, bets, hand: { isComeOut: false, result: 'neutral', point: 5 }, playerMind })

  t.equal(bets.place.six.amount, 6, 'six stays at $6')
  t.equal(bets.place.eight.amount, 6, 'eight stays at $6')
  t.equal(bets.new, 0, 'no new wager when bets already on table')
  t.end()
})

tap.test('pressPlaceSixEight: come-out within hand does not trigger press', (t) => {
  const rules = { minBet: 5 }
  const playerMind = {}

  // first point phase: place both
  let bets = lib.pressPlaceSixEight({ rules, hand: { isComeOut: false, result: 'point set', point: 5 }, playerMind })
  delete bets.new

  // point wins, back to come-out (place bets carry over per settle.js)
  bets = lib.pressPlaceSixEight({ rules, bets, hand: { isComeOut: true }, playerMind })
  t.equal(bets.new, 0, 'no new wager on come-out')

  // second point phase — bets still on table, no press
  bets = lib.pressPlaceSixEight({ rules, bets, hand: { isComeOut: false, result: 'point set', point: 9 }, playerMind })
  t.equal(bets.place.six.amount, 6, 'six not pressed after come-out cycle')
  t.equal(bets.place.eight.amount, 6, 'eight not pressed after come-out cycle')
  t.end()
})

tap.test('minPassLineMinOdds: point 5 requires even odds amount', (t) => {
  const rules = { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }
  const hand = { isComeOut: false, result: 'point set', point: 5 }
  const bets = { pass: { line: { amount: 5 } } }

  const result = lib.minPassLineMinOdds({ rules, bets, hand })

  t.ok(result.pass.odds, 'odds placed')
  t.equal(result.pass.odds.amount % 2, 0, 'odds amount is even for point 5')
  t.ok(result.pass.odds.amount >= rules.minBet, 'odds at least minBet')
  t.end()
})

tap.test('minPassLineMinOdds: point 6 requires multiple of 5', (t) => {
  const rules = { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }
  const hand = { isComeOut: false, result: 'point set', point: 6 }
  const bets = { pass: { line: { amount: 5 } } }

  const result = lib.minPassLineMinOdds({ rules, bets, hand })

  t.ok(result.pass.odds, 'odds placed')
  t.equal(result.pass.odds.amount % 5, 0, 'odds amount is multiple of 5 for point 6')
  t.end()
})

tap.test('minPassLineMinOdds: point 4 uses exact line amount', (t) => {
  const rules = { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }
  const hand = { isComeOut: false, result: 'point set', point: 4 }
  const bets = { pass: { line: { amount: 5 } } }

  const result = lib.minPassLineMinOdds({ rules, bets, hand })

  t.equal(result.pass.odds.amount, 5, 'odds equal line amount for point 4')
  t.end()
})

tap.test('minPassLineMinOdds: does not exceed maxOddsMultiple', (t) => {
  const rules = { minBet: 25, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }
  const hand = { isComeOut: false, result: 'point set', point: 6 }
  const bets = { pass: { line: { amount: 25 } } }

  const result = lib.minPassLineMinOdds({ rules, bets, hand })
  const max = rules.maxOddsMultiple[6] * 25

  t.ok(result.pass.odds.amount <= max, 'odds do not exceed table max')
  t.equal(result.pass.odds.amount % 5, 0, 'odds still multiple of 5')
  t.end()
})

tap.test('minPassLineMinOdds: no odds on come-out', (t) => {
  const rules = { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }
  const hand = { isComeOut: true }

  const result = lib.minPassLineMinOdds({ rules, hand })

  t.notOk(result.pass?.odds, 'no odds on come-out')
  t.end()
})

tap.test('minPassLineMidOdds: places roughly half of max odds on point set', (t) => {
  const rules = { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }
  const hand = { isComeOut: false, result: 'point set', point: 5 }
  const bets = { pass: { line: { amount: 5 } } }

  const result = lib.minPassLineMidOdds({ rules, bets, hand })
  const expectedMultiple = Math.ceil(rules.maxOddsMultiple[5] / 2)

  t.ok(result.pass.odds, 'odds placed')
  t.equal(result.pass.odds.amount, expectedMultiple * rules.minBet, 'odds at ceil(maxMultiple/2) * minBet')
  t.end()
})

tap.test('minPassLineMidOdds: no odds on come-out', (t) => {
  const rules = { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }
  const hand = { isComeOut: true }

  const result = lib.minPassLineMidOdds({ rules, hand })

  t.notOk(result.pass?.odds, 'no odds on come-out')
  t.end()
})

const fourBetRules = {
  minBet: 5,
  maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
}

tap.test('fourBetGrindContinuous: come-out places dont pass', (t) => {
  const hand = { isComeOut: true }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand })

  t.equal(bets.dontPass.line.amount, fourBetRules.minBet, "don't pass placed at minBet")
  t.equal(bets.new, fourBetRules.minBet)
  t.end()
})

tap.test('fourBetGrindContinuous: come-out with existing dont pass does nothing', (t) => {
  const hand = { isComeOut: true }
  const bets = lib.fourBetGrindContinuous({
    rules: fourBetRules,
    hand,
    bets: { dontPass: { line: { amount: 5 } } }
  })

  t.equal(bets.new, 0, 'no new bets when dont pass already placed')
  t.end()
})

tap.test('fourBetGrindContinuous: point phase places first come bet', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const existingBets = { dontPass: { line: { amount: 5 } } }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.come.pending.length, 1, 'one come bet pending')
  t.equal(bets.come.pending[0].amount, fourBetRules.minBet)
  t.equal(bets.new, fourBetRules.minBet)
  t.end()
})

tap.test('fourBetGrindContinuous: waits while come bet is pending', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [{ amount: 5 }], points: {} }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.come.pending.length, 1, 'still only one pending come bet')
  t.equal(bets.new, 0, 'no new bets while pending')
  t.end()
})

tap.test('fourBetGrindContinuous: one come established places second come bet', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 4: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.come.pending.length, 1, 'second come bet pending')
  t.equal(bets.new, fourBetRules.minBet)
  t.end()
})

tap.test('fourBetGrindContinuous: waits while second come bet is pending', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [{ amount: 5 }], points: { 4: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.come.pending.length, 1, 'still only one pending')
  t.equal(bets.new, 0)
  t.end()
})

tap.test('fourBetGrindContinuous: two come bets established places dont come', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 4: [{ line: { amount: 5 } }], 9: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.dontCome.pending.length, 1, "don't come pending")
  t.equal(bets.dontCome.pending[0].amount, fourBetRules.minBet)
  t.equal(bets.new, fourBetRules.minBet)
  t.end()
})

tap.test('fourBetGrindContinuous: waits while dont come is pending', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 4: [{ line: { amount: 5 } }], 9: [{ line: { amount: 5 } }] } },
    dontCome: { pending: [{ amount: 5 }], points: {} }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.dontCome.pending.length, 1, 'still only one pending dont come')
  t.equal(bets.new, 0)
  t.end()
})

tap.test('fourBetGrindContinuous: all four established - no new bets', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 4: [{ line: { amount: 5 } }], 9: [{ line: { amount: 5 } }] } },
    dontCome: { pending: [], points: { 8: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.new, 0, 'no bets when all four established')
  t.end()
})

tap.test('fourBetGrindContinuous: replaces lost come bet', (t) => {
  const hand = { isComeOut: false, point: 6 }
  // One come bet was won/lost, only one remains
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 4: [{ line: { amount: 5 } }] } },
    dontCome: { pending: [], points: { 8: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.come.pending.length, 1, 'replacement come bet placed')
  t.equal(bets.new, fourBetRules.minBet)
  t.end()
})

tap.test('fourBetGrindContinuous: replaces lost dont come bet', (t) => {
  const hand = { isComeOut: false, point: 6 }
  // Don't come was lost (its point was rolled), two come bets still established
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 4: [{ line: { amount: 5 } }], 9: [{ line: { amount: 5 } }] } },
    dontCome: { pending: [], points: {} }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.dontCome.pending.length, 1, "replacement don't come placed")
  t.equal(bets.new, fourBetRules.minBet)
  t.end()
})

tap.test('fourBetGrindContinuous: new come-out after point win places dont pass', (t) => {
  const hand = { isComeOut: true }
  // After a point win: dont pass was settled out, come bets may remain
  const existingBets = {
    come: { pending: [], points: { 9: [{ line: { amount: 5 } }] } },
    dontCome: { pending: [], points: { 8: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindContinuous({ rules: fourBetRules, hand, bets: existingBets })

  t.equal(bets.dontPass.line.amount, fourBetRules.minBet, "don't pass re-placed on new come-out")
  t.equal(bets.new, fourBetRules.minBet)
  t.end()
})

tap.test('fourBetGrindLimit: come-out places dont pass and decrements budget', (t) => {
  const hand = { isComeOut: true }
  const playerMind = {}
  const bets = lib.fourBetGrindLimit({ rules: fourBetRules, hand, playerMind })

  t.equal(bets.dontPass.line.amount, fourBetRules.minBet, "don't pass placed at minBet")
  t.equal(bets.new, fourBetRules.minBet)
  t.equal(playerMind.fourBetGrindLimit.unitsRemaining, 3, 'budget decremented to 3')
  t.end()
})

tap.test('fourBetGrindLimit: come-out with existing dont pass does nothing', (t) => {
  const hand = { isComeOut: true }
  const playerMind = { fourBetGrindLimit: { unitsRemaining: 3 } }
  const bets = lib.fourBetGrindLimit({
    rules: fourBetRules,
    hand,
    playerMind,
    bets: { dontPass: { line: { amount: 5 } } }
  })

  t.equal(bets.new, 0, 'no new bets when dont pass already placed')
  t.equal(playerMind.fourBetGrindLimit.unitsRemaining, 3, 'budget unchanged')
  t.end()
})

tap.test('fourBetGrindLimit: point phase places first come bet', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const playerMind = { fourBetGrindLimit: { unitsRemaining: 3 } }
  const existingBets = { dontPass: { line: { amount: 5 } } }
  const bets = lib.fourBetGrindLimit({ rules: fourBetRules, hand, playerMind, bets: existingBets })

  t.equal(bets.come.pending.length, 1, 'one come bet pending')
  t.equal(bets.come.pending[0].amount, fourBetRules.minBet)
  t.equal(bets.new, fourBetRules.minBet)
  t.equal(playerMind.fourBetGrindLimit.unitsRemaining, 2, 'budget decremented to 2')
  t.end()
})

tap.test('fourBetGrindLimit: stops betting when budget reaches zero', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const playerMind = { fourBetGrindLimit: { unitsRemaining: 0 } }
  const existingBets = { dontPass: { line: { amount: 5 } } }
  const bets = lib.fourBetGrindLimit({ rules: fourBetRules, hand, playerMind, bets: existingBets })

  t.equal(bets.new, 0, 'no bets placed when budget is zero')
  t.equal(bets.come, undefined, 'no come bet structure added')
  t.end()
})

tap.test('fourBetGrindLimit: win credits one unit back to budget', (t) => {
  const hand = {
    isComeOut: false,
    point: 6,
    payouts: [{ type: 'come point win', principal: 5, profit: 5 }]
  }
  const playerMind = { fourBetGrindLimit: { unitsRemaining: 0 } }
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 9: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindLimit({ rules: fourBetRules, hand, playerMind, bets: existingBets })

  t.equal(playerMind.fourBetGrindLimit.unitsRemaining, 0, 'win added 1, then bet placed cost 1 — net zero')
  t.equal(bets.come.pending.length, 1, 'was able to place a come bet after win credited')
  t.equal(bets.new, fourBetRules.minBet)
  t.end()
})

tap.test('fourBetGrindLimit: multiple wins in one roll credit multiple units', (t) => {
  const hand = {
    isComeOut: false,
    point: 6,
    payouts: [
      { type: 'come point win', principal: 5, profit: 5 },
      { type: 'dont come win', principal: 5, profit: 5 }
    ]
  }
  const playerMind = { fourBetGrindLimit: { unitsRemaining: 0 } }
  const existingBets = { dontPass: { line: { amount: 5 } } }
  const bets = lib.fourBetGrindLimit({ rules: fourBetRules, hand, playerMind, bets: existingBets })

  t.equal(playerMind.fourBetGrindLimit.unitsRemaining, 1, '2 wins credited, 1 bet placed — net 1 remaining')
  t.equal(bets.new, fourBetRules.minBet, 'one bet placed')
  t.end()
})

tap.test('fourBetGrindLimit: push (profit=0) does not credit a unit', (t) => {
  const hand = {
    isComeOut: false,
    point: 6,
    payouts: [{ type: 'push', principal: 5, profit: 0 }]
  }
  const playerMind = { fourBetGrindLimit: { unitsRemaining: 0 } }
  const existingBets = { dontPass: { line: { amount: 5 } } }
  const bets = lib.fourBetGrindLimit({ rules: fourBetRules, hand, playerMind, bets: existingBets })

  t.equal(playerMind.fourBetGrindLimit.unitsRemaining, 0, 'push does not increase budget')
  t.equal(bets.new, 0, 'no bet placed')
  t.end()
})

tap.test('fourBetGrindLimit: all four established - no new bets', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const playerMind = { fourBetGrindLimit: { unitsRemaining: 0 } }
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 4: [{ line: { amount: 5 } }], 9: [{ line: { amount: 5 } }] } },
    dontCome: { pending: [], points: { 8: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindLimit({ rules: fourBetRules, hand, playerMind, bets: existingBets })

  t.equal(bets.new, 0, 'no bets when all four established and budget zero')
  t.end()
})

tap.test('fourBetGrindLimit: does not replace lost come bet when budget exhausted', (t) => {
  const hand = { isComeOut: false, point: 6 }
  const playerMind = { fourBetGrindLimit: { unitsRemaining: 0 } }
  // One come bet was lost, only one remains — but budget is zero
  const existingBets = {
    dontPass: { line: { amount: 5 } },
    come: { pending: [], points: { 4: [{ line: { amount: 5 } }] } },
    dontCome: { pending: [], points: { 8: [{ line: { amount: 5 } }] } }
  }
  const bets = lib.fourBetGrindLimit({ rules: fourBetRules, hand, playerMind, bets: existingBets })

  t.equal(bets.come.pending.length, 0, 'no replacement come bet when budget is zero')
  t.equal(bets.new, 0)
  t.end()
})
