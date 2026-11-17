import { expect, it } from 'vitest'
import { FIGHTING_ROSTER } from '../roster'
import { personalGuardTrack } from './personalGuardTrack'

it.each(['longhi', 'furykov'] as const)(
  'resolves all five native cinematic hits against every playable target as %s',
  (hero) => {
    for (const target of FIGHTING_ROSTER) {
      const track = personalGuardTrack(hero, target.id)
      expect(track.impacts, `${hero} vs ${target.id}`).toHaveLength(5)
      expect(track.last).toBe(track.states.length - 1)
      expect(track.states.at(-1)!.opponent.health).toBeLessThan(track.states[0].opponent.health)
      for (let i = 1; i < track.impacts.length; i++)
        expect(track.impacts[i].index).toBeGreaterThan(track.impacts[i - 1].index)
    }
  },
)
