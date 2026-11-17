import { expect, it } from 'vitest'
import { createMachiFatalityFilm } from '../../../../demos/fighting-showcase/machiFatalityFilm'
it('keeps real tracking, a maintained short bind and the tension-finisher knockout', () => {
  const film = createMachiFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.tracking).toBe(true)
  expect(film.report.maintainedBind).toBe(true)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
