#!/usr/bin/env node
// Audit simulation: 5 hands per strategy, one player per strategy
import { playHand } from './index.js'
import * as strategies from './betting.js'

const rules = {
  minBet: 15,
  maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 }
}

// All standalone strategies (exclude lineMaxOdds which is a helper)
const strategyNames = Object.keys(strategies).filter(k => k !== 'lineMaxOdds')

const NUM_HANDS = 5

const allResults = {}

for (const name of strategyNames) {
  const strategy = strategies[name]
  const playerResults = { strategy: name, hands: [], totalBalance: 0 }

  for (let h = 0; h < NUM_HANDS; h++) {
    const { history, balance } = playHand({
      rules,
      bettingStrategy: strategy
    })
    playerResults.hands.push({ handNum: h + 1, balance, rollCount: history.length, history })
    playerResults.totalBalance += balance
  }

  allResults[name] = playerResults
}

// ─── Pretty output ──────────────────────────────────────────────────────────

console.log('='.repeat(80))
console.log('MULTI-PLAYER CRAPS SIMULATION  — 5 hands × ' + strategyNames.length + ' strategies')
console.log('Table rules: minBet=$15, maxOdds 3-4-5')
console.log('='.repeat(80))

for (const name of strategyNames) {
  const p = allResults[name]
  const strat = strategies[name]
  console.log('\n' + '─'.repeat(80))
  console.log(`STRATEGY: ${name}`)
  if (strat.title) console.log(`  Title: ${strat.title}`)
  if (strat.description) console.log(`  Desc : ${strat.description}`)
  console.log(`  5-hand net balance: $${p.totalBalance}`)
  console.log()

  for (const hand of p.hands) {
    console.log(`  Hand ${hand.handNum}  (${hand.rollCount} rolls, balance $${hand.balance})`)
    // Roll-by-roll detail
    hand.history.forEach((roll, idx) => {
      const prevRoll = idx === 0 ? null : hand.history[idx - 1]
      const prevIsCO = idx === 0 ? true : prevRoll.isComeOut
      const prevPt   = idx === 0 ? '-'  : (prevRoll.point ?? '-')

      // Money in play summary
      const bets = roll.betsBefore || {}
      const parts = []
      if (bets.pass?.line)   parts.push(`pass=$${bets.pass.line.amount}`)
      if (bets.pass?.odds)   parts.push(`passOdds=$${bets.pass.odds.amount}`)
      if (bets.dontPass?.line) parts.push(`dp=$${bets.dontPass.line.amount}`)
      if (bets.place?.six)   parts.push(`p6=$${bets.place.six.amount}`)
      if (bets.place?.eight) parts.push(`p8=$${bets.place.eight.amount}`)
      if (bets.come?.pending?.length) parts.push(`comePend=$${bets.come.pending[0].amount}`)
      if (bets.come?.points) {
        Object.entries(bets.come.points).forEach(([pt, arr]) => {
          arr.forEach(b => {
            parts.push(`come${pt}=$${b.line.amount}${b.odds ? `+odds$${b.odds.amount}` : ''}`)
          })
        })
      }
      if (bets.dontCome?.pending?.length) parts.push(`dcPend=$${bets.dontCome.pending[0].amount}`)
      if (bets.dontCome?.points) {
        Object.entries(bets.dontCome.points).forEach(([pt, arr]) => {
          arr.forEach(b => parts.push(`dc${pt}=$${b.line.amount}`))
        })
      }

      // Payouts
      const payoutStr = (roll.payouts || []).map(p => `${p.type}:+$${p.principal + p.profit}`).join(' | ')

      console.log(
        `    Roll ${String(idx + 1).padStart(2)}: ` +
        `[${roll.die1},${roll.die2}]=${roll.diceSum}  ` +
        `${prevIsCO ? 'CO' : `pt=${prevPt}`} → ${roll.result.padEnd(14)} ` +
        `| bets: ${parts.join(', ') || 'none'}` +
        (payoutStr ? `\n           payouts: ${payoutStr}` : '')
      )
    })
  }
}

// ─── Payout / edge-case audit ────────────────────────────────────────────────
console.log('\n' + '='.repeat(80))
console.log('AUDIT SUMMARY')
console.log('='.repeat(80))

// Collect all roll events across all strategies/hands for analysis
const events = {
  passLineWins:      0,
  passLineLosses:    0,
  passOddsWins:      0,
  passOddsLosses:    0,
  dontPassWins:      0,
  dontPassLosses:    0,
  dontPassBar12:     0,
  comeLineWins:      0,
  comeLineLosses:    0,
  comeOddsWins:      0,
  comeOddsLosses:    0,
  dontComeWins:      0,
  dontComeLosses:    0,
  dontComePushes:    0,
  placeSixWins:      0,
  placeSixLosses:    0,
  placeEightWins:    0,
  placeEightLosses:  0,
  // edge cases
  placeBetOffOnCO:   0,  // place bet present but result was CO result (should be off)
  comeOddsWithoutLine: 0, // come odds without a line bet (data integrity)
  unknownPayoutTypes: []
}

const knownPayoutTypes = new Set([
  'point win', 'comeout win', 'pass odds win',
  'dont pass win',
  'come line win', 'come odds win',
  'dont come line win', 'dont come line push',
  'place 6 win', 'place 8 win'
])

for (const name of strategyNames) {
  const p = allResults[name]
  for (const hand of p.hands) {
    for (let idx = 0; idx < hand.history.length; idx++) {
      const roll = hand.history[idx]
      const bets = roll.betsBefore || {}
      const result = roll.result

      // Detect place bets present during CO rolls (should be off)
      const coResults = ['comeout win', 'comeout loss', 'point set']
      if (coResults.includes(result)) {
        if (bets.place?.six || bets.place?.eight) {
          events.placeBetOffOnCO++
        }
      }

      // Come odds integrity check
      if (bets.come?.points) {
        Object.values(bets.come.points).forEach(arr => {
          arr.forEach(b => {
            if (b.odds && !b.line) events.comeOddsWithoutLine++
          })
        })
      }

      // Count losses from seven-out
      if (result === 'seven out') {
        if (bets.pass?.line)  events.passLineLosses++
        if (bets.pass?.odds)  events.passOddsLosses++
        if (bets.place?.six)  events.placeSixLosses++
        if (bets.place?.eight) events.placeEightLosses++
        if (bets.come?.points) {
          Object.values(bets.come.points).forEach(arr => {
            arr.forEach(b => {
              events.comeLineLosses++
              if (b.odds) events.comeOddsLosses++
            })
          })
        }
        if (bets.dontPass?.line) events.dontPassWins++
        if (bets.dontCome?.points) {
          Object.values(bets.dontCome.points).forEach(arr => {
            arr.forEach(() => events.dontComeWins++)
          })
        }
      }

      if (result === 'comeout loss') {
        if (bets.pass?.line) events.passLineLosses++
        if (roll.diceSum === 12 && bets.dontPass?.line) events.dontPassBar12++
        else if (bets.dontPass?.line) events.dontPassWins++
      }

      if (result === 'point win') {
        if (bets.dontPass?.line) events.dontPassLosses++
      }

      // Count from payouts array
      ;(roll.payouts || []).forEach(p => {
        if (!knownPayoutTypes.has(p.type)) {
          events.unknownPayoutTypes.push({ type: p.type, strategy: name })
        }
        switch (p.type) {
          case 'point win':        events.passLineWins++; break
          case 'comeout win':      events.passLineWins++; break
          case 'pass odds win':    events.passOddsWins++; break
          case 'dont pass win':    // already counted above
            break
          case 'come line win':    events.comeLineWins++; break
          case 'come odds win':    events.comeOddsWins++; break
          case 'dont come line win': events.dontComeWins++; break
          case 'dont come line push': events.dontComePushes++; break
          case 'place 6 win':      events.placeSixWins++; break
          case 'place 8 win':      events.placeEightWins++; break
        }
      })
    }
  }
}

console.log('\nEvent counts across all strategies × 5 hands:')
console.table({
  'Pass line wins':         events.passLineWins,
  'Pass line losses':       events.passLineLosses,
  'Pass odds wins':         events.passOddsWins,
  'Pass odds losses':       events.passOddsLosses,
  "Don't pass wins":        events.dontPassWins,
  "Don't pass losses":      events.dontPassLosses,
  "Don't pass bar-12 push": events.dontPassBar12,
  'Come line wins':         events.comeLineWins,
  'Come line losses':       events.comeLineLosses,
  'Come odds wins':         events.comeOddsWins,
  'Come odds losses':       events.comeOddsLosses,
  "Don't come wins":        events.dontComeWins,
  "Don't come losses":      events.dontComeLosses,
  "Don't come pushes":      events.dontComePushes,
  'Place 6 wins':           events.placeSixWins,
  'Place 6 losses':         events.placeSixLosses,
  'Place 8 wins':           events.placeEightWins,
  'Place 8 losses':         events.placeEightLosses,
})

console.log('\n--- Edge Case / Integrity Flags ---')
console.log(`Place bets present during come-out rolls (should be off): ${events.placeBetOffOnCO}`)
console.log(`Come odds without corresponding line bet (data integrity): ${events.comeOddsWithoutLine}`)
if (events.unknownPayoutTypes.length > 0) {
  console.log('Unknown payout types encountered:')
  events.unknownPayoutTypes.forEach(u => console.log(`  - "${u.type}" in strategy "${u.strategy}"`))
} else {
  console.log('Unknown payout types: none')
}

// ─── Per-strategy balance summary ────────────────────────────────────────────
console.log('\n--- Per-strategy 5-hand balance ---')
const balanceRows = strategyNames.map(n => ({
  strategy: n,
  'net balance': allResults[n].totalBalance,
  'avg/hand': (allResults[n].totalBalance / NUM_HANDS).toFixed(2)
}))
console.table(balanceRows)

console.log('\nDone.')
