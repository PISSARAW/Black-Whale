import { Box3, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'
import { groundVictoryActor } from './actors'
import { lowerGuardForProp } from './personalGuardStaging'
import { bashoBodies } from './bashoBody'

export function stageBasho(context: VictoryContext) {
  const { hero, victim, age, centre, gap } = context
  victim.root.position.x += 0.9 * (1 - ease(age / 144))
  victim.root.rotation.y = -Math.PI / 2
  const advance = ease((age - 144) / 54)
  const destination = centre + gap / 2 - (0.55 + victim.width * 0.18)
  hero.root.position.x += (destination - hero.root.position.x) * advance
  hero.root.rotation.y = (Math.PI / 2) * ease((age - 144) / 36) * (1 - ease((age - 450) / 36))
  const retreat = ease((age - 396) / 30)
  hero.root.position.x -= retreat * 0.75
  const step =
    Math.sin(age * 0.18) * (Math.sin(Math.PI * advance) * 0.2 - Math.sin(Math.PI * retreat) * 0.16)
  hero.root.getObjectByName('hip-left')!.rotation.x = step
  hero.root.getObjectByName('hip-right')!.rotation.x = -step
  groundVictoryActor(hero)
  groundVictoryActor(victim)
  if (victim.height > hero.height * 1.3 && age >= 174) lowerGuardForProp(victim, hero.height * 0.74)
  bashoBodies(context)
  const bounds = new Box3().setFromObject(victim.root.getObjectByName('torso')!)
  const contact = bounds.getCenter(new Vector3())
  contact.x = bounds.min.x - 0.018
  contact.z += 0.05
  if (hero.height > victim.height * 1.15 && age >= 174) lowerGuardForProp(hero, contact.y + 0.04)
  const standing = 1 - ease((age - 420) / 60)
  for (const side of ['left', 'right']) {
    hero.root.getObjectByName(`hip-${side}`)!.rotation.x *= standing
    hero.root.getObjectByName(`knee-${side}`)!.rotation.x *= standing
  }
  groundVictoryActor(hero)
  return contact
}
