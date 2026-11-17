import { expect, it } from 'vitest'
import { createHanzoFatalityFilm } from '../../../../demos/fighting-showcase/hanzoFatalityFilm'
it.each(['player', 'opponent'] as const)(
  'earns %s’s native projected-choke verdict with a fixed vulnerable body',
  (side) => {
    const film = createHanzoFatalityFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.hovered).toBe(true)
    expect(film.report.crossed).toBe(true)
    expect(film.report.sleepingBodyFixed).toBe(true)
    expect(film.report.distantRecallRejected).toBe(true)
    expect(film.report.projectedChoke).toBe(true)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
