import { expect, it } from 'vitest'
import { soulDuel, shootSoul } from './halkenburgSoulTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { createKurapika } from './kurapika'
import { recordDolphinEffects, dolphinIsBusy } from './kurapikaDolphin'
import type { FightState } from './types'

it('classifies an accomplished consciousness exchange independently of maintained Dolphin counters', () => {
  const before = soulDuel()
  const after = mapFrames(shootSoul(before), 90)
  function borrowedContext(state: FightState): FightState {
    return {
      ...state,
      player: {
        ...state.player,
        nenOwner: 'kurapika',
        kurapika: {
          ...createKurapika(),
          emperorTime: true,
          held: {
            source: 'halkenburg',
            moveId: 'halkenburg:neutralSpecial',
            victim: 'opponent',
            loaded: true,
            used: true,
            returned: false,
            sustainedKeys: [],
          },
        },
      },
    }
  }
  const recorded = recordDolphinEffects(borrowedContext(before), borrowedContext(after), 'player')
  const held = recorded.player.kurapika!.held!
  expect(held.sustainedKeys).not.toContain('opponent:possessedFrames')
  expect(dolphinIsBusy(recorded, 'player', held)).toBe(false)
  expect(recorded.opponent.halkenburgSoul).toEqual(after.opponent.halkenburgSoul)
  expect(recorded.opponent.hatsuEffects.possessedFrames).toBe(1)
})
