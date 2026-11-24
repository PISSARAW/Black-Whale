import { describe, expect, it } from 'vitest'
import type { FighterId } from '../fighting/types'
import { combatReducer } from './reducer'
import { fightingHatsuRoute } from './fightingHatsu'
import { initialCombatState, type CombatAction, type CombatState } from './types'

const STEP = 1 / 60
const setup = {
  playerAt: [0, 0] as const,
  opponentAt: [1.5, 0] as const,
  terrain: initialCombatState().terrain,
}

function cast(
  state: CombatState,
  fighterId: FighterId,
  slot: Extract<CombatAction, { type: 'FIGHTING_MOVE' }>['slot'] = 'neutralSpecial',
): CombatState {
  return combatReducer(state, {
    type: 'FIGHTING_MOVE',
    side: 'player',
    fighterId,
    slot,
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
    expect(fightingHatsuRoute('bonolenov', 'finisher')?.hatsuId).toBe('battle-cantabile-jupiter')
    expect(fightingHatsuRoute('tserriednich', 'neutralSpecial')?.preparation).toBe(
      'parallel-future',
    )
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

  it('prepares Parallel Future in Zetsu, then diverges on the next special', () => {
    const base = initialCombatState(setup)
    const zetsu = { ...base, player: { ...base.player, mode: 'zetsu' as const } }
    const preparing = cast(zetsu, 'tserriednich')

    expect(preparing.player.hatsuPreparation).toMatchObject({
      id: 'parallel-future',
      observations: 1,
    })
    expect(cast(base, 'tserriednich')).toBe(base)

    const diverged = cast(recover(preparing), 'tserriednich')
    expect(diverged.player.hatsuPreparation).toBeNull()
    expect(diverged.player.position).not.toEqual(base.player.position)
    expect(diverged.lastHatsuBySide.player).toBe('parallel-future')
  })

  it('keeps Parallel Future preparation buffered through impact freeze', () => {
    const base = initialCombatState(setup)
    const frozen = {
      ...base,
      hitstop: 2 * STEP,
      player: { ...base.player, mode: 'zetsu' as const },
    }
    const buffered = cast(frozen, 'tserriednich')
    const resumed = combatReducer(buffered, { type: 'TICK', dt: 2 * STEP })

    expect(buffered.player.buffered?.slot).toBe('neutralSpecial')
    expect(resumed.player.buffered).toBeNull()
    expect(resumed.player.hatsuPreparation?.id).toBe('parallel-future')
  })

  it('releases Jupiter only after its three-beat sequence', () => {
    let state = cast(initialCombatState(setup), 'bonolenov', 'finisher')
    expect(state.player.hatsuSequence).toMatchObject({
      id: 'battle-cantabile-jupiter',
      count: 1,
    })

    state = cast(recover(state), 'bonolenov', 'finisher')
    expect(state.player.hatsuSequence?.count).toBe(2)
    state = cast(recover(state), 'bonolenov', 'finisher')
    expect(state.player.hatsuSequence).toBeNull()
    expect(state.lastEvent).toMatchObject({ attacker: 'player', technique: 'hatsu' })
    expect(state.player.aura).toBe(82)
  })
})
