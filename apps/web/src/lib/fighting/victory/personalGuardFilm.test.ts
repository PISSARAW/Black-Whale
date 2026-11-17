import { expect, it } from 'vitest'
import { createPersonalGuardFilm } from '../../../../demos/fighting-showcase/personalGuardFilm'
it.each(['longhi', 'furykov'] as const)(
  'earns a native knockout and observes the real Nen conditions as %s',
  (hero) => {
    for (const side of ['player', 'opponent'] as const) {
      const film = createPersonalGuardFilm({ hero, side })
      expect(film.report.physicalKnockout).toBe(true)
      expect(film.report.noNewNenDamage).toBe(true)
      expect(film.state.winner).toBe(side)
      expect(film.report.impactFrames).toHaveLength(hero === 'furykov' ? 3 : 5)
      expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
    }
  },
)
