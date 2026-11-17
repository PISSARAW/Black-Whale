import { expect, it } from 'vitest'
import { createLeorioFatalityFilm } from '../../../../demos/fighting-showcase/leorioFatalityFilm'
it('awards the real remote-punch knockout before the ceiling fatality', () => {
  const film = createLeorioFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.nativeFinishingProjectile).toBeGreaterThan(0)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
