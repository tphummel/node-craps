import { inspect } from 'node:util'

import { settleAllBets } from './settle'
import { HandOptions, minPassLineMaxOdds, minPassLineOnly} from './betting'
import  { BetDictionary, HandResult, type Result, Point, diceResultAsPoint, DieResult, DiceResult } from "./consts"

function rollD6 () {
  return 1 + Math.floor(Math.random() * 6)
}




function shoot (before: Result, dice: any) : Result {
  const sortedDice = dice.sort()

  const after: Result = {
    die1: sortedDice[0],
    die2: sortedDice[1],
    diceSum: dice.reduce((m: number, r: number) => { return m + r }, 0),
    result: undefined,
    isComeOut: undefined,
    point: Point.UNDEF
  }

  // game logic based on: https://github.com/tphummel/dice-collector/blob/master/PyTom/Dice/logic.py

  if (before.isComeOut) {
    if ([2, 3, 12].indexOf(after.diceSum) !== -1) {
      after.result = HandResult.COMEOUT_LOSS
      after.isComeOut = true
    } else if ([7, 11].indexOf(after.diceSum) !== -1) {
      after.result = HandResult.COMEOUT_WIN
      after.isComeOut = true
    } else {
      after.result = HandResult.POINT_SET
      after.isComeOut = false
      after.point = diceResultAsPoint(after.diceSum)
    }
  } else {
    if (before.point === diceResultAsPoint(after.diceSum)) {
      after.result = HandResult.POINT_WIN
      after.isComeOut = true
    } else if (after.diceSum === 7) {
      after.result = HandResult.SEVEN_OUT
      after.isComeOut = true
    } else {
      after.result = HandResult.NEUTRAL
      after.point = before.point
      after.isComeOut = false
    }
  }

  return after
}

export type BettingStrategy = (param1: HandOptions) => BetDictionary

export function playHand ( rules: any, bettingStrategy: BettingStrategy, roll = rollD6 ) : any {
  const history = []
  let balance = 0

  let hand: Result = {
    result: HandResult.NEW_GAME,
    isComeOut: true,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    diceSum: DiceResult.UNDEF,
    point: Point.OFF,
  }

  let bets = new BetDictionary();

  while (hand.result !== HandResult.SEVEN_OUT) {
    if (process.env.DEBUG) console.log(`[NEW HAND]`)
    bets = bettingStrategy( {rules, bets, hand} )
    balance -= bets.newBetSum
    if (process.env.DEBUG && bets.newBetSum) console.log(`[bet] new bet $${bets.newBetSum} ($${balance})`)
    bets.newBetSum = 0


    if (process.env.DEBUG) console.log(`[table] all bets ${inspect(bets, false, 2)}`)

    hand = shoot(
      hand,
      [roll(), roll()]
    )

    if (process.env.DEBUG) console.log(`[roll] ${hand.result} (${hand.diceSum})`)

    //bets = settle.all({ rules, bets, hand })
    bets = settleAllBets(  bets, hand, rules )

    if (bets?.payoutSum) {
      balance += bets.payoutSum.total
      if (process.env.DEBUG) console.log(`[payout] new payout $${bets.payoutSum} ($${balance})`)
      delete bets.payoutSum
    }

    history.push(hand)
  }

  return { history, balance }
}

module.exports = {
  rollD6,
  shoot,
  playHand,
  minPassLineMaxOdds, minPassLineOnly
}
