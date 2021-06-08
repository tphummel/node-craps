function minPassLineOnly (opts = {}) {
  const { rules } = opts
  let { bets } = opts

  if (!bets) bets = []

  const bet = {
    type: 'pass_line',
    amount: rules.minBet
  }

  if (bets.length === 0) bets.push(bet)

  return { bets }
}

module.exports = {
  minPassLineOnly
}
