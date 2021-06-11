'use strict'

const { playHand } = require('./index.js')

const numHands = parseInt(process.argv.slice(2)[0], 10)

console.log(`Simulating ${numHands} Craps Hand(s)`)

const results = {
  handCount: 0,
  rollCount: 0,
  pointsSet: 0,
  pointsWon: 0,
  comeOutWins: 0,
  comeOutLosses: 0,
  netComeOutWins: 0,
  neutrals: 0,
  dist: {
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0
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
  const hand = playHand(rules)
  hands.push(hand)

  hand.reduce((memo, roll) => {
    memo.rollCount++
    memo.dist[roll.diceSum]++

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

results.handCount = hands.length

console.log('\nDice Roll Distribution')
console.table(results.dist)
delete results.dist
console.log('\nSession Summary')
console.table(results)

console.log('\nHands')
hands.forEach((hand, handNum) => {
  console.log(`\nHand: ${handNum + 1}`)
  console.table(hand)
})
