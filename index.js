'use strict'

const settle = require('./settle.js')
const betting = require('./betting.js')

function rollD6 () {
  return 1 + Math.floor(Math.random() * 6)
}

const defaultRules = {
  comeOutLoss: [2, 3, 12],
  comeOutWin: [7, 11]
}

function shoot (before, dice, rules = defaultRules) {
  rules = Object.assign({}, defaultRules, rules)
  const sortedDice = dice.sort()

  const after = {
    die1: sortedDice[0],
    die2: sortedDice[1],
    diceSum: dice.reduce((m, r) => { return m + r }, 0)
  }

  // game logic based on: https://github.com/tphummel/dice-collector/blob/master/PyTom/Dice/logic.py

  if (before.isComeOut) {
    if (rules.comeOutLoss.includes(after.diceSum)) {
      after.result = 'comeout loss'
      after.isComeOut = true
    } else if (rules.comeOutWin.includes(after.diceSum)) {
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

function playHand ({ rules, bettingStrategy, roll = rollD6, balance = 0 }) {
  const history = []

  let hand = {
    isComeOut: true
  }

  let bets

  while (hand.result !== 'seven out') {
    bets = bettingStrategy({ rules, bets, hand })
    balance -= bets.new
    if (process.env.DEBUG) {
      console.log(`-----Beginning Roll ${history.length + 1}-----\n`)
      if (bets.new) {
        console.log(`[bet] new bet $${bets.new} ($${balance})`)
      } else {
        console.log('[bet] no new bet')
      }
    }
    const betsBefore = JSON.parse(JSON.stringify(bets))
    delete bets.new

    hand = shoot(
      hand,
      [roll(), roll()],
      rules
    )

    if (process.env.DEBUG) console.log(`[roll] ${hand.result} (${hand.diceSum})`)

    bets = settle.all({ rules, bets, hand })

    const payouts = bets.payouts
    if (payouts?.total) {
      balance += payouts.total
      if (process.env.DEBUG) console.log(`[payout] new payout $${payouts.total} ($${balance})`)
    } else if (process.env.DEBUG) {
      console.log('[payout] no payout')
    }

    if (payouts?.ledger?.length) {
      hand.payouts = payouts.ledger
    }

    if (payouts) delete bets.payouts

    hand.betsBefore = betsBefore
    history.push(hand)
  }

  return { history, balance }
}

module.exports = {
  rollD6,
  shoot,
  playHand,
  betting,
  defaultRules
}
