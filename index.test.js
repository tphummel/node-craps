'use strict'

const tap = require('tap')
const lib = require('./')
const betting = require('./betting')

tap.test('roll d6', function (t) {
  const result = lib.rollD6()
  t.ok(result >= 1, 'd6 roll is 1 or higher')
  t.ok(result <= 6, 'd6 roll is 6 or lower')
  t.match(result, /[1-6]{1}/, 'd6 roll is an integer 1-6')

  t.end()
})

tap.test('comeout', function (suite) {
  suite.test('2', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [1, 1])

    t.equal(result.result, 'comeout loss')
    t.equal(result.die1, 1)
    t.equal(result.die2, 1)
    t.equal(result.diceSum, 2)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('3', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [2, 1])

    t.equal(result.result, 'comeout loss')
    t.equal(result.die1, 1)
    t.equal(result.die2, 2)
    t.equal(result.diceSum, 3)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('12', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 6])

    t.equal(result.result, 'comeout loss')
    t.equal(result.die1, 6)
    t.equal(result.die2, 6)
    t.equal(result.diceSum, 12)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('7', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [5, 2])

    t.equal(result.result, 'comeout win')
    t.equal(result.die1, 2)
    t.equal(result.die2, 5)
    t.equal(result.diceSum, 7)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('11', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 5])

    t.equal(result.result, 'comeout win')
    t.equal(result.die1, 5)
    t.equal(result.die2, 6)
    t.equal(result.diceSum, 11)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('4', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [3, 1])

    t.equal(result.result, 'point set')
    t.equal(result.point, 4)
    t.equal(result.die1, 1)
    t.equal(result.die2, 3)
    t.equal(result.diceSum, 4)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('5', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [3, 2])

    t.equal(result.result, 'point set')
    t.equal(result.point, 5)
    t.equal(result.die1, 2)
    t.equal(result.die2, 3)
    t.equal(result.diceSum, 5)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('6', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [4, 2])

    t.equal(result.result, 'point set')
    t.equal(result.point, 6)
    t.equal(result.die1, 2)
    t.equal(result.die2, 4)
    t.equal(result.diceSum, 6)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('8', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 2])

    t.equal(result.result, 'point set')
    t.equal(result.point, 8)
    t.equal(result.die1, 2)
    t.equal(result.die2, 6)
    t.equal(result.diceSum, 8)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('9', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 3])

    t.equal(result.result, 'point set')
    t.equal(result.point, 9)
    t.equal(result.die1, 3)
    t.equal(result.die2, 6)
    t.equal(result.diceSum, 9)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('10', function (t) {
    const handState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 4])

    t.equal(result.result, 'point set')
    t.equal(result.point, 10)
    t.equal(result.die1, 4)
    t.equal(result.die2, 6)
    t.equal(result.diceSum, 10)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.end()
})

tap.test('comeout with custom rules', (t) => {
  const handState = {
    isComeOut: true
  }

  const rules = {
    comeOutLoss: [2, 3],
    comeOutWin: [7, 11, 12]
  }

  const result = lib.shoot(handState, [6, 6], rules)
  t.equal(result.result, 'comeout win')
  t.notOk(result.point)
  t.equal(result.die1, 6)
  t.equal(result.die2, 6)
  t.equal(result.diceSum, 12)
  t.equal(result.isComeOut, true)

  t.end()
})

tap.test('point set', (suite) => {
  suite.test('neutral 2', (t) => {
    const handState = {
      isComeOut: false,
      point: 5
    }

    const result = lib.shoot(handState, [1, 1])
    t.equal(result.result, 'neutral')
    t.equal(result.point, 5)
    t.equal(result.die1, 1)
    t.equal(result.die2, 1)
    t.equal(result.diceSum, 2)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('neutral 3', (t) => {
    const handState = {
      isComeOut: false,
      point: 8
    }

    const result = lib.shoot(handState, [2, 1])
    t.equal(result.result, 'neutral')
    t.equal(result.point, 8)
    t.equal(result.die1, 1)
    t.equal(result.die2, 2)
    t.equal(result.diceSum, 3)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('point win 4', (t) => {
    const handState = {
      isComeOut: false,
      point: 4
    }

    const result = lib.shoot(handState, [3, 1])
    t.equal(result.result, 'point win')
    t.notOk(result.point)
    t.equal(result.die1, 1)
    t.equal(result.die2, 3)
    t.equal(result.diceSum, 4)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('point win 5', (t) => {
    const handState = {
      isComeOut: false,
      point: 5
    }

    const result = lib.shoot(handState, [3, 2])
    t.equal(result.result, 'point win')
    t.notOk(result.point)
    t.equal(result.die1, 2)
    t.equal(result.die2, 3)
    t.equal(result.diceSum, 5)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('point win 6', (t) => {
    const handState = {
      isComeOut: false,
      point: 6
    }

    const result = lib.shoot(handState, [3, 3])
    t.equal(result.result, 'point win')
    t.notOk(result.point)
    t.equal(result.die1, 3)
    t.equal(result.die2, 3)
    t.equal(result.diceSum, 6)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('seven out', (t) => {
    const handState = {
      isComeOut: false,
      point: 6
    }

    const result = lib.shoot(handState, [3, 4])
    t.equal(result.result, 'seven out')
    t.notOk(result.point)
    t.equal(result.die1, 3)
    t.equal(result.die2, 4)
    t.equal(result.diceSum, 7)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('point win 8', (t) => {
    const handState = {
      isComeOut: false,
      point: 8
    }

    const result = lib.shoot(handState, [3, 5])
    t.equal(result.result, 'point win')
    t.notOk(result.point)
    t.equal(result.die1, 3)
    t.equal(result.die2, 5)
    t.equal(result.diceSum, 8)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('point win 9', (t) => {
    const handState = {
      isComeOut: false,
      point: 9
    }

    const result = lib.shoot(handState, [4, 5])
    t.equal(result.result, 'point win')
    t.notOk(result.point)
    t.equal(result.die1, 4)
    t.equal(result.die2, 5)
    t.equal(result.diceSum, 9)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('point win 10', (t) => {
    const handState = {
      isComeOut: false,
      point: 10
    }

    const result = lib.shoot(handState, [4, 6])
    t.equal(result.result, 'point win')
    t.notOk(result.point)
    t.equal(result.die1, 4)
    t.equal(result.die2, 6)
    t.equal(result.diceSum, 10)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('neutral yo 11', (t) => {
    const handState = {
      isComeOut: false,
      point: 10
    }

    const result = lib.shoot(handState, [6, 5])
    t.equal(result.result, 'neutral')
    t.equal(result.point, 10)
    t.equal(result.die1, 5)
    t.equal(result.die2, 6)
    t.equal(result.diceSum, 11)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('neutral 12', (t) => {
    const handState = {
      isComeOut: false,
      point: 9
    }

    const result = lib.shoot(handState, [6, 6])
    t.equal(result.result, 'neutral')
    t.equal(result.point, 9)
    t.equal(result.die1, 6)
    t.equal(result.die2, 6)
    t.equal(result.diceSum, 12)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.end()
})

tap.test('integration: minPassLineOnly, one hand with everything', (suite) => {
  let rollCount = -1
  const fixedRolls = [
    4, 3, // comeout win
    5, 6, // comeout win
    1, 1, // comeout loss
    1, 2, // comeout loss
    6, 6, // comeout loss
    3, 3, // point set
    4, 1, // neutral
    2, 4, // point win
    4, 4, // point set
    3, 4 // seven out
  ]

  function testRoll () {
    rollCount++
    if (!fixedRolls[rollCount]) {
      console.log('falsy return from fixed dice')
      process.exit(1)
    }
    return fixedRolls[rollCount]
  }

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

  const hand = lib.playHand({ rules, roll: testRoll, bettingStrategy: betting.minPassLineOnly })
  suite.ok(Array.isArray(hand.history))
  suite.equal(hand.balance, -5)

  suite.end()
})

tap.test('integration: minPassLineMaxOdds, one hand with everything', (suite) => {
  let rollCount = -1
  const fixedRolls = [
    4, 3, // comeout win
    5, 6, // comeout win
    1, 1, // comeout loss
    1, 2, // comeout loss
    6, 6, // comeout loss
    3, 3, // point set
    4, 1, // neutral
    2, 4, // point win
    4, 4, // point set
    3, 4 // seven out
  ]

  function testRoll () {
    rollCount++
    if (!fixedRolls[rollCount]) {
      console.log('falsy return from fixed dice')
      process.exit(1)
    }
    return fixedRolls[rollCount]
  }

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

  const hand = lib.playHand({ rules, roll: testRoll, bettingStrategy: betting.minPassLineMaxOdds })
  suite.ok(Array.isArray(hand.history))

  // i did this with pen and paper
  // $0 is where the balance should be at the end of this hand
  // with the fixed rolls above
  suite.equal(hand.balance, 0)

  suite.end()
})

tap.test('integration: placeSixEight returns payout details', (t) => {
  let rollCount = -1
  const fixedRolls = [
    2, 3, // point set to 5
    3, 3, // place 6 win
    4, 4, // place 8 win
    3, 4 // seven out
  ]

  function testRoll () {
    rollCount++
    return fixedRolls[rollCount]
  }

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

  const hand = lib.playHand({ rules, roll: testRoll, bettingStrategy: betting.placeSixEight })

  t.equal(hand.history[1].payouts[0].type, 'place 6 win')
  t.equal(hand.history[2].payouts[0].type, 'place 8 win')
  t.equal(hand.history[3].result, 'seven out')
  t.ok(hand.history[3].betsBefore.place.six)
  t.ok(hand.history[3].betsBefore.place.eight)

  t.end()
})

tap.test('integration: noBetting strategy, hand plays out with no balance change', (t) => {
  let rollCount = -1
  const fixedRolls = [
    3, 3, // point set to 6
    4, 1, // neutral
    3, 4 // seven out
  ]

  function testRoll () {
    rollCount++
    return fixedRolls[rollCount]
  }

  const rules = {
    minBet: 5,
    maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
  }

  const hand = lib.playHand({ rules, roll: testRoll, bettingStrategy: betting.noBetting })

  t.ok(Array.isArray(hand.history), 'has roll history')
  t.equal(hand.history.length, 3, 'three rolls recorded')
  t.equal(hand.history[0].result, 'point set', 'first roll sets point')
  t.equal(hand.history[1].result, 'neutral', 'second roll is neutral')
  t.equal(hand.history[2].result, 'seven out', 'third roll is seven out')
  t.equal(hand.balance, 0, 'balance unchanged with no betting')
  t.notOk(hand.history[2].payouts, 'no payouts when not betting')

  t.end()
})

tap.test('integration: noBetting strategy handles comeout win before seven out', (t) => {
  const fixedRolls = [
    4, 3, // 7: comeout win
    3, 3, // 6: point set
    3, 4 // 7: seven out
  ]

  let rollCount = -1
  function testRoll () {
    rollCount++
    return fixedRolls[rollCount]
  }

  const rules = {
    minBet: 5,
    maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
  }

  const hand = lib.playHand({ rules, roll: testRoll, bettingStrategy: betting.noBetting })

  t.ok(Array.isArray(hand.history), 'has roll history')
  t.equal(hand.history[0].result, 'comeout win', 'first roll is comeout win')
  t.equal(hand.history[1].result, 'point set', 'second roll sets point')
  t.equal(hand.history[2].result, 'seven out', 'third roll is seven out')
  t.equal(hand.balance, 0, 'balance unchanged with no betting')

  t.end()
})

tap.test('integration: withFiveCount delays betting until 5-count then delegates', (t) => {
  // call 0: hand={isComeOut:true}        → count 0→0, no bet | roll [3,3]=6 → point set
  // call 1: hand={point set, sum:6}      → count 0→1, no bet | roll [1,2]=3 → neutral
  // call 2: hand={neutral, sum:3}        → count 1→2, no bet | roll [2,2]=4 → neutral
  // call 3: hand={neutral, sum:4}        → count 2→3, no bet | roll [1,3]=4 → neutral
  // call 4: hand={neutral, sum:4}        → count 3→4, no bet | roll [5,6]=11 → neutral
  // call 5: hand={neutral, sum:11}       → count 4→4 stalls (11 not a point #), no bet | roll [3,5]=8 → neutral
  // call 6: hand={neutral, sum:8}        → count 4→5 (8 IS a point #), delegates but not comeout, no bet | roll [3,3]=6 → point win
  // call 7: hand={point win, sum:6}      → count 5, delegates, isComeOut=true → pass line bet! | roll [3,1]=4 → point set
  // call 8: hand={point set, sum:4}      → count 5, delegates, no new bet | roll [3,4]=7 → seven out
  const fixedRolls = [
    3, 3, // 6: comeout → point set → 1-count
    1, 2, // 3: neutral → 2-count
    2, 2, // 4: neutral → 3-count
    1, 3, // 4: neutral → 4-count
    5, 6, // 11: neutral → stalls at 4 (not a point number)
    3, 5, // 8: neutral → 5-count achieved
    3, 3, // 6: point win → comeout (delegates, isComeOut=true → pass line bet placed)
    3, 1, // 4: point set
    3, 4 // 7: seven out
  ]

  let rollCount = -1
  function testRoll () {
    rollCount++
    return fixedRolls[rollCount]
  }

  const rules = {
    minBet: 5,
    maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
  }

  const hand = lib.playHand({
    rules,
    roll: testRoll,
    bettingStrategy: betting.withFiveCount(betting.minPassLineOnly)
  })

  // Rolls 1-6: counting phase (indices 0-5), no bets
  for (let i = 0; i <= 5; i++) {
    t.equal(hand.history[i].betsBefore.new, 0, `roll ${i + 1}: no bet while counting`)
    t.notOk(hand.history[i].betsBefore.pass, `roll ${i + 1}: no pass bet while counting`)
  }

  // Roll 7 (index 6): 5-count achieved this call but point phase, underlying strategy can't bet
  t.equal(hand.history[6].betsBefore.new, 0, 'roll 7: 5-count achieved but not comeout, no bet')
  t.notOk(hand.history[6].betsBefore.pass, 'roll 7: still no pass bet')

  // Roll 8 (index 7): first comeout after 5-count — pass line fires
  t.equal(hand.history[7].betsBefore.new, rules.minBet, 'roll 8: pass line placed on first comeout after 5-count')
  t.equal(hand.history[7].betsBefore.pass.line.amount, rules.minBet, 'pass line amount correct')

  t.equal(hand.history[8].result, 'seven out', 'hand ends in seven out')
  t.equal(hand.balance, -rules.minBet, 'balance reflects one lost pass line bet')

  t.end()
})

tap.test('integration: starting balance is applied', (t) => {
  let rollCount = -1
  const fixedRolls = [
    4, 3, // comeout win
    5, 6, // comeout win
    1, 1, // comeout loss
    1, 2, // comeout loss
    6, 6, // comeout loss
    3, 3, // point set
    4, 1, // neutral
    2, 4, // point win
    4, 4, // point set
    3, 4 // seven out
  ]

  function testRoll () {
    rollCount++
    if (!fixedRolls[rollCount]) {
      console.log('falsy return from fixed dice')
      process.exit(1)
    }
    return fixedRolls[rollCount]
  }

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

  const startingBalance = 50
  const hand = lib.playHand({
    rules,
    roll: testRoll,
    bettingStrategy: betting.minPassLineOnly,
    balance: startingBalance
  })

  t.ok(Array.isArray(hand.history))
  t.equal(hand.balance, startingBalance - 5)

  t.end()
})
