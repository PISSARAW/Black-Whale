import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import { advanceFightWitnesses, registerFightWitness } from './fightWitnesses'

describe('witness-driven security alerts', () => {
  it('records visible aggression and weighs concordant credible witnesses', () => {
    let state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
    state = registerFightWitness(state, {
      id: 'guard-a',
      allegiance: 'opponent',
      perception: 'sight',
      credibility: 0.8,
      fear: 0,
      memories: [],
    })
    state = registerFightWitness(state, {
      id: 'guard-b',
      allegiance: 'neutral',
      perception: 'sight',
      credibility: 0.8,
      fear: 0,
      memories: [],
    })
    state = performMove({ state, side: 'player', action: 'light' })
    state.player.attack = { ...state.player.attack!, frame: 1 }
    const observed = advanceFightWitnesses(state)
    expect(observed.securityAlert).toMatchObject({
      level: 2,
      lastActor: 'player',
      witnesses: ['guard-a', 'guard-b'],
    })
    expect(observed.fightWitnesses?.every(({ memories }) => memories.length === 1)).toBe(true)
    expect(observed.fightWitnesses?.map(({ fear }) => fear)).toEqual([5, 5])
  })

  it('requires Gyo perception for concealed Nen and never double-counts a frame', () => {
    let state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
    for (const perception of ['sight', 'gyo'] as const)
      state = registerFightWitness(state, {
        id: perception,
        allegiance: 'opponent',
        perception,
        credibility: 1,
        fear: 0,
        memories: [],
      })
    state = performMove({ state, side: 'player', action: 'light' })
    state.player.attack = {
      ...state.player.attack!,
      frame: 1,
      auraCharged: true,
      concealed: true,
      hatsuSource: 'hisoka',
    }
    const observed = advanceFightWitnesses(state)
    expect(observed.securityAlert?.witnesses).toEqual(['gyo'])
    expect(advanceFightWitnesses(observed)).toBe(observed)
  })
})
