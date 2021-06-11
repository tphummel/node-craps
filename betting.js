function minPassLineOnly (opts = {}) {
  const { rules } = opts
  let { bets } = opts

  if (!bets) bets = {}

  const bet = {
    amount: rules.minBet
  }

  if (!bets.passLine) bets.passLine = bet

  return { bets }
}

module.exports = {
  minPassLineOnly
}
