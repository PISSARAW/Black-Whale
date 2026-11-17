import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { triggerHatsu } from './hatsu'
import {
  completeSkillHunter,
  hunterInterviewReady,
  performHunterInterview,
  SKILL_HUNTER_WINDOW,
} from './skillHunterAcquisition'
import { chainAbilitySealed } from './kurapika'
import { forceZetsu } from './nen'
import { hatsuFor } from './hatsu'
import type { FightState } from './types'

function duel(): FightState {
  const s = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
  return {
    ...s,
    player: { ...s.player, x: 45, aura: 100 },
    opponent: { ...s.opponent, x: 50, aura: 100 },
  }
}
function answered(state = duel()): FightState {
  state = triggerHatsu(state, 'opponent', 'hisoka')
  state = performHunterInterview(state, 'player', { action: 'hunter-ask' })
  return performHunterInterview(state, 'opponent', { action: 'hunter-answer' })
}

describe('Skill Hunter executes all four canonical acquisition conditions', () => {
  it('cannot steal from observation and an ordinary contact alone', () => {
    const s = triggerHatsu(duel(), 'opponent', 'hisoka')
    expect(completeSkillHunter(s, 'player')).toBe(s)
    expect(
      hatsuFor('chrollo').onImpact({
        state: s,
        side: 'player',
        defenderSide: 'opponent',
        source: 'chrollo',
        moveId: 'chrollo:forwardSpecial',
        blocked: false,
        concealed: false,
      }),
    ).toBe(s)
  })
  it('requires an actual answer, then a palm-to-cover contact within reach', () => {
    let s = triggerHatsu(duel(), 'opponent', 'hisoka')
    s = performHunterInterview(s, 'player', { action: 'hunter-ask' })
    expect(hunterInterviewReady(s, 'player')).toBe(false)
    s = performHunterInterview(s, 'opponent', { action: 'hunter-answer' })
    expect(hunterInterviewReady(s, 'player')).toBe(true)
    const remote = { ...s, opponent: { ...s.opponent, x: 70 } }
    expect(completeSkillHunter(remote, 'player')).toBe(remote)
    const stolen = performHunterInterview(s, 'opponent', { action: 'hunter-palm' })
    expect(stolen.player.chrolloBook?.pages).toContain('hisoka:neutralSpecial')
    expect(stolen.opponent.skillHunterStolen).toEqual([
      { owner: 'player', moveId: 'hisoka:neutralSpecial' },
    ])
    expect(chainAbilitySealed(stolen.opponent, 'hisoka:neutralSpecial')).toBe(true)
    expect(chainAbilitySealed(stolen.opponent, 'hisoka:forwardSpecial')).toBe(true)
    expect(chainAbilitySealed(stolen.opponent, 'hisoka:downSpecial')).toBe(false)
    expect(stolen.opponent.hatsuEffects.hatsuStolen).toBe(0)
  })
  it('expires the hour from the earliest required event, not from the last button press', () => {
    const s = answered()
    expect(
      completeSkillHunter({ ...s, frame: SKILL_HUNTER_WINDOW + 1 }, 'player').player.chrolloBook
        ?.pages,
    ).not.toContain('hisoka:neutralSpecial')
  })
  it('does not fabricate speech through a missing voice or hearing', () => {
    const s = triggerHatsu(duel(), 'opponent', 'hisoka')
    s.opponent.coveringEars = true
    expect(performHunterInterview(s, 'player', { action: 'hunter-ask' })).toBe(s)
    s.opponent.coveringEars = false
    const asked = performHunterInterview(s, 'player', { action: 'hunter-ask' })
    asked.opponent.hatsuEffects.senseSeals = 4
    expect(performHunterInterview(asked, 'opponent', { action: 'hunter-answer' })).toBe(asked)
  })
  it('does not acquire an unknown personal Hatsu and cannot steal with a sealed book', () => {
    const s = answered()
    const sealed = { ...s, player: forceZetsu(s.player) }
    expect(completeSkillHunter(sealed, 'player')).toBe(sealed)
    const unknown = { ...s, opponent: { ...s.opponent, id: 'theta' as const } }
    expect(completeSkillHunter(unknown, 'player')).toBe(unknown)
  })
  it('executes the acquired technique through its real native handler', () => {
    const s = completeSkillHunter(answered(), 'player')
    const used = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'special',
      moveId: 'chrollo:neutralSpecial',
      auraCharged: false,
    })
    expect(used.player.id).toBe('chrollo')
    expect(used.player.attack?.moveId).toBe('hisoka:neutralSpecial')
    expect(used.player.attack?.copiedPage).toBe('hisoka:neutralSpecial')
    expect(used.player.aura).toBeLessThan(100)
  })
})
