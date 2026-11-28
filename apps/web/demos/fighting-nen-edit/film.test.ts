import { test } from 'vitest'
import assert from 'node:assert/strict'
import { COMBAT_FIGHTERS } from '../../src/lib/fighting/combatRoutes'
import { buildFilm, filmReport } from './film'
import { groups, categoryOf, HEXAGON } from './groups'
import { BEAT, PIVOT_FREEZE } from './shots'

const film = buildFilm()
const report = filmReport(film)

test('all forty fighters appear once outside the hook, grouped in hexagon order', () => {
  const shown = film.cuts.filter((c) => c.kind === 'fighter' || c.kind === 'pivot')
  assert.deepEqual(new Set(shown.map((c) => c.shot.route.id)), new Set(COMBAT_FIGHTERS))
  assert.equal(shown.length, 40)
  assert.deepEqual(
    groups().map((g) => g.category),
    [...HEXAGON, 'unknown'],
  )
})

test('a category is only ever a known affinity or one unambiguous technique category', () => {
  assert.equal(categoryOf('kurapika'), 'conjurer')
  assert.equal(categoryOf('halkenburg'), 'unknown') // Grimmel spans three categories
  assert.equal(categoryOf('beyond'), 'unknown') // no category recorded
})

test('Kurapika closes Conjuration and is frozen on the frame Emperor Time turns on', () => {
  const pivot = film.cuts.find((c) => c.kind === 'pivot')!
  const conj = film.cuts.filter((c) => c.category === 'conjurer' && c.kind !== 'hook')
  assert.equal(conj.at(-1), pivot)
  const states = pivot.shot.route.states
  const held = pivot.sims.slice(PIVOT_FREEZE, PIVOT_FREEZE + BEAT)
  assert.ok(held.every((s) => s === held[0]))
  assert.equal(states[held[0]].player.kurapika?.emperorTime, true)
  assert.equal(states[held[0] - 1].player.kurapika?.emperorTime, false)
})

test('every cut is on the beat grid', () => {
  assert.ok(report.cuts.every((c) => c % (BEAT / 2) === 0))
})
