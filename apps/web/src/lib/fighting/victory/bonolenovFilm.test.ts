import { expect, it } from 'vitest'
import { createBonolenovFatalityFilm } from '../../../../demos/fighting-showcase/bonolenovFatalityFilm'
it('earns a native Jupiter knockout after Prologue, spear and a full dance', () => {
  const film = createBonolenovFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.prologue).toBe(true)
  expect(film.report.spear).toBe(true)
  expect(film.report.prepared).toBeGreaterThanOrEqual(89)
  expect(film.report.jupiterDeath).toBe(true)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
