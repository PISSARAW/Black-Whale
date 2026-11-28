import { expect, it } from 'vitest'
import { createTserriednichFatalityFilm } from '../../../../demos/fighting-showcase/tserriednichFatalityFilm'

it('records a real forecast, frozen viewing and physical divergence before the real execution', () => {
  const film = createTserriednichFatalityFilm()
  expect(film.report.forecastFrames).toBe(600)
  expect(film.report.duration).toBe(11)
  expect(film.report.frameCount).toBe(660)
  expect(film.report.victory.shotFrame).toBeGreaterThan(film.report.victory.reunionFrame)
  expect(film.report.frozenWhileViewing).toBe(true)
  expect(film.report.diverged).toBe(true)
  expect(film.report.physicalDisplacement).toBeGreaterThan(0)
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.nativeFinishingProjectile).toBeGreaterThan(0)
  expect(film.state.finishingShot).toBe(film.report.nativeFinishingProjectile)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
