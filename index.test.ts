import { test } from 'tap'
import { DiceResult, DieResult, HandResult, Point } from './consts'
const lib = require('./')
const betting = require('./betting')

interface HandState {
  isComeOut: boolean
  point?: number
}


test('roll d6', function (t) {
  const result = lib.rollD6()
  t.ok(result >= 1, 'd6 roll is 1 or higher')
  t.ok(result <= 6, 'd6 roll is 6 or lower')
  t.match(result, /[1-6]{1}/, 'd6 roll is an integer 1-6')

  t.end()
})

test('comeout', function (suite) {
  suite.test('2', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [1, 1])

    t.equal(result.result, HandResult.COMEOUT_LOSS)
    t.equal(result.die1, DieResult.ONE)
    t.equal(result.die2, DieResult.ONE)
    t.equal(result.diceSum, DiceResult.TWO)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('3', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [2, 1])

    t.equal(result.result, HandResult.COMEOUT_LOSS)
    t.equal(result.die1, DieResult.ONE)
    t.equal(result.die2, DieResult.TWO)
    t.equal(result.diceSum, DiceResult.THREE)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('12', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 6])

    t.equal(result.result, HandResult.COMEOUT_LOSS)
    t.equal(result.die1, DieResult.SIX)
    t.equal(result.die2, DieResult.SIX)
    t.equal(result.diceSum, DiceResult.TWELVE)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.test('7', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [5, 2])

    t.equal(result.result, HandResult.COMEOUT_WIN)
    t.equal(result.die1, DieResult.TWO)
    t.equal(result.die2, DieResult.FIVE)
    t.equal(result.diceSum, DiceResult.SEVEN)
    t.equal(result.isComeOut, true)

    t.end()
  })

  
  suite.test('4', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [3, 1])

    t.equal(result.result, HandResult.POINT_SET)
    t.equal(result.point, Point.FOUR)
    t.equal(result.die1, DieResult.ONE)
    t.equal(result.die2, DieResult.THREE)
    t.equal(result.diceSum, DiceResult.FOUR)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('5', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [3, 2])

    t.equal(result.result, HandResult.POINT_SET)
    t.equal(result.point, Point.FIVE)
    t.equal(result.die1, DieResult.TWO)
    t.equal(result.die2, DieResult.THREE)
    t.equal(result.diceSum, DiceResult.FIVE)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('6', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [4, 2])

    t.equal(result.result, HandResult.POINT_SET)
    t.equal(result.point, Point.SIX)
    t.equal(result.die1, DieResult.TWO)
    t.equal(result.die2, DieResult.FOUR)
    t.equal(result.diceSum, DiceResult.SIX)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('8', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 2])

    t.equal(result.result, HandResult.POINT_SET)
    t.equal(result.point, Point.EIGHT)
    t.equal(result.die1, DieResult.TWO)
    t.equal(result.die2, DieResult.SIX)
    t.equal(result.diceSum, DiceResult.EIGHT)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('9', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 3])

    t.equal(result.result, HandResult.POINT_SET)
    t.equal(result.point, Point.NINE)
    t.equal(result.die1, DieResult.THREE)
    t.equal(result.die2, DieResult.SIX)
    t.equal(result.diceSum, DiceResult.NINE)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('10', function (t) {
    const handState: HandState = {
      isComeOut: true
    }

    const result = lib.shoot(handState, [6, 4])

    t.equal(result.result, HandResult.POINT_SET)
    t.equal(result.point, Point.TEN)
    t.equal(result.die1, DieResult.FOUR)
    t.equal(result.die2, DieResult.SIX)
    t.equal(result.diceSum, DiceResult.TEN)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.end()
})

test('point set', (suite) => {
  suite.test('neutral 2', (t) => {
    const handState: HandState = {
      isComeOut: false,
      point: 5
    }

    const result = lib.shoot(handState, [1, 1])
    t.equal(result.result, HandResult.NEUTRAL)
    t.equal(result.point, Point.FIVE)
    t.equal(result.die1, DieResult.ONE)
    t.equal(result.die2, DieResult.ONE)
    t.equal(result.diceSum, DiceResult.TWO)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('neutral 3', (t) => {
    const handState: HandState = {
      isComeOut: false,
      point: 8
    }

    const result = lib.shoot(handState, [2, 1])
    t.equal(result.result, HandResult.NEUTRAL)
    t.equal(result.point, Point.EIGHT)
    t.equal(result.die1, DieResult.ONE)
    t.equal(result.die2, DieResult.TWO)
    t.equal(result.diceSum, DiceResult.THREE)
    t.equal(result.isComeOut, false)

    t.end()
  })

  suite.test('point win 4', (t) => {
    const handState: HandState = {
      isComeOut: false,
      point: 4
    }

    const result = lib.shoot(handState, [3, 1])
    t.equal(result.result, HandResult.POINT_WIN)
    t.notOk(result.point)
    t.equal(result.die1, DieResult.ONE)
    t.equal(result.die2, DieResult.THREE)
    t.equal(result.diceSum, DiceResult.FOUR)
    t.equal(result.isComeOut, true)

    t.end()
  })

  suite.end()
}) 