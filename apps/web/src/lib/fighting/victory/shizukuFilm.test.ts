import { expect, it } from 'vitest'
import { createShizukuFatalityFilm } from '../../../../demos/fighting-showcase/shizukuFatalityFilm'
it('requires real open wounds and a native blood-suction death before cosmetic corpse cleanup', () => {
  const film = createShizukuFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.wounds).toBeGreaterThan(0)
  expect(film.report.bloodDeath).toBe(true)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
