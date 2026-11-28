import { test } from 'vitest'
import assert from 'node:assert/strict'
import { combatLessonsFor } from '../../src/lib/fighting/combatRoutes'
import { buildFilm, filmReport } from './film'

const film = buildFilm()
const report = filmReport(film)

test('every Feitan route and his signature are recorded, Kameo routes included', () => {
  assert.equal(film.all.length, combatLessonsFor('feitan').length + 1)
  assert.equal(film.all.filter((c) => c.family === 'Kameo').length, 6)
  assert.equal(film.all.at(-1)!.family, 'Signature')
})

test('only routes that fail in the game itself are left out', () => {
  // feitan:air also fails combatRoutes.test.ts: Feitan lands before the air heavy.
  assert.deepEqual(
    film.all.filter((c) => c.error).map((c) => c.id),
    ['feitan:air'],
  )
  for (const p of film.placed) assert.ok(p.combo.hits > 0, p.combo.id)
})

test('shots play forwards on the beat grid', () => {
  for (const p of film.placed) {
    assert.ok(p.sims.every((s, i) => s < p.combo.states.length && (!i || s >= p.sims[i - 1])))
  }
  assert.ok(report.cuts.every((c) => c % 6 === 0))
})
