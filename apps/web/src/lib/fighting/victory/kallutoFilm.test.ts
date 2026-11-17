import { expect, it } from 'vitest'
import { createKallutoFatalityFilm } from '../../../../demos/fighting-showcase/kallutoFatalityFilm'
it('plants concealed paper before a native guided-paper knockout', () => {
  const film = createKallutoFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.planted).toBe(true)
  expect(film.report.concealedPlant).toBe(true)
  expect(film.report.nativeFinishingProjectile).toBeGreaterThan(0)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
