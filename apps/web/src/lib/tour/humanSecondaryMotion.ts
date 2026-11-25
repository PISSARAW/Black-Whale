import type { AnimatedHuman, HumanAnimationChannel } from './humanAnimation'
import type { HumanProfile } from './humanProfiles'
import { hisokaFaceMotion } from './hisokaFaceMotion'

/** Character-authored motion plugs into the shared clock without coupling the animator to an id. */
export function humanSecondaryMotionChannels(
  rig: AnimatedHuman,
  profile: HumanProfile,
): HumanAnimationChannel[] {
  if (profile.likeness !== 'hisoka') return []
  const face = hisokaFaceMotion(rig.head)
  if (!face) return []
  const pendant = rig.torso.getObjectByName('hisoka-pendant')
  return [
    {
      beforeFrame: () => face.reset(),
      afterFrame: ({ seconds, pose }) => {
        face.update(seconds, pose)
        if (!pendant) return
        const swing = pose === 'walk' || pose === 'attack' ? 0.092 : 0.028
        pendant.rotation.z = Math.sin(seconds * 5.6 - 0.38) * swing - rig.head.rotation.y * 0.12
        pendant.rotation.x = Math.sin(seconds * 4.1) * swing * 0.7
      },
    },
  ]
}
