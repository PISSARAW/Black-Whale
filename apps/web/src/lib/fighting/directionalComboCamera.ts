import { pursuitCameraActive } from './pursuitCamera'
import { attackData } from './frameData'
import { DIRECTIONAL_LAUNCH_SPEED, isAirPursuit, type DirectionalEnding } from './directionalChain'
import type { CameraDetail } from './cinematicTypes'
import type { ArcadeFighter, FightState } from './types'

const PROFILES: Record<
  DirectionalEnding,
  { zoom: number; look: number; tilt: number; lead: number }
> = {
  ground: { zoom: -2.1, look: -0.33, tilt: 0.54, lead: 0 },
  air: { zoom: -0.75, look: 0.58, tilt: -0.44, lead: 0.14 },
  close: { zoom: -2.65, look: 0.19, tilt: -0.24, lead: -0.17 },
  carry: { zoom: -1.48, look: 0.1, tilt: 0.08, lead: 0.46 },
}

function actorShot(actor: ArcadeFighter) {
  const attack = actor.attack
  const chain = attack?.directionalChain
  const ending = isAirPursuit(chain) ? 'air' : chain
  if (!attack || !ending || ending === 'bridge') return
  const { startup, active, recovery } = attackData(attack.kind, actor)
  const elapsed = attack.frame
  const load = Math.min(1, elapsed / Math.max(1, startup))
  const release = Math.min(1, Math.max(0, elapsed - startup - active) / Math.max(1, recovery))
  const confidence = attack.impacted && !attack.confirmedHit ? 0.52 : 1
  const weight = load * load * (1 - release * release) * confidence
  const profile = PROFILES[ending]
  return { ending, weight, ...profile, lead: profile.lead * actor.facing }
}

export function directionalComboShot(state: FightState, pursuit = pursuitCameraActive(state)) {
  if (state.phase !== 'fighting') return
  if (pursuit) return { ending: 'air' as const, ...PROFILES.air, weight: 1, lead: 0 }
  return actorShot(state.player) ?? actorShot(state.opponent)
}

export function directionalCameraOffsets(state: FightState, intensity: number, pursuit?: boolean) {
  const shot = intensity > 0 ? directionalComboShot(state, pursuit) : undefined
  if (!shot) return { zoom: 0, look: 0, tilt: 0, lead: 0, minimum: 5.9 }
  const weight = shot.weight * intensity
  return {
    zoom: shot.zoom * weight,
    look: shot.look * weight,
    tilt: shot.tilt * weight,
    lead: shot.lead * weight,
    minimum: 5.9 - 1.65 * weight,
  }
}

export function visibleSecondaryView(
  state: FightState,
  detail: CameraDetail | null,
  hidden: boolean,
) {
  return hidden || directionalComboShot(state) ? null : detail
}

export function previewLaunchSpeed(attacker: ArcadeFighter): number {
  const attack = attacker.attack
  if (attack?.directionalChain !== 'air' || attack.impacted) return 0
  const { startup } = attackData(attack.kind, attacker)
  const phase = Math.min(1, attack.frame / Math.max(1, startup - 1))
  return DIRECTIONAL_LAUNCH_SPEED * phase * phase * (3 - 2 * phase)
}
