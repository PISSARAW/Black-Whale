import { expect, it } from 'vitest'
import { createVoconteFatalityFilm } from '../../../../demos/fighting-showcase/voconteFatalityFilm'
it.each(['player', 'opponent'] as const)(
  'uses two harmless directional passages before a real knockout as %s',
  (side) => {
    const film = createVoconteFatalityFilm({ side })
    for (const key of [
      'linked',
      'firstPassage',
      'returnPassage',
      'harmless',
      'closed',
      'physicalKnockout',
      'heroFirstPassage',
      'heroReturn',
    ] as const)
      expect(film.report[key], key).toBe(true)
    expect(film.state.winner).toBe(side)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
