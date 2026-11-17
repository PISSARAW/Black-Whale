import { COHORT_WILL_FRAMES } from './preparationTuning'
import { MELODY_LISTEN_FRAMES } from './melodyTuning'
import { commandMary } from './bloodyMaryAction'
import { performAuraAttack, performMove, tickFight } from './engine'
import { CYCLOTRON_ROTATION_FRAMES } from './phinksCyclotron'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'

export type CombatRouteSetup =
  | 'bungee'
  | 'cyclotron'
  | 'tracking'
  | 'true-form'
  | 'disguise'
  | 'paper'
  | 'prologue'
  | 'pigeon'
  | 'warning'
  | 'question'
  | 'scouts'
  | 'owl'
  | 'console'
  | 'poem'
  | 'offer'
  | 'growth'
  | 'courier'
  | 'little-eye'
  | 'anchor'
  | 'observation'
  | 'listening'
  | 'doors'
  | 'cohort-ready'

/** Exercise prerequisites use real commands, time and costs, then let both bodies recover. */
export function prepareCombatRoute(state: FightState, setup?: CombatRouteSetup): FightState {
  if (!setup) return state
  if (setup === 'scouts')
    state = commandMary({ state, side: 'player', command: 'bleed' }, performAuraAttack)
  const input = setupInput(state, setup)
  if (!['listening', 'cohort-ready'].includes(setup))
    state = performMove({ state, side: 'player', action: 'special', input })
  if (setup === 'cyclotron') {
    for (let i = 0; i < CYCLOTRON_ROTATION_FRAMES; i++) state = step(state)
    state = performMove({ state, side: 'player', action: 'special' })
  }
  for (let i = 0; i < setupFrames(setup) && !setupReady(state, setup); i++) state = step(state)
  return {
    ...state,
    impact: null,
    player: { ...state.player, x: 44 },
    opponent: {
      ...state.opponent,
      x: 50,
      ...(state.opponent.biohazardRestraint
        ? { biohazardRestraint: { ...state.opponent.biohazardRestraint, x: 50 } }
        : {}),
    },
  }
}

function step(state: FightState) {
  return tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
}

function setupInput(state: FightState, setup: CombatRouteSetup) {
  if (setup === 'scouts') return { ...EMPTY_INPUT, down: true }
  if (setup === 'tracking')
    return { ...EMPTY_INPUT, right: state.player.facing === 1, left: state.player.facing === -1 }
  if (setup === 'disguise')
    return { ...EMPTY_INPUT, left: state.player.facing === 1, right: state.player.facing === -1 }
  return EMPTY_INPUT
}

function settled(state: FightState) {
  return (
    !state.hitstop &&
    [state.player, state.opponent].every(
      (fighter) =>
        !fighter.attack &&
        !fighter.hitStun &&
        !fighter.knockdownFrames &&
        !preparing(fighter) &&
        !fighter.wakeupInvulnerableFrames,
    )
  )
}

function setupReady(state: FightState, setup: CombatRouteSetup) {
  if (setup === 'pigeon' && !state.opponent.biohazardRestraint) return false
  if (setup === 'listening' && (state.player.melodyHearing?.frames ?? 0) < MELODY_LISTEN_FRAMES)
    return false
  if (setup === 'cohort-ready' && state.player.hatsuEffects.cohortWillFrames < COHORT_WILL_FRAMES)
    return false
  return settled(state)
}

function preparing(fighter: ArcadeFighter) {
  return Boolean(
    fighter.illumi?.preparation ||
    fighter.battleCantabile?.preparation ||
    fighter.crossGameCardFrames ||
    fighter.bashoPoem?.writingFrames ||
    fighter.preparationRecovery,
  )
}

function setupFrames(setup: CombatRouteSetup) {
  return setup === 'cohort-ready' ? COHORT_WILL_FRAMES + 1 : 180
}
