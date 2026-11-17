import { expect, it } from 'vitest'
import { createIllumiFatalityFilm } from '../../../../demos/fighting-showcase/illumiFatalityFilm'
it('implants without damage, proves three native orders and earns a physical knockout', () => {
  const film = createIllumiFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.implanted).toBe(true)
  expect(film.report.implantDamage).toBe(0)
  expect(film.report.retreat).toBe(true)
  expect(film.report.approach).toBe(true)
  expect(film.report.stayed).toBe(true)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
