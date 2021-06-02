'use strict'

const tap = require('tap')
const lib = require('./')

tap.test('roll d6', function (t) {
  const result = lib.roll()
  t.ok(result >= 1, 'd6 roll is 1 or higher')
  t.ok(result <= 6, 'd6 roll is 6 or lower')
  t.match(result, /[1-6]{1}/, 'd6 roll is an integer 1-6')

  t.end()
})
