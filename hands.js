#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { playHand } from './index.js'
import * as bettingStrategies from './betting.js'

function simulateHands ({ numHands, bettingStrategy, showDetail }) {
  const summaryTemplate = {
    balance: 0,
    rollCount: 0,
    pointsSet: 0,
    pointsWon: 0,
    comeOutWins: 0,
    comeOutLosses: 0,
    netComeOutWins: 0,
    neutrals: 0,
    comeLineWins: 0,
    comeLineLosses: 0,
    comeOddsWins: 0,
    comeOddsLosses: 0,
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
    minBet: 15,
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
    const hand = playHand({ rules, bettingStrategy: bettingStrategies[bettingStrategy] })
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
          } else if (p.type === 'come line win') {
            memo.comeLineWins++
            hand.summary.comeLineWins++
          } else if (p.type === 'come odds win') {
            memo.comeOddsWins++
            hand.summary.comeOddsWins++
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
        if (roll.betsBefore?.come?.points) {
          Object.keys(roll.betsBefore.come.points).forEach(point => {
            roll.betsBefore.come.points[point].forEach(bet => {
              memo.comeLineLosses++
              hand.summary.comeLineLosses++
              if (bet.odds) {
                memo.comeOddsLosses++
                hand.summary.comeOddsLosses++
              }
            })
          })
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
      const formattedHistory = hand.history.map((roll, rollIndex) => {
        const formatted = {}

        // Get game state BEFORE this roll (from previous roll or initial state)
        let beforeIsComeOut, beforePoint
        if (rollIndex === 0) {
          // First roll - use initial hand state
          beforeIsComeOut = true
          beforePoint = undefined
        } else {
          // Use previous roll's after state
          const prevRoll = hand.history[rollIndex - 1]
          beforeIsComeOut = prevRoll.isComeOut
          beforePoint = prevRoll.point
        }

        // Calculate total money in play
        let moneyInPlay = 0
        if (roll.betsBefore) {
          // Pass line and odds
          if (roll.betsBefore.pass?.line) {
            moneyInPlay += roll.betsBefore.pass.line.amount
          }
          if (roll.betsBefore.pass?.odds) {
            moneyInPlay += roll.betsBefore.pass.odds.amount
          }
          // Place bets
          if (roll.betsBefore.place?.six) {
            moneyInPlay += roll.betsBefore.place.six.amount
          }
          if (roll.betsBefore.place?.eight) {
            moneyInPlay += roll.betsBefore.place.eight.amount
          }
          // Come bets
          if (roll.betsBefore.come?.points) {
            Object.values(roll.betsBefore.come.points).forEach(pointBets => {
              pointBets.forEach(bet => {
                if (bet.line) moneyInPlay += bet.line.amount
                if (bet.odds) moneyInPlay += bet.odds.amount
              })
            })
          }
          if (roll.betsBefore.come?.pending?.length) {
            moneyInPlay += roll.betsBefore.come.pending[0].amount
          }
        }

        // 1. Format pass line and odds details
        formatted.passLine = ''
        if (roll.betsBefore?.pass?.line) {
          const line = `$${roll.betsBefore.pass.line.amount}`
          const odds = roll.betsBefore.pass.odds ? `+$${roll.betsBefore.pass.odds.amount}` : ''
          formatted.passLine = line + odds
        }

        // 2. Format place 6,8 details
        formatted.placeBets = ''
        const placeBets = []
        if (roll.betsBefore?.place?.six) {
          placeBets.push(`6:$${roll.betsBefore.place.six.amount}`)
        }
        if (roll.betsBefore?.place?.eight) {
          placeBets.push(`8:$${roll.betsBefore.place.eight.amount}`)
        }
        if (placeBets.length > 0) {
          formatted.placeBets = placeBets.join(' ')
        }

        // 3. Format come bets (both established and pending)
        formatted.comeBets = ''
        const comeBetParts = []
        if (roll.betsBefore?.come?.points) {
          const comePoints = Object.keys(roll.betsBefore.come.points).map(point => {
            const bets = roll.betsBefore.come.points[point]
            return bets.map(bet => {
              const line = `${point}:$${bet.line.amount}`
              const odds = bet.odds ? `+$${bet.odds.amount}` : ''
              return line + odds
            }).join(',')
          }).join(' ')
          if (comePoints) comeBetParts.push(comePoints)
        }
        if (roll.betsBefore?.come?.pending?.length) {
          comeBetParts.push(`P:$${roll.betsBefore.come.pending[0].amount}`)
        }
        if (comeBetParts.length > 0) {
          formatted.comeBets = comeBetParts.join(' ')
        }

        // 5. Add money in play total
        formatted.moneyInPlay = `$${moneyInPlay}`

        // 6. Add game state BEFORE the roll
        formatted.beforeIsComeOut = beforeIsComeOut
        formatted.beforePoint = beforePoint ?? ''

        // 7. Add roll details (combined dice display)
        formatted.roll = `${roll.diceSum} (${roll.die1},${roll.die2})`

        // 8. Add result
        formatted.result = roll.result

        // 9. Add game state AFTER the roll
        formatted.afterIsComeOut = roll.isComeOut
        formatted.afterPoint = roll.point ?? ''

        // 8. Calculate losses based on betsBefore and result
        formatted.losses = ''
        const losses = []
        let totalLosses = 0

        if (roll.result === 'seven out') {
          // Pass line + odds lost
          if (roll.betsBefore?.pass?.line) {
            const loss = roll.betsBefore.pass.line.amount
            losses.push(`pass:$${loss}`)
            totalLosses += loss
          }
          if (roll.betsBefore?.pass?.odds) {
            const loss = roll.betsBefore.pass.odds.amount
            losses.push(`pass-odds:$${loss}`)
            totalLosses += loss
          }
          // All come bets lost
          if (roll.betsBefore?.come?.points) {
            Object.keys(roll.betsBefore.come.points).forEach(point => {
              roll.betsBefore.come.points[point].forEach(bet => {
                const lineLoss = bet.line.amount
                losses.push(`come-${point}:$${lineLoss}`)
                totalLosses += lineLoss
                if (bet.odds) {
                  const oddsLoss = bet.odds.amount
                  losses.push(`come-${point}-odds:$${oddsLoss}`)
                  totalLosses += oddsLoss
                }
              })
            })
          }
          // Place bets lost
          if (roll.betsBefore?.place?.six) {
            const loss = roll.betsBefore.place.six.amount
            losses.push(`place-6:$${loss}`)
            totalLosses += loss
          }
          if (roll.betsBefore?.place?.eight) {
            const loss = roll.betsBefore.place.eight.amount
            losses.push(`place-8:$${loss}`)
            totalLosses += loss
          }
        } else if (roll.result === 'comeout loss') {
          // Only pass line lost
          if (roll.betsBefore?.pass?.line) {
            const loss = roll.betsBefore.pass.line.amount
            losses.push(`pass:$${loss}`)
            totalLosses += loss
          }
        } else if (roll.betsBefore?.come?.pending?.length) {
          // Check for immediate come bet losses (2, 3, 12)
          if ([2, 3, 12].includes(roll.diceSum)) {
            const loss = roll.betsBefore.come.pending[0].amount
            losses.push(`come:$${loss}`)
            totalLosses += loss
          }
        }

        if (losses.length > 0) {
          formatted.losses = losses.join(', ')
        }

        // 9. Track come bet movements (pending -> established on point)
        formatted.movements = ''
        if (roll.betsBefore?.come?.pending?.length) {
          const pendingAmount = roll.betsBefore.come.pending[0].amount
          // If dice sum is not an immediate win/loss, it establishes on that point
          if (![7, 11, 2, 3, 12].includes(roll.diceSum)) {
            formatted.movements = `come→${roll.diceSum}:$${pendingAmount}`
          }
        }

        // 10. Format payouts to show wins
        formatted.wins = ''
        let totalWins = 0
        if (Array.isArray(roll.payouts)) {
          formatted.wins = roll.payouts.map(p => {
            const winAmount = p.principal + p.profit
            totalWins += winAmount
            return `${p.type}:$${winAmount}`
          }).join(', ')
        }

        // 11. Calculate net change
        formatted.netChange = `$${totalWins - totalLosses}`

        // Return with columns in desired order
        return {
          passLine: formatted.passLine,
          comeBets: formatted.comeBets,
          placeBets: formatted.placeBets,
          moneyInPlay: formatted.moneyInPlay,
          beforeIsComeOut: formatted.beforeIsComeOut,
          beforePoint: formatted.beforePoint,
          roll: formatted.roll,
          result: formatted.result,
          afterIsComeOut: formatted.afterIsComeOut,
          afterPoint: formatted.afterPoint,
          movements: formatted.movements,
          wins: formatted.wins,
          losses: formatted.losses,
          netChange: formatted.netChange
        }
      })
      console.table(formattedHistory)
    })
  }
}

export { simulateHands }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const numHands = parseInt(process.argv[2], 10)
  const bettingStrategy = process.argv[3]
  const showDetail = process.argv[4]
  console.log(`Simulating ${numHands} Craps Hand(s)`)
  console.log(`Using betting strategy: ${bettingStrategy}`)
  const result = simulateHands({ numHands, showDetail, bettingStrategy })
  printResults({ ...result, showDetail })
}
