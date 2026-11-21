import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { FIXED_STEP } from './frameData'
import { lsdfHint } from './lsdfPresentation'
import { qualifyLsdfInfraction } from './lsdfInfraction'
import { EMPTY_INPUT, type FightState } from './types'

/** Yokotani (P1) in the occupied Heil-Ly hideout, Hisoka an unlawful intruder. */
function scenario(): FightState {
  const state = beginFight(
    createFight('yokotani', 'hisoka', {
      formatId: 'knockout',
      mode: 'versus-local',
      environment: {
        stageId: 'heilly-hideout',
        morenaPresent: true,
        unlawfulIntruders: { player: false, opponent: true },
      },
    }),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100 },
    opponent: { ...state.opponent, aura: 100 },
  }
}

const armed = (state: FightState): FightState => ({
  ...state,
  opponent: { ...state.opponent, equipment: ['needles', 'tracker-receiver'] },
})

const wounded = (state: FightState): FightState => ({
  ...state,
  player: { ...state.player, health: state.player.maxHealth - 30 },
})

const summon = (state: FightState) => performMove({ state, side: 'player', action: 'special' })

function untilExpelled(state: FightState): number {
  for (let frame = 1; frame <= 600; frame++) {
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
    if (state.finishReason === 'expulsion') return frame
  }
  return Infinity
}

describe('LSDF · Yokotani qualifies the infraction he answers', () => {
  it.each([
    ['trespass', (s: FightState) => s, 1],
    ['armed-trespass', armed, 2],
    ['assault', (s: FightState) => wounded(armed(s)), 3],
  ] as const)('%s opens intervention level %i', (infraction, setup, level) => {
    const state = setup(scenario())
    expect(qualifyLsdfInfraction(state, 'player')).toBe(infraction)
    const guard = summon(state).lsdf?.player
    expect(guard?.infraction).toBe(infraction)
    expect(guard?.level).toBe(level)
  })

  it('introduces himself and names the actual charge to the intruder', () => {
    const state = armed(scenario())
    const near = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52 },
    }
    const heard = summon(near).opponent.heardWords?.text
    expect(heard).toMatch(/^Je suis Yokotani\./)
    expect(heard).toContain('intrusion armée')
  })

  it('has no infraction to qualify against a lawful visitor, even after being struck', () => {
    const state = wounded(scenario())
    state.environment.unlawfulIntruders.opponent = false
    expect(qualifyLsdfInfraction(state, 'player')).toBeNull()
    expect(summon(state)).toBe(state)
  })

  it('confiscates portable weapons only, and never wounds the intruder', () => {
    const state = summon(armed(scenario()))
    let next = state
    for (let n = 0; n < 140 && next.lsdf?.player?.phase !== 'escorting'; n++)
      next = tickFight(next, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
    expect(next.opponent.equipment).toEqual(['tracker-receiver'])
    expect(next.opponent.weaponsConfiscated).toBe(true)
    expect(next.opponent.health).toBe(next.opponent.maxHealth)
  })

  it('carries out a graver infraction faster, without any damage', () => {
    const light = untilExpelled(summon(scenario()))
    const grave = untilExpelled(summon(wounded(scenario())))
    expect(grave).toBeLessThan(light)
  })

  it('shows the qualified charge with the intervention level', () => {
    const state = summon(armed(scenario()))
    expect(lsdfHint(state, 'player', 'fr')).toContain('niveau 2 · intrusion armée')
    expect(lsdfHint(state, 'player', 'en')).toContain('level 2 · armed trespass')
  })
})
