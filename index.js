'use strict'

const settle = require('./settle')

function roll () {
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
      after.result = 'comeout loss'
      after.isComeOut = true
    } else if ([7, 11].indexOf(after.diceSum) !== -1) {
      after.result = 'comeout win'
      after.isComeOut = true
    } else {
      after.result = 'point set'
      after.isComeOut = false
      after.point = after.diceSum
    }
  } else {
    if (before.point === after.diceSum) {
      after.result = 'point win'
      after.isComeOut = true
    } else if (after.diceSum === 7) {
      after.result = 'seven out'
      after.isComeOut = true
    } else {
      after.result = 'neutral'
      after.point = before.point
      after.isComeOut = false
    }
  }

  return after
}

function playHand ({ rules, bettingStrategy }) {
  const history = []
  let balance = 0

  let hand = {
    isComeOut: true
  }

  let bets

  while (true) {
    bets = bettingStrategy({ rules, bets, hand })

    // withdraw new bet total from balance. i don't have total bet amount here. get it

    hand = shoot(
      hand,
      [roll(), roll()]
    )

    bets = settle.all({ rules, bets, hand })

    if (bets?.payout) {
      balance += bets.payout.total
      console.log(`new payout: $${bets.payout.total} ($${balance})`)
      delete bets.payout
    }

    history.push(hand)

    if (hand.result === 'seven out') break
  }

  return history
}

module.exports = {
  roll,
  shoot,
  playHand
}
