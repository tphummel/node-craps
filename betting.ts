
import { type Result, BetDictionary, BetPoint } from "./consts";

export type HandOptions = {
  rules?: any; 
  hand: Result;
  bets?: BetDictionary;
}

export function minPassLineOnly (opts: HandOptions): BetDictionary {
  const { rules, bets: existingBets, hand } = opts 
  
  // Create a new bets object
  const bets = new BetDictionary();
  
  // Merge with existing bets if provided
  if (existingBets) {
    Object.assign(bets, existingBets);
  }

  if (process.env.DEBUG) console.log(`[MPLO  decision] make a new pass line bet?: ${hand.isComeOut} && ${!bets.getBetAmount(BetPoint.Pass)} => ${(hand.isComeOut) && (!bets.getBetAmount(BetPoint.Pass))}`)

  if ((hand?.isComeOut ?? false) && !bets.getBetAmount(BetPoint.Pass)) {
    bets.addBet(BetPoint.Pass, rules.minBet);
  }

  return bets
}

export function minPassLineMaxOdds (opts: HandOptions): BetDictionary {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (process.env.DEBUG) console.log(`[MPLMO decision] make a new pass odds bet?: ${!hand.isComeOut} && ${!bets.getBetAmount(BetPoint.PassOdds)} => ${(!hand.isComeOut) && (!bets.getBetAmount(BetPoint.PassOdds))}`)

  if ((hand?.isComeOut ?? false) === false && !bets.getBetAmount(BetPoint.PassOdds)) {
    const oddsAmount = rules.maxOddsMultiple[hand.point] * bets.getBetAmount(BetPoint.Pass);
    bets.addBet(BetPoint.PassOdds, oddsAmount);
  }

  return bets
}

exports = {
  minPassLineOnly,
  minPassLineMaxOdds
}
