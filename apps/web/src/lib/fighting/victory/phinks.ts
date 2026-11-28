import { Euler, Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'
import { keepHumanJoint } from '$lib/tour/humanJointLimits'
import { humanHandRig } from '$lib/tour/humanHandRig'
import { groundVictoryActor } from './actors'
import { victoryShot } from './camera'
import { createPhinksEffects } from './phinksEffects'
import { createPhinksDisintegration } from './phinksDisintegration'
import { createPhinksLook } from './phinksLook'
import type { PhinksFocus } from './phinksLens'
import { reachVictoryHand, turnVictoryChest, victimTorso } from './pose'
import { beginVictoryPose, rememberVictoryPose } from './poseContinuity'
import { disposeVictoryObject, ease } from './resources'
import {
  PHINKS_CONTACT,
  PHINKS_DEBRIS_HIT,
  PHINKS_FIRST_TURN,
  PHINKS_INTERCEPT_SHOT,
  PHINKS_PARRY,
  PHINKS_PLANT,
  PHINKS_VERDICT,
  PHINKS_FLIGHT_SHOT,
  PHINKS_FLOOR_CRACK,
  PHINKS_DISINTEGRATED,
  PHINKS_FRAGMENT_BURST,
  PHINKS_REACTION_SHOT,
  PHINKS_STRIKE_SHOT,
  PHINKS_WIDE_SHOT,
  PHINKS_WINDUP_END,
} from './phinksTiming'
import type { VictoryContext, VictoryDriver } from './types'
import { phinksVictoryStrike } from './phinksStrike'

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
  shoulder: Object3D,
  elbow: Object3D,
  hand: Object3D,
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
  posePhinksFace(context, brace, load, lookDown, resolve)
  return {
    fist: hand.getWorldPosition(new Vector3()),
    shoulder: shoulder.getWorldPosition(new Vector3()),
    rearFoot: support,
    leadFoot: hero.root.getObjectByName('foot-left')!.getWorldPosition(new Vector3()),
    parryHand: left.getWorldPosition(new Vector3()),
    trail: context.comfort.flashes ? traceRightFist(age, shown, shoulder, elbow, hand) : [],
  }
}

function posePhinksFace(
  context: VictoryContext,
  brace: number,
  load: number,
  look: number,
  resolve: number,
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

function phinksCamera(
  context: VictoryContext,
  pose: ReturnType<typeof posePhinks>,
  contact: Vector3,
  origin: Vector3,
  ko: boolean,
) {
  const { age, hero, victim, gap, comfort, camera, scene } = context
  const { fist, rearFoot } = pose
  const height = Math.max(hero.height, victim.height)
  const head = hero.head.getWorldPosition(new Vector3())
  const focusPosition = new Vector3()
  const shot = (
    target: Vector3,
    offset: Vector3,
    width: number,
    frameHeight: number,
    fov: number,
  ) => {
    const originalFov = camera.fov
    camera.fov = fov
    camera.updateProjectionMatrix()
    context.defer(() => {
      camera.fov = originalFov
      camera.updateProjectionMatrix()
    })
    victoryShot(context, { target, offset, width, height: frameHeight })
  }
  let aperture = 0

  if (comfort.camera === 0) {
    shot(
      new Vector3(context.centre + 2.18, height * 0.54, 0),
      new Vector3(-0.25, 0.32, -4.2),
      gap + 6.2,
      height + 0.65,
      34,
    )
  } else if (age < PHINKS_INTERCEPT_SHOT) {
    // Round the striking shoulder, keeping the challenger visible behind the fist.
    const orbit = ease(age / PHINKS_INTERCEPT_SHOT)
    const position = head.clone().lerp(fist, 0.32 + 0.18 * orbit)
    position.x += 0.26 * orbit
    shot(
      position,
      new Vector3(1.78 - 1.3 * orbit, 0.13, -1.19 - 0.75 * orbit),
      hero.width + 1.25,
      height * 0.84,
      36,
    )
    focusPosition.copy(head).lerp(fist, 0.34 + 0.58 * orbit)
    aperture = 22
  } else if (age < PHINKS_STRIKE_SHOT) {
    // The new angle exposes the free hands, then drops with the advancing boot.
    const intercept = ease((age - PHINKS_INTERCEPT_SHOT) / 31)
    const plant = ease((age - PHINKS_WINDUP_END) / (PHINKS_PLANT - PHINKS_WINDUP_END))
    const position = pose.parryHand.clone().lerp(origin, 0.18)
    position.y += 0.29
    position.lerp(pose.leadFoot.clone().add(new Vector3(0.23, height * 0.37, 0)), plant)
    const offset = new Vector3(-0.08 - 0.85 * intercept, 0.28 - 0.22 * plant, -2.17)
    shot(position, offset, 1.98 + 0.45 * plant, height * (0.79 - 0.07 * plant), 37)
    focusPosition.copy(pose.parryHand).lerp(position, plant)
    aperture = 14 + 6 * plant
  } else if (age < PHINKS_FLIGHT_SHOT) {
    // Hold the contact axis through the guard recoil and the delayed floor crack.
    const drive = ease((age - PHINKS_STRIKE_SHOT) / (PHINKS_CONTACT - PHINKS_STRIKE_SHOT))
    const toFoot = ease((age - PHINKS_CONTACT - 2) / (PHINKS_FLOOR_CRACK - PHINKS_CONTACT - 1))
    const position = head
      .clone()
      .lerp(fist, 0.39)
      .lerp(
        contact
          .clone()
          .lerp(victimTorso(context), 0.14)
          .add(new Vector3(ko ? -0.12 : 0, 0.04, 0)),
        drive,
      )
    position.lerp(
      rearFoot
        .clone()
        .lerp(origin, 0.68)
        .add(new Vector3(0.19, height * 0.44, 0)),
      toFoot,
    )
    const offset = new Vector3(0.37 + 0.43 * drive - 1.03 * toFoot, 0.03, -1.61 - 0.78 * toFoot)
    const sinceContact = age - PHINKS_CONTACT
    if (sinceContact > 0) {
      const recoil = 0.15 * comfort.shake * Math.exp(-sinceContact / 8)
      offset.y += Math.sin(sinceContact * 2) * recoil
      offset.x += Math.cos(sinceContact * 1.5) * recoil
    }
    shot(
      position,
      offset,
      (ko ? 1.88 : 1.59) + 1.15 * toFoot,
      height * (0.54 + 0.39 * toFoot),
      33 + 5 * toFoot,
    )
    focusPosition.copy(fist).lerp(origin, 0.73 * toFoot)
    aperture = 18 - 8 * toFoot
  } else if (age < PHINKS_WIDE_SHOT) {
    // Move with the silhouette long enough to see it split apart in mid-air.
    const burst = ease((age - PHINKS_FRAGMENT_BURST) / 63)
    const victimMid = victimTorso(context)
    const fragments = origin
      .clone()
      .add(new Vector3(0.54 + 1.16 * burst, height * (0.67 - 0.16 * burst), 0))
    const position = victimMid.lerp(fragments, ease((age - PHINKS_FLIGHT_SHOT) / 34))
    shot(
      position,
      new Vector3(0.21 - 1.2 * burst, 0.37 - 0.53 * burst, -2.36 - 0.22 * burst),
      2.04 + 0.57 * burst,
      height * 1.08,
      35,
    )
    focusPosition.copy(position)
    aperture = 14
  } else if (age < PHINKS_REACTION_SHOT - 18) {
    // Track the first debris strike from floor level, then open up to show its distance.
    const chase = ease((age - PHINKS_WIDE_SHOT) / 66)
    const widen = ease((age - PHINKS_DEBRIS_HIT) / 77)
    const near = origin.clone().add(new Vector3(1.78 + 2.12 * chase, 0.55 - 0.1 * chase, 0))
    const wide = new Vector3((hero.root.position.x + origin.x + 3.55) / 2, height * 0.48, 0)
    const offset = new Vector3(
      0.68 - 1.33 * chase,
      -0.23 + 0.07 * chase,
      -1.98 - 0.46 * chase,
    ).lerp(new Vector3(-0.45, 0.16, -4.08), widen)
    const position = near.lerp(wide, widen)
    shot(
      position,
      offset,
      2.8 + (origin.x + 5.03 - hero.root.position.x - 2.8) * widen,
      0.95 + (height - 0.33) * widen,
      39 - widen,
    )
    focusPosition.copy(position)
    aperture = 14 - 7 * widen
  } else {
    // Match the wide angle, then glide back to the reaction.
    const glide = ease(
      (age - PHINKS_REACTION_SHOT + 18) / (PHINKS_VERDICT - PHINKS_REACTION_SHOT + 18),
    )
    const lastInch = ease((age - PHINKS_REACTION_SHOT) / (PHINKS_VERDICT - PHINKS_REACTION_SHOT))
    const farEdge = origin.x + 3.55
    const nearEdge = hero.root.position.x
    const wide = new Vector3((nearEdge + farEdge) / 2, height * 0.48, 0)
    const portrait = head.clone().add(new Vector3(0.015, -0.16 + 0.035 * lastInch, 0))
    const close = new Vector3(1.18 - 0.135 * lastInch, -0.1, -0.8)
    const left = new Vector3(-close.z, 0, close.x).normalize()
    portrait.addScaledVector(left, 0.245 * Math.min(1, camera.aspect / 1.5))
    const position = wide.lerp(portrait, glide)
    const offset = new Vector3(-0.45, 0.16, -4.08).lerp(close, glide)
    const frameWidth = (farEdge - nearEdge + 1.48) * (1 - glide) + (hero.width + 0.32) * glide
    const frameHeight = (height + 0.62) * (1 - glide) + height * (0.49 - 0.065 * lastInch) * glide
    shot(position, offset, frameWidth, frameHeight, 38 - 7 * glide)
    focusPosition.copy(position).lerp(head, glide)
    aperture = 7 + 22 * glide
  }

  const forward = camera.getWorldDirection(new Vector3())
  const lens: PhinksFocus = {
    distance: Math.max(camera.near, focusPosition.sub(camera.position).dot(forward)),
    aperture,
    age,
  }
  const previousLens = scene.userData.phinksFocus
  scene.userData.phinksFocus = lens
  context.defer(() => {
    if (previousLens === undefined) delete scene.userData.phinksFocus
    else scene.userData.phinksFocus = previousLens
  })
}

export function createPhinksVictory(): VictoryDriver {
  const effects = createPhinksEffects()
  const lighting = createPhinksLook()
  const disintegration = createPhinksDisintegration()
  return {
    update(context) {
      const { age, hero, victim, frame } = context
      const clock = { token: frame.token, age }
      beginVictoryPose(hero.root, clock)
      const strike = frame.phinksStrike ?? phinksVictoryStrike(context.state, frame.winner)
      const shown = Math.min(2, strike.turns)
      const rotations = turnsAt(age, shown)
      const charge = strike.turns - shown + Math.floor(rotations + 1e-6)
      const origin = victim.root.position.clone()
      const rival = poseRival(context, strike)
      const pose = posePhinks(context, shown, rival)
      rememberVictoryPose(hero.root, clock)
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
      phinksCamera(context, pose, rival.contact, origin, strike.ko)
      lighting.apply(context, pose.fist, charge, strike.ko)
      disintegration.apply(context, origin, strike.turns > 0 || strike.ko)
    },
    dispose() {
      disposeVictoryObject(effects.root)
      lighting.dispose()
      disintegration.dispose()
    },
  }
}
