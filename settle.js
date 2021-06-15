function passLine (bet = {}) {
  const payout = {
    principal: bet.amount,
    profit: bet.amount * 1
  }

  payout.total = payout.principal + payout.profit

  return payout
}

function all ({ bets, hand, rules }) {
  if (bets?.pass?.line && hand.result === 'point win') {
    bets.payout = passLine(bets.pass.line)
  }

  return bets
}

module.exports = {
  passLine,
  all
}
