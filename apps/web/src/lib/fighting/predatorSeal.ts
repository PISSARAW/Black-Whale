import { createNenTechniqueState } from '@black-whale/nen-engine'
import { FIGHT_FPS } from './fightClock'
import type { ArcadeFighter, FightNenZone, FightState } from './types'

/** Real simulated hours, never a three-second stun or a render/wall-clock timer. */
export const PREDATOR_SEAL_FRAMES = 48 * 60 * 60 * FIGHT_FPS

export function predatorNenLocked(fighter: Pick<ArcadeFighter, 'predator'>): boolean {
  return (fighter.predator?.sealFrames ?? 0) > 0
}

export function enforcePredatorSeal(fighter: ArcadeFighter): ArcadeFighter {
  if (!predatorNenLocked(fighter)) return fighter
  const nen = createNenTechniqueState<FightNenZone>()
  return {
    ...fighter,
    nen: { ...nen, mode: 'zetsu' },
    ryuWindow: 0,
    hatsuChargeFrames: 0,
    attack: sealedAttack(fighter),
    bufferedAttack: null,
  }
}

function sealedAttack(fighter: ArcadeFighter): ArcadeFighter['attack'] {
  const attack = fighter.attack
  if (!attack || attack.kind === 'special') return null
  return { ...attack, auraCharged: false, concealed: false, hatsuSource: null }
}

export function advancePredatorClock(state: FightState): FightState {
  return { ...state, player: tickSeal(state.player), opponent: tickSeal(state.opponent) }
}

function tickSeal(fighter: ArcadeFighter): ArcadeFighter {
  if (!predatorNenLocked(fighter)) return fighter
  const predator = { ...fighter.predator!, sealFrames: fighter.predator!.sealFrames - 1 }
  return enforcePredatorSeal({ ...fighter, predator })
}

export function preservePredatorKnowledge(
  fighter: ArcadeFighter,
  previous: ArcadeFighter,
): ArcadeFighter {
  if (!previous.predator) return fighter
  return enforcePredatorSeal({
    ...fighter,
    predator: { ...previous.predator, watching: false, hunt: null },
  })
}
