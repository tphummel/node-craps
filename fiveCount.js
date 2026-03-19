'use strict'

const POINT_NUMBERS = [4, 5, 6, 8, 9, 10]

function updateFiveCount (count, hand) {
  if (!hand.result) return count

  if (count === 0) {
    return hand.result === 'point set' ? 1 : 0
  }

  if (count < 4) return count + 1

  if (count === 4) {
    return POINT_NUMBERS.includes(hand.diceSum) ? 5 : 4
  }

  return 5
}

function withFiveCount (strategy) {
  return function fiveCountStrategy ({ rules, bets, hand, playerMind }) {
    playerMind.fiveCount = playerMind.fiveCount || { count: 0 }
    const count = updateFiveCount(playerMind.fiveCount.count, hand)
    playerMind.fiveCount.count = count

    if (count < 5) return Object.assign(bets || {}, { new: 0 })

    return strategy({ rules, bets, hand, playerMind })
  }
}

module.exports = { updateFiveCount, withFiveCount }
