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

  return { payout, bets }
}

const oddsPayouts = {
  4: 2,
  5: 3 / 2,
  6: 6 / 5,
  8: 6 / 5,
  9: 3 / 2,
  10: 2
}

function passOdds ({ bets, hand, rules }) {
  if (!bets?.pass?.odds) return { bets }

  const actionResults = ['seven out', 'point win']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payout = {
    type: 'pass odds win',
    principal: bets.pass.odds.amount,
    profit: bets.pass.odds.amount * oddsPayouts[hand.diceSum]
  }

  delete bets.pass.odds // clear pass odds bet on action

  if (hand.result === 'seven out') return { bets }

  return { payout, bets }
}

function comeLine ({ bets, hand, rules }) {
  if (!bets?.come?.line) return { bets }

  const bet = bets.come
  let payout

  if (bet.isComeOut) {
    if ([2, 3, 12].includes(hand.diceSum)) {
      delete bets.come
      return { bets }
    }
    if ([7, 11].includes(hand.diceSum)) {
      payout = {
        type: 'come win',
        principal: bet.line.amount,
        profit: bet.line.amount * 1
      }
      delete bets.come
      return { payout, bets }
    }

    bet.point = hand.diceSum
    bet.isComeOut = false
    bet.line.isContract = true
    return { bets }
  }

  if (hand.diceSum === bet.point) {
    payout = {
      type: 'come win',
      principal: bet.line.amount,
      profit: bet.line.amount * 1
    }
    delete bet.line
    if (!bet.odds) delete bets.come
    return { payout, bets }
  }

  if (hand.diceSum === 7) {
    delete bet.line
    if (!bet.odds) delete bets.come
    return { bets }
  }

  return { bets }
}

function comeOdds ({ bets, hand, rules }) {
  if (!bets?.come?.odds) return { bets }

  const bet = bets.come

  if (hand.diceSum === bet.point) {
    const payout = {
      type: 'come odds win',
      principal: bet.odds.amount,
      profit: bet.odds.amount * oddsPayouts[bet.point]
    }
    delete bet.odds
    if (!bet.line) delete bets.come
    return { payout, bets }
  }

  if (hand.diceSum === 7) {
    delete bet.odds
    if (!bet.line) delete bets.come
    return { bets }
  }

  return { bets }
}

function placeBet ({ bets, hand, placeNumber }) {
  const label = placeNumber === 6 ? 'six' : placeNumber === 8 ? 'eight' : String(placeNumber)

  if (!bets?.place?.[label]) return { bets }
  if (hand.isComeOut && hand.result !== 'seven out') return { bets }
  if (hand.result === 'point set') return { bets }

  if (hand.diceSum === 7) {
    delete bets.place[label]
    if (Object.keys(bets.place).length === 0) delete bets.place
    return { bets }
  }

  if (hand.diceSum === placeNumber) {
    const payout = {
      type: `place ${placeNumber} win`,
      principal: 0,
      profit: bets.place[label].amount * (7 / 6)
    }

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

  const comeLineResult = comeLine({ bets, hand, rules })
  bets = comeLineResult.bets
  payouts.push(comeLineResult.payout)

  const comeOddsResult = comeOdds({ bets, hand, rules })

  bets = comeOddsResult.bets
  payouts.push(comeOddsResult.payout)

  const placeSixResult = placeSix({ bets, hand })

  bets = placeSixResult.bets
  payouts.push(placeSixResult.payout)

  const placeEightResult = placeEight({ bets, hand })

  bets = placeEightResult.bets
  payouts.push(placeEightResult.payout)

  bets.payouts = payouts.reduce((memo, payout) => {
    if (!payout) return memo

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
  comeLine,
  comeOdds,
  placeBet,
  placeSix,
  placeEight,
  all
}
