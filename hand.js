'use strict'

const { playHand } = require('./index.js')

const hand = playHand()

console.table(hand)
