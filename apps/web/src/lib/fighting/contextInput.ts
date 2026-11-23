import { arenaObjects } from './arenaActions'
import { hasIllumiNeedleOrder } from './illumiBiscuitUpgrades'
import { canSubdueCamilla } from './matchupValves'
import { canSpeak } from './saiyuSenses'
import type { FightInput, FightSide, FightState } from './types'

const INTERACT_RANGE = 6

function soundThreatActive(state: FightState, side: FightSide): boolean {
  const foe = state[side === 'player' ? 'opponent' : 'player']
  return Boolean(foe.melodyPerformance || foe.battleCantabile)
}

function nearbyArenaObject(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return arenaObjects(state).some(
    (entity) =>
      entity.present &&
      (entity.health === undefined || entity.health > 0) &&
      Math.abs(entity.x - fighter.x) <= INTERACT_RANGE,
  )
}

/**
 * Resolves the unified Context button (`H` / `RT`) by state priority:
 * 1. Open wounds -> plugWounds
 * 2. Active sound threat -> coverEars
 * 3. Nearby arena object -> interact
 * 4. Active arena hazard/feature -> arena
 * 5. Neutral fallback -> call (Hanzo body / Bonolenov speech)
 */
export function resolveContextInput(
  state: FightState,
  side: FightSide,
  input: FightInput,
): FightInput {
  if (!input.context) return input
  const fighter = state[side]
  if (hasIllumiNeedleOrder(fighter)) return { ...input, removeNeedle: true }
  if (fighter.hinrighCuffed) return { ...input, breakCuffs: true }
  if (canSubdueCamilla(state, side)) return { ...input, subdue: true }
  if (state.moonlightOffer?.status === 'offered' && state.moonlightOffer.target === side) {
    return { ...input, acceptContract: true }
  }
  if ((fighter.openWounds ?? 0) > 0) return { ...input, plugWounds: true }
  if (soundThreatActive(state, side)) return { ...input, coverEars: true }
  if (nearbyArenaObject(state, side)) return { ...input, interact: true }
  if (state.arena) return { ...input, arena: true }
  return canSpeak(fighter) ? { ...input, call: true } : input
}
