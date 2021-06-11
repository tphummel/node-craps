function passLine (bet = {}) {
  const payout = {
    principal: bet.amount,
    profit: bet.amount * 1
  }

  payout.total = payout.principal + payout.profit

  return payout
}

module.exports = {
  passLine
}
