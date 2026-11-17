import { expect, it } from 'vitest'
import { createHisokaFearFilm } from '../../../../demos/fighting-showcase/hisokaFearFilm'
it.each(['player', 'opponent'] as const)(
  'prepares native Ren and Gyo without a pressure kill (%s)',
  (side) => {
    const film = createHisokaFearFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report).toMatchObject({
      texturePrepared: true,
      renActive: true,
      gyoActive: true,
      textureNotDispelled: true,
      noPressureDamage: true,
      narrativeFearDeath: true,
      frameCount: 600,
      duration: 10,
    })
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
