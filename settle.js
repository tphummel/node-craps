const {HandResult} = require('./consts.js')

function passLine ({ bets, hand, rules }) {
  if (!bets?.pass?.line) return { bets }

  const actionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN, HandResult.COMEOUT_WIN, HandResult.COMEOUT_LOSS]
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payout = {
    type: hand.result,
    principal: bets.pass.line.amount,
    profit: bets.pass.line.amount * 1
  }

  delete bets.pass.line // clear pass line bet on action

  if (hand.result === HandResult.COMEOUT_LOSS || hand.result === HandResult.SEVEN_OUT) return { bets }

  return { payout, bets }
}

function passOdds ({ bets, hand, rules }) {
  if (!bets?.pass?.odds) return { bets }

  const actionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN]
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payouts = {
    4: 2,
    5: 3 / 2,
    6: 6 / 5,
    8: 6 / 5,
    9: 3 / 2,
    10: 2
  }

  const payout = {
    type: 'pass odds win',
    principal: bets.pass.odds.amount,
    profit: bets.pass.odds.amount * payouts[hand.diceSum]
  }

  delete bets.pass.odds // clear pass odds bet on action

  if (hand.result === HandResult.SEVEN_OUT) return { bets }

  return { payout, bets }
}

function all ({ bets, hand, rules }) {
  const payouts = []

  const passLineResult = passLine({ bets, hand, rules })

  bets = passLineResult.bets
  payouts.push(passLineResult.payout)

  const passOddsResult = passOdds({ bets, hand, rules })

  bets = passOddsResult.bets
  payouts.push(passOddsResult.payout)

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
  passOdds,
  all
}
