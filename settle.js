function passLine ({ bets, hand, rules }) {
  if (!bets?.pass?.line) {
    if (process.env.DEBUG) console.log('[decision] no pass line bet')
    return { bets }
  }

  const actionResults = ['seven out', 'point win', 'comeout win', 'comeout loss']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) {
    if (process.env.DEBUG) console.log(`[decision] pass line bet carries over (${hand.result})`)
    return { bets } // keep bets intact if no action
  }

  const payout = {
    type: hand.result,
    principal: bets.pass.line.amount,
    profit: bets.pass.line.amount * 1
  }

  delete bets.pass.line // clear pass line bet on action

  if (hand.result === 'comeout loss' || hand.result === 'seven out') {
    if (process.env.DEBUG) console.log(`[payout] pass line loss -$${payout.principal}`)
    return { bets }
  }

  if (process.env.DEBUG) {
    console.log(`[payout] ${payout.type} $${payout.principal + payout.profit}`)
  }

  return { payout, bets }
}

function passOdds ({ bets, hand, rules }) {
  if (!bets?.pass?.odds) {
    if (process.env.DEBUG) console.log('[decision] no pass odds bet')
    return { bets }
  }

  const actionResults = ['seven out', 'point win']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) {
    if (process.env.DEBUG) console.log(`[decision] pass odds bet carries over (${hand.result})`)
    return { bets } // keep bets intact if no action
  }

  const payouts = {
    4: 2,
    5: 3 / 2,
    6: 6 / 5,
    8: 6 / 5,
    9: 3 / 2,
    10: 2
  }

  const payout = {
    type: 'pass odds win',
    principal: bets.pass.odds.amount,
    profit: bets.pass.odds.amount * payouts[hand.diceSum]
  }

  delete bets.pass.odds // clear pass odds bet on action

  if (hand.result === 'seven out') {
    if (process.env.DEBUG) console.log(`[payout] pass odds loss -$${payout.principal}`)
    // don't return the payout argument for a loss
    return { bets }
  }

  if (process.env.DEBUG) {
    console.log(`[payout] ${payout.type} $${payout.principal + payout.profit}`)
  }

  return { payout, bets }
}

function placeBet ({ rules, bets, hand, placeNumber }) {
  const label = placeNumber === 6 ? 'six' : placeNumber === 8 ? 'eight' : String(placeNumber)

  if (!bets?.place?.[label]) {
    if (process.env.DEBUG) console.log(`[decision] no place ${placeNumber} bet`)
    return { bets }
  }

  const comeOutResults = ['comeout win', 'comeout loss', 'point set']
  if (comeOutResults.includes(hand.result)) {
    const bet = bets.place[label]
    const betWorking = bet.working !== undefined
      ? bet.working
      : !(rules?.placeBetsOffOnComeOut)
    if (!betWorking) {
      if (process.env.DEBUG) console.log(`[decision] place ${placeNumber} bet is off on come-out`)
      return { bets }
    }
  }

  if (hand.diceSum === 7 && hand.result === 'seven out') {
    if (process.env.DEBUG) console.log(`[decision] place ${placeNumber} loss -$${bets.place[label].amount}`)
    delete bets.place[label]
    if (Object.keys(bets.place).length === 0) delete bets.place
    return { bets }
  }

  // place bets are off on comeout. if a point is set matching the place number, the bet doesn't win
  if (hand.diceSum === placeNumber && hand.result !== 'point set') {
    const payouts = {
      6: 7 / 6,
      8: 7 / 6
    }

    const payout = {
      type: `place ${placeNumber} win`,
      principal: bets.place[label].amount,
      profit: bets.place[label].amount * payouts[placeNumber]
    }

    // bet comes down on a win to give control to the betting module to put it back up if desired
    delete bets.place[label]

    return { payout, bets }
  }

  if (process.env.DEBUG) console.log(`[decision] place ${placeNumber} bet stands`)
  return { bets }
}

function placeSix (opts) {
  return placeBet({ ...opts, placeNumber: 6 })
}

function placeEight (opts) {
  return placeBet({ ...opts, placeNumber: 8 })
}

function comeLine ({ bets, hand }) {
  if (!bets?.come) {
    if (process.env.DEBUG) console.log('[decision] no come bets')
    return { bets }
  }

  const payouts = []
  bets.come.points = bets.come.points || {}

  if (bets.come.points) {
    Object.keys(bets.come.points).forEach(point => {
      const remainingBets = []
      bets.come.points[point].forEach(bet => {
        if (hand.result === 'seven out') {
          if (process.env.DEBUG) console.log(`[decision] come line ${point} loss -$${bet.line.amount}`)
          return
        }

        if (hand.diceSum === Number(point)) {
          const linePayout = {
            type: 'come line win',
            principal: bet.line.amount,
            profit: bet.line.amount
          }
          payouts.push(linePayout)

          if (bet.odds) {
            const oddsPayouts = {
              4: 2,
              5: 3 / 2,
              6: 6 / 5,
              8: 6 / 5,
              9: 3 / 2,
              10: 2
            }

            payouts.push({
              type: 'come odds win',
              principal: bet.odds.amount,
              profit: bet.odds.amount * oddsPayouts[point]
            })
          }
          return
        }

        remainingBets.push(bet)
      })

      if (remainingBets.length) {
        bets.come.points[point] = remainingBets
      } else {
        delete bets.come.points[point]
      }
    })

    if (Object.keys(bets.come.points).length === 0) {
      delete bets.come.points
    }
  }

  const pending = bets.come.pending || []

  if (pending.length) {
    const immediateWins = [7, 11]
    const immediateLosses = [2, 3, 12]

    pending.forEach(bet => {
      if (immediateWins.includes(hand.diceSum)) {
        const payout = {
          type: 'come line win',
          principal: bet.amount,
          profit: bet.amount
        }
        payouts.push(payout)
      } else if (immediateLosses.includes(hand.diceSum)) {
        if (process.env.DEBUG) console.log(`[decision] come line loss -$${bet.amount}`)
      } else {
        bets.come.points = bets.come.points || {}
        bets.come.points[hand.diceSum] = bets.come.points[hand.diceSum] || []
        bets.come.points[hand.diceSum].push({ line: { amount: bet.amount } })
        if (process.env.DEBUG) console.log(`[decision] come line moves to ${hand.diceSum}`)
      }
    })

    delete bets.come.pending
  }

  if (bets.come && Object.keys(bets.come).length === 0) {
    delete bets.come
  }

  return { bets, payouts }
}

function dontPassLine ({ bets, hand, rules }) {
  if (!bets?.dontPass?.line) {
    if (process.env.DEBUG) console.log('[decision] no dont pass line bet')
    return { bets }
  }

  // comeout: 2 or 3 = win, 12 = bar (push/neutral), 7 or 11 = lose, point set = carry
  if (hand.result === 'comeout loss') {
    // shooter rolled 2 or 3 — don't pass wins; 12 is barred (push)
    if (hand.diceSum === 12) {
      // bar 12: push, bet stays
      if (process.env.DEBUG) console.log('[decision] dont pass bar 12: push, bet carries')
      return { bets }
    }
    const payout = {
      type: 'dont pass win',
      principal: bets.dontPass.line.amount,
      profit: bets.dontPass.line.amount
    }
    delete bets.dontPass.line
    if (process.env.DEBUG) console.log(`[payout] dont pass win $${payout.principal + payout.profit}`)
    return { payout, bets }
  }

  if (hand.result === 'comeout win') {
    // shooter rolled 7 or 11 — don't pass loses
    if (process.env.DEBUG) console.log(`[payout] dont pass loss -$${bets.dontPass.line.amount}`)
    delete bets.dontPass.line
    return { bets }
  }

  if (hand.result === 'seven out') {
    // shooter sevened out — don't pass wins
    const payout = {
      type: 'dont pass win',
      principal: bets.dontPass.line.amount,
      profit: bets.dontPass.line.amount
    }
    delete bets.dontPass.line
    if (process.env.DEBUG) console.log(`[payout] dont pass win $${payout.principal + payout.profit}`)
    return { payout, bets }
  }

  if (hand.result === 'point win') {
    // shooter made the point — don't pass loses
    if (process.env.DEBUG) console.log(`[payout] dont pass loss -$${bets.dontPass.line.amount}`)
    delete bets.dontPass.line
    return { bets }
  }

  // point set or neutral: bet carries
  if (process.env.DEBUG) console.log(`[decision] dont pass line bet carries over (${hand.result})`)
  return { bets }
}

function dontComeLine ({ bets, hand }) {
  if (!bets?.dontCome) {
    if (process.env.DEBUG) console.log('[decision] no dont come bets')
    return { bets }
  }

  const payouts = []
  bets.dontCome.points = bets.dontCome.points || {}

  // Settle established don't come bets at points
  if (bets.dontCome.points) {
    Object.keys(bets.dontCome.points).forEach(point => {
      const remainingBets = []
      bets.dontCome.points[point].forEach(bet => {
        // Seven out: don't come WINS (7 before point)
        if (hand.result === 'seven out') {
          const linePayout = {
            type: 'dont come line win',
            principal: bet.line.amount,
            profit: bet.line.amount
          }
          payouts.push(linePayout)

          if (bet.odds) {
            const oddsPayouts = {
              4: 1 / 2,
              5: 2 / 3,
              6: 5 / 6,
              8: 5 / 6,
              9: 2 / 3,
              10: 1 / 2
            }
            payouts.push({
              type: 'dont come odds win',
              principal: bet.odds.amount,
              profit: bet.odds.amount * oddsPayouts[point]
            })
          }
          return
        }

        // Point number rolled: don't come LOSES
        if (hand.diceSum === Number(point)) {
          if (process.env.DEBUG) console.log(`[decision] dont come ${point} loss -$${bet.line.amount}`)
          return
        }

        remainingBets.push(bet)
      })

      if (remainingBets.length) {
        bets.dontCome.points[point] = remainingBets
      } else {
        delete bets.dontCome.points[point]
      }
    })

    if (Object.keys(bets.dontCome.points).length === 0) {
      delete bets.dontCome.points
    }
  }

  // Settle pending don't come bets (first roll after placing)
  const pending = bets.dontCome.pending || []

  if (pending.length) {
    const immediateWins = [2, 3]
    const immediateLosses = [7, 11]
    const barNumbers = [12] // push

    pending.forEach(bet => {
      if (immediateWins.includes(hand.diceSum)) {
        payouts.push({
          type: 'dont come line win',
          principal: bet.amount,
          profit: bet.amount
        })
      } else if (immediateLosses.includes(hand.diceSum)) {
        if (process.env.DEBUG) console.log(`[decision] dont come line loss -$${bet.amount}`)
      } else if (barNumbers.includes(hand.diceSum)) {
        if (process.env.DEBUG) console.log(`[decision] dont come line push (bar 12) $${bet.amount}`)
        payouts.push({
          type: 'dont come line push',
          principal: bet.amount,
          profit: 0
        })
      } else {
        bets.dontCome.points = bets.dontCome.points || {}
        bets.dontCome.points[hand.diceSum] = bets.dontCome.points[hand.diceSum] || []
        bets.dontCome.points[hand.diceSum].push({ line: { amount: bet.amount } })
        if (process.env.DEBUG) console.log(`[decision] dont come line moves to ${hand.diceSum}`)
      }
    })

    delete bets.dontCome.pending
  }

  if (bets.dontCome && Object.keys(bets.dontCome).length === 0) {
    delete bets.dontCome
  }

  return { bets, payouts }
}

function all ({ bets, hand, rules }) {
  const payouts = []

  const passLineResult = passLine({ bets, hand, rules })

  bets = passLineResult.bets
  payouts.push(passLineResult.payout)

  const dontPassLineResult = dontPassLine({ bets, hand, rules })

  bets = dontPassLineResult.bets
  payouts.push(dontPassLineResult.payout)

  const passOddsResult = passOdds({ bets, hand, rules })

  bets = passOddsResult.bets
  payouts.push(passOddsResult.payout)

  const comeLineResult = comeLine({ bets, hand })

  bets = comeLineResult.bets
  payouts.push(...(comeLineResult.payouts || []))

  const dontComeLineResult = dontComeLine({ bets, hand })

  bets = dontComeLineResult.bets
  payouts.push(...(dontComeLineResult.payouts || []))

  const placeSixResult = placeSix({ rules, bets, hand })

  bets = placeSixResult.bets
  payouts.push(placeSixResult.payout)

  const placeEightResult = placeEight({ rules, bets, hand })

  bets = placeEightResult.bets
  payouts.push(placeEightResult.payout)

  bets.payouts = payouts.reduce((memo, payout) => {
    if (!payout) return memo
    if (process.env.DEBUG) console.log(`[payout] ${payout.type} $${payout.principal + payout.profit} (principal: ${payout.principal}, profit: ${payout.profit})`)

    memo.principal += payout.principal
    memo.profit += payout.profit
    memo.total += payout.principal + payout.profit
    memo.ledger.push(payout)
    return memo
  }, {
    principal: 0,
    profit: 0,
    total: 0,
    ledger: []
  })

  return bets
}

export { passLine, passOdds, dontPassLine, placeBet, placeSix, placeEight, comeLine, dontComeLine, all }
