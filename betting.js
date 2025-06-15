function minPassLineOnly (opts) {
  const { rules, bets: existingBets, hand } = opts
  const bets = Object.assign({ new: 0 }, existingBets)

  if (process.env.DEBUG) console.log(`[decision] make a new pass line bet?: ${hand.isComeOut} && ${!bets?.pass?.line}`)

  if (hand.isComeOut && !bets?.pass?.line) {
    const newPassLineBet = {
      line: {
        amount: rules.minBet
      }
    }

    bets.pass = newPassLineBet
    bets.new += bets.pass.line.amount
    if (process.env.DEBUG) console.log(`[action] placing pass line bet $${bets.pass.line.amount}`)
  } else {
    if (process.env.DEBUG) console.log('[action] pass line bet unchanged')
  }

  return bets
}

function minPassLineMaxOdds (opts) {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (process.env.DEBUG) console.log(`[decision] make a new pass odds bet?: !hand.isComeOut: ${!hand.isComeOut} && !bets?.pass?.odds: ${!bets?.pass?.odds}`)

  if (hand.isComeOut === false && !bets?.pass?.odds) {
    const oddsAmount = rules.maxOddsMultiple[hand.point] * bets.pass.line.amount
    bets.pass.odds = {
      amount: oddsAmount
    }
    bets.new += oddsAmount
    if (process.env.DEBUG) console.log(`[action] placing pass odds bet $${oddsAmount}`)
  } else {
    if (process.env.DEBUG) console.log('[action] pass odds bet unchanged')
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
    if (process.env.DEBUG) console.log(`[action] placing place 6 bet $${placeAmount}`)
  }

  if (!bets.place.eight) {
    bets.place.eight = { amount: placeAmount }
    bets.new += bets.place.eight.amount
    if (process.env.DEBUG) console.log(`[action] placing place 8 bet $${placeAmount}`)
  }

  return bets
}

function placeSixEightUnlessPoint (opts) {
  const { bets: existingBets = {}, hand } = opts

  // Use the regular place bet logic first
  const bets = placeSixEight(opts)

  if (hand.isComeOut) return bets

  // Remove any newly created bet that matches the point
  if (hand.point === 6 && !existingBets?.place?.six && bets.place?.six) {
    bets.new -= bets.place.six.amount
    delete bets.place.six
    if (process.env.DEBUG) console.log('[decision] removed place 6 bet matching point')
  }

  if (hand.point === 8 && !existingBets?.place?.eight && bets.place?.eight) {
    bets.new -= bets.place.eight.amount
    delete bets.place.eight
    if (process.env.DEBUG) console.log('[decision] removed place 8 bet matching point')
  }

  if (bets.place && Object.keys(bets.place).length === 0) delete bets.place

  return bets
}

function minPassLineMaxOddsPlaceSixEight (opts) {
  if (process.env.DEBUG) console.log('[decision] executing combined strategy')
  let bets = minPassLineMaxOdds(opts)
  bets = placeSixEightUnlessPoint({ ...opts, bets })
  return bets
}

module.exports = {
  minPassLineOnly,
  minPassLineMaxOdds,
  placeSixEight,
  placeSixEightUnlessPoint,
  minPassLineMaxOddsPlaceSixEight
}
