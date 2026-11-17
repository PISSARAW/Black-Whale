import { Raycaster, Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { localToHead } from './pose'
import { reachCinematicHand } from './arm'
import { groundVictoryActor } from './actors'
import { visibleVictoryBounds } from './bodyBounds'
import { nativeVictoryFall } from './nativeFall'
import { ease } from './resources'

export const BEYOND_CURSE_TIMING = {
  impact: 60,
  carrierDeath: 72,
  seal: 156,
  release: 234,
  contact: 306,
  princeDeath: 432,
  verdict: 510,
} as const

function bendKnees(actor: VictoryActor, bend: number) {
  for (const side of ['left', 'right']) {
    actor.root.getObjectByName(`hip-${side}`)!.rotation.x = -bend * 0.5
    const knee = actor.root.getObjectByName(`knee-${side}`)!
    knee.rotation.x = bend
    knee.children[1].rotation.x = -bend * 0.5
  }
  groundVictoryActor(actor)
}

function finishingBlow(context: VictoryContext) {
  const { hero, victim, age } = context
  const hit = ease((age - 30) / 30) * (1 - ease((age - 64) / 24))
  victim.head.rotation.x = -hit * 0.3
  victim.root.getObjectByName('fight-chest')!.rotation.x = -hit * 0.16
  // Reference the standing body before applying its native fall, including later seeks.
  const trunk = victim.root.getObjectByName('torso')!
  const torso = visibleVictoryBounds(trunk)
  const contact = torso.getCenter(new Vector3())
  const ray = new Raycaster(
    new Vector3(torso.min.x - 1, contact.y, contact.z),
    new Vector3(1, 0, 0),
  )
  contact.copy(ray.intersectObject(trunk, true)[0]?.point ?? contact)
  const shoulder = hero.root.getObjectByName('shoulder-right')!
  const elbow = hero.root.getObjectByName('elbow-right')!
  const hand = hero.root.getObjectByName('hand-right')!
  const at = (node: typeof hand) => node.getWorldPosition(new Vector3())
  const length = at(shoulder).distanceTo(at(elbow)) + at(elbow).distanceTo(at(hand))
  bendKnees(hero, Math.max(0, hero.height - victim.height - 0.12) * 0.9)
  const vertical = contact.y - at(shoulder).y
  const reachX = Math.sqrt(
    Math.max(0.0025, (length * 0.94) ** 2 - vertical ** 2 - (length * 0.12) ** 2),
  )
  hero.root.position.x += contact.x - at(shoulder).x - reachX
  hero.root.position.z += contact.z - at(shoulder).z - length * 0.12
  hero.root.updateWorldMatrix(true, true)
  const target = localToHead(hero, new Vector3(0.19, -0.29, 0.27)).lerp(contact, hit)
  const error = reachCinematicHand(hero.root, {
    side: 'right',
    target,
    pole: localToHead(hero, new Vector3(0.45, -0.3, 0.2)),
  })
  reachCinematicHand(hero.root, {
    side: 'left',
    target: localToHead(hero, new Vector3(-0.17, -0.27, 0.25)),
    pole: localToHead(hero, new Vector3(-0.45, -0.3, 0.2)),
  })
  return error
}

function princeDread(context: VictoryContext) {
  const { hero, age } = context
  hero.root.rotation.y *= 1 - ease((age - 204) / 42)
  const panic = ease((age - BEYOND_CURSE_TIMING.contact) / 72)
  const struggle = Math.sin(age * 0.9) * panic
  hero.head.rotation.x = -0.16 * panic + struggle * 0.035
  hero.head.rotation.y = Math.sin(age * 0.3) * panic * 0.1
  hero.head.rotation.z = struggle * 0.035
  hero.root.getObjectByName('fight-chest')!.rotation.x = -panic * 0.12
  const scale = Math.min(1, hero.height / 1.7)
  const errors = (['left', 'right'] as const).map((side) => {
    const sign = side === 'left' ? -1 : 1
    const guard = new Vector3(sign * 0.18, -0.3, 0.26)
    const clutch = new Vector3(sign * 0.065, side === 'left' ? -0.36 : -0.22, 0.22)
    const target = localToHead(hero, guard.lerp(clutch, panic).multiplyScalar(scale))
    target.y += struggle * 0.004
    return reachCinematicHand(hero.root, {
      side,
      target,
      pole: localToHead(hero, new Vector3(sign * 0.45, -0.34, 0.2)),
    })
  })
  return { panic, errors }
}

function resetPrinceForFall(context: VictoryContext) {
  const { hero } = context
  hero.root.rotation.y = 0
  hero.head.rotation.set(0, 0, 0)
  hero.root.getObjectByName('fight-chest')!.rotation.set(0, 0, 0)
  for (const side of ['left', 'right'])
    for (const joint of ['shoulder', 'elbow', 'hand', 'hip', 'knee'])
      hero.root.getObjectByName(`${joint}-${side}`)!.rotation.set(0, 0, 0)
  groundVictoryActor(hero)
}

/** The prince remains the match winner; roles swap only for the second physical fall. */
export function beyondCursePose(context: VictoryContext) {
  const { age } = context
  const impactError = finishingBlow(context)
  if (age >= BEYOND_CURSE_TIMING.carrierDeath) {
    context.victim.head.rotation.set(0, 0, 0)
    context.victim.root.getObjectByName('fight-chest')!.rotation.set(0, 0, 0)
  }
  const carrierFall =
    age >= BEYOND_CURSE_TIMING.carrierDeath
      ? nativeVictoryFall(context, { start: BEYOND_CURSE_TIMING.carrierDeath })
      : undefined
  const dread =
    age >= 156 && age < BEYOND_CURSE_TIMING.princeDeath
      ? princeDread(context)
      : { panic: 0, errors: [] }
  let princeFall: ReturnType<typeof nativeVictoryFall> | undefined
  if (age >= BEYOND_CURSE_TIMING.princeDeath) {
    resetPrinceForFall(context)
    princeFall = nativeVictoryFall(
      {
        ...context,
        victim: context.hero,
        frame: { ...context.frame, loser: context.frame.winner },
      },
      { start: BEYOND_CURSE_TIMING.princeDeath },
    )
  }
  context.hero.root.updateWorldMatrix(true, true)
  context.victim.root.updateWorldMatrix(true, true)
  return { impactError, carrierFall, princeFall, ...dread }
}
