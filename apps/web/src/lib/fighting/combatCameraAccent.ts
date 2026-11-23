import { isAirPursuit } from './directionalChain'
import type { CinematicDirection } from './cinematicTypes'
import type { FightSide, FightState } from './types'
import { fightImpactPunctuation } from './fightImpactPunctuation'

export interface CombatCameraAccent {
  push: number
  look: number
  tilt: number
  lead: number
  side: FightSide | null
}

export const REST_CAMERA_ACCENT: CombatCameraAccent = {
  push: 0,
  look: 0,
  tilt: 0,
  lead: 0,
  side: null,
}

const ENDINGS = {
  ground: { push: 0.52, look: -0.08, tilt: 0.12, lead: 0 },
  air: { push: 0.18, look: 0.15, tilt: -0.1, lead: 0.04 },
  close: { push: 0.66, look: 0.05, tilt: -0.06, lead: -0.04 },
  carry: { push: 0.38, look: 0.03, tilt: 0.02, lead: 0.12 },
}

/** One dominant accent, rather than a sum of impact, director and directional zooms. */
export function strikeCameraAccent(state: FightState, side: FightSide): CombatCameraAccent {
  const actor = state[side],
    attack = actor.attack
  if (!attack) return { ...REST_CAMERA_ACCENT, side }
  const chain = attack.directionalChain
  if (chain && chain !== 'bridge') {
    const profile = ENDINGS[isAirPursuit(chain) ? 'air' : chain]
    return {
      ...profile,
      push: profile.push * (attack.confirmedHit ? 1 : 0.55),
      lead: profile.lead * actor.facing,
      side,
    }
  }
  const confirmed = attack.confirmedHit ? 1 : 0.55
  const push = attack.kind === 'light' ? 0.2 : attack.kind === 'heavy' ? 0.46 : 0.6
  const impact = state.impact?.attacker === side ? fightImpactPunctuation(state.impact) : null
  return {
    ...REST_CAMERA_ACCENT,
    push: Math.min(0.7, push * confirmed + (impact?.cameraPush ?? 0)),
    look: impact?.cameraLook ?? 0,
    tilt: impact?.cameraTilt ?? 0,
    side,
  }
}

/** Personal technique details can own the lens; ordinary aura changes never add a second push. */
export function dominantCameraAccent(
  phrase: CombatCameraAccent,
  direction?: CinematicDirection,
): CombatCameraAccent {
  if (!direction?.detail) return phrase
  const push = Math.min(0.7, Math.max(0, direction.strength) * 0.5)
  return push > phrase.push ? { ...phrase, push, side: direction.side } : phrase
}
