#!/usr/bin/env node
'use strict'

const { playHand } = require('./index.js')
const { minPassLineMaxOddsPlaceSixEight } = require('./betting.js')

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
  const sorted = [...arr].sort((a, b) => a - b)
  const mean = arr.reduce((m, v) => m + v, 0) / arr.length
  const variance = arr.length > 1
    ? arr.reduce((m, v) => m + Math.pow(v - mean, 2), 0) / (arr.length - 1)
    : 0
  const stdDev = Math.sqrt(variance)
  const stdErr = stdDev / Math.sqrt(arr.length)
  const ci95Low = mean - (1.96 * stdErr)
  const ci95High = mean + (1.96 * stdErr)

  return {
    min: sorted[0],
    mean,
    stdDev,
    ci95Low,
    ci95High,
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
  const order = [
    'min',
    'p1',
    'p5',
    'p10',
    'p25',
    'p50',
    'mean',
    'p75',
    'p90',
    'p95',
    'p99',
    'max'
  ]
  const table = order
    .map(k => ({ stat: k, value: obj[k] }))
    .sort((a, b) => a.value - b.value || order.indexOf(a.stat) - order.indexOf(b.stat))
  return {
    table,
    stdDev: obj.stdDev,
    ci95Low: obj.ci95Low,
    ci95High: obj.ci95High
  }
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
  const balanceSummary = summaryTable(results.map(r => r.balance))
  console.table(balanceSummary.table)
  console.log(`stdDev: ${balanceSummary.stdDev.toFixed(2)}`)
  console.log(`95% CI: [${balanceSummary.ci95Low.toFixed(2)}, ${balanceSummary.ci95High.toFixed(2)}]`)

  console.log('\nRoll Count Summary')
  const rollSummary = summaryTable(results.map(r => r.rolls))
  console.table(rollSummary.table)
  console.log(`stdDev: ${rollSummary.stdDev.toFixed(2)}`)
  console.log(`95% CI: [${rollSummary.ci95Low.toFixed(2)}, ${rollSummary.ci95High.toFixed(2)}]`)
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
