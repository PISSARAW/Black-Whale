import { Mesh, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { groundVictoryActor } from './actors'
import { visibleVictoryBounds } from './bodyBounds'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { ease } from './resources'
import { BISCUIT_IMPACT, BISCUIT_REVEAL, BISCUIT_RETURN } from './biscuitForms'
import { biscuitVictoryFall, BISCUIT_LANDING } from './biscuitFall'

export function biscuitVictoryPose(context: VictoryContext) {
  const { age, hero, victim } = context
  const approach = ease((age - 96) / 84)
  hero.root.position.x += approach * Math.max(0, context.gap - 0.82)
  hero.root.rotation.y *= 1 - ease((age - BISCUIT_RETURN) / 36)
  hero.head.rotation.x = -ease((age - 126) / 36) * (1 - ease((age - 210) / 24)) * 0.22
  const brace = ease((age - BISCUIT_REVEAL) / 42)
  victim.root.updateWorldMatrix(true, true)
  const torso = visibleVictoryBounds(victim.root.getObjectByName('torso') ?? victim.head)
  const contact = torso.getCenter(new Vector3())
  contact.x = torso.min.x + 0.04
  contact.y = torso.min.y + (torso.max.y - torso.min.y) * 0.62
  contact.z += 0.03

  // Close the remaining gap before extending the real upper arm and forearm.
  hero.root.updateWorldMatrix(true, true)
  const shoulder = hero.root.getObjectByName('shoulder-right')!
  const elbow = hero.root.getObjectByName('elbow-right')!
  const hand = hero.root.getObjectByName('hand-right')!
  const armLength =
    shoulder.getWorldPosition(new Vector3()).distanceTo(elbow.getWorldPosition(new Vector3())) +
    elbow.getWorldPosition(new Vector3()).distanceTo(hand.getWorldPosition(new Vector3()))
  const extension = ease((age - 300) / 30) * (1 - ease((age - 348) / 36))
  const origin = shoulder.getWorldPosition(new Vector3())
  const crouch = extension * Math.max(0, origin.y - contact.y - armLength * 0.35)
  crouchBiscuit(context, crouch)
  const lowered = shoulder.getWorldPosition(new Vector3())
  hero.root.position.x += extension * (contact.x - lowered.x - armLength * 0.87)
  hero.root.position.z += extension * (contact.z - lowered.z - armLength * 0.15)
  hero.root.updateWorldMatrix(true, true)

  const polish = age < 96 || age >= BISCUIT_RETURN
  const windup = ease((age - 258) / 42)
  const rest = localToHead(hero, new Vector3(0.19, -0.47, 0.25))
  const chamber = localToHead(hero, new Vector3(0.25, -0.36, -0.12))
  const inspect = localToHead(hero, new Vector3(0.17, -0.17, 0.27))
  const target = polish
    ? rest.lerp(inspect, ease((age - 468) / 30))
    : rest.lerp(chamber, windup).lerp(contact, extension)
  const rightError = reachVictoryHand(context, { side: 'right', target })
  reachVictoryHand(context, {
    side: 'left',
    target: localToHead(hero, new Vector3(-0.22, -0.53, 0.13)),
  })
  const fist = hand.getWorldPosition(new Vector3())

  const fall = biscuitVictim(context, brace)
  biscuitSpeech(context)
  return { contact, fist, rightError, polish, extension, ...fall }
}
function biscuitVictim(context: VictoryContext, brace: number) {
  const { age, victim } = context
  if (age >= BISCUIT_IMPACT) return biscuitVictoryFall(context)
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    const wrist = victim.root.getObjectByName(`hand-${side}`)!
    reachCinematicHand(victim.root, {
      side,
      target: wrist
        .getWorldPosition(new Vector3())
        .lerp(localToHead(victim, new Vector3(sign * 0.18, -0.08, 0.22)), brace),
      pole: localToHead(victim, new Vector3(sign * 0.5, -0.3, 0.1)),
    })
  }
  return {
    flight: 0,
    landing: false,
    airborneY: 0,
    progress: 0,
    floor: 0,
    upY: 1,
    roll: 0,
    landingFrame: BISCUIT_LANDING,
    landingPoint: new Vector3(),
  }
}

function biscuitSpeech(context: VictoryContext) {
  const { hero, age } = context
  const mouth = hero.head.getObjectByName('face-mouth')
  if (mouth instanceof Mesh && mouth.morphTargetInfluences) {
    const speaking = age < 66 || (age >= 150 && age < 204) || (age >= 450 && age < 486)
    mouth.morphTargetInfluences[0] = speaking ? 0.1 + Math.abs(Math.sin(age * 0.34)) * 0.2 : 0
  }
}
/** Bend the knees and hips while keeping the soles on the floor. */
function crouchBiscuit(context: VictoryContext, drop: number) {
  if (drop <= 0) return
  const { hero } = context
  const shoulder = hero.root.getObjectByName('shoulder-right')!
  const goal = shoulder.getWorldPosition(new Vector3()).y - drop
  let low = 0,
    high = 2.8
  for (let i = 0; i < 9; i++) {
    const bend = (low + high) / 2
    for (const side of ['left', 'right']) {
      const hip = hero.root.getObjectByName(`hip-${side}`)!
      const knee = hero.root.getObjectByName(`knee-${side}`)!
      hip.rotation.x = -bend / 2
      knee.rotation.x = bend
      knee.children[1].rotation.x = -bend / 2
    }
    groundVictoryActor(hero)
    if (shoulder.getWorldPosition(new Vector3()).y > goal) low = bend
    else high = bend
  }
}
export type BiscuitVictoryPose = ReturnType<typeof biscuitVictoryPose>
