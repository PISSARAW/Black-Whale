import { describe, expect, it } from 'vitest'
import { arenaMoveSlot, createHeldDirection } from './moveSlot'
import { aiOpeningSlot, continueAiCombo } from './aiCombo'
import { combatReducer, initialCombatState } from '../combat/reducer'
import type { CombatState } from '../combat/types'
import { FIGHTING_ROSTER } from '../fighting/roster'
import { moveForSlot } from '../fighting/movesets'

describe('Clash commands in first person', () => {
  it('reads direction and aim like Clash reads its stick', () => {
    const base = { fighterId: 'kurapika' as const, aimed: 'torso' as const }
    expect(arenaMoveSlot({ ...base, action: 'light', direction: null })).toBe('standingLight')
    expect(arenaMoveSlot({ ...base, action: 'heavy', direction: 'forward' })).toBe('forwardHeavy')
    expect(arenaMoveSlot({ ...base, action: 'heavy', direction: 'back' })).toBe('backHeavy')
    expect(arenaMoveSlot({ ...base, action: 'light', direction: 'back' })).toBe('standingLight')
    expect(arenaMoveSlot({ ...base, action: 'special', direction: 'back' })).toBe('backSpecial')
    expect(arenaMoveSlot({ ...base, action: 'light', direction: null, aimed: 'legs' })).toBe(
      'lowLight',
    )
    expect(arenaMoveSlot({ ...base, action: 'special', direction: null, aimed: 'legs' })).toBe(
      'downSpecial',
    )
    expect(arenaMoveSlot({ ...base, action: 'throw', direction: 'forward' })).toBe('throw')
    expect(arenaMoveSlot({ ...base, action: 'light', direction: null, airborne: true })).toBe(
      'airLight',
    )
    expect(arenaMoveSlot({ ...base, action: 'heavy', direction: null, airborne: true })).toBe(
      'airHeavy',
    )
  })

  // Camilla is the one fighter without a special at all; she keeps a neutral fallback.
  it('reaches only moves the whole roster owns', () => {
    for (const { id } of FIGHTING_ROSTER)
      for (const action of ['light', 'heavy', 'special', 'throw', 'finisher'] as const)
        for (const direction of ['forward', 'back', null] as const) {
          const slot = arenaMoveSlot({ fighterId: id, action, direction, aimed: 'legs' })
          const owned = moveForSlot(id, slot) ?? (slot === 'neutralSpecial' ? null : undefined)
          if (action !== 'throw' && action !== 'finisher') expect(owned).not.toBeUndefined()
        }
  })

  it('tracks the held forward and back keys', () => {
    const held = createHeldDirection()
    held.down('KeyW')
    expect(held.current()).toBe('forward')
    held.down('ArrowDown')
    expect(held.current()).toBeNull()
    held.up('KeyW')
    expect(held.current()).toBe('back')
  })
})

describe('Arena opponent on authored Clash routes', () => {
  it('opens with the first move of a ground route', () => {
    expect(moveForSlot('kurapika', aiOpeningSlot('kurapika', 0))).not.toBeNull()
  })

  it('follows the route while its cancel window is open', () => {
    const base = initialCombatState({
      playerAt: [1.5, 0],
      opponentAt: [0, 0],
      terrain: initialCombatState().terrain,
    })
    let state: CombatState = {
      ...base,
      player: { ...base.player, guard: 'head' as const },
      opponent: { ...base.opponent, mode: 'ren' as const },
    }
    state = combatReducer(state, {
      type: 'FIGHTING_MOVE',
      side: 'opponent',
      fighterId: 'kurapika',
      slot: 'standingLight',
      targetAt: [3, 0],
    })
    state = combatReducer(state, { type: 'TICK', dt: 4 / 60 })
    expect(state.opponent.chain?.connected).toBe('hit')

    const next = continueAiCombo(state, 'kurapika', 'master')
    expect(next?.opponent.intent?.combo).toEqual([
      'kurapika:standingLight',
      'kurapika:standingHeavy',
    ])
    expect(continueAiCombo(state, 'kurapika', 'initiate')).toBeNull()
  })
})
