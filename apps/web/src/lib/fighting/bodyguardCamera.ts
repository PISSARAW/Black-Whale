import { bodyguardFiring } from './bodyguardFirearms'
import { projectileProfile } from './projectiles'
import { prop } from './cinematicRules'
import type { CameraDetail } from './cinematicTypes'
import type { FightSide, FightState } from './types'

/** A physical shot focuses the held firearm, never the user's Hatsu or chain. */
export function bodyguardShotDetail(state: FightState, side: FightSide): CameraDetail | null {
  const fighter = state[side]
  if (!bodyguardFiring(fighter)) return null
  const profile = projectileProfile(fighter.id)
  const hand = fighter.id === 'kurapika' ? 'left-hand' : 'right-hand'
  const weapon = fighter.id === 'theta' ? 'theta-physical-handgun' : `${fighter.id}-handgun`
  return {
    kind: 'focus',
    side,
    source: fighter.id,
    sourceSide: side,
    aura: false,
    eventId: `cast:${side}:ranged:${state.frame}`,
    labelFr: profile.labelFr,
    labelEn: profile.labelEn,
    anchors: [prop(side, weapon, hand)],
    frontal: false,
    isolate: true,
  }
}
