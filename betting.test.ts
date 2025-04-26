import { test } from 'tap'
import {
  DiceResult, DieResult, HandResult, Point, Result,
  BetPoint, Rules
} from './consts'
import { BetDictionary } from './bets'
import { minPassLineOnly, minPassLineMaxOdds } from './betting'

const defaultRules: Rules = {
  minBet: 5,
  maxOddsMultiple: {
    [Point.UNDEF]: 0,
    [Point.OFF]: 0,
    [Point.FOUR]: 3,
    [Point.FIVE]: 4,
    [Point.SIX]: 5,
    [Point.EIGHT]: 5,
    [Point.NINE]: 4,
    [Point.TEN]: 3
  }
}

test('minPassLineOnly: no bets yet, coming out', function (t) {


  const hand: Result = {
    isComeOut: true,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    diceSum: DiceResult.UNDEF,
    point: Point.OFF
  }

  const updatedBets: BetDictionary = minPassLineOnly({ rules: defaultRules, hand })
  t.equal(updatedBets.getBet(BetPoint.Pass)?.amount, defaultRules.minBet)
  t.equal(updatedBets.newBetSum, 5)

  t.end()
})

test('minPassLineOnly: bet exists, coming out', (t) => {

  const hand: Result = {
    isComeOut: true,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    diceSum: DiceResult.UNDEF,
    point: Point.OFF
  }

  const bets: BetDictionary = new BetDictionary()
  bets.addBet(BetPoint.Pass, 5)
  bets.resetBetSum()

  const updatedBets: BetDictionary = minPassLineOnly({ rules: defaultRules, bets, hand })
  t.equal(updatedBets.getBet(BetPoint.Pass)?.amount, defaultRules.minBet)
  t.notOk(updatedBets.getBet(BetPoint.Pass)?.isContract)
  // TODO: revisit logic for newBetSum
  // newBetSum is 0 because the bet was set before minPassLineOnly was called
  t.equal(updatedBets.newBetSum, 0)

  t.end()
})

test('minPassLineOnly: bet exists, point set', (t) => {
  const hand: Result = {
    isComeOut: false,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    diceSum: DiceResult.UNDEF,
    point: Point.SIX
  }

  const bets: BetDictionary = new BetDictionary()
  bets.addBet(BetPoint.Pass, 5)
  bets.resetBetSum()

  const updatedBets: BetDictionary = minPassLineOnly({ rules: defaultRules, bets, hand })
  t.equal(updatedBets.getBet(BetPoint.Pass)?.amount, defaultRules.minBet)
  t.notOk(updatedBets.getBet(BetPoint.Pass)?.isContract)
  // TODO: revisit logic for newBetSum
  // newBetSum is 0 because the bet was set before minPassLineOnly was called
  t.equal(updatedBets.newBetSum, 0)

  t.end()
})

test('minPassLineMaxOdds: make new bet upon establishing point', (t) => {


  const hand: Result = {
    isComeOut: false,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    diceSum: DiceResult.UNDEF,
    point: Point.FIVE,
    result: HandResult.POINT_SET
  }

  const bets: BetDictionary = new BetDictionary()
  bets.addBet(BetPoint.Pass, defaultRules.minBet)
  bets.resetBetSum()
  const updatedBets: BetDictionary = minPassLineMaxOdds({ rules: defaultRules, bets, hand })
  t.equal(updatedBets.getBet(BetPoint.Pass)?.amount, defaultRules.minBet, 'line bet is not changed')
  const expectedOddsBet = defaultRules.maxOddsMultiple[Point.FIVE] * defaultRules.minBet
  t.equal(updatedBets.getBet(BetPoint.PassOdds)?.amount, expectedOddsBet, `odds bet made properly: ${expectedOddsBet}`)
  t.equal(updatedBets.newBetSum, updatedBets.getBet(BetPoint.PassOdds)?.amount)

  t.end()
})

test('minPassLineMaxOdds: converge on odds bet after point set', (t) => {


  const hand: Result = {
    isComeOut: false,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    diceSum: DiceResult.EIGHT,
    point: Point.FIVE,
    result: HandResult.NEUTRAL
  }

  const bets: BetDictionary = new BetDictionary()
  bets.addBet(BetPoint.Pass, defaultRules.minBet)
  bets.resetBetSum()

  const updatedBets: BetDictionary = minPassLineMaxOdds({ rules: defaultRules, bets, hand })
  t.equal(updatedBets.getBet(BetPoint.Pass)?.amount, defaultRules.minBet, 'line bet is not changed')
  t.equal(updatedBets.getBet(BetPoint.PassOdds)?.amount, defaultRules.maxOddsMultiple[Point.FIVE] * defaultRules.minBet, 'odds bet made properly')
  t.equal(updatedBets.newBetSum, updatedBets.getBet(BetPoint.PassOdds)?.amount)

  t.end()
})

test('minPassLineMaxOdds: continue existing bet', (t) => {


  const hand: Result = {
    isComeOut: false,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    diceSum: DiceResult.EIGHT,
    point: Point.FIVE,
    result: HandResult.NEUTRAL
  }

  const bets: BetDictionary = new BetDictionary()
  bets.addBet(BetPoint.Pass, 5)
  bets.addBet(BetPoint.PassOdds, 20)
  bets.resetBetSum()


  const updatedBets: BetDictionary = minPassLineMaxOdds({ rules: defaultRules, bets, hand })
  if (bets.getBet(BetPoint.Pass) && updatedBets.getBet(BetPoint.Pass)) {
    t.equal(updatedBets.getBet(BetPoint.Pass)?.amount, bets.getBet(BetPoint.Pass)?.amount, 'line bet is not changed')
  }
  if (bets.getBet(BetPoint.PassOdds) && updatedBets.getBet(BetPoint.PassOdds)) {
    t.equal(updatedBets.getBet(BetPoint.PassOdds)?.amount, bets.getBet(BetPoint.PassOdds)?.amount, 'odds bet is not changed')
  }
  t.equal(updatedBets.newBetSum, bets.newBetSum, 'no new bets were made')

  t.end()
}) 