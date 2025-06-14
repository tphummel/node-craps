# node-craps

[![Github Workflow Status](https://github.com/tphummel/node-craps/actions/workflows/ci.yaml/badge.svg)](https://github.com/tphummel/node-craps/actions/workflows/ci.yaml)

🎲🎲 craps simulator 💵

## simulate a hand

```
➜  node hands.js 1

Simulating 1 Craps Hand(s)

Dice Roll Distribution
┌─────────┬────────┐
│ (index) │ Values │
├─────────┼────────┤
│    2    │   0    │
│    3    │   0    │
│    4    │   0    │
│    5    │   2    │
│    6    │   2    │
│    7    │   1    │
│    8    │   3    │
│    9    │   3    │
│   10    │   1    │
│   11    │   2    │
│   12    │   0    │
└─────────┴────────┘

Session Summary
┌────────────────┬────────┐
│    (index)     │ Values │
├────────────────┼────────┤
│   handCount    │   1    │
│   rollCount    │   14   │
│   pointsSet    │   3    │
│   pointsWon    │   2    │
│  comeOutWins   │   0    │
│ comeOutLosses  │   0    │
│ netComeOutWins │   0    │
│    neutrals    │   8    │
└────────────────┴────────┘

Hands

Hand: 1
┌─────────┬──────┬──────┬─────────┬─────────────┬───────────┬───────┐
│ (index) │ die1 │ die2 │ diceSum │   result    │ isComeOut │ point │
├─────────┼──────┼──────┼─────────┼─────────────┼───────────┼───────┤
│    0    │  3   │  6   │    9    │ 'point set' │   false   │   9   │
│    1    │  4   │  5   │    9    │ 'point win' │   true    │       │
│    2    │  3   │  5   │    8    │ 'point set' │   false   │   8   │
│    3    │  3   │  6   │    9    │  'neutral'  │   false   │   8   │
│    4    │  5   │  5   │   10    │  'neutral'  │   false   │   8   │
│    5    │  3   │  5   │    8    │ 'point win' │   true    │       │
│    6    │  2   │  6   │    8    │ 'point set' │   false   │   8   │
│    7    │  2   │  3   │    5    │  'neutral'  │   false   │   8   │
│    8    │  1   │  4   │    5    │  'neutral'  │   false   │   8   │
│    9    │  5   │  6   │   11    │  'neutral'  │   false   │   8   │
│   10    │  2   │  4   │    6    │  'neutral'  │   false   │   8   │
│   11    │  1   │  5   │    6    │  'neutral'  │   false   │   8   │
│   12    │  5   │  6   │   11    │  'neutral'  │   false   │   8   │
│   13    │  3   │  4   │    7    │ 'seven out' │   true    │       │
└─────────┴──────┴──────┴─────────┴─────────────┴───────────┴───────┘
```

## table rules

`playHand` accepts a `rules` object that controls minimum bets and odds limits.
You can now also customize which numbers win or lose on the come out roll.

```js
const rules = {
  minBet: 5,
  maxOddsMultiple: { /* ... */ },
  comeOutWin: [7, 11],
  comeOutLoss: [2, 3, 12] // default
}
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
