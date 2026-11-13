import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/reducer'
import {
  applyArenaHandoff,
  arenaReturnHref,
  consumeArenaHandoffResult,
  saveArenaHandoffResult,
  type ArenaHandoff,
} from './bridge'

describe('Arena cross-mode handoff', () => {
  it('carries prior aura, injuries, knowledge and narrative context into combat', () => {
    const handoff: ArenaHandoff = {
      version: 1,
      id: 'infiltration-encounter',
      sourceMode: 'INFILTRATION',
      context: 'NARRATIVE',
      playerAura: 42,
      opponentAura: 75,
      playerCondition: 'staggered',
      opponentCondition: 'ready',
      knownOpponentHatsuIds: ['secret-window'],
      nenEffects: [],
    }
    const state = applyArenaHandoff(initialCombatState(), handoff)
    expect(state.player).toMatchObject({ aura: 42, condition: 'staggered' })
    expect(state.opponentMemory.hypothesis.knownHatsuIds).toEqual(['secret-window'])
    expect(state.environment.context).toBe('NARRATIVE')
  })

  it('exports consequences for the source mode', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    }
    const state = { ...initialCombatState(), outcome: 'won' as const }
    expect(saveArenaHandoffResult(storage, 'hunt-duel', state)).toMatchObject({
      handoffId: 'hunt-duel',
      outcome: 'won',
      elapsedSeconds: 0,
    })
    expect(consumeArenaHandoffResult(storage)).toMatchObject({ handoffId: 'hunt-duel' })
    expect(consumeArenaHandoffResult(storage)).toBeNull()
  })

  it('only exposes internal return routes', () => {
    const handoff = (returnHref: string): ArenaHandoff => ({
      version: 1,
      id: 'hunt-duel',
      sourceMode: 'HUNT',
      context: 'CLANDESTINE',
      playerAura: 50,
      opponentAura: 50,
      playerCondition: 'ready',
      opponentCondition: 'ready',
      knownOpponentHatsuIds: [],
      nenEffects: [],
      returnHref,
    })
    expect(arenaReturnHref(handoff('/fr/hunt'))).toBe('/fr/hunt')
    expect(arenaReturnHref(handoff('//outside.example'))).toBeNull()
    expect(arenaReturnHref(handoff('https://outside.example'))).toBeNull()
  })
})
