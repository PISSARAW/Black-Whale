import type { ArcadeFighter } from './types'
import type { BodyPlan } from './fightPose'

/** Pulse the shared chest joint; simulation frames, never render time, drive the pump. */
export function gumResuscitationBodyPlan(
  body: ArcadeFighter,
  ordinary: BodyPlan | null,
): BodyPlan | null {
  const frame = body.gumResuscitationFrame
  if (frame === undefined || !ordinary) return ordinary
  const pump = Math.sin(frame * 0.7) * 0.085
  return {
    ...ordinary,
    key: 'gum-resuscitation',
    blend: 0,
    pose: { ...ordinary.pose, chest: [pump, 0, 0], head: [-0.08 - Math.abs(pump), 0, 0] },
  }
}
export const GUM_RESUSCITATION_STATUS = {
  fr: 'Bungee Gum post-mortem · pompage du cœur et des poumons. Les blessures restent présentes.',
  en: 'Post-mortem Bungee Gum · heart and lung pumping. Physical injuries remain.',
}
