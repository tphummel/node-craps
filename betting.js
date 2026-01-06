function minPassLineOnly (opts) {
  const { rules, bets: existingBets, hand } = opts
  const bets = Object.assign({ new: 0 }, existingBets)

  const makeNewPassLineBet = hand.isComeOut && !bets?.pass?.line
  if (process.env.DEBUG) console.log(`[decision] make a new pass line bet?: ${makeNewPassLineBet}`)

  if (makeNewPassLineBet) {
    const newPassLineBet = {
      line: {
        amount: rules.minBet
      }
    }

    bets.pass = newPassLineBet
    bets.new += bets.pass.line.amount
    if (process.env.DEBUG) console.log(`[action] make pass line bet $${bets.pass.line.amount}`)
  } else {
    if (process.env.DEBUG) console.log('[action] pass line bet unchanged')
  }

  return bets
}

function minPassLineMaxOdds (opts) {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts
  const makeNewPassOddsBet = hand.isComeOut === false && !bets?.pass?.odds
  if (process.env.DEBUG) console.log(`[decision] make a new pass odds bet?: ${makeNewPassOddsBet}`)

  if (makeNewPassOddsBet) {
    const oddsAmount = rules.maxOddsMultiple[hand.point] * bets.pass.line.amount
    if (process.env.DEBUG) console.log(`[action] make pass odds bet $${oddsAmount}`)
    bets.pass.odds = {
      amount: oddsAmount
    }
    bets.new += oddsAmount
  } else {
    if (process.env.DEBUG) console.log('[decision] skip new pass odds bet')
  }

  return bets
}

function placeSixEight (opts) {
  const { rules, bets: existingBets = {}, hand } = opts
  const bets = Object.assign({ new: 0 }, existingBets)

  if (hand.isComeOut) {
    if (process.env.DEBUG) console.log('[decision] skip place bets on comeout')
    return bets
  }

  bets.place = bets.place || {}

  const placeAmount = Math.ceil(rules.minBet / 6) * 6

  if (!bets.place.six) {
    bets.place.six = { amount: placeAmount }
    bets.new += bets.place.six.amount
    if (process.env.DEBUG) console.log(`[action] make place 6 bet $${placeAmount}`)
  }

  if (!bets.place.eight) {
    bets.place.eight = { amount: placeAmount }
    bets.new += bets.place.eight.amount
    if (process.env.DEBUG) console.log(`[action] make place 8 bet $${placeAmount}`)
  }

  return bets
}

function placeSixEightUnlessPoint (opts) {
  const { hand } = opts

  // Use the regular place bet logic first
  const bets = placeSixEight(opts)

  // Remove any newly created bet that matches the point
  if (hand.point === 6 && bets.place?.six) {
    bets.new -= bets.place.six.amount
    delete bets.place.six
    if (process.env.DEBUG) console.log('[decision] removed place 6 bet matching point')
  }

  if (hand.point === 8 && bets.place?.eight) {
    bets.new -= bets.place.eight.amount
    delete bets.place.eight
    if (process.env.DEBUG) console.log('[decision] removed place 8 bet matching point')
  }

  if (bets.place && Object.keys(bets.place).length === 0) delete bets.place

  return bets
}

function minPassLinePlaceSixEight (opts) {
  let bets = minPassLineOnly(opts)
  bets = placeSixEightUnlessPoint({ ...opts, bets })
  return bets
}

function minPassLineMaxOddsPlaceSixEight (opts) {
  let bets = minPassLineMaxOdds(opts)
  bets = placeSixEightUnlessPoint({ ...opts, bets })
  return bets
}

function minPassLineWithSingleCome (opts) {
  const { rules, hand } = opts
  const bets = minPassLineOnly(opts)

  // Don't place come bets on comeout
  if (hand.isComeOut) {
    if (process.env.DEBUG) console.log('[decision] skip come bet on comeout')
    return bets
  }

  // Place a new come bet if we don't have any come bets established or pending
  const hasComeBets = bets?.come?.new || (bets?.come && Object.keys(bets.come).some(key => key !== 'new'))
  if (!hasComeBets) {
    bets.come = bets.come || {}
    bets.come.new = {
      amount: rules.minBet
    }
    bets.new += rules.minBet
    if (process.env.DEBUG) console.log(`[action] make come bet $${rules.minBet}`)
  } else {
    if (process.env.DEBUG) console.log('[decision] come bet already exists')
  }

  return bets
}

function minPassLineMaxOddsWithSingleCome (opts) {
  const { rules, hand } = opts
  const bets = minPassLineMaxOdds(opts)

  // Don't place come bets on comeout
  if (hand.isComeOut) {
    if (process.env.DEBUG) console.log('[decision] skip come bet on comeout')
    return bets
  }

  // Place a new come bet if we don't have any come bets established or pending
  const hasComeBets = bets?.come?.new || (bets?.come && Object.keys(bets.come).some(key => key !== 'new'))
  if (!hasComeBets) {
    bets.come = bets.come || {}
    bets.come.new = {
      amount: rules.minBet
    }
    bets.new += rules.minBet
    if (process.env.DEBUG) console.log(`[action] make come bet $${rules.minBet}`)
  } else {
    if (process.env.DEBUG) console.log('[decision] come bet already exists')
  }

  // Add odds to any established come bets that don't have odds yet
  const pointNumbers = [4, 5, 6, 8, 9, 10]
  pointNumbers.forEach(num => {
    if (bets?.come?.[num]?.line && !bets.come[num].odds) {
      const oddsAmount = rules.maxOddsMultiple[num] * bets.come[num].line.amount
      if (process.env.DEBUG) console.log(`[action] make come ${num} odds bet $${oddsAmount}`)
      bets.come[num].odds = {
        amount: oddsAmount
      }
      bets.new += oddsAmount
    }
  })

  return bets
}

function minPassLineMaxOddsWithMultipleCome (opts) {
  const { rules, hand } = opts
  const bets = minPassLineMaxOdds(opts)

  // Don't place come bets on comeout
  if (hand.isComeOut) {
    if (process.env.DEBUG) console.log('[decision] skip come bet on comeout')
    return bets
  }

  // Place a new come bet if we don't already have one pending
  if (!bets?.come?.new) {
    bets.come = bets.come || {}
    bets.come.new = {
      amount: rules.minBet
    }
    bets.new += rules.minBet
    if (process.env.DEBUG) console.log(`[action] make come bet $${rules.minBet}`)
  }

  // Add odds to any established come bets that don't have odds yet
  const pointNumbers = [4, 5, 6, 8, 9, 10]
  pointNumbers.forEach(num => {
    if (bets?.come?.[num]?.line && !bets.come[num].odds) {
      const oddsAmount = rules.maxOddsMultiple[num] * bets.come[num].line.amount
      if (process.env.DEBUG) console.log(`[action] make come ${num} odds bet $${oddsAmount}`)
      bets.come[num].odds = {
        amount: oddsAmount
      }
      bets.new += oddsAmount
    }
  })

  return bets
}

module.exports = {
  minPassLineOnly,
  minPassLineMaxOdds,
  placeSixEight,
  placeSixEightUnlessPoint,
  minPassLinePlaceSixEight,
  minPassLineMaxOddsPlaceSixEight,
  minPassLineWithSingleCome,
  minPassLineMaxOddsWithSingleCome,
  minPassLineMaxOddsWithMultipleCome
}
