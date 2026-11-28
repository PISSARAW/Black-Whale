import { test } from 'vitest'
import assert from 'node:assert/strict'
import { buildFilm, filmReport } from './film'
import { BAR, FINISHERS } from './shots'

const film = buildFilm()
const report = filmReport(film)

test('twelve bars, every section on the bar grid', () => {
  assert.equal(report.frames, 12 * BAR)
  for (const [, [start]] of Object.entries(report.sections)) assert.equal(start % (BAR / 4), 0)
})

test('the chain uses 36 different fighters and the drop counts up to #1', () => {
  const chain = film.cuts.filter((c) => c.section === 'build' || c.section === 'rush')
  assert.equal(new Set(chain.map((c) => c.shot.route.id)).size, 36)
  const drop = film.cuts.filter((c) => c.section === 'drop')
  assert.deepEqual(
    drop.map((c) => c.shot.route.id),
    [...FINISHERS],
  )
  assert.deepEqual(
    drop.map((c) => c.rank),
    [3, 2, 1],
  )
  assert.ok(drop.every((c, i) => !i || c.damage! >= drop[i - 1].damage!))
})

test('every finisher freezes on its beat and simulation never runs backwards in a shot', () => {
  for (const f of report.freezes) assert.equal(f % 12, 0)
  for (const c of film.cuts) assert.ok(c.sims.every((s, i) => !i || s >= c.sims[i - 1]))
})
