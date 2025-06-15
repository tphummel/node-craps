function passLine ({ bets, hand, rules }) {
  if (!bets?.pass?.line) return { bets }

  const actionResults = ['seven out', 'point win', 'comeout win', 'comeout loss']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payout = {
    type: hand.result,
    principal: bets.pass.line.amount,
    profit: bets.pass.line.amount * 1
  }

  delete bets.pass.line // clear pass line bet on action

  if (hand.result === 'comeout loss' || hand.result === 'seven out') return { bets }

  if (process.env.DEBUG) {
    console.log(`[payout] ${payout.type} $${payout.principal + payout.profit}`)
  }

  return { payout, bets }
}

function passOdds ({ bets, hand, rules }) {
  if (!bets?.pass?.odds) return { bets }

  const actionResults = ['seven out', 'point win']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payouts = {
    4: 2,
    5: 3 / 2,
    6: 6 / 5,
    8: 6 / 5,
    9: 3 / 2,
    10: 2
  }

  const payout = {
    type: 'pass odds win',
    principal: bets.pass.odds.amount,
    profit: bets.pass.odds.amount * payouts[hand.diceSum]
  }

  delete bets.pass.odds // clear pass odds bet on action

  if (hand.result === 'seven out') return { bets }

  if (process.env.DEBUG) {
    console.log(`[payout] ${payout.type} $${payout.principal + payout.profit}`)
  }

  return { payout, bets }
}

function placeBet ({ bets, hand, placeNumber }) {
  const label = placeNumber === 6 ? 'six' : placeNumber === 8 ? 'eight' : String(placeNumber)

  if (!bets?.place?.[label]) return { bets }
  if (hand.isComeOut && hand.result !== 'seven out') return { bets }
  if (hand.result === 'point set') return { bets }

  if (hand.diceSum === 7) {
    delete bets.place[label]
    if (Object.keys(bets.place).length === 0) delete bets.place
    if (process.env.DEBUG) console.log(`[decision] remove place ${placeNumber} bet due to seven out`)
    return { bets }
  }

  if (hand.diceSum === placeNumber) {
    const payout = {
      type: `place ${placeNumber} win`,
      principal: 0,
      profit: bets.place[label].amount * (7 / 6)
    }

    if (process.env.DEBUG) console.log(`[payout] ${payout.type} $${payout.profit}`)

    return { payout, bets }
  }

  return { bets }
}

function placeSix (opts) {
  return placeBet({ ...opts, placeNumber: 6 })
}

function placeEight (opts) {
  return placeBet({ ...opts, placeNumber: 8 })
}

function all ({ bets, hand, rules }) {
  const payouts = []

  const passLineResult = passLine({ bets, hand, rules })

  bets = passLineResult.bets
  payouts.push(passLineResult.payout)

  const passOddsResult = passOdds({ bets, hand, rules })

  bets = passOddsResult.bets
  payouts.push(passOddsResult.payout)

  const placeSixResult = placeSix({ bets, hand })

  bets = placeSixResult.bets
  payouts.push(placeSixResult.payout)

  const placeEightResult = placeEight({ bets, hand })

  bets = placeEightResult.bets
  payouts.push(placeEightResult.payout)

  bets.payouts = payouts.reduce((memo, payout) => {
    if (!payout) return memo
    if (process.env.DEBUG) console.log(`[payout] ${payout.type} $${payout.principal + payout.profit}`)

    memo.principal += payout.principal
    memo.profit += payout.profit
    memo.total += payout.principal + payout.profit
    memo.ledger.push(payout)
    return memo
  }, {
    principal: 0,
    profit: 0,
    total: 0,
    ledger: []
  })

  return bets
}

module.exports = {
  passLine,
  passOdds,
  placeBet,
  placeSix,
  placeEight,
  all
}
