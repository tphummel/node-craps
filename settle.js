function passLine ({ bets, hand, rules }) {
  if (!bets?.pass?.line) {
    if (process.env.DEBUG) console.log('[decision] no pass line bet')
    return { bets }
  }

  const actionResults = ['seven out', 'point win', 'comeout win', 'comeout loss']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) {
    if (process.env.DEBUG) console.log(`[decision] pass line bet carries over (${hand.result})`)
    return { bets } // keep bets intact if no action
  }

  const payout = {
    type: hand.result,
    principal: bets.pass.line.amount,
    profit: bets.pass.line.amount * 1
  }

  delete bets.pass.line // clear pass line bet on action

  if (hand.result === 'comeout loss' || hand.result === 'seven out') {
    if (process.env.DEBUG) console.log(`[payout] pass line loss -$${payout.principal}`)
    return { bets }
  }

  if (process.env.DEBUG) {
    console.log(`[payout] ${payout.type} $${payout.principal + payout.profit}`)
  }

  return { payout, bets }
}

function passOdds ({ bets, hand, rules }) {
  if (!bets?.pass?.odds) {
    if (process.env.DEBUG) console.log('[decision] no pass odds bet')
    return { bets }
  }

  const actionResults = ['seven out', 'point win']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) {
    if (process.env.DEBUG) console.log(`[decision] pass odds bet carries over (${hand.result})`)
    return { bets } // keep bets intact if no action
  }

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

  if (hand.result === 'seven out') {
    if (process.env.DEBUG) console.log(`[payout] pass odds loss -$${payout.principal}`)
    // don't return the payout argument for a loss
    return { bets }
  }

  if (process.env.DEBUG) {
    console.log(`[payout] ${payout.type} $${payout.principal + payout.profit}`)
  }

  return { payout, bets }
}

function placeBet ({ bets, hand, placeNumber }) {
  const label = placeNumber === 6 ? 'six' : placeNumber === 8 ? 'eight' : String(placeNumber)

  if (!bets?.place?.[label]) {
    if (process.env.DEBUG) console.log(`[decision] no place ${placeNumber} bet`)
    return { bets }
  }
  if (hand.result === 'point set') {
    if (process.env.DEBUG) console.log(`[decision] place ${placeNumber} bet waits for next roll`)
    return { bets }
  }

  if (hand.diceSum === 7 && hand.result === 'seven out') {
    if (process.env.DEBUG) console.log(`[decision] place ${placeNumber} loss -$${bets.place[label].amount}`)
    delete bets.place[label]
    if (Object.keys(bets.place).length === 0) delete bets.place
    return { bets }
  }

  // place bets are off on comeout. if a point is set matching the place number, the bet doesn't win
  if (hand.diceSum === placeNumber && hand.result !== 'point set') {
    const payouts = {
      6: 7 / 6,
      8: 7 / 6
    }

    const payout = {
      type: `place ${placeNumber} win`,
      principal: bets.place[label].amount,
      profit: bets.place[label].amount * payouts[placeNumber]
    }

    // bet comes down on a win to give control to the betting module to put it back up if desired
    delete bets.place[label]

    return { payout, bets }
  }

  if (process.env.DEBUG) console.log(`[decision] place ${placeNumber} bet stands`)
  return { bets }
}

function placeSix (opts) {
  return placeBet({ ...opts, placeNumber: 6 })
}

function placeEight (opts) {
  return placeBet({ ...opts, placeNumber: 8 })
}

function comeFlat ({ bets, hand, rules }) {
  if (!bets?.come?.new) {
    if (process.env.DEBUG) console.log('[decision] no new come bet')
    return { bets }
  }

  const diceSum = hand.diceSum

  // New come bet wins on 7 or 11
  if (diceSum === 7 || diceSum === 11) {
    const payout = {
      type: 'come win',
      principal: bets.come.new.amount,
      profit: bets.come.new.amount * 1
    }

    delete bets.come.new
    if (Object.keys(bets.come).length === 0) delete bets.come

    if (process.env.DEBUG) {
      console.log(`[payout] come win $${payout.principal + payout.profit}`)
    }

    return { payout, bets }
  }

  // New come bet loses on 2, 3, or 12
  if (diceSum === 2 || diceSum === 3 || diceSum === 12) {
    if (process.env.DEBUG) console.log(`[payout] come loss -$${bets.come.new.amount}`)
    delete bets.come.new
    if (Object.keys(bets.come).length === 0) delete bets.come
    return { bets }
  }

  // New come bet travels to point (4, 5, 6, 8, 9, or 10)
  const pointNumbers = [4, 5, 6, 8, 9, 10]
  if (pointNumbers.includes(diceSum)) {
    if (process.env.DEBUG) console.log(`[decision] come bet travels to ${diceSum}`)
    bets.come[diceSum] = {
      line: {
        amount: bets.come.new.amount
      }
    }
    delete bets.come.new
  }

  return { bets }
}

function comeLine ({ bets, hand, rules }) {
  if (!bets?.come) {
    if (process.env.DEBUG) console.log('[decision] no come bets')
    return { bets }
  }

  const diceSum = hand.diceSum
  const payouts = []

  // Check if any established come bet wins
  if (bets.come[diceSum]?.line) {
    const payout = {
      type: `come ${diceSum} win`,
      principal: bets.come[diceSum].line.amount,
      profit: bets.come[diceSum].line.amount * 1
    }

    if (process.env.DEBUG) {
      console.log(`[payout] come ${diceSum} win $${payout.principal + payout.profit}`)
    }

    payouts.push(payout)
    delete bets.come[diceSum].line
    if (!bets.come[diceSum].odds) delete bets.come[diceSum]
  }

  // All come bets lose on seven out
  if (hand.result === 'seven out') {
    const pointNumbers = [4, 5, 6, 8, 9, 10]
    pointNumbers.forEach(num => {
      if (bets.come[num]?.line) {
        if (process.env.DEBUG) console.log(`[payout] come ${num} loss -$${bets.come[num].line.amount}`)
        delete bets.come[num].line
        if (!bets.come[num].odds) delete bets.come[num]
      }
    })
  }

  if (bets.come && Object.keys(bets.come).length === 0) delete bets.come

  return { payouts, bets }
}

function comeOdds ({ bets, hand, rules }) {
  if (!bets?.come) {
    if (process.env.DEBUG) console.log('[decision] no come odds bets')
    return { bets }
  }

  const diceSum = hand.diceSum
  const payouts = []

  const oddsPayouts = {
    4: 2,
    5: 3 / 2,
    6: 6 / 5,
    8: 6 / 5,
    9: 3 / 2,
    10: 2
  }

  // Check if any come bet with odds wins
  if (bets.come[diceSum]?.odds) {
    const payout = {
      type: `come ${diceSum} odds win`,
      principal: bets.come[diceSum].odds.amount,
      profit: bets.come[diceSum].odds.amount * oddsPayouts[diceSum]
    }

    if (process.env.DEBUG) {
      console.log(`[payout] come ${diceSum} odds win $${payout.principal + payout.profit}`)
    }

    payouts.push(payout)
    delete bets.come[diceSum].odds
    if (!bets.come[diceSum].line) delete bets.come[diceSum]
  }

  // All come odds lose on seven out
  if (hand.result === 'seven out') {
    const pointNumbers = [4, 5, 6, 8, 9, 10]
    pointNumbers.forEach(num => {
      if (bets.come[num]?.odds) {
        if (process.env.DEBUG) console.log(`[payout] come ${num} odds loss -$${bets.come[num].odds.amount}`)
        delete bets.come[num].odds
        if (!bets.come[num].line) delete bets.come[num]
      }
    })
  }

  if (bets.come && Object.keys(bets.come).length === 0) delete bets.come

  return { payouts, bets }
}

function all ({ bets, hand, rules }) {
  const payouts = []

  const passLineResult = passLine({ bets, hand, rules })

  bets = passLineResult.bets
  payouts.push(passLineResult.payout)

  const passOddsResult = passOdds({ bets, hand, rules })

  bets = passOddsResult.bets
  payouts.push(passOddsResult.payout)

  // Settle existing come bets before processing new ones
  const comeLineResult = comeLine({ bets, hand, rules })

  bets = comeLineResult.bets
  if (comeLineResult.payouts) {
    comeLineResult.payouts.forEach(p => payouts.push(p))
  }

  const comeOddsResult = comeOdds({ bets, hand, rules })

  bets = comeOddsResult.bets
  if (comeOddsResult.payouts) {
    comeOddsResult.payouts.forEach(p => payouts.push(p))
  }

  // Process new come bets after settling existing ones
  const comeFlatResult = comeFlat({ bets, hand, rules })

  bets = comeFlatResult.bets
  payouts.push(comeFlatResult.payout)

  const placeSixResult = placeSix({ bets, hand })

  bets = placeSixResult.bets
  payouts.push(placeSixResult.payout)

  const placeEightResult = placeEight({ bets, hand })

  bets = placeEightResult.bets
  payouts.push(placeEightResult.payout)

  bets.payouts = payouts.reduce((memo, payout) => {
    if (!payout) return memo
    if (process.env.DEBUG) console.log(`[payout] ${payout.type} $${payout.principal + payout.profit} (principal: ${payout.principal}, profit: ${payout.profit})`)

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
  comeFlat,
  comeLine,
  comeOdds,
  placeBet,
  placeSix,
  placeEight,
  all
}
