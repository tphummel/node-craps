'use strict'

const tap = require('tap')
const lib = require('./')

tap.test('roll d6', function (t) {
  const result = lib.roll()
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

    const result = lib.shoot(handState, [7, 4])

    t.equal(result.result, 'comeout win')
    t.equal(result.die1, 4)
    t.equal(result.die2, 7)
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

tap.test('playHand', (suite) => {
  const hand = lib.playHand({ bettingStrategy: () => {} })
  suite.ok(Array.isArray(hand))

  suite.end()
})

tap.test('minPassLine betting', (suite) => {
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

  const hand = lib.playHand({ rules, bettingStrategy: () => {} })
  suite.ok(Array.isArray(hand))

  suite.end()
})
