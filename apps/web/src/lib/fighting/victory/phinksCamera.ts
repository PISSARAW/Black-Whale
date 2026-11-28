import { Vector3 } from 'three'
import { victoryShot } from './camera'
import type { PhinksFocus } from './phinksLens'
import { victimTorso } from './pose'
import { ease } from './resources'
import {
  PHINKS_CONTACT,
  PHINKS_DEBRIS_HIT,
  PHINKS_INTERCEPT_SHOT,
  PHINKS_PLANT,
  PHINKS_VERDICT,
  PHINKS_FLIGHT_SHOT,
  PHINKS_FLOOR_CRACK,
  PHINKS_FRAGMENT_BURST,
  PHINKS_REACTION_SHOT,
  PHINKS_STRIKE_SHOT,
  PHINKS_WIDE_SHOT,
  PHINKS_WINDUP_END,
} from './phinksTiming'
import type { VictoryContext } from './types'

export function phinksCamera(
  context: VictoryContext,
  {
    pose,
    contact,
    origin,
    ko,
  }: {
    pose: { fist: Vector3; rearFoot: Vector3; leadFoot: Vector3; parryHand: Vector3 }
    contact: Vector3
    origin: Vector3
    ko: boolean
  },
) {
  const { age, hero, victim, gap, comfort, camera, scene } = context
  const { fist, rearFoot } = pose
  const height = Math.max(hero.height, victim.height)
  const head = hero.head.getWorldPosition(new Vector3())
  const focusPosition = new Vector3()
  const shot = (
    target: Vector3,
    offset: Vector3,
    { width, frameHeight, fov }: { width: number; frameHeight: number; fov: number },
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
    shot(new Vector3(context.centre + 2.18, height * 0.54, 0), new Vector3(-0.25, 0.32, -4.2), {
      width: gap + 6.2,
      frameHeight: height + 0.65,
      fov: 34,
    })
  } else if (age < PHINKS_INTERCEPT_SHOT) {
    // Round the striking shoulder, keeping the challenger visible behind the fist.
    const orbit = ease(age / PHINKS_INTERCEPT_SHOT)
    const position = head.clone().lerp(fist, 0.32 + 0.18 * orbit)
    position.x += 0.26 * orbit
    shot(position, new Vector3(1.78 - 1.3 * orbit, 0.13, -1.19 - 0.75 * orbit), {
      width: hero.width + 1.25,
      frameHeight: height * 0.84,
      fov: 36,
    })
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
    shot(position, offset, {
      width: 1.98 + 0.45 * plant,
      frameHeight: height * (0.79 - 0.07 * plant),
      fov: 37,
    })
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
    shot(position, offset, {
      width: (ko ? 1.88 : 1.59) + 1.15 * toFoot,
      frameHeight: height * (0.54 + 0.39 * toFoot),
      fov: 33 + 5 * toFoot,
    })
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
    shot(position, new Vector3(0.21 - 1.2 * burst, 0.37 - 0.53 * burst, -2.36 - 0.22 * burst), {
      width: 2.04 + 0.57 * burst,
      frameHeight: height * 1.08,
      fov: 35,
    })
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
    shot(position, offset, {
      width: 2.8 + (origin.x + 5.03 - hero.root.position.x - 2.8) * widen,
      frameHeight: 0.95 + (height - 0.33) * widen,
      fov: 39 - widen,
    })
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
    shot(position, offset, { width: frameWidth, frameHeight: frameHeight, fov: 38 - 7 * glide })
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
