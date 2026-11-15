import type { CombatAction, CombatState } from './types'

export function reactEnvironment(state: CombatState, action: CombatAction): CombatState {
  if (state.environment.context === 'REGULATED') return state
  const noise =
    state.environment.noise +
    (action.type === 'HATSU' ? 3 : action.type === 'STRIKE' || action.type === 'KO' ? 1 : 0)
  if (noise === state.environment.noise) return state
  const witnesses = state.environment.witnesses + Number(noise >= 3)
  const securityAlert = Math.min(5, state.environment.securityAlert + Number(noise >= 4))
  const interventionIn =
    state.environment.interventionIn ?? (securityAlert >= 2 || witnesses >= 3 ? 8 : null)
  return {
    ...state,
    environment: { ...state.environment, noise, witnesses, securityAlert, interventionIn },
  }
}

export function advanceEnvironment(state: CombatState, dt: number): CombatState {
  const timer = state.environment.interventionIn
  if (timer === null || state.environment.intervened) return state
  const interventionIn = Math.max(0, timer - dt)
  if (interventionIn > 0) return { ...state, environment: { ...state.environment, interventionIn } }
  return {
    ...state,
    outcome:
      state.environment.context === 'CLANDESTINE'
        ? 'lost'
        : state.player.score > state.opponent.score
          ? 'won'
          : 'lost',
    environment: { ...state.environment, interventionIn: 0, intervened: true },
  }
}
