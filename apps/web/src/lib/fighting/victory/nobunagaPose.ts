import { Vector3 } from 'three'
import type { NobunagaContext } from './nobunagaTypes'
import { NOBUNAGA_ENTRY, NOBUNAGA_CONTACT } from './nobunagaTypes'
import { visibleVictoryBounds } from './bodyBounds'
import { groundVictoryActor } from './actors'
import { reachCinematicHand } from './arm'
import { ease } from './resources'
import { placeAtNobunagaBoundary } from './nobunagaBoundary'

export function nobunagaVictoryPose(context: NobunagaContext) {
  const { hero, victim, age } = context
  // Prepare the hips before En entry; do not reverse the torso twice during the eight-frame draw.
  const drawClearance = ease((age - 264) / 36) * (1 - ease((age - 324) / 36))
  const returnClearance = ease((age - 450) / 36) * (1 - ease((age - 486) / 24))
  hero.root.rotation.y =
    1.15 * (1 - Math.max(drawClearance, returnClearance)) * (1 - ease((age - 528) / 42))
  const waiting = hero.root.position.clone()
  const enCentre = waiting.clone().setY(hero.height * 0.5)
  const advance = ease((age - 144) / (NOBUNAGA_ENTRY - 144))
  victim.root.rotation.y = -1.15
  const stride = Math.sin((age - 144) * 0.16) * Math.sin(advance * Math.PI)
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    victim.root.getObjectByName(`hip-${side}`)!.rotation.x = stride * sign * 0.3
    victim.root.getObjectByName(`knee-${side}`)!.rotation.x = Math.max(0, -stride * sign) * 0.5
    victim.root.getObjectByName(`shoulder-${side}`)!.rotation.x = -stride * sign * 0.2
    hero.root.getObjectByName(`hip-${side}`)!.rotation.x = side === 'left' ? -0.25 : 0.12
    hero.root.getObjectByName(`knee-${side}`)!.rotation.x = side === 'left' ? 0.5 : 0.22
  }
  groundVictoryActor(hero)
  groundVictoryActor(victim)
  const leading = placeAtNobunagaBoundary(context, enCentre, advance)
  const chest = visibleVictoryBounds(victim.root.getObjectByName('torso') ?? victim.head)
  const contact = chest.getCenter(new Vector3()).setX(chest.min.x + 0.03)
  contact.z = chest.max.z + 0.012
  const length = hero.height * 0.5
  const direction = new Vector3(0.9, -0.42, 0).normalize()
  const cutGuard = contact.clone().addScaledVector(direction, -length)
  cutGuard.add(new Vector3(direction.y * 0.045, -direction.x * 0.045, 0))
  const dash = ease((age - NOBUNAGA_ENTRY) / (NOBUNAGA_CONTACT - NOBUNAGA_ENTRY))
  hero.root.position.x += (cutGuard.x - 0.28 - waiting.x) * dash
  hero.root.position.z += (contact.z - 0.12) * dash
  hero.head.rotation.x = -0.03
  groundVictoryActor(hero)
  return {
    waiting,
    enCentre,
    leading,
    entryDistance: leading.distanceTo(enCentre),
    contact,
    length,
    direction,
    cutGuard,
    dash,
  }
}
export function reachNobunagaHand(
  context: NobunagaContext,
  side: 'left' | 'right',
  target: Vector3,
) {
  const { hero } = context
  const pole = hero.head
    .getWorldPosition(new Vector3())
    .add(new Vector3(side === 'right' ? 0.4 : -0.4, -0.45, 0.25))
  return reachCinematicHand(hero.root, { side, target, pole })
}
export type NobunagaVictoryPose = ReturnType<typeof nobunagaVictoryPose>
