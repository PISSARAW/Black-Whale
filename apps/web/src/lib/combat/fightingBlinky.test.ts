import { describe, expect, it } from 'vitest'
import { moveForSlot } from '../fighting/movesets'
import { combatReducer } from './reducer'
import { strike } from './exchange'
import { initialCombatState, type CombatAction, type CombatState } from './types'

function move(
  slot: Extract<CombatAction, { type: 'FIGHTING_MOVE' }>['slot'],
  targetObject?: { id: string; position: [number, number] },
): Extract<CombatAction, { type: 'FIGHTING_MOVE' }> {
  return {
    type: 'FIGHTING_MOVE',
    side: 'player',
    fighterId: 'shizuku',
    slot,
    targetAt: [3, 0],
    targetObject,
  }
}

function state(): CombatState {
  return initialCombatState({
    playerAt: [0, 0],
    opponentAt: [8, 0],
    terrain: {
      id: 'blinky-room',
      footprint: [
        [-10, -10],
        [10, -10],
        [10, 10],
        [-10, 10],
      ],
      walls: [],
    },
  })
}

describe('Arena Blinky physical targets', () => {
  it('stores the designated scene solid without draining the opponent', () => {
    const initial = state()
    const result = combatReducer(initial, move('neutralSpecial', { id: 'crate', position: [2, 0] }))
    const cost = moveForSlot('shizuku', 'neutralSpecial')!.auraCost

    expect(result.physicalObjects.crate).toEqual({
      id: 'crate',
      position: [2, 0],
      storedBy: 'player',
    })
    expect(result.player.aura).toBe(initial.player.aura - cost)
    expect(result.opponent.aura).toBe(initial.opponent.aura)
  })

  it('keeps one last-object slot and refuses targets outside the four-metre nozzle', () => {
    const stored = combatReducer(state(), move('downSpecial', { id: 'crate', position: [2, 0] }))
    const ready = { ...stored, player: { ...stored.player, cooldown: 0 } }
    const second = combatReducer(ready, move('neutralSpecial', { id: 'chair', position: [3, 0] }))
    const initial = state()
    const distant = combatReducer(
      initial,
      move('neutralSpecial', { id: 'lamp', position: [4.01, 0] }),
    )

    expect(second.physicalObjects).not.toHaveProperty('chair')
    expect(distant).toBe(initial)
  })

  it('ejects the stored solid at the command target and clears the slot', () => {
    const swallowed = combatReducer(
      state(),
      move('neutralSpecial', { id: 'crate', position: [2, 0] }),
    )
    const ready = { ...swallowed, player: { ...swallowed.player, cooldown: 0 } }
    const ejected = combatReducer(ready, move('backSpecial'))

    expect(ejected.physicalObjects.crate).toEqual({
      id: 'crate',
      position: [3, 0],
      storedBy: null,
    })
  })

  it('does not invent blood suction before open wounds exist in Arena', () => {
    const initial = state()
    expect(combatReducer(initial, move('finisher'))).toBe(initial)
  })

  it('opens a wound only when a physical Blinky strike connects', () => {
    const initial = {
      ...state(),
      opponent: { ...state().opponent, position: [1, 0] as [number, number] },
    }
    const connected = strike({
      state: initial,
      side: 'player',
      zone: 'torso',
      technique: 'strike',
      moveId: 'shizuku:standingHeavy',
      grade: () => 'clean',
    })
    const ordinary = strike({
      state: initial,
      side: 'player',
      zone: 'torso',
      technique: 'strike',
      moveId: 'hisoka:standingHeavy',
      grade: () => 'clean',
    })

    expect(connected.opponent.openWounds).toBe(1)
    expect(ordinary.opponent.openWounds).toBe(0)
  })

  it('draws blood through exposed wounds without draining aura', () => {
    const initial = woundedState(2)
    const result = combatReducer(initial, move('finisher'))

    expect(result.opponent.bloodLoss).toBe(2)
    expect(result.opponent.aura).toBe(initial.opponent.aura)
    expect(result.lastEvent).toMatchObject({
      moveId: 'shizuku:finisher',
      impact: 'critical',
      technique: 'hatsu',
    })
  })

  it('lets both hands cover two wounds but leaves a third exposed', () => {
    const covered = combatReducer(woundedState(2, true), move('finisher'))
    const leaking = combatReducer(woundedState(3, true), move('finisher'))

    expect(covered.opponent.bloodLoss).toBe(0)
    expect(covered.player.aura).toBeLessThan(100)
    expect(leaking.opponent.bloodLoss).toBe(1)
  })

  it('cannot draw blood through a wall', () => {
    const initial = woundedState(1)
    initial.terrain.walls = [{ spaceId: initial.terrain.id, start: [1.5, -2], end: [1.5, 2] }]

    expect(combatReducer(initial, move('finisher'))).toBe(initial)
  })
})

function woundedState(openWounds: number, pluggingWounds = false): CombatState {
  const initial = state()
  return {
    ...initial,
    opponent: {
      ...initial.opponent,
      position: [3, 0],
      openWounds,
      pluggingWounds,
    },
  }
}
