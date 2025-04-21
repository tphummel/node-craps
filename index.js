'use strict'

const settle = require('./settle.js')
const betting = require('./betting.js')
const { HandResult } = require('./consts.js')

function rollD6 () {
  return 1 + Math.floor(Math.random() * 6)
}

function shoot (before, dice) {
  const sortedDice = dice.sort()

  const after = {
    die1: sortedDice[0],
    die2: sortedDice[1],
    diceSum: dice.reduce((m, r) => { return m + r }, 0)
  }

  // game logic based on: https://github.com/tphummel/dice-collector/blob/master/PyTom/Dice/logic.py

  if (before.isComeOut) {
    if ([2, 3, 12].indexOf(after.diceSum) !== -1) {
      after.result = HandResult.COMEOUT_LOSS
      after.isComeOut = true
    } else if ([7, 11].indexOf(after.diceSum) !== -1) {
      after.result = HandResult.COMEOUT_WIN
      after.isComeOut = true
    } else {
      after.result = HandResult.POINT_SET
      after.isComeOut = false
      after.point = after.diceSum
    }
  } else {
    if (before.point === after.diceSum) {
      after.result = HandResult.POINT_WIN
      after.isComeOut = true
    } else if (after.diceSum === 7) {
      after.result = HandResult.SEVEN_OUT
      after.isComeOut = true
    } else {
      after.result = HandResult.NEUTRAL
      after.point = before.point
      after.isComeOut = false
    }
  }

  return after
}

function playHand ({ rules, bettingStrategy, roll = rollD6 }) {
  const history = []
  let balance = 0

  let hand = {
    isComeOut: true
  }

  let bets

  while (hand.result !== 'seven out') {
    bets = bettingStrategy({ rules, bets, hand })
    balance -= bets.new
    if (process.env.DEBUG && bets.new) console.log(`[bet] new bet $${bets.new} ($${balance})`)
    delete bets.new

    hand = shoot(
      hand,
      [roll(), roll()]
    )

    if (process.env.DEBUG) console.log(`[roll] ${hand.result} (${hand.diceSum})`)

    bets = settle.all({ rules, bets, hand })

    if (bets?.payouts?.total) {
      balance += bets.payouts.total
      if (process.env.DEBUG) console.log(`[payout] new payout $${bets.payouts.total} ($${balance})`)
      delete bets.payouts
    }

    history.push(hand)
  }

  return { history, balance }
}

module.exports = {
  rollD6,
  shoot,
  playHand,
  betting
}
