import { expect, it } from 'vitest'
import { createTerebellumFatalityFilm } from '../../../../demos/fighting-showcase/terebellumFatalityFilm'
it.each(['player', 'opponent'] as const)(
  'earns a real reflected knockout without a scratch as %s',
  (side) => {
    const film = createTerebellumFatalityFilm({ side })
    expect(film.report.transferred).toBe(true)
    expect(film.report.reflectedKnockout).toBe(true)
    expect(film.report.uninjured).toBe(true)
    expect(film.state.winner).toBe(side)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
