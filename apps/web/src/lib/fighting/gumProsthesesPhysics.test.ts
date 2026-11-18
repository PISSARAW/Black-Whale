import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { retrospectiveAiAction } from './retrospectiveAi'
import { createTeamFight } from './teamMatch'
import { teamRelayBlock } from './teamRelayRules'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(side: FightSide): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'hisoka' : 'theta', side === 'opponent' ? 'hisoka' : 'theta', {
      mode: 'versus-local',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { [side]: 'hand-and-lower-leg' },
        },
      },
    }),
  )
  return { ...state, [side]: { ...state[side], health: 37, aura: 100 } }
}
function command(state: FightState, side: FightSide, command: ArsenalCommand) {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
function frames(state: FightState, count: number) {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function walk(state: FightState, side: FightSide): FightState {
  const direction = { ...EMPTY_INPUT, right: side === 'player', left: side === 'opponent' }
  for (let frame = 0; frame < 12; frame++)
    state = tickFight(state, side === 'player' ? direction : EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: side === 'opponent' ? direction : EMPTY_INPUT,
    })
  return state
}

describe('prostheses restore usable physical support without permanent regeneration', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`uses the existing elastic foot for actual finite travel instead of a teleport for ${side}`, () => {
      const formed = frames(command(ready(side), side, { action: 'gum-prosthesis' }), 30)
      const started = command(formed, side, { action: 'gum-spring-step' })
      expect(started[side].x).toBe(formed[side].x)
      expect(started[side].motion?.dash?.direction).toBe(formed[side].facing)
      expect(command(started, side, { action: 'gum-spring-step' })).toBe(started)
      const moved = frames(started, 10)
      expect((moved[side].x - started[side].x) * formed[side].facing).toBeGreaterThan(0)
      expect(moved[side].wakeupInvulnerableFrames).toBe(0)
      expect(moved[side].health).toBe(37)
      expect(
        command({ ...formed, [side]: { ...formed[side], y: 5 } }, side, {
          action: 'gum-spring-step',
        })[side].motion?.dash,
      ).toBeFalsy()
    })
    it(`restores the actual grounded movement path for ${side}`, () => {
      const initial = ready(side)
      const formed = frames(command(initial, side, { action: 'gum-prosthesis' }), 30)
      const injured = walk(initial, side)
      const supported = walk(formed, side)
      expect(Math.abs(supported[side].x - formed[side].x)).toBeCloseTo(
        Math.abs(injured[side].x - initial[side].x) * 2,
      )
      expect(supported[side].health).toBe(37)
      expect(supported[side].wakeupInvulnerableFrames).toBe(0)
    })
    it(`does not regrow the physical parts when the format starts another round for ${side}`, () => {
      const formed = command(ready(side), side, { action: 'gum-prosthesis' })
      const next = nextRound({ ...formed, phase: 'finished', matchWinner: null })
      expect(next.roundNumber).toBe(2)
      expect(next[side].bodyDamage).toEqual(formed[side].bodyDamage)
      expect(next[side].gumProstheses?.id).toBe(formed[side].gumProstheses?.id)
      expect(next[side].gumProsthesisGeneration).toBe(1)
    })
  }
  it('lets the AI form the needed replacements, select their actual surface and execute the disguise', () => {
    let state = retrospectiveAiAction(ready('opponent'), performAuraAttack)!
    expect(state.opponent.gumProstheses?.parts).toEqual(['left-hand', 'right-lower-leg'])
    state = frames(state, 30)
    state = retrospectiveAiAction(state, performAuraAttack)!
    expect(state.opponent.textureTarget).toBe('gum-prostheses')
    state = retrospectiveAiAction(state, performAuraAttack)!
    expect(state.opponent.attack?.moveId).toBe('hisoka:downSpecial')
    state = frames(state, 45)
    expect(state.opponent.textureSurprise?.surface).toBe('gum-prostheses')
    expect(state.opponent.health).toBe(37)
    const stepped = retrospectiveAiAction(state, performAuraAttack)!
    expect(stepped.opponent.motion?.dash?.direction).toBe(state.opponent.facing)
  })
  it('keeps physical injury on the active team body and forbids suspending its active Nen in reserve', () => {
    const initial = beginFight(
      createTeamFight(
        {
          player: ['hisoka', 'theta', 'biscuit'],
          opponent: ['theta', 'kurapika', 'benjamin'],
        },
        {
          preparation: {
            mode: 'scenario',
            resources: [],
            cohorts: [],
            injuries: { player: 'hand-and-lower-leg' },
          },
        },
      ),
    )
    expect(initial.player.bodyDamage?.parts).toHaveLength(2)
    expect(initial.teamMatch!.seats.player.members[1].bodyDamage).toBeUndefined()
    const formed = frames(command(initial, 'player', { action: 'gum-prosthesis' }), 30)
    expect(teamRelayBlock(formed, 'player')).toBe('commitment')
    const removed = command(formed, 'player', { action: 'gum-prosthesis-release' })
    expect(teamRelayBlock(removed, 'player')).toBeNull()
    expect(removed.player.bodyDamage).toEqual(initial.player.bodyDamage)
  })
})
