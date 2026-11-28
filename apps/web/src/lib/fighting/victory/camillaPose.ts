import { Euler, Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { lowestBodyHeight } from '../fightGroundContact'
import type { VictoryActor, VictoryContext } from './types'
import { visibleVictoryBounds } from './bodyBounds'
import { reachCinematicHand } from './arm'
import { turnVictoryChest } from './pose'
import { ease } from './resources'
import {
  CAMILLA_ABSORB,
  CAMILLA_BODY_LANDS,
  CAMILLA_CLENCH,
  CAMILLA_CONTACT,
  CAMILLA_EYES_OPEN,
  CAMILLA_GRIP,
  CAMILLA_HAND,
  CAMILLA_INHALE,
  CAMILLA_LIFT,
  CAMILLA_PAW_LANDS,
  CAMILLA_REVEAL,
  CAMILLA_RISE,
  CAMILLA_RISE_DURATION,
  CAMILLA_STILL,
  CAMILLA_TAIL_CHARGED,
} from './camillaTiming'

const joint = (actor: VictoryActor, name: string) => actor.root.getObjectByName(name)!
const sides = ['left', 'right'] as const

function showFinalTen({ hero, age }: VictoryContext, ten: boolean) {
  if (ten && age <= CAMILLA_CONTACT) {
    hero.root.traverse((node) => {
      if (node.name === 'nen-skin-ten') node.visible = true
    })
  }
}

function camillaFacePose(
  context: VictoryContext,
  { fall, rise, impact, breath }: { fall: number; rise: number; impact: number; breath: number },
) {
  const { hero, age } = context
  const resolve = ease(age / CAMILLA_CONTACT) * (1 - fall)
  const lookUp = ease((age - CAMILLA_EYES_OPEN) / 17) * (1 - rise)
  hero.head.rotation.set(
    resolve * -0.13 + impact * 0.32 - breath * 0.12 + Math.sin(rise * Math.PI) * 0.19,
    resolve * 0.33 + lookUp * 0.08 - rise * 0.19,
    -lookUp * 0.045,
  )
  for (const side of sides) {
    const eye = hero.head.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    context.save(eye)
    const lid = ease((age - CAMILLA_EYES_OPEN - (side === 'left' ? 1.5 : 0)) / 7)
    eye.scale.y *= (1 - fall * (1 - lid) * 0.955) * (1 - resolve * 0.16 - lookUp * 0.08)
  }
  const mouth = hero.head.getObjectByName('face-mouth')
  if (mouth) {
    context.save(mouth)
    mouth.scale.y *= 1 + breath * 4.5
  }
  return mouth
}

function camillaBodyPose(context: VictoryContext) {
  const { hero, age, centre, state } = context
  const fatality = state.catsNameFatality!
  showFinalTen(context, Boolean(fatality.ten))
  const hitAge = Math.max(0, age - CAMILLA_CONTACT)
  const buckle = ease(hitAge / 13) * (1 - ease((hitAge - 13) / 22))
  const descent = ease((age - CAMILLA_CONTACT - 8) / (CAMILLA_BODY_LANDS - CAMILLA_CONTACT - 8))
  const rebound = 0.035 * Math.sin(Math.PI * ease((age - CAMILLA_BODY_LANDS) / 10))
  const fall = descent - rebound
  const rise = ease((age - CAMILLA_RISE) / CAMILLA_RISE_DURATION)
  const down = fall * (1 - rise)
  const impact = ease(hitAge / 4) * (1 - ease((hitAge - 4) / 12))
  const hand = ease((age - CAMILLA_HAND) / 9) * (1 - ease((age - CAMILLA_HAND - 12) / 16))
  const breath = ease((age - CAMILLA_INHALE) / 12) * (1 - ease((age - CAMILLA_INHALE - 15) / 26))
  const eyes = ease((age - CAMILLA_EYES_OPEN) / 7)
  hero.root.position.set(centre - 0.65 - fall * 0.48 - impact * 0.11, 0, fall * 0.45)
  hero.root.rotation.copy(
    new Euler(-0.12 * down, 0.74 * (1 - fall) + 1.39 * down, 1.57 * down + impact * 0.18, 'ZYX'),
  )
  const heroShadow = hero.root.getObjectByName('contact-shadow')
  if (heroShadow && down > 0.35) {
    context.save(heroShadow)
    heroShadow.visible = false
  }
  joint(hero, 'shoulder-left').rotation.set(0.03 * down - impact * 0.85, -0.2 * down, -0.3 * down)
  joint(hero, 'elbow-left').rotation.x = -0.28 * down - hand * 0.26
  joint(hero, 'hand-left').rotation.x = hand * 0.62
  joint(hero, 'shoulder-right').rotation.x = -0.18 * down + impact * 0.45 + rise * (1 - rise)
  joint(hero, 'hip-left').rotation.x =
    -0.12 * down - buckle * 0.95 - Math.sin(rise * Math.PI) * 0.68
  joint(hero, 'knee-left').rotation.x = 0.24 * down + buckle * 1.6 + Math.sin(rise * Math.PI) * 0.95
  joint(hero, 'hip-right').rotation.x = -buckle * 0.64 - Math.sin(rise * Math.PI) * 0.44
  joint(hero, 'knee-right').rotation.x = buckle * 1.27 + Math.sin(rise * Math.PI) * 0.64
  const chestLift = -impact * 0.19 + buckle * 0.27 + breath * 0.29 + Math.sin(rise * Math.PI) * 0.34
  if (chestLift) turnVictoryChest(context, hero, [chestLift, 0, 0])
  const mouth = camillaFacePose(context, { fall, rise, impact, breath })
  const rig = humanAnimationRig(hero.root.children[0])
  const floor = rig ? lowestBodyHeight(rig) : visibleVictoryBounds(hero.root).min.y
  hero.root.position.y += 0.025 - floor
  hero.root.updateWorldMatrix(true, true)
  const lips = (mouth ?? hero.head).getWorldPosition(new Vector3())
  const handPosition = joint(hero, 'hand-left').getWorldPosition(new Vector3())
  const bodyContact = (rig?.pelvis ?? hero.root).getWorldPosition(new Vector3()).lerp(lips, 0.32)

  return { fall, hand, breath, eyes, rise, lips, handPosition, bodyContact }
}

function aimMusseFatalShot(context: VictoryContext, target: Vector3, weight: number) {
  const { victim, age } = context
  const gun = victim.root.getObjectByName('musse-handgun')
  const holster = victim.root.getObjectByName('musse-holstered-handgun')
  if (gun && holster) {
    context.save(gun)
    context.save(holster)
    gun.visible = true
    holster.visible = false
    gun.updateWorldMatrix(true, false)
    const aim = target.clone().sub(gun.getWorldPosition(new Vector3()))
    aim.lerp(new Vector3(0, -1, 0.3), 1 - weight)
    gun.lookAt(gun.getWorldPosition(new Vector3()).add(aim))
    const flash = gun.getObjectByName('musse-muzzle-flash')
    if (flash) {
      context.save(flash)
      flash.visible = context.comfort.flashes && age >= CAMILLA_CONTACT && age < CAMILLA_CONTACT + 3
    }
  }
}

function choreographCamillaKiller(
  context: VictoryContext,
  {
    contact,
    closeStrike,
    musseShot,
  }: { contact: number; closeStrike: boolean; musseShot: boolean },
) {
  const { hero, victim, age } = context
  const target = (hero.root.getObjectByName('torso') ?? hero.head).getWorldPosition(new Vector3())
  target.z += 0.12
  if (age < 55 && (closeStrike || musseShot)) {
    victim.root.updateWorldMatrix(true, true)
    const wristTarget = joint(victim, 'hand-right').getWorldPosition(new Vector3())
    const weight = musseShot ? 1 - ease((age - CAMILLA_CONTACT) / 38) : contact
    const axis = target.clone().sub(victim.root.position)
    const reach = musseShot
      ? joint(victim, 'shoulder-right')
          .getWorldPosition(new Vector3())
          .addScaledVector(axis.setY(0).normalize(), 0.62)
      : target
    reachCinematicHand(victim.root, {
      side: 'right',
      target: wristTarget.lerp(reach, weight),
      pole: new Vector3(victim.root.position.x + 0.4, target.y - 0.5, 0.55),
    })
    if (musseShot) aimMusseFatalShot(context, target, weight)
  }
}

function camillaOpponentPose(context: VictoryContext) {
  const { state, victim, age, centre } = context
  const cause = state.catsNameFatality!.cause
  const contact = ease(age / CAMILLA_CONTACT) * (1 - ease((age - CAMILLA_CONTACT) / 35))
  const closeStrike = cause === 'strike'
  const musseShot = cause === 'projectile' && state[context.frame.loser].id === 'musse'
  const ratio = Math.max(1, (victim.height * 1.45) / 2.8)
  const grip = ease((age - CAMILLA_REVEAL) / (CAMILLA_GRIP - CAMILLA_REVEAL))
  const lift = ease((age - CAMILLA_GRIP) / (CAMILLA_LIFT - CAMILLA_GRIP))
  const clench = ease((age - CAMILLA_CLENCH + 5) / 11)
  const compression = 0.37 * ease((age - CAMILLA_LIFT) / 41) + 0.63 * clench
  const absorption = ease((age - CAMILLA_ABSORB) / (CAMILLA_TAIL_CHARGED - CAMILLA_ABSORB - 45))
  const struggle =
    ease((age - CAMILLA_GRIP) / 15) *
    (1 - ease((age - CAMILLA_CLENCH) / (CAMILLA_STILL - CAMILLA_CLENCH)))
  const kick = Math.sin((age - CAMILLA_GRIP) * 0.23) * struggle
  const wrench = Math.sin((age - CAMILLA_GRIP) * 0.15 + 0.6) * struggle
  const catX = centre + 0.78 * ratio
  victim.root.position.set(catX - (closeStrike ? contact * 0.68 : 0), 0, -0.02)
  victim.root.rotation.set(-lift * 0.06, -1.14 * (1 - grip) + wrench * 0.16, wrench * 0.12)
  const checkBody =
    ease((age - CAMILLA_BODY_LANDS) / 25) * (1 - ease((age - CAMILLA_PAW_LANDS) / 11))
  const noticePaw = ease((age - CAMILLA_PAW_LANDS) / 10) * (1 - grip)
  victim.head.rotation.x =
    -contact * 0.15 + checkBody * 0.24 - noticePaw * 0.24 - struggle * 0.3 + clench * 0.29
  victim.head.rotation.y = noticePaw * 0.52 - checkBody * 0.16
  victim.head.rotation.z = wrench * 0.26 - clench * 0.13
  if (struggle || clench)
    turnVictoryChest(context, victim, [
      struggle * -0.26 + clench * 0.24,
      wrench * 0.14,
      wrench * -0.12,
    ])
  for (const [index, side] of sides.entries()) {
    const direction = index === 0 ? -1 : 1
    joint(victim, `shoulder-${side}`).rotation.set(
      -0.92 * struggle + direction * wrench * 0.54 - (closeStrike ? contact * (0.42 + index) : 0),
      0,
      direction * (struggle * 0.68 + wrench * 0.24),
    )
    joint(victim, `elbow-${side}`).rotation.x = -1.24 * struggle - contact * (1 - index) * 0.85
    joint(victim, `hip-${side}`).rotation.x = -lift * 0.16 + direction * kick * 1.06
    joint(victim, `knee-${side}`).rotation.x = lift * 0.27 + Math.max(0, direction * kick) * 1.13
  }
  victim.root.visible = true
  victim.root.scale
    .multiply(new Vector3(1 - compression * 0.22, 1 - compression * 0.08, 1 - compression * 0.15))
    .multiplyScalar(1 - absorption * 0.97)
  choreographCamillaKiller(context, { contact, closeStrike, musseShot })
  const torso = victim.root.getObjectByName('torso') ?? victim.head
  const body = visibleVictoryBounds(torso)
  const bodyCentre = body.getCenter(new Vector3())
  const held = new Vector3(catX, Math.max(bodyCentre.y + 0.52, 1.66 * ratio), 0.87 * ratio)
  victim.root.position.x += (held.x - bodyCentre.x) * grip
  victim.root.position.y += (held.y - bodyCentre.y) * lift
  victim.root.position.z += (held.z - bodyCentre.z) * grip
  victim.root.updateWorldMatrix(true, true)
  const heldBody = visibleVictoryBounds(torso)
  victim.root.visible = absorption < 1
  return { ratio, catX, grip, struggle, compression, absorption, body: heldBody }
}

export function camillaVictoryPose(context: VictoryContext) {
  const body = camillaBodyPose(context)
  return { ...body, ...camillaOpponentPose(context) }
}
