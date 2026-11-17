import { expect, it } from 'vitest'
import { createHinrighFatalityFilm } from '../../../../demos/fighting-showcase/hinrighFatalityFilm'
it.each(['player', 'opponent'] as const)(
  'earns Hinrigh’s native cuff capture and physical victory as %s',
  (side) => {
    const film = createHinrighFatalityFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.inventory).toBe(true)
    expect(film.report.capture).toBe(true)
    expect(film.report.harmless).toBe(true)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
