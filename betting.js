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
  }

  return bets
}

function minPassLineMaxOdds (opts) {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (process.env.DEBUG) console.log(`[decision] make a new pass odds bet?: ${!hand.isComeOut} && ${!bets?.pass?.odds}`)

  if (hand.isComeOut === false && !bets?.pass?.odds) {
    const oddsAmount = rules.maxOddsMultiple[hand.point] * bets.pass.line.amount
    bets.pass.odds = {
      amount: oddsAmount
    }
    bets.new += oddsAmount
  }

  return bets
}

function minComeLineMaxOdds (opts) {
  const { rules, hand } = opts
  const bets = minPassLineMaxOdds(opts)

  if (!hand.isComeOut && !bets?.come?.line) {
    bets.come = {
      line: { amount: rules.minBet },
      isComeOut: true
    }
    bets.new += rules.minBet
  }

  if (bets?.come?.line && !bets.come.isComeOut && !bets.come.odds) {
    const oddsAmount = rules.maxOddsMultiple[bets.come.point] * bets.come.line.amount
    bets.come.odds = { amount: oddsAmount }
    bets.new += oddsAmount
  }

  return bets
}

function placeSixEight (opts) {
  const { rules, bets: existingBets = {}, hand } = opts
  const bets = Object.assign({ new: 0 }, existingBets)

  if (hand.isComeOut) return bets

  bets.place = bets.place || {}

  if (!bets.place.six) {
    bets.place.six = { amount: rules.minBet }
    bets.new += bets.place.six.amount
  }

  if (!bets.place.eight) {
    bets.place.eight = { amount: rules.minBet }
    bets.new += bets.place.eight.amount
  }

  return bets
}

module.exports = {
  minPassLineOnly,
  minPassLineMaxOdds,
  minComeLineMaxOdds,
  placeSixEight
}
