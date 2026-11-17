import { expect, it } from 'vitest'
import { createKurapikaJudgmentFilm } from '../../../../demos/fighting-showcase/kurapikaJudgmentFilm'

it.each(['player', 'opponent'] as const)(
  'earns %s’s verdict through an actual forbidden Nen attempt after harmless implantation',
  (side) => {
    const film = createKurapikaJudgmentFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.implanted).toBe(true)
    expect(film.report.harmlessImplant).toBe(true)
    expect(film.report.noChainJail).toBe(true)
    expect(film.state[side].kurapika!.lifespanFrames).toBeGreaterThan(0)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
