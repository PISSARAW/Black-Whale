import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { advanceGumArsenal } from './hisokaArsenal'
import { bodyPartFunctional } from './bodyDamage'
import { physicalHandOccupancy } from './deviceHands'
import { walkSpeed } from './fighterMovement'
import { applyAuraContext } from './nen'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(side: FightSide): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'hisoka' : 'theta', side === 'opponent' ? 'hisoka' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { [side]: 'hand-and-lower-leg' },
        },
      },
    }),
  )
  return { ...state, [side]: { ...state[side], health: 37, aura: 80 } }
}
function command(state: FightState, side: FightSide, command: ArsenalCommand) {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}

describe('Hisoka’s actual damaged parts and rubber replacements', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`replaces only actual damaged parts without healing flesh or HP for ${side}`, () => {
      const state = ready(side)
      expect(bodyPartFunctional(state[side], 'left-hand')).toBe(false)
      expect(physicalHandOccupancy(state, side).has('left')).toBe(true)
      const formed = command(state, side, { action: 'gum-prosthesis' })
      expect(formed[side].gumProstheses).toMatchObject({
        source: 'personal',
        parts: ['left-hand', 'right-lower-leg'],
      })
      expect(formed[side].aura).toBe(64)
      expect(formed[side].health).toBe(37)
      expect(formed[side].bodyDamage).toBe(state[side].bodyDamage)
      expect(physicalHandOccupancy(formed, side).has('left')).toBe(false)
      expect(walkSpeed(formed[side])).toBe(walkSpeed(state[side]) * 2)
      expect(command(formed, side, { action: 'gum-prosthesis' })).toBe(formed)
    })
    it(`keeps the physical injury after the rubber is removed for ${side}`, () => {
      const formed = command(ready(side), side, { action: 'gum-prosthesis' })
      const free = { ...formed, [side]: { ...formed[side], arenaRecovery: 0 } }
      const removed = command(free, side, { action: 'gum-prosthesis-release' })
      expect(removed[side].gumProstheses).toBeUndefined()
      expect(bodyPartFunctional(removed[side], 'left-hand')).toBe(false)
      expect(bodyPartFunctional(removed[side], 'right-lower-leg')).toBe(false)
      expect(removed[side].health).toBe(37)
    })
    it(`keeps On and stops voluntary Nen support under its contract for ${side}`, () => {
      const formed = command(ready(side), side, { action: 'gum-prosthesis' })
      const sworn = {
        ...formed,
        [side]: applyAuraContext(
          { ...formed[side], on: { grudge: 100, sealFrames: 0 } },
          { ...EMPTY_INPUT, aura: true, hatsu: true },
        ),
      }
      expect(sworn[side].nen.on).toBe(true)
      const stopped = advanceGumArsenal(sworn)
      expect(stopped[side].gumProstheses).toBeUndefined()
      expect(stopped[side].nen.on).toBe(true)
      expect(stopped[side].health).toBe(37)
    })
  }
  it('does not produce extra limbs for an uninjured fighter', () => {
    const state = beginFight(createFight('hisoka', 'theta'))
    expect(state.player.bodyDamage).toBeUndefined()
    expect(command(state, 'player', { action: 'gum-prosthesis' })).toBe(state)
  })
})
