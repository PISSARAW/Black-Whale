import type { Euler, Group, Object3D } from 'three'
import type { Apparition } from './apparitions'

type Pose = NonNullable<Apparition['human']>['pose']

interface AnimatedHuman {
  pose: Pose
  figure: Group
  torso: Object3D
  pelvis: Object3D
  head: Object3D
  arms: Group[]
  legs: Group[]
  knees: Group[]
}

export function humanAnimation(rig: AnimatedHuman): (seconds: number) => void {
  const shoulderBase: Euler[] = rig.arms.map((arm) => arm.rotation.clone())
  const hipBase: Euler[] = rig.legs.map((leg) => leg.rotation.clone())
  const headBase = rig.head.rotation.clone()
  const torsoBaseY = rig.torso.position.y
  const pelvisBaseX = rig.pelvis.position.x

  return (seconds: number) => {
    const breath = Math.sin(seconds * 1.7) * 0.008
    rig.torso.position.y = torsoBaseY + breath
    rig.head.rotation.set(headBase.x, headBase.y + Math.sin(seconds * 0.37) * 0.08, headBase.z)
    rig.pelvis.position.x = pelvisBaseX + Math.sin(seconds * 0.8) * 0.012

    if (rig.pose === 'walk') {
      const stride = Math.sin(seconds * 5.2) * 0.42
      rig.arms[0].rotation.x = shoulderBase[0].x - stride * 0.7
      rig.arms[1].rotation.x = shoulderBase[1].x + stride * 0.7
      rig.legs[0].rotation.x = hipBase[0].x + stride
      rig.legs[1].rotation.x = hipBase[1].x - stride
      rig.knees[0].rotation.x = Math.max(0, -stride) * 0.7
      rig.knees[1].rotation.x = Math.max(0, stride) * 0.7
    } else if (rig.pose === 'guard') {
      const rise = Math.sin(seconds * 2.4) * 0.035
      rig.arms[0].rotation.x = shoulderBase[0].x + rise
      rig.arms[1].rotation.x = shoulderBase[1].x - rise
    } else if (rig.pose === 'listen') {
      rig.head.rotation.y = headBase.y + Math.sin(seconds * 0.65) * 0.28
    } else if (rig.pose === 'attack') {
      rig.arms[1].rotation.x = shoulderBase[1].x + Math.sin(seconds * 3.4) * 0.08
    } else if (rig.pose === 'held') {
      rig.figure.position.x = 0.12 + Math.sin(seconds * 8) * 0.008
    }
  }
}
