'use strict'

function roll () {
  return 1 + Math.floor(Math.random() * 6)
}

function shoot (before, dice) {
  const sortedDice = dice.sort()

  const after = {
    die1: sortedDice[0],
    die2: sortedDice[1],
    diceSum: dice.reduce((m, r) => { return m + r }, 0)
  }

  if (before.isComeOut) {
    if ([2, 3, 12].indexOf(after.diceSum) !== -1) {
      after.result = 'comeout loss'
      after.isComeOut = true
    } else if ([7, 11].indexOf(after.diceSum) !== -1) {
      after.result = 'comeout win'
      after.isComeOut = true
    } else {
      after.result = 'point set'
      after.isComeOut = false
      after.point = after.diceSum
    }
  }

  return after
}

module.exports = {
  roll,
  shoot
}
