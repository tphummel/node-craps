'use strict'

const lib = require('./index.js')
const history = []

let hand = {
  isComeOut: true
}

history.push(hand)

while (true) {
  hand = lib.shoot(
    hand,
    [lib.roll(), lib.roll()].sort()
  )

  history.push(hand)

  if (hand.result === 'seven out') break
}

console.table(history)
