function minPassLineOnly (opts = {}) {
  const { rules, bets: existingBets, hand } = opts
  const bets = Object.assign({}, existingBets)

  const newPassLineBet = {
    line: {
      amount: rules.minBet,
      isNew: true
    }
  }

  if (hand.isComeOut && !bets.pass) bets.pass = newPassLineBet

  return { bets }
}

module.exports = {
  minPassLineOnly
}
