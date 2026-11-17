import { expect, it } from 'vitest'
import { createMelodyFatalityFilm } from '../../../../demos/fighting-showcase/melodyFatalityFilm'
it.each(['player', 'opponent'] as const)(
  'earns a native nonlethal decision while enchanting the listener as %s',
  (side) => {
    const film = createMelodyFatalityFilm({ side })
    expect(film.report.entranced).toBe(true)
    expect(film.report.harmless).toBe(true)
    expect(film.report.alive).toBe(true)
    expect(film.state.winner).toBe(side)
    expect(film.state.finishReason).toBe('time')
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
