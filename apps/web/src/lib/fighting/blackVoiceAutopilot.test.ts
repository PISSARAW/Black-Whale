import { privatePvpState } from './pvp/view'
import { speakPaperWords } from './kallutoListening'
import { blackVoiceAi } from './blackVoiceAi'
import { recordFightDeath } from './fightDeaths'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { reconcileBlackVoice } from './blackVoice'
import { AUTOPILOT_COST, AUTOPILOT_RECOVERY, advanceVoiceRecovery } from './blackVoiceAutopilot'
import { resolveFightOutcome } from './fightOutcome'
import { hatsuDamageFactor } from './hatsu'
import { forceZetsu } from './nen'
import { resolvedDamage } from './combatDamage'
import { rememberOpponentHabits } from './opponentHabits'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

function ready(enemy: FighterId = 'hisoka'): FightState {
  const state = beginFight(
    createFight('chrollo', enemy, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: {
      ...state.player,
      x: 44,
      aura: 100,
      chrolloBook: { ...state.player.chrolloBook!, page: 1 },
    },
    opponent: { ...state.opponent, x: 49 },
  }
}
function armed(state = ready()): FightState {
  state = performArsenalCommand(state, 'player', { action: 'voice-arm' })
  state = performArsenalCommand(state, 'player', { action: 'voice-self-implant' })
  return performArsenalCommand(state, 'player', { action: 'voice-phone' })
}
function running(state = armed()): FightState {
  return performArsenalCommand(state, 'player', { action: 'voice-autopilot' })
}
function frames(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Black Voice self-manipulation and its physical consequences', () => {
  it('implants one original antenna in the actual self and activates through its paired phone', () => {
    const prepared = armed(),
      state = running(prepared)
    expect(prepared.player.blackVoiceControl).toMatchObject({ active: false, owner: 'player' })
    expect(state.player.blackVoiceAutopilot).toMatchObject({ target: 'opponent', targetMember: 0 })
    expect(state.player.blackVoiceControl).toMatchObject({ active: true, order: 'attack' })
    expect(state.player.blackVoiceGear?.antennas).toHaveLength(1)
    expect(state.player.aura).toBe(prepared.player.aura - AUTOPILOT_COST)
    expect(hatsuDamageFactor(state.player)).toBeGreaterThan(hatsuDamageFactor(prepared.player))
  })
  it('has no activation without its implanted pin, associated phone, active Nen or visible enemy', () => {
    const bare = ready()
    expect(running(bare)).toBe(bare)
    const prepared = armed()
    for (const state of [
      { ...prepared, player: forceZetsu(prepared.player) },
      { ...prepared, player: { ...prepared.player, aura: 0 } },
      { ...prepared, player: { ...prepared.player, facing: -1 as const } },
      performArsenalCommand(prepared, 'player', { action: 'voice-pocket' }),
    ])
      expect(running(state)).toBe(state)
  })
  it('cannot be canceled through the phone, page handling or ordinary player attacks', () => {
    const active = running()
    const state = { ...active, player: { ...active.player, gumWoundSeals: 1 } }
    expect(performArsenalCommand(state, 'player', { action: 'gum-unseal' })).toBe(state)
    for (const action of ['voice-pocket', 'voice-remove', 'voice-stay'] as const)
      expect(performArsenalCommand(state, 'player', { action, target: 'player' })).toBe(state)
    expect(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'chrollo:backSpecial',
        auraCharged: false,
      }),
    ).toBe(state)
    const changed = frames(state, 55)
    expect(changed.player.blackVoiceAutopilot).toBeDefined()
    expect(changed.opponent.health).toBeLessThan(state.opponent.health)
    expect(changed.opponent.hatsuEffects.sunMark).toBe(0)
    expect(changed.opponent.blackVoiceControl).toBeUndefined()
    expect(changed.player.aura).toBeLessThan(state.player.aura)
  })
  it('ends on bodily defeat of the declared opponent and preserves days of weakness across rounds', () => {
    const state = running()
    const ended = resolveFightOutcome({ ...state, opponent: { ...state.opponent, health: 0 } })
    expect(ended.player.blackVoiceAutopilot).toBeUndefined()
    expect(ended.player.blackVoiceControl).toMatchObject({ active: false })
    expect(ended.player.blackVoiceAftermath).toEqual({
      remainingFrames: AUTOPILOT_RECOVERY,
      memory: 'none',
    })
    expect(AUTOPILOT_RECOVERY).toBeGreaterThanOrEqual(2 * 24 * 60 * 60 * 60)
    expect(nextRound(ended).player.blackVoiceAftermath).toEqual(ended.player.blackVoiceAftermath)
    const reopened = {
      ...ended,
      phase: 'fighting' as const,
      opponent: { ...ended.opponent, health: 100 },
    }
    expect(running(reopened)).toBe(reopened)
  })
  it('keeps its physical consequences when Nen is forcibly interrupted or another body removes the pin', () => {
    const state = running()
    const sealed = reconcileBlackVoice({ ...state, player: forceZetsu(state.player) })
    expect(sealed.player.blackVoiceAutopilot).toBeUndefined()
    expect(sealed.player.blackVoiceAftermath?.remainingFrames).toBe(AUTOPILOT_RECOVERY)
    const near = { ...state, opponent: { ...state.opponent, x: 46 } }
    const removed = performArsenalCommand(near, 'opponent', {
      action: 'voice-remove',
      target: 'player',
    })
    expect(removed.player.blackVoiceControl).toBeUndefined()
    expect(removed.player.blackVoiceAutopilot).toBeUndefined()
    expect(removed.player.blackVoiceAftermath?.memory).toBe('none')
  })
  it('does not give the host conscious memories or transfer the output boost to ordinary bullets', () => {
    const state = running(),
      actor = state.player
    expect(rememberOpponentHabits(state, actor)).toBe(actor)
    const defence = {
      fighter: state.opponent,
      blocked: false,
      parried: false,
      avoided: false,
      invulnerable: false,
    }
    const options = {
      defence,
      base: 12,
      zone: 'torso' as const,
      kind: 'ranged' as const,
      damageScale: 1,
      openingMultiplier: 1,
      physicalProjectile: true,
    }
    expect(resolvedDamage({ ...options, attacker: actor })).toBe(
      resolvedDamage({ ...options, attacker: ready().player }),
    )
  })
  it('does not infer loss of a maintained mode from pages hidden in the opponent’s PvP view', () => {
    const active = running()
    const view = privatePvpState(active, 'opponent')
    expect(view.opponent.chrolloBook?.pagesPrivate).toBe(true)
    const maintained = reconcileBlackVoice(view)
    expect(maintained.opponent.blackVoiceAutopilot).toBeDefined()
    expect(maintained.opponent.blackVoiceAftermath).toBeUndefined()
  })
  it('does not store speech heard during an autonomous mission as a conscious memory', () => {
    const active = running()
    const before = { frame: -1, speaker: 'hisoka' as const, text: 'Avant la mission.' }
    const state = { ...active, player: { ...active.player, heardWords: before } }
    const spoken = speakPaperWords(state, 'opponent', {
      text: 'Pendant la mission.',
      recipient: 'player',
    })
    expect(spoken.player.heardWords).toEqual(before)
  })
  it('lets the AI prepare the original self pin and phone before committing to the mission', () => {
    let state = ready('chrollo')
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        aura: 100,
        health: 20,
        chrolloBook: { ...state.opponent.chrolloBook!, page: 1 },
      },
    }
    for (let step = 0; step < 4; step++) {
      const next = blackVoiceAi(state)
      expect(next).not.toBeNull()
      state = next!
    }
    expect(state.opponent.blackVoiceAutopilot).toMatchObject({ target: 'player' })
    expect(state.opponent.blackVoiceGear?.antennas).toHaveLength(1)
  })
  it('keeps an unfinished mission and its aura budget when the referee ends a round by time', () => {
    const state = running()
    const round = nextRound({
      ...state,
      phase: 'finished',
      winner: 'player',
      finishReason: 'time',
      matchWinner: null,
    })
    expect(round.player.blackVoiceAutopilot).toEqual(state.player.blackVoiceAutopilot)
    expect(round.player.blackVoiceControl?.active).toBe(true)
    expect(round.player.aura).toBe(state.player.aura)
    expect(round.player.chrolloBook).toEqual(state.player.chrolloBook)
  })
  it('counts physical recovery during a real Cat’s Name sequence', () => {
    const state = running(armed(ready('camilla')))
    const dead = recordFightDeath(
      { ...state, opponent: { ...state.opponent, health: 0 } },
      { victimSide: 'opponent', killerSide: 'player', cause: 'strike' },
    )
    const cat = resolveFightOutcome(dead)
    expect(cat.catsName).toBeDefined()
    expect(cat.player.blackVoiceAftermath?.remainingFrames).toBe(AUTOPILOT_RECOVERY)
    const elapsed = frames(cat, 20)
    expect(elapsed.player.blackVoiceAftermath?.remainingFrames).toBe(AUTOPILOT_RECOVERY - 20)
    expect(elapsed.remainingFrames).toBe(cat.remainingFrames)
  })
  it('advances recovery during actual hitstop and expires it without a permanent phantom condition', () => {
    const state = ready()
    const recovering = {
      ...state,
      hitstop: 5,
      player: {
        ...state.player,
        blackVoiceAftermath: { remainingFrames: 10, memory: 'none' as const },
      },
    }
    const advanced = frames(recovering, 3)
    expect(advanced.player.blackVoiceAftermath?.remainingFrames).toBe(7)
    const last = {
      ...state,
      player: {
        ...state.player,
        blackVoiceAftermath: { remainingFrames: 1, memory: 'none' as const },
      },
    }
    expect(advanceVoiceRecovery(last).player.blackVoiceAftermath).toBeUndefined()
  })
})
