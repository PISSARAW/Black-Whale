import { expect, it } from 'vitest'
import { createKurapikaTroupeFilm } from '../../../../demos/fighting-showcase/kurapikaTroupeFilm'
it.each(['player', 'opponent'] as const)(
  'uses real Jail, forced Zetsu and physical blows for %s’s victory',
  (side) => {
    const film = createKurapikaTroupeFilm({ side })
    expect(film.report.captured).toBe(true)
    expect(film.report.harmlessCapture).toBe(true)
    expect(film.report.capturedDuringBlows).toBe(true)
    expect(film.report.nativeBlows).toBeGreaterThan(0)
    expect(film.state.winner).toBe(side)
    expect(film.state[side].kurapika!.lifespanFrames).toBeGreaterThan(0)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
it.each(['hisoka', 'biscuit', 'kurapika'] as const)(
  'rejects the non-member %s before casting Chain Jail',
  (target) => {
    expect(() => createKurapikaTroupeFilm({ target })).toThrow('restricted')
  },
)
