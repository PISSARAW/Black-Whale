import type { Euler, Group, Object3D } from 'three'
import type { Apparition } from './apparitions'
import { raiseConcertFlute } from './humanFlutePose'
import { HUMAN_REST_POSES } from './humanRestPoses'
import { rememberHang, stride } from './humanWalk'

export type HumanPose = NonNullable<Apparition['human']>['pose']

interface PosedHuman {
  pose: HumanPose
  figure: Group
  head: Object3D
  arms: Group[]
  legs: Group[]
  elbows: Group[]
  knees: Group[]
}

interface AnimatedHuman {
  pose: HumanPose
  figure: Group
  torso: Object3D
  pelvis: Object3D
  head: Object3D
  arms: Group[]
  legs: Group[]
  knees: Group[]
}

/**
 * The pose a body is *built* in, as opposed to the one it is animated through.
 *
 * It lives here rather than in the figure builder because it is the same
 * subject as everything else in this file — where the limbs go — and because
 * `humanAnimation` clones its rest transforms straight off the rig this
 * function has just set. The two are one idea read twice: this puts the body
 * in its pose, that returns it there after every frame.
 */
export function poseHuman(rig: PosedHuman): void {
  const { pose, figure, head, arms, legs, elbows, knees } = rig
  arms.forEach(rememberHang)
  const rest = HUMAN_REST_POSES[pose]
  if (rest) {
    rest(rig)
  } else if (pose === 'guard') {
    arms.forEach((arm, index) => {
      const side = index === 0 ? -1 : 1
      arm.position.set(side * 0.22, 1.31, 0.08)
      arm.rotation.set(-0.78, 0, side * -0.64)
      elbows[index].rotation.x = -1.05
    })
    legs[0].rotation.z = -0.08
    legs[1].rotation.z = 0.08
  } else if (pose === 'brace') {
    figure.rotation.x = -0.08
    arms.forEach((arm, index) => {
      const side = index === 0 ? -1 : 1
      arm.position.set(side * 0.2, 1.28, 0.12)
      arm.rotation.set(-1.05, 0, side * -0.42)
      elbows[index].rotation.x = -0.85
    })
    knees.forEach((knee) => (knee.rotation.x = 0.22))
  } else if (pose === 'attack') {
    arms[1].position.set(0.18, 1.3, 0.15)
    arms[1].rotation.set(-1.35, 0, -0.08)
    elbows[1].rotation.x = -0.35
  } else if (pose === 'listen') {
    arms[1].rotation.set(0, 0, -2.15)
  } else if (pose === 'search') {
    figure.rotation.x = -0.12
    head.rotation.x = 0.22
    knees.forEach((knee) => (knee.rotation.x = 0.18))
  } else if (pose === 'held') {
    figure.rotation.z = -0.24
    figure.position.x = 0.12
  } else if (pose === 'fallen') {
    figure.rotation.z = 1.3
    figure.position.y = 0.25
    arms[0].rotation.z = 0.7
    arms[1].rotation.z = -0.9
    elbows[0].rotation.x = -0.55
    knees[1].rotation.x = 0.65
  } else {
    poseTravel(rig)
  }
}

function poseTravel({ pose, figure, head, arms, legs }: PosedHuman): void {
  if (pose === 'walk') {
    arms[0].rotation.x = -0.32
    arms[1].rotation.x = 0.32
    legs[0].rotation.x = 0.2
    legs[1].rotation.x = -0.2
  } else if (pose === 'bow') {
    figure.rotation.x = 0.28
    head.rotation.x = -0.16
  }
}

export function humanAnimation(rig: AnimatedHuman): (seconds: number, pose?: HumanPose) => void {
  if (rig.pose === 'flute') raiseConcertFlute(rig.figure)
  const flute = rig.figure.getObjectByName('signature-flute')
  const fluteBasePosition = flute?.position.clone()
  const fluteBaseRotation = flute?.rotation.clone()
  const figureBasePosition = rig.figure.position.clone()
  const figureBaseRotation = rig.figure.rotation.clone()
  const shoulderBasePosition = rig.arms.map((arm) => arm.position.clone())
  const shoulderBase: Euler[] = rig.arms.map((arm) => arm.rotation.clone())
  const elbowBase: Euler[] = rig.arms.map((arm) => arm.children[1].rotation.clone())
  const hipBasePosition = rig.legs.map((leg) => leg.position.clone())
  const hipBase: Euler[] = rig.legs.map((leg) => leg.rotation.clone())
  const kneeBase: Euler[] = rig.knees.map((knee) => knee.rotation.clone())
  const headBase = rig.head.rotation.clone()
  const torsoBaseY = rig.torso.position.y
  const pelvisBaseX = rig.pelvis.position.x

  const motions: Partial<Record<HumanPose, (seconds: number) => void>> = {
    flute: (seconds) => {
      const phrase = Math.sin(seconds * 1.15)
      const breath = Math.sin(seconds * 3.7)
      rig.figure.rotation.z = figureBaseRotation.z + phrase * 0.022
      rig.figure.rotation.x = figureBaseRotation.x + Math.sin(seconds * 0.58) * 0.009
      rig.head.rotation.set(
        headBase.x + 0.04 + breath * 0.006,
        headBase.y,
        headBase.z - phrase * 0.018,
      )
      rig.arms.forEach((arm, index) => {
        const side = index === 0 ? -1 : 1
        arm.rotation.x = shoulderBase[index].x + breath * 0.014
        arm.rotation.z = shoulderBase[index].z + side * phrase * 0.018
        arm.children[1].rotation.x = elbowBase[index].x + side * Math.sin(seconds * 2.1) * 0.012
      })
      if (flute && fluteBasePosition && fluteBaseRotation) {
        flute.position.copy(fluteBasePosition)
        flute.position.y += breath * 0.004
        flute.rotation.copy(fluteBaseRotation)
        flute.rotation.x += breath * 0.008
        for (let index = 0; index < 6; index++) {
          const key = flute.getObjectByName(`signature-flute-key-${index}`)
          if (key)
            key.position.z =
              0.017 - Math.max(0, Math.sin(seconds * (4.2 + index * 0.31) + index)) * 0.004
        }
      }
    },
    bow: (seconds) => {
      const settle = Math.sin(seconds * 2.2) * 0.012
      rig.figure.rotation.x = figureBaseRotation.x + settle
      rig.head.rotation.x = headBase.x - settle * 0.5
    },
    walk: (seconds) => {
      stride(rig, { seconds, hips: hipBase.map((hip) => hip.x) })
    },
    guard: (seconds) => {
      const rise = Math.sin(seconds * 2.4) * 0.035
      rig.arms.forEach((arm, index) => {
        const side = index === 0 ? -1 : 1
        arm.position.set(side * 0.22, 1.31, 0.08)
        arm.rotation.set(-0.78 + side * rise, 0, side * -0.64)
        arm.children[1].rotation.x = -1.05
      })
      rig.legs[0].rotation.z = -0.08
      rig.legs[1].rotation.z = 0.08
    },
    brace: (seconds) => {
      rig.figure.rotation.x = -0.08 + Math.sin(seconds * 7) * 0.008
      rig.arms.forEach((arm, index) => {
        const side = index === 0 ? -1 : 1
        arm.position.set(side * 0.2, 1.28, 0.12)
        arm.rotation.set(-1.05, 0, side * -0.42)
        arm.children[1].rotation.x = -0.85
      })
      rig.knees.forEach((knee) => (knee.rotation.x = 0.22))
    },
    listen: (seconds) => {
      rig.arms[1].rotation.set(0, 0, -2.15)
      rig.head.rotation.y = headBase.y + Math.sin(seconds * 0.65) * 0.28
    },
    search: () => {
      rig.figure.rotation.x = -0.12
      rig.head.rotation.x = 0.22
      rig.knees.forEach((knee) => (knee.rotation.x = 0.18))
    },
    attack: (seconds) => {
      rig.arms[1].position.set(0.18, 1.3, 0.15)
      rig.arms[1].rotation.set(-1.35 + Math.sin(seconds * 3.4) * 0.08, 0, -0.08)
      rig.arms[1].children[1].rotation.x = -0.35
    },
    held: (seconds) => {
      rig.figure.rotation.z = -0.24
      rig.figure.position.x = 0.12 + Math.sin(seconds * 8) * 0.008
    },
    fallen: () => {
      rig.figure.rotation.z = 1.3
      rig.figure.position.y = 0.25
      rig.arms[0].rotation.z = 0.7
      rig.arms[1].rotation.z = -0.9
      rig.arms[0].children[1].rotation.x = -0.55
      rig.knees[1].rotation.x = 0.65
    },
  }

  return (seconds: number, pose = rig.pose) => {
    rig.figure.position.copy(figureBasePosition)
    rig.figure.rotation.copy(figureBaseRotation)
    rig.arms.forEach((arm, index) => {
      arm.position.copy(shoulderBasePosition[index])
      arm.rotation.copy(shoulderBase[index])
      arm.children[1].rotation.copy(elbowBase[index])
    })
    rig.legs.forEach((leg, index) => {
      leg.position.copy(hipBasePosition[index])
      leg.rotation.copy(hipBase[index])
      rig.knees[index].rotation.copy(kneeBase[index])
    })

    const breath = Math.sin(seconds * 1.7) * 0.008
    rig.torso.position.y = torsoBaseY + breath
    rig.head.rotation.set(headBase.x, headBase.y + Math.sin(seconds * 0.37) * 0.08, headBase.z)
    rig.pelvis.position.x = pelvisBaseX + Math.sin(seconds * 0.8) * 0.012

    motions[pose]?.(seconds)
  }
}
