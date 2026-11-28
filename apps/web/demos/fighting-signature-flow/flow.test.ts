import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COMBAT_FIGHTERS } from '../../src/lib/fighting/combatRoutes'
import { buildFilm, filmReport } from './film'
import { GRID } from './timeline'

const film = buildFilm()
const report = filmReport(film)

test('every fighter appears once, playing its own complete signature route', () => {
  assert.deepEqual(report.failures, [])
  assert.equal(film.placed.length, COMBAT_FIGHTERS.length)
  assert.deepEqual(new Set(film.placed.map((p) => p.shot.route.id)), new Set(COMBAT_FIGHTERS))
})

test('each cut leaves one strike and enters another, facing the same way, on the beat grid', () => {
  film.placed.forEach((p, i) => {
    assert.equal(p.start % GRID, 0, `${p.shot.route.id} starts off the grid`)
    if (!i) return
    const out = film.placed[i - 1].shot.exit
    const into = p.shot.entry
    assert.ok(out && into, `cut ${i} is not strike to strike`)
    assert.equal(out.facing, into.facing)
  })
})

test('simulation frames only move forwards within a shot, and the camera keeps one distance at a cut', () => {
  for (const p of film.placed) {
    assert.ok(
      p.sims.every(
        (s, i) => s >= 0 && s < p.shot.route.states.length && (!i || s >= p.sims[i - 1]),
      ),
    )
  }
  film.placed.forEach((p, i) => {
    if (i) assert.equal(film.placed[i - 1].camera.at(-1)!.z, p.camera[0].z)
  })
  assert.equal(report.prerolls.length, report.cuts.length)
})
