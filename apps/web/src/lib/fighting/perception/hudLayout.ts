import type { FightSide, FightState } from '../types'
import type { FightHudMode } from './hudMode'

export interface OpaqueHudSidesInput {
  state: Pick<FightState, 'mode' | 'spectatorView'>
  mode: FightHudMode
}

export function rivalSide(side: FightSide): FightSide {
  return side === 'player' ? 'opponent' : 'player'
}

/**
 * Sides whose HUD block is rendered opaque (Living Portrait + deduction dossier).
 * - Omniscient or spectator view: none.
 * - Tactical solo / online: only the opponent, the player knows their own body.
 * - Tactical local versus: both, since a shared screen has no private side.
 */
export function opaqueHudSides(input: OpaqueHudSidesInput): readonly FightSide[] {
  if (input.mode !== 'tactical' || input.state.spectatorView) return []
  return input.state.mode === 'versus-local' ? ['player', 'opponent'] : ['opponent']
}
