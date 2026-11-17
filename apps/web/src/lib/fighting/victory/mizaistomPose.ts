import { Box3, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { guardHand, lowerGuardForProp } from './personalGuardStaging'
import { groundVictoryActor } from './actors'
import { localToHead } from './pose'
import { ease } from './resources'
import { nativeVictoryFall, victoryFallTrajectory } from './nativeFall'
import { mizaistomBeat, MIZAISTOM_TIMING } from './mizaistomTrack'

function incoming(age: number) {
  if (age < 234) return ease((Math.min(age, 144) - 108) / 36)
  if (age < 270) return 1 - ease((age - 234) / 24)
  return ease((Math.min(age, 300) - 270) / 30)
}
export function mizaistomPose(context: VictoryContext) {
  const { hero, victim, age, centre } = context
  const beat = mizaistomBeat(age)
  const initialFace = hero.head.getWorldPosition(new Vector3())
  const rush = ease((Math.min(age, 144) - 108) / 36)
  victim.root.position.x += (centre + 0.24 - victim.root.position.x) * rush
  const advance = ease((age - 150) / 66)
  hero.root.position.x += (centre - 0.36 - hero.root.position.x) * advance
  hero.root.position.z = 0.28 * advance
  hero.root.rotation.y = 1.2 + 0.12 * beat.strike
  victim.root.rotation.y = -1.25
  const gait = Math.sin(age * 0.17) * Math.sin(Math.PI * rush) * 0.3
  for (const side of ['left', 'right'])
    victim.root.getObjectByName(`hip-${side}`)!.rotation.x = (side === 'left' ? 1 : -1) * gait
  groundVictoryActor(victim)
  const torso = victim.root.getObjectByName('torso')!
  const contact = new Box3().setFromObject(torso).getCenter(new Vector3())
  contact.x -= 0.08
  if (hero.height > victim.height + 0.3)
    lowerGuardForProp(hero, hero.height + (contact.y - hero.height) * ease((age - 168) / 42))
  hero.head.rotation.x = 0.04
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  const cardGrip = localToHead(hero, new Vector3(-0.32, -0.24, 0.24))
  cardGrip.lerp(localToHead(hero, new Vector3(-0.18, -0.64, 0.14)), 1 - ease((age - 6) / 36))
  cardGrip.lerp(localToHead(hero, new Vector3(-0.18, -0.64, 0.14)), ease((age - 444) / 36))
  const rightError = guardHand(hero, 'left', cardGrip)
  const palmRest = localToHead(hero, new Vector3(0.18, -0.52, 0.24))
  const leftError = guardHand(hero, 'right', palmRest.lerp(contact, beat.strike))
  const fistRest = localToHead(victim, new Vector3(0.2, -0.35, 0.24))
  const endpoint = initialFace.clone().add(new Vector3(0.12, -0.14, 0.04))
  guardHand(victim, 'right', fistRest.clone().lerp(endpoint, incoming(age)))
  guardHand(victim, 'left', localToHead(victim, new Vector3(-0.2, -0.45, 0.22)))
  const shock = ease((age - 236) / 5) * (1 - ease((age - 252) / 18))
  victim.head.rotation.x = -0.17 * shock
  const chest = victim.root.getObjectByName('fight-chest')
  if (chest) chest.rotation.z = -0.12 * shock
  // The two confirmed confinements end before their respective physical blows.
  const launch = { velocityY: 9, velocityX: 22 }
  const trajectory = victoryFallTrajectory(context.state[context.frame.loser], launch)
  const sample =
    trajectory[Math.min(trajectory.length - 1, MIZAISTOM_TIMING.panel - MIZAISTOM_TIMING.fall)]
  const panelX = victim.root.position.x + (sample.x - 50) * 0.12
  const fall =
    age >= MIZAISTOM_TIMING.fall
      ? nativeVictoryFall(context, { start: MIZAISTOM_TIMING.fall, ...launch })
      : undefined
  const hand = hero.root.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
  const palm = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  return {
    ...beat,
    hand,
    palm,
    contact,
    panelX,
    fall,
    cardGrip,
    handErrors: [rightError, leftError],
  }
}
export type MizaistomPose = ReturnType<typeof mizaistomPose>
