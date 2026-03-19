# Multiplayer Plan

Support multiple players betting simultaneously on the same hand. The dice,
point, and hand state are shared — everyone at the table sees the same rolls.
What differs per player is their strategy, bets, balance, and mind.

## What changes

### `playHand` signature

Replace the flat single-player params with a `players` array:

```js
// before
playHand({ rules, bettingStrategy, balance, roll })

// after
playHand({
  rules,
  roll,
  players: [
    { bettingStrategy: betting.withFiveCount(betting.minPassLineOnly), balance: 0 },
    { bettingStrategy: betting.placeSixEight, balance: 0 }
  ]
})
```

Each player entry carries:
- `bettingStrategy` — their strategy function
- `balance` — starting balance (default 0)

`playHand` owns the lifecycle of `bets` and `playerMind` per player, initialising
both internally as it does today for the single-player case.

### Game loop

Dice roll happens once per iteration. Strategy and settlement iterate over players:

```
each roll:
  for each player:
    call player.bettingStrategy({ rules, bets: player.bets, hand, playerMind: player.playerMind })
    player.balance -= bets.new

  roll dice once → shared hand state

  for each player:
    settle.all({ rules, bets: player.bets, hand })
    player.balance += payouts.total
```

### Return value

Currently `playHand` returns `{ history, balance }`. With multiple players it
returns `{ history, players }` where each player entry includes their final
`balance`. The `history` array records shared roll state (dice, result, point)
with per-player bet snapshots attached to each entry.

One open question: whether `history` entries carry an array of per-player
`betsBefore`/`payouts`, or whether each player gets a separate history array
alongside a shared roll log. The shared-log-with-per-player-snapshots approach
keeps the roll sequence unambiguous and is likely the right default.

## What does not change

| Component | Why |
|---|---|
| `shoot()` | Pure function, shared dice result, unchanged |
| `settle.js` | Already pure — takes `bets` + `hand`, just called per player |
| All strategies in `betting.js` | Already pure functions, unchanged |
| `fiveCount.js` / `playerMind` | Already a discrete object; each player gets their own |

## Backwards compatibility

The single-player call shape could be preserved as a convenience wrapper:

```js
// convenience: single player — wraps into players array internally
playHand({ rules, bettingStrategy, balance, roll })
```

Or callers migrate to the `players` array form. Decide at implementation time.

## Test approach

- Unit: existing single-player tests continue to pass (either via the wrapper
  or by migrating call sites)
- New integration tests in `index.test.js` with fixed dice and two players
  running different strategies, asserting per-player balances independently
- Verify that one player's bets do not affect another player's settlement
