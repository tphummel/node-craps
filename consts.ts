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
    PassOdds = 0,
    Come = 1,
    ComeOdds = 1,
    DontPass,
    DontPassOdds,
    DontCome,
    DontComeOdds,
}

type Bet = {
    amount: number;
    payout?: number;
}

class BetDictionary {
    [key: number]: Bet;
    newBetSum: number;
    payoutSum?: Memo;

    constructor() {
        // Initialize all enum values with default bets
        Object.values(BetPoint).forEach(value => {
            if (typeof value === 'number') {
                this[value] = { amount: 0 };
            }
        });
        
        this.newBetSum = 0;
    }

    // Helper method to add a bet
    addBet(betPoint: BetPoint, amount: number): void {
        this[betPoint] = { amount };
        this.newBetSum += amount;
    }

    // Helper method to get a bet amount
    getBetAmount(betPoint: BetPoint): number {
        return this[betPoint]?.amount || 0;
    }

    clearBet(betPoint: BetPoint): void {
        this[betPoint] = { amount: 0 };
    }
}

type PayoutMap = Partial<Record<DiceResult, number>>;
  
const passOddsPayouts: PayoutMap = {
[DiceResult.FOUR]: 2,
[DiceResult.FIVE]: 3/2,
[DiceResult.SIX]: 6/5,
[DiceResult.EIGHT]: 6/5, 
[DiceResult.NINE]: 3/2,
[DiceResult.TEN]: 2
};

type Memo = {
    principal: number;
    profit: number;
    total: number;
    ledger: any[];
  }

const BetPointPayouts: Partial<Record<BetPoint, PayoutMap>> = {
    [BetPoint.PassOdds]: passOddsPayouts,
//    [BetPoint.Come]: passOddsPayouts,  
};

export {
    HandResult,
    DiceResult,
    BetPoint,
    Bet,
    BetDictionary,
    Result,
    BetPointPayouts,
    Memo,
    Point,
    DieResult,
}
