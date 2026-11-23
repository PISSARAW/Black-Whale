import { describe, expect, it } from 'vitest'
import type { FighterId } from '../fighting/types'
import { combatReducer } from './reducer'
import { fightingHatsuRoute } from './fightingHatsu'
import { initialCombatState, type CombatState } from './types'

const STEP = 1 / 60
const setup = {
  playerAt: [0, 0] as const,
  opponentAt: [1.5, 0] as const,
  terrain: initialCombatState().terrain,
}

function cast(state: CombatState, fighterId: FighterId): CombatState {
  return combatReducer(state, {
    type: 'FIGHTING_MOVE',
    side: 'player',
    fighterId,
    slot: 'neutralSpecial',
    targetAt: state.opponent.position,
  })
}

function recover(state: CombatState): CombatState {
  return combatReducer(state, { type: 'TICK', dt: Math.max(STEP, state.player.cooldown) })
}

describe('per-fighter Arena Hatsu routes', () => {
  it('routes only authored specials with an exact named Arena system', () => {
    expect(fightingHatsuRoute('kurapika', 'neutralSpecial')?.hatsuId).toBe('chain-jail')
    expect(fightingHatsuRoute('hisoka', 'neutralSpecial')?.hatsuId).toBe('bungee-gum')
    expect(fightingHatsuRoute('shizuku', 'neutralSpecial')).toBeNull()
    expect(fightingHatsuRoute('kurapika', 'standingLight')).toBeNull()
  })

  it('executes each routed fighter identity instead of a generic special hit', () => {
    const base = initialCombatState(setup)
    const kurapika = cast(base, 'kurapika')
    const hisoka = cast(base, 'hisoka')
    const franklin = cast(base, 'franklin')
    const machi = cast(base, 'machi')
    const illumi = cast(base, 'illumi')
    const hinrigh = cast(base, 'hinrigh')

    expect(kurapika.opponent).toMatchObject({ mode: 'zetsu', bound: 3.5 })
    expect(hisoka.tethers[0]).toMatchObject({ owner: 'player', subject: 'opponent' })
    expect(franklin.lastEvent).toMatchObject({ attacker: 'player', technique: 'hatsu' })
    expect(machi.opponent.bound).toBe(2.2)
    expect(illumi.opponent.bound).toBe(4)
    expect(hinrigh.nenEffects[0]).toMatchObject({ sourceHatsuId: 'biohazard-hinrigh' })
  })

  it('counts Cyclotron rotations and releases only on the third command', () => {
    let state = cast(initialCombatState(setup), 'phinks')
    expect(state.player.hatsuSequence).toMatchObject({ id: 'ripper-cyclotron', count: 1 })
    expect(state.lastEvent).toBeNull()

    state = cast(recover(state), 'phinks')
    expect(state.player.hatsuSequence?.count).toBe(2)
    state = cast(recover(state), 'phinks')
    expect(state.player.hatsuSequence).toBeNull()
    expect(state.lastEvent).toMatchObject({ attacker: 'player', technique: 'hatsu' })
  })

  it('keeps a routed special buffered through hitstop', () => {
    const frozen = { ...initialCombatState(setup), hitstop: 2 * STEP }
    const buffered = cast(frozen, 'machi')
    const resumed = combatReducer(buffered, { type: 'TICK', dt: 2 * STEP })

    expect(buffered.player.buffered?.slot).toBe('neutralSpecial')
    expect(resumed.player.buffered).toBeNull()
    expect(resumed.opponent.bound).toBe(2.2)
  })
})
