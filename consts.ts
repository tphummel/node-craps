enum DieResult {
    UNDEF = -1,
    ONE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
}

enum DiceResult {
    UNDEF = -1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
    SEVEN = 7,
    EIGHT = 8,
    NINE = 9,
    TEN = 10,
    ELEVEN = 11,
    TWELVE = 12
}

enum Point {
    UNDEF = -1,
    OFF = 0,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
    EIGHT = 8,
    NINE = 9,
    TEN = 10,
}

export function diceResultAsPoint(diceResult: DiceResult) {
    switch (diceResult) {
        case DiceResult.FOUR:
            return Point.FOUR;
        case DiceResult.FIVE:
            return Point.FIVE;
        case DiceResult.SIX:
            return Point.SIX;
        case DiceResult.EIGHT:
            return Point.EIGHT;
        case DiceResult.NINE:
            return Point.NINE;
        case DiceResult.TEN:
            return Point.TEN;
        default:
            return Point.OFF;
    }
}

type Result = {
    die1: DieResult;
    die2: DieResult;
    diceSum: DiceResult;
    result?: HandResult;
    isComeOut?: boolean;
    point: Point;
}

enum HandResult {
    NEW_GAME = 'new game',
    COMEOUT_LOSS = 'comeout loss',
    COMEOUT_WIN = 'comeout win',
    POINT_SET = 'point set',
    POINT_WIN = 'point win',
    NEUTRAL = 'neutral',
    SEVEN_OUT = 'seven out',
}

enum BetPoint {
    Pass = 0,
    PassOdds = 1,
    Come = 2,
    ComeOdds = 3,
    DontPass = 4,
    DontPassOdds = 5,
    DontCome = 6,
    DontComeOdds = 7,
}

/**
 * Represents a payout for a bet
 */
export type Payout = {
    type: HandResult | string;
    principal: number;
    profit: number;
}

type PayoutMap = Partial<Record<DiceResult, number>>;

const passOddsPayouts: PayoutMap = {
    [DiceResult.FOUR]: 2,
    [DiceResult.FIVE]: 3 / 2,
    [DiceResult.SIX]: 6 / 5,
    [DiceResult.EIGHT]: 6 / 5,
    [DiceResult.NINE]: 3 / 2,
    [DiceResult.TEN]: 2
};

const passPayouts: PayoutMap = {
    [DiceResult.FOUR]: 1,
    [DiceResult.FIVE]: 1,
    [DiceResult.SIX]: 1,
    [DiceResult.EIGHT]: 1,
    [DiceResult.NINE]: 1,
    [DiceResult.TEN]: 1,
}

const BetPointPayouts: Partial<Record<BetPoint, PayoutMap>> = {
    [BetPoint.Pass]: passPayouts,
    [BetPoint.PassOdds]: passOddsPayouts,
    [BetPoint.Come]: passOddsPayouts,
    [BetPoint.ComeOdds]: passOddsPayouts,
    [BetPoint.DontPass]: passOddsPayouts,
    [BetPoint.DontPassOdds]: passOddsPayouts,
    [BetPoint.DontCome]: passOddsPayouts,
    [BetPoint.DontComeOdds]: passOddsPayouts,
};

interface Rules {
    minBet: number;
    maxOddsMultiple: Record<Point, number>;
}

type Memo = {
    principal: number;
    profit: number;
    total: number;
    ledger: any[];

    rollCount: number;
    neutrals: number;
    comeOutWins: number;
    comeOutLosses: number;
    netComeOutWins: number;
    pointsSet: number;
    pointsWon: number;
    dist: Map<DiceResult, distObj>;
}


class distObj {
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

export {
    HandResult,
    DiceResult,
    BetPoint,
    Result,
    BetPointPayouts,
    Memo,
    Point,
    DieResult,
    distObj,
    Rules,
}
