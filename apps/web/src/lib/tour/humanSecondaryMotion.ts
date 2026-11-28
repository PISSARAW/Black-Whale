import { humanJointSlots, type AnimatedHuman, type HumanAnimationChannel } from './humanAnimation'
import type { HumanProfile } from './humanProfiles'
import { hisokaFaceMotion } from './hisokaFaceMotion'

/** Character-authored motion plugs into the shared clock without coupling the animator to an id. */
export function humanSecondaryMotionChannels(
  rig: AnimatedHuman,
  profile: HumanProfile,
): HumanAnimationChannel[] {
  if (profile.likeness === 'yokotani') return [yokotaniBookPose(rig)]
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

function yokotaniBookPose(rig: AnimatedHuman): HumanAnimationChannel {
  const elbow = humanJointSlots(rig).elbows[0]
  return {
    afterFrame: ({ pose, layer }) => {
      if (layer?.motion || layer?.afterMotion || (pose !== 'idle' && pose !== 'listen')) return
      rig.arms[0].rotation.x = -0.22
      rig.arms[0].rotation.z = 0.24
      elbow.rotation.x = -1.8
      elbow.rotation.z = 0.34
    },
  }
}
