'use strict'

const tap = require('tap')
const settle = require('./settle.js')

tap.test('passLine: comeout win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'comeout win',
    diceSum: 7
  }

  const result = settle.passLine({ hand, bets })
  t.equal(result.payout.type, 'comeout win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon comeout win')

  t.end()
})

tap.test('passLine: comeout loss', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'comeout loss',
    diceSum: 3
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout, 'no payout on a comeout loss')
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon comeout loss')

  t.end()
})

tap.test('passLine: point win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand = {
    result: 'point win',
    diceSum: 10
  }

  const result = settle.passLine({ hand, bets })
  t.equal(result.payout.type, 'point win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon point win')

  t.end()
})

tap.test('passLine: point loss', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand = {
    result: 'seven out',
    diceSum: 7
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout, 'no payout on seven out')
  t.notOk(result.bets.pass.line, 'pass line bet is cleared upon seven out')

  t.end()
})

tap.test('passLine: no bet', function (t) {
  const bets = {}

  const hand = {
    result: 'point win',
    diceSum: 8
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout)
  t.end()
})

tap.test('passLine: bet, no win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 11,
    point: 5
  }

  const result = settle.passLine({ hand, bets })
  t.notOk(result.payout)
  t.end()
})

tap.test('passOdds: odds bet, no win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'neutral',
    isComeOut: false,
    point: 8,
    diceSum: 10
  }

  const result = settle.passOdds({ hand, bets })
  t.notOk(result.payout)
  t.strictSame(result.bets, bets, 'settled bets are same as initial bets')
  t.end()
})

tap.test('passOdds (4): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 15,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 4,
    diceSum: 4
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 15)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (5): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 20,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 5,
    diceSum: 5
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 20)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (6): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 6,
    diceSum: 6
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 25)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (8): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 8,
    diceSum: 8
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 25)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (9): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 20,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 9,
    diceSum: 9
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 20)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds (10): odds bet, win', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 15,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    isComeOut: true,
    point: 10,
    diceSum: 10
  }

  const result = settle.passOdds({ hand, bets })
  t.equal(result.payout.type, 'pass odds win')
  t.equal(result.payout.principal, 15)
  t.equal(result.payout.profit, 30)
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('passOdds: odds bet, seven out', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'seven out',
    isComeOut: true,
    point: 8,
    diceSum: 7
  }

  const result = settle.passOdds({ hand, bets })
  t.notOk(result.payout, 'no payout')
  t.notOk(result.bets.pass.odds, 'pass odds bet is cleared')
  t.end()
})

tap.test('all: pass line win', (t) => {
  const bets = {
    pass: {
      line: {
        amount: 5,
        isContract: true
      },
      odds: {
        amount: 25,
        isContract: false
      }
    }
  }

  const hand = {
    result: 'point win',
    point: 6,
    diceSum: 6
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.payouts.total, 65)
  t.equal(settled.payouts.principal, 30)
  t.equal(settled.payouts.profit, 35)

  t.end()
})

tap.test('placeSix: win', (t) => {
  const bets = { place: { six: { amount: 6 } } }

  const hand = {
    result: 'neutral',
    isComeOut: false,
    diceSum: 6
  }

  const result = settle.placeSix({ bets, hand })

  t.equal(result.payout.type, 'place 6 win')
  t.equal(result.payout.profit, 7)
  t.equal(result.payout.principal, 6)
  t.notOk(result.bets.place.six)

  t.end()
})

tap.test('placeEight: win', (t) => {
  const bets = { place: { eight: { amount: 6 } } }

  const hand = {
    result: 'neutral',
    isComeOut: false,
    diceSum: 8
  }

  const result = settle.placeEight({ bets, hand })

  t.equal(result.payout.type, 'place 8 win')
  t.equal(result.payout.profit, 7)
  t.equal(result.payout.principal, 6)
  t.notOk(result.bets.place.eight)

  t.end()
})

tap.test('place bets: seven out removes bets', (t) => {
  const bets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }

  const hand = {
    result: 'seven out',
    isComeOut: true,
    diceSum: 7
  }

  const settled = settle.all({ bets, hand })

  t.notOk(settled.place)
  t.equal(settled.payouts.total, 0)

  t.end()
})

tap.test('place bets: no action on comeout roll', (t) => {
  const bets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }

  const hand = {
    result: 'comeout win',
    isComeOut: true,
    diceSum: 7
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.place.six.amount, 6)
  t.equal(settled.place.eight.amount, 6)
  t.equal(settled.payouts.total, 0)

  t.end()
})

tap.test('place bets: no action on comeout win 11', (t) => {
  const bets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }

  const hand = {
    result: 'comeout win',
    isComeOut: true,
    diceSum: 11
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.place.six.amount, 6)
  t.equal(settled.place.eight.amount, 6)
  t.equal(settled.payouts.total, 0)

  t.end()
})

tap.test('place bet on 6 persists when point is 6', (t) => {
  const bets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }

  const hand = {
    result: 'point set',
    isComeOut: false,
    diceSum: 6,
    point: 6
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.place.six.amount, 6)
  t.equal(settled.place.eight.amount, 6)
  t.equal(settled.payouts.total, 0)

  t.end()
})

tap.test('place bet on 8 persists when point is 8', (t) => {
  const bets = { place: { six: { amount: 6 }, eight: { amount: 6 } } }

  const hand = {
    result: 'point set',
    isComeOut: false,
    diceSum: 8,
    point: 8
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.place.six.amount, 6)
  t.equal(settled.place.eight.amount, 6)
  t.equal(settled.payouts.total, 0)

  t.end()
})

tap.test('place bet on 6 pays on point win of 6', (t) => {
  const bets = { place: { six: { amount: 6 } } }

  const hand = {
    result: 'point win',
    isComeOut: true,
    diceSum: 6
  }

  const settled = settle.all({ bets, hand })

  t.notOk(settled.place.six)
  t.equal(settled.payouts.total, 13)

  t.end()
})

tap.test('place bet on 8 pays on point win of 8', (t) => {
  const bets = { place: { eight: { amount: 6 } } }

  const hand = {
    result: 'point win',
    isComeOut: true,
    diceSum: 8
  }

  const settled = settle.all({ bets, hand })

  t.notOk(settled.place.eight)
  t.equal(settled.payouts.total, 13)

  t.end()
})

// Come Betting Tests

tap.test('comeFlat: new come bet wins on 7', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 7,
    isComeOut: false
  }

  const result = settle.comeFlat({ hand, bets })
  t.equal(result.payout.type, 'come win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.come, 'come bet is cleared upon win')

  t.end()
})

tap.test('comeFlat: new come bet wins on 11', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 11,
    isComeOut: false
  }

  const result = settle.comeFlat({ hand, bets })
  t.equal(result.payout.type, 'come win')
  t.equal(result.payout.principal, 5)
  t.equal(result.payout.profit, 5)
  t.notOk(result.bets.come, 'come bet is cleared upon win')

  t.end()
})

tap.test('comeFlat: new come bet loses on 2', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 2,
    isComeOut: false
  }

  const result = settle.comeFlat({ hand, bets })
  t.notOk(result.payout, 'no payout on a come loss')
  t.notOk(result.bets.come, 'come bet is cleared upon loss')

  t.end()
})

tap.test('comeFlat: new come bet loses on 3', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 3,
    isComeOut: false
  }

  const result = settle.comeFlat({ hand, bets })
  t.notOk(result.payout, 'no payout on a come loss')
  t.notOk(result.bets.come, 'come bet is cleared upon loss')

  t.end()
})

tap.test('comeFlat: new come bet loses on 12', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 12,
    isComeOut: false
  }

  const result = settle.comeFlat({ hand, bets })
  t.notOk(result.payout, 'no payout on a come loss')
  t.notOk(result.bets.come, 'come bet is cleared upon loss')

  t.end()
})

tap.test('comeFlat: new come bet travels to 4', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 4,
    isComeOut: false
  }

  const result = settle.comeFlat({ hand, bets })
  t.notOk(result.payout, 'no payout when bet travels')
  t.notOk(result.bets.come.new, 'new come bet is cleared')
  t.equal(result.bets.come[4].line.amount, 5, 'come bet travels to 4')

  t.end()
})

tap.test('comeFlat: new come bet travels to 6', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 6,
    isComeOut: false
  }

  const result = settle.comeFlat({ hand, bets })
  t.notOk(result.payout, 'no payout when bet travels')
  t.notOk(result.bets.come.new, 'new come bet is cleared')
  t.equal(result.bets.come[6].line.amount, 5, 'come bet travels to 6')

  t.end()
})

tap.test('comeLine: established come bet wins', function (t) {
  const bets = {
    come: {
      6: {
        line: {
          amount: 5
        }
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 6,
    isComeOut: false
  }

  const result = settle.comeLine({ hand, bets })
  t.equal(result.payouts.length, 1)
  t.equal(result.payouts[0].type, 'come 6 win')
  t.equal(result.payouts[0].principal, 5)
  t.equal(result.payouts[0].profit, 5)
  t.notOk(result.bets.come, 'come bet is cleared upon win')

  t.end()
})

tap.test('comeLine: multiple established come bets, one wins', function (t) {
  const bets = {
    come: {
      4: {
        line: {
          amount: 5
        }
      },
      6: {
        line: {
          amount: 5
        }
      },
      9: {
        line: {
          amount: 5
        }
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 6,
    isComeOut: false
  }

  const result = settle.comeLine({ hand, bets })
  t.equal(result.payouts.length, 1)
  t.equal(result.payouts[0].type, 'come 6 win')
  t.equal(result.payouts[0].principal, 5)
  t.equal(result.payouts[0].profit, 5)
  t.notOk(result.bets.come[6], 'winning come bet is cleared')
  t.ok(result.bets.come[4], 'other come bets remain')
  t.ok(result.bets.come[9], 'other come bets remain')

  t.end()
})

tap.test('comeLine: all established come bets lose on seven out', function (t) {
  const bets = {
    come: {
      4: {
        line: {
          amount: 5
        }
      },
      6: {
        line: {
          amount: 5
        }
      },
      9: {
        line: {
          amount: 5
        }
      }
    }
  }

  const hand = {
    result: 'seven out',
    diceSum: 7,
    isComeOut: true
  }

  const result = settle.comeLine({ hand, bets })
  t.equal(result.payouts.length, 0)
  t.notOk(result.bets.come, 'all come bets are cleared on seven out')

  t.end()
})

tap.test('comeOdds: come bet odds win on 4', function (t) {
  const bets = {
    come: {
      4: {
        line: {
          amount: 5
        },
        odds: {
          amount: 15
        }
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 4,
    isComeOut: false
  }

  const result = settle.comeOdds({ hand, bets })
  t.equal(result.payouts.length, 1)
  t.equal(result.payouts[0].type, 'come 4 odds win')
  t.equal(result.payouts[0].principal, 15)
  t.equal(result.payouts[0].profit, 30) // 2:1 payout
  t.notOk(result.bets.come[4].odds, 'come odds bet is cleared upon win')
  t.ok(result.bets.come[4].line, 'come line bet remains (settled separately)')

  t.end()
})

tap.test('comeOdds: come bet odds win on 6', function (t) {
  const bets = {
    come: {
      6: {
        line: {
          amount: 5
        },
        odds: {
          amount: 25
        }
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 6,
    isComeOut: false
  }

  const result = settle.comeOdds({ hand, bets })
  t.equal(result.payouts.length, 1)
  t.equal(result.payouts[0].type, 'come 6 odds win')
  t.equal(result.payouts[0].principal, 25)
  t.equal(result.payouts[0].profit, 30) // 6:5 payout
  t.notOk(result.bets.come[6].odds, 'come odds bet is cleared upon win')
  t.ok(result.bets.come[6].line, 'come line bet remains (settled separately)')

  t.end()
})

tap.test('comeOdds: all come odds lose on seven out', function (t) {
  const bets = {
    come: {
      4: {
        line: {
          amount: 5
        },
        odds: {
          amount: 15
        }
      },
      6: {
        line: {
          amount: 5
        },
        odds: {
          amount: 25
        }
      }
    }
  }

  const hand = {
    result: 'seven out',
    diceSum: 7,
    isComeOut: true
  }

  const result = settle.comeOdds({ hand, bets })
  t.equal(result.payouts.length, 0)
  t.notOk(result.bets.come[4].odds, 'come 4 odds bet is cleared on seven out')
  t.notOk(result.bets.come[6].odds, 'come 6 odds bet is cleared on seven out')
  t.ok(result.bets.come[4].line, 'come line bets remain (settled separately)')
  t.ok(result.bets.come[6].line, 'come line bets remain (settled separately)')

  t.end()
})

tap.test('all: new come bet wins on 7', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  const hand = {
    result: 'neutral',
    diceSum: 7,
    isComeOut: false
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.payouts.ledger.length, 1)
  t.equal(settled.payouts.ledger[0].type, 'come win')
  t.equal(settled.payouts.total, 10)

  t.end()
})

tap.test('all: come bet travels to point and wins with odds', function (t) {
  const bets = {
    come: {
      new: {
        amount: 5
      }
    }
  }

  // First roll: come bet travels to 4
  let hand = {
    result: 'neutral',
    diceSum: 4,
    isComeOut: false
  }

  const settled1 = settle.all({ bets, hand })
  t.equal(settled1.come[4].line.amount, 5, 'come bet travels to 4')

  // Add odds to the come bet
  settled1.come[4].odds = { amount: 15 }
  // Remove payouts from first settlement to prepare for second roll
  delete settled1.payouts

  // Second roll: 4 hits, come bet and odds win
  hand = {
    result: 'neutral',
    diceSum: 4,
    isComeOut: false
  }

  const settled2 = settle.all({ bets: settled1, hand })

  t.equal(settled2.payouts.ledger.length, 2)
  t.equal(settled2.payouts.ledger[0].type, 'come 4 win')
  t.equal(settled2.payouts.ledger[0].profit, 5)
  t.equal(settled2.payouts.ledger[1].type, 'come 4 odds win')
  t.equal(settled2.payouts.ledger[1].profit, 30) // 2:1 on $15
  t.equal(settled2.payouts.total, 55) // $5 + $5 + $15 + $30

  t.end()
})

tap.test('all: multiple come bets lose on seven out', function (t) {
  const bets = {
    pass: {
      line: {
        amount: 5
      },
      odds: {
        amount: 25
      }
    },
    come: {
      4: {
        line: {
          amount: 5
        },
        odds: {
          amount: 15
        }
      },
      6: {
        line: {
          amount: 5
        },
        odds: {
          amount: 25
        }
      }
    }
  }

  const hand = {
    result: 'seven out',
    diceSum: 7,
    isComeOut: true
  }

  const settled = settle.all({ bets, hand })

  t.equal(settled.payouts.ledger.length, 0, 'no payouts on seven out')
  t.notOk(settled.come, 'all come bets are cleared')
  t.notOk(settled.pass.line, 'pass line bet is cleared')
  t.notOk(settled.pass.odds, 'pass odds bet is cleared')

  t.end()
})
