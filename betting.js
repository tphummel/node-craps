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

function minPassLineMinOdds (opts) {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (process.env.DEBUG) console.log(`[decision] make a new pass odds bet?: ${!hand.isComeOut} && ${!bets?.pass?.odds}`)

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

    bets.pass.odds = {
      amount: oddsAmount
    }
    bets.new += oddsAmount
  }

  return bets
}

module.exports = {
  minPassLineOnly,
  minPassLineMaxOdds,
  minPassLineMinOdds
}
