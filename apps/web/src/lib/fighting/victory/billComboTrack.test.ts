import { expect, it } from 'vitest'
import { billComboTrack } from './billComboTrack'
it.each(['benjamin', 'biscuit', 'bill'] as const)(
  'plays Bill’s three native combos against %s without a guard gap',
  (target) => {
    const track = billComboTrack(target)
    expect(track.impacts.map((hit) => hit.comboHits)).toEqual([1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 4, 5])
    expect(track.states[track.last].opponent.comboHits).toBe(5)
    expect(
      track.states.every(
        (state, i) => i === 0 || state.opponent.health <= track.states[i - 1].opponent.health,
      ),
    ).toBe(true)
    expect(track.states[track.last].player.health).toBe(track.states[0].player.health)
    expect(track.impacts.map((hit) => hit.slot)).toEqual([
      'standingLight',
      'standingHeavy',
      'lowHeavy',
      'standingLight',
      'forwardLight',
      'standingHeavy',
      'lowHeavy',
      'lowLight',
      'forwardLight',
      'standingHeavy',
      'backHeavy',
      'forwardHeavy',
    ])
  },
)
