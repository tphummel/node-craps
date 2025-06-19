#!/usr/bin/env node
'use strict'

const { playHand } = require('./index.js')
const { minPassLineMaxOddsPlaceSixEight } = require('./betting.js')

// approximate two-sided t statistic for 95% confidence
// derived from a normal z score with adjustments for sample size
function tCritical95 (df) {
  if (df <= 0) return NaN
  const z = 1.96 // 95% z-score under a normal distribution
  const z2 = z * z
  const z3 = z2 * z
  const z5 = z3 * z2
  const z7 = z5 * z2
  let t = z + (z3 + z) / (4 * df)
  t += (5 * z5 + 16 * z3 + 3 * z) / (96 * df * df)
  t += (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * df * df * df)
  return t
}

function parseOdds (str) {
  const parts = String(str).split('-').map(n => parseInt(n, 10))
  if (parts.length !== 3 || parts.some(n => isNaN(n))) return {}
  return {
    4: parts[0],
    5: parts[1],
    6: parts[2],
    8: parts[2],
    9: parts[1],
    10: parts[0]
  }
}

function percentile (sorted, p) {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]
}

function summary (arr) {
  const n = arr.length
  const sorted = [...arr].sort((a, b) => a - b)
  const mean = arr.reduce((m, n) => m + n, 0) / n
  const variance = arr.reduce((m, n) => m + Math.pow(n - mean, 2), 0) / n
  const stDev = Math.sqrt(variance)
  const z95 = tCritical95(n - 1)
  return {
    mean,
    stDev,
    // z95 derives from the Student's t distribution for this sample size
    ci95Low: mean - z95 * stDev / Math.sqrt(n),
    ci95High: mean + z95 * stDev / Math.sqrt(n),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p1: percentile(sorted, 1),
    p5: percentile(sorted, 5),
    p10: percentile(sorted, 10),
    p25: percentile(sorted, 25),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99)
  }
}

function summaryTable (arr) {
  const obj = summary(arr)
  const order = ['min', 'p1', 'p5', 'p10', 'p25', 'p50', 'p75', 'p90', 'p95', 'p99', 'max']
  return order.map(k => ({ stat: k, value: obj[k] }))
}

function simulateTrial ({ handsPerTrial, startingBankroll, rules }) {
  let balance = startingBankroll
  let rolls = 0
  for (let i = 0; i < handsPerTrial; i++) {
    const { history, balance: result } = playHand({
      rules,
      bettingStrategy: minPassLineMaxOddsPlaceSixEight
    })
    balance += result
    rolls += history.length
  }
  return { balance, rolls }
}

function monteCarlo ({ trials, handsPerTrial, startingBankroll, rules }) {
  const results = []
  for (let i = 0; i < trials; i++) {
    results.push(simulateTrial({ handsPerTrial, startingBankroll, rules }))
  }
  return results
}

function printResults (results) {
  console.log('\nTrial Results')
  console.table(results.map((r, i) => ({ trial: i + 1, balance: r.balance, rolls: r.rolls })))

  console.log('\nFinal Balance Summary')
  console.table(summaryTable(results.map(r => r.balance)))

  console.log('\nRoll Count Summary')
  console.table(summaryTable(results.map(r => r.rolls)))
}

if (require.main === module) {
  const trials = parseInt(process.argv[2], 10)
  const handsPerTrial = parseInt(process.argv[3], 10)
  const startingBankroll = parseInt(process.argv[4], 10)
  const minBet = parseInt(process.argv[5], 10)
  const oddsInput = process.argv[6] || '3-4-5'

  const rules = {
    minBet,
    maxOddsMultiple: parseOdds(oddsInput)
  }

  console.log(`Running ${trials} trials with ${handsPerTrial} hand(s) each`)
  console.log(`[table rules] minimum bet: $${minBet}, odds ${oddsInput}`)
  const results = monteCarlo({ trials, handsPerTrial, startingBankroll, rules })
  printResults(results)
} else {
  module.exports = { monteCarlo, simulateTrial, summary }
}
