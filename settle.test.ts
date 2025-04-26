import { test } from 'tap'
import { BetDictionary } from './bets'
import { BetPoint, DieResult, HandResult, Point, Result, Rules } from './consts'
import { passLine, passOdds } from './settle'

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

// Common bet objects
const emptyBets: BetDictionary = new BetDictionary()

const passLineBet: BetDictionary = new BetDictionary()
passLineBet.addBet(BetPoint.Pass, 5)


const passLineContractBet: BetDictionary = new BetDictionary()
passLineContractBet.addBet(BetPoint.Pass, 5)
passLineContractBet.setContract([BetPoint.Pass], true)

const passLineWithOddsBet: BetDictionary = new BetDictionary()
passLineWithOddsBet.addBet(BetPoint.Pass, 5)
passLineWithOddsBet.addBet(BetPoint.PassOdds, 15)


const passLineWithOddsBet4: BetDictionary = new BetDictionary()
passLineWithOddsBet4.addBet(BetPoint.Pass, 5)
passLineWithOddsBet4.addBet(BetPoint.PassOdds, 15)
passLineWithOddsBet4.setContract([BetPoint.Pass], true)

const passLineWithOddsBet5: BetDictionary = new BetDictionary()
passLineWithOddsBet5.addBet(BetPoint.Pass, 5)
passLineWithOddsBet5.addBet(BetPoint.PassOdds, 20)
passLineWithOddsBet5.setContract([BetPoint.Pass], true)

const passLineWithOddsBet6: BetDictionary = new BetDictionary()
passLineWithOddsBet6.addBet(BetPoint.Pass, 5)
passLineWithOddsBet6.addBet(BetPoint.PassOdds, 25)
passLineWithOddsBet6.setContract([BetPoint.Pass], true)

const passLineWithOddsBet8: BetDictionary = new BetDictionary()
passLineWithOddsBet8.addBet(BetPoint.Pass, 5)
passLineWithOddsBet8.addBet(BetPoint.PassOdds, 25)
passLineWithOddsBet8.setContract([BetPoint.Pass], true)


test('passLine: comeout win', function (t) {
  const hand: Result = {
    result: HandResult.COMEOUT_WIN,
    diceSum: 7,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    point: Point.OFF
  }

  const result = passLine(passLineBet, hand, defaultRules)
  t.equal(result.payout?.type, 'comeout win')
  t.equal(result.payout?.principal, 5)
  t.equal(result.payout?.profit, 5)
  t.notOk(result.bets.getBet(BetPoint.Pass), 'pass line bet is cleared upon comeout win')

  t.end()
})

test('passLine: comeout loss', function (t) {
  const hand: Result = {
    result: HandResult.COMEOUT_LOSS,
    diceSum: 3,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    point: Point.OFF
  }

  const result = passLine(passLineBet, hand, defaultRules)
  t.notOk(result.payout, 'no payout on a comeout loss')
  t.notOk(result.bets.getBet(BetPoint.Pass), 'pass line bet is cleared upon comeout loss')

  t.end()
})

test('passLine: point win', function (t) {
  const hand: Result = {
    result: HandResult.POINT_WIN,
    diceSum: 10,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    point: Point.TEN
  }

  const result = passLine(passLineContractBet, hand, defaultRules)

  t.equal(result.payout?.type, 'point win')
  t.equal(result.payout?.principal, 5)
  t.equal(result.payout?.profit, 5)
  t.notOk(result.bets.getBet(BetPoint.Pass), 'pass line bet is cleared upon point win')

  t.end()
})

test('passLine: point loss', function (t) {
  const hand: Result = {
    result: HandResult.SEVEN_OUT,
    diceSum: 7,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    point: Point.FIVE
  }

  const result = passLine(passLineContractBet, hand, defaultRules)
  t.notOk(result.payout, 'no payout on seven out')
  t.notOk(result.bets.getBet(BetPoint.Pass), 'pass line bet is cleared upon seven out')

  t.end()
})

test('passLine: no bet', function (t) {
  const hand: Result = {
    result: HandResult.POINT_WIN,
    diceSum: 8,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    point: Point.EIGHT
  }

  const result = passLine(emptyBets, hand, defaultRules)
  t.notOk(result.payout)
  t.end()
})

test('passLine: bet, no win', function (t) {
  const hand: Result = {
    result: HandResult.NEUTRAL,
    diceSum: 11,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    point: Point.FIVE
  }

  const result = passLine(passLineContractBet, hand, defaultRules)
  t.notOk(result.payout)
  t.end()
})

test('passOdds: odds bet, no win', function (t) {
  const hand: Result = {
    result: HandResult.NEUTRAL,
    isComeOut: false,
    point: Point.EIGHT,
    diceSum: 10,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF
  }

  const result = passOdds(passLineWithOddsBet, hand, defaultRules)
  t.notOk(result.payout)
  t.strictSame(result.bets, passLineWithOddsBet, 'settled bets are same as initial bets')
  t.end()
})

test('passOdds (4): odds bet, win', function (t) {
  const hand: Result = {
    result: HandResult.POINT_WIN,
    isComeOut: true,
    point: Point.FOUR,
    diceSum: 4,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF
  }

  const result = passOdds(passLineWithOddsBet4, hand, defaultRules)
  t.equal(result.payout?.type, 'pass odds win')
  t.equal(result.payout?.principal, 15)
  t.equal(result.payout?.profit, 30)
  t.notOk(result.bets.getBet(BetPoint.PassOdds), 'pass odds bet is cleared')
  t.end()
})

test('passOdds (5): odds bet, win', function (t) {
  const hand: Result = {
    result: HandResult.POINT_WIN,
    isComeOut: true,
    point: Point.FIVE,
    diceSum: 5,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF
  }

  const result = passOdds(passLineWithOddsBet5, hand, defaultRules)
  t.equal(result.payout?.type, 'pass odds win')
  t.equal(result.payout?.principal, 20)
  t.equal(result.payout?.profit, 30)
  t.notOk(result.bets.getBet(BetPoint.PassOdds), 'pass odds bet is cleared')
  t.end()
})

test('passOdds (6): odds bet, win', function (t) {
  const hand: Result = {
    result: HandResult.POINT_WIN,
    isComeOut: true,
    point: Point.SIX,
    diceSum: 6,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF
  }

  const result = passOdds(passLineWithOddsBet6, hand, defaultRules)
  t.equal(result.payout?.type, 'pass odds win')
  t.equal(result.payout?.principal, 25)
  t.equal(result.payout?.profit, 30)
  t.notOk(result.bets.getBet(BetPoint.PassOdds), 'pass odds bet is cleared')
  t.end()
})

test('passOdds (8): odds bet, win', function (t) {
  const hand: Result = {
    result: HandResult.POINT_WIN,
    isComeOut: true,
    point: Point.EIGHT,
    diceSum: 8,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF
  }

  const result = passOdds(passLineWithOddsBet8, hand, defaultRules)
  t.equal(result.payout?.type, 'pass odds win')
  t.equal(result.payout?.principal, 25)
  t.equal(result.payout?.profit, 30)
  t.notOk(result.bets.getBet(BetPoint.PassOdds), 'pass odds bet is cleared')
  t.end()
}) 