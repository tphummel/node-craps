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
    hand.history.forEach((roll, idx) => {
      const prevRoll = idx === 0 ? null : hand.history[idx - 1]
      const prevIsCO = idx === 0 ? true : prevRoll.isComeOut
      const prevPt = idx === 0 ? '-' : (prevRoll.point ?? '-')

      const bets = roll.betsBefore || {}
      const parts = []
      if (bets.pass?.line) parts.push(`pass=$${bets.pass.line.amount}`)
      if (bets.pass?.odds) parts.push(`passOdds=$${bets.pass.odds.amount}`)
      if (bets.dontPass?.line) parts.push(`dp=$${bets.dontPass.line.amount}`)
      if (bets.place?.six) parts.push(`p6=$${bets.place.six.amount}`)
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

const events = {
  passLineWins: 0,
  passLineLosses: 0,
  passOddsWins: 0,
  passOddsLosses: 0,
  dontPassWins: 0,
  dontPassLosses: 0,
  dontPassBar12: 0,
  comeLineWins: 0,
  comeLineLosses: 0,
  comeOddsWins: 0,
  comeOddsLosses: 0,
  dontComeWins: 0,
  dontComeLosses: 0,
  dontComePushes: 0,
  placeSixWins: 0,
  placeSixLosses: 0,
  placeEightWins: 0,
  placeEightLosses: 0,
  placeBetOffOnCO: 0,
  comeOddsWithoutLine: 0,
  unknownPayoutTypes: []
}

// ─── Bug-fix regression checks ───────────────────────────────────────────────
const regressions = {
  // Bug 1: bets.new must never go negative
  negativeNew: [],
  // Bug 1: place bet removed when point matches existing (not newly placed) bet
  //   We track rolls where an existing p6/p8 was present going INTO a roll where
  //   the point matched that number — the bet should be silently removed (money
  //   not deducted again) rather than giving a free credit.
  existingPlaceRemovedForPoint: [],
  // Bug 2: don't pass settled correctly on bar-12 under default rules
  dontPassBarMisfire: []
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
    // Track strategy-level bets.new by hooking into a replay —
    // we can't see bets.new from history, so we re-invoke the strategy
    // with the betsBefore state to reconstruct what bets.new should have been.
    // Instead, we instrument at the playHand level by wrapping the strategy.

    for (let idx = 0; idx < hand.history.length; idx++) {
      const roll = hand.history[idx]
      const bets = roll.betsBefore || {}
      const result = roll.result

      // Place bets present on CO rolls (expected — they go "off", not a bug)
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

      // Seven-out losses / dark-side wins
      if (result === 'seven out') {
        if (bets.pass?.line) events.passLineLosses++
        if (bets.pass?.odds) events.passOddsLosses++
        if (bets.place?.six) events.placeSixLosses++
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

      // Payout-type audit
      ;(roll.payouts || []).forEach(po => {
        if (!knownPayoutTypes.has(po.type)) {
          events.unknownPayoutTypes.push({ type: po.type, strategy: name })
        }
        switch (po.type) {
          case 'point win': events.passLineWins++; break
          case 'comeout win': events.passLineWins++; break
          case 'pass odds win': events.passOddsWins++; break
          case 'dont pass win': break // counted above
          case 'come line win': events.comeLineWins++; break
          case 'come odds win': events.comeOddsWins++; break
          case 'dont come line win': events.dontComeWins++; break
          case 'dont come line push': events.dontComePushes++; break
          case 'place 6 win': events.placeSixWins++; break
          case 'place 8 win': events.placeEightWins++; break
        }
      })
    }
  }
}

// ─── Bug 1 regression: replay strategy calls and check bets.new ──────────────
// We re-run each hand with an instrumented wrapper that captures bets.new.
for (const name of strategyNames) {
  const strategy = strategies[name]
  const p = allResults[name]

  for (const hand of p.hands) {
    // Build a deterministic dice sequence from the recorded history
    const diceSeq = []
    hand.history.forEach(roll => diceSeq.push(roll.die1, roll.die2))
    let diceIdx = 0
    const deterministicRoll = () => diceSeq[diceIdx++]

    // Wrap strategy to record every bets.new value
    const wrappedStrategy = (opts) => {
      const result = strategy(opts)
      if (result.new < 0) {
        regressions.negativeNew.push({
          strategy: name,
          handNum: hand.handNum,
          betsNewValue: result.new,
          bets: JSON.stringify(opts.bets)
        })
      }
      return result
    }

    playHand({ rules, bettingStrategy: wrappedStrategy, roll: deterministicRoll })
  }
}

// ─── Bug 2 regression: verify bar-12 push behaves correctly ──────────────────
// Find any roll where result=comeout loss, diceSum=12, dontPass.line exists,
// and check that the don't pass was NOT paid out (it should push/carry).
for (const name of strategyNames) {
  const p = allResults[name]
  for (const hand of p.hands) {
    for (const roll of hand.history) {
      if (roll.result === 'comeout loss' && roll.diceSum === 12 && roll.betsBefore?.dontPass?.line) {
        // Payout ledger must NOT contain a dont pass win for this roll
        const hasDontPassWin = (roll.payouts || []).some(po => po.type === 'dont pass win')
        if (hasDontPassWin) {
          regressions.dontPassBarMisfire.push({
            strategy: name,
            handNum: hand.handNum,
            issue: 'dont pass paid out on bar-12 comeout loss (should push)'
          })
        }
      }
    }
  }
}

// ─── Print results ────────────────────────────────────────────────────────────

console.log('\nEvent counts across all strategies × 5 hands:')
console.table({
  'Pass line wins': events.passLineWins,
  'Pass line losses': events.passLineLosses,
  'Pass odds wins': events.passOddsWins,
  'Pass odds losses': events.passOddsLosses,
  "Don't pass wins": events.dontPassWins,
  "Don't pass losses": events.dontPassLosses,
  "Don't pass bar-12 push": events.dontPassBar12,
  'Come line wins': events.comeLineWins,
  'Come line losses': events.comeLineLosses,
  'Come odds wins': events.comeOddsWins,
  'Come odds losses': events.comeOddsLosses,
  "Don't come wins": events.dontComeWins,
  "Don't come losses": events.dontComeLosses,
  "Don't come pushes": events.dontComePushes,
  'Place 6 wins': events.placeSixWins,
  'Place 6 losses': events.placeSixLosses,
  'Place 8 wins': events.placeEightWins,
  'Place 8 losses': events.placeEightLosses
})

console.log('\n--- Edge Case / Integrity Flags ---')
console.log(`Place bets present during come-out rolls (off by rule, expected): ${events.placeBetOffOnCO}`)
console.log(`Come odds without corresponding line bet: ${events.comeOddsWithoutLine}`)
if (events.unknownPayoutTypes.length > 0) {
  console.log('Unknown payout types:')
  events.unknownPayoutTypes.forEach(u => console.log(`  - "${u.type}" in strategy "${u.strategy}"`))
} else {
  console.log('Unknown payout types: none')
}

console.log('\n--- Bug-Fix Regression Results ---')

if (regressions.negativeNew.length === 0) {
  console.log('Bug 1 (negative bets.new): PASS — no negative bets.new values observed')
} else {
  console.log(`Bug 1 (negative bets.new): FAIL — ${regressions.negativeNew.length} instance(s):`)
  regressions.negativeNew.forEach(r => console.log(`  strategy=${r.strategy} hand=${r.handNum} bets.new=${r.betsNewValue}`))
}

if (regressions.dontPassBarMisfire.length === 0) {
  console.log("Bug 2 (don't pass bar-12): PASS — no misfires observed")
} else {
  console.log(`Bug 2 (don't pass bar-12): FAIL — ${regressions.dontPassBarMisfire.length} instance(s):`)
  regressions.dontPassBarMisfire.forEach(r => console.log(`  strategy=${r.strategy} hand=${r.handNum}: ${r.issue}`))
}

if (events.dontPassBar12 > 0) {
  console.log(`  (bar-12 push exercised ${events.dontPassBar12} time(s) this run — confirming the path was hit)`)
} else {
  console.log('  (bar-12 not rolled this run — Bug 2 not exercised; rely on unit tests)')
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
