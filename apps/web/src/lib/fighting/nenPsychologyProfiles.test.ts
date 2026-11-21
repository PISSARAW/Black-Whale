import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { advanceNenPsychology } from './nenPsychology'
import {
  NEN_PSYCHOLOGY_PROFILES,
  initialNenPsychology,
  nenPsychologyProfile,
} from './nenPsychologyProfiles'
import { psychologyObservationInput } from './opponentNenPlan'
import { FIGHTING_ROSTER } from './roster'
import type { FightImpact, FighterId } from './types'

function hit(): FightImpact {
  return {
    sequence: 1,
    attacker: 'player',
    kind: 'heavy',
    damage: 20,
    blocked: false,
    parried: false,
    critical: false,
    knockdown: false,
    counterHit: true,
    punish: false,
    antiAir: false,
    wallSplat: false,
    invulnerable: false,
    comboHits: 1,
    damageScale: 1,
    points: 0,
    zone: 'torso',
    concealed: false,
    avoided: false,
    projectileId: null,
    position: { x: 50, y: 1 },
  }
}

describe('personal aura psychology profiles', () => {
  it('covers every selectable fighter with an explicit qualitative basis', () => {
    expect(Object.keys(NEN_PSYCHOLOGY_PROFILES).sort()).toEqual(
      FIGHTING_ROSTER.map(({ id }) => id).sort(),
    )
    for (const { id } of FIGHTING_ROSTER) {
      const profile = nenPsychologyProfile(id)
      expect(profile.basis.length).toBeGreaterThan(10)
      expect(profile.composure).toBeGreaterThanOrEqual(5_000)
      expect(profile.resolve).toBeGreaterThanOrEqual(5_000)
    }
  })

  it('keeps limited evidence explicit and initializes each fighter from their own baseline', () => {
    expect(nenPsychologyProfile('beyond').evidence).toBe('limited-evidence')
    expect(nenPsychologyProfile('sayird').evidence).toBe('limited-evidence')
    expect(initialNenPsychology('chrollo').composure).toBeGreaterThan(
      initialNenPsychology('leorio').composure,
    )
    expect(initialNenPsychology('halkenburg').resolve).toBeGreaterThan(
      initialNenPsychology('shizuku').resolve,
    )
    const state = createFight('rihan', 'padaille')
    expect(state.player.nenPsychology).toEqual(initialNenPsychology('rihan'))
    expect(state.opponent.nenPsychology).toEqual(initialNenPsychology('padaille'))
  })

  it('uses personal impact sensitivity instead of one universal reaction', () => {
    const reaction = (id: FighterId) => {
      const before = beginFight(createFight('hisoka', id, { mode: 'versus-local' }))
      return advanceNenPsychology(before, { ...before, impact: hit() }).opponent.nenPsychology!
    }
    expect(reaction('illumi').apprehension).toBeLessThan(reaction('sayird').apprehension)
    expect(reaction('illumi').composure).toBeGreaterThan(reaction('sayird').composure)
  })

  it('lets analytical opponents inspect pressure while assertive ones keep pressing', () => {
    const pressured = (id: FighterId) => {
      const state = beginFight(createFight('hisoka', id, { mode: 'versus-local' }))
      state.player = {
        ...state.player,
        x: 22,
        nen: { ...state.player.nen, mode: 'ren' },
      }
      state.opponent = { ...state.opponent, x: 42, aura: 55 }
      return psychologyObservationInput(state, 20)
    }
    expect(pressured('rihan')).toEqual({ gyo: true })
    expect(pressured('phinks')).toBeNull()
  })
})
