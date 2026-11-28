import { Mesh, Raycaster, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { groundVictoryActor } from './actors'
import { visibleVictoryBounds } from './bodyBounds'
import { drawFightFace, fightFaceRig } from '../fightExpressionRig'
import { REST_FACE } from '../fightExpressions'
import { localToHead, reachVictoryHand, turnVictoryChest } from './pose'
import { ease } from './resources'
import timing from './bonolenovTiming.json'

const X = new Vector3(1, 0, 0)
const Y = new Vector3(0, 1, 0)
const Z = new Vector3(0, 0, 1)

function rivalExpression(context: VictoryContext, recoil: number) {
  if (context.age < timing.impactShot || context.age >= timing.floorShot) return
  const face = fightFaceRig(context.victim.root)
  if (!face) return
  const anticipation = (1 - recoil) * ease((context.age - timing.impactShot) / 4)
  drawFightFace(face, {
    ...REST_FACE,
    eye: 1 + anticipation * 0.09 - recoil * 0.43,
    brow: anticipation * 0.12 - recoil * 0.25,
    lift: anticipation * 0.008,
    pain: recoil * 0.8,
  })
}

function dance(context: VictoryContext) {
  const { hero, age } = context
  const landing = timing.phrases[0].frame
  const firstStep = ease((age - 8) / 19) * (1 - ease((age - landing) / 17))
  const lift = ease((age - 7) / 10) * (1 - ease((age - 17) / 10))
  const twist = ease((age - 37) / 29) * (1 - ease((age - 76) / 25))
  const turn = ease((age - 66) / 37) * 0.37 + ease((age - 107) / 86) * 0.63
  const phrase = 1 - ease((age - 190) / 14)
  const bow = ease((age - timing.bow) / 29) * (1 - ease((age - 559) / 37))
  const grip = new Vector3(hero.root.position.x + 0.31, hero.height * 0.52, 0.15)
  const orbit = turn * Math.PI * 2
  hero.root.position.x = grip.x - Math.cos(orbit) * 0.31
  hero.root.position.z = grip.z - Math.cos(orbit) * 0.15 + Math.sin(orbit) * 0.31
  hero.root.rotation.y = 0.35 + orbit
  const weight = Math.sin(orbit) * 0.18 + firstStep * 0.37
  hero.root.getObjectByName('hip-left')!.rotation.x = -weight - lift * 0.42
  hero.root.getObjectByName('knee-left')!.rotation.x = Math.max(0, weight) * 1.3 + lift * 0.73
  hero.root.getObjectByName('hip-right')!.rotation.x = weight * 0.6
  hero.root.getObjectByName('knee-right')!.rotation.x = Math.abs(weight) * 0.7
  turnVictoryChest(context, hero, [bow * 0.63 - twist * 0.13, twist * 0.59, -twist * 0.16])
  hero.head.rotation.x = bow * 0.24
  groundVictoryActor(hero)
  const sweep = ease((age - 76) / 30) - ease((age - 109) / 33)
  const cross = ease((age - 121) / 27) - ease((age - 161) / 32)
  reachVictoryHand(context, {
    side: 'left',
    target: localToHead(
      hero,
      new Vector3(
        -0.22 - (sweep * 0.36 - cross * 0.16),
        -0.63 + (sweep + cross) * 0.39,
        0.1 + cross * 0.37,
      ),
    ),
  })
  if (age < timing.form + 45) {
    const shoulder = hero.root.getObjectByName('shoulder-right')!.getWorldPosition(new Vector3())
    const heldGrip = shoulder.lerp(grip, phrase * 0.8 + 0.2)
    reachVictoryHand(context, { side: 'right', target: heldGrip })
  } else {
    reachVictoryHand(context, {
      side: 'right',
      target: localToHead(
        hero,
        new Vector3(0.24 - bow * 0.12, -0.65 + bow * 0.31, 0.12 + bow * 0.14),
      ),
    })
  }
}

function rivalContact(context: VictoryContext) {
  const { victim, age } = context
  const stepAge = Math.min(age, timing.impact)
  const run = Math.max(0, (stepAge - timing.chase) / (timing.impact - timing.chase))
  const lastStep = ease((stepAge - timing.lastStep) / (timing.impact - timing.lastStep))
  const stride = Math.sin((stepAge - timing.chase) * 0.29) * Math.min(1, run * 12)
  const gait = stride * (1 - lastStep) + 0.78 * lastStep
  victim.root.position.x += run * 2.1
  const heading =
    -1.15 - ease((age - timing.wide) / 29) * (Math.PI * 0.5 - 1.15) - Math.PI * ease(run * 6)
  victim.root.rotation.set(0, heading, 0)
  victim.root.rotateOnWorldAxis(Z, -ease(run * 4) * 0.14 - lastStep * 0.26)
  victim.root.rotateOnWorldAxis(X, lastStep * 0.16)
  const lookBack = ease((stepAge - 357) / 22)
  victim.head.rotation.y = 0.35 * ease((stepAge - 306) / 34) - lookBack * 1.58
  victim.head.rotation.x = -lookBack * 0.13
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    victim.root.getObjectByName(`hip-${side}`)!.rotation.x = gait * sign * 0.48
    victim.root.getObjectByName(`knee-${side}`)!.rotation.x = Math.max(0, -gait * sign) * 0.76
    victim.root.getObjectByName(`shoulder-${side}`)!.rotation.x = -gait * sign * 0.54
    victim.root.getObjectByName(`elbow-${side}`)!.rotation.x = Math.abs(gait) * -0.7
  }
  groundVictoryActor(victim)
  const torso = victim.root.getObjectByName('torso') ?? victim.head
  const bounds = visibleVictoryBounds(torso)
  const contact = bounds.getCenter(new Vector3())
  contact.y += (bounds.max.y - bounds.min.y) * 0.32
  const origin = contact.clone().setX(bounds.min.x - 1)
  const ray = new Raycaster(origin, new Vector3(1, 0, 0))
  const surfaces: Mesh[] = []
  torso.traverseVisible((part) => {
    if (part instanceof Mesh) surfaces.push(part)
  })
  contact.x = ray.intersectObjects(surfaces, false)[0]?.point.x ?? bounds.min.x
  return contact
}

export function bonolenovVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  dance(context)
  const contact = rivalContact(context)
  const crush = ease((age - timing.impact) / 25)
  const recoil = ease((age - timing.impact) / 6)
  const victimX = victim.root.position.x
  victim.root.position.x = victimX + recoil * 0.27
  victim.root.position.z += recoil * 0.33
  victim.head.rotation.x -= recoil * 0.36
  victim.root.rotateOnWorldAxis(Y, recoil * (1 - crush) * 0.27)
  victim.root.rotateOnWorldAxis(Z, -recoil * 0.34 - crush * 0.63)
  rivalExpression(context, recoil)
  groundVictoryActor(victim)
  victim.root.visible = age < timing.impact + 24
  return {
    contact,
    crush,
    start: hero.root.position.clone(),
    victimX,
  }
}
export type BonolenovVictoryPose = ReturnType<typeof bonolenovVictoryPose>
