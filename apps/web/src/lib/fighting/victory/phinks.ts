import { Euler, Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'
import { keepHumanJoint } from '$lib/tour/humanJointLimits'
import { humanHandRig } from '$lib/tour/humanHandRig'
import { groundVictoryActor } from './actors'
import { createPhinksEffects } from './phinksEffects'
import { createPhinksDisintegration } from './phinksDisintegration'
import { createPhinksLook } from './phinksLook'
import { reachVictoryHand, turnVictoryChest } from './pose'
import { disposeVictoryObject, ease } from './resources'
import {
  PHINKS_CONTACT,
  PHINKS_DEBRIS_HIT,
  PHINKS_FIRST_TURN,
  PHINKS_INTERCEPT_SHOT,
  PHINKS_PARRY,
  PHINKS_PLANT,
  PHINKS_VERDICT,
  PHINKS_DISINTEGRATED,
  PHINKS_REACTION_SHOT,
  PHINKS_STRIKE_SHOT,
  PHINKS_WINDUP_END,
} from './phinksTiming'
import type { VictoryContext, VictoryDriver } from './types'
import { phinksVictoryStrike } from './phinksStrike'
import { phinksCamera } from './phinksCamera'

const TRAIL_POINTS = 25

function turnsAt(age: number, shown: number) {
  if (shown < 2) return shown * ease(age / PHINKS_FIRST_TURN)
  // Ramp into and out of the windup and keep momentum between the two turns.
  const turnStart = (time: number, duration: number) => {
    const t = Math.max(0, Math.min(1, time / duration))
    return t * t * (2 - t)
  }
  return age <= PHINKS_FIRST_TURN
    ? turnStart(age, PHINKS_FIRST_TURN)
    : 2 - turnStart(PHINKS_WINDUP_END - age, PHINKS_WINDUP_END - PHINKS_FIRST_TURN)
}

function windingAt(age: number, rotations: number) {
  const angle = rotations * Math.PI * 2
  const curl = 0.5 + 0.5 * Math.cos(angle)
  const sweep = Math.sin(angle)
  const compression = ease(age / PHINKS_WINDUP_END)
  return {
    shoulder: new Euler(
      0.26 - (2.58 - 0.3 * compression) * (1 - curl) - 0.21 * sweep,
      0.08 + 0.18 * sweep,
      0.31 + (0.31 - 0.1 * compression) * (1 - curl) + 0.22 * sweep,
    ),
    elbow: new Euler(-0.36 - (0.61 + 0.32 * compression) * curl, 0, 0),
  }
}

function traceRightFist(
  age: number,
  shown: number,
  { shoulder, elbow, hand }: { shoulder: Object3D; elbow: Object3D; hand: Object3D },
) {
  if (shown === 0 || age >= PHINKS_WINDUP_END + 8) return []
  const span = 29 - 12 * ease((age - PHINKS_FIRST_TURN) / 58)
  return Array.from({ length: TRAIL_POINTS }, (_, index) => {
    const time = Math.max(0, Math.min(age, PHINKS_WINDUP_END) - (span * index) / (TRAIL_POINTS - 1))
    const axes = windingAt(time, turnsAt(time, shown))
    return shoulder.parent!.localToWorld(
      hand.position
        .clone()
        .applyEuler(axes.elbow)
        .add(elbow.position)
        .applyEuler(axes.shoulder)
        .add(shoulder.position),
    )
  })
}

function posePhinks(context: VictoryContext, shown: number, rival: ReturnType<typeof poseRival>) {
  const { age, hero, victim } = context
  const punchStart = PHINKS_STRIKE_SHOT + 4
  const push = ease((age - punchStart) / (PHINKS_CONTACT - punchStart))
  const intercept =
    ease((age - PHINKS_PARRY + 22) / 22) * (1 - ease((age - PHINKS_PARRY - 11) / 24))
  const step = ease((age - PHINKS_WINDUP_END) / (PHINKS_PLANT - PHINKS_WINDUP_END))
  const stepLift = Math.sin(Math.PI * step)
  const release = ease((age - PHINKS_CONTACT - 5) / 52)
  const resolve = ease((age - PHINKS_REACTION_SHOT + 13) / 33)
  const lookDown = ease((age - PHINKS_DEBRIS_HIT + 6) / 36) * (1 - resolve)
  const brace = ease((age - PHINKS_PLANT + 10) / 19) * (1 - push)
  const load = push * (1 - release)
  const rearFoot = hero.root.getObjectByName('foot-right')!
  const shoulder = hero.root.getObjectByName('shoulder-right')!
  const elbow = hero.root.getObjectByName('elbow-right')!
  const hand = hero.root.getObjectByName('hand-right')!
  const heightDifference = Math.max(0, hero.height - victim.height)

  hero.root.position.x += -0.08 + 0.2 * step
  hero.root.position.z += 0.16
  hero.root.rotation.y = 1.45 - 0.19 * intercept - 0.22 * resolve
  hero.root.getObjectByName('hip-right')!.rotation.x = 0.35
  hero.root.getObjectByName('hip-left')!.rotation.x = -0.28 - 0.09 * brace - 0.26 * stepLift
  hero.root.getObjectByName('knee-left')!.rotation.x = 0.35 + 0.19 * brace + 0.42 * stepLift
  groundVictoryActor(hero)
  const support = rearFoot.getWorldPosition(new Vector3())

  hero.root.rotation.z = 0.12 * brace - (0.19 + heightDifference * 0.19) * load
  hero.root.updateWorldMatrix(true, true)
  hero.root.position.add(support.clone().sub(rearFoot.getWorldPosition(new Vector3())))
  turnVictoryChest(context, hero, [
    0.1 * load + 0.055 * lookDown,
    -0.36 * load + 0.16 * brace + 0.29 * intercept - 0.13 * resolve,
    -0.035 * resolve,
  ])
  hero.head.rotation.set(
    0.25 * lookDown + 0.12 * brace + 0.08 * load - 0.055 * resolve,
    0.24 * brace - 0.13 * lookDown + 0.24 * resolve,
    0.045 * resolve,
  )

  const axes = windingAt(age, turnsAt(age, shown))
  shoulder.rotation.copy(axes.shoulder)
  elbow.rotation.copy(axes.elbow)
  hero.root.updateWorldMatrix(true, true)
  if (shown === 0 || age >= PHINKS_WINDUP_END) {
    const chamber = shoulder.quaternion.clone()
    const chamberElbow = elbow.quaternion.clone()
    const rest = new Quaternion().setFromEuler(new Euler(-0.08, 0.04, 0.17))
    const restElbow = new Quaternion().setFromEuler(new Euler(-0.29, 0, 0))
    if (push > 0 && release < 1) {
      reachVictoryHand(context, {
        side: 'right',
        target: rival.contact,
        pole: shoulder.getWorldPosition(new Vector3()).add(new Vector3(-0.09, -0.52, -0.46)),
      })
      shoulder.quaternion.slerp(chamber, 1 - push).slerp(rest, release)
      elbow.quaternion.slerp(chamberElbow, 1 - push).slerp(restElbow, release)
    } else {
      shoulder.quaternion.copy(chamber).slerp(rest, release)
      elbow.quaternion.copy(chamberElbow).slerp(restElbow, release)
    }
  }
  keepHumanJoint(shoulder)
  keepHumanJoint(elbow)
  hero.root.getObjectByName('shoulder-left')!.rotation.set(0.18 * load, 0.07, -0.23)
  hero.root.getObjectByName('elbow-left')!.rotation.x = -0.25 - 0.34 * load
  const left = hero.root.getObjectByName('hand-left')!
  hero.root.updateWorldMatrix(true, true)
  if (intercept > 0) {
    const shoulderLeft = hero.root.getObjectByName('shoulder-left')!
    const elbowLeft = hero.root.getObjectByName('elbow-left')!
    const baseShoulder = shoulderLeft.quaternion.clone()
    const baseElbow = elbowLeft.quaternion.clone()
    reachVictoryHand(context, {
      side: 'left',
      target: rival.parry,
      pole: shoulderLeft.getWorldPosition(new Vector3()).add(new Vector3(0, -0.45, 0.44)),
    })
    shoulderLeft.quaternion.slerp(baseShoulder, 1 - intercept)
    elbowLeft.quaternion.slerp(baseElbow, 1 - intercept)
    keepHumanJoint(shoulderLeft)
    keepHumanJoint(elbowLeft)
  }
  const grip = humanHandRig(hand)
  if (grip) {
    for (const bone of grip.mesh.skeleton.bones) context.save(bone)
    grip.pose('fist', 1 - 0.8 * release)
  }
  hand.rotation.set(-0.065 * release, 0, 0)
  keepHumanJoint(hand, 'wrist')
  posePhinksFace(context, { brace, load, look: lookDown, resolve })
  return {
    fist: hand.getWorldPosition(new Vector3()),
    shoulder: shoulder.getWorldPosition(new Vector3()),
    rearFoot: support,
    leadFoot: hero.root.getObjectByName('foot-left')!.getWorldPosition(new Vector3()),
    parryHand: left.getWorldPosition(new Vector3()),
    trail: context.comfort.flashes ? traceRightFist(age, shown, { shoulder, elbow, hand }) : [],
  }
}

function posePhinksFace(
  context: VictoryContext,
  { brace, load, look, resolve }: { brace: number; load: number; look: number; resolve: number },
) {
  const { age, hero } = context
  const blink = ease((age - PHINKS_VERDICT + 8) / 3) * (1 - ease((age - PHINKS_VERDICT + 5) / 4))
  for (const side of ['left', 'right']) {
    const eye = hero.head.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    context.save(eye)
    eye.scale.y *= (1 - 0.26 * Math.max(brace, load) - 0.11 * look) * (1 - 0.86 * blink)
    const pupil = eye.getObjectByName('eye-pupil')
    if (!pupil) continue
    context.save(pupil)
    pupil.position.y -= 0.006 * look
  }
  const mouth = hero.head.getObjectByName('face-mouth')
  if (mouth) {
    context.save(mouth)
    mouth.rotation.z += 0.08 * resolve
    mouth.scale.x *= 1 + 0.07 * resolve
  }
}

function poseRival(context: VictoryContext, strike: ReturnType<typeof phinksVictoryStrike>) {
  const { ken, ten, ko, ren } = strike
  const { age, victim } = context
  const brace = ease(age / 41)
  const reach = ease((age - PHINKS_INTERCEPT_SHOT + 5) / (PHINKS_PARRY - PHINKS_INTERCEPT_SHOT + 5))
  const deflect = ease((age - PHINKS_PARRY) / 14)
  const resetGuard = ease((age - PHINKS_PLANT + 4) / 17)
  const reachOut = reach * (1 - deflect)
  const knockedAside = deflect * (1 - resetGuard)
  const stagger = ease((age - PHINKS_PARRY) / 16) * (1 - resetGuard)
  const resistance = ken ? 1 : ten ? 0.25 : 0
  const recoil = ease((age - PHINKS_CONTACT - 2) / (7 + 8 * resistance))
  const launch = PHINKS_CONTACT + (13 + 7 * resistance)
  const flight = ease((age - launch) / (PHINKS_DISINTEGRATED - launch))
  victim.root.getObjectByName('hip-left')!.rotation.x = -0.34 * brace + 0.55 * flight
  victim.root.getObjectByName('hip-right')!.rotation.x = (0.24 - 0.42 * flight) * brace
  victim.root.getObjectByName('knee-left')!.rotation.x = 0.45 * brace * (1 - flight)
  victim.root.getObjectByName('knee-right')!.rotation.x = 0.2 * brace + 0.34 * flight
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    victim.root
      .getObjectByName(`shoulder-${side}`)!
      .rotation.set(
        -(0.66 + sign * 0.1) * brace + 0.53 * recoil + 0.5 * flight,
        0,
        sign * (-0.2 * brace + 0.34 * recoil + 0.53 * flight),
      )
    victim.root.getObjectByName(`elbow-${side}`)!.rotation.x =
      -1.53 * brace + 0.32 * recoil + 0.85 * flight
  }
  const reachingShoulder = victim.root.getObjectByName('shoulder-right')!
  const reachingElbow = victim.root.getObjectByName('elbow-right')!
  reachingShoulder.rotation.x -= 0.63 * reachOut
  reachingShoulder.rotation.z += 0.93 * knockedAside
  reachingElbow.rotation.x += 1.21 * reachOut + 0.54 * knockedAside
  victim.root.position.x += -0.22 * reachOut + 0.19 * stagger
  victim.head.rotation.y = -0.23 * knockedAside
  groundVictoryActor(victim)
  const parry = reachingElbow
    .getWorldPosition(new Vector3())
    .lerp(victim.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3()), 0.78)
  const elbow = victim.root.getObjectByName('elbow-left')!.getWorldPosition(new Vector3())
  const wrist = victim.root.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
  const contact = elbow.lerp(wrist, 0.7)
  contact.x -= 0.045
  const torsoRecoil = ease((age - PHINKS_CONTACT - (5 + 5 * resistance)) / 19)
  const headSnap = ease((age - PHINKS_CONTACT - 8) / 13) * (1 - ease(flight / 0.45))
  turnVictoryChest(context, victim, [-0.18 * headSnap, 0.25 * torsoRecoil, 0])
  victim.root.quaternion.premultiply(
    new Quaternion().setFromAxisAngle(
      new Vector3(0, 0, 1),
      -0.26 * torsoRecoil - 1.19 * ease(flight),
    ),
  )
  victim.head.rotation.x = -0.29 * headSnap
  victim.head.rotation.z = -0.12 * headSnap
  const alarm = 0.32 * reachOut + 0.68 * headSnap
  const jaw = victim.head.getObjectByName('face-mouth')
  if (jaw) {
    context.save(jaw)
    jaw.scale.y *= 1 + 1.35 * alarm
    jaw.position.y -= 0.013 * alarm
  }
  const travel = 1.3 + (ko ? 0.19 : ren ? 0.1 : 0) - 0.34 * resistance
  victim.root.position.x += 0.15 * torsoRecoil + travel * flight
  victim.root.position.y += 0.32 * flight + 0.52 * Math.sin(Math.PI * flight)
  victim.root.updateWorldMatrix(true, true)
  return { contact, parry }
}

export function createPhinksVictory(): VictoryDriver {
  const effects = createPhinksEffects()
  const lighting = createPhinksLook()
  const disintegration = createPhinksDisintegration()
  return {
    update(context) {
      const { age, hero, victim, frame } = context
      const strike = frame.phinksStrike ?? phinksVictoryStrike(context.state, frame.winner)
      const shown = Math.min(2, strike.turns)
      const rotations = turnsAt(age, shown)
      const charge = strike.turns - shown + Math.floor(rotations + 1e-6)
      const origin = victim.root.position.clone()
      const rival = poseRival(context, strike)
      const pose = posePhinks(context, shown, rival)
      effects.sync({
        ...pose,
        age,
        hero,
        victim,
        charge,
        winding: age < PHINKS_WINDUP_END && shown > 0,
        ko: strike.ko,
        ken: strike.ken,
        ten: strike.ten,
        ren: strike.ren,
        flashes: context.comfort.flashes,
      })
      context.add(effects.root)
      phinksCamera(context, { pose, contact: rival.contact, origin, ko: strike.ko })
      lighting.apply(context, pose.fist, { charge, ko: strike.ko })
      disintegration.apply(context, origin, strike.turns > 0 || strike.ko)
    },
    dispose() {
      disposeVictoryObject(effects.root)
      lighting.dispose()
      disintegration.dispose()
    },
  }
}
