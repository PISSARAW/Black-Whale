import { expect, it } from 'vitest'
import { createBiscuitFatalityFilm } from '../../../../demos/fighting-showcase/biscuitFatalityFilm'

it.each(['player', 'opponent'] as const)(
  'earns a physical knockout after %s reveals without damage or aura cost',
  (side) => {
    const film = createBiscuitFatalityFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.state[side === 'player' ? 'opponent' : 'player'].health).toBe(0)
    expect(film.report.revealed).toBe(true)
    expect(film.report.harmlessReveal).toBe(true)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
