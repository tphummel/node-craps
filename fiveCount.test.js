'use strict'

const tap = require('tap')
const { updateFiveCount, withFiveCount } = require('./fiveCount.js')
const betting = require('./betting.js')
const { playHand } = require('./index.js')

const rules = { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }

tap.test('updateFiveCount: no previous roll leaves count at 0', (t) => {
  t.equal(updateFiveCount(0, { isComeOut: true }), 0)
  t.end()
})

tap.test('updateFiveCount: comeout win or loss does not start the count', (t) => {
  t.equal(updateFiveCount(0, { result: 'comeout win', diceSum: 7, isComeOut: true }), 0)
  t.equal(updateFiveCount(0, { result: 'comeout win', diceSum: 11, isComeOut: true }), 0)
  t.equal(updateFiveCount(0, { result: 'comeout loss', diceSum: 2, isComeOut: true }), 0)
  t.equal(updateFiveCount(0, { result: 'comeout loss', diceSum: 3, isComeOut: true }), 0)
  t.equal(updateFiveCount(0, { result: 'comeout loss', diceSum: 12, isComeOut: true }), 0)
  t.end()
})

tap.test('updateFiveCount: point set on comeout starts 1-count', (t) => {
  const pointNumbers = [4, 5, 6, 8, 9, 10]
  pointNumbers.forEach(n => {
    t.equal(updateFiveCount(0, { result: 'point set', diceSum: n }), 1, `point set on ${n} → 1`)
  })
  t.end()
})

tap.test('updateFiveCount: counts 1 through 3 auto-advance on any roll result', (t) => {
  const anyRolls = [
    { result: 'neutral', diceSum: 2 },
    { result: 'neutral', diceSum: 11 },
    { result: 'point win', diceSum: 6 },
    { result: 'comeout win', diceSum: 7 }
  ]

  anyRolls.forEach(hand => {
    t.equal(updateFiveCount(1, hand), 2, `count 1 → 2 on ${hand.result} (${hand.diceSum})`)
    t.equal(updateFiveCount(2, hand), 3, `count 2 → 3 on ${hand.result} (${hand.diceSum})`)
    t.equal(updateFiveCount(3, hand), 4, `count 3 → 4 on ${hand.result} (${hand.diceSum})`)
  })

  t.end()
})

tap.test('updateFiveCount: count 4 advances to 5 only on a point number', (t) => {
  const pointNumbers = [4, 5, 6, 8, 9, 10]
  const nonPointNumbers = [2, 3, 7, 11, 12]

  pointNumbers.forEach(n => {
    t.equal(updateFiveCount(4, { result: 'neutral', diceSum: n }), 5, `count 4 → 5 on ${n}`)
  })

  nonPointNumbers.forEach(n => {
    t.equal(updateFiveCount(4, { result: 'neutral', diceSum: n }), 4, `count 4 holds on ${n}`)
  })

  t.end()
})

tap.test('updateFiveCount: count 5 stays at 5', (t) => {
  t.equal(updateFiveCount(5, { result: 'neutral', diceSum: 8 }), 5)
  t.equal(updateFiveCount(5, { result: 'point win', diceSum: 6 }), 5)
  t.equal(updateFiveCount(5, { result: 'comeout win', diceSum: 7 }), 5)
  t.end()
})

tap.test('withFiveCount: count does not start on initial call (no prior roll)', (t) => {
  const strategy = withFiveCount(betting.minPassLineOnly)
  const playerMind = {}

  const bets = strategy({ rules, bets: undefined, hand: { isComeOut: true }, playerMind })

  t.equal(playerMind.fiveCount.count, 0, 'count stays 0 before any roll')
  t.equal(bets.new, 0, 'no bet')
  t.end()
})

tap.test('withFiveCount: comeout win or loss does not start the count', (t) => {
  const strategy = withFiveCount(betting.minPassLineOnly)

  const noCountHands = [
    { result: 'comeout win', diceSum: 7, isComeOut: true },
    { result: 'comeout win', diceSum: 11, isComeOut: true },
    { result: 'comeout loss', diceSum: 2, isComeOut: true },
    { result: 'comeout loss', diceSum: 3, isComeOut: true },
    { result: 'comeout loss', diceSum: 12, isComeOut: true }
  ]

  noCountHands.forEach(hand => {
    const playerMind = {}
    const bets = strategy({ rules, bets: undefined, hand, playerMind })
    t.equal(playerMind.fiveCount.count, 0, `count stays 0 after ${hand.result} (${hand.diceSum})`)
    t.equal(bets.new, 0, 'no bet')
  })

  t.end()
})

tap.test('withFiveCount: tracks count through a full sequence via playerMind', (t) => {
  const strategy = withFiveCount(betting.noBetting)
  const playerMind = {}
  let bets

  // Initial call: no result yet
  bets = strategy({ rules, bets, hand: { isComeOut: true }, playerMind })
  t.equal(playerMind.fiveCount.count, 0, 'count 0 before any roll')
  t.equal(bets.new, 0)

  // point set → 1-count
  bets = strategy({ rules, bets, hand: { result: 'point set', diceSum: 6, isComeOut: false }, playerMind })
  t.equal(playerMind.fiveCount.count, 1, '1-count after point set')
  t.equal(bets.new, 0)

  // neutral → 2-count
  bets = strategy({ rules, bets, hand: { result: 'neutral', diceSum: 9, isComeOut: false }, playerMind })
  t.equal(playerMind.fiveCount.count, 2, '2-count')

  // neutral → 3-count
  bets = strategy({ rules, bets, hand: { result: 'neutral', diceSum: 3, isComeOut: false }, playerMind })
  t.equal(playerMind.fiveCount.count, 3, '3-count')

  // neutral → 4-count
  bets = strategy({ rules, bets, hand: { result: 'neutral', diceSum: 11, isComeOut: false }, playerMind })
  t.equal(playerMind.fiveCount.count, 4, '4-count')
  t.equal(bets.new, 0, 'still no bet at 4-count')

  t.end()
})

tap.test('withFiveCount: count 4 stalls on non-point numbers, advances on point number', (t) => {
  const strategy = withFiveCount(betting.noBetting)
  const playerMind = { fiveCount: { count: 4 } }
  let bets = {}

  // Non-point numbers: stall
  bets = strategy({ rules, bets, hand: { result: 'neutral', diceSum: 11, isComeOut: false }, playerMind })
  t.equal(playerMind.fiveCount.count, 4, 'stalls at 4 on 11')

  bets = strategy({ rules, bets, hand: { result: 'neutral', diceSum: 2, isComeOut: false }, playerMind })
  t.equal(playerMind.fiveCount.count, 4, 'stalls at 4 on 2')

  // Point number: advances
  strategy({ rules, bets, hand: { result: 'neutral', diceSum: 8, isComeOut: false }, playerMind })
  t.equal(playerMind.fiveCount.count, 5, 'advances to 5 on point number 8')

  t.end()
})

tap.test('withFiveCount: delegates to underlying strategy once 5-count reached', (t) => {
  const strategy = withFiveCount(betting.minPassLineOnly)
  const playerMind = { fiveCount: { count: 5 } }

  // On a come-out roll: minPassLineOnly should fire
  const bets = strategy({
    rules,
    bets: undefined,
    hand: { isComeOut: true, result: 'point win', diceSum: 6 },
    playerMind
  })

  t.equal(playerMind.fiveCount.count, 5, 'count stays at 5')
  t.equal(bets.pass.line.amount, rules.minBet, 'underlying strategy placed pass line bet')
  t.equal(bets.new, rules.minBet, 'new wager recorded')
  t.end()
})

tap.test('withFiveCount: count resets when a fresh playerMind is passed', (t) => {
  const strategy = withFiveCount(betting.minPassLineOnly)

  // Simulate new hand: fresh playerMind (as playHand initialises per hand)
  const freshMind = {}
  const bets = strategy({ rules, bets: undefined, hand: { isComeOut: true }, playerMind: freshMind })

  t.equal(freshMind.fiveCount.count, 0, 'count starts at 0 on fresh playerMind')
  t.equal(bets.new, 0, 'no bet on new hand')
  t.end()
})

tap.test('withFiveCount: once achieved, 5-count is durable for remaining rolls', (t) => {
  const strategy = withFiveCount(betting.noBetting)
  const playerMind = { fiveCount: { count: 5 } }
  let bets = {}

  const subsequentRolls = [
    { result: 'neutral', diceSum: 3 },
    { result: 'neutral', diceSum: 7 },
    { result: 'comeout win', diceSum: 11 },
    { result: 'point win', diceSum: 6 }
  ]

  subsequentRolls.forEach(hand => {
    bets = strategy({ rules, bets, hand, playerMind })
    t.equal(playerMind.fiveCount.count, 5, `count stays 5 after ${hand.result} (${hand.diceSum})`)
  })

  t.end()
})

tap.test('smoke: withFiveCount delays betting through a full hand via playHand', (t) => {
  // call 0: hand={isComeOut:true}        → count 0→0, no bet | roll [3,3]=6 → point set
  // call 1: hand={point set, sum:6}      → count 0→1, no bet | roll [1,2]=3 → neutral
  // call 2: hand={neutral, sum:3}        → count 1→2, no bet | roll [2,2]=4 → neutral
  // call 3: hand={neutral, sum:4}        → count 2→3, no bet | roll [1,3]=4 → neutral
  // call 4: hand={neutral, sum:4}        → count 3→4, no bet | roll [5,6]=11 → neutral
  // call 5: hand={neutral, sum:11}       → count 4→4 stalls (11 not point #), no bet | roll [3,5]=8 → neutral
  // call 6: hand={neutral, sum:8}        → count 4→5 (8 IS point #), delegates but not comeout, no bet | roll [3,3]=6 → point win
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

  const result = playHand({
    rules: { minBet: 5, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } },
    roll: testRoll,
    bettingStrategy: withFiveCount(betting.minPassLineOnly)
  })

  // Rolls 1-7: no bets (counting phase + first delegated non-comeout roll)
  for (let i = 0; i <= 6; i++) {
    t.equal(result.history[i].betsBefore.new, 0, `roll ${i + 1}: no bet`)
  }

  // Roll 8: first comeout after 5-count — pass line fires
  t.equal(result.history[7].betsBefore.pass.line.amount, 5, 'pass line placed after 5-count')

  t.equal(result.history[8].result, 'seven out', 'hand ends in seven out')
  t.equal(result.balance, -5, 'balance reflects one lost pass line bet')

  t.end()
})
