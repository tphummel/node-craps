# node-craps

[![Github Workflow Status](https://github.com/tphummel/node-craps/actions/workflows/ci.yaml/badge.svg)](https://github.com/tphummel/node-craps/actions/workflows/ci.yaml)

🎲🎲 craps simulator 💵

## architecture overview

```
                        +-----------+
                        | hands.js  | CLI: simulate hands, show roll-by-roll detail
                        +-----------+
                        | monte-    |
                        | carlo.js  | CLI: run trials, summarize distributions
                        +-----------+
                               |
                               v
  +-----------------------------------------------------+
  | playHand() (index.js)                               |
  |-----------------------------------------------------|
  | • apply betting strategy from betting.js            |
  | • roll dice via shoot()/rollD6                      |
  | • settle bets with settle.all() from settle.js      |
  +-----------------------------------------------------+
           |                |                    |
           v                v                    v
      +---------+     +--------------+     +--------------+
      | shoot() |     | betting.js   |     |  settle.js   |
      | rollD6  |     | strategies   |     | payout logic |
      +---------+     +--------------+     +--------------+
```

## betting strategies

All strategies share the same calling convention and are exported from `betting.js`:

```js
function myStrategy ({ rules, bets, hand, playerMind }) { ... }
```

### base strategies

| strategy | description |
|---|---|
| `noBetting` | Makes no bets. Useful as a baseline or placeholder. |
| `minPassLineOnly` | Pass line bet at `minBet` on each come-out. No odds. |
| `minPassLineMaxOdds` | Pass line at `minBet` + maximum odds behind the line once a point is set. |
| `minPassLineMidOdds` | Pass line at `minBet` + approximately half of maximum odds once a point is set. Odds multiple is `Math.ceil(maxOddsMultiple / 2)`. |
| `minPassLineMinOdds` | Pass line at `minBet` + minimum payable odds once a point is set. Rounds up to nearest $5 for points 6/8, nearest even number for points 5/9, exact `minBet` for points 4/10. |
| `placeSixEight` | Place the 6 and 8 at the nearest multiple of $6 ≥ `minBet`. No pass line. Bets come down on a win and are re-placed next turn. |
| `minComeLineMaxOdds` | One come bet at `minBet` with max odds once it travels to a point. |

### variants

| strategy | description |
|---|---|
| `placeSixEightUnlessPoint` | Same as `placeSixEight` but skips whichever number is the current point (avoids redundant coverage). |
| `placeSixEightUnlessPassOrCome` | Same as `placeSixEight` but skips any number already covered by a pass or come bet. |

### composed strategies

| strategy | description |
|---|---|
| `minPassLinePlaceSixEight` | Pass line + place 6 and 8 (skips whichever is the point). |
| `minPassLineMaxOddsPlaceSixEight` | Pass line + max odds + place 6 and 8 (skips point). |
| `minPassLineMaxOddsMinComeLineMaxOdds` | Pass line + max odds + one come bet with max odds. |
| `passCome68` | Pass line + max odds + one come bet + place 6/8 (skips numbers covered by pass or come). |
| `passcome2place68` | Pass line + max odds + up to two come bets + place 6/8 (skips covered numbers). |

### stateful strategies

These strategies track state across rolls within a hand via `playerMind`.

| strategy | description |
|---|---|
| `pressPlaceSixEight` | Place 6 and 8. On each win, press the winning number by one $6 unit. Starts at `Math.ceil(minBet/6)*6`. Resets each hand. |
| `fiveCountMinPassLineMaxOddsPlaceSixEight` | Applies the five-count gate before engaging `minPassLineMaxOddsPlaceSixEight`. Waits for a new shooter to establish a point (count 1) then survive four more qualifying rolls (counts 2–5) before any bets are placed. |

## simulate a hand

```
node hands.js <numHands> <strategy> [detail]
```

```
$ node hands.js 1 pressPlaceSixEight
Simulating 1 Craps Hand(s)
Using betting strategy: pressPlaceSixEight
[table rules] minimum bet: $15

Dice Roll Distribution
...

Session Summary
...

Hands Summary
...
```

Pass `detail` as a third argument to print a roll-by-roll table for each hand:

```
$ node hands.js 1 pressPlaceSixEight detail
```

```
Hand: 1, Balance: $81
┌─────────┬──────────┬───────────────┬─────────────┬────────────┬─────────────┬───────────────────┬────────────────────────────┬───────────┐
│ (index) │ passLine │ placeBets     │ moneyInPlay │ roll       │ result      │ wins              │ losses                     │ netChange │
├─────────┼──────────┼───────────────┼─────────────┼────────────┼─────────────┼───────────────────┼────────────────────────────┼───────────┤
│ 0       │ ''       │ ''            │ '$0'        │ '10 (4,6)' │ 'point set' │ ''                │ ''                         │ '$0'      │
│ 1       │ ''       │ '6:$18 8:$18' │ '$36'       │ '8 (2,6)'  │ 'neutral'   │ 'place 8 win:$39' │ ''                         │ '$39'     │
│ 2       │ ''       │ '6:$18 8:$24' │ '$42'       │ '8 (3,5)'  │ 'neutral'   │ 'place 8 win:$52' │ ''                         │ '$52'     │
│ 3       │ ''       │ '6:$18 8:$30' │ '$48'       │ '6 (2,4)'  │ 'neutral'   │ 'place 6 win:$39' │ ''                         │ '$39'     │
│ ...     │ ...      │ ...           │ ...         │ ...        │ ...         │ ...               │ ...                        │ ...       │
│ 18      │ ''       │ '6:$24 8:$42' │ '$66'       │ '7 (1,6)'  │ 'seven out' │ ''                │ 'place-6:$24, place-8:$42' │ '$-66'    │
└─────────┴──────────┴───────────────┴─────────────┴────────────┴─────────────┴───────────────────┴────────────────────────────┴───────────┘
```

The `placeBets` column shows each number and its current bet size — you can see pressing in action as the amounts grow after each win.

## monte carlo simulation

Run many trials to see how a strategy performs over time.

```
node monte-carlo.js <trials> <handsPerTrial> <startingBankroll> <minBet> <oddsFormat> [strategy]
```

Odds format is `X-Y-Z` where X = odds on 4/10, Y = odds on 5/9, Z = odds on 6/8. Defaults to `3-4-5`. Strategy defaults to `minPassLineMaxOddsPlaceSixEight`.

```
$ node monte-carlo.js 5 10 500 15 3-4-5 pressPlaceSixEight
Running 5 trials with 10 hand(s) each
[table rules] minimum bet: $15, odds 3-4-5
betting strategy: pressPlaceSixEight

Trial Results
┌─────────┬───────┬─────────┬───────┐
│ (index) │ trial │ balance │ rolls │
├─────────┼───────┼─────────┼───────┤
│ 0       │ 1     │ 872     │ 97    │
│ 1       │ 2     │ 407     │ 107   │
│ 2       │ 3     │ 185     │ 51    │
│ 3       │ 4     │ 900     │ 120   │
│ 4       │ 5     │ 348     │ 79    │
└─────────┴───────┴─────────┴───────┘

Final Balance Summary
┌─────────┬────────┬───────┐
│ (index) │ stat   │ value │
├─────────┼────────┼───────┤
│ 0       │ 'min'  │ 185   │
│ 5       │ 'p50'  │ 407   │
│ 6       │ 'mean' │ 542.4 │
│ 11      │ 'max'  │ 900   │
└─────────┴────────┴───────┘
stdDev: 324.18
95% CI: [258.24, 826.56]
```

Individual trial rows are omitted when `trials` exceeds 100. The standard deviation shows how widely results vary around the mean. The 95% confidence interval is the range expected to contain the true mean in 95% of repeated samples.

## table rules

`playHand` accepts a `rules` object. Defaults:

```js
const defaultRules = {
  comeOutLoss: [2, 3, 12],
  comeOutWin: [7, 11],
  placeBetsOffOnComeOut: true  // place bets do not win or lose on come-out rolls
}
```

`minBet` and `maxOddsMultiple` are also accepted (required by strategies that use them):

```js
const rules = {
  minBet: 15,
  maxOddsMultiple: {
    4: 3, 5: 4, 6: 5,
    8: 5, 9: 4, 10: 3
  }
}
```

### customizing come-out numbers

```js
// make boxcars (12) a come-out win instead of a loss
const rules = {
  comeOutLoss: [2, 3],
  comeOutWin: [7, 11, 12]
}
```

### place bet working flag

Individual place bets can override the table `placeBetsOffOnComeOut` rule using a `working` flag:

```js
// this bet is active even on come-out rolls, regardless of table rule
bets.place.six = { amount: 18, working: true }

// this bet is off on come-out rolls, even if the table rule allows it
bets.place.six = { amount: 18, working: false }
```

## use as a module

```js
import { simulateHands } from './hands.js'
const { sessionSummary } = simulateHands({ numHands: 100, bettingStrategy: 'pressPlaceSixEight' })
console.log(sessionSummary)
```

```js
import { monteCarlo } from './monte-carlo.js'
import { playHand } from './index.js'
import * as betting from './betting.js'

const rules = { minBet: 15, maxOddsMultiple: { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 } }
const results = monteCarlo({
  trials: 1000,
  handsPerTrial: 20,
  startingBankroll: 500,
  rules,
  bettingStrategy: betting.pressPlaceSixEight
})
```

## what? why?

I like to play craps sometimes. I have a handful of strategies I like to play. It is time consuming to play in an app. I'd like to play 5, 50, 500 hands very fast using various strategies. Which strategies are best is well understood, the variability comes in with how aggressive your strategies are and the level of risk you assume at any given moment. And of course the dice outcomes and their deviation from long term probabilities and how they interact with the strategies you employ is the fun part. This simulator lets me scratch my craps itch very quickly.

## dev

```
git clone git@github.com:tphummel/node-craps.git
cd node-craps
npm i
npm t
```
