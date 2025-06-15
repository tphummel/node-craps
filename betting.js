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

function minPassLineMidOdds (opts) {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (hand.isComeOut === false && !bets?.pass?.odds) {
    const maxMultiple = rules.maxOddsMultiple[hand.point]
    const oddsMultiple = Math.ceil(maxMultiple / 2)
    const oddsAmount = oddsMultiple * bets.pass.line.amount
    bets.pass.odds = { amount: oddsAmount }
    bets.new += oddsAmount
  }

  return bets
}

function minPassLineMinOdds (opts) {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (hand.isComeOut === false && !bets?.pass?.odds) {
    const lineAmount = bets.pass.line.amount
    const maxAllowed = rules.maxOddsMultiple[hand.point] * lineAmount
    let oddsAmount = lineAmount

    if (hand.point === 6 || hand.point === 8) {
      oddsAmount = Math.ceil(oddsAmount / 5) * 5
    } else if (hand.point === 5 || hand.point === 9) {
      if (oddsAmount % 2 === 1) oddsAmount += 1
    }

    if (oddsAmount > maxAllowed) {
      if (hand.point === 6 || hand.point === 8) {
        oddsAmount = Math.floor(maxAllowed / 5) * 5
      } else if (hand.point === 5 || hand.point === 9) {
        oddsAmount = Math.floor(maxAllowed / 2) * 2
      } else {
        oddsAmount = maxAllowed
      }
    }

    bets.pass.odds = { amount: oddsAmount }
    bets.new += oddsAmount
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

function placeSixEightUnlessPassOrCome (opts) {
  const { hand, bets: existingBets } = opts

  const bets = placeSixEight(opts)
  const comePoints = Object.keys(existingBets?.come?.points || {})
  const coveredPoints = new Set([hand.point, ...comePoints.map(Number)])

  if (coveredPoints.has(6) && bets.place?.six) {
    bets.new -= bets.place.six.amount
    delete bets.place.six
    if (process.env.DEBUG) console.log('[decision] removed place 6 bet matching pass or come point')
  }

  if (coveredPoints.has(8) && bets.place?.eight) {
    bets.new -= bets.place.eight.amount
    delete bets.place.eight
    if (process.env.DEBUG) console.log('[decision] removed place 8 bet matching pass or come point')
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

function minPassLineMaxOddsMinComeLineMaxOdds (opts) {
  let bets = minPassLineMaxOdds(opts)
  bets = minComeLineMaxOdds({ ...opts, bets })
  return bets
}

function passCome68 (opts) {
  let bets = minPassLineMaxOdds(opts)
  bets = minComeLineMaxOdds({ ...opts, bets })
  bets = placeSixEightUnlessPassOrCome({ ...opts, bets })
  return bets
}

function passcome2place68 (opts) {
  let bets = minPassLineMaxOdds(opts)
  bets = minComeLineMaxOdds({ ...opts, bets, maxComeBets: 2 })
  bets = placeSixEightUnlessPassOrCome({ ...opts, bets })
  return bets
}

function minComeLineMaxOdds (opts) {
  const { rules, bets: existingBets = {}, hand, maxComeBets = 1 } = opts
  const bets = Object.assign({ new: 0 }, existingBets)

  if (hand.isComeOut) {
    if (process.env.DEBUG) console.log('[decision] skip come bets on comeout')
    return bets
  }

  bets.come = bets.come || {}
  bets.come.pending = bets.come.pending || []
  bets.come.points = bets.come.points || {}

  const pendingCount = bets.come.pending.length
  const pointCount = Object.values(bets.come.points).reduce((memo, pointBets) => {
    return memo + pointBets.length
  }, 0)

  if (pendingCount === 0 && pointCount < maxComeBets) {
    bets.come.pending.push({ amount: rules.minBet })
    bets.new += rules.minBet
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

function pressPlaceSixEight ({ rules, bets: existingBets, hand, playerMind }) {
  const initialAmount = Math.ceil(rules.minBet / 6) * 6

  if (!playerMind.press68) {
    playerMind.press68 = {
      sixAmount: initialAmount,
      eightAmount: initialAmount,
      prevPlacedSix: false,
      prevPlacedEight: false
    }
  }

  const state = playerMind.press68
  const bets = Object.assign({ new: 0 }, existingBets)

  if (state.prevPlacedSix && !bets.place?.six) state.sixAmount += 6
  if (state.prevPlacedEight && !bets.place?.eight) state.eightAmount += 6

  if (hand.isComeOut) {
    state.prevPlacedSix = !!(bets.place?.six)
    state.prevPlacedEight = !!(bets.place?.eight)
    return bets
  }

  bets.place = bets.place || {}

  if (!bets.place.six) {
    bets.place.six = { amount: state.sixAmount }
    bets.new += state.sixAmount
  }
  if (!bets.place.eight) {
    bets.place.eight = { amount: state.eightAmount }
    bets.new += state.eightAmount
  }

  state.prevPlacedSix = true
  state.prevPlacedEight = true

  return bets
}

const { withFiveCount } = require('./fiveCount.js')

function noBetting () {
  return { new: 0 }
}

function fiveCountMinPassLineMaxOddsPlaceSixEight (opts) {
  return withFiveCount(minPassLineMaxOddsPlaceSixEight)(opts)
}

module.exports = {
  noBetting,
  pressPlaceSixEight,
  fiveCountMinPassLineMaxOddsPlaceSixEight,
  minPassLineOnly,
  lineMaxOdds,
  minPassLineMaxOdds,
  minPassLineMidOdds,
  minPassLineMinOdds,
  placeSixEight,
  placeSixEightUnlessPoint,
  placeSixEightUnlessPassOrCome,
  minPassLinePlaceSixEight,
  minPassLineMaxOddsPlaceSixEight,
  minPassLineMaxOddsMinComeLineMaxOdds,
  minComeLineMaxOdds,
  passCome68,
  passcome2place68
}
