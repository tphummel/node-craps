'use strict'

const { playHand } = require('./index.js')
const { minPassLineMaxOdds } = require('./betting.js')

const numHands = parseInt(process.argv.slice(2)[0], 10)
const showDetail = process.argv.slice(2)[1]

console.log(`Simulating ${numHands} Craps Hand(s)`)

const results = {
  handCount: 0,
  balance: 0,
  rollCount: 0,
  pointsSet: 0,
  pointsWon: 0,
  comeOutWins: 0,
  comeOutLosses: 0,
  netComeOutWins: 0,
  neutrals: 0,
  dist: {
    2: { ct: 0, prob: 1 / 36 },
    3: { ct: 0, prob: 2 / 36 },
    4: { ct: 0, prob: 3 / 36 },
    5: { ct: 0, prob: 4 / 36 },
    6: { ct: 0, prob: 5 / 36 },
    7: { ct: 0, prob: 6 / 36 },
    8: { ct: 0, prob: 5 / 36 },
    9: { ct: 0, prob: 4 / 36 },
    10: { ct: 0, prob: 3 / 36 },
    11: { ct: 0, prob: 2 / 36 },
    12: { ct: 0, prob: 1 / 36 }
  }
}

const hands = []
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

for (let i = 0; i < numHands; i++) {
  const hand = playHand({ rules, bettingStrategy: minPassLineMaxOdds })
  hands.push(hand)
  results.handCount++
  results.balance += hand.balance

  hand.history.reduce((memo, roll) => {
    memo.rollCount++
    memo.dist[roll.diceSum].ct++

    switch (roll.result) {
      case 'neutral':
        memo.neutrals++
        break
      case 'point set':
        memo.pointsSet++
        break
      case 'point win':
        memo.pointsWon++
        break
      case 'comeout win':
        memo.comeOutWins++
        memo.netComeOutWins++
        break
      case 'comeout loss':
        memo.comeOutLosses++
        memo.netComeOutWins--
        break
    }

    return memo
  }, results)
}

for (const k of Object.keys(results.dist)) {
  results.dist[k].ref = Number((results.dist[k].prob * results.rollCount).toFixed(1))
  results.dist[k].diff = Number((results.dist[k].ct - results.dist[k].ref).toFixed(1))
  results.dist[k].diff_pct = Number((((results.dist[k].ct - results.dist[k].ref) / results.dist[k].ref) * 100).toFixed(1))
  delete results.dist[k].prob
}
console.log('\nDice Roll Distribution')
console.table(results.dist)
delete results.dist
console.log('\nSession Summary')
console.table(results)

if (showDetail) {
  console.log('\nHands')
  hands.forEach((hand, handNum) => {
    console.log(`\nHand: ${handNum + 1}, Balance: $${hand.balance}`)
    console.table(hand.history)
  })
}
