
import { BetDictionary, BetPoint, BetPointPayouts, HandResult, Memo, type Result } from './consts'

function passLine ( bets: BetDictionary, hand: any, rules:any) {
  if (bets.getBetAmount(BetPoint.Pass) === 0) return { bets }

  const actionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN, HandResult.COMEOUT_WIN, HandResult.COMEOUT_LOSS]
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payout = {
    type: hand.result,
    principal: bets.getBetAmount(BetPoint.Pass),
    profit: bets.getBetAmount(BetPoint.Pass) * 1
  }

  bets.clearBet(BetPoint.Pass) // clear pass line bet on action

  if (hand.result === HandResult.COMEOUT_LOSS || hand.result === HandResult.SEVEN_OUT) return { bets }

  return { payout, bets }
}

function passOdds ( bets: BetDictionary, hand: Result, rules:any ) {
  if (bets.getBetAmount(BetPoint.PassOdds) === 0) return { bets }

  if (!hand.result || !hand.diceSum) throw new Error("no hand result or dice sum")

  const actionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN]
  const betHasAction = actionResults.includes(hand.result ?? HandResult.NEW_GAME)

  if (!betHasAction) return { bets } // keep bets intact if no action
  
  const payouts = BetPointPayouts[BetPoint.PassOdds]
  if (!payouts || !payouts[hand.diceSum]) throw new Error("no payouts defined for pass odds")

  const payout = {
    type: 'pass odds win',
    principal: bets.getBetAmount(BetPoint.PassOdds),
    profit: bets.getBetAmount(BetPoint.PassOdds) * (payouts[hand.diceSum] ?? 1)
  }

  bets.clearBet(BetPoint.PassOdds) // clear pass line bet on action
  

  if (hand.result === HandResult.SEVEN_OUT) return { bets }

  return { payout, bets }
}



export function settleAllBets ( bets: BetDictionary, hand: Result, rules:any ) : any {
  const payouts = []

  const passLineResult = passLine( bets, hand, rules )

  bets = passLineResult.bets
  payouts.push(passLineResult.payout)

  const passOddsResult = passOdds( bets, hand, rules )

  bets = passOddsResult.bets
  payouts.push(passOddsResult.payout)

  bets.payoutSum = payouts.reduce((memo: Memo, payout) => {
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
  settleAllBets
}
