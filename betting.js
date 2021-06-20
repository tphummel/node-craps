function minPassLineOnly (opts = {}) {
  const { rules, bets: existingBets, hand } = opts
  const bets = Object.assign({ new: 0 }, existingBets)

  if (process.env.DEBUG) console.log(`[decision] whether to make a new pass line bet: ${hand.isComeOut} && ${!bets?.pass?.line}`)

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

function minPassLineMaxOdds (opts = {}) {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (process.env.DEBUG) console.log(`[decision] whether to make a new pass odds bet: ${!hand.isComeOut} && ${!bets?.pass?.odds}`)

  if (hand.isComeOut === false && !bets?.pass?.odds) {
    const oddsAmount = rules.maxOddsMultiple[hand.point] * bets.pass.line.amount
    bets.pass.odds = {
      amount: oddsAmount
    }
    bets.new += oddsAmount
  }

  return bets
}

module.exports = {
  minPassLineOnly,
  minPassLineMaxOdds
}
