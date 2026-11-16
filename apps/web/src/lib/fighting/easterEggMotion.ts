import { addPoses, scalePose } from './fightPose'
import { easterEggDefinition } from './easterEggCatalogue'
import { EASTER_GESTURES_1 } from './easterEggGestures1'
import { EASTER_GESTURES_2 } from './easterEggGestures2'
import { EASTER_GESTURES_3 } from './easterEggGestures3'
import { EASTER_GESTURES_4 } from './easterEggGestures4'
import { EASTER_GESTURES_5 } from './easterEggGestures5'
import type { EggGesture } from './easterEggTypes'
import type { EggGestureKeys } from './easterEggGestureKit'
import type { ArcadeFighter } from './types'

export const EASTER_GESTURES = {
  ...EASTER_GESTURES_1,
  ...EASTER_GESTURES_2,
  ...EASTER_GESTURES_3,
  ...EASTER_GESTURES_4,
  ...EASTER_GESTURES_5,
} satisfies Record<EggGesture, EggGestureKeys>

export function authoredEasterEggPose(fighter: ArcadeFighter) {
  const egg = fighter.easterEgg
  if (!egg) return null
  const motion = easterEggDefinition(fighter.id, egg.slot)?.motion
  if (!motion) return null
  const t = egg.frame / egg.duration
  // Saiyu's last joke actually alternates ears, mouth and eyes, without sealing any sense.
  const gesture =
    motion.gesture === 'monkeys'
      ? (['ears', 'mouth', 'eyes'] as const)[Math.min(2, Math.floor(t * 3))]
      : motion.gesture
  const keys = EASTER_GESTURES[gesture]
  const beat = Math.sin(t * Math.PI * 2 * motion.cycles) * motion.energy
  const ending = Math.max(0, Math.min(1, (t - 0.48) / 0.16))
  return addPoses(
    keys.pose,
    motion.accent,
    scalePose(keys.sway, beat),
    scalePose(keys.finish, ending),
  )
}
