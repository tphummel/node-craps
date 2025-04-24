
import { playHand } from './index'
import { minPassLineMaxOdds } from './betting'
import { HandResult, DiceResult } from './consts'

const numHands = parseInt(process.argv.slice(2)[0], 10)
const showDetail = process.argv.slice(2)[1]

console.log(`Simulating ${numHands} Craps Hand(s)`)
console.log('Using betting strategy: minPassLineMaxOdds')

class distObj  {
  ct: number;
  prob: number;
  ref?: number;
  diff?: number;
  diff_pct?: number;
  ref_work?: string;
  constructor(count: number, probability: number) {
    this.ct = count;
    this.prob = probability
  }
}


class Summary  {
  balance: number;
  rollCount: number;
  pointsSet: number;
  pointsWon: number;
  comeOutWins: number;
  comeOutLosses: number;
  netComeOutWins: number;
  neutrals: number;
  handCount: number;
  dist?: Map<DiceResult, distObj>;

  constructor() {
    this.balance = 0
    this.rollCount = 0
    this.pointsSet = 0
    this.pointsWon = 0
    this.comeOutWins = 0
    this.comeOutLosses = 0
    this.netComeOutWins = 0
    this.neutrals = 0
    this.handCount = 0
    this.dist = new Map();
    this.dist.set(DiceResult.TWO, new distObj(0, 1/36));
    this.dist.set(DiceResult.THREE, new distObj(0, 2 / 36 ));
    this.dist.set(DiceResult.FOUR, new distObj(0, 3 / 36 ));
    this.dist.set(DiceResult.FIVE, new distObj(0, 4 / 36 ));
    this.dist.set(DiceResult.SIX, new distObj(0, 5 / 36 ));
    this.dist.set(DiceResult.SEVEN, new distObj(0, 6 / 36 ));
    this.dist.set(DiceResult.EIGHT, new distObj(0, 5 / 36 ));
    this.dist.set(DiceResult.NINE, new distObj(0, 4 / 36 ));
    this.dist.set(DiceResult.TEN, new distObj(0, 3 / 36 ));
    this.dist.set(DiceResult.ELEVEN, new distObj(0, 2 / 36 ));
    this.dist.set(DiceResult.TWELVE, new distObj(0, 1 / 36 ));
  }
}


const sessionSummary = new Summary();

const hands = []
const rules = {
  minBet: 5,
  maxOddsMultiple: {
    4: 3,
    5: 4,
    6: 5,
    8: 5,
    9: 4,
    10: 3
  }
}

console.log(`[table rules] minimum bet: $${rules.minBet}`)

for (let i = 0; i < numHands; i++) {
  const hand = playHand( rules, minPassLineMaxOdds )
  hand.summary = new Summary()

  sessionSummary.balance += hand.balance
  hand.summary.balance = hand.balance

  hand.history.reduce((memo: any, roll: any) => {
    memo.rollCount++
    hand.summary.rollCount++
    memo.dist[roll.diceSum].ct++

    switch (roll.result) {
      case HandResult.NEUTRAL:
        memo.neutrals++
        hand.summary.neutrals++
        break
      case HandResult.POINT_SET:
        memo.pointsSet++
        hand.summary.pointsSet++
        break
      case HandResult.POINT_WIN:
        memo.pointsWon++
        hand.summary.pointsWon++
        break
      case HandResult.COMEOUT_WIN:
        memo.comeOutWins++
        hand.summary.comeOutWins++
        memo.netComeOutWins++
        hand.summary.netComeOutWins++
        break
      case HandResult.COMEOUT_LOSS:
        memo.comeOutLosses++
        hand.summary.comeOutLosses++
        memo.netComeOutWins--
        hand.summary.netComeOutWins--
        break
    }

    return memo
  }, sessionSummary)

  hands.push(hand)
}

sessionSummary.handCount = hands.length
if (!sessionSummary) { throw "missin summary";}
if (!sessionSummary.dist) { throw "missin summary";}

for (const k of sessionSummary.dist.keys()) {

  const dist = sessionSummary.dist.get(k)
  if (!dist) { throw "missin dist";}
  dist.ref = Number((dist.prob* sessionSummary.rollCount).toFixed(1))
  dist.diff = Number((dist.ct - dist.ref).toFixed(1))
  dist.diff_pct = Number((((dist.ct - dist.ref) / dist.ref) * 100).toFixed(1))
  if (showDetail) {
    dist.ref_work = `${(dist.prob * sessionSummary.rollCount).toFixed(1)} (${sessionSummary.rollCount} * ${dist.prob.toFixed(2)})`
  }
  //delete dist.prob
  sessionSummary.dist?.set(k, dist);
}

console.log('\nDice Roll Distribution')
console.table(sessionSummary.dist)
delete sessionSummary.dist

console.log('\nSession Summary')
console.table(sessionSummary)

console.log('\nHands Summary')
console.table(hands.map(hand => {
  delete hand.summary.dist
  return hand.summary
}))

if (showDetail) {
  console.log('\nHands')
  hands.forEach((hand, handNum) => {
    console.log(`\nHand: ${handNum + 1}, Balance: $${hand.balance}`)
    console.table(hand.history)
  })
}
