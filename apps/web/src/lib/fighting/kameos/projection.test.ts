import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack } from '../engine'
import { resolveMeleePair } from '../combatImpact'
import { updateControlledFighter } from '../duelStep/actors'
import { EMPTY_INPUT } from '../types'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import { resolveAllKameoContacts } from './contacts'
import { mergeDuel, projectDuel } from './projection'
import { withKameos } from './state'
import type { KameoSlot } from './types'

const slotOf = (state: FightState, side: FightSide = 'player') => state.kameos?.[side] as KameoSlot

/** Leader Kurapika far left, kameo Morena on stage next to Hisoka. */
function stage(kameo: Partial<ArcadeFighter> = {}, opponent: Partial<ArcadeFighter> = {}) {
  const base = beginFight(withKameos(createFight('kurapika', 'hisoka'), { player: 'morena' }))
  const slot = slotOf(base)
  return {
    ...base,
    player: { ...base.player, x: 8 },
    opponent: { ...base.opponent, x: 52, ...opponent },
    kameos: { player: { ...slot, phase: 'acting', fighter: { ...slot.fighter, x: 46, ...kameo } } },
  } satisfies FightState
}

function kameoHeavy(state: FightState): FightState {
  const projection = projectDuel(state, 'player', slotOf(state))
  return mergeDuel(state, projection, performAttack(projection.view, 'player', 'heavy'))
}

/** Advances attack frames of the kameo and the opposing leader, then resolves contacts. */
function frames(state: FightState, count: number, main = false): FightState {
  for (let frame = 0; frame < count && state.impact === null; frame++) {
    const slot = slotOf(state)
    state = {
      ...state,
      opponent: updateControlledFighter(state.opponent, EMPTY_INPUT),
      kameos: { player: { ...slot, fighter: updateControlledFighter(slot.fighter, EMPTY_INPUT) } },
    }
    if (main) state = resolveMeleePair(state)
    state = resolveAllKameoContacts(state)
  }
  return state
}

describe('kameo duel projection (lot 3)', () => {
  it('round-trips without change when nothing happens in the view', () => {
    const state = stage()
    const projection = projectDuel(state, 'player', slotOf(state))
    expect(projection.view.player).toBe(slotOf(state).fighter)
    expect(projection.view.kameos).toBeUndefined()
    expect(mergeDuel(state, projection, projection.view)).toEqual(state)
  })

  it('does nothing for a kameo in reserve or an ordinary duel', () => {
    const reserve = { ...stage(), kameos: { player: { ...slotOf(stage()), phase: 'reserve' } } }
    expect(resolveAllKameoContacts(reserve as FightState)).toBe(reserve)
    const duel = beginFight(createFight('kurapika', 'hisoka'))
    expect(resolveAllKameoContacts(duel)).toBe(duel)
  })

  it('lets the kameo strike the opposing leader with its own body', () => {
    const armed = kameoHeavy(stage())
    expect(slotOf(armed).fighter.attack?.kind).toBe('heavy')
    expect(armed.player.attack).toBeNull()
    const struck = frames(armed, 40)
    expect(struck.impact?.attacker).toBe('player')
    expect(struck.opponent.health).toBeLessThan(struck.opponent.maxHealth)
    expect(struck.player).toBe(armed.player)
    expect(slotOf(struck).fighter.attack?.impacted).toBe(true)
    expect(struck.winner).toBeNull()
  })

  it('keeps the opposing leader passive: no clock of its own moves in the projection', () => {
    const armed = kameoHeavy(stage({}, { guardFrames: 5, aura: 40 }))
    const zetsu = { ...armed.opponent.hatsuEffects, forcedZetsuFrames: 30, contagionFrames: 12 }
    const target = { ...armed, opponent: { ...armed.opponent, hatsuEffects: zetsu } }
    expect(resolveAllKameoContacts(target)).toBe(target)
    let state = target
    while (state.impact === null) {
      const slot = slotOf(state)
      const kameo = updateControlledFighter(slot.fighter, EMPTY_INPUT)
      const before = { ...state, kameos: { player: { ...slot, fighter: kameo } } }
      state = resolveAllKameoContacts(before)
      if (state.impact === null) expect(state).toBe(before)
    }
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBe(30)
    expect(state.opponent.hatsuEffects.contagionFrames).toBe(12)
    expect(state.opponent.aura).toBe(40)
  })

  it('lets the opposing leader strike an on-stage kameo, not its absent leader', () => {
    const state = performAttack(stage({ x: 46 }, { x: 52 }), 'opponent', 'heavy')
    const struck = frames(state, 40)
    expect(struck.impact?.attacker).toBe('opponent')
    expect(slotOf(struck).fighter.health).toBeLessThan(slotOf(struck).fighter.maxHealth)
    expect(struck.player.health).toBe(struck.player.maxHealth)
  })

  it('eliminates a killed kameo without deciding the round or recording a camp death', () => {
    const state = performAttack(stage({ health: 1 }), 'opponent', 'heavy')
    const struck = frames(state, 40)
    expect(slotOf(struck).phase).toBe('eliminated')
    expect(struck.phase).toBe('fighting')
    expect(struck.winner).toBeNull()
    expect(struck.deaths).toBeUndefined()
    expect(resolveAllKameoContacts(struck)).toBe(struck)
  })

  it('never spends again, after the main pair, a strike its leader already took', () => {
    const both = performAttack(stage({ x: 47 }, { x: 52 }), 'opponent', 'heavy')
    const crowded = { ...both, player: { ...both.player, x: 46 } }
    const struck = frames(crowded, 40, true)
    expect(struck.player.health).toBeLessThan(struck.player.maxHealth)
    expect(slotOf(struck).fighter.health).toBe(slotOf(struck).fighter.maxHealth)
  })
})
