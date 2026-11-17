import { expect, it } from 'vitest'
import { createSaiyuFatalityFilm } from '../../../../demos/fighting-showcase/saiyuFatalityFilm'
it.each(['player', 'opponent'] as const)(
  'earns Saiyu’s native three-sense staff knockout as %s',
  (side) => {
    const film = createSaiyuFatalityFilm({ side })
    expect(film.report.senses).toEqual([1, 3, 7])
    expect(film.report.staffDeath).toBe(true)
    expect(film.state.winner).toBe(side)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
