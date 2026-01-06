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

function lineMaxOdds ({
  rules,
  bets: existingBets,
  point,
  shouldMakeLineBet,
  shouldMakeOddsBet,
  betKey = 'pass'
}) {
  const bets = Object.assign({ new: 0 }, existingBets)

  bets[betKey] = bets[betKey] || {}

  const makeLineBet = shouldMakeLineBet && !bets[betKey].line
  if (process.env.DEBUG) {
    console.log(`[decision] make a new ${betKey} line bet?: ${makeLineBet}`)
  }

  if (makeLineBet) {
    const newLineBet = { amount: rules.minBet }
    bets[betKey].line = newLineBet
    bets.new += newLineBet.amount
    if (process.env.DEBUG) {
      console.log(`[action] make ${betKey} line bet $${newLineBet.amount}`)
    }
  } else if (process.env.DEBUG) {
    console.log(`[action] ${betKey} line bet unchanged`)
  }

  const makeOddsBet = shouldMakeOddsBet && bets[betKey].line && !bets[betKey].odds
  if (process.env.DEBUG) {
    console.log(`[decision] make a new ${betKey} odds bet?: ${makeOddsBet}`)
  }

  if (makeOddsBet) {
    const oddsAmount = rules.maxOddsMultiple[point] * bets[betKey].line.amount
    bets[betKey].odds = { amount: oddsAmount }
    bets.new += oddsAmount
    if (process.env.DEBUG) {
      console.log(`[action] make ${betKey} odds bet $${oddsAmount}`)
    }
  } else if (process.env.DEBUG) {
    console.log(`[decision] skip new ${betKey} odds bet`)
  }

  return bets
}

function minPassLineMaxOdds (opts) {
  const { rules, hand } = opts
  return lineMaxOdds({
    rules,
    bets: opts.bets,
    point: hand.point,
    shouldMakeLineBet: hand.isComeOut,
    shouldMakeOddsBet: hand.isComeOut === false,
    betKey: 'pass'
  })
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

function comeLineMaxOdds (opts) {
  const { rules, bets: existingBets = {}, hand, maxComeBets = 1 } = opts
  const bets = Object.assign({ new: 0 }, existingBets)

  if (hand.isComeOut) {
    if (process.env.DEBUG) console.log('[decision] skip come bets on comeout')
    return bets
  }

  bets.come = bets.come || {}
  bets.come.pending = bets.come.pending || []
  bets.come.points = bets.come.points || {}

  let activeComeBets = bets.come.pending.length

  activeComeBets += Object.values(bets.come.points).reduce((memo, pointBets) => {
    return memo + pointBets.length
  }, 0)

  while (activeComeBets < maxComeBets) {
    bets.come.pending.push({ amount: rules.minBet })
    bets.new += rules.minBet
    activeComeBets++
    if (process.env.DEBUG) console.log(`[action] make come line bet $${rules.minBet}`)
  }

  Object.keys(bets.come.points).forEach(point => {
    bets.come.points[point].forEach(bet => {
      if (!bet.line || bet.odds) return
      const oddsAmount = rules.maxOddsMultiple[point] * bet.line.amount
      bet.odds = { amount: oddsAmount }
      bets.new += oddsAmount
      if (process.env.DEBUG) {
        console.log(`[action] make come odds bet behind ${point} for $${oddsAmount}`)
      }
    })
  })

  return bets
}

module.exports = {
  minPassLineOnly,
  lineMaxOdds,
  minPassLineMaxOdds,
  placeSixEight,
  placeSixEightUnlessPoint,
  minPassLinePlaceSixEight,
  minPassLineMaxOddsPlaceSixEight,
  comeLineMaxOdds
}
