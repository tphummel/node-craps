'use strict'

function roll () {
  return 1 + Math.floor(Math.random() * 6)
}

function shoot (preState, dice) {
  const sortedDice = dice.sort()

  const postState = {
    die1: sortedDice[0],
    die2: sortedDice[1],
    diceSum: dice.reduce((m, r) => { return m + r }, 0)
  }

  if (preState.isComeOut) {
    if ([2, 3, 12].indexOf(postState.diceSum) !== -1) {
      postState.result = 'comeout loss'
      postState.isComeOut = true
    } else if ([7].indexOf(postState.diceSum) !== -1) {
      postState.result = 'comeout win'
      postState.isComeOut = true
    }
  }

  return postState
}

module.exports = {
  roll,
  shoot
}
