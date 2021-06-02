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

  suite.end()
})
