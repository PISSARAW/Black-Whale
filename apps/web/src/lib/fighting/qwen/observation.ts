import { seesCombatBody } from '../fightCounterplay'
import { canUseMovesetMove, movesetFor } from '../movesets'
import { ownedGumLinks } from '../bungeeNetwork'
import { machiThreadForOwner } from '../machiThread'
import type { FightSide, FightState } from '../types'
import type { CombatObservation } from './protocol'
import { isQwenFighter } from './catalogue'
import { observeUtilities } from './utilities'

export function supportsQwenDuel(state: FightState): boolean {
  return state.mode === 'versus-local' && [state.player.id, state.opponent.id].every(isQwenFighter)
}

/** Only the viewer's resources and visible bodily cues cross the inference boundary. */
export function observeCombat(state: FightState, side: FightSide): CombatObservation {
  const self = state[side]
  const enemy = state[side === 'player' ? 'opponent' : 'player']
  const visible = seesCombatBody(self)
  return {
    fighter: self.id,
    round: state.roundNumber,
    frame: state.frame,
    self: {
      health: Math.round((100 * self.health) / self.maxHealth),
      aura: Math.round(self.aura),
      wounds: self.openWounds ?? 0,
      nen: self.nen.mode,
      linked: ownedGumLinks(state, side).length > 0 || Boolean(machiThreadForOwner(state, side)),
    },
    enemy: visible
      ? {
          distance: Math.round(Math.abs(self.x - enemy.x)),
          pose: enemy.pose,
          guarding: enemy.blocking,
        }
      : null,
    recent: [],
    utilities: observeUtilities(state, side),
    moves: (movesetFor(self.id)?.moves ?? []).map((move) => ({
      slot: move.slot,
      name: move.nameEn,
      aura: move.auraCost,
      reach: move.tuning.reach,
      ready: canUseMovesetMove(state, side, move),
    })),
  }
}
