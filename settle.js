function passLine ({ bets, hand, rules }) {
  if (!bets?.pass?.line) return false
  if (hand.result !== 'point win') return false

  const payout = {
    principal: bets.pass.line.amount,
    profit: bets.pass.line.amount * 1
  }

  return payout
}

function all ({ bets = {}, hand, rules }) {
  const payouts = []

  payouts.push(passLine({ bets, hand, rules }))

  bets.payouts = payouts.reduce((memo, payout) => {
    if (!payout) return memo

    memo.principal += payout.principal
    memo.profit += payout.profit
    memo.total += payout.principal + payout.profit
    memo.ledger.push(payout)
    return memo
  }, {
    principal: 0,
    profit: 0,
    total: 0,
    ledger: []
  })

  return bets
}

module.exports = {
  passLine,
  all
}
