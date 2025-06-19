#!/usr/bin/env node
'use strict'

const { playHand } = require('./index.js')
const { minPassLineMaxOddsPlaceSixEight } = require('./betting.js')

function simulateHands (numHands, showDetail) {
  const summaryTemplate = {
    balance: 0,
    rollCount: 0,
    pointsSet: 0,
    pointsWon: 0,
    comeOutWins: 0,
    comeOutLosses: 0,
    netComeOutWins: 0,
    neutrals: 0,
    placeSixWins: 0,
    placeSixLosses: 0,
    placeEightWins: 0,
    placeEightLosses: 0,
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

  const sessionSummary = Object.assign({}, summaryTemplate)
  const hands = []
  const rules = {
    minBet: 10,
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
    if (process.env.DEBUG) {
      console.log(`\n================ HAND ${i + 1} ================`)
    }
    const hand = playHand({ rules, bettingStrategy: minPassLineMaxOddsPlaceSixEight })
    hand.summary = Object.assign({}, summaryTemplate)

    sessionSummary.balance += hand.balance
    hand.summary.balance = hand.balance

    hand.history.reduce((memo, roll) => {
      memo.rollCount++
      hand.summary.rollCount++
      memo.dist[roll.diceSum].ct++

      switch (roll.result) {
        case 'neutral':
          memo.neutrals++
          hand.summary.neutrals++
          break
        case 'point set':
          memo.pointsSet++
          hand.summary.pointsSet++
          break
        case 'point win':
          memo.pointsWon++
          hand.summary.pointsWon++
          break
        case 'comeout win':
          memo.comeOutWins++
          hand.summary.comeOutWins++
          memo.netComeOutWins++
          hand.summary.netComeOutWins++
          break
        case 'comeout loss':
          memo.comeOutLosses++
          hand.summary.comeOutLosses++
          memo.netComeOutWins--
          hand.summary.netComeOutWins--
          break
      }

      if (Array.isArray(roll.payouts)) {
        roll.payouts.forEach(p => {
          if (p.type === 'place 6 win') {
            memo.placeSixWins++
            hand.summary.placeSixWins++
          } else if (p.type === 'place 8 win') {
            memo.placeEightWins++
            hand.summary.placeEightWins++
          }
        })
      }

      if (roll.result === 'seven out') {
        if (roll.betsBefore?.place?.six) {
          memo.placeSixLosses++
          hand.summary.placeSixLosses++
        }
        if (roll.betsBefore?.place?.eight) {
          memo.placeEightLosses++
          hand.summary.placeEightLosses++
        }
      }

      return memo
    }, sessionSummary)

    hands.push(hand)
  }

  sessionSummary.handCount = hands.length

  for (const k of Object.keys(sessionSummary.dist)) {
    sessionSummary.dist[k].ref = Number((sessionSummary.dist[k].prob * sessionSummary.rollCount).toFixed(1))
    sessionSummary.dist[k].diff = Number((sessionSummary.dist[k].ct - sessionSummary.dist[k].ref).toFixed(1))
    sessionSummary.dist[k].diff_pct = Number((((sessionSummary.dist[k].ct - sessionSummary.dist[k].ref) / sessionSummary.dist[k].ref) * 100).toFixed(1))
    if (showDetail) {
      sessionSummary.dist[k].ref_work = `${(sessionSummary.dist[k].prob * sessionSummary.rollCount).toFixed(1)} (${sessionSummary.rollCount} * ${sessionSummary.dist[k].prob.toFixed(2)})`
    }
    delete sessionSummary.dist[k].prob
  }

  return { sessionSummary, hands, rules }
}

function printResults ({ sessionSummary, hands, showDetail, rules }) {
  console.log(`[table rules] minimum bet: $${rules.minBet}`)

  console.log('\nDice Roll Distribution')
  console.table(sessionSummary.dist)
  delete sessionSummary.dist

  console.log('\nSession Summary')
  console.table(sessionSummary)

  console.log('\nHands Summary')
  console.table(hands.map(hand => {
    delete hand.summary.dist
    return hand.summary
  }))

  if (showDetail) {
    console.log('\nHands')
    hands.forEach((hand, handNum) => {
      console.log(`\nHand: ${handNum + 1}, Balance: $${hand.balance}`)
      console.table(hand.history)
    })
  }
}

if (require.main === module) {
  const numHands = parseInt(process.argv[2], 10)
  const showDetail = process.argv[3]
  console.log(`Simulating ${numHands} Craps Hand(s)`)
  console.log('Using betting strategy: minPassLineMaxOddsPlaceSixEight')
  const result = simulateHands(numHands, showDetail)
  printResults({ ...result, showDetail })
} else {
  module.exports = simulateHands
}
