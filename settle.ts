import { BetPoint, BetPointPayouts, DiceResult, HandResult, Memo, Rules, type Result, type Payout } from './consts'
import { BetDictionary } from './bets'

export function passLine(bets: BetDictionary, hand: Result, rules: Rules): { bets: BetDictionary, payout?: Payout } {
  if (bets.getBet(BetPoint.Pass) === undefined) return { bets }

  const payoutActionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN, HandResult.COMEOUT_WIN, HandResult.COMEOUT_LOSS]
  const betHasPayoutAction = payoutActionResults.includes(hand.result ?? HandResult.NEUTRAL)

  if (!betHasPayoutAction) return { bets } // keep bets intact if no action

  const payout: Payout = {
    type: hand.result ?? HandResult.NEUTRAL,
    principal: bets.getBet(BetPoint.Pass)?.amount ?? 0,
    profit: (bets.getBet(BetPoint.Pass)?.amount ?? 0) * 1
  }

  bets.clearBet(BetPoint.Pass) // clear pass line bet on action

  if (hand.result === HandResult.COMEOUT_LOSS || hand.result === HandResult.SEVEN_OUT) return { bets }

  return { payout, bets }
}

export function passOdds(bets: BetDictionary, hand: Result, rules: Rules) {
  const passOddsPoint = BetPoint.PassOdds
  if (bets.getBet(passOddsPoint) === undefined) return { bets }

  if (!hand.result || !hand.diceSum) throw new Error("no hand result or dice sum")

  const actionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN]
  const betHasAction = actionResults.includes(hand.result ?? HandResult.NEW_GAME)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payout = {
    type: 'pass odds win',
    principal: bets.getBet(passOddsPoint)?.amount ?? 0,
    profit: (bets.getBet(passOddsPoint)?.amount ?? 0) * getPayout(passOddsPoint, hand.diceSum)
  }

  bets.clearBet(passOddsPoint) // clear pass line bet on action
  

  if (hand.result === HandResult.SEVEN_OUT) return { bets }

  return { payout, bets }
}

export function getPayout(betPoint: BetPoint, diceSum: DiceResult) {
  const payouts = BetPointPayouts[betPoint]
  if (!payouts || !payouts[diceSum]) throw new Error("no payouts defined for bet point")

  return payouts[diceSum]
}

export function settleAllBets ( bets: BetDictionary, hand: Result, rules:any ) : any {
  const payouts = []

  // when the hand establishes a point, set the pass and dont pass bets to contract
  if (hand.result === HandResult.POINT_SET) {
    bets.setContract([BetPoint.Pass, BetPoint.DontPass], true)
  }

  // when the hand is SEVEN_OUT or POINT_WIN, unset the contracts
  if (hand.result === HandResult.SEVEN_OUT || hand.result === HandResult.POINT_WIN) {
    bets.setContract([BetPoint.Pass, BetPoint.DontPass], false)
  }

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
    ledger: [],
    rollCount: 0,
    neutrals: 0,
    comeOutWins: 0,
    comeOutLosses: 0,
    netComeOutWins: 0,
    pointsSet: 0,
    pointsWon: 0,
    dist: new Map()
  } as Memo)

  return bets
}

module.exports = {
  passLine,
  passOdds,
  settleAllBets
}
